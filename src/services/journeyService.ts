/**
 * 旅程生成服务
 * 负责框架生成、逐日细化、Tips 合并等核心业务逻辑
 */

import { DeepSeekClient } from '@/llm/deepseekClient'
import { LoggingAdapter } from '@/utils/inspiration/core/logger'
import { JSONProcessor } from '@/utils/inspiration/core/jsonProcessor'
import { buildJourneyPrompt, type JourneyPromptArgs } from '@/prompts/inspiration/journey'
import { buildDayDetailsPrompt } from '@/prompts/inspiration/dayDetails'
import { buildOutfitTipsPrompt } from '@/prompts/inspiration/outfitTips'
import { calcFrameworkMaxTokens, calcDayDetailsMaxTokens } from '@/utils/tokens'
import { pickSeason } from '@/utils/lang'
import { buildReferenceCatalog } from '@/utils/inspiration/core/referenceCatalog'
import { extractDaysFromInput } from '@/utils/extractDays'
import { buildDestinationConstraint } from '@/utils/inspirationCore'
import { fallbackRecommendations } from '@/utils/inspirationCore'
import type { TravelContext } from '@/types/travel'
import type { IntentResult } from '@/validators/itinerarySchema'
import type { Itinerary } from '@/validators/itinerarySchema'

// ==================== 类型定义 ====================

export interface JourneyServiceDeps {
  llm: DeepSeekClient
  jsonParser: typeof JSONProcessor
  logger: LoggingAdapter
}

export interface GenerateJourneyParams {
  input: string
  intent: IntentResult
  ctx: TravelContext
  selectedDestination?: string
  userRequestedDays?: number | null
}

// ==================== 旅程生成服务 ====================

export class JourneyService {
  constructor(private deps: JourneyServiceDeps) {}

  /**
   * 生成完整旅程（主入口）
   */
  async generateJourney(params: GenerateJourneyParams): Promise<Itinerary> {
    const { input, intent, ctx, selectedDestination, userRequestedDays } = params
    const { logger } = this.deps

    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    logger.log('🚀 开始生成灵感旅程')
    logger.log(`📝 用户输入: ${input.substring(0, 100)}${input.length > 100 ? '...' : ''}`)
    logger.log(`🌍 语言: ${ctx.language}`)
    logger.log(`📍 目的地: ${selectedDestination || '未指定'}`)

    // 1. 确定天数
    const estimatedDays = await this.determineDays(
      userRequestedDays,
      selectedDestination,
      intent
    )

    // 2. 构建参考目录
    const referenceResult = await buildReferenceCatalog(ctx.userCountry, ctx.language)

    // 3. 生成框架
    const framework = await this.generateFramework({
      input,
      intent,
      ctx,
      selectedDestination,
      estimatedDays,
      referenceResult
    })

    // 4. 生成每日详情（串行，保证地理连续性）
    // 优化：如果天数较多（>5天），先快速生成前3天，让用户看到进度
    const itineraryWithDetails = await this.generateDayDetailsForAllDays(
      framework,
      intent,
      ctx,
      selectedDestination
    )

    // 5. 生成 Tips（可选，如果用户需要快速响应可以跳过或异步生成）
    // 优化：Tips 生成改为可选，先返回基本行程，Tips 可以后续异步补充
    let finalItinerary = itineraryWithDetails
    
    // 如果天数较少（<=3天），生成 Tips；否则先返回基本行程
    if (estimatedDays <= 3) {
      finalItinerary = await this.generateTipsForAllSlots(
        itineraryWithDetails,
        ctx
      )
    } else {
      logger.log('  ⏭️ 跳过 Tips 生成以加快响应速度（天数较多）')
      // 异步生成 Tips，不阻塞主流程
      this.generateTipsForAllSlots(itineraryWithDetails, ctx).catch(err => {
        logger.warn('  ⚠️ 异步生成 Tips 失败:', err)
      })
    }

    // 6. 校验和修复
    return this.validateAndFix(finalItinerary)
  }

  /**
   * 确定行程天数
   */
  private async determineDays(
    userRequestedDays: number | null | undefined,
    selectedDestination: string | undefined,
    intent: IntentResult
  ): Promise<number> {
    if (userRequestedDays) {
      return userRequestedDays
    }

    // 根据目的地智能推荐
    const { getRecommendedDaysForDestination } = await import('@/utils/destinationDays')
    const destination = selectedDestination || intent.keywords?.[0] || ''
    const recommendation = getRecommendedDaysForDestination(destination, intent.intentType)
    return recommendation.recommendedDays
  }

