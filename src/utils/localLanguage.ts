/**
 * 当地语言工具 - 获取国家/地区的当地语言
 */

export interface LocalLanguageInfo {
  code: string // 语言代码
  name: string // 语言名称（中文）
  nativeName: string // 当地语言名称
}

// 国家/地区到语言的映射
const countryLanguageMap: Record<string, LocalLanguageInfo> = {
  // 中国
  '中国': { code: 'zh-CN', name: '中文', nativeName: '中文' },
  'China': { code: 'zh-CN', name: '中文', nativeName: '中文' },
  'CN': { code: 'zh-CN', name: '中文', nativeName: '中文' },
  
  // 日本
  '日本': { code: 'ja', name: '日语', nativeName: '日本語' },
  'Japan': { code: 'ja', name: '日语', nativeName: '日本語' },
  'JP': { code: 'ja', name: '日语', nativeName: '日本語' },
  
  // 韩国
  '韩国': { code: 'ko', name: '韩语', nativeName: '한국어' },
  'South Korea': { code: 'ko', name: '韩语', nativeName: '한국어' },
  'Korea': { code: 'ko', name: '韩语', nativeName: '한국어' },
  'KR': { code: 'ko', name: '韩语', nativeName: '한국어' },
  
  // 美国
  '美国': { code: 'en', name: '英语', nativeName: 'English' },
  'United States': { code: 'en', name: '英语', nativeName: 'English' },
  'USA': { code: 'en', name: '英语', nativeName: 'English' },
  'US': { code: 'en', name: '英语', nativeName: 'English' },
  
  // 欧洲
  '法国': { code: 'fr', name: '法语', nativeName: 'Français' },
  'France': { code: 'fr', name: '法语', nativeName: 'Français' },
  'FR': { code: 'fr', name: '法语', nativeName: 'Français' },
  
  '德国': { code: 'de', name: '德语', nativeName: 'Deutsch' },
  'Germany': { code: 'de', name: '德语', nativeName: 'Deutsch' },
  'DE': { code: 'de', name: '德语', nativeName: 'Deutsch' },
  
  '意大利': { code: 'it', name: '意大利语', nativeName: 'Italiano' },
  'Italy': { code: 'it', name: '意大利语', nativeName: 'Italiano' },
  'IT': { code: 'it', name: '意大利语', nativeName: 'Italiano' },
  
  '西班牙': { code: 'es', name: '西班牙语', nativeName: 'Español' },
  'Spain': { code: 'es', name: '西班牙语', nativeName: 'Español' },
  'ES': { code: 'es', name: '西班牙语', nativeName: 'Español' },
  
  '瑞士': { code: 'de', name: '德语', nativeName: 'Deutsch' }, // 瑞士主要使用德语
  'Switzerland': { code: 'de', name: '德语', nativeName: 'Deutsch' },
  'CH': { code: 'de', name: '德语', nativeName: 'Deutsch' },
  
  '英国': { code: 'en', name: '英语', nativeName: 'English' },
  'United Kingdom': { code: 'en', name: '英语', nativeName: 'English' },
  'UK': { code: 'en', name: '英语', nativeName: 'English' },
  
  // 东南亚
  '泰国': { code: 'th', name: '泰语', nativeName: 'ไทย' },
  'Thailand': { code: 'th', name: '泰语', nativeName: 'ไทย' },
  'TH': { code: 'th', name: '泰语', nativeName: 'ไทย' },
  
  '新加坡': { code: 'en', name: '英语', nativeName: 'English' }, // 新加坡主要使用英语
  'Singapore': { code: 'en', name: '英语', nativeName: 'English' },
  'SG': { code: 'en', name: '英语', nativeName: 'English' },
  
  '马来西亚': { code: 'ms', name: '马来语', nativeName: 'Bahasa Melayu' },
  'Malaysia': { code: 'ms', name: '马来语', nativeName: 'Bahasa Melayu' },
  'MY': { code: 'ms', name: '马来语', nativeName: 'Bahasa Melayu' },
  
  '印度尼西亚': { code: 'id', name: '印尼语', nativeName: 'Bahasa Indonesia' },
  'Indonesia': { code: 'id', name: '印尼语', nativeName: 'Bahasa Indonesia' },
  'ID': { code: 'id', name: '印尼语', nativeName: 'Bahasa Indonesia' },
  
  '越南': { code: 'vi', name: '越南语', nativeName: 'Tiếng Việt' },
  'Vietnam': { code: 'vi', name: '越南语', nativeName: 'Tiếng Việt' },
  'VN': { code: 'vi', name: '越南语', nativeName: 'Tiếng Việt' },
  
  // 澳大利亚
  '澳大利亚': { code: 'en', name: '英语', nativeName: 'English' },
  'Australia': { code: 'en', name: '英语', nativeName: 'English' },
  'AU': { code: 'en', name: '英语', nativeName: 'English' },
  
  // 新西兰
  '新西兰': { code: 'en', name: '英语', nativeName: 'English' },
  'New Zealand': { code: 'en', name: '英语', nativeName: 'English' },
  'NZ': { code: 'en', name: '英语', nativeName: 'English' },
  
  // 印度
  '印度': { code: 'hi', name: '印地语', nativeName: 'हिन्दी' },
  'India': { code: 'hi', name: '印地语', nativeName: 'हिन्दी' },
  'IN': { code: 'hi', name: '印地语', nativeName: 'हिन्दी' },
  
  // 俄罗斯
  '俄罗斯': { code: 'ru', name: '俄语', nativeName: 'Русский' },
  'Russia': { code: 'ru', name: '俄语', nativeName: 'Русский' },
  'RU': { code: 'ru', name: '俄语', nativeName: 'Русский' },
  
  // 土耳其
  '土耳其': { code: 'tr', name: '土耳其语', nativeName: 'Türkçe' },
  'Turkey': { code: 'tr', name: '土耳其语', nativeName: 'Türkçe' },
  'TR': { code: 'tr', name: '土耳其语', nativeName: 'Türkçe' },
  
  // 埃及
  '埃及': { code: 'ar', name: '阿拉伯语', nativeName: 'العربية' },
  'Egypt': { code: 'ar', name: '阿拉伯语', nativeName: 'العربية' },
  'EG': { code: 'ar', name: '阿拉伯语', nativeName: 'العربية' },
  
  // 巴西
  '巴西': { code: 'pt', name: '葡萄牙语', nativeName: 'Português' },
  'Brazil': { code: 'pt', name: '葡萄牙语', nativeName: 'Português' },
  'BR': { code: 'pt', name: '葡萄牙语', nativeName: 'Português' },
  
  // 墨西哥
  '墨西哥': { code: 'es', name: '西班牙语', nativeName: 'Español' },
  'Mexico': { code: 'es', name: '西班牙语', nativeName: 'Español' },
  'MX': { code: 'es', name: '西班牙语', nativeName: 'Español' },
  
  // 加拿大
  '加拿大': { code: 'en', name: '英语', nativeName: 'English' }, // 主要使用英语
  'Canada': { code: 'en', name: '英语', nativeName: 'English' },
  'CA': { code: 'en', name: '英语', nativeName: 'English' },
}

