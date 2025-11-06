/**
 * 灵感旅程生成提示词构建模块
 */

import { buildDestinationConstraint } from '@/utils/inspirationCore'
import { buildVisaInfoBlock, buildUserContextBlock } from './common'

export type LanguageCode = 'zh-CN' | 'en' | string

const isEN = (lang: LanguageCode) => String(lang).startsWith('en')

// IntentResult 已迁移到 validators/itinerarySchema.ts
import type { IntentResult } from '@/validators/itinerarySchema'

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

  const userContextBlock = buildUserContextBlock(language, {
    userCountry,
    userNationality,
    userPermanentResidency
  })
  
  const visaInfoBlock = buildVisaInfoBlock(language, {
    heldVisas,
    visaFreeDestinations,
    visaInfoSummary
  })

  const structure = isEN(language)
    ? `You MUST return a valid JSON object with the EXACT dual-track structure. Generate exactly ${targetDays} days. Start date: ${startDate}

**JSON Structure Required:**
{
  "title": "Journey title",
  "destination": "Destination name",
  "duration": ${targetDays},
  "summary": "Journey summary",
  "psychologicalFlow": ["stage1", "stage2", ...],
  "coreInsight": "Core insight",
  "days": [
    {
      "day": 1,
      "date": "${startDate}",
      "theme": "Day theme",
      "mood": "Day mood",
      "summary": "Day summary",
      "psychologicalStage": "Stage name",
      "timeSlots": [
        {
          "time": "HH:MM",
          "title": "Activity title",
          "activity": "Activity description",
          "location": "Location name",
          "type": "activity|meal|rest",
          "category": "Category",
          "duration": 60,
          "notes": "Notes",
          "cost": 0,
          "coordinates": { "lat": 0, "lng": 0 },
          "internalTrack": {
            "question": "Question",
            "ritual": "Ritual",
            "reflection": "Reflection"
          }
        }
      ]
    }
    // ... ${targetDays} days total
  ],
  "totalCost": 0,
  "recommendations": {}
}

⚠️ CRITICAL: The "days" array MUST contain exactly ${targetDays} day objects. Each day must have a complete structure.`
    : `你必须返回一个有效的 JSON 对象并严格遵循双轨结构。恰好生成 ${targetDays} 天。开始日期：${startDate}

**必需的 JSON 结构：**
{
  "title": "旅程标题",
  "destination": "目的地名称",
  "duration": ${targetDays},
  "summary": "旅程摘要",
  "psychologicalFlow": ["阶段1", "阶段2", ...],
  "coreInsight": "核心洞察",
  "days": [
    {
      "day": 1,
      "date": "${startDate}",
      "theme": "当日主题",
      "mood": "当日情绪",
      "summary": "当日摘要",
      "psychologicalStage": "心理阶段",
      "timeSlots": [
        {
          "time": "HH:MM",
          "title": "活动标题",
          "activity": "活动描述",
          "location": "地点名称",
          "type": "activity|meal|rest",
          "category": "类别",
          "duration": 60,
          "notes": "备注",
          "cost": 0,
          "coordinates": { "lat": 0, "lng": 0 },
          "internalTrack": {
            "question": "问题",
            "ritual": "仪式",
            "reflection": "反思"
          }
        }
      ]
    }
    // ... 共 ${targetDays} 天
  ],
  "totalCost": 0,
  "recommendations": {}
}

⚠️ 关键要求："days" 数组必须恰好包含 ${targetDays} 个 day 对象。每一天都必须有完整的结构。`

  return `${header}

${intentBlock}
${destinationNote}${userContextBlock}${visaInfoBlock}

${referenceCatalog}
${locationGuidance}

${structure}`
}
