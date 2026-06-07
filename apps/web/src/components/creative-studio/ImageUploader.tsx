'use client'

import { useRef, useState } from 'react'
import { Upload, X, Image as ImageIcon, Package, Building, Target, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCreativeStudioStore, type ReferenceImage } from '@/lib/store/creativeStudioStore'

const uploadTypes = [
  { value: 'product' as const, label: '产品实拍图', icon: Package, desc: '上传产品实物照片' },
  { value: 'packaging' as const, label: '包装图', icon: Building, desc: '上传产品包装照片' },
  { value: 'competitor' as const, label: '竞品参考图', icon: Target, desc: '上传竞品参考图片' },
  { value: 'scene' as const, label: '场景参考图', icon: MapPin, desc: '上传场景参考图片' },
]

export default function ImageUploader() {
  const { referenceImages, addReferenceImage, removeReferenceImage } = useCreativeStudioStore()
  const [activeType, setActiveType] = useState<ReferenceImage['type']>('product')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      const image: ReferenceImage = {
        id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: activeType,
        dataUrl,
        name: file.name,
        file,
      }
      addReferenceImage(image)
    }
    reader.readAsDataURL(file)

    // Reset input so same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const filteredImages = referenceImages.filter((i) => i.type === activeType)
  const allImages = referenceImages

  return (
    <div>
      <div className="flex gap-1 mb-3 overflow-x-auto">
        {uploadTypes.map((type) => {
          const Icon = type.icon
          const count = referenceImages.filter((i) => i.type === type.value).length
          return (
            <button
              key={type.value}
              onClick={() => setActiveType(type.value)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap shrink-0',
                activeType === type.value
                  ? 'bg-foreground text-background'
                  : 'bg-surface-hover text-muted hover:text-foreground'
              )}
            >
              <Icon size={13} />
              {type.label}
              {count > 0 && <span className="ml-0.5 text-[10px] opacity-70">({count})</span>}
            </button>
          )
        })}
      </div>

      {/* Upload Area */}
      <div className="grid grid-cols-2 gap-2">
        {filteredImages.map((img) => (
          <div
            key={img.id}
            className="relative rounded-lg border border-border bg-surface-hover overflow-hidden group aspect-square"
          >
            <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
            <button
              onClick={() => removeReferenceImage(img.id)}
              className="absolute top-1 right-1 p-1 rounded-md bg-black/50 text-white opacity-0 group-hover:opacity-100 transition hover:bg-black/70"
            >
              <X size={12} />
            </button>
            <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-gradient-to-t from-black/60 to-transparent">
              <p className="text-[10px] text-white truncate">{img.name}</p>
            </div>
          </div>
        ))}

        {/* Upload Placeholder */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-primary/40 hover:bg-surface-hover/50 transition cursor-pointer aspect-square',
            filteredImages.length === 0 && 'col-span-2 h-32'
          )}
        >
          <Upload size={20} className="text-muted/50 mb-1" />
          <p className="text-[11px] text-muted/60">点击上传</p>
          <p className="text-[10px] text-muted/40 mt-0.5">PNG/JPG/WebP</p>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {allImages.length > 0 && (
        <p className="text-[11px] text-muted/60 mt-2">
          共 {allImages.length} 张参考图
        </p>
      )}
    </div>
  )
}
