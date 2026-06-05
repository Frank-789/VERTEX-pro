'use client'

import { BarChart3, Search, Download, Clock, ExternalLink } from 'lucide-react'

const mockHistory = [
  { query: '蓝牙耳机市场分析', platform: '京东', date: '2026-06-05', results: 87 },
  { query: '瑜伽服货源搜索', platform: '1688', date: '2026-06-04', results: 156 },
  { query: '扫地机器人价格对比', platform: '淘宝+京东', date: '2026-06-03', results: 234 },
  { query: '宠物用品类目扫描', platform: '拼多多', date: '2026-06-02', results: 312 },
]

export default function MarketLabPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Market Lab</h1>
        <p className="text-muted mt-1">数据分析工作台 · 查询历史 · 数据对比 · 图表生成</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted font-medium">累计查询</p>
          <p className="text-2xl font-bold mt-1">128</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted font-medium">采集商品数</p>
          <p className="text-2xl font-bold mt-1">12,847</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted font-medium">分析报告</p>
          <p className="text-2xl font-bold mt-1">96</p>
        </div>
      </div>

      {/* History */}
      <div className="rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Clock size={16} />
            查询历史
          </h2>
          <button className="text-xs text-muted hover:text-foreground flex items-center gap-1">
            <Download size={14} />
            导出全部
          </button>
        </div>
        <div className="divide-y divide-border">
          {mockHistory.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-surface-hover transition">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center">
                  <Search size={14} className="text-muted" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.query}</p>
                  <p className="text-xs text-muted">{item.platform} · {item.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted">{item.results} 条</span>
                <button className="text-muted hover:text-foreground">
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
