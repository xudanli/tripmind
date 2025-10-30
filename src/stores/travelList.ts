import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Travel {
  id: string
  title: string
  location: string
  description: string
  mode: 'planner' | 'seeker' | 'inspiration'
  createdAt: string
  updatedAt: string
  status: 'draft' | 'active' | 'completed'
  coverImage?: string // 封面图片
  startDate?: string // 出发日期
  endDate?: string // 结束日期
  duration?: number // 天数
  participants?: number // 同行人数
  budget?: number // 预算
  spent?: number // 已花费
  data?: any // 存储具体的旅程数据
}

export const useTravelListStore = defineStore('travelList', () => {
  // 旅行列表
  const travelList = ref<Travel[]>([])
  
  // 从 localStorage 加载数据
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem('travelList')
      if (stored) {
        travelList.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('加载旅行列表失败:', error)
    }
  }
  
  // 保存到 localStorage
  const saveToStorage = () => {
    try {
      localStorage.setItem('travelList', JSON.stringify(travelList.value))
    } catch (error) {
      console.error('保存旅行列表失败:', error)
    }
  }
  
  // 初始化
  loadFromStorage()
  
  // 创建新旅程
  const createTravel = (travel: Omit<Travel, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTravel: Travel = {
      ...travel,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    travelList.value.unshift(newTravel) // 添加到开头
    saveToStorage()
    return newTravel
  }
  
  // 获取单个旅程
  const getTravel = (id: string) => {
    return travelList.value.find(t => t.id === id)
  }
  
  // 更新旅程
  const updateTravel = (id: string, updates: Partial<Travel>) => {
    const index = travelList.value.findIndex(t => t.id === id)
    if (index !== -1) {
      travelList.value[index] = {
        ...travelList.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      saveToStorage()
      return travelList.value[index]
    }
    return null
  }
  
  // 删除旅程
  const deleteTravel = (id: string) => {
    const index = travelList.value.findIndex(t => t.id === id)
    if (index !== -1) {
      travelList.value.splice(index, 1)
      saveToStorage()
      return true
    }
    return false
  }
  
  // 获取所有旅程
  const getAllTravels = () => {
    return travelList.value
  }
  
  // 根据模式筛选
  const getTravelsByMode = (mode: 'planner' | 'seeker' | 'inspiration') => {
    return travelList.value.filter(t => t.mode === mode)
  }
  
  // 清空列表
  const clearAll = () => {
    travelList.value = []
    saveToStorage()
  }
  
  // 生成 ID
  const generateId = () => {
    return `travel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  return {
    travelList,
    createTravel,
    getTravel,
    updateTravel,
    deleteTravel,
    getAllTravels,
    getTravelsByMode,
    clearAll,
    loadFromStorage,
    saveToStorage
  }
})
