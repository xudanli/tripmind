// 轻量国家识别：从 locale 与地点名推断国家

export function detectCountryFromLocale(locale?: string): string | undefined {
  if (!locale) return undefined
  const parts = locale.split('-')
  const region = parts[1]?.toUpperCase()
  if (!region) return undefined
  const map: Record<string, string> = {
    CN: '中国',
    HK: '中国香港',
    TW: '中国台湾',
    MO: '中国澳门',
    US: '美国',
    GB: '英国',
    JP: '日本',
    KR: '韩国',
    FR: '法国',
    DE: '德国',
    IT: '意大利',
    ES: '西班牙',
    PT: '葡萄牙',
    TH: '泰国',
    VN: '越南',
    SG: '新加坡',
    MY: '马来西亚',
    ID: '印度尼西亚',
    IN: '印度',
    AU: '澳大利亚',
    NZ: '新西兰',
    CA: '加拿大'
  }
  return map[region]
}

// 常见地点到国家的简单映射（可逐步扩充）
const LOCATION_COUNTRY_MAP: Record<string, string> = {
  北京: '中国',
  上海: '中国',
  成都: '中国',
  西藏: '中国',
  拉萨: '中国',
  冈仁波齐: '中国',
  珠峰: '中国/尼泊尔',
  东京: '日本',
  京都: '日本',
  大阪: '日本',
  首尔: '韩国',
  釜山: '韩国',
  曼谷: '泰国',
  清迈: '泰国',
  普吉: '泰国',
  巴黎: '法国',
  罗马: '意大利',
  米兰: '意大利',
  巴塞罗那: '西班牙',
  里斯本: '葡萄牙',
  伦敦: '英国',
  纽约: '美国',
  洛杉矶: '美国',
  旧金山: '美国',
  新加坡: '新加坡',
  吉隆坡: '马来西亚',
  巴厘岛: '印度尼西亚',
  峇里岛: '印度尼西亚',
  雅典: '希腊',
  圣托里尼: '希腊',
}

export function detectCountryForLocation(location?: string): string | undefined {
  if (!location) return undefined
  // 直接命中
  if (LOCATION_COUNTRY_MAP[location]) return LOCATION_COUNTRY_MAP[location]
  // 简单规则：包含国家名
  const countryKeywords = Object.values(LOCATION_COUNTRY_MAP)
  const hit = countryKeywords.find(c => location.includes(c))
  if (hit) return hit
  // 英文地名部分常见映射（极简）
  const lower = location.toLowerCase()
  if (/(tokyo|kyoto|osaka)/.test(lower)) return '日本'
  if (/(seoul|busan)/.test(lower)) return '韩国'
  if (/(paris)/.test(lower)) return '法国'
  if (/(rome|milan)/.test(lower)) return '意大利'
  if (/(barcelona)/.test(lower)) return '西班牙'
  if (/(london)/.test(lower)) return '英国'
  if (/(new york|los angeles|san francisco)/.test(lower)) return '美国'
  if (/(bangkok|chiang mai|phuket)/.test(lower)) return '泰国'
  if (/(bali|denpasar|ubud)/.test(lower)) return '印度尼西亚'
  return undefined
}

export function buildLocationCountries(locations?: string[]): Record<string, string> | undefined {
  if (!locations || locations.length === 0) return undefined
  const out: Record<string, string> = {}
  locations.forEach(loc => {
    const c = detectCountryForLocation(loc)
    if (c) out[loc] = c
  })
  return Object.keys(out).length > 0 ? out : undefined
}


