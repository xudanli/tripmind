import { defineStore } from 'pinia'
import { ref } from 'vue'
import i18n from '@/i18n'
import emotionalTravelAPI, { 
  type EmotionDetectionRequest,
  type TravelPlanRequest,
  type FeedbackRequest 
} from '@/services/emotionalTravelAPI'
import { plannerAPI, type PlannerItineraryResponse } from '@/services/plannerAPI'
import { subscribeLogEvents, LogLevel } from '@/utils/inspiration/core/logger'

interface GenerationLogEntry {
  id: number
  message: string
  level: 'info' | 'warn' | 'error'
  timestamp: number
}

let unsubscribeLogEvents: (() => void) | null = null

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

export interface LocationDetail {
  name: string
  country?: string
  duration?: string
  budget?: string
  highlights?: string[] | HighlightDetail[]
  aiMessage?: string
  description?: string
  reason?: string // AI推荐理由
  reasoning?: string // AI判断思路
}

export interface InspirationData {
  title: string
  subtitle: string
  location: string
  locations?: string[]
  locationDetails?: { [key: string]: LocationDetail }
  // 新增：当前国家与地点到国家映射
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
  
  // 双轨 JSON 输出结构（新格式 - Inspirit Designer）
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
  
  // 行程计划格式（兼容格式）
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
      // 详细信息（新增）
      details?: {
        // 名称信息
        name?: {
          chinese?: string
          english?: string
          local?: string // 当地语言名称
        }
        // 地址信息
        address?: {
          chinese?: string
          english?: string
          local?: string
          landmark?: string // 附近地标（如"靠近历史广场"）
        }
        // 交通信息
        transportation?: {
          fromStation?: {
            distance?: string // 如"12分钟步行"
            walkTime?: string
            busTime?: string
          }
          busLines?: string[] // 公交路线，如["1", "2", "8", "19"]
          busStop?: string // 公交站名（当地语言）
          subway?: {
            available: boolean
            lines?: string[]
            station?: string
          }
          parking?: string // 停车信息
        }
        // 营业/开放时间
        openingHours?: {
          days?: string // 如"周一至周日"
          hours?: string // 如"11:30-14:30, 17:30-22:00"
          holidays?: string // 节假日安排
          closedDays?: string[] // 关闭日期
        }
        // 费用明细
        pricing?: {
          general?: number // 一般估计费用
          detail?: {
            setMeal?: { min: number; max: number; unit: string } // 套餐价格
            aLaCarte?: { min: number; max: number; unit: string } // 单点价格
            children?: { price: number; ageLimit?: number; unit: string } // 儿童价格
            groupDiscount?: { percentage?: number; minPeople?: number } // 团体折扣
          }
        }
        // 评分
        rating?: {
          score?: number // 0-5
          platform?: string // 评分平台（如"Google", "TripAdvisor"）
          reviewCount?: number
        }
        // 推荐和建议
        recommendations?: {
          bestTime?: string // 最佳时间，如"晚餐时间(18:00-20:00)"
          bookingRequired?: boolean
          bookingAdvance?: string // 预订提前时间，如"2-3天"
          suggestedDuration?: string // 建议停留时间，如"90-120分钟"
          dressCode?: string // 着装要求
          seasonal?: string // 季节特色/注意事项
          specialNotes?: string[] // 特殊注意事项
        }
        // 描述和特色
        description?: {
          cuisine?: string // 菜系/类型
          specialty?: string // 特色
          atmosphere?: string // 氛围
          highlights?: string[] // 亮点
        }
      }
    }>
  }>
  
  // 心理旅程相关字段
  psychologicalFlow?: string[]
  symbolicElements?: string[]
  templateName?: string
  matchScore?: number
  matchDetails?: any
  psychologicalJourney?: any
  
  // 行程推荐
  recommendations?: {
    bestTimeToVisit?: string
    weatherAdvice?: string
    packingTips?: string[]
    localTips?: string[]
    emergencyContacts?: string[]
  }
  totalCost?: number
  summary?: string
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

