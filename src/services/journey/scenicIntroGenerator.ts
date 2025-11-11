import { reverseGeocodeToChinese, reverseGeocodeToEnglish } from '@/utils/geocode'
import { fetchFestivalEvents, type FestivalEvent } from '@/services/eventInsights'
import type { TravelContext } from '@/types/travel'
import type { Itinerary } from '@/validators/itinerarySchema'
import type { DeepSeekClient } from '@/llm/deepseekClient'
import type { LoggingAdapter } from '@/utils/inspiration/core/logger'
import { ensureObject, isEnglish as isEnglishLang } from './utils'

interface GenerateScenicIntroParams {
  itinerary: Itinerary
  ctx: TravelContext
  llm: DeepSeekClient
  logger: LoggingAdapter
}

export async function generateScenicIntrosForAllSlots({
  itinerary,
  ctx,
  llm,
  logger,
}: GenerateScenicIntroParams): Promise<Itinerary> {
  const result = { ...itinerary, days: [...(itinerary.days || [])] }
  const language = ctx.language || 'zh-CN'
  const isEnglish = isEnglishLang(language)
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
            const details = ensureObject<Record<string, any>>(slot.details, () => ({}))
            slot.details = details

            if (needsChineseName) {
              const translated = await translateNameToChinese(spotName)
              if (translated) {
                const name = ensureObject<Record<string, any>>(details.name, () => ({}))
                name.chinese = translated
                details.name = name
              }
            }

            const address = ensureObject<Record<string, any>>(details.address, () => ({}))
            const existingChinese = typeof address.chinese === 'string' ? address.chinese : undefined
            if (geocodeZh && !hasChineseCharacters(existingChinese)) {
              address.geocodedChinese = geocodeZh
            }
            const existingEnglish = typeof address.english === 'string' ? address.english : ''
            if (geocodeEn && (!existingEnglish || existingEnglish.length < 4)) {
              address.geocodedEnglish = geocodeEn
            }
            details.address = address

            const coordinateLabel = `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`

            const shouldReplaceLocation = (value: unknown): boolean => {
              if (!value) return true
              if (typeof value !== 'string') return true
              const trimmed = value.trim()
              if (!trimmed) return true
              return /未指定|unknown|not specified/i.test(trimmed)
            }

            if (shouldReplaceLocation(slot.location)) {
              const preferred =
                (isEnglish ? geocodeEn || geocodeZh : geocodeZh || geocodeEn) || coordinateLabel
              slot.location = preferred
            }

            const activityText =
              typeof slot.activity === 'string'
                ? slot.activity
                : Array.isArray(slot.activity)
                ? slot.activity.join(isEnglish ? ', ' : '、')
                : ''
            const addressCandidates = [
              slot.details?.address?.chinese,
              slot.details?.address?.english,
              slot.details?.address?.local,
              (slot.details?.address as any)?.geocodedChinese,
              (slot.details?.address as any)?.geocodedEnglish,
            ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
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

            const detailsFinal = ensureObject<Record<string, any>>(slot.details, () => ({}))
            const description = ensureObject<Record<string, any>>(detailsFinal.description, () => ({}))

            description.scenicIntro = generated
            detailsFinal.description = description
            slot.details = detailsFinal
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
        try {
          const events = await fetchFestivalForDay(eventQuery, day.date)
          if (events.length) {
            const details = ensureObject<Record<string, any>>(primarySlot.details, () => ({}))
            const operational = ensureObject<Record<string, any>>(details.operational, () => ({}))
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
            details.operational = operational
            primarySlot.details = details
            if (import.meta.env.DEV) {
              console.info('[JourneyService] Festival events attached', {
                day: day.date,
                destination: eventQuery,
                events: operational.events,
              })
            }
          }
        } catch (error) {
          logger.warn('       ⚠️ 节庆活动获取失败:', error)
        }
      }
    }

    result.days[i] = { ...day, timeSlots: [...day.timeSlots] }
  }

  return result
}
