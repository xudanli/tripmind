/**
 * 意图检测提示词构建模块
 */

import { buildIntentOptionsPrompt } from '@/utils/inspirationCore'

export type LanguageCode = 'zh-CN' | 'en' | string

const isEN = (lang: LanguageCode) => String(lang).startsWith('en')

/**
 * 构建意图检测提示词
 */
export function buildDetectIntentPrompt(userInput: string, lang: LanguageCode = 'zh-CN'): string {
  const opts = buildIntentOptionsPrompt(lang)
  
  return isEN(lang)
    ? `Analyze user's travel intent and emotional tone, identify the type of travel experience they truly need.

User Input: "${userInput}"

Return JSON format including:
- intentType: intent type
- keywords: keyword array (extract 3-5 most relevant keywords from user input)
- emotionTone: emotional tone (describe the emotional atmosphere: calm, energetic, contemplative, adventurous, healing, creative)
- description: intent description (brief explanation of what user truly needs)

Intent type options:
${opts}

Please respond in English.`
    : `分析用户的旅行意图和情感基调，识别他们真正需要的旅行体验类型。

用户输入："${userInput}"

请返回JSON格式，包含：
- intentType: 意图类型
- keywords: 关键词数组（从用户输入中提取3-5个最相关的关键词）
- emotionTone: 情感基调（描述情感氛围：平静、活力、沉思、冒险、疗愈、创意）
- description: 意图描述（简要说明用户的真实需求）

意图类型选项：
${opts}`
}
