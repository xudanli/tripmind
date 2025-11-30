/**
 * 行程 API 服务
 * 对接后端 /api/v1/journeys 接口（包括生成和 CRUD 操作）
 */

import { API_CONFIG } from '@/config/api'
import { authenticatedFetch, handleApiError } from './authAPI'

/**
 * AI助手聊天请求
 */
export interface AssistantChatRequest {
  message: string
  conversationId?: string
  language?: 'zh-CN' | 'en-US'
}

/**
 * 修改建议数据结构
 */
export interface ModificationSuggestion {
  type: 'modify' | 'add' | 'delete' | 'reorder'
  target: {
    day?: number           // 天数（1-based）
    dayId?: string         // 天数ID
    activityId?: string    // 活动ID
    slotId?: string        // 时间段ID（前端使用）
  }
  changes?: {               // 修改内容（用于 modify 类型）
    time?: string
    title?: string
    type?: 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'
    duration?: number
    location?: { lat: number; lng: number }
    notes?: string
    cost?: number
  }
  newActivity?: {           // 新活动数据（用于 add 类型）
    time: string
    title: string
    type: 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'
    duration: number
    location: { lat: number; lng: number }
    notes?: string
    cost?: number
  }
  newOrder?: string[]       // 新的活动顺序（用于 reorder 类型）
  reason?: string           // 修改原因（给用户看的说明）
}

/**
 * AI助手聊天响应
 */
export interface AssistantChatResponse {
  success: boolean
  response: string
  conversationId: string
  message: string
  modifications?: ModificationSuggestion[]  // 修改建议（可选）
}

/**
 * 对话消息结构
 */
export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sequence: number
  metadata?: Record<string, unknown>
  createdAt: Date | string
}

/**
 * 对话历史响应
 */
export interface ConversationHistoryResponse {
  success: boolean
  conversationId: string
  messages: ConversationMessage[]
  totalCount: number
}

/**
 * 与行程AI助手对话
 * @param journeyId 行程ID
 * @param request 聊天请求
 * @returns AI助手完整响应（包含回复和conversationId）
 */
export async function chatWithAssistant(
  journeyId: string,
  request: AssistantChatRequest
): Promise<AssistantChatResponse> {
  const endpoint = `/v1/journeys/${journeyId}/assistant/chat`
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] AI助手聊天请求:', {
    url,
    journeyId,
    messageLength: request.message.length,
    hasConversationId: !!request.conversationId
  })

  try {
    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: request.message,
        conversationId: request.conversationId,
        language: request.language || 'zh-CN'
      })
    })

    if (!response.ok) {
      await handleApiError(response)
    }

    const apiData: AssistantChatResponse = await response.json()

    if (!apiData.success) {
      throw new Error(apiData.message || 'AI助手回复失败')
    }

    console.log('[ItineraryAPI] AI助手聊天成功:', {
      responseLength: apiData.response.length,
      conversationId: apiData.conversationId,
      hasModifications: !!(apiData.modifications && apiData.modifications.length > 0)
    })

    return apiData
  } catch (error: any) {
    console.error('[ItineraryAPI] AI助手聊天失败:', {
      error: error.message,
      stack: error.stack,
      url
    })
    throw error
  }
}

/**
 * 获取对话历史
 * @param journeyId 行程ID
 * @param conversationId 对话ID
 * @returns 对话历史消息列表
 */
export async function getConversationHistory(
  journeyId: string,
  conversationId: string
): Promise<ConversationHistoryResponse> {
  const endpoint = `/v1/journeys/${journeyId}/assistant/conversations/${conversationId}/history`
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] 获取对话历史请求:', {
    url,
    journeyId,
    conversationId
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

    const apiData: ConversationHistoryResponse = await response.json()

    if (!apiData.success) {
      throw new Error('获取对话历史失败')
    }

    console.log('[ItineraryAPI] 获取对话历史成功:', {
      conversationId: apiData.conversationId,
      messageCount: apiData.totalCount
    })

    return apiData
  } catch (error: any) {
    console.error('[ItineraryAPI] 获取对话历史失败:', {
      error: error.message,
      stack: error.stack,
      url
    })
    throw error
  }
}

const baseUrl = (API_CONFIG.BASE_URL || '').replace(/\/$/, '')

const buildUrl = (endpoint: string) => {
  if (!endpoint.startsWith('/')) return endpoint
  if (!baseUrl) return endpoint
  return `${baseUrl}${endpoint}`
}

/**
 * 意图识别数据（可选，用于增强行程生成）
 */
export interface IntentData {
  intentType: string
  keywords: string[]
  emotionTone: string
  description: string
  confidence?: number
}

/**
 * API 请求参数
 */
export interface GenerateItineraryRequest {
  destination?: string // 可选：如果不提供，系统会根据其他信息自动推荐目的地
  days: number
  startDate: string // YYYY-MM-DD
  preferences?: {
    interests?: string[]
    budget?: 'low' | 'medium' | 'high'
    travelStyle?: 'relaxed' | 'moderate' | 'intensive'
  }
  intent?: IntentData // 可选的意图识别数据，用于增强行程生成
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
    /** 实用信息（可选） */
    practicalInfo?: PracticalInfo
  }
  generatedAt: string
}

