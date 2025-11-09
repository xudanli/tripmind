// @ts-nocheck
/**
 * iStockPhoto API 服务
 * 作为 Unsplash 的后备图片源
 */

export interface IStockPhoto {
  id: string
  url: string
  thumbnail: string
  width: number
  height: number
  title: string
  description?: string
}

/**
 * 搜索 iStockPhoto 图片
 * 
 * 优先级：
 * 1. 真正的 iStockPhoto API（通过后端代理，需要 API key）
 * 2. 备用方案：Picsum Photos（支持 CORS，无需 API key）
 * 
 * 注意：
 * - iStockPhoto 是 Getty Images 的一部分，需要付费订阅和 API key
 * - 由于 CORS 限制，必须通过后端代理调用
 * - 获取 API key: https://developers.gettyimages.com/
 */
export async function searchIStockPhoto(
  query: string,
  options: {
    orientation?: 'landscape' | 'portrait' | 'squarish'
    per_page?: number
  } = {}
): Promise<IStockPhoto[]> {
  // 首先尝试使用真正的 iStockPhoto API（通过后端代理）
  try {
    const result = await searchIStockPhotoAPI(query, options)
    if (result.length > 0) {
      return result
    }
  } catch (error: any) {
    // 如果 iStockPhoto API 失败，静默回退到备用方案
    console.warn('iStockPhoto API 搜索失败，使用备用图片源:', error.message)
  }
  
  // 回退到备用方案
  return searchIStockPhotoFallback(query, options)
}

/**
 * 通过后端代理调用真正的 iStockPhoto (Getty Images) API
 */
async function searchIStockPhotoAPI(
  query: string,
  options: {
    orientation?: 'landscape' | 'portrait' | 'squarish'
    per_page?: number
  } = {}
): Promise<IStockPhoto[]> {
  const { API_CONFIG } = await import('@/config/api')
  const { orientation = 'landscape', per_page = 10 } = options
  
  // 检查是否有 API key
  if (!API_CONFIG.ISTOCKPHOTO_API_KEY || !API_CONFIG.ISTOCKPHOTO_API_SECRET) {
    throw new Error('iStockPhoto API key 未配置')
  }
  
  // 通过后端代理调用（避免 CORS 问题）
  const BASE_URL = API_CONFIG.BASE_URL || 'https://api.emotional-travel.com'
  const proxyUrl = `${BASE_URL}${API_CONFIG.ENDPOINTS.PROXY_ISTOCKPHOTO}/search`
  
  const params = new URLSearchParams({
    query: query,
    page_size: per_page.toString(),
    orientation: orientation === 'portrait' ? 'vertical' : orientation === 'squarish' ? 'square' : 'horizontal'
  })
  
  const response = await fetch(`${proxyUrl}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // API key 应该由后端处理，前端不需要直接传递
    }
  })

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('iStockPhoto API 认证失败，请检查 API key')
    }
    if (response.status === 429) {
      throw new Error('iStockPhoto API 请求频率过高，请稍后再试')
    }
    throw new Error(`iStockPhoto API 错误: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  
  // Getty Images API 返回格式
  if (data.images && Array.isArray(data.images) && data.images.length > 0) {
    return data.images.map((image: any) => {
      // Getty Images 返回的图片 URL 结构
      const displaySizes = image.display_sizes || []
      const largestSize = displaySizes.find((size: any) => size.name === 'comp') || 
                         displaySizes.find((size: any) => size.name === 'preview') ||
                         displaySizes[0]
      const thumbnailSize = displaySizes.find((size: any) => size.name === 'thumb') ||
                            displaySizes.find((size: any) => size.name === 'preview') ||
                            displaySizes[0]
      
      return {
        id: image.id.toString(),
        url: largestSize?.uri || image.uri || '',
        thumbnail: thumbnailSize?.uri || largestSize?.uri || image.uri || '',
        width: image.width || 0,
        height: image.height || 0,
        title: image.title || image.caption || query,
        description: image.caption || image.title || query
      }
    })
  }
  
  return []
}

/**
 * 备用图片搜索方法（使用 Picsum Photos，支持 CORS，无需 API key）
 * 这是主要的图片源，因为 Pexels API 在浏览器中会遇到 CORS 问题
 */
async function searchIStockPhotoFallback(
  query: string,
  options: {
    orientation?: 'landscape' | 'portrait' | 'squarish'
    per_page?: number
  } = {}
): Promise<IStockPhoto[]> {
  try {
    const { orientation = 'landscape', per_page = 10 } = options
    
    // 生成基于查询词的确定性图片 ID（简单哈希）
    // 这样相同的查询词总是返回相同的图片
    const hash = query.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0)
    }, 0)
    const baseId = Math.abs(hash) % 1000
    
    // 根据 orientation 调整尺寸
    const width = orientation === 'portrait' ? 600 : 800
    const height = orientation === 'portrait' ? 800 : 600
    const thumbWidth = orientation === 'portrait' ? 300 : 400
    const thumbHeight = orientation === 'portrait' ? 400 : 300
    
    // 使用 Picsum Photos 作为图片源（免费，支持 CORS，无需 API key）
    // 使用 seed 参数确保相同查询词返回相同图片
    const photos: IStockPhoto[] = []
    for (let i = 0; i < per_page; i++) {
      const id = (baseId + i) % 1000
      // 使用 encodeURIComponent 确保特殊字符被正确处理
      const seed = encodeURIComponent(query) + id
      photos.push({
        id: id.toString(),
        url: `https://picsum.photos/seed/${seed}/${width}/${height}`,
        thumbnail: `https://picsum.photos/seed/${seed}/${thumbWidth}/${thumbHeight}`,
        width: width,
        height: height,
        title: query,
        description: query
      })
    }
    
    return photos
  } catch (error: any) {
    console.warn('备用图片搜索失败:', error.message)
    return []
  }
}

/**
 * 搜索单张图片
 */
export async function searchIStockPhotoSingle(
  query: string,
  options: {
    orientation?: 'landscape' | 'portrait' | 'squarish'
  } = {}
): Promise<IStockPhoto | null> {
  const photos = await searchIStockPhoto(query, { ...options, per_page: 1 })
  return photos.length > 0 && photos[0] ? photos[0] : null
}

