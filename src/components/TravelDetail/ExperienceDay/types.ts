/**
 * TimeSlotCard 组件相关的类型定义
 * 用于替换 Record<string, any>，提供完整的类型安全
 */

import type { CurrencyInfo } from '@/utils/currency'

/**
 * 时间段详情信息（嵌套结构）
 */
export interface TimeSlotDetails {
  name?: {
    chinese?: string
    english?: string
  }
  rating?: number | {
    score?: number
    value?: number
  }
  address?: {
    chinese?: string
    english?: string
  }
  coordinates?: {
    lat: number
    lng: number
  }
  transportation?: string
  openingHours?: string
  pricing?: {
    detail?: string
    general?: number
    currency?: string
    currencyCode?: string
  }
  recommendations?: {
    bookingInfo?: string
    visitTips?: string
    bestTimeToVisit?: string
    visitDuration?: number | string
    outfitSuggestions?: string
    culturalTips?: string
  }
  accessibility?: string
  description?: {
    scenicIntro?: string
    highlights?: string[]
  }
  highlights?: string[]
  insiderTip?: string
  bookingSignal?: string
  notes?: string
  image?: string | null
  images?: string[]
  [key: string]: any
}

/**
 * 时间段（活动）数据接口
 */
export interface TimeSlot {
  id?: string
  time: string // HH:mm
  title?: string
  activity?: string
  type?: 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean' | 'restaurant' | 'accommodation' | string
  category?: string
  duration?: number | string
  cost?: number
  estimatedCost?: number
  costCurrency?: string
  currency?: string
  location?: string | {
    lat: number
    lng: number
  }
  coordinates?: {
    lat: number
    lng: number
  }
  notes?: string
  details?: TimeSlotDetails
  bookingLinks?: Array<{
    name?: string
    url: string
  }>
  transportModes?: string[]
  nearbyAttractions?: string | string[] | Array<{
    name: string
    distance?: string
    image?: string
  }>
  [key: string]: any
}

/**
 * 天数数据接口
 */
export interface ItineraryDay {
  id?: string
  day: number
  date?: string
  timeSlots?: TimeSlot[]
  activities?: TimeSlot[]
  summary?: string
  [key: string]: any
}

/**
 * TimeSlotCard 组件的 Props
 */
export interface TimeSlotCardProps {
  day: ItineraryDay
  slot: TimeSlot
  cover?: string | null
  currency: CurrencyInfo | null
  platform: string | null
  expanded: boolean
  loading?: boolean
  isInspirationMode?: boolean
  isPlannerMode?: boolean
}

/**
 * 类型映射配置
 */
export interface TypeMapping {
  icon: string
  zh: string
  en: string
}

