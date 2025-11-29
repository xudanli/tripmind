/**
 * 旅行摘要生成 API 服务
 * 对接后端 /api/travel/summary 接口
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
 * 活动信息
 */
export interface Activity {
  time: string // HH:mm
  title: string
  type: 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'
  notes?: string
}

/**
 * 行程天数
 */
export interface ItineraryDay {
  day: number
  date: string // YYYY-MM-DD
  activities: Activity[]
}

/**
 * 生成旅行摘要请求
 */
export interface GenerateTravelSummaryRequest {
  destination: string
  itinerary: {
    days: ItineraryDay[]
    totalCost?: number
    summary?: string
  }
}

/**
 * 生成旅行摘要响应
 */
export interface GenerateTravelSummaryResponse {
  success: boolean
  data: {
    summary: string // 100-150字
    generatedAt: string // ISO 8601
  }
}

/**
 * 生成旅行摘要
 * @param request 请求参数
 * @returns 摘要数据
 */
export async function generateTravelSummary(
  request: GenerateTravelSummaryRequest
): Promise<string> {
  const endpoint = '/travel/summary'
  const url = buildUrl(endpoint)

  console.log('[TravelSummaryAPI] 发起摘要生成请求:', {
    url,
    destination: request.destination,
    daysCount: request.itinerary.days.length,
    activitiesCount: request.itinerary.days.reduce(
      (sum, day) => sum + day.activities.length,
      0
    )
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

    const apiData: GenerateTravelSummaryResponse = await response.json()

    if (!apiData.success) {
      throw new Error('摘要生成失败')
    }

    console.log('[TravelSummaryAPI] 摘要生成成功:', {
      destination: request.destination,
      summaryLength: apiData.data.summary.length,
      generatedAt: apiData.data.generatedAt
    })

    return apiData.data.summary
  } catch (error: any) {
    console.error('[TravelSummaryAPI] 摘要生成失败:', {
      error: error.message,
      destination: request.destination,
      url
    })
    throw error
  }
}

/**
 * 将前端行程数据转换为 API 请求格式
 * @param itineraryData 前端行程数据
 * @param destination 目的地
 * @param totalCost 总费用（可选）
 * @returns API 请求格式
 */
export function convertItineraryToSummaryRequest(
  itineraryData: {
    days: Array<{
      day: number
      date: string
      timeSlots: Array<{
        time: string
        title?: string
        activity?: string
        type?: string
        details?: {
          notes?: string
          description?: string
          [key: string]: any
        }
      }>
    }>
    totalCost?: number
  },
  destination: string,
  totalCost?: number
): GenerateTravelSummaryRequest {
  // 将前端的 timeSlots 转换为后端期望的 activities 格式
  const days: ItineraryDay[] = itineraryData.days.map((day) => ({
    day: day.day,
    date: day.date,
    activities: (day.timeSlots || []).map((slot) => {
      // 映射活动类型：前端类型 -> 后端类型
      let backendType: 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean' = 'attraction'
      const slotType = (slot.type || '').toLowerCase()
      if (slotType === 'restaurant' || slotType === 'meal') {
        backendType = 'meal'
      } else if (slotType === 'accommodation' || slotType === 'hotel') {
        backendType = 'hotel'
      } else if (slotType === 'shopping') {
        backendType = 'shopping'
      } else if (slotType === 'transport') {
        backendType = 'transport'
      } else if (slotType === 'ocean') {
        backendType = 'ocean'
      } else {
        backendType = 'attraction'
      }

      return {
        time: slot.time || '',
        title: slot.title || slot.activity || '',
        type: backendType,
        notes: slot.details?.notes || slot.details?.description?.scenicIntro || ''
      }
    })
  }))

  return {
    destination,
    itinerary: {
      days,
      totalCost: totalCost || itineraryData.totalCost
    }
  }
}

