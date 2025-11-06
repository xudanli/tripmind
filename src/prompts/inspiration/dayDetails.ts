/**
 * 每日详情生成提示词构建模块
 */

export interface DayDetailsPromptArgs {
  dayIndex: number
  baseDay: {
    day: number
    date: string
    theme: string
    mood: string
    summary: string
    psychologicalStage: string
  }
  context: {
    destination: string
    intentType: string
    emotionTone: string
    language: string
    previousDays?: any[]
    transportPreference?: 'public_transit_and_walking' | 'driving_and_walking'
  }
}

import { buildLanguageRequirementBlock, buildJSONCompletenessRequirement, buildTransportPreferenceBlock } from './common'

/**
 * 构建每日详情生成提示词
 */
export function buildDayDetailsPrompt(args: DayDetailsPromptArgs): { system: string; user: string } {
  const { dayIndex, baseDay, context } = args
  const isEnglish = context.language.startsWith('en')

  const languageRequirement = buildLanguageRequirementBlock(
    context.language,
    ['title', 'activity', 'notes', 'localTip', 'internalTrack.question', 'internalTrack.ritual', 'internalTrack.reflection', 'transportation descriptions']
  )

  const systemPrompt = isEnglish
    ? `You are a location-based travel activity generator. Generate detailed, location-specific information for ONE day.

${languageRequirement}

Day ${dayIndex} Context:
- Theme: ${baseDay.theme}
- Mood: ${baseDay.mood}
- Psychological Stage: ${baseDay.psychologicalStage}
- Date: ${baseDay.date}
- Destination: ${context.destination}
- Intent Type: ${context.intentType}
- Emotion Tone: ${context.emotionTone}

${context.previousDays && context.previousDays.length > 0 
  ? `Previous Days Locations:\n${context.previousDays.map((d, i) => `Day ${i + 1}: ${d.timeSlots?.map((s: any) => s.location).filter(Boolean).join(', ') || 'N/A'}`).join('\n')}`
  : ''}

Generate 4-6 timeSlots with complete location details:
- time (HH:MM), title (vivid, location-specific, **IN ENGLISH**), activity (**IN ENGLISH**), location (specific with area/district, **IN ENGLISH**)
- type, category, duration, notes (40+ words, **IN ENGLISH**), localTip (**IN ENGLISH**), cost, coordinates (realistic lat/lng)
- internalTrack (question, ritual, reflection matching psychological stage, **ALL IN ENGLISH**)
- details (for restaurants/hotels/attractions/shopping):
  * name (chinese, english, **local** - MUST include local language name. chinese and english fields should match the main language requirement)
  * address (chinese, english, **local** - MUST include local language address, landmark. chinese and english fields should match the main language requirement)
  * transportation (fromStation with walkTime/distance, busLines with busStop, subway with lines/station, **driving** - e.g., "40 minutes drive from X", **shuttle** - e.g., "pre-booked shuttle", parking, **ALL DESCRIPTIONS IN ENGLISH**)
  * openingHours, pricing, rating (with platformUrl if available), recommendations, description (**ALL IN ENGLISH**)
  * **officialWebsite** (if available), **sourceUrl** (if available)

${buildTransportPreferenceBlock(context.language, context.transportPreference || 'public_transit_and_walking')}

Arrange activities geographically. Use REAL locations in ${context.destination}. Match the day's theme and psychological stage.

${buildJSONCompletenessRequirement(context.language, 'You can simplify some field descriptions, but MUST ensure all timeSlots array elements are fully closed.')}

⚠️ **CRITICAL: If your response is getting too long, prioritize JSON structure completeness. You can:
- Shorten "notes" field to 30-50 words instead of 40+ words
- Simplify "localTip" to 1-2 sentences
- Omit some optional fields if needed
- But ALWAYS ensure all strings are properly closed with quotes and all objects/arrays are properly closed.**

Return ONLY JSON:
{
  "day": ${dayIndex},
  "timeSlots": [/* 4-6 time slots with full details, ensure each object is fully closed */]
}`
    : `你是基于地理位置的旅行活动生成器。为一天生成详细的地理位置信息。

${languageRequirement}

第${dayIndex}天上下文：
- 主题：${baseDay.theme}
- 情绪：${baseDay.mood}
- 心理阶段：${baseDay.psychologicalStage}
- 日期：${baseDay.date}
- 目的地：${context.destination}
- 意图类型：${context.intentType}
- 情绪基调：${context.emotionTone}

${context.previousDays && context.previousDays.length > 0 
  ? `前几天的位置：\n${context.previousDays.map((d, i) => `第${i + 1}天：${d.timeSlots?.map((s: any) => s.location).filter(Boolean).join('、') || '无'}`).join('\n')}`
  : ''}

生成4-6个时间段，包含完整地点详情：
- time（HH:MM）、title（生动、具体地点，**必须使用中文**）、activity（**必须使用中文**）、location（具体，含区域/街区，**必须使用中文**）
- type、category、duration、notes（40+字，**必须使用中文**）、localTip（**必须使用中文**）、cost、coordinates（真实lat/lng）
- internalTrack（问题、仪式、反思，匹配心理阶段，**全部必须使用中文**）
- details（针对餐厅/酒店/景点/购物）：
  * name（**必须包含local当地语言名称**，chinese字段必须使用中文）、address（**必须包含local当地语言地址**、landmark，chinese字段必须使用中文）
  * transportation（fromStation步行时间/距离、busLines公交路线+busStop站名、subway地铁线路+站名、**driving驾车说明**如"从X驾车40分钟"、**shuttle接驳车/班车**如"预订的接驳车"、parking停车信息，**所有描述必须使用中文**）
  * openingHours、pricing、rating（如有platformUrl评分平台链接请包含）、recommendations、description（**全部必须使用中文**）
  * **officialWebsite官方网站**（如有）、**sourceUrl来源链接**（如有）

${buildTransportPreferenceBlock(context.language, context.transportPreference || 'public_transit_and_walking')}

按地理位置安排活动。使用${context.destination}的真实地点。匹配当天主题和心理阶段。

${buildJSONCompletenessRequirement(context.language, '可以适当简化某些字段的详细描述，但必须确保所有timeSlots数组元素都完整闭合。')}

⚠️ **关键提示：如果响应内容过长，优先保证 JSON 结构完整性。你可以：
- 将 "notes" 字段缩短到 30-50 字，而不是 40+ 字
- 将 "localTip" 简化为 1-2 句话
- 必要时省略某些可选字段
- 但必须确保所有字符串都用引号正确闭合，所有对象/数组都正确闭合。**

只返回JSON：
{
  "day": ${dayIndex},
  "timeSlots": [/* 4-6个包含完整详情的时间段，确保每个对象都完整闭合 */]
}`

  const userPrompt = isEnglish
    ? `Generate detailed location-based activities for Day ${dayIndex} in ${context.destination}.`
    : `生成第${dayIndex}天在${context.destination}的详细地理位置活动。`

  return { system: systemPrompt, user: userPrompt }
}

