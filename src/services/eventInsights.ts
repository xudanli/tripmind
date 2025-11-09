import { API_CONFIG } from '@/config/api'

export interface FestivalEvent {
  id: string
  name: string
  category?: string
  mood?: string
  start: string
  end: string
  url?: string
  source: string
  fetchedAt: string
}

const toISO = (date: string | Date) =>
  new Date(date).toISOString().split('.')[0] + 'Z'

const formatRangeLabel = (startISO: string, locale: string) => {
  const date = new Date(startISO)
  if (Number.isNaN(date.getTime())) return startISO
  return locale.startsWith('zh')
    ? `${date.getMonth() + 1}月`
    : date.toLocaleString(locale, { month: 'short', timeZone: 'UTC' })
}

const deriveMood = (category: string | undefined) => {
  if (!category) return undefined
  const lower = category.toLowerCase()
  if (lower.includes('music') || lower.includes('concert')) return '欢庆'
  if (lower.includes('art') || lower.includes('exhibit')) return '艺术'
  if (lower.includes('festival') || lower.includes('culture')) return '文化'
  if (lower.includes('wellness') || lower.includes('meditation')) return '沉静'
  return undefined
}

export async function fetchFestivalEvents(options: {
  destination: string
  startDate: string
  endDate: string
  language: string
  limit?: number
}): Promise<FestivalEvent[]> {
  const { destination, startDate, endDate, language, limit = 5 } = options
  if (!destination || !startDate || !endDate) return []

  const token = API_CONFIG.EVENTBRITE_API_TOKEN
  if (!token) {
    if (import.meta.env.DEV) {
      console.info('[FestivalEvents] EVENTBRITE_API_TOKEN 未配置，跳过节庆数据。')
    }
    return []
  }

  try {
    const baseUrl =
      API_CONFIG.EVENTBRITE_API_URL?.endsWith('/v3')
        ? API_CONFIG.EVENTBRITE_API_URL
        : `${API_CONFIG.EVENTBRITE_API_URL?.replace(/\/$/, '') || 'https://www.eventbriteapi.com'}/v3`

    const params = new URLSearchParams({
      'location.address': destination,
      'start_date.range_start': toISO(startDate),
      'start_date.range_end': toISO(endDate),
      'sort_by': 'date',
      'expand': 'venue,category',
      'page_size': Math.min(limit, 50).toString(),
      'locale': language,
    })

    const url = `${baseUrl}/events/search/?${params.toString()}`

    if (import.meta.env.DEV) {
      console.info('[FestivalEvents] Request URL', url)
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      if (import.meta.env.DEV) {
        console.warn('[FestivalEvents] Eventbrite 请求失败:', response.status, response.statusText)
      }
      return []
    }

    const data = await response.json()
    const events: FestivalEvent[] = (data.events || [])
      .filter((event: any) => event && event.name?.text)
      .map((event: any) => {
        const category = event.category?.name || event.category?.short_name
        return {
          id: String(event.id),
          name: event.name?.text || '',
          category,
          mood: deriveMood(category),
          start: event.start?.local || event.start?.utc || '',
          end: event.end?.local || event.end?.utc || '',
          url: event.url,
          source: 'Eventbrite',
          fetchedAt: new Date().toISOString().split('T')[0],
        }
      })
      .slice(0, limit)

    if (!events.length) {
      if (import.meta.env.DEV) {
        console.info('[FestivalEvents] no events found', { destination, startDate, endDate })
      }
      return []
    }

    const labelPrefixLocale = language || 'zh-CN'
    const enriched = events.map((item) => ({
      ...item,
      category: item.category,
      mood: item.mood,
      name: `${formatRangeLabel(item.start, labelPrefixLocale)} · ${item.name}`,
    }))

    if (import.meta.env.DEV) {
      console.info('[FestivalEvents] Eventbrite success', {
        destination,
        count: enriched.length,
      })
    }

    return enriched
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[FestivalEvents] 节庆数据获取失败:', (error as Error).message)
    }
    return []
  }
}

