// @ts-nocheck
// path: src/services/plannerAPI.ts
import { chatWithLLM } from './deepseekAPI'
import {
  buildPlannerSystemPrompt,
  buildPlannerUserPrompt,
  buildOptimizationSystemPrompt,
  type PlannerItineraryPromptRequest
} from '@/prompts/planner/itinerary'
import {
  validateLLMJson,
  sanitizeLLMJson,
  validateAppItinerary
} from '@/utils/itineraryValidator'

export interface PlannerItineraryRequest {
  destination: string
  duration: number
  budget: string
  preferences: string[]
  travelStyle: string
  customRequirements?: string
  language?: string
}

export interface TimeSlot {
  time: string
  activity: string
  location: string
  icon: string
  category: string
  categoryColor: string
  notes?: string
  estimatedDuration: number // hours
  estimatedCost: number
  coordinates?: { lat: number; lng: number }
}

export interface DayPlan {
  date: string
  title: string
  description: string
  status: 'planned' | 'in-progress' | 'completed'
  stats: { duration: number; cost: number } // duration in hours
  timeSlots: TimeSlot[]
}

export interface PlannerItineraryResponse {
  title: string
  destination: string
  duration: number
  totalCost: number
  summary: string
  days: DayPlan[]
  recommendations: {
    bestTimeToVisit: string
    weatherAdvice: string
    packingTips: string[]
    localTips: string[]
    emergencyContacts: string[]
  }
  aiInsights: {
    optimizationSuggestions: string[]
    alternativeActivities: string[]
    budgetOptimization: string[]
    culturalNotes: string[]
  }
}

type JsonValue = any

// ------------------------- Utils (why: 统一解析/容错/归一化) -------------------------
const toStr = (v: unknown, fallback = '') => {
  const s = (v ?? '').toString().trim()
  return s.length ? s : fallback
}
const toNum = (v: unknown, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback)
const toArr = <T = unknown>(v: unknown) => (Array.isArray(v) ? (v as T[]) : ([] as T[]))

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

const extractJsonFromText = (text: string): string => {
  if (!text) return ''
  // 1) ```json ... ```
  const m1 = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (m1?.[1]) return m1[1].trim()
  // 2) 第一个 { ... }（容忍内嵌）
  const m2 = text.match(/\{[\s\S]*\}/)
  if (m2) return m2[0]
  // 3) 原文
  return text.trim()
}

const sanitizeJsonText = (s: string): string => {
  // 仅做不会破坏内容的“修复”，避免过度改写
  let out = s
  // 将字符串内的裸换行转义，避免 JSON 失效
  out = (() => {
    let buf = ''
    let inStr = false
    let esc = false
    for (let i = 0; i < out.length; i++) {
      const ch = out[i]
      if (!inStr) {
        if (ch === '"') { inStr = true; buf += ch; continue }
        buf += ch; continue
      }
      if (esc) { buf += ch; esc = false; continue }
      if (ch === '\\') { buf += ch; esc = true; continue }
      if (ch === '"') { buf += ch; inStr = false; continue }
      if (ch === '\n' || ch === '\r') { buf += '\\n'; continue }
      buf += ch
    }
    if (inStr) buf += '"' // 补引号（极端情况）
    return buf
  })()
  // 直引号化
  out = out.replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
  // 移除注释
  out = out.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
  // 去末尾逗号
  out = out.replace(/,\s*(\}|\])/g, '$1')
  // 清理控制符
  out = out.replace(/[\u0000-\u001F\u007F\u00A0]/g, ' ')
  return out.trim()
}

