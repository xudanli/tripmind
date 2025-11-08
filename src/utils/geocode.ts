const geocodeCache = new Map<string, string | null>()

interface NominatimResponse {
  display_name?: string
  address?: {
    city?: string
    town?: string
    village?: string
    county?: string
    state?: string
    country?: string
  }
}

const buildCacheKey = (lat: number, lng: number) => `${lat.toFixed(4)},${lng.toFixed(4)}`

const buildLocationLabel = (data: NominatimResponse): string | null => {
  const address = data.address || {}
  const city = address.city || address.town || address.village
  const state = address.state || address.county
  const country = address.country

  const parts = [city, state, country].filter(Boolean)
  if (parts.length > 0) {
    return parts.slice(0, 2).join(', ')
  }

  if (data.display_name) {
    const segments = data.display_name.split(',').map(segment => segment.trim())
    return segments.slice(0, 2).join(', ')
  }

  return null
}

export async function reverseGeocodeToEnglish(lat: number, lng: number): Promise<string | null> {
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null
  }

  const cacheKey = buildCacheKey(lat, lng)
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
      'accept-language': 'en'
    })

    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
      headers: {
        'User-Agent': 'ai-travel-companion/1.0 (+support@ai-travel-companion.local)'
      }
    })

    if (!response.ok) {
      console.warn('[Geocode] reverse lookup failed:', response.status, response.statusText)
      geocodeCache.set(cacheKey, null)
      return null
    }

    const data = (await response.json()) as NominatimResponse
    const label = buildLocationLabel(data)
    geocodeCache.set(cacheKey, label ?? null)
    return label ?? null
  } catch (error) {
    console.warn('[Geocode] reverse lookup error:', error)
    geocodeCache.set(cacheKey, null)
    return null
  }
}


