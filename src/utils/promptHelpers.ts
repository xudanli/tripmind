/**
 * 提示词辅助函数（替代已删除的 inspiration/common）
 */

/**
 * 构建语言要求块
 */
export function buildLanguageRequirementBlock(
  locale: string,
  fields: string[]
): string {
  const isEnglish = locale.startsWith('en')
  if (isEnglish) {
    return `Language Requirements:
- All text fields (${fields.join(', ')}) must be in English.
- Use clear, natural English expressions.
- Maintain consistency in terminology.`
  }
  return `语言要求：
- 所有文本字段（${fields.join('、')}）必须使用中文。
- 使用清晰、自然的中文表达。
- 保持术语的一致性。`
}

/**
 * 构建交通偏好块
 */
export function buildTransportPreferenceBlock(
  locale: string,
  preference: string
): string {
  const isEnglish = locale.startsWith('en')
  const preferenceMap: Record<string, { en: string; zh: string }> = {
    public_transit_and_walking: {
      en: 'Public transit and walking',
      zh: '公共交通和步行'
    },
    driving: {
      en: 'Driving',
      zh: '自驾'
    },
    mixed: {
      en: 'Mixed (public transit, driving, and walking)',
      zh: '混合（公共交通、自驾和步行）'
    }
  }
  const pref = preferenceMap[preference] || preferenceMap.public_transit_and_walking
  const text = isEnglish ? pref.en : pref.zh

  if (isEnglish) {
    return `Transportation Preference: ${text}`
  }
  return `交通偏好：${text}`
}

