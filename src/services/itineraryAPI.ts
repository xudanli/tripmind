/**
 * 行程 API 服务
 * 对接后端 /api/itinerary 接口（包括生成和 CRUD 操作）
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
 * API 请求参数
 */
export interface GenerateItineraryRequest {
  destination: string
  days: number
  preferences?: {
    interests?: string[]
    budget?: 'low' | 'medium' | 'high'
    travelStyle?: 'relaxed' | 'moderate' | 'intensive'
  }
  startDate: string // YYYY-MM-DD
}

/**
 * API 响应数据结构
 */
export interface GenerateItineraryResponse {
  success: boolean
  data: {
    days: ItineraryDay[]
    totalCost: number
    summary: string
  }
  generatedAt: string
}

export interface ItineraryDay {
  day: number
  date: string // YYYY-MM-DD
  activities: Activity[]
}

export interface Activity {
  time: string // HH:mm
  title: string
  type: 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'
  duration: number // 分钟
  location: {
    lat: number
    lng: number
  }
  notes: string
  cost: number
}

/**
 * 前端需要的数据格式
 */
export interface FrontendItineraryData {
  title?: string
  destination: string
  days: FrontendItineraryDay[]
  totalCost: number
  summary?: string // 摘要（可选，如果生成失败可能为空）
}

export interface FrontendItineraryDay {
  day: number
  date: string
  timeSlots: FrontendTimeSlot[]
}

export interface FrontendTimeSlot {
  time: string
  title?: string
  activity?: string
  type?: string
  coordinates?: { lat: number; lng: number }
  details?: {
    notes?: string
    description?: string
    [key: string]: any
  }
  cost?: number
  duration?: number
}

/**
 * 将 API 返回的数据转换为前端需要的格式
 * @param apiResponse API 响应数据
 * @param destination 目的地
 * @returns 前端格式的行程数据
 */
export function convertAPIResponseToFrontendFormat(
  apiResponse: GenerateItineraryResponse,
  destination: string
): FrontendItineraryData {
  const { data } = apiResponse

  // 将 activities 转换为 timeSlots
  const days: FrontendItineraryDay[] = data.days.map((day) => ({
    day: day.day,
    date: day.date,
    timeSlots: day.activities.map((activity) => ({
      time: activity.time,
      title: activity.title,
      activity: activity.title, // 使用 title 作为 activity
      type: activity.type,
      coordinates: activity.location,
      details: {
        notes: activity.notes,
        description: activity.notes // 使用 notes 作为 description
      },
      cost: typeof activity.cost === 'number' ? activity.cost : (typeof activity.cost === 'string' ? parseFloat(activity.cost) || 0 : 0),
      duration: typeof activity.duration === 'number' ? activity.duration : (typeof activity.duration === 'string' ? parseInt(activity.duration) || 60 : 60)
    }))
  }))

  // 确保 totalCost 是有效的数字
  let totalCost = 0
  if (typeof data.totalCost === 'number') {
    totalCost = data.totalCost
  } else if (typeof data.totalCost === 'string') {
    const parsed = parseFloat(data.totalCost)
    totalCost = isNaN(parsed) ? 0 : parsed
  } else if (data.totalCost != null) {
    // 尝试转换为数字
    const parsed = Number(data.totalCost)
    totalCost = isNaN(parsed) ? 0 : parsed
  }

  // 如果 totalCost 为 0，尝试从 activities 计算总和
  if (totalCost === 0 && days.length > 0) {
    totalCost = days.reduce((sum, day) => {
      return sum + day.timeSlots.reduce((daySum, slot) => {
        return daySum + (slot.cost || 0)
      }, 0)
    }, 0)
  }

  return {
    title: `${destination}之旅`,
    destination,
    days,
    totalCost,
    summary: data.summary || ''
  }
}

/**
 * 生成旅行行程（包含位置信息和摘要）
 * @param request 请求参数
 * @param options 选项
 * @param options.enrichWithLocationInfo 是否获取详细位置信息（默认 true）
 * @param options.generateSummary 是否生成旅行摘要（默认 true）
 * @param options.onProgress 进度回调函数
 * @returns 行程数据（前端格式）
 */