export interface ItineraryDay {
  id?: string // 天数ID（可选，后端可能返回）
  day: number
  date: string // YYYY-MM-DD
  activities?: Activity[] // 旧格式（兼容）
  timeSlots?: any[] // 新格式（统一使用 timeSlots）
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
  coordinates?: { // 兼容字段（与 location 相同）
    lat: number
    lng: number
  }
  notes: string // ≥80字，包含具体怎么做、体验过程、行动细节
  cost: number
  details?: {
    highlights?: string[] // 活动核心亮点（2-3个）
    insiderTip?: string // 行家视角的私房建议
    bookingSignal?: string // 预约要求说明
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
  currency?: string // 货币代码（后端返回）
  currencyInfo?: { // 货币详细信息（后端返回）
    code: string
    symbol: string
    name: string
  }
  /** 实用信息（可选）：天气、安全、插座、汇率、文化禁忌、打包清单等 */
  practicalInfo?: PracticalInfo
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
 * 注意：后端已返回统一格式（timeSlots），此函数主要用于兼容性处理
 * @param apiResponse API 响应数据
 * @param destination 目的地
 * @returns 前端格式的行程数据
 */
export function convertAPIResponseToFrontendFormat(
  apiResponse: GenerateItineraryResponse,
  destination: string
): FrontendItineraryData {
  const { data } = apiResponse

  // 后端已返回统一格式，直接使用或进行兼容性转换
  const days: FrontendItineraryDay[] = (data.days || []).map((day) => {
    // 如果后端返回的是 timeSlots，直接使用（新格式）
    if (day.timeSlots && Array.isArray(day.timeSlots)) {
      return {
    day: day.day,
    date: day.date,
        timeSlots: day.timeSlots  // 后端已返回统一格式，直接使用
      }
    }
    
    // 兼容旧格式：如果后端仍返回 activities，进行转换（过渡期）
    if (day.activities && Array.isArray(day.activities)) {
      console.warn('[ItineraryAPI] 后端仍返回 activities 格式，进行兼容性转换')
      return {
        day: day.day,
        date: day.date,
        timeSlots: day.activities.map((activity) => ({
      time: activity.time,
      title: activity.title,
      activity: activity.title, // 使用 title 作为 activity
      type: activity.type,
          coordinates: activity.location || activity.coordinates,
          notes: activity.notes || '',
      details: {
            notes: activity.notes || '',
            description: activity.notes || ''
      },
          cost: activity.cost || 0,
          duration: activity.duration || 60
        }))
      }
    }
    
    // 如果都没有，返回空数组
    return {
      day: day.day,
      date: day.date,
      timeSlots: []
    }
  })

  // 后端已计算总费用，直接使用（后端已确保是数字类型）
  const totalCost = data.totalCost || 0

  return {
    title: `${destination}之旅`,
    destination,
    days,
    totalCost,  // 直接使用后端返回的值，无需计算
    summary: data.summary || '',
    currency: (data as any).currency, // 后端返回的货币代码
    currencyInfo: (data as any).currencyInfo // 后端返回的货币详细信息
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
    let finalDestination = request.destination
    
    // 如果没有提供目的地，根据其他信息自动推荐
    if (!finalDestination) {
      log('未提供目的地，开始推荐目的地...')
      
      // 构建推荐请求的输入文本
      const recommendationInput = [
        request.intent?.description || '',
        request.intent?.keywords?.join(' ') || '',
        request.preferences?.interests?.join(' ') || '',
        `${request.days}天旅行`
      ].filter(Boolean).join(' ')
      
      if (!recommendationInput.trim()) {
        throw new Error('无法推荐目的地：请至少提供目的地、意图信息或偏好兴趣之一')
      }
      
      try {
        const { recommendDestinations } = await import('@/services/inspirationBackendAPI')
        const recommendationResult = await recommendDestinations({
          input: recommendationInput,
          limit: 1,
          language: 'zh-CN'
        })
        
        if (recommendationResult.locations && recommendationResult.locations.length > 0) {
          // locations 是 string[] 格式
          finalDestination = recommendationResult.locations[0]
          log(`✅ 自动推荐目的地: ${finalDestination}`)
        } else {
          throw new Error('无法推荐目的地：推荐结果为空')
        }
      } catch (error: any) {
        console.error('[ItineraryAPI] 目的地推荐失败:', error)
        throw new Error(`无法推荐目的地：${error.message || '请提供目的地或更多信息'}`)
      }
    }
    
    // 清理请求数据：移除空数组和未定义的字段
    const cleanedRequest: any = {
      destination: finalDestination,
      days: request.days,
      startDate: request.startDate
    }
    
    // 如果存在意图信息，添加到请求中（后端可能支持也可能不支持，但不影响主流程）
    if (request.intent) {
      cleanedRequest.intent = request.intent
      log(`🎯 包含意图信息: ${request.intent.intentType} (置信度: ${Math.round((request.intent.confidence || 0) * 100)}%)`)
    }

    // 处理 preferences：包含所有字段（根据文档，interests 是支持的）
    if (request.preferences) {
      const cleanedPreferences: any = {}
      
      // 根据文档，interests 字段是支持的
      if (request.preferences.interests && request.preferences.interests.length > 0) {
        cleanedPreferences.interests = request.preferences.interests
      }
      
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

    // 注意：后端已进行数据格式验证和修复，前端无需再次验证
    // 如果后端返回的数据格式不正确，应该在后端修复，而不是在前端
    if (apiData.data) {
      // 后端已确保 totalCost 是数字类型，直接使用
      // 后端已确保所有字段格式正确，无需前端验证
      console.log('[ItineraryAPI] 后端返回数据格式:', {
        totalCost: typeof apiData.data.totalCost,
        daysCount: apiData.data.days?.length,
        hasTimeSlots: apiData.data.days?.[0]?.timeSlots !== undefined,
        hasActivities: apiData.data.days?.[0]?.activities !== undefined
      })
    }

    log(`行程生成成功，共 ${apiData.data?.days?.length || 0} 天`)

    // 转换为前端格式（使用最终确定的目的地）
    let frontendData = convertAPIResponseToFrontendFormat(apiData, finalDestination || '')

    // 保存 practicalInfo（如果后端返回）
    if (apiData.data.practicalInfo) {
      // 将 practicalInfo 保存到 frontendData 中（如果需要在前端显示）
      // 注意：FrontendItineraryData 接口可能需要扩展以支持 practicalInfo
      ;(frontendData as any).practicalInfo = apiData.data.practicalInfo
    }

    // 如果需要获取详细位置信息
    if (enrichWithLocationInfo && finalDestination) {
      log('开始获取活动位置信息...')
      frontendData = await enrichItineraryWithLocationInfo(frontendData, finalDestination, onProgress)
      log('位置信息获取完成')
    }

    // 如果需要生成旅行摘要
    if (generateSummary && finalDestination) {
      log('开始生成旅行摘要...')
      try {
        const summary = await generateTravelSummaryForItinerary(
          frontendData,
          finalDestination,
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

  // 收集所有需要获取位置信息的活动（只收集缺少位置信息的活动）
  itineraryData.days.forEach((day, dayIndex) => {
    day.timeSlots.forEach((slot, slotIndex) => {
      if (slot.coordinates && slot.title && slot.type) {
        const details = slot.details || {}
        // 检查是否已有完整的位置信息
        const hasLocationInfo = (
          (details.tripAdvisorId && details.location) || 
          (details.location && details.address) ||
          (details.coordinates && details.name) ||
          (details.pricing && details.pricing.detail && details.address)
        )
        
        // 只对缺少位置信息的活动进行生成
        if (!hasLocationInfo) {
        activities.push({
          activityName: slot.title,
          destination,
          activityType: slot.type as any,
          coordinates: slot.coordinates,
          dayIndex,
          slotIndex
        })
        }
      }
    })
  })

  if (activities.length === 0) {
    log('所有活动都已包含位置信息，无需生成')
    return itineraryData
  }
  
  log(`发现 ${activities.length} 个活动需要获取位置信息（共 ${itineraryData.days.reduce((sum, day) => sum + day.timeSlots.length, 0)} 个活动）`)

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
 * 实用信息对象
 */
export interface PracticalInfo {
  /** 未来一周天气预报摘要 */
  weather?: string
  /** 安全提醒和注意事项 */
  safety?: string
  /** 当地插座类型和电压 */
  plugType?: string
  /** 当地货币及汇率 */
  currency?: string
  /** 文化禁忌和注意事项 */
  culturalTaboos?: string
  /** 针对性打包清单 */
  packingList?: string
}

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
    /** 实用信息（可选）：天气、安全、插座、汇率、文化禁忌、打包清单等 */
    practicalInfo?: PracticalInfo
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
    /** 实用信息（可选） */
    practicalInfo?: PracticalInfo
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
    destinationId?: string // 目的地ID（UUID），可选，用于获取天气等信息
    startDate: string
    daysCount: number
    summary: string
    totalCost: number
    currency?: string // 货币代码（后端返回）
    currencyInfo?: { // 货币详细信息（后端返回）
      code: string
      symbol: string
      name: string
    }
    days: ItineraryDay[]
    preferences?: {
      interests?: string[]
      budget?: 'low' | 'medium' | 'high'
      travelStyle?: 'relaxed' | 'moderate' | 'intensive'
    }
    /** 实用信息（可选） */
    practicalInfo?: PracticalInfo
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
  /** 实用信息（可选） */
  practicalInfo?: PracticalInfo
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
    /** 实用信息（可选） */
    practicalInfo?: PracticalInfo
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
    /** 实用信息（可选） */
    practicalInfo?: PracticalInfo
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

    // 处理 practicalInfo：实用信息（天气、安全、插座、汇率、文化禁忌、打包清单等）
    if (request.practicalInfo !== undefined) {
      cleanedRequest.practicalInfo = request.practicalInfo
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
      summary: frontendData.summary || '',
      // 如果前端数据包含 practicalInfo，则传递到后端
      practicalInfo: (frontendData as any).practicalInfo
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
 * 为行程添加单个天数
 * @param journeyId 行程ID
 * @param dayData 天数数据（包含 day 和 date）
 * @returns 创建后的天数对象
 */
export interface AddDayToJourneyRequest {
  day: number
  date: string // YYYY-MM-DD
}

export interface AddDayToJourneyResponse {
  id: string
  day: number
  date: string
  activities: Activity[]
}

export async function addDayToJourney(
  journeyId: string,
  dayData: AddDayToJourneyRequest
): Promise<AddDayToJourneyResponse> {
  const endpoint = `/v1/journeys/${journeyId}/days`
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] 为行程添加天数:', {
    url,
    journeyId,
    day: dayData.day,
    date: dayData.date
  })

  try {
    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dayData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ItineraryAPI] 添加天数失败:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url
      })
      
      // 尝试解析错误信息
      try {
        const errorData = JSON.parse(errorText)
        throw new Error(errorData.message || `添加天数失败: ${response.status} ${response.statusText}`)
      } catch {
        throw new Error(`添加天数失败: ${response.status} ${response.statusText}`)
      }
    }

    const day = await response.json()

    console.log('[ItineraryAPI] 添加天数成功:', {
      journeyId,
      dayId: day.id,
      day: day.day,
      date: day.date,
      activitiesCount: day.activities?.length || 0
    })

    return day
  } catch (error: any) {
    console.error('[ItineraryAPI] 添加天数失败:', {
      error: error.message,
      stack: error.stack,
      url,
      journeyId,
      dayData
    })
    throw error
  }
}

/**
 * 为行程添加天数（批量）
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
 * 删除指定天数
 * @param journeyId 行程ID
 * @param dayId 天数ID
 * @returns 删除结果
 */
export interface DeleteDayResponse {
  success: boolean
  message: string
}

export async function deleteDay(
  journeyId: string,
  dayId: string
): Promise<DeleteDayResponse> {
  const endpoint = `/v1/journeys/${journeyId}/days/${dayId}`
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] 删除天数:', {
    url,
    journeyId,
    dayId
  })

  try {
    const response = await authenticatedFetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ItineraryAPI] 删除天数失败:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url
      })
      
      // 尝试解析错误信息
      try {
        const errorData = JSON.parse(errorText)
        throw new Error(errorData.message || `删除天数失败: ${response.status} ${response.statusText}`)
      } catch {
        throw new Error(`删除天数失败: ${response.status} ${response.statusText}`)
      }
    }

    const result = await response.json()

    console.log('[ItineraryAPI] 删除天数成功:', {
      journeyId,
      dayId,
      message: result.message
    })

    return result
  } catch (error: any) {
    console.error('[ItineraryAPI] 删除天数失败:', {
      error: error.message,
      stack: error.stack,
      url,
      journeyId,
      dayId
    })
    throw error
  }
}

