export const SYSTEM_PROMPTS = {
  'zh-CN': `你是一名专业的旅行规划师与叙事型文案。请基于用户输入生成可直接执行的连续行程。

目标：
- 结合目的地与偏好，产出可落地的多日行程（节奏、衔接、交通、预算意识完整）。
- 仅输出【严格 JSON】，可被 JSON.parse 直接解析；禁止 Markdown、代码块围栏、注释、额外前后缀、尾随逗号。

硬性规则：
1️⃣ 结构：键名与模板完全一致；不得增删/改名/改层级；所有必填字段给出合理值，数值用数字类型。
2️⃣ 解析：UTF-8；无代码块标记（如\`\`\`）；无行内/块注释；无尾逗号。
3️⃣ 每日：包含 theme、mood、≥1 activity。
   - activities[*].notes ≥ 40 字，需同时覆盖【文化脉络 + 实用信息 + 情绪感受】。
   - 时间：activity.time 用 24 小时制 "HH:mm"（前导零）；duration 为分钟整数。
   - 坐标：location.lat ∈ [-90,90]，location.lng ∈ [-180,180]。
4️⃣ 交通（transport 必填且具体）：
   - 含 mode（walk/bus/metro/taxi/ridehail/train/ferry/drive 等）、from、to、duration（分钟）、notes（购票/换乘/高峰期/安全）。
   - 起止点与上下文地点一致，时长合理；禁止“瞬移”。
5️⃣ 文风与执行：
   - 语言自然生动，但以可执行为先；写清“怎么走/怎么做/需准备什么”。
   - localTip 必须目的地独有（礼仪/规避坑/冷门技巧）。
6️⃣ 总览摘要：summary ≥ 100 字，形成叙事闭环（期待→亮点/转折→总结/洞见）。
7️⃣ 推断与一致性：
   - 信息不足时可合理推断，但需与目的地、季节、节奏、预算自洽；禁止“未知/N/A/待定”。
   - 时间线连续、地理动线合理；金额与时长有量化估算。
8️⃣ 质量与安全：
   - 不虚构关闭/不存在的交通与景点；避免明显过时或不安全建议。
   - 单位统一：时间=分钟；金额为数字；避免“很近/不远”等空泛词。
9️⃣ 输出：仅 JSON 正文，不得含标题、解释、Markdown 分隔线。

自检清单（生成前自我核对）：
- [ ] JSON 可解析（无围栏/无尾逗号）
- [ ] 字段齐全/类型正确/数值为数字
- [ ] 每日 ≥1 活动；notes ≥ 40 字（三维度齐全）
- [ ] transport 起止衔接与时长合理
- [ ] localTip 具体独特且可执行
- [ ] 总体 summary ≥ 100 字且有叙事弧
- [ ] 时间用 "HH:mm"，duration 用分钟；经纬度在合法范围`,
  'en-US': `You are a professional travel planner and narrative copywriter. Produce an actionable multi-day itinerary.

Goals:
- Convert inputs into a feasible, sequential plan (pacing, transfers, budget awareness).
- Output STRICT JSON only, directly parseable by JSON.parse; no Markdown/code fences/comments/extras/trailing commas.

Hard rules:
1️⃣ Structure: Keys & hierarchy must exactly match the template; no add/remove/rename/re-nesting; required fields must be sensible; numbers as numeric types.
2️⃣ Parsing: UTF-8; no code fences; no inline/block comments; no trailing commas.
3️⃣ Per-day: include theme, mood, and ≥1 activity.
   - activities[*].notes ≥ 40 words covering cultural context + practical tips + emotional tone.
   - activity.time uses 24-hour "HH:mm" (leading zeros); duration is minutes (integer).
   - location.lat ∈ [-90,90], location.lng ∈ [-180,180].
4️⃣ Transport (required & specific):
   - Provide mode (walk/bus/metro/taxi/ridehail/train/ferry/drive), from, to, duration (minutes), notes (ticketing/transfers/peak-hour/safety).
   - Start/end must align with previous/next locations; no teleportation; realistic durations.
5️⃣ Narrative + execution:
   - Immersive but concrete: routing, preparation, timing; avoid vague filler.
   - localTip must be destination-specific.
6️⃣ Trip summary ≥ 100 words with a clear arc (anticipation → highlights/turns → reflection).
7️⃣ Inference & consistency:
   - Infer plausibly when missing; stay coherent with destination & season; never use placeholders like "N/A".
   - Keep time & geography consistent; quantify time & money.
8️⃣ Quality & safety:
   - Do not invent closed/nonexistent options; avoid outdated/unsafe guidance.
   - Standardize units: time in minutes; numbers as numerals; avoid “nearby”—prefer estimates.
9️⃣ Output: JSON only; no text outside the JSON payload.

Preflight checklist:
- [ ] JSON parses (no fences/trailing commas)
- [ ] All fields present with correct types
- [ ] ≥1 activity/day; notes ≥ 40 words (3 dimensions)
- [ ] Transport links locations with realistic durations
- [ ] localTip specific & actionable
- [ ] Summary ≥ 100 words & narrative arc
- [ ] Time "HH:mm", duration minutes; lat/lng within bounds`
} as const

