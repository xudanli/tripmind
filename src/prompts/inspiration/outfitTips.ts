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
1. **Outfit Suggestions**: Provide 2-3 bullet points, each ≤ 18 English words, starting with "• ". Focus on:
   - Activity type and location
   - Weather / season
   - Cultural appropriateness & comfort

2. **Cultural Tips**: Provide 2-3 bullet points, each ≤ 18 English words, starting with "• ". Cover:
   - Respectful behaviour & etiquette
   - What to avoid
   - Friendly communication reminders

Return ONLY JSON:
{
  "outfitSuggestions": "• First tip\\n• Second tip",
  "culturalTips": "• First tip\\n• Second tip"
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
1. **穿搭建议**：输出 2-3 条项目符号，每条 ≤ 18 个汉字，以「• 」开头，结合：
   - 活动类型与位置
   - 天气 / 季节
   - 文化适宜与舒适度

2. **当地文化友好提示**：输出 2-3 条项目符号，每条 ≤ 18 个汉字，以「• 」开头，涵盖：
   - 得体行为与习俗
   - 需要避免的事项
   - 礼貌沟通提醒

只返回JSON：
{
  "outfitSuggestions": "• 第一条\\n• 第二条",
  "culturalTips": "• 第一条\\n• 第二条"
}`

  const userPrompt = isEnglish
    ? `Generate outfit suggestions and cultural tips for this activity in ${context.destination}.`
    : `为这个活动生成穿搭建议和当地文化友好提示。`

  return { system: systemPrompt, user: userPrompt }
}

