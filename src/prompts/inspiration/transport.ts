import { buildLanguageRequirementBlock } from './common'

interface ActivityGeo {
  title: string
  location: string
  geo?: {
    source?: string
    lat?: number
    lng?: number
    placeId?: string
    fullAddress?: string
    country?: string
    region?: string
    locality?: string
    neighborhood?: string
  }
}

export interface TransportPromptArgs {
  dayIndex: number
  slotIndex: number
  language: string
  current: ActivityGeo
  previous?: ActivityGeo | null
  next?: ActivityGeo | null
}

/**
 * 构建交通衔接建议提示词
 */
export function buildTransportPrompt(args: TransportPromptArgs): { system: string; user: string } {
  const { dayIndex, slotIndex, language, current, previous, next } = args
  const isEnglish = language.startsWith('en')

  const languageRequirement = buildLanguageRequirementBlock(language, [
    'summary',
    'segments[].mode',
    'segments[].steps',
    'segments[].notes',
  ])

  const currentLabel = `[${slotIndex + 1}] ${current.title} @ ${current.location}`
  const prevLabel = previous ? `[${slotIndex}] ${previous.title} @ ${previous.location}` : 'None'
  const nextLabel = next ? `[${slotIndex + 2}] ${next.title} @ ${next.location}` : 'None'

  const mapboxReminder = isEnglish
    ? `Use Mapbox data (lat/lng/placeId/context) for coordinates and routing distance/time.`
    : `地理与路程信息必须基于 Mapbox 数据（lat/lng/placeId/行政区上下文）生成。`

  const acclimatizationHint = isEnglish
    ? `If altitude changes by >800m compared with previous/next nodes (e.g., traveling around Mount Kailash), insert guidance for acclimatization (stay overnight, hydrate, staged ascent).`
    : `若与前后节点海拔差超过 800 米（如冈仁波齐等高海拔地区），请加入高原适应建议（过夜、补水、分段上升等）。`

  const systemPrompt = isEnglish
    ? `You are a transport concierge for an inspiration journey. Generate door-to-door transport guidance between itinerary nodes.

${languageRequirement}

Context:
- Day: ${dayIndex}
- Current Stop: ${currentLabel}
- Previous Stop: ${prevLabel}
- Next Stop: ${nextLabel}
- ${mapboxReminder}
- ${acclimatizationHint}

Output concise, actionable guidance that connects the previous node → current node → next node (if available).`
    : `你是灵感旅程的交通礼宾。请为相邻节点生成门到门交通衔接建议。

${languageRequirement}

上下文：
- 天数：第 ${dayIndex} 天
- 当前节点：${currentLabel}
- 前一节点：${prevLabel}
- 下一节点：${nextLabel}
- ${mapboxReminder}
- ${acclimatizationHint}

请输出紧凑、可执行的交通建议，衔接前一节点 → 当前节点 → 下一节点（若存在）。`

  const userPrompt = isEnglish
    ? `Produce JSON:
{
  "summary": "overall transport summary (<=45 words)",
  "segments": [
    {
      "from": "label",
      "to": "label",
      "mode": "primary transport mode (e.g., airport shuttle + high-speed rail + taxi)",
      "distance": "Mapbox distance (km/mi)",
      "duration": "Mapbox duration (minutes)",
      "steps": ["step-by-step instructions"],
      "altitudeAdvice": "if applicable",
      "mapboxRouteId": "<optional>",
      "notes": "practical reminders (tickets, transfer buffers, vehicle availability)",
      "source": "MAPBOX"
    }
  ]
}
If previous or next does not exist, omit that segment. Ensure segments array is not empty.`
    : `输出 JSON：
{
  "summary": "总体交通摘要（≤45字）",
  "segments": [
    {
      "from": "起点标签",
      "to": "终点标签",
      "mode": "主要交通方式（如：机场摆渡+高铁+出租车）",
      "distance": "基于 Mapbox 的距离（公里/英里）",
      "duration": "基于 Mapbox 的时长（分钟）",
      "steps": ["逐步指引"],
      "altitudeAdvice": "若需要给出高原适应提醒",
      "mapboxRouteId": "<可选>",
      "notes": "购票/换乘时间/车辆可达性等提醒",
      "source": "MAPBOX"
    }
  ]
}
若没有前一或后一节点，相应段落可省略，但 segments 数组不得为空。`

  return { system: systemPrompt, user: userPrompt }
}

