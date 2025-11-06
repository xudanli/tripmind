/**
 * Unsplash API 服务
 * 用于获取旅行相关的图片
 * 如果 Unsplash 失败，会自动回退到 iStockPhoto/Pexels
 */

import { API_CONFIG } from '@/config/api'
import { searchIStockPhoto, searchIStockPhotoSingle, type IStockPhoto } from './istockphotoAPI'

export interface UnsplashPhoto {
  id: string
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
  width: number
  height: number
  description: string | null
  alt_description: string | null
  user: {
    name: string
    username: string
  }
}

/**
 * 将 iStockPhoto 格式转换为 UnsplashPhoto 格式（用于兼容）
 */
function convertIStockToUnsplash(photo: IStockPhoto): UnsplashPhoto {
  return {
    id: photo.id,
    urls: {
      raw: photo.url,
      full: photo.url,
      regular: photo.url,
      small: photo.thumbnail,
      thumb: photo.thumbnail
    },
    width: photo.width,
    height: photo.height,
    description: photo.description || null,
    alt_description: photo.title || null,
    user: {
      name: photo.title,
      username: 'istockphoto'
    }
  }
}

export interface UnsplashSearchResponse {
  total: number
  total_pages: number
  results: UnsplashPhoto[]
}

/**
 * 根据关键词搜索图片（返回多张）
 */