export async function generateItinerary(
  request: GenerateItineraryRequest,
  options?: {
    enrichWithLocationInfo?: boolean
    generateSummary?: boolean
    onProgress?: (message: string) => void
  }
): Promise<FrontendItineraryData> {
  const { enrichWithLocationInfo = true, generateSummary = true, onProgress } = options || {}
  const endpoint = '/itinerary/generate'
  const url = buildUrl(endpoint)

  const log = (message: string) => {
    console.log(`[ItineraryAPI] ${message}`)
    onProgress?.(message)
  }

  log('发起行程生成请求...')

  try {
    // 清理请求数据：移除空数组和未定义的字段
    const cleanedRequest: GenerateItineraryRequest = {
      destination: request.destination,
      days: request.days,
      startDate: request.startDate
    }

    // 处理 preferences：只包含有值的字段
    // 注意：根据后端验证规则，interests 字段不被接受，所以不发送
    if (request.preferences) {
      const cleanedPreferences: any = {}
      
      // 注意：后端不接受 interests 字段，即使文档中标记为可选
      // 如果需要传递兴趣信息，可能需要通过其他方式（如自定义字段）
      // if (request.preferences.interests && request.preferences.interests.length > 0) {
      //   cleanedPreferences.interests = request.preferences.interests
      // }
      
      // 只有当 budget 存在时才添加
      if (request.preferences.budget) {
        cleanedPreferences.budget = request.preferences.budget
      }
      
      // 只有当 travelStyle 存在时才添加
      if (request.preferences.travelStyle) {
        cleanedPreferences.travelStyle = request.preferences.travelStyle
      }
      
      // 只有当 preferences 对象不为空时才添加到请求中
      if (Object.keys(cleanedPreferences).length > 0) {
        cleanedRequest.preferences = cleanedPreferences
      }
    }

    // 尝试使用 Cookie 认证（credentials: 'include'）
    // 如果后端需要 JWT Token，可能需要从某个地方获取 token
    // 目前先使用 Cookie 方式，如果后端返回 401，再考虑添加 JWT Token 支持
    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cleanedRequest)
    })

    if (!response.ok) {
      // 如果是 500 错误，可能是后端验证失败（如 totalCost 格式问题）
      if (response.status === 500) {
        const errorText = await response.text()
        console.error('[ItineraryAPI] 后端错误响应:', errorText)
        // 尝试解析错误信息
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.message?.includes('totalCost') || errorData.message?.includes('格式不正确')) {
            throw new Error('行程生成失败：数据格式验证失败，请重试。如果问题持续，请联系技术支持。')
          }
        } catch {
          // 忽略解析错误，继续使用 handleApiError
        }
      }
      await handleApiError(response)
    }

    const apiData: GenerateItineraryResponse = await response.json()

    if (!apiData.success) {
      throw new Error(apiData.data?.summary || '行程生成失败')
    }

    // 验证和修复数据格式（防止 AI 返回格式不正确的数据）
    if (apiData.data) {
      // 确保 totalCost 是数字
      if (typeof apiData.data.totalCost !== 'number') {
        console.warn('[ItineraryAPI] totalCost 格式不正确，尝试转换:', apiData.data.totalCost)
        const parsed = typeof apiData.data.totalCost === 'string' 
          ? parseFloat(apiData.data.totalCost) 
          : Number(apiData.data.totalCost)
        apiData.data.totalCost = isNaN(parsed) ? 0 : parsed
      }

      // 验证 days 数组
      if (Array.isArray(apiData.data.days)) {
        apiData.data.days = apiData.data.days.map((day) => ({
          ...day,
          activities: (day.activities || []).map((activity: any) => ({
            ...activity,
            cost: typeof activity.cost === 'number' ? activity.cost : (typeof activity.cost === 'string' ? parseFloat(activity.cost) || 0 : 0),
            duration: typeof activity.duration === 'number' ? activity.duration : (typeof activity.duration === 'string' ? parseInt(activity.duration) || 60 : 60)
          }))
        }))
      }
    }

    log(`行程生成成功，共 ${apiData.data?.days?.length || 0} 天`)

    // 转换为前端格式
    let frontendData = convertAPIResponseToFrontendFormat(apiData, request.destination)

    // 如果需要获取详细位置信息
    if (enrichWithLocationInfo) {
      log('开始获取活动位置信息...')
      frontendData = await enrichItineraryWithLocationInfo(frontendData, request.destination, onProgress)
      log('位置信息获取完成')
    }

    // 如果需要生成旅行摘要
    if (generateSummary) {
      log('开始生成旅行摘要...')
      try {
        const summary = await generateTravelSummaryForItinerary(
          frontendData,
          request.destination,
          frontendData.totalCost,
          onProgress
        )
        frontendData.summary = summary
        log('旅行摘要生成完成')
      } catch (error: any) {
        console.warn('[ItineraryAPI] 摘要生成失败，使用默认摘要:', error.message)
        // 摘要生成失败不影响整体流程，使用 API 返回的默认摘要
        if (apiData.data.summary) {
          frontendData.summary = apiData.data.summary
        }
      }
    } else if (apiData.data.summary) {
      // 如果不生成新摘要，使用 API 返回的默认摘要
      frontendData.summary = apiData.data.summary
    }

    return frontendData
  } catch (error: any) {
    console.error('[ItineraryAPI] 行程生成失败:', {
      error: error.message,
      stack: error.stack,
      url
    })
    throw error
  }
}

