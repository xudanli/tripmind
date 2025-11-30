/**
 * 行程数据适配器 (Anti-Corruption Layer)
 * 
 * 统一处理前端和后端数据格式的转换，建立防腐层
 * 当后端接口变更时，只需修改此文件
 */

import type { Travel } from '@/stores/travelList'

/**
 * 统一的时间段接口（前端标准格式）
 */
export interface UnifiedTimeSlot {
  time: string
  title: string
  activity: string
  type: 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'
  coordinates: { lat: number; lng: number } | null
  notes: string
  details: {
    // 位置信息
    location?: string
    address?: string
    tripAdvisorId?: string
    coordinates?: { lat: number; lng: number }
    
    // 图片
    image?: string | null
    images?: string[]
    
    // 详细信息
    highlights?: string[]
    insiderTip?: string
    bookingSignal?: string
    description?: string
    notes?: string
    
    // 推荐信息
    recommendations?: {
      bestTimeToVisit?: string
      visitDuration?: string
    }
    
    // 其他字段
    [key: string]: any
  }
  cost: number
  duration: number
  bookingLinks?: Array<{ name: string; url: string }>
}

/**
 * 统一的天数据接口
 */
export interface UnifiedDay {
  day: number
  date: string
  id?: string
  timeSlots: UnifiedTimeSlot[]
}

/**
 * 统一的前端行程数据接口
 */
export interface UnifiedItineraryData {
  title?: string
  destination: string
  days: UnifiedDay[]
  totalCost: number
  summary?: string
  duration: number
  budget: number
  preferences?: any
  currency?: string | null
  currencyInfo?: any
  practicalInfo?: any
}

/**
 * 将后端 Activity 格式转换为统一的前端 TimeSlot 格式
 */
export function normalizeBackendActivity(backendActivity: any): UnifiedTimeSlot {
  // 处理字段名差异：title 或 name
  const title = backendActivity.title || backendActivity.name || ''
  
  // 处理 location 字段：可能是 location 对象或 coordinates
  let coordinates: { lat: number; lng: number } | null = null
  if (backendActivity.location) {
    if (typeof backendActivity.location === 'object' && 'lat' in backendActivity.location) {
      coordinates = backendActivity.location
    } else if (backendActivity.coordinates) {
      coordinates = backendActivity.coordinates
    }
  }
  
  // 处理 details：自动处理 null 和字段差异
  const details: UnifiedTimeSlot['details'] = {
    ...(backendActivity.details || {}),
    // 确保关键字段存在
    highlights: backendActivity.details?.highlights || [],
    insiderTip: backendActivity.details?.insiderTip || '',
    bookingSignal: backendActivity.details?.bookingSignal || '',
    description: backendActivity.details?.description || backendActivity.details?.notes || backendActivity.notes || '',
    notes: backendActivity.details?.notes || backendActivity.notes || '',
    // 处理图片：自动处理 null 和数组
    image: backendActivity.details?.image || null,
    images: backendActivity.details?.images || (backendActivity.details?.image ? [backendActivity.details.image] : []),
    // 位置信息
    location: backendActivity.details?.location || null,
    address: backendActivity.details?.address || null,
    tripAdvisorId: backendActivity.details?.tripAdvisorId || null,
    coordinates: coordinates || null
  }
  
  // 处理 bookingLinks：统一格式
  const bookingLinks = (backendActivity.bookingLinks || []).map((link: any) => {
    if (typeof link === 'string') {
      return { name: '', url: link }
    }
    return {
      name: link?.name || link?.label || '',
      url: link?.url || link?.href || ''
    }
  }).filter((link: any) => link.url)
  
  return {
    time: backendActivity.time || '',
    title,
    activity: title,
    type: (backendActivity.type || 'attraction') as UnifiedTimeSlot['type'],
    coordinates,
    notes: backendActivity.notes || '',
    details,
    cost: typeof backendActivity.cost === 'number' 
      ? backendActivity.cost 
      : (typeof backendActivity.cost === 'string' ? parseFloat(backendActivity.cost) || 0 : 0),
    duration: typeof backendActivity.duration === 'number'
      ? backendActivity.duration
      : (typeof backendActivity.duration === 'string' ? parseInt(backendActivity.duration) || 60 : 60),
    bookingLinks
  }
}

/**
 * 将后端 Day 格式转换为统一的前端 Day 格式
 */
