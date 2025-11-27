import type { HighlightDetail } from '@/stores/travel'

export type HighlightInput = string | HighlightDetail

export function highlightToLabel(highlight: HighlightInput): string {
  if (typeof highlight === 'string') return highlight
  return highlight?.title || highlight?.description || highlight?.feeling || ''
}

export function sanitizeLabelToKeyword(label: string): string {
  return label
    .trim()
    .replace(/\s+/g, ' ')
}

export function createMediaKey(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function createHighlightMediaKey(scope: string, highlight: HighlightInput): string {
  const label = highlightToLabel(highlight)
  return `${scope}:${createMediaKey(label || `highlight-${Math.random().toString(36).slice(2, 8)}`)}`
}

export function buildSearchQuery(destination: string | undefined, scopeLabel: string | undefined, highlight: HighlightInput): string {
  const parts = [destination, scopeLabel, highlightToLabel(highlight)]
  return parts
    .filter((part) => typeof part === 'string' && part.trim().length > 0)
    .map((part) => sanitizeLabelToKeyword(part as string))
    .join(' ')
    .trim()
}

export function createSlotMediaKey(destination: string | undefined, slot: any): string {
  const pieces = [
    destination,
    slot?.title,
    slot?.activity,
    slot?.location,
    slot?.details?.name?.chinese,
    slot?.details?.name?.english
  ]
  const label = pieces
    .filter((part) => typeof part === 'string' && part.trim().length > 0)
    .map((part) => sanitizeLabelToKeyword(part as string))
    .join(' ')
  return `slot:${createMediaKey(label || `activity-${Math.random().toString(36).slice(2, 8)}`)}`
}

/**
 * 将新媒体API的VideoInfo转换为InspirationVideo格式
 */
export function convertVideoInfoToInspiration(videoInfo: {
  id: string
  url: string
  thumbnailUrl?: string
  width: number
  height: number
  duration: number
  description?: string
  photographer?: string
  sourceUrl?: string
}): {
  id: number
  title: string
  duration: number
  previewImage: string
  downloadUrl: string
  width: number
  height: number
  sourceUrl: string
  photographer?: string
  photographerUrl?: string
} {
  // 从ID中提取数字，如果提取失败则使用hash值
  let numericId = 0
  const idMatch = videoInfo.id.match(/\d+/)
  if (idMatch) {
    numericId = parseInt(idMatch[0], 10) || 0
  } else {
    // 如果ID中没有数字，使用字符串hash
    let hash = 0
    for (let i = 0; i < videoInfo.id.length; i++) {
      const char = videoInfo.id.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    numericId = Math.abs(hash)
  }

  return {
    id: numericId,
    title: videoInfo.description || '',
    duration: videoInfo.duration || 0,
    previewImage: videoInfo.thumbnailUrl || '',
    downloadUrl: videoInfo.url,
    width: videoInfo.width || 1920,
    height: videoInfo.height || 1080,
    sourceUrl: videoInfo.sourceUrl || '',
    photographer: videoInfo.photographer,
    photographerUrl: videoInfo.sourceUrl || ''
  }
}

/**
 * 根据size参数获取合适的图片URL
 */
export function getImageUrlBySize(imageInfo: any, size: 'small' | 'regular' | 'full' = 'regular'): string {
  if (size === 'small' && imageInfo.thumbnailUrl) {
    return imageInfo.thumbnailUrl
  }
  return imageInfo.url || ''
}