/**
 * 为行程生成旅行摘要
 * @param itineraryData 行程数据
 * @param destination 目的地
 * @param totalCost 总费用
 * @param onProgress 进度回调
 * @returns 生成的摘要
 */
async function generateTravelSummaryForItinerary(
  itineraryData: FrontendItineraryData,
  destination: string,
  totalCost?: number,
  onProgress?: (message: string) => void
): Promise<string> {
  const { generateTravelSummary, convertItineraryToSummaryRequest } = await import('./travelSummaryAPI')
  
  const log = (message: string) => {
    console.log(`[ItineraryAPI] ${message}`)
    onProgress?.(message)
  }

  // 转换为 API 请求格式
  const summaryRequest = convertItineraryToSummaryRequest(itineraryData, destination, totalCost)

  // 调用摘要生成接口
  const summary = await generateTravelSummary(summaryRequest)

  return summary
}

/**
 * 为行程中的活动批量获取位置信息
 * @param itineraryData 行程数据
 * @param destination 目的地
 * @param onProgress 进度回调
 * @returns 增强后的行程数据
 */
async function enrichItineraryWithLocationInfo(
  itineraryData: FrontendItineraryData,
  destination: string,
  onProgress?: (message: string) => void
): Promise<FrontendItineraryData> {
  const { generateLocationBatch, convertLocationInfoToDetails } = await import('./locationAPI')
  
  const log = (message: string) => {
    console.log(`[ItineraryAPI] ${message}`)
    onProgress?.(message)
  }

  // 收集所有需要获取位置信息的活动
  const activities: Array<{
    activityName: string
    destination: string
    activityType: 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'
    coordinates: { lat: number; lng: number }
    dayIndex: number
    slotIndex: number
  }> = []

  itineraryData.days.forEach((day, dayIndex) => {
    day.timeSlots.forEach((slot, slotIndex) => {
      if (slot.coordinates && slot.title && slot.type) {
        activities.push({
          activityName: slot.title,
          destination,
          activityType: slot.type as any,
          coordinates: slot.coordinates,
          dayIndex,
          slotIndex
        })
      }
    })
  })

  if (activities.length === 0) {
    log('没有需要获取位置信息的活动')
    return itineraryData
  }

  log(`准备获取 ${activities.length} 个活动的位置信息...`)

  try {
    // 批量获取位置信息（每次最多 10 个）
    const BATCH_SIZE = 10
    const locationResults: Map<string, any> = new Map()

    for (let i = 0; i < activities.length; i += BATCH_SIZE) {
      const batch = activities.slice(i, i + BATCH_SIZE)
      log(`正在获取第 ${i + 1}-${Math.min(i + BATCH_SIZE, activities.length)} 个活动的位置信息...`)

      const batchRequest = {
        activities: batch.map(a => ({
          activityName: a.activityName,
          destination: a.destination,
          activityType: a.activityType,
          coordinates: a.coordinates
        }))
      }

      const results = await generateLocationBatch(batchRequest)

      // 将结果存储到 Map 中，使用 activityName 作为 key
      results.forEach(result => {
        locationResults.set(result.activityName, result.locationInfo)
      })
    }

    // 将位置信息合并到 timeSlots 中
    const enrichedDays = itineraryData.days.map((day, dayIndex) => ({
      ...day,
      timeSlots: day.timeSlots.map((slot, slotIndex) => {
        const locationInfo = locationResults.get(slot.title || '')
        if (locationInfo) {
          // 合并位置信息到 details 中
          const locationDetails = convertLocationInfoToDetails(locationInfo)
          // 深度合并 details，保留原有字段
          const mergedDetails = {
            ...(slot.details || {}),
            // 合并 name 对象
            name: {
              ...(slot.details?.name || {}),
              ...locationDetails.name
            },
            // 合并 address 对象
            address: {
              ...(slot.details?.address || {}),
              ...locationDetails.address
            },
            // 合并其他字段（如果原有字段不存在，则使用新字段）
            ...Object.keys(locationDetails).reduce((acc, key) => {
              if (key !== 'name' && key !== 'address' && !slot.details?.[key]) {
                acc[key] = locationDetails[key]
              }
              return acc
            }, {} as any)
          }
          return {
            ...slot,
            details: mergedDetails
          }
        }
        return slot
      })
    }))

    log(`成功获取 ${locationResults.size} 个活动的位置信息`)

    return {
      ...itineraryData,
      days: enrichedDays
    }
  } catch (error: any) {
    console.error('[ItineraryAPI] 获取位置信息失败:', error)
    log('获取位置信息失败，使用基础行程数据')
    // 即使位置信息获取失败，也返回基础行程数据
    return itineraryData
  }
}

