/**
 * 行程 API 服务
 * 对接后端 /api/v1/journeys 接口（包括生成和 CRUD 操作）
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
  id?: string // 天数ID（可选，后端可能返回）
  day: number
  date: string // YYYY-MM-DD
  activities: Activity[]
}

export interface Activity {
  id?: string // 活动ID（可选，后端可能返回）
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
  details?: {
    [key: string]: any
  }
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
    timeSlots: day.activities.map((activity) => {
      // 确保所有字段都被正确映射
      const slot = {
      time: activity.time,
      title: activity.title,
      activity: activity.title, // 使用 title 作为 activity
      type: activity.type,
      coordinates: activity.location,
      // 将 notes 同时映射到多个位置，确保所有组件都能访问到
        notes: activity.notes || '', // 直接映射到 slot.notes，供 buildNotes 使用
      details: {
          notes: activity.notes || '', // 保留在 details.notes 中
          description: activity.notes || '' // 使用 notes 作为 description
      },
      cost: typeof activity.cost === 'number' ? activity.cost : (typeof activity.cost === 'string' ? parseFloat(activity.cost) || 0 : 0),
      duration: typeof activity.duration === 'number' ? activity.duration : (typeof activity.duration === 'string' ? parseInt(activity.duration) || 60 : 60)
      }
      
      // 确保所有字段都存在（即使为空值）
      console.log('[ItineraryAPI] 转换 activity 到 timeSlot:', {
        time: slot.time,
        title: slot.title,
        type: slot.type,
        hasNotes: !!slot.notes,
        hasCost: slot.cost > 0,
        hasDuration: slot.duration > 0,
        hasCoordinates: !!slot.coordinates
      })
      
      return slot
    })
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
  const endpoint = '/v1/journeys/generate'
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
export async function enrichItineraryWithLocationInfo(
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

    // 对于景点类型的活动，额外获取门票价格信息
    const attractionActivities = activities.filter(a => a.activityType === 'attraction')
    const pricingResults: Map<string, string | null> = new Map()
    
    if (attractionActivities.length > 0) {
      log(`准备获取 ${attractionActivities.length} 个景点的门票价格信息...`)
      const { getAttractionPricingBySearch } = await import('./externalAPI')
      
      // 并行获取门票价格信息（但限制并发数，避免过多请求）
      const CONCURRENT_LIMIT = 3
      for (let i = 0; i < attractionActivities.length; i += CONCURRENT_LIMIT) {
        const batch = attractionActivities.slice(i, i + CONCURRENT_LIMIT)
        const pricingPromises = batch.map(async (activity) => {
          try {
            const pricing = await getAttractionPricingBySearch(
              activity.activityName,
              activity.destination,
              'zh-CN'
            )
            return { activityName: activity.activityName, pricing }
          } catch (error: any) {
            console.warn('[ItineraryAPI] 获取门票价格失败:', {
              activityName: activity.activityName,
              error: error.message
            })
            return { activityName: activity.activityName, pricing: null }
          }
        })
        
        const results = await Promise.all(pricingPromises)
        results.forEach(({ activityName, pricing }) => {
          if (pricing) {
            pricingResults.set(activityName, pricing)
          }
        })
        
        if (i + CONCURRENT_LIMIT < attractionActivities.length) {
          log(`已获取 ${Math.min(i + CONCURRENT_LIMIT, attractionActivities.length)}/${attractionActivities.length} 个景点的门票价格信息...`)
        }
      }
      
      log(`成功获取 ${pricingResults.size} 个景点的门票价格信息`)
    }

    // 将位置信息和门票价格信息合并到 timeSlots 中
    const enrichedDays = itineraryData.days.map((day, dayIndex) => ({
      ...day,
      timeSlots: day.timeSlots.map((slot, slotIndex) => {
        const locationInfo = locationResults.get(slot.title || '')
        const pricingDetail = pricingResults.get(slot.title || '')
        
        if (locationInfo || pricingDetail) {
          // 合并位置信息到 details 中
          let mergedDetails = { ...(slot.details || {}) }
          
          if (locationInfo) {
          const locationDetails = convertLocationInfoToDetails(locationInfo)
          // 深度合并 details，保留原有字段
            mergedDetails = {
              ...mergedDetails,
            // 合并 name 对象
            name: {
                ...(mergedDetails.name || {}),
              ...locationDetails.name
            },
            // 合并 address 对象
            address: {
                ...(mergedDetails.address || {}),
              ...locationDetails.address
            },
              // 合并其他字段（openingHours、transportation、pricing 等优先使用位置信息）
            ...Object.keys(locationDetails).reduce((acc, key) => {
                if (key !== 'name' && key !== 'address') {
                  // 对于 openingHours、transportation、pricing、rating、recommendations 等字段，优先使用位置信息
                  if (['openingHours', 'transportation', 'pricing', 'rating', 'recommendations', 'contact', 'accessibility'].includes(key)) {
                    acc[key] = locationDetails[key] || mergedDetails[key]
                  } else if (!mergedDetails[key]) {
                acc[key] = locationDetails[key]
                  }
              }
              return acc
            }, {} as any)
          }
          }
          
          // 如果有门票价格信息，合并到 pricing.detail 中（优先使用 TripAdvisor 数据）
          if (pricingDetail) {
            if (!mergedDetails.pricing) {
              mergedDetails.pricing = {}
            }
            mergedDetails.pricing.detail = pricingDetail
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
  // 注意：后端不接受 mode 字段，mode 信息只在本地 Travel 对象中保存
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
    mode?: 'planner' | 'seeker' | 'inspiration' // 模式标识
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
    mode?: 'planner' | 'seeker' | 'inspiration' // 模式标识
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
    mode?: 'planner' | 'seeker' | 'inspiration' // 模式标识
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
    mode?: 'planner' | 'seeker' | 'inspiration' // 模式标识
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
 * 从前端数据格式更新行程请求参数
 */
