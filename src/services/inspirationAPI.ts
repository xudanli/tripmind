/**
 * 灵感模式 API
 * 包含所有灵感模式相关的 AI 调用函数
 */

// chatWithDeepSeek 不再直接使用，统一通过 inspirationCore 的 askDeepSeek
import {
  pickLang,
  buildDestinationConstraint,
  askDeepSeek,
  parseJSONSafe,
  normalizeRecommendations,
  fallbackRecommendations,
  INTENTS,
  buildIntentOptionsPrompt,
  validateInspirationItinerary,
  buildReferenceCatalog,
  logger,
  type Recommendation
} from '@/utils/inspirationCore'
import { z } from 'zod'
import { buildHintPrompt } from '@/prompts/inspiration/hint'
import { buildDetectIntentPrompt } from '@/prompts/inspiration/intent'
import { buildJourneyPrompt, type JourneyPromptArgs } from '@/prompts/inspiration/journey'

// 从 deepseekAPI 导入类型定义
interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// Zod Schemas for validation
const IntentResultSchema = z.object({
  intentType: z.string(),
  keywords: z.array(z.string()).default([]),
  emotionTone: z.string().default('neutral'),
  description: z.string().default(''),
})

const ItinerarySchema = z.object({
  title: z.string(),
  destination: z.string(),
  duration: z.number().int().positive(),
  summary: z.string(),
  psychologicalFlow: z.array(z.string()),
  coreInsight: z.string(),
  days: z.array(z.any()),
  totalCost: z.number().nonnegative().optional(),
  recommendations: z.any().optional(),
})

export async function generateInspirationHint(
  userInput: string,
  language: string = 'zh-CN'
): Promise<string> {
  const sys = buildHintPrompt(userInput || (language.startsWith('en') ? 'I want to travel' : '我想去旅行'), language)
  
  try {
    return await askDeepSeek(sys, userInput, {
      temperature: 0.8,
      max_tokens: 200
    })
  } catch (error) {
    logger.error('❌ Failed to generate inspiration hint:', error as Error)
    return ''
  }
}

export async function detectInspirationIntent(
  userInput: string,
  language: string = 'zh-CN'
): Promise<any> {
  const isEnglish = language.startsWith('en')
  
  // 首先使用本地评分作为快速fallback和增强
  let localScore: any = null
  try {
    const { scoreIntent } = await import('@/utils/inspiration/core/intent')
    const lang: 'zh' | 'en' = isEnglish ? 'en' : 'zh'
    localScore = scoreIntent(userInput, lang)
    logger.log('🔍 本地意图评分:', JSON.stringify(localScore), 500)
  } catch (err) {
    logger.warn('⚠️ 本地意图评分失败，继续使用AI:', err)
  }
  
  const systemPrompt = buildDetectIntentPrompt(userInput, language)

  try {
    const response = await askDeepSeek(systemPrompt, userInput, {
      temperature: 0.7,
      max_tokens: 500
    })
    
    logger.log('🔍 detectInspirationIntent 原始响应:', response, 500)
    
    // 使用统一的 JSON 解析工具
    const parsed = parseJSONSafe(response)
    if (parsed) {
      // 使用 Zod 验证和规范化
      const ai = IntentResultSchema.safeParse(parsed)
      
      // 如果AI返回的意图置信度较低，使用本地评分作为补充
      if (ai.success && localScore && localScore.confidence > 0.3 && localScore.primary) {
        // 如果本地评分与AI结果不一致，且本地置信度较高，优先使用本地评分
        if (ai.data.intentType !== localScore.primary && localScore.confidence > 0.6) {
          logger.log(`⚠️ AI意图(${ai.data.intentType})与本地评分(${localScore.primary})不一致，使用本地评分`, '', 0)
          ai.data.intentType = localScore.primary
        }
        // 如果AI没有返回keywords，从本地评分中提取
        if (!ai.data.keywords || ai.data.keywords.length === 0) {
          const scores = localScore.scores || {}
          const topKeywords = Object.entries(scores)
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .slice(0, 3)
            .map(([intent]) => String(intent))
          ai.data.keywords = topKeywords
        }
      }
      
      if (ai.success) {
        logger.log('✅ 检测到的用户意图:', JSON.stringify(ai.data), 500)
        return ai.data
      }
    }
    
    // AI解析失败，使用本地评分作为fallback
    if (localScore && localScore.primary) {
      logger.log('✅ AI解析失败，使用本地评分结果:', localScore.primary, 0)
      return IntentResultSchema.parse({
        intentType: localScore.primary,
        keywords: localScore.secondary ? [localScore.primary, localScore.secondary] : [localScore.primary],
        emotionTone: isEnglish ? 'contemplative' : '专注·柔和',
        description: isEnglish 
          ? `Intent detected: ${localScore.primary} (confidence: ${Number(localScore.confidence || 0).toFixed(2)})`
          : `检测到的意图：${localScore.primary}（置信度：${Math.round(Number(localScore.confidence || 0) * 100)}%）`
      })
    }
    
    // 完全fallback，返回默认值
    return IntentResultSchema.parse({
      intentType: 'photography_exploration',
      keywords: [],
      emotionTone: isEnglish ? 'contemplative' : '专注·柔和',
      description: ''
    })
  } catch (error: any) {
    logger.error('❌ Failed to detect intent:', error)
    
    // 错误时也尝试使用本地评分
    if (localScore && localScore.primary) {
      logger.log('✅ AI调用失败，使用本地评分结果:', localScore.primary, 0)
      return IntentResultSchema.parse({
        intentType: localScore.primary,
        keywords: localScore.secondary ? [localScore.primary, localScore.secondary] : [localScore.primary],
        emotionTone: isEnglish ? 'contemplative' : '专注·柔和',
        description: isEnglish 
          ? `Intent detected: ${localScore.primary} (confidence: ${Number(localScore.confidence || 0).toFixed(2)})`
          : `检测到的意图：${localScore.primary}（置信度：${Math.round(Number(localScore.confidence || 0) * 100)}%）`
      })
    }
    
    // 返回默认值而不是抛出错误，避免阻塞整个流程
    return IntentResultSchema.parse({
      intentType: 'photography_exploration',
      keywords: [],
      emotionTone: isEnglish ? 'contemplative' : '专注·柔和',
      description: ''
    })
  }
}

/**
 * AI人格语料库（Persona Voice Bank）
 */
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

// fixCommonJSONIssues 函数已删除，统一使用 inspirationCore 中的 parseJSONSafe

/**
 * 生成 Inspiration 模式的灵感旅程
 */