/**
 * 从目的地字符串中提取国家信息
 */
export function extractCountryFromDestination(destination: string): string | null {
  if (!destination) return null
  
  // 尝试从常见格式中提取：如 "北京 (中国)" 或 "Paris, France"
  const patterns = [
    /\(([^)]+)\)/, // 括号内的内容
    /,\s*([^,]+)$/, // 逗号后的内容
    /-\s*([^-]+)$/, // 横线后的内容
  ]
  
  for (const pattern of patterns) {
    const match = destination.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  
  // 直接匹配国家名称
  const normalized = destination.trim()
  if (countryLanguageMap[normalized]) {
    return normalized
  }
  
  return null
}

/**
 * 获取目的地的当地语言信息
 */
export function getLocalLanguageForDestination(destination: string): LocalLanguageInfo {
  const country = extractCountryFromDestination(destination)
  
  if (country && countryLanguageMap[country]) {
    return countryLanguageMap[country]
  }
  
  // 尝试从目的地字符串中查找国家关键词
  const normalized = destination.toLowerCase()
  for (const [key, language] of Object.entries(countryLanguageMap)) {
    if (normalized.includes(key.toLowerCase())) {
      return language
    }
  }
  
  // 默认返回中文
  return { code: 'zh-CN', name: '中文', nativeName: '中文' }
}

