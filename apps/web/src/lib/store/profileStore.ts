import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface MerchantProfile {
  name: string
  experience: string // 新手（<1年）| 初级（1-3年）| 中级（3-5年）| 资深（>5年）
  budget: string     // < 1万 | 1-5万 | 5-20万 | 20-50万 | > 50万
  risk: string       // 保守型 | 稳健型 | 进取型
  targetPlatforms: string[]
  hasSupplier: boolean
}

export interface CashSafetyLine {
  maxInvestment: number       // 最大可投入金额
  safeUnitPrice: number       // 安全单价上限
  suggestedSKUCount: number   // 建议SKU数
  minROI: number              // 最低ROI要求
  paybackDays: number         // 回正天数上限
  warningMessage?: string     // 风险提示
}

interface ProfileState {
  profile: MerchantProfile
  onboardingCompleted: boolean
  setProfile: (profile: Partial<MerchantProfile>) => void
  resetProfile: () => void
  completeOnboarding: () => void
  getCashSafetyLine: () => CashSafetyLine
}

const defaultProfile: MerchantProfile = {
  name: '',
  experience: '',
  budget: '',
  risk: '',
  targetPlatforms: [],
  hasSupplier: false,
}

/** Parse budget string to a numeric range */
function parseBudget(budget: string): { min: number; max: number } {
  switch (budget) {
    case '< 1万': return { min: 0, max: 10000 }
    case '1-5万': return { min: 10000, max: 50000 }
    case '5-20万': return { min: 50000, max: 200000 }
    case '20-50万': return { min: 200000, max: 500000 }
    case '> 50万': return { min: 500000, max: 1000000 }
    default: return { min: 0, max: 0 }
  }
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: { ...defaultProfile },
      onboardingCompleted: false,

      setProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates },
        })),

      resetProfile: () =>
        set({ profile: { ...defaultProfile }, onboardingCompleted: false }),

      completeOnboarding: () => set({ onboardingCompleted: true }),

      getCashSafetyLine: () => {
        const { profile } = get()
        const budget = parseBudget(profile.budget)
        const totalCapital = budget.max

        // Risk-based multipliers
        const riskMultiplier = profile.risk === '保守型' ? 0.3
          : profile.risk === '稳健型' ? 0.5
          : 0.7 // 进取型

        // Experience discount
        const expDiscount = profile.experience === '新手（<1年）' ? 0.6
          : profile.experience === '初级（1-3年）' ? 0.75
          : profile.experience === '中级（3-5年）' ? 0.85
          : 1.0

        const maxInvestment = Math.round(totalCapital * riskMultiplier * expDiscount)

        // Safe unit price based on experience
        const safeUnitPrice = profile.experience.startsWith('新手')
          ? Math.round(maxInvestment * 0.02) // 新品单价不超过总投入的2%
          : Math.round(maxInvestment * 0.05)

        // Suggested SKU count
        const suggestedSKUCount = profile.experience.startsWith('新手')
          ? Math.min(3, Math.max(1, Math.floor(totalCapital / 5000)))
          : Math.min(10, Math.max(2, Math.floor(totalCapital / 10000)))

        // Minimum ROI based on risk tolerance
        const minROI = profile.risk === '保守型' ? 0.5
          : profile.risk === '稳健型' ? 0.3
          : 0.15

        // Payback days
        const paybackDays = profile.risk === '保守型' ? 30
          : profile.risk === '稳健型' ? 45
          : 60

        const warningMessage = maxInvestment < 5000
          ? '⚠️ 您的可用资金较少，建议从低客单价品类切入，严格控制首单库存量'
          : !profile.hasSupplier && profile.experience.startsWith('新手')
          ? '💡 建议先找到稳定货源再大规模投入，可先在1688上筛选样品'
          : undefined

        return { maxInvestment, safeUnitPrice, suggestedSKUCount, minROI, paybackDays, warningMessage }
      },
    }),
    {
      name: 'vertex-profile-storage',
      partialize: (state) => ({
        profile: state.profile,
        onboardingCompleted: state.onboardingCompleted,
      }),
    }
  )
)
