/**
 * 活动编辑 Composable
 * 提取编辑相关的所有逻辑，包括打开编辑、保存、取消等
 */

import { ref, computed, type Ref } from 'vue'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { addSlotToDay, updateSlot } from '@/services/itineraryAPI'
import { DEFAULT_CONFIG } from '@/config/defaults'
import type { TimeSlot, ItineraryDay } from '@/components/TravelDetail/ExperienceDay/types'
import type { EditingData, EditingSlot } from '@/components/TravelDetail/ExperienceDay/useItineraryModals'

export interface UseSlotEditingOptions {
  /** 行程数据（响应式） */
  itineraryData: Ref<any>
  /** Travel 对象（响应式） */
  travel: Ref<any>
  /** 更新回调 */
  onUpdate?: (updatedTravel: any) => void
  /** 获取 slot 的辅助函数 */
  getSlot?: (day: number, slotIndex: number) => TimeSlot | null
  /** 提取 slot 描述的函数 */
  extractSlotDescription?: (slot: TimeSlot) => string
  /** 标准化交通方式的函数 */
  normalizeTransportModes?: (options: any) => string[]
}

export function useSlotEditing(options: UseSlotEditingOptions) {
  const { t } = useI18n()
  const { itineraryData, travel, onUpdate, getSlot, extractSlotDescription, normalizeTransportModes } = options

  // 编辑状态
  const editModalVisible = ref(false)
  const editingSlot = ref<EditingSlot | null>(null)
  const isAddingNew = ref(false)
  const newSlotInsertInfo = ref<{ day: number; insertIndex: number } | null>(null)
  const editFormActiveKeys = ref<string[]>(['basic', 'details', 'booking'])

  // 编辑数据
  const editingData = ref<EditingData>({
    time: '',
    title: '',
    activity: '',
    type: 'attraction',
    category: 'attraction',
    duration: null,
    cost: null,
    location: '',
    coordinates: null,
    nameChinese: '',
    nameEnglish: '',
    rating: null,
    transportation: '',
    openingHours: '',
    pricingDetail: '',
    bookingInfo: '',
    visitTips: '',
    outfitSuggestions: '',
    culturalTips: '',
    accessibility: '',
    scenicIntro: '',
    highlights: '',
    notes: '',
    bookingLinks: [],
    transportModes: [],
  })

  /**
   * 打开编辑窗口
   */
  const openEdit = (day: number, slotIndex: number, slot: TimeSlot) => {
    editingSlot.value = { day, slotIndex }
    isAddingNew.value = false
    newSlotInsertInfo.value = null

    const descriptionText = extractSlotDescription?.(slot) || ''
    const reminderText = typeof slot.notes === 'string' ? slot.notes.trim() : ''
    
    const notesPieces: string[] = []
    if (descriptionText) notesPieces.push(descriptionText)
    if (reminderText) {
      if (!descriptionText || !descriptionText.includes(reminderText)) {
        notesPieces.push(reminderText)
      }
    }
    const combinedNotes = notesPieces.join('\n')

    const transportation = slot.details?.transportation
    const transportationOptions = (transportation && typeof transportation === 'object' && !Array.isArray(transportation) && 'options' in transportation)
      ? (transportation as any).options
      : null
    const existingTransportModes = normalizeTransportModes?.(transportationOptions as any) || []

    // 提取坐标
    const coords = slot.coordinates || slot.details?.coordinates || null
    const coordinates = coords && typeof coords.lat === 'number' && typeof coords.lng === 'number'
      ? { lat: coords.lat, lng: coords.lng }
      : null

    editingData.value = {
      time: slot.time || '',
      title: slot.title || slot.activity || '',
      activity: slot.activity || slot.title || '',
      type: slot.type || slot.category || 'attraction',
      category: slot.category || slot.type || 'attraction',
      duration: slot.duration !== undefined && slot.duration !== null ? slot.duration : null,
      cost: slot.cost ?? null,
      location: typeof slot.location === 'string' ? slot.location : '',
      coordinates: coordinates,
      nameChinese: slot.details?.name?.chinese || '',
      nameEnglish: slot.details?.name?.english || '',
      rating: typeof slot.details?.rating === 'number' ? slot.details.rating : (slot.details?.rating?.score ?? null),
      transportation: slot.details?.transportation || '',
      openingHours: slot.details?.openingHours || '',
      pricingDetail: slot.details?.pricing?.detail || '',
      bookingInfo: slot.details?.recommendations?.bookingInfo || '',
      visitTips: slot.details?.recommendations?.visitTips || '',
      outfitSuggestions: slot.details?.recommendations?.outfitSuggestions || '',
      culturalTips: slot.details?.recommendations?.culturalTips || '',
      accessibility: slot.details?.accessibility || '',
      scenicIntro: slot.details?.description?.scenicIntro || '',
      highlights: Array.isArray(slot.details?.description?.highlights)
        ? slot.details.description.highlights.join('\n')
        : (typeof slot.details?.description?.highlights === 'string' ? slot.details.description.highlights : ''),
      notes: combinedNotes || reminderText || '',
      bookingLinks: (slot.bookingLinks || []).map(link => ({
        name: link.name || '',
        url: link.url || ''
      })),
      transportModes: existingTransportModes,
    }

    editModalVisible.value = true
  }

  /**
   * 打开新增窗口
   */
  const openAdd = (day: number, insertIndex: number, prevSlotTime?: string) => {
    isAddingNew.value = true
    newSlotInsertInfo.value = { day, insertIndex }

    // 计算默认时间
    let newTime = '10:00'
    if (prevSlotTime) {
      const parts = prevSlotTime.split(':')
      const h = parts[0] ? Number(parts[0]) : 10
      const m = parts[1] ? Number(parts[1]) : 0
      const date = new Date(2000, 0, 1, h, m + 30)
      newTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }

    editingSlot.value = { day, slotIndex: -1 } // -1 表示新增模式

    editingData.value = {
      time: newTime,
      title: t('travelDetail.experienceDay.newActivity') || '新活动',
      activity: t('travelDetail.experienceDay.newActivity') || '新活动',
      type: 'attraction',
      category: 'attraction',
      duration: DEFAULT_CONFIG.ACTIVITY.DEFAULT_DURATION,
      cost: null,
      location: '',
      coordinates: null,
      nameChinese: '',
      nameEnglish: '',
      rating: null,
      transportation: '',
      openingHours: '',
      pricingDetail: '',
      bookingInfo: '',
      visitTips: '',
      outfitSuggestions: '',
      culturalTips: '',
      accessibility: '',
      scenicIntro: '',
      highlights: '',
      notes: '',
      bookingLinks: [],
      transportModes: [],
    }

    editModalVisible.value = true
  }

  /**
   * 保存编辑
   */
  const save = async () => {
    if (!editingSlot.value || !itineraryData.value?.days) return

    const day = editingSlot.value.day
    const slotIndex = editingSlot.value.slotIndex
    const dayIndex = itineraryData.value.days.findIndex((d: any) => d.day === day)
    if (dayIndex === -1) return

    // 确保 timeSlots 数组存在且是响应式的
    const dayData = itineraryData.value.days[dayIndex]
    if (!dayData.timeSlots) {
      dayData.timeSlots = []
    }
    // 创建新的数组引用，确保响应式更新
    const timeSlots = [...dayData.timeSlots]

    // 转换 duration 为分钟数
    const defaultDuration = DEFAULT_CONFIG.ACTIVITY.DEFAULT_DURATION
    let durationMinutes = defaultDuration
    const durationValue = editingData.value.duration
    if (durationValue !== null && durationValue !== undefined) {
      if (typeof durationValue === 'string') {
        const durationStr: string = durationValue
        if (durationStr.includes('小时')) {
          const hours = parseFloat(durationStr) || 1
          durationMinutes = hours * 60
        } else if (durationStr.includes('分钟')) {
          durationMinutes = parseFloat(durationStr) || defaultDuration
        } else {
          durationMinutes = parseFloat(durationStr) || defaultDuration
        }
      } else if (typeof durationValue === 'number') {
        durationMinutes = durationValue
      }
    }

    // 映射类型
    const mapType = (type: string): 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean' => {
      const mapping: Record<string, 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'> = {
        'restaurant': 'meal',
        'attraction': 'attraction',
        'accommodation': 'hotel',
        'shopping': 'shopping',
        'transport': 'transport',
        'ocean': 'ocean',
      }
      return mapping[type] || 'attraction'
    }

    let slot: TimeSlot
    let finalSlotIndex = slotIndex

    if (isAddingNew.value && newSlotInsertInfo.value) {
      // 新增模式
      const backendItineraryId = travel.value?.data?.backendItineraryId
      const dayData = itineraryData.value.days[dayIndex]
      const dayId = dayData?.id

      const slotRequest: any = {
        time: editingData.value.time,
        title: editingData.value.title,
        type: mapType(editingData.value.type),
        duration: durationMinutes,
        location: editingData.value.coordinates || { lat: 0, lng: 0 },
        notes: editingData.value.notes || '',
        cost: editingData.value.cost || 0
      }
      
      // 🔧 新增：如果存在 tripAdvisorId，传入 details
      if (editingData.value.details?.tripAdvisorId) {
        slotRequest.details = {
          tripAdvisorId: editingData.value.details.tripAdvisorId
        }
      }

      if (backendItineraryId && dayId) {
        try {
          const createdActivity = await addSlotToDay(backendItineraryId, dayId, slotRequest)
          // 使用后端返回的数据，确保显示的数据和保存的数据一致
          slot = {
            id: createdActivity.id,
            time: createdActivity.time || editingData.value.time,
            title: createdActivity.title || editingData.value.title,
            activity: editingData.value.activity || createdActivity.title || editingData.value.title,
            type: createdActivity.type || editingData.value.type,
            category: editingData.value.category || createdActivity.type || editingData.value.type,
            duration: createdActivity.duration ? createdActivity.duration : (editingData.value.duration ?? undefined),
            cost: createdActivity.cost !== undefined ? createdActivity.cost : (editingData.value.cost ?? undefined),
            location: editingData.value.location || '',
            coordinates: createdActivity.location || editingData.value.coordinates || { lat: 0, lng: 0 },
            bookingLinks: editingData.value.bookingLinks || [],
            notes: createdActivity.notes || editingData.value.notes || '',
            details: {}
          }
          const insertIndex = newSlotInsertInfo.value.insertIndex
          timeSlots.splice(insertIndex, 0, slot)
          finalSlotIndex = insertIndex
          
          // 更新原始数组，确保响应式更新
          dayData.timeSlots = timeSlots
          // 同时更新 activities（如果存在），保持数据一致性
          if (dayData.activities) {
            dayData.activities = [...timeSlots]
          }
          
          console.log('[useSlotEditing] 活动创建成功，使用后端返回的数据:', {
            id: slot.id,
            title: slot.title,
            time: slot.time,
            type: slot.type,
            timeSlotsLength: timeSlots.length
          })
        } catch (error: any) {
          message.error('添加活动失败: ' + (error.message || '未知错误'))
          return
        }
      } else {
        // 只在前端添加
        slot = {
          time: editingData.value.time,
          title: editingData.value.title,
          activity: editingData.value.activity || editingData.value.title,
          type: editingData.value.type,
          category: editingData.value.category || editingData.value.type,
          duration: editingData.value.duration ?? undefined,
          cost: editingData.value.cost ?? undefined,
          location: editingData.value.location,
          coordinates: editingData.value.coordinates ?? undefined,
          bookingLinks: editingData.value.bookingLinks || [],
          notes: editingData.value.notes || '',
          details: {}
        }
        const insertIndex = newSlotInsertInfo.value.insertIndex
        timeSlots.splice(insertIndex, 0, slot)
        finalSlotIndex = insertIndex
        
        // 更新原始数组，确保响应式更新
        dayData.timeSlots = timeSlots
        // 同时更新 activities（如果存在），保持数据一致性
        if (dayData.activities) {
          dayData.activities = [...timeSlots]
        }
      }
    } else {
      // 编辑模式
      if (slotIndex < 0 || slotIndex >= timeSlots.length) {
        console.error('[useSlotEditing] 无效的 slotIndex:', slotIndex)
        return
      }
      slot = timeSlots[slotIndex]
      if (!slot) {
        console.error('[useSlotEditing] 找不到 slot')
        return
      }

      // 先调用后端接口更新，然后使用返回的数据更新前端
      const backendItineraryId = travel.value?.data?.backendItineraryId
      const dayData = itineraryData.value.days[dayIndex]
      const dayId = dayData?.id
      const slotId = slot.id

      if (backendItineraryId && dayId && slotId) {
        try {
          const updateRequest: any = {
            time: editingData.value.time,
            title: editingData.value.title,
            type: mapType(editingData.value.type),
            duration: durationMinutes,
            location: editingData.value.coordinates || slot.coordinates || { lat: 0, lng: 0 },
            notes: editingData.value.notes || slot.notes || '',
            cost: editingData.value.cost || slot.cost || 0
          }
          
          // 🔧 新增：如果存在 tripAdvisorId，传入 details
          if (editingData.value.details?.tripAdvisorId) {
            updateRequest.details = {
              tripAdvisorId: editingData.value.details.tripAdvisorId
            }
          }
          const updatedActivity = await updateSlot(backendItineraryId, dayId, slotId, updateRequest)
          
          // 使用后端返回的数据更新前端，确保数据一致
          slot.time = updatedActivity.time || editingData.value.time
          slot.title = updatedActivity.title || editingData.value.title
          slot.activity = editingData.value.activity || updatedActivity.title || editingData.value.title
          slot.type = updatedActivity.type || editingData.value.type
          slot.category = editingData.value.category || updatedActivity.type || editingData.value.type
          slot.duration = updatedActivity.duration ? updatedActivity.duration : (editingData.value.duration ?? undefined)
          slot.cost = updatedActivity.cost !== undefined ? updatedActivity.cost : (editingData.value.cost ?? undefined)
          slot.location = editingData.value.location || slot.location || ''
          slot.coordinates = updatedActivity.location || editingData.value.coordinates || slot.coordinates || { lat: 0, lng: 0 }
          slot.notes = updatedActivity.notes || editingData.value.notes || slot.notes || ''
          slot.bookingLinks = editingData.value.bookingLinks || slot.bookingLinks || []
          
          // 确保 timeSlots 数组引用更新，触发响应式
          dayData.timeSlots = [...timeSlots]
          // 同时更新 activities（如果存在），保持数据一致性
          if (dayData.activities) {
            dayData.activities = [...timeSlots]
          }
          
          console.log('[useSlotEditing] 活动更新成功，使用后端返回的数据:', {
            id: slot.id,
            title: slot.title,
            time: slot.time,
            type: slot.type
          })
        } catch (error: any) {
          // 如果后端更新失败，仍然更新前端数据（降级处理）
          slot.time = editingData.value.time
          slot.title = editingData.value.title
          slot.activity = editingData.value.activity || editingData.value.title
          slot.type = editingData.value.type
          slot.category = editingData.value.category || editingData.value.type
          slot.duration = editingData.value.duration ?? undefined
          slot.cost = editingData.value.cost ?? undefined
          slot.location = editingData.value.location
          slot.coordinates = editingData.value.coordinates ?? undefined
          slot.bookingLinks = editingData.value.bookingLinks || []
          slot.notes = editingData.value.notes || slot.notes || ''
          
          // 确保 timeSlots 数组引用更新，触发响应式
          dayData.timeSlots = [...timeSlots]
          // 同时更新 activities（如果存在），保持数据一致性
          if (dayData.activities) {
            dayData.activities = [...timeSlots]
          }
          
          message.warning('活动已在前端更新，但后端保存失败: ' + (error.message || '未知错误'))
        }
      } else {
        // 没有后端ID，只更新前端数据
        slot.time = editingData.value.time
        slot.title = editingData.value.title
        slot.activity = editingData.value.activity || editingData.value.title
        slot.type = editingData.value.type
        slot.category = editingData.value.category || editingData.value.type
        slot.duration = editingData.value.duration ?? undefined
        slot.cost = editingData.value.cost ?? undefined
        slot.location = editingData.value.location
        slot.coordinates = editingData.value.coordinates ?? undefined
        slot.bookingLinks = editingData.value.bookingLinks || []
        slot.notes = editingData.value.notes || slot.notes || ''
        
        // 确保 timeSlots 数组引用更新，触发响应式
        dayData.timeSlots = [...timeSlots]
        // 同时更新 activities（如果存在），保持数据一致性
        if (dayData.activities) {
          dayData.activities = [...timeSlots]
        }
      }
    }

    // 更新 details 对象
    if (!slot.details) {
      slot.details = {}
    }

    // 更新名称
    if (!slot.details.name) {
      slot.details.name = {}
    }
    if (editingData.value.nameChinese) {
      slot.details.name.chinese = editingData.value.nameChinese
    }
    if (editingData.value.nameEnglish) {
      slot.details.name.english = editingData.value.nameEnglish
    }

    // 更新其他 details 字段
    if (editingData.value.rating !== null) {
      slot.details.rating = editingData.value.rating
    }
    if (editingData.value.transportation) {
      slot.details.transportation = editingData.value.transportation
    }
    if (editingData.value.openingHours) {
      slot.details.openingHours = editingData.value.openingHours
    }
    if (editingData.value.pricingDetail) {
      if (!slot.details.pricing) {
        slot.details.pricing = {}
      }
      slot.details.pricing.detail = editingData.value.pricingDetail
    }
    if (editingData.value.bookingInfo) {
      if (!slot.details.recommendations) {
        slot.details.recommendations = {}
      }
      slot.details.recommendations.bookingInfo = editingData.value.bookingInfo
    }
    if (editingData.value.visitTips) {
      if (!slot.details.recommendations) {
        slot.details.recommendations = {}
      }
      slot.details.recommendations.visitTips = editingData.value.visitTips
    }
    if (editingData.value.outfitSuggestions) {
      if (!slot.details.recommendations) {
        slot.details.recommendations = {}
      }
      slot.details.recommendations.outfitSuggestions = editingData.value.outfitSuggestions
    }
    if (editingData.value.culturalTips) {
      if (!slot.details.recommendations) {
        slot.details.recommendations = {}
      }
      slot.details.recommendations.culturalTips = editingData.value.culturalTips
    }
    if (editingData.value.accessibility) {
      slot.details.accessibility = editingData.value.accessibility
    }
    // 确保 description 是对象而不是字符串
    if (!slot.details.description || typeof slot.details.description !== 'object' || Array.isArray(slot.details.description)) {
      // 如果 description 是字符串，保存到 notes 字段
      const existingDescription = typeof slot.details.description === 'string' ? slot.details.description : ''
      slot.details.description = {} as any
      if (existingDescription) {
        // 如果原来的 description 是字符串，保存到 slot.notes 或 details.notes
        if (!slot.notes) {
          slot.notes = existingDescription
        }
        if (!slot.details.notes) {
          slot.details.notes = existingDescription
        }
      }
    }
    
    if (editingData.value.scenicIntro) {
      (slot.details.description as any).scenicIntro = editingData.value.scenicIntro
    }
    if (editingData.value.highlights) {
      (slot.details.description as any).highlights = Array.isArray(editingData.value.highlights)
        ? editingData.value.highlights
        : editingData.value.highlights.split('\n').filter(Boolean)
    }
    if (editingData.value.notes) {
      slot.notes = editingData.value.notes
      slot.details.notes = editingData.value.notes
    }

    // 通知更新 - 创建新的对象引用，确保响应式更新
    const wasAdding = isAddingNew.value
    if (travel.value && onUpdate) {
      // 创建新的 days 数组，确保响应式更新
      const updatedDays = itineraryData.value.days.map((day: any, idx: number) => {
        if (idx === dayIndex) {
          // 更新当前天的数据
          return {
            ...day,
            timeSlots: day.timeSlots || [],
            activities: day.timeSlots || [] // 保持 activities 和 timeSlots 一致
          }
        }
        return day
      })
      
      const updatedItineraryData = {
        ...itineraryData.value,
        days: updatedDays
      }
      
      onUpdate({
        ...travel.value,
        data: {
          ...travel.value.data,
          itineraryData: updatedItineraryData
        }
      })
      
      console.log('[useSlotEditing] 数据已更新，通知父组件:', {
        dayIndex,
        day: dayData.day,
        timeSlotsCount: dayData.timeSlots?.length || 0,
        wasAdding
      })
    }

    if (wasAdding) {
      message.success(t('travelDetail.experienceDay.addSuccess') || '活动已添加')
      isAddingNew.value = false
      newSlotInsertInfo.value = null
    } else {
      message.success('活动已更新')
    }

    cancel()
  }

  /**
   * 取消编辑
   */
  const cancel = () => {
    editModalVisible.value = false
    editingSlot.value = null
    isAddingNew.value = false
    newSlotInsertInfo.value = null
    editingData.value = {
      time: '',
      title: '',
      activity: '',
      type: 'attraction',
      category: 'attraction',
      duration: null,
      cost: null,
      location: '',
      coordinates: null,
      nameChinese: '',
      nameEnglish: '',
      rating: null,
      transportation: '',
      openingHours: '',
      pricingDetail: '',
      bookingInfo: '',
      visitTips: '',
      outfitSuggestions: '',
      culturalTips: '',
      accessibility: '',
      scenicIntro: '',
      highlights: '',
      notes: '',
      bookingLinks: [],
      transportModes: [],
    }
  }

  /**
   * 添加预订链接
   */
  const addBookingLink = () => {
    editingData.value.bookingLinks.push({ name: '', url: '' })
  }

  /**
   * 删除预订链接
   */
  const removeBookingLink = (index: number) => {
    editingData.value.bookingLinks.splice(index, 1)
  }

  return {
    // 状态
    editModalVisible,
    editingSlot,
    editingData,
    isAddingNew,
    editFormActiveKeys,
    // 方法
    openEdit,
    openAdd,
    save,
    cancel,
    addBookingLink,
    removeBookingLink,
  }
}