// ==================== Slots (Activities) 相关接口 ====================

/**
 * 为指定天数添加时间段（活动）
 * @param journeyId 行程ID
 * @param dayId 天数ID
 * @param slotData 时间段数据
 * @returns 创建后的活动对象
 */
export interface LocationDetails {
  chineseName?: string
  localName?: string
  chineseAddress?: string
  localAddress?: string
  transportInfo?: string
  openingHours?: string
  ticketPrice?: string
  visitTips?: string
  nearbyAttractions?: string
  contactInfo?: string
  category?: string
  rating?: number
  visitDuration?: string
  bestTimeToVisit?: string
  accessibility?: string
  dressingTips?: string
  culturalTips?: string
  bookingInfo?: string
}

export interface AddSlotToDayRequest {
  time: string // HH:MM
  title: string
  type: 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'
  duration: number // 分钟
  location: { lat: number; lng: number }
  notes?: string
  cost?: number
  locationDetails?: LocationDetails
}

export interface AddSlotToDayResponse {
  id: string
  time: string
  title: string
  type: string
  duration: number
  location: { lat: number; lng: number }
  notes: string
  cost: number
}

export async function addSlotToDay(
  journeyId: string,
  dayId: string,
  slotData: AddSlotToDayRequest
): Promise<AddSlotToDayResponse> {
  const endpoint = `/v1/journeys/${journeyId}/days/${dayId}/slots`
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] 为天数添加时间段:', {
    url,
    journeyId,
    dayId,
    time: slotData.time,
    title: slotData.title,
    type: slotData.type
  })

  try {
    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(slotData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ItineraryAPI] 添加时间段失败:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url
      })
      
      // 尝试解析错误信息
      try {
        const errorData = JSON.parse(errorText)
        throw new Error(errorData.message || `添加时间段失败: ${response.status} ${response.statusText}`)
      } catch {
        throw new Error(`添加时间段失败: ${response.status} ${response.statusText}`)
      }
    }

    const activity = await response.json()

    console.log('[ItineraryAPI] 添加时间段成功:', {
      journeyId,
      dayId,
      activityId: activity.id,
      title: activity.title
    })

    return activity
  } catch (error: any) {
    console.error('[ItineraryAPI] 添加时间段失败:', {
      error: error.message,
      stack: error.stack,
      url,
      journeyId,
      dayId,
      slotData
    })
    throw error
  }
}

/**
 * 更新指定时间段（活动）
 * @param journeyId 行程ID
 * @param dayId 天数ID
 * @param slotId 活动ID
 * @param updateData 更新数据（所有字段都是可选的）
 * @returns 更新后的活动对象
 */
export interface UpdateSlotRequest {
  time?: string // HH:MM
  title?: string
  type?: 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'
  duration?: number // 分钟
  location?: { lat: number; lng: number }
  notes?: string
  cost?: number
}

export interface UpdateSlotResponse {
  id: string
  time: string
  title: string
  type: string
  duration: number
  location: { lat: number; lng: number }
  notes: string
  cost: number
}

export async function updateSlot(
  journeyId: string,
  dayId: string,
  slotId: string,
  updateData: UpdateSlotRequest
): Promise<UpdateSlotResponse> {
  const endpoint = `/v1/journeys/${journeyId}/days/${dayId}/slots/${slotId}`
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] 更新时间段:', {
    url,
    journeyId,
    dayId,
    slotId,
    updateFields: Object.keys(updateData)
  })

  try {
    const response = await authenticatedFetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ItineraryAPI] 更新时间段失败:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url
      })
      
      // 尝试解析错误信息
      try {
        const errorData = JSON.parse(errorText)
        throw new Error(errorData.message || `更新时间段失败: ${response.status} ${response.statusText}`)
      } catch {
        throw new Error(`更新时间段失败: ${response.status} ${response.statusText}`)
      }
    }

    const activity = await response.json()

    console.log('[ItineraryAPI] 更新时间段成功:', {
      journeyId,
      dayId,
      slotId,
      activityId: activity.id
    })

    return activity
  } catch (error: any) {
    console.error('[ItineraryAPI] 更新时间段失败:', {
      error: error.message,
      stack: error.stack,
      url,
      journeyId,
      dayId,
      slotId,
      updateData
    })
    throw error
  }
}

/**
 * 删除指定时间段（活动）
 * @param journeyId 行程ID
 * @param dayId 天数ID
 * @param slotId 活动ID
 * @returns 删除结果
 */
export interface DeleteSlotResponse {
  success: boolean
  message: string
}

/**
 * 重新排序活动请求参数
 */
export interface ReorderSlotsRequest {
  activityIds: string[]  // 新的活动ID顺序
}

/**
 * 重新排序活动响应
 */
export interface ReorderSlotsResponse {
  success: boolean
  message: string
}

/**
 * 重新排序指定天数的活动
 * @param journeyId 行程ID
 * @param dayId 天数ID
 * @param request 重新排序请求
 * @returns 排序结果
 */
export async function reorderSlots(
  journeyId: string,
  dayId: string,
  request: ReorderSlotsRequest
): Promise<ReorderSlotsResponse> {
  const endpoint = `/v1/journeys/${journeyId}/days/${dayId}/slots/reorder`
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] 重新排序活动:', {
    url,
    journeyId,
    dayId,
    activityIdsCount: request.activityIds.length
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
      const errorText = await response.text()
      console.error('[ItineraryAPI] 重新排序活动失败:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url
      })
      
      try {
        const errorData = JSON.parse(errorText)
        throw new Error(errorData.message || `重新排序活动失败: ${response.status} ${response.statusText}`)
      } catch {
        throw new Error(`重新排序活动失败: ${response.status} ${response.statusText}`)
      }
    }

    const result: ReorderSlotsResponse = await response.json()

    console.log('[ItineraryAPI] 重新排序活动成功:', {
      journeyId,
      dayId,
      success: result.success
    })

    return result
  } catch (error: any) {
    console.error('[ItineraryAPI] 重新排序活动失败:', {
      error: error.message,
      stack: error.stack,
      url,
      journeyId,
      dayId,
      request
    })
    throw error
  }
}

export async function deleteSlot(
  journeyId: string,
  dayId: string,
  slotId: string
): Promise<DeleteSlotResponse> {
  const endpoint = `/v1/journeys/${journeyId}/days/${dayId}/slots/${slotId}`
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] 删除时间段:', {
    url,
    journeyId,
    dayId,
    slotId
  })

  try {
    const response = await authenticatedFetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ItineraryAPI] 删除时间段失败:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url
      })
      
      // 尝试解析错误信息
      try {
        const errorData = JSON.parse(errorText)
        throw new Error(errorData.message || `删除时间段失败: ${response.status} ${response.statusText}`)
      } catch {
        throw new Error(`删除时间段失败: ${response.status} ${response.statusText}`)
      }
    }

    const result = await response.json()

    console.log('[ItineraryAPI] 删除时间段成功:', {
      journeyId,
      dayId,
      slotId,
      message: result.message
    })

    return result
  } catch (error: any) {
    console.error('[ItineraryAPI] 删除时间段失败:', {
      error: error.message,
      stack: error.stack,
      url,
      journeyId,
      dayId,
      slotId
    })
    throw error
  }
}

// ==================== Expenses (支出) 相关接口 ====================