export interface UpdateJourneyFromFrontendDataRequest {
  itineraryData: {
    destination: string
    duration: number
    budget?: string
    preferences?: string[] | {
      interests?: string[]
      budget?: 'low' | 'medium' | 'high'
      travelStyle?: 'relaxed' | 'moderate' | 'intensive'
    }
    travelStyle?: string
    itinerary?: any[]
    recommendations?: {
      accommodation?: string
      transportation?: string
      food?: string
      tips?: string
      [key: string]: any
    }
    days: Array<{
      day: number
      date: string // YYYY-MM-DD
      timeSlots: Array<{
        time: string // HH:MM
        title: string
        activity?: string
        type: 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'
        coordinates: { lat: number; lng: number }
        notes?: string
        details?: {
          [key: string]: any
        }
        cost?: number
        duration?: number
      }>
    }>
    totalCost?: number
    summary?: string
    title: string
  }
  tasks?: Array<{
    title: string
    completed?: boolean
    links?: Array<{
      label: string
      url: string
    }>
  }>
  startDate?: string // YYYY-MM-DD
}

/**
 * 从前端数据格式更新行程响应
 */
export interface UpdateJourneyFromFrontendDataResponse {
  success: boolean
  data: CreateItineraryResponse['data']
}

/**
 * 创建行程
 * @param request 请求参数
 * @returns 创建的行程数据
 */
