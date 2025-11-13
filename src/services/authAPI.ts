/**
 * 认证相关 API 服务
 * 根据 docs/auth.md 文档实现
 */

import { API_CONFIG } from '@/config/api'

export interface AuthResponse {
  success: boolean
  token: string
  user: {
    id: string
    email: string
    nickname: string
    avatarUrl: string
  }
}

export interface UserProfile {
  id: string
  email: string
  phone: string | null
  nickname: string
  avatarUrl: string
  preferredLanguage: string
  createdAt: string
  updatedAt: string
}

/**
 * 获取存储的 JWT token
 */
export function getToken(): string | null {
  return localStorage.getItem('token')
}

/**
 * 保存 JWT token
 */
export function setToken(token: string): void {
  localStorage.setItem('token', token)
}

/**
 * 清除 JWT token
 */
export function clearToken(): void {
  localStorage.removeItem('token')
}

/**
 * Google OAuth 登录
 * @param idToken Google 返回的 ID token
 */
export async function loginWithGoogle(idToken: string): Promise<AuthResponse> {
  const endpoint = API_CONFIG.ENDPOINTS.GOOGLE_AUTH || '/auth/google'
  
  // BASE_URL 已包含 /api，endpoint 不包含 /api
  const baseUrl = API_CONFIG.BASE_URL || ''
  
  // 确保 baseUrl 不以斜杠结尾，endpoint 以斜杠开头
  const fullUrl = `${baseUrl.replace(/\/$/, '')}${endpoint}`
  
  console.log('🔗 Google 登录请求详情:', {
    baseUrl,
    endpoint,
    fullUrl,
    hasToken: !!idToken,
    tokenLength: idToken?.length || 0
  })

  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: idToken }),
    })

    console.log('📡 后端响应状态:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ 后端错误响应:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      })
      
      let errorMessage = `登录失败: ${response.status}`
      
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        errorMessage = errorText || errorMessage
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json()
    
    console.log('✅ 后端响应数据:', {
      success: data.success,
      hasToken: !!data.token,
      hasUser: !!data.user,
      userEmail: data.user?.email
    })
    
    // 验证响应格式
    if (!data.success || !data.token || !data.user) {
      console.error('❌ 后端返回格式错误:', data)
      throw new Error('后端返回格式错误')
    }

    // 保存 token
    setToken(data.token)

    return data
  } catch (error) {
    // 处理网络错误
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('❌ 网络错误:', error)
      throw new Error('无法连接到后端服务器，请检查后端服务是否运行在 http://localhost:3000')
    }
    
    // 重新抛出其他错误
    throw error
  }
}

/**
 * 获取当前用户信息
 * @returns 用户详细信息
 */
export async function getCurrentUser(): Promise<UserProfile> {
  const token = getToken()
  
  if (!token) {
    throw new Error('未登录')
  }

  const endpoint = API_CONFIG.ENDPOINTS.AUTH_PROFILE || '/auth/profile'
  
  // BASE_URL 已包含 /api，endpoint 不包含 /api
  const baseUrl = API_CONFIG.BASE_URL || ''
  
  // 确保 baseUrl 不以斜杠结尾，endpoint 以斜杠开头
  const fullUrl = `${baseUrl.replace(/\/$/, '')}${endpoint}`

  const response = await fetch(fullUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (response.status === 401) {
    // Token 过期或无效，清除本地存储
    clearToken()
    localStorage.removeItem('user')
    throw new Error('登录已过期，请重新登录')
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`获取用户信息失败: ${response.status} ${errorText}`)
  }

  return await response.json()
}

/**
 * 带认证的 fetch 封装
 * 自动添加 Authorization header
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken()
  
  if (!token) {
    throw new Error('未登录')
  }

  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)
  headers.set('Content-Type', 'application/json')

  return fetch(url, {
    ...options,
    headers,
  })
}

/**
 * 处理 API 错误响应
 */
export async function handleApiError(response: Response): Promise<never> {
  if (response.status === 401) {
    // Token 过期，清除本地存储
    clearToken()
    localStorage.removeItem('user')
    throw new Error('登录已过期，请重新登录')
  } else if (response.status === 400) {
    const error = await response.json()
    throw new Error(error.message || '请求参数错误')
  } else {
    const errorText = await response.text()
    throw new Error(`服务器错误: ${response.status} ${errorText}`)
  }
}

