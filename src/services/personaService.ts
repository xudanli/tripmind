/**
 * 人格服务
 * 负责心理旅程模板匹配、目的地推荐、双轨数据生成等
 */

import { DeepSeekClient } from '@/llm/deepseekClient'
import { LoggingAdapter } from '@/utils/inspiration/core/logger'
import { JSONProcessor } from '@/utils/inspiration/core/jsonProcessor'
import { pickLang, buildDestinationConstraint } from '@/utils/inspirationCore'
import { parseJSONSafe, normalizeRecommendations, fallbackRecommendations } from '@/utils/inspirationCore'
import { generateInspirationJourney } from '@/apis/inspiration'
import type { TravelContext } from '@/types/travel'

// ==================== 类型定义 ====================

export interface PersonalityProfile {
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

export interface RecommendedDestination {
  name: string
  country: string
  reason: string
  reasoning?: string
  description?: string
}

export interface PersonaServiceDeps {
  llm: DeepSeekClient
  jsonParser: typeof JSONProcessor
  logger: LoggingAdapter
}

// ==================== 人格服务 ====================

export class PersonaService {
  constructor(private deps: PersonaServiceDeps) {}

  /**
   * 匹配心理旅程模板
   */
  async matchTemplate(profile: PersonalityProfile): Promise<{
    template: any
    vector: any
    matchResult: any
  }> {
    const { 
      calculatePersonalityVector, 
      matchPsychologicalTemplate
    } = await import('@/utils/psychologicalTemplates')
    
    const vector = calculatePersonalityVector(profile)
    const matchResult = matchPsychologicalTemplate(vector, {
      motivation_detail: profile.motivation_detail,
      desired_emotion: profile.desired_emotion,
      activity_density: profile.activity_density,
      social_intensity: profile.social_intensity,
      post_journey_goal: profile.post_journey_goal
    })
    
    return {
      template: matchResult.template,
      vector,
      matchResult
    }
  }

  /**
   * 构建心理旅程提示词
   */
  buildPsychologicalPrompt(
    profile: PersonalityProfile,
    template: any,
    language: string,
    selectedDestination?: string
  ): string {
    const isEnglish = language.startsWith('en')
    const destinationConstraint = buildDestinationConstraint(selectedDestination, language, 'important')
    
    const foodPreferenceText = profile.food_preference 
      ? (isEnglish ? `\n- Food Experience: ${profile.food_preference}` : `\n- 美食体验：${profile.food_preference}`)
      : ''
    
    return isEnglish
      ? `Generate a ${template.templateName} journey based on the following psychological profile:
- Motivation: ${profile.motivation} (seeking: ${profile.motivation_detail})
- Emotion: From ${profile.dominant_emotion} to ${profile.desired_emotion}
- Rhythm: ${profile.travel_rhythm} with ${profile.activity_density} activities
- Social: ${profile.social_preference} (intensity: ${profile.social_intensity}/5)
- Need: ${profile.cognitive_need} → ${profile.post_journey_goal}${foodPreferenceText}

Psychological Flow: ${template.psychologicalFlow.join(' → ')}
Symbolic Elements: ${template.symbolicElements.join(', ')}
Core Insight: ${template.coreInsight}
Recommended Rhythm: ${template.recommendedRhythm}
Social Mode: ${template.socialMode}${destinationConstraint}

IMPORTANT: Based on the food preference "${profile.food_preference || 'local cuisine experience'}", ensure the itinerary includes appropriate food and dining experiences. Include meal activities (type: "meal") that match the traveler's food preference level.${foodPreferenceText ? `\n- For "${profile.food_preference}", plan meals accordingly:` : ''}${profile.food_preference === '深度美食探索' || profile.food_preference === 'Deep Food Exploration' ? ' Include multiple meal experiences daily, from street food to fine dining, cooking classes, food markets, and local specialty restaurants.' : ''}${profile.food_preference === '当地特色体验' || profile.food_preference === 'Local Specialty Experience' ? ' Include 1-2 meal experiences per day focusing on authentic local cuisine and traditional dishes.' : ''}${profile.food_preference === '偶尔尝试' || profile.food_preference === 'Occasional Try' ? ' Include occasional meal experiences (every other day or so) with local specialties.' : ''}${profile.food_preference === '简单便捷' || profile.food_preference === 'Simple & Convenient' ? ' Include simple, convenient meal options without extensive food-focused activities.' : ''}

Create a travel itinerary that embodies this psychological journey.`
      : `基于以下心理画像生成${template.templateName}旅程：
- 动机：${profile.motivation}（寻求：${profile.motivation_detail}）
- 情绪：从 ${profile.dominant_emotion} 到 ${profile.desired_emotion}
- 节奏：${profile.travel_rhythm}，活动密度：${profile.activity_density}
- 社交：${profile.social_preference}（强度：${profile.social_intensity}/5）
- 需求：${profile.cognitive_need} → ${profile.post_journey_goal}${foodPreferenceText}

心理流程：${template.psychologicalFlow.join(' → ')}
象征元素：${template.symbolicElements.join('、')}
核心洞察：${template.coreInsight}
推荐节奏：${template.recommendedRhythm}
社交模式：${template.socialMode}${destinationConstraint}

重要提示：根据美食偏好"${profile.food_preference || '当地特色体验'}"，确保行程包含相应的美食和餐饮体验。包含符合旅行者美食偏好水平的餐饮活动（type: "meal"）。${foodPreferenceText ? `\n- 对于"${profile.food_preference}"，请相应安排：` : ''}${profile.food_preference === '深度美食探索' ? ' 每天包含多次餐饮体验，从街头小吃到精致餐厅、烹饪课程、美食市场、当地特色餐厅等。' : ''}${profile.food_preference === '当地特色体验' ? ' 每天包含1-2次餐饮体验，专注于地道当地美食和传统菜肴。' : ''}${profile.food_preference === '偶尔尝试' ? ' 偶尔包含餐饮体验（每隔一天左右），尝试当地特色。' : ''}${profile.food_preference === '简单便捷' ? ' 包含简单便捷的餐饮选项，无需大量美食活动。' : ''}

创建体现这一心理旅程的旅行行程。`
  }

