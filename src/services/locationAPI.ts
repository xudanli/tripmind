/**
 * 位置信息生成 API 服务
 * 对接后端 /api/location 接口
 * 
 * 功能：
 * - 准确地理编码（支持自然语言）
 * - 生成单个活动位置信息
 * - 批量生成活动位置信息
 * 
 * 特性：
 * - 支持缓存（24小时）
 * - AI生成详细位置信息（地址、交通、开放时间、价格等）
 * - 支持多种活动类型（attraction、meal、hotel、shopping、transport、ocean）
 * 
 * 文档：参见位置信息生成 API 文档
 */

import { API_CONFIG } from '@/config/api'
import { authenticatedFetch, handleApiError } from './authAPI'

const baseUrl = (API_CONFIG.BASE_URL || '').replace(/\/$/, '')

const buildUrl = (endpoint: string) => {
  if (!endpoint.startsWith('/')) return endpoint
  if (!baseUrl) return endpoint
  return `${baseUrl}${endpoint}`
}

/**
 * 准确地理编码请求
 */
export interface AccurateGeocodeRequest {
  /** 地点查询文本（支持自然语言描述，最少2个字符） */
  query: string
  /** 是否强制使用 AI 辅助（默认 false，自动判断） */
  useAI?: boolean
  /** 位置上下文（可选），例如当前行程的目的地或用户地图当前的中心点，用于提高搜索准确度，避免同名地点冲突 */
  context?: string
}

/**
 * 准确地理编码响应
 */
export interface AccurateGeocodeResponse {
  success: boolean
  name?: string
  address?: string
  location?: {
    latitude: number
    longitude: number
  }
  countryCode?: string
  placeType?: string
  usedAI?: boolean
}

/**
 * 准确地理编码
 * 
 * 接口路径：POST /api/v1/destinations/geocode/accurate
 * 认证：不需要（公开接口）
 * 
 * 支持自然语言描述的地点查询，结合 AI 意图识别和 Mapbox Geocoding API
 * 
 * @param request 请求参数
 * @returns 地理编码结果
 * @throws {Error} 请求失败时抛出错误
 * 
 * @example
 * ```typescript
 * // 标准地名查询
 * const result1 = await accurateGeocode({ query: '奈良公园' })
 * 
 * // 自然语言查询
 * const result2 = await accurateGeocode({ query: '那个有很多鹿的日本公园' })
 * 
 * // 强制使用 AI
 * const result3 = await accurateGeocode({ 
 *   query: '哈佛大学附近的那个有名的红砖美术馆',
 *   useAI: true 
 * })
 * 
 * // 带位置上下文（提高准确性，避免同名地点冲突）
 * const result4 = await accurateGeocode({ 
 *   query: '最好吃的拉面',
 *   context: '东京' // 指定搜索范围在东京，避免搜索到其他城市的同名地点
 * })
 * 
 * // 使用位置上下文避免同名地点冲突
 * const result5 = await accurateGeocode({ 
 *   query: '中央公园',
 *   context: '东京' // 优先搜索东京的中央公园，而不是纽约的
 * })
 * ```
 */
export async function accurateGeocode(
  request: AccurateGeocodeRequest
): Promise<AccurateGeocodeResponse | null> {
  const endpoint = '/v1/destinations/geocode/accurate'
  const url = buildUrl(endpoint)

  console.log('[LocationAPI] 发起准确地理编码请求:', {
    url,
    query: request.query,
    useAI: request.useAI,
    context: request.context
  })

  try {
    // 构建请求体，确保字段顺序和类型正确
    const requestBody: {
      query: string
      useAI?: boolean
      context?: string
    } = {
      query: request.query
    }
    
    // 只有在明确设置为 true 时才添加 useAI 字段（避免传递 false）
    if (request.useAI === true) {
      requestBody.useAI = true
    }
    
    // 如果提供了 context，添加到请求体中（去除首尾空格）
    if (request.context && request.context.trim()) {
      requestBody.context = request.context.trim()
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      // 尝试解析错误信息
      try {
        const errorData = await response.json()
        throw new Error(errorData.message || `地理编码请求失败: ${response.status}`)
      } catch {
        throw new Error(`地理编码请求失败: ${response.status} ${response.statusText}`)
      }
    }

    const result: AccurateGeocodeResponse = await response.json()

    if (!result.success) {
      console.log('[LocationAPI] 地理编码未找到匹配地点:', request.query)
      return null
    }

    console.log('[LocationAPI] 地理编码成功:', {
      query: request.query,
      name: result.name,
      address: result.address,
      location: result.location,
      countryCode: result.countryCode,
      placeType: result.placeType,
      usedAI: result.usedAI
    })

    return result
  } catch (error: any) {
    console.error('[LocationAPI] 地理编码失败:', {
      error: error.message,
      query: request.query,
      url
    })
    throw error
  }
}

