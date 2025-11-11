import { buildOutfitTipsPrompt } from '@/prompts/inspiration/outfitTips'
import { pickSeason } from '@/utils/lang'
import type { TravelContext } from '@/types/travel'
import type { Itinerary } from '@/validators/itinerarySchema'
import type { DeepSeekClient } from '@/llm/deepseekClient'
import type { LoggingAdapter } from '@/utils/inspiration/core/logger'
import { ensureObject, isEnglish as isEnglishLang, processInBatches } from './utils'

interface GenerateTipsParams {
  itinerary: Itinerary
  ctx: TravelContext
  llm: DeepSeekClient
  logger: LoggingAdapter
}

export async function generateTipsForAllSlots({
  itinerary,
  ctx,
  llm,
  logger,
}: GenerateTipsParams): Promise<Itinerary> {
  const result = { ...itinerary, days: [...itinerary.days] }
  const CONCURRENT_LIMIT = 4
  const language = ctx.language || 'zh-CN'
  const isEnglish = isEnglishLang(language)

  for (let i = 0; i < result.days.length; i++) {
    const day = result.days[i]
    if (!day.timeSlots || day.timeSlots.length === 0) continue

    const currentDate = new Date(day.date || new Date().toISOString().split('T')[0])
    const month = currentDate.getMonth() + 1
    const season = pickSeason(month, ctx.language)

    const slots = day.timeSlots
    await processInBatches(slots, CONCURRENT_LIMIT, async (slot: any) => {
      try {
        if (!slot || typeof slot !== 'object' || Array.isArray(slot)) {
          return
        }

        const promptArgs = {
          slot,
          context: {
            destination: itinerary.destination,
            dayIndex: i + 1,
            date: day.date || '',
            season,
            language: ctx.language,
          },
        }

        const { system, user } = buildOutfitTipsPrompt(promptArgs)
        const tips = await llm.jsonFromLLM(system, user, {
          temperature: 0.7,
          max_tokens: 500,
        })

        if (!tips || typeof tips !== 'object') {
          logger.warn('       ⚠️ Tips 返回格式不正确')
          return
        }

        const parsed = tips as {
          outfitSuggestions?: string
          culturalTips?: string
        }

        const normalizeTipsString = (value: unknown): string | null => {
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
            const newlineNormalized = trimmed.replace(/\n/g, '\n')
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
                      isEnglish && segment.length > 60
                        ? segment.slice(0, 57).trim() + '…'
                        : !isEnglish && segment.length > 24
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
          const details = ensureObject<Record<string, any>>(slot.details, () => ({}))
          const recommendations = ensureObject<Record<string, any>>(details.recommendations, () => ({}))

          const formattedOutfit = normalizeTipsString(parsed.outfitSuggestions)
          if (formattedOutfit) {
            recommendations.outfitSuggestions = formattedOutfit
          }
          const formattedCulture = normalizeTipsString(parsed.culturalTips)
          if (formattedCulture) {
            recommendations.culturalTips = formattedCulture
          }

          details.recommendations = recommendations
          slot.details = details
        }

        return
      } catch (error) {
        logger.warn('       ⚠️ Tips 生成失败:', error)
        return
      }
    })

    result.days[i] = { ...day, timeSlots: slots }
  }

  return result
}
