/**
 * 外部 API 服务
 * 对接后端 /api/external 接口（包括 TripAdvisor 等外部数据源）
 */

import { API_CONFIG } from '@/config/api'
import { authenticatedFetch, handleApiError } from './authAPI'

/**
 * Travel Advisor 搜索结果项
 */
export interface LocationSearchResult {
  result_type: string
  result_object: {
    location_id?: string
    name?: string
    coordinates?: {
      latitude?: number
      longitude?: number
    }
    [key: string]: any
  }
}

export interface LocationSearchResponse {
  success?: boolean
  data?: {
    data?: LocationSearchResult[]
  }
}

/**
 * 搜索 Travel Advisor 目的地/景点
 * @param query 搜索关键字
 * @returns 搜索结果列表
 */
export async function searchLocations(query: string): Promise<LocationSearchResult[]> {
  const endpoint = '/external/locations'
  const url = buildUrl(endpoint)
  
  // 构建查询参数
  const queryParams = new URLSearchParams()
  queryParams.append('query', query)
  const fullUrl = `${url}?${queryParams.toString()}`

  console.log('[ExternalAPI] 搜索 Travel Advisor 位置:', {
    url: fullUrl,
    query
  })

  try {
    const response = await authenticatedFetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      // 如果是 400 错误，可能是 API Key 缺失或请求格式问题，不抛出错误，返回空数组
      if (response.status === 400) {
        console.warn('[ExternalAPI] 后端返回 400 错误（可能是 API Key 缺失）:', {
          query,
          url: fullUrl
        })
        return []
      }
      // 其他错误继续抛出
      await handleApiError(response)
    }

    const apiData: LocationSearchResponse = await response.json()

    // 处理不同的响应格式
    let results: LocationSearchResult[] = []
    if (apiData.data?.data && Array.isArray(apiData.data.data)) {
      results = apiData.data.data
    } else if (Array.isArray(apiData.data)) {
      results = apiData.data
    }

    console.log('[ExternalAPI] 位置搜索成功:', {
      query,
      resultCount: results.length,
      resultTypes: results.map(r => r.result_type)
    })

    return results
  } catch (error: any) {
    // 不抛出错误，只记录警告，返回空数组，避免阻塞主流程
    console.warn('[ExternalAPI] 搜索位置失败（不影响主流程）:', {
      error: error.message,
      query,
      url: fullUrl
    })
    return []  // 返回空数组而不是抛出错误
  }
}

/**
 * 通过活动名称搜索 TripAdvisor 景点 ID（使用后端接口）
 * @param query 搜索查询（活动名称 + 目的地）
 * @param language 语言代码（暂时未使用，后端接口可能不支持）
 * @returns TripAdvisor 景点 ID，如果未找到则返回 null
 */
async function searchTripAdvisorLocationId(query: string, language: string = 'zh-CN'): Promise<string | null> {
  try {
    // 使用后端接口搜索位置（searchLocations 现在会返回空数组而不是抛出错误）
    const results = await searchLocations(query)
    
    // 如果结果为空，说明搜索失败（可能是 API Key 缺失或网络问题）
    if (!results || results.length === 0) {
      // 不记录警告，因为 searchLocations 已经记录过了
      return null
    }
    
    // 查找景点类型的结果（things_to_do 或 lodging）
    const match = results.find((item) => 
      item?.result_type === 'things_to_do' || item?.result_type === 'lodging'
    )
    
    const locationId = match?.result_object?.location_id
    
    if (!locationId) {
      // 只在不常见的情况下记录警告（例如返回了结果但没有匹配的类型）
      if (results.length > 0) {
        console.warn('[ExternalAPI] 未找到 TripAdvisor 景点 ID:', {
          activityName: query.split(' ')[0], // 假设第一个词是活动名称
          destination: query.split(' ').slice(-1)[0], // 假设最后一个词是目的地
          searchQuery: query,
          availableTypes: results.map(r => r.result_type)
        })
      }
      return null
    }
    
    return locationId
  } catch (error: any) {
    // 这个 catch 块理论上不应该被执行，因为 searchLocations 不会抛出错误
    // 但为了安全起见，仍然保留
    console.warn('[ExternalAPI] 搜索 TripAdvisor ID 失败（异常情况）:', {
      query,
      error: error.message
    })
    return null
  }
}

const baseUrl = (API_CONFIG.BASE_URL || '').replace(/\/$/, '')

const buildUrl = (endpoint: string) => {
  if (!endpoint.startsWith('/')) return endpoint
  if (!baseUrl) return endpoint
  return `${baseUrl}${endpoint}`
}

/**
 * TripAdvisor 景点详情响应数据
 */
export interface AttractionDetails {
  id: string
  name: string
  address?: string
  coordinates?: {
    lat: number
    lng: number
  }
  rating?: {
    rating: number
    reviewCount: number
    ratingDistribution?: {
      excellent?: number
      very_good?: number
      average?: number
      poor?: number
      terrible?: number
    }
  }
  ticketInfo?: {
    requiresTicket?: boolean
    priceRange?: {
      min?: number
      max?: number
      currency?: string
      description?: string
    }
    purchaseMethod?: string
    purchaseUrl?: string
  }
  openingHours?: string
  phone?: string
  website?: string
  description?: string
  category?: string
  tripadvisorUrl?: string
}

