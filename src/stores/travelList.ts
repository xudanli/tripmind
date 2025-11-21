import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getItineraryList } from '@/services/itineraryAPI'

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
  
  // 从后端同步行程列表（仅 planner 模式）
  const syncFromBackend = async () => {
    try {
      console.log('[TravelListStore] 开始从后端同步行程列表...')
      const response = await getItineraryList()
      
      if (response.success && response.data) {
        // 将后端数据转换为前端 Travel 格式
        const backendTravels: Travel[] = response.data.map((itinerary: any) => {
          // 后端返回的行程数据结构（列表接口可能不包含完整的 days 数组）
          const daysCount = itinerary.daysCount || itinerary.days || 0
          const title = itinerary.title || `${itinerary.destination}之旅`
          const totalCost = itinerary.totalCost || 0
          
          return {
            id: itinerary.id,
            title: title,
            location: itinerary.destination,
            description: itinerary.summary || itinerary.description || `精心安排的${daysCount}天${itinerary.destination}之旅`,
            mode: 'planner' as const,
            status: itinerary.status === 'published' ? 'active' : (itinerary.status === 'archived' ? 'completed' : 'draft'),
            createdAt: itinerary.createdAt || new Date().toISOString(),
            updatedAt: itinerary.updatedAt || new Date().toISOString(),
            duration: daysCount,
            participants: 1,
            budget: totalCost,
            destination: itinerary.destination,
            data: {
              backendItineraryId: itinerary.id,
              days: itinerary.days || [],
              destination: itinerary.destination,
              title: title,
              totalCost: totalCost,
              summary: itinerary.summary || '',
              itineraryData: {
                days: itinerary.days || [],
                destination: itinerary.destination,
                title: title,
                totalCost: totalCost,
                duration: daysCount,
                budget: totalCost,
                preferences: itinerary.preferences || {}
              }
            }
          }
        })
        
        // 合并后端数据和本地数据
        // 1. 保留本地非 planner 模式的行程（inspiration、seeker）
        const localNonPlannerTravels = travelList.value.filter(t => t.mode !== 'planner')
        
        // 2. 合并 planner 模式的行程：优先使用后端数据，如果本地有但后端没有则保留本地
        const localPlannerTravels = travelList.value.filter(t => t.mode === 'planner')
        const backendTravelIds = new Set(backendTravels.map(t => t.id))
        const localOnlyPlannerTravels = localPlannerTravels.filter(t => !backendTravelIds.has(t.id))
        
        // 3. 合并结果：后端 planner 行程 + 本地非 planner 行程 + 本地独有的 planner 行程
        travelList.value = [
          ...backendTravels,
          ...localNonPlannerTravels,
          ...localOnlyPlannerTravels
        ]
        
        // 按更新时间排序（最新的在前）
        travelList.value.sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.createdAt).getTime()
          const timeB = new Date(b.updatedAt || b.createdAt).getTime()
          return timeB - timeA
        })
        
        saveToStorage()
        console.log('[TravelListStore] 从后端同步成功:', {
          backendCount: backendTravels.length,
          totalCount: travelList.value.length
        })
      }
    } catch (error: any) {
      console.error('[TravelListStore] 从后端同步失败:', error.message)
      // 同步失败不影响使用，继续使用本地数据
    }
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
    saveToStorage,
    syncFromBackend
  }
})
