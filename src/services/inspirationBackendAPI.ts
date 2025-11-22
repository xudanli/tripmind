/**
 * 灵感模式后端 API 客户端
 * 对接后端 /api/inspiration 接口
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
 * 意图识别请求
 */
export interface DetectIntentRequest {
  input: string
  language?: string
}

/**
 * 意图识别响应
 */
export interface DetectIntentResponse {
  success: boolean
  data: {
    intentType: string
    keywords: string[]
    emotionTone: string
    description: string
    confidence?: number
  }
}

/**
 * 目的地推荐请求
 */
export interface RecommendDestinationsRequest {
  input: string
  intent?: {
    intentType: string
    keywords: string[]
    emotionTone: string
  }
  language?: string
  userCountry?: string
  userNationality?: string
  userPermanentResidency?: string
  heldVisas?: string[]
  visaFreeDestinations?: string[]
  visaInfoSummary?: string | null
  limit?: number
}

/**
 * 目的地推荐响应
 */
export interface RecommendDestinationsResponse {
  success: boolean
  data: {
    locations: string[]
    locationDetails?: {
      [location: string]: {
        country?: string
        description?: string
        highlights?: string[]
        bestSeason?: string
      }
    }
    reasoning?: string
  }
}

/**
 * 生成行程请求
 */
export interface GenerateItineraryRequest {
  input: string
  selectedDestination?: string
  intent?: {
    intentType: string
    keywords: string[]
    emotionTone: string
  }
  language?: string
  userCountry?: string
  userNationality?: string
  userPermanentResidency?: string
  heldVisas?: string[]
  visaFreeDestinations?: string[]
  visaInfoSummary?: string | null
  transportPreference?: 'public_transit_and_walking' | 'driving_and_walking'
  userRequestedDays?: number
  mode?: 'full' | 'candidates'
}

/**
 * 生成行程响应
 */
export interface GenerateItineraryResponse {
  success: boolean
  data: {
    title: string
    destination?: string
    location?: string
    locations?: string[]
    duration: string | number
    days?: Array<{
      day: number
      date: string
      theme?: string
      mood?: string
      summary?: string
      timeSlots: Array<{
        time: string
        title?: string
        activity?: string
        coordinates?: { lat: number; lng: number }
        type?: string
        duration?: number
        cost?: number
        details?: Record<string, unknown>
      }>
    }>
    hasFullItinerary?: boolean
    generationMode?: 'full' | 'candidates'
    highlights?: string[]
  }
}

/**
 * 天数提取请求
 */
export interface ExtractDaysRequest {
  input: string
  language?: string
}

/**
 * 天数提取响应
 */
export interface ExtractDaysResponse {
  success: boolean
  data: {
    days: number | null
    confidence?: number
  }
}

// ==================== API 函数 ====================

/**
 * 意图识别
 * @param request 请求参数
 * @returns 意图识别结果
 */
export async function detectIntent(
  request: DetectIntentRequest
): Promise<DetectIntentResponse['data']> {
  const endpoint = '/inspiration/detect-intent'
  const url = buildUrl(endpoint)

  console.log('[InspirationBackendAPI] 意图识别请求:', {
    url,
    input: request.input.substring(0, 50) + '...'
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

    const apiData: DetectIntentResponse = await response.json()

    if (!apiData.success) {
      throw new Error('意图识别失败')
    }

    console.log('[InspirationBackendAPI] 意图识别成功:', {
      intentType: apiData.data.intentType,
      keywords: apiData.data.keywords.length
    })

    return apiData.data
  } catch (error: any) {
    console.error('[InspirationBackendAPI] 意图识别失败:', {
      error: error.message,
      stack: error.stack,
      url
    })
    throw error
  }
}

/**
 * 目的地推荐
 * @param request 请求参数
 * @returns 推荐的目的地列表
 */
export async function recommendDestinations(
  request: RecommendDestinationsRequest
): Promise<RecommendDestinationsResponse['data']> {
  const endpoint = '/inspiration/recommend-destinations'
  const url = buildUrl(endpoint)

  console.log('[InspirationBackendAPI] 目的地推荐请求:', {
    url,
    input: request.input.substring(0, 50) + '...',
    limit: request.limit
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

    const apiData: RecommendDestinationsResponse = await response.json()

    if (!apiData.success) {
      throw new Error('目的地推荐失败')
    }

    console.log('[InspirationBackendAPI] 目的地推荐成功:', {
      locationsCount: apiData.data.locations.length
    })

    return apiData.data
  } catch (error: any) {
    console.error('[InspirationBackendAPI] 目的地推荐失败:', {
      error: error.message,
      stack: error.stack,
      url
    })
    throw error
  }
}

/**
 * 生成完整行程
 * @param request 请求参数
 * @returns 生成的行程数据
 */
export async function generateItinerary(
  request: GenerateItineraryRequest
): Promise<GenerateItineraryResponse['data']> {
  const endpoint = '/inspiration/generate-itinerary'
  const url = buildUrl(endpoint)

  console.log('[InspirationBackendAPI] 生成行程请求:', {
    url,
    input: request.input.substring(0, 50) + '...',
    selectedDestination: request.selectedDestination,
    mode: request.mode
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

    const apiData: GenerateItineraryResponse = await response.json()

    if (!apiData.success) {
      throw new Error('生成行程失败')
    }

    console.log('[InspirationBackendAPI] 生成行程成功:', {
      title: apiData.data.title,
      daysCount: apiData.data.days?.length || 0,
      hasFullItinerary: apiData.data.hasFullItinerary
    })

    return apiData.data
  } catch (error: any) {
    console.error('[InspirationBackendAPI] 生成行程失败:', {
      error: error.message,
      stack: error.stack,
      url
    })
    throw error
  }
}

/**
 * 天数提取
 * @param request 请求参数
 * @returns 提取的天数
 */
export async function extractDays(
  request: ExtractDaysRequest
): Promise<ExtractDaysResponse['data']> {
  const endpoint = '/inspiration/extract-days'
  const url = buildUrl(endpoint)

  console.log('[InspirationBackendAPI] 天数提取请求:', {
    url,
    input: request.input.substring(0, 50) + '...'
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

    const apiData: ExtractDaysResponse = await response.json()

    if (!apiData.success) {
      throw new Error('天数提取失败')
    }

    console.log('[InspirationBackendAPI] 天数提取成功:', {
      days: apiData.data.days
    })

    return apiData.data
  } catch (error: any) {
    console.error('[InspirationBackendAPI] 天数提取失败:', {
      error: error.message,
      stack: error.stack,
      url
    })
    throw error
  }
}