const repairTruncation = (s: string): string => {
  let out = ''
  const stack: string[] = []
  let inStr = false
  let esc = false
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    out += ch
    if (inStr) {
      if (esc) { esc = false; continue }
      if (ch === '\\') { esc = true; continue }
      if (ch === '"') { inStr = false; continue }
    } else {
      if (ch === '"') { inStr = true; continue }
      if (ch === '{' || ch === '[') stack.push(ch)
      else if (ch === '}') { if (stack[stack.length - 1] === '{') stack.pop() }
      else if (ch === ']') { if (stack[stack.length - 1] === '[') stack.pop() }
    }
  }
  if (inStr) out += '"'
  while (stack.length) out += (stack.pop() === '{') ? '}' : ']'
  return out
}

const tryParseStrict = (s: string): JsonValue | null => {
  try { return JSON.parse(s) } catch { return null }
}

const parseLoose = (raw: string): JsonValue | null => {
  if (!raw) return null
  const extracted = extractJsonFromText(raw)
  const direct = tryParseStrict(extracted)
  if (direct) return direct

  const sanitized = sanitizeJsonText(extracted)
  const s1 = tryParseStrict(sanitized)
  if (s1) return s1

  const repaired = repairTruncation(sanitized)
  const s2 = tryParseStrict(repaired)
  if (s2) return s2

  // 截断到最后一个 } 再修复
  const last = sanitized.lastIndexOf('}')
  if (last > 0) {
    const trunc = sanitized.slice(0, last + 1)
    const s3 = tryParseStrict(repairTruncation(trunc))
    if (s3) return s3
  }
  return null
}

// 新模板 → 内部 DayPlan
const mapNewTemplateDayToDayPlan = (d: any, idx: number): DayPlan => {
  let acts = toArr<any>(d.activities)
  if (!acts.length) {
    acts = [{
      time: '09:00',
      title: '自由探索时间',
      type: 'activity',
      duration: 120,
      location: { lat: 0, lng: 0 },
      notes: 'AI 暂未生成具体安排，建议自行安排或稍后重试。',
      localTip: '',
      transport: { mode: 'walk', from: '', to: '', duration: 15, notes: '步行即可，无需额外安排。' },
      cost: 0
    }]
  }
  const totalMinutes = acts.reduce((acc, a) => acc + toNum(a?.duration, 0), 0)
  const totalCost = acts.reduce((acc, a) => acc + toNum(a?.cost, 0), 0)
  return {
    date: `Day ${toNum(d?.day, idx + 1)}`,
    title: toStr(d?.theme, `第${idx + 1}天`),
    description: toStr(d?.summary, ''),
    status: 'planned',
    stats: { duration: Math.max(0, Math.round(totalMinutes / 60)), cost: Math.max(0, totalCost) },
    timeSlots: acts.map((a: any) => ({
      time: toStr(a?.time, '10:00'),
      activity: toStr(a?.title, ''),
      location: toStr(a?.transport?.to, ''),
      icon: '📍',
      category: toStr(a?.type, 'attraction'),
      categoryColor: 'blue',
      notes: [toStr(a?.notes, ''), a?.localTip ? `提示：${toStr(a.localTip)}` : ''].filter(Boolean).join(' ｜'),
      estimatedDuration: Math.max(1, Math.round(toNum(a?.duration, 60) / 60)),
      estimatedCost: Math.max(0, toNum(a?.cost, 0)),
      coordinates: (a?.location && typeof a.location === 'object'
        && Number.isFinite(a.location.lat) && Number.isFinite(a.location.lng))
        ? { lat: clamp(Number(a.location.lat), -90, 90), lng: clamp(Number(a.location.lng), -180, 180) }
        : undefined
    }))
  }
}

