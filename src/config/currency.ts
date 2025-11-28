/**
 * 货币配置
 * 统一管理默认货币，避免硬编码
 */

import { DEFAULT_VALUES } from '@/utils/travelConstants'
import { getCurrencyByCode } from '@/utils/currency'
import { getUserProfileOrDefault } from '@/config/userProfile'
import type { CurrencyInfo } from '@/utils/currency'

/**
 * 获取默认货币信息
 * 优先级：
 * 1. 用户配置的偏好货币
 * 2. 系统默认货币（从 travelConstants 读取）
 * 3. 硬编码的后备值（仅作为最后的后备方案）
 */
export function getDefaultCurrency(): CurrencyInfo {
  // 1. 尝试从用户配置获取
  try {
    const userProfile = getUserProfileOrDefault()
    if (userProfile.preferredCurrency) {
      const currency = getCurrencyByCode(userProfile.preferredCurrency)
      if (currency) {
        return currency
      }
    }
  } catch (error) {
    console.warn('[CurrencyConfig] 读取用户配置失败:', error)
  }
  
  // 2. 尝试从系统配置获取
  try {
    const systemDefault = DEFAULT_VALUES.DEFAULT_CURRENCY_CODE
    if (systemDefault) {
      const currency = getCurrencyByCode(systemDefault)
      if (currency) {
        return currency
      }
    }
  } catch (error) {
    console.warn('[CurrencyConfig] 读取系统配置失败:', error)
  }
  
  // 3. 最后使用硬编码的默认值（仅作为后备）
  // 注意：这是唯一允许的硬编码位置，其他地方都应该使用此函数
  return { code: 'CNY', symbol: '¥', name: '人民币' }
}

/**
 * 获取默认货币代码
 */
export function getDefaultCurrencyCode(): string {
  return getDefaultCurrency().code
}

