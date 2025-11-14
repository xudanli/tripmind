import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchCurrentUser, logoutSession, redirectToGoogleLogin } from '@/services/authAPI'

const authMode = (import.meta.env.VITE_AUTH_MODE || 'google').toLowerCase()
const devLoginFlag = import.meta.env.VITE_ENABLE_DEV_LOGIN === 'true'
const devLoginEnabled = devLoginFlag || authMode === 'mock'
const DEV_LOGIN_STORAGE_KEY = 'devLoginActive'

const isDevSessionActive = () => devLoginEnabled && localStorage.getItem(DEV_LOGIN_STORAGE_KEY) === 'true'

export interface User {
  id: string
  name: string // 兼容字段，实际使用 nickname
  nickname?: string // 后端返回的昵称
  email: string
  avatar?: string // 兼容字段，实际使用 avatarUrl
  avatarUrl?: string // 后端返回的头像 URL
}

export interface TravelIntent {
  mode: 'planner' | 'seeker' | 'inspiration'
  data?: any
}

export const useUserStore = defineStore('user', () => {
  // 用户状态
  const user = ref<User | null>(null)
  const isLoggedIn = ref(false)
  const pendingIntent = ref<TravelIntent | null>(null)
  
  const setSessionUser = (value: User | null) => {
    user.value = value
    isLoggedIn.value = !!value
  }

  const persistSession = (value: User | null) => {
    if (value) {
      localStorage.setItem('user', JSON.stringify(value))
      localStorage.setItem('isLoggedIn', 'true')
    } else {
      localStorage.removeItem('user')
      localStorage.removeItem('isLoggedIn')
    }
  }

  const triggerLoginRedirect = (redirectPath?: string) => {
    redirectToGoogleLogin(redirectPath)
  }
  
  /**
   * 获取当前用户详细信息
   * 从后端获取最新的用户信息
   */
  const fetchUserProfile = async (): Promise<User> => {
    try {
      if (isDevSessionActive()) {
        const savedUser = localStorage.getItem('user')
        if (savedUser) {
          const userInfo: User = JSON.parse(savedUser)
          user.value = userInfo
          isLoggedIn.value = true
          return userInfo
        }
        throw new Error('开发模式未找到本地用户信息')
      }
      
      const profile = await fetchCurrentUser()
      
      // 构建用户对象
      const userInfo: User = {
        id: profile.id,
        name: profile.nickname, // 兼容字段
        nickname: profile.nickname,
        email: profile.email,
        avatar: profile.avatarUrl, // 兼容字段
        avatarUrl: profile.avatarUrl,
      }
      
      user.value = userInfo
      isLoggedIn.value = true
      
      persistSession(userInfo)
      
      return userInfo
    } catch (error) {
      console.error('获取用户信息失败:', error)
      // 如果会话过期，清除状态
      if (error instanceof Error && error.message.includes('登录已过期')) {
        await logout(true)
      }
      throw error
    }
  }
  
  /**
   * 模拟登录（用于开发测试，保留向后兼容）
   * @deprecated 使用 loginWithGoogle 替代
   */
  const login = async (): Promise<User> => {
    try {
      if (!devLoginEnabled) {
        throw new Error('当前环境未启用开发者体验模式')
      }
      
      // 否则使用模拟数据（仅用于开发）
      const mockUser: User = {
        id: '1',
        name: 'Traveler',
        email: 'user@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=traveler'
      }
      
      setSessionUser(mockUser)
      persistSession(mockUser)
      localStorage.setItem(DEV_LOGIN_STORAGE_KEY, 'true')
      
      console.log('登录成功（模拟）:', mockUser)
      return mockUser
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }
  
  /**
   * 从 localStorage 恢复用户状态
   * 如果有 token，尝试从后端获取最新用户信息
   */
  const restoreUser = async () => {
    try {
      const savedUser = localStorage.getItem('user')
      const savedLoginStatus = localStorage.getItem('isLoggedIn')
      const devSessionActive = isDevSessionActive()
      
      if (devSessionActive && savedUser && savedLoginStatus === 'true') {
        user.value = JSON.parse(savedUser)
        isLoggedIn.value = true
        console.log('恢复开发模式用户状态:', user.value)
        return
      }
      
      if (savedUser && savedLoginStatus === 'true') {
        user.value = JSON.parse(savedUser)
        isLoggedIn.value = true
      }

      try {
        await fetchUserProfile()
      } catch (error) {
        if (error instanceof Error && error.message.includes('未登录')) {
          if (!devSessionActive) {
            console.warn('未检测到有效会话，清除本地缓存')
            await logout(true)
          }
        } else {
          console.warn('无法从后端获取最新用户信息，使用本地缓存:', error)
        }
      }
    } catch (error) {
      console.error('恢复用户状态失败:', error)
      // 清除无效数据
      await logout(true)
    }
  }

  // 登出
  const logout = async (skipServerCall = false) => {
    if (!isDevSessionActive() && !skipServerCall) {
      try {
        await logoutSession()
      } catch (error) {
        console.warn('调用后端退出登录失败:', error)
      }
    }
    setSessionUser(null)
    pendingIntent.value = null
    
    persistSession(null)
    localStorage.removeItem(DEV_LOGIN_STORAGE_KEY)
    
    console.log('已登出')
  }
  
  // 保存用户意图
  const saveIntent = (intent: TravelIntent) => {
    pendingIntent.value = intent
  }
  
  // 清除意图
  const clearIntent = () => {
    pendingIntent.value = null
  }
  
  // 初始化时恢复用户状态（异步，不阻塞）
  restoreUser().catch(err => {
    console.error('初始化恢复用户状态失败:', err)
  })
  
  return {
    user,
    isLoggedIn,
    pendingIntent,
    login,
    startLogin: triggerLoginRedirect,
    fetchUserProfile,
    logout,
    saveIntent,
    clearIntent,
    restoreUser,
    devLoginEnabled
  }
})