// ==================== 行程 CRUD 接口 ====================

/**
 * 创建行程请求参数
 */
export interface CreateItineraryRequest {
  destination: string
  startDate: string // YYYY-MM-DD
  days: number
  data: {
    days: Array<{
      day: number
      date: string // YYYY-MM-DD
      activities: Array<{
        time: string // HH:mm
        title: string
        type: 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'
        duration: number
        location: {
          lat: number
          lng: number
        }
        notes: string
        cost: number
      }>
    }>
    totalCost: number
    summary: string
  }
  preferences?: {
    interests?: string[]
    budget?: 'low' | 'medium' | 'high'
    travelStyle?: 'relaxed' | 'moderate' | 'intensive'
  }
  status?: 'draft' | 'published' | 'archived'
}

/**
 * 创建行程响应
 */
export interface CreateItineraryResponse {
  success: boolean
  data: {
    id: string
    destination: string
    startDate: string
    daysCount: number
    summary: string
    totalCost: number
    days: ItineraryDay[]
    preferences?: {
      interests?: string[]
      budget?: 'low' | 'medium' | 'high'
      travelStyle?: 'relaxed' | 'moderate' | 'intensive'
    }
    status: 'draft' | 'published' | 'archived'
    createdAt: string
    updatedAt: string
  }
}

/**
 * 获取行程列表请求参数
 */
export interface GetItineraryListParams {
  status?: 'draft' | 'published' | 'archived'
  page?: number
  limit?: number
}

/**
 * 获取行程列表响应
 */
export interface GetItineraryListResponse {
  success: boolean
  data: Array<{
    id: string
    destination: string
    startDate: string
    days: number
    summary?: string
    totalCost?: number
    status: 'draft' | 'published' | 'archived'
    createdAt: string
    updatedAt: string
  }>
  total: number
  page: number
  limit: number
}

/**
 * 获取行程详情响应
 */
export interface GetItineraryDetailResponse {
  success: boolean
  data: {
    id: string
    destination: string
    startDate: string
    daysCount: number
    summary: string
    totalCost: number
    days: ItineraryDay[]
    preferences?: {
      interests?: string[]
      budget?: 'low' | 'medium' | 'high'
      travelStyle?: 'relaxed' | 'moderate' | 'intensive'
    }
    status: 'draft' | 'published' | 'archived'
    createdAt: string
    updatedAt: string
  }
}

/**
 * 更新行程请求参数
 */
