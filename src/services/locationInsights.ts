// @ts-nocheck
import { API_CONFIG } from '@/config/api'

type LanguageCode = string

export interface TransportInsights {
  summary: string
  options: string[]
  source: string
  fetchedAt: string
}

export interface OpeningInsights {
  lines: string[]
  source: string
  fetchedAt: string
}

export interface PricingInsights {
  lines: string[]
  source: string
  fetchedAt: string
  rating?: {
    score?: number
    reviewCount?: number
    platform?: string
  }
}

const isBrowser = typeof window !== 'undefined'

const formatISODate = () => new Date().toISOString().split('T')[0]

const headersWith = (extra: Record<string, string>) => ({
  'Content-Type': 'application/json',
  ...extra,
})

async function fetchGoogleDirections(origin: string, destination: string, language: LanguageCode) {
  if (!API_CONFIG.GOOGLE_MAPS_API_KEY) return null
  try {
    const params = new URLSearchParams({
      origin,
      destination,
      mode: 'transit',
      language,
      alternatives: 'true',
      key: API_CONFIG.GOOGLE_MAPS_API_KEY,
    })

    const response = await fetch(
      `${API_CONFIG.GOOGLE_MAPS_BASE_URL}/maps/api/directions/json?${params.toString()}`
    )
    if (!response.ok) return null
    const data = await response.json()

    const routes = Array.isArray(data.routes) ? data.routes : []
    if (!routes.length) return null

    const minutes = (value: any): number => {
      if (!value) return 0
      if (typeof value === 'string' && value.includes('min')) {
        const match = value.match(/(\d+)/)
        return match ? Number(match[1]) : 0
      }
      if (typeof value === 'number') return value / 60
      return 0
    }

    const bestRoute = routes[0]
    const leg = bestRoute?.legs?.[0]
    if (!leg) return null

    const summaryParts: string[] = []
    if (leg.duration?.text) summaryParts.push(leg.duration.text)
    if (leg.distance?.text) summaryParts.push(leg.distance.text)

    const optionsList: string[] = []
    bestRoute.legs[0]?.steps?.forEach((step: any) => {
      const travelMode = step.travel_mode
      const transitDetails = step.transit_details
      if (travelMode === 'TRANSIT' && transitDetails) {
        const line = transitDetails.line
        const headsign = transitDetails.headsign
        const station = transitDetails.departure_stop?.name
        const arrival = transitDetails.arrival_stop?.name
        const durationMin = minutes(transitDetails?.duration?.value || step.duration?.value)
        const option = [
          line?.short_name || line?.name || 'Transit',
          headsign ? `→ ${headsign}` : '',
          station ? ` @ ${station}` : '',
          arrival ? ` → ${arrival}` : '',
          durationMin ? ` (${Math.round(durationMin)} min)` : '',
        ]
          .join('')
          .trim()
        if (option) optionsList.push(option)
      } else if (travelMode === 'WALKING') {
        const durationMin = minutes(step.duration?.value)
        if (durationMin > 0) {
          optionsList.push(
            `${language.startsWith('zh') ? '步行约' : 'Walk ~'}${Math.round(durationMin)}${
              language.startsWith('zh') ? '分钟' : 'min'
            }`
          )
        }
      }
    })

    const summary =
      summaryParts.length > 0
        ? summaryParts.join(' · ')
        : routes[0]?.summary || `${language.startsWith('zh') ? '请规划交通方式' : 'Plan transportation'}`

    const result: TransportInsights = {
      summary,
      options: Array.from(new Set(optionsList)).slice(0, 4),
      source: 'Google Maps Directions',
      fetchedAt: formatISODate(),
    }
    if (import.meta.env.DEV) {
      console.info('[TransportInsights] Google Maps success', {
        origin,
        destination,
        summary: result.summary,
        optionCount: result.options.length,
      })
    }
    return result
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[TransportInsights] Google directions failed', error)
    }
    return null
  }
}

type MapboxCoordinates = { lat: number; lng: number }

const SUPPORTED_MAPBOX_LANGS = new Set([
  'ar',
  'cs',
  'da',
  'de',
  'en',
  'es',
  'fi',
  'fr',
  'it',
  'ja',
  'ko',
  'lt',
  'nl',
  'no',
  'pl',
  'pt',
  'ru',
  'sv',
  'tr',
  'uk',
  'vi',
  'zh',
])

const normalizeMapboxLanguage = (language: LanguageCode): string => {
  if (!language) return 'en'
  const lower = language.toLowerCase()
  if (SUPPORTED_MAPBOX_LANGS.has(lower)) return lower
  if (lower.startsWith('zh')) return 'zh'
  if (lower.startsWith('en')) return 'en'
  if (lower.startsWith('es')) return 'es'
  if (lower.startsWith('fr')) return 'fr'
  if (lower.startsWith('de')) return 'de'
  if (lower.startsWith('pt')) return 'pt'
  if (lower.startsWith('ru')) return 'ru'
  if (lower.startsWith('ja')) return 'ja'
  if (lower.startsWith('ko')) return 'ko'
  return 'en'
}

