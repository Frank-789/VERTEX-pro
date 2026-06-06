'use client'

import { useEffect, useState } from 'react'
import {
  AlertTriangle, TrendingDown, MessageCircle, Package, DollarSign, ShoppingCart,
  ArrowUpRight, RefreshCw, Clock, TrendingUp, Ban
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDemoDataStore, type Alert } from '@/lib/store/demoDataStore'

const alertIcons: Record<Alert['type'], typeof AlertTriangle> = {
  inventory: Package,
  review: MessageCircle,
  price: TrendingDown,
  clearance: Ban,
  refund: AlertTriangle,
  profit: TrendingDown,
}

const alertColors: Record<Alert['level'], string> = {
  danger: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
}

const typeLabels: Record<Alert['type'], string> = {
  inventory: '库存预警',
  review: '差评预警',
  price: '竞品降价',
  clearance: '滞销清货',
  refund: '退款风险',
  profit: '毛利异常',
}

export default function StorePilotPage() {
  const store = useDemoDataStore()
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  useEffect(() => {
    store.ensureGrown()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleReset = () => {
    setShowResetConfirm(false)
    store.resetDemoData()
  }

  const {
    sp_todaySales, sp_todayOrders, sp_inventoryCount,
    sp_attentionItems, sp_badReviews, sp_slowMoving,
    sp_last7GMV, sp_refundRate, sp_alerts, sp_dynamics,
  } = store

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Store Pilot</h1>
          <p className="text-muted mt-1">店铺经营监控 · 库存预警 · 差评提醒 · 清货建议</p>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 text-[11px] font-medium border border-amber-200 dark:border-amber-700 mt-2">
            <RefreshCw size={11} />
            动态演示数据 · 随日期自动更新
          </span>
        </div>
        <div className="relative">
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

      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign size={16} className="text-emerald-500" />
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded-full font-medium">今日</span>
          </div>
          <p className="text-xl font-bold">¥{sp_todaySales.toLocaleString()}</p>
          <p className="text-xs text-muted mt-1">今日销售额</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart size={16} className="text-blue-500" />
            <span className="text-[11px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-1.5 py-0.5 rounded-full font-medium">今日</span>
          </div>
          <p className="text-xl font-bold">{sp_todayOrders}</p>
          <p className="text-xs text-muted mt-1">今日订单数</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between mb-2">
            <Package size={16} className="text-muted" />
            <span className={cn(
              'text-[11px] px-1.5 py-0.5 rounded-full font-medium',
              sp_inventoryCount < 40
                ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/20'
                : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20'
            )}>
              {sp_inventoryCount < 40 ? '偏少' : '正常'}
            </span>
          </div>
          <p className="text-xl font-bold">{sp_inventoryCount}</p>
          <p className="text-xs text-muted mt-1">库存商品数</p>
        </div>
      </div>

      {/* KPI Cards - Row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-surface p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={13} className="text-amber-500" />
            <p className="text-xs text-muted">需关注商品</p>
          </div>
          <p className="text-lg font-bold">{sp_attentionItems}</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle size={13} className="text-red-500" />
            <p className="text-xs text-muted">差评待处理</p>
          </div>
          <p className="text-lg font-bold">{sp_badReviews}</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <Ban size={13} className="text-muted" />
            <p className="text-xs text-muted">滞销商品</p>
          </div>
          <p className="text-lg font-bold">{sp_slowMoving}</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={13} className="text-primary" />
            <p className="text-xs text-muted">近7日 GMV</p>
          </div>
          <p className="text-lg font-bold">¥{sp_last7GMV.toLocaleString()}</p>
        </div>
      </div>

      {/* Today's Business Dynamics */}
      <div className="rounded-xl border border-border bg-surface">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Clock size={15} className="text-primary" />
            今日经营动态
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="rounded-lg bg-surface-hover border border-border p-3 text-center">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{sp_todayOrders}</p>
              <p className="text-[11px] text-muted">今日新增订单</p>
            </div>
            <div className="rounded-lg bg-surface-hover border border-border p-3 text-center">
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">¥{sp_todaySales.toLocaleString()}</p>
              <p className="text-[11px] text-muted">今日新增销售额</p>
            </div>
            <div className="rounded-lg bg-surface-hover border border-border p-3 text-center">
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{sp_alerts.filter(a => a.time === '刚刚' || a.time.includes('分钟前')).length}</p>
              <p className="text-[11px] text-muted">今日新增预警</p>
            </div>
            <div className="rounded-lg bg-surface-hover border border-border p-3 text-center">
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{sp_refundRate}%</p>
              <p className="text-[11px] text-muted">退款率</p>
            </div>
          </div>

          {sp_dynamics.length > 0 ? (
            <div className="space-y-2">
              {sp_dynamics.map((d, i) => {
                const iconMap = {
                  order: <ShoppingCart size={14} className="text-blue-500" />,
                  alert: <AlertTriangle size={14} className="text-amber-500" />,
                  review: <MessageCircle size={14} className="text-red-500" />,
                  price: <TrendingDown size={14} className="text-muted" />,
                }
                return (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                    <span className="text-xs text-muted font-mono w-10 flex-shrink-0 mt-0.5">{d.time}</span>
                    {iconMap[d.icon]}
                    <p className="text-sm text-foreground">{d.message}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted text-center py-3">暂无今日动态</p>
          )}
        </div>
      </div>

      {/* Alerts */}
      <div className="rounded-xl border border-border bg-surface">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            实时预警
            <span className="text-xs text-muted font-normal">({sp_alerts.length} 条)</span>
          </h2>
        </div>
        <div className="divide-y divide-border">
          {sp_alerts.map((alert, i) => {
            const Icon = alertIcons[alert.type]
            return (
              <div key={alert.id ?? i} className="px-4 py-3 hover:bg-surface-hover transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', alertColors[alert.level])} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{alert.product}</p>
                        <span className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded font-medium',
                          alert.level === 'danger' ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400' :
                          alert.level === 'warning' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400' :
                          'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400'
                        )}>
                          {typeLabels[alert.type]}
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-0.5">{alert.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className="text-[11px] text-muted whitespace-nowrap">{alert.time}</span>
                    <button className="text-muted hover:text-foreground">
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {sp_alerts.length === 0 && (
          <p className="text-sm text-muted text-center py-6">暂无预警</p>
        )}
      </div>

      {/* Tip */}
      <div className="rounded-xl bg-surface-hover/50 border border-border p-4 text-sm text-muted">
        连接真实店铺和平台数据后，Vertex 将使用授权数据替换当前演示数据。
      </div>
    </div>
  )
}