/**
 * 支出记录
 */
export interface Expense {
  id: string
  title: string
  amount: number
  currencyCode: string
  category: '交通' | '住宿' | '餐饮' | '景点' | '购物' | '其他'
  location?: string
  payerId?: string
  payerName?: string
  splitType: 'none' | 'equal' | 'custom'
  splitDetails?: { [memberId: string]: number } | null
  date: string // YYYY-MM-DD
  notes?: string
  createdAt: string
  updatedAt: string
}

/**
 * 获取支出列表查询参数
 */
export interface GetExpensesQueryParams {
  category?: '交通' | '住宿' | '餐饮' | '景点' | '购物' | '其他'
  startDate?: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
  payerId?: string
}

/**
 * 获取支出列表响应
 */
export interface GetExpensesResponse {
  success: boolean
  data: Expense[]
  total: number
}

/**
 * 获取支出列表
 * @param journeyId 行程ID
 * @param queryParams 查询参数（可选）
 * @returns 支出列表和总金额
 */
export async function getExpenses(
  journeyId: string,
  queryParams?: GetExpensesQueryParams
): Promise<GetExpensesResponse> {
  const endpoint = `/v1/journeys/${journeyId}/expenses`
  let url = buildUrl(endpoint)

  // 构建查询参数
  if (queryParams) {
    const params = new URLSearchParams()
    if (queryParams.category) params.append('category', queryParams.category)
    if (queryParams.startDate) params.append('startDate', queryParams.startDate)
    if (queryParams.endDate) params.append('endDate', queryParams.endDate)
    if (queryParams.payerId) params.append('payerId', queryParams.payerId)
    
    const queryString = params.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }

  console.log('[ItineraryAPI] 获取支出列表:', {
    url,
    journeyId,
    queryParams
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

    const result: GetExpensesResponse = await response.json()

    console.log('[ItineraryAPI] 获取支出列表成功:', {
      journeyId,
      count: result.data?.length || 0,
      total: result.total
    })

    return result
  } catch (error: any) {
    console.error('[ItineraryAPI] 获取支出列表失败:', {
      error: error.message,
      stack: error.stack,
      url,
      journeyId
    })
    throw error
  }
}

/**
 * 创建支出请求参数
 */
export interface CreateExpenseRequest {
  title: string
  amount: number
  currencyCode?: string // 默认 'USD'
  category?: '交通' | '住宿' | '餐饮' | '景点' | '购物' | '其他'
  location?: string
  payerId?: string
  payerName?: string
  splitType?: 'none' | 'equal' | 'custom' // 默认 'none'
  splitDetails?: { [memberId: string]: number } | null
  date?: string // YYYY-MM-DD，默认今天
  notes?: string
}

/**
 * 创建支出响应
 */
export interface CreateExpenseResponse {
  success: boolean
  data: Expense
  message: string
}

/**
 * 创建支出
 * @param journeyId 行程ID
 * @param expenseData 支出数据
 * @returns 创建的支出记录
 */
export async function createExpense(
  journeyId: string,
  expenseData: CreateExpenseRequest
): Promise<Expense> {
  const endpoint = `/v1/journeys/${journeyId}/expenses`
  const url = buildUrl(endpoint)

  // 清理数据：确保类型正确，移除空值
  const cleanedData: any = {
    title: expenseData.title,
    amount: typeof expenseData.amount === 'number' ? expenseData.amount : Number(expenseData.amount)
  }
  
  if (expenseData.currencyCode) cleanedData.currencyCode = expenseData.currencyCode
  if (expenseData.category) cleanedData.category = expenseData.category
  if (expenseData.location) cleanedData.location = expenseData.location
  
  // 处理付款人信息：如果 payerId 是临时生成的（不是有效的UUID），只发送 payerName
  if (expenseData.payerId) {
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(expenseData.payerId)
    if (isValidUUID) {
      cleanedData.payerId = expenseData.payerId
    }
  }
  if (expenseData.payerName) cleanedData.payerName = expenseData.payerName
  if (expenseData.splitType && expenseData.splitType !== 'none') {
    cleanedData.splitType = expenseData.splitType
    if (expenseData.splitType === 'custom' && expenseData.splitDetails) {
      // 确保 splitDetails 中的值都是数字类型
      const cleanedSplitDetails: { [key: string]: number } = {}
      for (const [key, value] of Object.entries(expenseData.splitDetails)) {
        if (value !== null && value !== undefined) {
          cleanedSplitDetails[key] = typeof value === 'number' ? value : Number(value)
        }
      }
      if (Object.keys(cleanedSplitDetails).length > 0) {
        cleanedData.splitDetails = cleanedSplitDetails
      }
    }
  }
  if (expenseData.date) cleanedData.date = expenseData.date
  if (expenseData.notes) cleanedData.notes = expenseData.notes

  console.log('[ItineraryAPI] 创建支出:', {
    url,
    journeyId,
    requestData: cleanedData,
    originalData: expenseData
  })

  try {
    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cleanedData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ItineraryAPI] 创建支出失败:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url
      })
      
      // 尝试解析错误信息
      try {
        const errorData = JSON.parse(errorText)
        const errorMessage = Array.isArray(errorData.message) 
          ? errorData.message.join(', ')
          : errorData.message
        throw new Error(errorMessage || `创建支出失败: ${response.status} ${response.statusText}`)
      } catch {
        throw new Error(`创建支出失败: ${response.status} ${response.statusText}`)
      }
    }

    const result: CreateExpenseResponse = await response.json()

    console.log('[ItineraryAPI] 创建支出成功:', {
      journeyId,
      expenseId: result.data.id,
      title: result.data.title,
      amount: result.data.amount
    })

    return result.data
  } catch (error: any) {
    console.error('[ItineraryAPI] 创建支出失败:', {
      error: error.message,
      stack: error.stack,
      url,
      journeyId,
      expenseData
    })
    throw error
  }
}

/**
 * 更新支出请求参数（所有字段都是可选的）
 */
export interface UpdateExpenseRequest {
  title?: string
  amount?: number
  currencyCode?: string
  category?: '交通' | '住宿' | '餐饮' | '景点' | '购物' | '其他'
  location?: string
  payerId?: string
  payerName?: string
  splitType?: 'none' | 'equal' | 'custom'
  splitDetails?: { [memberId: string]: number } | null
  date?: string // YYYY-MM-DD
  notes?: string
}

/**
 * 更新支出响应
 */
export interface UpdateExpenseResponse {
  success: boolean
  data: Expense
  message: string
}

/**
 * 更新支出
 * @param journeyId 行程ID
 * @param expenseId 支出ID
 * @param updateData 更新数据（所有字段都是可选的）
 * @returns 更新后的支出记录
 */
export async function updateExpense(
  journeyId: string,
  expenseId: string,
  updateData: UpdateExpenseRequest
): Promise<Expense> {
  const endpoint = `/v1/journeys/${journeyId}/expenses/${expenseId}`
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] 更新支出:', {
    url,
    journeyId,
    expenseId,
    updateFields: Object.keys(updateData)
  })

  try {
    const response = await authenticatedFetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ItineraryAPI] 更新支出失败:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url
      })
      
      // 尝试解析错误信息
      try {
        const errorData = JSON.parse(errorText)
        const errorMessage = Array.isArray(errorData.message) 
          ? errorData.message.join(', ')
          : errorData.message
        throw new Error(errorMessage || `更新支出失败: ${response.status} ${response.statusText}`)
      } catch {
        throw new Error(`更新支出失败: ${response.status} ${response.statusText}`)
      }
    }

    const result: UpdateExpenseResponse = await response.json()

    console.log('[ItineraryAPI] 更新支出成功:', {
      journeyId,
      expenseId,
      title: result.data.title,
      amount: result.data.amount
    })

    return result.data
  } catch (error: any) {
    console.error('[ItineraryAPI] 更新支出失败:', {
      error: error.message,
      stack: error.stack,
      url,
      journeyId,
      expenseId,
      updateData
    })
    throw error
  }
}

/**
 * 删除支出响应
 */
export interface DeleteExpenseResponse {
  success: boolean
  message: string
}

/**
 * 删除支出
 * @param journeyId 行程ID
 * @param expenseId 支出ID
 * @returns 删除结果
 */
