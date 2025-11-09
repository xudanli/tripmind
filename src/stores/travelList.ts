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
  destination?: string
  currency?: string
  country?: string
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
    let initialDescription = travel.description
    if (
      (!initialDescription || !initialDescription.trim()) &&
      travel.data &&
      typeof travel.data === 'object'
    ) {
      const candidate: any = travel.data
      initialDescription =
        candidate.summary ||
        candidate.coreInsight ||
        candidate.narrative?.threshold ||
        candidate.aiMessage ||
        candidate.journeyBackground ||
        travel.description
    }

    const newTravel: Travel = {
      ...travel,
      description: initialDescription || travel.description || '',
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
      const existing = travelList.value[index]
      if (!existing) {
        return null
      }

      const sanitizedUpdates = Object.entries(updates).reduce<Partial<Travel>>((acc, [key, value]) => {
        if (value !== undefined) {
          ;(acc as any)[key] = value
        }
        return acc
      }, {})

      if (sanitizedUpdates.data && typeof sanitizedUpdates.data === 'object') {
        const candidateData: any = sanitizedUpdates.data
        const summaryText =
          candidateData.summary ||
          candidateData.coreInsight ||
          candidateData.narrative?.threshold ||
          candidateData.aiMessage ||
          candidateData.journeyBackground ||
          ''
        if (summaryText && sanitizedUpdates.description === undefined) {
          sanitizedUpdates.description = summaryText
        }
      }

      const updatedTravel: Travel = {
        ...existing,
        ...sanitizedUpdates,
        id: existing.id,
        updatedAt: new Date().toISOString()
      }
      travelList.value[index] = updatedTravel
      saveToStorage()
      return updatedTravel
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
