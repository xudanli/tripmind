/**
 * 推荐数据常量
 * 由于数据量大，建议先暂时保留原有逻辑
 * TODO: 完整迁移数据
 */

import type { ThemeCategory } from '@/types/location'

// 推荐数据结构
export type Recommendations = Record<string, Record<ThemeCategory, string[]>>

// 由于数据量较大（超过1000条记录），建议保持原有实现
// 在实际项目中可以考虑：
// 1. 使用数据库存储
// 2. 使用API动态获取
// 3. 按需懒加载

export const RECOMMENDATIONS: Recommendations = {
  // 数据将在下一步中从 location.ts 迁移过来
} as Recommendations