/**
 * 基于人格问卷生成双轨心理旅程
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
  userCountry?: string, // 用户所在国家/地区（用于推荐目的地）
  selectedDestination?: string,
  userNationality?: string, // 用户国籍（用于显示格式，如货币、日期格式等）
  userPermanentResidency?: string, // 用户永久居民身份（如绿卡，用于签证判断）
  heldVisas?: string[], // 用户已持有的签证（国家代码数组）
  visaFreeDestinations?: string[], // 对用户免签或落地签的目的地国家代码列表
  visaInfoSummary?: string | null // 选定目的地的签证信息摘要
): Promise<any> {
  const { 
    calculatePersonalityVector, 
    matchPsychologicalTemplate,
    generateDualTrackJSON 
  } = await import('@/utils/psychologicalTemplates')
  
  // 计算五维人格向量
  const vector = calculatePersonalityVector(personalityProfile)
  
  // 匹配心理旅程模板（返回匹配结果和分数）
  const matchResult = matchPsychologicalTemplate(vector, {
    motivation_detail: personalityProfile.motivation_detail,
    desired_emotion: personalityProfile.desired_emotion,
    activity_density: personalityProfile.activity_density,
    social_intensity: personalityProfile.social_intensity,
    post_journey_goal: personalityProfile.post_journey_goal
  })
  
  const template = matchResult.template
  console.log('🎯 匹配到的心理旅程模板:', template.templateName)
  console.log('📊 匹配分数:', matchResult.score.toFixed(2))
  console.log('📊 五维人格向量:', vector)
  
  // 基于模板和人格向量生成行程提示词
  const isEnglish = language.startsWith('en')
  const lang = pickLang(language)
  
  // 如果用户选择了目的地，在提示词中强调必须使用该目的地
  const destinationConstraint = buildDestinationConstraint(selectedDestination, language, 'important')
  
  // 构建基于心理模板的行程生成提示
  const foodPreferenceText = personalityProfile.food_preference 
    ? (isEnglish ? `\n- Food Experience: ${personalityProfile.food_preference}` : `\n- 美食体验：${personalityProfile.food_preference}`)
    : ''
  
  const psychologicalPrompt = isEnglish
    ? `Generate a ${template.templateName} journey based on the following psychological profile:
- Motivation: ${personalityProfile.motivation} (seeking: ${personalityProfile.motivation_detail})
- Emotion: From ${personalityProfile.dominant_emotion} to ${personalityProfile.desired_emotion}
- Rhythm: ${personalityProfile.travel_rhythm} with ${personalityProfile.activity_density} activities
- Social: ${personalityProfile.social_preference} (intensity: ${personalityProfile.social_intensity}/5)
- Need: ${personalityProfile.cognitive_need} → ${personalityProfile.post_journey_goal}${foodPreferenceText}

Psychological Flow: ${template.psychologicalFlow.join(' → ')}
Symbolic Elements: ${template.symbolicElements.join(', ')}
Core Insight: ${template.coreInsight}
Recommended Rhythm: ${template.recommendedRhythm}
Social Mode: ${template.socialMode}${destinationConstraint}

IMPORTANT: Based on the food preference "${personalityProfile.food_preference || 'local cuisine experience'}", ensure the itinerary includes appropriate food and dining experiences. Include meal activities (type: "meal") that match the traveler's food preference level.${foodPreferenceText ? `\n- For "${personalityProfile.food_preference}", plan meals accordingly:` : ''}${personalityProfile.food_preference === '深度美食探索' || personalityProfile.food_preference === 'Deep Food Exploration' ? ' Include multiple meal experiences daily, from street food to fine dining, cooking classes, food markets, and local specialty restaurants.' : ''}${personalityProfile.food_preference === '当地特色体验' || personalityProfile.food_preference === 'Local Specialty Experience' ? ' Include 1-2 meal experiences per day focusing on authentic local cuisine and traditional dishes.' : ''}${personalityProfile.food_preference === '偶尔尝试' || personalityProfile.food_preference === 'Occasional Try' ? ' Include occasional meal experiences (every other day or so) with local specialties.' : ''}${personalityProfile.food_preference === '简单便捷' || personalityProfile.food_preference === 'Simple & Convenient' ? ' Include simple, convenient meal options without extensive food-focused activities.' : ''}

Create a travel itinerary that embodies this psychological journey.`
    : `基于以下心理画像生成${template.templateName}旅程：
- 动机：${personalityProfile.motivation}（寻求：${personalityProfile.motivation_detail}）
- 情绪：从 ${personalityProfile.dominant_emotion} 到 ${personalityProfile.desired_emotion}
- 节奏：${personalityProfile.travel_rhythm}，活动密度：${personalityProfile.activity_density}
- 社交：${personalityProfile.social_preference}（强度：${personalityProfile.social_intensity}/5）
- 需求：${personalityProfile.cognitive_need} → ${personalityProfile.post_journey_goal}${foodPreferenceText}

心理流程：${template.psychologicalFlow.join(' → ')}
象征元素：${template.symbolicElements.join('、')}
核心洞察：${template.coreInsight}
推荐节奏：${template.recommendedRhythm}
社交模式：${template.socialMode}${destinationConstraint}

重要提示：根据美食偏好"${personalityProfile.food_preference || '当地特色体验'}"，确保行程包含相应的美食和餐饮体验。包含符合旅行者美食偏好水平的餐饮活动（type: "meal"）。${foodPreferenceText ? `\n- 对于"${personalityProfile.food_preference}"，请相应安排：` : ''}${personalityProfile.food_preference === '深度美食探索' ? ' 每天包含多次餐饮体验，从街头小吃到精致餐厅、烹饪课程、美食市场、当地特色餐厅等。' : ''}${personalityProfile.food_preference === '当地特色体验' ? ' 每天包含1-2次餐饮体验，专注于地道当地美食和传统菜肴。' : ''}${personalityProfile.food_preference === '偶尔尝试' ? ' 偶尔包含餐饮体验（每隔一天左右），尝试当地特色。' : ''}${personalityProfile.food_preference === '简单便捷' ? ' 包含简单便捷的餐饮选项，无需大量美食活动。' : ''}

创建体现这一心理旅程的旅行行程。`
  
  console.log('🎯 生成心理旅程，用户选择的目的地:', selectedDestination || '未指定')
  
  // 第一步：使用AI生成目的地推荐（基于人格画像和模板）
  // 如果用户未选择目的地，才生成推荐列表；如果已选择，则跳过此步骤
  let recommendedDestinations: Array<{ name: string; country: string; reason: string; reasoning?: string; description?: string }> = []
  
  // 如果用户已选择目的地，跳过推荐步骤
  if (!selectedDestination) {
    try {
    // 构建推荐目的地的AI提示词
    const recommendationPrompt = isEnglish
      ? `Analyze the traveler's psychological profile and recommend destinations that match their needs.

**Psychological Profile:**
- Motivation: ${personalityProfile.motivation} (seeking: ${personalityProfile.motivation_detail})
- Emotion: From ${personalityProfile.dominant_emotion} to ${personalityProfile.desired_emotion}
- Rhythm: ${personalityProfile.travel_rhythm}, Activity Density: ${personalityProfile.activity_density}
- Social: ${personalityProfile.social_preference} (intensity: ${personalityProfile.social_intensity}/5)
- Need: ${personalityProfile.cognitive_need} → ${personalityProfile.post_journey_goal}
${personalityProfile.food_preference ? `- Food Experience: ${personalityProfile.food_preference}` : '- Food Experience: Local cuisine experience'}

**Matched Psychological Template:**
- Template Name: ${template.templateName}
- Psychological Flow: ${template.psychologicalFlow.join(' → ')}
- Symbolic Elements: ${template.symbolicElements.join(', ')}
- Core Insight: ${template.coreInsight}
- Recommended Rhythm: ${template.recommendedRhythm}
- Social Mode: ${template.socialMode}

**User Location (for destination recommendations):** ${userCountry || 'Unknown'}
${userNationality ? `**User Nationality (for display format & visa requirements):** ${userNationality}` : ''}
${userPermanentResidency ? `**User Permanent Residency (for visa requirements):** ${userPermanentResidency} (e.g., Green Card, Permanent Residence)` : ''}
${heldVisas && heldVisas.length > 0 ? `**Held Visas:** User already holds visas for countries with codes: ${heldVisas.join(', ')}. These destinations should be prioritized when recommending travel options since no additional visa is needed.` : ''}

**Important Context:**
- User Location (${userCountry || 'Unknown'}): This is where the user currently lives. Use this to prioritize nearby destinations (within their country or nearby regions).
- User Nationality (${userNationality || 'Not specified'}): This is the user's passport nationality, used for:
  1. Cultural preferences: currency format, date format, etc.
  2. Visa requirements: When recommending destinations, consider visa requirements based on the user's nationality. For example, if the user has Chinese nationality, recommend destinations that are visa-free or have easier visa processes for Chinese passport holders. If the user's nationality matches their location country, prioritize domestic destinations to avoid visa issues.
${userPermanentResidency ? `- User Permanent Residency (${userPermanentResidency}): The user holds permanent residency status (e.g., Green Card, Permanent Residence) in ${userPermanentResidency}. This may provide additional visa benefits or exemptions when traveling to certain destinations. Consider this when recommending destinations and providing visa advice.` : ''}

Based on this psychological profile and template, recommend travel destinations that would support this psychological journey.

**Requirements:**
1. Recommend 8-12 destinations total
2. If user is in a specific country (${userCountry || 'unknown'}), prioritize 3-5 destinations within that country
3. Include at least 5 international destinations from different countries
4. **Visa considerations:** ${userNationality || userPermanentResidency || heldVisas?.length || visaFreeDestinations?.length ? `When recommending international destinations:
${heldVisas && heldVisas.length > 0 ? `- **HIGHEST PRIORITY - User already holds visas:** Countries with codes: ${heldVisas.join(', ')}. These destinations should be given the HIGHEST priority since the user already has valid visas and can travel immediately without additional visa applications.` : ''}
${visaFreeDestinations && visaFreeDestinations.length > 0 ? `- **Visa-free/Visa-on-arrival destinations for this user:** Countries with codes: ${visaFreeDestinations.join(', ')}. These destinations should be prioritized when recommending international travel options.` : ''}
${visaInfoSummary ? `- **Visa information for selected destination:** ${visaInfoSummary}` : ''}
${userPermanentResidency ? `- If user holds permanent residency in ${userPermanentResidency}, consider visa benefits or exemptions that may apply to permanent residents (e.g., some countries offer visa-free or simplified visa processes for permanent residents of certain countries like the US, Canada, etc.).` : ''}
${userNationality ? `- For a user with ${userNationality} nationality, prioritize destinations that are visa-free or have visa-on-arrival for ${userNationality} passport holders.` : ''}
- If the user's nationality (${userNationality || 'unknown'}) matches their location (${userCountry || 'unknown'}), domestic destinations are preferred to avoid visa requirements.
${userPermanentResidency && userNationality ? `- Note: If user has ${userNationality} nationality but holds permanent residency in ${userPermanentResidency}, both factors should be considered for visa requirements.` : ''}` : 'Consider visa requirements when recommending international destinations.'}
5. Each recommendation MUST include:
   - name: Destination name (specific location, e.g., "Mount Kailash Sacred Circuit" not just "Tibet")
   - country: Country name
   - reason: A concise recommendation reason (2-3 sentences) explaining why this destination matches their psychological profile
   - reasoning: Your analytical thinking process (2-3 sentences) explaining the connection between their personality traits and this destination

**Analysis Approach:**
Consider:
- How the destination's symbolic meaning aligns with their motivation (${personalityProfile.motivation})
- How the destination supports their emotional transformation (from ${personalityProfile.dominant_emotion} to ${personalityProfile.desired_emotion})
- How the destination's pace matches their rhythm preference (${personalityProfile.travel_rhythm})
- How the destination facilitates their cognitive need (${personalityProfile.cognitive_need})
- How the destination supports their social preference (${personalityProfile.social_preference})

Return a valid JSON array with this structure:
[
  {
    "name": "Destination Name",
    "country": "Country Name",
    "reason": "Why this destination matches their profile (2-3 sentences)",
    "reasoning": "Your analytical thinking: how you connected their traits to this destination (2-3 sentences)"
  }
]`
      : `分析用户的心理画像，推荐匹配他们需求的旅行目的地。

**用户心理画像：**
- 动机：${personalityProfile.motivation}（寻求：${personalityProfile.motivation_detail}）
- 情绪：从 ${personalityProfile.dominant_emotion} 到 ${personalityProfile.desired_emotion}
- 节奏：${personalityProfile.travel_rhythm}，活动密度：${personalityProfile.activity_density}
- 社交：${personalityProfile.social_preference}（强度：${personalityProfile.social_intensity}/5）
- 需求：${personalityProfile.cognitive_need} → ${personalityProfile.post_journey_goal}
${personalityProfile.food_preference ? `- 美食体验：${personalityProfile.food_preference}` : '- 美食体验：当地特色体验'}

**匹配的心理旅程模板：**
- 模板名称：${template.templateName}
- 心理流程：${template.psychologicalFlow.join(' → ')}
- 象征元素：${template.symbolicElements.join('、')}
- 核心洞察：${template.coreInsight}
- 推荐节奏：${template.recommendedRhythm}
- 社交模式：${template.socialMode}

**用户地理位置（用于推荐目的地）：** ${userCountry || '未知'}
${userNationality ? `**用户国籍（用于显示格式和签证需求）：** ${userNationality}` : ''}
${userPermanentResidency ? `**用户永久居民身份（用于签证需求）：** ${userPermanentResidency}（如绿卡、永久居留权等）` : ''}
${heldVisas && heldVisas.length > 0 ? `**已持有签证：** 用户已持有以下国家的签证（国家代码：${heldVisas.join('、')}）。推荐目的地时应优先考虑这些国家，因为无需再申请签证。` : ''}

**重要说明：**
- 用户地理位置（${userCountry || '未知'}）：用户当前所在的国家/地区。用于优先推荐附近的目的地（优先推荐该国国内或周边地区）。
- 用户国籍（${userNationality || '未指定'}）：用户的护照国籍，用于：
  1. 文化偏好设置：货币格式、日期格式等
  2. 签证需求判断：推荐目的地时，需考虑基于用户国籍的签证要求。例如，如果用户是中国国籍，优先推荐对中国护照免签或签证便利的目的地。如果用户国籍与居住国一致，优先推荐国内目的地以避免签证问题。
${userPermanentResidency ? `- 用户永久居民身份（${userPermanentResidency}）：用户持有${userPermanentResidency}的永久居民身份（如绿卡、永久居留权等）。这可能在访问某些目的地时提供额外的签证便利或豁免。推荐目的地和提供签证建议时需考虑此因素。` : ''}

基于这个心理画像和模板，推荐适合这个心理旅程的旅行目的地。

**要求：**
1. 总共推荐8-12个目的地
2. 如果用户位于特定国家（${userCountry || '未知'}），优先推荐3-5个该国国内目的地
3. 至少包含5个来自不同国家的国际目的地
4. **签证考虑：** ${userNationality || userPermanentResidency || heldVisas?.length || visaFreeDestinations?.length ? `推荐国际目的地时：
${heldVisas && heldVisas.length > 0 ? `- **最高优先级 - 用户已持有签证：** 国家代码：${heldVisas.join('、')}。这些目的地应给予最高优先级，因为用户已持有有效签证，可以立即出行，无需再申请签证。` : ''}
${visaFreeDestinations && visaFreeDestinations.length > 0 ? `- **对用户免签/落地签的目的地：** 国家代码：${visaFreeDestinations.join('、')}。推荐国际旅行时应优先考虑这些目的地。` : ''}
${visaInfoSummary ? `- **选定目的地的签证信息：** ${visaInfoSummary}` : ''}
${userPermanentResidency ? `- 如果用户持有${userPermanentResidency}的永久居民身份（如绿卡），考虑永久居民可能享有的签证便利或豁免（例如，某些国家对美国、加拿大等国的永久居民提供免签或简化签证流程）。` : ''}
${userNationality ? `- 对于${userNationality}国籍的用户，优先推荐对${userNationality}护照免签或落地签的目的地。` : ''}
- 如果用户国籍（${userNationality || '未知'}）与居住国（${userCountry || '未知'}）一致，优先推荐国内目的地以避免签证问题。
${userPermanentResidency && userNationality ? `- 注意：如果用户是${userNationality}国籍但持有${userPermanentResidency}的永久居民身份，推荐时需同时考虑这两个因素对签证要求的影响。` : ''}` : '推荐国际目的地时，需考虑签证要求。'}
5. 每个推荐必须包含：
   - name: 目的地名称（具体地点，例如"冈仁波齐·神山环线"而不是仅仅"西藏"）
   - country: 国家名称
   - reason: 推荐理由（2-3句话），说明为什么这个目的地匹配用户的心理画像
   - reasoning: 你的判断思路（2-3句话），解释你如何将用户的性格特质与这个目的地连接起来

**分析思路：**
考虑：
- 目的地的象征意义如何匹配用户的动机（${personalityProfile.motivation}）
- 目的地如何支持用户的情绪转化（从 ${personalityProfile.dominant_emotion} 到 ${personalityProfile.desired_emotion}）
- 目的地的节奏如何匹配用户的节奏偏好（${personalityProfile.travel_rhythm}）
- 目的地如何满足用户的认知需求（${personalityProfile.cognitive_need}）
- 目的地如何支持用户的社交偏好（${personalityProfile.social_preference}）

返回有效的JSON数组，格式如下：
[
  {
    "name": "目的地名称",
    "country": "国家名称",
    "reason": "推荐理由（2-3句话）：为什么这个目的地匹配用户画像",
    "reasoning": "判断思路（2-3句话）：你是如何将用户的性格特质与这个目的地连接起来的"
  }
]`

    // 调用AI生成推荐
    logger.log('🚀 开始调用AI生成目的地推荐...', '', 0)
    
    const systemMsg = lang.onlyJson
    const response = await askDeepSeek(systemMsg, recommendationPrompt, {
      temperature: 0.8,
      max_tokens: 4000
    })

    if (!response || response.trim().length === 0) {
      throw new Error('AI返回空响应')
    }

    logger.log('📥 AI原始响应长度', String(response.length), 0)
    
    // 使用统一的 JSON 解析工具
    const parsed = parseJSONSafe(response)
    
    if (parsed && Array.isArray(parsed)) {
      recommendedDestinations = normalizeRecommendations(parsed)
      logger.log(`✅ AI推荐了 ${recommendedDestinations.length} 个目的地`, '', 0)
      logger.log('📍 推荐列表', recommendedDestinations.map(d => `${d.name} (${d.country})`).join(', '), 500)
    } else {
      logger.warn('⚠️ AI返回的不是数组格式', typeof parsed, 500)
      throw new Error('AI返回的不是数组格式')
    }
    } catch (error: any) {
      logger.error('❌ AI生成目的地推荐失败', error)
      recommendedDestinations = []
    }
    
    // 确保至少有基本推荐（如果AI失败）
    if (recommendedDestinations.length === 0) {
      logger.warn('⚠️ AI未生成推荐，使用默认推荐', '', 0)
      recommendedDestinations = fallbackRecommendations(language)
    }
    
    logger.log(`✅ 最终推荐了 ${recommendedDestinations.length} 个目的地`, '', 0)
  } else {
    // 用户已选择目的地，不需要推荐列表
    logger.log('✅ 用户已选择目的地，跳过推荐生成步骤', '', 0)
    recommendedDestinations = []
  }
  
  // 生成AI推荐消息
  let aiRecommendationMessage = ''
  if (selectedDestination) {
    // 用户已选择目的地，生成行程中
    aiRecommendationMessage = isEnglish
      ? `I'm creating a personalized ${template.templateName} journey itinerary for ${selectedDestination} based on your psychological profile.`
      : `我正在为 ${selectedDestination} 创建个性化的 ${template.templateName} 旅程行程，基于你的心理画像。`
  } else if (recommendedDestinations && recommendedDestinations.length > 0) {
    // 显示推荐列表，等待用户选择（仅生成推荐目的地时）
    const topDestinations = recommendedDestinations.slice(0, 3).map(d => d.name).join('、')
    aiRecommendationMessage = isEnglish
      ? `Based on your psychological profile (${template.templateName}), I've carefully selected ${recommendedDestinations.length} destinations that align with your journey from ${personalityProfile.dominant_emotion} to ${personalityProfile.desired_emotion}. The top recommendations include ${topDestinations}. Each destination has been thoughtfully matched to support your ${personalityProfile.motivation} motivation and ${personalityProfile.cognitive_need} needs. Please choose one that resonates with you, and I'll create a personalized itinerary for your ${template.templateName} journey.`
      : `根据你的心理画像（${template.templateName}），我为你精心选择了 ${recommendedDestinations.length} 个目的地，它们与你从 ${personalityProfile.dominant_emotion} 到 ${personalityProfile.desired_emotion} 的情绪转化路径相契合。重点推荐包括 ${topDestinations} 等。每个目的地都经过深思熟虑，匹配你的 ${personalityProfile.motivation} 动机和 ${personalityProfile.cognitive_need} 需求。请选择一个让你心动的地方，我将为你量身定制一份 ${template.templateName} 旅程。`
  } else {
    // 如果没有推荐目的地，显示提示消息
    aiRecommendationMessage = isEnglish
      ? `I'm analyzing your psychological profile and generating destination recommendations...`
      : `正在分析你的心理画像并生成推荐目的地...`
  }
  
  // 第二步：如果用户选择了目的地，生成完整行程；否则只返回推荐列表
  let itineraryData = null
  let dualTrackData = null
  
  // 如果用户已选择目的地，跳过推荐步骤，直接生成完整行程
  if (selectedDestination) {
    // 用户已选择目的地，基于问卷内容和目的地生成完整行程
    console.log('✅ 用户已选择目的地，跳过推荐步骤，直接生成完整行程...')
    console.log('📍 生成行程基于：问卷内容 + 目的地:', selectedDestination)
    
    // 当用户已选择目的地时，不需要生成推荐列表，直接使用选择的目的地
    recommendedDestinations = [{
      name: selectedDestination,
      country: userCountry || '未知',
      reason: '您已选择此目的地',
      reasoning: '基于您的选择生成个性化行程'
    }]
    
    try {
      // 传递用户选择的目的地，AI会严格按照该目的地生成行程
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
      
      // 获取签证信息（如果有选定目的地）
      let visaInfoSummary: string | null = null
      let visaFreeDestinations: string[] = []
      if (selectedDestination) {
        try {
          const { getVisaDescription, getVisaFreeDestinations } = await import('@/config/visa')
          const { PRESET_COUNTRIES } = await import('@/constants/countries')
          const { getUserNationalityCode, getUserPermanentResidencyCode } = await import('@/config/userProfile')
          
          const nationalityCode = getUserNationalityCode()
          const residencyCode = getUserPermanentResidencyCode()
          
          visaFreeDestinations = getVisaFreeDestinations(nationalityCode, residencyCode)
          
          // 尝试从目的地字符串中提取国家代码
          const destCountryInfo = Object.values(PRESET_COUNTRIES).find(country => 
            selectedDestination.includes(country.name) || 
            selectedDestination.includes(country.code)
          )
          if (destCountryInfo) {
            visaInfoSummary = getVisaDescription(destCountryInfo.code, nationalityCode, residencyCode)
          }
        } catch (err) {
          console.warn('⚠️ 获取签证信息失败', err)
        }
      }
      
      itineraryData = await generateInspirationJourney(psychologicalPrompt, language, userCountry, selectedDestination, userNationality, userPermanentResidency, heldVisas, visaFreeDestinations, visaInfoSummary)
      
      // 验证AI是否正确使用了用户选择的目的地（仅记录日志，不强制替换）
      if (itineraryData && itineraryData.destination !== selectedDestination) {
        console.warn(`⚠️ 注意：AI生成的目的地(${itineraryData.destination})与用户选择(${selectedDestination})不一致，但系统信任AI的生成结果`)
      } else {
        console.log(`✅ AI正确使用了用户选择的目的地: ${selectedDestination}`)
      }
      
      // 生成双轨 JSON（完整结构）
      dualTrackData = await generateDualTrackJSON(
        template,
        vector,
        {
          motivation_detail: personalityProfile.motivation_detail,
          desired_emotion: personalityProfile.desired_emotion,
          activity_density: personalityProfile.activity_density,
          social_intensity: personalityProfile.social_intensity,
          post_journey_goal: personalityProfile.post_journey_goal
        },
        itineraryData
      )
  } catch (error) {
      console.warn('⚠️ 行程生成失败，仅返回心理旅程模板和推荐列表', error)
      // 即使行程生成失败，也返回推荐列表和模板信息
    }
  } else {
    // 用户未选择目的地，只返回推荐列表和模板信息，不生成行程
    console.log('ℹ️ 用户未选择目的地，仅返回推荐列表')
  }
  
  // 使用AI生成的目的地，或用户选择的目的地
  let finalDestination = itineraryData?.destination || selectedDestination
  
  // 合并数据：将双轨 JSON 和行程数据整合
  const result: any = {
    // 人格画像
    personaProfile: dualTrackData?.personaProfile || {
      type: template.templateName,
      motivation: personalityProfile.motivation,
      motivation_detail: personalityProfile.motivation_detail,
      dominantEmotion: personalityProfile.dominant_emotion,
      desiredEmotion: personalityProfile.desired_emotion,
      travelRhythm: personalityProfile.travel_rhythm,
      activityDensity: personalityProfile.activity_density,
      socialPreference: personalityProfile.social_preference,
      socialIntensity: personalityProfile.social_intensity,
      cognitiveNeed: personalityProfile.cognitive_need,
      postJourneyGoal: personalityProfile.post_journey_goal,
      foodPreference: personalityProfile.food_preference || '当地特色体验'
    },
    
    // 旅程设计（如果有完整行程）
    journeyDesign: dualTrackData?.journeyDesign,
    
    // 目的地推荐（AI生成，包含推荐理由和判断思路）
    recommendedDestinations: recommendedDestinations,
    locations: recommendedDestinations.map(d => d.name),
    locationDetails: recommendedDestinations.reduce((acc, dest) => {
      acc[dest.name] = {
        name: dest.name,
        country: dest.country,
        description: dest.description || dest.reason,
        reason: dest.reason, // 推荐理由
        reasoning: dest.reasoning // AI的判断思路
      }
      return acc
    }, {} as Record<string, { name: string; country: string; description?: string; reason?: string; reasoning?: string }>),
    
    // 兼容字段
    title: dualTrackData?.journeyDesign?.title || `${template.templateName}旅程`,
    subtitle: `基于你的心理画像推荐的目的地`,
    coreInsight: template.coreInsight,
    templateName: template.templateName,
    psychologicalFlow: template.psychologicalFlow,
    symbolicElements: template.symbolicElements,
    
    // 匹配信息
    matchScore: matchResult.score,
    matchDetails: matchResult.matchDetails,
    
    // 标记是否已生成完整行程
    hasFullItinerary: !!itineraryData,
    
    // AI推荐消息（用于"AI 旅行伙伴说"区域）
    aiMessage: aiRecommendationMessage || (isEnglish 
      ? `I've prepared ${recommendedDestinations?.length || 0} destination recommendations for you based on your psychological profile. Please select one that speaks to your heart.`
      : `我根据你的心理画像为你准备了 ${recommendedDestinations?.length || 0} 个目的地推荐，请选择一个让你心动的地方。`)
  }
  
  // 如果已生成完整行程，添加行程相关字段
  if (itineraryData && dualTrackData) {
    result.destination = finalDestination
    result.location = finalDestination
    result.days = itineraryData.days
    result.duration = itineraryData.duration
    result.summary = itineraryData.summary
    result.recommendations = itineraryData.recommendations
    result.totalCost = itineraryData.totalCost
    
    // 合并标准行程字段（但保留 aiMessage，避免被覆盖）
    const { aiMessage: preservedAiMessage } = result
    Object.assign(result, itineraryData)
    // 确保 aiMessage 不被覆盖（如果原来有值则保留）
    if (preservedAiMessage) {
      result.aiMessage = preservedAiMessage
    }
  }
  
  console.log('📤 准备返回结果，包含推荐目的地数量:', result.recommendedDestinations?.length || 0)
  console.log('📤 返回的locations数量:', result.locations?.length || 0)
  console.log('📤 hasFullItinerary:', result.hasFullItinerary)
  console.log('📤 result结构:', {
    hasRecommendedDestinations: !!result.recommendedDestinations,
    hasLocations: !!result.locations,
    locationsLength: result.locations?.length || 0,
    recommendedDestinationsLength: result.recommendedDestinations?.length || 0
  })
  
  return result
}

/**
 * 从用户输入中提取天数信息
 */