export async function createItinerary(
  request: CreateItineraryRequest
): Promise<CreateItineraryResponse['data']> {
  const endpoint = '/v1/journeys'
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

    // 如果请求中包含 days 数据，需要单独调用 days 接口保存
    if (request.data?.days && request.data.days.length > 0) {
      try {
        console.log('[ItineraryAPI] 开始保存行程天数数据...', {
          journeyId: apiData.data.id,
          daysCount: request.data.days.length,
          firstDay: request.data.days[0] ? {
            day: request.data.days[0].day,
            date: request.data.days[0].date,
            activitiesCount: request.data.days[0].activities?.length || 0
          } : null
        })
        await createJourneyDays(apiData.data.id, request.data.days)
        console.log('[ItineraryAPI] 行程天数数据保存成功')
      } catch (daysError: any) {
        console.error('[ItineraryAPI] 保存行程天数失败，但行程已创建:', {
          error: daysError.message,
          stack: daysError.stack,
          journeyId: apiData.data.id,
          daysCount: request.data.days.length
        })
        // 天数保存失败不影响行程创建，但记录详细错误以便调试
      }
    } else {
      console.warn('[ItineraryAPI] 创建行程请求中没有 days 数据，跳过保存天数步骤', {
        journeyId: apiData.data.id,
        hasData: !!request.data,
        hasDays: !!request.data?.days,
        daysLength: request.data?.days?.length || 0
      })
    }

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
  const endpoint = '/v1/journeys'
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
  const endpoint = `/v1/journeys/${id}`
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
      destination: apiData.data.destination,
      hasDays: !!apiData.data.days && apiData.data.days.length > 0
    })

    // 如果主接口返回的 days 为空或不存在，尝试从 days 接口获取
    if (!apiData.data.days || apiData.data.days.length === 0) {
      try {
        console.log('[ItineraryAPI] 主接口未返回 days 数据，尝试从 days 接口获取...')
        const days = await getJourneyDays(id)
        if (days && days.length > 0) {
          apiData.data.days = days
          console.log('[ItineraryAPI] 从 days 接口获取成功，共', days.length, '天')
        }
      } catch (daysError: any) {
        console.warn('[ItineraryAPI] 从 days 接口获取失败:', {
          error: daysError.message,
          journeyId: id
        })
        // days 获取失败不影响主流程，只记录警告
      }
    }

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
  const endpoint = `/v1/journeys/${id}`
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

    // 处理 preferences：包含所有支持的字段（根据接口文档，支持 interests）
    if (request.preferences) {
      const cleanedPreferences: any = {}
      
      // 根据接口文档，更新接口支持 interests 字段
      if (request.preferences.interests && Array.isArray(request.preferences.interests) && request.preferences.interests.length > 0) {
        cleanedPreferences.interests = request.preferences.interests
      }
      
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
  const endpoint = `/v1/journeys/${id}`
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
  status: 'draft' | 'published' | 'archived' = 'draft',
  mode?: 'planner' | 'seeker' | 'inspiration'
): CreateItineraryRequest {
  // 确保 startDate 是有效的 ISO 8601 格式（YYYY-MM-DD）
  let validStartDate: string = startDate
  if (!validStartDate || !/^\d{4}-\d{2}-\d{2}$/.test(validStartDate)) {
    const today = new Date().toISOString().split('T')[0]
    validStartDate = today || new Date().toISOString().substring(0, 10)
    console.warn('[ItineraryAPI] 日期格式不正确，使用今天日期:', validStartDate)
  }
  
  // 将 timeSlots 转换为 activities
  // 确保 day.day 是数字类型
  const days = frontendData.days.map((day, index) => ({
    day: typeof day.day === 'number' ? day.day : (index + 1), // 确保是数字
    date: day.date || validStartDate, // 如果没有日期，使用开始日期
    activities: day.timeSlots
      .filter((slot) => slot.title !== undefined && slot.type && slot.coordinates) // 只包含有效的活动
      .map((slot) => ({
        time: slot.time,
        title: slot.title || '',
        type: (slot.type || 'attraction') as Activity['type'],
        duration: typeof slot.duration === 'number' ? slot.duration : 60, // 确保是数字
        location: slot.coordinates!,
        notes: slot.details?.notes || slot.details?.description || '',
        cost: typeof slot.cost === 'number' ? slot.cost : 0 // 确保是数字
      }))
  }))

  // 清理 preferences：不包含 interests
  const cleanedPreferences = preferences ? {
    budget: preferences.budget,
    travelStyle: preferences.travelStyle
  } : undefined

  const request: CreateItineraryRequest = {
    destination,
    startDate: validStartDate,
    days: frontendData.days.length,
    data: {
      days,
      totalCost: frontendData.totalCost,
      summary: frontendData.summary || ''
    },
    preferences: cleanedPreferences,
    status
    // 注意：后端不接受 mode 字段，mode 信息只在本地 Travel 对象中保存
  }
  
  return request
}

