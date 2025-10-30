/**
 * Unsplash API 服务
 * 用于获取目的地的精美图片
 */

import { API_CONFIG } from '@/config/api'

export interface UnsplashPhoto {
  id: string
  width: number
  height: number
  color: string
  description: string | null
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
  user: {
    name: string
    username: string
  }
  links: {
    html: string
  }
}

export interface UnsplashSearchResponse {
  total: number
  total_pages: number
  results: UnsplashPhoto[]
}

/**
 * 搜索目的地相关的图片
 * @param query 搜索关键词（目的地名称，英文）
 * @param perPage 每页返回数量，默认 10
 * @returns 图片列表
 */
export async function searchDestinationPhotos(
  query: string,
  perPage: number = 10
): Promise<UnsplashPhoto[]> {
  try {
    // 检查 API 密钥是否存在
    if (!API_CONFIG.UNSPLASH_ACCESS_KEY) {
      console.warn('Unsplash API key is not configured')
      return []
    }

    const response = await fetch(
      `${API_CONFIG.UNSPLASH_API_URL}${API_CONFIG.ENDPOINTS.UNSPLASH_SEARCH}?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${API_CONFIG.UNSPLASH_ACCESS_KEY}`,
          'Accept-Version': 'v1' // Unsplash API 版本
        }
      }
    )

    // 处理不同的错误状态码
    if (response.status === 410) {
      console.warn(`Unsplash API returned 410 Gone for query: ${query}. The resource may no longer be available.`)
      return []
    }

    if (response.status === 401 || response.status === 403) {
      console.error('Unsplash API authentication failed. Please check your API key.')
      return []
    }

    if (response.status === 429) {
      console.warn('Unsplash API rate limit exceeded. Please wait before making more requests.')
      return []
    }

    if (!response.ok) {
      console.error(`Unsplash API error: ${response.status} ${response.statusText}`)
      return []
    }

    const data: UnsplashSearchResponse = await response.json()
    return data.results || []
  } catch (error: any) {
    // 如果是网络错误，不抛出异常，只记录日志
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn(`Network error while fetching photos for "${query}":`, error.message)
    } else {
      console.error(`Failed to fetch photos from Unsplash for "${query}":`, error)
    }
    return []
  }
}

/**
 * 获取单个目的地的最佳图片
 * @param destination 目的地名称
 * @param keywords 额外关键词（如 "travel", "landscape", "city"）
 * @returns 图片对象或 null
 */
export async function getDestinationPhoto(
  destination: string,
  keywords: string[] = ['travel']
): Promise<UnsplashPhoto | null> {
  // 构造搜索关键词
  const query = `${destination} ${keywords.join(' ')}`
  
  const photos = await searchDestinationPhotos(query, 1)
  
  if (photos.length > 0) {
    return photos[0]
  }
  
  // 如果找不到，尝试只用目的地名称搜索
  const fallbackPhotos = await searchDestinationPhotos(destination, 1)
  return fallbackPhotos.length > 0 ? fallbackPhotos[0] : null
}

/**
 * 批量获取多个目的地的图片
 * @param destinations 目的地数组
 * @returns 目的地到图片的映射
 */
export async function getMultipleDestinationPhotos(
  destinations: string[]
): Promise<Record<string, UnsplashPhoto | null>> {
  const photos: Record<string, UnsplashPhoto | null> = {}
  
  // 如果 Unsplash API 密钥未配置，直接返回空结果
  if (!API_CONFIG.UNSPLASH_ACCESS_KEY) {
    console.warn('Unsplash API key is not configured. Skipping photo fetching.')
    destinations.forEach(dest => {
      photos[dest] = null
    })
    return photos
  }
  
  // 使用 Promise.allSettled 来处理部分失败的情况
  const promises = destinations.map(async (destination) => {
    try {
      const photo = await getDestinationPhoto(destination)
      photos[destination] = photo
      return { destination, success: true }
    } catch (error) {
      console.warn(`Failed to get photo for destination "${destination}":`, error)
      photos[destination] = null
      return { destination, success: false }
    }
  })
  
  const results = await Promise.allSettled(promises)
  
  // 记录成功和失败的数量
  const successCount = results.filter(r => r.status === 'fulfilled').length
  const failCount = results.filter(r => r.status === 'rejected').length
  
  if (successCount > 0) {
    console.log(`Successfully fetched ${successCount} destination photo(s)`)
  }
  if (failCount > 0) {
    console.warn(`Failed to fetch ${failCount} destination photo(s)`)
  }
  
  return photos
}

/**
 * 将中文目的地转换为英文（简单映射，可以根据需要扩展）
 */