export interface Activity {
  time: string
  activity: string
  type: string
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

export const useTravelStore = defineStore('travel', () => {
  // Planner 表单数据
  const plannerData = ref<PlannerFormData>({
    destination: '',
    duration: 5,
    budget: 'comfort',
    preferences: [],
    travelStyle: 'moderate',
    customRequirements: ''
  })

  // Seeker 心情数据
  const moodData = ref<MoodData>({
    currentMood: '',
    desiredExperience: '',
    budget: 'comfort',
    duration: ''
  })

  const inspirationData = ref<InspirationData | null>(null)

  // AI 生成的行程数据
  const itineraryData = ref<ItineraryData | null>(null)

  // Planner 行程数据
  const plannerItinerary = ref<PlannerItineraryResponse | null>(null)
  
  // 加载状态
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentMode = ref<'planner' | 'seeker' | 'inspiration' | null>(null)
  const generationLogs = ref<GenerationLogEntry[]>([])

  const pushGenerationLog = (message: string, level: 'info' | 'warn' | 'error' = 'info', timestamp?: number) => {
    const text = (message ?? '').toString().trim()
    if (!text) return
    const entry: GenerationLogEntry = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      message: text,
      level,
      timestamp: timestamp ?? Date.now()
    }
    generationLogs.value = [...generationLogs.value, entry].slice(-150)
  }

  const clearGenerationLogs = () => {
    generationLogs.value = []
  }

  if (!unsubscribeLogEvents) {
    unsubscribeLogEvents = subscribeLogEvents(event => {
      // 仅在灵感生成场景捕获日志（adapter 命名空间）
      if (event.namespace && !event.namespace.includes('adapter')) return
      const level: 'info' | 'warn' | 'error' = event.level === LogLevel.ERROR
        ? 'error'
        : event.level === LogLevel.WARN
          ? 'warn'
          : 'info'
      pushGenerationLog(event.message, level, event.timestamp)
    })
  }

  // Actions
  const setPlannerData = (data: Partial<PlannerFormData>) => {
    Object.assign(plannerData.value, data)
  }

  const setMoodData = (data: Partial<MoodData>) => {
    Object.assign(moodData.value, data)
  }

  const setInspirationData = (data: InspirationData | null) => {
    inspirationData.value = data
  }

  const setItineraryData = (data: ItineraryData | null) => {
    itineraryData.value = data
  }

  const setCurrentMode = (mode: 'planner' | 'seeker' | 'inspiration' | null) => {
    currentMode.value = mode
  }

  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading
  }

  const setError = (message: string | null) => {
    error.value = message
  }

  // -------- Inspiration 本地数据库支持 --------
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

