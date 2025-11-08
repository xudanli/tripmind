// path: src/stores/travel.ts
import { defineStore } from 'pinia'
import { ref, onUnmounted } from 'vue'
import i18n from '@/i18n'
import emotionalTravelAPI from '@/services/emotionalTravelAPI'
import type { EmotionDetectionRequest, TravelPlanRequest, FeedbackRequest } from '@/services/emotionalTravelAPI'
import { plannerAPI, type PlannerItineraryResponse } from '@/services/plannerAPI'
import { subscribeLogEvents, LogLevel } from '@/utils/inspiration/core/logger'
import { searchPexelsVideos, type InspirationVideo } from '@/services/pexelsAPI'
import { getCachedMedia, setCachedMedia } from '@/utils/mediaCache'
import { createHighlightMediaKey, buildSearchQuery } from '@/utils/mediaHelpers'

// -------------------- Types --------------------
type Mode = 'planner' | 'seeker' | 'inspiration' | null

interface GenerationLogEntry {
  id: number
  message: string
  level: 'info' | 'warn' | 'error'
  timestamp: number
}

export interface PlannerFormData {
  destination: string
  duration: number
  budget: string
  preferences: string[]
  travelStyle: string
  customRequirements?: string
}

export interface MoodData {
  currentMood: string
  desiredExperience: string
  budget: string
  duration: string
}

export interface HighlightDetail {
  title: string
  description: string
  feeling: string
}

export interface PlannerNotification {
  id: string
  type: 'rhythm'
  level: 'info' | 'warn'
  message: string
  createdAt: number
  dayIndex?: number
}

export interface PlannerDailyRhythm {
  dayIndex: number
  title: string
  score: number
  warnings: string[]
}

export interface PlannerRhythmInsights {
  score: number
  level: 'balanced' | 'tight' | 'loose'
  summary: string
  daily: PlannerDailyRhythm[]
}

export interface LocationDetail {
  name: string
  country?: string
  duration?: string
  budget?: string
  highlights?: string[] | HighlightDetail[]
  aiMessage?: string
  description?: string
  reason?: string
  reasoning?: string
}

export interface InspirationData {
  title: string
  subtitle: string
  location: string
  destination?: string
  locations?: string[]
  locationDetails?: { [key: string]: LocationDetail }
  currentCountry?: string
  locationCountries?: Record<string, string>
  duration: string
  budget: string
  highlights: string[] | HighlightDetail[]
  aiMessage: string
  detectedIntent?: {
    intentType: string
    keywords: string[]
    emotionTone: string
    description: string
  }
  experiences?: { [key: string]: ExperienceDay }
  photos?: { [key: string]: any }
  inspirationConfig?: any
  coreInsight?: string
  journeyBackground?: string
  archetype?: {
    name?: string
    symbol?: string
    coreConflict?: string
  }
  travelerProfile?: {
    type?: string
    currentState?: string
    intention?: string
  }
  mentalFlowStages?: {
    summon?: { theme: string; activities: string[]; emotionalGoal: string; symbolicElement: string }
    reflection?: { theme: string; activities: string[]; emotionalGoal: string; symbolicElement: string }
    awakening?: { theme: string; activities: string[]; emotionalGoal: string; symbolicElement: string }
    internalization?: { theme: string; activities: string[]; emotionalGoal: string; symbolicElement: string }
    transformation?: { theme: string; activities: string[]; emotionalGoal: string; symbolicElement: string }
  }
  cognitiveTriggers?: {
    questions?: string[]
    rituals?: string[]
    moments?: string[]
  }
  healingDesign?: {
    sound?: string
    scent?: string
    light?: string
    texture?: string
    space?: string
    rhythm?: string
    community?: string
  }
  narrative?: {
    prologue?: string
    mirror?: string
    threshold?: string
    stillness?: string
    return?: string
  }
  postJourneyChallenge?: {
    title?: string
    description?: string
    actions?: string[]
  }
  keywords?: string[]
  story?: string
  concept?: string
  personaProfile?: {
    type: string
    motivation: string
    motivation_detail?: string
    dominantEmotion: string
    desiredEmotion?: string
    travelRhythm: string
    activityDensity?: string
    socialPreference: string
    socialIntensity?: number
    cognitiveNeed: string
    postJourneyGoal?: string
  }
  journeyDesign?: {
    title: string
    coreInsight: string
    psychologicalFlow: string[]
    symbolicElements?: string[]
    recommendedRhythm?: string
    socialMode?: string
    dualTracks: {
      external: Array<{
        time: string
        activity: string
        location: string
        type: string
        budget?: number
        notes?: string
      }>
      internal: Array<{
        stage: string
        question?: string
        ritual?: string
        action?: string
        reflection?: string
      }>
    }
  }
  days?: Array<{
    day: number
    date: string
    theme: string
    mood: string
    summary: string
    psychologicalStage?: string
    timeSlots: Array<{
      time: string
      title: string
      activity: string
      location: string
      type: string
      category?: string
      duration: number
      notes: string
      localTip?: string
      cost?: number
      coordinates?: { lat: number; lng: number }
      internalTrack?: {
        question?: string
        ritual?: string
        reflection?: string
      }
      details?: any
    }>
  }>
  psychologicalFlow?: string[]
  symbolicElements?: string[]
  templateName?: string
  matchScore?: number
  matchDetails?: any
  psychologicalJourney?: any
  recommendations?: {
    bestTimeToVisit?: string
    weatherAdvice?: string
    packingTips?: string[]
    localTips?: string[]
    emergencyContacts?: string[]
  }
  totalCost?: number
  summary?: string
  videos?: Record<string, InspirationVideo>
}

