/**
 * 灵感模式 API 编排层
 * 保持原有导出签名不变，内部使用新的服务层
 * 支持后端API调用，失败时fallback到前端实现
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

// 是否使用后端API（可通过环境变量控制）
const USE_BACKEND_API = import.meta.env.VITE_USE_INSPIRATION_BACKEND_API !== 'false' // 默认启用

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
 * 优先使用后端API，失败时fallback到前端实现
 */
export async function detectInspirationIntent(
  userInput: string,
  language: string = 'zh-CN'
): Promise<any> {
  // 如果启用后端API，优先使用后端接口
  if (USE_BACKEND_API) {
    try {
      const { detectIntent } = await import('@/services/inspirationBackendAPI')
      const backendResult = await detectIntent({
        input: userInput,
        language
      })
      
      // 转换后端响应格式到前端格式
      return {
        intentType: backendResult.intentType,
        keywords: backendResult.keywords,
        emotionTone: backendResult.emotionTone,
        description: backendResult.description,
        confidence: backendResult.confidence
      }
    } catch (error: any) {
      console.warn('[InspirationAPI] 后端意图识别失败，使用前端实现:', error.message)
      // Fallback 到前端实现
    }
  }
  
  // 使用前端实现
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
  transportPreference?: 'public_transit_and_walking' | 'driving_and_walking',
  mode: 'full' | 'candidates' = 'full'
): Promise<any> {
  const logger = new LoggingAdapter(false)
  
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  logger.log('🚀 开始生成灵感旅程（API 层）')
  logger.log(`📝 输入: ${input.substring(0, 100)}${input.length > 100 ? '...' : ''}`)
  logger.log(`🌍 语言: ${language}`)
  logger.log(`📍 目的地: ${selectedDestination || '未指定'}`)
  logger.log(`🎯 生成模式: ${mode}`)
  logger.log(`🔧 使用后端API: ${USE_BACKEND_API}`)
  
  // 如果启用后端API，优先使用后端接口
  if (USE_BACKEND_API) {
    try {
      // 检测输入中是否包含目的地
      let detectedDestinationInInput = selectedDestination
      if (!detectedDestinationInInput) {
        try {
          const { PRESET_COUNTRIES } = await import('@/constants/countries')
          const inputLower = input.toLowerCase()
          
          // 检查输入中是否包含国家名称
          // 使用更适合中文的匹配方式：直接检查是否包含国家名称
          // 优先匹配较长的国家名称，避免短名称被误匹配
          const countries = Object.values(PRESET_COUNTRIES as any) as any[]
          const sortedCountries = countries.sort((a, b) => b.name.length - a.name.length) // 按长度降序排序
          const countryMatch = sortedCountries.find((country: any) => {
            const countryName = country.name
            // 对于中文，直接检查是否包含国家名称（不区分大小写）
            // 使用 includes 更简单可靠
            return input.toLowerCase().includes(countryName.toLowerCase())
          }) as any
          
          if (countryMatch) {
            detectedDestinationInInput = countryMatch.name
            logger.log(`📍 检测到输入包含目的地: ${detectedDestinationInInput}`)
          }
        } catch (error) {
          logger.warn('⚠️ 检测目的地失败:', error)
        }
      }
      
      // 如果输入包含目的地，强制使用 'full' 模式，不调用推荐目的地接口
      const actualMode = detectedDestinationInInput ? 'full' : mode
      if (detectedDestinationInInput && mode === 'candidates') {
        logger.log('📍 输入包含目的地，跳过推荐目的地接口，直接生成完整行程')
      }
      
      // 先获取意图（如果后端需要）
      let intent = null
      try {
        const { detectIntent } = await import('@/services/inspirationBackendAPI')
        const backendIntent = await detectIntent({ input, language })
        intent = {
          intentType: backendIntent.intentType,
          keywords: backendIntent.keywords,
          emotionTone: backendIntent.emotionTone
        }
      } catch (intentError) {
        logger.warn('⚠️ 后端意图识别失败，继续生成行程')
      }
      
      // 提取天数（如果后端需要）
      let userRequestedDays: number | undefined
      try {
        const { extractDays } = await import('@/services/inspirationBackendAPI')
        const daysResult = await extractDays({ input, language })
        userRequestedDays = daysResult.days || undefined
      } catch (daysError) {
        logger.warn('⚠️ 后端天数提取失败，使用前端提取')
        userRequestedDays = extractDaysFromInput(input, language) || undefined
      }
      
      // 调用后端生成行程接口（如果检测到目的地，直接生成完整行程，不调用推荐接口）
      const { generateItinerary: generateItineraryBackend } = await import('@/services/inspirationBackendAPI')
      logger.log(`📡 调用后端API生成行程... (模式: ${actualMode})`)
      const backendResult = await generateItineraryBackend({
        input,
        selectedDestination: detectedDestinationInInput || selectedDestination,  // 使用检测到的目的地
        intent: intent || undefined,
        language,
        userCountry,
        userNationality,
        userPermanentResidency,
        heldVisas,
        visaFreeDestinations,
        visaInfoSummary: visaInfoSummary || undefined,
        transportPreference,
        userRequestedDays,
        mode: actualMode  // 使用实际模式
      })
      
      logger.log('✅ 后端API生成成功')
      
      // 转换后端响应格式到前端格式
      return {
        ...backendResult,
        // 确保格式兼容
        subtitle: backendResult.title || '',
        budget: 'medium',
        highlights: backendResult.highlights || [],
        // 保持原有字段
        hasFullItinerary: backendResult.hasFullItinerary ?? (mode === 'full'),
        generationMode: backendResult.generationMode || mode
      }
    } catch (error: any) {
      logger.warn('⚠️ 后端API生成失败，使用前端实现:', error.message)
      console.warn('[InspirationAPI] 后端API失败详情:', {
        error: error.message,
        stack: error.stack
      })
      // Fallback 到前端实现
    }
  }
  
  // 使用前端实现（原有逻辑）
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
      userRequestedDays: userRequestedDays || null,
      mode
    })
    logger.log(`   ✅ 旅程生成完成，共 ${itinerary.days?.length || 0} 天`)

    let finalItinerary = itinerary
    if (mode === 'full') {
      // 5. 校验
      logger.log('📊 步骤 5/5: 校验行程...')
      const validation = validateInspirationItinerary(itinerary)
      if (!validation.ok) {
        logger.warn('⚠️ 行程校验失败:', validation.error)
        // 不抛出错误，返回可用部分
      } else {
        logger.log('   ✅ 行程校验通过')
      }
      finalItinerary = validation.fixed || itinerary
    } else {
      logger.log('📊 候选模式：跳过详细校验，直接返回框架结果')
    }

    // 6. 从 Itinerary 生成 highlights（如果不存在）
    let result: any = { ...finalItinerary }
    
    // 如果缺少 highlights，从 psychologicalFlow 或 days 中提取
    if (!result.highlights || (Array.isArray(result.highlights) && result.highlights.length === 0)) {
      const highlights: string[] = []
      
      // 从 psychologicalFlow 提取
      if (result.psychologicalFlow && Array.isArray(result.psychologicalFlow) && result.psychologicalFlow.length > 0) {
        highlights.push(...result.psychologicalFlow.slice(0, 3))
      }
      
      // 从 days 的 theme 提取
      if (result.days && Array.isArray(result.days) && result.days.length > 0) {
        const themes = result.days
          .slice(0, 3)
          .map((day: any) => day.theme)
          .filter((theme: any) => theme && typeof theme === 'string')
        highlights.push(...themes)
      }
      
      // 如果还是没有，使用默认值
      if (highlights.length === 0) {
        highlights.push(
          language.startsWith('en') ? 'Unique Experience' : '独特体验',
          language.startsWith('en') ? 'Personalized Journey' : '个性化旅程',
          language.startsWith('en') ? 'Memorable Moments' : '难忘时刻'
        )
      }
      
      result.highlights = highlights.slice(0, 6) // 最多6个
      logger.log(`   ✅ 生成了 ${result.highlights.length} 个体验亮点`)
    }
    
    // 7. 返回修复后的结果，并标记生成模式
    const hasDetailedSlots =
      Array.isArray(result.days) &&
      result.days.length > 0 &&
      result.days.every(
        (day: any) => Array.isArray(day?.timeSlots) && day.timeSlots.length > 0
      )
    result.hasFullItinerary = mode === 'full' && hasDetailedSlots
    result.generationMode = mode
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return result
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