// 规范化完整响应
const normalizeItinerary = (data: Partial<PlannerItineraryResponse>, ctx?: PlannerItineraryRequest): PlannerItineraryResponse => {
  const rec = data.recommendations ?? {}
  const ai = data.aiInsights ?? {}
  const days = toArr<DayPlan>(data.days).map((d, i) => {
    const slots = toArr<TimeSlot>(d?.timeSlots).map((s) => ({
      time: toStr((s as any)?.time, ''),
      activity: toStr((s as any)?.activity, ''),
      location: toStr((s as any)?.location, ''),
      icon: toStr((s as any)?.icon, '📍'),
      category: toStr((s as any)?.category, 'activity'),
      categoryColor: toStr((s as any)?.categoryColor, 'blue'),
      notes: toStr((s as any)?.notes, ''),
      estimatedDuration: Math.max(0, toNum((s as any)?.estimatedDuration, 0)),
      estimatedCost: Math.max(0, toNum((s as any)?.estimatedCost, 0)),
      coordinates: (s as any)?.coordinates &&
        Number.isFinite((s as any)?.coordinates?.lat) &&
        Number.isFinite((s as any)?.coordinates?.lng)
        ? {
            lat: clamp(Number((s as any)?.coordinates?.lat), -90, 90),
            lng: clamp(Number((s as any)?.coordinates?.lng), -180, 180)
          }
        : undefined
    }))
    const safeSlots = slots.length ? slots : [{
      time: '09:00',
      activity: '自由探索时间',
      location: toStr(d?.title, `第${i + 1}天`),
      icon: '📍',
      category: 'activity',
      categoryColor: 'blue',
      notes: 'AI 暂未返回详细活动，已为你预留自由安排时间段，可在此添加自定义活动。',
      estimatedDuration: 2,
      estimatedCost: 0
    }]

    return {
      date: toStr(d?.date, `Day ${i + 1}`),
      title: toStr(d?.title, `第${i + 1}天`),
      description: toStr(d?.description, ''),
      status: (['planned', 'in-progress', 'completed'] as const).includes(d?.status as any)
        ? (d.status as any) : 'planned',
      stats: {
        duration: Math.max(0, toNum(d?.stats?.duration, 0)),
        cost: Math.max(0, toNum(d?.stats?.cost, 0))
      },
      timeSlots: safeSlots
    }
  })

  const totalCost =
    Number.isFinite(data.totalCost) ? Number(data.totalCost) :
    days.reduce((sum, d) => sum + (d.stats?.cost || 0), 0)

  return {
    title: toStr(data.title, `${ctx?.destination || '目的地'}行程规划`),
    destination: toStr(data.destination, ctx?.destination || '目的地'),
    duration: Math.max(1, toNum(data.duration, days.length || ctx?.duration || 1)),
    totalCost: Math.max(0, totalCost),
    summary: toStr(data.summary, ''),
    days,
    recommendations: {
      bestTimeToVisit: toStr((rec as any).bestTimeToVisit, ''),
      weatherAdvice: toStr((rec as any).weatherAdvice, ''),
      packingTips: toArr<string>((rec as any).packingTips).map((item) => toStr(item)),
      localTips: toArr<string>((rec as any).localTips).map((item) => toStr(item)),
      emergencyContacts: toArr<string>((rec as any).emergencyContacts).map((item) => toStr(item))
    },
    aiInsights: {
      optimizationSuggestions: toArr<string>((ai as any).optimizationSuggestions).map((item) => toStr(item)),
      alternativeActivities: toArr<string>((ai as any).alternativeActivities).map((item) => toStr(item)),
      budgetOptimization: toArr<string>((ai as any).budgetOptimization).map((item) => toStr(item)),
      culturalNotes: toArr<string>((ai as any).culturalNotes).map((item) => toStr(item))
    }
  }
}

