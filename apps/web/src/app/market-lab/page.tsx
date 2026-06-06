'use client'

import { useEffect, useState } from 'react'
import {
  Search, Download, Clock, ExternalLink, RefreshCw,
  BarChart3, Globe, FileText, TrendingUp, Database,
} from 'lucide-react'
import { useDemoDataStore, type DayTrend, type CategoryStat, type OpportunityRank, type PlatformDaily, type PriceDist, type RiskDist } from '@/lib/store/demoDataStore'

// Safelist for dynamic badge classes (Tailwind v4 scanner)
// bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800
// bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800
// bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800
// bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300
// bg-gray-50 dark:bg-gray-900/20 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700

// ========= Colors =========

const CHART_PRIMARY = '#3b82f6'
const CHART_GREEN = '#10b981'
const CHART_AMBER = '#f59e0b'
const CHART_RED = '#ef4444'
const CHART_PURPLE = '#8b5cf6'
const CHART_CYAN = '#06b6d4'
const DONUT_COLORS = [CHART_PRIMARY, CHART_GREEN, CHART_AMBER, CHART_RED, CHART_PURPLE]

const compBadge: Record<string, string> = {
  '低': 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  '中': 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  '高': 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
}

const profitBadge: Record<string, string> = {
  '高': 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300',
  '中': 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300',
  '低': 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300',
}

const riskBadge: Record<string, string> = {
  '低': 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300',
  '中': 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300',
  '高': 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300',
}

const confidenceColors: Record<string, string> = {
  '实时采集': 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  '缓存数据': 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  'AI估算': 'bg-gray-50 dark:bg-gray-900/20 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700',
}

const oppBadge: Record<string, string> = {
  '建议进入': 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300',
  '谨慎进入': 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300',
  '不建议进入': 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300',
}

// ========= Chart Components =========

function TrendChart({ data }: { data: DayTrend[] }) {
  if (data.length < 2) return <div className="h-48 flex items-center justify-center text-xs text-muted">暂无数据</div>
  const w = 600; const h = 200; const pt = 20; const pr = 10; const pb = 28; const pl = 40
  const vals = data.map(d => d.queries)
  const mx = Math.max(...vals); const mn = Math.min(...vals); const rg = mx - mn || 1
  const xs = (i: number) => pl + (i / (data.length - 1)) * (w - pl - pr)
  const ys = (v: number) => pt + (1 - (v - mn) / rg) * (h - pt - pb)
  const pts = data.map((d, i) => `${xs(i)},${ys(d.queries)}`).join(' ')
  const areaPts = `${pts} ${xs(data.length - 1)},${h - pb} ${xs(0)},${h - pb}`

  const gridYs = [0, 0.25, 0.5, 0.75, 1].map(p => pt + p * (h - pt - pb))

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" style={{ maxHeight: 200 }}>
        {gridYs.map((gy, i) => (
          <line key={i} x1={pl} x2={w - pr} y1={gy} y2={gy} style={{ stroke: 'var(--border)' }} strokeWidth="1" />
        ))}
        <polygon points={areaPts} fill="url(#trendGrad)" />
        <polyline points={pts} fill="none" stroke={CHART_PRIMARY} strokeWidth="2" />
        {data.map((d, i) => (
          <circle key={i} cx={xs(i)} cy={ys(d.queries)} r="2.5" fill={CHART_PRIMARY} className="hover:r-4 transition-all" />
        ))}
        {data.map((d, i) =>
          i % 2 === 0 || i === data.length - 1 ? (
            <text key={i} x={xs(i)} y={h - 4} textAnchor="middle" fontSize="9" style={{ fill: 'var(--muted)' }}>
              {d.date.slice(5)}
            </text>
          ) : null
        )}
        <text x={pl - 8} y={pt + 10} textAnchor="end" fontSize="9" style={{ fill: 'var(--muted)' }}>{mx}</text>
        <text x={pl - 8} y={h - pb - 4} textAnchor="end" fontSize="9" style={{ fill: 'var(--muted)' }}>{mn}</text>
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_PRIMARY} stopOpacity="0.15" />
            <stop offset="100%" stopColor={CHART_PRIMARY} stopOpacity="0.01" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute top-2 right-2 flex gap-3 text-[11px]">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_PRIMARY }} /> 查询次数</span>
      </div>
      <div className="mt-1 text-center text-[11px] text-muted">
        <span className="mr-4">总采集：{data.reduce((s, d) => s + d.collected, 0).toLocaleString()}</span>
        <span>报告数：{data.reduce((s, d) => s + d.reports, 0).toLocaleString()}</span>
      </div>
    </div>
  )
}

