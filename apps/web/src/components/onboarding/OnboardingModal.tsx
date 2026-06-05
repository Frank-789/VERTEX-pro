'use client'

import { useState, useEffect } from 'react'
import { useProfileStore } from '@/lib/store/profileStore'
import { cn } from '@/lib/utils'
import { User, DollarSign, AlertTriangle, Globe, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'

const experienceLevels = ['新手（<1年）', '初级（1-3年）', '中级（3-5年）', '资深（>5年）']
const budgetLevels = ['< 1万', '1-5万', '5-20万', '20-50万', '> 50万']
const riskLevels = ['保守型', '稳健型', '进取型']
const platformOptions = ['淘宝', '京东', '拼多多', '1688', 'eBay']

const riskDescriptions = {
  '保守型': '优先保本，接受低回报，不追求高增长',
  '稳健型': '可承受小幅亏损，追求稳定回报',
  '进取型': '可承受较大风险，追求高增长机会',
}

export default function OnboardingModal() {
  const { profile, onboardingCompleted, setProfile, completeOnboarding, getCashSafetyLine } = useProfileStore()
  const [step, setStep] = useState(0)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Show if onboarding not completed and no profile data saved
    if (!onboardingCompleted && !profile.experience) {
      setShow(true)
    }
  }, [onboardingCompleted, profile.experience])

  const canProceed = () => {
    switch (step) {
      case 0: return !!profile.experience
      case 1: return !!profile.budget
      case 2: return !!profile.risk
      case 3: return true
      default: return false
    }
  }

  const handleComplete = () => {
    completeOnboarding()
    setShow(false)
  }

  if (!show) return null

  const safetyLine = profile.budget ? getCashSafetyLine() : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
              <Sparkles size={20} className="text-background" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">欢迎使用 Vertex</h2>
              <p className="text-sm text-muted">先帮我们了解你的经营情况</p>
            </div>
          </div>

          {/* Steps indicator */}
          <div className="flex gap-1.5 mt-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'flex-1 h-1 rounded-full transition-colors',
                  i <= step ? 'bg-foreground' : 'bg-border'
                )}
              />
            ))}
          </div>
          <p className="text-xs text-muted mt-2">
            {step === 0 && 'Step 1/4 · 经营经验'}
            {step === 1 && 'Step 2/4 · 可用资金'}
            {step === 2 && 'Step 3/4 · 风险承受'}
            {step === 3 && 'Step 4/4 · 资金安全线'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 min-h-[200px]">
          {step === 0 && (
            <div className="space-y-1">
              <label className="text-sm font-medium flex items-center gap-2 mb-3">
                <User size={16} className="text-muted" />
                你的电商经营经验
              </label>
              {experienceLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => setProfile({ experience: level })}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl text-sm border transition',
                    profile.experience === level
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border hover:bg-surface-hover text-muted'
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-1">
              <label className="text-sm font-medium flex items-center gap-2 mb-3">
                <DollarSign size={16} className="text-muted" />
                可用于电商的初始资金
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {budgetLevels.map((b) => (
                  <button
                    key={b}
                    onClick={() => setProfile({ budget: b })}
                    className={cn(
                      'px-4 py-3 rounded-xl text-sm border transition text-center',
                      profile.budget === b
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border hover:bg-surface-hover text-muted'
                    )}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted/60 mt-2">
                包括进货、物流、广告等全部可用资金
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-1">
              <label className="text-sm font-medium flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-muted" />
                你属于哪种风险类型？
              </label>
              {riskLevels.map((r) => (
                <button
                  key={r}
                  onClick={() => setProfile({ risk: r })}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl text-sm border transition',
                    profile.risk === r
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border hover:bg-surface-hover text-muted'
                  )}
                >
                  <span className="font-medium">{r}</span>
                  <p className="text-xs text-muted/70 mt-0.5">{riskDescriptions[r]}</p>
                </button>
              ))}
            </div>
          )}

          {step === 3 && safetyLine && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-500" />
                <span className="text-sm font-medium">你的资金安全线已生成</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-surface-hover border border-border p-3.5">
                  <p className="text-[11px] text-muted font-medium mb-1">最大可投入</p>
                  <p className="text-lg font-bold">¥{safetyLine.maxInvestment.toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-surface-hover border border-border p-3.5">
                  <p className="text-[11px] text-muted font-medium mb-1">建议单价上限</p>
                  <p className="text-lg font-bold">¥{safetyLine.safeUnitPrice.toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-surface-hover border border-border p-3.5">
                  <p className="text-[11px] text-muted font-medium mb-1">建议SKU数</p>
                  <p className="text-lg font-bold">{safetyLine.suggestedSKUCount} 个</p>
                </div>
                <div className="rounded-xl bg-surface-hover border border-border p-3.5">
                  <p className="text-[11px] text-muted font-medium mb-1">最低ROI要求</p>
                  <p className="text-lg font-bold">{(safetyLine.minROI * 100).toFixed(0)}%</p>
                </div>
              </div>

              {safetyLine.warningMessage && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200">
                  {safetyLine.warningMessage}
                </div>
              )}

              {/* Target Platforms */}
              <div>
                <label className="text-xs text-muted font-medium mb-2 block">目标平台（可选）</label>
                <div className="flex flex-wrap gap-2">
                  {platformOptions.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        const current = profile.targetPlatforms
                        setProfile({
                          targetPlatforms: current.includes(p)
                            ? current.filter(x => x !== p)
                            : [...current, p]
                        })
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs border transition',
                        profile.targetPlatforms.includes(p)
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-border hover:bg-surface-hover text-muted'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-lg text-sm text-muted hover:text-foreground hover:bg-surface-hover transition"
            >
              上一步
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className={cn(
                'flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium transition',
                canProceed()
                  ? 'bg-foreground text-background hover:opacity-90'
                  : 'bg-muted/20 text-muted cursor-not-allowed'
              )}
            >
              下一步 <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition"
            >
              <CheckCircle2 size={16} /> 开始使用 Vertex
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
