/**
 * 旅行相关类型定义
 */

/**
 * 用户旅行上下文
 */
export interface TravelContext {
  language: string
  userCountry?: string
  userNationality?: string
  userPermanentResidency?: string
  heldVisas?: string[]
  visaFreeDestinations?: string[]
  visaInfoSummary?: string | null
  transportPreference?: 'public_transit_and_walking' | 'driving_and_walking'
}

/**
 * 心理问卷画像
 */
export interface PsyProfile {
  motivation: string
  motivation_detail: string
  dominant_emotion: string
  desired_emotion: string
  travel_rhythm: string
  activity_density: string
  social_preference: string
  social_intensity: number
  cognitive_need: string
  post_journey_goal: string
  food_preference?: string
}

