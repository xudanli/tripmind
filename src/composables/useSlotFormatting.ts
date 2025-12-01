/**
 * 时间段格式化相关的 Composable
 * 提取所有格式化函数，提高代码可维护性
 */

import { computed, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CurrencyInfo } from '@/utils/currency'
import { formatCurrency, getCurrencyByCode, getCurrencyForDestination } from '@/utils/currency'
import { getDefaultCurrency } from '@/config/currency'
import type { TimeSlot, TimeSlotDetails, TypeMapping } from '@/components/TravelDetail/ExperienceDay/types'
import { getRatingPlatformForDestination } from '@/utils/ratingPlatform'

/**
 * 类型映射配置
 */
const TYPE_MAPPINGS: Record<string, TypeMapping> = {
  attraction: { icon: '📍', zh: '景点体验', en: 'Attraction' },
  sightseeing: { icon: '📍', zh: '景点观光', en: 'Sightseeing' },
  restaurant: { icon: '🍽️', zh: '美食餐饮', en: 'Dining' },
  meal: { icon: '🍽️', zh: '美食餐饮', en: 'Dining' },
  hotel: { icon: '🏨', zh: '住宿', en: 'Accommodation' },
  accommodation: { icon: '🏨', zh: '住宿', en: 'Accommodation' },
  shopping: { icon: '🛍️', zh: '购物', en: 'Shopping' },
  transport: { icon: '✈️', zh: '交通', en: 'Transport' },
  transportation: { icon: '✈️', zh: '交通', en: 'Transport' },
  ocean: { icon: '🌊', zh: '海洋活动', en: 'Ocean Activity' },
}

/**
 * 类型图标映射
 */
const TYPE_ICON_MAP: Record<string, string> = {
  transport: '✈',
  transportation: '✈',
  attraction: '📍',
  meal: '🍽️',
  restaurant: '🍽️',
  hotel: '🏨',
  accommodation: '🏨',
  shopping: '🛍️',
  ocean: '🌊',
}

/**
 * 格式化时间段相关的工具函数
 * 支持两种调用方式：
 * 1. useSlotFormatting(slot, currency) - 单个 slot 格式化
 * 2. useSlotFormatting({ itineraryData, travel }) - 批量格式化，返回函数
 */
