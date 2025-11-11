export type TransportMode = {
  value: string
  label: string
  synonyms: string[]
}

const BASE_TRANSPORT_MODES: TransportMode[] = [
  {
    value: '步行',
    label: '步行',
    synonyms: ['步行', 'walking', 'walk', 'on foot', 'walkable', '徒步', 'foot']
  },
  {
    value: '地铁',
    label: '地铁',
    synonyms: ['地铁', 'metro', 'subway', 'underground', 'tube', 'lrt', 'rail', 'rapid transit']
  },
  {
    value: '公交',
    label: '公交',
    synonyms: ['公交', 'bus', 'public bus', 'coach', 'public transit', 'city bus']
  },
  {
    value: '出租车',
    label: '出租车',
    synonyms: ['出租车', 'taxi', 'cab', 'taxis']
  },
  {
    value: '网约车',
    label: '网约车',
    synonyms: ['网约车', 'ride-hailing', 'ride hailing', 'ride-hailing service', 'uber', 'lyft', 'didi', '滴滴', 'app car']
  },
  {
    value: '自驾',
    label: '自驾',
    synonyms: ['自驾', 'self-drive', 'self drive', 'driving', 'drive', 'car', 'rental car']
  },
  {
    value: '包车',
    label: '包车',
    synonyms: ['包车', 'charter', 'private transfer', 'private car', 'private driver', 'hire car']
  },
  {
    value: '骑行',
    label: '骑行',
    synonyms: ['骑行', 'cycling', 'bike', 'biking', 'bicycle', 'ride a bike']
  },
  {
    value: '轮渡',
    label: '轮渡',
    synonyms: ['轮渡', 'ferry', 'boat', 'boat ride', 'ferry boat', 'water bus']
  },
  {
    value: '缆车',
    label: '缆车',
    synonyms: ['缆车', 'cable car', 'gondola', 'ropeway', 'tramway']
  },
  {
    value: '徒步',
    label: '徒步',
    synonyms: ['徒步', 'hike', 'hiking', 'trek', 'trekking']
  },
  {
    value: '班车',
    label: '班车',
    synonyms: ['班车', 'shuttle', 'shuttle bus', 'airport shuttle', 'transfer coach']
  },
  {
    value: '拼车',
    label: '拼车',
    synonyms: ['拼车', 'carpool', 'shared ride', 'shared transfer', 'shared shuttle']
  }
]

export const TRANSPORT_MODE_OPTIONS = BASE_TRANSPORT_MODES.map(({ value, label }) => ({
  value,
  label
}))

const NORMALIZED_MAP: Array<{ matcher: (text: string) => boolean; value: string }> = BASE_TRANSPORT_MODES.flatMap(
  (mode) => {
    const lowered = mode.synonyms.map((synonym) => synonym.toLowerCase())
    return lowered.map((synonym) => ({
      matcher: (text: string) => text.includes(synonym),
      value: mode.value
    }))
  }
)

const cleanText = (input: string): string => {
  return input
    .replace(/^[•\-\s]+/, '')
    .trim()
    .toLowerCase()
}

export function normalizeTransportModes(raw: Array<string | null | undefined> | null | undefined): string[] {
  if (!raw || !Array.isArray(raw)) return []
  const results = new Set<string>()

  raw.forEach((item) => {
    if (!item || typeof item !== 'string') return
    const cleaned = cleanText(item)
    if (!cleaned) return

    const match = NORMALIZED_MAP.find(({ matcher }) => matcher(cleaned))
    if (match) {
      results.add(match.value)
    }
  })

  return Array.from(results)
}
