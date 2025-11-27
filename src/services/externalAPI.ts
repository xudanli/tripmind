/**
 * 外部 API 服务
 * 对接后端 /api/external 和 /api/v1 接口（包括 TripAdvisor、天气等外部数据源）
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

/**
 * 天气预报项
 */
export interface WeatherForecast {
  date: string // YYYY-MM-DD
  temperature: number
  condition: string
}

/**
 * 目的地天气信息
 */
export interface DestinationWeather {
  temperature: number // 当前温度（摄氏度）
  condition: string // 天气状况（如：晴天、多云、雨天等）
  humidity?: number // 湿度（百分比，可选）
  windSpeed?: number // 风速（可选）
  forecast?: WeatherForecast[] // 天气预报（可选）
}

/**
 * 通过名称查找或创建目的地
 */
export interface FindOrCreateDestinationRequest {
  name: string
}

export interface FindOrCreateDestinationResponse {
  success: boolean
  data: {
    id: string
    name: string
    slug: string
    countryCode?: string | null
    geoJson?: any
    createdAt: string
    updatedAt: string
  }
  isNew: boolean
}

/**
 * 通过名称查找或创建目的地，获取目的地ID
 * @param name 目的地名称
 * @returns 目的地信息，如果失败则返回 null
 */
export async function findOrCreateDestination(
  name: string
): Promise<FindOrCreateDestinationResponse['data'] | null> {
  const endpoint = '/v1/destinations/find-or-create'
  const url = buildUrl(endpoint)

  console.log('[ExternalAPI] 查找或创建目的地:', {
    url,
    name
  })

  try {
    const requestBody: FindOrCreateDestinationRequest = { name }
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.warn('[ExternalAPI] 查找或创建目的地失败:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        name
      })
      return null
    }

    const apiData: FindOrCreateDestinationResponse = await response.json()

    if (!apiData.success) {
      console.warn('[ExternalAPI] 查找或创建目的地返回失败:', {
        name,
        response: apiData
      })
      return null
    }

    console.log('[ExternalAPI] 查找或创建目的地成功:', {
      id: apiData.data.id,
      name: apiData.data.name,
      isNew: apiData.isNew
    })

    return apiData.data
  } catch (error: any) {
    console.warn('[ExternalAPI] 查找或创建目的地失败（不影响主流程）:', {
      error: error.message,
      name,
      url
    })
    return null
  }
}

/**
 * 获取目的地天气信息
 * @param destinationId 目的地ID（UUID）
 * @returns 天气信息，如果失败则返回 null
 */
export async function getDestinationWeather(
  destinationId: string
): Promise<DestinationWeather | null> {
  // 注意：这是公开接口，不需要认证
  const endpoint = `/v1/destinations/${destinationId}/weather`
  const url = buildUrl(endpoint)

  console.log('[ExternalAPI] 获取目的地天气信息:', {
    url,
    destinationId
  })

  try {
    // 使用普通 fetch，因为这是公开接口
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include' // 如果需要 Cookie，保留这个选项
    })

    if (!response.ok) {
      // 如果是 404，说明目的地不存在
      if (response.status === 404) {
        console.warn('[ExternalAPI] 目的地不存在:', destinationId)
        return null
      }
      
      // 如果是 501，说明天气 API 未配置，返回占位符数据
      if (response.status === 501) {
        console.info('[ExternalAPI] 天气 API 未配置，返回占位符数据')
        // 返回占位符数据
        return {
          temperature: 20,
          condition: '晴天',
          humidity: 60,
          windSpeed: 10,
          forecast: [
            {
              date: new Date().toISOString().split('T')[0] || '',
              temperature: 20,
              condition: '晴天'
            }
          ]
        }
      }
      
      // 其他错误，尝试解析错误信息
      const errorText = await response.text()
      console.warn('[ExternalAPI] 获取天气信息失败:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      return null
    }

    const weatherData: DestinationWeather = await response.json()

    console.log('[ExternalAPI] 天气信息获取成功:', {
      destinationId,
      temperature: weatherData.temperature,
      condition: weatherData.condition,
      hasForecast: !!weatherData.forecast && weatherData.forecast.length > 0
    })

    return weatherData
  } catch (error: any) {
    // 网络错误或其他异常，不抛出错误，只记录警告
    console.warn('[ExternalAPI] 获取天气信息失败（不影响主流程）:', {
      error: error.message,
      destinationId,
      url
    })
    return null
  }
}

/**
 * POI 搜索请求参数
 */
export interface POISearchRequest {
  query: string
  destination?: string
  latitude?: number
  longitude?: number
  type?: 'attraction' | 'restaurant' | 'hotel' | 'shopping' | 'all'
  limit?: number
}

/**
 * POI 搜索结果项
 */
export interface POISearchResult {
  id: string
  name: string
  address?: string
  latitude: number
  longitude: number
  type: string
  rating?: number
  imageUrl?: string
  description?: string
}

/**
 * POI 搜索响应
 */
export interface POISearchResponse {
  data: POISearchResult[]
  total: number
}

/**
 * 搜索兴趣点（POI）
 * 
 * 接口说明：
 * - 路径：POST /api/v1/poi/search
 * - 认证：不需要认证（公开接口）
 * - 用途：在行程规划中搜索附近的景点、餐厅等，供前端 ExperienceDay 组件使用
 * 
 * 特殊类型处理：
 * - 对于 gas_station、ev_charging、rest_area，前端会发送 type: "all"
 * - 后端会根据 query 参数（"加油站"、"充电桩"、"休息站"）来过滤结果
 * 
 * @param request 搜索请求参数
 * @returns POI 列表
 */