/**
 * 单个活动位置信息请求
 * 
 * @see 位置信息生成 API 文档
 */
export interface GenerateLocationRequest {
  /** 活动名称，如 "铁力士峰云端漫步" */
  activityName: string
  /** 目的地，如 "瑞士琉森" */
  destination: string
  /** 活动类型 */
  activityType: 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'
  /** 坐标信息 */
  coordinates: {
    /** 纬度 (-90 到 90) */
    lat: number
    /** 经度 (-180 到 180) */
    lng: number
    /** 区域（可选），如 "市中心区域" */
    region?: string
  }
}

/**
 * 位置信息响应数据
 * 
 * 包含活动的详细位置信息，由 AI 生成，确保与活动名称、目的地、坐标完全一致
 * 
 * @see 位置信息生成 API 文档
 */
export interface LocationInfo {
  /** 中文名称（与活动内容精确匹配，不能泛泛） */
  chineseName: string
  /** 当地语言名称（如有官方多语言译名请全部补充） */
  localName: string
  /** 中文地址（包含门牌号、街道、行政区、邮编，若无门牌用最近公共建筑或官方入口） */
  chineseAddress: string
  /** 当地语言详细地址（格式同上） */
  localAddress: string
  /** 详细交通信息（必须可执行）：地铁/轻轨（具体站名+出口+步行时间）、公交（线路号+下车站名）、自驾（停车场名称+费用+入口导航点）、步行路线（从最近地标/车站出发的具体指引） */
  transportInfo: string
  /** 开放时间（按季节/节假日区分，包含最不拥挤时段、避暑/避雨建议） */
  openingHours: string
  /** 门票价格（详细说明：成人/儿童/老人价格，是否需预约、是否有免费时段、是否接受电子票） */
  ticketPrice: string
  /** 游览建议（以行动为主：怎么走、怎么拍、怎么体验，体力需求、携带物品、避坑提示） */
  visitTips: string
  /** 周边推荐（可选）：临近景点、服务点、便利店、洗手间、补给点 */
  nearbyAttractions?: string
  /** 联系方式（可选）：官方电话、邮箱、官网 */
  contactInfo?: string
  /** 景点类型（必须与活动类型匹配） */
  category: string
  /** 评分 (1-5) */
  rating: number
  /** 建议游览时长（分钟） */
  visitDuration: string
  /** 最佳游览时间（结合季节、天气、人群情况） */
  bestTimeToVisit: string
  /** 无障碍设施信息（可选） */
  accessibility?: string
  /** 穿搭建议（可选）：温度范围、风雨情况、鞋子类型、保暖层级，室内/宗教场所的着装礼仪 */
  dressingTips?: string
  /** 当地文化提示（可选）：小费习惯、排队礼仪、宗教禁忌、拍照限制，与该目的地相关的高频误区提醒 */
  culturalTips?: string
  /** 预订信息（可选，强执行性）：是否需要提前预约、推荐预订渠道（官网/APP/电话）、建议提前多久预订、是否有快速通道/免费取消等政策 */
  bookingInfo?: string
}

export interface GenerateLocationResponse {
  success: boolean
  data: LocationInfo
}

/**
 * 批量活动位置信息请求中的单个活动
 */
export interface BatchActivity {
  /** 活动名称 */
  activityName: string
  /** 目的地 */
  destination: string
  /** 活动类型 */
  activityType: 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'
  /** 坐标信息 */
  coordinates: {
    /** 纬度 (-90 到 90) */
    lat: number
    /** 经度 (-180 到 180) */
    lng: number
    /** 区域（可选） */
    region?: string
  }
}

/**
 * 批量生成位置信息请求
 * 
 * 建议每次批量请求不超过 10 个活动
 */