function DonutChart({ data }: { data: { name: string; value: number }[] }) {
  if (!data.length) return <div className="h-48 flex items-center justify-center text-xs text-muted">暂无数据</div>
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const radius = 60; const circ = 2 * Math.PI * radius
  let accum = 0
  const segs = data.map((d, i) => {
    const len = circ * (d.value / total)
    const seg = { ...d, color: DONUT_COLORS[i], dashOffset: -accum, dashLen: len, pct: ((d.value / total) * 100).toFixed(0) }
    accum += len
    return seg
  })

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 160 150" className="w-40 h-36">
        {segs.map((s, i) => (
          <circle key={i} cx="80" cy="75" r={radius} fill="none" stroke={s.color} strokeWidth="18"
            strokeDasharray={`${s.dashLen} ${circ - s.dashLen}`} strokeDashoffset={s.dashOffset}
            transform="rotate(-90 80 75)" style={{ transition: 'all 0.3s' }} />
        ))}
        <text x="80" y="72" textAnchor="middle" fontSize="16" fontWeight="bold" style={{ fill: 'var(--foreground)' }}>
          {total.toLocaleString()}
        </text>
        <text x="80" y="86" textAnchor="middle" fontSize="9" style={{ fill: 'var(--muted)' }}>
          总采集
        </text>
      </svg>
      <div className="grid grid-cols-5 gap-2 mt-1">
        {segs.map((s, i) => (
          <div key={i} className="text-center">
            <div className="w-2 h-2 rounded-full mx-auto mb-0.5" style={{ background: s.color }} />
            <p className="text-[10px] text-muted">{s.name}</p>
            <p className="text-[10px] font-medium" style={{ color: 'var(--foreground)' }}>{s.pct}%</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CategoryBars({ data }: { data: CategoryStat[] }) {
  const sorted = [...data].sort((a, b) => b.queries - a.queries).slice(0, 8)
  const mx = sorted.length ? Math.max(...sorted.map(s => s.queries)) : 1
  return (
    <div className="space-y-2.5">
      {sorted.map((cat) => (
        <div key={cat.name}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span style={{ color: 'var(--foreground)' }} className="font-medium truncate mr-2">{cat.name}</span>
            <span style={{ color: 'var(--muted)' }} className="whitespace-nowrap">{cat.queries} 次</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-hover)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${(cat.queries / mx) * 100}%`, background: CHART_PRIMARY }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function OpportunityRanking({ data }: { data: OpportunityRank[] }) {
  const scoreColor = (s: number) =>
    s >= 75 ? 'bg-emerald-500' : s >= 60 ? 'bg-blue-500' : s >= 45 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="space-y-1.5">
      {data.slice(0, 8).map((item, i) => (
        <div key={item.category} className="flex items-center gap-2 py-1.5 border-b border-border/30 last:border-0">
          <span className="text-[10px] text-muted w-4 text-right">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>{item.category}</span>
              <span className="text-xs font-bold ml-2" style={{ color: 'var(--foreground)' }}>{item.score}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-hover)' }}>
              <div className={`h-full rounded-full ${scoreColor(item.score)}`} style={{ width: `${item.score}%` }} />
            </div>
          </div>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${compBadge[item.competition] ?? ''}`}>
            {item.competition}
          </span>
        </div>
      ))}
    </div>
  )
}

function GroupedBarChart({ data }: { data: PlatformDaily[] }) {
  const days = data[0]?.data?.length ?? 7
  const maxVal = Math.max(...data.flatMap(p => p.data))
  const barW = 10; const gap = 2; const groupW = (barW + gap) * data.length - gap
  const w = 400; const h = 150; const pl = 4; const pr = 4; const pt = 10; const pb = 20
  const chartW = w - pl - pr; const chartH = h - pt - pb

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" style={{ maxHeight: 160 }}>
        {data.map((plat, pi) =>
          plat.data.slice(-7).map((val, di) => {
            const x = pl + (di / days) * chartW + (di > 0 ? 0 : 0) + pi * (barW + gap)
            // Simplify: distribute groups evenly
            const gX = pl + (di / days) * chartW + ((chartW / days) - groupW) / 2
            const bx = gX + pi * (barW + gap)
            const bh = (val / maxVal) * chartH
            return (
              <rect key={`${pi}-${di}`} x={bx} y={pt + chartH - bh} width={barW} height={Math.max(bh, 1)}
                fill={DONUT_COLORS[pi]} rx="1.5" />
            )
          })
        )}
        {/* Legend */}
        {data.map((p, i) => (
          <text key={i} x={pl + i * 80} y={h - 2} fontSize="8" fill={DONUT_COLORS[i]}>
            ● {p.name}
          </text>
        ))}
      </svg>
    </div>
  )
}

function PriceBars({ data }: { data: PriceDist[] }) {
  const mx = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.range} className="flex items-center gap-2">
          <span className="text-[10px] text-muted w-12 text-right">{item.range}</span>
          <div className="flex-1 h-4 rounded overflow-hidden" style={{ background: 'var(--surface-hover)' }}>
            <div className="h-full rounded flex items-center justify-end pr-1 text-[9px] text-white font-medium"
              style={{ width: `${(item.count / mx) * 100}%`, background: CHART_GREEN }}>
              {item.count > mx * 0.15 ? item.count.toLocaleString() : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function RiskBars({ data }: { data: RiskDist[] }) {
  const mx = Math.max(...data.map(d => d.value), 1)
  const barColors = [CHART_RED, CHART_AMBER, CHART_PRIMARY, CHART_PURPLE, CHART_CYAN, CHART_GREEN]
  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={item.name} className="flex items-center gap-2">
          <span className="text-[10px] text-muted w-14 truncate">{item.name}</span>
          <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-hover)' }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${(item.value / mx) * 100}%`, background: barColors[i] }} />
          </div>
          <span className="text-[10px] font-medium w-6 text-right" style={{ color: 'var(--foreground)' }}>{item.value}%</span>
        </div>
      ))}
    </div>
  )
}

