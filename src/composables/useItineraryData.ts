/**
 * 行程数据管理 Composable
 * 
 * 封装行程数据的加载、转换、状态管理等逻辑
 * 将业务逻辑从 View 层抽离，提高代码可维护性
 */

import { ref, type Ref } from 'vue'
import { message } from 'ant-design-vue'
import type { Travel } from '@/stores/travelList'
import { useTravelListStore } from '@/stores/travelList'
import { 
  normalizeBackendItinerary, 
  type UnifiedItineraryData,
  normalizeBackendDay,
  normalizeBackendActivity
} from '@/utils/itineraryAdapter'

/**
 * 行程数据管理 Composable
 * 
 * @param itineraryId 行程 ID (响应式引用)
 * @returns 行程数据、加载状态、错误信息和加载方法
 */
export function useItineraryData(itineraryId: Ref<string | undefined>) {
  const itinerary = ref<Travel | null>(null)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const isEnriching = ref(false) // 位置信息生成中
  const enrichingProgress = ref(0) // 位置信息生成进度 (0-100)
  const travelListStore = useTravelListStore()

  /**
   * 后台静默富化任务
   */
  const runBackgroundEnrichment = async (
    currentFrontendData: UnifiedItineraryData,
    destination: string,
    journeyId: string
  ): Promise<void> => {
    console.log('[useItineraryData] 🚀 启动后台静默富化任务...')
    
    isEnriching.value = true
    enrichingProgress.value = 0
    
    try {
      const { enrichItineraryWithLocationInfo, updateJourneyFromFrontendData } = await import('@/services/itineraryAPI')
      
      // 1. 调用 API 获取详细信息
      const enrichedData = await enrichItineraryWithLocationInfo(
        currentFrontendData as any,
        destination,
        (msg) => {
          console.log(`[BackgroundEnrich] ${msg}`)
          // 尝试从消息中提取进度信息
          const progressMatch = msg.match(/(\d+)%/)
          if (progressMatch && progressMatch[1]) {
            enrichingProgress.value = parseInt(progressMatch[1], 10)
          }
          // 如果是错误消息，记录但不中断流程
          if (msg.includes('失败') || msg.includes('失败:')) {
            console.warn(`[BackgroundEnrich] ${msg}`)
          }
        }
      )
      
      enrichingProgress.value = 100

      // 2. 检查是否真的有更新（避免无意义的重渲染）
      const hasNewInfo = enrichedData.days.some((d, i) => 
        d.timeSlots.some((s, j) => {
          const oldSlot = currentFrontendData.days[i]?.timeSlots[j]
          return !oldSlot?.details?.image && s?.details?.image
        })
      )

      if (!hasNewInfo) {
        console.log('[useItineraryData] 🏁 富化完成，但未发现显著新信息，跳过更新')
        return
      }

      // 3. 更新本地视图
      if (itinerary.value && itinerary.value.data && itinerary.value.data.itineraryData) {
        itinerary.value.data.itineraryData.days = [...enrichedData.days]
        
        if (enrichedData.totalCost !== itinerary.value.data.itineraryData.totalCost) {
          itinerary.value.data.itineraryData.totalCost = enrichedData.totalCost
          itinerary.value.budget = enrichedData.totalCost
        }
        
        console.log('[useItineraryData] ✨ 本地视图已更新为富化后的数据')
      }

      // 4. 静默保存到后端
      if (!journeyId) {
        console.warn('[useItineraryData] ⚠️ 无法保存富化数据：journeyId 为空')
        return
      }
      console.log('[useItineraryData] 💾 正在将富化数据回写到数据库...')
      await updateJourneyFromFrontendData(journeyId, {
        itineraryData: enrichedData as any,
        startDate: itinerary.value?.startDate || new Date().toISOString().split('T')[0]
      })
      console.log('[useItineraryData] ✅ 富化数据回写完成')
    } catch (error: any) {
      // 后台富化失败不影响主流程，只记录日志
      const errorMessage = error?.message || String(error) || '未知错误'
      console.warn('[useItineraryData] ⚠️ 后台富化失败，使用基础行程数据:', errorMessage)
      // 如果是后端任务错误，提供更友好的提示
      if (errorMessage.includes('updateProgress') || errorMessage.includes('异步任务失败')) {
        console.warn('[useItineraryData] 后端任务处理异常，这是后端问题，不影响前端使用')
      }
      // 不抛出错误，避免影响主流程
    } finally {
      isEnriching.value = false
      enrichingProgress.value = 0
    }
  }

  /**
   * 从后端加载行程详情
   */
  const loadData = async () => {
    if (!itineraryId.value) {
      error.value = new Error('行程 ID 不能为空')
      return
    }

    isLoading.value = true
    error.value = null

    try {
      console.log('[useItineraryData] 从后端加载行程详情:', itineraryId.value)
      const { getItineraryDetail, batchGetActivities } = await import('@/services/itineraryAPI')
      
      // 1. 获取后端行程详情
      const backendItinerary = await getItineraryDetail(itineraryId.value)
      console.log('[useItineraryData] 后端行程详情获取成功, destinationId:', backendItinerary.destinationId)
      
      // 1.1. 如果后端没有返回 destinationId，通过目的地名称查找或创建
      let finalDestinationId = backendItinerary.destinationId
      if (!finalDestinationId && backendItinerary.destination) {
        try {
          const { findOrCreateDestination } = await import('@/services/externalAPI')
          const destination = await findOrCreateDestination(backendItinerary.destination)
          if (destination) {
            finalDestinationId = destination.id
          }
        } catch (err: any) {
          console.warn('[useItineraryData] 查找或创建目的地失败:', err.message)
        }
      }
      
      // 2. 批量获取活动详情
      let activitiesMap: { [dayId: string]: any[] } = {}
      try {
        // 确保所有 day 都有 id
        const dayIds = backendItinerary.days
          .map(day => {
            if (!day.id) {
              console.warn(`[useItineraryData] Day ${day.day} 缺少 id 字段:`, day)
            }
            return day.id
          })
          .filter((id): id is string => Boolean(id))
        
        console.log('[useItineraryData] 准备批量获取活动详情:', {
          journeyId: itineraryId.value,
          dayIdsCount: dayIds.length,
          dayIds: dayIds,
          daysFromBackend: backendItinerary.days.map(d => ({ 
            id: d.id, 
            day: d.day, 
            hasId: !!d.id,
            activitiesCount: d.activities?.length || 0 
          })),
          daysWithoutId: backendItinerary.days.filter(d => !d.id).map(d => ({ day: d.day, date: d.date }))
        })
        
        // 如果有 day 缺少 id，记录警告
        if (dayIds.length !== backendItinerary.days.length) {
          console.error('[useItineraryData] ⚠️ 部分 day 缺少 id 字段，无法批量获取活动详情！', {
            totalDays: backendItinerary.days.length,
            daysWithId: dayIds.length,
            daysWithoutId: backendItinerary.days.filter(d => !d.id).map(d => ({ day: d.day, date: d.date }))
          })
        }
        
        if (dayIds.length > 0) {
          const activitiesResponse = await batchGetActivities(itineraryId.value, { dayIds })
          activitiesMap = activitiesResponse.activities || {}
          console.log('[useItineraryData] 批量获取活动详情成功 (按 dayIds):', {
            dayIdsCount: Object.keys(activitiesMap).length,
            totalActivities: activitiesResponse.totalCount,
            activitiesByDay: Object.entries(activitiesMap).map(([dayId, activities]) => ({
              dayId,
              count: activities.length
            }))
          })
        } else {
          const activitiesResponse = await batchGetActivities(itineraryId.value)
          activitiesMap = activitiesResponse.activities || {}
          console.log('[useItineraryData] 批量获取活动详情成功 (全部):', {
            dayIdsCount: Object.keys(activitiesMap).length,
            totalActivities: activitiesResponse.totalCount,
            activitiesByDay: Object.entries(activitiesMap).map(([dayId, activities]) => ({
              dayId,
              count: activities.length,
              firstActivity: activities[0] ? {
                id: activities[0].id,
                time: activities[0].time,
                title: activities[0].title,
                dayId: activities[0].dayId
              } : null
            })),
            activitiesMapKeys: Object.keys(activitiesMap),
            backendDayIds: backendItinerary.days.map((d: any) => ({ id: d.id, day: d.day }))
          })
        }
      } catch (activitiesError: any) {
        console.warn('[useItineraryData] 批量获取活动详情失败，使用基础活动数据:', activitiesError.message)
        // 如果批量获取失败，尝试使用 backendItinerary.days 中的 activities
        if (backendItinerary.days && backendItinerary.days.length > 0) {
          backendItinerary.days.forEach((day: any) => {
            if (day.id && day.activities && day.activities.length > 0) {
              activitiesMap[day.id] = day.activities
            }
          })
          console.log('[useItineraryData] 使用后端返回的基础活动数据:', {
            dayIdsCount: Object.keys(activitiesMap).length
          })
        }
      }
      
      // 3. 数据转换（使用适配器）
      const unifiedData = normalizeBackendItinerary(backendItinerary, activitiesMap)
      
      // 详细记录转换后的数据
      const totalActivities = unifiedData.days.reduce((sum, d) => sum + (d.timeSlots?.length || 0), 0)
      const daysWithActivities = unifiedData.days.filter(d => d.timeSlots && d.timeSlots.length > 0)
      
      console.log('[useItineraryData] 转换为前端格式成功:', {
        daysCount: unifiedData.days.length,
        daysWithActivitiesCount: daysWithActivities.length,
        totalActivities,
        totalCost: unifiedData.totalCost,
        daysDetail: unifiedData.days.map(d => ({
          day: d.day,
          date: d.date,
          activitiesCount: d.timeSlots?.length || 0
        }))
      })
      
      // 检查是否有数据丢失
      if (unifiedData.days.length === 0) {
        console.warn('[useItineraryData] ⚠️ 转换后没有天数数据！', {
          backendDaysCount: backendItinerary.days?.length || 0,
          activitiesMapKeys: Object.keys(activitiesMap),
          backendItinerary: {
            id: backendItinerary.id,
            destination: backendItinerary.destination,
            daysCount: backendItinerary.daysCount,
            hasDays: !!backendItinerary.days,
            daysLength: backendItinerary.days?.length || 0
          }
        })
      }
      
      if (totalActivities === 0 && (backendItinerary.days?.length || 0) > 0) {
        console.warn('[useItineraryData] ⚠️ 转换后没有活动数据！', {
          backendDaysCount: backendItinerary.days?.length || 0,
          backendActivitiesCount: backendItinerary.days?.reduce((sum: number, d: any) => sum + (d.activities?.length || 0), 0) || 0,
          activitiesMapKeys: Object.keys(activitiesMap),
          activitiesMapTotal: Object.values(activitiesMap).reduce((sum, arr) => sum + (arr?.length || 0), 0)
        })
      }
      
      // 4. 构建 Travel 对象
      const daysCount = unifiedData.duration
      const title = unifiedData.title || `${backendItinerary.destination}之旅`
      const mode = backendItinerary.mode || 'planner'
      
      const newTravel: Travel = {
        id: backendItinerary.id,
        title,
        location: backendItinerary.destination,
        description: backendItinerary.summary || `精心安排的${daysCount}天${backendItinerary.destination}之旅`,
        mode: mode as 'planner' | 'seeker' | 'inspiration',
        status: backendItinerary.status === 'published' ? 'active' : (backendItinerary.status === 'archived' ? 'completed' : 'draft'),
        createdAt: backendItinerary.createdAt || new Date().toISOString(),
        updatedAt: backendItinerary.updatedAt || new Date().toISOString(),
        startDate: backendItinerary.startDate,
        duration: daysCount,
        participants: 1,
        budget: backendItinerary.totalCost || 0,
        destination: backendItinerary.destination,
        data: {
          backendItineraryId: backendItinerary.id,
          destinationId: finalDestinationId,
          backendDestinationId: finalDestinationId,
          days: unifiedData.days as any,
          destination: unifiedData.destination,
          title,
          totalCost: unifiedData.totalCost,
          summary: unifiedData.summary,
          startDate: backendItinerary.startDate,
          status: backendItinerary.status,
          itineraryData: {
            days: unifiedData.days as any,
            destination: unifiedData.destination,
            title,
            totalCost: unifiedData.totalCost,
            duration: unifiedData.duration,
            budget: unifiedData.budget,
            preferences: unifiedData.preferences,
            currency: unifiedData.currency,
            currencyInfo: unifiedData.currencyInfo,
            practicalInfo: unifiedData.practicalInfo
          },
          currencyCode: unifiedData.currency,
          currency: unifiedData.currencyInfo
        }
      }
      
      // 5. 更新状态（先设置 isLoading 为 false，确保 UI 立即显示数据）
      isLoading.value = false
      
      // 5.1. 检查是否需要异步获取位置信息（后台执行，不阻塞）
      if (newTravel.data?.backendItineraryId && newTravel.destination) {
        // 检查是否有活动缺少位置信息
        const hasMissingLocationInfo = unifiedData.days.some(day => 
          day.timeSlots?.some(slot => {
            if (!slot.title || !slot.type || !slot.coordinates) return false
            const details = slot.details || {}
            return !(
              details.tripAdvisorId ||
              details.address ||
              (details.name && details.address)
            )
          })
        )
        
        if (hasMissingLocationInfo) {
          console.log('[useItineraryData] 检测到活动缺少位置信息，异步触发获取...')
          // 异步触发位置信息获取（不阻塞）
          Promise.resolve().then(async () => {
            try {
              const { triggerLocationInfoEnrichmentAsync } = await import('@/services/itineraryAPI')
              await triggerLocationInfoEnrichmentAsync(
                newTravel.data.backendItineraryId!,
                newTravel.destination || newTravel.location || '',
                (message) => {
                  console.log('[useItineraryData]', message)
                }
              )
            } catch (error: any) {
              console.warn('[useItineraryData] 异步获取位置信息失败:', error)
              // 不抛出错误，避免影响主流程
            }
          })
        }
      }
      
      // 6. 更新 itinerary（这会触发响应式更新）
      itinerary.value = newTravel
      
      console.log('[useItineraryData] ✅ 基础数据已设置，准备显示:', {
        daysCount: unifiedData.days.length,
        totalTimeSlots: unifiedData.days.reduce((sum, d) => sum + (d.timeSlots?.length || 0), 0),
        firstDaySlots: unifiedData.days[0]?.timeSlots?.length || 0
      })
      
      // 7. 更新 Store
      const existingTravel = travelListStore.getTravel(newTravel.id)
      if (existingTravel) {
        travelListStore.updateTravel(newTravel.id, newTravel)
      } else {
        travelListStore.createTravel(newTravel)
      }
      
      console.log('[useItineraryData] ✅ 基础数据已渲染 (Location Enrichment 在后台进行)')
      
      // 7. 启动后台静默富化检查
      let totalSlotsCount = 0
      let locationInfoCount = 0
      
      unifiedData.days.forEach((day) => {
        day.timeSlots.forEach((slot) => {
          totalSlotsCount++
          const details = slot.details
          const hasRichInfo = details && (details.image || (details.location && details.address))
          if (hasRichInfo) locationInfoCount++
        })
      })

      const richInfoRatio = totalSlotsCount > 0 ? locationInfoCount / totalSlotsCount : 0
      const shouldEnrich = totalSlotsCount > 0 && richInfoRatio < 0.5

      if (shouldEnrich) {
        // ⚠️ 非阻塞调用！不要 await！
        runBackgroundEnrichment(unifiedData, backendItinerary.destination, backendItinerary.id)
      } else {
        console.log('[useItineraryData] 数据质量良好，无需后台富化')
      }
      
    } catch (err: any) {
      console.error('[useItineraryData] ❌ 从后端加载行程详情失败:', err)
      error.value = err
      message.error('加载行程详情失败，请刷新页面重试')
      isLoading.value = false
    }
  }

  /**
   * 刷新数据
   */
  const refresh = async () => {
    await loadData()
  }

  return {
    itinerary,
    isLoading,
    error,
    isEnriching,
    enrichingProgress,
    loadData,
    refresh
  }
}

