import { API_CONFIG } from '@/config/api'

// API 基础配置
const API_BASE_URL = API_CONFIG.BASE_URL

// API 响应类型定义
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

// 情感识别相关类型
export interface EmotionDetectionRequest {
  userInput: string
}

export interface EmotionDetectionResponse {
  emotion: string
  intensity: number
  metadata: {
    keywords: string[]
    color: string
    rhythm: string
    preference: string
  }
  confidence: number
}

// 情绪化叙述相关类型
export interface NarrativeRequest {
  emotion: string
  timeContext: string
  activity: string
  location: string
}

export interface NarrativeResponse {
  narrative: string
  emotion: string
  timeContext: string
  activity: string
  location: string
}

// 节奏调整相关类型
export interface RhythmAdjustmentRequest {
  emotion: string
  basePlan: {
    duration: number
    budget: string
  }
}

export interface RhythmAdjustmentResponse {
  pattern_name: string
  pace_type: string
  activities_per_day: number
  transition_time_minutes: number
  rest_periods: number
  description: string
  emotional_suitability: string[]
}

// 目的地匹配相关类型
export interface DestinationMatch {
  destination_id: number
  match_score: number
  emotional_tags: string[]
  destination_name: string
}

// 旅行计划生成相关类型
export interface TravelPlanRequest {
  userInput: string
  preferences: {
    duration: number
    budget: string
    basePlan?: {
      destinations: string[]
    }
  }
}

export interface TravelPlanResponse {
  emotionAnalysis: {
    emotion: string
    intensity: number
  }
  rhythmAdjustment: {
    pattern_name: string
    activities_per_day: number
  }
  narrative: string
  recommendations: Array<{
    destination: string
    activities: string[]
  }>
}

// 反馈学习相关类型
export interface FeedbackRequest {
  sessionId: string
  userFeedback: number
  originalInput: string
  aiResponse: string
}

export interface FeedbackResponse {
  feedback_score: number
  emotional_alignment_score: number
  learning_insight: string
}

// API 服务类
class EmotionalTravelAPI {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  // 通用请求方法
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        // 添加认证头等
        // 'Authorization': `Bearer ${token}`,
      },
    }

    const mergedOptions = { ...defaultOptions, ...options }

    try {
      const response = await fetch(url, mergedOptions)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // 1. 情感识别
  async detectEmotion(request: EmotionDetectionRequest): Promise<ApiResponse<EmotionDetectionResponse>> {
    return this.request<EmotionDetectionResponse>(API_CONFIG.ENDPOINTS.DETECT_EMOTION, {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // 2. 获取支持的情感状态
  async getEmotionalStates(): Promise<ApiResponse<string[]>> {
    return this.request<string[]>(API_CONFIG.ENDPOINTS.EMOTIONAL_STATES)
  }

  // 3. 生成情绪化叙述
  async generateNarrative(request: NarrativeRequest): Promise<ApiResponse<NarrativeResponse>> {
    return this.request<NarrativeResponse>(API_CONFIG.ENDPOINTS.GENERATE_NARRATIVE, {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // 4. 获取叙述模板示例
  async getNarrativeExamples(): Promise<ApiResponse<Record<string, Record<string, string>>>> {
    return this.request<Record<string, Record<string, string>>>(API_CONFIG.ENDPOINTS.NARRATIVE_EXAMPLES)
  }

  // 5. 调整旅行节奏
  async adjustRhythm(request: RhythmAdjustmentRequest): Promise<ApiResponse<RhythmAdjustmentResponse>> {
    return this.request<RhythmAdjustmentResponse>(API_CONFIG.ENDPOINTS.ADJUST_RHYTHM, {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // 6. 匹配目的地
  async matchDestinations(emotion: string, intensity: number): Promise<ApiResponse<DestinationMatch[]>> {
    const params = new URLSearchParams({
      emotion,
      intensity: intensity.toString(),
    })
    
    return this.request<DestinationMatch[]>(`${API_CONFIG.ENDPOINTS.MATCH_DESTINATIONS}?${params}`)
  }

  // 7. 生成情感旅行计划
  async generateTravelPlan(request: TravelPlanRequest): Promise<ApiResponse<TravelPlanResponse>> {
    return this.request<TravelPlanResponse>(API_CONFIG.ENDPOINTS.GENERATE_PLAN, {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // 8. 提交反馈学习
  async submitFeedback(request: FeedbackRequest): Promise<ApiResponse<FeedbackResponse>> {
    return this.request<FeedbackResponse>(API_CONFIG.ENDPOINTS.SUBMIT_FEEDBACK, {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // 9. 获取情感色彩调色板
  async getEmotionColors(): Promise<ApiResponse<Record<string, string>>> {
    return this.request<Record<string, string>>(API_CONFIG.ENDPOINTS.EMOTION_COLORS)
  }

  // 10. 获取时间感知权重配置
  async getTemporalPerception(): Promise<ApiResponse<Record<string, number>>> {
    return this.request<Record<string, number>>(API_CONFIG.ENDPOINTS.TEMPORAL_PERCEPTION)
  }
}

// 创建API实例
export const emotionalTravelAPI = new EmotionalTravelAPI()

// 导出类型和API实例
export default emotionalTravelAPI
