'use client'

import { create } from 'zustand'

// ====== 类型定义 ======

export type TargetPlatform = '1688' | '淘宝' | '京东' | '拼多多' | 'eBay' | '独立站'
export type ImageStyle = '高级极简' | '白底主图' | '生活方式图' | '科技感' | '母婴风' | '家居风' | '户外风' | '自定义'
export type ImageSlot = '主图' | '场景图1' | '场景图2' | '卖点图' | '细节图' | '尺寸/结构图' | '对比图' | '详情页首图' | '详情页模块图'
export type AspectRatio = '1:1' | '4:5' | '3:4' | '16:9' | '详情页长图'
export type QualityLevel = '标准' | '高清'

export interface ImagePlan {
  slot: ImageSlot
  purpose: string
  visualDescription: string
  compositionAdvice: string
  backgroundAdvice: string
  highlightSellingPoints: string[]
  forbiddenElements: string[]
  englishPrompt: string
  chineseExplanation: string
}

export interface ReferenceImage {
  id: string
  type: 'product' | 'packaging' | 'competitor' | 'scene'
  dataUrl: string
  name: string
  file: File
}

export interface GeneratedImage {
  id: string
  planIndex: number
  slot: ImageSlot
  dataUrl: string | null
  status: 'pending' | 'generating' | 'done' | 'error'
  error?: string
  createdAt: number
  params: {
    size: AspectRatio
    quality: QualityLevel
  }
}

export interface ProductInfo {
  productName: string
  category: string
  targetPlatform: TargetPlatform | ''
  sellingPoints: string
  targetAudience: string
  usageScenario: string
  stylePreference: ImageStyle | ''
  customStyle: string
  forbiddenElements: string
}

// ====== API 配置 ====

export interface ImageApiConfig {
  baseUrl: string
  apiKey: string
  model: string
}

// ====== Store ======

interface CreativeStudioState {
  // 商品信息
  productInfo: ProductInfo
  // 参考图
  referenceImages: ReferenceImage[]
  // 图片策划方案
  imagePlans: ImagePlan[]
  // 生成参数
  selectedSize: AspectRatio
  selectedQuality: QualityLevel
  selectedPlanIndex: number | null
  // 生成结果
  generatedImages: GeneratedImage[]
  isGenerating: boolean
  isPlanning: boolean
  // 历史记录
  history: Array<{
    id: string
    productName: string
    plans: ImagePlan[]
    images: GeneratedImage[]
    createdAt: number
  }>
  // API 配置
  imageApiConfig: ImageApiConfig
  // 遮罩编辑
  maskTargetImageId: string | null
  maskDataUrl: string | null
  // 设置弹窗
  showSettings: boolean
  // 提示词预览的当前选中的图片位
  previewSlot: ImageSlot | null
  // 错误消息
  apiConfigured: boolean
  apiError: string | null

  // Actions
  setProductInfo: (info: Partial<ProductInfo>) => void
  addReferenceImage: (image: ReferenceImage) => void
  removeReferenceImage: (id: string) => void
  setImagePlans: (plans: ImagePlan[]) => void
  setSelectedSize: (size: AspectRatio) => void
  setSelectedQuality: (quality: QualityLevel) => void
  setSelectedPlanIndex: (index: number | null) => void
  setPreviewSlot: (slot: ImageSlot | null) => void
  addGeneratedImage: (image: GeneratedImage) => void
  updateGeneratedImage: (id: string, updates: Partial<GeneratedImage>) => void
  removeGeneratedImage: (id: string) => void
  setIsGenerating: (v: boolean) => void
  setApiConfigured: (v: boolean) => void
  setApiError: (err: string | null) => void
  setShowSettings: (v: boolean) => void
  setImageApiConfig: (config: Partial<ImageApiConfig>) => void
  setIsPlanning: (v: boolean) => void
  setMaskTargetImageId: (id: string | null) => void
  setMaskDataUrl: (url: string | null) => void
  resetPlan: () => void
  saveToHistory: () => void
  loadFromHistory: (entry: CreativeStudioState['history'][0]) => void
  deleteHistoryEntry: (id: string) => void
}

