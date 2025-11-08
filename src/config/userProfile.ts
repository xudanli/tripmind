/**
 * 用户个人信息配置
 * 包括国籍、精通语言等
 */

// 交通方式偏好类型
export type TransportationPreference = 'public_transit_and_walking' | 'driving_and_walking'
export type LLMProvider = 'deepseek' | 'openai'

export interface UserProfileConfig {
  // 用户国籍
  nationality: {
    country: string
    countryCode: string
  } | null
  // 我所在国家（用于推荐目的地）
  location: {
    country: string
    countryCode: string
  } | null
  // 永久居民身份（如绿卡、永久居留权等）
  permanentResidency: {
    country: string
    countryCode: string
  } | null
  // 已持有的签证（国家代码数组）
  heldVisas: string[]
  // 精通的语言列表（可以多选）
  proficientLanguages: string[]
  // 交通方式偏好（默认为公共交通+步行）
  preferredTransportMode?: TransportationPreference
  // 货币偏好（默认为人民币）
  preferredCurrency?: string // ISO 4217 货币代码，如 'CNY', 'USD', 'EUR'
  // 首选大模型提供商
  preferredLLMProvider?: LLMProvider
  // 自定义 OpenAI 模型
  preferredLLMModel?: string
}

// 支持的语言列表
export const SUPPORTED_LANGUAGES = [
  { code: 'zh-CN', name: '中文', nativeName: '中文' },
  { code: 'en-US', name: '英语', nativeName: 'English' },
  { code: 'ja-JP', name: '日语', nativeName: '日本語' },
  { code: 'ko-KR', name: '韩语', nativeName: '한국어' },
  { code: 'fr-FR', name: '法语', nativeName: 'Français' },
  { code: 'de-DE', name: '德语', nativeName: 'Deutsch' },
  { code: 'es-ES', name: '西班牙语', nativeName: 'Español' },
  { code: 'it-IT', name: '意大利语', nativeName: 'Italiano' },
  { code: 'pt-PT', name: '葡萄牙语', nativeName: 'Português' },
  { code: 'ru-RU', name: '俄语', nativeName: 'Русский' },
  { code: 'ar-SA', name: '阿拉伯语', nativeName: 'العربية' },
  { code: 'th-TH', name: '泰语', nativeName: 'ไทย' },
  { code: 'vi-VN', name: '越南语', nativeName: 'Tiếng Việt' },
  { code: 'id-ID', name: '印尼语', nativeName: 'Bahasa Indonesia' },
  { code: 'hi-IN', name: '印地语', nativeName: 'हिन्दी' },
] as const

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code']

// 从 localStorage 读取用户配置
export function getUserProfile(): UserProfileConfig | null {
  const stored = localStorage.getItem('user_profile')
  if (!stored) return null
  
  try {
    return JSON.parse(stored) as UserProfileConfig
  } catch {
    return null
  }
}

// 保存用户配置
export function setUserProfile(config: UserProfileConfig): void {
  localStorage.setItem('user_profile', JSON.stringify(config))
}

// 获取或创建默认用户配置
export function getUserProfileOrDefault(): UserProfileConfig {
  const existing = getUserProfile()
  if (existing) return existing
  
  // 默认配置：未设置国籍，只设置当前界面语言
  const defaultProfile: UserProfileConfig = {
    nationality: null,
    location: null,
    permanentResidency: null,
    heldVisas: [],
    proficientLanguages: ['zh-CN'], // 默认中文
    preferredTransportMode: 'public_transit_and_walking', // 默认：公共交通+短距离步行
    preferredCurrency: 'CNY', // 默认：人民币
    preferredLLMProvider: 'deepseek',
    preferredLLMModel: ''
  }
  
  return defaultProfile
}

// 清除用户配置
export function clearUserProfile(): void {
  localStorage.removeItem('user_profile')
}

// 验证用户配置
export function validateUserProfile(config: any): config is UserProfileConfig {
  if (!config) return false
  
  // 验证国籍（可以为null）
  if (config.nationality !== null) {
    if (!config.nationality || 
        typeof config.nationality.country !== 'string' ||
        typeof config.nationality.countryCode !== 'string') {
      return false
    }
  }
  
  // 验证我所在国家（可以为null）
  if (config.location !== null) {
    if (!config.location || 
        typeof config.location.country !== 'string' ||
        typeof config.location.countryCode !== 'string') {
      return false
    }
  }
  
  // 验证永久居民身份（可以为null）
  if (config.permanentResidency !== null) {
    if (!config.permanentResidency || 
        typeof config.permanentResidency.country !== 'string' ||
        typeof config.permanentResidency.countryCode !== 'string') {
      return false
    }
  }
  
  // 验证已持有签证（必须是数组）
  if (!Array.isArray(config.heldVisas)) {
    return false
  }
  
  // 验证精通语言（必须是数组）
  if (!Array.isArray(config.proficientLanguages)) {
    return false
  }
  
  // 验证语言代码是否有效
  const validCodes = SUPPORTED_LANGUAGES.map(l => l.code) as readonly string[]
  if (!config.proficientLanguages.every((code: string) => (validCodes as string[]).includes(code))) {
    return false
  }
  
  // 验证货币代码（如果存在）
  if (config.preferredCurrency && typeof config.preferredCurrency !== 'string') {
    return false
  }

  if (config.preferredLLMProvider && !['deepseek', 'openai'].includes(config.preferredLLMProvider)) {
    return false
  }

  if (config.preferredLLMModel && typeof config.preferredLLMModel !== 'string') {
    return false
  }
  
  return true
}

// 获取用户国籍国家代码
export function getUserNationalityCode(): string | null {
  const profile = getUserProfile()
  return profile?.nationality?.countryCode || null
}

// 获取我所在国家代码（用于推荐目的地）
export function getUserLocationCode(): string | null {
  const profile = getUserProfile()
  return profile?.location?.countryCode || null
}

// 获取用户永久居民身份国家代码
export function getUserPermanentResidencyCode(): string | null {
  const profile = getUserProfile()
  return profile?.permanentResidency?.countryCode || null
}

// 获取用户已持有的签证国家代码列表
export function getHeldVisas(): string[] {
  const profile = getUserProfile()
  return profile?.heldVisas || []
}

// 获取用户精通的语言代码列表
export function getUserProficientLanguages(): string[] {
  const profile = getUserProfile()
  return profile?.proficientLanguages || ['zh-CN']
}

// 检查用户是否精通某种语言
export function isUserProficientIn(languageCode: string): boolean {
  const proficientLanguages = getUserProficientLanguages()
  return proficientLanguages.includes(languageCode)
}

// 获取用户交通方式偏好
export function getUserTransportPreference(): TransportationPreference {
  const profile = getUserProfile()
  return profile?.preferredTransportMode || 'public_transit_and_walking'
}

// 获取用户货币偏好
export function getUserPreferredCurrency(): string {
  const profile = getUserProfile()
  return profile?.preferredCurrency || 'CNY'
}

export function getUserPreferredLLMProvider(): LLMProvider {
  const profile = getUserProfile()
  return profile?.preferredLLMProvider || 'deepseek'
}

export function getUserPreferredLLMModel(): string {
  const profile = getUserProfile()
  return profile?.preferredLLMModel || ''
}

