/**
 * Seeker 模式后端 API 客户端
 * 对接后端 /api/seeker 接口
 */

import { API_CONFIG } from '@/config/api'
import { authenticatedFetch, handleApiError } from './authAPI'

const baseUrl = (API_CONFIG.BASE_URL || '').replace(/\/$/, '')

const buildUrl = (endpoint: string) => {
  if (!endpoint.startsWith('/')) return endpoint
  if (!baseUrl) return endpoint
  return `${baseUrl}${endpoint}`
}

// ==================== 类型定义 ====================

/**
 * 生成 Seeker 旅行计划请求
 */
export interface GenerateSeekerTravelPlanRequest {
  currentMood: string
  desiredExperience: string
  budget: string
  duration: string
  language?: string
  userCountry?: string
  userNationality?: string
}

/**
 * 活动信息
 */
export interface Activity {
  time: string
  activity: string
  type: string
  location?: string
  notes?: string
}

/**
 * 每日行程
 */
export interface DayItinerary {
  day: number
  title: string
  theme?: string
  activities: Activity[]
}

/**
 * 推荐信息
 */
export interface Recommendations {
  accommodation?: string
  transportation?: string
  food?: string
  tips?: string
}

/**
 * 检测到的意图
 */
export interface DetectedIntent {
  intentType: string
  keywords: string[]
  emotionTone: string
  description: string
}

/**
 * Seeker 旅行计划数据
 */
export interface SeekerTravelPlanData {
  destination: string
  duration: number
  itinerary: DayItinerary[]
  recommendations?: Recommendations
  detectedIntent?: DetectedIntent
}

/**
 * 生成 Seeker 旅行计划响应
 */
export interface GenerateSeekerTravelPlanResponse {
  success: boolean
  data: SeekerTravelPlanData
  message?: string
}

// ==================== API 函数 ====================

/**
 * 生成 Seeker 旅行计划
 * @param request 请求参数
 * @returns 生成的旅行计划数据
 */
export async function generateSeekerTravelPlan(
  request: GenerateSeekerTravelPlanRequest
): Promise<SeekerTravelPlanData> {
  const endpoint = '/seeker/generate-travel-plan'
  const url = buildUrl(endpoint)

  console.log('[SeekerBackendAPI] 生成旅行计划请求:', {
    url,
    currentMood: request.currentMood,
    desiredExperience: request.desiredExperience,
    budget: request.budget,
    duration: request.duration
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

    const apiData: GenerateSeekerTravelPlanResponse = await response.json()

    if (!apiData.success) {
      throw new Error(apiData.message || '生成旅行计划失败')
    }

    console.log('[SeekerBackendAPI] 生成旅行计划成功:', {
      destination: apiData.data.destination,
      duration: apiData.data.duration,
      itineraryDays: apiData.data.itinerary.length
    })

    return apiData.data
  } catch (error: any) {
    console.error('[SeekerBackendAPI] 生成旅行计划失败:', {
      error: error.message,
      stack: error.stack,
      url
    })
    throw error
  }
}
