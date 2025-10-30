/**
 * 位置相关类型定义
 */

export interface CountryInfo {
  name: string
  code: string
  flag: string
  currency?: string
  language?: string
}

export interface LocationConfig {
  country: string
  countryCode: string
  region?: string
  city?: string
  timezone?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
}

export type ThemeCategory =
  // 通用主题
  | '星空观测' | '温泉' | '摄影' | '艺术' | '自然'
  // 中国主题
  | '历史文化' | '美食' | '徒步' | '城市探索' | '冒险运动'
  // 日本主题
  | '传统文化' | '美食之旅'
  // 韩国主题
  | '韩流文化'
  // 新加坡主题
  | '家庭亲子' | '购物美食'
  // 泰国主题
  | '海滩度假' | '文化探索'
  // 马来西亚主题
  | '城市风情' | '自然探险'
  // 印尼主题
  | '海岛度假' | '火山探险'
  // 澳大利亚主题
  | '自然奇观' | '城市生活'
  // 英国主题
  | '自然风光' | '艺术文学'
  // 法国主题
  | '浪漫之旅' | '艺术文化' | '美食美酒'
  // 意大利主题
  | '文艺复兴'
  // 德国主题
  | '城堡之路' | '工业文化'
  // 西班牙主题
  | '历史建筑' | '美食文化'

// 主题关键词类型
export type ThemeKeyword = string
export type ThemeCategoryMap = Record<ThemeKeyword, ThemeCategory>

// 国家特定主题映射
export type CountrySpecificThemes = Record<string, Record<string, ThemeCategory>>
