import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
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
  
  // 模拟的 Google OAuth 登录
  const login = async () => {
    try {
      // TODO: 接入真实的 Google OAuth
      // 这里暂时使用模拟数据
      const mockUser: User = {
        id: '1',
        name: 'Traveler',
        email: 'user@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=traveler'
      }
      
      user.value = mockUser
      isLoggedIn.value = true
      
      console.log('登录成功:', mockUser)
      return mockUser
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }
  
  // 登出
  const logout = () => {
    user.value = null
    isLoggedIn.value = false
    pendingIntent.value = null
  }
  
  // 保存用户意图
  const saveIntent = (intent: TravelIntent) => {
    pendingIntent.value = intent
  }
  
  // 清除意图
  const clearIntent = () => {
    pendingIntent.value = null
  }
  
  return {
    user,
    isLoggedIn,
    pendingIntent,
    login,
    logout,
    saveIntent,
    clearIntent
  }
})