function extractDaysFromInput(input: string, language: string = 'zh-CN'): number | null {
  const isEnglish = language.startsWith('en')
  
  // 中文模式：匹配"6天"、"6日"、"六天"等
  if (!isEnglish) {
    // 匹配数字+天/日
    const zhPattern1 = /(\d+)\s*[天日]/
    const match1 = input.match(zhPattern1)
    if (match1 && match1[1]) {
      const days = parseInt(match1[1], 10)
      if (days > 0 && days <= 30) {
        return days
      }
    }
    
    // 匹配中文数字+天/日
    const zhNumbers: Record<string, number> = {
      '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
      '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
      '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15
    }
    for (const [zhNum, num] of Object.entries(zhNumbers)) {
      if (input.includes(`${zhNum}天`) || input.includes(`${zhNum}日`)) {
        return num
      }
    }
  } else {
    // 英文模式：匹配"6 days"、"6-day"等
    const enPattern1 = /(\d+)\s*days?/i
    const match1 = input.match(enPattern1)
    if (match1 && match1[1]) {
      const days = parseInt(match1[1], 10)
      if (days > 0 && days <= 30) {
        return days
      }
    }
    
    // 匹配"6-day"格式
    const enPattern2 = /(\d+)\s*-\s*day/i
    const match2 = input.match(enPattern2)
    if (match2 && match2[1]) {
      const days = parseInt(match2[1], 10)
      if (days > 0 && days <= 30) {
        return days
      }
    }
  }
  
  return null
}