export function useSlotFormatting(
  slotOrOptions: TimeSlot | { itineraryData: Ref<any>; travel: Ref<any> },
  currency?: CurrencyInfo | null
) {
  const { t, locale } = useI18n()
  
  // 判断调用方式
  const isBatchMode = slotOrOptions && typeof slotOrOptions === 'object' && 'itineraryData' in slotOrOptions
  const slot = isBatchMode ? null : (slotOrOptions as TimeSlot)
  const options = isBatchMode ? (slotOrOptions as { itineraryData: Ref<any>; travel: Ref<any> }) : null

  /**
   * 格式化类型
   */
  const formatType = (type: string | undefined): string => {
    if (!type) return '--'
    const typeKey = type.toLowerCase()
    const typeMeta = TYPE_MAPPINGS[typeKey]
    if (typeMeta) {
      return locale.value === 'zh-CN' ? typeMeta.zh : typeMeta.en
    }
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
  }

  /**
   * 获取类型图标
   */
  const getTypeIcon = (type: string): string => {
    return TYPE_ICON_MAP[type.toLowerCase()] || '📍'
  }

  /**
   * 格式化类别
   */
  const formatCategory = (category: string | undefined): string => {
    if (!category) return ''
    return formatType(category)
  }

  /**
   * 格式化时长
   */
  const formatDuration = (duration: number | string | undefined): string => {
    if (!duration) return '--'
    
    if (typeof duration === 'string') {
      // 如果已经是格式化字符串，直接返回
      if (duration.includes('小时') || duration.includes('分钟')) {
        return duration
      }
      // 尝试解析为数字（分钟）
      const minutes = parseInt(duration) || 0
      if (minutes > 0) {
        return formatDuration(minutes)
      }
      return duration
    }
    
    if (typeof duration === 'number') {
      const hours = Math.floor(duration / 60)
      const minutes = duration % 60
      if (hours > 0 && minutes > 0) {
        return `${hours}小时${minutes}分钟`
      } else if (hours > 0) {
        return `${hours}小时`
      } else {
        return `${minutes}分钟`
      }
    }
    
    return '--'
  }

  /**
   * 格式化位置
   */
  const formatLocation = (location: any): string => {
    if (!location) return '--'
    if (typeof location === 'string') return location
    if (location && typeof location === 'object') {
      if (location.lat !== undefined && location.lng !== undefined) {
        return locale.value === 'zh-CN'
          ? `纬度: ${location.lat.toFixed(6)}, 经度: ${location.lng.toFixed(6)}`
          : `Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}`
      }
      if (location.name) return location.name
      if (location.address) return location.address
    }
    return '--'
  }

  /**
   * 获取活动货币信息（批量模式）
   */
  const getSlotCurrency = (slotParam?: TimeSlot): CurrencyInfo => {
    const targetSlot = slotParam || slot
    if (!targetSlot) return getDefaultCurrency()
    
    // 1. 优先使用明确的货币代码
    const explicitCode =
      targetSlot?.costCurrency ||
      targetSlot?.currency ||
      targetSlot?.details?.currency ||
      targetSlot?.details?.currencyCode ||
      targetSlot?.details?.pricing?.currency ||
      targetSlot?.details?.pricing?.currencyCode

    if (explicitCode) {
      const currency = getCurrencyByCode(String(explicitCode))
      if (currency) return currency
    }

    // 2. 从活动位置推断货币
    const slotLocation =
      targetSlot?.details?.address?.chinese ||
      targetSlot?.details?.address?.english ||
      (typeof targetSlot?.location === 'string' ? targetSlot.location : '') ||
      ''

    if (slotLocation) {
      const currency = getCurrencyForDestination(slotLocation)
      if (currency.code !== 'CNY') {
        return currency
      }
    }

    // 3. 从行程数据获取货币
    if (options?.itineraryData?.value?.currencyInfo) {
      return options.itineraryData.value.currencyInfo
    }
    if (options?.travel?.value?.data?.itineraryData?.currencyInfo) {
      return options.travel.value.data.itineraryData.currencyInfo
    }

    // 4. 使用传入的货币（通常是行程整体货币）
    if (currency) {
      return currency
    }

    // 5. 默认返回系统配置的默认货币
    return getDefaultCurrency()
  }

  /**
   * 获取评分平台（批量模式）
   * 始终返回字符串，不会返回 null
   */
  const getRatingPlatform = (slotParam?: TimeSlot): string => {
    // 批量模式下必须传入 slot 参数
    if (isBatchMode) {
      if (!slotParam) {
        // 如果没有 slot，尝试从目的地推断默认平台
        const destination = 
          options?.travel?.value?.destination || 
          options?.travel?.value?.location ||
          options?.itineraryData?.value?.destination ||
          ''
        if (destination) {
          const platformInfo = getRatingPlatformForDestination(destination)
          return locale.value === 'zh-CN' ? platformInfo.name : platformInfo.nameEn
        }
        // 默认返回 TripAdvisor
        return 'TripAdvisor'
      }
    } else {
      // 单个模式下使用内部的 slot
      if (!slot) {
        // 尝试从目的地推断
        const destination = 
          options?.travel?.value?.destination || 
          options?.travel?.value?.location ||
          options?.itineraryData?.value?.destination ||
          ''
        if (destination) {
          const platformInfo = getRatingPlatformForDestination(destination)
          return locale.value === 'zh-CN' ? platformInfo.name : platformInfo.nameEn
        }
        return 'TripAdvisor'
      }
    }
    const targetSlot = slotParam || slot
    if (!targetSlot) {
      // 如果没有 slot，从目的地推断
      const destination = 
        options?.travel?.value?.destination || 
        options?.travel?.value?.location ||
        options?.itineraryData?.value?.destination ||
        ''
      if (destination) {
        const platformInfo = getRatingPlatformForDestination(destination)
        return locale.value === 'zh-CN' ? platformInfo.name : platformInfo.nameEn
      }
      return 'TripAdvisor'
    }
    
    // 从 slot 的 rating 信息中获取平台
    const rating = targetSlot?.details?.rating
    if (rating && typeof rating === 'object' && 'platform' in rating && rating.platform) {
      return String(rating.platform)
    }
    
    // 从目的地推断平台
    const destination = 
      options?.travel?.value?.destination || 
      options?.travel?.value?.location ||
      options?.itineraryData?.value?.destination ||
      ''
    
    if (destination) {
      const platformInfo = getRatingPlatformForDestination(destination)
      return locale.value === 'zh-CN' ? platformInfo.name : platformInfo.nameEn
    }
    
    // 默认返回 TripAdvisor（全球通用）
    return 'TripAdvisor'
  }

  /**
   * 获取地址文本
   */
  const getAddressText = (): string => {
    if (slot?.details?.address) {
      return locale.value === 'zh-CN'
        ? slot.details.address.chinese || slot.details.address.english || ''
        : slot.details.address.english || slot.details.address.chinese || ''
    }
    if (slot?.location && typeof slot.location === 'string') {
      return slot.location
    }
    return ''
  }

  /**
   * 检查是否有费用信息
   */
  const hasCost = computed(() => {
    return !!(
      (slot?.cost && slot.cost > 0) ||
      (slot?.estimatedCost && slot.estimatedCost > 0) ||
      slot?.details?.pricing?.detail ||
      (slot?.details?.pricing?.general && slot.details.pricing.general > 0)
    )
  })

  /**
   * 获取费用数值
   */
  const getCostValue = (): number | null => {
    if (slot?.cost && slot.cost > 0) {
      return slot.cost
    }
    if (slot?.estimatedCost && slot.estimatedCost > 0) {
      return slot.estimatedCost
    }
    if (slot?.details?.pricing?.general && slot.details.pricing.general > 0) {
      return slot.details.pricing.general
    }
    return null
  }

  /**
   * 获取费用文本
   */
  const getCostText = (): string => {
    // 1. 如果有详细的费用描述文本，优先显示
    if (slot?.details?.pricing?.detail && typeof slot.details.pricing.detail === 'string') {
      return slot.details.pricing.detail
    }

    // 2. 如果有费用数值，格式化显示
    const costValue = getCostValue()
    if (costValue !== null) {
      const currency = getSlotCurrency()
      return formatCurrency(costValue, currency)
    }

    return '--'
  }

  /**
   * 格式化游览时长
   */
  const formatVisitDuration = (duration: number | string | undefined): string => {
    if (!duration) return '--'
    if (typeof duration === 'string') {
      const num = parseInt(duration) || 0
      if (num > 0) {
        return formatDuration(num)
      }
      return duration
    }
    if (typeof duration === 'number') {
      return formatDuration(duration)
    }
    return '--'
  }

  // 批量模式返回函数，单个模式返回值
  if (isBatchMode) {
    return {
      getSlotCurrency: (slot?: TimeSlot) => getSlotCurrency(slot),
      getRatingPlatform: (slot?: TimeSlot) => getRatingPlatform(slot),
    }
  }

  return {
    formatType,
    getTypeIcon,
    formatCategory,
    formatDuration,
    formatLocation,
    getSlotCurrency: () => getSlotCurrency(),
    getAddressText,
    hasCost,
    getCostValue,
    getCostText,
    formatVisitDuration,
  }
}