export interface GenerateLocationBatchRequest {
  /** 活动列表 */
  activities: BatchActivity[]
}

/**
 * 批量生成结果中的单个活动位置信息
 */
export interface BatchLocationResult {
  /** 活动名称 */
  activityName: string
  /** 位置信息 */
  locationInfo: LocationInfo
}

/**
 * 批量生成位置信息响应
 */
export interface GenerateLocationBatchResponse {
  success: boolean
  data: BatchLocationResult[]
}

/**
 * 异步任务状态
 */
export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused' | 'not_found'

/**
 * 任务状态响应
 */
export interface JobStatusData {
  id: string
  status: JobStatus
  progress?: number
  result?: BatchLocationResult[]  // 任务完成时的结果（包含 activityName 和 locationInfo）
  error?: string
  data?: {
    activities: BatchActivity[]
  }
}

/**
 * 异步批量生成位置信息响应（入队响应）
 */
export interface EnqueueLocationBatchResponse {
  success: boolean
  jobId: string
}

/**
 * 任务状态查询响应
 */
export interface JobStatusResponse {
  success: boolean
  data: JobStatusData
}

/**
 * 任务结果响应
 */
export interface JobResultResponse {
  success: boolean
  data: BatchLocationResult[]
}

/**
 * 生成单个活动位置信息
 * 
 * 接口路径：POST /api/location/generate
 * 认证：需要 JWT Bearer Token
 * 缓存：位置信息会缓存 24 小时，相同活动+目的地+类型的请求会直接返回缓存结果
 * 
 * @param request 请求参数
 * @returns 位置信息
 * @throws {Error} 参数验证失败、未认证或生成失败时抛出错误
 * 
 * @example
 * ```typescript
 * const locationInfo = await generateLocation({
 *   activityName: '铁力士峰云端漫步',
 *   destination: '瑞士琉森',
 *   activityType: 'attraction',
 *   coordinates: { lat: 46.7704, lng: 8.4050 }
 * })
 * ```
 */
export async function generateLocation(
  request: GenerateLocationRequest
): Promise<LocationInfo> {
  const endpoint = '/location/generate'
  const url = buildUrl(endpoint)

  console.log('[LocationAPI] 发起位置信息生成请求:', {
    url,
    activityName: request.activityName,
    destination: request.destination,
    activityType: request.activityType
  })

  try {
    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      await handleApiError(response)
    }

    const apiData: GenerateLocationResponse = await response.json()

    if (!apiData.success) {
      throw new Error('位置信息生成失败')
    }

    console.log('[LocationAPI] 位置信息生成成功:', {
      activityName: request.activityName,
      chineseName: apiData.data.chineseName
    })

    return apiData.data
  } catch (error: any) {
    console.error('[LocationAPI] 位置信息生成失败:', {
      error: error.message,
      activityName: request.activityName,
      url
    })
    throw error
  }
}

/**
 * 批量生成活动位置信息
 * 
 * 接口路径：POST /api/location/generate-batch
 * 认证：需要 JWT Bearer Token
 * 缓存：每个活动的位置信息会缓存 24 小时
 * 
 * @param request 批量请求参数（建议每次不超过 10 个活动）
 * @returns 位置信息列表
 * @throws {Error} 参数验证失败、未认证或生成失败时抛出错误
 * 
 * @example
 * ```typescript
 * const results = await generateLocationBatch({
 *   activities: [
 *     {
 *       activityName: '铁力士峰云端漫步',
 *       destination: '瑞士琉森',
 *       activityType: 'attraction',
 *       coordinates: { lat: 46.7704, lng: 8.4050 }
 *     },
 *     {
 *       activityName: '琉森湖游船',
 *       destination: '瑞士琉森',
 *       activityType: 'attraction',
 *       coordinates: { lat: 47.0502, lng: 8.3093 }
 *     }
 *   ]
 * })
 * ```
 */
