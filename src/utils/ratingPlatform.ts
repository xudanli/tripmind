/**
 * 评分平台工具 - 根据目的地国家/地区返回合适的参考网站
 */

export interface RatingPlatformInfo {
  name: string // 平台名称（中文）
  nameEn: string // 平台名称（英文）
  code: string // 平台代码
  url?: string // 平台URL模板（可选）
}

// 国家/地区到评分平台的映射
const countryPlatformMap: Record<string, RatingPlatformInfo> = {
  // 中国
  '中国': { name: '大众点评', nameEn: 'Dianping', code: 'dianping' },
  'China': { name: '大众点评', nameEn: 'Dianping', code: 'dianping' },
  'CN': { name: '大众点评', nameEn: 'Dianping', code: 'dianping' },
  
  // 美国、加拿大
  '美国': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'United States': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'USA': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'US': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  '加拿大': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'Canada': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'CA': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  
  // 欧洲国家（主要使用 TripAdvisor）
  '英国': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'United Kingdom': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'UK': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  '法国': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'France': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  '德国': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'Germany': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  '意大利': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'Italy': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  '西班牙': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'Spain': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  
  // 日本
  '日本': { name: '食べログ', nameEn: 'Tabelog', code: 'tabelog' },
  'Japan': { name: '食べログ', nameEn: 'Tabelog', code: 'tabelog' },
  'JP': { name: '食べログ', nameEn: 'Tabelog', code: 'tabelog' },
  
  // 韩国
  '韩国': { name: '네이버', nameEn: 'Naver', code: 'naver' },
  'South Korea': { name: '네이버', nameEn: 'Naver', code: 'naver' },
  'Korea': { name: '네이버', nameEn: 'Naver', code: 'naver' },
  'KR': { name: '네이버', nameEn: 'Naver', code: 'naver' },
  
  // 东南亚
  '泰国': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'Thailand': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'TH': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  '新加坡': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'Singapore': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'SG': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  '马来西亚': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'Malaysia': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'MY': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  '印度尼西亚': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'Indonesia': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'ID': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  '越南': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'Vietnam': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'VN': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  
  // 中东和北非
  '埃及': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'Egypt': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'EG': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  '土耳其': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'Turkey': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'TR': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  
  // 其他地区（默认使用 TripAdvisor）
  '印度': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'India': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'IN': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  '澳大利亚': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'Australia': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'AU': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  '新西兰': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'New Zealand': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'NZ': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  '巴西': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'Brazil': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'BR': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  '墨西哥': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'Mexico': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
  'MX': { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' },
}

/**
 * 从目的地字符串中提取国家信息（复用 currency.ts 的逻辑）
 */
function extractCountryFromDestination(destination: string): string | null {
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
  if (countryPlatformMap[normalized]) {
    return normalized
  }
  
  return null
}

/**
 * 获取目的地的评分平台信息
 */
export function getRatingPlatformForDestination(destination: string): RatingPlatformInfo {
  const country = extractCountryFromDestination(destination)
  
  if (country && countryPlatformMap[country]) {
    return countryPlatformMap[country]
  }
  
  // 尝试从目的地字符串中查找国家关键词
  const normalized = destination.toLowerCase()
  for (const [key, platform] of Object.entries(countryPlatformMap)) {
    if (normalized.includes(key.toLowerCase())) {
      return platform
    }
  }
  
  // 默认返回 TripAdvisor（全球通用）
  return { name: 'TripAdvisor', nameEn: 'TripAdvisor', code: 'tripadvisor' }
}

/**
 * 获取评分平台的显示名称（根据语言）
 */
export function getRatingPlatformName(platformCode: string, language: string = 'zh-CN'): string {
  const isEnglish = language.startsWith('en')
  
  for (const platform of Object.values(countryPlatformMap)) {
    if (platform.code === platformCode) {
      return isEnglish ? platform.nameEn : platform.name
    }
  }
  
  // 如果未找到，返回默认值
  return isEnglish ? 'TripAdvisor' : 'TripAdvisor'
}