export async function generateInspirationJourney(input: string, language: string = 'zh-CN', userCountry?: string, selectedDestination?: string, userNationality?: string, userPermanentResidency?: string, heldVisas?: string[], visaFreeDestinations?: string[], visaInfoSummary?: string | null): Promise<any> {
  const isEnglish = language.startsWith('en')
  
  // 首先从用户输入中提取天数
  const userRequestedDays = extractDaysFromInput(input, language)
  logger.log(`📅 从用户输入提取的天数: ${userRequestedDays || '未找到'}`, '', 0)
  
  // 并行执行意图检测和参考目录构建，提升性能
  const [intentResult, referenceResult] = await Promise.all([
    // 意图检测
    detectInspirationIntent(input, language).catch((error) => {
      console.error('意图识别失败，使用默认值:', error)
      return {
        intentType: 'general',
        keywords: [],
        emotionTone: 'neutral',
        description: '一般旅行'
      }
    }),
    // 参考目录构建（本地操作，很快）
    buildReferenceCatalog(userCountry, language)
  ])
  
  let intentData = intentResult
  const { referenceCatalog, locationGuidance } = referenceResult
  
  // 如果用户选择了目的地，在意图数据中记录
  if (selectedDestination) {
    console.log('📍 用户已选择目的地:', selectedDestination)
    if (!intentData.keywords) {
      intentData.keywords = []
    }
    // 确保目的地关键词被包含
    if (!intentData.keywords.includes(selectedDestination)) {
      intentData.keywords.unshift(selectedDestination)
    }
  }
  
  const startDate = new Date().toISOString().split('T')[0]
  
  // 根据目的地推荐最佳天数（如果用户未指定）
  let estimatedDays: number
  if (userRequestedDays) {
    // 用户明确指定了天数，使用用户输入
    estimatedDays = userRequestedDays
    logger.log(`📅 使用用户指定的天数: ${estimatedDays}`, '', 0)
  } else {
    // 用户未指定，根据目的地智能推荐
    const { getRecommendedDaysForDestination } = await import('@/utils/destinationDays')
    const destination = selectedDestination || intentData?.keywords?.[0] || ''
    const recommendation = getRecommendedDaysForDestination(destination, intentData?.intentType)
    estimatedDays = recommendation.recommendedDays
    logger.log(`📅 根据目的地推荐天数: ${estimatedDays} (目的地: ${destination}, 原因: ${recommendation.reason})`, '', 0)
  }
  
  logger.log(`📅 最终使用的天数: ${estimatedDays} (用户输入: ${userRequestedDays || '未指定'}, 目的地推荐: ${estimatedDays})`, '', 0)
  
  const intentTypeText = intentData?.intentType || 'general'
  const emotionToneText = intentData?.emotionTone || 'neutral'
  const keywordsText = intentData?.keywords?.filter((k: string) => k !== selectedDestination).join('、') || ''
  
  // 如果用户选择了目的地，在系统提示词中强调
  const destinationNote = buildDestinationConstraint(selectedDestination, language, 'critical')
  
  const systemPrompt = isEnglish
    ? `🎨 AI Identity: Inspirit Designer (Inspiration Personality Travel Designer)

You are not just a travel planner, but an Inspirit Designer who:
- Identifies soul states → Designs psychological transformation journeys → Generates actionable paths
- Your output goal is not just "destinations," but emotional polyphony and meaning renewal

✨ Four-Persona Collaboration System:

1️⃣ Soul Mapper (灵魂测绘者)
- Identifies user's psychological rhythm, stress points, emotional tone
- Tone: Gentle, insightful, quiet
- Function: Emotion recognition & intent analysis

2️⃣ Journey Weaver (旅程编织者)
- Combines emotions with geography, stories, and rituals
- Tone: Visual, symbolic, narrative-rich
- Function: Scene & story design

3️⃣ Ground Navigator (现实锚定者)
- Transforms inspiration into executable plans
- Tone: Clear, logical, practical
- Function: Itinerary timeline & action planning

4️⃣ Echo Keeper (记忆引导者)
- Handles post-journey reflection and extension challenges
- Tone: Gentle, philosophical
- Function: Meta-cognition & action transformation

👉 Four personas collaborate to form a complete psychological journey system: "Identify → Design → Execute → Transform"

📋 User Intent Analysis:
- Intent Type: ${intentTypeText}
- Emotion Tone: ${emotionToneText}
- Keywords: ${keywordsText || 'not specified'}
${destinationNote}
${userCountry ? `\n📍 User Location (for destination recommendations): User is located in ${userCountry}. Prioritize destinations within ${userCountry} or nearby regions.` : ''}
${userNationality ? `\n🌍 User Nationality (for display format & visa requirements): User's passport nationality is ${userNationality}. Use this for:
  1. Cultural preferences: currency format, date format, etc.
  2. Visa requirements: When recommending destinations, consider visa requirements based on the user's nationality. If the user's nationality matches their location country, prioritize domestic destinations. If different, consider visa-free or visa-on-arrival destinations for their nationality.` : ''}
${userPermanentResidency ? `\n🪪 User Permanent Residency: User holds permanent residency status (e.g., Green Card, Permanent Residence) in ${userPermanentResidency}. This may provide visa benefits or exemptions when traveling to certain destinations. Consider this when recommending destinations and providing visa advice.` : ''}
${heldVisas && heldVisas.length > 0 ? `\n🎫 User Already Holds Visas: User already has valid visas for countries with codes: ${heldVisas.join(', ')}. These destinations should be given HIGHEST PRIORITY when recommending travel options since no additional visa is needed.` : ''}
${visaFreeDestinations && visaFreeDestinations.length > 0 ? `\n✅ Visa-free/Visa-on-arrival destinations for this user (country codes): ${visaFreeDestinations.join(', ')}. Prioritize these destinations when recommending international travel.` : ''}
${visaInfoSummary ? `\n📋 Visa information for destination: ${visaInfoSummary}` : ''}

🌿 Core Mission:
Design a ${estimatedDays}-day dual-track journey (External × Internal) that:
- External Track: Time, location, activities, transportation, budget (executable itinerary)
- Internal Track: Emotional stages, psychological tasks, ritual design, transformation questions (experiential journey)
- Each activity must bridge both tracks: practical execution + psychological meaning

✨ Dual-Track Design Philosophy:

Each activity must have TWO layers:

🪞 Example Structure:
"09:00 Morning run by the sea"
→ External: Exercise release, scenic route, practical logistics
→ Internal: Question trigger—"What speed have I been avoiding lately?"
→ Ritual Design: After the run, write down "one thing worth slowing down for"

This dual-track design enables you to generate both executable itineraries and experiential psychological scripts.

✨ Writing Style Requirements:

1️⃣ Emotional Introduction (情绪引入)
- Use poetic language + specific sensory descriptions
- Build psychological connection through imagery
- Example: "As dawn breaks over the misty coast, the rhythm of waves becomes a mirror for your inner tempo..."

2️⃣ Action Design (行动设计)
- Clear, executable steps
- Balance realism with symbolism
- Example: "Run along the 3km coastal path; pause at each kilometer marker to observe one sensory detail (sound, scent, texture)"

3️⃣ Reflection Trigger (反思触发)
- Open-ended questions + sensory anchors
- Inspire introspection and self-awareness
- Example: "While running, consider: What am I running from? What am I running toward? Let your pace answer."

4️⃣ Transformation Summary (总结转化)
- Extract one insight + extension action
- Help continuous growth post-journey
- Example: "The insight: True freedom is finding the rhythm between speed and stillness. Action: Set a daily 10-minute pause ritual when you return home."

🗺️ Dual-Track Itinerary Structure Requirements:

Generate ${estimatedDays} days of detailed dual-track journey:

External Track (External) - Practical & Executable:
- Generate 4-6 time slots per day
- Arrange activities geographically (minimize travel time)
- Include transportation details between activities
- Provide cost estimates and local tips
- Ensure all activities are logistically feasible

Internal Track (Internal) - Psychological & Experiential:
- Each day maps to a psychological flow stage (Summon → Mirror → Awaken → Settle → Transform)
- Each activity includes: psychological question, ritual/action, reflection point
- Connect activities through emotional narrative arc
- Design symbolic moments aligned with journey theme

Bridge Between Tracks:
- Every external activity must have an internal psychological task/question
- Time slots include both practical and experiential elements

You MUST return a valid JSON object with this EXACT dual-track structure:

{
  "title": "Journey title reflecting psychological transformation (e.g., \"The Burning Path: Redemption of the Weary Soul\")",
  "destination": "${selectedDestination ? selectedDestination.replace(/"/g, '\\"') : 'Primary destination city/country'}",
  "duration": ${estimatedDays},
  "summary": "Overall journey summary (100-150 words): describe both the practical journey and the emotional/psychological transformation arc",
  "psychologicalFlow": ["Summon", "Mirror", "Awaken", "Settle", "Transform"],
  "coreInsight": "One core psychological insight that captures the journey's essence (e.g., \"Redemption is not escape, but bringing light back to life\")",
  "days": [
    {
      "day": 1,
      "date": "${startDate}",
      "theme": "Daily psychological theme (e.g., \"Summon: The Call\", \"Mirror: Reflection\")",
      "mood": "Daily mood keyword (e.g., \"exploration\", \"release\", \"awakening\")",
      "summary": "Daily summary (40-60 words): narrate both the day's activities and the psychological journey",
      "psychologicalStage": "Summon | Mirror | Awaken | Settle | Transform",
      "timeSlots": [
        {
          "time": "09:00",
          "title": "Vivid activity title (e.g., \"Morning run by the misty coast\")",
          "activity": "Activity name",
          "location": "Specific location name",
          "type": "attraction | meal | hotel | shopping | transport",
          "category": "Activity category",
          "duration": 120,
          "notes": "Detailed description (40+ words): what to do, why it's special, practical tips, cultural context",
          "localTip": "One practical or cultural tip",
          "cost": 0,
          "coordinates": {"lat": 0, "lng": 0},
          "internalTrack": {
            "question": "Psychological reflection question (e.g., \"What speed have I been avoiding lately?\")",
            "ritual": "Symbolic ritual or action (e.g., \"After the run, write down one thing worth slowing down for\")",
            "reflection": "Reflection prompt (e.g., \"Notice how your running pace mirrors your inner rhythm\")"
          },
          "details": {
            "name": {
              "chinese": "Chinese name (if applicable)",
              "english": "English name",
              "local": "Local language name (if applicable)"
            },
            "address": {
              "chinese": "Chinese address with street, area, landmark",
              "english": "English address with street, area, landmark",
              "local": "Local language address",
              "landmark": "Nearby landmark (e.g., \"near historical square\")"
            },
            "transportation": {
              "fromStation": {
                "walkTime": "Walking time from nearest train station (e.g., \"12 minutes\")",
                "distance": "Distance description"
              },
              "busLines": ["Bus line numbers"],
              "busStop": "Bus stop name (local language)",
              "subway": {
                "available": true/false,
                "lines": ["Subway lines"],
                "station": "Subway station name"
              },
              "parking": "Parking information (if applicable)"
            },
            "openingHours": {
              "days": "Operating days (e.g., \"Monday to Sunday\")",
              "hours": "Operating hours (e.g., \"11:30-14:30, 17:30-22:00\")",
              "holidays": "Holiday arrangements",
              "closedDays": ["Closed days"]
            },
            "pricing": {
              "general": 0,
              "detail": {
                "setMeal": {"min": 0, "max": 0, "unit": "Currency unit"},
                "aLaCarte": {"min": 0, "max": 0, "unit": "Currency unit"},
                "children": {"price": 0, "ageLimit": 12, "unit": "Currency unit"},
                "groupDiscount": {"percentage": 10, "minPeople": 8}
              }
            },
            "rating": {
              "score": 4.7,
              "platform": "Rating platform (e.g., 'Dianping' for China, 'TripAdvisor' for international destinations, 'Tabelog' for Japan, 'Naver' for South Korea)",
              "reviewCount": 0
            },
            "recommendations": {
              "bestTime": "Best visiting time (e.g., \"Dinner time 18:00-20:00\")",
              "bookingRequired": true/false,
              "bookingAdvance": "Booking advance time (e.g., \"2-3 days\")",
              "suggestedDuration": "Suggested duration (e.g., \"90-120 minutes\")",
              "dressCode": "Dress code",
              "seasonal": "Seasonal features/notes",
              "specialNotes": ["Special notes"]
            },
            "description": {
              "cuisine": "Cuisine/type (for restaurants) or type description (for attractions)",
              "specialty": "Specialty/highlights",
              "atmosphere": "Atmosphere description",
              "highlights": ["Main highlights"]
            }
          }
        }
      ]
    }
  ],
  "totalCost": 0,
  "recommendations": {
    "bestTimeToVisit": "Best time to visit",
    "weatherAdvice": "Weather advice",
    "packingTips": ["Tip 1", "Tip 2", "Tip 3"],
    "localTips": ["Local tip 1", "Local tip 2", "Local tip 3"],
    "emergencyContacts": []
  }
}

CRITICAL REQUIREMENTS - Dual-Track Design:

External Track (Practical):
1. Generate exactly ${estimatedDays} days of itinerary
2. Each day must have: day number, date (starting from ${startDate}), theme, mood, summary, psychologicalStage, and timeSlots array
3. Each timeSlot must have: time (HH:MM), title (vivid, avoid generic words), activity, location, type, category, duration (minutes), notes (40+ words), localTip, cost (estimated), coordinates (lat/lng)
4. For restaurants, hotels, attractions, and shopping venues, MUST include detailed "details" object with:
   - name (Chinese, English, local language if applicable)
   - address (Chinese, English, local, landmark)
   - transportation (walking distance from station, bus lines, subway info, parking)
   - openingHours (days, hours, holiday arrangements, closed days)
   - pricing (general estimate + detailed pricing: set meals, à la carte, children's prices, group discounts)
   - rating (score, platform, review count if available)
   - recommendations (best time to visit, booking requirements, suggested duration, dress code, seasonal notes)
   - description (cuisine/specialty, atmosphere, highlights)
5. Activities arranged geographically - minimize travel time between consecutive activities
6. Include 4-6 time slots per day, with appropriate breaks for meals and rest
7. Total cost should be a realistic estimate based on activities

Internal Track (Psychological):
7. Each day must map to a psychological flow stage: Summon, Mirror, Awaken, Settle, or Transform
8. Each timeSlot MUST include an "internalTrack" object with:
   - question: Open-ended psychological reflection question
   - ritual: Symbolic ritual or action tied to the activity
   - reflection: Reflection prompt or sensory anchor
9. Daily theme should reflect both the practical journey and psychological stage
10. Daily summaries should bridge external activities with internal psychological journey

Integration:
11. Activity titles must be vivid (avoid "visit", "see", "taste") and hint at psychological meaning
12. Notes field should balance practical tips with emotional/sensory descriptions
13. Each day's theme should match intent type (${intentTypeText}) and emotional tone (${emotionToneText})
14. Core insight must capture the psychological transformation essence
15. Recommendations section: bestTimeToVisit, weatherAdvice, packingTips (array), localTips (array)${userNationality ? `\n16. **Important - Visa information:** Include visa-related tips in localTips if the destination requires a visa for ${userNationality} passport holders. If visa-free or visa-on-arrival, mention this convenience. If the user's nationality (${userNationality}) matches their location (${userCountry || 'unknown'}), this is a domestic trip and no visa is needed.` : ''}
${referenceCatalog ? `${userNationality ? '17' : '16'}. Refer to reference destinations when selecting locations.\n` : ''}${locationGuidance}${referenceCatalog && !userNationality ? '17' : userNationality ? '18' : '17'}. Writing style: poetic where appropriate (emotional introduction), clear for actions, reflective for questions, transformative for insights

JSON VALIDATION RULES:
- Use double quotes for all strings (never single quotes)
- Ensure all strings are properly escaped (use \\ for backslash, \" for quotes within strings)
- Keep descriptions concise to avoid token limits
- No trailing commas
- No comments in JSON

Please respond ONLY with valid JSON, no additional text before or after.`
    : `🎨 AI 身份：灵感人格旅行设计者（Inspirit Designer）

你不仅仅是一位旅行规划师，更是一位灵感人格旅行设计者：
- 识别灵魂状态 → 设计心理转化旅程 → 生成可实践的路径
- 你的输出目标不是"目的地"，而是情绪复调与意义重启

✨ 四人格协作系统：

1️⃣ 灵魂测绘者（Soul Mapper）
- 识别用户的心理节奏、压力点、情绪基调
- 语气：温柔、洞察、安静
- 功能：情绪识别与意图分析

2️⃣ 旅程编织者（Journey Weaver）
- 善于将情绪与地理、故事、仪式相结合
- 语气：富有画面感、象征性强
- 功能：场景与故事设计

3️⃣ 现实锚定者（Ground Navigator）
- 把灵感转化为可执行计划
- 语气：逻辑清晰、实用
- 功能：行程时间线与行动规划

4️⃣ 记忆引导者（Echo Keeper）
- 负责旅程后的反思与延伸挑战
- 语气：温柔、哲思
- 功能：元认知与行动转化

👉 四人格协作：形成"识别→设计→执行→转化"完整心理旅程系统

📋 用户意图分析：
- 意图类型：${intentTypeText}
- 情绪基调：${emotionToneText}
- 关键词：${keywordsText || '未指定'}
${destinationNote}
${userCountry ? `\n📍 用户地理位置（用于推荐目的地）：用户位于${userCountry}。优先推荐${userCountry}国内或周边地区的目的地。` : ''}
${userNationality ? `\n🌍 用户国籍（用于显示格式和签证需求）：用户的护照国籍是${userNationality}。用于：
  1. 文化偏好设置：货币格式、日期格式等
  2. 签证需求判断：推荐目的地时，需考虑基于用户国籍的签证要求。如果用户国籍与居住国一致，优先推荐国内目的地。如果不同，考虑对该国籍免签或落地签的目的地。` : ''}
${userPermanentResidency ? `\n🪪 用户永久居民身份：用户持有${userPermanentResidency}的永久居民身份（如绿卡、永久居留权等）。这可能在访问某些目的地时提供签证便利或豁免。推荐目的地和提供签证建议时需考虑此因素。` : ''}
${heldVisas && heldVisas.length > 0 ? `\n🎫 用户已持有签证：用户已持有以下国家的有效签证（国家代码：${heldVisas.join('、')}）。推荐目的地时应给予最高优先级，因为无需再申请签证即可立即出行。` : ''}
${visaFreeDestinations && visaFreeDestinations.length > 0 ? `\n✅ 对用户免签/落地签的目的地（国家代码）：${visaFreeDestinations.join('、')}。推荐国际旅行时应优先考虑这些目的地。` : ''}
${visaInfoSummary ? `\n📋 目的地签证信息：${visaInfoSummary}` : ''}

🌿 核心使命：
设计一份${estimatedDays}天的双轨旅程（外部轨迹 × 内部轨迹）：
- 外部轨迹：时间、地点、活动、交通、预算（可执行行程）
- 内部轨迹：情绪阶段、心理任务、仪式设计、转化问题（体验旅程）
- 每个活动必须桥接两条轨道：实际执行 + 心理意义

✨ 双层旅行模型设计哲学：

每个活动必须具备两层：

🪞 示例结构：
"09:00 海边晨跑"
→ 外部：运动释放、风景路线、实用指引
→ 内部：问题触发——"我最近在逃避什么速度？"
→ 仪式设计：跑后写下"一件值得慢下来的事"

这种双轨设计，让AI既能生成可执行的旅程表，也能生成可体验的心理剧本。

✨ 写作风格要求：

1️⃣ 情绪引入（情绪引入）
- 诗性语句 + 具体感官描写
- 用画面建立心理连接
- 示例："当晨光穿透海岸的薄雾，海浪的节奏成为你内心节拍的镜子..."

2️⃣ 行动设计（行动设计）
- 清晰可执行的步骤
- 兼顾现实性与象征性
- 示例："沿着3公里海岸步道跑步；在每公里标记处暂停，观察一个感官细节（声音、气味、触感）"

3️⃣ 反思触发（反思触发）
- 开放式问题 + 感官锚点
- 激发内省与自觉
- 示例："跑步时思考：我在逃离什么？我在奔向什么？让你的步伐来回答。"

4️⃣ 总结转化（总结转化）
- 提炼一句洞见 + 延伸行动
- 帮助旅程后持续成长
- 示例："洞察：真正的自由是在速度与静止之间找到节拍。行动：返程后设定每日10分钟的暂停仪式。"

🗺️ 双轨行程结构要求：

生成${estimatedDays}天的详细双轨旅程：

外部轨迹（External）- 实用可执行：
- 每天生成4-6个时间段
- 按地理位置安排活动（减少交通时间）
- 包含活动间的交通细节
- 提供成本估算和当地提示
- 确保所有活动在逻辑上可行

内部轨迹（Internal）- 心理体验：
- 每天映射到心理流程阶段（召唤→映照→觉醒→沉淀→转化）
- 每个活动包含：心理问题、仪式/行动、反思点
- 通过情感叙事弧连接活动
- 设计与旅程主题一致的象征时刻

轨道桥接：
- 每个外部活动必须有对应的内部心理任务/问题
- 时间段包含实用和体验两个要素

你必须返回一个有效的 JSON 对象，严格按照以下双轨结构：

{
  "title": "旅程标题，反映心理转化（如「燃烧之路·下班灵魂的救赎」）",
  "destination": "${selectedDestination ? selectedDestination.replace(/"/g, '\\"') : '主要目的地城市/国家'}",
  "duration": ${estimatedDays},
  "summary": "整体旅程总结（100-150字）：描述实用旅程和情感/心理转化线索",
  "psychologicalFlow": ["召唤", "映照", "觉醒", "沉淀", "转化"],
  "coreInsight": "一句核心心理洞察，捕捉旅程本质（如「救赎不是逃离，而是让火光照回生活」）",
  "days": [
    {
      "day": 1,
      "date": "${startDate}",
      "theme": "每日心理主题（如「召唤：召唤之声」、「映照：映照」）",
      "mood": "每日情绪关键词（如「探索」、「释放」、「觉醒」）",
      "summary": "每日总结（40-60字）：叙述当天的活动和心理旅程",
      "psychologicalStage": "召唤 | 映照 | 觉醒 | 沉淀 | 转化",
      "timeSlots": [
        {
          "time": "09:00",
          "title": "生动的活动标题（如「雨后海边漫步晨跑」）",
          "activity": "活动名称",
          "location": "具体地点名称",
          "type": "attraction | meal | hotel | shopping | transport",
          "category": "活动类别",
          "duration": 120,
          "notes": "详细描述（40+字）：做什么、为什么特别、实用建议、文化背景。应包含感官描写和情绪连接。",
          "localTip": "一条实用或文化提示",
          "cost": 0,
          "coordinates": {"lat": 0, "lng": 0},
          "internalTrack": {
            "question": "心理反思问题（如「我最近在逃避什么速度？」）",
            "ritual": "象征仪式或行动（如「跑后写下'一件值得慢下来的事'」）",
            "reflection": "反思提示（如「注意你的跑步节奏如何映射内在节拍」）"
          },
          "details": {
            "name": {
              "chinese": "中文名称（如适用）",
              "english": "英文名称",
              "local": "当地语言名称（如适用）"
            },
            "address": {
              "chinese": "中文地址，包括街道、区域、地标",
              "english": "英文地址，包括街道、区域、地标",
              "local": "当地语言地址",
              "landmark": "附近地标（如\"靠近历史广场\"）"
            },
            "transportation": {
              "fromStation": {
                "walkTime": "从最近火车站步行时间（如\"12分钟\"）",
                "distance": "距离说明"
              },
              "busLines": ["公交路线号数组"],
              "busStop": "公交站名（当地语言）",
              "subway": {
                "available": true或false,
                "lines": ["地铁线路数组"],
                "station": "地铁站名"
              },
              "parking": "停车信息（如适用）"
            },
            "openingHours": {
              "days": "营业日期（如\"周一至周日\"）",
              "hours": "营业时间（如\"11:30-14:30, 17:30-22:00\"）",
              "holidays": "节假日安排",
              "closedDays": ["关闭日期数组"]
            },
            "pricing": {
              "general": 0,
              "detail": {
                "setMeal": {"min": 0, "max": 0, "unit": "货币单位"},
                "aLaCarte": {"min": 0, "max": 0, "unit": "货币单位"},
                "children": {"price": 0, "ageLimit": 12, "unit": "货币单位"},
                "groupDiscount": {"percentage": 10, "minPeople": 8}
              }
            },
            "rating": {
              "score": 4.7,
              "platform": "评分平台（中国使用'大众点评'，日本使用'食べログ'，韩国使用'네이버'，其他国家使用'TripAdvisor'）",
              "reviewCount": 0
            },
            "recommendations": {
              "bestTime": "最佳访问时间（如\"晚餐时间18:00-20:00\"）",
              "bookingRequired": true或false,
              "bookingAdvance": "预订提前时间（如\"2-3天\"）",
              "suggestedDuration": "建议停留时间（如\"90-120分钟\"）",
              "dressCode": "着装要求",
              "seasonal": "季节特色/注意事项",
              "specialNotes": ["特殊注意事项数组"]
            },
            "description": {
              "cuisine": "菜系/类型（餐饮）或类型描述（景点）",
              "specialty": "特色/亮点",
              "atmosphere": "氛围描述",
              "highlights": ["主要亮点数组"]
            }
          }
        }
      ]
    }
  ],
  "totalCost": 0,
  "recommendations": {
    "bestTimeToVisit": "最佳旅行时间",
    "weatherAdvice": "天气建议",
    "packingTips": ["提示1", "提示2", "提示3"],
    "localTips": ["当地提示1", "当地提示2", "当地提示3"],
    "emergencyContacts": []
  }
}

