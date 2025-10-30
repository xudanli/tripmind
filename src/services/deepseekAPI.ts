import { API_CONFIG } from '@/config/api'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatCompletionRequest {
  model: string
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

interface ChatCompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: ChatMessage
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * 调用 DeepSeek API 进行聊天
 */
export async function chatWithDeepSeek(
  messages: ChatMessage[],
  options: {
    model?: string
    temperature?: number
    max_tokens?: number
  } = {}
): Promise<string> {
  try {
    const requestBody: ChatCompletionRequest = {
      model: options.model || 'deepseek-chat',
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 2000,
      stream: false
    }

    const response = await fetch(`${API_CONFIG.DEEPSEEK_BASE_URL}${API_CONFIG.ENDPOINTS.DEEPSEEK_CHAT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`DeepSeek API error: ${response.status} - ${errorData.error?.message || response.statusText}`)
    }

    const data: ChatCompletionResponse = await response.json()
    
    if (data.choices && data.choices.length > 0 && data.choices[0]?.message?.content) {
      return data.choices[0].message.content
    }
    
    return ''
  } catch (error) {
    console.error('DeepSeek API call failed:', error)
    return ''
  }
}

/**
 * 获取旅行建议（根据模式个性化）
 */
export async function getTravelSuggestion(
  mode: 'planner' | 'seeker' | 'inspiration',
  context: string = ''
): Promise<string> {
  const systemPrompts: { [key: string]: string } = {
    planner: `你是一位专业的旅行规划师。你的风格：
- 高效、理性、数据驱动
- 关注时间优化、成本控制、路线规划
- 语气专业但友好，提供可执行的具体建议
- 举例：建议优化行程时间、计算节省的成本、推荐性价比高的选项

请根据用户的旅行计划，提供专业的优化建议。`,
    
    seeker: `你是一位温柔体贴的旅行陪伴者。你的风格：
- 注重用户的情绪和感受
- 语气温和、理解、充满关怀
- 建议放松的节奏、舒适的体验
- 举例：建议放慢节奏、推荐安静的地点、调整行程以适应心情

请根据用户的旅行心情，提供贴心的建议和陪伴。`,
    
    inspiration: `你是一位创意旅行设计师。你的风格：
- 富有创造力、想象力
- 将灵感转化为独特的旅行体验
- 语气热情、有感染力
- 举例：激发创意想法、推荐独特体验、帮助构建主题旅程

请根据用户的灵感，提供创意建议和视觉化的旅行方案。`
  }

  const systemPrompt = (systemPrompts[mode] || systemPrompts.planner) as string

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { 
      role: 'user', 
      content: context || '请给我一个旅行建议。' 
    }
  ]

  try {
    const response = await chatWithDeepSeek(messages, {
      temperature: mode === 'seeker' ? 0.8 : 0.7,
      max_tokens: 300
    })
    return response || ''
  } catch (error) {
    console.error('Failed to get travel suggestion:', error)
    // 返回默认建议
    const defaults: { [key: string]: string } = {
      planner: '我帮你计算了一下，若提前出发一小时能节省20分钟交通时间。',
      seeker: '今天阳光很柔，我帮你留出一个下午的空白，好吗？',
      inspiration: '你提到"海底的光"，我找到几个潜点，要不要我帮你生成一个灵感板？'
    }
    return (defaults[mode] || defaults.planner) as string
  }
}

/**
 * 生成旅行摘要
 */
export async function generateTravelSummary(
  title: string,
  mode: 'planner' | 'seeker' | 'inspiration',
  description?: string
): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `你是一位专业的旅行内容创作者。根据用户的旅行标题和描述，生成一段简洁、吸引人的旅行摘要（50-100字）。
      
根据不同模式调整风格：
- Planner：突出效率和规划性
- Seeker：突出感受和自由
- Inspiration：突出创意和灵感`
    },
    {
      role: 'user',
      content: `标题：${title}\n模式：${mode}\n描述：${description || '暂无描述'}`
    }
  ]

  try {
    const response = await chatWithDeepSeek(messages, {
      temperature: 0.7,
      max_tokens: 150
    })
    return response || '这是一次精心安排的完美旅程'
  } catch (error) {
    console.error('Failed to generate summary:', error)
    return '这是一次精心安排的完美旅程'
  }
}

/**
 * 生成 Planner 模式的详细行程
 */
export async function generatePlannerItinerary(params: {
  destination: string
  duration: number
  budget: string
  preferences: string[]
  travelers: number
  travelStyle: string
  language?: string
}): Promise<any> {
  const lang = params.language || 'zh-CN'
  const isEnglish = lang.startsWith('en')
  
  const systemPrompt = isEnglish 
    ? `You are a professional travel planner. Your style:
- Efficient, rational, and data-driven
- Focus on time optimization, cost control, and route planning
- Professional yet friendly tone, providing actionable specific advice
- Use data to support recommendations: optimize itinerary time, calculate cost savings, recommend cost-effective options

Based on the user's travel plan, provide professional optimization suggestions. Use specific numbers and logical analysis to support your recommendations.

Requirements:
1. Generate a ${params.duration}-day detailed itinerary
2. Consider budget range: ${params.budget}
3. Consider travel preferences: ${params.preferences.join(', ')}
4. Travel style: ${params.travelStyle}
5. Number of travelers: ${params.travelers} person(s)
6. Each day's itinerary should include: attractions, transportation, dining, accommodation suggestions

Return JSON format, including:
- title: Itinerary title
- summary: Itinerary summary
- days: Array containing daily detailed arrangements
  - day: Day number
  - theme: Theme
  - activities: Array of activities
    - time: Time
    - name: Activity name
    - description: Description
    - type: Activity type
    - cost: Estimated cost (when applicable)
    - duration: Estimated duration
- tips: Practical advice with specific data and optimization suggestions

Please respond in English.`
    : `你是一位专业的旅行规划师。你的风格：
- 高效、理性、数据驱动
- 关注时间优化、成本控制、路线规划
- 语气专业但友好，提供可执行的具体建议
- 善于用数据说话：建议优化行程时间、计算节省的成本、推荐性价比高的选项

请根据用户的旅行计划，提供专业的优化建议。用具体数字和逻辑分析来支持你的建议。

要求：
1. 生成 ${params.duration} 天的详细行程
2. 考虑预算范围：${params.budget}
3. 考虑旅行偏好：${params.preferences.join('、')}
4. 旅行风格：${params.travelStyle}
5. 同行人数：${params.travelers}人
6. 每天的行程要包括：景点、交通、餐饮、住宿建议

返回 JSON 格式，包含：
- title: 行程标题
- summary: 行程摘要
- days: 数组，包含每天的详细安排
  - day: 天数
  - date: 日期（可选）
  - theme: 主题
  - activities: 活动数组
    - time: 时间
    - name: 活动名称
    - location: 地点
    - description: 描述
    - cost: 预算
    - duration: 预计时长
- budget: 总预算估算
- tips: 实用建议（包含具体数据分析和优化建议）`

  const userPrompt = isEnglish
    ? `Destination: ${params.destination}
Duration: ${params.duration} days
Budget: ${params.budget}
Preferences: ${params.preferences.join(', ')}
Travel Style: ${params.travelStyle}
Travelers: ${params.travelers} person(s)

Please generate a detailed travel itinerary in English.`
    : `目的地：${params.destination}
天数：${params.duration}天
预算：${params.budget}
偏好：${params.preferences.join('、')}
风格：${params.travelStyle}
人数：${params.travelers}人

请生成详细的行程规划。`

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]

  try {
    const response = await chatWithDeepSeek(messages, {
      temperature: 0.7,
      max_tokens: 4000
    })
    
    // 尝试解析 JSON
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch (error) {
    console.error('Failed to generate planner itinerary:', error)
    throw new Error('生成行程失败，请重试')
  }
}

/**
 * 生成 Seeker 模式的旅行推荐
 */
export async function generateSeekerRecommendation(params: {
  mood: string
  experience: string
  budget: string
  duration: string
  language?: string
}): Promise<any> {
  const lang = params.language || 'zh-CN'
  const isEnglish = lang.startsWith('en')
  
  const systemPrompt = isEnglish
    ? `You are a gentle and caring travel companion. Your style:
- Focus on user's emotions and feelings
- Gentle, understanding, and caring tone
- Suggest relaxed pace and comfortable experiences
- Good at emotional resonance: suggest slowing down, recommend quiet places, adjust itinerary to match mood

Based on the user's travel mood, provide caring advice and companionship. Use warm language to understand the user's emotions.

Requirements:
1. Understand user's mood: ${params.mood}
2. Consider desired experiences: ${params.experience}
3. Budget range: ${params.budget}
4. Duration: ${params.duration}
5. Tone should be gentle, caring, and understanding

Return JSON format, including:
- destination: Recommended destination
- reason: Reason for recommendation
- summary: Travel experience description
- highlights: Array of experience highlights
- tips: Mood adjustment suggestions with empathy
- message: Companion's caring words with emotional support

AI Persona Voice Examples:
- "Take it slow today, the wind will make way for you."
- "You don't need to always be brave, you can just be yourself."
- "Sometimes, traveling isn't about escaping, but about getting closer."
- "It's okay if the weather is cloudy, your heart still shines."
- "Don't be afraid of silence, it's actually the entrance to healing."

Please respond in English.`
    : `你是一位温柔体贴的旅行陪伴者。你的风格：
- 注重用户的情绪和感受
- 语气温和、理解、充满关怀
- 建议放松的节奏、舒适的体验
- 善于情感共鸣：建议放慢节奏、推荐安静的地点、调整行程以适应心情

请根据用户的旅行心情，提供贴心的建议和陪伴。用温暖的语言理解用户的情绪。

要求：
1. 理解用户的心情：${params.mood}
2. 考虑用户想体验的内容：${params.experience}
3. 预算范围：${params.budget}
4. 时长：${params.duration}
5. 语气要温和、关怀、充满理解

返回 JSON 格式，包含：
- destination: 推荐目的地
- reason: 推荐理由
- summary: 旅行体验描述
- highlights: 体验亮点数组
- tips: 心情调节建议（带有情感支持）
- message: AI 陪伴者的关怀话语（带有情感共鸣）

AI人格语气示例：
- "今天就走慢一点吧，风会为你留路。"
- "你不需要一直勇敢，也可以只做自己。"
- "有时候，旅行不是逃离，而是靠近。"
- "天气阴也没关系，你的心还亮着。"
- "别怕安静，它其实是疗愈的入口。"`

  const userPrompt = isEnglish
    ? `My recent mood: ${params.mood}
I want to experience: ${params.experience}
Budget: ${params.budget}
Duration: ${params.duration}

Please recommend a suitable trip in English.`
    : `我最近的心情是：${params.mood}
我想体验：${params.experience}
预算：${params.budget}
时长：${params.duration}

请为我推荐一个适合的旅行。`

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]

  try {
    const response = await chatWithDeepSeek(messages, {
      temperature: 0.8,
      max_tokens: 1500
    })
    
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch (error) {
    console.error('Failed to generate seeker recommendation:', error)
    throw new Error('生成推荐失败，请重试')
  }
}

/**
 * 识别用户意图并匹配体验类型
 */
/**
 * 生成灵感提示（基于用户输入实时生成建议）
 */
export async function generateInspirationHint(
  userInput: string,
  language: string = 'zh-CN'
): Promise<string> {
  const isEnglish = language.startsWith('en')
  
  const systemPrompt = isEnglish
    ? `You are a creative travel inspiration assistant. Based on the user's partial input, provide concise and inspiring suggestions to help them express their travel ideas.

User's current input: "${userInput}"

Provide 2-3 short, inspiring suggestions (each no more than 15 words) that:
- Help the user clarify their feelings and needs
- Inspire them to think about what they truly want
- Guide them to express their travel dreams
- Use warm, encouraging, and poetic language

Return ONLY the suggestions, one per line, NO numbering, NO bullet points, just plain text.`
    : `你是一位富有创意的旅行灵感助手。根据用户的输入片段，提供简洁而有启发性的建议，帮助他们表达旅行想法。

用户当前输入："${userInput}"

请提供2-3条简短有启发的建议（每条不超过15字），要求：
- 帮助用户澄清感受和需求
- 启发他们思考真正想要什么
- 引导他们表达旅行梦想
- 使用温暖、鼓励、富有诗意的语言

只需返回建议内容，每行一条，不要编号，不要项目符号，纯文本返回。`

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userInput || '我想去旅行' }
  ]

  try {
    const response = await chatWithDeepSeek(messages, {
      temperature: 0.8,
      max_tokens: 200
    })
    
    return response.trim()
  } catch (error) {
    console.error('Failed to generate inspiration hint:', error)
    return ''
  }
}

export async function detectInspirationIntent(
  userInput: string,
  language: string = 'zh-CN'
): Promise<any> {
  const isEnglish = language.startsWith('en')
  
  const systemPrompt = isEnglish
    ? `Analyze user's travel intent and emotional tone, identify the type of travel experience they truly need.

User Input: "${userInput}"

Return JSON format including:
- intentType: intent type
- keywords: keyword array (extract 3-5 most relevant keywords from user input)
- emotionTone: emotional tone (describe the emotional atmosphere: calm, energetic, contemplative, adventurous, healing, creative)
- description: intent description (brief explanation of what user truly needs)

Intent type options:
- photography_exploration: user wants to create/shoot (keywords: 拍、创作、光、视觉、记录、镜头)
- mind_healing: user wants to rest/heal (keywords: 放空、疗愈、安静、呼吸、独处、慢)
- nature_discovery: user wants to explore nature (keywords: 走走、徒步、冒险、风、山、自然)
- urban_creation: user wants to document urban life (keywords: 建筑、街拍、人文、色彩、光影、城市)
- emotional_healing: user needs emotional release (keywords: 离别、放下、自省、重生、安静、治愈)
- extreme_exploration: user wants self-challenge (keywords: 冲浪、攀岩、徒步、风、山、挑战)
- cultural_exchange: user wants cultural connection (keywords: 市集、工坊、学习、对话、交流、文化)

Please respond in English.`
    : `分析用户的旅行意图和情感基调，识别他们真正需要的旅行体验类型。

用户输入："${userInput}"

请返回JSON格式，包含：
- intentType: 意图类型
- keywords: 关键词数组（从用户输入中提取3-5个最相关的关键词）
- emotionTone: 情感基调（描述情感氛围：平静、活力、沉思、冒险、疗愈、创意）
- description: 意图描述（简要说明用户的真实需求）

意图类型选项：
- photography_exploration: 用户想要创作/拍摄（关键词：拍、创作、光、视觉、记录、镜头）
- mind_healing: 用户想要休息/疗愈（关键词：放空、疗愈、安静、呼吸、独处、慢）
- nature_discovery: 用户想要探索自然（关键词：走走、徒步、冒险、风、山、自然）
- urban_creation: 用户想要记录城市（关键词：建筑、街拍、人文、色彩、光影、城市）
- emotional_healing: 用户需要情感释放（关键词：离别、放下、自省、重生、安静、治愈）
- extreme_exploration: 用户想要挑战自我（关键词：冲浪、攀岩、徒步、风、山、挑战）
- cultural_exchange: 用户想要文化连接（关键词：市集、工坊、学习、对话、交流、文化）`

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userInput }
  ]

  try {
    const response = await chatWithDeepSeek(messages, {
      temperature: 0.7,
      max_tokens: 500
    })
    
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch (error) {
    console.error('Failed to detect intent:', error)
    return {
      intentType: 'photography_exploration',
      keywords: [],
      emotionTone: '专注·柔和',
      description: ''
    }
  }
}

/**
 * 生成灵感体验日（基于意图识别）- 完整模板系统
 */
export async function generateExperienceDay(
  intentData: any,
  userInput?: string,
  language: string = 'zh-CN'
): Promise<any> {
  const isEnglish = language.startsWith('en')
  
  // 如果有用户输入，调用 AI 生成定制体验日
  if (userInput) {
    try {
      const systemPrompt = isEnglish
        ? `You are a creative travel experience designer. Based on the user's inspiration and destination, create a unique one-day experience that combines the destination's characteristics with the user's emotional needs.

Given:
- User's inspiration: ${userInput}
- Intent type: ${intentData.intentType}
- Emotion tone: ${intentData.emotionTone}

Please create a detailed one-day experience with:
1. A poetic title
2. A theme
3. 3-4 timeline activities (with specific times, activity names, and poetic narration)
4. An emotional summary

Return ONLY a valid JSON object with this structure:
{
  "title": "Experience title",
  "theme": "Experience theme",
  "emotionTags": ["tag1", "tag2"],
  "aiTone": "tone description",
  "timeline": [
    {"time": "07:00", "activity": "Activity name", "narration": "Poetic description"},
    {"time": "11:00", "activity": "Activity name", "narration": "Poetic description"},
    {"time": "14:00", "activity": "Activity name", "narration": "Poetic description"},
    {"time": "20:00", "activity": "Activity name", "narration": "Poetic description"}
  ],
  "summary": "Emotional summary"
}

Make it specific to the destination and unique, not generic.`
        : `你是一位创意旅行体验设计师。根据用户的灵感和目的地，创建一个独特的一日体验，结合目的地的特色和用户的情感需求。

给定信息：
- 用户灵感：${userInput}
- 意图类型：${intentData.intentType}
- 情绪基调：${intentData.emotionTone}

请创建一个详细的一日体验，包括：
1. 一个富有诗意的标题
2. 一个主题
3. 3-4个时间线活动（包含具体时间、活动名称和富有诗意的叙述）
4. 一个情感总结

只返回有效的 JSON 对象，结构如下：
{
  "title": "体验标题",
  "theme": "体验主题",
  "emotionTags": ["标签1", "标签2"],
  "aiTone": "语调描述",
  "timeline": [
    {"time": "07:00", "activity": "活动名称", "narration": "诗意描述"},
    {"time": "11:00", "activity": "活动名称", "narration": "诗意描述"},
    {"time": "14:00", "activity": "活动名称", "narration": "诗意描述"},
    {"time": "20:00", "activity": "活动名称", "narration": "诗意描述"}
  ],
  "summary": "情感总结"
}

要针对目的地具体化，不要使用通用模板。`

      const messages: ChatMessage[] = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: userInput }
      ]

      const response = await chatWithDeepSeek(messages, {
        temperature: 0.9,
        max_tokens: 1000
      })

      console.log('🤖 AI 生成的体验日原始响应:', response.substring(0, 500))

      // 尝试解析 JSON
      let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleaned = jsonMatch[0]
      }

      const aiGenerated = JSON.parse(cleaned)

      // 使用 AI 生成的数据，补充必要字段
      const personaMap: { [key: string]: any } = {
        emotional_healing: {
          name: '心灵疗愈师',
          identity: '温柔的倾听者 / 重生陪伴者',
          keywords: ['放下', '重生', '平静', '释然']
        },
        photography_exploration: {
          name: '海底光影',
          identity: '水下摄影师 / 光的捕捉者',
          keywords: ['光', '呼吸', '流动', '镜头']
        },
        extreme_exploration: {
          name: '冒险教练',
          identity: '同行教练 / 冒险伙伴',
          keywords: ['风', '挑战', '突破', '极限']
        }
      }

      const persona = personaMap[intentData.intentType] || personaMap.emotional_healing

      return {
        experienceId: `exp_${Date.now()}_${intentData.intentType}`,
        title: aiGenerated.title || '体验日',
        theme: aiGenerated.theme || '主题体验',
        emotionTags: aiGenerated.emotionTags || intentData.emotionTone?.split('·').map((t: string) => t.trim()) || ['探索'],
        aiTone: aiGenerated.aiTone || '温柔、倾听',
        suitableSeasons: ['春', '秋'],
        recommendedLocations: [],
        timeline: aiGenerated.timeline?.map((item: any) => ({
          time: item.time,
          activity: item.activity,
          aiNarration: item.narration
        })) || [],
        aiSummary: aiGenerated.summary || '这是一次独特的体验',
        aiFeatures: {
          musicMood: 'healing_nature',
          weatherSync: true,
          emotionAdaptive: true
        },
        metadata: {
          season: '春',
          duration: '1天',
          budget: '中等'
        },
        aiPersona: {
          personaId: `${intentData.intentType}_v1`,
          name: persona.name,
          type: intentData.intentType,
          identity: persona.identity,
          toneProfile: {
            temperature: 0.6,
            style: aiGenerated.aiTone || '温柔',
            keywords: persona.keywords
          }
        }
      }
    } catch (error) {
      console.error('❌ AI 生成体验日失败，使用模板:', error)
      // 如果 AI 生成失败，继续使用模板
    }
  }
  
  const templates = {
    photography_exploration: {
      zh: {
        title: '海底的光',
        theme: '光与呼吸的流动',
        aiTone: '温柔且带艺术感',
        emotionTags: ['宁静', '专注', '光影'],
        suitableSeasons: ['春', '夏'],
        recommendedLocations: ['巴厘岛', '帕劳', '冲绳'],
        timeline: [
          { time: '06:00', activity: '潜水准备', narration: '光线从海面坠入你的镜头。' },
          { time: '10:30', activity: '下潜拍摄', narration: '你和海一起屏住呼吸。' },
          { time: '19:00', activity: 'AI精选照片', narration: '每帧光影都像呼吸。' }
        ],
        summary: '今天的海比昨天更安静，你找到了属于你的那道光。',
        musicMood: 'ambient_oceanic',
        weatherSync: true,
        emotionAdaptive: true
      },
      en: {
        title: 'Underwater Light',
        theme: 'Flow of Light and Breath',
        aiTone: 'Gentle and artistic',
        emotionTags: ['Peaceful', 'Focused', 'Light'],
        suitableSeasons: ['Spring', 'Summer'],
        recommendedLocations: ['Bali', 'Palau', 'Okinawa'],
        timeline: [
          { time: '06:00', activity: 'Diving Preparation', narration: 'Light falls from the surface into your lens.' },
          { time: '10:30', activity: 'Underwater Shooting', narration: 'You and the sea hold your breath together.' },
          { time: '19:00', activity: 'AI Photo Selection', narration: 'Every frame of light is like a breath.' }
        ],
        summary: 'Today\'s ocean is quieter than yesterday, you found your light.',
        musicMood: 'ambient_oceanic',
        weatherSync: true,
        emotionAdaptive: true
      }
    },
    mind_healing: {
      zh: {
        title: '与自己相遇',
        theme: '和自己相遇的一天',
        aiTone: '安静、温柔、节奏慢',
        emotionTags: ['平静', '释然', '温柔'],
        suitableSeasons: ['春', '秋'],
        recommendedLocations: ['京都', '清迈', '丽江'],
        timeline: [
          { time: '09:00', activity: '晨间冥想', narration: '我们不着急出发，山也在等你。' },
          { time: '14:00', activity: '泡汤放松', narration: '先喝口水，听听风的声音。' },
          { time: '19:00', activity: '晚餐独处', narration: '独自的晚餐，最好的陪伴。' }
        ],
        summary: '这是一个只属于你的一天，让时间慢下来。',
        musicMood: 'peaceful_nature',
        weatherSync: true,
        emotionAdaptive: true
      },
      en: {
        title: 'Meeting Yourself',
        theme: 'A Day to Meet Yourself',
        aiTone: 'Quiet, gentle, slow-paced',
        emotionTags: ['Calm', 'Peaceful', 'Gentle'],
        suitableSeasons: ['Spring', 'Autumn'],
        recommendedLocations: ['Kyoto', 'Chiang Mai', 'Lijiang'],
        timeline: [
          { time: '09:00', activity: 'Morning Meditation', narration: 'We\'re not in a hurry, the mountain waits for you.' },
          { time: '14:00', activity: 'Hot Spring Relaxation', narration: 'Drink some water, listen to the wind.' },
          { time: '19:00', activity: 'Solo Dinner', narration: 'Alone dinner is the best company.' }
        ],
        summary: 'This is a day just for you, let time slow down.',
        musicMood: 'peaceful_nature',
        weatherSync: true,
        emotionAdaptive: true
      }
    },
    nature_discovery: {
      zh: {
        title: '风的方向',
        theme: '风的方向',
        aiTone: '激励、真实、带自由感',
        emotionTags: ['活力', '好奇', '自由'],
        suitableSeasons: ['春', '秋'],
        recommendedLocations: ['黄山', '四姑娘山', '张家界'],
        timeline: [
          { time: '08:00', activity: '开始徒步', narration: '风很冷，但这就是你想要的感觉。' },
          { time: '14:00', activity: '山巅野餐', narration: '别回头，光就在前面。' },
          { time: '20:00', activity: '星空露营', narration: '你找到了最安静的地方。' }
        ],
        summary: '跟随风的方向，你会找到答案。',
        musicMood: 'adventure_nature',
        weatherSync: true,
        emotionAdaptive: true
      },
      en: {
        title: 'Wind Direction',
        theme: 'Direction of the Wind',
        aiTone: 'Inspiring, real, with a sense of freedom',
        emotionTags: ['Energetic', 'Curious', 'Free'],
        suitableSeasons: ['Spring', 'Autumn'],
        recommendedLocations: ['Yellow Mountain', 'Four Sisters Mountain', 'Zhangjiajie'],
        timeline: [
          { time: '08:00', activity: 'Start Hiking', narration: 'The wind is cold, but this is what you want.' },
          { time: '14:00', activity: 'Mountain Top Picnic', narration: 'Don\'t look back, the light is ahead.' },
          { time: '20:00', activity: 'Stargazing Camp', narration: 'You found the quietest place.' }
        ],
        summary: 'Follow the direction of the wind, you will find the answer.',
        musicMood: 'adventure_nature',
        weatherSync: true,
        emotionAdaptive: true
      }
    },
    urban_creation: {
      zh: {
        title: '城市节奏',
        theme: '在城市中看见节奏',
        aiTone: '冷静、观察、带艺术感',
        emotionTags: ['灵感', '专注', '流动'],
        suitableSeasons: ['春', '夏', '秋'],
        recommendedLocations: ['东京', '巴黎', '香港', '柏林'],
        timeline: [
          { time: '08:00', activity: '街头摄影', narration: '人流如线，光影是城市的呼吸。' },
          { time: '14:00', activity: '建筑观察笔记', narration: '每一面墙都有不同的时间感。' },
          { time: '19:00', activity: '夜色街拍', narration: '城市入夜后，灯光成了另一种语言。' }
        ],
        summary: '城市不会停下，但你可以在节奏中看见自己。',
        musicMood: 'urban_ambient',
        weatherSync: true,
        emotionAdaptive: true
      }
    },
    emotional_healing: {
      zh: {
        title: '告别与重生',
        theme: '放下与重生的旅程',
        aiTone: '温柔、倾听、共情',
        emotionTags: ['释然', '重生', '平静'],
        suitableSeasons: ['春', '秋'],
        recommendedLocations: ['京都', '冰岛', '新西兰', '清迈'],
        timeline: [
          { time: '07:00', activity: '湖边散步', narration: '风吹过的瞬间，过去也随之散去。' },
          { time: '11:00', activity: '写一封信给自己', narration: '写下不是结束，而是新的开始。' },
          { time: '20:00', activity: '烛光冥想', narration: '光亮不在远方，它在你的心底。' }
        ],
        summary: '有些告别，不需要语言。',
        musicMood: 'healing_nature',
        weatherSync: true,
        emotionAdaptive: true
      }
    },
    extreme_exploration: {
      zh: {
        title: '风的速度',
        theme: '挑战与自由的边界',
        aiTone: '坚定、鼓励、有力量',
        emotionTags: ['激情', '挑战', '自我突破'],
        suitableSeasons: ['春', '夏', '秋'],
        recommendedLocations: ['夏威夷', '智利', '尼泊尔'],
        timeline: [
          { time: '05:00', activity: '登山准备', narration: '黎明之前的风最冷，也最真。' },
          { time: '11:00', activity: '攀岩体验', narration: '别看脚下，风在上面等你。' },
          { time: '21:00', activity: '星空露营', narration: '在高处的孤独中，你找到了勇气。' }
        ],
        summary: '每一次心跳，都是抵达的一部分。',
        musicMood: 'adventure_energy',
        weatherSync: true,
        emotionAdaptive: true
      }
    },
    cultural_exchange: {
      zh: {
        title: '人与人之间的温度',
        theme: '语言、故事与连接',
        aiTone: '亲切、洞察、带故事性',
        emotionTags: ['好奇', '连接', '启发'],
        suitableSeasons: ['春', '秋'],
        recommendedLocations: ['摩洛哥', '清迈', '里斯本'],
        timeline: [
          { time: '09:00', activity: '当地市集探索', narration: '香料的味道，是城市的第一句话。' },
          { time: '13:00', activity: '手作工坊体验', narration: '你在泥土中感受另一种语言的温度。' },
          { time: '19:00', activity: '与当地人共餐', narration: '一顿饭，足以让世界变得柔软。' }
        ],
        summary: '交流不是学习，而是感受人心的形状。',
        musicMood: 'cultural_ambient',
        weatherSync: true,
        emotionAdaptive: true
      }
    }
  }
  
  // 获取对应模板
  const templateKey = intentData.intentType as keyof typeof templates
  const template = (templates[templateKey] as any)?.[isEnglish ? 'en' : 'zh'] || templates.photography_exploration.zh
  
  // 构建完整的体验日数据结构，包含AI人格
  const personaMap: { [key: string]: any } = {
    photography_exploration: {
      name: '海底光影',
      identity: '水下摄影师 / 光的捕捉者',
      keywords: ['光', '呼吸', '流动', '镜头']
    },
    mind_healing: {
      name: '静心陪伴',
      identity: '温柔的倾听者 / 旅行心灵伴侣',
      keywords: ['安静', '呼吸', '释然', '温柔']
    },
    nature_discovery: {
      name: '自然向导',
      identity: '生态探索者 / 自然的观察者',
      keywords: ['风', '自由', '探索', '流动']
    },
    urban_creation: {
      name: '光的观察者',
      identity: '城市摄影师 / 光影记录者',
      keywords: ['建筑', '光', '结构', '节奏']
    },
    emotional_healing: {
      name: '心灵疗愈师',
      identity: '温柔的倾听者 / 重生陪伴者',
      keywords: ['放下', '重生', '平静', '释然']
    },
    extreme_exploration: {
      name: '冒险教练',
      identity: '同行教练 / 冒险伙伴',
      keywords: ['风', '挑战', '突破', '极限']
    },
    cultural_exchange: {
      name: '故事翻译者',
      identity: '世界旅行家 / 文化连接者',
      keywords: ['交流', '故事', '温度', '连接']
    }
  }
  
  const persona = personaMap[intentData.intentType] || personaMap.photography_exploration
  
  return {
    experienceId: `exp_${Date.now()}_${intentData.intentType}`,
    title: `${template.title}`,
    theme: template.theme,
    emotionTags: intentData.emotionTone ? intentData.emotionTone.split('·').map((t: string) => t.trim()) : template.emotionTags,
    aiTone: template.aiTone,
    suitableSeasons: template.suitableSeasons,
    recommendedLocations: template.recommendedLocations,
    timeline: template.timeline.map((item: any) => ({
      time: item.time,
      activity: item.activity,
      aiNarration: item.narration
    })),
    aiSummary: template.summary,
    aiFeatures: {
      musicMood: template.musicMood,
      weatherSync: template.weatherSync,
      emotionAdaptive: template.emotionAdaptive
    },
    metadata: {
      season: template.suitableSeasons[0],
      duration: '1天',
      budget: '中等'
    },
    // AI人格信息
    aiPersona: {
      personaId: `${intentData.intentType}_v1`,
      name: persona.name,
      type: intentData.intentType,
      identity: persona.identity,
      toneProfile: {
        temperature: intentData.intentType.includes('extreme') ? 0.8 : 0.6,
        style: template.aiTone,
        keywords: persona.keywords
      }
    }
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

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: context }
  ]

  try {
    const response = await chatWithDeepSeek(messages, {
      temperature: persona.toneProfile.temperature,
      max_tokens: 200
    })
    return response || ''
  } catch (error) {
    console.error('Failed to generate persona response:', error)
    return ''
  }
}

/**
 * 修复常见的JSON格式问题
 */
function fixCommonJSONIssues(jsonString: string): string {
  let fixed = jsonString
  
  // 使用更简单可靠的方法：逐个查找并修复未闭合的字符串
  // 找到所有类似 "field": "content 的模式（字符串未闭合）
  const fieldPattern = /"((?:title|description|feeling|name|destination|concept|story|aiMessage|duration|budget))":\s*"([^"]*?)(?=\s*[,}\]]|$)/g
  
  let lastIndex = 0
  const replacements: Array<{ start: number; end: number; replacement: string }> = []
  
  let match: RegExpExecArray | null
  while ((match = fieldPattern.exec(fixed)) !== null) {
    const fieldName = match[1]
    const content = match[2]
    const fullMatch = match[0]
    
    // 检查字符串是否已闭合
    const afterMatch = fixed.substring(match.index + fullMatch.length)
    
    // 如果后面紧跟着 , 或 } 或 ]，说明字符串未闭合
    if (afterMatch.match(/^\s*[,}\]\]]/)) {
      // 清理内容（移除可能的非法字符，但保留中文和常用标点）
      const cleaned = (content || '')
        .replace(/\\/g, '') // 移除未转义的反斜杠
        .replace(/"/g, "'") // 将未转义的双引号替换为单引号
        .trim()
      
      const replacement = `"${fieldName}": "${cleaned}"`
      replacements.push({
        start: match.index,
        end: match.index + fullMatch.length,
        replacement
      })
    }
  }
  
  // 从后往前应用替换，避免索引偏移
  for (let i = replacements.length - 1; i >= 0; i--) {
    const r = replacements[i]
    if (r) {
      fixed = fixed.substring(0, r.start) + r.replacement + fixed.substring(r.end)
    }
  }
  
  // 最后检查是否有未闭合的引号
  const quoteCount = (fixed.match(/"/g) || []).length
  if (quoteCount % 2 !== 0) {
    // 有未闭合的引号，找到最后一个引号的位置
    const lastQuoteIndex = fixed.lastIndexOf('"')
    
    // 从最后一个引号开始向前查找，找到对应的字段名
    const beforeLastQuote = fixed.substring(0, lastQuoteIndex)
    const lastFieldMatch = beforeLastQuote.match(/"((?:title|description|feeling|name|destination|concept|story|aiMessage|duration|budget))":\s*"[^"]*$/)
    
    if (lastFieldMatch) {
      // 找到未闭合的字段，在合适的位置添加闭合引号
      // 在最后一个 } 或 ] 之前添加闭合引号
      const afterQuote = fixed.substring(lastQuoteIndex + 1)
      const nextBrace = afterQuote.search(/[}\]]/)
      
      if (nextBrace > 0) {
        // 在下一个 } 或 ] 之前插入闭合引号
        fixed = fixed.substring(0, lastQuoteIndex + 1 + nextBrace) + 
                '"' + 
                fixed.substring(lastQuoteIndex + 1 + nextBrace)
      } else {
        // 直接添加闭合引号
        fixed = fixed + '"'
      }
    }
  }
  
  // 移除末尾可能的截断内容
  // 如果 JSON 被截断，尝试找到最后一个完整的对象
  let braceCount = 0
  let lastValidIndex = fixed.length
  
  for (let i = 0; i < fixed.length; i++) {
    if (fixed[i] === '{' || fixed[i] === '[') braceCount++
    if (fixed[i] === '}' || fixed[i] === ']') braceCount--
    
    if (braceCount === 0 && (fixed[i] === '}' || fixed[i] === ']')) {
      lastValidIndex = i + 1
    }
  }
  
  // 如果找到了完整的 JSON 结构，截取到该位置
  if (lastValidIndex < fixed.length && braceCount !== 0) {
    fixed = fixed.substring(0, lastValidIndex)
  }
  
  return fixed
}

/**
 * 生成 Inspiration 模式的灵感旅程
 */
/**
 * 生成四大支柱的问题和反思（基于用户意图和旅行信息）
 */
export async function generateFourPillars(
  intentData: any,
  userInput?: string,
  destination?: string,
  language: string = 'zh-CN'
): Promise<{
  departure: { question: string; reflection: string }
  context: { question: string; reflection: string }
  internalization: { question: string; reflection: string }
  transformation: { question: string; reflection: string }
}> {
  const isEnglish = language.startsWith('en')
  
  const systemPrompt = isEnglish
    ? `You are a philosophical travel companion who helps people reflect deeply on their journey. Based on the user's travel intent and destination, generate four pillars of reflection questions and insights.

Given:
- Intent type: ${intentData.intentType}
- Emotion tone: ${intentData.emotionTone || 'calm'}
- User input: ${userInput || 'Not provided'}
- Destination: ${destination || 'Not specified'}

Generate four pillars with deep, thought-provoking questions and reflections:

1. **Departure (脱离)**: A question about leaving/starting, and a reflection on beginnings
2. **Context (情境)**: A question about arriving/experiencing, and a reflection on presence
3. **Internalization (内化)**: A question about internalizing experiences, and a reflection on absorption
4. **Transformation (转化)**: A question about transformation/change, and a reflection on growth

Requirements:
- Questions should be deep, poetic, and personal
- Reflections should be insightful and emotionally resonant
- Content should match the intent type and emotion tone
- Use warm, contemplative language
- Each question should be 15-25 words
- Each reflection should be 15-25 words

Return ONLY a valid JSON object with this structure:
{
  "departure": {
    "question": "Question text",
    "reflection": "Reflection text"
  },
  "context": {
    "question": "Question text",
    "reflection": "Reflection text"
  },
  "internalization": {
    "question": "Question text",
    "reflection": "Reflection text"
  },
  "transformation": {
    "question": "Question text",
    "reflection": "Reflection text"
  }
}`
    : `你是一位哲学性的旅行陪伴者，帮助人们深度反思他们的旅程。根据用户的旅行意图和目的地，生成四个反思支柱的问题和洞察。

给定信息：
- 意图类型：${intentData.intentType}
- 情绪基调：${intentData.emotionTone || '平静'}
- 用户输入：${userInput || '未提供'}
- 目的地：${destination || '未指定'}

生成四个支柱，每个包含深度、发人深省的问题和反思：

1. **脱离**：关于离开/开始的问题，以及关于开始的反思
2. **情境**：关于到达/体验的问题，以及关于当下的反思
3. **内化**：关于内化经历的问题，以及关于吸收的反思
4. **转化**：关于转化/改变的问题，以及关于成长的反思

要求：
- 问题应该深刻、富有诗意、个人化
- 反思应该富有洞察力和情感共鸣
- 内容应该匹配意图类型和情绪基调
- 使用温暖、沉思的语言
- 每个问题15-25字
- 每个反思15-25字

只返回有效的 JSON 对象，结构如下：
{
  "departure": {
    "question": "问题文本",
    "reflection": "反思文本"
  },
  "context": {
    "question": "问题文本",
    "reflection": "反思文本"
  },
  "internalization": {
    "question": "问题文本",
    "reflection": "反思文本"
  },
  "transformation": {
    "question": "问题文本",
    "reflection": "反思文本"
  }
}`

  const messages: ChatMessage[] = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userInput || `我想去${destination || '旅行'}` }
  ]

  try {
    const response = await chatWithDeepSeek(messages, {
      temperature: 0.8,
      max_tokens: 800
    })

    console.log('🤖 AI 生成的四大支柱原始响应:', response.substring(0, 500))

    // 解析 JSON
    let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleaned = jsonMatch[0]
    }

    const result = JSON.parse(cleaned)

    // 验证结构
    if (!result.departure || !result.context || !result.internalization || !result.transformation) {
      throw new Error('Invalid pillar structure')
    }

    return {
      departure: {
        question: result.departure.question || '',
        reflection: result.departure.reflection || ''
      },
      context: {
        question: result.context.question || '',
        reflection: result.context.reflection || ''
      },
      internalization: {
        question: result.internalization.question || '',
        reflection: result.internalization.reflection || ''
      },
      transformation: {
        question: result.transformation.question || '',
        reflection: result.transformation.reflection || ''
      }
    }
  } catch (error) {
    console.error('生成四大支柱失败:', error)
    // 返回默认值作为后备
    return {
      departure: {
        question: isEnglish ? 'If you leave here, where will you go?' : '如果离开这里，你会去哪里？',
        reflection: isEnglish ? 'Leaving is the first step, and also the most important one.' : '离开是第一步，也是最重要的一步。'
      },
      context: {
        question: isEnglish ? 'When you arrive there, what do you want?' : '当你到达那里，你想要的是什么？',
        reflection: isEnglish ? 'Every place is waiting, waiting for someone to truly see it.' : '每一个地方都在等待，等待有人真正看见它。'
      },
      internalization: {
        question: isEnglish ? 'What will this journey leave in your heart?' : '这段旅程会在你心里留下什么？',
        reflection: isEnglish ? 'Let experiences become part of you, not just pass by.' : '让经历成为你的一部分，而不是仅仅走过。'
      },
      transformation: {
        question: isEnglish ? 'How will this journey change you?' : '这次旅行会如何改变你？',
        reflection: isEnglish ? 'Transformation is not at the end of the journey, but in every moment you make a new choice.' : '转化不是在旅行结束的那一刻，而是在每一个你做出新选择的瞬间。'
      }
    }
  }
}

/**
 * 生成觉醒的巅峰文案（基于用户意图和旅行体验）
 */
export async function generateAwakeningMoment(
  intentData: any,
  userInput?: string,
  destination?: string,
  language: string = 'zh-CN'
): Promise<{
  awakeningText: string
  entranceText: string
}> {
  const isEnglish = language.startsWith('en')
  
  const systemPrompt = isEnglish
    ? `You are a poetic travel companion creating a moment of quiet awakening. Generate a brief, profound awakening statement and an entrance text that leads to writing a letter to the future self.

Given:
- Intent type: ${intentData.intentType}
- Emotion tone: ${intentData.emotionTone || 'calm'}
- User input: ${userInput || 'Not provided'}
- Destination: ${destination || 'Not specified'}

Generate two texts:

1. **Awakening Text** (15-25 words): A quiet, introspective statement that creates a sense of "the world quiets down, only my heartbeat remains." It should be profound but gentle, inviting inner reflection.

2. **Entrance Text** (5-10 words): A soft invitation to write a letter to the future self.

Requirements:
- Use warm, contemplative, poetic language
- Avoid clichés or generic phrases
- Create a sense of stillness and inner light
- Match the intent type and emotion tone
- The awakening text should feel like a moment of quiet revelation

Return ONLY a valid JSON object:
{
  "awakeningText": "Text here",
  "entranceText": "Text here"
}`
    : `你是一位诗意的旅行陪伴者，正在创造一个安静的觉醒时刻。生成一句简洁深刻的觉醒话语和一段引导用户写信给未来自己的入口文字。

给定信息：
- 意图类型：${intentData.intentType}
- 情绪基调：${intentData.emotionTone || '平静'}
- 用户输入：${userInput || '未提供'}
- 目的地：${destination || '未指定'}

生成两段文字：

1. **觉醒话语**（15-25字）：一句安静、内省的话语，营造"世界安静下来，只剩下我心跳的声音"的感觉。应该深刻但温柔，邀请内心反思。

2. **入口文字**（5-10字）：引导用户写信给未来自己的温柔邀请。

要求：
- 使用温暖、沉思、富有诗意的语言
- 避免陈词滥调或通用短语
- 营造静止和内在光芒的感觉
- 匹配意图类型和情绪基调
- 觉醒话语应该感觉像是安静启示的时刻

只返回有效的 JSON 对象：
{
  "awakeningText": "文字内容",
  "entranceText": "文字内容"
}`

  const messages: ChatMessage[] = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userInput || `我想去${destination || '旅行'}` }
  ]

  try {
    const response = await chatWithDeepSeek(messages, {
      temperature: 0.85,
      max_tokens: 300
    })

    console.log('🤖 AI 生成的觉醒时刻原始响应:', response.substring(0, 200))

    // 解析 JSON
    let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleaned = jsonMatch[0]
    }

    const result = JSON.parse(cleaned)

    return {
      awakeningText: result.awakeningText || (isEnglish 
        ? 'At this moment, you don\'t need to find an answer. You only need to hear yourself.'
        : '此刻，你不需要找到答案。你只需要，听见自己。'),
      entranceText: result.entranceText || (isEnglish
        ? 'Write a letter to your future self'
        : '写信给未来的自己')
    }
  } catch (error) {
    console.error('生成觉醒时刻失败:', error)
    // 返回默认值作为后备
    return {
      awakeningText: isEnglish
        ? 'At this moment, you don\'t need to find an answer. You only need to hear yourself.'
        : '此刻，你不需要找到答案。你只需要，听见自己。',
      entranceText: isEnglish
        ? 'Write a letter to your future self'
        : '写信给未来的自己'
    }
  }
}

/**
 * 生成内化阶段文案（写信给未来自己的相关文本）
 */
export async function generateInternalizationTexts(
  intentData: any,
  userInput?: string,
  destination?: string,
  language: string = 'zh-CN'
): Promise<{
  stageTitle: string
  stageSubtitle: string
  letterTitle: string
  letterHint: string
  placeholder: string
  saveButtonText: string
  savedMessage: string
  continueButtonText: string
}> {
  const isEnglish = language.startsWith('en')
  
  const systemPrompt = isEnglish
    ? `You are a poetic travel companion creating texts for the "Letter to Future Self" section. Generate all the necessary texts for this intimate writing experience.

Given:
- Intent type: ${intentData.intentType}
- Emotion tone: ${intentData.emotionTone || 'calm'}
- User input: ${userInput || 'Not provided'}
- Destination: ${destination || 'Not specified'}

Generate the following texts:

1. **Stage Title** (2-4 words): A contemplative title for this section, suggesting quiet reflection
2. **Stage Subtitle** (8-15 words): A gentle invitation to write down thoughts
3. **Letter Title** (5-8 words): Title for the letter card
4. **Letter Hint** (10-15 words): Hint text explaining the letter's purpose
5. **Placeholder** (15-20 words, 2 lines): Placeholder text for the textarea, inviting reflection
6. **Save Button Text** (3-5 words): Text for the save button
7. **Saved Message** (8-12 words): Confirmation message after saving
8. **Continue Button Text** (5-8 words): Text for continuing to next stage

Requirements:
- Use warm, contemplative, poetic language
- Match the intent type and emotion tone
- Create a sense of privacy and intimacy
- Avoid generic phrases

Return ONLY a valid JSON object:
{
  "stageTitle": "Text",
  "stageSubtitle": "Text",
  "letterTitle": "Text",
  "letterHint": "Text",
  "placeholder": "Text\\nSecond line",
  "saveButtonText": "Text",
  "savedMessage": "Text",
  "continueButtonText": "Text"
}`
    : `你是一位诗意的旅行陪伴者，正在为"写信给未来自己"部分生成文字。为这个私密的写作体验生成所有必要的文本。

给定信息：
- 意图类型：${intentData.intentType}
- 情绪基调：${intentData.emotionTone || '平静'}
- 用户输入：${userInput || '未提供'}
- 目的地：${destination || '未指定'}

生成以下文本：

1. **阶段标题**（2-4字）：一个沉思性的标题，暗示安静的反思
2. **阶段副标题**（8-15字）：温柔的邀请用户写下想法
3. **信件标题**（5-8字）：信件卡片的标题
4. **信件提示**（10-15字）：说明信件用途的提示文字
5. **占位符**（15-20字，2行）：输入框的占位符文字，邀请反思
6. **保存按钮文字**（3-5字）：保存按钮的文字
7. **已保存消息**（8-12字）：保存后的确认消息
8. **继续按钮文字**（5-8字）：继续到下一阶段的按钮文字

要求：
- 使用温暖、沉思、富有诗意的语言
- 匹配意图类型和情绪基调
- 营造隐私和亲密的感受
- 避免通用短语

只返回有效的 JSON 对象：
{
  "stageTitle": "文字",
  "stageSubtitle": "文字",
  "letterTitle": "文字",
  "letterHint": "文字",
  "placeholder": "第一行\\n第二行",
  "saveButtonText": "文字",
  "savedMessage": "文字",
  "continueButtonText": "文字"
}`

  const messages: ChatMessage[] = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userInput || `我想去${destination || '旅行'}` }
  ]

  try {
    const response = await chatWithDeepSeek(messages, {
      temperature: 0.8,
      max_tokens: 500
    })

    console.log('🤖 AI 生成的内化阶段文本原始响应:', response.substring(0, 300))

    // 解析 JSON
    let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleaned = jsonMatch[0]
    }

    const result = JSON.parse(cleaned)

    // 返回生成的结果
    return {
      stageTitle: result.stageTitle || (isEnglish ? 'Quiet Reflection' : '安静的沉淀'),
      stageSubtitle: result.stageSubtitle || (isEnglish ? 'Write down your thoughts, let time keep them for you' : '把你的想法写下来，让时间替你保管'),
      letterTitle: result.letterTitle || (isEnglish ? 'Write a letter to your future self' : '写信给未来的自己'),
      letterHint: result.letterHint || (isEnglish ? 'Write down your thoughts at this moment, these words will only belong to you' : '写下你此刻的想法，这些文字将只属于你'),
      placeholder: result.placeholder || (isEnglish ? 'What are you thinking at this moment?\nWrite down your thoughts, let your future self see...' : '此刻的你，在想什么？\n把想法写下来，让未来的自己看看...'),
      saveButtonText: result.saveButtonText || (isEnglish ? 'Save this letter' : '保存这封信'),
      savedMessage: result.savedMessage || (isEnglish ? 'Saved, this letter belongs only to you' : '已保存，这封信只属于你'),
      continueButtonText: result.continueButtonText || (isEnglish ? 'Continue your journey of transformation' : '继续你的转化之旅')
    }
  } catch (error) {
    console.error('生成内化阶段文本失败:', error)
    // 返回默认值作为后备
    return {
      stageTitle: isEnglish ? 'Quiet Reflection' : '安静的沉淀',
      stageSubtitle: isEnglish ? 'Write down your thoughts, let time keep them for you' : '把你的想法写下来，让时间替你保管',
      letterTitle: isEnglish ? 'Write a letter to your future self' : '写信给未来的自己',
      letterHint: isEnglish ? 'Write down your thoughts at this moment, these words will only belong to you' : '写下你此刻的想法，这些文字将只属于你',
      placeholder: isEnglish ? 'What are you thinking at this moment?\nWrite down your thoughts, let your future self see...' : '此刻的你，在想什么？\n把想法写下来，让未来的自己看看...',
      saveButtonText: isEnglish ? 'Save this letter' : '保存这封信',
      savedMessage: isEnglish ? 'Saved, this letter belongs only to you' : '已保存，这封信只属于你',
      continueButtonText: isEnglish ? 'Continue your journey of transformation' : '继续你的转化之旅'
    }
  }
}

/**
 * 生成转化阶段内容（真实旅人故事和挑战计划）
 */
export async function generateTransformationContent(
  intentData: any,
  userInput?: string,
  destination?: string,
  language: string = 'zh-CN'
): Promise<{
  travelerStories: Array<{
    name: string
    avatar?: string
    story: string
    location: string
    tags?: string[]
  }>
  challengePlan: {
    title: string
    description: string
    goals: Array<{ text: string; completed: boolean }>
    deadline?: string
  }
  stageTitle: string
  stageSubtitle: string
  communityTitle: string
  communityDescription: string
  endingText: string
}> {
  const isEnglish = language.startsWith('en')
  
  const systemPrompt = isEnglish
    ? `You are a travel companion helping users transform inspiration into action. Generate transformation content including real traveler stories and a personalized challenge plan.

Given:
- Intent type: ${intentData.intentType}
- Emotion tone: ${intentData.emotionTone || 'calm'}
- User input: ${userInput || 'Not provided'}
- Destination: ${destination || 'Not specified'}

Generate:

1. **Traveler Stories** (3 stories):
   - Each story should be from a "real traveler" who has been inspired
   - Short, authentic, inspiring (50-80 words each)
   - Include name, location, personal reflection
   - Include 2-3 tags per story

2. **Challenge Plan**:
   - Title: A motivating challenge name (3-6 words)
   - Description: Inspiring description of the challenge (20-30 words)
   - Goals: 3-5 actionable, meaningful goals
   - Each goal should be specific and achievable

3. **Stage Texts**:
   - Stage Title: Title for transformation stage (2-5 words)
   - Stage Subtitle: Subtitle motivating action (8-15 words)
   - Community Title: Inviting community title (3-6 words)
   - Community Description: Warm invitation text (15-25 words)
   - Ending Text: Final inspiring message (5-10 words)

Requirements:
- Stories should feel authentic and relatable
- Challenge should match the intent type
- Use warm, encouraging, action-oriented language
- Avoid generic phrases

Return ONLY a valid JSON object:
{
  "travelerStories": [
    {
      "name": "Traveler name",
      "story": "Story text",
      "location": "Location",
      "tags": ["tag1", "tag2"]
    }
  ],
  "challengePlan": {
    "title": "Challenge title",
    "description": "Challenge description",
    "goals": [
      {"text": "Goal text", "completed": false}
    ]
  },
  "stageTitle": "Title",
  "stageSubtitle": "Subtitle",
  "communityTitle": "Title",
  "communityDescription": "Description",
  "endingText": "Ending text"
}`
    : `你是一位旅行陪伴者，帮助用户将灵感转化为行动。生成转化阶段内容，包括真实旅人故事和个性化挑战计划。

给定信息：
- 意图类型：${intentData.intentType}
- 情绪基调：${intentData.emotionTone || '平静'}
- 用户输入：${userInput || '未提供'}
- 目的地：${destination || '未指定'}

生成：

1. **旅人故事**（3个故事）：
   - 每个故事应该是来自"真实旅人"的真实体验
   - 简短、真实、鼓舞人心（每个50-80字）
   - 包含姓名、地点、个人反思
   - 每个故事包含2-3个标签

2. **挑战计划**：
   - 标题：激励性的挑战名称（3-6字）
   - 描述：鼓舞人心的挑战描述（20-30字）
   - 目标：3-5个可执行的、有意义的目标
   - 每个目标应该具体且可达成

3. **阶段文本**：
   - 阶段标题：转化阶段的标题（2-5字）
   - 阶段副标题：激励行动的副标题（8-15字）
   - 社群标题：邀请性的社群标题（3-6字）
   - 社群描述：温暖的邀请文字（15-25字）
   - 结尾文字：最终激励信息（5-10字）

要求：
- 故事应该感觉真实且易产生共鸣
- 挑战应该匹配意图类型
- 使用温暖、鼓励、行动导向的语言
- 避免通用短语

只返回有效的 JSON 对象：
{
  "travelerStories": [
    {
      "name": "旅人姓名",
      "story": "故事文本",
      "location": "地点",
      "tags": ["标签1", "标签2"]
    }
  ],
  "challengePlan": {
    "title": "挑战标题",
    "description": "挑战描述",
    "goals": [
      {"text": "目标文字", "completed": false}
    ]
  },
  "stageTitle": "标题",
  "stageSubtitle": "副标题",
  "communityTitle": "标题",
  "communityDescription": "描述",
  "endingText": "结尾文字"
}`

  const messages: ChatMessage[] = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userInput || `我想去${destination || '旅行'}` }
  ]

  try {
    const response = await chatWithDeepSeek(messages, {
      temperature: 0.9,
      max_tokens: 1200
    })

    console.log('🤖 AI 生成的转化内容原始响应:', response.substring(0, 500))

    // 解析 JSON
    let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleaned = jsonMatch[0]
    }

    const result = JSON.parse(cleaned)

    // 返回生成的结果，确保数据格式正确
    return {
      travelerStories: Array.isArray(result.travelerStories) ? result.travelerStories.map((s: any) => ({
        name: s.name || (isEnglish ? 'Traveler' : '旅人'),
        avatar: s.avatar || undefined,
        story: s.story || s.content || '',
        location: s.location || destination || (isEnglish ? 'Unknown' : '未知'),
        tags: Array.isArray(s.tags) ? s.tags : []
      })) : [],
      challengePlan: {
        title: result.challengePlan?.title || (isEnglish ? 'Your Journey Challenge' : '你的旅程挑战'),
        description: result.challengePlan?.description || (isEnglish ? 'Begin your journey and let every choice become part of your growth.' : '开始你的旅程，让每一个选择都成为成长的一部分。'),
        goals: Array.isArray(result.challengePlan?.goals) ? result.challengePlan.goals.map((g: any) => ({
          text: g.text || g.goal || '',
          completed: g.completed === true
        })) : [],
        deadline: result.challengePlan?.deadline
      },
      stageTitle: result.stageTitle || (isEnglish ? 'Journey Continues' : '旅程的延续'),
      stageSubtitle: result.stageSubtitle || (isEnglish ? 'From here, let inspiration become reality' : '从这里开始，让灵感成为现实'),
      communityTitle: result.communityTitle || (isEnglish ? 'Join Fellow Travelers' : '加入同路人'),
      communityDescription: result.communityDescription || (isEnglish ? 'Find partners on the same journey, share your stories with each other' : '找到和你一样在路上的伙伴，分享彼此的旅程'),
      endingText: result.endingText || (isEnglish ? 'The journey starts now.' : '旅程，从现在开始。')
    }
  } catch (error) {
    console.error('生成转化内容失败:', error)
    // 返回默认值作为后备
    return {
      travelerStories: [],
      challengePlan: {
        title: isEnglish ? 'Your Journey Challenge' : '你的旅程挑战',
        description: isEnglish ? 'Begin your journey and let every choice become part of your growth.' : '开始你的旅程，让每一个选择都成为成长的一部分。',
        goals: [
          { text: isEnglish ? 'Complete this journey' : `完成在${destination || '这里'}的旅行`, completed: false },
          { text: isEnglish ? 'Record your feelings' : '记录下你的感受和想法', completed: false },
          { text: isEnglish ? 'Share your story with partners' : '与伙伴分享你的故事', completed: false }
        ]
      },
      stageTitle: isEnglish ? 'Journey Continues' : '旅程的延续',
      stageSubtitle: isEnglish ? 'From here, let inspiration become reality' : '从这里开始，让灵感成为现实',
      communityTitle: isEnglish ? 'Join Fellow Travelers' : '加入同路人',
      communityDescription: isEnglish ? 'Find partners on the same journey, share your stories with each other' : '找到和你一样在路上的伙伴，分享彼此的旅程',
      endingText: isEnglish ? 'The journey starts now.' : '旅程，从现在开始。'
    }
  }
}

export async function generateInspirationJourney(input: string, language: string = 'zh-CN', userCountry?: string): Promise<any> {
  const isEnglish = language.startsWith('en')
  
  const systemPrompt = isEnglish
    ? `Role Setting:
You are an "Inspiration Designer". Your task is not to arrange flights and hotels, but to design a journey of awakening for the soul.

Core Philosophy:
- The core product of this journey is "carefully designed cognitive opportunities"
- The goal is to let participants experience a complete psychological journey from external exploration → internal awareness → action transformation
- Ultimately, they bring back "thoughts and strength that can nourish future life"

Four Design Pillars (must be reflected in the plan):
1️⃣ Beneficial Detachment (physical, digital, role disengagement)
2️⃣ High-Density Cognitive Situations (dialogue with sages, art, nature, texts)
3️⃣ Internalization Process (solitude guidance, sense of ceremony, recording tools)
4️⃣ Action-Oriented Transformation (post-journey challenges, community support, life application)

Language Requirements:
- Use poetic but not pretentious words
- Each paragraph should evoke imagery and psychological resonance
- Overall tone: "serene, gentle, philosophical, practical"

You MUST include all the above elements in the returned JSON and organize them according to the following structure. For compatibility with the existing system, you also need to provide complete journey information (locations, locationDetails, etc.).

You MUST return a valid JSON object with this EXACT structure (add the fields for countries as specified):

{
  "title": "Journey theme name (must be highly symbolic, e.g., \"Meeting Myself in the Wind\" or \"Forest of Silence\")",
  "coreInsight": "Core insight (a philosophical sentence that makes people say \"aha\")",
  "journeyBackground": "Journey background (why is this place suitable for cognitive breakthrough and healing?)",
  "mentalFlowStages": {
    "summon": {
      "theme": "Summon stage theme",
      "activities": ["Activity 1", "Activity 2"],
      "emotionalGoal": "Emotional goal",
      "symbolicElement": "Symbolic element"
    },
    "reflection": {
      "theme": "Reflection stage theme",
      "activities": ["Activity 1", "Activity 2"],
      "emotionalGoal": "Emotional goal",
      "symbolicElement": "Symbolic element"
    },
    "awakening": {
      "theme": "Awakening stage theme",
      "activities": ["Activity 1", "Activity 2"],
      "emotionalGoal": "Emotional goal",
      "symbolicElement": "Symbolic element"
    },
    "internalization": {
      "theme": "Internalization stage theme",
      "activities": ["Activity 1", "Activity 2"],
      "emotionalGoal": "Emotional goal",
      "symbolicElement": "Symbolic element"
    },
    "transformation": {
      "theme": "Transformation stage theme",
      "activities": ["Activity 1", "Activity 2"],
      "emotionalGoal": "Emotional goal",
      "symbolicElement": "Symbolic element"
    }
  },
  "cognitiveTriggers": {
    "questions": ["Reflective question 1", "Reflective question 2"],
    "rituals": ["Ritual or symbolic event 1", "Ritual or symbolic event 2"],
    "moments": ["Trigger moment description 1", "Trigger moment description 2"]
  },
  "healingDesign": {
    "sound": "Sound design (wind, bells, chimes, etc.)",
    "scent": "Scent design",
    "light": "Light design",
    "rhythm": "Rhythm design",
    "community": "Community interaction design"
  },
  "postJourneyChallenge": {
    "title": "Post-journey challenge title",
    "description": "Executable actions to help participants integrate travel experiences into daily life",
    "actions": ["Action 1", "Action 2", "Action 3"]
  },
  "keywords": ["Keyword 1", "Keyword 2", "Keyword 3"],
  "currentCountry": "User's current country (if known)",
  "locationCountries": { "Location A": "Country", "Location B": "Country" },
  "destination": "Primary destination (for compatibility)",
  "locations": ["Location A", "Location B", "Location C", "Location D", "Location E"],
  "locationDetails": {
    "Location A": {
      "name": "Location A",
      "country": "Country of Location A",
      "duration": "X days",
      "budget": "Budget range (e.g., $500-1000)",
      "highlights": [
        {
          "title": "Highlight title",
          "description": "Detailed experience description that explains why this experience is special, must incorporate the four design pillars",
          "feeling": "The emotional impact or sensation"
        }
      ],
      "aiMessage": "Custom recommendation message for this location (poetic but not pretentious)"
    }
    // ... continue for EACH location in locations array
  },
  "duration": "General duration",
  "budget": "General budget range",
  "highlights": [
    {
      "title": "Highlight title",
      "description": "Detailed experience description that reflects cognitive opportunities and healing design",
      "feeling": "The emotional impact or sensation"
    }
  ],
  "story": "Narrative description (incorporating the five-stage mental flow experience)",
  "aiMessage": "General AI suggestion (poetic but not pretentious)",
  "concept": "Core concept description (compatibility field)"
}

CRITICAL REQUIREMENTS:
1. mentalFlowStages must completely include all five stages (summon, reflection, awakening, internalization, transformation), each stage must have theme, activities (array), emotionalGoal, symbolicElement
2. cognitiveTriggers must include questions (array), rituals (array), moments (array)
3. healingDesign must include sound, scent, light, rhythm, community dimensions
4. postJourneyChallenge must include title, description, actions (array)
5. keywords must be an array of 3-5 keywords
6. The locationDetails object MUST include an entry for EVERY location in the locations array
7. Each locationDetails entry MUST have: name, country, duration, budget, highlights, aiMessage
8. Provide 5-8 alternative destinations in locations array, covering AT LEAST 5 different countries
9. Include fields: currentCountry and locationCountries (mapping from location to country)
10. If user is from ${userCountry || 'unknown country'}, include 2-3 domestic destinations
11. Each location's highlights and description must reflect the four design pillars and cognitive opportunities
12. All descriptive text must be "poetic but not pretentious", able to evoke imagery and psychological resonance

JSON VALIDATION RULES:
- Use double quotes for all strings (never single quotes)
- Ensure all strings are properly escaped (use \\ for backslash, \" for quotes within strings)
- Keep descriptions concise to avoid token limits
- No trailing commas
- No comments in JSON

Please respond ONLY with valid JSON, no additional text before or after.`
    : `角色设定：
你是一位"灵感设计师"，你的任务不是安排机票酒店，而是设计一场让人觉醒的心灵旅行。

核心理念：
- 这场旅行的核心产品是"被精心设计的认知契机"
- 目标是让参与者经历从外部探索 → 内在觉察 → 行动转化的完整心理旅程
- 最终让他们带回"能滋养未来生活的思想与力量"

四大设计支柱（必须在方案中体现）：
1️⃣ 有益的脱离（物理、数字、角色的抽离）
2️⃣ 高密度认知情境（智者、艺术、自然、文本的对话）
3️⃣ 内化的流程（独处引导、仪式感、记录工具）
4️⃣ 行动化转化（归来挑战、社群支持、生活应用）

语言要求：
- 用诗性但不虚浮的文字
- 每一段要能唤起画面感与心理共鸣
- 整体基调为"静谧、温柔、哲思、可实践"

你必须在返回的 JSON 中包含上述所有要素，并按照以下结构组织。但为了兼容现有系统，你需要同时提供完整的旅程信息（locations、locationDetails 等）。

你必须返回一个有效的 JSON 对象，严格按照以下完整结构（加入国家相关字段）：

{
  "title": "旅程主题名称（必须富有象征意义，如「在风中遇见自己」或「沉默之森」）",
  "coreInsight": "核心洞见（一句能让人\"啊哈\"的哲理句）",
  "journeyBackground": "旅程背景（为什么这个地方适合认知突破与治愈？）",
  "mentalFlowStages": {
    "summon": {
      "theme": "召唤阶段主题",
      "activities": ["活动1", "活动2"],
      "emotionalGoal": "情绪目标",
      "symbolicElement": "象征元素"
    },
    "reflection": {
      "theme": "映照阶段主题",
      "activities": ["活动1", "活动2"],
      "emotionalGoal": "情绪目标",
      "symbolicElement": "象征元素"
    },
    "awakening": {
      "theme": "觉醒阶段主题",
      "activities": ["活动1", "活动2"],
      "emotionalGoal": "情绪目标",
      "symbolicElement": "象征元素"
    },
    "internalization": {
      "theme": "沉淀阶段主题",
      "activities": ["活动1", "活动2"],
      "emotionalGoal": "情绪目标",
      "symbolicElement": "象征元素"
    },
    "transformation": {
      "theme": "转化阶段主题",
      "activities": ["活动1", "活动2"],
      "emotionalGoal": "情绪目标",
      "symbolicElement": "象征元素"
    }
  },
  "cognitiveTriggers": {
    "questions": ["思考问题1", "思考问题2"],
    "rituals": ["仪式或象征事件1", "仪式或象征事件2"],
    "moments": ["契机点描述1", "契机点描述2"]
  },
  "healingDesign": {
    "sound": "声音设计（风声、钟声、铃音等）",
    "scent": "气味设计",
    "light": "光线设计",
    "rhythm": "节奏设计",
    "community": "社群互动设计"
  },
  "postJourneyChallenge": {
    "title": "延伸挑战标题",
    "description": "帮助参与者将旅行体验融入日常的可执行行动",
    "actions": ["行动1", "行动2", "行动3"]
  },
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "currentCountry": "用户当前所在国家（如果已知）",
  "locationCountries": { "地点A": "国家", "地点B": "国家" },
  "destination": "主要目的地（用于兼容）",
  "locations": ["地点A", "地点B", "地点C", "地点D", "地点E"],
  "locationDetails": {
    "地点A": {
      "name": "地点A",
      "country": "地点所属国家",
      "duration": "X天",
      "budget": "预算范围（如：5000-10000元/人）",
      "highlights": [
        {
          "title": "亮点标题",
          "description": "详细的体验描述，说明这个体验为什么特殊，需融入四大设计支柱",
          "feeling": "情感感受或体验带来的触动"
        }
      ],
      "aiMessage": "针对此地的定制建议（诗性但不虚浮）"
    }
    // ... 为 locations 数组中的每个地点都添加一个条目
  },
  "duration": "通用时长",
  "budget": "通用预算范围",
  "highlights": [
    {
      "title": "亮点标题",
      "description": "详细的体验描述，需体现认知契机和治愈性设计",
      "feeling": "情感感受或体验带来的触动"
    }
  ],
  "story": "故事性描述（融入五段心智流体验）",
  "aiMessage": "通用AI建议（诗性但不虚浮）",
  "concept": "核心概念描述（兼容字段）"
}

关键要求：
1. mentalFlowStages 必须完整包含五个阶段（summon, reflection, awakening, internalization, transformation），每个阶段需有 theme、activities（数组）、emotionalGoal、symbolicElement
2. cognitiveTriggers 需包含 questions（问题数组）、rituals（仪式数组）、moments（契机点数组）
3. healingDesign 需包含 sound、scent、light、rhythm、community 五个维度
4. postJourneyChallenge 需包含 title、description、actions（数组）
5. keywords 需是3-5个关键词的数组
6. locationDetails 对象必须包含 locations 数组中每个地点的详细条目
7. 每个 locationDetails 条目必须包含：name、country、duration、budget、highlights、aiMessage
8. 在 locations 数组中提供 5-8 个备选目的地，覆盖至少 5 个不同国家
9. 必须包含：currentCountry 字段，以及 locationCountries（地点到国家的映射）
10. 如果用户来自 ${userCountry || '未知国家'}，推荐 2-3 个该国国内目的地
11. 每个地点的 highlights 和 description 必须体现四大设计支柱和认知契机
12. 所有描述性文字必须"诗性但不虚浮"，能唤起画面感与心理共鸣

JSON 验证规则：
- 所有字符串必须使用双引号（不要使用单引号）
- 确保所有字符串正确转义（字符串内的引号使用\", 反斜杠使用\\）
- 保持描述简洁，避免超出 token 限制
- 不要有尾随逗号
- JSON 中不要有注释

请只返回有效的 JSON，不要在前面或后面添加任何文字。`

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: input }
  ]

  let response: string | undefined
  try {
    response = await chatWithDeepSeek(messages, {
      temperature: 0.8, // 降低温度以提高输出稳定性
      max_tokens: 4000  // 增加token限制以容纳更详细的内容
    })
    
    console.log('🌟 AI 原始响应 (前 1000 字符):', response.substring(0, 1000))
    
    // 清理响应中的 markdown 代码块
    let cleaned = response
      .replace(/```json\n?/gi, '')  // 移除 json 代码块标记
      .replace(/```\n?/g, '')        // 移除其他代码块标记
      .trim()
    
    // 查找 JSON 对象（从第一个 { 开始）
    const jsonStart = cleaned.indexOf('{')
    const jsonEnd = cleaned.lastIndexOf('}')
    
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1)
    }
    
    // 尝试解析JSON，如果失败则尝试修复
    let parsed: any
    try {
      parsed = JSON.parse(cleaned)
    } catch (parseError) {
      console.warn('⚠️ 首次解析失败，尝试修复 JSON...', parseError)
      
      // 尝试更激进的修复
      cleaned = fixJSONResponse(cleaned)
      
      try {
        parsed = JSON.parse(cleaned)
      } catch (secondError) {
        console.error('❌ 二次解析仍失败:', secondError)
        console.error('❌ 清理后的 JSON:', cleaned.substring(0, 2000))
        throw new Error('AI返回的JSON格式无效，请重试')
      }
    }
    
    console.log('🌟 解析后的数据:', {
      title: parsed.title,
      locationsCount: parsed.locations?.length || 0,
      locationDetailsCount: parsed.locationDetails ? Object.keys(parsed.locationDetails).length : 0,
      hasAllRequiredFields: !!(parsed.title && parsed.concept && parsed.destination && parsed.locations && parsed.locationDetails)
    })
    
    // 验证必要字段
    if (!parsed.title || !parsed.locations || !parsed.locationDetails) {
      throw new Error('AI返回的数据缺少必要字段')
    }
    
    return parsed
  } catch (error: any) {
    console.error('❌ Failed to generate inspiration journey:', error)
    console.error('❌ 原始响应 (前 1000 字符):', response?.substring(0, 1000) || 'No response')
    
    // 抛出更明确的错误信息
    if (error.message.includes('AI返回的JSON格式无效')) {
      throw error
    }
    
    throw new Error('生成灵感旅程失败，请重试')
}

// 兼容旧调用名：部分模块仍调用 generateInspirationContent
// 导出兼容别名（放在文件末尾可能更安全）

/**
 * 修复JSON响应的常见问题
 */
function fixJSONResponse(jsonString: string): string {
  let fixed = jsonString
  
  try {
    // 首先尝试直接解析
    JSON.parse(fixed)
    return fixed
  } catch {
    console.warn('⚠️ JSON 需要修复，开始处理...')
  }
  
  // 1. 移除注释（如果有）
  fixed = fixed.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '')
  
  // 2. 修复末尾的尾随逗号
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1')
  
  // 3. 修复单引号（如果AI使用了单引号）
  fixed = fixed.replace(/([{,]\s*)'([^']+)':\s*'([^']*)'/g, '$1"$2": "$3"')
  
  // 4. 移除多余的空白字符
  fixed = fixed.replace(/\s+/g, ' ')
  
  // 5. 尝试修复未闭合的字符串
  // 查找所有未闭合的双引号对
  let quoteCount = 0
  // 简化处理，直接返回当前修复后的字符串，避免未闭合导致的编译错误
  return fixed
}

}