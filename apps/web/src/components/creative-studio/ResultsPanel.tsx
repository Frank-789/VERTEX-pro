'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Sparkles,
  Image as ImageIcon,
  Download,
  RefreshCw,
  Trash2,
  History,
  Clock,
  Settings,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Maximize2,
  Sliders,
} from 'lucide-react'
import { useCreativeStudioStore } from '@/lib/store/creativeStudioStore'
import { generateImages, callPlanAI } from '@/lib/imageGenerator'
import { normalizeSellingPoints, normalizeForbidden, ASPECT_RATIO_DIMENSIONS } from '@/lib/plannerPrompt'
import type { ImagePlan, AspectRatio, QualityLevel } from '@/lib/store/creativeStudioStore'

const sizes: AspectRatio[] = ['1:1', '4:5', '3:4', '16:9', '详情页长图']
const qualities: QualityLevel[] = ['标准', '高清']

export default function ResultsPanel() {
  const store = useCreativeStudioStore()
  const checkApiConfig = () => {
    const { imageApiConfig } = useCreativeStudioStore.getState()
    return !!(imageApiConfig.baseUrl && imageApiConfig.apiKey && imageApiConfig.model)
  }

  const handleGeneratePlan = async () => {
    const state = useCreativeStudioStore.getState()
    const { productInfo, setImagePlans, setIsPlanning, setApiError, setApiConfigured } = state

    const deepseekKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY
    const kimiKey = process.env.NEXT_PUBLIC_KIMI_API_KEY

    if (!deepseekKey && !kimiKey) {
      setApiError('DeepSeek 或 Kimi API Key 未配置。请在 .env.local 中设置 NEXT_PUBLIC_DEEPSEEK_API_KEY 或 NEXT_PUBLIC_KIMI_API_KEY')
      return
    }

    setIsPlanning(true)
    setApiError(null)

    try {
      const prompt = `你是一位专业的电商视觉策划师。请根据以下商品信息，生成一套完整的电商图片策划方案。

## 商品信息
- 商品名称：${productInfo.productName || '（未填写）'}
- 商品类目：${productInfo.category || '（未填写）'}
- 目标平台：${productInfo.targetPlatform || '（未指定）'}
- 核心卖点：${productInfo.sellingPoints || '（未填写）'}
- 目标人群：${productInfo.targetAudience || '（未指定）'}
- 使用场景：${productInfo.usageScenario || '（未指定）'}
- 风格偏好：${productInfo.stylePreference || '（未指定）'}
${productInfo.forbiddenElements ? `- 禁止元素：${productInfo.forbiddenElements}` : ''}

## 策划要求

请为以下每个图片位生成策划方案，返回 JSON 数组：

图片位列表：主图、场景图1、场景图2、卖点图、细节图、尺寸/结构图、对比图、详情页首图、详情页模块图

每个图片位需要包含：
1. slot: 图片位名称
2. purpose: 该图片的用途说明（中文）
3. visualDescription: 画面描述（中文）
4. compositionAdvice: 构图建议（中文）
5. backgroundAdvice: 背景建议（中文）
6. highlightSellingPoints: 应突出的卖点列表（字符串数组，不要有空字符串）
7. forbiddenElements: 禁止出现的元素列表（字符串数组，不要有空字符串）
8. englishPrompt: 英文生图 prompt（专业、完整，不包含中文字符）
9. chineseExplanation: 中文解释

## 通用合规规则
- 商品主体清晰
- 不出现未授权品牌 Logo
- 不出现虚假认证
- 不出现平台 Logo
- 不出现夸大功效表述
- 不出现诱导性价格、销量、评价
- 白底主图干净，商品占比合理

## 输出格式
直接返回 JSON 数组不要包含 markdown 代码块标记和额外说明：
[{ "slot": "...", "purpose": "...", "visualDescription": "...", "compositionAdvice": "...", "backgroundAdvice": "...", "highlightSellingPoints": ["..."], "forbiddenElements": ["..."], "englishPrompt": "...", "chineseExplanation": "..." }]`

      const content = await callPlanAI(prompt)

      // Parse JSON from response
      // First try direct parse
      let plans: ImagePlan[]
      try {
        plans = JSON.parse(content)
      } catch {
        // Try extracting from markdown code block
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (jsonMatch) {
          plans = JSON.parse(jsonMatch[1])
        } else {
          // Try finding the array directly
          const arrStart = content.indexOf('[{')
          const arrEnd = content.lastIndexOf('}]')
          if (arrStart !== -1 && arrEnd !== -1) {
            plans = JSON.parse(content.slice(arrStart, arrEnd + 2))
          } else {
            throw new Error('无法解析策划方案 JSON')
          }
        }
      }

      if (!Array.isArray(plans) || plans.length === 0) {
        throw new Error('策划方案为空')
      }

      // Validate and clean plans
      plans = plans.map((p) => ({
        ...p,
        highlightSellingPoints: Array.isArray(p.highlightSellingPoints)
          ? p.highlightSellingPoints.filter(Boolean)
          : [],
        forbiddenElements: Array.isArray(p.forbiddenElements)
          ? p.forbiddenElements.filter(Boolean)
          : [],
      }))

      setImagePlans(plans)
    } catch (err: any) {
      setApiError(`生成策划方案失败: ${err.message || '未知错误'}`)
    } finally {
      setIsPlanning(false)
    }
  }

  const handleGenerateImage = async () => {
    const state = useCreativeStudioStore.getState()
    const { previewSlot, imagePlans, selectedSize, selectedQuality, apiConfigured, setApiError } = state

    if (!previewSlot) {
      setApiError('请先选择一个图片位')
      return
    }

    const plan = imagePlans.find((p) => p.slot === previewSlot)
    if (!plan) {
      setApiError('未找到选中图片位的策划方案')
      return
    }

    if (!checkApiConfig()) {
      setApiError('图片生成 API 未配置。请先设置 IMAGE_API_BASE_URL、IMAGE_API_KEY、IMAGE_MODEL')
      return
    }

    const imgId = `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    state.addGeneratedImage({
      id: imgId,
      planIndex: imagePlans.indexOf(plan),
      slot: plan.slot,
      dataUrl: null,
      status: 'generating',
      createdAt: Date.now(),
      params: { size: selectedSize, quality: selectedQuality },
    })

    state.setIsGenerating(true)
    state.setApiError(null)

    try {
      const result = await generateImages(
        {
          prompt: plan.englishPrompt,
          size: selectedSize,
          quality: selectedQuality,
          negativePrompt: plan.forbiddenElements.join(', '),
        },
        state.imageApiConfig
      )

      state.updateGeneratedImage(imgId, {
        status: 'done',
        dataUrl: result.images[0] || null,
      })
    } catch (err: any) {
      state.updateGeneratedImage(imgId, {
        status: 'error',
        error: err.message || '生成失败',
      })
      state.setApiError(err.message || '图片生成失败')
    } finally {
      state.setIsGenerating(false)
    }
  }

  const handleRegenerate = (imageId: string) => {
    useCreativeStudioStore.setState((s) => ({
      generatedImages: s.generatedImages.map((img) =>
        img.id === imageId ? { ...img, status: 'pending' as const, dataUrl: null, error: undefined } : img
      ),
    }))
    // Re-trigger generate for this specific image
    const state = useCreativeStudioStore.getState()
    const img = state.generatedImages.find((i) => i.id === imageId)
    if (img) {
      const plan = state.imagePlans[img.planIndex]
      if (plan && checkApiConfig()) {
        state.updateGeneratedImage(imageId, { status: 'generating' })
        generateImages(
          { prompt: plan.englishPrompt, size: img.params.size, quality: img.params.quality },
          state.imageApiConfig
        )
          .then((result) => {
            state.updateGeneratedImage(imageId, { status: 'done', dataUrl: result.images[0] || null })
          })
          .catch((err) => {
            state.updateGeneratedImage(imageId, { status: 'error', error: err.message })
          })
      }
    }
  }

  const handleDownload = (dataUrl: string, slot: string) => {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `Vertex-${slot}-${Date.now()}.png`
    link.click()
  }

  const handleDownloadAll = () => {
    const images = useCreativeStudioStore.getState().generatedImages
    images
      .filter((img) => img.status === 'done' && img.dataUrl)
      .forEach((img) => handleDownload(img.dataUrl!, img.slot))
  }

  const handleGenerateAll = async () => {
    const state = useCreativeStudioStore.getState()
    const { imagePlans, selectedSize, selectedQuality, imageApiConfig, setIsGenerating, setApiError, addGeneratedImage, updateGeneratedImage } = state

    if (!checkApiConfig()) {
      setApiError('图片生成 API 未配置。请先设置相关环境变量。')
      return
    }

    setIsGenerating(true)

    for (let i = 0; i < imagePlans.length; i++) {
      const plan = imagePlans[i]
      const imgId = `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${i}`

      addGeneratedImage({
        id: imgId,
        planIndex: i,
        slot: plan.slot,
        dataUrl: null,
        status: 'generating',
        createdAt: Date.now(),
        params: { size: selectedSize, quality: selectedQuality },
      })

      try {
        const result = await generateImages(
          { prompt: plan.englishPrompt, size: selectedSize, quality: selectedQuality },
          imageApiConfig
        )
        updateGeneratedImage(imgId, {
          status: 'done',
          dataUrl: result.images[0] || null,
        })
      } catch (err: any) {
        updateGeneratedImage(imgId, { status: 'error', error: err.message })
      }
    }

    setIsGenerating(false)
  }

  return (
    <div className="space-y-4">
      {/* Generation Controls */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <h3 className="text-xs font-medium text-muted flex items-center gap-1.5">
          <Sparkles size={13} />
          生图控制
        </h3>

        {/* Size & Quality */}
        <div>
          <label className="text-xs text-muted mb-1.5 block">尺寸</label>
          <div className="flex flex-wrap gap-1.5">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => store.setSelectedSize(s)}
                className={cn(
                  'px-2 py-1 rounded-lg text-[11px] font-medium border transition',
                  store.selectedSize === s
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-surface border-border text-muted hover:text-foreground'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-muted mb-1.5 block">质量</label>
          <div className="flex gap-1.5">
            {qualities.map((q) => (
              <button
                key={q}
                onClick={() => store.setSelectedQuality(q)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition',
                  store.selectedQuality === q
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-surface border-border text-muted hover:text-foreground'
                )}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleGeneratePlan}
            disabled={store.isPlanning}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {store.isPlanning ? (
              <><Loader2 size={16} className="animate-spin" /> 生成中...</>
            ) : (
              <><Sparkles size={16} /> 生成策划方案</>
            )}
          </button>

          {store.imagePlans.length > 0 && (
            <>
              <button
                onClick={handleGenerateImage}
                disabled={store.isGenerating || !store.previewSlot}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 bg-primary/5 text-foreground text-sm font-medium hover:bg-primary/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {store.isGenerating ? (
                  <><Loader2 size={16} className="animate-spin" /> 生成图片中...</>
                ) : (
                  <><ImageIcon size={16} /> 生成当前图片位</>
                )}
              </button>

              <button
                onClick={handleGenerateAll}
                disabled={store.isGenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border text-xs text-muted hover:text-foreground hover:bg-surface-hover transition disabled:opacity-30"
              >
                <Sparkles size={14} />
                批量生成全部图片位
              </button>
            </>
          )}
        </div>
      </div>

      {/* API Config Warning */}
      {store.apiError && (
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="text-danger flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-danger font-medium">配置提示</p>
              <p className="text-[11px] text-danger/80 mt-0.5">{store.apiError}</p>
              {!checkApiConfig() && (
                <button
                  onClick={() => store.setShowSettings(true)}
                  className="mt-1.5 text-xs text-primary hover:underline"
                >
                  前往配置 →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings shortcut */}
      {!store.apiConfigured && (
        <button
          onClick={() => store.setShowSettings(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border text-xs text-muted hover:text-foreground hover:bg-surface-hover transition"
        >
          <Settings size={13} />
          配置图片生成 API
        </button>
      )}

      {/* Generated Images */}
      {store.generatedImages.length > 0 && (
        <div className="rounded-xl border border-border bg-surface">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-xs font-medium text-muted flex items-center gap-1.5">
              <ImageIcon size={13} />
              生成结果（{store.generatedImages.filter((i) => i.status === 'done').length}）
            </h3>
            <div className="flex gap-1">
              {store.generatedImages.some((i) => i.status === 'done') && (
                <button
                  onClick={handleDownloadAll}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-muted hover:text-foreground hover:bg-surface-hover transition"
                >
                  <Download size={12} />
                  全部下载
                </button>
              )}
              <button
                onClick={() => store.saveToHistory()}
                className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-muted hover:text-foreground hover:bg-surface-hover transition"
              >
                <Clock size={12} />
                保存记录
              </button>
            </div>
          </div>

          <div className="p-3 grid grid-cols-2 gap-2">
            {store.generatedImages.map((img) => (
              <div
                key={img.id}
                className="relative rounded-lg border border-border bg-surface-hover overflow-hidden group"
              >
                {img.status === 'generating' && (
                  <div className="aspect-square flex flex-col items-center justify-center bg-surface-hover">
                    <Loader2 size={24} className="animate-spin text-muted mb-2" />
                    <p className="text-[11px] text-muted">生成中...</p>
                  </div>
                )}
                {img.status === 'pending' && (
                  <div className="aspect-square flex flex-col items-center justify-center bg-surface-hover">
                    <ImageIcon size={24} className="text-muted/30 mb-1" />
                    <p className="text-[11px] text-muted/60">等待生成</p>
                  </div>
                )}
                {img.status === 'done' && img.dataUrl && (
                  <>
                    <img src={img.dataUrl} alt={img.slot} className="w-full object-cover" />
                    <div className="absolute top-1 left-1">
                      <span className="px-1.5 py-0.5 rounded bg-black/50 text-white text-[10px]">
                        {img.slot}
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition flex gap-1">
                      <button
                        onClick={() => handleDownload(img.dataUrl!, img.slot)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded bg-white/90 text-black text-[11px] font-medium hover:bg-white transition"
                      >
                        <Download size={12} /> 下载
                      </button>
                      <button
                        onClick={() => handleRegenerate(img.id)}
                        className="p-1 rounded bg-white/20 text-white hover:bg-white/40 transition"
                      >
                        <RefreshCw size={13} />
                      </button>
                      <button
                        onClick={() => store.removeGeneratedImage(img.id)}
                        className="p-1 rounded bg-white/20 text-white hover:bg-white/40 transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </>
                )}
                {img.status === 'error' && (
                  <div className="aspect-square flex flex-col items-center justify-center bg-surface-hover p-3 text-center">
                    <AlertCircle size={20} className="text-danger mb-1" />
                    <p className="text-[11px] text-danger">{img.error || '生成失败'}</p>
                    <button
                      onClick={() => handleRegenerate(img.id)}
                      className="mt-2 flex items-center gap-1 px-2 py-1 rounded bg-surface border border-border text-[11px] text-muted hover:text-foreground transition"
                    >
                      <RefreshCw size={11} /> 重试
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {store.history.length > 0 && (
        <div className="rounded-xl border border-border bg-surface">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-xs font-medium text-muted flex items-center gap-1.5">
              <History size={13} />
              历史记录（{store.history.length}）
            </h3>
          </div>
          <div className="divide-y divide-border max-h-48 overflow-y-auto">
            {store.history.slice(0, 10).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between px-4 py-2 hover:bg-surface-hover transition"
              >
                <button
                  onClick={() => store.loadFromHistory(entry)}
                  className="text-left flex-1 min-w-0"
                >
                  <p className="text-xs font-medium truncate">{entry.productName || '未命名商品'}</p>
                  <p className="text-[11px] text-muted">
                    {entry.plans.length} 个策划方案 · {new Date(entry.createdAt).toLocaleString('zh-CN')}
                  </p>
                </button>
                <button
                  onClick={() => store.deleteHistoryEntry(entry.id)}
                  className="p-1 text-muted hover:text-danger transition ml-2"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function for batch generating all image slots
async function handleGenerateAll() {
  const { imagePlans, selectedSize, selectedQuality, imageApiConfig, setIsGenerating, setApiError, addGeneratedImage, updateGeneratedImage, apiConfigured } = useCreativeStudioStore.getState()

  if (!apiConfigured) {
    setApiError('图片生成 API 未配置。请先设置相关环境变量。')
    return
  }

  setIsGenerating(true)

  for (let i = 0; i < imagePlans.length; i++) {
    const plan = imagePlans[i]
    const imgId = `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${i}`

    addGeneratedImage({
      id: imgId,
      planIndex: i,
      slot: plan.slot,
      dataUrl: null,
      status: 'generating',
      createdAt: Date.now(),
      params: { size: selectedSize, quality: selectedQuality },
    })

    try {
      const result = await generateImages(
        { prompt: plan.englishPrompt, size: selectedSize, quality: selectedQuality },
        imageApiConfig
      )
      updateGeneratedImage(imgId, {
        status: 'done',
        dataUrl: result.images[0] || null,
      })
    } catch (err: any) {
      updateGeneratedImage(imgId, { status: 'error', error: err.message })
    }
  }

  setIsGenerating(false)
}
