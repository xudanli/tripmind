/**
 * 用户位置配置
 */

// 从新模块导入类型和配置
import type { LocationConfig, CountryInfo } from '@/types/location'
export type { LocationConfig, ThemeCategory, CountryInfo } from '@/types/location'
export { PRESET_COUNTRIES } from '@/constants/countries'
export { getDomesticRecommendations, getDomesticRecommendationsSafe } from './recommendations'

// 从 localStorage 读取用户位置配置
export function getUserLocation(): LocationConfig | null {
  const stored = localStorage.getItem('user_location')
  if (!stored) return null
  
  try {
    return JSON.parse(stored) as LocationConfig
  } catch {
    return null
  }
}

// 保存用户位置配置
export function setUserLocation(config: LocationConfig): void {
  localStorage.setItem('user_location', JSON.stringify(config))
}

// 清除用户位置配置
export function clearUserLocation(): void {
  localStorage.removeItem('user_location')
}

// 验证位置配置
export function validateLocationConfig(config: any): config is LocationConfig {
  return (
    config &&
    typeof config.country === 'string' &&
    typeof config.countryCode === 'string' &&
    config.countryCode.length === 2
  )
}

// 获取默认位置配置
export function getDefaultLocation(): LocationConfig {
  return {
    country: '中国',
    countryCode: 'CN',
    region: '华东',
    city: '上海',
    timezone: 'Asia/Shanghai'
  }
}

// 位置配置变更监听
export function onLocationChange(callback: (config: LocationConfig | null) => void): () => void {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'user_location') {
      const newLocation = event.newValue ? JSON.parse(event.newValue) : null
      callback(newLocation)
    }
  }
  
  window.addEventListener('storage', handleStorageChange)
  return () => window.removeEventListener('storage', handleStorageChange)
}