const DEFAULT_PRODUCT_INFO: ProductInfo = {
  productName: '',
  category: '',
  targetPlatform: '',
  sellingPoints: '',
  targetAudience: '',
  usageScenario: '',
  stylePreference: '',
  customStyle: '',
  forbiddenElements: '',
}

const DEFAULT_IMAGE_API: ImageApiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_IMAGE_API_BASE_URL || '',
  apiKey: process.env.NEXT_PUBLIC_IMAGE_API_KEY || '',
  model: process.env.NEXT_PUBLIC_IMAGE_MODEL || '',
}

export const useCreativeStudioStore = create<CreativeStudioState>((set, get) => ({
  productInfo: { ...DEFAULT_PRODUCT_INFO },
  referenceImages: [],
  imagePlans: [],
  selectedSize: '1:1',
  selectedQuality: '标准',
  selectedPlanIndex: null,
  generatedImages: [],
  isGenerating: false,
  isPlanning: false,
  history: [],
  imageApiConfig: DEFAULT_IMAGE_API,
  maskTargetImageId: null,
  maskDataUrl: null,
  showSettings: false,
  previewSlot: null,
  apiConfigured: !!(DEFAULT_IMAGE_API.baseUrl && DEFAULT_IMAGE_API.apiKey && DEFAULT_IMAGE_API.model),
  apiError: null,

  setProductInfo: (info) => set((s) => ({ productInfo: { ...s.productInfo, ...info } })),
  addReferenceImage: (image) => set((s) => ({ referenceImages: [...s.referenceImages, image] })),
  removeReferenceImage: (id) => set((s) => ({
    referenceImages: s.referenceImages.filter((i) => i.id !== id),
  })),
  setImagePlans: (plans) => set({ imagePlans: plans, previewSlot: plans.length > 0 ? plans[0].slot : null }),
  setSelectedSize: (size) => set({ selectedSize: size }),
  setSelectedQuality: (quality) => set({ selectedQuality: quality }),
  setSelectedPlanIndex: (index) => set({ selectedPlanIndex: index }),
  setPreviewSlot: (slot) => set({ previewSlot: slot }),
  addGeneratedImage: (image) => set((s) => ({ generatedImages: [...s.generatedImages, image] })),
  updateGeneratedImage: (id, updates) => set((s) => ({
    generatedImages: s.generatedImages.map((img) =>
      img.id === id ? { ...img, ...updates } : img
    ),
  })),
  removeGeneratedImage: (id) => set((s) => ({
    generatedImages: s.generatedImages.filter((img) => img.id !== id),
  })),
  setIsGenerating: (v) => set({ isGenerating: v }),
  setApiConfigured: (v) => set({ apiConfigured: v }),
  setApiError: (err) => set({ apiError: err }),
  setShowSettings: (v) => set({ showSettings: v }),
  setImageApiConfig: (config) => {
    const next = { ...get().imageApiConfig, ...config }
    const configured = !!(next.baseUrl && next.apiKey && next.model)
    set({ imageApiConfig: next, apiConfigured: configured, apiError: configured ? null : '请配置图片生成 API' })
  },
  setIsPlanning: (v) => set({ isPlanning: v }),
  setMaskTargetImageId: (id) => set({ maskTargetImageId: id }),
  setMaskDataUrl: (url) => set({ maskDataUrl: url }),
  resetPlan: () => set({
    imagePlans: [],
    generatedImages: [],
    selectedPlanIndex: null,
    previewSlot: null,
    isGenerating: false,
    isPlanning: false,
    apiError: null,
  }),
  saveToHistory: () => {
    const state = get()
    const entry = {
      id: `hist-${Date.now()}`,
      productName: state.productInfo.productName,
      plans: [...state.imagePlans],
      images: [...state.generatedImages],
      createdAt: Date.now(),
    }
    set((s) => ({ history: [entry, ...s.history] }))
  },
  loadFromHistory: (entry) => set({
    productInfo: { ...DEFAULT_PRODUCT_INFO, productName: entry.productName },
    imagePlans: [...entry.plans],
    generatedImages: [...entry.images],
    selectedPlanIndex: null,
    previewSlot: entry.plans.length > 0 ? entry.plans[0].slot : null,
  }),
  deleteHistoryEntry: (id) => set((s) => ({
    history: s.history.filter((h) => h.id !== id),
  })),
}))