/**
 * 将 Travel 更新数据转换为更新行程的 API 请求格式
 * @param travel Travel 对象
 * @param updates 要更新的字段
 * @returns UpdateItineraryRequest 格式
 */
export function convertTravelToUpdateRequest(
  travel: { data?: any; location?: string; description?: string; duration?: number; budget?: number; startDate?: string; endDate?: string },
  updates: Partial<{ location?: string; description?: string; duration?: number; budget?: number; startDate?: string; endDate?: string; data?: any; status?: string }>
): UpdateItineraryRequest {
  const request: UpdateItineraryRequest = {}
  
  // 处理目的地
  if (updates.location !== undefined) {
    request.destination = updates.location
  } else if (updates.data?.destination !== undefined) {
    request.destination = updates.data.destination
  } else if (updates.data?.itineraryData?.destination !== undefined) {
    request.destination = updates.data.itineraryData.destination
  } else if (travel.location) {
    request.destination = travel.location
  }
  
  // 处理开始日期
  if (updates.startDate !== undefined) {
    request.startDate = updates.startDate
  } else if (updates.data?.startDate !== undefined) {
    request.startDate = updates.data.startDate
  } else if (travel.startDate) {
    request.startDate = travel.startDate
  } else if (travel.data?.itineraryData?.days?.[0]?.date) {
    const firstDayDate = travel.data.itineraryData.days[0].date
    if (firstDayDate) {
      request.startDate = firstDayDate
    }
  }
  
  // 处理天数（避免传递 days=0）
  if (updates.duration !== undefined && updates.duration > 0) {
    request.days = updates.duration
  } else if (updates.data?.itineraryData?.days?.length !== undefined && updates.data.itineraryData.days.length > 0) {
    request.days = updates.data.itineraryData.days.length
  } else if (updates.data?.days?.length !== undefined && updates.data.days.length > 0) {
    request.days = updates.data.days.length
  } else if (travel.duration && travel.duration > 0) {
    request.days = travel.duration
  } else if (travel.data?.itineraryData?.days?.length && travel.data.itineraryData.days.length > 0) {
    request.days = travel.data.itineraryData.days.length
  }
  // 如果 days 为 0 或无效，不传递该字段，让后端自动计算
  
  // 处理摘要
  if (updates.description !== undefined) {
    request.summary = updates.description
  } else if (updates.data?.summary !== undefined) {
    request.summary = updates.data.summary
  } else if (updates.data?.itineraryData?.summary !== undefined) {
    request.summary = updates.data.itineraryData.summary
  } else if (travel.description) {
    request.summary = travel.description
  }
  
  // 处理总费用
  if (updates.budget !== undefined) {
    request.totalCost = updates.budget
  } else if (updates.data?.totalCost !== undefined) {
    request.totalCost = updates.data.totalCost
  } else if (updates.data?.itineraryData?.totalCost !== undefined) {
    request.totalCost = updates.data.itineraryData.totalCost
  } else if (travel.budget) {
    request.totalCost = travel.budget
  }
  
  // 处理偏好
  const preferences = updates.data?.itineraryData?.preferences || 
                      updates.data?.preferences || 
                      travel.data?.itineraryData?.preferences
  if (preferences) {
    request.preferences = {
      interests: preferences.interests,
      budget: preferences.budget,
      travelStyle: preferences.travelStyle
    }
  }
  
  // 处理状态
  if (updates.status !== undefined) {
    // 将前端状态转换为后端状态
    if (updates.status === 'active') {
      request.status = 'published'
    } else if (updates.status === 'completed') {
      request.status = 'archived'
    } else {
      request.status = updates.status as 'draft' | 'published' | 'archived'
    }
  }
  
  // 只返回有值的字段
  const cleanedRequest: UpdateItineraryRequest = {}
  if (request.destination !== undefined) cleanedRequest.destination = request.destination
  if (request.startDate !== undefined) cleanedRequest.startDate = request.startDate
  if (request.days !== undefined) cleanedRequest.days = request.days
  if (request.summary !== undefined) cleanedRequest.summary = request.summary
  if (request.totalCost !== undefined) cleanedRequest.totalCost = request.totalCost
  if (request.preferences !== undefined) cleanedRequest.preferences = request.preferences
  if (request.status !== undefined) cleanedRequest.status = request.status
  
  return cleanedRequest
}

