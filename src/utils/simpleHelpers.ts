/**
 * 简单的辅助函数（替代已删除的 inspirationCore）
 */

/**
 * 选择语言
 */
export function pickLang(language: string): { onlyJson: string } {
  const isEnglish = language.startsWith('en')
  return {
    onlyJson: isEnglish
      ? 'Return only valid JSON, no additional text.'
      : '只返回有效的 JSON，不要添加其他文本。'
  }
}

/**
 * 构建目的地约束
 */
export function buildDestinationConstraint(
  destination: string | undefined,
  language: string,
  importance: 'important' | 'optional' = 'important'
): string {
  if (!destination) return ''
  
  const isEnglish = language.startsWith('en')
  const prefix = importance === 'important' 
    ? (isEnglish ? 'IMPORTANT: ' : '重要：')
    : (isEnglish ? 'Optional: ' : '可选：')
  
  return isEnglish
    ? `\n${prefix}Destination must be: ${destination}`
    : `\n${prefix}目的地必须是：${destination}`
}

/**
 * 解析 JSON（安全）
 */
export function parseJSONSafe(json: string): any {
  try {
    return JSON.parse(json)
  } catch (error) {
    console.warn('[parseJSONSafe] 解析失败:', error)
    return null
  }
}

/**
 * 规范化推荐
 */
export function normalizeRecommendations(recommendations: any[]): any[] {
  return recommendations.map(rec => ({
    name: rec.name || '',
    country: rec.country || '',
    reason: rec.reason || '',
    reasoning: rec.reasoning || ''
  }))
}

/**
 * 默认推荐（回退）
 */
export function fallbackRecommendations(language: string): any[] {
  const isEnglish = language.startsWith('en')
  return [
    {
      name: isEnglish ? 'Iceland' : '冰岛',
      country: isEnglish ? 'Iceland' : '冰岛',
      reason: isEnglish ? 'Natural wonders and unique landscapes' : '自然奇观和独特景观',
      reasoning: isEnglish ? 'Perfect for nature lovers' : '适合自然爱好者'
    },
    {
      name: isEnglish ? 'Japan' : '日本',
      country: isEnglish ? 'Japan' : '日本',
      reason: isEnglish ? 'Rich culture and modern cities' : '丰富的文化和现代城市',
      reasoning: isEnglish ? 'Great for cultural exploration' : '适合文化探索'
    }
  ]
}