export async function searchUnsplashPhotos(
  query: string,
  options: {
    orientation?: 'landscape' | 'portrait' | 'squarish'
    per_page?: number
  } = {}
): Promise<UnsplashPhoto[]> {
  try {
    const { orientation = 'landscape', per_page = 10 } = options
    
    const params = new URLSearchParams({
      query: query,
      orientation: orientation,
      per_page: per_page.toString(),
      client_id: API_CONFIG.UNSPLASH_ACCESS_KEY
    })

    const response = await fetch(
      `${API_CONFIG.UNSPLASH_API_URL}${API_CONFIG.ENDPOINTS.UNSPLASH_SEARCH}?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Accept-Version': 'v1'
        }
      }
    )

    if (!response.ok) {
      let errorText = ''
      try {
        errorText = await response.text()
      } catch (e) {
        // 忽略读取错误文本的失败
      }
      
      const errorMsg = `Unsplash API error: ${response.status} ${response.statusText}`
      
      // 403错误通常是API key问题或权限问题
      if (response.status === 403) {
        console.warn(`⚠️ Unsplash API 403 Forbidden - 可能是API key无效或权限不足`)
        if (errorText) {
          console.warn(`   错误详情: ${errorText.substring(0, 200)}`)
        }
      } else if (response.status === 401) {
        console.warn(`⚠️ Unsplash API 401 Unauthorized - API key可能无效`)
      } else if (response.status === 429) {
        console.warn(`⚠️ Unsplash API 429 Too Many Requests - 请求频率过高，请稍后再试`)
      }
      
      throw new Error(errorMsg)
    }

    const data: UnsplashSearchResponse = await response.json()
    
    if (data.results && data.results.length > 0) {
      return data.results
    }
    
    return []
  } catch (error: any) {
    // 只在非网络错误时输出警告（网络错误可能是正常的超时）
    if (error?.message && !error.message.includes('fetch')) {
      console.warn('Unsplash搜索失败，尝试使用 iStockPhoto/Pexels:', error.message)
    }
    
    // 如果 Unsplash 失败，尝试使用 iStockPhoto/Pexels 作为后备
    try {
      const istockPhotos = await searchIStockPhoto(query, options)
      if (istockPhotos.length > 0) {
        console.log(`✅ 使用 iStockPhoto/Pexels 获取到 ${istockPhotos.length} 张图片`)
        return istockPhotos.map(convertIStockToUnsplash)
      }
    } catch (fallbackError: any) {
      console.warn('iStockPhoto/Pexels 后备也失败:', fallbackError.message)
    }
    
    return []
  }
}

/**
 * 根据关键词搜索图片（返回单张，向后兼容）
 */
export async function searchUnsplashPhoto(
  query: string,
  options: {
    orientation?: 'landscape' | 'portrait' | 'squarish'
    per_page?: number
  } = {}
): Promise<UnsplashPhoto | null> {
  try {
    const photos = await searchUnsplashPhotos(query, { ...options, per_page: 1 })
    if (photos.length > 0) {
      return photos[0]
    }
    
    // 如果 Unsplash 没有结果，尝试 iStockPhoto/Pexels
    const istockPhoto = await searchIStockPhotoSingle(query, options)
    if (istockPhoto) {
      console.log('✅ 使用 iStockPhoto/Pexels 获取图片')
      return convertIStockToUnsplash(istockPhoto)
    }
    
    return null
  } catch (error: any) {
    console.warn('搜索图片失败:', error.message)
    return null
  }
}

/**
 * 为活动生成搜索关键词
 */
export function generateSearchQuery(slot: any, destination?: string): string {
  // 优先级：活动名称 > 地点 > 类型 > 目的地
  const queries: string[] = []
  
  // 1. 使用活动的英文名称（如果有）
  if (slot.details?.name?.english) {
    queries.push(slot.details.name.english)
  }
  
  // 2. 使用活动标题
  if (slot.title) {
    queries.push(slot.title)
  }
  
  // 3. 使用活动名称
  if (slot.activity) {
    queries.push(slot.activity)
  }
  
  // 4. 使用地点
  if (slot.location) {
    queries.push(slot.location)
  }
  
  // 5. 使用地址
  if (slot.details?.address?.english) {
    queries.push(slot.details.address.english)
  } else if (slot.details?.address?.chinese) {
    queries.push(slot.details.address.chinese)
  }
  
  // 6. 使用类型和目的地组合
  const type = slot.type || slot.category || 'travel'
  const typeLabels: Record<string, string> = {
    attraction: 'tourist attraction',
    restaurant: 'restaurant food',
    accommodation: 'hotel resort',
    transport: 'transportation',
    shopping: 'shopping',
    activity: 'travel activity'
  }
  
  const typeLabel = typeLabels[type] || type
  
  if (destination) {
    queries.push(`${typeLabel} ${destination}`)
  } else {
    queries.push(typeLabel)
  }
  
  // 返回第一个非空的查询词
  return queries.find(q => q && q.trim()) || 'travel'
}

/**
 * 获取活动的图片URL（单张）
 */
export async function getActivityImage(
  slot: any,
  destination?: string,
  options: {
    orientation?: 'landscape' | 'portrait' | 'squarish'
    size?: 'small' | 'regular' | 'full'
  } = {}
): Promise<string | null> {
  const { orientation = 'landscape', size = 'regular' } = options
  
  const query = generateSearchQuery(slot, destination)
  const photo = await searchUnsplashPhoto(query, { orientation, per_page: 1 })
  
  if (photo) {
    return photo.urls[size] || photo.urls.regular
  }
  
  return null
}

/**
 * 获取活动的多张图片URL
 */
export async function getActivityImagesList(
  slot: any,
  destination?: string,
  options: {
    orientation?: 'landscape' | 'portrait' | 'squarish'
    size?: 'small' | 'regular' | 'full'
    count?: number
  } = {}
): Promise<string[]> {
  const { orientation = 'landscape', size = 'regular', count = 10 } = options
  
  const query = generateSearchQuery(slot, destination)
  const photos = await searchUnsplashPhotos(query, { orientation, per_page: count })
  
  return photos.map(photo => photo.urls[size] || photo.urls.regular)
}

/**
 * 批量获取多个活动的图片
 */
export async function getActivityImages(
  slots: any[],
  destination?: string,
  options: {
    orientation?: 'landscape' | 'portrait' | 'squarish'
    size?: 'small' | 'regular' | 'full'
    delay?: number // 请求之间的延迟（毫秒），避免过快请求
  } = {}
): Promise<Map<string, string>> {
  const { delay = 100 } = options
  const imageMap = new Map<string, string>()
  
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]
    const slotKey = `${slot.time || i}_${slot.title || slot.activity || i}`
    
    try {
      const imageUrl = await getActivityImage(slot, destination, options)
      if (imageUrl) {
        imageMap.set(slotKey, imageUrl)
      }
      
      // 添加延迟，避免请求过快
      if (i < slots.length - 1 && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    } catch (error) {
      console.warn(`获取活动图片失败 (${slotKey}):`, error)
    }
  }
  
  return imageMap
}
