'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, Sparkles, TrendingUp, ShoppingBag, Globe } from 'lucide-react'

const suggestions = [
  { icon: TrendingUp, label: '分析家居用品类目市场机会', color: 'text-blue-600' },
  { icon: ShoppingBag, label: '搜索1688蓝牙耳机货源', color: 'text-green-600' },
  { icon: Globe, label: '对比淘宝与拼多多宠物用品价格', color: 'text-purple-600' },
  { icon: Sparkles, label: '上传产品图生成电商主图', color: 'text-orange-600' },
]

export default function Home() {
  const router = useRouter()
  const [input, setInput] = useState('')

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (input.trim()) {
      router.push(`/chat?q=${encodeURIComponent(input.trim())}`)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
      {/* Logo & Welcome */}
      <div className="text-center mb-10 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center mx-auto mb-6 shadow-lg">
          <span className="text-background font-bold text-2xl">V</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          你好，我是 Vertex
        </h1>
        <p className="text-muted text-base max-w-md mx-auto leading-relaxed">
          AI电商经营智能体 · 多平台选品 · 利润测算 · 主图生成
        </p>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSubmit} className="w-full max-w-2xl mb-8 animate-slide-up">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入电商经营问题，例如：帮我分析宠物用品市场..."
            className="w-full h-14 px-5 pr-14 rounded-2xl border border-border bg-surface text-foreground text-base placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            autoFocus
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-foreground text-background hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </form>

      {/* Suggestions */}
      <div className="w-full max-w-2xl animate-slide-up">
        <p className="text-xs text-muted mb-3 font-medium tracking-wide uppercase">快速开始</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {suggestions.map((item, i) => {
            const Icon = item.icon
            return (
              <button
                key={i}
                onClick={() => {
                  setInput(item.label)
                  router.push(`/chat?q=${encodeURIComponent(item.label)}`)
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-surface hover:bg-surface-hover transition text-left text-sm text-muted hover:text-foreground group"
              >
                <Icon size={18} className={`${item.color} flex-shrink-0`} />
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
