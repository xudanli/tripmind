import { API_CONFIG } from '@/config/api'

export interface EventbriteStatus {
  connected: boolean
  expiresAt?: string | null
  eventbriteUserId?: string | null
}

const baseUrl = (API_CONFIG.BASE_URL || '').replace(/\/$/, '')

const buildUrl = (path: string) => {
  if (!path.startsWith('/')) {
    return path
  }
  return `${baseUrl}${path}`
}

async function handleJsonResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>
  }

  let payload: any = null
  let message = ''

  try {
    payload = await response.json()
    message = payload?.message || payload?.error || ''
  } catch {
    message = ''
  }

  if (!message) {
    message = await response.text().catch(() => '') || `Request failed: ${response.status}`
  }

  const error: any = new Error(message)
  error.status = response.status
  error.body = payload
  if (response.status === 401) {
    error.code = 'UNAUTHORIZED'
  }

  throw error
}

export async function getEventbriteStatus(): Promise<EventbriteStatus> {
  const url = buildUrl(API_CONFIG.ENDPOINTS.EVENTBRITE_STATUS || '/eventbrite/status')
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  })

  return handleJsonResponse<EventbriteStatus>(response)
}

export async function getEventbriteAuthUrl(): Promise<{ url: string }> {
  const url = buildUrl(API_CONFIG.ENDPOINTS.EVENTBRITE_AUTH_URL || '/eventbrite/auth-url')
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  })

  return handleJsonResponse<{ url: string }>(response)
}

export async function disconnectEventbrite(): Promise<{ success: boolean }> {
  const url = buildUrl(API_CONFIG.ENDPOINTS.EVENTBRITE_DISCONNECT || '/eventbrite/disconnect')
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
  })

  return handleJsonResponse<{ success: boolean }>(response)
}

