import { API_CONFIG } from '@/config/api'

export interface UserPreferencesResponse {
  preferences: Record<string, any>
}

const baseUrl = (API_CONFIG.BASE_URL || '').replace(/\/$/, '')
const endpoint = API_CONFIG.ENDPOINTS.USER_PREFERENCES || '/user/preferences'
const buildUrl = () => (baseUrl ? `${baseUrl}${endpoint}` : endpoint)

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

export async function getUserPreferences(): Promise<UserPreferencesResponse> {
  const response = await fetch(buildUrl(), {
    method: 'GET',
    credentials: 'include',
  })

  return handleResponse(response)
}

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