// ========= Page Component =========

export default function MarketLabPage() {
  const store = useDemoDataStore()
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showAllHistory, setShowAllHistory] = useState(false)

  useEffect(() => {
    store.ensureGrown()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleReset = () => {
    setShowResetConfirm(false)
    store.resetDemoData()
  }

  const {
    ml_totalQueries, ml_totalCollected, ml_totalReports, ml_coveredPlatforms,
    ml_last7Queries, ml_todayCollected, ml_queryHistory, ml_dailyTrend14,
    ml_platformDist, ml_categoryStats, ml_opportunityRanks, ml_platformComparison,
    ml_priceDist, ml_riskDist,
  } = store

  const displayHistory = showAllHistory ? ml_queryHistory : ml_queryHistory.slice(0, 12)

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Market Lab</h1>
          <p className="text-muted mt-1">数据分析工作台 · 市场洞察 · 竞品追踪 · 选品决策</p>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 text-[11px] font-medium border border-amber-200 dark:border-amber-700 mt-2">
            <RefreshCw size={11} />
            动态演示数据 · 查询与采集记录随日期增长
          </span>
        </div>
        <div className="relative flex-shrink-0 ml-3">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted hover:text-foreground hover:bg-surface-hover transition"
          >
            <RefreshCw size={13} />
            恢复演示数据
          </button>
          {showResetConfirm && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowResetConfirm(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 w-60 rounded-xl border border-border bg-surface shadow-lg p-3 animate-fade-in">
                <p className="text-xs text-muted mb-3">清空当前演示数据并重新初始化？此操作不会影响其他页面数据。</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-border text-xs text-muted hover:text-foreground transition"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium hover:opacity-90 transition"
                  >
                    确认恢复
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-border bg-surface p-3.5">
          <p className="text-[11px] text-muted font-medium flex items-center gap-1">
            <BarChart3 size={13} />
            累计查询
          </p>
          <p className="text-lg font-bold mt-1">{ml_totalQueries.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3.5">
          <p className="text-[11px] text-muted font-medium flex items-center gap-1">
            <Database size={13} />
            采集商品数
          </p>
          <p className="text-lg font-bold mt-1">{ml_totalCollected.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3.5">
          <p className="text-[11px] text-muted font-medium flex items-center gap-1">
            <FileText size={13} />
            分析报告
          </p>
          <p className="text-lg font-bold mt-1">{ml_totalReports.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3.5">
          <p className="text-[11px] text-muted font-medium flex items-center gap-1">
            <Globe size={13} />
            覆盖平台数
          </p>
          <p className="text-lg font-bold mt-1">{ml_coveredPlatforms}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3.5">
          <p className="text-[11px] text-muted font-medium flex items-center gap-1">
            <TrendingUp size={13} />
            近7日新增查询
          </p>
          <p className="text-lg font-bold mt-1">{ml_last7Queries.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3.5">
          <p className="text-[11px] text-muted font-medium flex items-center gap-1">
            <Search size={13} />
            今日采集商品数
          </p>
          <p className="text-lg font-bold mt-1">{ml_todayCollected.toLocaleString()}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Trend Chart */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp size={15} className="text-primary" />
            近14日查询趋势
          </h3>
          <TrendChart data={ml_dailyTrend14} />
        </div>

        {/* Platform Donut */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Globe size={15} className="text-primary" />
            平台来源占比
          </h3>
          <DonutChart data={ml_platformDist} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category Bars */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <BarChart3 size={15} className="text-primary" />
            热门分析类目
          </h3>
          <CategoryBars data={ml_categoryStats} />
        </div>

        {/* Opportunity Ranking */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp size={15} className="text-emerald-500" />
            机会分数排行榜
          </h3>
          <OpportunityRanking data={ml_opportunityRanks} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Platform Comparison */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Globe size={15} className="text-muted" />
            平台采集量对比
          </h3>
          <GroupedBarChart data={ml_platformComparison} />
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[10px]" style={{ color: 'var(--muted)' }}>
            {ml_platformComparison.map((p, i) => (
              <span key={p.name} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: DONUT_COLORS[i] }} />
                {p.name}: {p.data.reduce((s, v) => s + v, 0).toLocaleString()}
              </span>
            ))}
          </div>
        </div>

        {/* Price Distribution */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Database size={15} className="text-muted" />
            价格带分布
          </h3>
          <PriceBars data={ml_priceDist} />
        </div>

        {/* Risk Distribution */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp size={15} className="text-muted" />
            风险分布
          </h3>
          <RiskBars data={ml_riskDist} />
        </div>
      </div>

      {/* Query History */}
      <div className="rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Clock size={15} />
            查询历史
            <span className="text-xs text-muted font-normal">({ml_queryHistory.length} 条)</span>
          </h2>
          <button className="text-xs text-muted hover:text-foreground flex items-center gap-1 transition">
            <Download size={14} />
            导出全部
          </button>
        </div>
        <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
          {displayHistory.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-hover transition">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--surface-hover)' }}>
                  <Search size={13} style={{ color: 'var(--muted)' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.query}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{item.platform}</span>
                    <span className="text-[11px]" style={{ color: 'var(--muted)' }}>·</span>
                    <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{item.date}</span>
                    <span className="text-[11px]" style={{ color: 'var(--muted)' }}>·</span>
                    <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{item.results.toLocaleString()} 条</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${confidenceColors[item.confidence]}`}>
                      {item.confidence}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                {item.reportGenerated && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                    <FileText size={10} /> 已生成
                  </span>
                )}
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${oppBadge[item.opportunity]}`}>
                  {item.opportunity}
                </span>
                <button className="p-1 rounded hover:bg-surface-hover transition" style={{ color: 'var(--muted)' }}>
                  <ExternalLink size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
        {ml_queryHistory.length > 12 && (
          <button
            onClick={() => setShowAllHistory(!showAllHistory)}
            className="w-full p-3 text-xs text-muted hover:text-foreground hover:bg-surface-hover transition border-t border-border"
          >
            {showAllHistory ? '收起' : `查看全部 ${ml_queryHistory.length} 条历史`}
          </button>
        )}
      </div>

      {/* Tip */}
      <div className="rounded-xl bg-surface-hover/50 border border-border p-4 text-sm text-muted">
        连接真实店铺和平台数据后，Vertex 将使用授权数据替换当前演示数据。
      </div>
    </div>
  )
}
