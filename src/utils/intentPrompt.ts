/**
 * 意图检测提示词构建（替代已删除的 inspiration/intent）
 */

export function buildDetectIntentPrompt(userInput: string, language: string): string {
  const isEnglish = language.startsWith('en')
  
  if (isEnglish) {
    return `You are a travel intent detection system. Analyze the user's input and identify their travel intent.

User Input: "${userInput}"

Please analyze the user's travel intent and return a JSON object with the following structure:
{
  "intentType": "photography_exploration" | "cultural_exchange" | "emotional_healing" | "mind_healing" | "extreme_exploration" | "urban_creation" | "general",
  "keywords": ["keyword1", "keyword2", ...],
  "emotionTone": "calm" | "active" | "romantic" | "adventurous" | "contemplative" | "energetic" | "neutral",
  "description": "A brief description of the detected intent",
  "confidence": 0.0-1.0
}

Common intent types:
- photography_exploration: User wants to explore and photograph beautiful places
- cultural_exchange: User wants to experience local culture and traditions
- emotional_healing: User wants emotional healing or relaxation
- mind_healing: User wants mental/spiritual healing
- extreme_exploration: User wants adventurous or extreme activities
- urban_creation: User wants to explore urban culture and creativity
- general: General travel intent

Return only valid JSON, no additional text.`
  }

  return `你是一个旅行意图检测系统。分析用户的输入并识别他们的旅行意图。

用户输入："${userInput}"

请分析用户的旅行意图，并返回一个 JSON 对象，结构如下：
{
  "intentType": "photography_exploration" | "cultural_exchange" | "emotional_healing" | "mind_healing" | "extreme_exploration" | "urban_creation" | "general",
  "keywords": ["关键词1", "关键词2", ...],
  "emotionTone": "calm" | "active" | "romantic" | "adventurous" | "contemplative" | "energetic" | "neutral",
  "description": "检测到的意图的简要描述",
  "confidence": 0.0-1.0
}

常见意图类型：
- photography_exploration: 用户想要探索和拍摄美丽的地方
- cultural_exchange: 用户想要体验当地文化和传统
- emotional_healing: 用户想要情感疗愈或放松
- mind_healing: 用户想要心理/精神疗愈
- extreme_exploration: 用户想要冒险或极限活动
- urban_creation: 用户想要探索城市文化和创意
- general: 一般旅行意图

只返回有效的 JSON，不要添加其他文本。`
}

