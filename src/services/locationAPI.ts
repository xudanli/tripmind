/**
 * 位置信息生成 API 服务
 * 对接后端 /api/location 接口
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
 * 单个活动位置信息请求
 */
export interface GenerateLocationRequest {
  activityName: string
  destination: string
  activityType: 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'
  coordinates: {
    lat: number
    lng: number
    region?: string
  }
}

/**
 * 位置信息响应数据
 */
export interface LocationInfo {
  chineseName: string
  localName: string
  chineseAddress: string
  localAddress: string
  transportInfo: string
  openingHours: string
  ticketPrice: string
  visitTips: string
  nearbyAttractions?: string
  contactInfo?: string
  category: string
  rating: number
  visitDuration: string
  bestTimeToVisit: string
  accessibility?: string
}

export interface GenerateLocationResponse {
  success: boolean
  data: LocationInfo
}

/**
 * 批量活动位置信息请求
 */
export interface BatchActivity {
  activityName: string
  destination: string
  activityType: 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'
  coordinates: {
    lat: number
    lng: number
    region?: string
  }
}

export interface GenerateLocationBatchRequest {
  activities: BatchActivity[]
}

export interface BatchLocationResult {
  activityName: string
  locationInfo: LocationInfo
}

export interface GenerateLocationBatchResponse {
  success: boolean
  data: BatchLocationResult[]
}

/**
 * 生成单个活动位置信息
 * @param request 请求参数
 * @returns 位置信息
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
 * @param request 批量请求参数
 * @returns 位置信息列表
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
 * 将位置信息转换为前端 details 格式
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
      visitDuration: locationInfo.visitDuration
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

