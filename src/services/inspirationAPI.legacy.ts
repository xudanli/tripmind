/**
 * 灵感模式 API 遗留函数
 * 这些函数暂时保留以保持向后兼容，后续会逐步迁移到新结构
 */

import { askDeepSeek } from '@/utils/inspirationCore'
import { logger } from '@/utils/inspirationCore'
import { pickLang, buildDestinationConstraint } from '@/utils/inspirationCore'
import { parseJSONSafe, normalizeRecommendations, fallbackRecommendations } from '@/utils/inspirationCore'
import { generateInspirationJourney } from '@/apis/inspiration'

// ==================== Persona Voice Bank ====================

export const personaVoiceBank = {
  urban_creation: [
    '光在街角停了一下，好像也在等你。',
    '城市并不喧闹，只是每个人都在讲自己的故事。',
    '你拍下的不只是影像，而是一种时间的呼吸。',
    '观察是一种温柔的叛逆。',
    '今天的天空有点脆弱，适合拍一点柔软的东西。',
    '角落的阴影，其实比阳光更有情绪。',
    '每一栋建筑都在用沉默表达节奏。',
    '别急着构图，先感受光从云层里滑过的速度。',
    '你走的路，正被你重新定义。',
    '世界是光与线条的合作。'
  ],
  emotional_healing: [
    '今天就走慢一点吧，风会为你留路。',
    '你不需要一直勇敢，也可以只做自己。',
    '有时候，旅行不是逃离，而是靠近。',
    '那段路难走，是因为你在长大。',
    '天气阴也没关系，你的心还亮着。',
    '世界没在催你，时间也在等你。',
    '泪水是心在呼吸的方式。',
    '放下不等于忘记，而是轻一点。',
    '旅程里最重要的目的地，其实是"当下"。',
    '别怕安静，它其实是疗愈的入口。'
  ],
  extreme_exploration: [
    '再一步，你就能看到别人没看到的风景。',
    '勇气不是不怕，而是依然出发。',
    '汗水是成就的语言。',
    '风在你身后，你在挑战极限。',
    '不要犹豫，山在等你。',
    '呼吸是节奏，节奏是力量。',
    '你不是在逃避，而是在超越。',
    '每次跌倒，地面都在提醒你还活着。',
    '胜利其实只属于坚持的人。',
    '今天不完美，但你依然在成长。'
  ],
  cultural_exchange: [
    '每个摊主都有一本小说，只不过他们在卖香料。',
    '听懂一种语言，不如听懂一种生活。',
    '一杯茶的温度，就是文化的节奏。',
    '你遇到的人，可能就是这次旅程的意义。',
    '不同的问候语，其实都在说"欢迎回来"。',
    '照片拍下的是瞬间，故事记录的是心。',
    '你会发现，笑容是最通用的语言。',
    '有时候，最美的风景是一个眼神。',
    '一场对话就能改变一段旅行。',
    '今天遇见的陌生人，也许是命运写的伏笔。'
  ]
}

/**
 * 根据人格获取随机语料
 */
export function getPersonaVoice(personaType: string): string {
  const voices = personaVoiceBank[personaType as keyof typeof personaVoiceBank]
  if (!voices || voices.length === 0) {
    return ''
  }
  return voices[Math.floor(Math.random() * voices.length)] || ''
}

/**
 * 动态人格切换逻辑（根据用户情绪和语义）
 */
export function switchPersonaBasedOnEmotion(
  userInput: string,
  detectedEmotion?: string
): string {
  const input = userInput.toLowerCase()
  
  // 疗愈型信号
  if (input.includes('一个人') || input.includes('慢') || input.includes('静') || 
      input.includes('心累') || input.includes('放下') || input.includes('孤独') ||
      input.includes('想静静') || input.includes('放空') || detectedEmotion === 'sad') {
    return 'emotional_healing'
  }
  
  // 摄影创作型信号
  if (input.includes('拍') || input.includes('光') || input.includes('构图') || 
      input.includes('建筑') || input.includes('记录') || input.includes('镜头')) {
    return 'urban_creation'
  }
  
  // 极限探索型信号
  if (input.includes('挑战') || input.includes('第一次') || input.includes('想试试') ||
      input.includes('突破') || input.includes('冲浪') || input.includes('攀岩') ||
      input.includes('山')) {
    return 'extreme_exploration'
  }
  
  // 人文交流型信号
  if (input.includes('认识人') || input.includes('故事') || input.includes('文化') ||
      input.includes('市集') || input.includes('工坊') || input.includes('当地人')) {
    return 'cultural_exchange'
  }
  
  // 水下摄影信号
  if (input.includes('海底') || input.includes('水') || input.includes('潜水') ||
      input.includes('水下')) {
    return 'photography_exploration'
  }
  
  // 自然探索信号
  if (input.includes('风') || input.includes('徒步') || input.includes('探索') ||
      input.includes('自然')) {
    return 'nature_discovery'
  }
  
  // 默认：根据情绪
  if (detectedEmotion === 'peaceful' || detectedEmotion === 'calm') {
    return 'mind_healing'
  }
  
  return 'urban_creation' // 默认返回城市创作型
}