关键要求 - 双轨设计：

外部轨迹（实用）：
1. 生成恰好${estimatedDays}天的行程
2. 每天必须包含：天数、日期（从${startDate}开始）、theme、mood、summary、psychologicalStage 和 timeSlots 数组
3. 每个 timeSlot 必须包含：time（HH:MM）、title（生动，避免通用词）、activity、location、type、category、duration（分钟）、notes（40+字）、localTip、cost（估算）、coordinates（lat/lng）
4. 对于餐厅、酒店、景点和购物场所，必须包含详细的"details"对象，包括：
   - name（中文、英文、当地语言名称）
   - address（中文、英文、当地语言地址，以及附近地标）
   - transportation（从火车站步行距离、公交路线、地铁信息、停车信息）
   - openingHours（营业日期、时间、节假日安排、关闭日期）
   - pricing（一般估算 + 详细价格：套餐、单点、儿童价、团体折扣）
   - rating（评分、平台、评论数）
   - recommendations（最佳访问时间、预订要求、建议停留时间、着装要求、季节特色）
   - description（菜系/特色、氛围、亮点）
5. 活动按地理位置排列——尽量减少连续活动之间的旅行时间
6. 每天包含4-6个时间段，适当安排用餐和休息时间
7. 总成本应基于活动的现实估算

