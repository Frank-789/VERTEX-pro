'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ========= Types =========

export interface Alert {
  id: string
  type: 'inventory' | 'review' | 'price' | 'clearance' | 'refund' | 'profit'
  product: string
  level: 'warning' | 'danger' | 'info'
  message: string
  time: string
}

export interface Dynamic {
  time: string
  message: string
  icon: 'order' | 'alert' | 'review' | 'price'
}

export interface ProductDemo {
  name: string
  price: number
  category: string
  stock: number
  safetyStock: number
  platform: string
}

export interface QueryHistory {
  id: string
  query: string
  platform: string
  date: string
  results: number
  reportGenerated: boolean
  opportunity: '建议进入' | '谨慎进入' | '不建议进入'
  confidence: '实时采集' | '缓存数据' | 'AI估算'
}

export interface DayTrend {
  date: string
  queries: number
  collected: number
  reports: number
}

export interface DailySalesRecord {
  date: string
  sales: number
  orders: number
}

export interface CategoryStat {
  name: string
  queries: number
  collected: number
}

export interface OpportunityRank {
  category: string
  score: number
  competition: '低' | '中' | '高'
  profit: '高' | '中' | '低'
  risk: '低' | '中' | '高'
}

export interface PlatformDaily {
  name: string
  data: number[]
}

export interface PriceDist {
  range: string
  count: number
}

export interface RiskDist {
  name: string
  value: number
}

interface DemoDataState {
  // Meta
  lastGrowthDate: string | null
  initialized: boolean

  // Store Pilot
  sp_todaySales: number
  sp_todayOrders: number
  sp_inventoryCount: number
  sp_attentionItems: number
  sp_badReviews: number
  sp_slowMoving: number
  sp_last7GMV: number
  sp_refundRate: number
  sp_alerts: Alert[]
  sp_dynamics: Dynamic[]
  sp_products: ProductDemo[]
  sp_dailySales: DailySalesRecord[]

  // Market Lab
  ml_totalQueries: number
  ml_totalCollected: number
  ml_totalReports: number
  ml_coveredPlatforms: number
  ml_last7Queries: number
  ml_todayCollected: number
  ml_queryHistory: QueryHistory[]
  ml_dailyTrend14: DayTrend[]
  ml_platformDist: { name: string; value: number }[]
  ml_categoryStats: CategoryStat[]
  ml_opportunityRanks: OpportunityRank[]
  ml_platformComparison: PlatformDaily[]
  ml_priceDist: PriceDist[]
  ml_riskDist: RiskDist[]

  // Actions
  ensureGrown: () => void
  resetDemoData: () => void
}

// ========= Helpers =========

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

const pick = <T,>(arr: T[]): T => arr[randomInt(0, arr.length - 1)]

const formatDate = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const daysAgo = (n: number): Date => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

const todayStr = (): string => formatDate(new Date())

