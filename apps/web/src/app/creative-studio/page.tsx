'use client'

import { useState } from 'react'
import { Image, Upload, Wand2, Download, Sparkles, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const templates = [
  { id: 'white', label: '白底主图', desc: '干净白底，突出产品本身' },
  { id: 'scene', label: '场景图', desc: '真实使用场景，代入感强' },
  { id: 'compare', label: '对比图', desc: '竞品对比，突出优势' },
  { id: 'feature', label: '卖点图', desc: '标注核心卖点功能' },
  { id: 'detail', label: '详情首屏', desc: '详情页第一屏视觉' },
]

export default function CreativeStudioPage() {
  const [selectedTemplate, setSelectedTemplate] = useState('white')
  const [image, setImage] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setImage(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    // Simulate generation
    await new Promise(r => setTimeout(r, 2500))
    setGenerating(false)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Creative Studio</h1>
        <p className="text-muted mt-1">电商主图套件 · 一张原图 → 一套视觉素材 + Listing文案</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Upload */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Upload size={16} />
              上传产品图
            </h2>
            <label className={cn(
              'flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition bg-surface-hover/50',
              image && 'border-solid border-primary/30'
            )}>
              {image ? (
                <img src={image} alt="产品原图" className="h-full object-contain p-2" />
              ) : (
                <div className="text-center">
                  <Image size={32} className="mx-auto text-muted/50 mb-2" />
                  <p className="text-sm text-muted">点击上传产品原图</p>
                  <p className="text-xs text-muted/60 mt-1">支持 PNG/JPG/WebP</p>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>

          {/* Template Selection */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Sparkles size={16} />
              主图模板
            </h2>
            <div className="space-y-1">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-lg text-sm transition',
                    selectedTemplate === t.id
                      ? 'bg-surface-hover border border-border'
                      : 'hover:bg-surface-hover'
                  )}
                >
                  <span className="font-medium">{t.label}</span>
                  <p className="text-xs text-muted mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-border bg-surface p-4 min-h-[400px] flex flex-col items-center justify-center">
            {generating ? (
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-foreground flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Wand2 size={24} className="text-background" />
                </div>
                <p className="text-sm text-muted">AI 正在生成主图...</p>
                <p className="text-xs text-muted/60 mt-1">正在根据产品特征生成电商视觉素材</p>
              </div>
            ) : image ? (
              <div className="w-full space-y-4">
                <div className="bg-surface-hover/50 rounded-xl h-64 flex items-center justify-center border border-border">
                  <div className="text-center text-muted">
                    <Image size={48} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">点击「生成主图套件」开始生成</p>
                  </div>
                </div>
                {/* Listing preview */}
                <div className="bg-surface-hover/50 rounded-xl p-4 border border-border">
                  <p className="text-xs text-muted font-medium mb-2">AI 生成的 Listing 文案预览</p>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted/20 rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-muted/20 rounded animate-pulse w-1/2" />
                    <div className="h-4 bg-muted/20 rounded animate-pulse w-2/3" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted">
                <Image size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">请先上传产品图片</p>
                <p className="text-xs text-muted/60 mt-1">上传后即可生成主图套件和Listng文案</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={!image || generating}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-foreground text-background font-medium text-sm hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>生成中...</>
              ) : (
                <><Wand2 size={18} />生成主图套件</>
              )}
            </button>
            <button
              disabled={!image || generating}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border font-medium text-sm hover:bg-surface-hover transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              下载全部
            </button>
          </div>

          {/* Output description */}
          {image && !generating && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-muted font-medium mb-2">生成内容</p>
              <div className="grid grid-cols-5 gap-2 text-xs text-muted">
                <span className="px-2 py-1 rounded bg-surface-hover text-center">白底主图</span>
                <span className="px-2 py-1 rounded bg-surface-hover text-center">场景图</span>
                <span className="px-2 py-1 rounded bg-surface-hover text-center">卖点图</span>
                <span className="px-2 py-1 rounded bg-surface-hover text-center">对比图</span>
                <span className="px-2 py-1 rounded bg-surface-hover text-center">详情首屏</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
