/**
 * 旅程生成服务
 * 负责框架生成、逐日细化、Tips 合并等核心业务逻辑
 */

import { DeepSeekClient } from '@/llm/deepseekClient'
import { LoggingAdapter } from '@/utils/inspiration/core/logger'
import { JSONProcessor } from '@/utils/inspiration/core/jsonProcessor'
import { isHighAltitudeRegion } from '@/utils/highAltitudeRegions'
import { buildReferenceCatalog } from '@/utils/inspiration/core/referenceCatalog'
import type { TravelContext } from '@/types/travel'
import type { IntentResult } from '@/validators/itinerarySchema'
import type { Itinerary } from '@/validators/itinerarySchema'
import { generateFramework } from './journey/frameworkGenerator'
import { generateDayDetailsForAllDays } from './journey/dayDetailsGenerator'
import { generateScenicIntrosForAllSlots } from './journey/scenicIntroGenerator'
import { generateTransportGuidesForAllSlots } from './journey/transportGenerator'
import { generateTipsForAllSlots } from './journey/tipsGenerator'
import { ARRIVAL_KEYWORDS } from './journey/constants'
import { ensureObject } from './journey/utils'

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
  mode?: 'full' | 'candidates'
}

// ==================== 旅程生成服务 ====================

export class JourneyService {
  constructor(private deps: JourneyServiceDeps) {}

  /**
   * 生成完整旅程（主入口）
   */
  async generateJourney(params: GenerateJourneyParams): Promise<Itinerary> {
    const {
      input,
      intent,
      ctx,
      selectedDestination,
      userRequestedDays,
      mode = 'full'
    } = params
    const { logger } = this.deps

    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    logger.log('🚀 开始生成灵感旅程')
    logger.log(`📝 用户输入: ${input.substring(0, 100)}${input.length > 100 ? '...' : ''}`)
    logger.log(`🌍 语言: ${ctx.language}`)
    const initialDestination =
      selectedDestination ||
      (intent.keywords && intent.keywords.length ? intent.keywords[0] : null) ||
      ''
    logger.log(`📍 原始目的地输入: ${initialDestination || '未指定'}`)
    logger.log(`🎯 生成模式: ${mode}`)

    // 1. 确定天数
    const estimatedDays = await this.determineDays(
      userRequestedDays,
      selectedDestination,
      intent
    )

    // 2. 构建参考目录
    const referenceResult = await buildReferenceCatalog(ctx.userCountry, ctx.language)

    // 3. 生成框架
    const framework = await generateFramework({
      input,
      intent,
      ctx,
      selectedDestination,
      estimatedDays,
      referenceCatalog: referenceResult.referenceCatalog,
      locationGuidance: referenceResult.locationGuidance,
      llm: this.deps.llm,
      logger: this.deps.logger,
    })
    const candidateAfterFramework = this.resolveDestination([
      framework.destination,
      selectedDestination,
      ...(Array.isArray((framework as any)?.locations) ? (framework as any).locations : []),
      intent.keywords?.find((keyword) => keyword && keyword.trim().length > 0) || null,
    ])
    framework.destination = candidateAfterFramework || framework.destination || selectedDestination || ''
    logger.log(`📍 目的地解析结果: ${framework.destination || '未识别'}`)

    if (mode === 'candidates') {
      logger.log('  ✅ 已生成候选目的地框架，跳过日程细化阶段')
      const validatedFramework = this.validateAndFix({ ...framework })
      return validatedFramework
    }

    // 4. 生成每日详情（串行，保证地理连续性）
    // 优化：如果天数较多（>5天），先快速生成前3天，让用户看到进度
    const itineraryWithDetails = await generateDayDetailsForAllDays({
      framework,
      intent,
      ctx,
      destination: framework.destination || selectedDestination || '未指定目的地',
      isHighAltitude: this.isHighAltitudeDestination(framework.destination || selectedDestination),
      llm: this.deps.llm,
      logger: this.deps.logger,
    })

    const itineraryWithoutDuplicateArrivals = this.removeDuplicateArrivalSlots(itineraryWithDetails)

    // 4.1 基于地理位置信息生成景点简介
    const itineraryWithNarratives = await generateScenicIntrosForAllSlots({
      itinerary: itineraryWithoutDuplicateArrivals,
      ctx,
      llm: this.deps.llm,
      logger: this.deps.logger,
    })

    const itineraryWithTransport = await generateTransportGuidesForAllSlots({
      itinerary: itineraryWithNarratives,
      ctx,
      llm: this.deps.llm,
      logger: this.deps.logger,
    })

    // 5. 生成 Tips（可选，如果用户需要快速响应可以跳过或异步生成）
    // 优化：Tips 生成改为可选，先返回基本行程，Tips 可以后续异步补充
    let finalItinerary = itineraryWithTransport
    
    if (estimatedDays <= 3) {
      finalItinerary = await generateTipsForAllSlots({
        itinerary: itineraryWithTransport,
        ctx,
        llm: this.deps.llm,
        logger: this.deps.logger,
      })
    } else {
      logger.log('  ⏭️ 跳过 Tips 生成以加快响应速度（天数较多）')
      generateTipsForAllSlots({
        itinerary: itineraryWithTransport,
        ctx,
        llm: this.deps.llm,
        logger: this.deps.logger,
      }).catch((err) => {
        logger.warn('  ⚠️ 异步生成 Tips 失败:', err)
      })
    }

    // 6. 校验和修复
    return this.validateAndFix(finalItinerary)
  }

  private resolveDestination(candidates: Array<string | null | undefined>): string | null {
    for (const candidate of candidates) {
      if (!candidate) continue
      const normalized = candidate.trim()
      if (!normalized) continue
      if (/未指定目的地|unknown/i.test(normalized)) continue
      return normalized
    }
    return null
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

  private removeDuplicateArrivalSlots(itinerary: Itinerary): Itinerary {
    if (!itinerary.days || !Array.isArray(itinerary.days)) return itinerary
    const cleanedDays = itinerary.days.map((day, index) => {
      if (!day || !Array.isArray(day.timeSlots) || day.timeSlots.length === 0) return day
      if (index === 0) return day
      const [firstSlot, ...restSlots] = day.timeSlots
      if (this.isArrivalSlot(firstSlot) && restSlots.length > 0) {
        return { ...day, timeSlots: [...restSlots] }
      }
      return day
    })
    return { ...itinerary, days: cleanedDays }
  }

  private isArrivalSlot(slot: any): boolean {
    if (!slot || typeof slot !== 'object') return false
    const typeText = `${slot.type || slot.category || ''}`.toLowerCase()
    if (typeText.includes('arrival')) return true
    if (typeText.includes('transport') && ARRIVAL_KEYWORDS.some(keyword => `${slot.title || slot.activity || ''}`.toLowerCase().includes(keyword.toLowerCase()))) {
      return true
    }
    const titleText = `${slot.title || ''}`.toLowerCase()
    const activityText = `${slot.activity || ''}`.toLowerCase()
    return ARRIVAL_KEYWORDS.some(keyword => titleText.includes(keyword.toLowerCase()) || activityText.includes(keyword.toLowerCase()))
  }

  private isHighAltitudeDestination(name: string | undefined): boolean {
    return isHighAltitudeRegion(name, 'high')
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
        const details = ensureObject<Record<string, any>>(slot.details, () => ({}))
        const recommendations = ensureObject<Record<string, any>>(details.recommendations, () => ({}))
        details.recommendations = recommendations
        slot.details = details
      }
    }

    return itinerary
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

