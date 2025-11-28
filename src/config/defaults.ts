/**
 * 默认值配置
 * 统一管理所有默认值，支持从用户配置读取
 */

import { getUserProfileOrDefault } from '@/config/userProfile'
import { DEFAULT_VALUES } from '@/utils/travelConstants'

/**
 * 行程相关默认值
 */
export const TRIP_DEFAULTS = {
  /**
   * 默认行程天数
   */
  get DEFAULT_DURATION(): number {
    // 可以从用户配置读取，这里暂时使用固定值
    return 5
  },
  
  /**
   * 默认参与人数
   */
  get DEFAULT_PARTICIPANTS(): number {
    return 1
  },
  
  /**
   * 默认预算
   */
  get DEFAULT_BUDGET(): number {
    return 0
  },
} as const

/**
 * 活动相关默认值
 */
export const ACTIVITY_DEFAULTS = {
  /**
   * 默认活动时长（分钟）
   */
  get DEFAULT_DURATION(): number {
    return 60
  },
  
  /**
   * 默认缓冲时间（分钟）
   */
  get DEFAULT_BUFFER_TIME(): number {
    return DEFAULT_VALUES.DURATION_BUFFER
  },
} as const

/**
 * 用户相关默认值
 */
export const USER_DEFAULTS = {
  /**
   * 默认语言
   */
  get DEFAULT_LANGUAGE(): string {
    const profile = getUserProfileOrDefault()
    return profile.interfaceLanguage || 'zh-CN'
  },
  
  /**
   * 默认货币代码
   */
  get DEFAULT_CURRENCY(): string {
    const profile = getUserProfileOrDefault()
    return profile.preferredCurrency || DEFAULT_VALUES.DEFAULT_CURRENCY_CODE
  },
  
  /**
   * 默认交通方式
   */
  get DEFAULT_TRANSPORT_MODE(): string {
    const profile = getUserProfileOrDefault()
    return profile.preferredTransportMode || 'public_transit_and_walking'
  },
} as const

/**
 * UI相关默认值
 */
export const UI_DEFAULTS = {
  /**
   * 地图回退延迟（毫秒）
   */
  get MAP_FALLBACK_DELAY(): number {
    return DEFAULT_VALUES.MAP_FALLBACK_DELAY
  },
  
  /**
   * 防抖延迟（毫秒）
   */
  DEFAULT_DEBOUNCE_DELAY: 300,
  
  /**
   * 输入框最大长度
   */
  MAX_INPUT_LENGTH: 500,
  
  /**
   * 列表分页大小
   */
  PAGE_SIZE: 20,
} as const

/**
 * 导出所有默认值配置（便于统一访问）
 */
export const DEFAULT_CONFIG = {
  TRIP: TRIP_DEFAULTS,
  ACTIVITY: ACTIVITY_DEFAULTS,
  USER: USER_DEFAULTS,
  UI: UI_DEFAULTS,
} as const

