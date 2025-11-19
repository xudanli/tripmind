/**
 * 行程生成 API 服务
 * 对接后端 /api/itinerary/generate 接口
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
      cost: activity.cost,
      duration: activity.duration
    }))
  }))

  return {
    title: `${destination}之旅`,
    destination,
    days,
    totalCost: data.totalCost,
    summary: data.summary
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
      await handleApiError(response)
    }

    const apiData: GenerateItineraryResponse = await response.json()

    if (!apiData.success) {
      throw new Error(apiData.data?.summary || '行程生成失败')
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