  /**
   * 生成基础框架（第一阶段）
   */
  private async generateFramework(params: {
    input: string
    intent: IntentResult
    ctx: TravelContext
    selectedDestination?: string
    estimatedDays: number
    referenceResult: { referenceCatalog: string; locationGuidance?: string }
  }): Promise<Itinerary> {
    const { input, intent, ctx, selectedDestination, estimatedDays, referenceResult } = params
    const { llm, jsonParser, logger } = this.deps

    const startDate: string = new Date().toISOString().split('T')[0] || new Date().toISOString().substring(0, 10)
    const destinationNote = buildDestinationConstraint(selectedDestination, ctx.language, 'critical')

    const promptArgs: JourneyPromptArgs = {
      language: ctx.language,
      intent,
      startDate: startDate as string,
      targetDays: estimatedDays,
      userCountry: ctx.userCountry,
      selectedDestination,
      userNationality: ctx.userNationality,
      userPermanentResidency: ctx.userPermanentResidency,
      heldVisas: ctx.heldVisas,
      visaFreeDestinations: ctx.visaFreeDestinations,
      visaInfoSummary: ctx.visaInfoSummary || undefined,
      referenceCatalog: referenceResult.referenceCatalog,
      locationGuidance: referenceResult.locationGuidance
    }

    const systemPrompt = buildJourneyPrompt(promptArgs)
    const enhancedInput = this.buildEnhancedInput(input, estimatedDays, ctx.language)

    logger.log('  ⏳ 正在调用AI生成基础框架...')
    let parsed: Itinerary
    
    try {
      // 优化：减少 max_tokens 以加快响应速度
      const maxTokens = Math.min(calcFrameworkMaxTokens(estimatedDays), 3000)
      logger.log(`  📊 使用 max_tokens: ${maxTokens}`)
      
      const response = await llm.jsonFromLLM(systemPrompt, enhancedInput, {
        temperature: 0.8,
        max_tokens: maxTokens
      })

      // jsonFromLLM 已经返回解析后的对象，不需要再次解析
      if (!response || typeof response !== 'object') {
        logger.error('❌ AI 返回的不是对象:', typeof response)
        throw new Error('AI 返回的内容格式不正确')
      }

      parsed = response as Itinerary
      
      // 验证基本结构
      if (!parsed.title || !parsed.destination) {
        logger.warn('⚠️ AI 返回的数据缺少必要字段，尝试修复...')
        // 提供默认值
        parsed.title = parsed.title || '旅行灵感'
        parsed.destination = parsed.destination || selectedDestination || '目的地'
      }

      // 同步 duration 字段
      if (parsed.days && Array.isArray(parsed.days)) {
        parsed.duration = parsed.days.length
      } else if (parsed.duration && !parsed.days) {
        // 如果只有 duration 没有 days，创建空的 days 数组
        parsed.days = []
      }

      logger.log(`  ✅ 框架生成成功: ${parsed.days?.length || 0} 天`)
    } catch (error: any) {
      logger.error('❌ 生成框架失败:', error)
      logger.error(`   错误详情: ${error?.message || '未知错误'}`)
      
      // 如果解析失败，提供最小框架
      logger.warn('⚠️ 使用最小框架作为回退')
      parsed = {
        title: ctx.language.startsWith('en') ? 'Travel Inspiration' : '旅行灵感',
        destination: selectedDestination || '目的地',
        duration: estimatedDays,
        summary: ctx.language.startsWith('en') 
          ? 'Unable to generate full framework. Please try again.'
          : '无法生成完整框架，请重试。',
        psychologicalFlow: [],
        coreInsight: '',
        days: Array.from({ length: estimatedDays }, (_, i) => ({
          day: i + 1,
          date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          theme: '',
          mood: '',
          summary: '',
          psychologicalStage: '',
          timeSlots: []
        }))
      }
    }

    return parsed
  }

