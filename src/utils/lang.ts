/**
 * 语言工具函数（纯函数）
 */

export type Language = string

/**
 * 判断是否为英语
 */
export function isEnglish(language: Language): boolean {
  return language.startsWith('en')
}

/**
 * 提取语言代码（zh 或 en）
 */
export function pickLang(language: Language): 'zh' | 'en' {
  return isEnglish(language) ? 'en' : 'zh'
}

/**
 * 根据月份获取季节
 */
export function pickSeason(month: number, language: Language): string {
  const isEn = isEnglish(language)
  
  if (month >= 3 && month <= 5) return isEn ? 'Spring' : '春季'
  if (month >= 6 && month <= 8) return isEn ? 'Summer' : '夏季'
  if (month >= 9 && month <= 11) return isEn ? 'Autumn' : '秋季'
  return isEn ? 'Winter' : '冬季'
}