// ==================== Days 相关接口 ====================

/**
 * 获取行程的所有天数
 * @param journeyId 行程ID
 * @returns 天数列表
 */
export async function getJourneyDays(
  journeyId: string
): Promise<ItineraryDay[]> {
  const endpoint = `/v1/journeys/${journeyId}/days`
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] 获取行程天数:', {
    url,
    journeyId
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

    const apiData = await response.json()

    if (!apiData.success) {
      throw new Error('获取行程天数失败')
    }

    console.log('[ItineraryAPI] 获取行程天数成功:', {
      journeyId,
      daysCount: apiData.data?.length || 0
    })

    return apiData.data || []
  } catch (error: any) {
    console.error('[ItineraryAPI] 获取行程天数失败:', {
      error: error.message,
      stack: error.stack,
      url
    })
    throw error
  }
}

/**
 * 为行程添加天数
 * @param journeyId 行程ID
 * @param days 天数数据
 * @returns 添加结果
 */
export async function createJourneyDays(
  journeyId: string,
  days: ItineraryDay[]
): Promise<ItineraryDay[]> {
  const endpoint = `/v1/journeys/${journeyId}/days`
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] 创建行程天数:', {
    url,
    journeyId,
    daysCount: days.length,
    firstDay: days[0] ? { day: days[0].day, date: days[0].date, activitiesCount: days[0].activities?.length || 0 } : null
  })

  try {
    // 【优化】创建前检查重复天数（可选，后端已自动处理，但前端检查可以提供更好的用户体验）
    let existingDays: ItineraryDay[] = []
    let uniqueDays = days
    
    try {
      // 尝试获取现有天数，检查重复
      existingDays = await getJourneyDays(journeyId)
      const existingDayNumbers = new Set(existingDays.map(d => d.day))
      const requestedDayNumbers = new Set(days.map(d => d.day))
      
      // 找出重复的天数
      const duplicateDays = days.filter(d => existingDayNumbers.has(d.day))
      uniqueDays = days.filter(d => !existingDayNumbers.has(d.day))
      
      if (duplicateDays.length > 0) {
        console.warn('[ItineraryAPI] 检测到重复天数，将被后端自动跳过:', {
          duplicateDays: duplicateDays.map(d => `第 ${d.day} 天`).join(', '),
          willCreate: uniqueDays.length,
          willSkip: duplicateDays.length
        })
      }
      
      // 如果所有天数都重复，直接返回现有天数
      if (uniqueDays.length === 0 && duplicateDays.length > 0) {
        console.log('[ItineraryAPI] 所有天数都已存在，返回现有天数')
        return existingDays.filter(d => requestedDayNumbers.has(d.day))
      }
    } catch (checkError: any) {
      // 如果获取现有天数失败，继续创建（可能是第一次创建）
      console.log('[ItineraryAPI] 无法获取现有天数（可能是首次创建），继续创建:', checkError.message)
      uniqueDays = days
    }

    // 如果没有需要创建的天数，直接返回
    if (uniqueDays.length === 0) {
      console.log('[ItineraryAPI] 没有需要创建的新天数')
      return existingDays.filter(d => days.some(day => day.day === d.day))
    }

    // 根据 Swagger 文档，POST /v1/journeys/{journeyId}/days 应该接收 days 数组
    // 尝试两种格式：先尝试直接发送数组，如果失败再尝试包装格式
    let response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(uniqueDays)
    })

    // 如果直接发送数组失败，尝试包装格式
    if (!response.ok && response.status === 400) {
      console.log('[ItineraryAPI] 直接发送数组失败，尝试包装格式...')
      const errorText = await response.text()
      console.log('[ItineraryAPI] 错误响应:', errorText)
      
      // 尝试包装格式 { days: [...] }
      response = await authenticatedFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ days: uniqueDays })
      })
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ItineraryAPI] 创建行程天数接口返回错误:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url
      })
      // 尝试解析错误信息
      try {
        const errorData = JSON.parse(errorText)
        throw new Error(errorData.message || `创建行程天数失败: ${response.status} ${response.statusText}`)
      } catch {
        throw new Error(`创建行程天数失败: ${response.status} ${response.statusText} - ${errorText}`)
      }
    }

    const apiData = await response.json()

    if (!apiData.success) {
      console.error('[ItineraryAPI] 创建行程天数接口返回失败:', {
        success: apiData.success,
        message: apiData.message,
        data: apiData.data
      })
      throw new Error(apiData.message || '创建行程天数失败')
    }

    const createdDays = apiData.data || []
    
    // 检查是否有天数被跳过（部分创建的情况）
    const createdDayNumbers = new Set(
      Array.isArray(createdDays) 
        ? createdDays.map((d: any) => d.day)
        : [createdDays.day]
    )
    
    const skippedDays = uniqueDays.filter(d => !createdDayNumbers.has(d.day))
    
    if (skippedDays.length > 0) {
      console.warn('[ItineraryAPI] 部分天数创建失败或被跳过:', {
        skippedDays: skippedDays.map(d => `第 ${d.day} 天`).join(', '),
        createdCount: createdDays.length,
        requestedCount: uniqueDays.length
      })
    }

    console.log('[ItineraryAPI] 创建行程天数成功:', {
      journeyId,
      createdCount: Array.isArray(createdDays) ? createdDays.length : 1,
      requestedCount: uniqueDays.length,
      skippedCount: skippedDays.length
    })
    
    // 返回所有创建的天数（包括后端返回的）
    return Array.isArray(createdDays) ? createdDays : [createdDays]
  } catch (error: any) {
    console.error('[ItineraryAPI] 创建行程天数失败:', {
      error: error.message,
      stack: error.stack,
      url
    })
    throw error
  }
}

