/**
 * 推荐结果处理模块
 * 负责推荐结果的标准化和兜底逻辑
 */

// ==================== 类型定义 ====================

export interface Recommendation {
  name: string
  country: string
  reason: string
  reasoning?: string
  description?: string
}

// ==================== 推荐结果处理类 ====================

/**
 * 推荐结果处理类
 */
export class RecommendationProcessor {
  /**
   * 标准化推荐结果
   * 使用显式返回类型和简化逻辑
   */
  static normalize(input: unknown): Recommendation[] {
    const items = Array.isArray(input)
      ? input
      : (input && typeof input === 'object' && 'recommendations' in input && Array.isArray((input as any).recommendations))
        ? (input as any).recommendations
        : []
    
    return items
      .filter(Boolean)
      .map(({ name, destination, country, reason, description, reasoning }: any) => ({
        name: name || destination || '',
        country: country || '',
        reason: reason || description || '',
        reasoning: reasoning || '',
        description: description || reason || ''
      }))
      .filter(r => r.name && r.country)
  }

  /**
   * 兜底推荐（当 AI 失败时使用）
   */
  static getFallback(lang: string = 'zh-CN'): Recommendation[] {
    const isEnglish = lang.startsWith('en')
    return [{
      name: isEnglish ? 'Mount Kailash Sacred Circuit' : '冈仁波齐·神山环线',
      country: isEnglish ? 'China' : '中国',
      reason: isEnglish 
        ? 'Suitable for travelers seeking spiritual experiences and inner transformation'
        : '适合追求精神体验和内心转化的旅行者',
      reasoning: isEnglish
        ? 'Based on your psychological profile, this destination supports deep introspection and transformation'
        : '根据你的心理画像，这是一个支持深度内省和转化的目的地'
    }]
  }
}

// ==================== 导出函数 ====================

/**
 * 标准化推荐结果（向后兼容）
 */
export function normalizeRecommendations(input: unknown): Recommendation[] {
  return RecommendationProcessor.normalize(input)
}

/**
 * 获取兜底推荐（向后兼容）
 */
export function fallbackRecommendations(lang: string = 'zh-CN'): Recommendation[] {
  return RecommendationProcessor.getFallback(lang)
}

