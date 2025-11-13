/**
 * Google OAuth 认证服务
 * 使用 Google Identity Services (GSI) 进行登录
 */

export interface GoogleCredentialResponse {
  credential: string // ID token
  select_by: string
}

export interface GoogleUserInfo {
  id: string
  name: string
  email: string
  avatar?: string
  picture?: string
}

/**
 * 初始化 Google Identity Services
 * 支持重试机制和超时处理
 */
export function initializeGoogleSignIn(retries = 3, timeout = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    // 检查是否已经加载
    if (window.google?.accounts?.id) {
      resolve()
      return
    }

    // 检查脚本是否已经在 DOM 中
    const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]')
    if (existingScript) {
      // 脚本已存在，等待加载
      const checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)

      // 设置超时
      setTimeout(() => {
        clearInterval(checkInterval)
        if (!window.google?.accounts?.id) {
          reject(new Error('Google Identity Services 加载超时，请检查网络连接或代理设置'))
        }
      }, timeout)

      return
    }

    // 动态加载 Google Identity Services 脚本
    let attemptCount = 0
    const tryLoad = () => {
      attemptCount++
      
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      
      let resolved = false
      
      const cleanup = () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script)
        }
      }

      // 设置超时
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          cleanup()
          if (attemptCount < retries) {
            console.warn(`Google Identity Services 加载超时，正在重试 (${attemptCount}/${retries})...`)
            setTimeout(tryLoad, 1000)
          } else {
            reject(new Error('Google Identity Services 加载超时，请检查网络连接或代理设置'))
          }
        }
      }, timeout)

      script.onload = () => {
        clearTimeout(timeoutId)
        // 等待一小段时间确保对象已初始化
        setTimeout(() => {
          if (window.google?.accounts?.id) {
            resolved = true
            resolve()
          } else if (attemptCount < retries) {
            cleanup()
            setTimeout(tryLoad, 1000) // 1秒后重试
          } else {
            cleanup()
            reject(new Error('Google Identity Services 加载失败：脚本已加载但对象未初始化'))
          }
        }, 500)
      }
      
      script.onerror = () => {
        clearTimeout(timeoutId)
        cleanup()
        if (attemptCount < retries) {
          console.warn(`Google Identity Services 加载失败，正在重试 (${attemptCount}/${retries})...`)
          setTimeout(tryLoad, 1000) // 1秒后重试
        } else {
          const errorMsg = '无法加载 Google Identity Services 脚本。可能的原因：\n' +
            '1. 网络连接问题\n' +
            '2. 代理设置问题\n' +
            '3. 防火墙阻止访问\n' +
            '4. Google 服务不可用\n\n' +
            '请检查网络连接或联系管理员。'
          reject(new Error(errorMsg))
        }
      }

      document.head.appendChild(script)
    }

    tryLoad()
  })
}

/**
 * 配置 Google Sign In
 */
export function configureGoogleSignIn(clientId: string, callback: (response: GoogleCredentialResponse) => void) {
  if (!window.google?.accounts?.id) {
    throw new Error('Google Identity Services 未初始化，请先调用 initializeGoogleSignIn()')
  }

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: callback,
    auto_select: false,
    cancel_on_tap_outside: true,
  })
}

/**
 * 渲染 Google 登录按钮
 */
export function renderGoogleSignInButton(
  elementId: string,
  options?: {
    type?: 'standard' | 'icon'
    theme?: 'outline' | 'filled_blue' | 'filled_black'
    size?: 'large' | 'medium' | 'small'
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
    shape?: 'rectangular' | 'pill' | 'circle' | 'square'
    logo_alignment?: 'left' | 'center'
  }
) {
  if (!window.google?.accounts?.id) {
    throw new Error('Google Identity Services 未初始化')
  }

  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error(`找不到 ID 为 "${elementId}" 的元素`)
  }

  window.google.accounts.id.renderButton(element, {
    type: options?.type || 'standard',
    theme: options?.theme || 'outline',
    size: options?.size || 'large',
    text: options?.text || 'signin_with',
    shape: options?.shape || 'rectangular',
    logo_alignment: options?.logo_alignment || 'left',
  })
}

/**
 * 提示用户登录（显示 One Tap）
 */
export function promptGoogleSignIn() {
  if (!window.google?.accounts?.id) {
    throw new Error('Google Identity Services 未初始化')
  }

  window.google.accounts.id.prompt((notification: any) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      // 用户关闭了提示，可以继续使用按钮登录
      console.log('Google One Tap 未显示或已跳过')
    }
  })
}

/**
 * 验证 ID token 并获取用户信息
 * 发送到后端进行验证
 */
export async function verifyGoogleToken(
  idToken: string,
  backendEndpoint: string
): Promise<GoogleUserInfo> {
  try {
    const response = await fetch(backendEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: idToken }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`后端验证失败: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    
    // 返回用户信息
    return {
      id: data.id || data.sub || data.user_id,
      name: data.name || data.displayName || '',
      email: data.email || '',
      avatar: data.picture || data.avatar || data.photo_url,
    }
  } catch (error) {
    console.error('验证 Google token 失败:', error)
    throw error
  }
}

/**
 * 从 ID token 中解析用户信息（客户端解析，仅用于显示）
 * 注意：这不能替代后端验证，仅用于快速显示用户信息
 */
export function parseGoogleToken(idToken: string): GoogleUserInfo | null {
  try {
    // JWT token 格式: header.payload.signature
    const parts = idToken.split('.')
    if (parts.length !== 3) {
      return null
    }

    // 解码 payload (base64url)
    const payload = parts[1]
    if (!payload) {
      return null
    }
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    
    return {
      id: decoded.sub || decoded.user_id,
      name: decoded.name || decoded.displayName || '',
      email: decoded.email || '',
      avatar: decoded.picture || decoded.photo_url,
    }
  } catch (error) {
    console.error('解析 Google token 失败:', error)
    return null
  }
}

// 扩展 Window 接口以支持 Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: GoogleCredentialResponse) => void
            auto_select?: boolean
            cancel_on_tap_outside?: boolean
          }) => void
          renderButton: (element: HTMLElement, options: any) => void
          prompt: (callback: (notification: any) => void) => void
        }
      }
    }
  }
}

