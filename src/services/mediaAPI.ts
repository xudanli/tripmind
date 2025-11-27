/**
 * 媒体服务 API
 * 对接后端 /api/v1/media 接口（图片、视频搜索和上传）
 */

import { API_CONFIG } from '@/config/api'

const baseUrl = (API_CONFIG.BASE_URL || '').replace(/\/$/, '')

const buildUrl = (endpoint: string) => {
  if (!endpoint.startsWith('/')) return endpoint
  if (!baseUrl) return endpoint
  return `${baseUrl}${endpoint}`
}

/**
 * 图片搜索请求参数
 */
export interface SearchImageRequest {
  query: string // 搜索关键词（地点/关键词）
  provider?: 'unsplash' | 'pexels' | 'all' // 图片提供商，默认 'all'
  limit?: number // 返回数量限制（1-30，默认：10）
  orientation?: 'landscape' | 'portrait' | 'squarish' // 图片方向
}

/**
 * 图片信息
 */
export interface ImageInfo {
  id: string // 图片ID（格式：{provider}-{originalId}）
  url: string // 图片URL（原始尺寸）
  thumbnailUrl?: string // 缩略图URL
  width: number // 图片宽度（像素）
  height: number // 图片高度（像素）
  description?: string // 图片描述
  photographer?: string // 摄影师名称
  sourceUrl?: string // 图片来源链接
  provider: 'unsplash' | 'pexels' // 提供商
}

/**
 * 图片搜索响应
 */
export interface SearchImageResponse {
  data: ImageInfo[]
  total: number // 总数量
}

/**
 * 视频搜索请求参数
 */
export interface SearchVideoRequest {
  query: string // 搜索关键词
  provider?: 'pexels' | 'all' // 视频提供商，默认 'all'（目前仅支持 Pexels）
  limit?: number // 返回数量限制（1-30，默认：10）
}

/**
 * 视频信息
 */
export interface VideoInfo {
  id: string // 视频ID
  url: string // 视频URL
  thumbnailUrl?: string // 视频缩略图URL
  width: number // 视频宽度（像素）
  height: number // 视频高度（像素）
  duration: number // 视频时长（秒）
  description?: string // 视频描述
  photographer?: string // 摄影师名称
  sourceUrl?: string // 视频来源链接
  provider: 'pexels' // 提供商（目前仅支持 Pexels）
}

/**
 * 视频搜索响应
 */
export interface SearchVideoResponse {
  data: VideoInfo[]
  total: number // 总数量
}

/**
 * 上传媒体请求参数
 */
export interface UploadMediaRequest {
  url: string // 媒体URL（必须是有效的URL）
  mediaType?: 'image' | 'video' // 媒体类型，默认 'image'
  metadata?: Record<string, any> // 元数据（任意键值对）
}

/**
 * 媒体详情
 */
export interface MediaDetail {
  id: string // 媒体ID（UUID）
  url: string // 媒体URL
  mediaType?: 'image' | 'video' // 媒体类型
  metadata?: Record<string, any> // 元数据
  createdAt: string // 创建时间（ISO 8601）
  updatedAt: string // 更新时间（ISO 8601）
}

/**
 * 上传媒体响应
 */
export interface UploadMediaResponse {
  success: boolean
  message?: string
  data: MediaDetail
}

/**
 * 获取媒体详情响应
 */
export interface GetMediaDetailResponse {
  success: boolean
  data: MediaDetail
}

/**
 * 搜索图片
 * @param request 搜索请求参数
 * @returns 图片列表
 */
export async function searchImage(
  request: SearchImageRequest
): Promise<SearchImageResponse> {
  const endpoint = '/v1/media/search-image'
  const url = buildUrl(endpoint)

  console.log('[MediaAPI] 搜索图片:', {
    url,
    query: request.query,
    provider: request.provider,
    limit: request.limit
  })

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: request.query,
        provider: request.provider || 'all',
        limit: request.limit || 10,
        orientation: request.orientation
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[MediaAPI] 搜索图片失败:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url
      })
      
      try {
        const errorData = JSON.parse(errorText)
        const errorMessage = Array.isArray(errorData.message) 
          ? errorData.message.join(', ')
          : errorData.message
        throw new Error(errorMessage || `搜索图片失败: ${response.status} ${response.statusText}`)
      } catch {
        throw new Error(`搜索图片失败: ${response.status} ${response.statusText}`)
      }
    }

    const result: SearchImageResponse = await response.json()

    console.log('[MediaAPI] 搜索图片成功:', {
      query: request.query,
      count: result.data?.length || 0,
      total: result.total
    })

    return result
  } catch (error: any) {
    console.error('[MediaAPI] 搜索图片失败:', {
      error: error.message,
      stack: error.stack,
      url,
      request
    })
    throw error
  }
}