async function geocodeMapbox(query: string, language: LanguageCode): Promise<MapboxCoordinates | null> {
  if (!API_CONFIG.MAPBOX_ACCESS_TOKEN) return null
  const lang = normalizeMapboxLanguage(language)
  try {
    const response = await fetch(
      `${API_CONFIG.MAPBOX_API_URL}/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?limit=1&language=${lang}&access_token=${API_CONFIG.MAPBOX_ACCESS_TOKEN}`
    )
    if (!response.ok) return null
    const data = await response.json()
    const feature = Array.isArray(data.features) ? data.features[0] : null
    if (!feature || !Array.isArray(feature.center) || feature.center.length < 2) return null
    const [lng, lat] = feature.center
    const coords = { lat: Number(lat), lng: Number(lng) }
    if (import.meta.env.DEV) {
      console.debug('[TransportInsights] Mapbox geocode success', {
        query,
        coordinates: coords,
      })
    }
    return coords
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[TransportInsights] Mapbox geocoding failed', error)
    }
    return null
  }
}

const haversineDistanceKm = (a: MapboxCoordinates, b: MapboxCoordinates) => {
  const toRad = (value: number) => (value * Math.PI) / 180
  const R = 6371 // km
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)

  const aHarv =
    sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng
  const c = 2 * Math.atan2(Math.sqrt(aHarv), Math.sqrt(1 - aHarv))
  return R * c
}

async function fetchMapboxDirections(
  origin: string,
  destination: string,
  language: LanguageCode
): Promise<TransportInsights | null> {
  if (!API_CONFIG.MAPBOX_ACCESS_TOKEN) return null
  const lang = normalizeMapboxLanguage(language)
  try {
    const [originCoords, destCoords] = await Promise.all([
      geocodeMapbox(origin, lang),
      geocodeMapbox(destination, lang),
    ])
    if (!originCoords || !destCoords) return null

    const straightDistanceKm = haversineDistanceKm(originCoords, destCoords)

    const profiles: Array<{ key: string; labelZh: string; labelEn: string }> =
      straightDistanceKm > 60
        ? [{ key: 'driving', labelZh: '驾车', labelEn: 'Driving' }]
        : [
            { key: 'driving', labelZh: '驾车', labelEn: 'Driving' },
            { key: 'walking', labelZh: '步行', labelEn: 'Walking' },
            { key: 'cycling', labelZh: '骑行', labelEn: 'Cycling' },
          ]

    const options: string[] = []
    let bestDuration = Number.POSITIVE_INFINITY
    let bestLabel = ''
    let minDistanceKm = Number.POSITIVE_INFINITY

    for (const profile of profiles) {
      try {
        const response = await fetch(
          `${API_CONFIG.MAPBOX_API_URL}/directions/v5/mapbox/${profile.key}/${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}?alternatives=true&steps=true&overview=false&language=${lang}&access_token=${API_CONFIG.MAPBOX_ACCESS_TOKEN}`
        )
        if (!response.ok) continue
        const data = await response.json()
        const route = Array.isArray(data.routes) ? data.routes[0] : null
        const leg = Array.isArray(route?.legs) ? route.legs[0] : null
        if (!route || !leg) continue
        const durationMin = route.duration ? Math.round(route.duration / 60) : null
        const distanceKmRaw = route.distance ? route.distance / 1000 : null
        const distanceKm = distanceKmRaw ? distanceKmRaw.toFixed(1) : null
        if (typeof distanceKmRaw === 'number') {
          minDistanceKm = Math.min(minDistanceKm, distanceKmRaw)
        }
        if (durationMin !== null && durationMin < bestDuration) {
          bestDuration = durationMin
          bestLabel = language.startsWith('zh')
            ? `${profile.labelZh}约${durationMin}分钟`
            : `${profile.labelEn} ~${durationMin} min`
        }
        const label = language.startsWith('zh') ? profile.labelZh : profile.labelEn
        const segments: string[] = []
        segments.push(label)
        if (durationMin !== null) {
          segments.push(language.startsWith('zh') ? `约${durationMin}分钟` : `~${durationMin} min`)
        }
        if (distanceKm) {
          segments.push(language.startsWith('zh') ? `${distanceKm} 公里` : `${distanceKm} km`)
        }
        options.push(segments.join(' · '))
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn(`[TransportInsights] Mapbox ${profile.key} request failed`, error)
        }
      }
    }

    if (!options.length) return null
    if (minDistanceKm === Number.POSITIVE_INFINITY || minDistanceKm > 500) {
      if (import.meta.env.DEV) {
        console.warn('[TransportInsights] Mapbox distance too large, skipping', {
          origin,
          destination,
          minDistanceKm,
        })
      }
      return null
    }

    const summary =
      bestLabel ||
      (language.startsWith('zh') ? '请规划交通方式' : 'Plan transportation options')

    const result: TransportInsights = {
      summary,
      options: Array.from(new Set(options)).slice(0, 4),
      source: 'Mapbox Directions',
      fetchedAt: formatISODate(),
    }
    if (import.meta.env.DEV) {
      console.info('[TransportInsights] Mapbox success', {
        origin,
        destination,
        summary: result.summary,
        optionCount: result.options.length,
      })
    }
    return result
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[TransportInsights] Mapbox directions failed', error)
    }
    return null
  }
}

