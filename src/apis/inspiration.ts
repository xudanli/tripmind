/**
 * 灵感模式 API 编排层
 * 保持原有导出签名不变，内部使用新的服务层
 */

import { createIntentService } from '@/services/intentService'
import { createJourneyService } from '@/services/journeyService'
import { buildHintPrompt } from '@/prompts/inspiration/hint'
import { DeepSeekClient } from '@/llm/deepseekClient'
import { LoggingAdapter } from '@/utils/inspiration/core/logger'
import { extractDaysFromInput } from '@/utils/extractDays'
import { validateInspirationItinerary } from '@/validators/validateInspirationItinerary'
import { fallbackRecommendations } from '@/utils/inspirationCore'
import type { TravelContext } from '@/types/travel'

// ==================== 向后兼容的导出函数 ====================

/**
 * 生成灵感提示（向后兼容）
 */
export async function generateInspirationHint(
  userInput: string,
  language: string = 'zh-CN'
): Promise<string> {
  const sys = buildHintPrompt(
    userInput || (language.startsWith('en') ? 'I want to travel' : '我想去旅行'),
    language
  )

  const llm = new DeepSeekClient()
  try {
    const response = await llm.callLLM(sys, userInput, {
      temperature: 0.8,
      max_tokens: 200
    })
    return response.content
  } catch (error) {
    const logger = new LoggingAdapter(false)
    logger.error('❌ Failed to generate inspiration hint:', error as Error)
    return ''
  }
}

/**
 * 检测灵感意图（向后兼容）
 */
export async function detectInspirationIntent(
  userInput: string,
  language: string = 'zh-CN'
): Promise<any> {
  const intentService = createIntentService()
  return intentService.detect(userInput, language)
}

/**
 * 生成灵感旅程（向后兼容）
 * 保持原有函数签名不变
 */
export async function generateInspirationJourney(
  input: string,
  language: string = 'zh-CN',
  userCountry?: string,
  selectedDestination?: string,
  userNationality?: string,
  userPermanentResidency?: string,
  heldVisas?: string[],
  visaFreeDestinations?: string[],
  visaInfoSummary?: string | null,
  transportPreference?: 'public_transit_and_walking' | 'driving_and_walking'
): Promise<any> {
  const logger = new LoggingAdapter(false)
  
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  logger.log('🚀 开始生成灵感旅程（API 层）')
  logger.log(`📝 输入: ${input.substring(0, 100)}${input.length > 100 ? '...' : ''}`)
  logger.log(`🌍 语言: ${language}`)
  logger.log(`📍 目的地: ${selectedDestination || '未指定'}`)
  
  try {
    const intentService = createIntentService({ logger })
    const journeyService = createJourneyService({ logger })

    // 1. 提取天数
    logger.log('📊 步骤 1/5: 提取天数...')
    const userRequestedDays = extractDaysFromInput(input, language)
    logger.log(`   提取到的天数: ${userRequestedDays || '未指定'}`)

    // 2. 检测意图
    logger.log('📊 步骤 2/5: 检测意图...')
    const intent = await intentService.detect(input, language)
    logger.log(`   检测到的意图: ${intent.intentType}`)

    // 如果用户选择了目的地，添加到关键词
    if (selectedDestination && intent.keywords && !intent.keywords.includes(selectedDestination)) {
      intent.keywords.unshift(selectedDestination)
    }

    // 3. 构建上下文
    logger.log('📊 步骤 3/5: 构建上下文...')
    const ctx: TravelContext = {
      language,
      userCountry,
      userNationality,
      userPermanentResidency,
      heldVisas,
      visaFreeDestinations,
      visaInfoSummary: visaInfoSummary || undefined,
      transportPreference: transportPreference || 'public_transit_and_walking'
    }

    // 4. 生成旅程（这里会调用多次 LLM，可能需要较长时间）
    logger.log('📊 步骤 4/5: 生成旅程（可能需要 1-3 分钟，请耐心等待）...')
    const itinerary = await journeyService.generateJourney({
      input,
      intent,
      ctx,
      selectedDestination,
      userRequestedDays: userRequestedDays || null
    })
    logger.log(`   ✅ 旅程生成完成，共 ${itinerary.days?.length || 0} 天`)

    // 5. 校验
    logger.log('📊 步骤 5/5: 校验行程...')
    const validation = validateInspirationItinerary(itinerary)
    if (!validation.ok) {
      logger.warn('⚠️ 行程校验失败:', validation.error)
      // 不抛出错误，返回可用部分
    } else {
      logger.log('   ✅ 行程校验通过')
    }

    // 6. 返回修复后的结果
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return validation.fixed || itinerary
  } catch (error: any) {
    logger.error('❌ 生成灵感旅程失败:', error)
    console.error('❌ 详细错误信息:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    })
    
    // Fallback: 返回最小框架
    const fallback = fallbackRecommendations(language)
    if (fallback && fallback.length > 0) {
      logger.warn('⚠️ 使用回退方案')
      return {
        title: language.startsWith('en') ? 'Travel Inspiration' : '旅行灵感',
        destination: selectedDestination || '目的地',
        duration: 1,
        summary: language.startsWith('en')
          ? 'Unable to generate full itinerary. Please try again.'
          : '无法生成完整行程，请重试。',
        psychologicalFlow: [],
        coreInsight: '',
        days: [],
        hasFullItinerary: false
      }
    }

    throw error
  }
}