export async function deleteExpense(
  journeyId: string,
  expenseId: string
): Promise<DeleteExpenseResponse> {
  const endpoint = `/v1/journeys/${journeyId}/expenses/${expenseId}`
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] 删除支出:', {
    url,
    journeyId,
    expenseId
  })

  try {
    const response = await authenticatedFetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ItineraryAPI] 删除支出失败:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url
      })
      
      // 尝试解析错误信息
      try {
        const errorData = JSON.parse(errorText)
        throw new Error(errorData.message || `删除支出失败: ${response.status} ${response.statusText}`)
      } catch {
        throw new Error(`删除支出失败: ${response.status} ${response.statusText}`)
      }
    }

    const result: DeleteExpenseResponse = await response.json()

    console.log('[ItineraryAPI] 删除支出成功:', {
      journeyId,
      expenseId,
      message: result.message
    })

    return result
  } catch (error: any) {
    console.error('[ItineraryAPI] 删除支出失败:', {
      error: error.message,
      stack: error.stack,
      url,
      journeyId,
      expenseId
    })
    throw error
  }
}

/**
 * 从前端数据格式创建行程
 * 
 * 接口路径：POST /api/v1/journeys/from-frontend-data
 * 认证：需要 JWT Bearer Token
 * 
 * 接受前端提供的完整行程数据格式（包含 itineraryData 和 tasks），
 * 自动转换为标准格式并创建行程，包括 days 数组的详细内容。
 * 
 * 支持字段：
 * - itineraryData.practicalInfo: 实用信息（天气、安全、插座、汇率、文化禁忌、打包清单等）
 * - itineraryData.days[].timeSlots[].details: 活动详细信息（会被保存到数据库）
 * 
 * @param request 请求参数（前端数据格式）
 * @param options 可选参数
 * @param options.enrichWithLocationInfo 是否在创建后自动获取活动位置信息（默认 false）
 * @param options.onProgress 进度回调函数
 * @returns 创建的行程数据（包含 practicalInfo 字段，如果启用了位置信息获取，还会包含详细的位置信息）
 * @throws {Error} 参数验证失败、未认证或创建失败时抛出错误
 * 
 * @example
 * ```typescript
 * // 基础用法：只创建行程，不获取位置信息
 * const journey = await createJourneyFromFrontendData({
 *   itineraryData: {
 *     destination: '冰岛',
 *     duration: 5,
 *     title: '冰岛之旅',
 *     days: [...],
 *     practicalInfo: {
 *       weather: '未来一周以晴天为主',
 *       safety: '整体安全状况良好',
 *       plugType: 'Type C/F，220V，50Hz',
 *       currency: 'ISK（冰岛克朗），1 ISK ≈ 0.05 CNY',
 *       culturalTaboos: '进入教堂需保持安静',
 *       packingList: '轻便外套、防滑徒步鞋、防晒用品'
 *     }
 *   },
 *   startDate: '2025-11-24'
 * })
 * 
 * // 高级用法：创建行程后自动获取位置信息
 * const journeyWithLocation = await createJourneyFromFrontendData({
 *   itineraryData: {
 *     destination: '冰岛',
 *     duration: 5,
 *     title: '冰岛之旅',
 *     days: [...]
 *   },
 *   startDate: '2025-11-24'
 * }, {
 *   enrichWithLocationInfo: true,
 *   onProgress: (message) => console.log(message)
 * })
 * ```
 */
export async function createJourneyFromFrontendData(
  request: UpdateJourneyFromFrontendDataRequest,
  options?: {
    /** 是否在创建后自动获取活动位置信息（默认 false） */
    enrichWithLocationInfo?: boolean
    /** 进度回调函数 */
    onProgress?: (message: string) => void
  }
): Promise<UpdateJourneyFromFrontendDataResponse['data']> {
  const endpoint = `/v1/journeys/from-frontend-data`
  const url = buildUrl(endpoint)
  
  const { enrichWithLocationInfo = false, onProgress } = options || {}
  const log = (message: string) => {
    console.log(`[ItineraryAPI] ${message}`)
    onProgress?.(message)
  }

  // 详细记录请求数据
  const daysCount = request.itineraryData.days?.length || 0
  const totalTimeSlots = request.itineraryData.days?.reduce((sum, day) => sum + (day.timeSlots?.length || 0), 0) || 0
  
  console.log('[ItineraryAPI] 从前端数据格式创建行程:', {
    url,
    destination: request.itineraryData.destination,
    daysCount,
    totalTimeSlots,
    startDate: request.startDate,
    hasTasks: !!request.tasks && request.tasks.length > 0
  })
  
  // 详细记录每个 day 的 timeSlots 信息
  if (request.itineraryData.days && request.itineraryData.days.length > 0) {
    request.itineraryData.days.forEach((day, index) => {
      const timeSlots = day.timeSlots || []
      console.log(`[ItineraryAPI] Day ${day.day || index + 1}: ${timeSlots.length} 个 timeSlots`)
      timeSlots.forEach((slot, slotIndex) => {
        console.log(`  Slot ${slotIndex + 1}:`, {
          time: slot.time,
          title: slot.title,
          type: slot.type,
          hasCoordinates: !!slot.coordinates,
          hasDetails: !!slot.details,
          cost: slot.cost,
          duration: slot.duration
        })
      })
    })
  }

  try {
    // 验证数据格式
    if (!request.itineraryData.destination) {
      throw new Error('destination 字段不能为空')
    }
    if (!request.itineraryData.days || request.itineraryData.days.length === 0) {
      throw new Error('days 数组不能为空')
    }
    
    // 验证每个 day 的 timeSlots
    request.itineraryData.days.forEach((day, index) => {
      if (!day.timeSlots || day.timeSlots.length === 0) {
        console.warn(`[ItineraryAPI] Day ${day.day || index + 1} 的 timeSlots 为空`)
      }
      day.timeSlots?.forEach((slot, slotIndex) => {
        if (!slot.time || !slot.title || !slot.type) {
          console.warn(`[ItineraryAPI] Day ${day.day || index + 1} 的 Slot ${slotIndex + 1} 缺少必要字段:`, {
            hasTime: !!slot.time,
            hasTitle: !!slot.title,
            hasType: !!slot.type
          })
        }
        if (!slot.coordinates || !slot.coordinates.lat || !slot.coordinates.lng) {
          console.warn(`[ItineraryAPI] Day ${day.day || index + 1} 的 Slot ${slotIndex + 1} 缺少坐标信息`)
        }
      })
    })
    
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

    const apiData: UpdateJourneyFromFrontendDataResponse = await response.json()

    if (!apiData.success) {
      throw new Error('创建行程失败')
    }

    const returnedDays = apiData.data.days || []
    const firstDayActivities = returnedDays[0]?.activities?.length || 0
    
    console.log('[ItineraryAPI] 从前端数据格式创建行程成功:', {
      id: apiData.data.id,
      destination: apiData.data.destination,
      daysCount: apiData.data.daysCount,
      hasDays: returnedDays.length > 0,
      daysLength: returnedDays.length,
      firstDayActivities,
      totalActivities: returnedDays.reduce((sum: number, day: any) => sum + (day.activities?.length || 0), 0)
    })
    
    // 详细检查返回的 days 数据
    if (returnedDays.length > 0) {
      returnedDays.forEach((day: any, index: number) => {
        const activities = day.activities || []
        console.log(`[ItineraryAPI] 返回的 Day ${day.day || index + 1}:`, {
          day: day.day,
          date: day.date,
          activitiesCount: activities.length,
          hasId: !!day.id
        })
        if (activities.length === 0) {
          console.warn(`⚠️  Day ${day.day || index + 1} 的 activities 为空，后端可能没有正确转换 timeSlots`)
        } else {
          activities.forEach((activity: any, actIndex: number) => {
            console.log(`  活动 ${actIndex + 1}:`, {
              time: activity.time,
              title: activity.title,
              type: activity.type,
              hasLocation: !!activity.location,
              hasDetails: !!activity.details
            })
          })
        }
      })
    } else {
      console.warn('⚠️  返回的 days 数组为空')
    }

    // 如果返回的数据中没有 days 或 days 为空，尝试重新获取详情
    let finalData = apiData.data
    if (!apiData.data.days || apiData.data.days.length === 0 || 
        (apiData.data.days.length > 0 && (apiData.data.days[0]?.activities?.length === 0))) {
      console.log('[ItineraryAPI] 创建接口返回的 days 为空或 activities 为空，尝试重新获取详情...')
      try {
        const fullDetail = await getItineraryDetail(apiData.data.id)
        console.log('[ItineraryAPI] 重新获取详情成功，days 数量:', fullDetail.days?.length || 0)
        // 合并返回的数据，确保包含完整的 days
        finalData = {
          ...apiData.data,
          days: fullDetail.days || []
        }
      } catch (detailError: any) {
        console.warn('[ItineraryAPI] 重新获取详情失败，使用创建接口返回的数据:', detailError.message)
      }
    }

    // 如果需要获取位置信息，在创建行程后自动获取
    if (enrichWithLocationInfo && finalData.days && finalData.days.length > 0) {
      log('开始获取活动位置信息...')
      try {
        // 将后端返回的数据转换为前端格式
        const frontendData: FrontendItineraryData = {
          destination: finalData.destination,
          days: finalData.days.map(day => ({
            day: day.day,
            date: day.date,
            timeSlots: (day.activities || []).map(activity => ({
              time: activity.time,
              title: activity.title || '',
              type: activity.type as any,
              coordinates: activity.location,
              notes: activity.notes || '',
              details: activity.details || {},
              cost: activity.cost || 0,
              duration: activity.duration || 60
            }))
          })),
          totalCost: finalData.totalCost || 0,
          summary: finalData.summary || '',
          practicalInfo: finalData.practicalInfo
        }

        // 获取位置信息
        const enrichedData = await enrichItineraryWithLocationInfo(
          frontendData,
          finalData.destination,
          onProgress
        )

        // 将位置信息更新回后端（通过更新接口）
        if (enrichedData.days && enrichedData.days.length > 0) {
          log('位置信息获取完成，正在更新到后端...')
          try {
            // 构建更新请求，只更新 activities 的 details 字段
            const updateRequest: UpdateJourneyFromFrontendDataRequest = {
              itineraryData: {
                destination: finalData.destination,
                duration: enrichedData.days.length,
                title: request.itineraryData.title || `${finalData.destination}之旅`,
                days: enrichedData.days.map((day, dayIndex) => ({
                  day: day.day,
                  date: day.date,
                  timeSlots: day.timeSlots.map((slot, slotIndex) => {
                    const originalActivity = finalData.days?.[dayIndex]?.activities?.[slotIndex]
                    return {
                      time: slot.time,
                      title: slot.title || slot.activity || originalActivity?.title || '',
                      type: (slot.type || 'attraction') as 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean',
                      coordinates: slot.coordinates || { lat: 0, lng: 0 },
                      notes: slot.details?.notes || originalActivity?.notes || '',
                      details: slot.details || {},
                      cost: slot.cost || originalActivity?.cost || 0,
                      duration: slot.duration || originalActivity?.duration || 60
                    }
                  })
                })),
                totalCost: enrichedData.totalCost,
                summary: enrichedData.summary,
                practicalInfo: enrichedData.practicalInfo
              },
              startDate: finalData.startDate
            }

            // 调用更新接口
            await updateJourneyFromFrontendData(finalData.id, updateRequest)
            log('位置信息已更新到后端')

            // 重新获取更新后的数据
            const updatedDetail = await getItineraryDetail(finalData.id)
            return updatedDetail
          } catch (updateError: any) {
            console.warn('[ItineraryAPI] 更新位置信息到后端失败:', updateError.message)
            log('位置信息获取成功，但更新到后端失败，将在前端显示')
            // 即使更新失败，也返回包含位置信息的数据（前端显示）
            return {
              ...finalData,
              days: enrichedData.days.map(day => ({
                ...day,
                activities: day.timeSlots.map(slot => ({
                  time: slot.time,
                  title: slot.title,
                  type: slot.type || 'attraction',
                  duration: slot.duration || 60,
                  location: slot.coordinates || { lat: 0, lng: 0 },
                  notes: slot.details?.notes || '',
                  cost: slot.cost || 0,
                  details: slot.details || {}
                }))
              }))
            } as any
          }
        }
      } catch (locationError: any) {
        console.warn('[ItineraryAPI] 获取位置信息失败:', locationError.message)
        log('位置信息获取失败，使用基础行程数据')
        // 位置信息获取失败不影响行程创建，返回基础数据
      }
    }

    return finalData
  } catch (error: any) {
    console.error('[ItineraryAPI] 从前端数据格式创建行程失败:', {
      error: error.message,
      stack: error.stack,
      url
    })
    throw error
  }
}

