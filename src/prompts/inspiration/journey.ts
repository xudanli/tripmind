/**
 * 灵感旅程生成提示词构建模块
 */

import { buildDestinationConstraint } from '@/utils/inspirationCore'

export type LanguageCode = 'zh-CN' | 'en' | string

const isEN = (lang: LanguageCode) => String(lang).startsWith('en')

export interface IntentResult {
  intentType: string
  keywords: string[]
  emotionTone: string
  description: string
}

export interface JourneyPromptArgs {
  language: LanguageCode
  intent: IntentResult
  startDate: string
  targetDays: number
  userCountry?: string
  selectedDestination?: string
  userNationality?: string
  userPermanentResidency?: string
  heldVisas?: string[]
  visaFreeDestinations?: string[]
  visaInfoSummary?: string
  referenceCatalog?: string
  locationGuidance?: string
}

/**
 * 构建旅程生成提示词
 */
export function buildJourneyPrompt(args: JourneyPromptArgs): string {
  const {
    language,
    intent,
    startDate,
    targetDays,
    userCountry,
    selectedDestination,
    userNationality,
    userPermanentResidency,
    heldVisas = [],
    visaFreeDestinations = [],
    visaInfoSummary,
    referenceCatalog = '',
    locationGuidance = ''
  } = args
  
  const destinationNote = buildDestinationConstraint(selectedDestination, language, 'critical')
  const header = isEN(language) 
    ? `🎨 AI Identity: Inspirit Designer (Inspiration Personality Travel Designer)`
    : `🎨 AI 身份：灵感人格旅行设计者（Inspirit Designer）`

  const intentBlock = isEN(language)
    ? `📋 User Intent Analysis:
- Intent Type: ${intent.intentType}
- Emotion Tone: ${intent.emotionTone}
- Keywords: ${intent.keywords.filter(k => k !== selectedDestination).join('、') || 'not specified'}`
    : `📋 用户意图分析：
- 意图类型：${intent.intentType}
- 情绪基调：${intent.emotionTone}
- 关键词：${intent.keywords.filter(k => k !== selectedDestination).join('、') || '未指定'}`

  const loc1 = userCountry 
    ? (isEN(language) ? `\n📍 User Location: ${userCountry}` : `\n📍 用户地理位置：${userCountry}`) 
    : ''
  const loc2 = userNationality 
    ? (isEN(language) ? `\n🌍 User Nationality: ${userNationality}` : `\n🌍 用户国籍：${userNationality}`) 
    : ''
  const loc3 = userPermanentResidency 
    ? (isEN(language) ? `\n🪪 Permanent Residency: ${userPermanentResidency}` : `\n🪪 永久居民身份：${userPermanentResidency}`) 
    : ''
  const visa1 = heldVisas.length 
    ? (isEN(language) ? `\n🎫 Held Visas: ${heldVisas.join(', ')}` : `\n🎫 已持有签证：${heldVisas.join('、')}`) 
    : ''
  const visa2 = visaFreeDestinations.length 
    ? (isEN(language) ? `\n✅ Visa-free/VOA: ${visaFreeDestinations.join(', ')}` : `\n✅ 免签/落地签：${visaFreeDestinations.join('、')}`) 
    : ''
  const visa3 = visaInfoSummary 
    ? (isEN(language) ? `\n📋 Visa info: ${visaInfoSummary}` : `\n📋 签证信息：${visaInfoSummary}`) 
    : ''

  const structure = isEN(language)
    ? `You MUST return a valid JSON object with the EXACT dual-track structure. Generate exactly ${targetDays} days. Start date: ${startDate}`
    : `你必须返回一个有效的 JSON 对象并严格遵循双轨结构。恰好生成 ${targetDays} 天。开始日期：${startDate}`

  return `${header}

${intentBlock}
${destinationNote}${loc1}${loc2}${loc3}${visa1}${visa2}${visa3}

${referenceCatalog}
${locationGuidance}

${structure}`
}