  /**
   * 为所有天数生成详细信息（串行）
   * 优化：对于多天行程，可以分批生成以提高响应速度
   */
  private async generateDayDetailsForAllDays(
    framework: Itinerary,
    intent: IntentResult,
    ctx: TravelContext,
    selectedDestination?: string
  ): Promise<Itinerary> {
    const { llm, jsonParser, logger } = this.deps
    const destination = framework.destination || selectedDestination || '目的地'

    const result = { ...framework, days: [...framework.days] }
    const totalDays = result.days.length

    // 优化：如果天数较多，先快速生成前3天，让用户看到进度
    const quickDays = Math.min(3, totalDays)
    const remainingDays = totalDays - quickDays

    logger.log(`\n  📍 开始生成 ${totalDays} 天的详细信息...`)
    if (totalDays > 3) {
      logger.log(`  ⚡ 优化策略：先快速生成前 ${quickDays} 天，剩余 ${remainingDays} 天继续生成`)
    }

    for (let i = 0; i < result.days.length; i++) {
      const baseDay = result.days[i]
      const isQuickMode = i < quickDays
      
      logger.log(`\n  📍 [${i + 1}/${totalDays}] 生成第${i + 1}天的详细地理位置信息...`)

      const previousDays = i > 0 ? result.days.slice(0, i) : []

      const promptArgs = {
        dayIndex: i + 1,
        baseDay,
        context: {
          destination,
          intentType: intent.intentType,
          emotionTone: intent.emotionTone,
          language: ctx.language,
          previousDays,
          transportPreference: ctx.transportPreference
        }
      }

      const { system, user } = buildDayDetailsPrompt(promptArgs)

      try {
        // 优化：减少 max_tokens 以加快响应速度
        // 对于多天行程，进一步减少 token 限制
        const maxTokens = totalDays > 3 
          ? Math.min(calcDayDetailsMaxTokens(), 2500) 
          : Math.min(calcDayDetailsMaxTokens(), 3000)
        
        const response = await llm.jsonFromLLM(system, user, {
          temperature: 0.8,
          max_tokens: maxTokens,
          fallbackArrays: ['timeSlots'] // 只尝试提取 timeSlots，不尝试 days
        })

        // jsonFromLLM 已经返回解析后的对象
        if (!response || typeof response !== 'object') {
          logger.warn(`     ⚠️ 第 ${i + 1} 天返回格式不正确，跳过`)
          continue
        }

        // 处理不同的响应格式：
        // 1. { day: 1, timeSlots: [...] } - 标准格式
        // 2. { timeSlots: [...] } - 提取后的格式
        // 3. timeSlots 数组直接作为响应（不应该发生，但处理一下）
        let timeSlots: any[] = []
        
        if (Array.isArray(response)) {
          // 如果响应直接是数组，假设是 timeSlots
          timeSlots = response
        } else if ('timeSlots' in response && Array.isArray((response as any).timeSlots)) {
          timeSlots = (response as any).timeSlots
        } else if (Array.isArray((response as any).days) && (response as any).days.length > 0) {
          // 如果返回的是 days 数组，尝试提取第一个 day 的 timeSlots
          const firstDay = (response as any).days[0]
          if (firstDay && Array.isArray(firstDay.timeSlots)) {
            timeSlots = firstDay.timeSlots
          }
        }

        if (timeSlots.length > 0) {
          // 过滤并创建安全副本
          const safeTimeSlots = timeSlots
            .filter((slot: any) => slot && typeof slot === 'object' && !Array.isArray(slot))
            .map((slot: any) => ({ ...slot }))

          result.days[i] = {
            ...baseDay,
            timeSlots: safeTimeSlots
          }

          logger.log(`     ✅ 生成完成，${safeTimeSlots.length}个时间段`)
        } else {
          logger.warn(`     ⚠️ 第 ${i + 1} 天未找到有效的 timeSlots，保留基础框架`)
        }
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error(`     ❌ 生成失败:`, err)
        // 保留基础框架，不抛出错误，继续处理下一天
      }

      // 优化：减少延迟时间，快速模式下不延迟
      if (i < result.days.length - 1 && !isQuickMode) {
        await new Promise(resolve => setTimeout(resolve, 50)) // 从 100ms 减少到 50ms
      }
    }

    return result
  }

