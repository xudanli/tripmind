/**
 * Unsplash API 服务
 * 用于获取旅行相关的图片
 * 如果 Unsplash 失败，会自动回退到 iStockPhoto/Pexels
 */

import { API_CONFIG } from '@/config/api'
import { sanitizeLabelToKeyword } from '@/utils/mediaHelpers'
import { searchIStockPhoto, type IStockPhoto } from './istockphotoAPI'
import { searchPexelsPhotos, type PexelsPhoto } from './pexelsAPI'

export interface UnsplashPhoto {
  id: string
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
  width: number
  height: number
  description: string | null
  alt_description: string | null
  user: {
    name: string
    username: string
  }
}

type UnsplashSearchOptions = {
  orientation?: 'landscape' | 'portrait' | 'squarish'
  per_page?: number
}

/**
 * 将 iStockPhoto 格式转换为 UnsplashPhoto 格式（用于兼容）
 */
function convertIStockToUnsplash(photo: IStockPhoto): UnsplashPhoto {
  return {
    id: photo.id,
    urls: {
      raw: photo.url,
      full: photo.url,
      regular: photo.url,
      small: photo.thumbnail,
      thumb: photo.thumbnail
    },
    width: photo.width,
    height: photo.height,
    description: photo.description || null,
    alt_description: photo.title || null,
    user: {
      name: photo.title,
      username: 'istockphoto'
    }
  }
}

function convertPexelsToUnsplash(photo: PexelsPhoto): UnsplashPhoto {
  const src = photo.src
  return {
    id: `pexels-${photo.id}`,
    urls: {
      raw: src.original,
      full: src.large2x || src.original,
      regular: src.large || src.medium || src.original,
      small: src.small || src.medium || src.original,
      thumb: src.tiny || src.small || src.original
    },
    width: photo.width,
    height: photo.height,
    description: photo.alt || null,
    alt_description: photo.alt || null,
    user: {
      name: photo.photographer || 'Pexels',
      username: photo.photographer ? `${photo.photographer} (Pexels)` : 'pexels'
    }
  }
}

async function fetchFallbackPhotos(query: string, options: UnsplashSearchOptions): Promise<UnsplashPhoto[]> {
  const fallbackResults: UnsplashPhoto[] = []

  const perPage = options.per_page ?? 10

  try {
    const pexelsOrientation =
      options.orientation === 'squarish'
        ? 'square'
        : options.orientation ?? undefined

    const pexelsPhotos = await searchPexelsPhotos(query, {
      perPage,
      orientation: pexelsOrientation as 'landscape' | 'portrait' | 'square' | undefined
    })

    if (pexelsPhotos.length > 0) {
      console.log(`✅ 使用 Pexels 获取到 ${pexelsPhotos.length} 张图片`)
      fallbackResults.push(...pexelsPhotos.map(convertPexelsToUnsplash))
    }
  } catch (pexelsError: any) {
    console.warn('[Pexels] 图片检索失败:', pexelsError?.message || pexelsError)
  }

  if (fallbackResults.length > 0) {
    return fallbackResults
  }

  try {
    const istockPhotos = await searchIStockPhoto(query, options)
    if (istockPhotos.length > 0) {
      console.log(`✅ 使用 iStockPhoto 获取到 ${istockPhotos.length} 张图片`)
      return istockPhotos.map(convertIStockToUnsplash)
    }
  } catch (fallbackError: any) {
    console.warn('iStockPhoto 后备也失败:', fallbackError?.message || fallbackError)
  }

  return []
}

export interface UnsplashSearchResponse {
  total: number
  total_pages: number
  results: UnsplashPhoto[]
}

/**
 * 根据关键词搜索图片（返回多张）
 */
