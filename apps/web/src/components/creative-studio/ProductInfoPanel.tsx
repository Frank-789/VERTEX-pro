'use client'

import { cn } from '@/lib/utils'
import {
  Package,
  Grid3X3,
  Globe,
  Target,
  Users,
  MapPin,
  Palette,
  Ban,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { useCreativeStudioStore } from '@/lib/store/creativeStudioStore'
import { normalizeSellingPoints, normalizeForbidden } from '@/lib/plannerPrompt'
import ImageUploader from './ImageUploader'

const platforms = ['1688', '淘宝', '京东', '拼多多', 'eBay', '独立站']
const styles = ['高级极简', '白底主图', '生活方式图', '科技感', '母婴风', '家居风', '户外风', '自定义']

export default function ProductInfoPanel() {
  const { productInfo, setProductInfo, referenceImages, isPlanning, imagePlans } = useCreativeStudioStore()

  const hasEnoughInfo = productInfo.productName.trim().length > 0
  const hasPlans = imagePlans.length > 0

  return (
    <div className="space-y-4">
      {/* 商品名称 */}
      <div>
        <label className="text-xs font-medium flex items-center gap-1.5 mb-1.5 text-muted">
          <Package size={13} />
          商品名称 <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          value={productInfo.productName}
          onChange={(e) => setProductInfo({ productName: e.target.value })}
          placeholder="例：智能蓝牙耳机 Pro Max"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/40 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition"
        />
      </div>

      {/* 商品类目 */}
      <div>
        <label className="text-xs font-medium flex items-center gap-1.5 mb-1.5 text-muted">
          <Grid3X3 size={13} />
          商品类目
        </label>
        <input
          type="text"
          value={productInfo.category}
          onChange={(e) => setProductInfo({ category: e.target.value })}
          placeholder="例：消费电子 > 耳机 > 蓝牙耳机"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/40 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition"
        />
      </div>

      {/* 目标平台 */}
      <div>
        <label className="text-xs font-medium flex items-center gap-1.5 mb-1.5 text-muted">
          <Globe size={13} />
          目标平台
        </label>
        <div className="flex flex-wrap gap-1.5">
          {platforms.map((p) => (
            <button
              key={p}
              onClick={() => setProductInfo({ targetPlatform: productInfo.targetPlatform === p ? '' : p as any })}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition',
                productInfo.targetPlatform === p
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-surface border-border text-muted hover:text-foreground'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* 核心卖点 */}
      <div>
        <label className="text-xs font-medium flex items-center gap-1.5 mb-1.5 text-muted">
          <Target size={13} />
          核心卖点
        </label>
        <textarea
          value={productInfo.sellingPoints}
          onChange={(e) => setProductInfo({ sellingPoints: e.target.value })}
          placeholder="每行一个，例如：&#10;长达 48 小时续航&#10;主动降噪功能&#10;舒适耳塞设计"
          rows={3}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/40 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition resize-none"
        />
      </div>

      {/* 目标人群 */}
      <div>
        <label className="text-xs font-medium flex items-center gap-1.5 mb-1.5 text-muted">
          <Users size={13} />
          目标人群
        </label>
        <input
          type="text"
          value={productInfo.targetAudience}
          onChange={(e) => setProductInfo({ targetAudience: e.target.value })}
          placeholder="例：年轻白领、运动爱好者"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/40 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition"
        />
      </div>

      {/* 使用场景 */}
      <div>
        <label className="text-xs font-medium flex items-center gap-1.5 mb-1.5 text-muted">
          <MapPin size={13} />
          使用场景
        </label>
        <input
          type="text"
          value={productInfo.usageScenario}
          onChange={(e) => setProductInfo({ usageScenario: e.target.value })}
          placeholder="例：通勤、办公、运动健身"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/40 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition"
        />
      </div>

      {/* 风格偏好 */}
      <div>
        <label className="text-xs font-medium flex items-center gap-1.5 mb-1.5 text-muted">
          <Palette size={13} />
          风格偏好
        </label>
        <div className="flex flex-wrap gap-1.5">
          {styles.map((s) => (
            <button
              key={s}
              onClick={() => setProductInfo({ stylePreference: productInfo.stylePreference === s ? '' : s as any })}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition',
                productInfo.stylePreference === s
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-surface border-border text-muted hover:text-foreground'
              )}
            >
              {s}
            </button>
          ))}
        </div>
        {productInfo.stylePreference === '自定义' && (
          <input
            type="text"
            value={productInfo.customStyle}
            onChange={(e) => setProductInfo({ customStyle: e.target.value })}
            placeholder="请描述你想要的风格"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/40 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition mt-2"
          />
        )}
      </div>

      {/* 禁止元素 */}
      <div>
        <label className="text-xs font-medium flex items-center gap-1.5 mb-1.5 text-muted">
          <Ban size={13} />
          禁止元素
        </label>
        <textarea
          value={productInfo.forbiddenElements}
          onChange={(e) => setProductInfo({ forbiddenElements: e.target.value })}
          placeholder="每行一个，例如：&#10;竞品 Logo&#10;夸张功效文字&#10;价格标识"
          rows={2}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/40 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition resize-none"
        />
      </div>

      {/* 参考图上传 */}
      <div className="rounded-lg border border-border bg-surface p-3">
        <label className="text-xs font-medium flex items-center gap-1.5 mb-3 text-muted">
          参考图
        </label>
        <ImageUploader />
      </div>
    </div>
  )
}
