const geocodeCache = new Map<string, GeocodeDetail | null>()

interface NominatimResponse {
  display_name?: string
  address?: {
    city?: string
    town?: string
    village?: string
    hamlet?: string
    municipality?: string
    county?: string
    state?: string
    region?: string
    country?: string
  }
}

export interface GeocodeDetail {
  label: string | null
  country?: string
  state?: string
  city?: string
}

const buildCacheKey = (lat: number, lng: number, language: string) =>
  `${lat.toFixed(4)},${lng.toFixed(4)}@${language}`

const extractDetail = (data: NominatimResponse): GeocodeDetail => {
  const address = data.address || {}
  const city =
    address.city ||
    address.town ||
    address.village ||
    address.hamlet ||
    address.municipality ||
    null
  const state = address.state || address.region || address.county || null
  const country = address.country || null

  const parts = [city, state, country].filter(Boolean)

  let label: string | null = null
  if (parts.length > 0) {
    label = parts.slice(0, 2).join(', ')
  } else if (data.display_name) {
    const segments = data.display_name.split(',').map(segment => segment.trim())
    label = segments.slice(0, 2).join(', ')
  }

  return {
    label,
    city: city || undefined,
    state: state || undefined,
    country: country || undefined,
  }
}

async function reverseGeocodeMapbox(lat: number, lng: number, language: string) {
  const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''
  const apiBase = import.meta.env.VITE_MAPBOX_API_URL || 'https://api.mapbox.com'
  if (!token) return null
  try {
    const response = await fetch(
      `${apiBase}/geocoding/v5/mapbox.places/${lng},${lat}.json?language=${language}&limit=1&access_token=${token}`
    )
    if (!response.ok) return null
    const data = await response.json()
    const feature = Array.isArray(data.features) ? data.features[0] : null
    if (!feature) return null
    const context = Array.isArray(feature.context) ? feature.context : []
    const city =
      feature.text ||
      context.find((item: any) => item.id?.startsWith('place'))?.text ||
      context.find((item: any) => item.id?.startsWith('locality'))?.text ||
      null
    const state = context.find((item: any) => item.id?.startsWith('region'))?.text || null
    const country = context.find((item: any) => item.id?.startsWith('country'))?.text || null
    const labelParts = [city, state].filter(Boolean)
    const label = labelParts.length ? labelParts.join(', ') : feature.place_name || null

    return {
      label,
      city: city || undefined,
      state: state || undefined,
      country: country || undefined,
    } satisfies GeocodeDetail
  } catch (error) {
    console.warn('[Geocode] Mapbox reverse lookup failed:', error)
    return null
  }
}

async function reverseGeocodeNominatim(
  lat: number,
  lng: number,
  language: string
): Promise<GeocodeDetail | null> {
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null
  }

  const cacheKey = buildCacheKey(lat, lng, language)
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey) || null
  }

  try {
    const params = new URLSearchParams({
      format: 'jsonv2',
      lat: lat.toString(),
      lon: lng.toString(),
      zoom: '12',
      addressdetails: '1',
      'accept-language': language
    })

    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
      headers: {
        'User-Agent': 'ai-travel-companion/1.0 (+support@ai-travel-companion.local)'
      }
    })

    if (!response.ok) {
      console.warn('[Geocode] Nominatim reverse failed:', response.status, response.statusText)
      return null
    }

    const data = (await response.json()) as NominatimResponse
    const detail = extractDetail(data)
    return detail
  } catch (error) {
    console.warn('[Geocode] Nominatim reverse error:', error)
    return null
  }
}

async function fetchGeocodeDetail(
  lat: number,
  lng: number,
  language: string = 'en'
): Promise<GeocodeDetail | null> {
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null
  }

  const cacheKey = buildCacheKey(lat, lng, language)
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey) || null
  }

  let detail: GeocodeDetail | null = null

  // 优先使用 Mapbox
  detail = await reverseGeocodeMapbox(lat, lng, language)
  if (!detail) {
    // 回退到 Nominatim
    detail = await reverseGeocodeNominatim(lat, lng, language)
  }

  if (!detail) {
    geocodeCache.set(cacheKey, null)
    return null
  }

  try {
    geocodeCache.set(cacheKey, detail)
    return detail
  } catch (error) {
    console.warn('[Geocode] cache store failed:', error)
    return detail
  }
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  language: string = 'en'
): Promise<string | null> {
  const detail = await fetchGeocodeDetail(lat, lng, language)
  return detail?.label ?? null
}

export async function reverseGeocodeDetail(
  lat: number,
  lng: number,
  language: string = 'en'
): Promise<GeocodeDetail | null> {
  return fetchGeocodeDetail(lat, lng, language)
}

export async function reverseGeocodeToEnglish(lat: number, lng: number): Promise<string | null> {
  return reverseGeocode(lat, lng, 'en')
}

export async function reverseGeocodeToChinese(lat: number, lng: number): Promise<string | null> {
  return reverseGeocode(lat, lng, 'zh-CN')
}
