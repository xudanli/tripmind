/**
 * 用户偏好设置 API 服务
 * 对接后端 /api/user/preferences 接口
 * 
 * 功能：
 * - 获取用户偏好设置
 * - 更新用户偏好设置
 * 
 * 特性：
 * - 支持 Cookie 认证（credentials: 'include'）
 * - 自动处理未登录状态（401 错误）
 * - 支持任意偏好字段（Record<string, any>）
 */
import { API_CONFIG } from '@/config/api'

/**
 * 用户偏好设置响应
 */
export interface UserPreferencesResponse {
  /** 用户偏好设置对象，可包含任意字段 */
  preferences: Record<string, any>
}

const baseUrl = (API_CONFIG.BASE_URL || '').replace(/\/$/, '')
const endpoint = API_CONFIG.ENDPOINTS.USER_PREFERENCES || '/user/preferences'
const buildUrl = () => (baseUrl ? `${baseUrl}${endpoint}` : endpoint)

/**
 * 处理 API 响应
 * @param response HTTP 响应对象
 * @returns 用户偏好设置响应
 * @throws {Error} 未登录或请求失败时抛出错误
 */
async function handleResponse(response: Response): Promise<UserPreferencesResponse> {
  if (response.status === 401) {
    throw new Error('未登录')
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(errorText || `请求失败: ${response.status}`)
  }

  const data = await response.json().catch(() => ({}))
  return {
    preferences: data?.preferences ?? {},
  }
}

/**
 * 获取用户偏好设置
 * 
 * 接口路径：GET /api/user/preferences
 * 认证：需要 Cookie 认证（credentials: 'include'）
 * 
 * @returns 用户偏好设置
 * @throws {Error} 未登录或请求失败时抛出错误
 * 
 * @example
 * ```typescript
 * const { preferences } = await getUserPreferences()
 * console.log('用户偏好:', preferences.interests, preferences.budget)
 * ```
 */
export async function getUserPreferences(): Promise<UserPreferencesResponse> {
  const response = await fetch(buildUrl(), {
    method: 'GET',
    credentials: 'include',
  })

  return handleResponse(response)
}

/**
 * 更新用户偏好设置
 * 
 * 接口路径：PUT /api/user/preferences
 * 认证：需要 Cookie 认证（credentials: 'include'）
 * 
 * @param preferences 要更新的偏好设置对象
 * @returns 更新后的用户偏好设置
 * @throws {Error} 未登录或请求失败时抛出错误
 * 
 * @example
 * ```typescript
 * await updateUserPreferences({
 *   interests: ['自然风光', '摄影采风'],
 *   budget: 'comfort',
 *   travelStyle: 'moderate'
 * })
 * ```
 */
export async function updateUserPreferences(preferences: Record<string, any>): Promise<UserPreferencesResponse> {
  const response = await fetch(buildUrl(), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ preferences }),
  })

  return handleResponse(response)
}