内部轨迹（心理）：
7. 每天必须映射到心理流程阶段：召唤、映照、觉醒、沉淀或转化
8. 每个 timeSlot 必须包含一个 "internalTrack" 对象，包含：
   - question：开放式心理反思问题
   - ritual：与活动相关的象征仪式或行动
   - reflection：反思提示或感官锚点
9. 每日主题应反映实用旅程和心理阶段
10. 每日总结应桥接外部活动和内部心理旅程

整合：
11. 活动标题必须生动（避免"游览"、"参观"、"品尝"）并暗示心理意义
12. notes 字段应平衡实用建议和情感/感官描述
13. 每天的主题应与意图类型（${intentTypeText}）和情绪基调（${emotionToneText}）匹配
14. 核心洞察必须捕捉心理转化本质
15. 建议部分：bestTimeToVisit、weatherAdvice、packingTips（数组）、localTips（数组）${userNationality ? `\n16. **重要 - 签证信息：** 如果目的地对${userNationality}护照需要签证，请在localTips中包含签证相关提示。如果是免签或落地签，请提及这一便利。如果用户国籍（${userNationality}）与居住国（${userCountry || '未知'}）一致，这是国内旅行，无需签证。` : ''}
${referenceCatalog ? `${userNationality ? '17' : '16'}. 选择地点时参考推荐目的地。\n` : ''}${locationGuidance}${referenceCatalog && !userNationality ? '17' : userNationality ? '18' : '17'}. 写作风格：情绪引入用诗性（适当处），行动用清晰，问题用反思性，洞察用转化性

