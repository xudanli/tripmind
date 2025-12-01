/**
 * POI 搜索 Composable
 * 提取搜索相关的所有逻辑，包括打开搜索、执行搜索、添加POI等
 */

import { ref, computed, type Ref } from 'vue'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { searchPOI, type POISearchResult } from '@/services/externalAPI'
import { searchNearbyPOI, type POIResult, type POICategory } from '@/services/poiSearchAPI'
import { addSlotToDay } from '@/services/itineraryAPI'
import type { TimeSlot, ItineraryDay } from '@/components/TravelDetail/ExperienceDay/types'
import type { SearchLocation, SearchContext } from '@/components/TravelDetail/ExperienceDay/useItineraryModals'

export interface UsePoiSearchOptions {
  /** 行程数据（响应式） */
  itineraryData: Ref<any>
  /** Travel 对象（响应式） */
  travel: Ref<any>
  /** 更新回调 */
  onUpdate?: (updatedTravel: any) => void
  /** 获取 slot 坐标的辅助函数 */
  getSlotCoords?: (slot: TimeSlot) => { lat: number; lng: number } | null
}

export function usePoiSearch(options: UsePoiSearchOptions) {
  const { t, locale } = useI18n()
  const { itineraryData, travel, onUpdate, getSlotCoords } = options

  // 搜索状态
  const searchModalVisible = ref(false)
  const searching = ref(false)
  const searchResults = ref<POIResult[]>([])
  const selectedSearchCategory = ref<POICategory>('restaurant')
  const hasSearched = ref(false)
  const searchKeyword = ref<string>('')
  const searchLocation = ref<SearchLocation>({ name: '' })
  const currentSearchContext = ref<SearchContext | null>(null)

  const durationLabelKey = computed(() => {
    if (selectedSearchCategory.value === 'ev_charging') return 'travelDetail.experienceDay.chargingDuration'
    if (selectedSearchCategory.value === 'accommodation') return 'travelDetail.experienceDay.stayDuration'
    return 'travelDetail.experienceDay.estimatedStay'
  })

  /**
   * 将后端 POI 搜索结果转换为前端格式
   */
  const convertPOISearchResultToPOIResult = (backendResult: POISearchResult, category: POICategory): POIResult => {
    const name = backendResult.name || '未知地点'
    const address = backendResult.address || backendResult.description || ''

    return {
      name: {
        chinese: name,
        english: name,
        local: name
      },
      category: category,
      address: {
        chinese: address,
        english: address,
        local: address
      },
      coordinates: {
        lat: backendResult.latitude,
        lng: backendResult.longitude
      },
      recommendation: backendResult.description || '推荐前往',
      rating: backendResult.rating ? {
        score: backendResult.rating,
        platform: 'TripAdvisor'
      } : undefined,
      photo: backendResult.imageUrl,
      distance: undefined,
      estimatedDuration: undefined,
      contact: undefined,
      openingHours: undefined,
      pricing: undefined
    }
  }

  /**
   * 将前端 POI 类别映射到后端类型
   */
  const mapCategoryToBackendType = (category: POICategory): 'attraction' | 'restaurant' | 'hotel' | 'shopping' | 'all' => {
    const mapping: Record<POICategory, 'attraction' | 'restaurant' | 'hotel' | 'shopping' | 'all'> = {
      'restaurant': 'restaurant',
      'attraction': 'attraction',
      'accommodation': 'hotel',
      'gas_station': 'all',
      'ev_charging': 'all',
      'rest_area': 'all'
    }
    return mapping[category] || 'all'
  }

  /**
   * 打开搜索模态框
   */
  const openSearch = async (day: number, slotIndex: number, slot: TimeSlot) => {
    currentSearchContext.value = { day, slotIndex, slot }

    // 设置搜索位置
    const locationName = slot.details?.name?.chinese || slot.details?.name?.english || slot.location || slot.title || '当前位置'
    const locationAddress = slot.details?.address?.chinese || slot.details?.address?.english || slot.location
    const slotCoords = getSlotCoords?.(slot) || null

    searchLocation.value = {
      name: locationName,
      address: locationAddress,
      coordinates: slotCoords || undefined
    }

    // 重置搜索状态
    searchResults.value = []
    hasSearched.value = false
    selectedSearchCategory.value = 'restaurant'
    searchKeyword.value = ''

    // 打开模态框并自动搜索
    searchModalVisible.value = true
    await performSearch()
  }

  /**
   * 执行搜索
   */
  const performSearch = async () => {
    if (!searchLocation.value.name) {
      message.warning('搜索位置信息不完整')
      return
    }

    searching.value = true
    hasSearched.value = false
    searchResults.value = []

    try {
      const backendType = mapCategoryToBackendType(selectedSearchCategory.value)

      const categoryQueryMap: Record<POICategory, string> = {
        restaurant: '餐厅',
        attraction: '景点',
        accommodation: '酒店',
        shopping: '购物',
        gas_station: '加油站',
        ev_charging: '充电桩',
        rest_area: '休息站'
      }

      const searchQuery = searchKeyword.value.trim() || categoryQueryMap[selectedSearchCategory.value] || '附近'
      const destination = travel.value?.destination || travel.value?.location || ''
      const coordinates = searchLocation.value.coordinates || null

      const backendResults = await searchPOI({
        query: searchQuery,
        destination: destination || undefined,
        latitude: coordinates?.lat,
        longitude: coordinates?.lng,
        type: backendType,
        limit: 20
      })

      const convertedResults = backendResults.map(result =>
        convertPOISearchResultToPOIResult(result, selectedSearchCategory.value)
      )

      // 如果后端返回结果为空，回退到 AI 搜索
      if (convertedResults.length === 0) {
        const aiResults = await searchNearbyPOI(
          searchLocation.value,
          selectedSearchCategory.value,
          {
            language: locale.value,
            radius: 5,
            maxResults: 5
          }
        )
        searchResults.value = aiResults
      } else {
        searchResults.value = convertedResults
      }

      hasSearched.value = true

      if (searchResults.value.length === 0) {
        message.info('未找到相关结果，可以尝试切换类别或调整搜索位置。')
      }
    } catch (error: any) {
      console.error('搜索失败:', error)

      // 如果后端搜索失败，回退到 AI 搜索
      try {
        const aiResults = await searchNearbyPOI(
          searchLocation.value,
          selectedSearchCategory.value,
          {
            language: locale.value,
            radius: 5,
            maxResults: 5
          }
        )
        searchResults.value = aiResults
        hasSearched.value = true
      } catch (aiError) {
        console.error('AI 搜索也失败:', aiError)
        message.error(`搜索失败: ${error.message || '未知错误'}`)
        hasSearched.value = true
      }
    } finally {
      searching.value = false
    }
  }

  /**
   * 处理类别改变
   */
  const handleCategoryChange = () => {
    if (!searchKeyword.value.trim()) {
      performSearch()
    }
  }

  /**
   * 处理搜索（用户点击搜索按钮或按回车）
   */
  const handleSearch = () => {
    performSearch()
  }

  /**
   * 添加 POI 到行程
   */
  const addPoi = async (poi: POIResult) => {
    if (!currentSearchContext.value || !itineraryData.value?.days) {
      message.error('无法添加：行程数据不存在')
      return
    }

    const { day, slotIndex, slot } = currentSearchContext.value
    const dayIndex = itineraryData.value.days.findIndex((d: any) => d.day === day)

    if (dayIndex === -1) {
      message.error('无法添加：找不到对应的行程日期')
      return
    }

    const timeSlots = itineraryData.value.days[dayIndex].timeSlots || []

    // 计算新时间槽的时间（插入到当前槽之后）
    const currentSlot = timeSlots[slotIndex]
    const currentTime = currentSlot?.time || '12:00'
    const [hours, minutes] = currentTime.split(':').map(Number)
    const nextTime = new Date(2000, 0, 1, hours, minutes + 30)
    const nextTimeStr = `${String(nextTime.getHours()).padStart(2, '0')}:${String(nextTime.getMinutes()).padStart(2, '0')}`

    // 获取POI名称和目的地
    const poiName = poi.name.chinese || poi.name.english || poi.name.local || '新地点'
    const destination = travel.value?.destination || travel.value?.location || ''

    // 构建基础的时间槽数据
    const baseSlot: TimeSlot = {
      time: nextTimeStr,
      title: poiName,
      activity: poiName,
      location: poi.address.chinese || poi.address.english || poi.address.local || '',
      type: poi.category === 'restaurant' ? 'restaurant' : poi.category === 'attraction' ? 'attraction' : 'attraction',
      category: poi.category,
      duration: poi.estimatedDuration || '30分钟',
      notes: poi.recommendation || '',
      cost: poi.pricing?.general ? (typeof poi.pricing.general === 'number' ? poi.pricing.general : parseFloat(String(poi.pricing.general)) || 0) : 0,
      coordinates: poi.coordinates,
      details: {
        name: poi.name,
        address: poi.address,
        coordinates: poi.coordinates,
        rating: poi.rating ? {
          score: poi.rating.score,
          platform: poi.rating.platform,
          reviewCount: poi.rating.reviewCount
        } : undefined,
        pricing: poi.pricing,
        openingHours: poi.openingHours,
        contact: poi.contact,
        photo: poi.photo ? [poi.photo] : undefined,
        recommendations: {
          description: poi.recommendation
        }
      }
    }

    // 先插入基础数据，立即显示
    timeSlots.splice(slotIndex + 1, 0, baseSlot)

    // 通知父组件更新
    if (travel.value && onUpdate) {
      onUpdate({
        ...travel.value,
        data: {
          ...travel.value.data,
          itineraryData: itineraryData.value
        }
      })
    }

    message.success('已添加到行程，正在获取详细信息...')

    // 调用后端接口添加时间段
    const backendItineraryId = travel.value?.data?.backendItineraryId
    const dayData = itineraryData.value.days[dayIndex]
    const dayId = dayData?.id

    if (backendItineraryId && dayId) {
      try {
        // 将 duration 转换为分钟数
        let durationMinutes = 30
        const durationStr = baseSlot.duration || '30分钟'
        if (typeof durationStr === 'string') {
          if (durationStr.includes('小时')) {
            const hours = parseFloat(durationStr) || 1
            durationMinutes = hours * 60
          } else if (durationStr.includes('分钟')) {
            durationMinutes = parseFloat(durationStr) || 30
          } else {
            durationMinutes = parseFloat(durationStr) || 30
          }
        } else if (typeof durationStr === 'number') {
          durationMinutes = durationStr
        }

        // 构建请求参数
        const slotRequest: any = {
          time: baseSlot.time,
          title: baseSlot.title,
          type: (baseSlot.type === 'restaurant' ? 'meal' :
                 baseSlot.type === 'attraction' ? 'attraction' :
                 baseSlot.type === 'accommodation' ? 'hotel' :
                 baseSlot.type === 'shopping' ? 'shopping' :
                 baseSlot.type === 'transport' ? 'transport' :
                 baseSlot.type === 'ocean' ? 'ocean' : 'attraction') as 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean',
          duration: durationMinutes,
          location: baseSlot.coordinates || { lat: 0, lng: 0 },
          notes: baseSlot.notes || '',
          cost: baseSlot.cost || 0
        }

        // 如果有位置详细信息，添加到请求中
        if (baseSlot.details) {
          const locationDetails: any = {}
          if (baseSlot.details.name?.chinese) locationDetails.chineseName = baseSlot.details.name.chinese
          if (baseSlot.details.name?.english) locationDetails.localName = baseSlot.details.name.english
          if (baseSlot.details.address?.chinese) locationDetails.chineseAddress = baseSlot.details.address.chinese
          if (baseSlot.details.address?.english) locationDetails.localAddress = baseSlot.details.address.english
          if (baseSlot.details.rating) {
            locationDetails.rating = typeof baseSlot.details.rating === 'number'
              ? baseSlot.details.rating
              : baseSlot.details.rating.score
          }
          if (baseSlot.details.pricing?.detail) {
            locationDetails.ticketPrice = baseSlot.details.pricing.detail
          }
          if (Object.keys(locationDetails).length > 0) {
            slotRequest.locationDetails = locationDetails
          }
        }

        const createdActivity = await addSlotToDay(backendItineraryId, dayId, slotRequest)

        // 更新前端数据，使用后端返回的 ID
        const insertedSlot = timeSlots[slotIndex + 1]
        if (insertedSlot) {
          insertedSlot.id = createdActivity.id
        }

        message.success('已成功添加到行程')
      } catch (error: any) {
        console.error('添加POI到后端失败:', error)
        message.warning('已添加到前端，但后端保存失败: ' + (error.message || '未知错误'))
      }
    }

    // 关闭搜索模态框
    searchModalVisible.value = false
  }

  /**
   * 关闭搜索模态框
   */
  const closeSearch = () => {
    searchModalVisible.value = false
    currentSearchContext.value = null
    searchResults.value = []
    hasSearched.value = false
    searchKeyword.value = ''
  }

  return {
    // 状态
    searchModalVisible,
    searching,
    searchResults,
    selectedSearchCategory,
    hasSearched,
    searchKeyword,
    searchLocation,
    currentSearchContext,
    durationLabelKey,
    // 方法
    openSearch,
    performSearch,
    handleCategoryChange,
    handleSearch,
    addPoi,
    closeSearch,
    // 辅助函数
    convertPOISearchResultToPOIResult,
    mapCategoryToBackendType,
  }
}

