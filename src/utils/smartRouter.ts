/**
 * 智能路由工具
 * 根据用户输入自动识别意图并推荐最适合的模式
 */

import { detectInspirationIntent } from '@/services/deepseekAPI'

export interface ModeRecommendation {
  mode: 'planner' | 'seeker' | 'inspiration'
  reason: string
  confidence: number
  intent: {
    intentType: string
    keywords: string[]
    emotionTone: string
    description: string
  }
}

/**
 * 智能路由用户输入到最适合的模式
 * @param userInput 用户输入
 * @param language 语言
 * @returns 推荐的模式和原因
 */
export async function smartRouteUserInput(
  userInput: string,
  language: string = 'zh-CN'
): Promise<ModeRecommendation> {
  // 第一步：识别用户意图
  const intent = await detectInspirationIntent(userInput, language)
  
  // 第二步：根据意图推荐模式
  const recommendation = getRecommendedMode(intent)
  
  return {
    mode: recommendation.mode,
    reason: recommendation.reason,
    confidence: recommendation.confidence,
    intent
  }
}

/**
 * 根据意图类型推荐最适合的模式
 */
function getRecommendedMode(intent: any): {
  mode: 'planner' | 'seeker' | 'inspiration'
  reason: string
  confidence: number
} {
  const { intentType, emotionTone, description } = intent
  
  // Inspiration 模式优先的场景
  if (
    intentType === 'photography_exploration' ||
    intentType === 'urban_creation' ||
    intentType === 'cultural_exchange'
  ) {
    return {
      mode: 'inspiration',
      reason: getReasonForInspiration(intentType),
      confidence: 0.9
    }
  }
  
  // Seeker 模式优先的场景
  if (
    intentType === 'mind_healing' ||
    intentType === 'emotional_healing'
  ) {
    return {
      mode: 'seeker',
      reason: getReasonForSeeker(intentType, emotionTone),
      confidence: 0.9
    }
  }
  
  // Planner 模式优先的场景
  if (
    intentType === 'extreme_exploration' ||
    intentType === 'nature_discovery'
  ) {
    return {
      mode: 'planner',
      reason: getReasonForPlanner(intentType),
      confidence: 0.8
    }
  }
  
  // 默认推荐 Inspiration（创意探索最灵活）
  return {
    mode: 'inspiration',
    reason: '我们推荐使用灵感模式，它可以为你提供多种创意旅行方案',
    confidence: 0.7
  }
}

function getReasonForInspiration(intentType: string): string {
  const reasons: Record<string, string> = {
    photography_exploration: '你的需求适合灵感模式，我们为你推荐多个摄影目的地，每个都有独特的创作主题',
    urban_creation: '你的需求适合灵感模式，我们为你推荐多个城市创作目的地',
    cultural_exchange: '你的需求适合灵感模式，我们为你推荐多个文化交流目的地'
  }
  return reasons[intentType] || '灵感模式可以为你提供多样化的创意旅行方案'
}

function getReasonForSeeker(intentType: string, emotionTone: string): string {
  if (intentType === 'emotional_healing') {
    return '你目前需要情感陪伴，Seeker 模式可以为你推荐疗愈目的地和一日舒缓体验'
  }
  if (intentType === 'mind_healing') {
    return '你目前需要身心放松，Seeker 模式可以为你推荐安静的目的地和休息方案'
  }
  return 'Seeker 模式可以提供更贴心的情感陪伴和个性化推荐'
}

function getReasonForPlanner(intentType: string): string {
  const reasons: Record<string, string> = {
    extreme_exploration: '你的冒险需求适合 Planner 模式，我们可以为你规划详细的挑战行程',
    nature_discovery: '你的探索需求适合 Planner 模式，我们可以为你规划完整的自然之旅'
  }
  return reasons[intentType] || 'Planner 模式可以为你提供详细的行程规划和数据支持'
}

/**
 * 在对话中检测情绪变化
 * @param currentMessage 当前消息
 * @param previousMessages 历史消息
 * @returns 是否应该切换模式
 */
type ConversationMessage = {
  content: string
}

export async function detectModeShift(
  currentMessage: string,
  previousMessages: ConversationMessage[],
  language: string = 'zh-CN'
): Promise<{
  shouldSwitch: boolean
  newMode?: 'planner' | 'seeker' | 'inspiration'
  reason?: string
}> {
  // 检测当前意图
  const currentIntent = await detectInspirationIntent(currentMessage, language)
  
  // 如果意图类型发生变化，可能需要切换模式
  if (previousMessages.length === 0) {
    return { shouldSwitch: false }
  }
  
  // 检测从理性规划转向情感需求的场景
  if (currentIntent.intentType === 'emotional_healing' || 
      currentIntent.intentType === 'mind_healing') {
    return {
      shouldSwitch: true,
      newMode: 'seeker',
      reason: '我感受到你现在的情绪，建议切换到陪伴模式，为你提供更贴心的建议'
    }
  }
  
  // 检测从情感需求转向创意思考的场景
  if (currentIntent.intentType === 'photography_exploration' || 
      currentIntent.intentType === 'urban_creation') {
    return {
      shouldSwitch: true,
      newMode: 'inspiration',
      reason: '你想寻找创作灵感，建议切换到灵感模式，获取更多创意目的地'
    }
  }
  
  return { shouldSwitch: false }
}

/**
 * 根据用户画像和意图生成个性化推荐
 */
export interface UserProfile {
  preferredModes?: ('planner' | 'seeker' | 'inspiration')[]
  travelHistory?: string[]
  emotionalStates?: string[]
  preferredIntentTypes?: string[]
}

export async function getPersonalizedRecommendation(
  userInput: string,
  userProfile: UserProfile,
  language: string = 'zh-CN'
): Promise<ModeRecommendation> {
  // 获取基础推荐
  const baseRecommendation = await smartRouteUserInput(userInput, language)
  
  // 如果用户有偏好的模式
  if (userProfile.preferredModes?.length) {
    if (userProfile.preferredModes.includes(baseRecommendation.mode)) {
      // 用户偏好与推荐一致，提高置信度
      baseRecommendation.confidence = Math.min(baseRecommendation.confidence + 0.1, 1.0)
    }
  }
  
  // 如果用户历史意图与当前相似
  if (userProfile.preferredIntentTypes?.includes(baseRecommendation.intent.intentType)) {
    baseRecommendation.confidence = Math.min(baseRecommendation.confidence + 0.1, 1.0)
  }
  
  return baseRecommendation
}