export interface ExperienceDay {
  title: string
  theme: string
  aiTone: string
  emotionTags: string[]
  recommendedLocations: string[]
  timeline: Array<{
    time: string
    activity: string
    narration: string
  }>
  aiSummary: string
  aiPersona?: {
    name: string
    identity: string
    keywords: string[]
  }
}

// ——扩展 Activity，匹配当前写入字段（否则 TS 隐性失配）——
export interface Activity {
  time: string
  activity: string
  type: string
  duration?: number
  notes?: string
  location?: string
  transport?: any
  cost?: number
}

export interface DayPlan {
  day: number
  title: string
  activities: Activity[]
}

export interface Recommendations {
  accommodation: string
  transportation: string
  food: string
  tips: string
}

export interface ItineraryData {
  destination: string
  duration: number
  budget: string
  preferences: string[]
  travelStyle: string
  itinerary: DayPlan[]
  recommendations: Recommendations
  detectedIntent?: {
    intentType: string
    keywords: string[]
    emotionTone: string
    description: string
  }
  experienceDay?: ExperienceDay
}

// -------------------- Helpers --------------------
let unsubscribeLogEvents: (() => void) | null = null

function safeStr(v: unknown, fallback = ''): string {
  const s = (v ?? '').toString().trim()
  return s.length ? s : fallback
}

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

function firstOr<T>(a: T[] | undefined, i: number, fallback: T): T {
  if (!a || !a.length) return fallback
  return a[i] ?? fallback
}

interface HighlightSource {
  scope: string
  scopeLabel?: string
  highlight: string | HighlightDetail
}

const MAX_VIDEOS_PER_INSPIRATION = 6

function collectHighlightSources(data: InspirationData): HighlightSource[] {
  const sources: HighlightSource[] = []
  if (Array.isArray(data.highlights) && data.highlights.length) {
    data.highlights.forEach((highlight) => {
      sources.push({ scope: 'global', highlight })
    })
  }
  if (data.locationDetails) {
    Object.entries(data.locationDetails).forEach(([loc, detail]) => {
      if (Array.isArray(detail?.highlights)) {
        detail.highlights.forEach((highlight) => {
          sources.push({ scope: `location:${loc}`, scopeLabel: loc, highlight })
        })
      }
    })
  }
  return sources
}

