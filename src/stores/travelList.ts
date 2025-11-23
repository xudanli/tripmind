import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getItineraryList, updateItinerary, convertTravelToUpdateRequest } from '@/services/itineraryAPI'
import { useUserStore } from '@/stores/user'

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
  
  // 是否已从后端加载过数据
  const loadedFromBackend = ref(false)
  
  // 创建新旅程（临时添加到列表用于立即显示，实际数据应从后端获取）
  // 注意：此方法仅用于创建行程后立即显示，最终数据通过 syncFromBackend 从后端获取
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
    return newTravel
  }
  
  // 获取单个旅程
  const getTravel = (id: string) => {
    return travelList.value.find(t => t.id === id)
  }
  
  // 更新旅程（自动同步到后端）
  // 注意：为了向后兼容，此方法先同步更新本地数据，然后异步同步到后端
  const updateTravel = (id: string, updates: Partial<Travel>) => {
    const index = travelList.value.findIndex(t => t.id === id)
    if (index === -1) {
      return null
    }
    
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

    // 先同步更新本地数据（立即返回，保证响应速度）
    const updatedTravel: Travel = {
      ...existing,
      ...sanitizedUpdates,
      id: existing.id,
      updatedAt: new Date().toISOString()
    }
    travelList.value[index] = updatedTravel

    // 异步同步到后端（不阻塞UI）
    const backendId = existing.data?.backendItineraryId
    const userStore = useUserStore()
    
    if (backendId && userStore.isLoggedIn) {
      // 异步更新后端，不等待结果
      Promise.resolve().then(async () => {
        try {
          // 将更新转换为后端请求格式
          const updateRequest = convertTravelToUpdateRequest(existing, updates)
          
          // 只发送有值的字段
          const hasUpdates = Object.keys(updateRequest).length > 0
          
          if (hasUpdates) {
            console.log('[TravelListStore] 同步更新到后端:', {
              backendId,
              updates: Object.keys(updateRequest)
            })
            
            // 调用后端更新接口
            const backendResponse = await updateItinerary(backendId, updateRequest)
            
            // 更新本地数据中的后端信息
            if (backendResponse) {
              const currentIndex = travelList.value.findIndex(t => t.id === id)
              if (currentIndex !== -1) {
                const currentTravel = travelList.value[currentIndex]
                if (currentTravel) {
                  currentTravel.data = {
                    ...currentTravel.data,
                    backendItineraryId: backendResponse.id,
                    itineraryData: {
                      ...currentTravel.data?.itineraryData,
                      destination: backendResponse.destination,
                      summary: backendResponse.summary,
                      totalCost: backendResponse.totalCost,
                      preferences: backendResponse.preferences
                    }
                  }
                  currentTravel.updatedAt = backendResponse.updatedAt
                  // 如果后端返回了 mode 字段，更新本地的 mode（确保数据一致性）
                  if (backendResponse.mode) {
                    currentTravel.mode = backendResponse.mode
                  }
                }
              }
            }
            
            console.log('[TravelListStore] 后端更新成功')
          }
        } catch (error: any) {
          console.error('[TravelListStore] 后端更新失败，仅更新本地:', error.message)
          // 后端更新失败不影响本地更新，继续使用本地数据
        }
      }).catch(error => {
        console.error('[TravelListStore] 后端更新异常:', error)
      })
    }

    return updatedTravel
  }
  
  // 删除旅程
  const deleteTravel = (id: string) => {
    const index = travelList.value.findIndex(t => t.id === id)
    if (index !== -1) {
      travelList.value.splice(index, 1)
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
    loadedFromBackend.value = false
  }
  
  // 从后端同步行程列表（支持所有模式）
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
          
          // 从后端返回的 mode 字段获取模式，如果没有则默认为 planner
          const mode = itinerary.mode || 'planner'
          
          return {
            id: itinerary.id,
            title: title,
            location: itinerary.destination,
            description: itinerary.summary || itinerary.description || `精心安排的${daysCount}天${itinerary.destination}之旅`,
            mode: mode as 'planner' | 'seeker' | 'inspiration',
            status: itinerary.status === 'published' ? 'active' : (itinerary.status === 'archived' ? 'completed' : 'draft'),
            createdAt: itinerary.createdAt || new Date().toISOString(),
            updatedAt: itinerary.updatedAt || new Date().toISOString(),
            duration: daysCount,
            participants: 1,
            budget: totalCost,
            destination: itinerary.destination,
            data: {
              backendItineraryId: itinerary.id,
              days: Array.isArray(itinerary.days) ? itinerary.days : [],
              destination: itinerary.destination,
              title: title,
              totalCost: totalCost,
              summary: itinerary.summary || '',
              itineraryData: {
                days: Array.isArray(itinerary.days) ? itinerary.days : [],
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
        
        // 完全使用后端数据，不再合并本地数据
        travelList.value = backendTravels
        
        // 按更新时间排序（最新的在前）
        travelList.value.sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.createdAt).getTime()
          const timeB = new Date(b.updatedAt || b.createdAt).getTime()
          return timeB - timeA
        })
        
        loadedFromBackend.value = true
        console.log('[TravelListStore] 从后端同步成功:', {
          backendCount: backendTravels.length,
          totalCount: travelList.value.length,
          modes: [...new Set(backendTravels.map(t => t.mode))]
        })
      } else {
        // 如果后端返回空数据，清空列表
        travelList.value = []
        loadedFromBackend.value = true
      }
    } catch (error: any) {
      console.error('[TravelListStore] 从后端同步失败:', error.message)
      // 同步失败时，如果之前没有加载过，保持空列表
      if (!loadedFromBackend.value) {
        travelList.value = []
      }
      throw error // 抛出错误，让调用方处理
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
    syncFromBackend,
    loadedFromBackend
  }
})