/**
 * 从前端数据格式更新行程请求参数
 */
export interface UpdateJourneyFromFrontendDataRequest {
  itineraryData: {
    destination: string
    duration: number
    budget?: string
    preferences?: string[] | {
      interests?: string[]
      budget?: 'low' | 'medium' | 'high'
      travelStyle?: 'relaxed' | 'moderate' | 'intensive'
    }
    travelStyle?: string
    itinerary?: any[]
    recommendations?: {
      accommodation?: string
      transportation?: string
      food?: string
      tips?: string
      [key: string]: any
    }
    days: Array<{
      day: number
      date: string // YYYY-MM-DD
      timeSlots: Array<{
        time: string // HH:MM
        title: string
        activity?: string
        type: 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'
        coordinates: { lat: number; lng: number }
        notes?: string
        details?: {
          [key: string]: any
        }
        cost?: number
        duration?: number
      }>
    }>
    totalCost?: number
    summary?: string
    title: string
  }
  tasks?: Array<{
    title: string
    completed?: boolean
    links?: Array<{
      label: string
      url: string
    }>
  }>
  startDate?: string // YYYY-MM-DD
}

/**
 * 从前端数据格式更新行程响应
 */
export interface UpdateJourneyFromFrontendDataResponse {
  success: boolean
  data: CreateItineraryResponse['data']
}

