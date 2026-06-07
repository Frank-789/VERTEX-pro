'use client'

import { Image, Sparkles, Settings } from 'lucide-react'
import ProductInfoPanel from '@/components/creative-studio/ProductInfoPanel'
import ImagePlanner from '@/components/creative-studio/ImagePlanner'
import ResultsPanel from '@/components/creative-studio/ResultsPanel'
import SettingsModal from '@/components/creative-studio/SettingsModal'
import { useCreativeStudioStore } from '@/lib/store/creativeStudioStore'

export default function CreativeStudioPage() {
  const { imagePlans, setShowSettings } = useCreativeStudioStore()
  const hasPlans = imagePlans.length > 0

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <Image size={22} className="text-primary" />
                Vertex Creative Studio
              </h1>
              <p className="text-sm text-muted mt-0.5">
                电商主图工作台 · AI 视觉策划 · 商品图批量生成
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted hover:text-foreground hover:bg-surface-hover transition"
                title="API 配置"
              >
                <Settings size={14} />
                API 配置
              </button>
            </div>
          </div>
        </div>

        {/* Three-column layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Product Info (fixed width) */}
          <div className="w-80 flex-shrink-0 border-r border-border overflow-y-auto bg-background">
            <div className="p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">商品信息</h2>
              </div>
              <ProductInfoPanel />
            </div>
          </div>

          {/* Center: Image Planning & Prompt Preview */}
          <div className="flex-1 min-w-0 overflow-y-auto bg-background-secondary/30">
            <div className="p-4 max-w-3xl mx-auto">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">
                  图片策划 & 提示词预览
                </h2>
                {hasPlans && (
                  <span className="text-[11px] text-muted bg-surface-hover px-2 py-0.5 rounded-full ml-auto">
                    {imagePlans.length} 个图片位
                  </span>
                )}
              </div>
              <ImagePlanner />
            </div>
          </div>

          {/* Right: Results & History (fixed width) */}
          <div className="w-80 flex-shrink-0 border-l border-border overflow-y-auto bg-background">
            <div className="p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">生成 & 历史</h2>
              </div>
              <ResultsPanel />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SettingsModal />
    </>
  )
}