// ------------------------- API -------------------------
class PlannerAPI {
  /**
   * 生成智能行程
   */
  async generateItinerary(request: PlannerItineraryRequest): Promise<PlannerItineraryResponse> {
    try {
      const startDate = new Date().toISOString().split('T')[0]
      const systemPrompt = buildPlannerSystemPrompt(request.language)
      const promptInput: PlannerItineraryPromptRequest = {
        destination: request.destination,
        duration: request.duration,
        budget: request.budget,
        preferences: request.preferences,
        travelStyle: request.travelStyle,
        startDate
      }
      if (request.customRequirements) {
        promptInput.customRequirements = request.customRequirements
      }
      if (request.language) {
        promptInput.language = request.language
      }
      const userPrompt = buildPlannerUserPrompt(promptInput)

      const response = await chatWithLLM([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ])
      
      let itineraryData = this.parseItineraryResponse(response, request)
      itineraryData = this.ensureDuration(itineraryData, request.duration, request.destination)

      const validation = validateAppItinerary(itineraryData)
      if (!validation.valid) {
        console.warn('[plannerAPI] App itinerary validation failed:', validation.errors)
      }

      if (!itineraryData.destination || itineraryData.destination === '目的地') {
        itineraryData.destination = request.destination
      }
      if (!itineraryData.title || itineraryData.title === '智能行程规划') {
        itineraryData.title = `${request.destination}行程规划`
      }
      return itineraryData
    } catch (error) {
      console.error('生成行程失败:', error)
      throw new Error('AI 行程生成失败，请重试')
    }
  }

  /**
   * 优化现有行程
   */
  async optimizeItinerary(currentItinerary: PlannerItineraryResponse, optimizationType: 'time' | 'cost' | 'route'): Promise<PlannerItineraryResponse> {
    try {
      const system = buildOptimizationSystemPrompt()
      const prompt = this.buildOptimizationPrompt(currentItinerary, optimizationType)
      const response = await chatWithLLM([
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ])
      let optimizedData = this.parseItineraryResponse(response, {
        destination: currentItinerary.destination,
        duration: currentItinerary.duration,
        budget: '',
        preferences: [],
        travelStyle: '',
      } as PlannerItineraryRequest)
      optimizedData = this.ensureDuration(optimizedData, currentItinerary.duration, currentItinerary.destination)

      const validation = validateAppItinerary(optimizedData)
      if (!validation.valid) {
        console.warn('[plannerAPI] Optimized itinerary validation failed:', validation.errors)
      }

      return optimizedData
    } catch (error) {
      console.error('优化行程失败:', error)
      throw new Error('行程优化失败，请重试')
    }
  }

  /**
   * 获取目的地实时信息
   */
  async getDestinationInfo(destination: string): Promise<{
    weather: string
    bestTimeToVisit: string
    localTips: string[]
    emergencyContacts: string[]
  }> {
    try {
      const prompt = `仅返回严格 JSON；不得包含 Markdown 或解释。
必须包含且仅包含字段：weather, bestTimeToVisit, localTips, emergencyContacts。
示例：{"weather":"","bestTimeToVisit":"","localTips":[],"emergencyContacts":[]}

目的地: "${destination}"
请给出：
- 当前天气与建议（weather）
- 最佳旅行时间（bestTimeToVisit）
- 3-5 条目的地特有小贴士（localTips）
- 当地紧急电话/机构（emergencyContacts）`
      
      const response = await chatWithLLM([{ role: 'user', content: prompt }])
      const parsed = parseLoose(response)
      if (!parsed) throw new Error('parse failed')
      return {
        weather: toStr(parsed.weather, '请查询当地天气预报'),
        bestTimeToVisit: toStr(parsed.bestTimeToVisit, '春秋季节较为适宜'),
        localTips: toArr<string>(parsed.localTips).map((item) => toStr(item)),
        emergencyContacts: toArr<string>(parsed.emergencyContacts).map((item) => toStr(item))
      }
    } catch (error) {
      console.error('获取目的地信息失败:', error)
      return {
        weather: '请查询当地天气预报',
        bestTimeToVisit: '春秋季节较为适宜',
        localTips: ['注意当地文化习俗', '准备常用药品'],
        emergencyContacts: ['当地报警电话', '中国领事馆电话']
      }
    }
  }

