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

-Generate 3-4 timeSlots with concise, location-grounded details:
- time (HH:MM), title (vivid, location-specific, **IN ENGLISH**), activity (**IN ENGLISH**), location (specific with area/district, **IN ENGLISH**)
- type, category, duration (integer minutes), cost (short textual band), coordinates (realistic lat/lng)
- notes (**IN ENGLISH**, may be up to 2 sentences) must include the combined reminder: "Check local transportation; check opening hours; verify ticket prices (if applicable); confirm activity details in advance."
- localTip (**IN ENGLISH**, ≤ 2 sentences)
- internalTrack (question, ritual, reflection matching psychological stage, each ≤ 20 words, **ALL IN ENGLISH**)
- details (only when relevant to food/hotel/attraction/shopping):
  * name (chinese, english, **local language** – keep each ≤ 6 words)
  * address (chinese, english, **local language** – concise, include landmark if useful)
  * transportation (fromStation walkTime/distance OR nearest transit; include driving/shuttle/parking only when essential)
  * openingHours, pricing, rating, recommendations, description (**ALL IN ENGLISH**, each ≤ 20 words)
  * optional officialWebsite / sourceUrl (omit if unknown)

${buildTransportPreferenceBlock(context.language, context.transportPreference || 'public_transit_and_walking')}

Arrange activities geographically. Use REAL locations in ${context.destination}. Match the day's theme and psychological stage. Start the day already in-destination: avoid using airport/train arrivals or hotel check-in as the first timeSlot unless the entire day is devoted to transit. Ensure transportation notes describe how travelers move locally (transit lines, short transfers, walking links).

${buildJSONCompletenessRequirement(context.language, 'Keep JSON compact. Prefer omitting optional sub-fields over writing very long strings. Ensure every timeSlots element is fully closed.')}

⚠️ **CRITICAL**: If content grows too long, REDUCE detail (shorter text, fewer optional fields) but NEVER leave arrays/objects open or strings unterminated.

Return ONLY JSON:
{
  "day": ${dayIndex},
  "timeSlots": [/* 3-4 time slots with full details, ensure each object is fully closed */]
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

-生成3-4个时间段，保持精炼但确保地点具体：
- time（HH:MM）、title（生动、具体地点，**必须使用中文**）、activity（**必须使用中文**）、location（具体含区域/街区，**必须使用中文**）
- type、category、duration（整数分钟）、cost（花费档位简写）、coordinates（真实lat/lng）
- notes（**必须使用中文**，最多2句），且必须包含完整提醒：“请查询当地交通信息；请查询开放时间；请查询门票价格（如适用）；建议提前查询活动信息”。
- localTip（**必须使用中文**，≤2句）
- internalTrack（问题、仪式、反思，匹配心理阶段，各≤20字，**全部必须使用中文**）
- details（适用于餐厅/酒店/景点/购物时）：
  * name（含中文、英文、当地语言名称；每个不超过6个词）
  * address（含中文、英文、当地语言地址；简洁，可加地标）
  * transportation（fromStation步行时间或距离、公交/地铁二选一；仅在必要时添加驾车/接驳/停车说明）
  * openingHours、pricing、rating、recommendations、description（**全部中文**，每项≤20字）
  * 可选字段：officialWebsite / sourceUrl（未知可省略）

${buildTransportPreferenceBlock(context.language, context.transportPreference || 'public_transit_and_walking')}

按地理位置安排活动。使用${context.destination}的真实地点。匹配当天主题和心理阶段。首个时间段应直接进入在地体验，除非整天为长途交通，否则不要把“抵达机场/火车站/酒店”等抵达片段作为开始。交通描述需写明本地接驳方式（公交/地铁/步行/出租等）。

${buildJSONCompletenessRequirement(context.language, '保持 JSON 精简；如遇篇幅限制，可删除可选字段，但必须保证 timeSlots 中每个对象都完整闭合。')}

⚠️ **关键提示**：当内容偏长时，优先收缩描述或省略可选字段，绝不能留下未闭合的数组/对象或字符串。

只返回JSON：
{
  "day": ${dayIndex},
  "timeSlots": [/* 3-4个包含完整详情的时间段，确保每个对象都完整闭合 */]
}`

  const userPrompt = isEnglish
    ? `Generate detailed location-based activities for Day ${dayIndex} in ${context.destination}.`
    : `生成第${dayIndex}天在${context.destination}的详细地理位置活动。`

  return { system: systemPrompt, user: userPrompt }
}

