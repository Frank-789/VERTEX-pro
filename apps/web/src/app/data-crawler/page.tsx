'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Database, CloudDownload, SearchCheck, Globe,
  ChevronRight, Play, Clock, CheckCircle2, AlertCircle,
  XCircle, ExternalLink, RefreshCw, Loader2,
  Search, Link2, SlidersHorizontal, ListChecks,
  FileText, Monitor, Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import useSWR from 'swr'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
const CRAWLER_API = `${API_URL}/crawler`

// --- Types ---

interface CrawlerCapability {
  name: string
  available: boolean
  description: string
  requires_config: boolean
}

interface Platform {
  id: string
  name: string
  status: 'supported' | 'needs_config' | 'experimental' | 'not_recommended'
  source_type: string
  capabilities: CrawlerCapability[]
  required_env: string[]
  limitations: string[]
  recommended_for_production: boolean
  risk_hints: string[]
  data_sources: string[]
}

interface ProductRecord {
  platform: string
  title: string
  price: number
  original_price: number | null
  currency: string
  sales_volume: number | null
  rating: number | null
  review_count: number | null
  image_url: string | null
  product_url: string | null
  shop_name: string | null
  seller_name: string | null
  category: string | null
  location: string | null
  source: string
  crawled_at: string
  parse_warning: string | null
}

interface CrawlTask {
  id: string
  platform: string
  keyword: string
  url: string
  max_items: number
  include_details: boolean
  include_reviews: boolean
  region: string
  purpose: string
  status: 'pending_config' | 'running' | 'success' | 'failed' | 'needs_verification'
  created_at: string
  updated_at: string
  completed_at: string | null
  items_count: number
  results: ProductRecord[]
  error_message: string | null
  next_action: string | null
}

// --- Fetcher ---

const fetcher = (url: string) => fetch(url).then(r => r.json())

// --- Status helpers ---

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  supported: {
    label: '已支持',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  needs_config: {
    label: '需配置',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800',
    icon: Settings,
  },
  experimental: {
    label: '实验中',
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: Monitor,
  },
  not_recommended: {
    label: '暂不建议生产',
    color: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-800',
    icon: XCircle,
  },
}

const taskStatusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending_config: { label: '待配置', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20', icon: Settings },
  running: { label: '运行中', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/20', icon: Loader2 },
  success: { label: '成功', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20', icon: CheckCircle2 },
  failed: { label: '失败', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/20', icon: XCircle },
  needs_verification: { label: '需要人工验证', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20', icon: AlertCircle },
}

function SourceTypeIcon({ type }: { type: string }) {
  const icons: Record<string, any> = {
    oxylabs: CloudDownload,
    apify: Database,
    browser: Monitor,
    official_api: Globe,
    pending: Clock,
    manual: Settings,
  }
  const Icon = icons[type] || Database
  return <Icon size={14} className="text-muted" />
}

function SourceTypeLabel({ type }: { type: string }) {
  const labels: Record<string, string> = {
    oxylabs: 'Oxylabs API',
    apify: 'Apify Actor',
    browser: '本地浏览器',
    official_api: '官方 API',
    pending: '待接入',
    manual: '需要手动授权',
  }
  return <span>{labels[type] || type}</span>
}

// --- Platform Card ---

function PlatformCard({
  platform,
  selected,
  onClick,
}: {
  platform: Platform
  selected: boolean
  onClick: () => void
}) {
  const status = statusConfig[platform.status] || statusConfig.needs_config
  const StatusIcon = status.icon
  const availableCaps = platform.capabilities.filter(c => c.available)

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative text-left w-full rounded-xl border p-4 transition-all duration-200',
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-surface hover:border-muted hover:bg-surface-hover',
      )}
    >
      {/* Platform name + status badge */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-foreground">{platform.name}</h3>
        <span className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border',
          status.color, status.bg, status.border,
        )}>
          <StatusIcon size={12} />
          {status.label}
        </span>
      </div>

      {/* Capability tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {availableCaps.length > 0 ? (
          availableCaps.slice(0, 4).map(cap => (
            <span key={cap.name} className="px-1.5 py-0.5 rounded text-[11px] bg-surface-hover text-muted border border-border">
              {cap.name}
            </span>
          ))
        ) : (
          <span className="text-[11px] text-muted/50">暂无可用能力</span>
        )}
      </div>

      {/* Data source + risk */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] text-muted">
          <SourceTypeIcon type={platform.source_type} />
          <SourceTypeLabel type={platform.source_type} />
        </div>
        {platform.risk_hints.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {platform.risk_hints.slice(0, 2).map((hint, i) => (
              <span key={i} className="text-[10px] text-red-500/70 dark:text-red-400/60">
                ⚠ {hint}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Selected indicator */}
      {selected && (
        <div className="absolute top-3 right-3 opacity-0">
          <CheckCircle2 size={16} className="text-primary" />
        </div>
      )}
    </button>
  )
}

// --- Task Creation Form ---

function TaskForm({
  platform,
  onCreated,
}: {
  platform: Platform
  onCreated: () => void
}) {
  const [keyword, setKeyword] = useState('')
  const [url, setUrl] = useState('')
  const [maxItems, setMaxItems] = useState(20)
  const [includeDetails, setIncludeDetails] = useState(false)
  const [includeReviews, setIncludeReviews] = useState(false)
  const [region, setRegion] = useState('CN')
  const [purpose, setPurpose] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isUnconfigured = platform.status === 'needs_config' || platform.status === 'not_recommended'

  const handleSubmit = useCallback(async () => {
    if (!keyword.trim() && !url.trim()) {
      setError('请输入关键词或目标 URL')
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`${CRAWLER_API}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platform.id,
          keyword: keyword.trim(),
          url: url.trim(),
          max_items: maxItems,
          include_details: includeDetails,
          include_reviews: includeReviews,
          region,
          purpose,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || `请求失败: ${res.status}`)
      } else {
        setSuccess(`任务已创建: ${data.id}`)
        onCreated()
      }
    } catch (e: any) {
      setError(`连接服务器失败: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }, [platform.id, keyword, url, maxItems, includeDetails, includeReviews, region, purpose, onCreated])

  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Play size={16} className="text-primary" />
        创建采集任务 · {platform.name}
      </h3>

      {isUnconfigured && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-200 space-y-1">
          <p className="font-medium">⚠ 当前平台尚未配置真实采集凭证</p>
          <p>请在环境变量中配置后再运行：</p>
          <code className="block mt-1 text-[11px] bg-amber-100/50 dark:bg-amber-900/30 px-2 py-1 rounded">
            {platform.required_env.join(', ')}
          </code>
          <p className="mt-1 text-amber-600/70 dark:text-amber-300/70">
            未配置时将不会执行真实采集，但会创建任务记录。
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Keyword */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted flex items-center gap-1.5">
            <Search size={14} /> 关键词
          </label>
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="例如：蓝牙耳机"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary transition"
            disabled={loading}
          />
        </div>

        {/* URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted flex items-center gap-1.5">
            <Link2 size={14} /> 目标 URL <span className="text-muted/50">（可选）</span>
          </label>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="商品列表页或详情页链接"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary transition"
            disabled={loading}
          />
        </div>

        {/* Max Items */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted flex items-center gap-1.5">
            <SlidersHorizontal size={14} /> 最大采集数量
          </label>
          <input
            type="number"
            value={maxItems}
            onChange={e => setMaxItems(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
            min={1}
            max={100}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary transition"
            disabled={loading}
          />
        </div>

        {/* Region */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted flex items-center gap-1.5">
            <Globe size={14} /> 地区/站点
          </label>
          <select
            value={region}
            onChange={e => setRegion(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary transition"
            disabled={loading}
          >
            <option value="CN">🇨🇳 CN - 中国</option>
            <option value="US">🇺🇸 US - 美国</option>
            <option value="SG">🇸🇬 SG - 新加坡</option>
            <option value="VN">🇻🇳 VN - 越南</option>
            <option value="TW">🇹🇼 TW - 台湾</option>
            <option value="HK">🇭🇰 HK - 香港</option>
          </select>
        </div>

        {/* Purpose */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-medium text-muted flex items-center gap-1.5">
            <ListChecks size={14} /> 数据用途
          </label>
          <div className="flex flex-wrap gap-2">
            {['选品分析', '竞品监控', '价格带分析', '评论洞察', '货源匹配'].map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPurpose(p === purpose ? '' : p)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs border transition',
                  purpose === p
                    ? 'border-primary bg-primary/5 text-foreground font-medium'
                    : 'border-border text-muted hover:text-foreground hover:bg-surface-hover'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeDetails}
            onChange={e => setIncludeDetails(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
          />
          <span className="text-xs text-muted">采集详情</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeReviews}
            onChange={e => setIncludeReviews(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
          />
          <span className="text-xs text-muted">采集评论</span>
        </label>
      </div>

      {/* Error / Success */}
      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-3 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-3 text-xs text-emerald-700 dark:text-emerald-300">
          {success}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className={cn(
          'flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition',
          loading
            ? 'bg-muted/20 text-muted cursor-not-allowed'
            : 'bg-foreground text-background hover:opacity-90',
        )}
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> 正在创建任务...</>
        ) : (
          <><Play size={16} /> 开始采集</>
        )}
      </button>
    </div>
  )
}

// --- Task List ---

function TaskList({ tasks, onRefresh }: { tasks: CrawlTask[]; onRefresh: () => void }) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Clock size={16} className="text-muted" />
          最近任务
        </h3>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted hover:text-foreground hover:bg-surface-hover transition"
        >
          <RefreshCw size={14} /> 刷新
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-muted text-sm border border-dashed border-border rounded-xl">
          暂无任务，选择平台后创建采集任务
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => {
            const tStatus = taskStatusConfig[task.status] || taskStatusConfig.pending_config
            const TIcon = tStatus.icon
            const isExpanded = expandedTask === task.id

            return (
              <div key={task.id} className="rounded-xl border border-border bg-surface overflow-hidden">
                {/* Task header */}
                <button
                  onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-surface-hover transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn('p-1.5 rounded-lg', tStatus.bg)}>
                      {task.status === 'running' ? (
                        <Loader2 size={14} className={cn(tStatus.color, 'animate-spin')} />
                      ) : (
                        <TIcon size={14} className={tStatus.color} />
                      )}
                    </div>
                    <div className="text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate max-w-[200px]">
                          {task.keyword}
                        </span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-hover text-muted border border-border">
                          {task.platform}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted mt-0.5">
                        {task.id} · {new Date(task.created_at).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={cn('text-[11px] font-medium', tStatus.color)}>{tStatus.label}</span>
                    {task.items_count > 0 && (
                      <span className="text-[11px] text-muted">{task.items_count} 条</span>
                    )}
                    <ChevronRight size={14} className={cn('text-muted transition', isExpanded && 'rotate-90')} />
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-border px-4 py-3 space-y-3">
                    {/* Error / Next action */}
                    {task.error_message && (
                      <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-2.5 text-xs text-red-700 dark:text-red-300">
                        <p className="font-medium mb-0.5">错误：</p>
                        <p>{task.error_message}</p>
                      </div>
                    )}
                    {task.next_action && (
                      <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-2.5 text-xs text-amber-700 dark:text-amber-300">
                        <p className="font-medium mb-0.5">下一步：</p>
                        <p>{task.next_action}</p>
                      </div>
                    )}

                    {/* Results table */}
                    {task.results.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 px-2 text-muted font-medium">标题</th>
                              <th className="text-right py-2 px-2 text-muted font-medium">价格</th>
                              <th className="text-right py-2 px-2 text-muted font-medium">销量</th>
                              <th className="text-right py-2 px-2 text-muted font-medium">评分</th>
                              <th className="text-left py-2 px-2 text-muted font-medium">店铺</th>
                              <th className="text-left py-2 px-2 text-muted font-medium">来源</th>
                            </tr>
                          </thead>
                          <tbody>
                            {task.results.map((r, i) => (
                              <tr key={i} className="border-b border-border/50 hover:bg-surface-hover transition-colors">
                                <td className="py-2 px-2 text-foreground max-w-[200px] truncate">
                                  {r.product_url ? (
                                    <a
                                      href={r.product_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:text-primary inline-flex items-center gap-1"
                                    >
                                      {r.title || '-'}
                                      <ExternalLink size={10} className="flex-shrink-0" />
                                    </a>
                                  ) : (
                                    r.title || '-'
                                  )}
                                </td>
                                <td className="py-2 px-2 text-right font-medium">
                                  {r.price > 0 ? `${r.currency || '¥'}${r.price.toFixed(2)}` : '-'}
                                </td>
                                <td className="py-2 px-2 text-right text-muted">
                                  {r.sales_volume ?? '-'}
                                </td>
                                <td className="py-2 px-2 text-right text-muted">
                                  {r.rating ? `★ ${r.rating.toFixed(1)}` : '-'}
                                </td>
                                <td className="py-2 px-2 text-muted max-w-[120px] truncate">
                                  {r.shop_name || r.seller_name || '-'}
                                </td>
                                <td className="py-2 px-2 text-muted">{r.source || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {task.results.some(r => r.parse_warning) && (
                          <div className="mt-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-2 text-[11px] text-amber-700 dark:text-amber-300">
                            ⚠ 部分结果的结构化解析待完善，原始数据可在 raw_data 中查看
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// --- Main Page ---

export default function DataCrawlerPage() {
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Fetch platforms
  const { data: platformsData, error: platformsError, isLoading: platformsLoading } = useSWR(
    `${CRAWLER_API}/platforms`,
    fetcher,
    { revalidateOnFocus: false },
  )

  // Fetch tasks
  const { data: tasksData, mutate: refreshTasks } = useSWR(
    `${CRAWLER_API}/tasks?limit=20`,
    fetcher,
    { revalidateOnFocus: false },
  )

  const platforms: Platform[] = platformsData?.platforms || []
  const tasks: CrawlTask[] = tasksData?.tasks || []
  const selectedPlatform = platforms.find(p => p.id === selectedPlatformId) || null

  const handleTaskCreated = useCallback(() => {
    refreshTasks()
    setRefreshKey(k => k + 1)
  }, [refreshTasks])

  // Auto-refresh tasks every 5s if there's a running task
  useEffect(() => {
    const hasRunning = tasks.some(t => t.status === 'running')
    if (!hasRunning) return
    const interval = setInterval(() => refreshTasks(), 5000)
    return () => clearInterval(interval)
  }, [tasks, refreshTasks])

  // Summary counts
  const supportedCount = platforms.filter(p => p.status === 'supported').length
  const needsConfigCount = platforms.filter(p => p.status === 'needs_config').length
  const experimentalCount = platforms.filter(p =>
    p.status === 'experimental' || p.status === 'not_recommended'
  ).length

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
          <Database size={24} className="text-primary" />
          Data Crawler
        </h1>
        <p className="text-sm text-muted mt-1">
          多平台商品数据采集、价格监控、评论抓取、货源扫描
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <span className="text-xs text-muted">采集能力状态：</span>
          {supportedCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 size={12} />
              {supportedCount} 真实可用
            </span>
          )}
          {needsConfigCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <Settings size={12} />
              {needsConfigCount} 需配置
            </span>
          )}
          {experimentalCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <Monitor size={12} />
              {experimentalCount} 实验能力
            </span>
          )}
        </div>
      </div>

      {/* Loading / Error states for platforms */}
      {platformsLoading && (
        <div className="flex items-center justify-center py-8 text-sm text-muted">
          <Loader2 size={16} className="animate-spin mr-2" />
          加载平台列表...
        </div>
      )}
      {platformsError && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-700 dark:text-red-300">
          <p className="font-medium">无法加载平台列表</p>
          <p className="text-xs mt-1">请确认后端服务已启动，并检查 API 连接。</p>
        </div>
      )}

      {/* Platform grid */}
      {!platformsLoading && !platformsError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {platforms.map(platform => (
            <PlatformCard
              key={platform.id}
              platform={platform}
              selected={selectedPlatformId === platform.id}
              onClick={() => setSelectedPlatformId(
                selectedPlatformId === platform.id ? null : platform.id,
              )}
            />
          ))}
        </div>
      )}

      {/* Task form (when platform selected) */}
      {selectedPlatform && (
        <div className="animate-fade-in">
          <TaskForm
            key={`${selectedPlatform.id}-${refreshKey}`}
            platform={selectedPlatform}
            onCreated={handleTaskCreated}
          />
        </div>
      )}

      {/* Task list */}
      <TaskList tasks={tasks} onRefresh={() => refreshTasks()} />
    </div>
  )
}