const randomBizTime = (): string => {
  const h = randomInt(9, 18)
  const m = randomInt(0, 59)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// ========= Product Data =========

const BASE_PRODUCT_DEFS = [
  { name: '智能蓝牙耳机 Pro', price: 149, category: '蓝牙耳机', safetyStock: 50, platform: '京东' },
  { name: '便携式榨汁杯', price: 79, category: '小家电', safetyStock: 30, platform: '淘宝' },
  { name: '加厚瑜伽垫', price: 59, category: '瑜伽服', safetyStock: 40, platform: '拼多多' },
  { name: '宠物自动喂食器', price: 189, category: '宠物用品', safetyStock: 20, platform: '京东' },
  { name: '儿童保温水杯', price: 69, category: '母婴用品', safetyStock: 35, platform: '淘宝' },
  { name: '桌面收纳盒', price: 29, category: '收纳用品', safetyStock: 60, platform: '拼多多' },
  { name: '无线充电台灯', price: 89, category: '小家电', safetyStock: 25, platform: '京东' },
  { name: '厨房沥水置物架', price: 39, category: '厨房用品', safetyStock: 40, platform: '淘宝' },
  { name: '车载手机支架', price: 35, category: '车载配件', safetyStock: 50, platform: '拼多多' },
  { name: '旅行压缩收纳袋', price: 25, category: '收纳用品', safetyStock: 60, platform: '淘宝' },
  { name: '速干运动短袖', price: 49, category: '瑜伽服', safetyStock: 45, platform: '拼多多' },
  { name: '护眼学习台灯', price: 109, category: '母婴用品', safetyStock: 25, platform: '京东' },
  { name: '小型空气加湿器', price: 65, category: '小家电', safetyStock: 30, platform: '淘宝' },
  { name: '家用筋膜枪', price: 159, category: '户外装备', safetyStock: 20, platform: '京东' },
  { name: '防晒冰袖', price: 19, category: '瑜伽服', safetyStock: 80, platform: '拼多多' },
]

const CATEGORIES = ['蓝牙耳机', '宠物用品', '瑜伽服', '收纳用品', '小家电', '母婴用品', '户外装备', '厨房用品', '美妆工具', '车载配件']

// ========= Initial Data Generators =========

function genProducts(): ProductDemo[] {
  return BASE_PRODUCT_DEFS.map((p) => ({
    ...p,
    stock: randomInt(Math.round(p.safetyStock * 1.5), p.safetyStock * 4),
  }))
}

function initialAlerts(products: ProductDemo[]): Alert[] {
  const defs = [
    { type: 'inventory' as const, productIdx: 0, level: 'warning' as const, msg: '库存仅剩 18 件，低于安全库存线 50 件', time: '2小时前' },
    { type: 'review' as const, productIdx: 2, level: 'danger' as const, msg: '新增 3 条差评，集中反馈产品有异味', time: '5小时前' },
    { type: 'price' as const, productIdx: 1, level: 'info' as const, msg: '核心竞品今日降价 12%，当前价格压到 ¥59', time: '1天前' },
    { type: 'clearance' as const, productIdx: 9, level: 'warning' as const, msg: '近30天仅售 16 件，库存仍有 286 件，建议清货', time: '3天前' },
    { type: 'refund' as const, productIdx: 5, level: 'warning' as const, msg: '近7天退款率升至 6.8%，高于店铺平均水平', time: '1天前' },
    { type: 'profit' as const, productIdx: 10, level: 'info' as const, msg: '广告成本上升后，单品毛利率低于 18%', time: '2天前' },
    { type: 'inventory' as const, productIdx: 3, level: 'warning' as const, msg: '库存仅剩 12 件，低于安全库存线 20 件', time: '1天前' },
    { type: 'review' as const, productIdx: 6, level: 'danger' as const, msg: '新增 2 条差评，集中反馈续航不稳定', time: '6小时前' },
    { type: 'clearance' as const, productIdx: 7, level: 'warning' as const, msg: '近30天仅售 23 件，库存仍有 175 件', time: '4天前' },
    { type: 'price' as const, productIdx: 4, level: 'info' as const, msg: '竞品上新促销，价格降至 ¥49，建议关注价格带', time: '2天前' },
  ]
  return defs.map((d, i) => ({
    id: `alert-init-${i}`,
    type: d.type,
    product: products[d.productIdx]?.name ?? products[0].name,
    level: d.level,
    message: d.msg,
    time: d.time,
  }))
}

function genDynamics(products: ProductDemo[], count: number, today: boolean): Dynamic[] {
  const result: Dynamic[] = []
  const icons: Dynamic['icon'][] = ['order', 'order', 'review', 'alert', 'price', 'order', 'review']
  const reviewIssues = ['续航不稳定', '产品有异味', '尺寸偏小', '做工粗糙', '使用一周后故障', '与描述不符']
  const alertMsgs = [
    (p: ProductDemo) => ({ icon: 'alert' as const, msg: `${p.name} 库存仅剩 ${p.stock} 件，低于安全线`, }),
    (p: ProductDemo) => ({ icon: 'price' as const, msg: `${p.name} 竞品降价 ${randomInt(5, 18)}%，建议关注价格带`, }),
    (p: ProductDemo) => ({ icon: 'review' as const, msg: `${p.name} 新增 ${randomInt(1, 3)} 条差评，集中反馈${pick(reviewIssues)}`, }),
  ]

  for (let i = 0; i < count; i++) {
    const p = pick(products)
    const icon = pick(icons)

    if (icon === 'order') {
      const qty = randomInt(2, 12)
      const amount = qty * p.price + randomInt(-10, 20)
      result.push({
        time: today ? randomBizTime() : `${randomInt(9, 18)}:${String(randomInt(0, 59)).padStart(2, '0')}`,
        message: `${p.name} 新增 ${qty} 单，销售额 ¥${Math.max(amount, 1)}`,
        icon: 'order',
      })
    } else if (icon === 'review') {
      const issue = pick(reviewIssues)
      result.push({
        time: today ? randomBizTime() : `${randomInt(9, 18)}:${String(randomInt(0, 59)).padStart(2, '0')}`,
        message: `${p.name} 新增 ${randomInt(1, 3)} 条差评，集中反馈${issue}`,
        icon: 'review',
      })
    } else if (icon === 'alert') {
      result.push({
        time: today ? randomBizTime() : `${randomInt(9, 18)}:${String(randomInt(0, 59)).padStart(2, '0')}`,
        message: `${p.name} 库存低于安全线，建议补货`,
        icon: 'alert',
      })
    } else {
      result.push({
        time: today ? randomBizTime() : `${randomInt(9, 18)}:${String(randomInt(0, 59)).padStart(2, '0')}`,
        message: `${p.name} 竞品降价 ${randomInt(5, 15)}%，建议关注`,
        icon: 'price',
      })
    }
  }
  return result.sort((a, b) => a.time.localeCompare(b.time))
}

function genDailySales(): DailySalesRecord[] {
  const records: DailySalesRecord[] = []
  let total = 0
  for (let i = 6; i >= 0; i--) {
    const orders = randomInt(18, 46)
    const sales = randomInt(2800, 9800)
    total += sales
    records.push({ date: formatDate(daysAgo(i)), sales, orders })
  }
  return records
}

function gen14DayTrend(): DayTrend[] {
  const trend: DayTrend[] = []
  for (let i = 13; i >= 0; i--) {
    const dayOfWeek = daysAgo(i).getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const multiplier = isWeekend ? randomInt(12, 20) : randomInt(10, 16)
    trend.push({
      date: formatDate(daysAgo(i)),
      queries: randomInt(8, 15) * multiplier,
      collected: randomInt(80, 200) * multiplier,
      reports: randomInt(4, 8) * multiplier,
    })
  }
  return trend
}

function genQueryHistory(count: number): QueryHistory[] {
  const platforms = ['1688', '淘宝', '京东', '拼多多', 'eBay']
  const confidenceOptions: QueryHistory['confidence'][] = ['实时采集', '缓存数据', 'AI估算']
  const opportunityOptions: QueryHistory['opportunity'][] = ['建议进入', '谨慎进入', '不建议进入']
  const queries = [
    (p: string) => `搜索${p}蓝牙耳机货源`,
    (p: string) => `${p}宠物自动喂食器市场分析`,
    (p: string) => `${p}护眼台灯价格带扫描`,
    (p: string) => `${p}瑜伽垫竞品分析`,
    (p: string) => `eBay 车载支架跨境需求判断`,
    (p: string) => `1688 收纳盒源头厂家筛选`,
    (p: string) => `${p}厨房置物架低价竞争分析`,
    (p: string) => `${p}防晒冰袖季节趋势`,
    (p: string) => `${p}空气加湿器评价风险分析`,
    (p: string) => `eBay 户外折叠椅海外价格带`,
    (p: string) => `1688 儿童保温杯货源对比`,
    (p: string) => `${p}美妆收纳盒爆款拆解`,
    (p: string) => `${p}筋膜枪市场饱和度判断`,
    (p: string) => `${p}桌面收纳盒新品机会`,
    (p: string) => `1688 运动短袖货源对比`,
    (p: string) => `${p}无线台灯竞品价格追踪`,
    (p: string) => `${p}榨汁杯消费者痛点分析`,
    (p: string) => `${p}宠物喂食器差评归因`,
    (p: string) => `eBay 瑜伽服跨境选品`,
    (p: string) => `${p}保温杯材质安全评估`,
    (p: string) => `${p}车载手机支架蓝海判断`,
    (p: string) => `${p}加湿器竞争格局分析`,
    (p: string) => `1688 收纳袋厂家验厂报告`,
    (p: string) => `${p}防晒袖套价格带机会`,
    (p: string) => `${p}学习台灯护眼技术门槛`,
    (p: string) => `${p}空气炸锅市场空间分析`,
    (p: string) => `${p}运动发带品类扫描`,
    (p: string) => `${p}宠物玩具热门趋势`,
    (p: string) => `${p}瑜伽砖配件市场需求`,
    (p: string) => `${p}母婴湿巾竞品对比`,
    (p: string) => `${p}桌面台灯风格趋势`,
    (p: string) => `eBay 儿童水壶跨境认证`,
    (p: string) => `1688 瑜伽垫材质对比`,
    (p: string) => `${p}防晒帽季节热度评估`,
    (p: string) => `${p}保温饭盒市场机会`,
  ]

  const history: QueryHistory[] = []
  for (let i = 0; i < count; i++) {
    const q = queries[i % queries.length]
    const platform = i % 5 === 0 ? 'eBay' : platforms[randomInt(0, 3)]
    const daysBack = Math.floor(i / 4) // spread across days
    const date = formatDate(daysAgo(daysBack))
    const results = platform === 'eBay'
      ? randomInt(300, 3000)
      : randomInt(500, 15000)
    history.push({
      id: `q-${i}-${Date.now()}`,
      query: q(platform),
      platform,
      date,
      results,
      reportGenerated: Math.random() > 0.3,
      opportunity: pick(opportunityOptions),
      confidence: pick(confidenceOptions),
    })
  }
  return history
}

function genPlatformDist(): { name: string; value: number }[] {
  return [
    { name: '1688', value: randomInt(25, 35) },
    { name: '淘宝', value: randomInt(20, 30) },
    { name: '京东', value: randomInt(15, 25) },
    { name: '拼多多', value: randomInt(12, 20) },
    { name: 'eBay', value: randomInt(5, 12) },
  ]
}

function genCategoryStats(): CategoryStat[] {
  return CATEGORIES.map((cat) => ({
    name: cat,
    queries: randomInt(30, 200),
    collected: randomInt(2000, 25000),
  }))
}

function genOpportunityRanks(): OpportunityRank[] {
  const cats = [...CATEGORIES]
  const compOptions: OpportunityRank['competition'][] = ['低', '中', '高']
  const profitOptions: OpportunityRank['profit'][] = ['高', '中', '低']
  const riskOptions: OpportunityRank['risk'][] = ['低', '中', '高']
  return cats.map((cat) => ({
    category: cat,
    score: randomInt(45, 92),
    competition: pick(compOptions),
    profit: pick(profitOptions),
    risk: pick(riskOptions),
  })).sort((a, b) => b.score - a.score)
}

function genPlatformComparison(): PlatformDaily[] {
  const names = ['1688', '淘宝', '京东', '拼多多', 'eBay']
  return names.map((name) => ({
    name,
    data: Array.from({ length: 7 }, () =>
      name === 'eBay' ? randomInt(100, 800) : randomInt(300, 3000)
    ),
  }))
}

function genPriceDist(): PriceDist[] {
  return [
    { range: '0-20', count: randomInt(800, 3000) },
    { range: '20-50', count: randomInt(3000, 8000) },
    { range: '50-100', count: randomInt(5000, 12000) },
    { range: '100-200', count: randomInt(2000, 6000) },
    { range: '200+', count: randomInt(500, 2000) },
  ]
}

function genRiskDist(): RiskDist[] {
  return [
    { name: '高竞争', value: randomInt(25, 35) },
    { name: '低毛利', value: randomInt(15, 25) },
    { name: '售后高', value: randomInt(10, 20) },
    { name: '价格内卷', value: randomInt(10, 18) },
    { name: '供应不稳', value: randomInt(5, 12) },
    { name: '合规风险', value: randomInt(3, 10) },
  ]
}

// ========= Growth Functions =========

function growStorePilot(state: DemoDataState, simDate: string) {
  const products = state.sp_products.map((p) => ({ ...p }))

  // Update product stocks
  for (const p of products) {
    const r = Math.random()
    if (r < 0.4) {
      // Decrease from orders
      p.stock = Math.max(0, p.stock - randomInt(1, 5))
    } else if (r < 0.55) {
      // Restock
      p.stock = p.stock + randomInt(10, 50)
    }
  }

  const newOrders = randomInt(12, 45)
  const newSales = randomInt(1800, 12000)

  // Update daily sales records
  const dailySales = [...state.sp_dailySales]
  const todayRecord = dailySales.find((r) => r.date === simDate)
  if (todayRecord) {
    todayRecord.sales += newSales
    todayRecord.orders += newOrders
  } else {
    dailySales.push({ date: simDate, sales: newSales, orders: newOrders })
    if (dailySales.length > 7) dailySales.shift()
  }

  // Calculate 7-day GMV
  const last7GMV = dailySales.reduce((sum, r) => sum + r.sales, 0)

  // Update other metrics
  const attentionItems = Math.min(12, Math.max(3, state.sp_attentionItems + randomInt(-1, 3)))
  const badReviews = Math.min(10, Math.max(1, state.sp_badReviews + randomInt(-1, 2)))
  const slowMoving = Math.min(6, Math.max(1, state.sp_slowMoving + randomInt(-1, 1)))
  const inventoryCount = products.reduce((s, p) => s + p.stock, 0)
  const refundRate = parseFloat((3.5 + Math.random() * 5).toFixed(1))

  // Generate new alerts
  const newAlerts: Alert[] = []
  const reviewIssues = ['续航不稳定', '产品有异味', '尺寸偏小', '做工粗糙', '使用一周后故障']
  const alertTypes: { type: Alert['type']; gen: () => Alert | null }[] = [
    {
      type: 'inventory',
      gen: () => {
        const lowStock = products.filter((p) => p.stock < p.safetyStock)
        if (lowStock.length === 0) return null
        const p = pick(lowStock)
        return { id: `alert-${Date.now()}-${randomInt(0, 999)}`, type: 'inventory', product: p.name, level: 'warning', message: `库存仅剩 ${p.stock} 件，低于安全库存线 ${p.safetyStock} 件`, time: '刚刚' }
      },
    },
    {
      type: 'review',
      gen: () => {
        if (Math.random() > 0.6) return null
        const p = pick(products)
        const n = randomInt(1, 2)
        return { id: `alert-${Date.now()}-${randomInt(0, 999)}`, type: 'review', product: p.name, level: 'danger', message: `新增 ${n} 条差评，集中反馈${pick(reviewIssues)}`, time: '刚刚' }
      },
    },
    {
      type: 'price',
      gen: () => {
        if (Math.random() > 0.5) return null
        const p = pick(products)
        const drop = randomInt(5, 15)
        return { id: `alert-${Date.now()}-${randomInt(0, 999)}`, type: 'price', product: p.name, level: 'info', message: `核心竞品今日降价 ${drop}%，建议关注价格带`, time: '刚刚' }
      },
    },
    {
      type: 'clearance',
      gen: () => {
        if (Math.random() > 0.3) return null
        const p = pick(products)
        if (p.stock < 100) return null
        return { id: `alert-${Date.now()}-${randomInt(0, 999)}`, type: 'clearance', product: p.name, level: 'warning', message: `近30天仅售 ${randomInt(10, 30)} 件，库存仍有 ${p.stock} 件，建议清货`, time: '刚刚' }
      },
    },
  ]

  const alertCount = randomInt(1, 4)
  for (let i = 0; i < alertCount; i++) {
    const at = pick(alertTypes)
    const alert = at.gen()
    if (alert) newAlerts.push(alert)
  }

  // Combine and trim alerts
  const combinedAlerts = [...newAlerts, ...state.sp_alerts]
  const trimmedAlerts = combinedAlerts.slice(0, 15)

  // Generate today's dynamics
  const dynamics = genDynamics(products, randomInt(4, 6), true)

  // Update sales
  state.sp_todaySales = todayRecord?.sales ?? newSales
  state.sp_todayOrders = todayRecord?.orders ?? newOrders
  state.sp_inventoryCount = inventoryCount
  state.sp_attentionItems = attentionItems
  state.sp_badReviews = badReviews
  state.sp_slowMoving = slowMoving
  state.sp_last7GMV = last7GMV
  state.sp_refundRate = refundRate
  state.sp_alerts = trimmedAlerts
  state.sp_dynamics = dynamics
  state.sp_products = products
  state.sp_dailySales = dailySales
}

function growMarketLab(state: DemoDataState, simDate: string) {
  const simDay = new Date(simDate).getDay()
  const isWeekend = simDay === 0 || simDay === 6
  const weekendBoost = isWeekend ? 1.3 : 1.0

  const newQueries = Math.round(randomInt(18, 65) * weekendBoost)
  const newCollected = Math.round(randomInt(1200, 8500) * weekendBoost)
  const newReports = Math.round(randomInt(12, 48) * weekendBoost)
  const newHistoryCount = randomInt(4, 10)

  // Update cumulative
  state.ml_totalQueries += newQueries
  state.ml_totalCollected += newCollected
  state.ml_totalReports += newReports
  // Only set todayCollected when simDate is actual today
  if (simDate === todayStr()) {
    state.ml_todayCollected = newCollected
  }

  // Update 14-day trend
  const trend14 = [...state.ml_dailyTrend14]
  const existingDay = trend14.find((d) => d.date === simDate)
  if (existingDay) {
    existingDay.queries += newQueries
    existingDay.collected += newCollected
    existingDay.reports += newReports
  } else {
    trend14.push({ date: simDate, queries: newQueries, collected: newCollected, reports: newReports })
    if (trend14.length > 14) trend14.shift()
  }
  state.ml_dailyTrend14 = trend14

  // Update last 7 days query count
  const last7 = trend14.slice(-7)
  state.ml_last7Queries = last7.reduce((s, d) => s + d.queries, 0)

  // Generate new query history
  const platforms = ['1688', '淘宝', '京东', '拼多多', 'eBay']
  const confidenceOptions: QueryHistory['confidence'][] = ['实时采集', '缓存数据', 'AI估算']
  const opportunityOptions: QueryHistory['opportunity'][] = ['建议进入', '谨慎进入', '不建议进入']
  const queryTemplates = [
    (p: string) => `搜索${p}蓝牙耳机市场行情`,
    (p: string) => `${p}宠物自动喂食器价格扫描`,
    (p: string) => `${p}护眼台灯品牌集中度`,
    (p: string) => `${p}瑜伽垫销量排行分析`,
    (p: string) => `${p}空气加湿器评价分析`,
    (p: string) => `${p}收纳盒爆款特征拆解`,
    (p: string) => `eBay 户外露营市场容量`,
    (p: string) => `1688 保温杯代工价格对比`,
    (p: string) => `${p}运动短袖退货率分析`,
    (p: string) => `${p}筋膜枪竞品价格追踪`,
  ]

  const newHistory: QueryHistory[] = []
  for (let i = 0; i < newHistoryCount; i++) {
    const tpl = pick(queryTemplates)
    const platform = pick(platforms)
    newHistory.push({
      id: `q-${Date.now()}-${i}`,
      query: tpl(platform),
      platform,
      date: simDate,
      results: randomInt(200, 12000),
      reportGenerated: Math.random() > 0.25,
      opportunity: pick(opportunityOptions),
      confidence: pick(confidenceOptions),
    })
  }

  state.ml_queryHistory = [...newHistory, ...state.ml_queryHistory].slice(0, 50)

  // Nudge platform distribution (slight shift)
  const pd = [...state.ml_platformDist]
  const shiftIdx = randomInt(0, pd.length - 1)
  const shift = randomInt(1, 3)
  pd[shiftIdx] = { ...pd[shiftIdx], value: Math.max(3, pd[shiftIdx].value - shift) }
  const gainIdx = (shiftIdx + 1) % pd.length
  pd[gainIdx] = { ...pd[gainIdx], value: pd[gainIdx].value + shift }
  state.ml_platformDist = pd

  // Update category stats (hot categories grow faster)
  const hotCats = ['蓝牙耳机', '宠物用品', '小家电']
  const stats = state.ml_categoryStats.map((s) => ({
    ...s,
    queries: s.queries + (hotCats.includes(s.name) ? randomInt(3, 8) : randomInt(1, 4)),
    collected: s.collected + (hotCats.includes(s.name) ? randomInt(300, 1200) : randomInt(100, 500)),
  }))
  state.ml_categoryStats = stats

  // Update platform comparison (shift window)
  const pc = state.ml_platformComparison.map((p) => ({
    ...p,
    data: [...p.data.slice(1),
      p.name === 'eBay'
        ? randomInt(100, 800)
        : randomInt(300, 3000)
    ],
  }))
  state.ml_platformComparison = pc

  // Slightly shift price distribution
  state.ml_priceDist = state.ml_priceDist.map((p) => ({
    ...p,
    count: p.count + randomInt(-50, 150),
  }))

  // Slightly shift risk distribution
  state.ml_riskDist = state.ml_riskDist.map((r) => ({
    ...r,
    value: Math.max(2, r.value + randomInt(-2, 3)),
  }))
}

function generateInitialState() {
  const products = genProducts()
  const trend14 = gen14DayTrend()
  const history = genQueryHistory(35)

  // Sum up initial cumulative metrics
  const totalQueries = trend14.reduce((s, d) => s + d.queries, 0) + randomInt(200, 500)
  const totalCollected = trend14.reduce((s, d) => s + d.collected, 0) + randomInt(20000, 60000)
  const totalReports = trend14.reduce((s, d) => s + d.reports, 0) + randomInt(100, 300)
  const last7Queries = trend14.slice(-7).reduce((s, d) => s + d.queries, 0)
  const todayCollected = trend14[trend14.length - 1]?.collected ?? randomInt(2000, 9000)

  const dailySales = genDailySales()
  const last7GMV = dailySales.reduce((s, d) => s + d.sales, 0)

  return {
    lastGrowthDate: todayStr(),
    initialized: true,

    // Store Pilot
    sp_todaySales: dailySales[dailySales.length - 1]?.sales ?? randomInt(2800, 9800),
    sp_todayOrders: dailySales[dailySales.length - 1]?.orders ?? randomInt(18, 46),
    sp_inventoryCount: products.reduce((s, p) => s + p.stock, 0),
    sp_attentionItems: randomInt(6, 12),
    sp_badReviews: randomInt(3, 9),
    sp_slowMoving: randomInt(2, 5),
    sp_last7GMV: last7GMV,
    sp_refundRate: parseFloat((3.5 + Math.random() * 5).toFixed(1)),
    sp_alerts: initialAlerts(products),
    sp_dynamics: genDynamics(products, 5, true),
    sp_products: products,
    sp_dailySales: dailySales,

    // Market Lab
    ml_totalQueries: totalQueries,
    ml_totalCollected: totalCollected,
    ml_totalReports: totalReports,
    ml_coveredPlatforms: 5,
    ml_last7Queries: last7Queries,
    ml_todayCollected: todayCollected,
    ml_queryHistory: history,
    ml_dailyTrend14: trend14,
    ml_platformDist: genPlatformDist(),
    ml_categoryStats: genCategoryStats(),
    ml_opportunityRanks: genOpportunityRanks(),
    ml_platformComparison: genPlatformComparison(),
    ml_priceDist: genPriceDist(),
    ml_riskDist: genRiskDist(),
  }
}

// ========= Store =========

export const useDemoDataStore = create<DemoDataState>()(
  persist(
    (set, get) => ({
      lastGrowthDate: null,
      initialized: false,

      sp_todaySales: 0,
      sp_todayOrders: 0,
      sp_inventoryCount: 0,
      sp_attentionItems: 0,
      sp_badReviews: 0,
      sp_slowMoving: 0,
      sp_last7GMV: 0,
      sp_refundRate: 0,
      sp_alerts: [],
      sp_dynamics: [],
      sp_products: [],
      sp_dailySales: [],

      ml_totalQueries: 0,
      ml_totalCollected: 0,
      ml_totalReports: 0,
      ml_coveredPlatforms: 0,
      ml_last7Queries: 0,
      ml_todayCollected: 0,
      ml_queryHistory: [],
      ml_dailyTrend14: [],
      ml_platformDist: [],
      ml_categoryStats: [],
      ml_opportunityRanks: [],
      ml_platformComparison: [],
      ml_priceDist: [],
      ml_riskDist: [],

      ensureGrown: () => {
        const state = get()
        const today = todayStr()

        if (!state.initialized) {
          set(generateInitialState())
          return
        }

        if (!state.lastGrowthDate) {
          set({ lastGrowthDate: today })
          return
        }

        if (state.lastGrowthDate >= today) return

        // Calculate days to grow (capped at 7)
        const last = new Date(state.lastGrowthDate)
        const now = new Date()
        const diffDays = Math.floor((now.getTime() - last.getTime()) / (86400000))
        const growDays = Math.min(diffDays, 7)

        if (growDays <= 0) return

        const current = get()
        for (let i = 0; i < growDays; i++) {
          // Simulate dates from oldest to today: daysAgo(growDays-1), daysAgo(growDays-2), ..., daysAgo(0)
          const simDate = formatDate(daysAgo(growDays - 1 - i))
          growStorePilot(current, simDate)
          growMarketLab(current, simDate)
        }
        set({ ...current, lastGrowthDate: today })
      },

      resetDemoData: () => {
        const fresh = generateInitialState()
        set({ ...fresh, lastGrowthDate: todayStr(), initialized: true })
      },
    }),
    {
      name: 'vertex-demo-storage',
    }
  )
)