/**
 * 基于AI人格生成响应（根据用户情绪和场景）
 */
export async function generatePersonaResponse(
  persona: any,
  userEmotion: string,
  context: string,
  language: string = 'zh-CN'
): Promise<string> {
  const isEnglish = language.startsWith('en')
  
  const systemPrompt = isEnglish
    ? `You are ${persona.identity}. You are accompanying the user on a travel experience.

Your tone should be: ${persona.toneProfile.style}
Use these keywords in your response: ${persona.toneProfile.keywords.join(', ')}

Current user emotion: ${userEmotion}
Context: ${context}

Generate a warm, thoughtful response that reflects ${persona.toneProfile.style} style.

Keep it short (1-2 sentences).`
    : `你是${persona.identity}。你正在陪伴用户进行旅行体验。

你的语气应当是：${persona.toneProfile.style}
在你的回应中使用这些关键词：${persona.toneProfile.keywords.join('、')}

当前用户情绪：${userEmotion}
场景：${context}

生成一句有温度的回应，体现${persona.toneProfile.style}的风格。

保持简短（1-2句话）。`

  try {
    const response = await askDeepSeek(systemPrompt, context, {
      temperature: persona.toneProfile.temperature,
      max_tokens: 200
    })
    return response || ''
  } catch (error) {
    logger.error('❌ Failed to generate persona response:', error as Error)
    return ''
  }
}

/**
 * 基于人格问卷生成双轨心理旅程
 * 已重构为使用 PersonaService，保持向后兼容
 */
export async function generatePsychologicalJourney(
  personalityProfile: {
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
  },
  language: string = 'zh-CN',
  userCountry?: string,
  selectedDestination?: string,
  userNationality?: string,
  userPermanentResidency?: string,
  heldVisas?: string[],
  visaFreeDestinations?: string[],
  visaInfoSummary?: string | null
): Promise<any> {
  const { createPersonaService } = await import('@/services/personaService')
  const personaService = createPersonaService()
  
  // 1. 匹配模板
  const { template, vector } = await personaService.matchTemplate(personalityProfile)
  
  // 2. 构建提示词
  const psychologicalPrompt = personaService.buildPsychologicalPrompt(
    personalityProfile,
    template,
    language,
    selectedDestination
  )
  
  // 3. 生成目的地推荐（如果用户未选择）
  let recommendedDestinations: Array<{ name: string; country: string; reason: string; reasoning?: string; description?: string }> = []
  
  if (!selectedDestination) {
    const ctx: TravelContext = {
      language,
      userCountry,
      userNationality,
      userPermanentResidency,
      heldVisas: heldVisas || [],
      visaFreeDestinations: visaFreeDestinations || [],
      visaInfoSummary: visaInfoSummary || undefined,
      transportPreference: 'public_transit_and_walking'
    }
    recommendedDestinations = await personaService.generateDestinationRecommendations(
      personalityProfile,
      template,
      language,
      ctx
    )
  }
  
  // 4. 如果用户选择了目的地，生成完整行程
  let itineraryData = null
  let dualTrackData = null
  
  if (selectedDestination) {
    try {
      itineraryData = await generateInspirationJourney(
        psychologicalPrompt,
        language,
        userCountry,
        selectedDestination,
        userNationality,
        userPermanentResidency,
        heldVisas,
        visaFreeDestinations,
        visaInfoSummary
      )
      
      dualTrackData = await personaService.generateDualTrackData(
        template,
        vector,
        personalityProfile,
        itineraryData
      )
    } catch (error) {
      logger.warn('⚠️ 行程生成失败', error)
    }
  }
  
  // 5. 构建返回结果
  return personaService.buildResult(
    personalityProfile,
    template,
    recommendedDestinations,
    itineraryData,
    dualTrackData,
    language
  )
}