export async function fetchTransportInsights(options: {
  origin: string
  destination: string
  language: LanguageCode
}): Promise<TransportInsights | null> {
  const { origin, destination, language } = options
  if (!origin || !destination) {
    if (import.meta.env.DEV) {
      console.info('[TransportInsights] skipped: missing origin or destination', { origin, destination })
    }
    return null
  }

  // 暂时禁用 Google Directions，避免浏览器端 CORS 失败
  // const googleResult = await fetchGoogleDirections(origin, destination, language)
  // if (googleResult) return googleResult

  const mapboxResult = await fetchMapboxDirections(origin, destination, language)
  if (mapboxResult) return mapboxResult

  if (import.meta.env.DEV) {
    console.warn('[TransportInsights] no data from Google or Mapbox', { origin, destination })
  }

  return null
}

// Google Places support removed

async function tripAdvisorHeaders() {
  if (!API_CONFIG.TRIPADVISOR_RAPIDAPI_KEY) return null
  return headersWith({
    'X-RapidAPI-Key': API_CONFIG.TRIPADVISOR_RAPIDAPI_KEY,
    'X-RapidAPI-Host': API_CONFIG.TRIPADVISOR_RAPIDAPI_HOST || 'travel-advisor.p.rapidapi.com',
  })
}

async function searchTripAdvisorLocation(query: string, language: LanguageCode) {
  const headers = await tripAdvisorHeaders()
  if (!headers) return null

  const params = new URLSearchParams({
    query,
    language,
    units: 'km',
  })

  try {
    const response = await fetch(
      `https://${API_CONFIG.TRIPADVISOR_RAPIDAPI_HOST}/locations/search?${params.toString()}`,
      { headers }
    )
    if (!response.ok) return null
    const data = await response.json()
    const results = Array.isArray(data?.data) ? data.data : []
    const match = results.find((item: any) => item?.result_type === 'things_to_do' || item?.result_type === 'lodging')
    const locationId = match?.result_object?.location_id
    return locationId || null
  } catch (error) {
    if (import.meta.env.DEV) console.warn('[TripAdvisor] location search failed', error)
    return null
  }
}

export async function fetchPricingInsights(options: {
  query: string
  language: LanguageCode
}): Promise<PricingInsights | null> {
  const { query, language } = options
  if (!API_CONFIG.TRIPADVISOR_RAPIDAPI_KEY || !query) {
    if (import.meta.env.DEV) {
      console.info('[PricingInsights] skipped: missing key or query', {
        hasKey: !!API_CONFIG.TRIPADVISOR_RAPIDAPI_KEY,
        query,
      })
    }
    return null
  }

  const locationId = await searchTripAdvisorLocation(query, language)
  if (!locationId) {
    if (import.meta.env.DEV) {
      console.warn('[PricingInsights] no TripAdvisor locationId', { query })
    }
    return null
  }

  try {
    const headers = await tripAdvisorHeaders()
    if (!headers) return null
    const params = new URLSearchParams({
      location_id: locationId,
      currency: 'USD',
      lang: language,
    })

    const response = await fetch(
      `https://${API_CONFIG.TRIPADVISOR_RAPIDAPI_HOST}/attractions/get-details?${params.toString()}`,
      { headers }
    )
    if (!response.ok) return null
    const data = await response.json()

    const pricingLines: string[] = []

    const ticketInfo = data?.data?.ticket_info
    if (Array.isArray(ticketInfo) && ticketInfo.length) {
      ticketInfo.forEach((ticket: any) => {
        const label = ticket?.title || ticket?.description
        const price = ticket?.price || ticket?.price_formatted
        if (label && price) pricingLines.push(`${label}: ${price}`)
      })
    }

    if (pricingLines.length === 0) {
      const priceLevel = data?.data?.price_level
      const price = data?.data?.price
      if (priceLevel || price) {
        pricingLines.push(`${price || priceLevel}`)
      }
    }

    if (!pricingLines.length) return null

    const updatedAt = data?.data?.last_review_date || data?.data?.updated_time || formatISODate()

    const ratingScore = Number(data?.data?.rating)
    const reviewCount = Number(data?.data?.num_reviews)
    const rating =
      Number.isFinite(ratingScore) || Number.isFinite(reviewCount)
        ? {
            score: Number.isFinite(ratingScore) ? ratingScore : undefined,
            reviewCount: Number.isFinite(reviewCount) ? reviewCount : undefined,
            platform: 'TripAdvisor',
          }
        : undefined

    const result: PricingInsights = {
      lines: pricingLines,
      source: 'TripAdvisor',
      fetchedAt: typeof updatedAt === 'string' ? updatedAt : formatISODate(),
      rating,
    }
    if (import.meta.env.DEV) {
      console.info('[PricingInsights] TripAdvisor success', {
        query,
        lines: result.lines,
        rating: result.rating,
      })
    }
    return result
  } catch (error) {
    if (import.meta.env.DEV) console.warn('[TripAdvisor] pricing fetch failed', error)
    return null
  }
}

