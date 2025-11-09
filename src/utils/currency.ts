/**
 * 货币工具 - 获取国家/地区的当地货币信息
 */

export interface CurrencyInfo {
  code: string // ISO 4217 货币代码
  symbol: string // 货币符号
  name: string // 货币名称（中文）
}

// 国家/地区到货币的映射
const countryCurrencyMap: Record<string, CurrencyInfo> = {
  // 中国
  '中国': { code: 'CNY', symbol: '¥', name: '人民币' },
  'China': { code: 'CNY', symbol: '¥', name: '人民币' },
  'CN': { code: 'CNY', symbol: '¥', name: '人民币' },
  
  // 日本
  '日本': { code: 'JPY', symbol: '¥', name: '日元' },
  'Japan': { code: 'JPY', symbol: '¥', name: '日元' },
  'JP': { code: 'JPY', symbol: '¥', name: '日元' },
  
  // 韩国
  '韩国': { code: 'KRW', symbol: '₩', name: '韩元' },
  'South Korea': { code: 'KRW', symbol: '₩', name: '韩元' },
  'Korea': { code: 'KRW', symbol: '₩', name: '韩元' },
  'KR': { code: 'KRW', symbol: '₩', name: '韩元' },
  
  // 美国
  '美国': { code: 'USD', symbol: '$', name: '美元' },
  'United States': { code: 'USD', symbol: '$', name: '美元' },
  'USA': { code: 'USD', symbol: '$', name: '美元' },
  'US': { code: 'USD', symbol: '$', name: '美元' },
  
  // 欧洲（欧元区）
  '法国': { code: 'EUR', symbol: '€', name: '欧元' },
  'Germany': { code: 'EUR', symbol: '€', name: '欧元' },
  '德国': { code: 'EUR', symbol: '€', name: '欧元' },
  'Italy': { code: 'EUR', symbol: '€', name: '欧元' },
  '意大利': { code: 'EUR', symbol: '€', name: '欧元' },
  'Spain': { code: 'EUR', symbol: '€', name: '欧元' },
  '西班牙': { code: 'EUR', symbol: '€', name: '欧元' },
  'Switzerland': { code: 'CHF', symbol: 'CHF', name: '瑞士法郎' },
  '瑞士': { code: 'CHF', symbol: 'CHF', name: '瑞士法郎' },
  'CH': { code: 'CHF', symbol: 'CHF', name: '瑞士法郎' },
  
  // 英国
  '英国': { code: 'GBP', symbol: '£', name: '英镑' },
  'United Kingdom': { code: 'GBP', symbol: '£', name: '英镑' },
  'UK': { code: 'GBP', symbol: '£', name: '英镑' },
  
  // 东南亚
  '泰国': { code: 'THB', symbol: '฿', name: '泰铢' },
  'Thailand': { code: 'THB', symbol: '฿', name: '泰铢' },
  'TH': { code: 'THB', symbol: '฿', name: '泰铢' },
  
  '新加坡': { code: 'SGD', symbol: 'S$', name: '新加坡元' },
  'Singapore': { code: 'SGD', symbol: 'S$', name: '新加坡元' },
  'SG': { code: 'SGD', symbol: 'S$', name: '新加坡元' },
  
  '马来西亚': { code: 'MYR', symbol: 'RM', name: '马来西亚林吉特' },
  'Malaysia': { code: 'MYR', symbol: 'RM', name: '马来西亚林吉特' },
  'MY': { code: 'MYR', symbol: 'RM', name: '马来西亚林吉特' },
  
  '印度尼西亚': { code: 'IDR', symbol: 'Rp', name: '印尼盾' },
  'Indonesia': { code: 'IDR', symbol: 'Rp', name: '印尼盾' },
  'ID': { code: 'IDR', symbol: 'Rp', name: '印尼盾' },
  
  '越南': { code: 'VND', symbol: '₫', name: '越南盾' },
  'Vietnam': { code: 'VND', symbol: '₫', name: '越南盾' },
  'VN': { code: 'VND', symbol: '₫', name: '越南盾' },
  
  // 澳大利亚
  '澳大利亚': { code: 'AUD', symbol: 'A$', name: '澳元' },
  'Australia': { code: 'AUD', symbol: 'A$', name: '澳元' },
  'AU': { code: 'AUD', symbol: 'A$', name: '澳元' },
  
  // 新西兰
  '新西兰': { code: 'NZD', symbol: 'NZ$', name: '新西兰元' },
  'New Zealand': { code: 'NZD', symbol: 'NZ$', name: '新西兰元' },
  'NZ': { code: 'NZD', symbol: 'NZ$', name: '新西兰元' },
  
  // 印度
  '印度': { code: 'INR', symbol: '₹', name: '印度卢比' },
  'India': { code: 'INR', symbol: '₹', name: '印度卢比' },
  'IN': { code: 'INR', symbol: '₹', name: '印度卢比' },
  
  // 俄罗斯
  '俄罗斯': { code: 'RUB', symbol: '₽', name: '俄罗斯卢布' },
  'Russia': { code: 'RUB', symbol: '₽', name: '俄罗斯卢布' },
  'RU': { code: 'RUB', symbol: '₽', name: '俄罗斯卢布' },
  
  // 土耳其
  '土耳其': { code: 'TRY', symbol: '₺', name: '土耳其里拉' },
  'Turkey': { code: 'TRY', symbol: '₺', name: '土耳其里拉' },
  'TR': { code: 'TRY', symbol: '₺', name: '土耳其里拉' },
  
  // 埃及
  '埃及': { code: 'EGP', symbol: 'E£', name: '埃及镑' },
  'Egypt': { code: 'EGP', symbol: 'E£', name: '埃及镑' },
  'EG': { code: 'EGP', symbol: 'E£', name: '埃及镑' },
  
  // 巴西
  '巴西': { code: 'BRL', symbol: 'R$', name: '巴西雷亚尔' },
  'Brazil': { code: 'BRL', symbol: 'R$', name: '巴西雷亚尔' },
  'BR': { code: 'BRL', symbol: 'R$', name: '巴西雷亚尔' },
  
  // 墨西哥
  '墨西哥': { code: 'MXN', symbol: 'Mex$', name: '墨西哥比索' },
  'Mexico': { code: 'MXN', symbol: 'Mex$', name: '墨西哥比索' },
  'MX': { code: 'MXN', symbol: 'Mex$', name: '墨西哥比索' },
  
  // 加拿大
  '加拿大': { code: 'CAD', symbol: 'C$', name: '加元' },
  'Canada': { code: 'CAD', symbol: 'C$', name: '加元' },
  'CA': { code: 'CAD', symbol: 'C$', name: '加元' },
  
  // 阿根廷
  '阿根廷': { code: 'ARS', symbol: '$', name: '阿根廷比索' },
  'Argentina': { code: 'ARS', symbol: '$', name: '阿根廷比索' },
  'AR': { code: 'ARS', symbol: '$', name: '阿根廷比索' },
  
  // 智利
  '智利': { code: 'CLP', symbol: '$', name: '智利比索' },
  'Chile': { code: 'CLP', symbol: '$', name: '智利比索' },
  'CL': { code: 'CLP', symbol: '$', name: '智利比索' },
  
  // 秘鲁
  '秘鲁': { code: 'PEN', symbol: 'S/', name: '秘鲁索尔' },
  'Peru': { code: 'PEN', symbol: 'S/', name: '秘鲁索尔' },
  'PE': { code: 'PEN', symbol: 'S/', name: '秘鲁索尔' },
  
  // 哥伦比亚
  '哥伦比亚': { code: 'COP', symbol: '$', name: '哥伦比亚比索' },
  'Colombia': { code: 'COP', symbol: '$', name: '哥伦比亚比索' },
  'CO': { code: 'COP', symbol: '$', name: '哥伦比亚比索' },
  
  // 尼泊尔
  '尼泊尔': { code: 'NPR', symbol: '₨', name: '尼泊尔卢比' },
  'Nepal': { code: 'NPR', symbol: '₨', name: '尼泊尔卢比' },
  'NP': { code: 'NPR', symbol: '₨', name: '尼泊尔卢比' },
  
  // 冰岛
  '冰岛': { code: 'ISK', symbol: 'kr', name: '冰岛克朗' },
  'Iceland': { code: 'ISK', symbol: 'kr', name: '冰岛克朗' },
  'IS': { code: 'ISK', symbol: 'kr', name: '冰岛克朗' },
  
  // 挪威
  '挪威': { code: 'NOK', symbol: 'kr', name: '挪威克朗' },
  'Norway': { code: 'NOK', symbol: 'kr', name: '挪威克朗' },
  'NO': { code: 'NOK', symbol: 'kr', name: '挪威克朗' },
  
  // 瑞典
  '瑞典': { code: 'SEK', symbol: 'kr', name: '瑞典克朗' },
  'Sweden': { code: 'SEK', symbol: 'kr', name: '瑞典克朗' },
  'SE': { code: 'SEK', symbol: 'kr', name: '瑞典克朗' },
  
  // 丹麦
  '丹麦': { code: 'DKK', symbol: 'kr', name: '丹麦克朗' },
  'Denmark': { code: 'DKK', symbol: 'kr', name: '丹麦克朗' },
  'DK': { code: 'DKK', symbol: 'kr', name: '丹麦克朗' },
  
  // 法属波利尼西亚（大溪地）
  '法属波利尼西亚': { code: 'XPF', symbol: 'F', name: '太平洋法郎' },
  'French Polynesia': { code: 'XPF', symbol: 'F', name: '太平洋法郎' },
  'PF': { code: 'XPF', symbol: 'F', name: '太平洋法郎' },
  '大溪地': { code: 'XPF', symbol: 'F', name: '太平洋法郎' },
  'Tahiti': { code: 'XPF', symbol: 'F', name: '太平洋法郎' },
  '波拉波拉': { code: 'XPF', symbol: 'F', name: '太平洋法郎' },
  'Bora Bora': { code: 'XPF', symbol: 'F', name: '太平洋法郎' },
  
  // 波兰
  '波兰': { code: 'PLN', symbol: 'zł', name: '波兰兹罗提' },
  'Poland': { code: 'PLN', symbol: 'zł', name: '波兰兹罗提' },
  'PL': { code: 'PLN', symbol: 'zł', name: '波兰兹罗提' },
  
  // 捷克
  '捷克': { code: 'CZK', symbol: 'Kč', name: '捷克克朗' },
  'Czech Republic': { code: 'CZK', symbol: 'Kč', name: '捷克克朗' },
  'Czech': { code: 'CZK', symbol: 'Kč', name: '捷克克朗' },
  'CZ': { code: 'CZK', symbol: 'Kč', name: '捷克克朗' },
  
  // 匈牙利
  '匈牙利': { code: 'HUF', symbol: 'Ft', name: '匈牙利福林' },
  'Hungary': { code: 'HUF', symbol: 'Ft', name: '匈牙利福林' },
  'HU': { code: 'HUF', symbol: 'Ft', name: '匈牙利福林' },
  
  // 南非
  '南非': { code: 'ZAR', symbol: 'R', name: '南非兰特' },
  'South Africa': { code: 'ZAR', symbol: 'R', name: '南非兰特' },
  'ZA': { code: 'ZAR', symbol: 'R', name: '南非兰特' },
}

