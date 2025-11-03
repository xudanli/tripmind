/**
 * 语言工具与国际化模板模块
 */

// ==================== 类型定义 ====================

export type Language = 'en' | 'zh'
export type LangCode = string

export interface I18nTemplate {
  onlyJson: string
  destinationConstraint: {
    critical: (dest: string) => string
    important: (dest: string) => string
  }
  locationGuidance: (country: string) => string
  referenceCatalog: {
    priority: (country: string, names: string) => string
    other: (country: string, names: string) => string
    header: (country: string) => string
    fallback: string
  }
}

// ==================== 语言模板数据 ====================

const I18N_TEMPLATES = new Map<Language, I18nTemplate>([
  ['en', {
    onlyJson: 'You are an Inspirit Designer. You must return valid JSON arrays only, with no additional text.',
    destinationConstraint: {
      critical: (dest: string) => `\n📍 **CRITICAL DESTINATION CONSTRAINT**: The user has explicitly selected "${dest}" as the travel destination. You MUST:\n1. Set the "destination" field to exactly "${dest}"\n2. Generate all activities within or near "${dest}"\n3. Do NOT replace or change this destination to any other location\n4. All location names in timeSlots should be related to "${dest}" or nearby areas`,
      important: (dest: string) => `\n📍 CRITICAL: The user has selected "${dest}" as the destination. You MUST generate an itinerary specifically for this location. Do NOT change or replace it with another destination. All activities must be within or near "${dest}".`
    },
    locationGuidance: (country: string) => `\n📍 IMPORTANT LOCATION CONSTRAINT: User is located in ${country}. You MUST prioritize destinations within ${country} or nearby regions. Only recommend international destinations if they are very close (e.g., bordering countries) or if user explicitly requests them. Avoid recommending distant international destinations unless absolutely necessary for the psychological journey theme.`,
    referenceCatalog: {
      priority: (country: string, names: string) => `- ${country} (PRIORITY - user's country): ${names}`,
      other: (country: string, names: string) => `- ${country}: ${names}`,
      header: (country: string) => `Reference destinations (PRIORITIZE destinations in ${country}, then nearby regions):`,
      fallback: 'Reference destinations (pick from these when suitable; do not invent nonexistent places):'
    }
  }],
  ['zh', {
    onlyJson: '你是一位灵感人格旅行设计者。你必须只返回有效的JSON数组，不要任何额外文字。',
    destinationConstraint: {
      critical: (dest: string) => `\n📍 **重要目的地约束**：用户已明确选择"${dest}"作为旅行目的地。你必须：\n1. 将"destination"字段设置为精确的"${dest}"\n2. 所有活动必须在该地点及其附近\n3. 不得替换或更改目的地为其他地点\n4. timeSlots中的所有地点名称应与"${dest}"或其附近相关`,
      important: (dest: string) => `\n📍 重要约束：用户已选择"${dest}"作为目的地。你必须为该地点生成行程，不得更改或替换为其他目的地。所有活动必须在"${dest}"及其附近。`
    },
    locationGuidance: (country: string) => `\n📍 重要地理位置约束：用户位于${country}。你必须优先推荐${country}国内的目的地或周边地区。只有在必要时才推荐较远的国际目的地（例如，明确请求或心理旅程主题必需）。`,
    referenceCatalog: {
      priority: (country: string, names: string) => `- ${country}（优先 - 用户所在国家）：${names}`,
      other: (country: string, names: string) => `- ${country}：${names}`,
      header: (country: string) => `参考目的地（优先推荐${country}国内地点，其次周边地区）：`,
      fallback: '参考目的地（尽量优先从下列中选择，避免凭空捏造地点）：'
    }
  }]
])

// ==================== 语言工具类 ====================

export class LanguageUtils {
  /**
   * 根据语言代码选择对应的 i18n 模板
   */
  static pickLang(language: LangCode): I18nTemplate {
    return LanguageUtils.isEnglish(language) ? I18N_TEMPLATES.get('en')! : I18N_TEMPLATES.get('zh')!
  }

  /**
   * 判断是否为英语
   */
  static isEnglish(language: LangCode): boolean {
    return language.startsWith('en')
  }

  /**
   * 构建目的地约束字符串
   */
  static buildDestinationConstraint(
    selected?: string,
    lang: LangCode = 'zh-CN',
    type: 'critical' | 'important' = 'critical'
  ): string {
    if (!selected) return ''
    const template = LanguageUtils.pickLang(lang)
    return type === 'critical' 
      ? template.destinationConstraint.critical(selected)
      : template.destinationConstraint.important(selected)
  }
}

// ==================== 导出函数 ====================

/**
 * 选择语言模板（向后兼容）
 */
export function pickLang(language: LangCode): I18nTemplate {
  return LanguageUtils.pickLang(language)
}

/**
 * 判断是否为英语（向后兼容）
 */
export function isLangEnglish(language: LangCode): boolean {
  return LanguageUtils.isEnglish(language)
}

/**
 * 构建目的地约束（向后兼容）
 */
export function buildDestinationConstraint(
  selected?: string,
  lang: LangCode = 'zh-CN',
  type: 'critical' | 'important' = 'critical'
): string {
  return LanguageUtils.buildDestinationConstraint(selected, lang, type)
}

