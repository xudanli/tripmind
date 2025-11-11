import { fetchTransportInsights, fetchPricingInsights, type MapboxCoordinates } from '@/services/locationInsights'
import { normalizeTransportModes } from '@/utils/transportModes'
import type { TravelContext } from '@/types/travel'
import type { Itinerary } from '@/validators/itinerarySchema'
import type { DeepSeekClient } from '@/llm/deepseekClient'
import type { LoggingAdapter } from '@/utils/inspiration/core/logger'
import { ensureObject, isEnglish as isEnglishLang } from './utils'

interface GenerateTransportParams {
  itinerary: Itinerary
  ctx: TravelContext
  llm: DeepSeekClient
  logger: LoggingAdapter
}

export async function generateTransportGuidesForAllSlots({
  itinerary,
  ctx,
  llm,
  logger,
}: GenerateTransportParams): Promise<Itinerary> {
  const result = { ...itinerary, days: [...(itinerary.days || [])] }
  const language = ctx.language || 'zh-CN'
  const isEnglish = isEnglishLang(language)
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

  const toNumber = (value: unknown): number | null => {
    if (value === null || value === undefined) return null
    const num = Number(value)
    return Number.isFinite(num) ? num : null
  }

  const getSlotCoordinates = (slot: any): MapboxCoordinates | null => {
    if (!slot) return null
    const geo = slot?.details?.geo
    const geoLat = toNumber(geo?.lat)
    const geoLng = toNumber(geo?.lng)
    if (geoLat !== null && geoLng !== null) return { lat: geoLat, lng: geoLng }

    const directCoords = Array.isArray(slot?.coordinates) ? slot.coordinates : null
    if (directCoords && directCoords.length >= 2) {
      const lat = toNumber(directCoords[0])
      const lng = toNumber(directCoords[1])
      if (lat !== null && lng !== null) return { lat, lng }
    }

    const detailsCoords = slot?.details?.coordinates
    const detailsLat = toNumber(detailsCoords?.lat)
    const detailsLng = toNumber(detailsCoords?.lng)
    if (detailsLat !== null && detailsLng !== null) return { lat: detailsLat, lng: detailsLng }

    return null
  }

  const getSlotLabel = (slot: any): string => {
    if (!slot) return ''
    const name = slot.details?.name
    const candidates = [
      name?.chinese,
      name?.english,
      slot.location,
      slot.title,
      slot.activity,
    ]
    return candidates.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() || ''
  }

  const getPreviousSlot = (dayIndex: number, slotIndex: number): any | null => {
    if (slotIndex > 0) {
      const prev = result.days[dayIndex]?.timeSlots?.[slotIndex - 1]
      if (prev) return prev
    }
    for (let prevDay = dayIndex - 1; prevDay >= 0; prevDay--) {
      const prevDaySlots = result.days[prevDay]?.timeSlots
      if (prevDaySlots && prevDaySlots.length) {
        return prevDaySlots[prevDaySlots.length - 1]
      }
    }
    return null
  }

  for (let i = 0; i < result.days.length; i++) {
    const day = result.days[i]
    if (!day || !Array.isArray(day.timeSlots) || day.timeSlots.length === 0) continue

    for (let j = 0; j < day.timeSlots.length; j += CONCURRENT_LIMIT) {
      const batch = day.timeSlots.slice(j, j + CONCURRENT_LIMIT)

      await Promise.all(
        batch.map(async (slot: any, batchOffset: number) => {
          try {
            if (!slot || typeof slot !== 'object' || Array.isArray(slot)) return

            const details = ensureObject<Record<string, any>>(slot.details, () => ({}))
            slot.details = details
            const transport = ensureObject<Record<string, any>>(details.transportation, () => ({}))
            details.transportation = transport
            const operational = ensureObject<Record<string, any>>(details.operational, () => ({}))
            details.operational = operational

            const slotIndex = j + batchOffset
            const previousSlot = getPreviousSlot(i, slotIndex)
            const previousLabel = getSlotLabel(previousSlot)
            const originLocation =
              previousLabel || itinerary.destination || ctx.userCountry || ''
            const originCoords = getSlotCoordinates(previousSlot)
            const destinationName =
              slot.details?.name?.english ||
              slot.details?.name?.chinese ||
              slot.details?.address?.english ||
              slot.details?.address?.chinese ||
              slot.location ||
              slot.title ||
              slot.activity ||
              ''
            const destinationCoords = getSlotCoordinates(slot)
            const destinationLabel = destinationName || getSlotLabel(slot)

            const existingCoords =
              slot.coordinates ||
              slot.location?.coordinates ||
              slot.details?.coordinates ||
              null

            if (destinationName || destinationLabel) {
              if (
                (!transport.enhancedSummary || !transport.enhancedSummary.trim()) ||
                !Array.isArray(transport.options) ||
                !transport.options.length
              ) {
                const transportData = await fetchTransportInsights({
                  origin: originLocation || destinationLabel || itinerary.destination || '',
                  destination: destinationName || destinationLabel,
                  language: ctx.language,
                  originCoords: originCoords || undefined,
                  destinationCoords: destinationCoords || undefined,
                })
                if (transportData) {
                  if (transportData.summary) transport.enhancedSummary = transportData.summary
                  const normalizedModes = normalizeTransportModes(transportData.options as any)
                  if (normalizedModes.length) {
                    transport.options = normalizedModes
                  } else {
                    delete transport.options
                  }
                  operational.transportSource = transportData.source
                  operational.transportFetchedAt = transportData.fetchedAt
                  if (transportData.distanceKm !== undefined) {
                    operational.transportDistanceKm = transportData.distanceKm
                  }
                  if (transportData.bestDurationMinutes !== undefined) {
                    operational.transportDurationMinutes = transportData.bestDurationMinutes
                  }

                  if (!transport.metrics || typeof transport.metrics !== 'object') {
                    transport.metrics = {}
                  }
                  const metrics = transport.metrics as Record<string, any>
                  if (
                    transportData.bestDurationMinutes !== undefined &&
                    !metrics.estimatedMinutes
                  ) {
                    metrics.estimatedMinutes = transportData.bestDurationMinutes
                  }
                  if (transportData.distanceKm !== undefined && !metrics.distanceKm) {
                    metrics.distanceKm = transportData.distanceKm
                  }
                  if (transportData.bestLabel && !metrics.bestLabel) {
                    metrics.bestLabel = transportData.bestLabel
                  }
                  if (previousLabel && !metrics.originLabel) {
                    metrics.originLabel = previousLabel
                  }
                  if (destinationLabel && !metrics.destinationLabel) {
                    metrics.destinationLabel = destinationLabel
                  }
                  if (transportData.originCoords && !metrics.originCoords) {
                    metrics.originCoords = transportData.originCoords
                  }
                  if (transportData.destinationCoords && !metrics.destinationCoords) {
                    metrics.destinationCoords = transportData.destinationCoords
                  }
                  if (
                    !existingCoords &&
                    transportData.destinationCoords &&
                    Array.isArray(slot.coordinates) === false
                  ) {
                    slot.coordinates = [
                      transportData.destinationCoords.lat,
                      transportData.destinationCoords.lng,
                    ]
                  }
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
                    const ratingObj = ensureObject<Record<string, any>>(details.rating, () => ({}))
                    if (pricingData.rating.score !== undefined) ratingObj.score = pricingData.rating.score
                    if (pricingData.rating.reviewCount !== undefined) {
                      ratingObj.reviewCount = pricingData.rating.reviewCount
                    }
                    if (pricingData.rating.platform) {
                      ratingObj.platform = pricingData.rating.platform
                    }
                    details.rating = ratingObj
                  }
                }
              }
            }

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
  }
}

所有内容必须使用中文，可用「约/大约」等表达估算值，禁止编造精确数字。`

            const contextLines = [
              isEnglish ? `Destination: ${itinerary.destination || ''}` : `目的地：${itinerary.destination || ''}`,
              isEnglish ? `Day theme: ${day.theme || ''}` : `当日主题：${day.theme || ''}`,
              spotName ? (isEnglish ? `Spot: ${spotName}` : `地点：${spotName}`) : '',
              addressSummary ? (isEnglish ? `Address hints: ${addressSummary}` : `地址提示：${addressSummary}`) : '',
              existingCoords ? (isEnglish ? `Coordinates: ${existingCoords.lat}, ${existingCoords.lng}` : `坐标：${existingCoords.lat}，${existingCoords.lng}`) : '',
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
            const remindersRaw = undefined

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
              operational.opening = openingLines
            }

            const pricingLines = normalizeStrings(pricingRaw)
            if (pricingLines.length) {
              operational.pricing = pricingLines
            }

            const remindersLines: string[] = []

            if (ratingRaw && typeof ratingRaw === 'object') {
              const score = Number((ratingRaw as any).score)
              const reviewCount = Number((ratingRaw as any).reviewCount)
              const platform = typeof (ratingRaw as any).platform === 'string' ? (ratingRaw as any).platform.trim() : ''

              const ratingObj = ensureObject<Record<string, any>>(details.rating, () => ({}))
              if (Number.isFinite(score)) ratingObj.score = score
              if (Number.isFinite(reviewCount)) ratingObj.reviewCount = reviewCount
              if (platform) ratingObj.platform = platform

              if (Object.keys(ratingObj).length) {
                details.rating = ratingObj
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