/**
 * 从前端数据格式更新行程
 * 
 * 接口路径：PATCH /api/v1/journeys/{journeyId}/from-frontend-data
 * 认证：需要 JWT Bearer Token
 * 
 * 接受前端提供的完整行程数据格式（包含 itineraryData 和 tasks），
 * 自动转换为标准格式并更新行程，包括 days 数组的详细内容。
 * 
 * 注意：此接口会完全替换现有的 days 和 activities 数据（先删除再创建），
 * 请确保提供完整的 days 数组。
 * 
 * 支持字段：
 * - itineraryData.practicalInfo: 实用信息（天气、安全、插座、汇率、文化禁忌、打包清单等）
 * - itineraryData.days[].timeSlots[].details: 活动详细信息（会被保存到数据库）
 * 
 * @param journeyId 行程ID（UUID）
 * @param request 请求参数（前端数据格式）
 * @returns 更新后的行程数据（包含 practicalInfo 字段）
 * @throws {Error} 参数验证失败、未认证、行程不存在或更新失败时抛出错误
 * 
 * @example
 * ```typescript
 * const updatedJourney = await updateJourneyFromFrontendData(
 *   '04d7126d-219f-49ab-b71a-a595c18d6b8f',
 *   {
 *     itineraryData: {
 *       destination: '冰岛',
 *       duration: 5,
 *       title: '冰岛之旅',
 *       days: [...],
 *       practicalInfo: {
 *         weather: '未来一周以晴天为主',
 *         safety: '整体安全状况良好',
 *         plugType: 'Type C/F，220V，50Hz',
 *         currency: 'ISK（冰岛克朗），1 ISK ≈ 0.05 CNY',
 *         culturalTaboos: '进入教堂需保持安静',
 *         packingList: '轻便外套、防滑徒步鞋、防晒用品'
 *       }
 *     },
 *     startDate: '2025-11-24'
 *   }
 * )
 * ```
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

// ==================== Members (成员) 相关接口 ====================

/**
 * 成员信息
 */
export interface Member {
  id: string
  name: string
  email?: string
  role: 'owner' | 'admin' | 'member'
  userId?: string | null
  createdAt: string
  updatedAt: string
}

/**
 * 获取成员列表响应
 */
export interface GetMembersResponse {
  success: boolean
  data: Member[]
}

/**
 * 获取成员列表
 * @param journeyId 行程ID
 * @returns 成员列表
 */
export async function getMembers(
  journeyId: string
): Promise<Member[]> {
  const endpoint = `/v1/journeys/${journeyId}/members`
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] 获取成员列表:', {
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

    const result: GetMembersResponse = await response.json()

    console.log('[ItineraryAPI] 获取成员列表成功:', {
      journeyId,
      count: result.data?.length || 0
    })

    return result.data || []
  } catch (error: any) {
    console.error('[ItineraryAPI] 获取成员列表失败:', {
      error: error.message,
      stack: error.stack,
      url,
      journeyId
    })
    throw error
  }
}

/**
 * 邀请成员请求参数
 */
export interface InviteMemberRequest {
  email: string
  role?: 'member' | 'admin' // 默认 'member'
  message?: string // 最多500字符
}

/**
 * 邀请成员响应
 */
export interface InviteMemberResponse {
  success: boolean
  message: string
  data: {
    id: string
    email: string
    role: string
    status: 'pending'
    expiresAt: string
  }
}

/**
 * 邀请成员
 * @param journeyId 行程ID
 * @param inviteData 邀请数据
 * @returns 邀请信息
 */
export async function inviteMember(
  journeyId: string,
  inviteData: InviteMemberRequest
): Promise<InviteMemberResponse['data']> {
  const endpoint = `/v1/journeys/${journeyId}/members/invite`
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] 邀请成员:', {
    url,
    journeyId,
    email: inviteData.email,
    role: inviteData.role
  })

  try {
    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(inviteData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ItineraryAPI] 邀请成员失败:', {
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
        throw new Error(errorMessage || `邀请成员失败: ${response.status} ${response.statusText}`)
      } catch {
        throw new Error(`邀请成员失败: ${response.status} ${response.statusText}`)
      }
    }

    const result: InviteMemberResponse = await response.json()

    console.log('[ItineraryAPI] 邀请成员成功:', {
      journeyId,
      invitationId: result.data.id,
      email: result.data.email
    })

    return result.data
  } catch (error: any) {
    console.error('[ItineraryAPI] 邀请成员失败:', {
      error: error.message,
      stack: error.stack,
      url,
      journeyId,
      inviteData
    })
    throw error
  }
}

