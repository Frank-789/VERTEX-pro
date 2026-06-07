'use client'

import { X, Save, Shield, AlertCircle } from 'lucide-react'
import { useCreativeStudioStore } from '@/lib/store/creativeStudioStore'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export default function SettingsModal() {
  const { showSettings, setShowSettings, imageApiConfig, setImageApiConfig, apiConfigured } = useCreativeStudioStore()
  const [localConfig, setLocalConfig] = useState({ ...imageApiConfig })

  if (!showSettings) return null

  const handleSave = () => {
    setImageApiConfig(localConfig)
    setShowSettings(false)
  }

  const isFormValid = localConfig.baseUrl.trim() && localConfig.apiKey.trim() && localConfig.model.trim()

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
        <div
          className="relative w-full max-w-md rounded-2xl border border-border bg-background shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold">API 配置</h2>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1.5 rounded-lg hover:bg-surface-hover transition text-muted"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-4">
            {/* Status */}
            <div className={cn(
              'rounded-xl p-3 flex items-start gap-2',
              apiConfigured ? 'bg-success/5 border border-success/20' : 'bg-warning/5 border border-warning/20'
            )}>
              <Shield size={14} className={cn(
                'flex-shrink-0 mt-0.5',
                apiConfigured ? 'text-success' : 'text-warning'
              )} />
              <div>
                <p className={cn(
                  'text-xs font-medium',
                  apiConfigured ? 'text-success' : 'text-warning'
                )}>
                  {apiConfigured ? 'API 已配置' : 'API 未配置'}
                </p>
                <p className="text-[11px] mt-0.5 text-muted">
                  {apiConfigured
                    ? '图片生成功能已可用'
                    : '请填写以下信息以启用图片生成功能，或者留空使用占位模式。'
                  }
                </p>
              </div>
            </div>

            {/* Base URL */}
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">
                IMAGE_API_BASE_URL
              </label>
              <input
                type="text"
                value={localConfig.baseUrl}
                onChange={(e) => setLocalConfig({ ...localConfig, baseUrl: e.target.value })}
                placeholder="https://api.openai.com"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/40 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition"
              />
            </div>

            {/* API Key */}
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">
                IMAGE_API_KEY
              </label>
              <input
                type="password"
                value={localConfig.apiKey}
                onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/40 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition"
              />
            </div>

            {/* Model */}
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">
                IMAGE_MODEL
              </label>
              <input
                type="text"
                value={localConfig.model}
                onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                placeholder="dall-e-3"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/40 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition"
              />
            </div>

            <div className="rounded-lg bg-surface-hover border border-border p-3">
              <p className="text-[11px] text-muted leading-relaxed">
                支持任何兼容 OpenAI 图片生成 API 的服务（标准 OpenAI、自定义代理等）。
                API 端点将自动拼接为 <code className="text-primary bg-primary/5 px-1 py-0.5 rounded">{localConfig.baseUrl}/v1/images/generations</code>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-border flex gap-3">
            <button
              onClick={() => setShowSettings(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted hover:text-foreground transition"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!isFormValid}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition',
                isFormValid
                  ? 'bg-foreground text-background hover:opacity-90'
                  : 'bg-muted/20 text-muted cursor-not-allowed'
              )}
            >
              <Save size={15} />
              保存配置
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
