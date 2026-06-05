'use client'

import { AlertTriangle, TrendingDown, MessageCircle, Package, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const mockAlerts = [
  { type: 'inventory', product: '智能蓝牙耳机 Pro', level: 'warning', message: '库存仅剩 23 件，低于安全库存线 50 件', time: '2 小时前' },
  { type: 'review', product: '瑜伽垫加厚款', level: 'danger', message: '新增 3 条差评：产品有异味、尺寸偏小', time: '5 小时前' },
  { type: 'price', product: '便携式榨汁杯', level: 'info', message: '竞品降价 15% 至 ¥59，建议关注', time: '1 天前' },
  { type: 'clearance', product: '冬季保暖袜（库存积压）', level: 'warning', message: '库存 342 件，近30天仅售 28 件，建议清货', time: '3 天前' },
]

export default function StorePilotPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Store Pilot</h1>
        <p className="text-muted mt-1">售中监控 Demo · 库存预警 · 差评提醒 · 清货建议</p>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-medium border border-amber-200 mt-2">
          演示模式 · 使用样例数据
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between mb-2">
            <Package size={16} className="text-muted" />
            <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full font-medium">正常</span>
          </div>
          <p className="text-2xl font-bold">23</p>
          <p className="text-xs text-muted mt-1">库存商品数</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full font-medium">2项预警</span>
          </div>
          <p className="text-2xl font-bold">4</p>
          <p className="text-xs text-muted mt-1">需关注商品</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown size={16} className="text-red-500" />
            <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full font-medium">建议清货</span>
          </div>
          <p className="text-2xl font-bold">1</p>
          <p className="text-xs text-muted mt-1">滞销商品</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between mb-2">
            <MessageCircle size={16} className="text-red-500" />
            <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full font-medium">待处理</span>
          </div>
          <p className="text-2xl font-bold">3</p>
          <p className="text-xs text-muted mt-1">差评待回复</p>
        </div>
      </div>

      {/* Alerts */}
      <div className="rounded-xl border border-border bg-surface">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            实时预警
          </h2>
        </div>
        <div className="divide-y divide-border">
          {mockAlerts.map((alert, i) => (
            <div key={i} className="px-4 py-3.5 hover:bg-surface-hover transition">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                    alert.level === 'danger' ? 'bg-red-500' :
                    alert.level === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                  )} />
                  <div>
                    <p className="text-sm font-medium">{alert.product}</p>
                    <p className="text-xs text-muted mt-0.5">{alert.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[11px] text-muted">{alert.time}</span>
                  <button className="text-muted hover:text-foreground">
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tip */}
      <div className="rounded-xl bg-surface-hover/50 border border-border p-4 text-sm text-muted">
        🔌 连接店铺授权后，Store Pilot 将实时监控您的店铺数据。
        当前为演示模式，展示的为模拟数据。
      </div>
    </div>
  )
}