export async function generateLocationBatch(
  request: GenerateLocationBatchRequest
): Promise<BatchLocationResult[]> {
  const endpoint = '/location/generate-batch'
  const url = buildUrl(endpoint)

  console.log('[LocationAPI] 发起批量位置信息生成请求:', {
    url,
    activitiesCount: request.activities.length
  })

  try {
    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      await handleApiError(response)
    }

    const apiData: GenerateLocationBatchResponse = await response.json()

    if (!apiData.success) {
      throw new Error('批量位置信息生成失败')
    }

    console.log('[LocationAPI] 批量位置信息生成成功:', {
      count: apiData.data.length,
      activities: apiData.data.map(r => r.activityName)
    })

    return apiData.data
  } catch (error: any) {
    console.error('[LocationAPI] 批量位置信息生成失败:', {
      error: error.message,
      activitiesCount: request.activities.length,
      url
    })
    throw error
  }
}

/**
 * 异步批量生成活动位置信息
 * 
 * 接口路径：POST /api/location/generate-batch-async
 * 认证：需要 JWT Bearer Token
 * 
 * 适用于大量活动（> 5个）的场景，立即返回 jobId，不等待任务完成
 * 
 * @param request 批量请求参数
 * @returns 任务 ID
 * @throws {Error} 参数验证失败、未认证或入队失败时抛出错误
 * 
 * @example
 * ```typescript
 * const { jobId } = await generateLocationBatchAsync({
 *   activities: [
 *     {
 *       activityName: '铁力士峰云端漫步',
 *       destination: '瑞士琉森',
 *       activityType: 'attraction',
 *       coordinates: { lat: 46.7704, lng: 8.4050 }
 *     }
 *   ]
 * })
 * ```
 */
export async function generateLocationBatchAsync(
  request: GenerateLocationBatchRequest
): Promise<string> {
  const endpoint = '/location/generate-batch-async'
  const url = buildUrl(endpoint)

  console.log('[LocationAPI] 发起异步批量位置信息生成请求:', {
    url,
    activitiesCount: request.activities.length
  })

  try {
    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      await handleApiError(response)
    }

    const apiData: EnqueueLocationBatchResponse = await response.json()

    if (!apiData.success) {
      throw new Error('异步批量位置信息生成任务入队失败')
    }

    console.log('[LocationAPI] 异步批量位置信息生成任务已入队:', {
      jobId: apiData.jobId,
      activitiesCount: request.activities.length
    })

    return apiData.jobId
  } catch (error: any) {
    console.error('[LocationAPI] 异步批量位置信息生成任务入队失败:', {
      error: error.message,
      activitiesCount: request.activities.length,
      url
    })
    throw error
  }
}

/**
 * 查询任务状态
 * 
 * 接口路径：GET /api/location/job/:jobId
 * 认证：需要 JWT Bearer Token
 * 
 * @param jobId 任务 ID
 * @returns 任务状态数据
 * @throws {Error} 未认证或查询失败时抛出错误
 * 
 * @example
 * ```typescript
 * const status = await getLocationJobStatus('job-123')
 * console.log(status.status, status.progress)
 * ```
 */
export async function getLocationJobStatus(jobId: string): Promise<JobStatusData> {
  const endpoint = `/location/job/${jobId}`
  const url = buildUrl(endpoint)

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

    const apiData: JobStatusResponse = await response.json()

    if (!apiData.success) {
      throw new Error('查询任务状态失败')
    }

    return apiData.data
  } catch (error: any) {
    console.error('[LocationAPI] 查询任务状态失败:', {
      error: error.message,
      jobId,
      url
    })
    throw error
  }
}

/**
 * 获取任务结果
 * 
 * 接口路径：GET /api/location/job/:jobId/result
 * 认证：需要 JWT Bearer Token
 * 
 * @param jobId 任务 ID
 * @returns 位置信息生成结果数组
 * @throws {Error} 未认证或获取失败时抛出错误
 * 
 * @example
 * ```typescript
 * const results = await getLocationJobResult('job-123')
 * ```
 */
export async function getLocationJobResult(jobId: string): Promise<BatchLocationResult[]> {
  const endpoint = `/location/job/${jobId}/result`
  const url = buildUrl(endpoint)

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

    const apiData: JobResultResponse = await response.json()

    if (!apiData.success) {
      throw new Error('获取任务结果失败')
    }

    console.log('[LocationAPI] 获取任务结果成功:', {
      jobId,
      count: apiData.data.length
    })

    return apiData.data
  } catch (error: any) {
    console.error('[LocationAPI] 获取任务结果失败:', {
      error: error.message,
      jobId,
      url
    })
    throw error
  }
}

/**
 * 查询已存储的位置信息请求参数
 */