const destinationTranslation: Record<string, string> = {
  '东京': 'Tokyo',
  '大阪': 'Osaka',
  '京都': 'Kyoto',
  '北京': 'Beijing',
  '上海': 'Shanghai',
  '广州': 'Guangzhou',
  '成都': 'Chengdu',
  '深圳': 'Shenzhen',
  '杭州': 'Hangzhou',
  '西安': 'Xi\'an',
  '南京': 'Nanjing',
  '巴厘岛': 'Bali',
  '泰国': 'Thailand',
  '普吉岛': 'Phuket',
  '曼谷': 'Bangkok',
  '清迈': 'Chiang Mai',
  '新加坡': 'Singapore',
  '马来西亚': 'Malaysia',
  '菲律宾': 'Philippines',
  '韩国': 'South Korea',
  '首尔': 'Seoul',
  '济州岛': 'Jeju Island',
  '日本': 'Japan',
  '冰岛': 'Iceland',
  '挪威': 'Norway',
  '瑞士': 'Switzerland',
  '法国': 'France',
  '巴黎': 'Paris',
  '意大利': 'Italy',
  '罗马': 'Rome',
  '西班牙': 'Spain',
  '希腊': 'Greece',
  '英国': 'United Kingdom',
  '伦敦': 'London',
  '纽约': 'New York',
  '洛杉矶': 'Los Angeles',
  '夏威夷': 'Hawaii',
  '澳大利亚': 'Australia',
  '悉尼': 'Sydney',
  '墨尔本': 'Melbourne',
  '新西兰': 'New Zealand',
  '越南': 'Vietnam',
  '柬埔寨': 'Cambodia',
  '印度尼西亚': 'Indonesia',
  '马尔代夫': 'Maldives',
  '土耳其': 'Turkey',
  '摩洛哥': 'Morocco',
  '土耳其': 'Turkey',
  '迪拜': 'Dubai',
  '阿联酋': 'UAE',
  '印度': 'India',
  '尼泊尔': 'Nepal',
  '不丹': 'Bhutan',
  '不丹王国': 'Bhutan',
  '斯里兰卡': 'Sri Lanka',
  '优胜美地国家公园': 'Yosemite National Park',
  '优胜美地': 'Yosemite',
  '大烟山国家公园': 'Great Smoky Mountains National Park',
  '大烟山': 'Great Smoky Mountains',
  '巴塔哥尼亚': 'Patagonia',
  '罗弗敦群岛': 'Lofoten Islands',
  '塔斯马尼亚': 'Tasmanian',
  '塔斯马尼亚荒野': 'Tasmanian Wilderness',
  '哥斯达黎加': 'Costa Rica',
  '蒙特维德': 'Monteverde',
  '云雾森林': 'Cloud Forest',
  '哥斯达黎加蒙特维德云雾森林': 'Monteverde Cloud Forest Costa Rica'
}

/**
 * 转换目的地名称为英文
 * @param destination 中文目的地名称
 * @returns 英文目的地名称
 */
export function translateDestination(destination: string): string {
  // 如果已经是英文或包含英文字符，直接返回
  if (/[a-zA-Z]/.test(destination)) {
    return destination
  }
  
  // 查找翻译
  const translated = destinationTranslation[destination]
  if (translated) {
    return translated
  }
  
  // 如果没有找到，返回原字符串（让 API 尝试搜索）
  return destination
}

/**
 * 为生成的旅程数据添加图片
 * @param data 旅程数据
 * @param fieldNames 需要添加图片的字段名（如 'locations', 'destination'）
 */
export async function enrichWithPhotos(
  data: any,
  fieldNames: string[] = ['locations', 'destination']
): Promise<any> {
  const enrichedData = { ...data }
  
  // 收集所有需要搜索的目的地
  const destinations: string[] = []
  
  for (const fieldName of fieldNames) {
    if (fieldName === 'locations' && enrichedData.locations && Array.isArray(enrichedData.locations)) {
      destinations.push(...enrichedData.locations)
    } else if (fieldName === 'destination' && enrichedData.destination) {
      destinations.push(enrichedData.destination)
    }
  }
  
  // 去重并翻译为英文
  const uniqueDestinations = Array.from(new Set(destinations))
    .map(dest => translateDestination(dest))
  
  console.log('正在获取目的地图片:', uniqueDestinations)
  
  // 批量获取图片
  const photos = await getMultipleDestinationPhotos(uniqueDestinations)
  
  // 添加 photos 字段到数据中
  enrichedData.photos = photos
  
  return enrichedData
}