const splitLocationTokens = (destination: string): string[] => {
  if (!destination) return []

  const cleaned = destination
    .replace(/[()（）]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned) return []

  const intermediate = cleaned
    .split(/[·•|]/)
    .flatMap(part => part.split(/[,，]/))
    .flatMap(part => part.split(/、/))
    .map(part => part.trim())
    .filter(Boolean)

  const tokens: string[] = []
  intermediate.forEach(part => {
    part.split('/').forEach(item => {
      const token = item.trim()
      if (token) tokens.push(token)
    })
  })

  // 去重但保留顺序
  return Array.from(new Set(tokens))
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

  const tokens = splitLocationTokens(destination)
  for (let i = tokens.length - 1; i >= 0; i--) {
    const token = tokens[i]!
    if (countryCurrencyMap[token]) {
      return token
    }
  }

  // 直接匹配国家名称
  const normalized = destination.trim()
  if (countryCurrencyMap[normalized]) {
    return normalized
  }

  return null
}

/**
 * 获取目的地的货币信息
 */
export function getCurrencyForDestination(destination: string): CurrencyInfo {
  if (!destination || !destination.trim()) {
    return { code: 'CNY', symbol: '¥', name: '人民币' }
  }
  
  // 1. 先尝试提取国家信息（从括号、逗号等格式）
  const country = extractCountryFromDestination(destination)
  if (country && countryCurrencyMap[country]) {
    return countryCurrencyMap[country]
  }
  
  const tokens = splitLocationTokens(destination)
  for (const token of tokens) {
    if (countryCurrencyMap[token]) {
      return countryCurrencyMap[token]
    }
  }

  // 2. 直接匹配整个字符串（可能是国家名称）
  const trimmed = destination.trim()
  if (countryCurrencyMap[trimmed]) {
    return countryCurrencyMap[trimmed]
  }
  
  // 3. 尝试从字符串中查找国家关键词（不区分大小写）
  const normalized = destination.toLowerCase()
  // 按长度排序，优先匹配长名称（如 "United States" 优先于 "US"）
  const sortedEntries = Object.entries(countryCurrencyMap).sort((a, b) => b[0].length - a[0].length)
  
  for (const [key, currency] of sortedEntries) {
    const keyLower = key.toLowerCase()
    // 完整匹配或包含匹配
    if (normalized === keyLower || normalized.includes(keyLower)) {
      return currency
    }
  }
  
  // 4. 默认返回人民币
  return { code: 'CNY', symbol: '¥', name: '人民币' }
}

