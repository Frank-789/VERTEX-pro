import type { ImagePlan, ImageSlot, ProductInfo } from './store/creativeStudioStore'

export interface PlannerPromptDraft {
  productName: string
  category: string
  platform: string
  sellingPoints: string[]
  targetAudience: string
  usageScenario: string
  stylePreference: string
  forbidden: string[]
}

export const IMAGE_SLOT_DEFINITIONS: { slot: ImageSlot; purpose: string; tips: string[] }[] = [
  {
    slot: '主图',
    purpose: '白底商品主图，第一眼吸引点击',
    tips: [
      '纯白背景 RGB 255,255,255',
      '商品占画面约 85%，完整展示',
      '无文字、徽标、水印、边框、价格、评价文字',
      '真实色彩和比例',
    ],
  },
  {
    slot: '场景图1',
    purpose: '真实使用场景，代入式体验',
    tips: [
      '真实生活方式场景，匹配目标人群',
      '商品为画面主角',
      '不出现竞品商标或误导性配件',
      '不包含平台 Logo、促销标记',
    ],
  },
  {
    slot: '场景图2',
    purpose: '第二使用场景，展示更多使用方式',
    tips: [
      '与场景图1不同使用环境',
      '展示商品多样性',
      '保持视觉统一性',
    ],
  },
  {
    slot: '卖点图',
    purpose: '突出核心卖点功能',
    tips: [
      '可以包含简洁标注或功能说明',
      '聚焦 1-2 个最强卖点',
      '标注文案简洁、有说服力',
    ],
  },
  {
    slot: '细节图',
    purpose: '突出材质/结构/工艺细节',
    tips: [
      '特写拍摄，展示材质、纹理、结构',
      '聚焦商品质量细节',
      '可展示色彩选项',
    ],
  },
  {
    slot: '尺寸/结构图',
    purpose: '表达尺寸比例和结构',
    tips: [
      '展示真实比例感',
      '可包含参考物体现尺寸',
      '不加虚假测量标记',
    ],
  },
  {
    slot: '对比图',
    purpose: '对比展示，突出差异化优势',
    tips: [
      '对比使用前/后或与竞品对比',
      '突出本品核心优势',
      '不诋毁竞品',
    ],
  },
  {
    slot: '详情页首图',
    purpose: '详情页第一屏视觉，传递品牌质感',
    tips: [
      '吸引继续浏览的高质量视觉',
      '可包含品牌调性元素',
      '信息层级清晰',
    ],
  },
  {
    slot: '详情页模块图',
    purpose: '详情页内各功能/卖点模块图',
    tips: [
      '按功能分区展示',
      '图文结合传递卖点',
      '适合页面滑动浏览',
    ],
  },
]

export function buildGeneratePlanPrompt(draft: PlannerPromptDraft): string {
  const forbidden = draft.forbidden.filter(Boolean)
  const sellingPoints = draft.sellingPoints.filter(Boolean)

  return `你是一位专业的电商视觉策划师。请根据以下商品信息，生成一套完整的电商图片策划方案。

## 商品信息
- 商品名称：${draft.productName || '（未填写）'}
- 商品类目：${draft.category || '（未填写）'}
- 目标平台：${draft.platform || '（未指定）'}
- 核心卖点：${sellingPoints.length ? sellingPoints.join('；') : '（未填写）'}
- 目标人群：${draft.targetAudience || '（未指定）'}
- 使用场景：${draft.usageScenario || '（未指定）'}
- 风格偏好：${draft.stylePreference || '（未指定）'}
${forbidden.length ? `- 禁止元素：${forbidden.join('、')}` : ''}

## 策划要求

请为以下每个图片位生成策划方案，返回 JSON 数组：

图片位列表：主图、场景图1、场景图2、卖点图、细节图、尺寸/结构图、对比图、详情页首图、详情页模块图

每个图片位需要包含：
1. slot: 图片位名称
2. purpose: 该图片的用途说明（中文）
3. visualDescription: 画面描述（中文，详细描述画面构图、产品摆放、场景元素等）
4. compositionAdvice: 构图建议（中文）
5. backgroundAdvice: 背景建议（中文）
6. highlightSellingPoints: 应突出的卖点列表（字符串数组）
7. forbiddenElements: 禁止出现的元素列表（字符串数组）
8. englishPrompt: 英文生图 prompt（专业、完整，可直接用于 AI 生图模型）
  - 包含商品描述、场景、构图、光线、风格
  - 如果指定了风格偏好，要在 prompt 中体现
  - 不包含中文字符
9. chineseExplanation: 中文解释（面向用户的中文说明）

## 通用合规规则
- 商品主体清晰
- 不出现未授权品牌 Logo
- 不出现虚假认证
- 不出现平台 Logo
- 不出现夸大功效表述
- 不出现诱导性价格、销量、评价
- 白底主图要干净，商品占比合理

## 输出格式
直接返回 JSON 数组，不要包含 markdown 代码块标记和额外说明：
[{ "slot": "...", "purpose": "...", ... }]`
}

export function normalizeSellingPoints(text: string): string[] {
  return text
    .split(/[;；\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function normalizeForbidden(text: string): string[] {
  return text
    .split(/[;；\n,，]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export const ASPECT_RATIO_DIMENSIONS: Record<string, string> = {
  '1:1': '1024x1024',
  '4:5': '1024x1280',
  '3:4': '1024x1365',
  '16:9': '1536x864',
  '详情页长图': '1080x1920',
}

export function getComplianceChecks(draft: PlannerPromptDraft): Array<{
  label: string
  status: 'ready' | 'missing' | 'warning'
  detail: string
}> {
  return [
    {
      label: '商品名称',
      status: draft.productName.trim() ? 'ready' : 'missing',
      detail: draft.productName.trim() ? '已填写' : '需要填写商品名称',
    },
    {
      label: '商品类目',
      status: draft.category.trim() ? 'ready' : 'warning',
      detail: draft.category.trim() ? '已填写' : '建议填写商品类目',
    },
    {
      label: '目标平台',
      status: draft.platform ? 'ready' : 'warning',
      detail: draft.platform || '建议选择目标平台',
    },
    {
      label: '核心卖点',
      status: draft.sellingPoints.length > 0 ? 'ready' : 'warning',
      detail: draft.sellingPoints.length > 0 ? `${draft.sellingPoints.length} 个卖点` : '建议填写核心卖点',
    },
    {
      label: '参考图',
      status: 'warning',
      detail: '建议上传产品实拍参考图',
    },
    {
      label: '禁用元素',
      status: draft.forbidden.length > 0 ? 'ready' : 'warning',
      detail: draft.forbidden.length > 0 ? `${draft.forbidden.length} 项已标注` : '建议补充禁用规则',
    },
  ]
}
