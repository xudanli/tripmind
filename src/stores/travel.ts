// path: src/stores/travel.ts
import { defineStore } from 'pinia'
import { ref, onUnmounted } from 'vue'
import i18n from '@/i18n'
import emotionalTravelAPI from '@/services/emotionalTravelAPI'
import type { EmotionDetectionRequest, TravelPlanRequest, FeedbackRequest } from '@/services/emotionalTravelAPI'
// plannerAPI 已删除
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
  destination: string        // 目的地，如 "瑞士琉森"、"日本东京"
  days: number              // 旅行天数，范围 1-30
  preferences?: {           // 用户偏好（可选）
    interests?: string[]    // 兴趣列表，如 ["自然风光", "户外活动"]
    budget?: "low" | "medium" | "high"  // 预算等级
    travelStyle?: "relaxed" | "moderate" | "intensive"  // 旅行风格
  }
  startDate: string         // 旅行开始日期，格式: "YYYY-MM-DD"
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

// planner 相关类型已删除

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
  // 移除封面和文本内容相关字段
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
    timeSlots: Array<{
      time: string
      coordinates?: { lat: number; lng: number }
      // 只保留图片相关数据
      details?: {
        images?: {
          cover?: string
          gallery?: string[]
          [key: string]: any
        }
        photos?: any
        [key: string]: any
      }
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
  // 移除总结等文本内容
  videos?: Record<string, InspirationVideo>
  hasFullItinerary?: boolean
  generationMode?: 'full' | 'candidates'
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

interface GenerateInspirationOptions {
  selectedDestination?: string
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

// planner 相关函数已删除


// -------------------- Store --------------------
export const useTravelStore = defineStore('travel', () => {
  // State
  const plannerData = ref<PlannerFormData>({
    destination: '',
    days: 5,
    preferences: {
      interests: [],
      budget: 'medium',
      travelStyle: 'moderate'
    },
    startDate: new Date().toISOString().split('T')[0] as string // 默认为今天
  })

  const moodData = ref<MoodData>({
    currentMood: '',
    desiredExperience: '',
    budget: 'comfort',
    duration: ''
  })

  const inspirationData = ref<InspirationData | null>(null)
  const inspirationSelectedDestination = ref<string | null>(null)
  const itineraryData = ref<ItineraryData | null>(null)
  const lastInspirationInput = ref<string>('')
  
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
  // planner 相关函数已删除

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
  // planner 相关函数已删除

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
        // 调用新的行程生成 API
        const { generateItinerary: generateItineraryAPI } = await import('@/services/itineraryAPI')
        
        // 从 plannerData 中获取表单数据
        const formData = plannerData.value
        if (!formData.destination || !formData.days || !formData.startDate) {
          throw new Error('请完成所有必填项：目的地、天数和开始日期')
        }

        pushGenerationLog('📡 正在调用行程生成 API...')
        const apiResponse = await generateItineraryAPI(
          {
            destination: formData.destination,
            days: formData.days,
            startDate: formData.startDate,
            preferences: formData.preferences
          },
          {
            enrichWithLocationInfo: true, // 启用位置信息获取
            onProgress: (message) => {
              pushGenerationLog(message)
            }
          }
        )

        pushGenerationLog(`✅ 行程生成成功，共 ${apiResponse.days?.length || 0} 天`)
        
        // 将 API 返回的数据转换为 ItineraryData 格式
        // 注意：这里我们需要将 FrontendItineraryData 转换为 ItineraryData
        // 但实际存储时，我们可以直接使用 API 返回的数据结构
        generatedData = {
          destination: apiResponse.destination,
          duration: apiResponse.days?.length || formData.days,
          budget: formData.preferences?.budget || 'medium',
          preferences: formData.preferences?.interests || [],
          travelStyle: formData.preferences?.travelStyle || 'moderate',
          itinerary: [], // 这个字段在新的数据结构中不再使用
          recommendations: {
            accommodation: '',
            transportation: '',
            food: '',
            tips: apiResponse.summary || ''
          }
        }

        // 将 API 返回的完整数据存储到 itineraryData 中
        // 这样前端组件可以直接使用 days 数组
        // 我们需要扩展 ItineraryData 或者创建一个新的字段来存储完整数据
        // 暂时将完整数据存储到 itineraryData 的扩展字段中
        ;(generatedData as any).days = apiResponse.days
        ;(generatedData as any).totalCost = apiResponse.totalCost
        ;(generatedData as any).summary = apiResponse.summary
        ;(generatedData as any).title = apiResponse.title
      } else {
        // Seeker 模式：优先使用后端API，失败时回退到前端实现
        const USE_BACKEND_API = import.meta.env.VITE_USE_SEEKER_BACKEND_API !== 'false' // 默认启用
        
        const currentLanguage = i18n?.global?.locale?.value ?? 'zh-CN'
        const userContext = `${safeStr(moodData.value.currentMood)} ${safeStr(moodData.value.desiredExperience)}`
        
        // 获取用户上下文信息
        const { getUserLocationCode, getUserNationalityCode } = await import('@/config/userProfile')
        const userCountry = getUserLocationCode() || undefined
        const userNationality = getUserNationalityCode() || undefined
        
        if (USE_BACKEND_API) {
          try {
            // 调用后端 Seeker API
            const { generateSeekerTravelPlan } = await import('@/services/seekerBackendAPI')
            pushGenerationLog('📡 调用后端API生成 Seeker 旅行计划...')
            
            const backendResult = await generateSeekerTravelPlan({
              currentMood: moodData.value.currentMood,
              desiredExperience: moodData.value.desiredExperience,
              budget: moodData.value.budget,
              duration: moodData.value.duration,
              language: currentLanguage,
              userCountry: userCountry || undefined,
              userNationality: userNationality || undefined
            })
            
            pushGenerationLog(`✅ 后端API生成成功，共 ${backendResult.duration} 天行程`)
            
            // 将后端响应转换为 ItineraryData 格式
            const days = backendResult.itinerary || []
            const itinerary = days.map((day) => ({
              day: day.day,
              title: day.title || `第${day.day}天`,
              activities: (day.activities || []).map((a) => ({
                time: a.time,
                activity: a.activity,
                type: a.type
              }))
            }))
            
            generatedData = {
              destination: backendResult.destination,
              duration: backendResult.duration,
              budget: moodData.value.budget,
              preferences: getPreferencesByMood(moodData.value.currentMood),
              travelStyle: 'slow',
              itinerary,
              recommendations: {
                accommodation: backendResult.recommendations?.accommodation || '推荐当地特色住宿',
                transportation: backendResult.recommendations?.transportation || '建议使用当地交通工具',
                food: backendResult.recommendations?.food || '品尝当地特色美食',
                tips: backendResult.recommendations?.tips || '注意当地文化和习俗'
              },
              detectedIntent: backendResult.detectedIntent ? {
                intentType: backendResult.detectedIntent.intentType,
                keywords: backendResult.detectedIntent.keywords || [],
                emotionTone: backendResult.detectedIntent.emotionTone,
                description: backendResult.detectedIntent.description
              } : {
                intentType: 'seeker',
                keywords: [],
                emotionTone: moodData.value.currentMood,
                description: '疗愈型旅行体验'
              }
            }
            
            // 保存完整的后端响应数据（用于后续保存到数据库）
            ;(generatedData as any).backendResponse = backendResult
          } catch (error: any) {
            console.warn('⚠️ Seeker 后端API调用失败，使用前端实现:', error.message)
            pushGenerationLog('⚠️ 后端API调用失败，使用前端实现...')
            // Fallback to frontend implementation
          }
        }
        
        // 如果后端API未启用或调用失败，使用前端实现
        if (!USE_BACKEND_API || !generatedData) {
          const { detectInspirationIntent } = await import('@/services/deepseekAPI')
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
  const generateInspiration = async (input: string, options?: GenerateInspirationOptions) => {
    if (isRunning.value) return
    isRunning.value = true
    clearGenerationLogs()
    const normalizedInput = safeStr(input)
    const selectedDestinationCandidate = options?.selectedDestination?.trim()
    
    // 检测输入是否包含目的地（优先使用用户选择的目的地）
    let detectedDestination: string | null = null
    if (selectedDestinationCandidate) {
      detectedDestination = selectedDestinationCandidate
    } else {
      // 检查输入中是否包含目的地名称
      try {
        const { PRESET_COUNTRIES } = await import('@/constants/countries')
        const inputLower = normalizedInput.toLowerCase()
        
        // 检查输入中是否包含国家名称
        // 使用更适合中文的匹配方式：直接检查是否包含国家名称
        // 优先匹配较长的国家名称，避免短名称被误匹配
        const countries = Object.values(PRESET_COUNTRIES as any) as any[]
        const sortedCountries = countries.sort((a, b) => b.name.length - a.name.length) // 按长度降序排序
        const countryMatch = sortedCountries.find((country: any) => {
          const countryName = country.name
          // 对于中文，直接检查是否包含国家名称（不区分大小写）
          // 使用 includes 更简单可靠
          return normalizedInput.toLowerCase().includes(countryName.toLowerCase())
        }) as any
        
        if (countryMatch) {
          detectedDestination = countryMatch.name
          console.log('✅ [Inspiration] 检测到输入包含目的地:', detectedDestination)
        }
      } catch (error) {
        console.warn('⚠️ [Inspiration] 检测目的地失败:', error)
      }
    }
    
    // 如果输入包含目的地，直接生成完整行程；否则生成候选目的地列表
    const generationMode: 'full' | 'candidates' = detectedDestination ? 'full' : (options?.mode || 'candidates')
    const finalSelectedDestination = detectedDestination || selectedDestinationCandidate
    pushGenerationLog(
      generationMode === 'full'
        ? '🚀 开始生成灵感旅程详情...'
        : '🚀 开始生成候选灵感目的地...'
    )
    setLoading(true)
    setError(null)
    const currentLanguage = i18n?.global?.locale?.value ?? 'zh-CN'
    let effectiveInput = normalizedInput
    if (!effectiveInput && selectedDestinationCandidate) {
      effectiveInput = lastInspirationInput.value
    }
    if (!effectiveInput) {
      const warningMessage = currentLanguage.startsWith('en')
        ? 'Please describe what kind of inspiration you need.'
        : '请先描述你想要的灵感方向。'
      setError(warningMessage)
      pushGenerationLog('⚠️ 未提供有效的灵感输入', 'warn')
      setLoading(false)
      isRunning.value = false
      return
    }

    lastInspirationInput.value = effectiveInput
    if (generationMode === 'candidates') {
      inspirationSelectedDestination.value = null
    } else if (finalSelectedDestination) {
      inspirationSelectedDestination.value = finalSelectedDestination
    }
    
    let autoDestinationAfterRun: string | null = null
    try {
        const { detectInspirationIntent, generateInspirationJourney } = await import('@/services/deepseekAPI')
      
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

        const destCountryInfo = Object.values(PRESET_COUNTRIES as any).find((country: any) => {
          if (safeStr(effectiveInput).includes(country.name)) return true
          if (finalSelectedDestination && finalSelectedDestination.includes(country.name)) return true
          return false
        }) as any
        if (destCountryInfo) {
          visaInfoSummary = getVisaDescription(destCountryInfo.code, nationalityCode, residencyCode) || null
        }
      } catch {}
      
      // Intent
      pushGenerationLog('🧭 正在识别旅行意图...')
      const intent = await detectInspirationIntent(effectiveInput, currentLanguage)

      // Gen
      pushGenerationLog(
        generationMode === 'full'
          ? '📡 正在生成灵感旅程细节...'
          : '📡 正在生成候选目的地及旅程框架...'
      )
      const inspResp = await generateInspirationJourney(
        effectiveInput,
        currentLanguage,
        userCountry,
        finalSelectedDestination || undefined,  // 使用检测到的目的地
        userNationality,
        userPermanentResidency,
        heldVisas,
        visaFreeDestinations,
        visaInfoSummary,
        undefined,
        generationMode
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
      
      if (inspResp) {
        try {
          // 仅在灵感模式下打印原始 JSON，方便排查
          console.log('🧾 Inspiration raw response:', JSON.stringify(inspResp, null, 2))
        } catch {
          console.log('🧾 Inspiration raw response (object):', inspResp)
        }
      }
      
      const enrichedInspiration = await enrichInspirationMedia(inspResp, currentLanguage)
      if (enrichedInspiration) {
        try {
          console.log('✨ Inspiration enriched data:', JSON.stringify(enrichedInspiration, null, 2))
        } catch {
          console.log('✨ Inspiration enriched data (object):', enrichedInspiration)
        }
      }
      setInspirationData(enrichedInspiration)
      setCurrentMode('inspiration')
      const hasDetailedSlots =
        Array.isArray(enrichedInspiration?.days) &&
        enrichedInspiration.days.length > 0 &&
        enrichedInspiration.days.every(
          (day: any) => Array.isArray(day?.timeSlots) && day.timeSlots.length > 0
        )

      if (generationMode === 'full') {
        inspirationSelectedDestination.value =
          selectedDestinationCandidate ||
          enrichedInspiration.destination ||
          enrichedInspiration.location ||
          (enrichedInspiration.locations && enrichedInspiration.locations.length > 0
            ? enrichedInspiration.locations[0]
            : null) ||
          null
      } else if (!inspirationSelectedDestination.value && enrichedInspiration.locations?.length) {
        const firstLocation = enrichedInspiration.locations[0]
        if (firstLocation) {
          inspirationSelectedDestination.value = firstLocation
        }
      }

      if (generationMode === 'candidates' && !hasDetailedSlots) {
        const candidateList = Array.isArray(enrichedInspiration.locations)
          ? enrichedInspiration.locations
          : []
    const resolvedDestination =
          selectedDestinationCandidate ||
          safeStr(enrichedInspiration.destination) ||
          safeStr(enrichedInspiration.location) ||
          (candidateList.length === 1 ? candidateList[0] : '')

        if (resolvedDestination) {
          if (candidateList.length <= 1) {
            inspirationSelectedDestination.value = resolvedDestination
            autoDestinationAfterRun = resolvedDestination
            pushGenerationLog(
              `🔁 自动为目的地 "${resolvedDestination}" 生成详细行程...`
            )
          } else {
        // 如果候选列表里包含用户输入的目的地，自动选中那一个
        const matchedFromInput = candidateList.find((candidate) =>
          effectiveInput.includes(candidate)
        )
        if (matchedFromInput) {
          inspirationSelectedDestination.value = matchedFromInput
          autoDestinationAfterRun = matchedFromInput
          pushGenerationLog(
            `🔁 识别到输入中的目的地 "${matchedFromInput}"，正在自动生成详细行程...`
          )
        } else {
          pushGenerationLog('ℹ️ 检测到多个候选目的地，请先挑选后再生成详细行程。', 'warn')
        }
          }
        }
      }
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
          inspirationSelectedDestination.value = fallback
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
      if (autoDestinationAfterRun) {
        const nextDestination = autoDestinationAfterRun
        autoDestinationAfterRun = null
        setTimeout(() => {
          generateInspirationForDestination(nextDestination).catch((error) => {
            console.error('自动生成详细行程失败:', error)
            pushGenerationLog('⚠️ 自动生成详细行程失败，请手动重试', 'warn')
          })
        })
      }
    }
  }

  // 提交反馈（静默失败）
  const generateInspirationForDestination = async (destination: string) => {
    const baseInput = lastInspirationInput.value
    const normalizedDestination = safeStr(destination)
    if (!baseInput) {
      throw new Error('缺少原始灵感输入，请先输入灵感需求。')
    }
    if (!normalizedDestination) {
      throw new Error('需要提供有效的目的地。')
    }
    return generateInspiration(baseInput, { selectedDestination: normalizedDestination })
  }

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

  // planner 相关函数已删除

  // 重置
  const resetData = () => {
    plannerData.value = {
      destination: '',
      days: 5,
      preferences: {
        interests: [],
        budget: 'medium',
        travelStyle: 'moderate'
      },
      startDate: new Date().toISOString().split('T')[0] as string
    }
    moodData.value = {
      currentMood: '',
      desiredExperience: '',
      budget: 'comfort',
      duration: ''
    }
    inspirationData.value = null
    inspirationSelectedDestination.value = null
    itineraryData.value = null
    // planner 相关清理已删除
    loading.value = false
    error.value = null
    currentMode.value = null
    clearGenerationLogs()
    lastInspirationInput.value = ''
  }

  const storeApi = {
    // State
    plannerData,
    moodData,
    inspirationData,
    inspirationSelectedDestination,
    itineraryData,
    // planner 相关导出已删除
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
    generateInspirationForDestination,
    generatePsychologicalJourney,
    getLocalInspirationDestinations,
    submitFeedback,
    resetData,
    // planner 相关函数已删除
    dispose // 手动释放订阅（路由切换/注销场景）
  }

  if (typeof window !== 'undefined') {
    try {
      ;(window as any).__travelStore = storeApi
    } catch (err) {
      console.warn('无法在 window 上挂载 __travelStore:', err)
    }
  }

  return storeApi
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
