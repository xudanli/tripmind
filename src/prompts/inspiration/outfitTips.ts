/**
 * 穿搭建议和文化提示生成提示词构建模块
 */

export interface OutfitTipsPromptArgs {
  slot: any
  context: {
    destination: string
    dayIndex: number
    date: string
    weather?: string
    season?: string
    language: string
  }
}

import { buildSimpleLanguageRequirement, buildJSONCompletenessRequirement } from './common'

/**
 * 构建穿搭建议和文化提示生成提示词
 */
export function buildOutfitTipsPrompt(args: OutfitTipsPromptArgs): { system: string; user: string } {
  const { slot, context } = args
  const isEnglish = context.language.startsWith('en')

  const languageRequirement = buildSimpleLanguageRequirement(
    context.language,
    isEnglish ? 'ALL content (outfitSuggestions and culturalTips)' : '所有内容（outfitSuggestions 和 culturalTips）'
  )

  const systemPrompt = isEnglish
    ? `You are a travel fashion and cultural advisor. Generate outfit suggestions and cultural tips for a specific activity.

${languageRequirement}

Activity context:
- Activity: ${slot.title || slot.activity}
- Location: ${slot.location || slot.details?.address?.local || slot.details?.address?.english || 'Unknown'}
- Type: ${slot.type || 'general'}
- Date: ${context.date}
- Destination: ${context.destination}
${context.weather ? `- Weather: ${context.weather}` : ''}
${context.season ? `- Season: ${context.season}` : ''}

Generate:
1. **Outfit Suggestions** (50-100 words, **IN ENGLISH**): Specific, practical outfit recommendations based on:
   - Activity type and location
   - Weather and season
   - Cultural appropriateness
   - Comfort and practicality
   - Style tips that match the activity's mood

2. **Cultural Tips** (50-100 words, **IN ENGLISH**): Local cultural etiquette and friendly practices:
   - Appropriate behavior and customs
   - What to avoid
   - How to show respect
   - Cultural dos and don'ts
   - Local communication tips

Return ONLY JSON:
{
  "outfitSuggestions": "Detailed outfit suggestions in ENGLISH...",
  "culturalTips": "Cultural tips and etiquette advice in ENGLISH..."
}`
    : `你是旅行穿搭和文化顾问。为特定活动生成穿搭建议和当地文化友好提示。

${languageRequirement}

活动上下文：
- 活动：${slot.title || slot.activity}
- 位置：${slot.location || slot.details?.address?.local || slot.details?.address?.chinese || '未知'}
- 类型：${slot.type || '一般'}
- 日期：${context.date}
- 目的地：${context.destination}
${context.weather ? `- 天气：${context.weather}` : ''}
${context.season ? `- 季节：${context.season}` : ''}

生成：
1. **穿搭建议**（50-100字，**必须使用中文**）：具体、实用的穿搭建议，基于：
   - 活动类型和位置
   - 天气和季节
   - 文化适宜性
   - 舒适度和实用性
   - 匹配活动氛围的穿搭风格

2. **当地文化友好提示**（50-100字，**必须使用中文**）：当地文化礼仪和友好行为：
   - 得体的行为和习俗
   - 需要避免的事项
   - 如何表达尊重
   - 文化注意事项
   - 当地沟通技巧

只返回JSON：
{
  "outfitSuggestions": "详细的穿搭建议（必须使用中文）...",
  "culturalTips": "文化提示和礼仪建议（必须使用中文）..."
}`

  const userPrompt = isEnglish
    ? `Generate outfit suggestions and cultural tips for this activity in ${context.destination}.`
    : `为这个活动生成穿搭建议和当地文化友好提示。`

  return { system: systemPrompt, user: userPrompt }
}