export async function searchUnsplashPhotos(
  query: string,
  options: UnsplashSearchOptions = {}
): Promise<UnsplashPhoto[]> {
  try {
    const { orientation = 'landscape', per_page = 10 } = options
    
    const params = new URLSearchParams({
      query: query,
      orientation: orientation,
      per_page: per_page.toString(),
      client_id: API_CONFIG.UNSPLASH_ACCESS_KEY
    })

    const response = await fetch(
      `${API_CONFIG.UNSPLASH_API_URL}${API_CONFIG.ENDPOINTS.UNSPLASH_SEARCH}?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Accept-Version': 'v1'
        }
      }
    )

    if (!response.ok) {
      let errorText = ''
      try {
        errorText = await response.text()
      } catch (e) {
        // 忽略读取错误文本的失败
      }
      
      const errorMsg = `Unsplash API error: ${response.status} ${response.statusText}`
      
      // 403错误通常是API key问题或权限问题
      if (response.status === 403) {
        console.warn(`⚠️ Unsplash API 403 Forbidden - 可能是API key无效或权限不足`)
        if (errorText) {
          console.warn(`   错误详情: ${errorText.substring(0, 200)}`)
        }
      } else if (response.status === 401) {
        console.warn(`⚠️ Unsplash API 401 Unauthorized - API key可能无效`)
      } else if (response.status === 429) {
        console.warn(`⚠️ Unsplash API 429 Too Many Requests - 请求频率过高，请稍后再试`)
      }
      
      throw new Error(errorMsg)
    }

    const data: UnsplashSearchResponse = await response.json()
    
    if (data.results && data.results.length > 0) {
      return data.results
    }

    const fallbackPhotos = await fetchFallbackPhotos(query, options)
    if (fallbackPhotos.length > 0) {
      return fallbackPhotos
    }
    
    return []
  } catch (error: any) {
    // 只在非网络错误时输出警告（网络错误可能是正常的超时）
    if (error?.message && !error.message.includes('fetch')) {
      console.warn('Unsplash搜索失败，尝试使用 Pexels/iStockPhoto:', error.message)
    }
    
    const fallbackPhotos = await fetchFallbackPhotos(query, options)
    if (fallbackPhotos.length > 0) {
      return fallbackPhotos
    }
    
    return []
  }
}

/**
 * 根据关键词搜索图片（返回单张，向后兼容）
 */
export async function searchUnsplashPhoto(
  query: string,
  options: UnsplashSearchOptions = {}
): Promise<UnsplashPhoto | null> {
  try {
    const photos = await searchUnsplashPhotos(query, { ...options, per_page: 1 })
    if (photos.length > 0) {
      return photos[0]
    }
    
    const fallbackPhotos = await fetchFallbackPhotos(query, { ...options, per_page: options.per_page ?? 3 })
    if (fallbackPhotos.length > 0) {
      const firstFallback = fallbackPhotos[0]
      if (firstFallback) {
        return firstFallback
      }
    }
    
    return null
  } catch (error: any) {
    console.warn('搜索图片失败:', error.message)
    const fallbackPhotos = await fetchFallbackPhotos(query, { ...options, per_page: options.per_page ?? 3 })
    if (fallbackPhotos.length > 0) {
      const firstFallback = fallbackPhotos[0]
      if (firstFallback) {
        return firstFallback
      }
    }
    return null
  }
}

/**
 * 为活动生成搜索关键词
 */
const ASCII_DIACRITICS_REGEX = /[\u0300-\u036f]/g
const ENGLISH_SEGMENT_REGEX = /[A-Za-z][A-Za-z0-9\s'&,.\-]*/g

const toText = (value: any) => (typeof value === 'string' ? value.trim() : '')

const normalizeAscii = (value: string) =>
  value
    .normalize('NFKD')
    .replace(ASCII_DIACRITICS_REGEX, '')

const dedupe = (values: string[]) => {
  const seen = new Set<string>()
  return values
    .map((item) => sanitizeLabelToKeyword(item))
    .filter((item) => {
      if (!item) return false
      const lowered = item.toLowerCase()
      if (seen.has(lowered)) return false
      seen.add(lowered)
      return true
    })
}

const extractEnglishSegments = (value?: string | null): string[] => {
  const text = toText(value)
  if (!text) return []
  const normalized = normalizeAscii(text)
  if (!/[A-Za-z]/.test(normalized)) {
    return []
  }
  const segments = normalized.match(ENGLISH_SEGMENT_REGEX)
  if (!segments || segments.length === 0) {
    return [normalized.trim()]
  }
  return dedupe(segments.map((segment) => segment.trim()).filter(Boolean))
  }
  
interface GenerateSearchQueryOptions {
  fallback?: string
  preferEnglish?: boolean
  includeActivityTerms?: boolean
  locationHint?: string
}

export function generateSearchQuery(
  slot: any,
  destination?: string,
  options: GenerateSearchQueryOptions = {}
): string {
  const { fallback, preferEnglish = false, includeActivityTerms = true, locationHint } = options

  const activityCandidates = includeActivityTerms
    ? [
        toText(slot.details?.name?.english),
        toText(slot.title),
        toText(slot.activity),
        toText(slot.details?.name?.local),
        toText(slot.details?.name?.chinese)
      ].filter(Boolean)
    : []

  const locationCandidates = [
    toText(locationHint),
    toText(slot.details?.address?.english),
    toText(slot.details?.address?.local),
    toText(slot.details?.address?.chinese),
    toText(slot.location),
    toText(destination),
    toText(fallback)
  ].filter(Boolean)

  const englishActivityTerms =
    preferEnglish && includeActivityTerms
      ? dedupe([
          ...activityCandidates.flatMap((item) => extractEnglishSegments(item)),
          ...extractEnglishSegments(slot?.details?.address?.english),
          ...extractEnglishSegments(slot?.details?.address?.local)
        ])
      : []

  const englishLocationTerms = preferEnglish
    ? dedupe([
        ...locationCandidates.flatMap((item) => extractEnglishSegments(item)),
        ...extractEnglishSegments(destination),
        ...extractEnglishSegments(fallback)
      ])
    : []

  const activityTerms = dedupe(activityCandidates)
  const locationTerms = dedupe(locationCandidates)

  const preferredActivityTerms =
    preferEnglish && englishActivityTerms.length > 0 ? englishActivityTerms : activityTerms
  const preferredLocationTerms =
    preferEnglish && englishLocationTerms.length > 0 ? englishLocationTerms : locationTerms

  if (preferredActivityTerms.length && preferredLocationTerms.length) {
    return `${preferredActivityTerms[0]} ${preferredLocationTerms[0]}`.trim()
  }

  if (preferredLocationTerms.length) {
    const firstLocation = preferredLocationTerms[0]
    if (firstLocation) {
      return firstLocation
    }
  }

  if (preferredActivityTerms.length) {
    const firstActivity = preferredActivityTerms[0]
    if (firstActivity) {
      return firstActivity
    }
  }
  
  const type = toText(slot.type || slot.category || '')
  const englishType = preferEnglish ? extractEnglishSegments(type)[0] : undefined
  const typeTerm = preferEnglish ? englishType || type : type

  if (typeTerm && destination) {
    const destinationTerm = preferEnglish
      ? extractEnglishSegments(destination)[0] || destination
      : destination
    return `${sanitizeLabelToKeyword(typeTerm)} ${sanitizeLabelToKeyword(destinationTerm)}`
  }
  
  if (destination) {
    const destinationTerm = preferEnglish
      ? extractEnglishSegments(destination)[0] || destination
      : destination
    const sanitized = sanitizeLabelToKeyword(destinationTerm)
    return sanitized || 'travel experience'
  }

  return 'travel experience'
}

/**
 * 获取活动的图片URL（单张）
 */
export async function getActivityImage(
  slot: any,
  destination?: string,
  options: {
    orientation?: 'landscape' | 'portrait' | 'squarish'
    size?: 'small' | 'regular' | 'full'
  } = {}
): Promise<string | null> {
  const { orientation = 'landscape', size = 'regular' } = options
  
  const query = generateSearchQuery(slot, destination)
  const photo = await searchUnsplashPhoto(query, { orientation, per_page: 1 })
  
  if (photo) {
    return photo.urls[size] || photo.urls.regular
  }
  
  return null
}

/**
 * 获取活动的多张图片URL
 */
export async function getActivityImagesList(
  slot: any,
  destination?: string,
  options: {
    orientation?: 'landscape' | 'portrait' | 'squarish'
    size?: 'small' | 'regular' | 'full'
    count?: number
  } = {}
): Promise<string[]> {
  const { orientation = 'landscape', size = 'regular', count = 10 } = options
  
  const query = generateSearchQuery(slot, destination)
  const photos = await searchUnsplashPhotos(query, { orientation, per_page: count })
  
  return photos.map(photo => photo.urls[size] || photo.urls.regular)
}

/**
 * 批量获取多个活动的图片
 */
export async function getActivityImages(
  slots: any[],
  destination?: string,
  options: {
    orientation?: 'landscape' | 'portrait' | 'squarish'
    size?: 'small' | 'regular' | 'full'
    delay?: number // 请求之间的延迟（毫秒），避免过快请求
  } = {}
): Promise<Map<string, string>> {
  const { delay = 100 } = options
  const imageMap = new Map<string, string>()
  
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]
    const slotKey = `${slot.time || i}_${slot.title || slot.activity || i}`
    
    try {
      const imageUrl = await getActivityImage(slot, destination, options)
      if (imageUrl) {
        imageMap.set(slotKey, imageUrl)
      }
      
      // 添加延迟，避免请求过快
      if (i < slots.length - 1 && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    } catch (error) {
      console.warn(`获取活动图片失败 (${slotKey}):`, error)
    }
  }
  
  return imageMap
}