export interface UpdateItineraryRequest {
  destination?: string
  startDate?: string // YYYY-MM-DD
  days?: number
  summary?: string
  totalCost?: number
  preferences?: {
    interests?: string[]
    budget?: 'low' | 'medium' | 'high'
    travelStyle?: 'relaxed' | 'moderate' | 'intensive'
  }
  status?: 'draft' | 'published' | 'archived'
}

/**
 * 更新行程响应
 */
export interface UpdateItineraryResponse {
  success: boolean
  data: {
    id: string
    destination: string
    startDate: string
    daysCount: number
    summary: string
    totalCost: number
    days: ItineraryDay[]
    preferences?: {
      interests?: string[]
      budget?: 'low' | 'medium' | 'high'
      travelStyle?: 'relaxed' | 'moderate' | 'intensive'
    }
    status: 'draft' | 'published' | 'archived'
    createdAt: string
    updatedAt: string
  }
}

/**
 * 删除行程响应
 */
export interface DeleteItineraryResponse {
  success: boolean
  message: string
}

/**
 * 创建行程
 * @param request 请求参数
 * @returns 创建的行程数据
 */
export async function createItinerary(
  request: CreateItineraryRequest
): Promise<CreateItineraryResponse['data']> {
  const endpoint = '/itinerary'
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] 创建行程:', {
    url,
    destination: request.destination,
    days: request.days,
    startDate: request.startDate
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

    const apiData: CreateItineraryResponse = await response.json()

    if (!apiData.success) {
      throw new Error('创建行程失败')
    }

    console.log('[ItineraryAPI] 行程创建成功:', {
      id: apiData.data.id,
      destination: apiData.data.destination
    })

    return apiData.data
  } catch (error: any) {
    console.error('[ItineraryAPI] 创建行程失败:', {
      error: error.message,
      stack: error.stack,
      url
    })
    throw error
  }
}

/**
 * 获取行程列表
 * @param params 查询参数
 * @returns 行程列表
 */
export async function getItineraryList(
  params?: GetItineraryListParams
): Promise<GetItineraryListResponse> {
  const endpoint = '/itinerary'
  const url = buildUrl(endpoint)

  // 构建查询参数
  const queryParams = new URLSearchParams()
  if (params?.status) {
    queryParams.append('status', params.status)
  }
  if (params?.page) {
    queryParams.append('page', params.page.toString())
  }
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString())
  }

  const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url

  console.log('[ItineraryAPI] 获取行程列表:', {
    url: fullUrl,
    params
  })

  try {
    const response = await authenticatedFetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      await handleApiError(response)
    }

    const apiData: GetItineraryListResponse = await response.json()

    if (!apiData.success) {
      throw new Error('获取行程列表失败')
    }

    console.log('[ItineraryAPI] 获取行程列表成功:', {
      count: apiData.data.length,
      total: apiData.total,
      page: apiData.page
    })

    return apiData
  } catch (error: any) {
    console.error('[ItineraryAPI] 获取行程列表失败:', {
      error: error.message,
      stack: error.stack,
      url: fullUrl
    })
    throw error
  }
}

/**
 * 获取行程详情
 * @param id 行程ID
 * @returns 行程详情
 */
export async function getItineraryDetail(
  id: string
): Promise<GetItineraryDetailResponse['data']> {
  const endpoint = `/itinerary/${id}`
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] 获取行程详情:', {
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

    const apiData: GetItineraryDetailResponse = await response.json()

    if (!apiData.success) {
      throw new Error('获取行程详情失败')
    }

    console.log('[ItineraryAPI] 获取行程详情成功:', {
      id: apiData.data.id,
      destination: apiData.data.destination
    })

    return apiData.data
  } catch (error: any) {
    console.error('[ItineraryAPI] 获取行程详情失败:', {
      error: error.message,
      stack: error.stack,
      url
    })
    throw error
  }
}

/**
 * 更新行程
 * @param id 行程ID
 * @param request 更新请求参数
 * @returns 更新后的行程数据
 */
