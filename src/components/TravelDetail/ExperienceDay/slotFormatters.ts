import type { CurrencyInfo } from '@/utils/currency'
import { formatCurrency } from '@/utils/currency'
import { DEFAULT_VALUES } from '@/utils/travelConstants'

export type TranslateFn = (key: string, params?: Record<string, any>) => string

export interface LocationLineEntry {
  text: string
  type: 'primary' | 'english' | 'chinese' | 'landmark' | 'fallback'
}

export interface RatingInfo {
  text: string
  status: 'high' | 'medium' | 'low'
  score?: number
}

export interface SlotChips {
  stay?: string
  rating?: RatingInfo | null
  seasonal?: string | null
  cost?: string | null
}

export interface TransportInfo {
  summary: string | null
  items: string[]
  originLabel?: string | null
  durationMinutes?: number | null
  distanceKm?: number | null
}

export const formatReviewCount = (count: number): string => {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}千`
  }
  return count.toString()
}

export const getActivitySummary = (slot: any, t: TranslateFn): string | null => {
  if (!slot) return null
  if (slot.summary && slot.summary.trim()) {
    return slot.summary.trim()
  }
  const scenicIntro = slot.details?.description?.scenicIntro
  if (typeof scenicIntro === 'string' && scenicIntro.trim()) {
    return scenicIntro.trim()
  }
  if (slot.notes && slot.notes.trim()) {
    return slot.notes.trim()
  }
  const desc = slot.details?.description
  if (desc) {
    const parts: string[] = []
    if (desc.specialty) parts.push(`${t('travelDetail.experienceDay.specialty')}：${desc.specialty}`)
    if (desc.atmosphere) parts.push(`${t('travelDetail.experienceDay.atmosphere')}：${desc.atmosphere}`)
    if (desc.highlights && desc.highlights.length) {
      parts.push(`${t('travelDetail.experienceDay.highlights')}：${desc.highlights.slice(0, 2).join('、')}`)
    }
    if (parts.length) {
      return parts.join('。')
    }
  }
  return null
}

export const getInternalPreview = (slot: any): string | null => {
  if (!slot?.internalTrack) return null
  if (slot.internalTrack.question) return slot.internalTrack.question
  if (slot.internalTrack.ritual) return slot.internalTrack.ritual
  if (slot.internalTrack.reflection) return slot.internalTrack.reflection
  return null
}

export const getStayText = (slot: any, t: TranslateFn): string | null => {
  if (slot?.details?.recommendations?.suggestedDuration) {
    return slot.details.recommendations.suggestedDuration
  }
  if (slot?.duration) {
    const min = Number(slot.duration)
    const max = Number(slot.duration) + DEFAULT_VALUES.DURATION_BUFFER
    return `${min}–${max}${t('travelDetail.experienceDay.minutes')}`
  }
  return null
}

export const getSeasonalText = (slot: any): string | null => {
  return slot?.details?.recommendations?.seasonal || null
}

export const getCostChip = (slot: any, currency: CurrencyInfo | null, t: TranslateFn): string | null => {
  if (slot?.cost) {
    return `${t('travelDetail.experienceDay.cost')}：${formatCurrency(slot.cost, currency || { code: 'CNY', symbol: '¥', name: '人民币' })}`
  }
  return null
}

export const getRatingInfo = (slot: any, platform: string | null, t: TranslateFn): RatingInfo | null => {
  const rating = slot?.details?.rating
  if (!rating?.score) {
    return null
  }
  const score = Number(rating.score)
  let status: RatingInfo['status'] = 'low'
  if (score >= 4) {
    status = 'high'
  } else if (score >= 3) {
    status = 'medium'
  }
  const parts: string[] = [score.toFixed(1)]
  if (rating.reviewCount) {
    parts.push(`（${formatReviewCount(rating.reviewCount)}${t('travelDetail.experienceDay.reviews')}）`)
  }
  if (platform) {
    parts.push(`· ${platform}`)
  }
  return {
    text: parts.join(' '),
    status,
    score,
  }
}

export const buildBookingText = (slot: any, t: TranslateFn): string | null => {
  const rec = slot?.details?.recommendations
  if (!rec) {
    return null
  }
  if (rec.bookingRequired) {
    return `${t('travelDetail.experienceDay.bookingRequired')}${rec.bookingAdvance || t('travelDetail.experienceDay.bookingAdvanceDefault')}`
  }
  if (isTransportOrAccommodation(slot)) {
    return `${t('travelDetail.experienceDay.noBookingRequired')}，${t('travelDetail.experienceDay.bookingSuggestionAvailable')}`
  }
  return t('travelDetail.experienceDay.noBookingRequired')
}

export const buildPreTrip = (recommendations: any, t: TranslateFn): string | null => {
  if (!recommendations) return null
  const parts: string[] = []
  if (recommendations.dressCode) {
    parts.push(`${t('travelDetail.experienceDay.dressCode')}：${recommendations.dressCode}`)
  }
  if (recommendations.bestTime) {
    parts.push(`${t('travelDetail.experienceDay.bestTime')}：${recommendations.bestTime}`)
  }
  if (recommendations.suitableFor) {
    parts.push(`${t('travelDetail.experienceDay.suitableFor')}：${recommendations.suitableFor}`)
  }
  return parts.length ? parts.join(' · ') : null
}

export const buildPricing = (pricing: any, currency: CurrencyInfo, t: TranslateFn): string | null => {
  if (!pricing) return null
  const parts: string[] = []
  if (pricing.general) {
    parts.push(`${t('travelDetail.experienceDay.transportationCost')}：${formatCurrency(pricing.general, currency)}`)
  }
  if (pricing.detail?.children?.price) {
    const child = pricing.detail.children
    parts.push(`${t('travelDetail.experienceDay.children')}${formatCurrency(child.price, currency)}${child.ageRange ? `（${child.ageRange}）` : ''}`)
  }
  if (pricing.detail?.groupDiscount && pricing.detail.groupDiscount.minPeople && pricing.detail.groupDiscount.percentage) {
    const discount = pricing.detail.groupDiscount
    parts.push(`${discount.minPeople}${t('travelDetail.experienceDay.peoplePlus')} ${100 - discount.percentage}${t('travelDetail.experienceDay.discount')}`)
  }
  if (parts.length === 0) {
    return null
  }
  return parts.join(' · ')
}

export const buildTransportText = (transport: any, t: TranslateFn): string | null => {
  if (!transport) return null
  const parts: string[] = []
  if (transport.fromStation?.walkTime) {
    parts.push(`${t('travelDetail.experienceDay.walking')}${transport.fromStation.walkTime}${t('travelDetail.experienceDay.minutes')}${t('travelDetail.experienceDay.minutesReachable')}`)
  } else if (transport.fromStation?.distance) {
    parts.push(transport.fromStation.distance)
  }
  if (transport.busLines && transport.busLines.length) {
    parts.push(`${t('travelDetail.experienceDay.bus')}${transport.busLines.join('/')}${t('travelDetail.experienceDay.route')}`)
  }
  if (transport.subway?.available) {
    const lines = Array.isArray(transport.subway.lines) ? transport.subway.lines.join('/') : transport.subway.lines
    parts.push(`${t('travelDetail.experienceDay.subway') || '地铁'}${lines ? ` ${lines}` : ''}`)
  }
  if (transport.driving) {
    parts.push(transport.driving)
  }
  if (transport.shuttle) {
    parts.push(transport.shuttle)
  }
  if (transport.parking) {
    parts.push(transport.parking)
  }
  return parts.length ? parts.join(' · ') : t('travelDetail.experienceDay.walkingNotReachable')
}

export const buildTransportInfo = (transport: any, t: TranslateFn): TransportInfo | null => {
  if (!transport) return null

  const summary =
    typeof transport.enhancedSummary === 'string' && transport.enhancedSummary.trim()
      ? transport.enhancedSummary.trim()
      : ''

  const metaItems: string[] = []
  const metrics = transport.metrics || {}

  const estimatedMinutes = Number(metrics?.estimatedMinutes ?? metrics?.durationMinutes)
  if (Number.isFinite(estimatedMinutes) && estimatedMinutes > 0) {
    const originLabel =
      typeof metrics?.originLabel === 'string' && metrics.originLabel.trim()
        ? metrics.originLabel.trim()
        : t('travelDetail.experienceDay.transportPreviousStop')

    metaItems.push(
      t('travelDetail.experienceDay.transportFromPrevious', {
        origin: originLabel,
        minutes: Math.round(estimatedMinutes),
      })
    )
  }

  const distanceKm = Number(metrics?.distanceKm)
  if (Number.isFinite(distanceKm) && distanceKm > 0) {
    const formattedDistance = distanceKm >= 10 ? distanceKm.toFixed(1) : distanceKm.toFixed(2)
    metaItems.push(
      t('travelDetail.experienceDay.transportDistanceKm', {
        distance: formattedDistance,
      })
    )
  }

  const bestLabel =
    typeof metrics?.bestLabel === 'string' && metrics.bestLabel.trim()
      ? metrics.bestLabel.trim()
      : ''
  if (bestLabel) {
    metaItems.push(bestLabel)
  }

  const optionItems = Array.isArray(transport.options)
    ? transport.options
        .map((item: any) =>
          typeof item === 'string' ? item.replace(/^•\s*/, '').trim() : ''
        )
        .filter(Boolean)
    : []

  const combinedItems = [...metaItems, ...optionItems]

  if (summary || combinedItems.length) {
    return {
      summary: summary || null,
      items: combinedItems,
      originLabel:
        typeof metrics?.originLabel === 'string' && metrics.originLabel.trim()
          ? metrics.originLabel.trim()
          : null,
      durationMinutes:
        Number.isFinite(estimatedMinutes) && estimatedMinutes > 0
          ? Math.round(Number(estimatedMinutes))
          : null,
      distanceKm:
        Number.isFinite(distanceKm) && distanceKm > 0 ? Number(distanceKm.toFixed(2)) : null,
    }
  }

  const fallback = buildTransportText(transport, t)
  if (fallback) {
    return {
      summary: fallback,
      items: [],
    }
  }

  return null
}

export const formatOpeningHours = (hours: string): string => {
  if (!hours) return ''
  const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)/gi
  let formatted = hours
  formatted = formatted.replace(timeRegex, (match: string, hour: string, minute: string, period: string) => {
    let h = parseInt(hour, 10)
    if (period.toUpperCase() === 'PM' && h !== 12) {
      h += 12
    } else if (period.toUpperCase() === 'AM' && h === 12) {
      h = 0
    }
    return `${h.toString().padStart(2, '0')}:${minute}`
  })
  formatted = formatted.replace(/\s*-\s*/g, '–')
  formatted = formatted.replace(/\s*to\s*/gi, '–')
  formatted = formatted.replace(/\s*至\s*/g, '–')
  return formatted
}

export const formatLocationLines = (options: { name?: any; address?: any; fallback?: string | null }): LocationLineEntry[] => {
  const lines: LocationLineEntry[] = []
  const { name, address, fallback } = options

  const existing = new Set<string>()

  const pushLine = (text: string | null | undefined, type: LocationLineEntry['type']) => {
    if (text && text.trim()) {
      const trimmed = text.trim()
      if (existing.has(trimmed)) return
      lines.push({ text: trimmed, type })
      existing.add(trimmed)
    }
  }

  if (name?.chinese) {
    pushLine(name.chinese, 'primary')
  }
  if (name?.english) {
    pushLine(name.english, 'english')
  }
  if (address?.english) {
    pushLine(address.landmark ? `${address.english} · ${address.landmark}` : address.english, 'english')
  }
  if ((address as any)?.geocodedEnglish) {
    pushLine((address as any).geocodedEnglish, 'english')
  }
  if (!address?.english) {
    pushLine(address?.chinese ? (address.landmark ? `${address.chinese} · ${address.landmark}` : address.chinese) : null, 'chinese')
  }
  if (address?.english && address?.chinese) {
    pushLine(address.chinese, 'chinese')
  }
  if ((address as any)?.geocodedChinese) {
    pushLine((address as any).geocodedChinese, 'chinese')
  }
  if (address?.landmark) {
    pushLine(address.landmark, 'landmark')
  }
  if (!lines.length && fallback) {
    pushLine(fallback, 'fallback')
  }
  return lines
}

export const getSlotLocationLines = (slot: any): LocationLineEntry[] => {
  return formatLocationLines({
    name: slot?.details?.name || null,
    address: slot?.details?.address || null,
    fallback: slot?.location || null,
  })
}

export const isTransportOrAccommodation = (slot: any): boolean => {
  if (!slot) return false
  const type = slot.type || slot.category
  if (type === 'transport' || type === 'accommodation') {
    return true
  }
  const title = `${slot.title || ''}${slot.activity || ''}`.toLowerCase()
  if (!title) return false
  return (
    title.includes('hotel') || title.includes('宿') ||
    title.includes('train') || title.includes('station') ||
    title.includes('交通') || title.includes('航班')
  )
}

export const buildSlotChips = (
  slot: any,
  options: {
    t: TranslateFn
    currency: CurrencyInfo | null
    platform: string | null
  }
): SlotChips => {
  const stay = getStayText(slot, options.t)
  const rating = getRatingInfo(slot, options.platform, options.t)
  const seasonal = getSeasonalText(slot)
  const cost = getCostChip(slot, options.currency, options.t)
  return {
    stay: stay || undefined,
    rating,
    seasonal: seasonal || undefined,
    cost: cost || undefined,
  }
}

export const buildNotes = (slot: any): string[] => {
  const collected: string[] = []

  const pushValue = (value: unknown) => {
    if (!value) return
    if (Array.isArray(value)) {
      value.forEach(pushValue)
      return
    }
    if (typeof value === 'string' && value.trim()) {
      collected.push(value.trim())
    }
  }

  pushValue(slot?.details?.recommendations?.specialNotes)
  pushValue(slot?.notes)

  return collected
}
