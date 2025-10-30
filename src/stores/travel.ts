import { defineStore } from 'pinia'
import { ref } from 'vue'
import i18n from '@/i18n'
import emotionalTravelAPI, { 
  type EmotionDetectionRequest,
  type TravelPlanRequest,
  type FeedbackRequest 
} from '@/services/emotionalTravelAPI'
import { plannerAPI, type PlannerItineraryResponse } from '@/services/plannerAPI'

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
  duration: string
  budget: string
  highlights: string[] | HighlightDetail[]
  aiMessage?: string
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
    rhythm?: string
    community?: string
  }
  postJourneyChallenge?: {
    title?: string
    description?: string
    actions?: string[]
  }
  keywords?: string[]
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
    setLoading(true)
    setError(null)
    
    try {
      let generatedData: ItineraryData

      if (mode === 'planner') {
        // 使用新的 Planner API 生成智能行程
        console.log('Planner 模式：开始生成智能行程...', plannerData.value)
        const plannerResponse = await plannerAPI.generateItinerary(plannerData.value)
        console.log('Planner 模式：AI 生成的行程', plannerResponse)
        
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
        
        // 调用情感旅行 API 生成 Seeker 行程
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

  // 生成灵感内容
  const generateInspiration = async (input: string) => {
    setLoading(true)
    setError(null)
    
    try {
        const { detectInspirationIntent, generateInspirationJourney } = await import('@/services/deepseekAPI')
      const currentLanguage = i18n.global.locale.value || 'zh-CN'
      
      // 第一步：意图识别
      console.log('灵感模式：开始意图识别...', input)
      const intent = await detectInspirationIntent(input, currentLanguage)
      console.log('灵感模式：识别到的意图', intent)
      
      // 第二步：生成灵感内容（调用 AI）
      const inspirationData = await generateInspirationJourney(input, currentLanguage)
      console.log('灵感模式：生成的内容', inspirationData)
      // 补齐国家信息（当前国家 + 每个地点的国家）
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

      const enriched = {
          ...inspirationData,
        currentCountry: inspirationData.currentCountry || currentCountry,
        locationCountries: inspirationData.locationCountries || locationCountries
      }
      
      setInspirationData(enriched)
      setCurrentMode('inspiration')
      
    } catch (err) {
      console.error('生成灵感内容失败，尝试使用本地灵感库回退:', err)
      try {
        // 使用本地灵感库作为回退方案
        const suggestions = await getLocalInspirationDestinations()
        const fallback = suggestions[0]?.name
        if (fallback) {
          const localData = buildInspirationFromLocal(fallback)
          setInspirationData(localData)
          setCurrentMode('inspiration')
        } else {
          setError('生成灵感内容失败，请重试')
        }
      } catch (e) {
        setError('生成灵感内容失败，请重试')
      }
    } finally {
      setLoading(false)
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
    generateItinerary,
    generateInspiration,
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