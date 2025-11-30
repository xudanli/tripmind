/**
 * 位置信息生成 API 服务
 * 对接后端 /api/location 接口
 * 
 * 功能：
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