/**
 * 添加成员请求参数
 */
export interface AddMemberRequest {
  name: string
  email?: string
  role?: 'member' | 'admin' // 默认 'member'
  userId?: string
}

/**
 * 添加成员响应
 */
export interface AddMemberResponse {
  success: boolean
  message: string
  data: Member
}

/**
 * 添加成员
 * @param journeyId 行程ID
 * @param memberData 成员数据
 * @returns 创建的成员信息
 */
export async function addMember(
  journeyId: string,
  memberData: AddMemberRequest
): Promise<Member> {
  const endpoint = `/v1/journeys/${journeyId}/members`
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] 添加成员:', {
    url,
    journeyId,
    name: memberData.name,
    email: memberData.email,
    role: memberData.role
  })

  try {
    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(memberData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ItineraryAPI] 添加成员失败:', {
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
        throw new Error(errorMessage || `添加成员失败: ${response.status} ${response.statusText}`)
      } catch {
        throw new Error(`添加成员失败: ${response.status} ${response.statusText}`)
      }
    }

    const result: AddMemberResponse = await response.json()

    console.log('[ItineraryAPI] 添加成员成功:', {
      journeyId,
      memberId: result.data.id,
      name: result.data.name
    })

    return result.data
  } catch (error: any) {
    console.error('[ItineraryAPI] 添加成员失败:', {
      error: error.message,
      stack: error.stack,
      url,
      journeyId,
      memberData
    })
    throw error
  }
}

/**
 * 更新成员请求参数（所有字段都是可选的）
 */
export interface UpdateMemberRequest {
  name?: string
  role?: 'admin' | 'member'
  email?: string
}

/**
 * 更新成员响应
 */
export interface UpdateMemberResponse {
  success: boolean
  message: string
  data: Member
}

/**
 * 更新成员信息
 * @param journeyId 行程ID
 * @param memberId 成员ID
 * @param updateData 更新数据（所有字段都是可选的）
 * @returns 更新后的成员信息
 */
export async function updateMember(
  journeyId: string,
  memberId: string,
  updateData: UpdateMemberRequest
): Promise<Member> {
  const endpoint = `/v1/journeys/${journeyId}/members/${memberId}`
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] 更新成员信息:', {
    url,
    journeyId,
    memberId,
    updateFields: Object.keys(updateData)
  })

  try {
    const response = await authenticatedFetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ItineraryAPI] 更新成员信息失败:', {
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
        throw new Error(errorMessage || `更新成员信息失败: ${response.status} ${response.statusText}`)
      } catch {
        throw new Error(`更新成员信息失败: ${response.status} ${response.statusText}`)
      }
    }

    const result: UpdateMemberResponse = await response.json()

    console.log('[ItineraryAPI] 更新成员信息成功:', {
      journeyId,
      memberId,
      name: result.data.name,
      role: result.data.role
    })

    return result.data
  } catch (error: any) {
    console.error('[ItineraryAPI] 更新成员信息失败:', {
      error: error.message,
      stack: error.stack,
      url,
      journeyId,
      memberId,
      updateData
    })
    throw error
  }
}

/**
 * 移除成员响应
 */
export interface RemoveMemberResponse {
  success: boolean
  message: string
}

/**
 * 移除成员
 * @param journeyId 行程ID
 * @param memberId 成员ID
 * @returns 删除结果
 */
export async function removeMember(
  journeyId: string,
  memberId: string
): Promise<RemoveMemberResponse> {
  const endpoint = `/v1/journeys/${journeyId}/members/${memberId}`
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] 移除成员:', {
    url,
    journeyId,
    memberId
  })

  try {
    const response = await authenticatedFetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ItineraryAPI] 移除成员失败:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url
      })
      
      try {
        const errorData = JSON.parse(errorText)
        throw new Error(errorData.message || `移除成员失败: ${response.status} ${response.statusText}`)
      } catch {
        throw new Error(`移除成员失败: ${response.status} ${response.statusText}`)
      }
    }

    const result: RemoveMemberResponse = await response.json()

    console.log('[ItineraryAPI] 移除成员成功:', {
      journeyId,
      memberId,
      message: result.message
    })

    return result
  } catch (error: any) {
    console.error('[ItineraryAPI] 移除成员失败:', {
      error: error.message,
      stack: error.stack,
      url,
      journeyId,
      memberId
    })
    throw error
  }
}

/**
 * 获取安全提示响应
 */
export interface GetSafetyNoticeResponse {
  success: boolean
  data: {
    noticeText: string
    lang: string
    fromCache: boolean
    generatedAt?: string
  }
}

/**
 * 获取行程的安全提示
 * @param journeyId 行程ID
 * @returns 安全提示数据
 */
export async function getSafetyNotice(journeyId: string): Promise<GetSafetyNoticeResponse['data']> {
  const endpoint = `/v1/journeys/${journeyId}/safety-notice`
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] 获取安全提示:', {
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

    const result: GetSafetyNoticeResponse = await response.json()

    if (!result.success) {
      throw new Error('获取安全提示失败')
    }

    console.log('[ItineraryAPI] 获取安全提示成功:', {
      journeyId,
      hasNotice: !!result.data.noticeText,
      fromCache: result.data.fromCache,
      lang: result.data.lang
    })

    return result.data
  } catch (error: any) {
    console.error('[ItineraryAPI] 获取安全提示失败:', {
      error: error.message,
      stack: error.stack,
      url,
      journeyId
    })
    throw error
  }
}

/**
 * 生成安全提示请求参数
 */
export interface GenerateSafetyNoticeRequest {
  lang?: string
  forceRefresh?: boolean
  userNationality?: string // ISO 国家代码，如 CN、US、JP
}

/**
 * 生成安全提示响应
 */
export interface GenerateSafetyNoticeResponse {
  success: boolean
  data: {
    noticeText: string
    lang: string
    fromCache: boolean
    generatedAt: string
  }
  message?: string
}

/**
 * 生成/刷新行程的安全提示
 * @param journeyId 行程ID
 * @param request 生成请求参数
 * @returns 安全提示数据
 */
export async function generateSafetyNotice(
  journeyId: string,
  request: GenerateSafetyNoticeRequest = {}
): Promise<GenerateSafetyNoticeResponse['data']> {
  const endpoint = `/v1/journeys/${journeyId}/safety-notice`
  const url = buildUrl(endpoint)

  const requestBody: GenerateSafetyNoticeRequest = {
    lang: request.lang || 'zh-CN',
    forceRefresh: request.forceRefresh || false
  }
  
  // 如果提供了 userNationality，添加到请求体中
  if (request.userNationality) {
    requestBody.userNationality = request.userNationality
  }

  console.log('[ItineraryAPI] 生成安全提示:', {
    url,
    journeyId,
    request: requestBody
  })

  try {
    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      await handleApiError(response)
    }

    const result: GenerateSafetyNoticeResponse = await response.json()

    if (!result.success) {
      throw new Error(result.message || '生成安全提示失败')
    }

    console.log('[ItineraryAPI] 生成安全提示成功:', {
      journeyId,
      hasNotice: !!result.data.noticeText,
      fromCache: result.data.fromCache,
      generatedAt: result.data.generatedAt,
      lang: result.data.lang
    })

    return result.data
  } catch (error: any) {
    console.error('[ItineraryAPI] 生成安全提示失败:', {
      error: error.message,
      stack: error.stack,
      url,
      journeyId,
      request: requestBody
    })
    throw error
  }
}

/**
 * 生成每日概要相关接口
 */

/**
 * 生成每日概要请求参数
 */
export interface GenerateDailySummariesRequest {
  day?: number // 指定要生成概要的日期（第几天），如果不提供则生成所有天的概要
}

/**
 * 每日概要数据
 */
export interface DailySummary {
  day: number
  date: string // YYYY-MM-DD格式
  summary: string // 每日概要内容（80-120字）
  generatedAt: string // ISO 8601格式
}

/**
 * 生成每日概要响应
 */
export interface GenerateDailySummariesResponse {
  success: boolean
  journeyId: string
  destination: string
  data: DailySummary[]
  message?: string
}

