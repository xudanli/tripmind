/**
 * 旅行摘要生成 API 服务
 * 对接后端 /api/travel/summary 接口
 * 
 * 功能：
 * - 根据行程数据生成 100-150 字的旅行摘要
 * - 支持将前端行程数据格式转换为 API 请求格式
 * 
 * 特性：
 * - 需要 JWT Bearer Token 认证
 * - 自动处理活动类型映射
 * - 支持多天行程摘要生成
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
  /** 活动时间，格式：HH:mm */
  time: string
  /** 活动标题 */
  title: string
  /** 活动类型 */
  type: 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'
  /** 活动备注（可选） */
  notes?: string
}

/**
 * 行程天数
 */
export interface ItineraryDay {
  /** 天数序号（从 1 开始） */
  day: number
  /** 日期，格式：YYYY-MM-DD */
  date: string
  /** 当天的活动列表 */
  activities: Activity[]
}

/**
 * 生成旅行摘要请求
 */
export interface GenerateTravelSummaryRequest {
  /** 目的地 */
  destination: string
  /** 行程信息 */
  itinerary: {
    /** 行程天数列表 */
    days: ItineraryDay[]
    /** 总费用（可选） */
    totalCost?: number
    /** 已有摘要（可选） */
    summary?: string
  }
}

/**
 * 生成旅行摘要响应
 */
export interface GenerateTravelSummaryResponse {
  success: boolean
  data: {
    /** 生成的摘要文本（100-150字） */
    summary: string
    /** 生成时间，ISO 8601 格式 */
    generatedAt: string
  }
}

/**
 * 生成旅行摘要
 * 
 * 接口路径：POST /api/travel/summary
 * 认证：需要 JWT Bearer Token
 * 
 * 根据行程数据生成 100-150 字的旅行摘要，用于行程概览和分享
 * 
 * @param request 请求参数
 * @returns 生成的摘要文本（100-150字）
 * @throws {Error} 参数验证失败、未认证或生成失败时抛出错误
 * 
 * @example
 * ```typescript
 * const summary = await generateTravelSummary({
 *   destination: '瑞士琉森',
 *   itinerary: {
 *     days: [
 *       {
 *         day: 1,
 *         date: '2024-06-01',
 *         activities: [
 *           { time: '09:00', title: '铁力士峰云端漫步', type: 'attraction' }
 *         ]
 *       }
 *     ],
 *     totalCost: 5000
 *   }
 * })
 * ```
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
 * 
 * 将前端使用的 timeSlots 格式转换为后端 API 期望的 activities 格式，
 * 并自动映射活动类型（如 'restaurant' -> 'meal', 'accommodation' -> 'hotel'）
 * 
 * @param itineraryData 前端行程数据（包含 days 和 timeSlots）
 * @param destination 目的地
 * @param totalCost 总费用（可选，如果未提供则使用 itineraryData.totalCost）
 * @returns API 请求格式
 * 
 * @example
 * ```typescript
 * const request = convertItineraryToSummaryRequest(
 *   {
 *     days: [{
 *       day: 1,
 *       date: '2024-06-01',
 *       timeSlots: [{
 *         time: '09:00',
 *         title: '铁力士峰',
 *         type: 'attraction'
 *       }]
 *     }]
 *   },
 *   '瑞士琉森',
 *   5000
 * )
 * ```
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
        notes: slot.details?.notes || 
               (typeof slot.details?.description === 'object' && slot.details.description !== null 
                 ? (slot.details.description as any)?.scenicIntro 
                 : '') || ''
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