export function normalizeBackendDay(backendDay: any, activitiesMap?: Map<string, any>): UnifiedDay {
  // 优先使用 activitiesMap 中的数据，如果没有则使用 backendDay.activities
  let activities: any[] = []
  
  if (activitiesMap && activitiesMap.size > 0) {
    // 如果提供了 activitiesMap，使用它作为主要数据源
    activities = Array.from(activitiesMap.values())
  } else if (backendDay.activities && backendDay.activities.length > 0) {
    // 如果没有 activitiesMap，使用 backendDay.activities
    activities = backendDay.activities
  }
  
  // 转换活动数据为 timeSlots
  const timeSlots = activities.map((activity: any) => {
    // 如果 activitiesMap 中已经有详细数据，直接使用
    // 否则尝试从 backendDay.activities 中查找匹配的活动进行合并
    let mergedActivity = activity
    
    if (activitiesMap && activity.id) {
      const detailedActivity = activitiesMap.get(activity.id)
      if (detailedActivity) {
        // 合并详细数据，优先使用 activitiesMap 中的数据
        mergedActivity = {
          ...activity,
          ...detailedActivity,
          details: {
            ...activity.details,
            ...detailedActivity.details
          }
        }
      }
    }
    
    return normalizeBackendActivity(mergedActivity)
  })
  
  return {
    day: backendDay.day || 1,
    date: backendDay.date || '',
    id: backendDay.id,
    timeSlots
  }
}

/**
 * 将后端行程数据转换为统一的前端格式
 */
export function normalizeBackendItinerary(
  backendItinerary: any,
  activitiesMap?: { [dayId: string]: any[] }
): UnifiedItineraryData {
  // 构建活动映射（用于快速查找）
  const activityMap = new Map<string, any>()
  if (activitiesMap) {
    Object.values(activitiesMap).flat().forEach((activity: any) => {
      if (activity.id) {
        activityMap.set(activity.id, activity)
      }
      // 也使用时间和标题作为 key
      if (activity.time && activity.title) {
        activityMap.set(`${activity.time}-${activity.title}`, activity)
      }
    })
  }
  
  // 转换 days
  const days: UnifiedDay[] = (backendItinerary.days || []).map((day: any) => {
    // 优先使用 activitiesMap 中的数据，如果没有则使用 day.activities
    const dayActivitiesFromMap = activitiesMap?.[day.id] || []
    const dayActivitiesFromDay = day.activities || []
    
    // 合并两个数据源，优先使用 activitiesMap 中的数据
    const allDayActivities = [...dayActivitiesFromMap, ...dayActivitiesFromDay]
    
    // 去重：如果同一个活动在两个数据源中都存在，优先使用 activitiesMap 中的
    const uniqueActivities = new Map<string, any>()
    allDayActivities.forEach((activity: any) => {
      const key = activity.id || `${activity.time}-${activity.title}`
      if (!uniqueActivities.has(key)) {
        uniqueActivities.set(key, activity)
      }
    })
    
    const dayActivityMap = new Map<string, any>()
    uniqueActivities.forEach((activity: any) => {
      if (activity.id) {
        dayActivityMap.set(activity.id, activity)
      }
      if (activity.time && activity.title) {
        dayActivityMap.set(`${activity.time}-${activity.title}`, activity)
      }
    })
    
    // 如果 dayActivityMap 有数据，使用它；否则使用 day.activities
    return normalizeBackendDay(day, dayActivityMap.size > 0 ? dayActivityMap : undefined)
  })
  
  // 去重：按 day 编号去重
  const dayMap = new Map<number, UnifiedDay>()
  days.forEach(day => {
    const existing = dayMap.get(day.day)
    if (!existing || (day.timeSlots.length > existing.timeSlots.length)) {
      dayMap.set(day.day, day)
    }
  })
  
  const uniqueDays = Array.from(dayMap.values()).sort((a, b) => a.day - b.day)
  
  // 计算实际有活动的天数
  const daysWithActivities = uniqueDays.filter(d => d.timeSlots.length > 0)
  const duration = daysWithActivities.length > 0 
    ? daysWithActivities.length 
    : (backendItinerary.daysCount || uniqueDays.length)
  
  return {
    title: backendItinerary.title || `${backendItinerary.destination}之旅`,
    destination: backendItinerary.destination,
    days: uniqueDays,
    totalCost: backendItinerary.totalCost || 0,
    summary: backendItinerary.summary || '',
    duration,
    budget: backendItinerary.totalCost || 0,
    preferences: backendItinerary.preferences || {},
    currency: backendItinerary.currency ?? null,
    currencyInfo: backendItinerary.currencyInfo ?? null,
    practicalInfo: backendItinerary.practicalInfo ?? null
  }
}

/**
 * 将统一的前端格式转换为后端格式（用于更新）
 */
export function denormalizeToBackendFormat(unifiedData: UnifiedItineraryData): any {
  return {
    itineraryData: {
      destination: unifiedData.destination,
      duration: unifiedData.duration,
      title: unifiedData.title || `${unifiedData.destination}之旅`,
      days: unifiedData.days.map(day => ({
        day: day.day,
        date: day.date,
        timeSlots: day.timeSlots.map(slot => ({
          time: slot.time,
          title: slot.title,
          type: slot.type,
          coordinates: slot.coordinates || { lat: 0, lng: 0 },
          notes: slot.notes,
          details: slot.details,
          cost: slot.cost,
          duration: slot.duration,
          bookingLinks: slot.bookingLinks || []
        }))
      })),
      totalCost: unifiedData.totalCost,
      summary: unifiedData.summary,
      practicalInfo: unifiedData.practicalInfo
    }
  }
}