export async function updateItinerary(
  id: string,
  request: UpdateItineraryRequest
): Promise<UpdateItineraryResponse['data']> {
  const endpoint = `/itinerary/${id}`
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] 更新行程:', {
    url,
    id,
    updates: Object.keys(request)
  })

  try {
    // 清理请求数据：移除空数组和未定义的字段
    const cleanedRequest: any = {}

    if (request.destination !== undefined) {
      cleanedRequest.destination = request.destination
    }
    if (request.startDate !== undefined) {
      cleanedRequest.startDate = request.startDate
    }
    if (request.days !== undefined) {
      cleanedRequest.days = request.days
    }
    if (request.summary !== undefined) {
      cleanedRequest.summary = request.summary
    }
    if (request.totalCost !== undefined) {
      cleanedRequest.totalCost = request.totalCost
    }
    if (request.status !== undefined) {
      cleanedRequest.status = request.status
    }

    // 处理 preferences：只包含有值的字段，不包含 interests
    if (request.preferences) {
      const cleanedPreferences: any = {}
      
      // 注意：后端不接受 interests 字段
      // if (request.preferences.interests && request.preferences.interests.length > 0) {
      //   cleanedPreferences.interests = request.preferences.interests
      // }
      
      if (request.preferences.budget) {
        cleanedPreferences.budget = request.preferences.budget
      }
      
      if (request.preferences.travelStyle) {
        cleanedPreferences.travelStyle = request.preferences.travelStyle
      }
      
      if (Object.keys(cleanedPreferences).length > 0) {
        cleanedRequest.preferences = cleanedPreferences
      }
    }

    const response = await authenticatedFetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cleanedRequest)
    })

    if (!response.ok) {
      await handleApiError(response)
    }

    const apiData: UpdateItineraryResponse = await response.json()

    if (!apiData.success) {
      throw new Error('更新行程失败')
    }

    console.log('[ItineraryAPI] 更新行程成功:', {
      id: apiData.data.id,
      destination: apiData.data.destination
    })

    return apiData.data
  } catch (error: any) {
    console.error('[ItineraryAPI] 更新行程失败:', {
      error: error.message,
      stack: error.stack,
      url
    })
    throw error
  }
}

/**
 * 删除行程
 * @param id 行程ID
 * @returns 删除结果
 */
export async function deleteItinerary(id: string): Promise<void> {
  const endpoint = `/itinerary/${id}`
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] 删除行程:', {
    url,
    id
  })

  try {
    const response = await authenticatedFetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      await handleApiError(response)
    }

    const apiData: DeleteItineraryResponse = await response.json()

    if (!apiData.success) {
      throw new Error('删除行程失败')
    }

    console.log('[ItineraryAPI] 删除行程成功:', {
      id,
      message: apiData.message
    })
  } catch (error: any) {
    console.error('[ItineraryAPI] 删除行程失败:', {
      error: error.message,
      stack: error.stack,
      url
    })
    throw error
  }
}

/**
 * 将前端行程数据转换为创建行程的 API 请求格式
 * @param frontendData 前端行程数据
 * @param destination 目的地
 * @param startDate 开始日期
 * @param preferences 用户偏好
 * @param status 状态
 * @returns API 请求格式
 */
export function convertFrontendDataToCreateRequest(
  frontendData: FrontendItineraryData,
  destination: string,
  startDate: string,
  preferences?: {
    interests?: string[]
    budget?: 'low' | 'medium' | 'high'
    travelStyle?: 'relaxed' | 'moderate' | 'intensive'
  },
  status: 'draft' | 'published' | 'archived' = 'draft'
): CreateItineraryRequest {
  // 将 timeSlots 转换为 activities
  const days = frontendData.days.map((day) => ({
    day: day.day,
    date: day.date,
    activities: day.timeSlots
      .filter((slot) => slot.title && slot.type && slot.coordinates) // 只包含有效的活动
      .map((slot) => ({
        time: slot.time,
        title: slot.title || '',
        type: (slot.type || 'attraction') as Activity['type'],
        duration: slot.duration || 60, // 默认 60 分钟
        location: slot.coordinates!,
        notes: slot.details?.notes || slot.details?.description || '',
        cost: slot.cost || 0
      }))
  }))

  // 清理 preferences：不包含 interests
  const cleanedPreferences = preferences ? {
    budget: preferences.budget,
    travelStyle: preferences.travelStyle
  } : undefined

  return {
    destination,
    startDate,
    days: frontendData.days.length,
    data: {
      days,
      totalCost: frontendData.totalCost,
      summary: frontendData.summary || ''
    },
    preferences: cleanedPreferences,
    status
  }
}

