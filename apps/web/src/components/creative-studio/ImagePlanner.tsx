'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Eye,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { useCreativeStudioStore, type ImagePlan, type ImageSlot } from '@/lib/store/creativeStudioStore'
import { IMAGE_SLOT_DEFINITIONS, getComplianceChecks, normalizeSellingPoints, normalizeForbidden } from '@/lib/plannerPrompt'

export default function ImagePlanner() {
  const {
    imagePlans,
    previewSlot,
    setPreviewSlot,
    isPlanning,
    productInfo,
    imageApiConfig,
  } = useCreativeStudioStore()

  const [expandedPlan, setExpandedPlan] = useState<number | null>(null)

  if (isPlanning) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center mb-4 animate-pulse">
          <Eye size={20} className="text-background" />
        </div>
        <p className="text-sm font-medium text-foreground">正在生成图片策划方案...</p>
        <p className="text-xs text-muted mt-1">AI 正在根据商品信息制定视觉方案</p>
      </div>
    )
  }

  if (imagePlans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-10 h-10 rounded-xl bg-surface-hover border border-border flex items-center justify-center mb-4">
          <Eye size={20} className="text-muted/50" />
        </div>
        <p className="text-sm text-muted">暂无策划方案</p>
        <p className="text-xs text-muted/60 mt-1">填写商品信息后点击「生成策划方案」</p>
      </div>
    )
  }

  const currentPlan = previewSlot
    ? imagePlans.find((p) => p.slot === previewSlot)
    : imagePlans[0]

  return (
    <div className="space-y-4">
      {/* 合规检查 */}
      <div className="rounded-lg border border-border bg-surface p-3">
        <h3 className="text-xs font-medium text-muted mb-2 flex items-center gap-1.5">
          <CheckCircle2 size={13} />
          合规检查
        </h3>
        <div className="space-y-1.5">
          {getComplianceChecks({
            productName: productInfo.productName,
            category: productInfo.category,
            platform: productInfo.targetPlatform,
            sellingPoints: normalizeSellingPoints(productInfo.sellingPoints),
            targetAudience: productInfo.targetAudience,
            usageScenario: productInfo.usageScenario,
            stylePreference: productInfo.stylePreference,
            forbidden: normalizeForbidden(productInfo.forbiddenElements),
          }).map((check) => (
            <div key={check.label} className="flex items-center gap-2">
              {check.status === 'ready' ? (
                <CheckCircle2 size={12} className="text-success flex-shrink-0" />
              ) : check.status === 'missing' ? (
                <XCircle size={12} className="text-danger flex-shrink-0" />
              ) : (
                <AlertCircle size={12} className="text-warning flex-shrink-0" />
              )}
              <span className={cn(
                'text-[11px]',
                check.status === 'ready' ? 'text-success' :
                check.status === 'missing' ? 'text-danger' : 'text-warning'
              )}>
                {check.label}: {check.detail}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 图片位导航 */}
      <div className="flex flex-wrap gap-1.5">
        {imagePlans.map((plan, i) => (
          <button
            key={plan.slot}
            onClick={() => setPreviewSlot(plan.slot)}
            className={cn(
              'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition',
              previewSlot === plan.slot
                ? 'bg-foreground text-background border-foreground'
                : 'bg-surface border-border text-muted hover:text-foreground'
            )}
          >
            {plan.slot}
          </button>
        ))}
      </div>

      {/* 当前选中方案的详细预览 */}
      {currentPlan && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">{currentPlan.slot}</h3>
              <span className="text-[11px] text-muted bg-surface-hover px-2 py-0.5 rounded-full">
                {currentPlan.purpose}
              </span>
            </div>

            {/* 画面描述 */}
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-muted mb-0.5">画面描述</p>
                <p className="text-foreground">{currentPlan.visualDescription}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted mb-0.5">构图建议</p>
                  <p className="text-sm text-foreground">{currentPlan.compositionAdvice}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-0.5">背景建议</p>
                  <p className="text-sm text-foreground">{currentPlan.backgroundAdvice}</p>
                </div>
              </div>

              {currentPlan.highlightSellingPoints.length > 0 && (
                <div>
                  <p className="text-xs text-muted mb-0.5">突出卖点</p>
                  <div className="flex flex-wrap gap-1">
                    {currentPlan.highlightSellingPoints.map((sp, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-primary/5 text-primary text-[11px]">
                        {sp}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {currentPlan.forbiddenElements.length > 0 && (
                <div>
                  <p className="text-xs text-muted mb-0.5">禁止元素</p>
                  <div className="flex flex-wrap gap-1">
                    {currentPlan.forbiddenElements.map((fe, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-danger/5 text-danger text-[11px]">
                        {fe}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 中英文提示词 */}
          <div className="divide-y divide-border">
            <div className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] font-medium text-muted">中文解释</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentPlan.chineseExplanation)
                  }}
                  className="flex items-center gap-1 text-[11px] text-muted hover:text-foreground transition"
                >
                  <Copy size={11} />
                  复制
                </button>
              </div>
              <p className="text-xs text-foreground leading-relaxed">{currentPlan.chineseExplanation}</p>
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] font-medium text-muted">英文 Prompt</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentPlan.englishPrompt)
                  }}
                  className="flex items-center gap-1 text-[11px] text-muted hover:text-foreground transition"
                >
                  <Copy size={11} />
                  复制
                </button>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed font-mono whitespace-pre-wrap break-all">
                {currentPlan.englishPrompt}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 全部方案列表 */}
      <div className="rounded-xl border border-border bg-surface">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-xs font-medium text-muted">全部策划方案（{imagePlans.length} 张）</h3>
        </div>
        <div className="divide-y divide-border">
          {imagePlans.map((plan, i) => (
            <div key={plan.slot}>
              <button
                onClick={() => setExpandedPlan(expandedPlan === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-hover transition text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{plan.slot}</span>
                  <span className="text-[11px] text-muted">{plan.purpose}</span>
                </div>
                {expandedPlan === i ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
              </button>
              {expandedPlan === i && (
                <div className="px-4 pb-3 space-y-2 text-xs text-muted">
                  <p>{plan.visualDescription}</p>
                  <p className="font-mono text-[11px] text-foreground/70 line-clamp-3">{plan.englishPrompt}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
