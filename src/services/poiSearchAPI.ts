// @ts-nocheck
/**
 * POI搜索服务 - 使用AI搜索附近的餐饮、景点、住宿、加油站、充电桩、休息站
 */

import { askDeepSeek, parseJSONSafe, logger } from '@/utils/inspirationCore'
import { searchUnsplashPhoto } from './unsplashAPI'
import { getCachedPOIResults, setCachedPOIResults } from '@/utils/poiCache'

export type POICategory = 'restaurant' | 'attraction' | 'accommodation' | 'gas_station' | 'ev_charging' | 'rest_area'

export interface POIResult {
  name: {
    chinese?: string
    english?: string
    local?: string
  }
  category: POICategory
  address: {
    chinese?: string
    english?: string
    local?: string
    landmark?: string
  }
  coordinates: {
    lat: number
    lng: number
  }
  recommendation: string // 推荐理由（50-100字）
  distance?: string // 距离当前位置的距离
  estimatedDuration?: string // 预计停留时间
  rating?: {
    score: number
    platform?: string
    reviewCount?: number
  }
  photo?: string // 照片URL
  contact?: {
    phone?: string
    website?: string
  }
  openingHours?: {
    days?: string
    hours?: string
  }
  pricing?: {
    general?: number
    unit?: string
  }
}

/**
 * 搜索附近的POI
 */
