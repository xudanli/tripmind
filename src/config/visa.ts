/**
 * 签证信息配置
 * 维护各国对不同国籍和永久居民的签证政策
 */

export type VisaType = 'visa-free' | 'visa-on-arrival' | 'e-visa' | 'visa-required' | 'permanent-resident-benefit'

export interface VisaInfo {
  // 目的地国家代码
  destinationCountry: string
  // 目的地国家名称
  destinationName: string
  // 签证类型
  visaType: VisaType
  // 适用条件（如：中国护照、美国永久居民等）
  applicableTo: string
  // 说明
  description?: string
  // 停留期限（天数）
  duration?: number
}

/**
 * 签证信息数据库
 * 格式：destinationCountry -> nationality/permanentResidency -> VisaInfo
 */
export const VISA_INFO: Record<string, Record<string, VisaInfo[]>> = {
  // 泰国对中国护照的政策
  'TH': {
    'CN': [{
      destinationCountry: 'TH',
      destinationName: '泰国',
      visaType: 'visa-free',
      applicableTo: '中国护照',
      description: '中国护照持有者免签入境',
      duration: 30
    }],
    'US-PR': [{
      destinationCountry: 'TH',
      destinationName: '泰国',
      visaType: 'visa-free',
      applicableTo: '美国永久居民',
      description: '美国永久居民（绿卡持有者）免签入境',
      duration: 30
    }]
  },
  
  // 日本对中国护照的政策
  'JP': {
    'CN': [{
      destinationCountry: 'JP',
      destinationName: '日本',
      visaType: 'visa-required',
      applicableTo: '中国护照',
      description: '需要提前申请签证，但签证流程相对简化'
    }],
    'US-PR': [{
      destinationCountry: 'JP',
      destinationName: '日本',
      visaType: 'visa-on-arrival',
      applicableTo: '美国永久居民',
      description: '美国永久居民可申请落地签或简化签证流程',
      duration: 15
    }]
  },
  
  // 新加坡对中国护照的政策
  'SG': {
    'CN': [{
      destinationCountry: 'SG',
      destinationName: '新加坡',
      visaType: 'visa-required',
      applicableTo: '中国护照',
      description: '需要提前申请签证'
    }],
    'US-PR': [{
      destinationCountry: 'SG',
      destinationName: '新加坡',
      visaType: 'visa-free',
      applicableTo: '美国永久居民',
      description: '美国永久居民免签入境',
      duration: 30
    }]
  },
  
  // 马来西亚对中国护照的政策
  'MY': {
    'CN': [{
      destinationCountry: 'MY',
      destinationName: '马来西亚',
      visaType: 'e-visa',
      applicableTo: '中国护照',
      description: '可在线申请电子签证（e-Visa）',
      duration: 30
    }],
    'US-PR': [{
      destinationCountry: 'MY',
      destinationName: '马来西亚',
      visaType: 'visa-free',
      applicableTo: '美国永久居民',
      description: '美国永久居民免签入境',
      duration: 90
    }]
  },
  
  // 印度尼西亚对中国护照的政策
  'ID': {
    'CN': [{
      destinationCountry: 'ID',
      destinationName: '印度尼西亚',
      visaType: 'visa-on-arrival',
      applicableTo: '中国护照',
      description: '可落地签，费用约35美元',
      duration: 30
    }],
    'US-PR': [{
      destinationCountry: 'ID',
      destinationName: '印度尼西亚',
      visaType: 'visa-free',
      applicableTo: '美国永久居民',
      description: '美国永久居民免签入境',
      duration: 30
    }]
  },
  
  // 越南对中国护照的政策
  'VN': {
    'CN': [{
      destinationCountry: 'VN',
      destinationName: '越南',
      visaType: 'e-visa',
      applicableTo: '中国护照',
      description: '可在线申请电子签证（e-Visa）',
      duration: 30
    }],
    'US-PR': [{
      destinationCountry: 'VN',
      destinationName: '越南',
      visaType: 'visa-free',
      applicableTo: '美国永久居民',
      description: '美国永久居民免签入境',
      duration: 30
    }]
  },
  
  // 菲律宾对中国护照的政策
  'PH': {
    'CN': [{
      destinationCountry: 'PH',
      destinationName: '菲律宾',
      visaType: 'visa-required',
      applicableTo: '中国护照',
      description: '需要提前申请签证'
    }],
    'US-PR': [{
      destinationCountry: 'PH',
      destinationName: '菲律宾',
      visaType: 'visa-free',
      applicableTo: '美国永久居民',
      description: '美国永久居民免签入境',
      duration: 30
    }]
  },
  
  // 韩国对中国护照的政策
  'KR': {
    'CN': [{
      destinationCountry: 'KR',
      destinationName: '韩国',
      visaType: 'visa-required',
      applicableTo: '中国护照',
      description: '需要提前申请签证，但部分城市（如济州岛）免签'
    }],
    'US-PR': [{
      destinationCountry: 'KR',
      destinationName: '韩国',
      visaType: 'visa-free',
      applicableTo: '美国永久居民',
      description: '美国永久居民免签入境',
      duration: 90
    }]
  },
  
  // 美国对中国护照的政策
  'US': {
    'CN': [{
      destinationCountry: 'US',
      destinationName: '美国',
      visaType: 'visa-required',
      applicableTo: '中国护照',
      description: '需要提前申请签证（B1/B2旅游签证），建议提前2-3个月申请',
      duration: 180
    }],
    'US-PR': [{
      destinationCountry: 'US',
      destinationName: '美国',
      visaType: 'visa-free',
      applicableTo: '美国永久居民',
      description: '美国永久居民（绿卡持有者）无需签证',
      duration: 0
    }]
  },
  
  // 土耳其对中国护照的政策
  'TR': {
    'CN': [{
      destinationCountry: 'TR',
      destinationName: '土耳其',
      visaType: 'e-visa',
      applicableTo: '中国护照',
      description: '可在线申请电子签证（e-Visa）',
      duration: 30
    }],
    'US-PR': [{
      destinationCountry: 'TR',
      destinationName: '土耳其',
      visaType: 'visa-free',
      applicableTo: '美国永久居民',
      description: '美国永久居民免签入境',
      duration: 90
    }]
  },
  
  // 阿联酋对中国护照的政策
  'AE': {
    'CN': [{
      destinationCountry: 'AE',
      destinationName: '阿联酋',
      visaType: 'visa-free',
      applicableTo: '中国护照',
      description: '中国护照持有者免签入境',
      duration: 30
    }],
    'US-PR': [{
      destinationCountry: 'AE',
      destinationName: '阿联酋',
      visaType: 'visa-free',
      applicableTo: '美国永久居民',
      description: '美国永久居民免签入境',
      duration: 30
    }]
  },
  
  // 加拿大对中国护照的政策
  'CA': {
    'CN': [{
      destinationCountry: 'CA',
      destinationName: '加拿大',
      visaType: 'visa-required',
      applicableTo: '中国护照',
      description: '需要提前申请签证'
    }],
    'US-PR': [{
      destinationCountry: 'CA',
      destinationName: '加拿大',
      visaType: 'visa-free',
      applicableTo: '美国永久居民',
      description: '美国永久居民免签入境（需携带绿卡）',
      duration: 180
    }]
  },
  
  // 墨西哥对中国护照的政策
  'MX': {
    'CN': [{
      destinationCountry: 'MX',
      destinationName: '墨西哥',
      visaType: 'visa-required',
      applicableTo: '中国护照',
      description: '需要提前申请签证'
    }],
    'US-PR': [{
      destinationCountry: 'MX',
      destinationName: '墨西哥',
      visaType: 'visa-free',
      applicableTo: '美国永久居民',
      description: '美国永久居民免签入境（需携带绿卡）',
      duration: 180
    }]
  },
  
  // 哥斯达黎加对中国护照的政策
  'CR': {
    'CN': [{
      destinationCountry: 'CR',
      destinationName: '哥斯达黎加',
      visaType: 'visa-required',
      applicableTo: '中国护照',
      description: '需要提前申请签证'
    }],
    'US-PR': [{
      destinationCountry: 'CR',
      destinationName: '哥斯达黎加',
      visaType: 'visa-free',
      applicableTo: '美国永久居民',
      description: '美国永久居民免签入境（需携带绿卡）',
      duration: 90
    }]
  }
}

