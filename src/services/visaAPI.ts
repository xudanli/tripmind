/**
 * 签证信息 API 服务
 * 对接后端签证管理接口
 */

import { API_CONFIG } from '@/config/api'
import type { VisaInfo, MultiDestinationVisaResult } from '@/config/visa'

// API 响应格式
interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

// 查询签证信息请求参数
export interface GetVisaInfoParams {
  destinationCountry: string
  nationalityCode?: string
  permanentResidencyCode?: string
}

// 多目的地签证分析请求参数
export interface MultiDestinationAnalysisParams {
  destinationCountries: string[]
  nationalityCode?: string
  permanentResidencyCode?: string
}

// 分页响应
interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

/**
 * 获取 API 基础 URL
 */
function getBaseURL(): string {
  // 优先使用环境变量中的后端 API 地址
  const visaApiBaseUrl = import.meta.env.VITE_VISA_API_BASE_URL
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  const backendURL = visaApiBaseUrl || apiBaseUrl
  
  if (backendURL) {
    console.log('[VisaAPI] 使用配置的API地址:', backendURL)
    return backendURL
  }
  
  // 默认使用文档中的地址
  const defaultURL = 'http://localhost:3000/api'
  console.log('[VisaAPI] 使用默认API地址:', defaultURL)
  return defaultURL
}

/**
 * 通用请求方法
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseURL = getBaseURL()
  const url = `${baseURL}${endpoint}`

  console.log('[VisaAPI] 发起请求:', {
    method: options.method || 'GET',
    url,
    endpoint,
    baseURL
  })

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      // 如果需要认证，可以在这里添加
      // 'Authorization': `Bearer ${token}`,
    },
    ...options,
  }

  try {
    const response = await fetch(url, defaultOptions)
    
    console.log('[VisaAPI] 收到响应:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.message || `HTTP error! status: ${response.status}`
      console.error('[VisaAPI] 请求失败:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        errorData
      })
      throw new Error(errorMessage)
    }

    const data: ApiResponse<T> = await response.json()
    
    console.log('[VisaAPI] 响应数据:', {
      success: data.success,
      hasData: !!data.data,
      dataLength: Array.isArray(data.data) ? data.data.length : 'N/A',
      message: data.message
    })

    if (!data.success) {
      throw new Error(data.message || data.error || '请求失败')
    }

    return data.data
  } catch (error: any) {
    console.error('[VisaAPI] 请求异常:', {
      error: error.message,
      stack: error.stack,
      url
    })
    throw error
  }
}

/**
 * 查询签证信息
 * @param params 查询参数
 * @returns 签证信息数组
 */
export async function getVisaInfo(
  params: GetVisaInfoParams
): Promise<VisaInfo[]> {
  const { destinationCountry, nationalityCode, permanentResidencyCode } = params

  console.log('[VisaAPI] getVisaInfo 调用:', params)

  const queryParams = new URLSearchParams({
    destinationCountry,
  })

  if (nationalityCode) {
    queryParams.append('nationalityCode', nationalityCode)
  }

  if (permanentResidencyCode) {
    queryParams.append('permanentResidencyCode', permanentResidencyCode)
  }

  const endpoint = `/visa/info?${queryParams.toString()}`
  console.log('[VisaAPI] 请求端点:', endpoint)
  
  const result = await request<VisaInfo[]>(endpoint)
  console.log('[VisaAPI] getVisaInfo 返回结果:', result)
  
  return result
}

/**
 * 多目的地签证分析
 * @param params 分析参数
 * @returns 多目的地签证分析结果
 */
export async function analyzeMultiDestinationVisa(
  params: MultiDestinationAnalysisParams
): Promise<MultiDestinationVisaResult> {
  return request<MultiDestinationVisaResult>(
    '/visa/multi-destination-analysis',
    {
      method: 'POST',
      body: JSON.stringify(params),
    }
  )
}

/**
 * 获取签证政策列表（管理接口，需要认证）
 * @param filters 筛选条件
 * @param page 页码
 * @param limit 每页数量
 * @returns 分页的签证政策列表
 */
export async function getVisaPolicies(
  filters: {
    destinationCountryCode?: string
    applicantType?: 'nationality' | 'permanent_resident'
    applicantCountryCode?: string
    visaType?: string
    isActive?: boolean
  } = {},
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<any>> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value))
    }
  })

  return request<PaginatedResponse<any>>(
    `/visa/admin/policies?${queryParams.toString()}`
  )
}

/**
 * 创建签证政策（管理接口，需要认证）
 * @param policy 政策数据
 * @returns 创建的政策
 */
export async function createVisaPolicy(policy: {
  destinationCountryCode: string
  destinationCountryName: string
  applicantType: 'nationality' | 'permanent_resident'
  applicantCountryCode: string
  applicantDescription: string
  visaType: string
  description?: string
  durationDays?: number
  applicationUrl?: string
  isActive?: boolean
  effectiveDate?: string
  expiryDate?: string
  updatedBy?: string
}): Promise<any> {
  return request<any>('/visa/admin/policies', {
    method: 'POST',
    body: JSON.stringify(policy),
  })
}

/**
 * 更新签证政策（管理接口，需要认证）
 * @param id 政策 ID
 * @param updates 更新的字段
 * @returns 更新后的政策
 */
export async function updateVisaPolicy(
  id: number,
  updates: Partial<{
    description: string
    durationDays: number
    applicationUrl: string
    isActive: boolean
    effectiveDate: string
    expiryDate: string
    updatedBy: string
  }>
): Promise<any> {
  return request<any>(`/visa/admin/policies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

/**
 * 删除签证政策（管理接口，需要认证）
 * @param id 政策 ID
 */
export async function deleteVisaPolicy(id: number): Promise<void> {
  await request<{ success: boolean; message: string }>(
    `/visa/admin/policies/${id}`,
    {
      method: 'DELETE',
    }
  )
}

/**
 * 获取政策变更历史（管理接口，需要认证）
 * @param id 政策 ID
 * @returns 变更历史记录
 */
export async function getVisaPolicyHistory(id: number): Promise<any[]> {
  return request<any[]>(`/visa/admin/policies/${id}/history`)
}

/**
 * 检查后端 API 是否可用
 * @returns 是否可用
 */
export async function checkVisaAPIAvailable(): Promise<boolean> {
  try {
    const baseURL = getBaseURL()
    // 尝试调用一个简单的接口来检查可用性
    const response = await fetch(`${baseURL}/visa/info?destinationCountry=JP`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000), // 3秒超时
    })
    return response.ok || response.status === 400 // 400 表示参数错误，但API可用
  } catch (error) {
    return false
  }
}