export async function searchPOI(request: POISearchRequest): Promise<POISearchResult[]> {
  const endpoint = '/v1/poi/search'
  const url = buildUrl(endpoint)

  console.log('[ExternalAPI] 搜索 POI:', {
    url,
    query: request.query,
    destination: request.destination,
    latitude: request.latitude,
    longitude: request.longitude,
    type: request.type,
    limit: request.limit
  })

  try {
    // 这是公开接口，不需要认证
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.warn('[ExternalAPI] POI 搜索失败:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        request
      })
      
      // 如果是 400 错误，可能是参数验证失败
      if (response.status === 400) {
        try {
          const errorData = JSON.parse(errorText)
          // 如果错误信息是数组（验证错误），记录详细信息
          if (Array.isArray(errorData.message)) {
            console.warn('[ExternalAPI] 参数验证失败:', errorData.message)
          } else {
            console.warn('[ExternalAPI] 参数验证失败:', errorData.message || errorData.error)
          }
        } catch {
          // 无法解析错误信息，记录原始错误
          console.warn('[ExternalAPI] 参数验证失败（无法解析错误信息）')
        }
        // 400 错误返回空数组，不抛出异常
        return []
      }
      
      // 其他错误：根据文档要求，返回空结果而不是抛出异常，保证接口的稳定性
      // 如果 Travel Advisor API 未配置或返回错误，会返回空结果
      console.warn('[ExternalAPI] POI 搜索返回错误状态，返回空结果:', {
        status: response.status,
        statusText: response.statusText
      })
      return []
    }

    const apiData: POISearchResponse = await response.json()

    console.log('[ExternalAPI] POI 搜索成功:', {
      query: request.query,
      resultCount: apiData.data?.length || 0,
      total: apiData.total || 0
    })

    return apiData.data || []
  } catch (error: any) {
    // 根据文档要求，不会抛出错误，保证接口的稳定性
    // 如果搜索失败，返回空结果，前端会自动回退到 AI 搜索
    console.warn('[ExternalAPI] POI 搜索失败（不影响主流程，返回空结果）:', {
      error: error.message,
      request,
      url
    })
    return [] // 返回空数组而不是抛出错误
  }
}

/**
 * 获取通用旅行安全通知列表查询参数
 */
export interface GetAlertsQueryParams {
  destination?: string
  countryCode?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  status?: 'active' | 'expired' | 'archived'
  startDate?: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
  page?: number
  limit?: number
}

/**
 * 旅行安全通知项
 */
export interface TravelAlert {
  id: string
  title: string
  content: string
  destination?: string
  countryCode?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'expired' | 'archived'
  startDate: string // ISO 8601
  endDate?: string // ISO 8601
  metadata?: Record<string, any>
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
}

/**
 * 获取通用旅行安全通知列表响应
 */
export interface GetAlertsResponse {
  data: TravelAlert[]
  total: number
  page: number
  limit: number
}

/**
 * 获取通用旅行安全通知列表
 * @param params 查询参数
 * @returns 安全通知列表
 */
export async function getTravelAlerts(
  params: GetAlertsQueryParams = {}
): Promise<GetAlertsResponse> {
  const endpoint = '/v1/alerts'
  const url = buildUrl(endpoint)

  // 构建查询参数
  const queryParams = new URLSearchParams()
  if (params.destination) queryParams.append('destination', params.destination)
  if (params.countryCode) queryParams.append('countryCode', params.countryCode)
  if (params.severity) queryParams.append('severity', params.severity)
  if (params.status) queryParams.append('status', params.status)
  if (params.startDate) queryParams.append('startDate', params.startDate)
  if (params.endDate) queryParams.append('endDate', params.endDate)
  if (params.page) queryParams.append('page', params.page.toString())
  if (params.limit) queryParams.append('limit', params.limit.toString())

  const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url

  console.log('[ExternalAPI] 获取旅行安全通知:', {
    url: fullUrl,
    params
  })

  try {
    // 这是公开接口，不需要认证
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.warn('[ExternalAPI] 获取旅行安全通知失败:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        params
      })
      
      // 如果是 400 错误，可能是参数验证失败，返回空列表
      if (response.status === 400) {
        return {
          data: [],
          total: 0,
          page: params.page || 1,
          limit: params.limit || 20
        }
      }
      
      // 其他错误，尝试解析错误信息
      try {
        const errorData = JSON.parse(errorText)
        throw new Error(errorData.message || `获取旅行安全通知失败: ${response.status}`)
      } catch {
        throw new Error(`获取旅行安全通知失败: ${response.status} ${response.statusText}`)
      }
    }

    const apiData: GetAlertsResponse = await response.json()

    console.log('[ExternalAPI] 获取旅行安全通知成功:', {
      resultCount: apiData.data?.length || 0,
      total: apiData.total || 0,
      page: apiData.page || 1
    })

    return apiData
  } catch (error: any) {
    console.warn('[ExternalAPI] 获取旅行安全通知失败（不影响主流程）:', {
      error: error.message,
      params,
      url: fullUrl
    })
    // 返回空列表而不是抛出错误
    return {
      data: [],
      total: 0,
      page: params.page || 1,
      limit: params.limit || 20
    }
  }
}