/**
 * 格式化金额显示
 */
export function formatCurrency(amount: number | string | null | undefined, currency: CurrencyInfo): string {
  // 处理非数字类型
  if (amount == null || amount === '') {
    return `${currency.symbol}0`
  }
  
  const numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount))
  
  // 如果转换后仍不是有效数字，返回0
  if (isNaN(numAmount)) {
    return `${currency.symbol}0`
  }
  
  // 对于日元、韩元、越南盾、印尼盾等小面额货币，不显示小数点
  const noDecimalCurrencies = ['JPY', 'KRW', 'VND', 'IDR']
  if (noDecimalCurrencies.includes(currency.code)) {
    return `${currency.symbol}${Math.round(numAmount)}`
  }
  
  // 其他货币保留两位小数
  return `${currency.symbol}${numAmount.toFixed(2)}`
}

/**
 * 获取所有可用货币列表（去重）
 */
export function getAllCurrencies(): CurrencyInfo[] {
  const currencyMap = new Map<string, CurrencyInfo>()
  
  // 从映射中提取所有货币（去重）
  Object.values(countryCurrencyMap).forEach(currency => {
    if (!currencyMap.has(currency.code)) {
      currencyMap.set(currency.code, currency)
    }
  })
  
  // 按货币代码排序
  return Array.from(currencyMap.values()).sort((a, b) => a.code.localeCompare(b.code))
}

/**
 * 根据货币代码获取货币信息
 */
export function getCurrencyByCode(code: string): CurrencyInfo | null {
  const allCurrencies = getAllCurrencies()
  return allCurrencies.find(c => c.code === code) || null
}

