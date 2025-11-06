/**
 * 公共提示词片段构建函数
 * 用于统一语言要求、JSON 结构要求、签证信息等重复片段
 */

export type LanguageCode = 'zh-CN' | 'en' | string

const isEN = (lang: LanguageCode) => String(lang).startsWith('en')

/**
 * 构建语言要求片段
 */
export function buildLanguageRequirementBlock(
  language: LanguageCode,
  fields?: string[]
): string {
  const isEnglish = isEN(language)
  
  if (isEnglish) {
    const fieldsText = fields 
      ? fields.join(', ')
      : 'ALL content fields'
    
    return `**⚠️ CRITICAL LANGUAGE REQUIREMENT: ${fieldsText} MUST be written in ENGLISH. Only the "local" fields in name and address should use the local language of the destination.**`
  } else {
    const fieldsText = fields 
      ? fields.join('、')
      : '所有内容字段'
    
    return `**⚠️ 关键语言要求：${fieldsText}必须使用中文。只有name和address中的"local"字段应使用目的地的当地语言。**`
  }
}

/**
 * 构建简化的语言要求片段（用于特定字段）
 */
export function buildSimpleLanguageRequirement(
  language: LanguageCode,
  fieldName: string
): string {
  const isEnglish = isEN(language)
  
  return isEnglish
    ? `**⚠️ CRITICAL LANGUAGE REQUIREMENT: ${fieldName} MUST be written in ENGLISH.**`
    : `**⚠️ 关键语言要求：${fieldName}必须使用中文。**`
}

/**
 * 构建 JSON 完整性要求片段
 */
export function buildJSONCompletenessRequirement(
  language: LanguageCode,
  structure?: string
): string {
  const isEnglish = isEN(language)
  
  const baseRequirement = isEnglish
    ? `⚠️ **CRITICAL: You MUST return complete, valid JSON. Ensure the JSON structure is fully closed. If content is too long, prioritize JSON structure completeness over detailed descriptions. You can simplify some field descriptions, but MUST ensure all array elements are fully closed.**`
    : `⚠️ **关键要求：你必须返回完整、有效的 JSON。确保 JSON 结构完全闭合。如果内容过长，优先保证 JSON 结构完整性而非详细描述。可以简化某些字段描述，但必须确保所有数组元素完全闭合。**`
  
  if (structure) {
    return `${baseRequirement}\n\n${structure}`
  }
  
  return baseRequirement
}

/**
 * 构建签证信息片段
 */
export function buildVisaInfoBlock(
  language: LanguageCode,
  options: {
    heldVisas?: string[]
    visaFreeDestinations?: string[]
    visaInfoSummary?: string
  }
): string {
  const isEnglish = isEN(language)
  const { heldVisas = [], visaFreeDestinations = [], visaInfoSummary } = options
  
  const parts: string[] = []
  
  if (heldVisas.length > 0) {
    parts.push(
      isEnglish
        ? `\n🎫 Held Visas: ${heldVisas.join(', ')}`
        : `\n🎫 已持有签证：${heldVisas.join('、')}`
    )
  }
  
  if (visaFreeDestinations.length > 0) {
    parts.push(
      isEnglish
        ? `\n✅ Visa-free/VOA: ${visaFreeDestinations.join(', ')}`
        : `\n✅ 免签/落地签：${visaFreeDestinations.join('、')}`
    )
  }
  
  if (visaInfoSummary) {
    parts.push(
      isEnglish
        ? `\n📋 Visa info: ${visaInfoSummary}`
        : `\n📋 签证信息：${visaInfoSummary}`
    )
  }
  
  return parts.join('')
}

/**
 * 构建用户上下文信息片段
 */
export function buildUserContextBlock(
  language: LanguageCode,
  options: {
    userCountry?: string
    userNationality?: string
    userPermanentResidency?: string
  }
): string {
  const isEnglish = isEN(language)
  const { userCountry, userNationality, userPermanentResidency } = options
  
  const parts: string[] = []
  
  if (userCountry) {
    parts.push(
      isEnglish
        ? `\n📍 User Location: ${userCountry}`
        : `\n📍 用户地理位置：${userCountry}`
    )
  }
  
  if (userNationality) {
    parts.push(
      isEnglish
        ? `\n🌍 User Nationality: ${userNationality}`
        : `\n🌍 用户国籍：${userNationality}`
    )
  }
  
  if (userPermanentResidency) {
    parts.push(
      isEnglish
        ? `\n🪪 Permanent Residency: ${userPermanentResidency}`
        : `\n🪪 永久居民身份：${userPermanentResidency}`
    )
  }
  
  return parts.join('')
}

/**
 * 构建交通偏好说明片段
 */
export function buildTransportPreferenceBlock(
  language: LanguageCode,
  preference: 'public_transit_and_walking' | 'driving_and_walking' | string
): string {
  const isEnglish = isEN(language)
  
  if (preference === 'public_transit_and_walking') {
    return isEnglish
      ? `**Transportation Preference**: Prioritize public transportation (subway, bus, light rail) + short walking distances. Include detailed public transit information (lines, stations, bus stops). Minimize driving suggestions.`
      : `**交通方式偏好**：优先使用公共交通（地铁、公交、轻轨）+ 短距离步行。包含详细的公共交通信息（线路、站点、公交站）。尽量减少驾车建议。`
  } else if (preference === 'driving_and_walking') {
    return isEnglish
      ? `**Transportation Preference**: Prioritize driving/rental car + short walking distances. Include detailed driving directions and parking information. Public transit should be secondary or alternative options.`
      : `**交通方式偏好**：优先使用驾车/租车 + 短距离步行。包含详细的驾车路线和停车信息。公共交通应作为次要或备选方案。`
  } else {
    return isEnglish
      ? `**Transportation Preference**: Use public transportation (subway, bus) + short walking distances by default.`
      : `**交通方式偏好**：默认使用公共交通（地铁、公交）+ 短距离步行。`
  }
}

