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
  // 申请链接（官方签证申请网站）
  applicationUrl?: string
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
      description: '需要提前申请签证，但签证流程相对简化',
      applicationUrl: 'https://www.cn.emb-japan.go.jp/consular/visa_shikaku.htm'
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
      duration: 30,
      applicationUrl: 'https://www.malaysiavisa.com.my/'
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
      duration: 30,
      applicationUrl: 'https://evisa.xuatnhapcanh.gov.vn/'
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
      duration: 180,
      applicationUrl: 'https://www.ustraveldocs.com/cn_zh/'
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
      duration: 30,
      applicationUrl: 'https://www.evisa.gov.tr/'
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
  },
  
  // 冰岛对中国护照的政策
  'IS': {
    'CN': [{
      destinationCountry: 'IS',
      destinationName: '冰岛',
      visaType: 'visa-required',
      applicableTo: '中国护照',
      description: '需要提前申请申根签证（冰岛属于申根区）',
      duration: 90,
      applicationUrl: 'https://www.schengenvisainfo.com/zh/iceland-visa/'
    }],
    'US-PR': [{
      destinationCountry: 'IS',
      destinationName: '冰岛',
      visaType: 'visa-free',
      applicableTo: '美国永久居民',
      description: '美国永久居民免签入境（申根区）',
      duration: 90
    }]
  }
}

/**
 * 校验签证信息是否有效
 * @param visaInfo 签证信息对象
 * @returns 是否有效
 */
export function isValidVisaInfo(visaInfo: any): visaInfo is VisaInfo {
  if (!visaInfo || typeof visaInfo !== 'object') {
    return false
  }
  
  // 检查必要字段
  if (!visaInfo.destinationCountry || typeof visaInfo.destinationCountry !== 'string') {
    return false
  }
  
  if (!visaInfo.destinationName || typeof visaInfo.destinationName !== 'string') {
    return false
  }
  
  if (!visaInfo.visaType || typeof visaInfo.visaType !== 'string') {
    return false
  }
  
  // 校验 visaType 是否为有效值
  const validVisaTypes: VisaType[] = ['visa-free', 'visa-on-arrival', 'e-visa', 'visa-required', 'permanent-resident-benefit']
  if (!validVisaTypes.includes(visaInfo.visaType)) {
    return false
  }
  
  if (!visaInfo.applicableTo || typeof visaInfo.applicableTo !== 'string') {
    return false
  }
  
  // duration 是可选的，但如果存在必须是数字
  if (visaInfo.duration !== undefined && (typeof visaInfo.duration !== 'number' || visaInfo.duration < 0)) {
    return false
  }
  
  // applicationUrl 是可选的，但如果存在必须是字符串
  if (visaInfo.applicationUrl !== undefined && typeof visaInfo.applicationUrl !== 'string') {
    return false
  }
  
  return true
}

/**
 * 获取签证信息
 * @param destinationCountry 目的地国家代码
 * @param nationalityCode 用户国籍代码（如 'CN'）
 * @param permanentResidencyCode 用户永久居民身份国家代码（如 'US'）
 * @returns 签证信息数组（已校验）
 */