/**
 * 生成每日概要
 * @param journeyId 行程ID
 * @param request 生成请求参数
 * @returns 每日概要列表
 */
export async function generateDailySummaries(
  journeyId: string,
  request: GenerateDailySummariesRequest = {}
): Promise<DailySummary[]> {
  const endpoint = `/v1/journeys/${journeyId}/daily-summaries`
  const url = buildUrl(endpoint)

  const requestBody: GenerateDailySummariesRequest = {}
  if (request.day !== undefined) {
    requestBody.day = request.day
  }

  console.log('[ItineraryAPI] 生成每日概要:', {
    url,
    journeyId,
    request: requestBody
  })

  try {
    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      await handleApiError(response)
    }

    const result: GenerateDailySummariesResponse = await response.json()

    if (!result.success) {
      throw new Error(result.message || '生成每日概要失败')
    }

    console.log('[ItineraryAPI] 生成每日概要成功:', {
      journeyId,
      summaryCount: result.data.length,
      destination: result.destination
    })

    return result.data
  } catch (error: any) {
    console.error('[ItineraryAPI] 生成每日概要失败:', {
      error: error.message,
      stack: error.stack,
      url,
      journeyId,
      request: requestBody
    })
    throw error
  }
}

/**
 * 任务相关接口
 */

/**
 * 任务数据结构
 */
export interface Task {
  id: string
  title: string
  completed: boolean
  category?: string
  destination?: string
  links?: Array<{
    label: string
    url: string
  }>
  autoGenerated?: boolean
  createdAt: number
}

/**
 * 获取任务列表响应
 */
export interface GetTasksResponse {
  tasks: Task[]
}

/**
 * 创建任务请求
 */
export interface CreateTaskRequest {
  title: string
  category?: string
  destination?: string
  links?: Array<{
    label: string
    url: string
  }>
}

/**
 * 创建任务响应
 */
export interface CreateTaskResponse {
  success: boolean
  task: Task
  message?: string
}

/**
 * 更新任务请求
 */
export interface UpdateTaskRequest {
  title?: string
  completed?: boolean
  links?: Array<{
    label: string
    url: string
  }>
}

/**
 * 更新任务响应
 */
export interface UpdateTaskResponse {
  success: boolean
  task: Task
  message?: string
}

/**
 * 删除任务响应
 */
export interface DeleteTaskResponse {
  success: boolean
  message?: string
}

/**
 * 获取行程的所有准备任务
 * @param journeyId 行程ID
 * @returns 任务列表
 */
export async function getTasks(journeyId: string): Promise<Task[]> {
  const endpoint = `/v1/journeys/${journeyId}/tasks`
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] 获取任务列表:', {
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

    const result: GetTasksResponse = await response.json()

    console.log('[ItineraryAPI] 获取任务列表成功:', {
      journeyId,
      taskCount: result.tasks?.length || 0
    })

    return result.tasks || []
  } catch (error: any) {
    console.error('[ItineraryAPI] 获取任务列表失败:', {
      error: error.message,
      stack: error.stack,
      url,
      journeyId
    })
    throw error
  }
}

/**
 * 创建自定义任务
 * @param journeyId 行程ID
 * @param request 创建任务请求
 * @returns 创建的任务
 */
export async function createTask(
  journeyId: string,
  request: CreateTaskRequest
): Promise<Task> {
  const endpoint = `/v1/journeys/${journeyId}/tasks`
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] 创建任务:', {
    url,
    journeyId,
    request
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

    const result: CreateTaskResponse = await response.json()

    if (!result.success) {
      throw new Error(result.message || '创建任务失败')
    }

    console.log('[ItineraryAPI] 创建任务成功:', {
      journeyId,
      taskId: result.task.id,
      title: result.task.title
    })

    return result.task
  } catch (error: any) {
    console.error('[ItineraryAPI] 创建任务失败:', {
      error: error.message,
      stack: error.stack,
      url,
      journeyId,
      request
    })
    throw error
  }
}

/**
 * 更新任务
 * @param journeyId 行程ID
 * @param taskId 任务ID
 * @param request 更新任务请求
 * @returns 更新后的任务
 */
export async function updateTask(
  journeyId: string,
  taskId: string,
  request: UpdateTaskRequest
): Promise<Task> {
  const endpoint = `/v1/journeys/${journeyId}/tasks/${taskId}`
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] 更新任务:', {
    url,
    journeyId,
    taskId,
    request
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

    const result: UpdateTaskResponse = await response.json()

    if (!result.success) {
      throw new Error(result.message || '更新任务失败')
    }

    console.log('[ItineraryAPI] 更新任务成功:', {
      journeyId,
      taskId: result.task.id,
      completed: result.task.completed
    })

    return result.task
  } catch (error: any) {
    console.error('[ItineraryAPI] 更新任务失败:', {
      error: error.message,
      stack: error.stack,
      url,
      journeyId,
      taskId,
      request
    })
    throw error
  }
}

/**
 * 删除任务
 * @param journeyId 行程ID
 * @param taskId 任务ID
 */
export async function deleteTask(journeyId: string, taskId: string): Promise<void> {
  const endpoint = `/v1/journeys/${journeyId}/tasks/${taskId}`
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] 删除任务:', {
    url,
    journeyId,
    taskId
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

    const result: DeleteTaskResponse = await response.json()

    if (!result.success) {
      throw new Error(result.message || '删除任务失败')
    }

    console.log('[ItineraryAPI] 删除任务成功:', {
      journeyId,
      taskId
    })
  } catch (error: any) {
    console.error('[ItineraryAPI] 删除任务失败:', {
      error: error.message,
      stack: error.stack,
      url,
      journeyId,
      taskId
    })
    throw error
  }
}

/**
 * 邀请人信息
 */
export interface InvitedByInfo {
  id: string
  name: string
  email?: string
}

/**
 * 验证邀请响应
 */
export interface VerifyInvitationResponse {
  success: boolean
  data: {
    invitationId: string
    journeyId: string
    email: string
    role: 'member' | 'admin'
    journeyName: string
    message?: string
    status: 'pending' | 'accepted' | 'expired' | 'cancelled'
    expiresAt: string
    invitedBy?: InvitedByInfo
  }
}

/**
 * 验证邀请
 * @param invitationId 邀请ID（UUID）
 * @returns 邀请信息
 * 
 * 接口文档：GET /api/v1/journeys/invitations/{invitationId}
 * 说明：
 * - 此接口是公开的，无需认证
 * - 只有 pending 状态的邀请才会返回成功
 * - expired 或 cancelled 状态的邀请会返回 404
 */
export async function verifyInvitation(
  invitationId: string
): Promise<VerifyInvitationResponse['data']> {
  const endpoint = `/v1/journeys/invitations/${invitationId}`
  const url = buildUrl(endpoint)

  console.log('[ItineraryAPI] 验证邀请:', {
    url,
    invitationId
  })

  try {
    // 注意：此接口是公开的，不需要认证，使用普通 fetch
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ItineraryAPI] 验证邀请失败:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url
      })
      
      // 处理特定错误状态码（符合文档要求）
      if (response.status === 404) {
        try {
          const errorData = JSON.parse(errorText)
          const errorMessage = errorData.message || '邀请不存在或已过期'
          throw new Error(errorMessage)
        } catch {
          throw new Error('邀请不存在或已过期')
        }
      }
      
      if (response.status === 400) {
        try {
          const errorData = JSON.parse(errorText)
          const errorMessage = errorData.message || '邀请ID无效'
          throw new Error(errorMessage)
        } catch {
          throw new Error('邀请ID无效')
        }
      }
      
      // 其他错误
      throw new Error(`验证邀请失败: ${response.status} ${response.statusText}`)
    }

    const result: VerifyInvitationResponse = await response.json()

    // 验证响应格式
    if (!result.success) {
      throw new Error('验证邀请失败：响应格式错误')
    }

    // 验证邀请状态（只有 pending 状态的邀请才有效）
    if (result.data.status !== 'pending') {
      throw new Error(`邀请状态无效: ${result.data.status}`)
    }

    console.log('[ItineraryAPI] 验证邀请成功:', {
      invitationId,
      journeyId: result.data.journeyId,
      journeyName: result.data.journeyName,
      role: result.data.role,
      status: result.data.status
    })

    return result.data
  } catch (error: any) {
    console.error('[ItineraryAPI] 验证邀请失败:', {
      error: error.message,
      stack: error.stack,
      url,
      invitationId
    })
    throw error
  }
}