  /**
   * 构建优化提示词
   */
  private buildOptimizationPrompt(itinerary: PlannerItineraryResponse, type: 'time' | 'cost' | 'route'): string {
    const focus = { time: '时间效率', cost: '成本控制', route: '路线优化' }[type]
    // why: 强化严格 JSON 输出与结构一致性，避免围栏/注释
    return `你是旅行行程优化器。仅返回严格 JSON，可被 JSON.parse 解析；禁止 Markdown、注释、额外文本或尾逗号。
优化目标：${focus}
保持原有偏好与风格；确保可行性（时间/交通衔接/节奏）。

输入（当前行程）：
${JSON.stringify(itinerary)}

输出要求：
- 返回与输入相同 schema 的完整 JSON（字段/层级/类型一致）
- 对天内顺序/时长/交通/费用做必要调整
- 提供 aiInsights.optimizationSuggestions 的可执行清单`
  }

  /**
   * 解析AI响应
   */
  private parseItineraryResponse(response: string, context?: PlannerItineraryRequest): PlannerItineraryResponse {
    try {
      if (!response) throw new Error('Empty response')
      const parsed = parseLoose(response)

      if (!parsed) {
        // 兜底：从片段构造最小可用结构
        const head = extractJsonFromText(response).slice(0, 2000)
        const pick = (re: RegExp) => {
          const m = head.match(re); return m?.[1]?.trim() ?? ''
        }
        const summary = pick(/"summary"\s*:\s*"([\s\S]*?)"/)
        const date = pick(/"date"\s*:\s*"([^"]*)"/)
        const theme = pick(/"theme"\s*:\s*"([^"]*)"/)
        return normalizeItinerary({
            title: `${context?.destination || '目的地'}行程规划`,
            destination: context?.destination || '目的地',
            duration: context?.duration || 1,
            totalCost: 0,
          summary,
          days: [{
                date: date || 'Day 1',
                title: theme || '第一天',
                description: summary || '',
                status: 'planned',
                stats: { duration: 6, cost: 0 },
                timeSlots: []
          }],
            recommendations: { bestTimeToVisit: '', weatherAdvice: '', packingTips: [], localTips: [], emergencyContacts: [] },
            aiInsights: { optimizationSuggestions: [], alternativeActivities: [], budgetOptimization: [], culturalNotes: [] }
        }, context)
      }

      // 新模板（days[].activities）
      if (parsed && Array.isArray(parsed.days) && !parsed.title) {
        const validation = validateLLMJson(parsed)
        let llmSource: any = parsed
        if (!validation.valid) {
          console.warn('[plannerAPI] LLM schema validation failed:', validation.errors)
          llmSource = sanitizeLLMJson(parsed)
          const recheck = validateLLMJson(llmSource)
          if (!recheck.valid) {
            console.warn('[plannerAPI] LLM schema still invalid after sanitize:', recheck.errors)
          }
        }

        const mappedDays = toArr(llmSource.days).map(mapNewTemplateDayToDayPlan)
        const totalCost = Number.isFinite(llmSource.totalCost)
          ? Number(llmSource.totalCost)
          : mappedDays.reduce((acc: number, d: DayPlan) => acc + (d.stats?.cost || 0), 0)

        const normalized = normalizeItinerary({
          title: `${context?.destination || '目的地'}行程规划`,
          destination: context?.destination || '目的地',
          duration: mappedDays.length,
          totalCost,
          summary: toStr(llmSource.summary, ''),
          days: mappedDays,
          recommendations: { bestTimeToVisit: '', weatherAdvice: '', packingTips: [], localTips: [], emergencyContacts: [] },
          aiInsights: { optimizationSuggestions: [], alternativeActivities: [], budgetOptimization: [], culturalNotes: [] }
        }, context)
        const appValidation = validateAppItinerary(normalized)
        if (!appValidation.valid) {
          console.warn('[plannerAPI] App schema validation failed after mapping:', appValidation.errors)
        }
        return normalized
      }