export type PlannerLocale = keyof typeof SYSTEM_PROMPTS
const DEFAULT_LOCALE: PlannerLocale = 'zh-CN'

export const USER_PROMPT_TEMPLATES: Record<PlannerLocale, (params: UserPromptParams) => string> = {
  'zh-CN': ({ destination, days, startDate, preferenceText, preferenceGuidance, dateInstructions, jsonTemplate }) => `仅返回严格 JSON（禁止任何额外文本）：

目的地：${destination}
行程天数：${days} 天
偏好：${preferenceText}
具体要求：${preferenceGuidance}
时间指引：${dateInstructions}

请遵循系统规则，并使用下列 JSON 模板（结构与键名需完全一致）填充真实内容：
${jsonTemplate}`,
  'en-US': ({ destination, days, startDate, preferenceText, preferenceGuidance, dateInstructions, jsonTemplate }) => `Return STRICT JSON only (no extra text):

Destination: ${destination}
Duration: ${days} days
Preferences: ${preferenceText}
Requirements: ${preferenceGuidance}
Date guidance: ${dateInstructions}

Follow the system rules and fill the JSON template below (structure & keys must match exactly):
${jsonTemplate}`
}

const DEFAULT_SYSTEM_PROMPT = SYSTEM_PROMPTS[DEFAULT_LOCALE]
const DEFAULT_USER_PROMPT_TEMPLATE = USER_PROMPT_TEMPLATES[DEFAULT_LOCALE]

interface UserPromptParams {
  destination: string
  days: number
  startDate: string
  preferenceText: string
  preferenceGuidance: string
  dateInstructions: string
  jsonTemplate: string
}

const getLocale = (language?: string): PlannerLocale => {
  if (!language) return DEFAULT_LOCALE
  const lower = language.toLowerCase()
  if (lower.startsWith('zh')) return 'zh-CN'
  if (lower.startsWith('en')) return 'en-US'
  return DEFAULT_LOCALE
}

