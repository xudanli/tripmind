import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loginWithGoogle as authLoginWithGoogle, getCurrentUser, getToken, clearToken, setToken } from '@/services/authAPI'

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
  
  /**
   * Google OAuth 登录
   * @param idToken Google 返回的 ID token
   */
  const loginWithGoogle = async (idToken: string): Promise<User> => {
    try {
      // 调用认证 API
      const authResponse = await authLoginWithGoogle(idToken)
      
      // 构建用户对象（兼容新旧字段）
      const userInfo: User = {
        id: authResponse.user.id,
        name: authResponse.user.nickname, // 兼容字段
        nickname: authResponse.user.nickname,
        email: authResponse.user.email,
        avatar: authResponse.user.avatarUrl, // 兼容字段
        avatarUrl: authResponse.user.avatarUrl,
      }
      
      user.value = userInfo
      isLoggedIn.value = true
      
      // 保存到 localStorage（token 已在 authAPI 中保存）
      localStorage.setItem('user', JSON.stringify(userInfo))
      localStorage.setItem('isLoggedIn', 'true')
      
      console.log('登录成功:', userInfo)
      return userInfo
    } catch (error) {
      console.error('Google 登录失败:', error)
      throw error
    }
  }
  
  /**
   * 获取当前用户详细信息
   * 从后端获取最新的用户信息
   */
  const fetchUserProfile = async (): Promise<User> => {
    try {
      const profile = await getCurrentUser()
      
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
      
      // 更新 localStorage
      localStorage.setItem('user', JSON.stringify(userInfo))
      localStorage.setItem('isLoggedIn', 'true')
      
      return userInfo
    } catch (error) {
      console.error('获取用户信息失败:', error)
      // 如果 token 过期，清除状态
      if (error instanceof Error && error.message.includes('登录已过期')) {
        logout()
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
      // 如果配置了 Google Client ID，提示使用 Google 登录
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      if (googleClientId) {
        throw new Error('请使用 GoogleSignIn 组件进行登录')
      }
      
      // 否则使用模拟数据（仅用于开发）
      const mockUser: User = {
        id: '1',
        name: 'Traveler',
        email: 'user@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=traveler'
      }
      
      user.value = mockUser
      isLoggedIn.value = true
      
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
      const token = getToken()
      const savedUser = localStorage.getItem('user')
      const savedLoginStatus = localStorage.getItem('isLoggedIn')
      
      if (token && savedUser && savedLoginStatus === 'true') {
        // 先恢复本地状态
        user.value = JSON.parse(savedUser)
        isLoggedIn.value = true
        
        // 尝试从后端获取最新用户信息（静默失败）
        try {
          await fetchUserProfile()
        } catch (error) {
          // 如果获取失败，继续使用本地缓存的状态
          console.warn('无法从后端获取最新用户信息，使用本地缓存:', error)
        }
        
        console.log('恢复用户状态:', user.value)
      } else if (savedUser && savedLoginStatus === 'true' && !token) {
        // 有用户信息但没有 token，清除状态
        console.warn('检测到用户信息但缺少 token，清除状态')
        logout()
      }
    } catch (error) {
      console.error('恢复用户状态失败:', error)
      // 清除无效数据
      logout()
    }
  }
  
  // 登出
  const logout = () => {
    user.value = null
    isLoggedIn.value = false
    pendingIntent.value = null
    
    // 清除 localStorage 和 token
    clearToken()
    localStorage.removeItem('user')
    localStorage.removeItem('isLoggedIn')
    
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
    loginWithGoogle,
    fetchUserProfile,
    logout,
    saveIntent,
    clearIntent,
    restoreUser
  }
})