      // 旧模板或完整模板
      if (parsed && parsed.title && parsed.days) {
        const normalized = normalizeItinerary(parsed as PlannerItineraryResponse, context)
        const validation = validateAppItinerary(normalized)
        if (!validation.valid) {
          console.warn('[plannerAPI] App schema validation failed for parsed response:', validation.errors)
        }
        return normalized
      }

      // 其他未知结构 → normalize + 兜底
      const normalized = normalizeItinerary({
          title: `${context?.destination || '目的地'}行程规划`,
          destination: context?.destination || '目的地',
        duration: toNum((parsed as any)?.duration, context?.duration || 1),
        totalCost: toNum((parsed as any)?.totalCost, 0),
        summary: toStr((parsed as any)?.summary, ''),
        days: toArr((parsed as any)?.days).map((_: any, idx: number) => ({
            date: `Day ${idx + 1}`,
            title: `第${idx + 1}天`,
            description: '',
            status: 'planned',
            stats: { duration: 0, cost: 0 },
            timeSlots: []
          })),
          recommendations: { bestTimeToVisit: '', weatherAdvice: '', packingTips: [], localTips: [], emergencyContacts: [] },
          aiInsights: { optimizationSuggestions: [], alternativeActivities: [], budgetOptimization: [], culturalNotes: [] }
      }, context)
      const validation = validateAppItinerary(normalized)
      if (!validation.valid) {
        console.warn('[plannerAPI] App schema validation failed for fallback normalization:', validation.errors)
      }
      return normalized
    } catch (error) {
      console.error('解析AI响应失败:', error)
      console.warn('[plannerAPI] Raw response head:', (response || '').slice(0, 500))
      return this.getDefaultItinerary(context)
    }
  }

  // 默认行程
  private getDefaultItinerary(context?: PlannerItineraryRequest): PlannerItineraryResponse {
    const dest = context?.destination || '目的地'
    return {
      title: `${dest}行程规划`,
      destination: dest,
      duration: context?.duration || 3,
      totalCost: 3000,
      summary: '这是一个示例行程，用于在 AI 返回不可解析时保证页面可用。',
      days: [
        {
          date: 'Day 1',
          title: '第一天 - 抵达与适应',
          description: '抵达后办理入住，适应节奏，傍晚在市区随性漫步。',
          status: 'planned',
          stats: { duration: 6, cost: 800 },
          timeSlots: [
            { time: '10:00', activity: '抵达与入住', location: '机场/酒店', icon: '✈️', category: 'transport', categoryColor: 'blue', notes: '提前准备好预订信息', estimatedDuration: 2, estimatedCost: 200 },
            { time: '17:00', activity: '城市傍晚漫步', location: '市中心', icon: '🌆', category: 'attraction', categoryColor: 'purple', notes: '轻装出行，注意保暖', estimatedDuration: 2, estimatedCost: 0 }
          ]
        }
      ],
      recommendations: { bestTimeToVisit: '', weatherAdvice: '', packingTips: [], localTips: [], emergencyContacts: [] },
      aiInsights: { optimizationSuggestions: [], alternativeActivities: [], budgetOptimization: [], culturalNotes: [] }
    }
  }

  // 补齐/规范行程天数
  private ensureDuration(itin: PlannerItineraryResponse, targetDays: number, destination?: string): PlannerItineraryResponse {
      if (!targetDays || targetDays <= 0) return itin
      const days = Array.isArray(itin.days) ? [...itin.days] : []
      for (let i = days.length; i < targetDays; i++) {
        days.push({
          date: `Day ${i + 1}`,
          title: `第${i + 1}天${destination ? ' - ' + destination + '探索' : ''}`.trim(),
          description: '',
          status: 'planned',
          stats: { duration: 0, cost: 0 },
          timeSlots: []
        })
      }
      return { ...itin, duration: targetDays, days }
  }
}

export const plannerAPI = new PlannerAPI()