export function getVisaInfo(
  destinationCountry: string,
  nationalityCode?: string | null,
  permanentResidencyCode?: string | null
): VisaInfo[] {
  if (!destinationCountry || typeof destinationCountry !== 'string') {
    console.warn('⚠️ getVisaInfo: 无效的目的地国家代码', destinationCountry)
    return []
  }
  
  const destinationVisaInfo = VISA_INFO[destinationCountry]
  if (!destinationVisaInfo) {
    return []
  }
  
  const results: VisaInfo[] = []
  
  // 优先检查永久居民身份（如果有）
  if (permanentResidencyCode) {
    const prKey = `${permanentResidencyCode}-PR`
    if (destinationVisaInfo[prKey]) {
      const prInfos = destinationVisaInfo[prKey]
      // 校验并过滤无效数据
      prInfos.forEach(info => {
        if (isValidVisaInfo(info)) {
          results.push(info)
        } else {
          console.warn('⚠️ getVisaInfo: 发现无效的永久居民签证信息', info)
        }
      })
    }
  }
  
  // 检查国籍（如果没有永久居民身份或永久居民身份未提供便利）
  if (nationalityCode && destinationVisaInfo[nationalityCode]) {
    const nationalityInfos = destinationVisaInfo[nationalityCode]
    // 校验并过滤无效数据
    nationalityInfos.forEach(info => {
      if (isValidVisaInfo(info)) {
        results.push(info)
      } else {
        console.warn('⚠️ getVisaInfo: 发现无效的国籍签证信息', info)
      }
    })
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

/**
 * 签证联盟定义
 * 用于识别多目的地行程是否只需要一个签证
 */
export const VISA_UNIONS: Record<string, {
  name: string
  countries: string[]
  visaName: string
  description: string
}> = {
  'schengen': {
    name: '申根区',
    countries: [
      'AT', // 奥地利
      'BE', // 比利时
      'CZ', // 捷克
      'DK', // 丹麦
      'EE', // 爱沙尼亚
      'FI', // 芬兰
      'FR', // 法国
      'DE', // 德国
      'GR', // 希腊
      'HU', // 匈牙利
      'IS', // 冰岛
      'IT', // 意大利
      'LV', // 拉脱维亚
      'LI', // 列支敦士登
      'LT', // 立陶宛
      'LU', // 卢森堡
      'MT', // 马耳他
      'NL', // 荷兰
      'NO', // 挪威
      'PL', // 波兰
      'PT', // 葡萄牙
      'SK', // 斯洛伐克
      'SI', // 斯洛文尼亚
      'ES', // 西班牙
      'SE', // 瑞典
      'CH', // 瑞士
    ],
    visaName: '申根签证',
    description: '申根区国家之间可以自由通行，只需一个申根签证即可访问所有申根国家'
  },
  'asean': {
    name: '东盟',
    countries: [
      'TH', // 泰国
      'SG', // 新加坡
      'MY', // 马来西亚
      'ID', // 印度尼西亚
      'PH', // 菲律宾
      'VN', // 越南
      'KH', // 柬埔寨
      'LA', // 老挝
      'MM', // 缅甸
      'BN', // 文莱
    ],
    visaName: '东盟签证（部分国家有互免政策）',
    description: '东盟国家之间部分有互免签证政策，但并非所有国家都互免，需要分别查询'
  },
  'gcc': {
    name: '海湾合作委员会',
    countries: [
      'AE', // 阿联酋
      'SA', // 沙特阿拉伯
      'KW', // 科威特
      'QA', // 卡塔尔
      'BH', // 巴林
      'OM', // 阿曼
    ],
    visaName: 'GCC签证（部分国家有互免政策）',
    description: 'GCC国家之间部分有互免签证政策，但并非所有国家都互免'
  }
}

/**
 * 多目的地签证需求分析结果
 */
export interface MultiDestinationVisaResult {
  // 所有目的地国家代码
  allCountries: string[]
  // 按签证联盟分组的目的地
  groupedByUnion: Record<string, {
    unionName: string
    countries: string[]
    visaName: string
    description: string
    needsVisa: boolean
    visaInfo?: VisaInfo[]
  }>
  // 不属于任何联盟的目的地
  standaloneCountries: string[]
  // 综合建议
  summary: string
  // 需要的签证列表
  requiredVisas: Array<{
    type: 'union' | 'standalone'
    name: string
    countries: string[]
    visaInfo?: VisaInfo[]
    description: string
  }>
}

/**
 * 分析多目的地行程的签证需求
 * @param countryCodes 目的地国家代码数组
 * @param nationalityCode 用户国籍代码
 * @param permanentResidencyCode 用户永久居民身份国家代码
 * @returns 签证需求分析结果
 */
export function analyzeMultiDestinationVisa(
  countryCodes: string[],
  nationalityCode?: string | null,
  permanentResidencyCode?: string | null
): MultiDestinationVisaResult {
  // 去重
  const uniqueCountries = Array.from(new Set(countryCodes))
  
  const groupedByUnion: Record<string, {
    unionName: string
    countries: string[]
    visaName: string
    description: string
    needsVisa: boolean
    visaInfo?: VisaInfo[]
  }> = {}
  
  const standaloneCountries: string[] = []
  
  // 检查每个国家属于哪个联盟
  for (const countryCode of uniqueCountries) {
    let found = false
    
    for (const [unionKey, union] of Object.entries(VISA_UNIONS)) {
      if (union.countries.includes(countryCode)) {
        if (!groupedByUnion[unionKey]) {
          groupedByUnion[unionKey] = {
            unionName: union.name,
            countries: [],
            visaName: union.visaName,
            description: union.description,
            needsVisa: false,
            visaInfo: []
          }
        }
        groupedByUnion[unionKey].countries.push(countryCode)
        found = true
        break
      }
    }
    
    if (!found) {
      standaloneCountries.push(countryCode)
    }
  }
  
  // 检查每个联盟是否需要签证
  const requiredVisas: Array<{
    type: 'union' | 'standalone'
    name: string
    countries: string[]
    visaInfo?: VisaInfo[]
    description: string
  }> = []
  
  // 处理联盟
  for (const [unionKey, group] of Object.entries(groupedByUnion)) {
    // 对于申根区，如果所有国家都需要签证，则只需要一个申根签证
    if (unionKey === 'schengen') {
      // 检查是否所有申根国家都需要签证（不是免签或落地签）
      const needsVisa = group.countries.some(country => {
        const visaInfos = getVisaInfo(country, nationalityCode, permanentResidencyCode)
        if (visaInfos.length === 0) return true // 没有数据，假设需要签证
        return visaInfos.some(info => info.visaType === 'visa-required')
      })
      
      group.needsVisa = needsVisa
      
      if (needsVisa) {
        // 获取第一个需要签证的国家的签证信息作为参考
        for (const country of group.countries) {
          const visaInfos = getVisaInfo(country, nationalityCode, permanentResidencyCode)
          const requiredVisa = visaInfos.find(info => info.visaType === 'visa-required')
          if (requiredVisa) {
            group.visaInfo = [requiredVisa]
            break
          }
        }
        
        requiredVisas.push({
          type: 'union',
          name: group.visaName,
          countries: group.countries,
          visaInfo: group.visaInfo,
          description: `访问${group.countries.length}个${group.unionName}国家，只需一个${group.visaName}即可。${group.description}`
        })
      }
    } else {
      // 对于其他联盟（如东盟），需要分别检查每个国家
      for (const country of group.countries) {
        const visaInfos = getVisaInfo(country, nationalityCode, permanentResidencyCode)
        const requiredVisa = visaInfos.find(info => info.visaType === 'visa-required')
        
        if (requiredVisa) {
          requiredVisas.push({
            type: 'standalone',
            name: `${requiredVisa.destinationName}签证`,
            countries: [country],
            visaInfo: [requiredVisa],
            description: `需要申请${requiredVisa.destinationName}签证`
          })
        }
      }
    }
  }
  
  // 处理独立国家
  for (const country of standaloneCountries) {
    const visaInfos = getVisaInfo(country, nationalityCode, permanentResidencyCode)
    const requiredVisa = visaInfos.find(info => info.visaType === 'visa-required')
    
    if (requiredVisa) {
      requiredVisas.push({
        type: 'standalone',
        name: `${requiredVisa.destinationName}签证`,
        countries: [country],
        visaInfo: [requiredVisa],
        description: `需要申请${requiredVisa.destinationName}签证`
      })
    }
  }
  
  // 生成综合建议
  let summary = ''
  if (requiredVisas.length === 0) {
    summary = '✅ 所有目的地对您都是免签或落地签，无需提前申请签证！'
  } else if (requiredVisas.length === 1) {
    const visa = requiredVisas[0]
    if (visa && visa.type === 'union') {
      summary = `✅ 好消息！您访问的${visa.countries.length}个国家都属于${visa.name}，只需申请一个${visa.name}即可。`
    } else if (visa) {
      summary = `⚠️ 您需要申请${visa.name}。`
    }
  } else {
    const unionVisas = requiredVisas.filter(v => v.type === 'union')
    const standaloneVisas = requiredVisas.filter(v => v.type === 'standalone')
    
    if (unionVisas.length > 0 && unionVisas[0]) {
      summary += `✅ 您访问的${unionVisas[0].countries.length}个${unionVisas[0].name}国家只需一个${unionVisas[0].name}。`
    }
    if (standaloneVisas.length > 0) {
      summary += ` 另外，您还需要申请${standaloneVisas.length}个独立国家的签证：${standaloneVisas.map(v => v.name).join('、')}。`
    }
  }
  
  return {
    allCountries: uniqueCountries,
    groupedByUnion,
    standaloneCountries,
    summary,
    requiredVisas
  }
}

/**
 * 从行程数据中提取所有目的地国家代码
 * @param travelData 行程数据
 * @returns 国家代码数组
 */
export function extractAllDestinationCountries(travelData: any): string[] {
  const countries: string[] = []
  
  // 从主目的地提取
  if (travelData?.location) {
    const code = extractCountryCodeFromString(travelData.location)
    if (code) countries.push(code)
  }
  
  if (travelData?.destination) {
    const code = extractCountryCodeFromString(travelData.destination)
    if (code) countries.push(code)
  }
  
  // 从 days 数组中提取
  if (travelData?.days && Array.isArray(travelData.days)) {
    for (const day of travelData.days) {
      if (day.location) {
        const code = extractCountryCodeFromString(day.location)
        if (code) countries.push(code)
      }
      
      // 从 timeSlots 中提取
      if (day.timeSlots && Array.isArray(day.timeSlots)) {
        for (const slot of day.timeSlots) {
          if (slot.location) {
            const code = extractCountryCodeFromString(slot.location)
            if (code) countries.push(code)
          }
        }
      }
    }
  }
  
  // 从 itineraryData 中提取
  if (travelData?.itineraryData?.itinerary && Array.isArray(travelData.itineraryData.itinerary)) {
    for (const day of travelData.itineraryData.itinerary) {
      if (day.activities && Array.isArray(day.activities)) {
        for (const activity of day.activities) {
          if (activity.location) {
            const code = extractCountryCodeFromString(activity.location)
            if (code) countries.push(code)
          }
        }
      }
    }
  }
  
  return Array.from(new Set(countries))
}

/**
 * 从字符串中提取国家代码（辅助函数）
 */
function extractCountryCodeFromString(str: string): string | null {
  if (!str) return null
  
  const strLower = str.toLowerCase()
  
  // 国家别名映射
  const countryAliases: Record<string, string[]> = {
    'US': ['alaska', '阿拉斯加', 'fairbanks', '费尔班克斯', 'usa', 'united states', '美国', 'america'],
    'JP': ['japan', '日本'],
    'KR': ['korea', 'south korea', '韩国'],
    'TH': ['thailand', '泰国'],
    'SG': ['singapore', '新加坡'],
    'MY': ['malaysia', '马来西亚'],
    'ID': ['indonesia', '印尼'],
    'PH': ['philippines', '菲律宾'],
    'VN': ['vietnam', '越南'],
    'AU': ['australia', '澳大利亚'],
    'CA': ['canada', '加拿大'],
    'NZ': ['new zealand', '新西兰'],
    'GB': ['united kingdom', 'uk', '英国', 'britain'],
    'FR': ['france', '法国'],
    'DE': ['germany', '德国'],
    'IT': ['italy', '意大利'],
    'ES': ['spain', '西班牙'],
    'FI': ['finland', '芬兰'],
    'IS': ['iceland', '冰岛', 'reykjavik', '雷克雅未克'],
    'TW': ['taiwan', '台湾'],
    'HK': ['hong kong', '香港'],
    'MO': ['macau', 'macao', '澳门'],
    'AT': ['austria', '奥地利'],
    'BE': ['belgium', '比利时'],
    'CH': ['switzerland', '瑞士'],
    'NL': ['netherlands', '荷兰'],
    'PT': ['portugal', '葡萄牙'],
    'GR': ['greece', '希腊'],
  }
  
  // 遍历所有已知的国家代码
  for (const [code, aliases] of Object.entries(countryAliases)) {
    if (strLower.includes(code.toLowerCase())) return code
    if (aliases.some(alias => strLower.includes(alias.toLowerCase()))) return code
  }
  
  return null
}