export async function searchNearbyPOI(
  location: {
    name: string
    address?: string
    coordinates?: { lat: number; lng: number }
  },
  category: POICategory,
  options: {
    language?: string
    radius?: number // 搜索半径（公里）
    maxResults?: number
    useCache?: boolean // 是否使用缓存（默认true）
  } = {}
): Promise<POIResult[]> {
  const { language = 'zh-CN', radius = 5, maxResults = 5, useCache = true } = options
  const isEnglish = language.startsWith('en')
  
  // 尝试从缓存获取
  if (useCache) {
    const cached = getCachedPOIResults(location, category, language)
    if (cached && cached.length > 0) {
      console.log(`📦 使用缓存结果，共 ${cached.length} 个`)
      return cached as POIResult[]
    }
  }

  const categoryLabels: Record<POICategory, { zh: string; en: string }> = {
    restaurant: { zh: '餐饮', en: 'Restaurant' },
    attraction: { zh: '旅游景点', en: 'Tourist Attraction' },
    accommodation: { zh: '住宿', en: 'Accommodation' },
    gas_station: { zh: '加油站', en: 'Gas Station' },
    ev_charging: { zh: '新能源车充电桩', en: 'EV Charging Station' },
    rest_area: { zh: '休息站', en: 'Rest Area' }
  }

  const categoryLabel = isEnglish ? categoryLabels[category].en : categoryLabels[category].zh

  const systemPrompt = isEnglish
    ? `You are a location-based POI (Point of Interest) search assistant. Search for nearby ${categoryLabel} based on the given location.

Location Context:
- Location Name: ${location.name}
${location.address ? `- Address: ${location.address}` : ''}
${location.coordinates ? `- Coordinates: ${location.coordinates.lat}, ${location.coordinates.lng}` : ''}

Search Requirements:
- Category: ${categoryLabel}
- Search Radius: ${radius} km
- Maximum Results: ${maxResults}

For each result, provide:
1. **Name**: Chinese name, English name, and local language name (if applicable)
2. **Address**: Detailed address with street, area, landmark
3. **Coordinates**: Realistic latitude and longitude (must be within ${radius}km of the given location)
4. **Recommendation**: Why this place is recommended (50-100 words), considering:
   - Proximity to the search location
   - Quality and reviews
   - Uniqueness or special features
   - Practical value for travelers
5. **Distance**: Estimated distance from search location
6. **Rating**: Score (0-5), platform name, review count (if available)
7. **Opening Hours**: Days and hours (if applicable)
8. **Pricing**: General price estimate with currency unit. **IMPORTANT**: Use the local currency of the destination country (e.g., ISK for Iceland, USD for USA, EUR for European countries, CNY for China). Do NOT use CNY unless the location is in China.
9. **Contact**: Phone and website (if available)

Return ONLY valid JSON:
{
  "results": [
    {
      "name": {
        "chinese": "中文名称",
        "english": "English Name",
        "local": "Local Language Name"
      },
      "category": "${category}",
      "address": {
        "chinese": "中文地址",
        "english": "English Address",
        "local": "Local Address",
        "landmark": "附近地标"
      },
      "coordinates": {
        "lat": 0.0,
        "lng": 0.0
      },
      "recommendation": "推荐理由（50-100字）",
      "distance": "距离说明（如'步行5分钟'或'驾车2公里'）",
      "estimatedDuration": "预计停留时间（如'30分钟'或'1-2小时'）",
      "rating": {
        "score": 4.5,
        "platform": "评分平台",
        "reviewCount": 100
      },
      "contact": {
        "phone": "联系电话",
        "website": "官方网站"
      },
      "openingHours": {
        "days": "营业日期",
        "hours": "营业时间"
      },
      "pricing": {
        "general": 0,
        "unit": "货币单位"
      }
    }
  ]
}`
    : `你是基于地理位置的POI（兴趣点）搜索助手。根据给定位置搜索附近的${categoryLabel}。

位置上下文：
- 位置名称：${location.name}
${location.address ? `- 地址：${location.address}` : ''}
${location.coordinates ? `- 坐标：${location.coordinates.lat}, ${location.coordinates.lng}` : ''}

搜索要求：
- 类别：${categoryLabel}
- 搜索半径：${radius} 公里
- 最大结果数：${maxResults}

每个结果需包含：
1. **名称**：中文名称、英文名称、当地语言名称（如适用）
2. **地址**：详细地址，包括街道、区域、地标
3. **坐标**：真实的经纬度（必须在给定位置${radius}公里范围内）
4. **推荐理由**：为什么推荐这个地方（50-100字），考虑：
   - 距离搜索位置的远近
   - 质量和评价
   - 独特性或特色
   - 对旅行者的实用价值
5. **距离**：距离搜索位置的估计距离
6. **评分**：分数（0-5）、平台名称、评论数（如有）
7. **营业时间**：日期和时间（如适用）
8. **价格**：一般价格估算和货币单位。**重要**：使用目的地国家的当地货币（如冰岛用ISK，美国用USD，欧洲国家用EUR，中国用CNY）。除非位置在中国，否则不要使用CNY。
9. **联系方式**：电话和网站（如有）

只返回有效的JSON：
{
  "results": [
    {
      "name": {
        "chinese": "中文名称",
        "english": "English Name",
        "local": "当地语言名称"
      },
      "category": "${category}",
      "address": {
        "chinese": "中文地址",
        "english": "English Address",
        "local": "当地语言地址",
        "landmark": "附近地标"
      },
      "coordinates": {
        "lat": 0.0,
        "lng": 0.0
      },
      "recommendation": "推荐理由（50-100字）",
      "distance": "距离说明（如'步行5分钟'或'驾车2公里'）",
      "estimatedDuration": "预计停留时间（如'30分钟'或'1-2小时'）",
      "rating": {
        "score": 4.5,
        "platform": "评分平台",
        "reviewCount": 100
      },
      "contact": {
        "phone": "联系电话",
        "website": "官方网站"
      },
      "openingHours": {
        "days": "营业日期",
        "hours": "营业时间"
      },
      "pricing": {
        "general": 0,
        "unit": "货币单位"
      }
    }
  ]
}`

  try {
    const userPrompt = isEnglish
      ? `Search for ${maxResults} nearby ${categoryLabel} near ${location.name}. Provide real locations within ${radius} km.`
      : `搜索${location.name}附近${radius}公里内的${maxResults}个${categoryLabel}。提供真实地点。`

    console.log(`🔍 开始搜索${categoryLabel}，位置: ${location.name}`)
    const searchStartTime = Date.now()
    
    let response: string | null = null
    try {
      response = await askDeepSeek(systemPrompt, userPrompt, {
        temperature: 0.7,
        max_tokens: 3000
      })
    } catch (apiError) {
      console.error(`❌ AI API调用失败:`, apiError)
      throw apiError
    }
    
    const searchTime = Date.now() - searchStartTime
    console.log(`✅ AI响应接收完成，耗时: ${searchTime}ms`)
    console.log(`📝 响应长度: ${response?.length || 0} 字符`)

    if (!response || response.trim().length === 0) {
      console.warn('⚠️ AI返回空响应')
      console.warn('📝 完整响应内容:', response)
      return []
    }

    console.log(`🔧 开始解析JSON...`)
    const parsed = parseJSONSafe(response)
    if (!parsed || !parsed.results || !Array.isArray(parsed.results)) {
      console.warn('⚠️ JSON解析失败或缺少results字段')
      console.warn('📝 解析结果:', parsed)
      console.warn('📝 原始响应前500字符:', response.substring(0, 500))
      return []
    }
    
    console.log(`✅ JSON解析成功，找到 ${parsed.results.length} 个结果`)

    // 为每个结果获取照片（并行但独立处理，失败不影响其他结果）
    const resultsWithPhotos = await Promise.allSettled(
      parsed.results.map(async (poi: POIResult) => {
        try {
          // 生成搜索关键词
          const searchQuery = poi.name.english || poi.name.chinese || poi.name.local || ''
          if (searchQuery) {
            // 添加超时控制，避免长时间等待
            const photoPromise = searchUnsplashPhoto(searchQuery, {
              orientation: 'landscape',
              per_page: 1
            })
            
            const timeoutPromise = new Promise<null>((resolve) => {
              setTimeout(() => resolve(null), 3000) // 3秒超时
            })
            
            const photo = await Promise.race([photoPromise, timeoutPromise])
            
            if (photo) {
              poi.photo = photo.urls.regular || photo.urls.small
              console.log(`✅ 成功获取照片: ${searchQuery}`)
            } else {
              console.log(`⏱️ 照片获取超时或失败: ${searchQuery}`)
            }
          }
        } catch (error: any) {
          // 静默处理照片获取失败，不影响搜索结果
          const errorMsg = error?.message || '未知错误'
          if (errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
            console.log(`⚠️ Unsplash API 403错误（可能API key问题）: ${poi.name.chinese || poi.name.english}`)
          } else {
            console.log(`⚠️ 获取照片失败: ${poi.name.chinese || poi.name.english} - ${errorMsg}`)
          }
        }
        return poi
      })
    )
    
    // 提取成功的结果
    const finalResults = resultsWithPhotos.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        // 即使Promise失败，也返回原始POI（只是没有照片）
        console.warn('POI处理失败:', result.reason)
        return parsed.results[resultsWithPhotos.indexOf(result)] || null
      }
    }).filter(Boolean) as POIResult[]

    console.log(`✅ 找到${finalResults.length}个结果`)
    
    // 保存到缓存
    if (useCache && finalResults.length > 0) {
      setCachedPOIResults(location, category, language, finalResults)
    }
    
    return finalResults
  } catch (error) {
    logger.error(`❌ 搜索${categoryLabel}失败:`, error)
    return []
  }
}

/**
 * 搜索多个类别的POI
 */
export async function searchMultiplePOICategories(
  location: {
    name: string
    address?: string
    coordinates?: { lat: number; lng: number }
  },
  categories: POICategory[],
  options: {
    language?: string
    radius?: number
    maxResultsPerCategory?: number
  } = {}
): Promise<Record<POICategory, POIResult[]>> {
  const { maxResultsPerCategory = 3 } = options
  
  // 并行搜索所有类别
  const searchPromises = categories.map(category =>
    searchNearbyPOI(location, category, {
      ...options,
      maxResults: maxResultsPerCategory
    }).then(results => ({ category, results }))
  )

  const results = await Promise.all(searchPromises)
  
  // 转换为记录格式
  const resultMap: Record<POICategory, POIResult[]> = {} as any
  categories.forEach(cat => {
    resultMap[cat] = []
  })
  
  results.forEach(({ category, results }) => {
    resultMap[category] = results
  })

  return resultMap
}