export interface QueryLocationRequest {
  /** 活动名称 */
  activityName: string
  /** 目的地 */
  destination: string
  /** 活动类型 */
  activityType: 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'
}

/**
 * 查询已存储的位置信息响应
 */
export interface QueryLocationResponse {
  success: boolean
  data: LocationInfo | null
}

/**
 * 查询已存储的位置信息
 * 
 * 接口路径：GET /api/location/query
 * 认证：需要 JWT Bearer Token
 * 
 * 根据活动名称、目的地和类型查询已存储的位置信息（不触发生成）
 * 如果不存在，返回 null，不会触发生成
 * 
 * @param request 查询参数
 * @returns 位置信息或 null
 * @throws {Error} 未认证或查询失败时抛出错误
 * 
 * @example
 * ```typescript
 * const locationInfo = await queryLocation({
 *   activityName: '铁力士峰云端漫步',
 *   destination: '瑞士琉森',
 *   activityType: 'attraction'
 * })
 * if (locationInfo) {
 *   console.log('位置信息已存在:', locationInfo)
 * } else {
 *   console.log('位置信息不存在，需要生成')
 * }
 * ```
 */
export async function queryLocation(
  request: QueryLocationRequest
): Promise<LocationInfo | null> {
  const params = new URLSearchParams({
    activityName: request.activityName,
    destination: request.destination,
    activityType: request.activityType
  })
  const endpoint = `/location/query?${params.toString()}`
  const url = buildUrl(endpoint)

  console.log('[LocationAPI] 查询已存储的位置信息:', {
    url,
    activityName: request.activityName,
    destination: request.destination,
    activityType: request.activityType
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

    const apiData: QueryLocationResponse = await response.json()

    if (!apiData.success) {
      throw new Error('查询位置信息失败')
    }

    if (apiData.data) {
      console.log('[LocationAPI] 位置信息查询成功:', {
        activityName: request.activityName,
        chineseName: apiData.data.chineseName
      })
    } else {
      console.log('[LocationAPI] 位置信息不存在:', {
        activityName: request.activityName
      })
    }

    return apiData.data
  } catch (error: any) {
    console.error('[LocationAPI] 查询位置信息失败:', {
      error: error.message,
      activityName: request.activityName,
      url
    })
    throw error
  }
}

/**
 * 搜索位置信息请求参数
 */
export interface SearchLocationRequest {
  /** 目的地（精确匹配，可选） */
  destination?: string
  /** 活动类型（精确匹配，可选） */
  activityType?: 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'
  /** 活动名称（模糊搜索，可选） */
  activityName?: string
  /** 每页数量，范围：1-100，默认：20 */
  limit?: number
  /** 偏移量，默认：0 */
  offset?: number
}

/**
 * 搜索位置信息响应
 */
export interface SearchLocationResponse {
  success: boolean
  data: {
    locations: LocationInfo[]
    total: number
  }
}

/**
 * 搜索位置信息
 * 
 * 接口路径：GET /api/location/search
 * 认证：需要 JWT Bearer Token
 * 
 * 根据条件搜索已存储的位置信息，支持分页
 * 支持按目的地、活动类型、活动名称（模糊搜索）筛选
 * 
 * @param request 搜索参数
 * @returns 搜索结果
 * @throws {Error} 未认证或搜索失败时抛出错误
 * 
 * @example
 * ```typescript
 * // 搜索所有景点类型的位置信息
 * const result = await searchLocations({
 *   activityType: 'attraction',
 *   limit: 20,
 *   offset: 0
 * })
 * 
 * // 按目的地搜索
 * const result2 = await searchLocations({
 *   destination: '瑞士琉森',
 *   limit: 10
 * })
 * 
 * // 模糊搜索活动名称
 * const result3 = await searchLocations({
 *   activityName: '铁力士',
 *   limit: 20
 * })
 * ```
 */
export async function searchLocations(
  request: SearchLocationRequest = {}
): Promise<{ locations: LocationInfo[]; total: number }> {
  const params = new URLSearchParams()
  
  if (request.destination) {
    params.append('destination', request.destination)
  }
  if (request.activityType) {
    params.append('activityType', request.activityType)
  }
  if (request.activityName) {
    params.append('activityName', request.activityName)
  }
  if (request.limit !== undefined) {
    params.append('limit', String(request.limit))
  }
  if (request.offset !== undefined) {
    params.append('offset', String(request.offset))
  }

  const endpoint = `/location/search${params.toString() ? `?${params.toString()}` : ''}`
  const url = buildUrl(endpoint)

  console.log('[LocationAPI] 搜索位置信息:', {
    url,
    ...request
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

    const apiData: SearchLocationResponse = await response.json()

    if (!apiData.success) {
      throw new Error('搜索位置信息失败')
    }

    console.log('[LocationAPI] 搜索位置信息成功:', {
      count: apiData.data.locations.length,
      total: apiData.data.total
    })

    return apiData.data
  } catch (error: any) {
    console.error('[LocationAPI] 搜索位置信息失败:', {
      error: error.message,
      request,
      url
    })
    throw error
  }
}

/**
 * 根据ID查询位置信息响应
 */
export interface GetLocationByIdResponse {
  success: boolean
  data: LocationInfo | null
}

/**
 * 根据ID查询位置信息
 * 
 * 接口路径：GET /api/location/:id
 * 认证：需要 JWT Bearer Token
 * 
 * 根据位置信息的唯一ID查询详细信息
 * 使用位置信息的数据库ID进行查询
 * 
 * @param id 位置信息的唯一ID（UUID格式）
 * @returns 位置信息或 null
 * @throws {Error} 未认证或查询失败时抛出错误
 * 
 * @example
 * ```typescript
 * const locationInfo = await getLocationById('550e8400-e29b-41d4-a716-446655440000')
 * if (locationInfo) {
 *   console.log('位置信息:', locationInfo)
 * } else {
 *   console.log('位置信息不存在')
 * }
 * ```
 */
export async function getLocationById(id: string): Promise<LocationInfo | null> {
  const endpoint = `/location/${id}`
  const url = buildUrl(endpoint)

  console.log('[LocationAPI] 根据ID查询位置信息:', {
    url,
    id
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

    const apiData: GetLocationByIdResponse = await response.json()

    if (!apiData.success) {
      throw new Error('查询位置信息失败')
    }

    if (apiData.data) {
      console.log('[LocationAPI] 位置信息查询成功:', {
        id,
        chineseName: apiData.data.chineseName
      })
    } else {
      console.log('[LocationAPI] 位置信息不存在:', {
        id
      })
    }

    return apiData.data
  } catch (error: any) {
    console.error('[LocationAPI] 根据ID查询位置信息失败:', {
      error: error.message,
      id,
      url
    })
    throw error
  }
}

/**
 * 将位置信息转换为前端 details 格式
 * 
 * 将后端返回的 LocationInfo 格式转换为前端组件使用的 details 对象格式
 * 
 * @param locationInfo 位置信息
 * @returns 前端 details 对象
 */
export function convertLocationInfoToDetails(locationInfo: LocationInfo): any {
  return {
    // 名称信息
    name: {
      chinese: locationInfo.chineseName,
      english: locationInfo.localName, // 使用 localName 作为英文名
      local: locationInfo.localName
    },
    // 地址信息
    address: {
      chinese: locationInfo.chineseAddress,
      english: locationInfo.localAddress,
      local: locationInfo.localAddress
    },
    // 交通信息
    transportation: locationInfo.transportInfo,
    // 开放时间
    openingHours: locationInfo.openingHours,
    // 费用明细
    pricing: {
      general: undefined, // 需要从 ticketPrice 中解析
      detail: locationInfo.ticketPrice
    },
    // 评分
    rating: locationInfo.rating,
    // 推荐和建议
    recommendations: {
      visitTips: locationInfo.visitTips,
      bestTimeToVisit: locationInfo.bestTimeToVisit,
      nearbyAttractions: locationInfo.nearbyAttractions,
      visitDuration: locationInfo.visitDuration,
      // 新增字段
      outfitSuggestions: locationInfo.dressingTips, // 着装建议
      culturalTips: locationInfo.culturalTips, // 文化提示
      bookingInfo: locationInfo.bookingInfo // 预订信息
    },
    // 联系方式
    contact: locationInfo.contactInfo ? {
      info: locationInfo.contactInfo
    } : undefined,
    // 无障碍设施
    accessibility: locationInfo.accessibility,
    // 类别
    category: locationInfo.category
  }
}

