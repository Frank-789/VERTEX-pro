'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MessageSquare,
  BarChart3,
  Image,
  LayoutDashboard,
  Settings,
  Database,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const navItems = [
  { name: 'Vertex Chat', href: '/chat', icon: MessageSquare },
  { name: 'Market Lab', href: '/market-lab', icon: BarChart3 },
  { name: 'Creative Studio', href: '/creative-studio', icon: Image },
  { name: 'Store Pilot', href: '/store-pilot', icon: LayoutDashboard },
  { name: 'Data Crawler', href: '/data-crawler', icon: Database },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 flex flex-col border-r border-border bg-background transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className={cn('flex items-center gap-2', collapsed && 'justify-center w-full')}>
          <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center flex-shrink-0">
            <span className="text-background font-bold text-sm">V</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm tracking-tight">Vertex</span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'p-1.5 rounded-lg hover:bg-surface-hover transition',
            collapsed && 'hidden'
          )}
        >
          <ChevronLeft size={16} className="text-muted" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                isActive
                  ? 'bg-surface-hover text-foreground font-medium'
                  : 'text-muted hover:text-foreground hover:bg-surface-hover',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-border">
        {!collapsed && (
          <div className="flex items-center gap-2 px-1">
            <Sparkles size={14} className="text-accent" />
            <span className="text-xs text-muted">v1.0.0</span>
          </div>
        )}
      </div>
    </aside>
  )
}
