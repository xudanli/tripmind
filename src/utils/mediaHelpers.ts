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