  /**
   * 为所有时间段生成 Tips（并发，限制并发数）
   */
  private async generateTipsForAllSlots(
    itinerary: Itinerary,
    ctx: TravelContext
  ): Promise<Itinerary> {
    const { llm, jsonParser, logger } = this.deps
    const result = { ...itinerary, days: [...itinerary.days] }
    const CONCURRENT_LIMIT = 4 // 并发上限

    for (let i = 0; i < result.days.length; i++) {
      const day = result.days[i]
      if (!day.timeSlots || day.timeSlots.length === 0) continue

      const currentDate = new Date(day.date || new Date().toISOString().split('T')[0])
      const month = currentDate.getMonth() + 1
      const season = pickSeason(month, ctx.language)

      // 分批并发处理
      const slots = day.timeSlots
      for (let j = 0; j < slots.length; j += CONCURRENT_LIMIT) {
        const batch = slots.slice(j, j + CONCURRENT_LIMIT)
        const tipsPromises = batch.map(async (slot: any, slotIndex: number) => {
          try {
            if (!slot || typeof slot !== 'object' || Array.isArray(slot)) {
              return null
            }

            const promptArgs = {
              slot,
              context: {
                destination: itinerary.destination,
                dayIndex: i + 1,
                date: day.date || '',
                season,
                language: ctx.language
              }
            }

            const { system, user } = buildOutfitTipsPrompt(promptArgs)
            const tips = await llm.jsonFromLLM(system, user, {
              temperature: 0.7,
              max_tokens: 500
            })

            // jsonFromLLM 已经返回解析后的对象
            if (!tips || typeof tips !== 'object') {
              logger.warn(`       ⚠️ Tips 返回格式不正确`)
              return null
            }

            const parsed = tips as {
              outfitSuggestions?: string
              culturalTips?: string
            }

            if (parsed) {
              // 安全地设置 recommendations
              if (!slot.details) slot.details = {}
              if (!slot.details.recommendations || typeof slot.details.recommendations !== 'object' || Array.isArray(slot.details.recommendations)) {
                slot.details.recommendations = {}
              }

              if (parsed.outfitSuggestions) {
                slot.details.recommendations.outfitSuggestions = parsed.outfitSuggestions
              }
              if (parsed.culturalTips) {
                slot.details.recommendations.culturalTips = parsed.culturalTips
              }
            }

            return parsed
          } catch (error) {
            logger.warn(`       ⚠️ Tips 生成失败:`, error)
            return null
          }
        })

        await Promise.all(tipsPromises)
      }

      result.days[i] = { ...day, timeSlots: slots }
    }

    return result
  }

  /**
   * 校验和修复
   */
  private validateAndFix(itinerary: Itinerary): Itinerary {
    // 同步 duration
    if (itinerary.days && Array.isArray(itinerary.days)) {
      itinerary.duration = itinerary.days.length
    }

    // 确保 recommendations 结构存在
    for (const day of itinerary.days || []) {
      for (const slot of day.timeSlots || []) {
        if (!slot.details) slot.details = {}
        if (!slot.details.recommendations || typeof slot.details.recommendations !== 'object' || Array.isArray(slot.details.recommendations)) {
          slot.details.recommendations = {}
        }
      }
    }

    return itinerary
  }

  /**
   * 构建增强的用户输入
   */
  private buildEnhancedInput(input: string, estimatedDays: number, language: string): string {
    const isEnglish = language.startsWith('en')
    const frameworkNote = isEnglish
      ? `\n\n⚠️ FIRST STAGE: Generate the framework structure for ${estimatedDays} days:
- Include: title, destination, duration, summary, psychologicalFlow, coreInsight
- For each day: day number, date, theme, mood, summary, psychologicalStage
- You can include basic timeSlots structure, but detailed location information will be generated separately
- Focus on the psychological journey and daily themes, not detailed addresses/transportation`
      : `\n\n⚠️ 第一阶段：生成${estimatedDays}天的基础框架结构：
- 包含：title, destination, duration, summary, psychologicalFlow, coreInsight
- 每天：day number, date, theme, mood, summary, psychologicalStage
- 可以包含基本的timeSlots结构，但详细的地理位置信息将单独生成
- 专注于心理旅程和每日主题，而非详细地址/交通信息`

    return isEnglish
      ? `${input}\n\n⚠️ IMPORTANT REMINDER: Please ensure you generate exactly ${estimatedDays} days. The "days" array MUST contain ${estimatedDays} day objects.${frameworkNote}`
      : `${input}\n\n⚠️ 重要提醒：请确保生成恰好${estimatedDays}天的完整行程，days数组必须包含${estimatedDays}个day对象。${frameworkNote}`
  }
}

// ==================== 导出函数 ====================

/**
 * 创建旅程生成服务实例
 */
export function createJourneyService(deps?: Partial<JourneyServiceDeps>): JourneyService {
  const defaultDeps: JourneyServiceDeps = {
    llm: new DeepSeekClient(),
    jsonParser: JSONProcessor,
    logger: new LoggingAdapter(false)
  }

  return new JourneyService({ ...defaultDeps, ...deps })
}