/**
 * 获取签证信息
 * @param destinationCountry 目的地国家代码
 * @param nationalityCode 用户国籍代码（如 'CN'）
 * @param permanentResidencyCode 用户永久居民身份国家代码（如 'US'）
 * @returns 签证信息数组
 */
export function getVisaInfo(
  destinationCountry: string,
  nationalityCode?: string | null,
  permanentResidencyCode?: string | null
): VisaInfo[] {
  const destinationVisaInfo = VISA_INFO[destinationCountry]
  if (!destinationVisaInfo) {
    return []
  }
  
  const results: VisaInfo[] = []
  
  // 优先检查永久居民身份（如果有）
  if (permanentResidencyCode) {
    const prKey = `${permanentResidencyCode}-PR`
    if (destinationVisaInfo[prKey]) {
      results.push(...destinationVisaInfo[prKey])
    }
  }
  
  // 检查国籍（如果没有永久居民身份或永久居民身份未提供便利）
  if (nationalityCode && destinationVisaInfo[nationalityCode]) {
    results.push(...destinationVisaInfo[nationalityCode])
  }
  
  return results
}

/**
 * 检查目的地是否对用户免签或落地签
 * @param destinationCountry 目的地国家代码
 * @param nationalityCode 用户国籍代码
 * @param permanentResidencyCode 用户永久居民身份国家代码
 * @returns 是否免签或落地签
 */
