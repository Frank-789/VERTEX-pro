import type { ImageApiConfig } from './store/creativeStudioStore'
import { ASPECT_RATIO_DIMENSIONS } from './plannerPrompt'

export interface GenerateImageParams {
  prompt: string
  size: string // e.g. '1:1'
  quality: '标准' | '高清'
  referenceImages?: string[] // data URL array
  negativePrompt?: string
  n?: number
}

export interface GenerateImageResult {
  images: string[] // data URL array
  revisedPrompt?: string
}

const QUALITY_MAP: Record<string, string> = {
  '标准': 'standard',
  '高清': 'hd',
}

export async function generateImages(
  params: GenerateImageParams,
  config: ImageApiConfig
): Promise<GenerateImageResult> {
  const dimensions = ASPECT_RATIO_DIMENSIONS[params.size] || '1024x1024'

  if (!config.baseUrl || !config.apiKey || !config.model) {
    throw new Error('图片生成 API 未配置。请先在 Settings 中配置 IMAGE_API_BASE_URL、IMAGE_API_KEY、IMAGE_MODEL')
  }

  const payload = {
    model: config.model,
    prompt: params.prompt,
    size: dimensions,
    quality: QUALITY_MAP[params.quality] || 'standard',
    n: params.n || 1,
    negative_prompt: params.negativePrompt || '',
    response_format: 'b64_json',
  }

  const response = await fetch(`${config.baseUrl}/v1/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`图片 API 错误 (${response.status}): ${errorText}`)
  }

  const data = await response.json()

  if (!data.data || !Array.isArray(data.data)) {
    throw new Error('API 返回格式异常：缺少 data 数组')
  }

  const images: string[] = []

  for (const item of data.data) {
    if (item.b64_json) {
      images.push(`data:image/png;base64,${item.b64_json}`)
    } else if (item.url) {
      const imgResponse = await fetch(item.url)
      const blob = await imgResponse.blob()
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
      images.push(dataUrl)
    }
  }

  return {
    images,
    revisedPrompt: data.data[0]?.revised_prompt,
  }
}

/** 调用 AI 生成策划方案 — DeepSeek 首选，Kimi 自动降级 */
export async function callPlanAI(prompt: string): Promise<string> {
  const deepseekKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || ''
  const kimiKey = process.env.NEXT_PUBLIC_KIMI_API_KEY || ''

  // 首选：DeepSeek
  if (deepseekKey) {
    try {
      const result = await callDeepSeekPlan(prompt, deepseekKey)
      if (result && result.length > 10) return result
    } catch (err) {
      console.warn('DeepSeek API 调用失败，尝试 Kimi 降级:', err)
    }
  }

  // 次选：Kimi
  if (kimiKey) {
    try {
      const result = await callKimiPlan(prompt, kimiKey)
      if (result && result.length > 10) return result
    } catch (err) {
      console.warn('Kimi API 调用也失败:', err)
    }
  }

  throw new Error(
    'AI 策划方案生成失败：DeepSeek 与 Kimi API 均不可用。' +
    (deepseekKey ? '' : ' DeepSeek API Key 未配置。') +
    (kimiKey ? '' : ' Kimi API Key 未配置。')
  )
}

async function callDeepSeekPlan(
  prompt: string,
  apiKey: string,
  baseUrl: string = 'https://api.deepseek.com'
): Promise<string> {
  const url = baseUrl.replace(/\/$/, '')
  const response = await fetch(`${url}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的电商图片策划助手。严格按照用户要求输出结构化 JSON 数据，不要包含任何额外的解释文字或 markdown 代码块标记。',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 8192,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`DeepSeek API 错误 (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

async function callKimiPlan(
  prompt: string,
  apiKey: string,
  baseUrl: string = 'https://api.moonshot.cn'
): Promise<string> {
  const url = baseUrl.replace(/\/$/, '')
  const response = await fetch(`${url}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'moonshot-v1-8k',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的电商图片策划助手。严格按照用户要求输出结构化 JSON 数据，不要包含任何额外的解释文字或 markdown 代码块标记。',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 8192,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Kimi API 错误 (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}
