'use client'

import { useState } from 'react'
import { User, DollarSign, Globe, AlertTriangle, Save, RefreshCw, Target, TrendingUp, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProfileStore } from '@/lib/store/profileStore'

const experienceLevels = ['新手（<1年）', '初级（1-3年）', '中级（3-5年）', '资深（>5年）']
const budgetLevels = ['< 1万', '1-5万', '5-20万', '20-50万', '> 50万']
const riskLevels = ['保守型', '稳健型', '进取型']
const platforms = ['淘宝', '京东', '拼多多', '1688', 'eBay']

export default function SettingsPage() {
  const { profile, setProfile, getCashSafetyLine, resetProfile } = useProfileStore()
  const [saved, setSaved] = useState(false)

  const togglePlatform = (p: string) => {
    const current = profile.targetPlatforms
    setProfile({
      targetPlatforms: current.includes(p)
        ? current.filter(x => x !== p)
        : [...current, p]
    })
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const isComplete = profile.experience && profile.budget && profile.risk
  const safetyLine = isComplete ? getCashSafetyLine() : null

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">商家画像</h1>
        <p className="text-muted mt-1">配置你的经营偏好，Vertex 将据此提供精准推荐</p>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border border-border bg-surface p-6 space-y-6">
        {/* Experience */}
        <div>
          <label className="text-sm font-medium flex items-center gap-2 mb-3">
            <User size={16} className="text-muted" />
            经营经验
          </label>
          <div className="grid grid-cols-2 gap-2">
            {experienceLevels.map((level) => (
              <button
                key={level}
                onClick={() => setProfile({ experience: level })}
                className={cn(
                  'px-4 py-2.5 rounded-lg text-sm border transition text-left',
                  profile.experience === level
                    ? 'border-primary bg-primary/5 text-foreground font-medium'
                    : 'border-border hover:bg-surface-hover text-muted'
                )}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div>
          <label className="text-sm font-medium flex items-center gap-2 mb-3">
            <DollarSign size={16} className="text-muted" />
            可用资金
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {budgetLevels.map((b) => (
              <button
                key={b}
                onClick={() => setProfile({ budget: b })}
                className={cn(
                  'px-3 py-2.5 rounded-lg text-sm border transition text-center',
                  profile.budget === b
                    ? 'border-primary bg-primary/5 text-foreground font-medium'
                    : 'border-border hover:bg-surface-hover text-muted'
                )}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Risk Tolerance */}
        <div>
          <label className="text-sm font-medium flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-muted" />
            风险承受
          </label>
          <div className="flex gap-2">
            {riskLevels.map((r) => (
              <button
                key={r}
                onClick={() => setProfile({ risk: r })}
                className={cn(
                  'flex-1 px-4 py-2.5 rounded-lg text-sm border transition text-center',
                  profile.risk === r
                    ? 'border-primary bg-primary/5 text-foreground font-medium'
                    : 'border-border hover:bg-surface-hover text-muted'
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Target Platforms */}
        <div>
          <label className="text-sm font-medium flex items-center gap-2 mb-3">
            <Globe size={16} className="text-muted" />
            目标平台
          </label>
          <div className="flex flex-wrap gap-2">
            {platforms.map((p) => (
              <button
                key={p}
                onClick={() => togglePlatform(p)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm border transition',
                  profile.targetPlatforms.includes(p)
                    ? 'border-primary bg-primary/5 text-foreground font-medium'
                    : 'border-border hover:bg-surface-hover text-muted'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Has Supplier */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.hasSupplier}
              onChange={(e) => setProfile({ hasSupplier: e.target.checked })}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <div>
              <span className="text-sm font-medium">我已有一手货源/供应链</span>
              <p className="text-xs text-muted/70 mt-0.5">有供应链优势可降低选品风险</p>
            </div>
          </label>
        </div>
      </div>

      {/* Cash Safety Line */}
      {safetyLine && (
        <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Target size={16} className="text-primary" />
            资金安全线
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-surface-hover border border-border p-3.5">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign size={13} className="text-muted" />
                <p className="text-[11px] text-muted font-medium">最大可投入</p>
              </div>
              <p className="text-lg font-bold">¥{safetyLine.maxInvestment.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-surface-hover border border-border p-3.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Package size={13} className="text-muted" />
                <p className="text-[11px] text-muted font-medium">单价上限</p>
              </div>
              <p className="text-lg font-bold">¥{safetyLine.safeUnitPrice.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-surface-hover border border-border p-3.5">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp size={13} className="text-muted" />
                <p className="text-[11px] text-muted font-medium">建议SKU数</p>
              </div>
              <p className="text-lg font-bold">{safetyLine.suggestedSKUCount}</p>
            </div>
            <div className="rounded-xl bg-surface-hover border border-border p-3.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Target size={13} className="text-muted" />
                <p className="text-[11px] text-muted font-medium">最低ROI</p>
              </div>
              <p className="text-lg font-bold">{(safetyLine.minROI * 100).toFixed(0)}%</p>
            </div>
          </div>
          {safetyLine.warningMessage && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200">
              {safetyLine.warningMessage}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={!isComplete}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition',
            isComplete
              ? 'bg-foreground text-background hover:opacity-90'
              : 'bg-muted/20 text-muted cursor-not-allowed'
          )}
        >
          {saved ? '✅ 已保存' : <><Save size={18} />保存画像</>}
        </button>
        <button
          onClick={resetProfile}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border text-sm text-muted hover:text-foreground hover:bg-surface-hover transition"
        >
          <RefreshCw size={16} /> 重置
        </button>
      </div>

      {!isComplete && (
        <p className="text-xs text-muted text-center">请填写经营经验、可用资金和风险承受度以获取精准推荐</p>
      )}
    </div>
  )
}
