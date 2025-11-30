/**
 * 旅行攻略 API 服务
 * 对接后端 /api/travel-guides 接口
 */

import { API_CONFIG } from '@/config/api'
import { authenticatedFetch, handleApiError } from './authAPI'

// ==================== 类型定义 ====================

/**
 * TripAdvisor 单平台搜索请求参数
 */
export interface TripAdvisorSearchRequest {
  destination: string  // 目的地，例如 "日本"、"Tokyo"
  limit?: number      // 返回条目数上限（1-100），默认 50
  language?: string   // 希望返回的语言代码（如 "zh-CN"），默认 "zh-CN"
}

/**
 * 平台配置
 */
export interface PlatformConfig {
  name: string        // 平台名称，例如 "马蜂窝"
  domain: string      // 平台域名，例如 "mafengwo.cn"
  searchUrl?: string  // 搜索URL模板（可选，当前未使用）
}

/**
 * 多平台攻略聚合搜索请求参数
 */
export interface PlatformSearchRequest {
  destination: string        // 目的地名称，例如 "日本"、"Tokyo"
  platforms: PlatformConfig[] // 要搜索的平台列表
  limit?: number             // 返回数量上限（1-100），默认 50
}

/**
 * 旅行攻略条目
 */
export interface TravelGuide {
  id: string                  // 攻略ID
  title: string               // 攻略标题
  excerpt: string             // 攻略摘要
  url: string                 // 攻略链接
  source: string              // 来源平台，例如 "TripAdvisor"、"马蜂窝"
  publishedAt: string | null  // 发布时间（ISO 8601 格式）
  tags: string[]              // 标签数组
  imageUrl: string | null     // 封面图片URL
  author: string | null       // 作者
  readTime: number | null     // 阅读时长（分钟）
}

/**
 * API 响应格式
 */
export interface TravelGuidesResponse {
  success: boolean
  data: TravelGuide[]
  message: string | null
  error: string | null
}

// ==================== 工具函数 ====================

const baseUrl = (API_CONFIG.BASE_URL || '').replace(/\/$/, '')

/**
 * 构建完整 URL
 */
const buildUrl = (endpoint: string): string => {
  // 确保 endpoint 以 / 开头
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  // 确保 baseUrl 不以 / 结尾（已在上面处理）
  return `${baseUrl}${normalizedEndpoint}`
}

// ==================== API 函数 ====================

/**
 * TripAdvisor 单平台搜索
 * @param params 搜索参数
 * @returns 旅行攻略列表
 */
export async function searchTripAdvisorGuides(
  params: TripAdvisorSearchRequest
): Promise<TravelGuide[]> {
  const { destination, limit = 50, language = 'zh-CN' } = params
  
  // 构建查询参数
  const queryParams = new URLSearchParams({
    destination,
    limit: limit.toString(),
    language
  })
  
  const endpoint = `/travel-guides/search?${queryParams.toString()}`
  const url = buildUrl(endpoint)
  
  console.log('[TravelGuidesAPI] TripAdvisor 搜索请求:', {
    url,
    destination,
    limit,
    language
  })
  
  try {
    const response = await authenticatedFetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      await handleApiError(response)
    }
    
    const result: TravelGuidesResponse = await response.json()
    
    console.log('[TravelGuidesAPI] TripAdvisor 搜索响应:', {
      success: result.success,
      count: result.data?.length || 0,
      message: result.message,
      error: result.error
    })
    
    if (!result.success) {
      // 如果返回成功但数据为空，可能是降级处理，返回空数组
      if (result.error === 'TRIPADVISOR_SERVICE_ERROR' || result.message) {
        console.warn('[TravelGuidesAPI] TripAdvisor 服务不可用:', result.message)
        return []
      }
      throw new Error(result.message || result.error || '搜索失败')
    }
    
    return result.data || []
  } catch (error: any) {
    console.error('[TravelGuidesAPI] TripAdvisor 搜索失败:', error)
    throw error
  }
}

/**
 * 多平台攻略聚合搜索
 * @param params 搜索参数
 * @returns 旅行攻略列表
 */
export async function searchPlatformGuides(
  params: PlatformSearchRequest
): Promise<TravelGuide[]> {
  const { destination, platforms, limit = 50 } = params
  
  const endpoint = '/travel-guides/platform-search'
  const url = buildUrl(endpoint)
  
  console.log('[TravelGuidesAPI] 多平台搜索请求:', {
    url,
    destination,
    platforms: platforms.map(p => p.name),
    limit
  })
  
  try {
    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        destination,
        platforms,
        limit
      })
    })
    
    if (!response.ok) {
      await handleApiError(response)
    }
    
    const result: TravelGuidesResponse = await response.json()
    
    console.log('[TravelGuidesAPI] 多平台搜索响应:', {
      success: result.success,
      count: result.data?.length || 0,
      message: result.message,
      error: result.error
    })
    
    if (!result.success) {
      // 如果返回成功但数据为空，可能是 API 未配置，返回空数组
      if (result.error === 'GOOGLE_API_NOT_CONFIGURED' || result.message) {
        console.warn('[TravelGuidesAPI] Google Custom Search API 未配置:', result.message)
        return []
      }
      throw new Error(result.message || result.error || '搜索失败')
    }
    
    return result.data || []
  } catch (error: any) {
    console.error('[TravelGuidesAPI] 多平台搜索失败:', error)
    throw error
  }
}

/**
 * 预设的平台配置
 */
export const PRESET_PLATFORMS: PlatformConfig[] = [
  { name: '马蜂窝', domain: 'mafengwo.cn' },
  { name: '携程', domain: 'ctrip.com' },
  { name: '穷游网', domain: 'qyer.com' },
  { name: '飞猪', domain: 'fliggy.com' },
  { name: 'TripAdvisor', domain: 'tripadvisor.com' },
  { name: 'Lonely Planet', domain: 'lonelyplanet.com' },
  { name: 'Rough Guides', domain: 'roughguides.com' },
  { name: 'Wikitravel', domain: 'wikitravel.org' }
]

/**
 * 获取常用平台配置（前4个）
 */
export function getCommonPlatforms(): PlatformConfig[] {
  return PRESET_PLATFORMS.slice(0, 4)
}

/**
 * 获取所有平台配置
 */
export function getAllPlatforms(): PlatformConfig[] {
  return [...PRESET_PLATFORMS]
}