const buildJsonTemplate = (params: {
  startDate: string
  destination: string
  language: string
  days: number
}) => {
  const { startDate, destination, language, days } = params
  const sampleNoteZh = '请从【文化/礼仪】【实用/路线/时间】【情绪/画面】三方面展开，≥40字，避免空泛。'
  const sampleNoteEn = 'Cover culture/etiquette, practical routing/timing, and emotional color. ≥40 words; avoid filler.'
  const sampleSummaryZh = '以第一/第二人称串联当日体验，包含节奏变化、具体细节与感受，结尾点明收获或转折。'
  const sampleSummaryEn = 'First/second-person recap with pacing shifts, a concrete detail, and feelings; end with a takeaway.'
  const summaryText = language === 'en-US' ? sampleSummaryEn : sampleSummaryZh
  const noteText = language === 'en-US' ? sampleNoteEn : sampleNoteZh

  // 模板仅示例第 1 天，其余天由模型补齐，但字段必须一致
  return `{
  "schemaVersion": "1.0",
  "title": "${destination}${language === 'en-US' ? ' Itinerary Plan' : '行程规划'}",
  "destination": "${destination}",
  "duration": ${days},
  "totalCost": ${days * 800},
  "currencyHint": "${language === 'en-US' ? 'local currency, numeric values only' : '使用当地货币，金额为数字'}",
  "summary": "${summaryText}",
  "days": [
    {
      "day": 1,
      "date": "${startDate}",
      "theme": "${language === 'en-US' ? 'First encounter with the city' : '初遇目的地'}",
      "mood": "${language === 'en-US' ? 'explore' : '探索'}",
      "summary": "${summaryText}",
      "activities": [
        {
          "time": "09:00",
          "title": "${language === 'en-US' ? 'Immersive activity title' : '沉浸式活动标题'}",
          "type": "attraction",
          "duration": 120,
          "location": { "lat": 0, "lng": 0 },
          "notes": "${noteText}",
          "localTip": "${language === 'en-US' ? 'Destination-specific etiquette or trick.' : '目的地特有礼仪或小技巧。'}",
          "transport": {
            "mode": "walk",
            "from": "${language === 'en-US' ? 'Previous spot' : '上一个地点'}",
            "to": "${language === 'en-US' ? 'Current spot' : '当前地点'}",
            "duration": 20,
            "notes": "${language === 'en-US' ? 'Step-by-step transfer advice and cautions.' : '分步衔接说明及注意事项。'}"
          },
          "cost": 0
        }
      ]
    }
  ],
  "recommendations": {
    "bestTimeToVisit": "",
    "weatherAdvice": "",
    "packingTips": [],
    "localTips": [],
    "emergencyContacts": []
  },
  "aiInsights": {
    "optimizationSuggestions": [],
    "alternativeActivities": [],
    "budgetOptimization": [],
    "culturalNotes": []
  }
}`
}

export function buildPlannerSystemPrompt(language?: string): string {
  const locale = getLocale(language)
  const prompt = SYSTEM_PROMPTS[locale]
  return typeof prompt === 'string' ? prompt : DEFAULT_SYSTEM_PROMPT
}

export function buildOptimizationSystemPrompt(): string {
  return `Return STRICT JSON only. No code fences, no comments, no prose.
Keys and hierarchy must match the input schema. Numbers must be numeric.`
}

export interface PlannerItineraryPromptRequest {
  destination: string
  duration: number
  budget: string
  preferences: string[]
  travelStyle: string
  customRequirements?: string
  language?: string
  startDate: string
}

export function buildPlannerUserPrompt(request: PlannerItineraryPromptRequest): string {
  const locale = getLocale(request.language)
  const days = request.duration
  const preferenceText = request.preferences?.length
    ? request.preferences.join(locale === 'en-US' ? ', ' : '、')
    : locale === 'en-US' ? 'General preferences' : '通用偏好'
  const extra = request.customRequirements?.trim()
  const preferenceGuidance = locale === 'en-US'
    ? `Budget: ${request.budget}; Pace: ${request.travelStyle}${extra ? `; Extra: ${extra}` : ''}`
    : `预算：${request.budget}；节奏：${request.travelStyle}${extra ? `；自定义要求：${extra}` : ''}`
  const dateInstructions = locale === 'en-US'
    ? `Suggested start date ${request.startDate}, lasting ${days} consecutive days`
    : `建议从 ${request.startDate} 开始，连续 ${days} 天`

  const jsonTemplate = buildJsonTemplate({
    startDate: request.startDate,
    destination: request.destination,
    language: locale,
    days
  })

  const templateBuilder = USER_PROMPT_TEMPLATES[locale]
  const builder = typeof templateBuilder === 'function' ? templateBuilder : DEFAULT_USER_PROMPT_TEMPLATE
  return builder({
    destination: request.destination,
    days,
    startDate: request.startDate,
    preferenceText,
    preferenceGuidance,
    dateInstructions,
    jsonTemplate
  })
}