export interface AttractionDetailsResponse {
  success: boolean
  data: AttractionDetails
}

/**
 * 获取 TripAdvisor 景点详情
 * @param attractionId TripAdvisor 景点ID（location_id）
 * @param lang 语言代码（默认 'zh-CN'）
 * @returns 景点详情
 */
export async function getAttractionDetails(
  attractionId: string,
  lang: string = 'zh-CN'
): Promise<AttractionDetails> {
  const endpoint = `/external/attractions/${attractionId}`
  const url = buildUrl(endpoint)
  
  // 构建查询参数
  const queryParams = new URLSearchParams()
  if (lang) {
    queryParams.append('lang', lang)
  }
  const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url

  console.log('[ExternalAPI] 获取景点详情:', {
    url: fullUrl,
    attractionId,
    lang
  })

  try {
    const response = await authenticatedFetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      // 如果是 404，说明景点不存在，这是正常情况
      if (response.status === 404) {
        console.warn('[ExternalAPI] 景点不存在:', attractionId)
        throw new Error('ATTRACTION_NOT_FOUND')
      }
      await handleApiError(response)
    }

    const apiData: AttractionDetailsResponse = await response.json()

    if (!apiData.success) {
      throw new Error('获取景点详情失败')
    }

    console.log('[ExternalAPI] 景点详情获取成功:', {
      attractionId,
      name: apiData.data.name,
      hasTicketInfo: !!apiData.data.ticketInfo,
      hasRating: !!apiData.data.rating
    })

    return apiData.data
  } catch (error: any) {
    // 如果是景点不存在错误，直接抛出特殊错误
    if (error.message === 'ATTRACTION_NOT_FOUND') {
      throw error
    }
    
    console.error('[ExternalAPI] 获取景点详情失败:', {
      error: error.message,
      attractionId,
      url: fullUrl
    })
    throw error
  }
}

/**
 * 将 TripAdvisor 景点详情转换为活动 pricing.detail 格式
 * @param details 景点详情
 * @returns pricing.detail 字符串
 */
export function convertAttractionDetailsToPricingDetail(
  details: AttractionDetails
): string | null {
  if (!details.ticketInfo) {
    return null
  }

  const lines: string[] = []

  // 价格区间
  if (details.ticketInfo.priceRange) {
    const { min, max, currency, description } = details.ticketInfo.priceRange
    if (description) {
      lines.push(description)
    } else if (min !== undefined || max !== undefined) {
      const currencySymbol = currency || 'CNY'
      if (min !== undefined && max !== undefined) {
        lines.push(`成人票 ${min}-${max} ${currencySymbol}`)
      } else if (min !== undefined) {
        lines.push(`最低价格：${min} ${currencySymbol}`)
      } else if (max !== undefined) {
        lines.push(`最高价格：${max} ${currencySymbol}`)
      }
    }
  }

  // 购票方式
  if (details.ticketInfo.purchaseMethod) {
    lines.push(`购票方式：${details.ticketInfo.purchaseMethod}`)
  }

  // 是否需要门票
  if (details.ticketInfo.requiresTicket === false) {
    lines.push('免费开放')
  }

  return lines.length > 0 ? lines.join('\n') : null
}

/**
 * 通过活动名称搜索 TripAdvisor 景点 ID，然后调用后端接口获取门票价格信息
 * @param activityName 活动名称
 * @param destination 目的地
 * @param lang 语言代码（默认 'zh-CN'）
 * @returns 门票价格信息字符串，如果失败则返回 null
 */
export async function getAttractionPricingBySearch(
  activityName: string,
  destination: string,
  lang: string = 'zh-CN'
): Promise<string | null> {
  try {
    // 构建搜索查询：活动名称 + 目的地
    const searchQuery = `${activityName} ${destination}`
    
    // 1. 先搜索 TripAdvisor 景点 ID
    const locationId = await searchTripAdvisorLocationId(searchQuery, lang)
    
    if (!locationId) {
      console.warn('[ExternalAPI] 未找到 TripAdvisor 景点 ID:', {
        activityName,
        destination,
        searchQuery
      })
      return null
    }
    
    // 2. 调用后端接口获取景点详情
    const details = await getAttractionDetails(locationId, lang)
    
    // 3. 将景点详情转换为 pricing.detail 格式
    const pricingDetail = convertAttractionDetailsToPricingDetail(details)
    
    return pricingDetail
  } catch (error: any) {
    // 如果是景点不存在错误，不记录警告（这是正常情况）
    if (error.message === 'ATTRACTION_NOT_FOUND') {
      return null
    }
    
    console.warn('[ExternalAPI] 搜索景点门票信息失败:', {
      activityName,
      destination,
      error: error.message
    })
    return null
  }
}

