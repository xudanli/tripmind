/**
 * 认证相关 API 服务
 * 根据 docs/auth.md 文档实现
 */

import { API_CONFIG } from '@/config/api'

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

const baseUrl = (API_CONFIG.BASE_URL || '').replace(/\/$/, '')

const buildUrl = (endpoint: string) => {
  if (!endpoint.startsWith('/')) return endpoint
  if (!baseUrl) return endpoint
  return `${baseUrl}${endpoint}`
}

/**
 * 触发后端托管的 Google 登录流程
 */
export function redirectToGoogleLogin(redirectPath?: string) {
  const endpoint = API_CONFIG.ENDPOINTS.GOOGLE_AUTH || '/auth/google'
  const loginUrl = buildUrl(endpoint)
  const finalUrl = redirectPath
    ? `${loginUrl}?redirect=${encodeURIComponent(redirectPath)}`
    : loginUrl
  window.location.href = finalUrl
}

/**
 * 获取当前用户信息
 * 依赖后端 HttpOnly Session
 */
export async function fetchCurrentUser(): Promise<UserProfile> {
  const endpoint = API_CONFIG.ENDPOINTS.AUTH_PROFILE || '/auth/me'
  const response = await fetch(buildUrl(endpoint), {
    method: 'GET',
    credentials: 'include',
  })

  if (response.status === 401) {
    throw new Error('未登录')
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`获取用户信息失败: ${response.status} ${errorText}`)
  }

  return await response.json()
}

/**
 * 调用后端退出登录
 */
export async function logoutSession(): Promise<void> {
  const endpoint = API_CONFIG.ENDPOINTS.AUTH_LOGOUT || '/auth/logout'
  const response = await fetch(buildUrl(endpoint), {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok && response.status !== 401) {
    const message = await response.text()
    throw new Error(message || '退出登录失败')
  }
}

/**
 * 带凭证的 fetch 封装
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })
}

/**
 * 处理 API 错误响应
 */
export async function handleApiError(response: Response): Promise<never> {
  if (response.status === 401) {
    throw new Error('未登录或会话已过期')
  } else if (response.status === 400) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || '请求参数错误')
  } else {
    const errorText = await response.text()
    throw new Error(`服务器错误: ${response.status} ${errorText}`)
  }
}

