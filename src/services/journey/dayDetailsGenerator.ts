import { buildDayDetailsPrompt } from '@/prompts/inspiration/dayDetails'
import { calcDayDetailsMaxTokens } from '@/utils/tokens'
import { fetchFestivalEvents, type FestivalEvent } from '@/services/eventInsights'
import type { TravelContext } from '@/types/travel'
import type { IntentResult, Itinerary } from '@/validators/itinerarySchema'
import type { DeepSeekClient } from '@/llm/deepseekClient'
import type { LoggingAdapter } from '@/utils/inspiration/core/logger'

interface GenerateDayDetailsParams {
  framework: Itinerary
  intent: IntentResult
  ctx: TravelContext
  destination: string
  isHighAltitude: boolean
  llm: DeepSeekClient
  logger: LoggingAdapter
}

export async function generateDayDetailsForAllDays({
  framework,
  intent,
  ctx,
  destination,
  isHighAltitude,
  llm,
  logger,
}: GenerateDayDetailsParams): Promise<Itinerary> {
  const result = { ...framework, days: [...framework.days] }
  const totalDays = result.days.length

  if (totalDays === 0) {
    logger.warn('  ⚠️ 框架未包含任何天数，跳过详细生成')
    return result
  }

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
        transportPreference: ctx.transportPreference,
        allowArrivalSlot: i === 0,
        highAltitude: isHighAltitude && i === 0,
      },
    }

    const { system, user } = buildDayDetailsPrompt(promptArgs)

    try {
      const baseMaxTokens = totalDays > 3
        ? Math.min(calcDayDetailsMaxTokens(), 2500)
        : Math.min(calcDayDetailsMaxTokens(), 3000)

      let attempt = 0
      let effectiveSystem = system
      let options: Record<string, any> = {
        temperature: 0.8,
        max_tokens: baseMaxTokens,
        fallbackArrays: ['timeSlots'],
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
            max_tokens: Math.max(1800, Math.min((options.max_tokens ?? baseMaxTokens) - 200, 2200)),
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
          timeSlots: safeTimeSlots,
        }

        logger.log(`     ✅ 生成完成，${safeTimeSlots.length}个时间段`)
      } else {
        if (lastError) {
          const err = lastError instanceof Error ? lastError : new Error(String(lastError))
          logger.warn(`     ⚠️ 精简重试后仍未获得有效 JSON：${err.message}`)
        }
        logger.warn(`     ⚠️ 第 ${i + 1} 天未找到有效的 timeSlots，使用模板填充`)
        const fallbackSlots = buildFallbackTimeSlots(baseDay, destination, ctx.language, i)
        result.days[i] = {
          ...baseDay,
          timeSlots: fallbackSlots,
        }
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error))
      const isJsonParseIssue = err.message?.includes('无法解析 LLM 返回的 JSON')
      const log = isJsonParseIssue ? logger.warn.bind(logger) : logger.error.bind(logger)
      log(isJsonParseIssue ? `     ⚠️ JSON 输出不完整，已使用模板填充` : `     ❌ 生成失败:`, err)
    }

    if (i < result.days.length - 1 && !isQuickMode) {
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }

  await enrichFestivalEvents(result, ctx, destination, logger)
  return result
}

async function enrichFestivalEvents(
  itinerary: Itinerary,
  ctx: TravelContext,
  destination: string,
  logger: LoggingAdapter
): Promise<void> {
  const festivalCache = new Map<string, FestivalEvent[] | null>()

  const fetchFestivalForDay = async (query: string, date: string) => {
    const key = `${query}::${date}`
    if (festivalCache.has(key)) {
      return festivalCache.get(key) || []
    }
    const start = new Date(date)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    const events = await fetchFestivalEvents({
      destination: query,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      language: ctx.language,
      limit: 5,
    })
    festivalCache.set(key, events)
    return events
  }

  for (let i = 0; i < itinerary.days.length; i++) {
    const day = itinerary.days[i]
    if (!day || !Array.isArray(day.timeSlots) || day.timeSlots.length === 0) continue

    const primarySlot = day.timeSlots[0]
    if (!primarySlot) continue

    const eventQuery =
      destination ||
      primarySlot.details?.address?.english ||
      primarySlot.details?.address?.chinese ||
      primarySlot.details?.name?.english ||
      primarySlot.details?.name?.chinese ||
      primarySlot.location ||
      primarySlot.title ||
      primarySlot.activity ||
      ''

    if (!eventQuery) continue

    try {
      const events = await fetchFestivalForDay(eventQuery, day.date)
      if (!events.length) continue

      if (!primarySlot.details || typeof primarySlot.details !== 'object') {
        primarySlot.details = {}
      }
      if (!primarySlot.details.operational || typeof primarySlot.details.operational !== 'object') {
        primarySlot.details.operational = {}
      }

      const operational = primarySlot.details.operational as Record<string, any>
      operational.events = events.map((item) => (item.mood ? `${item.name} · ${item.mood}` : item.name))
      const firstEvent = events[0]
      if (firstEvent) {
        operational.eventsSource = firstEvent.source
        operational.eventsFetchedAt = firstEvent.fetchedAt
      }
      operational.eventsSubscribeUrl = `https://www.eventbrite.com/d/online/${encodeURIComponent(eventQuery)}-events/`

      if (import.meta.env.DEV) {
        console.info('[JourneyService] Festival events attached', {
          day: day.date,
          destination: eventQuery,
          events: operational.events,
        })
      }
    } catch (error) {
      logger.warn('       ⚠️ 节庆活动获取失败:', error)
    }
  }
}

function buildFallbackTimeSlots(baseDay: any, destination: string, language: string, index: number): any[] {
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
        : '以一段轻松的晨间漫步开启旅程，让感官与城市的节奏同步。',
    },
    {
      time: '12:30',
      title: isEnglish ? 'Local Taste' : '风味午后',
      icon: '🍽️',
      notes: isEnglish
        ? 'Choose a recommended local bistro or café. Slow down, taste, and recharge for the afternoon.'
        : '挑选口碑良好的餐馆或咖啡馆，慢下来体味风味，也为下午蓄积能量。',
    },
    {
      time: '15:30',
      title: isEnglish ? 'Immersive Discovery' : '灵感探索',
      icon: '✨',
      notes: isEnglish
        ? 'Dive into the key highlight of the day. No rush—immerse yourself in the experience.'
        : '投入当日的核心亮点体验，让自己充分浸润其中，不必匆忙。',
    },
    {
      time: '19:00',
      title: isEnglish ? 'Evening Reflection' : '夜色沉思',
      icon: '🌙',
      notes: isEnglish
        ? 'Hold a gentle evening ritual. Recall three moments that touched you today.'
        : '以一段温柔的夜间仪式收官，回想今天触动你的三个瞬间。',
    },
  ]

  return slots.map((slot) => ({
    time: slot.time,
    title: `${slot.title} · ${baseTitle}`,
    activity: `${slot.title} · ${baseTitle}`,
    location: focusLocation,
    icon: slot.icon,
    duration: 90,
    notes: slot.notes,
  }))
}