  /**
   * 生成目的地推荐
   */
  async generateDestinationRecommendations(
    profile: PersonalityProfile,
    template: any,
    language: string,
    ctx: TravelContext
  ): Promise<RecommendedDestination[]> {
    const { logger, llm, jsonParser } = this.deps
    const isEnglish = language.startsWith('en')
    const lang = pickLang(language)

    try {
      // 构建推荐提示词（简化版，完整版见 git 历史）
      const recommendationPrompt = isEnglish
        ? `Analyze the traveler's psychological profile and recommend 8-12 destinations that match their needs. Return JSON array with name, country, reason, reasoning fields.`
        : `分析用户的心理画像，推荐8-12个匹配的目的地。返回JSON数组，包含name、country、reason、reasoning字段。`

      const systemMsg = lang.onlyJson
      const response = await llm.jsonFromLLM(systemMsg, recommendationPrompt, {
        temperature: 0.8,
        max_tokens: 4000
      })

      // jsonFromLLM 返回的是已解析的对象，不需要再次解析
      // 如果 response 是数组，直接使用；否则尝试解析
      let parsed: any[] | null = null
      if (Array.isArray(response)) {
        parsed = response
      } else if (typeof response === 'string') {
        parsed = jsonParser.parseSafe<any[]>(response, {
          verbose: true,
          allowPartial: true
        })
      } else {
        // 如果 response 是对象，尝试提取数组
        parsed = null
      }

      if (parsed && Array.isArray(parsed)) {
        const recommendations = normalizeRecommendations(parsed)
        logger.log(`✅ 生成了 ${recommendations.length} 个目的地推荐`)
        return recommendations
      }

      logger.warn('⚠️ AI返回的不是数组格式，使用默认推荐')
      return fallbackRecommendations(language)
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e))
      logger.error('❌ AI生成目的地推荐失败', err)
      return fallbackRecommendations(language)
    }
  }

  /**
   * 生成双轨 JSON 数据
   */
  async generateDualTrackData(
    template: any,
    vector: any,
    profile: PersonalityProfile,
    itineraryData?: any
  ): Promise<any> {
    const { generateDualTrackJSON } = await import('@/utils/psychologicalTemplates')
    
    return await generateDualTrackJSON(
      template,
      vector,
      {
        motivation_detail: profile.motivation_detail,
        desired_emotion: profile.desired_emotion,
        activity_density: profile.activity_density,
        social_intensity: profile.social_intensity,
        post_journey_goal: profile.post_journey_goal
      },
      itineraryData
    )
  }

  /**
   * 构建返回结果
   */
  buildResult(
    profile: PersonalityProfile,
    template: any,
    recommendedDestinations: RecommendedDestination[],
    itineraryData?: any,
    dualTrackData?: any,
    language: string = 'zh-CN'
  ): any {
    const isEnglish = language.startsWith('en')

    const result: any = {
      personaProfile: dualTrackData?.personaProfile || {
        type: template.templateName,
        motivation: profile.motivation,
        motivation_detail: profile.motivation_detail,
        dominantEmotion: profile.dominant_emotion,
        desiredEmotion: profile.desired_emotion,
        travelRhythm: profile.travel_rhythm,
        activityDensity: profile.activity_density,
        socialPreference: profile.social_preference,
        socialIntensity: profile.social_intensity,
        cognitiveNeed: profile.cognitive_need,
        postJourneyGoal: profile.post_journey_goal,
        foodPreference: profile.food_preference || '当地特色体验'
      },
      journeyDesign: dualTrackData?.journeyDesign,
      recommendedDestinations: recommendedDestinations,
      locations: recommendedDestinations.map(d => d.name),
      locationDetails: recommendedDestinations.reduce((acc, dest) => {
        acc[dest.name] = {
          name: dest.name,
          country: dest.country,
          description: dest.description || dest.reason,
          reason: dest.reason,
          reasoning: dest.reasoning
        }
        return acc
      }, {} as Record<string, any>),
      title: dualTrackData?.journeyDesign?.title || `${template.templateName}旅程`,
      coreInsight: template.coreInsight,
      templateName: template.templateName,
      psychologicalFlow: template.psychologicalFlow,
      hasFullItinerary: !!itineraryData,
      aiMessage: isEnglish
        ? `I've prepared ${recommendedDestinations?.length || 0} destination recommendations for you.`
        : `我为你准备了 ${recommendedDestinations?.length || 0} 个目的地推荐。`
    }
    
    if (itineraryData && dualTrackData) {
      Object.assign(result, itineraryData)
    }
    
    return result
  }
}

// ==================== 导出函数 ====================

/**
 * 创建人格服务实例
 */
export function createPersonaService(deps?: Partial<PersonaServiceDeps>): PersonaService {
  const defaultDeps: PersonaServiceDeps = {
    llm: new DeepSeekClient(),
    jsonParser: JSONProcessor,
    logger: new LoggingAdapter(false)
  }

  return new PersonaService({ ...defaultDeps, ...deps })
}

