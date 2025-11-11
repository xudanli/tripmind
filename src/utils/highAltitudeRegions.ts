import { HIGH_ALTITUDE_REGIONS, type HighAltitudeRegion, type AltitudeCategory } from '@/data/highAltitudeRegions'

const CATEGORY_PRIORITY: Record<AltitudeCategory, number> = {
  extreme: 3,
  high: 2,
  medium: 1,
}

const normalize = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[\s·•、,，\-—_\/\\]+/g, '')
}

export function findHighAltitudeRegion(name: string | undefined | null): HighAltitudeRegion | null {
  if (!name) return null
  const normalized = normalize(name)
  if (!normalized) return null

  for (const region of HIGH_ALTITUDE_REGIONS) {
    const base = normalize(region.name)
    if (base && normalized.includes(base)) {
      return region
    }
    if (region.aliases) {
      for (const alias of region.aliases) {
        const aliasNormalized = normalize(alias)
        if (aliasNormalized && normalized.includes(aliasNormalized)) {
          return region
        }
      }
    }
  }
  return null
}

export function isHighAltitudeRegion(
  name: string | undefined | null,
  minimum: AltitudeCategory = 'high'
): boolean {
  const region = findHighAltitudeRegion(name)
  if (!region) return false
  return CATEGORY_PRIORITY[region.category] >= CATEGORY_PRIORITY[minimum]
}

export function listHighAltitudeRegions(): HighAltitudeRegion[] {
  return HIGH_ALTITUDE_REGIONS.slice()
}