/**
 * 从前端数据格式更新行程
 * @param journeyId 行程ID
 * @param request 请求参数（前端数据格式）
 * @returns 更新后的行程数据
 */
export async function updateJourneyFromFrontendData(
  journeyId: string,
  request: UpdateJourneyFromFrontendDataRequest
): Promise<UpdateJourneyFromFrontendDataResponse['data']> {
  const endpoint = `/v1/journeys/${journeyId}/from-frontend-data`
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] 从前端数据格式更新行程:', {
    url,
    journeyId,
    destination: request.itineraryData.destination,
    daysCount: request.itineraryData.days?.length || 0
  })

  try {
    const response = await authenticatedFetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      await handleApiError(response)
    }

    const apiData: UpdateJourneyFromFrontendDataResponse = await response.json()

    if (!apiData.success) {
      throw new Error('更新行程失败')
    }

    console.log('[ItineraryAPI] 从前端数据格式更新行程成功:', {
      id: apiData.data.id,
      destination: apiData.data.destination,
      daysCount: apiData.data.daysCount,
      hasDays: !!apiData.data.days && apiData.data.days.length > 0,
      daysLength: apiData.data.days?.length || 0
    })

    // 如果返回的数据中没有 days 或 days 为空，尝试重新获取详情
    if (!apiData.data.days || apiData.data.days.length === 0) {
      console.log('[ItineraryAPI] 更新接口返回的 days 为空，尝试重新获取详情...')
      try {
        const fullDetail = await getItineraryDetail(journeyId)
        console.log('[ItineraryAPI] 重新获取详情成功，days 数量:', fullDetail.days?.length || 0)
        // 合并返回的数据，确保包含完整的 days
        return {
          ...apiData.data,
          days: fullDetail.days || []
        }
      } catch (detailError: any) {
        console.warn('[ItineraryAPI] 重新获取详情失败，使用更新接口返回的数据:', detailError.message)
        // 如果重新获取失败，返回原始数据
        return apiData.data
      }
    }

    return apiData.data
  } catch (error: any) {
    console.error('[ItineraryAPI] 从前端数据格式更新行程失败:', {
      error: error.message,
      stack: error.stack,
      url,
      journeyId
    })
    throw error
  }
}

// ==================== 批量获取活动详情接口 ====================

/**
 * 批量获取活动详情请求参数
 */
export interface BatchGetActivitiesRequest {
  dayIds?: string[]
}

/**
 * 批量获取活动详情响应
 */
export interface BatchGetActivitiesResponse {
  activities: {
    [dayId: string]: Array<{
      id: string
      time: string
      title: string
      type: 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'
      duration: number
      location: {
        lat: number
        lng: number
      }
      notes: string
      cost: number
      details?: {
        [key: string]: any
      }
    }>
  }
  totalCount: number
}

/**
 * 批量获取活动详情
 * @param journeyId 行程ID
 * @param request 请求参数（可选，不传或传空数组则获取整个行程所有天的活动）
 * @returns 活动详情数据
 */
export async function batchGetActivities(
  journeyId: string,
  request?: BatchGetActivitiesRequest
): Promise<BatchGetActivitiesResponse> {
  const endpoint = `/v1/journeys/${journeyId}/activities/batch`
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] 批量获取活动详情:', {
    url,
    journeyId,
    dayIds: request?.dayIds || '全部'
  })

  try {
    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request || {})
    })

    if (!response.ok) {
      await handleApiError(response)
    }

    const apiData: BatchGetActivitiesResponse = await response.json()

    console.log('[ItineraryAPI] 批量获取活动详情成功:', {
      journeyId,
      dayCount: Object.keys(apiData.activities || {}).length,
      totalCount: apiData.totalCount
    })

    return apiData
  } catch (error: any) {
    console.error('[ItineraryAPI] 批量获取活动详情失败:', {
      error: error.message,
      stack: error.stack,
      url,
      journeyId
    })
    throw error
  }
}

