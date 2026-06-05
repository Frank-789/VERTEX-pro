'use client'

import { useTheme } from '@/app/providers'
import { Moon, Sun, Sparkles } from 'lucide-react'

export default function Header() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-foreground">Vertex</h1>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted/20 text-muted font-medium">
            Beta
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-surface-hover transition text-muted hover:text-foreground"
          title={theme === 'light' ? '切换夜间模式' : '切换日间模式'}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
    </header>
  )
}