/**
 * 搜索视频
 * @param request 搜索请求参数
 * @returns 视频列表
 */
export async function searchVideo(
  request: SearchVideoRequest
): Promise<SearchVideoResponse> {
  const endpoint = '/v1/media/search-video'
  const url = buildUrl(endpoint)

  console.log('[MediaAPI] 搜索视频:', {
    url,
    query: request.query,
    provider: request.provider,
    limit: request.limit
  })

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: request.query,
        provider: request.provider || 'all',
        limit: request.limit || 10
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[MediaAPI] 搜索视频失败:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url
      })
      
      try {
        const errorData = JSON.parse(errorText)
        const errorMessage = Array.isArray(errorData.message) 
          ? errorData.message.join(', ')
          : errorData.message
        throw new Error(errorMessage || `搜索视频失败: ${response.status} ${response.statusText}`)
      } catch {
        throw new Error(`搜索视频失败: ${response.status} ${response.statusText}`)
      }
    }

    const result: SearchVideoResponse = await response.json()

    console.log('[MediaAPI] 搜索视频成功:', {
      query: request.query,
      count: result.data?.length || 0,
      total: result.total
    })

    return result
  } catch (error: any) {
    console.error('[MediaAPI] 搜索视频失败:', {
      error: error.message,
      stack: error.stack,
      url,
      request
    })
    throw error
  }
}

/**
 * 上传媒体（保存媒体URL到数据库）
 * @param request 上传请求参数
 * @returns 媒体详情
 */
export async function uploadMedia(
  request: UploadMediaRequest
): Promise<MediaDetail> {
  const endpoint = '/v1/media/upload'
  const url = buildUrl(endpoint)

  console.log('[MediaAPI] 上传媒体:', {
    url,
    mediaType: request.mediaType,
    hasMetadata: !!request.metadata
  })

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: request.url,
        mediaType: request.mediaType || 'image',
        metadata: request.metadata
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[MediaAPI] 上传媒体失败:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url
      })
      
      try {
        const errorData = JSON.parse(errorText)
        const errorMessage = Array.isArray(errorData.message) 
          ? errorData.message.join(', ')
          : errorData.message
        throw new Error(errorMessage || `上传媒体失败: ${response.status} ${response.statusText}`)
      } catch {
        throw new Error(`上传媒体失败: ${response.status} ${response.statusText}`)
      }
    }

    const result: UploadMediaResponse = await response.json()

    console.log('[MediaAPI] 上传媒体成功:', {
      mediaId: result.data.id,
      mediaType: result.data.mediaType
    })

    return result.data
  } catch (error: any) {
    console.error('[MediaAPI] 上传媒体失败:', {
      error: error.message,
      stack: error.stack,
      url,
      request
    })
    throw error
  }
}

/**
 * 获取媒体详情
 * @param mediaId 媒体ID（UUID）
 * @returns 媒体详情
 */
export async function getMediaDetail(
  mediaId: string
): Promise<MediaDetail> {
  const endpoint = `/v1/media/${mediaId}`
  const url = buildUrl(endpoint)

  console.log('[MediaAPI] 获取媒体详情:', {
    url,
    mediaId
  })

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[MediaAPI] 获取媒体详情失败:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url
      })
      
      if (response.status === 404) {
        throw new Error(`媒体不存在: ${mediaId}`)
      }
      
      try {
        const errorData = JSON.parse(errorText)
        const errorMessage = Array.isArray(errorData.message) 
          ? errorData.message.join(', ')
          : errorData.message
        throw new Error(errorMessage || `获取媒体详情失败: ${response.status} ${response.statusText}`)
      } catch {
        throw new Error(`获取媒体详情失败: ${response.status} ${response.statusText}`)
      }
    }

    const result: GetMediaDetailResponse = await response.json()

    console.log('[MediaAPI] 获取媒体详情成功:', {
      mediaId: result.data.id,
      mediaType: result.data.mediaType
    })

    return result.data
  } catch (error: any) {
    console.error('[MediaAPI] 获取媒体详情失败:', {
      error: error.message,
      stack: error.stack,
      url,
      mediaId
    })
    throw error
  }
}

