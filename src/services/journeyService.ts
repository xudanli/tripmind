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
import { reverseGeocodeToChinese, reverseGeocodeToEnglish } from '@/utils/geocode'
import { fetchTransportInsights, fetchPricingInsights } from '@/services/locationInsights'
import { fetchFestivalEvents, type FestivalEvent } from '@/services/eventInsights'
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

    // 4.1 基于地理位置信息生成景点简介
    const itineraryWithNarratives = await this.generateScenicIntrosForAllSlots(
      itineraryWithDetails,
      ctx
    )

    const itineraryWithTransport = await this.generateTransportGuidesForAllSlots(
      itineraryWithNarratives,
      ctx
    )

    // 5. 生成 Tips（可选，如果用户需要快速响应可以跳过或异步生成）
    // 优化：Tips 生成改为可选，先返回基本行程，Tips 可以后续异步补充
    let finalItinerary = itineraryWithTransport
    
    // 如果天数较少（<=3天），生成 Tips；否则先返回基本行程
    if (estimatedDays <= 3) {
      finalItinerary = await this.generateTipsForAllSlots(
        itineraryWithTransport,
        ctx
      )
    } else {
      logger.log('  ⏭️ 跳过 Tips 生成以加快响应速度（天数较多）')
      // 异步生成 Tips，不阻塞主流程
      this.generateTipsForAllSlots(itineraryWithTransport, ctx).catch(err => {
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
    const { llm, logger } = this.deps

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
      const isJsonParseIssue = error instanceof Error && error.message.includes('无法解析 LLM 返回的 JSON')
      const log = isJsonParseIssue ? logger.warn.bind(logger) : logger.error.bind(logger)
      log(isJsonParseIssue ? '⚠️ AI 框架输出不完整，改用安全回退' : '❌ 生成框架失败:', error)
      log(`   错误详情: ${error?.message || '未知错误'}`)
      
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
        const baseMaxTokens = totalDays > 3
          ? Math.min(calcDayDetailsMaxTokens(), 2500) 
          : Math.min(calcDayDetailsMaxTokens(), 3000)
        
        let attempt = 0
        let effectiveSystem = system
        let options: Record<string, any> = {
          temperature: 0.8,
          max_tokens: baseMaxTokens,
          fallbackArrays: ['timeSlots']
        }
        let extractedSlots: any[] = []
        let lastError: unknown = null

        while (attempt < 2 && extractedSlots.length === 0) {
          try {
            const response = await llm.jsonFromLLM(effectiveSystem, user, options)

        if (!response || typeof response !== 'object') {
          logger.warn(`     ⚠️ 第 ${i + 1} 天返回格式不正确，跳过`)
              break
        }

            // 处理不同的响应格式
        if (Array.isArray(response)) {
              extractedSlots = response
        } else if ('timeSlots' in response && Array.isArray((response as any).timeSlots)) {
              extractedSlots = (response as any).timeSlots
        } else if (Array.isArray((response as any).days) && (response as any).days.length > 0) {
          const firstDay = (response as any).days[0]
          if (firstDay && Array.isArray(firstDay.timeSlots)) {
                extractedSlots = firstDay.timeSlots
          }
        }

            if (extractedSlots.length === 0 && attempt === 0) {
              logger.warn(`     ⚠️ 第 ${i + 1} 天未获得有效的 timeSlots，尝试以精简模式重试`)
            }
          } catch (err) {
            lastError = err
            if (attempt === 0) {
              logger.warn(`     ⚠️ 第 ${i + 1} 天 JSON 解析失败，将尝试使用严格精简模式重试`)
            }
          }

          if (extractedSlots.length === 0 && attempt === 0) {
            effectiveSystem += `

CRITICAL REMINDER:
- Return NO MORE THAN 3 timeSlots.
- Keep every string short (≤ 30 words / 2 sentences).
- Prefer omitting optional sub-fields over lengthy descriptions.
- Ensure the JSON object is fully closed.`
            options = {
              ...options,
              strict: true,
              temperature: Math.max(0.6, (options.temperature ?? 0.8) - 0.1),
              max_tokens: Math.max(1800, Math.min((options.max_tokens ?? baseMaxTokens) - 200, 2200))
            }
            attempt += 1
          } else {
            break
          }
        }

        if (extractedSlots.length > 0) {
          const safeTimeSlots = extractedSlots
            .filter((slot: any) => slot && typeof slot === 'object' && !Array.isArray(slot))
            .map((slot: any) => ({ ...slot }))

          result.days[i] = {
            ...baseDay,
            timeSlots: safeTimeSlots
          }

          logger.log(`     ✅ 生成完成，${safeTimeSlots.length}个时间段`)
        } else {
          if (lastError) {
            const err = lastError instanceof Error ? lastError : new Error(String(lastError))
            logger.warn(`     ⚠️ 精简重试后仍未获得有效 JSON：${err.message}`)
          }
          logger.warn(`     ⚠️ 第 ${i + 1} 天未找到有效的 timeSlots，使用模板填充`)
          const fallbackSlots = this.buildFallbackTimeSlots(baseDay, destination, ctx.language, i)
          result.days[i] = {
            ...baseDay,
            timeSlots: fallbackSlots
          }
        }
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error))
        const isJsonParseIssue = err.message?.includes('无法解析 LLM 返回的 JSON')
        const log = isJsonParseIssue ? logger.warn.bind(logger) : logger.error.bind(logger)
        log(isJsonParseIssue ? `     ⚠️ JSON 输出不完整，已使用模板填充` : `     ❌ 生成失败:`, err)
        // 保留基础框架，不抛出错误，继续处理下一天
      }

      // 优化：减少延迟时间，快速模式下不延迟
      if (i < result.days.length - 1 && !isQuickMode) {
        await new Promise(resolve => setTimeout(resolve, 50)) // 从 100ms 减少到 50ms
      }
    }

    return result
  }

  private buildFallbackTimeSlots(baseDay: any, destination: string, language: string, index: number): any[] {
    const isEnglish = language.startsWith('en')
    const toText = (value: any) => (typeof value === 'string' ? value.trim() : '')
    const theme = toText(baseDay?.theme || baseDay?.summary)
    const focusLocation = toText(
      baseDay?.details?.address?.chinese ||
      baseDay?.details?.address?.english ||
      baseDay?.location ||
      destination
    )
    const dayLabel = isEnglish ? `Day ${index + 1}` : `第${index + 1}天`
    const baseTitle = theme || (isEnglish ? `${dayLabel} Journey` : `${dayLabel} 灵感之旅`)

    const slots = [
      {
        time: '09:00',
        title: isEnglish ? 'Morning Prelude' : '晨间预热',
        icon: '🌅',
        notes: isEnglish
          ? 'Begin the day with a gentle warm-up walk. Allow your senses to attune to the surroundings.'
          : '以一段轻松的晨间漫步开启旅程，让感官与城市的节奏同步。'
      },
      {
        time: '12:30',
        title: isEnglish ? 'Local Taste' : '风味午后',
        icon: '🍽️',
        notes: isEnglish
          ? 'Choose a recommended local bistro or café. Slow down, taste, and recharge for the afternoon.'
          : '挑选口碑良好的餐馆或咖啡馆，慢下来体味风味，也为下午蓄积能量。'
      },
      {
        time: '15:30',
        title: isEnglish ? 'Immersive Discovery' : '灵感探索',
        icon: '✨',
        notes: isEnglish
          ? 'Dive into the key highlight of the day. No rush—immerse yourself in the experience.'
          : '投入当日的核心亮点体验，让自己充分浸润其中，不必匆忙。'
      },
      {
        time: '19:00',
        title: isEnglish ? 'Evening Reflection' : '夜色沉思',
        icon: '🌙',
        notes: isEnglish
          ? 'Hold a gentle evening ritual. Recall three moments that touched you today.'
          : '以一段温柔的夜间仪式收官，回想今天触动你的三个瞬间。'
      }
    ]

    return slots.map((slot) => ({
      time: slot.time,
      title: `${slot.title} · ${baseTitle}`,
      activity: `${slot.title} · ${baseTitle}`,
      location: focusLocation,
      icon: slot.icon,
      duration: 90,
      notes: slot.notes
    }))
  }

  /**
   * 基于地理位置信息生成景点简介（并发，限制并发数）
   */
  private async generateScenicIntrosForAllSlots(
    itinerary: Itinerary,
    ctx: TravelContext
  ): Promise<Itinerary> {
    const { llm, logger } = this.deps
    const result = { ...itinerary, days: [...(itinerary.days || [])] }
    const language = ctx.language || 'zh-CN'
    const isEnglish = language.startsWith('en')
    const CONCURRENT_LIMIT = 3

    const sanitizeText = (text: string) =>
      text
        .replace(/^[\s-•·]+/, '')
        .replace(/\s+/g, ' ')
        .trim()

    const geocodeCache = new Map<string, { zh?: string | null; en?: string | null }>()
    const translationCache = new Map<string, string>()

    const hasChineseCharacters = (value: string | null | undefined): boolean => {
      if (!value) return false
      return /[\u4e00-\u9fa5]/.test(value)
    }

    const fetchGeocodeLabels = async (lat: number, lng: number) => {
      const key = `${lat.toFixed(4)},${lng.toFixed(4)}`
      if (geocodeCache.has(key)) {
        return geocodeCache.get(key)!
      }
      const [zh, en] = await Promise.all([
        reverseGeocodeToChinese(lat, lng).catch(() => null),
        reverseGeocodeToEnglish(lat, lng).catch(() => null),
      ])
      const payload = { zh, en }
      geocodeCache.set(key, payload)
      return payload
    }

    const translateNameToChinese = async (name: string): Promise<string | null> => {
      if (!name || !/[A-Za-z]/.test(name)) return null
      const cacheKey = name.trim().toLowerCase()
      if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey) ?? null
      }
      try {
        const response = await llm.callLLM(
          `You are a bilingual travel translator. Convert international attraction names into their widely accepted Simplified Chinese names. 
Return ONLY the translated name (≤ 8 Chinese characters). If the input already contains Chinese, return it unchanged.`,
          `Translate this attraction name into Simplified Chinese:\n${name}`,
          {
            temperature: 0.3,
            max_tokens: 60,
          }
        )
        const translated = typeof response.content === 'string' ? response.content.trim() : ''
        const result = translated && hasChineseCharacters(translated) ? translated.replace(/[\s\n]+/g, '') : null
        translationCache.set(cacheKey, result ?? '')
        return result
      } catch (error) {
        logger.warn('       ⚠️ 景点名称翻译失败:', error)
        translationCache.set(cacheKey, '')
        return null
      }
    }

    const festivalCache = new Map<string, FestivalEvent[] | null>()

    const fetchFestivalForDay = async (destination: string, date: string) => {
      const key = `${destination}::${date}`
      if (festivalCache.has(key)) {
        return festivalCache.get(key) || []
      }
      const start = new Date(date)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      const events = await fetchFestivalEvents({
        destination,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        language: ctx.language,
        limit: 5,
      })
      festivalCache.set(key, events)
      return events
    }

    for (let i = 0; i < result.days.length; i++) {
      const day = result.days[i]
      if (!day || !Array.isArray(day.timeSlots) || day.timeSlots.length === 0) continue

      for (let j = 0; j < day.timeSlots.length; j += CONCURRENT_LIMIT) {
        const batch = day.timeSlots.slice(j, j + CONCURRENT_LIMIT)

        await Promise.all(
          batch.map(async (slot: any) => {
            try {
              if (!slot || typeof slot !== 'object' || Array.isArray(slot)) return

              const existingSummary = typeof slot.summary === 'string' ? slot.summary.trim() : ''
              const existingIntro =
                typeof slot.details?.description?.scenicIntro === 'string'
                  ? slot.details.description.scenicIntro.trim()
                  : ''

              if (existingSummary.length >= 12 || existingIntro.length >= 12) {
                return
              }

              const coords =
                slot.coordinates ||
                slot.location?.coordinates ||
                slot.details?.coordinates ||
                null

              if (
                !coords ||
                typeof coords.lat !== 'number' ||
                typeof coords.lng !== 'number' ||
                Number.isNaN(coords.lat) ||
                Number.isNaN(coords.lng)
              ) {
                // 没有地理坐标时暂不生成简介，确保在获取地理信息之后执行
                return
              }

              const nameCandidates = [
                slot.title,
                slot.activity,
                slot.location,
                slot.details?.name?.chinese,
                slot.details?.name?.english,
                slot.details?.name?.local,
              ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
              const spotName = nameCandidates[0]
              if (!spotName) return

              const { zh: geocodeZh, en: geocodeEn } = await fetchGeocodeLabels(coords.lat, coords.lng)

              const needsChineseName =
                !hasChineseCharacters(slot.details?.name?.chinese) ||
                (slot.details?.name?.chinese && /[A-Za-z]/.test(slot.details.name.chinese))
              if (needsChineseName) {
                const translated = await translateNameToChinese(spotName)
                if (translated) {
                  if (!slot.details) slot.details = {}
                  if (!slot.details.name || typeof slot.details.name !== 'object') {
                    slot.details.name = {}
                  }
                  slot.details.name.chinese = translated
                }
              }

              if (!slot.details) slot.details = {}
              if (!slot.details.address || typeof slot.details.address !== 'object') {
                slot.details.address = {}
              }
              if (geocodeZh && !hasChineseCharacters(slot.details.address.chinese)) {
                slot.details.address.geocodedChinese = geocodeZh
              }
              if (geocodeEn && (!slot.details.address.english || slot.details.address.english.length < 4)) {
                slot.details.address.geocodedEnglish = geocodeEn
              }

              const addressCandidates = [
                slot.details?.address?.chinese,
                slot.details?.address?.english,
                slot.details?.address?.local,
                (slot.details?.address as any)?.geocodedChinese,
                (slot.details?.address as any)?.geocodedEnglish,
              ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0)

              const coordinateLabel = `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
              const activityText =
                typeof slot.activity === 'string'
                  ? slot.activity
                  : Array.isArray(slot.activity)
                  ? slot.activity.join(isEnglish ? ', ' : '、')
                  : ''
              const locationText =
                typeof slot.location === 'string'
                  ? slot.location
                  : Array.isArray(slot.location)
                  ? slot.location.join(isEnglish ? ', ' : '、')
                  : ''
              const notesText =
                typeof slot.notes === 'string'
                  ? slot.notes
                  : Array.isArray(slot.notes)
                  ? slot.notes.join(isEnglish ? ', ' : '、')
                  : ''
              const localTipsText =
                typeof slot.localTip === 'string'
                  ? slot.localTip
                  : Array.isArray(slot.localTip)
                  ? slot.localTip.join(isEnglish ? ', ' : '、')
                  : ''

              const systemPrompt = isEnglish
                ? `You are a poetic yet concise travel copywriter. Craft vivid scenic introductions that highlight emotional resonance, sensory details, and why the traveller should stop there. Respond in English using at most two sentences (max 55 words).`
                : `你是一名富有画面感的旅行文案。请以中文写出景点简介，强调氛围、感官体验与停留理由，语气温柔友好。限制在1-2句，总字数不超过60字。`

              const userPrompt = [
                isEnglish
                  ? `Destination: ${result.destination || ''}`
                  : `目的地：${result.destination || ''}`,
                isEnglish ? `Day theme: ${day.theme || ''}` : `当日主题：${day.theme || ''}`,
                isEnglish ? `Mood: ${day.mood || ''}` : `情绪锚点：${day.mood || ''}`,
                isEnglish
                  ? `Psychological stage: ${day.psychologicalStage || ''}`
                  : `心理阶段：${day.psychologicalStage || ''}`,
                isEnglish ? `Spot: ${spotName}` : `景点：${spotName}`,
                activityText ? (isEnglish ? `Activity: ${activityText}` : `活动内容：${activityText}`) : '',
                locationText ? (isEnglish ? `Nearby area: ${locationText}` : `附近区域：${locationText}`) : '',
                notesText ? (isEnglish ? `Traveller notes: ${notesText}` : `旅行者备注：${notesText}`) : '',
                localTipsText ? (isEnglish ? `Local tip: ${localTipsText}` : `本地提示：${localTipsText}`) : '',
                addressCandidates.length
                  ? isEnglish
                    ? `Nearby address: ${addressCandidates.join(' / ')}`
                    : `附近地址：${addressCandidates.join(' / ')}`
                  : '',
                isEnglish ? `Coordinates: ${coordinateLabel}` : `地理坐标：${coordinateLabel}`,
                isEnglish
                  ? 'Output: Craft an inviting short introduction in English.'
                  : '输出要求：写成邀请式的短句，使用中文。',
              ]
                .filter(Boolean)
                .join('\n')

              const response = await llm.callLLM(systemPrompt, userPrompt, {
                temperature: 0.65,
                max_tokens: isEnglish ? 160 : 180,
              })

              const generated = typeof response.content === 'string' ? sanitizeText(response.content) : ''
              if (!generated) return

              if (!slot.details || typeof slot.details !== 'object') {
                slot.details = {}
              }
              if (!slot.details.description || typeof slot.details.description !== 'object') {
                slot.details.description = {}
              }

              slot.details.description.scenicIntro = generated
              // 若原本没有 summary，则填充
              if (!existingSummary) {
                slot.summary = generated
              }
            } catch (error) {
              logger.warn('       ⚠️ 景点简介生成失败:', error)
            }
          })
        )
      }

      const primarySlot = day.timeSlots?.[0]
      if (primarySlot) {
        const eventQuery =
          itinerary.destination ||
          primarySlot.details?.address?.english ||
          primarySlot.details?.address?.chinese ||
          primarySlot.details?.name?.english ||
          primarySlot.details?.name?.chinese ||
          primarySlot.location ||
          primarySlot.title ||
          primarySlot.activity ||
          ''

        if (eventQuery) {
          const events = await fetchFestivalForDay(eventQuery, day.date)
          if (events.length) {
            if (!primarySlot.details) primarySlot.details = {}
            if (!primarySlot.details.operational || typeof primarySlot.details.operational !== 'object') {
              primarySlot.details.operational = {}
            }
            const operational = primarySlot.details.operational as Record<string, any>
            operational.events = events.map((item) =>
              item.mood ? `${item.name} · ${item.mood}` : item.name
            )
            const firstEvent = events[0]
            if (firstEvent) {
              operational.eventsSource = firstEvent.source
              operational.eventsFetchedAt = firstEvent.fetchedAt
            }
            operational.eventsSubscribeUrl = `https://www.eventbrite.com/d/online/${encodeURIComponent(
              eventQuery
            )}-events/`
            if (import.meta.env.DEV) {
              console.info('[JourneyService] Festival events attached', {
                day: day.date,
                destination: eventQuery,
                events: operational.events,
              })
            }
          }
        }
      }

      result.days[i] = { ...day, timeSlots: [...day.timeSlots] }
    }

    return result
  }

  /**
   * 基于地理位置与现有信息生成交通引导
   */
  private async generateTransportGuidesForAllSlots(
    itinerary: Itinerary,
    ctx: TravelContext
  ): Promise<Itinerary> {
    const { llm, logger } = this.deps
    const result = { ...itinerary, days: [...(itinerary.days || [])] }
    const language = ctx.language || 'zh-CN'
    const isEnglish = language.startsWith('en')
    const CONCURRENT_LIMIT = 3

    const normalizeOptions = (value: unknown): string[] => {
      if (!value) return []
      if (Array.isArray(value)) {
        return value
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter(Boolean)
      }
      if (typeof value === 'string') {
        return value
          .split(/[\n\r]+/)
          .map((item) => item.replace(/^•\s*/, '').trim())
          .filter(Boolean)
      }
      return []
    }

    for (let i = 0; i < result.days.length; i++) {
      const day = result.days[i]
      if (!day || !Array.isArray(day.timeSlots) || day.timeSlots.length === 0) continue

      for (let j = 0; j < day.timeSlots.length; j += CONCURRENT_LIMIT) {
        const batch = day.timeSlots.slice(j, j + CONCURRENT_LIMIT)

        await Promise.all(
          batch.map(async (slot: any) => {
            try {
              if (!slot || typeof slot !== 'object' || Array.isArray(slot)) return

              if (!slot.details || typeof slot.details !== 'object') {
                slot.details = {}
              }
              if (!slot.details.transportation || typeof slot.details.transportation !== 'object') {
                slot.details.transportation = {}
              }

              const transport = slot.details.transportation

              if (!slot.details.operational || typeof slot.details.operational !== 'object') {
                slot.details.operational = {}
              }
              const operational = slot.details.operational as Record<string, any>

              const originLocation = itinerary.destination || ctx.userCountry || ''
              const destinationName =
                slot.details?.name?.english ||
                slot.details?.name?.chinese ||
                slot.details?.address?.english ||
                slot.details?.address?.chinese ||
                slot.location ||
                slot.title ||
                slot.activity ||
                ''

              if (destinationName) {
                if (
                  (!transport.enhancedSummary || !transport.enhancedSummary.trim()) ||
                  !Array.isArray(transport.options) ||
                  !transport.options.length
                ) {
                  const transportData = await fetchTransportInsights({
                    origin: originLocation,
                    destination: destinationName,
                    language: ctx.language,
                  })
                  if (transportData) {
                    if (transportData.summary) transport.enhancedSummary = transportData.summary
                    if (transportData.options?.length) {
                      transport.options = transportData.options.slice(0, 4)
                    }
                    operational.transportSource = transportData.source
                    operational.transportFetchedAt = transportData.fetchedAt
                  }
                }

                if (!Array.isArray(operational.pricing) || !operational.pricing.length) {
                  const pricingData = await fetchPricingInsights({
                    query: destinationName,
                    language: ctx.language,
                  })
                  if (pricingData) {
                    operational.pricing = pricingData.lines
                    operational.pricingSource = pricingData.source
                    operational.pricingFetchedAt = pricingData.fetchedAt

                    if (pricingData.rating) {
                      if (!slot.details.rating || typeof slot.details.rating !== 'object') {
                        slot.details.rating = {}
                      }
                      const ratingObj = slot.details.rating as Record<string, any>
                      if (pricingData.rating.score !== undefined) ratingObj.score = pricingData.rating.score
                      if (pricingData.rating.reviewCount !== undefined) {
                        ratingObj.reviewCount = pricingData.rating.reviewCount
                      }
                      if (pricingData.rating.platform) {
                        ratingObj.platform = pricingData.rating.platform
                      }
                    }
                  }
                }
              }

              const coords =
                slot.coordinates ||
                slot.location?.coordinates ||
                slot.details?.coordinates ||
                null

              const hasSummary =
                typeof transport.enhancedSummary === 'string' && transport.enhancedSummary.trim()
              const hasOptions = Array.isArray(transport.options) && transport.options.length > 0
              const hasOperationalData =
                (Array.isArray(operational.opening) && operational.opening.length > 0) ||
                (Array.isArray(operational.pricing) && operational.pricing.length > 0) ||
                (Array.isArray(operational.reminders) && operational.reminders.length > 0)
              const hasRatingData =
                slot.details.rating &&
                typeof slot.details.rating === 'object' &&
                (Number.isFinite(Number(slot.details.rating.score)) ||
                  Number.isFinite(Number(slot.details.rating.reviewCount)))

              if (hasSummary && hasOptions && hasOperationalData && hasRatingData) {
                return
              }

              const nameCandidates = [
                slot.title,
                slot.activity,
                slot.details?.name?.chinese,
                slot.details?.name?.english,
              ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
              const spotName = nameCandidates[0] || ''

              const baseTransportData =
                transport && Object.keys(transport).length
                  ? JSON.stringify(transport, null, 2)
                  : '无结构化交通数据'

              const addressSummary = (() => {
                const addr = slot.details?.address
                if (!addr || typeof addr !== 'object') return ''
                const parts = [
                  addr.chinese,
                  (addr as any).geocodedChinese,
                  addr.english,
                  (addr as any).geocodedEnglish,
                  addr.local,
                ]
                  .map((value) => (typeof value === 'string' ? value.trim() : ''))
                  .filter(Boolean)
                return parts.join(' / ')
              })()

              const systemPrompt = isEnglish
                ? `You are a precise travel operations assistant. Given a location, produce practical guidance for visitors.
If reliable data is missing, state that clearly and suggest a safe next step (e.g., "Check with the venue directly").

Return ONLY JSON with this structure:
{
  "transport": {
    "summary": "Short overview sentence (≤ 22 words). No bullets.",
    "options": ["Option 1 (≤ 18 words)", "Option 2...", "..."]
  },
  "opening": ["Bullet about opening hours", "..."],
  "pricing": ["Adult ticket...", "Child ticket...", "..."],
  "rating": {
    "score": 4.5,               // use null if unknown
    "platform": "Tripadvisor",  // empty string if unknown
    "reviewCount": 123          // use null if unknown
  },
  "reminders": [
    "Check local transportation information",
    "Check opening hours",
    "Verify ticket prices (if applicable)",
    "Confirm activity details in advance"
  ]
}

All strings must be in English. Never fabricate precise numbers; approximate phrasing ("around", "approximately") is acceptable.`
                : `你是一名严谨的行程助手。请基于给定地点，为旅客生成实用的到访提示。
如信息缺失，务必明确指出并给出安全的下一步（例如「请向场馆确认」），不要自行杜撰。

只输出 JSON，必须符合以下结构：
{
  "transport": {
    "summary": "一句概述，≤18个汉字，不要使用项目符号。",
    "options": ["方式1（≤18个汉字）", "方式2...", "..."]
  },
  "opening": ["开放时间提示1", "开放时间提示2"],
  "pricing": ["成人票…", "儿童票…", "..."],
  "rating": {
    "score": 4.5,            // 若未知请使用 null
    "platform": "平台名称",  // 若未知请留空字符串
    "reviewCount": 123       // 若未知请使用 null
  },
  "reminders": [
    "请查询当地交通信息",
    "请查询开放时间",
    "请查询门票价格（如适用）",
    "建议提前查询活动信息"
  ]
}

所有内容必须使用中文，可用「约/大约」等表达估算值，禁止编造精确数字。`

              const contextLines = [
                isEnglish ? `Destination: ${itinerary.destination || ''}` : `目的地：${itinerary.destination || ''}`,
                isEnglish ? `Day theme: ${day.theme || ''}` : `当日主题：${day.theme || ''}`,
                spotName ? (isEnglish ? `Spot: ${spotName}` : `地点：${spotName}`) : '',
                addressSummary ? (isEnglish ? `Address hints: ${addressSummary}` : `地址提示：${addressSummary}`) : '',
                coords ? (isEnglish ? `Coordinates: ${coords.lat}, ${coords.lng}` : `坐标：${coords.lat}，${coords.lng}`) : '',
                isEnglish ? 'Existing transport data:' : '已有交通数据：',
                baseTransportData,
              ]
                .filter(Boolean)
                .join('\n')

              const transportResponse = await llm.jsonFromLLM(systemPrompt, contextLines, {
                temperature: 0.55,
                max_tokens: isEnglish ? 360 : 420,
                fallbackArrays: [],
              })

              if (!transportResponse || typeof transportResponse !== 'object') {
                logger.warn('       ⚠️ 交通生成返回格式不正确')
                return
              }

              const transportBlock = (transportResponse as any).transport || {}
              const summaryRaw = transportBlock.summary
              const optionsRaw = transportBlock.options
              const openingRaw = (transportResponse as any).opening
              const pricingRaw = (transportResponse as any).pricing
              const ratingRaw = (transportResponse as any).rating
              const remindersRaw = (transportResponse as any).reminders

              const summary =
                typeof summaryRaw === 'string'
                  ? summaryRaw.replace(/^[•\-\s]+/, '').trim()
                  : ''
              const options = normalizeOptions(optionsRaw)

              if (summary) {
                transport.enhancedSummary = summary
              }
              if (options.length) {
                transport.options = options
              }

              if (!slot.details.operational || typeof slot.details.operational !== 'object') {
                slot.details.operational = {}
              }

              const normalizeStrings = (value: unknown, minLength = 0): string[] => {
                if (!value) return []
                if (Array.isArray(value)) {
                  return value
                    .map((item) =>
                      typeof item === 'string' ? item.replace(/^[•\-\s]+/, '').trim() : ''
                    )
                    .filter((item) => item.length > minLength)
                }
                if (typeof value === 'string') {
                  return value
                    .split(/[\n\r]+/)
                    .map((item) => item.replace(/^[•\-\s]+/, '').trim())
                    .filter((item) => item.length > minLength)
                }
                return []
              }

              const openingLines = normalizeStrings(openingRaw)
              if (openingLines.length) {
                slot.details.operational.opening = openingLines
              }

              const pricingLines = normalizeStrings(pricingRaw)
              if (pricingLines.length) {
                slot.details.operational.pricing = pricingLines
              }

              const remindersLines = normalizeStrings(remindersRaw)
              if (remindersLines.length >= 4) {
                const canonicalReminders = isEnglish
                  ? [
                      'Check local transportation information',
                      'Check opening hours',
                      'Verify ticket prices (if applicable)',
                      'Confirm activity details in advance',
                    ]
                  : ['请查询当地交通信息', '请查询开放时间', '请查询门票价格（如适用）', '建议提前查询活动信息']
                const merged = new Set<string>(remindersLines)
                canonicalReminders.forEach((item) => merged.add(item))
                slot.details.operational.reminders = Array.from(merged)
              }

              if (ratingRaw && typeof ratingRaw === 'object') {
                const score = Number((ratingRaw as any).score)
                const reviewCount = Number((ratingRaw as any).reviewCount)
                const platform = typeof (ratingRaw as any).platform === 'string' ? (ratingRaw as any).platform.trim() : ''

                const ratingObj: any = {}
                if (Number.isFinite(score)) ratingObj.score = score
                if (Number.isFinite(reviewCount)) ratingObj.reviewCount = reviewCount
                if (platform) ratingObj.platform = platform

                if (Object.keys(ratingObj).length) {
                  if (!slot.details.rating || typeof slot.details.rating !== 'object') {
                    slot.details.rating = {}
                  }
                  Object.assign(slot.details.rating, ratingObj)
                }
              }
            } catch (error) {
              logger.warn('       ⚠️ 交通信息生成失败:', error)
            }
          })
        )
      }

      result.days[i] = { ...day, timeSlots: [...day.timeSlots] }
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

            const normalizeTipsString = (value: unknown, language: string): string | null => {
              if (!value) return null
              if (Array.isArray(value)) {
                const list = value
                  .map((item) => (typeof item === 'string' ? item.trim() : ''))
                  .filter(Boolean)
              if (list.length) {
                  return list.map((item) => (item.startsWith('•') ? item : `• ${item}`)).join('\n')
                }
              }

              if (typeof value === 'string') {
                const trimmed = value.trim()
                if (!trimmed) return null
                const newlineNormalized = trimmed.replace(/\\n/g, '\n')
                if (/^•\s?/m.test(newlineNormalized)) {
                  return newlineNormalized
                }

                const segments = newlineNormalized
                  .split(/[\n\r]+|[。！？!?.；;]+/)
                  .map((segment) => segment.trim())
                  .filter(Boolean)
                  .slice(0, 3)

                if (segments.length) {
                  return segments
                    .map((segment) => {
                      const limited =
                        language.startsWith('en') && segment.length > 60
                          ? segment.slice(0, 57).trim() + '…'
                          : !language.startsWith('en') && segment.length > 24
                          ? segment.slice(0, 23).trim() + '…'
                          : segment
                      return `• ${limited}`
                    })
                    .join('\n')
                }

                return `• ${newlineNormalized}`
              }

              return null
            }

            if (parsed) {
              // 安全地设置 recommendations
              if (!slot.details) slot.details = {}
              if (!slot.details.recommendations || typeof slot.details.recommendations !== 'object' || Array.isArray(slot.details.recommendations)) {
                slot.details.recommendations = {}
              }

              const formattedOutfit = normalizeTipsString(parsed.outfitSuggestions, ctx.language)
              if (formattedOutfit) {
                slot.details.recommendations.outfitSuggestions = formattedOutfit
              }
              const formattedCulture = normalizeTipsString(parsed.culturalTips, ctx.language)
              if (formattedCulture) {
                slot.details.recommendations.culturalTips = formattedCulture
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