  // 使用 Planner API 生成行程
  const generateItinerary = async (mode: 'planner' | 'seeker') => {
    clearGenerationLogs()
    pushGenerationLog(mode === 'planner' ? '🚀 开始生成 Planner 智能行程...' : '🚀 开始生成 Seeker 心情行程...')
    setLoading(true)
    setError(null)
    
    try {
      let generatedData: ItineraryData

      if (mode === 'planner') {
        // 使用新的 Planner API 生成智能行程
        console.log('Planner 模式：开始生成智能行程...', plannerData.value)
        pushGenerationLog('📡 Planner：已发送行程生成请求，正在等待 AI 响应...')
        const plannerResponse = await plannerAPI.generateItinerary(plannerData.value)
        console.log('Planner 模式：AI 生成的行程', plannerResponse)
        pushGenerationLog('✅ Planner：行程生成完成，正在整理数据...')
        
        // 保存 Planner 行程数据
        plannerItinerary.value = plannerResponse
        
        // 转换为兼容的 ItineraryData 格式
        generatedData = {
          destination: plannerResponse.destination,
          duration: plannerResponse.duration,
          budget: plannerData.value.budget,
          preferences: plannerData.value.preferences,
          travelStyle: plannerData.value.travelStyle,
          itinerary: plannerResponse.days.map(day => ({
            day: parseInt(day.date.replace('Day ', '')),
            title: day.title,
            activities: day.timeSlots.map(slot => ({
              time: slot.time,
              activity: slot.activity,
              type: slot.category
            }))
          })),
          recommendations: {
            accommodation: plannerResponse.recommendations.localTips[0] || '建议提前预订住宿',
            transportation: plannerResponse.recommendations.localTips[1] || '建议使用公共交通',
            food: plannerResponse.recommendations.localTips[2] || '尝试当地特色美食',
            tips: plannerResponse.summary
          },
          detectedIntent: {
            intentType: 'planner',
            keywords: plannerData.value.preferences,
            emotionTone: 'practical',
            description: '实用型旅行规划'
          }
        }
      } else if (mode === 'seeker') {
        // Seeker 模式使用情感旅行 API
        const { detectInspirationIntent } = await import('@/services/deepseekAPI')
        const currentLanguage = i18n.global.locale.value || 'zh-CN'
        
        // 合并用户输入进行意图识别
        const userContext = `${moodData.value.currentMood} ${moodData.value.desiredExperience}`
        console.log('Seeker 模式：开始意图识别...', userContext)
        const intent = await detectInspirationIntent(userContext, currentLanguage)
        console.log('Seeker 模式：识别到的意图', intent)
        pushGenerationLog(`🧭 检测到旅行意图：${intent.intentType || '未知'}`)
        
        // 调用情感旅行 API 生成 Seeker 行程
        pushGenerationLog('📡 Seeker：正在生成情绪化旅程草稿...')
        const aiData: any = await emotionalTravelAPI.generateTravelPlan({
          mood: moodData.value.currentMood,
          experience: moodData.value.desiredExperience,
          budget: moodData.value.budget,
          duration: moodData.value.duration
        } as any)
        
        // 转换 AI 响应为我们的数据格式
        let itinerary = aiData.data?.itinerary?.map((day: any, index: number) => ({
          day: day.day || index + 1,
          title: day.title || `第${day.day || index + 1}天`,
          activities: day.activities?.map((a: any) => ({
            time: a.time || '待定',
            activity: a.activity || a.name || '',
            type: a.type || '观光'
          })) || []
        })) || []
        
        // 不再插入“体验日”
        
        pushGenerationLog('✅ Seeker：行程草稿已生成，正在整理结构...')
        generatedData = {
          destination: (aiData as any).data?.destination || '未知目的地',
          duration: (aiData as any).data?.duration || 5,
          budget: moodData.value.budget,
          preferences: getPreferencesByMood(moodData.value.currentMood),
          travelStyle: 'slow', // Seeker 模式默认慢节奏
          itinerary: itinerary,
          recommendations: {
            accommodation: (aiData as any).data?.recommendations?.accommodation || '推荐当地特色住宿',
            transportation: (aiData as any).data?.recommendations?.transportation || '建议使用当地交通工具',
            food: (aiData as any).data?.recommendations?.food || '品尝当地特色美食',
            tips: (aiData as any).data?.recommendations?.tips || '注意当地文化和习俗'
          },
          detectedIntent: {
            intentType: intent.intentType || 'seeker',
            keywords: intent.keywords || [],
            emotionTone: intent.emotionTone || 'healing',
            description: intent.description || '疗愈型旅行体验'
          }
        }
      } else {
        // 其他模式使用默认逻辑
        generatedData = convertAPIResponseToItineraryData({}, mode)
      }
      
      // 保存生成的行程数据
      setItineraryData(generatedData)
      setCurrentMode(mode)
      
      console.log(`${mode} 模式行程生成完成:`, generatedData)
      
    } catch (err) {
      console.error('生成行程失败:', err)
      setError('生成行程失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 生成心理旅程（基于问卷）
  const generatePsychologicalJourney = async (personalityProfile: any, selectedDestination?: string) => {
    clearGenerationLogs()
    pushGenerationLog('🚀 开始生成心理旅程推荐...')
    setLoading(true)
    setError(null)
    
    try {
      // 导入心理旅程生成函数（使用别名避免冲突）
      const { generatePsychologicalJourney: generateJourneyAPI } = await import('@/services/deepseekAPI')
      const currentLanguage = i18n.global.locale.value || 'zh-CN'
      
      // 获取用户所在国家（用于推荐目的地）
      let userCountry: string | undefined = undefined
      try {
        const { getUserLocationCode } = await import('@/config/userProfile')
        const locationCode = getUserLocationCode()
        if (locationCode) {
          userCountry = locationCode
          console.log('📍 用户所在国家（用于推荐目的地）:', userCountry)
        }
      } catch (err) {
        console.warn('⚠️ 获取用户所在国家失败', err)
      }
      
      // 获取用户国籍（用于显示格式，如货币、日期格式等）
      let userNationality: string | undefined = undefined
      try {
        const { getUserNationalityCode } = await import('@/config/userProfile')
        const { PRESET_COUNTRIES } = await import('@/constants/countries')
        const nationalityCode = getUserNationalityCode()
        if (nationalityCode) {
          const countryInfo = PRESET_COUNTRIES[nationalityCode as keyof typeof PRESET_COUNTRIES]
          if (countryInfo) {
            userNationality = countryInfo.name
            console.log('🌍 用户国籍（用于显示格式）:', userNationality)
          }
        }
      } catch (err) {
        console.warn('⚠️ 获取用户国籍失败', err)
      }
      
      // 获取用户永久居民身份（如绿卡，用于签证判断）
      let userPermanentResidency: string | undefined = undefined
      try {
        const { getUserPermanentResidencyCode } = await import('@/config/userProfile')
        const { PRESET_COUNTRIES } = await import('@/constants/countries')
        const residencyCode = getUserPermanentResidencyCode()
        if (residencyCode) {
          const countryInfo = PRESET_COUNTRIES[residencyCode as keyof typeof PRESET_COUNTRIES]
          if (countryInfo) {
            userPermanentResidency = countryInfo.name
            console.log('🪪 用户永久居民身份（用于签证判断）:', userPermanentResidency)
          }
        }
      } catch (err) {
        console.warn('⚠️ 获取用户永久居民身份失败', err)
      }
      
      // 获取用户已持有的签证
      let heldVisas: string[] = []
      try {
        const { getHeldVisas } = await import('@/config/userProfile')
        heldVisas = getHeldVisas()
        if (heldVisas.length > 0) {
          console.log('🎫 用户已持有签证（国家代码）:', heldVisas.join('、'))
        }
      } catch (err) {
        console.warn('⚠️ 获取已持有签证失败', err)
      }
      
      // 获取签证信息（用于AI提示词）
      let visaFreeDestinations: string[] = []
      let visaInfoSummary: string | null = null
      try {
        const { getVisaFreeDestinations, getVisaDescription } = await import('@/config/visa')
        const { getUserNationalityCode, getUserPermanentResidencyCode } = await import('@/config/userProfile')
        const { PRESET_COUNTRIES } = await import('@/constants/countries')
        
        const nationalityCode = getUserNationalityCode()
        const residencyCode = getUserPermanentResidencyCode()
        
        visaFreeDestinations = getVisaFreeDestinations(nationalityCode, residencyCode)
        
        // 如果有选定的目的地，获取该目的地的签证信息
        if (selectedDestination) {
          // 尝试从目的地字符串中提取国家代码
          const destCountryInfo = Object.values(PRESET_COUNTRIES).find(country => 
            selectedDestination.includes(country.name) || 
            selectedDestination.includes(country.code)
          )
          if (destCountryInfo) {
            visaInfoSummary = getVisaDescription(destCountryInfo.code, nationalityCode, residencyCode)
          }
        }
        
        console.log('🪪 免签/落地签目的地数量:', visaFreeDestinations.length)
        if (visaInfoSummary) {
          console.log('🪪 目的地签证信息:', visaInfoSummary)
        }
      } catch (err) {
        console.warn('⚠️ 获取签证信息失败', err)
      }
      
      console.log('心理旅程模式：开始生成...', personalityProfile)
      pushGenerationLog('🧠 正在分析人格问卷与心理画像...')
      console.log('📍 用户选择的目的地:', selectedDestination || '未选择')
      console.log('📍 推荐范围：', userCountry ? `优先${userCountry}国内或附近地区` : '全球（未检测到地理位置）')
      console.log('🌍 显示格式：', userNationality ? `基于${userNationality}国籍的文化偏好` : '使用默认格式')
      console.log('🪪 签证考虑：', heldVisas.length > 0 ? `已持有签证：${heldVisas.join('、')}（最高优先级）` : userPermanentResidency ? `考虑${userPermanentResidency}永久居民身份的签证便利` : userNationality ? `基于${userNationality}国籍的签证要求` : '未设置')
      
      // 传递用户选择的目的地、国籍、永久居民身份、已持有签证和签证信息
      const inspirationData = await generateJourneyAPI(personalityProfile, currentLanguage, userCountry, selectedDestination, userNationality, userPermanentResidency, heldVisas, visaFreeDestinations, visaInfoSummary)
      console.log('心理旅程模式：生成完成', inspirationData)
      pushGenerationLog('✅ 已获取 AI 生成的旅程数据，正在整理...')
      console.log('📦 返回的数据包含:', {
        locations: inspirationData.locations?.length || 0,
        recommendedDestinations: inspirationData.recommendedDestinations?.length || 0,
        hasTitle: !!inspirationData.title,
        hasAiMessage: !!inspirationData.aiMessage
      })
      
      // 补充国家信息（如果需要）
      if (inspirationData.locations) {
        const { detectCountryFromLocale, buildLocationCountries } = await import('@/utils/countryGuess')
        const locale = i18n.global.locale.value || (navigator?.language as string) || 'zh-CN'
        const currentCountry = detectCountryFromLocale(locale)
        const locationCountries = buildLocationCountries(inspirationData.locations)

        if (inspirationData.locationDetails && locationCountries) {
          Object.keys(inspirationData.locationDetails).forEach((loc) => {
            const detail = (inspirationData.locationDetails as any)[loc]
            const country = locationCountries[loc]
            if (detail && country && !detail.country) {
              detail.country = country
            }
          })
        }

        inspirationData.currentCountry = inspirationData.currentCountry || currentCountry
        inspirationData.locationCountries = inspirationData.locationCountries || locationCountries
      }
      
      // 确保数据正确设置
      console.log('📝 准备设置 inspirationData，locations数量:', inspirationData.locations?.length || 0)
      pushGenerationLog('🗂️ 数据整理完成，正在更新界面...')
      setInspirationData(inspirationData)
      setCurrentMode('inspiration')
      
      // 验证数据是否设置成功
      const currentData = inspirationData.value
      console.log('✅ 数据已设置到 store')
      console.log('✅ 验证：当前 inspirationData.locations:', currentData?.locations?.length || 0)
      console.log('✅ 验证：当前 inspirationData.title:', currentData?.title)
    } catch (err) {
      console.error('生成心理旅程失败:', err)
      pushGenerationLog('❌ 生成心理旅程失败', 'error')
      setError('生成心理旅程失败，请重试')
    } finally {
      setLoading(false)
      pushGenerationLog('🏁 生成流程结束')
    }
  }

  // 生成灵感内容
  const generateInspiration = async (input: string) => {
    clearGenerationLogs()
    pushGenerationLog('🚀 开始生成灵感旅程...')
    setLoading(true)
    setError(null)
    
    try {
        const { detectInspirationIntent, generateInspirationJourney } = await import('@/services/deepseekAPI')
      const currentLanguage = i18n.global.locale.value || 'zh-CN'
      
      // 获取用户所在国家（用于推荐目的地）
      let userCountry: string | undefined = undefined
      try {
        const { getUserLocationCode } = await import('@/config/userProfile')
        const locationCode = getUserLocationCode()
        if (locationCode) {
          userCountry = locationCode
          console.log('📍 用户所在国家（用于推荐目的地）:', userCountry)
        }
      } catch (err) {
        console.warn('⚠️ 获取用户所在国家失败', err)
      }
      
      // 获取用户国籍（用于显示格式）
      let userNationality: string | undefined = undefined
      try {
        const { getUserNationalityCode } = await import('@/config/userProfile')
        const { PRESET_COUNTRIES } = await import('@/constants/countries')
        const nationalityCode = getUserNationalityCode()
        if (nationalityCode) {
          const countryInfo = PRESET_COUNTRIES[nationalityCode as keyof typeof PRESET_COUNTRIES]
          if (countryInfo) {
            userNationality = countryInfo.name
            console.log('🌍 用户国籍（用于显示格式）:', userNationality)
          }
        }
      } catch (err) {
        console.warn('⚠️ 获取用户国籍失败', err)
      }
      
      // 获取用户永久居民身份（用于签证判断）
      let userPermanentResidency: string | undefined = undefined
      try {
        const { getUserPermanentResidencyCode } = await import('@/config/userProfile')
        const { PRESET_COUNTRIES } = await import('@/constants/countries')
        const residencyCode = getUserPermanentResidencyCode()
        if (residencyCode) {
          const countryInfo = PRESET_COUNTRIES[residencyCode as keyof typeof PRESET_COUNTRIES]
          if (countryInfo) {
            userPermanentResidency = countryInfo.name
            console.log('🪪 用户永久居民身份（用于签证判断）:', userPermanentResidency)
          }
        }
      } catch (err) {
        console.warn('⚠️ 获取用户永久居民身份失败', err)
      }
      
      // 获取用户已持有的签证
      let heldVisas: string[] = []
      try {
        const { getHeldVisas } = await import('@/config/userProfile')
        heldVisas = getHeldVisas()
        if (heldVisas.length > 0) {
          console.log('🎫 用户已持有签证（国家代码）:', heldVisas.join('、'))
        }
      } catch (err) {
        console.warn('⚠️ 获取已持有签证失败', err)
      }
      
      // 获取签证信息（用于AI提示词）
      let visaFreeDestinations: string[] = []
      let visaInfoSummary: string | null = null
      try {
        const { getVisaFreeDestinations, getVisaDescription } = await import('@/config/visa')
        const { getUserNationalityCode, getUserPermanentResidencyCode } = await import('@/config/userProfile')
        const { PRESET_COUNTRIES } = await import('@/constants/countries')
        
        const nationalityCode = getUserNationalityCode()
        const residencyCode = getUserPermanentResidencyCode()
        
        visaFreeDestinations = getVisaFreeDestinations(nationalityCode, residencyCode)
        
        // 尝试从输入中提取目的地国家
        const destCountryInfo = Object.values(PRESET_COUNTRIES).find(country => 
          input.includes(country.name)
        )
        if (destCountryInfo) {
          visaInfoSummary = getVisaDescription(destCountryInfo.code, nationalityCode, residencyCode)
        }
        
        console.log('🪪 免签/落地签目的地数量:', visaFreeDestinations.length)
        if (visaInfoSummary) {
          console.log('🪪 目的地签证信息:', visaInfoSummary)
        }
      } catch (err) {
        console.warn('⚠️ 获取签证信息失败', err)
      }
      
      // 第一步：意图识别
      console.log('灵感模式：开始意图识别...', input)
      const intent = await detectInspirationIntent(input, currentLanguage)
      console.log('灵感模式：识别到的意图', intent)
      pushGenerationLog(`🧭 检测到旅行意图：${intent.intentType || '未知'}`)
      
      // 第二步：生成行程计划（调用 AI）
      console.log('⏳ 开始调用 generateInspirationJourney，这可能需要 1-3 分钟...')
      console.log('📝 用户输入:', input)
      pushGenerationLog('📡 正在生成灵感旅程细节（可能需要 1-3 分钟）...')
      const inspirationData = await generateInspirationJourney(input, currentLanguage, userCountry, undefined, userNationality, userPermanentResidency, heldVisas, visaFreeDestinations, visaInfoSummary)
      console.log('✅ 灵感模式：生成的行程计划', inspirationData)
      pushGenerationLog('✅ 灵感旅程生成完成，正在整理体验亮点...')
      
      // 新的数据结构是行程计划格式（包含days数组）
      // 如果包含locations字段，则补齐国家信息（向后兼容）
      if (inspirationData.locations) {
        const { detectCountryFromLocale, buildLocationCountries } = await import('@/utils/countryGuess')
        const locale = i18n.global.locale.value || (navigator?.language as string) || 'zh-CN'
        const currentCountry = detectCountryFromLocale(locale)
        const locationCountries = buildLocationCountries(inspirationData.locations)

        // 为 locationDetails 注入 country 字段（如果可推断）
        if (inspirationData.locationDetails && locationCountries) {
          Object.keys(inspirationData.locationDetails).forEach((loc) => {
            const detail = (inspirationData.locationDetails as any)[loc]
            const country = locationCountries[loc]
            if (detail && country && !detail.country) {
              detail.country = country
            }
          })
        }

        inspirationData.currentCountry = inspirationData.currentCountry || currentCountry
        inspirationData.locationCountries = inspirationData.locationCountries || locationCountries
      }
      
      setInspirationData(inspirationData)
      pushGenerationLog('🗂️ 数据整理完成，正在更新界面...')
      setCurrentMode('inspiration')
      
    } catch (err) {
      console.error('生成灵感内容失败，尝试使用本地灵感库回退:', err)
      pushGenerationLog('⚠️ 生成失败，尝试使用本地灵感库回退', 'warn')
      try {
        // 使用本地灵感库作为回退方案
        const suggestions = await getLocalInspirationDestinations()
        const fallback = suggestions[0]?.name
        if (fallback) {
          const localData = buildInspirationFromLocal(fallback)
          setInspirationData(localData)
          setCurrentMode('inspiration')
          pushGenerationLog('✅ 已加载本地灵感库的备用推荐')
        } else {
          setError('生成灵感内容失败，请重试')
        }
      } catch (e) {
        setError('生成灵感内容失败，请重试')
      }
    } finally {
      setLoading(false)
      pushGenerationLog('🏁 生成流程结束')
    }
  }

  // 提交反馈
  const submitFeedback = async (feedback: string, rating: number) => {
    try {
      const feedbackData: any = {
        feedback,
        mode: currentMode.value || 'planner',
        timestamp: new Date().toISOString()
      }
      
      await emotionalTravelAPI.submitFeedback(feedbackData as any)
      console.log('反馈提交成功')
    } catch (err) {
      console.error('反馈提交失败:', err)
      // 反馈失败不影响用户体验，只记录错误
    }
  }

  // 优化 Planner 行程
  const optimizePlannerItinerary = async (optimizationType: 'time' | 'cost' | 'route') => {
    if (!plannerItinerary.value) {
      throw new Error('没有可优化的行程')
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const optimizedItinerary = await plannerAPI.optimizeItinerary(plannerItinerary.value, optimizationType)
      plannerItinerary.value = optimizedItinerary
      console.log('行程优化完成:', optimizedItinerary)
    } catch (error) {
      console.error('优化行程失败:', error)
      setError('行程优化失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 获取目的地信息
  const getDestinationInfo = async (destination: string) => {
    try {
      return await plannerAPI.getDestinationInfo(destination)
    } catch (error) {
      console.error('获取目的地信息失败:', error)
      return null
    }
  }

  // 重置数据
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
    loading,
    error,
    currentMode,
    
    // Actions
    setPlannerData,
    setMoodData,
    setInspirationData,
    setItineraryData,
    setCurrentMode,
    setLoading,
    setError,
    generationLogs,
    clearGenerationLogs,
    generateItinerary,
    generateInspiration,
    generatePsychologicalJourney,
    getLocalInspirationDestinations,
    submitFeedback,
    resetData,
    optimizePlannerItinerary,
    getDestinationInfo
  }
})

// 辅助函数：根据心情获取偏好
function getPreferencesByMood(mood: string): string[] {
  const moodPreferences: { [key: string]: string[] } = {
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

// 辅助函数：将API响应转换为行程数据
function convertAPIResponseToItineraryData(apiData: any, mode: 'planner' | 'seeker'): ItineraryData {
  return {
    destination: apiData.recommendations?.[0]?.destination || '未知目的地',
    duration: apiData.preferences?.duration || 5,
    budget: apiData.preferences?.budget || 'comfort',
    preferences: [],
    travelStyle: apiData.rhythmAdjustment?.pattern_name || 'moderate',
    itinerary: generateMockItinerary(apiData.recommendations?.[0]?.destination || '未知目的地'),
    recommendations: {
      accommodation: '推荐当地特色住宿',
      transportation: '建议使用当地交通工具',
      food: '品尝当地特色美食',
      tips: '注意当地文化和习俗'
    }
  }
}

// 辅助函数：生成模拟行程
function generateMockItinerary(destination: string) {
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

// 生成灵感卡片
function generateInspirationCard(input: string): InspirationData {
  // 简单的关键词匹配逻辑
  const lowerInput = input.toLowerCase()
  
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
  
  // 默认推荐
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