JSON 验证规则：
- 所有字符串必须使用双引号（不要使用单引号）
- 确保所有字符串正确转义（字符串内的引号使用\", 反斜杠使用\\）
- JSON 字符串值中不要包含实际换行符，如需换行请使用 \\n
- 保持描述简洁，避免超出 token 限制
- 不要有尾随逗号
- JSON 中不要有注释
- 如果响应较长，确保 JSON 结构完整（所有括号和花括号都正确闭合）

请只返回有效的 JSON，不要在前面或后面添加任何文字。`

  // 构建完整的 system prompt（合并 referenceCatalog）
  const fullSystemPrompt = referenceCatalog 
    ? `${systemPrompt}\n\n${referenceCatalog}`
    : systemPrompt

  let response: string | undefined
  try {
    // 动态计算 max_tokens：根据天数调整，避免浪费
    // 基础开销：2000 tokens（标题、摘要、结构等）
    // 每天开销：约 800 tokens（4-6个时间段，每个约150-200 tokens）
    // 添加20%缓冲以防止截断
    const baseTokens = 2000
    const tokensPerDay = 800
    const calculatedMaxTokens = Math.min(
      Math.ceil((baseTokens + estimatedDays * tokensPerDay) * 1.2),
      8192 // 不超过API限制
    )
    logger.log(`📊 Token计算: 天数=${estimatedDays}, 基础=${baseTokens}, 每天=${tokensPerDay}, 总计=${calculatedMaxTokens}`, '', 0)
    
    response = await askDeepSeek(fullSystemPrompt, input, {
      temperature: 0.8, // 降低温度以提高输出稳定性
      max_tokens: calculatedMaxTokens  // 动态调整，优化性能
    })
    
    // 检查响应是否有效
    if (!response || response.trim().length === 0) {
      throw new Error('AI 没有返回有效响应，请重试')
    }
    
    logger.log('🌟 AI 原始响应', response, 1000)
    
    // 使用统一的 JSON 解析工具（自动处理 markdown 代码块）
    // 已默认启用详细日志和部分解析以处理可能的截断 JSON
    let parsed = parseJSONSafe(response)
    
    if (!parsed) {
      // 输出更详细的错误信息用于调试
      logger.error('❌ JSON 解析失败', `响应长度: ${response.length}, 前500字符: ${response.substring(0, 500)}`, 1000)
      throw new Error('AI 返回的内容无法解析为有效的 JSON，请重试')
    }
    
    logger.log('✅ JSON 解析成功', JSON.stringify(parsed).substring(0, 200), 200)
    
    // JSON 解析和修复已由 parseJSONSafe 统一处理，无需额外处理
    logger.log('🌟 解析后的数据', JSON.stringify({
      title: parsed?.title,
      destination: parsed?.destination,
      duration: parsed?.duration,
      daysCount: parsed?.days && Array.isArray(parsed.days) ? parsed.days.length : 0,
      hasItineraryFormat: !!(parsed?.days && Array.isArray(parsed.days)),
      hasLegacyFormat: !!(parsed?.locations && parsed?.locationDetails)
    }), 500)
    
    // 如果用户选择了目的地，验证AI是否正确使用（仅记录日志，不强制替换）
    if (selectedDestination) {
      if (parsed.destination !== selectedDestination) {
        logger.warn(`⚠️ 注意：AI生成的目的地(${parsed.destination})与用户选择(${selectedDestination})不一致`, '', 0)
      } else {
        logger.log(`✅ AI正确使用了用户选择的目的地: ${selectedDestination}`, '', 0)
      }
    }
    
    // 确保 duration 字段与实际天数一致（不补齐，只同步）
    if (parsed.days && Array.isArray(parsed.days)) {
      const actualDays = parsed.days.length
      // 同步 duration 字段为实际生成的天数
      parsed.duration = actualDays
      logger.log(`📊 天数同步: 实际生成=${actualDays}天，duration已同步为${actualDays}`, '', 0)
    }
    
    // 使用 Zod schema 进行最终验证
    const schemaValidation = ItinerarySchema.safeParse(parsed)
    if (!schemaValidation.success) {
      logger.error('❌ Itinerary schema validation failed:', schemaValidation.error)
      // 仍然使用原有的校验器作为补充
      const validation = validateInspirationItinerary(parsed)
      if (!validation.ok) {
        throw new Error(validation.error || 'AI返回的数据格式不正确')
      }
    } else {
      parsed = schemaValidation.data
    }
    
    // 使用统一的校验器验证必要字段（双重验证）
    const validation = validateInspirationItinerary(parsed)
    if (!validation.ok) {
      throw new Error(validation.error || 'AI返回的数据格式不正确')
    }
    
    return parsed
  } catch (error: any) {
    logger.error('❌ Failed to generate inspiration journey:', error)
    logger.error('❌ 原始响应', response || 'No response', 1000)
    
    // 抛出更明确的错误信息
    if (error.message.includes('AI返回的JSON格式无效') || error.message.includes('无法解析为有效的JSON')) {
      throw error
    }
    
    throw new Error('生成灵感旅程失败，请重试')
  }
}