async function enrichInspirationMedia(data: InspirationData, locale: string): Promise<InspirationData> {
  const sources = collectHighlightSources(data)
  if (!sources.length) return data

  const videos: Record<string, InspirationVideo> = { ...(data.videos || {}) }
  const destinationLabel = data.destination || data.location
  const canUseCache = typeof window !== 'undefined'
  let fetchedCount = 0

  for (const source of sources) {
    if (fetchedCount >= MAX_VIDEOS_PER_INSPIRATION) break
    const key = createHighlightMediaKey(source.scope, source.highlight)
    if (videos[key]) continue

    const cacheKey = `pexels:${locale}:${key}`
    let video: InspirationVideo | null = null

    if (canUseCache) {
      video = getCachedMedia<InspirationVideo>(cacheKey)
    }

    if (!video) {
      const query = buildSearchQuery(destinationLabel, source.scopeLabel, source.highlight)
      if (!query) continue
      const results = await searchPexelsVideos(query, { perPage: 1, orientation: 'landscape' })
      video = results?.[0] ?? null
      if (video && canUseCache) {
        setCachedMedia(cacheKey, video)
      }
    }

    if (video) {
      videos[key] = video
      fetchedCount++
    }
  }

  if (!fetchedCount && !Object.keys(videos).length) return data
  return { ...data, videos }
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function evaluateDayRhythm(day: PlannerItineraryResponse['days'][number], index: number): { score: number; warnings: string[]; title: string } {
  const title = safeStr((day as any)?.title, `第${index + 1}天`)
  const slots = Array.isArray(day?.timeSlots) ? day.timeSlots : []
  const activityCount = slots.length
  const durationHours = (() => {
    const statDuration = Number((day as any)?.stats?.duration)
    if (Number.isFinite(statDuration) && statDuration > 0) return statDuration
    const slotSum = slots.reduce((sum, slot: any) => {
      if (typeof slot?.estimatedDuration === 'number' && slot.estimatedDuration > 0) return sum + slot.estimatedDuration
      if (typeof slot?.duration === 'number' && slot.duration > 0) return sum + slot.duration / 60
      return sum + 1.5
    }, 0)
    return slotSum
  })()

  const transportSlots = slots.filter((slot: any) => {
    const category = safeStr(slot?.category).toLowerCase()
    const type = safeStr(slot?.type).toLowerCase()
    return category.includes('transport') || type.includes('transport') || category.includes('交通')
  })

  let score = 92
  const warnings: string[] = []

  if (durationHours < 4.5) {
    score -= 18
    warnings.push('节奏偏松，可以再安排一个轻量体验或留白仪式。')
  } else if (durationHours < 6) {
    score -= 6
    warnings.push('当日安排较为宽松，如想更充实，可补充一段探索时光。')
  } else if (durationHours > 10) {
    score -= 20
    warnings.push('行程偏紧，建议删减一项或提前预留休息。')
  } else if (durationHours > 9) {
    score -= 10
    warnings.push('今日活动较密集，试着加一段缓冲时间。')
  }

  if (activityCount <= 2) {
    score -= 10
    warnings.push('活动数量偏少，或许可以拓展一个灵光瞬间。')
  } else if (activityCount >= 6) {
    score -= 10
    warnings.push('活动较多，挑选重点体验可以让节奏更顺。')
  }

  const transportRatio = activityCount > 0 ? transportSlots.length / activityCount : 0
  if (transportRatio >= 0.4) {
    score -= 8
    warnings.push('交通占比较高，尝试将景点集中在同一区域，节奏会更轻盈。')
  }

  score = clamp(score, 45, 96)
  if (!warnings.length && score >= 82) {
    warnings.push('节奏恰到好处，保持这种自在的律动。')
  }

  return { score, warnings, title }
}

function composeRhythmSummary(level: PlannerRhythmInsights['level']): string {
  switch (level) {
    case 'balanced':
      return '整体节奏均衡，Aris 会继续帮你守护这份从容。'
    case 'tight':
      return '有些时段稍显紧凑，适当删减或调整顺序会让节奏更顺滑。'
    case 'loose':
      return '行程略显松散，可以酌情补充体验，或保留更多留白仪式感。'
    default:
      return 'Aris 正在为你观察旅程节奏。'
  }
}

function generatePlannerInsights(itinerary: PlannerItineraryResponse): { insights: PlannerRhythmInsights; notifications: PlannerNotification[] } {
  const days = Array.isArray(itinerary.days) ? itinerary.days : []
  if (!days.length) {
    return {
      insights: {
        score: 0,
        level: 'balanced',
        summary: 'Aris 正在等待完整的行程内容。',
        daily: []
      },
      notifications: []
    }
  }

  const daily = days.map((day, index) => evaluateDayRhythm(day, index))
  const totalScore = daily.reduce((sum, d) => sum + d.score, 0)
  const averageScore = Math.round(totalScore / daily.length)
  let level: PlannerRhythmInsights['level']
  if (averageScore >= 80) level = 'balanced'
  else if (averageScore >= 65) level = 'tight'
  else level = 'loose'

  const insights: PlannerRhythmInsights = {
    score: averageScore,
    level,
    summary: composeRhythmSummary(level),
    daily: daily.map((d, index) => ({
      dayIndex: index,
      title: d.title,
      score: Math.round(d.score),
      warnings: d.warnings
    }))
  }

  const notifications: PlannerNotification[] = []
  daily.forEach((dayInfo, index) => {
    dayInfo.warnings.forEach((warning, warningIndex) => {
      const isPositive = warning.includes('恰到好处') || warning.includes('自在')
      notifications.push({
        id: `rhythm-${index}-${warningIndex}-${Date.now()}`,
        type: 'rhythm',
        level: isPositive ? 'info' : 'warn',
        message: `${dayInfo.title}：${warning}`,
        createdAt: Date.now(),
        dayIndex: index
      })
    })
  })

  return {
    insights,
    notifications: notifications.slice(0, 6)
  }
}


// -------------------- Store --------------------
export const useTravelStore = defineStore('travel', () => {
  // State
  const plannerData = ref<PlannerFormData>({
    destination: '',
    duration: 5,
    budget: 'comfort',
    preferences: [],
    travelStyle: 'moderate',
    customRequirements: ''
  })

  const moodData = ref<MoodData>({
    currentMood: '',
    desiredExperience: '',
    budget: 'comfort',
    duration: ''
  })

  const inspirationData = ref<InspirationData | null>(null)
  const itineraryData = ref<ItineraryData | null>(null)
  const plannerItinerary = ref<PlannerItineraryResponse | null>(null)
  const plannerRhythmInsights = ref<PlannerRhythmInsights | null>(null)
  const plannerNotifications = ref<PlannerNotification[]>([])
  
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentMode = ref<Mode>(null)
  const generationLogs = ref<GenerationLogEntry[]>([])
  const isRunning = ref(false) // 并发锁

  // Logs
  const pushGenerationLog = (message: string, level: 'info' | 'warn' | 'error' = 'info', timestamp?: number) => {
    const text = safeStr(message)
    if (!text) return
    const entry: GenerationLogEntry = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      message: text,
      level,
      timestamp: timestamp ?? Date.now()
    }
    const prefix = '[AI Generation]'
    if (level === 'error') console.error(prefix, text)
    else if (level === 'warn') console.warn(prefix, text)
    else console.info(prefix, text)
    generationLogs.value = [...generationLogs.value, entry].slice(-150)
  }

  const clearGenerationLogs = () => {
    generationLogs.value = []
  }

  // Subscribe once, provide disposer
  if (!unsubscribeLogEvents) {
    unsubscribeLogEvents = subscribeLogEvents(event => {
      if (event.namespace && !event.namespace.includes('adapter')) return
      const level: 'info' | 'warn' | 'error' =
        event.level === LogLevel.ERROR ? 'error' :
        event.level === LogLevel.WARN ? 'warn' : 'info'
      pushGenerationLog(event.message, level, event.timestamp)
    })
  }

  // Expose disposer & ensure GC on unmount
  function dispose() {
    if (unsubscribeLogEvents) {
      unsubscribeLogEvents()
      unsubscribeLogEvents = null
    }
  }
  onUnmounted(dispose)

  // -------------------- Actions --------------------
  const setPlannerData = (data: Partial<PlannerFormData>) => Object.assign(plannerData.value, data)
  const setMoodData = (data: Partial<MoodData>) => Object.assign(moodData.value, data)
  const setInspirationData = (data: InspirationData | null) => { inspirationData.value = data }
  const setItineraryData = (data: ItineraryData | null) => { itineraryData.value = data }
  const setCurrentMode = (mode: Mode) => { currentMode.value = mode }
  const setLoading = (isLoading: boolean) => { loading.value = isLoading }
  const setError = (message: string | null) => { error.value = message }
  const dismissPlannerNotification = (id: string) => {
    plannerNotifications.value = plannerNotifications.value.filter(note => note.id !== id)
  }
  const updatePlannerInsights = (itinerary: PlannerItineraryResponse | null) => {
    if (!itinerary) {
      plannerRhythmInsights.value = null
      plannerNotifications.value = []
      return
    }
    const { insights, notifications } = generatePlannerInsights(itinerary)
    plannerRhythmInsights.value = insights
    plannerNotifications.value = notifications
  }

  // Local inspiration DB
  async function getLocalInspirationDestinations(params?: { country?: string; stage?: any; keyword?: string }): Promise<Array<{ name: string; country: string }>> {
    const { listDestinations } = await import('@/utils/inspirationDb')
    const list = listDestinations(params as any)
    return list.map(d => ({ name: d.name, country: d.country }))
  }

  function buildInspirationFromLocal(name: string): InspirationData {
    return {
      title: '🌟 灵感之旅（本地推荐）',
      subtitle: '基于本地灵感库的快速提案',
      location: name,
      locations: [name],
      locationDetails: {
        [name]: {
          name,
          duration: '3-5天',
          budget: '中等',
          highlights: ['自然/人文场景探索', '节奏放缓的沉浸式体验', '轻计划重感受'],
          aiMessage: '这是一条来自本地灵感库的快速提案，适合用于无网或 AI 不可用时的体验预览。'
        }
      },
      duration: '3-5天',
      budget: '中等',
      highlights: ['自然/人文场景探索', '节奏放缓的沉浸式体验', '轻计划重感受'],
      aiMessage: '跟随好奇，先从这里出发吧。'
    }
  }

  // ---------- Mapping helpers ----------
  function toItineraryFromPlanner(resp: PlannerItineraryResponse, form: PlannerFormData): ItineraryData {
    const days = Array.isArray(resp.days) ? resp.days : []
    const mapped = days.map((day: any, index: number) => {
      const slots = Array.isArray(day?.timeSlots) ? day.timeSlots : Array.isArray(day?.activities) ? day.activities : []
      const activities = slots.map((slot: any) => ({
          time: safeStr(slot?.time),
          activity: safeStr(slot?.activity || slot?.title),
          type: safeStr(slot?.category || slot?.type || 'activity'),
          duration: typeof slot?.estimatedDuration === 'number' ? slot.estimatedDuration : (typeof slot?.duration === 'number' ? slot.duration : undefined),
          notes: safeStr(slot?.notes),
          location: safeStr(slot?.location || slot?.transport?.to),
          transport: slot?.transport ?? null,
          cost: typeof slot?.estimatedCost === 'number' ? slot.estimatedCost : (typeof slot?.cost === 'number' ? slot.cost : undefined)
        }))
      if (!activities.length) {
        activities.push({
          time: '09:00',
          activity: '自由探索时间',
          type: 'activity',
          duration: 60,
          notes: 'AI 未返回详细活动，请自行安排。',
          location: safeStr(day?.title),
          transport: null,
          cost: 0
        })
      }
      return {
        day: typeof day?.day === 'number' ? day.day : index + 1,
        title: safeStr(day?.title, `第${index + 1}天`),
        activities
      }
    })

    const localTips = resp?.recommendations?.localTips || []
    return {
      destination: safeStr(resp.destination, form.destination),
      duration: Number.isFinite(resp.duration as number) ? (resp.duration as number) : form.duration,
      budget: form.budget,
      preferences: form.preferences,
      travelStyle: form.travelStyle,
      itinerary: mapped,
      recommendations: {
        accommodation: firstOr(localTips, 0, '建议提前预订住宿'),
        transportation: firstOr(localTips, 1, '建议使用公共交通'),
        food: firstOr(localTips, 2, '尝试当地特色美食'),
        tips: safeStr(resp.summary, '旅途中请关注当地礼仪与天气变化')
      },
      detectedIntent: {
        intentType: 'planner',
        keywords: form.preferences,
        emotionTone: 'practical',
        description: '实用型旅行规划'
      }
    }
  }

  function toItineraryFromSeeker(aiData: any, mood: MoodData, intent: any): ItineraryData {
    const days = arr<any>(aiData?.data?.itinerary)
    const itinerary = days.map((day, index) => ({
      day: day?.day || index + 1,
      title: safeStr(day?.title, `第${day?.day || index + 1}天`),
      activities: arr<any>(day?.activities).map((a) => ({
        time: safeStr(a?.time, '待定'),
        activity: safeStr(a?.activity || a?.name),
        type: safeStr(a?.type, '观光')
      }))
    }))

    return {
      destination: safeStr(aiData?.data?.destination, '未知目的地'),
      duration: Number.isFinite(aiData?.data?.duration) ? aiData.data.duration : 5,
      budget: mood.budget,
      preferences: getPreferencesByMood(mood.currentMood),
      travelStyle: 'slow',
      itinerary,
      recommendations: {
        accommodation: safeStr(aiData?.data?.recommendations?.accommodation, '推荐当地特色住宿'),
        transportation: safeStr(aiData?.data?.recommendations?.transportation, '建议使用当地交通工具'),
        food: safeStr(aiData?.data?.recommendations?.food, '品尝当地特色美食'),
        tips: safeStr(aiData?.data?.recommendations?.tips, '注意当地文化和习俗')
      },
      detectedIntent: {
        intentType: safeStr(intent?.intentType, 'seeker'),
        keywords: arr<string>(intent?.keywords),
        emotionTone: safeStr(intent?.emotionTone, 'healing'),
        description: safeStr(intent?.description, '疗愈型旅行体验')
      }
    }
  }

  // 使用 Planner API 生成行程
  const generateItinerary = async (mode: 'planner' | 'seeker') => {
    if (isRunning.value) return // 避免并发重复点击
    isRunning.value = true
    clearGenerationLogs()
    pushGenerationLog(mode === 'planner' ? '🚀 开始生成 Planner 智能行程...' : '🚀 开始生成 Seeker 心情行程...')
    setLoading(true)
    setError(null)
    
    try {
      let generatedData: ItineraryData

      if (mode === 'planner') {
        pushGenerationLog('📡 Planner：已发送行程生成请求，正在等待 AI 响应...')
        const plannerResponse = await plannerAPI.generateItinerary({
          ...plannerData.value,
          language: i18n?.global?.locale?.value ?? 'zh-CN'
        })
        pushGenerationLog(`✅ Planner：行程生成完成，AI 返回 ${Array.isArray(plannerResponse.days) ? plannerResponse.days.length : 0} 天数据`)
        plannerItinerary.value = plannerResponse
        updatePlannerInsights(plannerResponse)
        generatedData = toItineraryFromPlanner(plannerResponse, plannerData.value)
      } else {
        const { detectInspirationIntent } = await import('@/services/deepseekAPI')
        const currentLanguage = i18n?.global?.locale?.value ?? 'zh-CN'
        const userContext = `${safeStr(moodData.value.currentMood)} ${safeStr(moodData.value.desiredExperience)}`
        pushGenerationLog('🧭 正在识别旅行意图...')
        const intent = await detectInspirationIntent(userContext, currentLanguage)
        
        pushGenerationLog('📡 Seeker：正在生成情绪化旅程草稿...')
        const aiData: any = await emotionalTravelAPI.generateTravelPlan({
          mood: moodData.value.currentMood,
          experience: moodData.value.desiredExperience,
          budget: moodData.value.budget,
          duration: moodData.value.duration
        } as any)
        
        pushGenerationLog(`✅ Seeker：行程草稿已生成，AI 返回 ${Array.isArray(aiData?.data?.itinerary) ? aiData.data.itinerary.length : 0} 天数据`)
        generatedData = toItineraryFromSeeker(aiData, moodData.value, intent)
      }
      
      setItineraryData(generatedData)
      setCurrentMode(mode)
      pushGenerationLog('🎉 行程已准备完成')
    } catch (err) {
      console.error('生成行程失败:', err)
      setError('生成行程失败，请重试')
      pushGenerationLog('❌ 生成行程失败', 'error')
    } finally {
      setLoading(false)
      isRunning.value = false
    }
  }

  // 生成心理旅程（基于问卷）
  const generatePsychologicalJourney = async (personalityProfile: any, selectedDestination?: string) => {
    if (isRunning.value) return
    isRunning.value = true
    clearGenerationLogs()
    pushGenerationLog('🚀 开始生成心理旅程推荐...')
    setLoading(true)
    setError(null)
    
    try {
      const { generatePsychologicalJourney: generateJourneyAPI } = await import('@/services/deepseekAPI')
      const currentLanguage = i18n?.global?.locale?.value ?? 'zh-CN'
      
      // 用户国家
      let userCountry: string | undefined = undefined
      try {
        const { getUserLocationCode } = await import('@/config/userProfile')
        const code = getUserLocationCode()
        userCountry = code || undefined
      } catch {}
      
      // 国籍（用于显示格式）
      let userNationality: string | undefined = undefined
      try {
        const { getUserNationalityCode } = await import('@/config/userProfile')
        const { PRESET_COUNTRIES } = await import('@/constants/countries')
        const nationalityCode = getUserNationalityCode() || undefined
        if (nationalityCode) {
          const countryInfo = (PRESET_COUNTRIES as any)[nationalityCode]
          if (countryInfo) userNationality = countryInfo.name
        }
      } catch {}
      
      // 永久居民身份
      let userPermanentResidency: string | undefined = undefined
      try {
        const { getUserPermanentResidencyCode } = await import('@/config/userProfile')
        const { PRESET_COUNTRIES } = await import('@/constants/countries')
        const residencyCode = getUserPermanentResidencyCode() || undefined
        if (residencyCode) {
          const info = (PRESET_COUNTRIES as any)[residencyCode]
          if (info) userPermanentResidency = info.name
        }
      } catch {}
      
      // 已持有签证
      let heldVisas: string[] = []
      try {
        const { getHeldVisas } = await import('@/config/userProfile')
        heldVisas = getHeldVisas() || []
      } catch {}
      
      // 签证信息
      let visaFreeDestinations: string[] = []
      let visaInfoSummary: string | null = null
      try {
        const { getVisaFreeDestinations, getVisaDescription } = await import('@/config/visa')
        const { getUserNationalityCode, getUserPermanentResidencyCode } = await import('@/config/userProfile')
        const { PRESET_COUNTRIES } = await import('@/constants/countries')
        
        const nationalityCode = getUserNationalityCode() || undefined
        const residencyCode = getUserPermanentResidencyCode() || undefined
        
        visaFreeDestinations = getVisaFreeDestinations(nationalityCode, residencyCode) || []
        
        if (selectedDestination) {
          const destCountryInfo = Object.values(PRESET_COUNTRIES as any).find((country: any) =>
            selectedDestination.includes(country.name) || selectedDestination.includes(country.code)
          ) as any
          if (destCountryInfo) {
            visaInfoSummary = getVisaDescription(destCountryInfo.code, nationalityCode, residencyCode) || null
        }
        }
      } catch {}

      // 调用生成
      const inspirationResp = await generateJourneyAPI(
        personalityProfile,
        currentLanguage,
        userCountry,
        selectedDestination,
        userNationality,
        userPermanentResidency,
        heldVisas,
        visaFreeDestinations,
        visaInfoSummary
      )
      pushGenerationLog(`✅ 心理旅程数据返回：候选地点 ${Array.isArray(inspirationResp?.locations) ? inspirationResp.locations.length : 0} 个`)
      
      // 注入国家信息（SSR 兼容 navigator）
      if (inspirationResp?.locations) {
        const { detectCountryFromLocale, buildLocationCountries } = await import('@/utils/countryGuess')
        const lang = i18n?.global?.locale?.value || (typeof navigator !== 'undefined' ? (navigator.language as string) : 'zh-CN')
        const currentCountry = detectCountryFromLocale(lang)
        const locationCountries = buildLocationCountries(inspirationResp.locations)

        if (inspirationResp.locationDetails && locationCountries) {
          Object.keys(inspirationResp.locationDetails).forEach((loc) => {
            const detail = (inspirationResp.locationDetails as any)[loc]
            const country = locationCountries[loc]
            if (detail && country && !detail.country) detail.country = country
          })
        }
        inspirationResp.currentCountry = inspirationResp.currentCountry || currentCountry
        inspirationResp.locationCountries = inspirationResp.locationCountries || locationCountries
      }
      
      const enrichedResp = await enrichInspirationMedia(inspirationResp, currentLanguage)
      setInspirationData(enrichedResp)
      setCurrentMode('inspiration')
      
      // ✅ 修复：此前这里变量名遮蔽导致 `.value` 读取错误
      const currentData = inspirationData.value
      console.log('✅ 数据已设置到 store')
      console.log('✅ 验证：当前 inspirationData.locations:', currentData?.locations?.length || 0)
      console.log('✅ 验证：当前 inspirationData.title:', currentData?.title)
      pushGenerationLog('🗂️ 数据整理完成，正在更新界面...')
    } catch (err) {
      console.error('生成心理旅程失败:', err)
      pushGenerationLog('❌ 生成心理旅程失败', 'error')
      setError('生成心理旅程失败，请重试')
    } finally {
      setLoading(false)
      isRunning.value = false
      pushGenerationLog('🏁 生成流程结束')
    }
  }

  // 生成灵感内容
  const generateInspiration = async (input: string) => {
    if (isRunning.value) return
    isRunning.value = true
    clearGenerationLogs()
    pushGenerationLog('🚀 开始生成灵感旅程...')
    setLoading(true)
    setError(null)
    
    try {
        const { detectInspirationIntent, generateInspirationJourney } = await import('@/services/deepseekAPI')
      const currentLanguage = i18n?.global?.locale?.value ?? 'zh-CN'
      
      // 用户国家
      let userCountry: string | undefined = undefined
      try {
        const { getUserLocationCode } = await import('@/config/userProfile')
        userCountry = getUserLocationCode() || undefined
      } catch {}
      
      // 国籍（显示格式）
      let userNationality: string | undefined = undefined
      try {
        const { getUserNationalityCode } = await import('@/config/userProfile')
        const { PRESET_COUNTRIES } = await import('@/constants/countries')
        const nationalityCode = getUserNationalityCode() || undefined
        if (nationalityCode) {
          const info = (PRESET_COUNTRIES as any)[nationalityCode]
          if (info) userNationality = info.name
        }
      } catch {}
      
      // 永久居民
      let userPermanentResidency: string | undefined = undefined
      try {
        const { getUserPermanentResidencyCode } = await import('@/config/userProfile')
        const { PRESET_COUNTRIES } = await import('@/constants/countries')
        const code = getUserPermanentResidencyCode() || undefined
        if (code) {
          const info = (PRESET_COUNTRIES as any)[code]
          if (info) userPermanentResidency = info.name
        }
      } catch {}
      
      // 已持签证
      let heldVisas: string[] = []
      try {
        const { getHeldVisas } = await import('@/config/userProfile')
        heldVisas = getHeldVisas() || []
      } catch {}
      
      // 签证信息
      let visaFreeDestinations: string[] = []
      let visaInfoSummary: string | null = null
      try {
        const { getVisaFreeDestinations, getVisaDescription } = await import('@/config/visa')
        const { getUserNationalityCode, getUserPermanentResidencyCode } = await import('@/config/userProfile')
        const { PRESET_COUNTRIES } = await import('@/constants/countries')
        
        const nationalityCode = getUserNationalityCode() || undefined
        const residencyCode = getUserPermanentResidencyCode() || undefined
        
        visaFreeDestinations = getVisaFreeDestinations(nationalityCode, residencyCode) || []

        const destCountryInfo = Object.values(PRESET_COUNTRIES as any).find((country: any) =>
          safeStr(input).includes(country.name)
        ) as any
        if (destCountryInfo) {
          visaInfoSummary = getVisaDescription(destCountryInfo.code, nationalityCode, residencyCode) || null
        }
      } catch {}
      
      // Intent
      pushGenerationLog('🧭 正在识别旅行意图...')
      const intent = await detectInspirationIntent(input, currentLanguage)

      // Gen
      pushGenerationLog('📡 正在生成灵感旅程细节...')
      const inspResp = await generateInspirationJourney(
        input,
        currentLanguage,
        userCountry,
        undefined,
        userNationality,
        userPermanentResidency,
        heldVisas,
        visaFreeDestinations,
        visaInfoSummary
      )
      pushGenerationLog(`✅ 灵感旅程生成完成：候选地点 ${Array.isArray(inspResp?.locations) ? inspResp.locations.length : 0} 个`)

      // 注入国家
      if (inspResp?.locations) {
        const { detectCountryFromLocale, buildLocationCountries } = await import('@/utils/countryGuess')
        const lang = i18n?.global?.locale?.value || (typeof navigator !== 'undefined' ? (navigator.language as string) : 'zh-CN')
        const currentCountry = detectCountryFromLocale(lang)
        const locationCountries = buildLocationCountries(inspResp.locations)

        if (inspResp.locationDetails && locationCountries) {
          Object.keys(inspResp.locationDetails).forEach((loc) => {
            const detail = (inspResp.locationDetails as any)[loc]
            const country = locationCountries[loc]
            if (detail && country && !detail.country) detail.country = country
          })
        }
        inspResp.currentCountry = inspResp.currentCountry || currentCountry
        inspResp.locationCountries = inspResp.locationCountries || locationCountries
      }
      
      const enrichedInspiration = await enrichInspirationMedia(inspResp, currentLanguage)
      setInspirationData(enrichedInspiration)
      setCurrentMode('inspiration')
      pushGenerationLog('🗂️ 数据整理完成，正在更新界面...')
    } catch (err) {
      console.error('生成灵感内容失败，尝试使用本地灵感库回退:', err)
      pushGenerationLog('⚠️ 生成失败，尝试使用本地灵感库回退', 'warn')
      try {
        const suggestions = await getLocalInspirationDestinations()
        const fallback = suggestions[0]?.name
        if (fallback) {
          const localData = buildInspirationFromLocal(fallback)
          const enrichedLocal = await enrichInspirationMedia(localData, currentLanguage)
          setInspirationData(enrichedLocal)
          setCurrentMode('inspiration')
          pushGenerationLog('✅ 已加载本地灵感库的备用推荐')
        } else {
          setError('生成灵感内容失败，请重试')
        }
      } catch {
        setError('生成灵感内容失败，请重试')
      }
    } finally {
      setLoading(false)
      isRunning.value = false
      pushGenerationLog('🏁 生成流程结束')
    }
  }

  // 提交反馈（静默失败）
  const submitFeedback = async (feedback: string, rating: number) => {
    try {
      const feedbackData = {
        feedback,
        mode: currentMode.value || 'planner',
        timestamp: new Date().toISOString(),
        rating
      }
      await emotionalTravelAPI.submitFeedback(feedbackData as any)
    } catch (err) {
      console.error('反馈提交失败:', err)
    }
  }

  // 优化 Planner 行程
  const optimizePlannerItinerary = async (optimizationType: 'time' | 'cost' | 'route') => {
    if (!plannerItinerary.value) throw new Error('没有可优化的行程')
    setLoading(true)
    setError(null)
    try {
      const optimizedItinerary = await plannerAPI.optimizeItinerary(plannerItinerary.value, optimizationType)
      plannerItinerary.value = optimizedItinerary
      updatePlannerInsights(optimizedItinerary)
      pushGenerationLog('✨ 行程优化完成')
    } catch (err) {
      console.error('优化行程失败:', err)
      setError('行程优化失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 获取目的地信息
  const getDestinationInfo = async (destination: string) => {
    try {
      return await plannerAPI.getDestinationInfo(destination)
    } catch (err) {
      console.error('获取目的地信息失败:', err)
      return null
    }
  }

  // 重置
  const resetData = () => {
    plannerData.value = {
      destination: '',
      duration: 5,
      budget: 'comfort',
      preferences: [],
      travelStyle: 'moderate'
    }
    moodData.value = {
      currentMood: '',
      desiredExperience: '',
      budget: 'comfort',
      duration: ''
    }
    inspirationData.value = null
    itineraryData.value = null
    plannerItinerary.value = null
    updatePlannerInsights(null)
    loading.value = false
    error.value = null
    currentMode.value = null
    clearGenerationLogs()
  }

  return {
    // State
    plannerData,
    moodData,
    inspirationData,
    itineraryData,
    plannerItinerary,
    plannerRhythmInsights,
    plannerNotifications,
    loading,
    error,
    currentMode,
    generationLogs,
    
    // Actions
    setPlannerData,
    setMoodData,
    setInspirationData,
    setItineraryData,
    setCurrentMode,
    setLoading,
    setError,
    clearGenerationLogs,
    generateItinerary,
    generateInspiration,
    generatePsychologicalJourney,
    getLocalInspirationDestinations,
    submitFeedback,
    resetData,
    optimizePlannerItinerary,
    getDestinationInfo,
    dismissPlannerNotification,
    dispose // 手动释放订阅（路由切换/注销场景）
  }
})

// -------------------- Utils --------------------
function getPreferencesByMood(mood: string): string[] {
  const moodPreferences: Record<string, string[]> = {
    tired: ['relaxation', 'nature'],
    stressed: ['relaxation', 'nature', 'food'],
    sad: ['culture', 'food', 'shopping'],
    excited: ['adventure', 'culture', 'food'],
    confused: ['culture', 'nature'],
    lonely: ['culture', 'food'],
    happy: ['adventure', 'culture', 'food', 'shopping']
  }
  return moodPreferences[mood] || ['culture', 'food']
}

function convertAPIResponseToItineraryData(apiData: any, mode: 'planner' | 'seeker'): ItineraryData {
  return {
    destination: apiData?.recommendations?.[0]?.destination || '未知目的地',
    duration: apiData?.preferences?.duration || 5,
    budget: apiData?.preferences?.budget || 'comfort',
    preferences: [],
    travelStyle: apiData?.rhythmAdjustment?.pattern_name || 'moderate',
    itinerary: generateMockItinerary(apiData?.recommendations?.[0]?.destination || '未知目的地'),
    recommendations: {
      accommodation: '推荐当地特色住宿',
      transportation: '建议使用当地交通工具',
      food: '品尝当地特色美食',
      tips: '注意当地文化和习俗'
    }
  }
}

function generateMockItinerary(destination: string): DayPlan[] {
  return [
    {
      day: 1,
      title: `第一天 - 抵达${destination}`,
      activities: [
        { time: '09:00', activity: '抵达目的地', type: '交通' },
        { time: '12:00', activity: '午餐', type: '餐饮' },
        { time: '14:00', activity: '入住酒店', type: '住宿' },
        { time: '16:00', activity: '市区游览', type: '观光' }
      ]
    },
    {
      day: 2,
      title: `第二天 - 探索${destination}`,
      activities: [
        { time: '09:00', activity: '参观主要景点', type: '观光' },
        { time: '12:00', activity: '午餐', type: '餐饮' },
        { time: '14:00', activity: '继续游览', type: '观光' },
        { time: '18:00', activity: '晚餐', type: '餐饮' }
      ]
    }
  ]
}

function generateInspirationCard(input: string): InspirationData {
  const lowerInput = (input || '').toLowerCase()
  if (lowerInput.includes('海洋') || lowerInput.includes('潜水') || lowerInput.includes('摄影')) {
    return {
      title: '🌊 海底光影之旅',
      subtitle: '探索神秘的海底世界，记录海洋生物的美丽瞬间',
      location: '巴厘岛 · 图兰奔',
      locations: ['巴厘岛 · 图兰奔', '帕劳 · 蓝洞', '冲绳 · 青之洞窟', '马尔代夫'],
      locationDetails: {
        '巴厘岛 · 图兰奔': {
          name: '巴厘岛 · 图兰奔',
          duration: '5天',
          budget: '中等 (1500-3000元/人)',
          highlights: ['专业潜水摄影课程', '海龟栖息区拍摄', '日落拍摄'],
          aiMessage: '巴厘岛的水下光线很适合潜水摄影，特别是在黄昏时分。'
        }
      },
      duration: '5天',
      budget: '中等',
      highlights: ['专业潜水摄影课程', '海龟栖息区拍摄', '日落拍摄'],
      aiMessage: '光线在水下的那一刻，会让你忘记时间。记得在日落时拍摄，光会变成金色。'
    }
  }
  return {
    title: '🌟 发现之旅',
    subtitle: '跟随内心的声音，探索未知的美好',
    location: '冰岛 · 雷克雅未克',
    locations: ['冰岛 · 雷克雅未克', '新西兰 · 皇后镇', '挪威 · 罗弗敦群岛'],
    locationDetails: {
      '冰岛 · 雷克雅未克': {
        name: '冰岛 · 雷克雅未克',
        duration: '5天',
        budget: '较高 (10000-15000元/人)',
        highlights: ['极光', '冰川', '温泉'],
        aiMessage: '冰岛是体验极端自然景观的最佳之地。'
      }
    },
    duration: '5天',
    budget: '较高',
    highlights: ['极光', '冰川', '温泉'],
    aiMessage: '冰岛是体验极端自然景观的最佳之地。'
  }
}
