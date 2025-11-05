/**
 * 根据目的地推荐最佳行程天数
 */

import { PRESET_COUNTRIES } from '@/constants/countries'

export interface DestinationDaysRecommendation {
  recommendedDays: number
  minDays: number
  maxDays: number
  reason: string
}

/**
 * 根据目的地推荐最佳行程天数
 * 考虑因素：
 * 1. 目的地类型（城市、国家、地区、自然景点等）
 * 2. 目的地大小和复杂度
 * 3. 交通便利性
 * 4. 文化深度
 */
export function getRecommendedDaysForDestination(
  destination: string,
  intentType?: string
): DestinationDaysRecommendation {
  if (!destination || destination.trim() === '' || destination === '待定') {
    // 默认推荐：根据意图类型
    return {
      recommendedDays: intentType === 'extreme_exploration' ? 7 : 
                      intentType === 'emotional_healing' ? 5 : 
                      intentType === 'cultural_exchange' ? 6 : 5,
      minDays: 3,
      maxDays: 10,
      reason: '根据旅行意图推荐'
    }
  }

  const destLower = destination.toLowerCase()
  const destStr = destination

  // 1. 大型国家/地区（需要更多天数）
  const largeCountries = [
    { keywords: ['日本', 'japan', '日本国'], days: 7, min: 5, max: 14, reason: '日本拥有丰富的文化、自然景观和城市体验，建议7-14天深度游' },
    { keywords: ['中国', 'china', '中国'], days: 7, min: 5, max: 30, reason: '中国地域辽阔，不同地区各有特色，建议根据具体目的地安排' },
    { keywords: ['美国', 'usa', 'united states', 'america'], days: 10, min: 7, max: 30, reason: '美国幅员辽阔，建议根据具体区域安排7-30天' },
    { keywords: ['欧洲', 'europe', 'europ'], days: 10, min: 7, max: 30, reason: '欧洲多国，建议根据具体国家安排7-30天' },
    { keywords: ['澳大利亚', 'australia'], days: 10, min: 7, max: 21, reason: '澳大利亚地域广阔，建议7-21天' },
    { keywords: ['新西兰', 'new zealand', '新西兰'], days: 10, min: 7, max: 21, reason: '新西兰自然风光丰富，建议7-21天' },
    { keywords: ['加拿大', 'canada'], days: 10, min: 7, max: 21, reason: '加拿大自然景观多样，建议7-21天' },
  ]

  for (const country of largeCountries) {
    if (country.keywords.some(kw => destLower.includes(kw.toLowerCase()))) {
      return {
        recommendedDays: country.days,
        minDays: country.min,
        maxDays: country.max,
        reason: country.reason
      }
    }
  }

  // 2. 中等国家/地区（5-7天）
  const mediumCountries = [
    { keywords: ['泰国', 'thailand'], days: 6, min: 4, max: 10, reason: '泰国文化丰富，海滩和城市各有特色，建议6-10天' },
    { keywords: ['韩国', 'korea', 'south korea'], days: 5, min: 4, max: 7, reason: '韩国城市和自然景观结合，建议5-7天' },
    { keywords: ['新加坡', 'singapore'], days: 4, min: 3, max: 5, reason: '新加坡城市紧凑，建议3-5天' },
    { keywords: ['马来西亚', 'malaysia'], days: 6, min: 5, max: 10, reason: '马来西亚多元文化，建议6-10天' },
    { keywords: ['印度尼西亚', 'indonesia', '印尼'], days: 7, min: 5, max: 14, reason: '印度尼西亚岛屿众多，建议5-14天' },
    { keywords: ['菲律宾', 'philippines'], days: 6, min: 5, max: 10, reason: '菲律宾海岛丰富，建议6-10天' },
    { keywords: ['越南', 'vietnam'], days: 6, min: 5, max: 10, reason: '越南南北差异大，建议6-10天' },
    { keywords: ['柬埔寨', 'cambodia'], days: 5, min: 4, max: 7, reason: '柬埔寨历史文化丰富，建议5-7天' },
    { keywords: ['缅甸', 'myanmar'], days: 7, min: 5, max: 10, reason: '缅甸文化独特，建议7-10天' },
    { keywords: ['老挝', 'laos'], days: 5, min: 4, max: 7, reason: '老挝宁静自然，建议5-7天' },
    { keywords: ['印度', 'india'], days: 10, min: 7, max: 21, reason: '印度文化深邃，建议7-21天' },
    { keywords: ['尼泊尔', 'nepal'], days: 7, min: 5, max: 14, reason: '尼泊尔自然和文化并重，建议7-14天' },
    { keywords: ['斯里兰卡', 'sri lanka'], days: 7, min: 5, max: 10, reason: '斯里兰卡自然风光丰富，建议7-10天' },
    { keywords: ['土耳其', 'turkey', 'türkiye'], days: 8, min: 6, max: 12, reason: '土耳其横跨欧亚，建议8-12天' },
    { keywords: ['希腊', 'greece'], days: 7, min: 5, max: 12, reason: '希腊岛屿众多，建议7-12天' },
    { keywords: ['意大利', 'italy'], days: 8, min: 6, max: 14, reason: '意大利文化丰富，建议8-14天' },
    { keywords: ['法国', 'france'], days: 8, min: 6, max: 14, reason: '法国文化多样，建议8-14天' },
    { keywords: ['西班牙', 'spain'], days: 7, min: 5, max: 12, reason: '西班牙文化丰富，建议7-12天' },
    { keywords: ['德国', 'germany'], days: 7, min: 5, max: 12, reason: '德国文化深厚，建议7-12天' },
    { keywords: ['英国', 'uk', 'united kingdom', 'britain'], days: 7, min: 5, max: 12, reason: '英国文化丰富，建议7-12天' },
    { keywords: ['瑞士', 'switzerland'], days: 6, min: 5, max: 10, reason: '瑞士自然风光优美，建议6-10天' },
    { keywords: ['奥地利', 'austria'], days: 5, min: 4, max: 8, reason: '奥地利文化丰富，建议5-8天' },
    { keywords: ['冰岛', 'iceland'], days: 7, min: 5, max: 10, reason: '冰岛自然奇观丰富，建议7-10天' },
    { keywords: ['挪威', 'norway'], days: 7, min: 5, max: 12, reason: '挪威自然风光壮丽，建议7-12天' },
    { keywords: ['瑞典', 'sweden'], days: 6, min: 5, max: 10, reason: '瑞典自然和文化并重，建议6-10天' },
    { keywords: ['芬兰', 'finland'], days: 6, min: 5, max: 10, reason: '芬兰自然风光独特，建议6-10天' },
    { keywords: ['丹麦', 'denmark'], days: 5, min: 4, max: 7, reason: '丹麦文化丰富，建议5-7天' },
    { keywords: ['荷兰', 'netherlands', 'holland'], days: 5, min: 4, max: 7, reason: '荷兰文化独特，建议5-7天' },
    { keywords: ['比利时', 'belgium'], days: 4, min: 3, max: 6, reason: '比利时文化丰富，建议4-6天' },
    { keywords: ['葡萄牙', 'portugal'], days: 6, min: 5, max: 10, reason: '葡萄牙文化丰富，建议6-10天' },
    { keywords: ['捷克', 'czech'], days: 5, min: 4, max: 7, reason: '捷克文化丰富，建议5-7天' },
    { keywords: ['波兰', 'poland'], days: 6, min: 5, max: 10, reason: '波兰历史文化丰富，建议6-10天' },
    { keywords: ['匈牙利', 'hungary'], days: 5, min: 4, max: 7, reason: '匈牙利文化丰富，建议5-7天' },
    { keywords: ['克罗地亚', 'croatia'], days: 6, min: 5, max: 10, reason: '克罗地亚海岸线优美，建议6-10天' },
    { keywords: ['摩洛哥', 'morocco'], days: 7, min: 5, max: 12, reason: '摩洛哥文化丰富，建议7-12天' },
    { keywords: ['埃及', 'egypt'], days: 7, min: 5, max: 12, reason: '埃及历史文化丰富，建议7-12天' },
    { keywords: ['南非', 'south africa'], days: 10, min: 7, max: 14, reason: '南非自然和文化多样，建议10-14天' },
    { keywords: ['肯尼亚', 'kenya'], days: 7, min: 5, max: 12, reason: '肯尼亚野生动物观赏，建议7-12天' },
    { keywords: ['坦桑尼亚', 'tanzania'], days: 8, min: 6, max: 14, reason: '坦桑尼亚野生动物和海滩，建议8-14天' },
    { keywords: ['巴西', 'brazil'], days: 10, min: 7, max: 21, reason: '巴西地域广阔，建议10-21天' },
    { keywords: ['阿根廷', 'argentina'], days: 10, min: 7, max: 21, reason: '阿根廷自然和文化丰富，建议10-21天' },
    { keywords: ['智利', 'chile'], days: 8, min: 6, max: 14, reason: '智利自然风光丰富，建议8-14天' },
    { keywords: ['秘鲁', 'peru'], days: 8, min: 6, max: 12, reason: '秘鲁历史文化丰富，建议8-12天' },
    { keywords: ['墨西哥', 'mexico'], days: 8, min: 6, max: 14, reason: '墨西哥文化丰富，建议8-14天' },
    { keywords: ['古巴', 'cuba'], days: 7, min: 5, max: 10, reason: '古巴文化独特，建议7-10天' },
  ]

  for (const country of mediumCountries) {
    if (country.keywords.some(kw => destLower.includes(kw.toLowerCase()))) {
      return {
        recommendedDays: country.days,
        minDays: country.min,
        maxDays: country.max,
        reason: country.reason
      }
    }
  }

  // 3. 城市级别（3-5天）
  const cityKeywords = [
    { keywords: ['东京', 'tokyo'], days: 5, min: 4, max: 7, reason: '东京文化丰富，建议5-7天' },
    { keywords: ['大阪', 'osaka'], days: 4, min: 3, max: 5, reason: '大阪美食和文化丰富，建议4-5天' },
    { keywords: ['京都', 'kyoto'], days: 4, min: 3, max: 5, reason: '京都历史文化丰富，建议4-5天' },
    { keywords: ['首尔', 'seoul'], days: 4, min: 3, max: 5, reason: '首尔现代与传统结合，建议4-5天' },
    { keywords: ['新加坡', 'singapore'], days: 4, min: 3, max: 5, reason: '新加坡城市紧凑，建议4-5天' },
    { keywords: ['曼谷', 'bangkok'], days: 4, min: 3, max: 5, reason: '曼谷文化丰富，建议4-5天' },
    { keywords: ['清迈', 'chiang mai'], days: 4, min: 3, max: 5, reason: '清迈文化氛围浓厚，建议4-5天' },
    { keywords: ['巴黎', 'paris'], days: 5, min: 4, max: 7, reason: '巴黎文化丰富，建议5-7天' },
    { keywords: ['伦敦', 'london'], days: 5, min: 4, max: 7, reason: '伦敦文化丰富，建议5-7天' },
    { keywords: ['罗马', 'rome'], days: 4, min: 3, max: 6, reason: '罗马历史文化丰富，建议4-6天' },
    { keywords: ['巴塞罗那', 'barcelona'], days: 4, min: 3, max: 6, reason: '巴塞罗那文化丰富，建议4-6天' },
    { keywords: ['阿姆斯特丹', 'amsterdam'], days: 4, min: 3, max: 5, reason: '阿姆斯特丹文化独特，建议4-5天' },
    { keywords: ['柏林', 'berlin'], days: 4, min: 3, max: 6, reason: '柏林文化丰富，建议4-6天' },
    { keywords: ['维也纳', 'vienna'], days: 4, min: 3, max: 5, reason: '维也纳文化丰富，建议4-5天' },
    { keywords: ['布拉格', 'prague'], days: 4, min: 3, max: 5, reason: '布拉格文化丰富，建议4-5天' },
    { keywords: ['纽约', 'new york'], days: 5, min: 4, max: 7, reason: '纽约文化丰富，建议5-7天' },
    { keywords: ['洛杉矶', 'los angeles', 'la'], days: 5, min: 4, max: 7, reason: '洛杉矶文化多样，建议5-7天' },
    { keywords: ['旧金山', 'san francisco'], days: 4, min: 3, max: 5, reason: '旧金山文化丰富，建议4-5天' },
    { keywords: ['悉尼', 'sydney'], days: 5, min: 4, max: 7, reason: '悉尼自然和文化结合，建议5-7天' },
    { keywords: ['墨尔本', 'melbourne'], days: 5, min: 4, max: 7, reason: '墨尔本文化丰富，建议5-7天' },
    { keywords: ['迪拜', 'dubai'], days: 4, min: 3, max: 6, reason: '迪拜现代与传统结合，建议4-6天' },
    { keywords: ['伊斯坦布尔', 'istanbul'], days: 4, min: 3, max: 6, reason: '伊斯坦布尔文化丰富，建议4-6天' },
  ]

  for (const city of cityKeywords) {
    if (city.keywords.some(kw => destLower.includes(kw.toLowerCase()))) {
      return {
        recommendedDays: city.days,
        minDays: city.min,
        maxDays: city.max,
        reason: city.reason
      }
    }
  }

  // 4. 自然景点/岛屿（根据大小推荐）
  const natureKeywords = [
    { keywords: ['富士山', 'mount fuji', 'fuji'], days: 3, min: 2, max: 5, reason: '富士山登山和周边，建议3-5天' },
    { keywords: ['大溪地', 'tahiti', '波拉波拉', 'bora bora'], days: 5, min: 4, max: 7, reason: '大溪地海岛度假，建议5-7天' },
    { keywords: ['马尔代夫', 'maldives'], days: 5, min: 4, max: 7, reason: '马尔代夫海岛度假，建议5-7天' },
    { keywords: ['巴厘岛', 'bali'], days: 6, min: 5, max: 10, reason: '巴厘岛文化自然丰富，建议6-10天' },
    { keywords: ['普吉岛', 'phuket'], days: 5, min: 4, max: 7, reason: '普吉岛海滩丰富，建议5-7天' },
    { keywords: ['长滩岛', 'boracay'], days: 4, min: 3, max: 6, reason: '长滩岛海滩度假，建议4-6天' },
    { keywords: ['圣托里尼', 'santorini'], days: 4, min: 3, max: 5, reason: '圣托里尼岛屿度假，建议4-5天' },
    { keywords: ['毛里求斯', 'mauritius'], days: 6, min: 5, max: 10, reason: '毛里求斯海岛度假，建议6-10天' },
    { keywords: ['塞舌尔', 'seychelles'], days: 6, min: 5, max: 10, reason: '塞舌尔海岛度假，建议6-10天' },
  ]

  for (const nature of natureKeywords) {
    if (nature.keywords.some(kw => destLower.includes(kw.toLowerCase()))) {
      return {
        recommendedDays: nature.days,
        minDays: nature.min,
        maxDays: nature.max,
        reason: nature.reason
      }
    }
  }

  // 5. 根据意图类型调整（如果无法从目的地匹配）
  if (intentType) {
    const intentDays: Record<string, number> = {
      'extreme_exploration': 7,
      'emotional_healing': 5,
      'cultural_exchange': 6,
      'photography_exploration': 6,
      'mind_healing': 5,
      'urban_creation': 5,
      'nature_discovery': 6
    }
    const recommendedDays = intentDays[intentType] || 5
    return {
      recommendedDays,
      minDays: 3,
      maxDays: 10,
      reason: `根据${intentType}类型的旅行意图，推荐${recommendedDays}天`
    }
  }

  // 6. 默认推荐（轻松安排）
  return {
    recommendedDays: 5,
    minDays: 3,
    maxDays: 7,
    reason: '根据目的地特点，建议轻松安排5天行程'
  }
}