export function isVisaFreeOrOnArrival(
  destinationCountry: string,
  nationalityCode?: string | null,
  permanentResidencyCode?: string | null
): boolean {
  const visaInfo = getVisaInfo(destinationCountry, nationalityCode, permanentResidencyCode)
  return visaInfo.some(info => 
    info.visaType === 'visa-free' || 
    info.visaType === 'visa-on-arrival' ||
    info.visaType === 'e-visa'
  )
}

/**
 * 获取签证类型描述（用于AI提示词）
 * @param destinationCountry 目的地国家代码
 * @param nationalityCode 用户国籍代码
 * @param permanentResidencyCode 用户永久居民身份国家代码
 * @returns 签证类型描述字符串
 */
export function getVisaDescription(
  destinationCountry: string,
  nationalityCode?: string | null,
  permanentResidencyCode?: string | null
): string | null {
  const visaInfo = getVisaInfo(destinationCountry, nationalityCode, permanentResidencyCode)
  if (visaInfo.length === 0) {
    return null
  }
  
  // 优先使用永久居民身份的签证信息
  const prInfo = visaInfo.find(info => info.applicableTo.includes('永久居民'))
  const info = prInfo || visaInfo[0]
  
  if (!info) {
    return null
  }
  
  const typeMap: Record<VisaType, string> = {
    'visa-free': '免签',
    'visa-on-arrival': '落地签',
    'e-visa': '电子签证',
    'visa-required': '需要提前申请签证',
    'permanent-resident-benefit': '永久居民便利政策'
  }
  
  let description = `${info.destinationName}对${info.applicableTo}：${typeMap[info.visaType]}`
  if (info.description) {
    description += `（${info.description}）`
  }
  if (info.duration) {
    description += `，停留期限：${info.duration}天`
  }
  
  return description
}

/**
 * 获取所有免签或落地签的目的地（用于推荐）
 * @param nationalityCode 用户国籍代码
 * @param permanentResidencyCode 用户永久居民身份国家代码
 * @returns 国家代码数组
 */
export function getVisaFreeDestinations(
  nationalityCode?: string | null,
  permanentResidencyCode?: string | null
): string[] {
  const destinations: string[] = []
  
  Object.keys(VISA_INFO).forEach(destinationCountry => {
    if (isVisaFreeOrOnArrival(destinationCountry, nationalityCode, permanentResidencyCode)) {
      destinations.push(destinationCountry)
    }
  })
  
  return destinations
}

