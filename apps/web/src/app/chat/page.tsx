'use client'

import { Suspense, useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Send, Paperclip, X, Loader2, ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Globe, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatStore, type Message, type ToolCall, type DataSource } from '@/lib/store/chatStore'
import { useProfileStore } from '@/lib/store/profileStore'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

const platforms = [
  { value: 'auto', label: '智能选择', icon: '🤖' },
  { value: '1688', label: '1688', icon: '🏭' },
  { value: 'jd', label: '京东', icon: '🛒' },
  { value: 'taobao', label: '淘宝', icon: '🛍️' },
  { value: 'pdd', label: '拼多多', icon: '🎁' },
  { value: 'ebay', label: 'eBay', icon: '🌐' },
]

const quickQuestions = [
  '帮我分析蓝牙耳机市场',
  '搜一下1688上瑜伽服货源',
  '对比京东和淘宝的扫地机价格',
  '热水壶类目还有机会吗',
  '分析宠物用品市场机会',
  '新手1万块能做什么品类',
]

function DataCredibilityBadge({ source }: { source: DataSource }) {
  const config = {
    realtime: { label: '实时采集', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    user_upload: { label: '用户上传', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    cached: { label: '缓存数据', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    estimated: { label: 'AI估算', color: 'bg-gray-50 text-gray-500 border-gray-200', dot: 'bg-gray-400' },
  }
  const c = config[source.type]
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border', c.color)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', c.dot)} />
      {c.label}
    </span>
  )
}

function ToolCallCapsule({ call }: { call: ToolCall }) {
  const [expanded, setExpanded] = useState(false)

  const statusIcon = {
    running: <Loader2 size={14} className="animate-spin text-primary" />,
    completed: <CheckCircle2 size={14} className="text-emerald-500" />,
    failed: <AlertCircle size={14} className="text-red-500" />,
  }[call.status]

  const statusLabel = {
    running: '采集数据中...',
    completed: '采集完成',
    failed: '采集失败',
  }[call.status]

  return (
    <div className="border border-border rounded-xl bg-surface overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm hover:bg-surface-hover transition"
      >
        <div className="flex items-center gap-2.5">
          {statusIcon}
          <div>
            <span className="font-medium text-foreground">{call.name}</span>
            {call.platform && (
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-surface-hover text-muted ml-2">{call.platform}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span>{statusLabel}</span>
          {call.status === 'completed' && call.dataCount && (
            <span>{call.dataCount} 条</span>
          )}
          {call.duration && <span>{call.duration}ms</span>}
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>
      {expanded && call.details && (
        <div className="px-3.5 pb-3 text-xs text-muted leading-relaxed border-t border-border pt-2.5 mt-0">
          {call.details}
        </div>
      )}
    </div>
  )
}

const REPORT_HEADERS = ['结论先行', '一、', '二、', '三、', '四、', '五、', '六、', '核心判断', '关键依据', '风险提醒', '可执行建议']

function isReportContent(text: string): boolean {
  if (text.length < 200) return false
  return REPORT_HEADERS.some(h => text.includes(h))
}

function isTitleLine(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false
  if (/^[一二三四五六]、/.test(trimmed)) return true
  if (/^结论先行/.test(trimmed)) return true
  if (/^【[^】]+】/.test(trimmed)) return true
  return false
}

function ReportContent({ text }: { text: string }) {
  const blocks = text.split(/\n\n+/)
  return (
    <div className="space-y-5">
      {blocks.map((block, bi) => {
        const lines = block.split('\n').filter(l => l.trim())
        if (lines.length === 0) return null

        const firstLine = lines[0].trim()

        // Block with title line as first line
        if (isTitleLine(firstLine)) {
          return (
            <div key={bi} className="space-y-1.5">
              <h3 className="text-base font-semibold text-foreground">{firstLine}</h3>
              {lines.slice(1).map((line, li) => (
                <p key={li} className="text-sm text-foreground leading-relaxed">{line.trim()}</p>
              ))}
            </div>
          )
        }

        // Regular block
        return (
          <div key={bi} className="space-y-1.5">
            {lines.map((line, li) => {
              const trimmed = line.trim()
              if (/^(可信度|数据来源)/.test(trimmed)) {
                return <p key={li} className="text-xs text-muted">{trimmed}</p>
              }
              return <p key={li} className="text-sm text-foreground leading-relaxed">{trimmed}</p>
            })}
          </div>
        )
      })}
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isReport = message.role === 'assistant' && isReportContent(message.content)

  return (
    <div className={cn(
      'flex gap-4 animate-fade-in',
      message.role === 'user' ? 'justify-end' : 'justify-start'
    )}>
      {message.role === 'assistant' && (
        <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-background font-bold text-xs">V</span>
        </div>
      )}

      <div className={cn(
        isReport ? 'flex-1 max-w-3xl space-y-3' : 'max-w-[80%] space-y-3',
        message.role === 'user' && 'order-first'
      )}>
        {isReport ? (
          // Report mode: no rounded bubble border, clean report style
          <div className="bg-surface rounded-xl px-5 py-4">
            <ReportContent text={message.content} />
          </div>
        ) : (
          // Bubble mode: rounded bubble for short/user messages
          <div className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
            message.role === 'user'
              ? 'bg-primary/10 text-foreground rounded-br-md'
              : 'bg-surface border border-border rounded-bl-md'
          )}>
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        )}

        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="space-y-1.5">
            {message.toolCalls.map((tc) => (
              <ToolCallCapsule key={tc.id} call={tc} />
            ))}
          </div>
        )}

        {message.dataSources && message.dataSources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.dataSources.map((ds, i) => (
              <DataCredibilityBadge key={i} source={ds} />
            ))}
          </div>
        )}
      </div>

      {message.role === 'user' && (
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-primary font-bold text-xs">U</span>
        </div>
      )}
    </div>
  )
}

function ChatContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q')

  const { messages, isStreaming, addMessage, setStreaming } = useChatStore()
  const { profile, onboardingCompleted } = useProfileStore()
  const [input, setInput] = useState(initialQuery || '')
  const [selectedPlatform, setSelectedPlatform] = useState('auto')
  const [showPlatforms, setShowPlatforms] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (initialQuery && messages.length === 0) {
      handleSend(initialQuery)
    }
  }, [initialQuery])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  const handleSend = useCallback(async (text?: string) => {
    const messageText = text || input
    if (!messageText.trim()) return

    abortRef.current = new AbortController()

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: Date.now(),
    }
    addMessage(userMsg)
    setInput('')
    setStreaming(true)

    // Create placeholder assistant message
    const assistantId = `ai-${Date.now()}`
    addMessage({
      id: assistantId,
      role: 'assistant',
      content: '',
      toolCalls: [],
      dataSources: [],
      timestamp: Date.now(),
    })

    let accumulatedContent = ''

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          platform: selectedPlatform,
          merchant_profile: onboardingCompleted ? {
            experience: profile.experience,
            budget: profile.budget,
            risk: profile.risk,
            hasSupplier: profile.hasSupplier,
          } : undefined,
          stream: true,
        }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''
      const activeToolCalls: ToolCall[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const eventType = line.slice(7).trim()
            // Next line should be data
            continue
          }
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim()

            // Determine event type from previous line
            const prevEvent = lines[lines.indexOf(line) - 1]
            const eventType = prevEvent?.startsWith('event: ')
              ? prevEvent.slice(7).trim()
              : 'chunk'

            if (eventType === 'tool_call') {
              try {
                const tc = JSON.parse(dataStr)
                activeToolCalls.push({
                  id: tc.id,
                  name: tc.name,
                  status: tc.status || 'completed',
                  platform: tc.platform,
                  duration: tc.duration,
                  dataCount: tc.data_count,
                  details: tc.details,
                })
                useChatStore.getState().updateLastAssistant({
                  toolCalls: [...activeToolCalls],
                })
              } catch { /* ignore parse errors */ }
            } else if (eventType === 'chunk') {
              accumulatedContent += dataStr
              useChatStore.getState().updateLastAssistant({
                content: accumulatedContent,
              })
            } else if (eventType === 'done') {
              // Final update with data sources
              useChatStore.getState().updateLastAssistant({
                dataSources: [
                  { label: '实时采集', type: 'realtime' },
                  { label: 'AI估算', type: 'estimated' },
                ],
              })
            } else if (eventType === 'error') {
              try {
                const err = JSON.parse(dataStr)
                accumulatedContent += `\n\n⚠️ ${err.message}`
                useChatStore.getState().updateLastAssistant({
                  content: accumulatedContent,
                })
              } catch { /* ignore */ }
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return
      console.error('Chat error:', err)

      // Update the assistant message with error
      const errorMsg = (accumulated: string) => accumulated
        ? `\n\n⚠️ 连接服务器失败，已显示缓存结果。\n> 提示：请确保后端服务已启动`
        : `⚠️ 连接服务器失败。请确认后端 API 服务已启动。\n> 提示：在终端中运行 \`cd apps/api && uvicorn src.main:app --reload --port 8000\``

      useChatStore.getState().updateLastAssistant({
        content: errorMsg(accumulatedContent) || '⚠️ 连接服务器失败',
      })
    } finally {
      setStreaming(false)
    }
  }, [input, selectedPlatform, addMessage, setStreaming, profile, onboardingCompleted])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && !isStreaming && (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-12 h-12 rounded-2xl bg-foreground flex items-center justify-center mx-auto mb-4">
                <span className="text-background font-bold text-lg">V</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">有什么可以帮助你的？</h2>
              <p className="text-muted text-sm">描述你的电商需求，我来自动采集数据并生成分析报告</p>
              <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-xl mx-auto">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(q)
                      handleSend(q)
                    }}
                    className="px-3.5 py-2 rounded-xl border border-border bg-surface text-sm text-muted hover:text-foreground hover:bg-surface-hover transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* File Preview */}
      {file && (
        <div className="px-4">
          <div className="max-w-3xl mx-auto mb-3 flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-surface">
            <div className="flex items-center gap-3">
              <Paperclip size={16} className="text-muted" />
              <span className="text-sm font-medium">{file.name}</span>
              <span className="text-xs text-muted">({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
            <button onClick={() => setFile(null)} className="text-muted hover:text-foreground">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 pb-4 pt-2 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-2xl border border-border bg-surface shadow-sm">
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-3 pt-2 pb-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg hover:bg-surface-hover transition text-muted"
                title="上传文件"
              >
                <Paperclip size={16} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept=".txt,.docx,.xlsx,.csv,.pdf,.json,.png,.jpg,.jpeg,.webp"
              />

              <div className="relative">
                <button
                  onClick={() => setShowPlatforms(!showPlatforms)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-surface-hover transition text-xs text-muted"
                >
                  <Globe size={14} />
                  <span>{platforms.find(p => p.value === selectedPlatform)?.label || '智能选择'}</span>
                </button>
                {showPlatforms && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowPlatforms(false)} />
                    <div className="absolute bottom-full left-0 mb-1 bg-surface border border-border rounded-xl shadow-lg p-1.5 z-20 min-w-[140px]">
                      {platforms.map((p) => (
                        <button
                          key={p.value}
                          onClick={() => { setSelectedPlatform(p.value); setShowPlatforms(false) }}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition',
                            selectedPlatform === p.value ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground hover:bg-surface-hover'
                          )}
                        >
                          <span>{p.icon}</span>
                          <span>{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {onboardingCompleted && (
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-primary/5 text-primary ml-auto">
                  <Zap size={12} className="inline mr-0.5" />
                  已启用画像
                </span>
              )}
            </div>

            {/* Textarea */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入电商经营问题..."
              rows={1}
              className="w-full bg-transparent px-4 py-2 text-sm text-foreground placeholder:text-muted/50 resize-none focus:outline-none max-h-[200px]"
            />

            {/* Send Button */}
            <div className="flex items-center justify-between px-3 pb-2">
              <span className="text-[11px] text-muted/60">Enter 发送 · Shift+Enter 换行</span>
              {isStreaming && (
                <button
                  onClick={() => abortRef.current?.abort()}
                  className="text-xs text-muted hover:text-foreground px-2 py-1 rounded"
                >
                  停止
                </button>
              )}
              <button
                onClick={() => handleSend()}
                disabled={isStreaming || !input.trim()}
                className={cn(
                  'p-2 rounded-xl transition flex items-center justify-center',
                  isStreaming || !input.trim()
                    ? 'bg-muted/20 text-muted cursor-not-allowed'
                    : 'bg-foreground text-background hover:opacity-90'
                )}
              >
                {isStreaming ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-muted/50 text-center mt-2">
            Vertex 使用 AI 技术 + 实时数据采集分析，数据来源标注可信度
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center">
        <div className="text-muted text-sm">加载中...</div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  )
}
