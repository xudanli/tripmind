import { API_CONFIG } from '@/config/api'
import { extractJSONObject, cleanMarkdownCodeBlocks, safeParseJSON, extractField } from '@/utils/jsonParser'

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
    
    console.log('🔍 detectInspirationIntent 原始响应:', response.substring(0, 500))
    
    // 使用统一的 JSON 解析工具
    const parsed = safeParseJSON(response)
    console.log('✅ 检测到的用户意图:', parsed)
    return parsed
  } catch (error: any) {
    console.error('❌ Failed to detect intent:', error)
    console.error('❌ 错误详情:', error.message)
    // 返回默认值而不是抛出错误，避免阻塞整个流程
    return {
      intentType: 'photography_exploration',
      keywords: [],
      emotionTone: '专注·柔和',
      description: ''
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
  },
  language: string = 'zh-CN',
  userCountry?: string,
  selectedDestination?: string
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
  
  // 如果用户选择了目的地，在提示词中强调必须使用该目的地
  const destinationConstraint = selectedDestination
    ? (isEnglish
        ? `\n📍 CRITICAL: The user has selected "${selectedDestination}" as the destination. You MUST generate an itinerary specifically for this location. Do NOT change or replace it with another destination. All activities must be within or near "${selectedDestination}".`
        : `\n📍 重要约束：用户已选择"${selectedDestination}"作为目的地。你必须为该地点生成行程，不得更改或替换为其他目的地。所有活动必须在"${selectedDestination}"及其附近。`)
    : ''
  
  // 构建基于心理模板的行程生成提示
  const psychologicalPrompt = isEnglish
    ? `Generate a ${template.templateName} journey based on the following psychological profile:
- Motivation: ${personalityProfile.motivation} (seeking: ${personalityProfile.motivation_detail})
- Emotion: From ${personalityProfile.dominant_emotion} to ${personalityProfile.desired_emotion}
- Rhythm: ${personalityProfile.travel_rhythm} with ${personalityProfile.activity_density} activities
- Social: ${personalityProfile.social_preference} (intensity: ${personalityProfile.social_intensity}/5)
- Need: ${personalityProfile.cognitive_need} → ${personalityProfile.post_journey_goal}

Psychological Flow: ${template.psychologicalFlow.join(' → ')}
Symbolic Elements: ${template.symbolicElements.join(', ')}
Core Insight: ${template.coreInsight}
Recommended Rhythm: ${template.recommendedRhythm}
Social Mode: ${template.socialMode}${destinationConstraint}

Create a travel itinerary that embodies this psychological journey.`
    : `基于以下心理画像生成${template.templateName}旅程：
- 动机：${personalityProfile.motivation}（寻求：${personalityProfile.motivation_detail}）
- 情绪：从 ${personalityProfile.dominant_emotion} 到 ${personalityProfile.desired_emotion}
- 节奏：${personalityProfile.travel_rhythm}，活动密度：${personalityProfile.activity_density}
- 社交：${personalityProfile.social_preference}（强度：${personalityProfile.social_intensity}/5）
- 需求：${personalityProfile.cognitive_need} → ${personalityProfile.post_journey_goal}

心理流程：${template.psychologicalFlow.join(' → ')}
象征元素：${template.symbolicElements.join('、')}
核心洞察：${template.coreInsight}
推荐节奏：${template.recommendedRhythm}
社交模式：${template.socialMode}${destinationConstraint}

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
      ? `You are an Inspirit Designer analyzing a traveler's psychological profile to recommend destinations.

**Psychological Profile:**
- Motivation: ${personalityProfile.motivation} (seeking: ${personalityProfile.motivation_detail})
- Emotion: From ${personalityProfile.dominant_emotion} to ${personalityProfile.desired_emotion}
- Rhythm: ${personalityProfile.travel_rhythm}, Activity Density: ${personalityProfile.activity_density}
- Social: ${personalityProfile.social_preference} (intensity: ${personalityProfile.social_intensity}/5)
- Need: ${personalityProfile.cognitive_need} → ${personalityProfile.post_journey_goal}

**Matched Psychological Template:**
- Template Name: ${template.templateName}
- Psychological Flow: ${template.psychologicalFlow.join(' → ')}
- Symbolic Elements: ${template.symbolicElements.join(', ')}
- Core Insight: ${template.coreInsight}
- Recommended Rhythm: ${template.recommendedRhythm}
- Social Mode: ${template.socialMode}

**User Location:** ${userCountry || 'Unknown'}

Based on this psychological profile and template, recommend travel destinations that would support this psychological journey.

**Requirements:**
1. Recommend 8-12 destinations total
2. If user is in a specific country (${userCountry || 'unknown'}), prioritize 3-5 destinations within that country
3. Include at least 5 international destinations from different countries
4. Each recommendation MUST include:
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
      : `你是一位灵感人格旅行设计者，需要根据用户的心理画像推荐旅行目的地。

**用户心理画像：**
- 动机：${personalityProfile.motivation}（寻求：${personalityProfile.motivation_detail}）
- 情绪：从 ${personalityProfile.dominant_emotion} 到 ${personalityProfile.desired_emotion}
- 节奏：${personalityProfile.travel_rhythm}，活动密度：${personalityProfile.activity_density}
- 社交：${personalityProfile.social_preference}（强度：${personalityProfile.social_intensity}/5）
- 需求：${personalityProfile.cognitive_need} → ${personalityProfile.post_journey_goal}

**匹配的心理旅程模板：**
- 模板名称：${template.templateName}
- 心理流程：${template.psychologicalFlow.join(' → ')}
- 象征元素：${template.symbolicElements.join('、')}
- 核心洞察：${template.coreInsight}
- 推荐节奏：${template.recommendedRhythm}
- 社交模式：${template.socialMode}

**用户地理位置：** ${userCountry || '未知'}

基于这个心理画像和模板，推荐适合这个心理旅程的旅行目的地。

**要求：**
1. 总共推荐8-12个目的地
2. 如果用户位于特定国家（${userCountry || '未知'}），优先推荐3-5个该国国内目的地
3. 至少包含5个来自不同国家的国际目的地
4. 每个推荐必须包含：
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
  const messages: ChatMessage[] = [
      { 
        role: 'system', 
        content: isEnglish
          ? 'You are an Inspirit Designer specializing in recommending travel destinations based on psychological profiles. You must return valid JSON arrays only, with no additional text.'
          : '你是一位灵感人格旅行设计者，专门根据心理画像推荐旅行目的地。你必须只返回有效的JSON数组，不要任何额外文字。'
      },
      { role: 'user', content: recommendationPrompt }
    ]

    console.log('🚀 开始调用AI生成目的地推荐...')
    const response = await chatWithDeepSeek(messages, {
      temperature: 0.8,
      max_tokens: 4000
    })

    if (!response || response.trim().length === 0) {
      throw new Error('AI返回空响应')
    }

    console.log('📥 AI原始响应长度:', response.length)
    console.log('📥 AI原始响应 (前500字符):', response.substring(0, 500))

    // 清理并解析响应
    let cleaned = response.trim()
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    console.log('🧹 清理后的响应 (前500字符):', cleaned.substring(0, 500))
    
    // 尝试提取JSON数组
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      cleaned = jsonMatch[0]
      console.log('✅ 提取到JSON数组')
    } else {
      console.warn('⚠️ 未找到JSON数组，尝试其他方式提取')
    }

    try {
      const parsed = JSON.parse(cleaned)
      console.log('✅ JSON解析成功，类型:', Array.isArray(parsed) ? '数组' : typeof parsed)
      
      if (Array.isArray(parsed)) {
        recommendedDestinations = parsed.map((dest: any) => ({
          name: dest.name || '',
          country: dest.country || '',
          reason: dest.reason || dest.description || '',
          reasoning: dest.reasoning || '',
          description: dest.description || dest.reason || ''
        }))
        console.log(`✅ AI推荐了 ${recommendedDestinations.length} 个目的地`)
        console.log('📍 推荐列表:', recommendedDestinations.map(d => `${d.name} (${d.country})`).join(', '))
      } else {
        console.error('❌ AI返回的不是数组格式，类型:', typeof parsed, '内容:', parsed)
        throw new Error('AI返回的不是数组格式')
      }
    } catch (parseError: any) {
      console.error('❌ 解析AI推荐目的地失败:', parseError.message || parseError)
      console.error('❌ 尝试解析的内容 (前1000字符):', cleaned.substring(0, 1000))
      // 如果解析失败，可以返回空数组或使用备用逻辑
      recommendedDestinations = []
    }
    } catch (error: any) {
      console.error('❌ AI生成目的地推荐失败:', error.message || error)
      console.error('❌ 错误堆栈:', error.stack)
      recommendedDestinations = []
    }
    
    // 确保至少有基本推荐（如果AI失败）
    if (recommendedDestinations.length === 0) {
      console.warn('⚠️ AI未生成推荐，使用默认推荐')
      recommendedDestinations = [
        {
          name: '冈仁波齐·神山环线',
          country: '中国',
          reason: '适合追求精神体验和内心转化的旅行者',
          reasoning: '根据你的心理画像，这是一个支持深度内省和转化的目的地'
        }
      ]
    }
    
    console.log(`✅ 最终推荐了 ${recommendedDestinations.length} 个目的地`)
    console.log('📍 推荐目的地详情:', recommendedDestinations)
  } else {
    // 用户已选择目的地，不需要推荐列表
    console.log('✅ 用户已选择目的地，跳过推荐生成步骤')
    recommendedDestinations = []
  }
  
  // 生成AI推荐消息
  let aiRecommendationMessage = ''
  if (selectedDestination) {
    // 用户已选择目的地，生成行程中
    aiRecommendationMessage = isEnglish
      ? `I'm creating a personalized ${template.templateName} journey itinerary for ${selectedDestination} based on your psychological profile.`
      : `我正在为 ${selectedDestination} 创建个性化的 ${template.templateName} 旅程行程，基于你的心理画像。`
  } else if (recommendedDestinations.length > 0) {
    // 显示推荐列表，等待用户选择
    const topDestinations = recommendedDestinations.slice(0, 3).map(d => d.name).join('、')
    aiRecommendationMessage = isEnglish
      ? `Based on your psychological profile (${template.templateName}), I've carefully selected ${recommendedDestinations.length} destinations that align with your journey from ${personalityProfile.dominant_emotion} to ${personalityProfile.desired_emotion}. The top recommendations include ${topDestinations}. Each destination has been thoughtfully matched to support your ${personalityProfile.motivation} motivation and ${personalityProfile.cognitive_need} needs. Please choose one that resonates with you, and I'll create a personalized itinerary for your ${template.templateName} journey.`
      : `根据你的心理画像（${template.templateName}），我为你精心选择了 ${recommendedDestinations.length} 个目的地，它们与你从 ${personalityProfile.dominant_emotion} 到 ${personalityProfile.desired_emotion} 的情绪转化路径相契合。重点推荐包括 ${topDestinations} 等。每个目的地都经过深思熟虑，匹配你的 ${personalityProfile.motivation} 动机和 ${personalityProfile.cognitive_need} 需求。请选择一个让你心动的地方，我将为你量身定制一份 ${template.templateName} 旅程。`
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
      itineraryData = await generateInspirationJourney(psychologicalPrompt, language, userCountry, selectedDestination)
      
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
      postJourneyGoal: personalityProfile.post_journey_goal
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
      ? `I've prepared ${recommendedDestinations.length} destination recommendations for you based on your psychological profile. Please select one that speaks to your heart.`
      : `我根据你的心理画像为你准备了 ${recommendedDestinations.length} 个目的地推荐，请选择一个让你心动的地方。`)
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
    
    // 合并标准行程字段
    Object.assign(result, itineraryData)
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

export async function generateInspirationJourney(input: string, language: string = 'zh-CN', userCountry?: string, selectedDestination?: string): Promise<any> {
  const isEnglish = language.startsWith('en')
  
  // First, detect user intent to understand their travel needs
  let intentData = null
  try {
    intentData = await detectInspirationIntent(input, language)
    console.log('检测到的用户意图:', intentData)
  } catch (error) {
    console.error('意图识别失败，使用默认值:', error)
    intentData = {
      intentType: 'general',
      keywords: [],
      emotionTone: 'neutral',
      description: '一般旅行'
    }
  }
  
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
  
  // Build reference catalog from local inspiration DB to ground AI suggestions
  // 如果知道用户国家，优先显示该国家的地点
  let referenceCatalog = ''
  let locationGuidance = ''
  try {
    const { listDestinations } = await import('@/utils/inspirationDb')
    const all = listDestinations(userCountry ? { country: userCountry } : undefined)
    
    // 如果指定了用户国家，优先显示该国家的地点
    if (userCountry && all.length > 0) {
      const userCountryDests = all.filter(d => d.country === userCountry).slice(0, 10)
      const otherCountryDests = all.filter(d => d.country !== userCountry).slice(0, 8)
      
      const lines: string[] = []
      if (userCountryDests.length > 0) {
        const names = userCountryDests.map(d => d.name).join(', ')
        lines.push(isEnglish 
          ? `- ${userCountry} (PRIORITY - user's country): ${names}`
          : `- ${userCountry}（优先 - 用户所在国家）：${names}`)
      }
      
      // 按国家分组其他国家的推荐（每个国家最多3个）
      const grouped: Record<string, { name: string; country: string }[]> = {}
      for (const d of otherCountryDests) {
        (grouped[d.country] ||= []).push({ name: d.name, country: d.country })
      }
      const otherCountries = Object.keys(grouped).sort()
      for (const c of otherCountries) {
        const picks = (grouped[c] || []).slice(0, 2)
        if (picks.length === 0) continue
        const names = picks.map(p => p.name).join(', ')
        lines.push(isEnglish ? `- ${c}: ${names}` : `- ${c}：${names}`)
      }
      
      if (lines.length) {
        referenceCatalog = isEnglish
          ? `Reference destinations (PRIORITIZE destinations in ${userCountry}, then nearby regions):\n${lines.join('\n')}`
          : `参考目的地（优先推荐${userCountry}国内地点，其次周边地区）：\n${lines.join('\n')}`
        
        locationGuidance = isEnglish
          ? `\n📍 IMPORTANT LOCATION CONSTRAINT: User is located in ${userCountry}. You MUST prioritize destinations within ${userCountry} or nearby regions. Only recommend international destinations if they are very close (e.g., bordering countries) or if user explicitly requests them. Avoid recommending distant international destinations unless absolutely necessary for the psychological journey theme.`
          : `\n📍 重要地理位置约束：用户位于${userCountry}。你必须优先推荐${userCountry}国内的目的地或周边地区。只有在必要时才推荐较远的国际目的地（例如，明确请求或心理旅程主题必需）。`
      }
    } else {
      // 未指定用户国家，使用原来的逻辑
    const grouped: Record<string, { name: string; country: string }[]> = {}
    for (const d of all) {
      (grouped[d.country] ||= []).push({ name: d.name, country: d.country })
    }
    const lines: string[] = []
    const countries = Object.keys(grouped).sort()
    let total = 0
    for (const c of countries) {
      const picks = (grouped[c] || []).slice(0, 3)
      if (picks.length === 0) continue
      const names = picks.map(p => p.name).join(', ')
      lines.push(isEnglish ? `- ${c}: ${names}` : `- ${c}：${names}`)
      total += picks.length
      if (total >= 48) break
    }
    if (lines.length) {
      referenceCatalog = isEnglish
        ? `Reference destinations (pick from these when suitable; do not invent nonexistent places):\n${lines.join('\n')}`
        : `参考目的地（尽量优先从下列中选择，避免凭空捏造地点）：\n${lines.join('\n')}`
      }
    }
  } catch {}
  
  const startDate = new Date().toISOString().split('T')[0]
  const estimatedDays = intentData?.intentType === 'extreme_exploration' ? 7 : intentData?.intentType === 'emotional_healing' ? 5 : 6
  
  const intentTypeText = intentData?.intentType || 'general'
  const emotionToneText = intentData?.emotionTone || 'neutral'
  const keywordsText = intentData?.keywords?.filter((k: string) => k !== selectedDestination).join('、') || ''
  
  // 如果用户选择了目的地，在系统提示词中强调
  const destinationNote = selectedDestination
    ? (isEnglish
        ? `\n📍 **CRITICAL DESTINATION CONSTRAINT**: The user has explicitly selected "${selectedDestination}" as the travel destination. You MUST:\n` +
          `1. Set the "destination" field to exactly "${selectedDestination}"\n` +
          `2. Generate all activities within or near "${selectedDestination}"\n` +
          `3. Do NOT replace or change this destination to any other location\n` +
          `4. All location names in timeSlots should be related to "${selectedDestination}" or nearby areas`
        : `\n📍 **重要目的地约束**：用户已明确选择"${selectedDestination}"作为旅行目的地。你必须：\n` +
          `1. 将"destination"字段设置为精确的"${selectedDestination}"\n` +
          `2. 所有活动必须在该地点及其附近\n` +
          `3. 不得替换或更改目的地为其他地点\n` +
          `4. timeSlots中的所有地点名称应与"${selectedDestination}"或其附近相关`)
    : ''
  
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
4. Activities arranged geographically - minimize travel time between consecutive activities
5. Include 4-6 time slots per day, with appropriate breaks for meals and rest
6. Total cost should be a realistic estimate based on activities

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
15. Recommendations section: bestTimeToVisit, weatherAdvice, packingTips (array), localTips (array)
${referenceCatalog ? '16. Refer to reference destinations when selecting locations.\n' : ''}${locationGuidance}17. Writing style: poetic where appropriate (emotional introduction), clear for actions, reflective for questions, transformative for insights

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
4. 活动按地理位置排列——尽量减少连续活动之间的旅行时间
5. 每天包含4-6个时间段，适当安排用餐和休息时间
6. 总成本应基于活动的现实估算

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
15. 建议部分：bestTimeToVisit、weatherAdvice、packingTips（数组）、localTips（数组）
${referenceCatalog ? '16. 选择地点时参考推荐目的地。\n' : ''}${locationGuidance}17. 写作风格：情绪引入用诗性（适当处），行动用清晰，问题用反思性，洞察用转化性

JSON 验证规则：
- 所有字符串必须使用双引号（不要使用单引号）
- 确保所有字符串正确转义（字符串内的引号使用\", 反斜杠使用\\）
- 保持描述简洁，避免超出 token 限制
- 不要有尾随逗号
- JSON 中不要有注释

请只返回有效的 JSON，不要在前面或后面添加任何文字。`

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    referenceCatalog ? { role: 'system', content: referenceCatalog } : undefined,
    { role: 'user', content: input }
  ].filter(Boolean) as ChatMessage[]

  let response: string | undefined
  try {
    response = await chatWithDeepSeek(messages, {
      temperature: 0.8, // 降低温度以提高输出稳定性
      max_tokens: 8192  // DeepSeek API 的最大限制，避免JSON截断
    })
    
    // 检查响应是否有效
    if (!response || response.trim().length === 0) {
      throw new Error('AI 没有返回有效响应，请重试')
    }
    
    console.log('🌟 AI 原始响应 (前 1000 字符):', (response || '').substring(0, 1000))
    
    // 使用统一的清理工具
    let cleaned = cleanMarkdownCodeBlocks(response)
    
    // 再次检查清理后的内容是否有效
    if (!cleaned || cleaned.length === 0) {
      throw new Error('AI 返回的内容为空，请重试')
    }
    
    // 检查是否以 { 开头（基本的 JSON 格式检查）
    if (!cleaned.startsWith('{')) {
      console.warn('⚠️ JSON 不以 { 开头，尝试修复...')
      // 尝试找到第一个 {
      const firstBrace = cleaned.indexOf('{')
      if (firstBrace > 0) {
        cleaned = cleaned.substring(firstBrace)
      } else {
        throw new Error('AI 返回的内容不是有效的 JSON 格式')
      }
    }
    
    // 保存清理前的内容用于调试
    const beforeClean = cleaned.substring(0, 100)
    console.log('🔍 Markdown 清理后的前 100 字符:', beforeClean)
    
    // 修复转义问题：AI 可能返回 "field\": \"value" 这样的格式
    // 需要修复为 "field": "value"
    // 使用状态机方式处理，避免破坏字符串值中的引号
    
    // 检查是否有转义问题
    // 错误的格式包括："field\":、"\": \"、": \"、\"field":、\"field\":、\":\" 等
    // 正确的格式是："field": 或 ": "
    // 使用更全面的检测模式，包括各种转义组合
    const hasBadEscape = /"([a-zA-Z_][a-zA-Z0-9_]*)\\":/.test(cleaned) ||           // "field\":
                         /":\s*\\"/.test(cleaned) ||                                 // ": \"
                         /":\\"/.test(cleaned) ||                                    // ":\"
                         /\\"([a-zA-Z_][a-zA-Z0-9_]*)"\s*:/.test(cleaned) ||        // \"field":
                         /\\"([a-zA-Z_][a-zA-Z0-9_]*)\\"\s*:/.test(cleaned) ||       // \"field\":
                         /\\":/.test(cleaned) ||                                     // \":
                         /\\":\\"/.test(cleaned)                                     // \":\"
    
    // 始终尝试修复，因为有些转义问题可能不明显但在JSON解析时会失败
    // 修复是安全的，不会破坏正确的JSON
    console.log('🔍 检测转义问题，hasBadEscape:', hasBadEscape)
    console.log('🔍 修复前的示例:', cleaned.substring(0, 100))
    
    // 多次修复确保彻底（有些转义可能嵌套或组合出现）
    let repairAttempts = 0
    let previousClean = cleaned
    
    while (repairAttempts < 10) {
      // 记录修复前的状态，用于调试
      const beforeRepair = cleaned.substring(0, 200)
      
      // 最高优先级：修复字段名和值前都有转义的完整模式
      // \"field\":\"value -> "field": "value
      cleaned = cleaned.replace(/\\"([a-zA-Z_][a-zA-Z0-9_]*)\\"\s*:\s*\\"/g, '"$1": "')
      cleaned = cleaned.replace(/\\"([a-zA-Z_][a-zA-Z0-9_]*)\\":\\"/g, '"$1": "')
      
      // 次优先级：修复字段名后有转义，值前也有转义的完整模式
      // "field\":\"value -> "field": "value
      cleaned = cleaned.replace(/"([a-zA-Z_][a-zA-Z0-9_]*)\\":\\"/g, '"$1": "')
      
      // 修复字段名和值前都有转义（带空格）：\"field\": \" -> "field": "
      cleaned = cleaned.replace(/\\"([a-zA-Z_][a-zA-Z0-9_]*)\\"\s*:\s*\\"/g, '"$1": "')
      
      // 修复完整的字段定义（字段名前有转义，值前没有）：\"field\": -> "field":
      cleaned = cleaned.replace(/\\"([a-zA-Z_][a-zA-Z0-9_]*)\\"\s*:/g, '"$1":')
      
      // 修复字段名前的转义（字段名前有转义，但值前没有）：\"field": -> "field":
      cleaned = cleaned.replace(/\\"([a-zA-Z_][a-zA-Z0-9_]*)"\s*:/g, '"$1":')
      
      // 修复字段名后的转义（值前有转义，带空格）："field\": \" -> "field": "
      cleaned = cleaned.replace(/"([a-zA-Z_][a-zA-Z0-9_]*)\\":\s*\\"/g, '"$1": "')
      
      // 修复字段名后的转义："field\": -> "field":
      cleaned = cleaned.replace(/"([a-zA-Z_][a-zA-Z0-9_]*)\\":/g, '"$1":')
      
      // 修复值前的转义：": \" -> ": " 和 ":\" -> ": "
      cleaned = cleaned.replace(/":\s*\\"/g, '": "')
      cleaned = cleaned.replace(/":\\"/g, '": "')
      
      // 修复字段名后的转义（值前有转义）："field\": -> "field":
      cleaned = cleaned.replace(/"([a-zA-Z_][a-zA-Z0-9_]*)\\"\s*:/g, '"$1":')
      
      // 修复残留的转义：\": -> :
      cleaned = cleaned.replace(/\\":/g, '":')
      
      // 修复连续的转义：\":\" -> : "
      cleaned = cleaned.replace(/\\":\\"/g, '": "')
      
      // 修复字段名开头的转义（在 { 或 , 后）：{\"field -> {"field
      cleaned = cleaned.replace(/([{,]\s*)\\"/g, '$1"')
      
      // 检查是否有变化
      const afterRepair = cleaned.substring(0, 200)
      const hasChanged = cleaned !== previousClean
      
      if (repairAttempts === 0 && !hasChanged) {
        console.log('🔍 第一次修复尝试，但未检测到变化')
        console.log('🔍 修复前的片段:', beforeRepair)
        console.log('🔍 修复后的片段:', afterRepair)
        // 强制继续执行至少一次，确保所有规则都被应用
      }
      
      // 如果修复后没有变化，说明修复完成（但至少执行一次）
      if (!hasChanged && repairAttempts > 0) {
        break
      }
      
      previousClean = cleaned
      repairAttempts++
    }
    
    console.log('🔍 转义修复后的前 100 字符:', cleaned.substring(0, 100))
    console.log('🔍 修复尝试次数:', repairAttempts)
    
    // 验证修复后是否还有转义问题
    const stillHasBadEscape = /"([a-zA-Z_][a-zA-Z0-9_]*)\\":/.test(cleaned) || 
                              /":\s*\\"/.test(cleaned) || 
                              /":\\"/.test(cleaned) ||
                              /\\"([a-zA-Z_][a-zA-Z0-9_]*)"\s*:/.test(cleaned) ||
                              /\\"([a-zA-Z_][a-zA-Z0-9_]*)\\"\s*:/.test(cleaned) ||
                              /\\":/.test(cleaned) ||
                              /\\":\\"/.test(cleaned)
    
    if (stillHasBadEscape) {
      console.warn('⚠️ 修复后仍存在转义问题，将在后续阶段继续修复')
    } else {
      console.log('✅ 转义问题已修复')
    }
    
    // 移除可能的 # 或其他意外字符（比如 #timoSlots 应该是 timeSlots）
    // 但要小心，只在非字符串位置替换（在引号外的位置）
    let result = ''
    let inString = false
    let escapeNext = false
    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i]
      if (escapeNext) {
        result += char
        escapeNext = false
        continue
      }
      if (char === '\\') {
        escapeNext = true
        result += char
        continue
      }
      if (char === '"') {
        inString = !inString
        result += char
        continue
      }
      if (!inString && char === '#') {
        // 只在非字符串位置移除 #
        continue
      }
      result += char
    }
    cleaned = result
    
    // 查找 JSON 对象（从第一个 { 开始）
    const jsonStart = cleaned.indexOf('{')
    const jsonEnd = cleaned.lastIndexOf('}')
    
    if (jsonStart >= 0) {
      if (jsonEnd > jsonStart) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1)
      } else {
        // 如果没有找到结束的 }，从第一个 { 开始到字符串末尾
        cleaned = cleaned.substring(jsonStart)
      }
    } else {
      // 如果没有找到 {，尝试查找可能的 JSON 开头
      const possibleStart = cleaned.search(/["\[]/) || 0
      cleaned = cleaned.substring(possibleStart)
    }
    
    // 验证并修复 JSON 开头的格式问题
    // 确保开头是 { 并且后面紧跟的格式正确
    cleaned = cleaned.trim()
    if (!cleaned.startsWith('{')) {
      // 如果开头不是 {，尝试修复
      const braceIndex = cleaned.indexOf('{')
      if (braceIndex > 0) {
        cleaned = cleaned.substring(braceIndex)
      } else if (braceIndex === -1) {
        // 如果完全没有 {，尝试添加
        cleaned = '{' + cleaned
      }
    }
    
    // 检查开头是否有格式错误（比如多余的空格、引号等）
    // 确保 { 后面紧跟的格式是 "field" 或空格
    const afterBrace = cleaned.substring(1, 20).trim()
    if (afterBrace && !afterBrace.startsWith('"') && !afterBrace.startsWith('}')) {
      // 如果 { 后面不是引号或 }，可能有问题
      // 移除 { 和第一个引号之间的非法字符
      cleaned = cleaned.replace(/^\{[^"]*/, '{')
    }
    
    // 调试：输出清理后的前 100 个字符
    console.log('🔍 最终清理后的 JSON 开头 (前 100 字符):', cleaned.substring(0, 100))
    
    // 最终验证：只在确实有问题时才修复
    // 检查是否有错误的转义模式（\"field\": 或 \":）
    // 但不要修复正常的 JSON（"field": "value"）
    const hasBadEscapeFinal = /"([a-zA-Z_][a-zA-Z0-9_]*)\\":/.test(cleaned) || /":\s*\\"/.test(cleaned)
    if (hasBadEscapeFinal) {
      console.warn('⚠️ 最终检查：检测到转义问题，进行最后修复...')
      // 只修复确实有问题的转义
      cleaned = cleaned.replace(/"([a-zA-Z_][a-zA-Z0-9_]*)\\":/g, '"$1":')
      cleaned = cleaned.replace(/"([a-zA-Z_][a-zA-Z0-9_]*)"\s*:\s*\\"/g, '"$1": "')
      console.log('🔍 最后修复后的前 50 字符:', cleaned.substring(0, 50))
    }
    
    // 使用统一的 JSON 解析工具（带多重修复尝试）
    let parsed: any
    
    // 使用安全解析工具
    try {
      parsed = safeParseJSON(cleaned)
      console.log('✅ JSON 解析成功')
    } catch (parseError: any) {
      const errorPos = parseError.message.match(/position (\d+)/)?.[1]
      const errorPosNum = errorPos ? parseInt(errorPos) : 0
      
      console.error('❌ JSON 解析失败:', parseError.message)
      console.error('❌ cleaned 长度:', cleaned.length)
      console.error('❌ cleaned 是否包含 days:', cleaned.includes('days'))
      throw new Error('AI返回的JSON格式无效，请重试')
    }
    
    console.log('🌟 解析后的数据:', {
      title: parsed.title,
      destination: parsed.destination,
      duration: parsed.duration,
      daysCount: parsed.days?.length || 0,
      hasItineraryFormat: !!(parsed.days && Array.isArray(parsed.days)),
      hasLegacyFormat: !!(parsed.locations && parsed.locationDetails)
    })
    
    // 如果用户选择了目的地，验证AI是否正确使用（仅记录日志，不强制替换）
    if (selectedDestination) {
      if (parsed.destination !== selectedDestination) {
        console.warn(`⚠️ 注意：AI生成的目的地(${parsed.destination})与用户选择(${selectedDestination})不一致，但系统信任AI的生成结果`)
      } else {
        console.log(`✅ AI正确使用了用户选择的目的地: ${selectedDestination}`)
      }
    }
    
    // 验证必要字段（支持新的行程计划格式和旧的灵感格式）
    if (parsed.days && Array.isArray(parsed.days)) {
      // 新的行程计划格式
      if (!parsed.title || !parsed.destination || !parsed.days || parsed.days.length === 0) {
        throw new Error('AI返回的行程计划数据缺少必要字段')
      }
    } else if (parsed.locations && parsed.locationDetails) {
      // 旧的灵感格式（向后兼容）
    if (!parsed.title || !parsed.locations || !parsed.locationDetails) {
      throw new Error('AI返回的数据缺少必要字段')
      }
    } else {
      throw new Error('AI返回的数据格式不正确，既不是行程计划格式也不是灵感格式')
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
  
  // 1.5. 修复转义问题（修复 \": \" 这样的错误转义）
  // 但要小心，只在确实有问题的位置修复，不要破坏正常的 JSON
  // 检查是否有转义问题
  const hasEscapeIssueInFix = /"([a-zA-Z_][a-zA-Z0-9_]*)\\":/.test(fixed) || /":\s*\\"/.test(fixed)
  if (hasEscapeIssueInFix) {
    // 先修复字段名后的转义：\"field\": -> "field":
    fixed = fixed.replace(/"([a-zA-Z_][a-zA-Z0-9_]*)\\":/g, '"$1":')
    // 再修复值前的转义：": \" -> ": "
    fixed = fixed.replace(/":\s*\\"/g, '": "')
    // 修复残留的 \":
    fixed = fixed.replace(/\\":/g, '":')
  }
  
  // 1.6. 移除可能导致问题的特殊字符（如 #），但只在非字符串位置
  // 这个已经在主清理阶段处理了
  
  // 2. 修复末尾的尾随逗号
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1')
  
  // 3. 修复单引号（如果AI使用了单引号）
  fixed = fixed.replace(/([{,]\s*)'([^']+)':\s*'([^']*)'/g, '$1"$2": "$3"')
  
  // 4. 修复字符串中的未转义引号（关键修复）
  // 使用逐字符遍历的方式，更可靠地处理字符串中的引号
  let quoteFixed = ''
  let inStringForQuote = false
  let escapeNextForQuote = false
  let lastWasColon = false
  
  for (let i = 0; i < fixed.length; i++) {
    const char = fixed[i]
    const nextChar = i < fixed.length - 1 ? fixed[i + 1] : ''
    
    if (escapeNextForQuote) {
      quoteFixed += char
      escapeNextForQuote = false
      lastWasColon = false
      continue
    }
    
    if (char === '\\') {
      escapeNextForQuote = true
      quoteFixed += char
      lastWasColon = false
      continue
    }
    
    if (char === ':') {
      quoteFixed += char
      lastWasColon = true
      continue
    }
    
    if (char === '"') {
      if (!inStringForQuote) {
        // 字符串开始
        inStringForQuote = true
        quoteFixed += char
      } else {
        // 在字符串内遇到引号
        // 判断这是字符串结束还是字符串内的引号
        // 如果下一个字符是逗号、右括号、右方括号或空白，说明是字符串结束
        if (nextChar === ',' || nextChar === '}' || nextChar === ']' || (nextChar && /\s/.test(nextChar)) || nextChar === '') {
          quoteFixed += char
          inStringForQuote = false
        } else {
          // 这是字符串内的引号，需要转义
          quoteFixed += '\\"'
        }
      }
      lastWasColon = false
    } else {
      quoteFixed += char
      lastWasColon = false
    }
  }
  
  fixed = quoteFixed
  
  // 5. 修复未闭合的字符串引号
  // 查找可能未闭合的字符串值（后面直接跟着逗号、右括号或右方括号）
  fixed = fixed.replace(/":\s*"([^"]*?)(?=\s*[,}\]]|$)/g, (match, content) => {
    // 如果内容不为空且后面直接是逗号或括号，说明可能未闭合
    if (content && !content.endsWith('"')) {
      // 转义内容中的特殊字符并闭合引号
      const escaped = content.replace(/"/g, '\\"')
      return `": "${escaped}"`
    }
    return match
  })
  
  // 6. 修复截断的JSON - 查找最后一个完整的对象
  let braceCount = 0
  let bracketCount = 0
  let lastValidIndex = fixed.length
  let inStringForBrace = false
  let escapeNextForBrace = false
  
  for (let i = 0; i < fixed.length; i++) {
    const char = fixed[i]
    
    if (escapeNextForBrace) {
      escapeNextForBrace = false
      continue
    }
    
    if (char === '\\') {
      escapeNextForBrace = true
      continue
    }
    
    if (char === '"') {
      inStringForBrace = !inStringForBrace
      continue
    }
    
    if (!inStringForBrace) {
      if (char === '{') braceCount++
      if (char === '}') {
        braceCount--
        if (braceCount === 0 && bracketCount === 0) {
          lastValidIndex = i + 1
        }
      }
      if (char === '[') bracketCount++
      if (char === ']') bracketCount--
    }
  }
  
  // 如果JSON结构不完整，截取到最后一个完整对象
  if (braceCount !== 0 || bracketCount !== 0) {
    console.warn('⚠️ JSON结构不完整，尝试截取到最后一个完整对象')
    fixed = fixed.substring(0, lastValidIndex)
    
    // 如果截取后末尾不是 }，添加闭合括号
    if (!fixed.trim().endsWith('}')) {
      // 计算需要添加的闭合括号数
      let openBraces = (fixed.match(/{/g) || []).length
      let closeBraces = (fixed.match(/}/g) || []).length
      const neededBraces = openBraces - closeBraces
      
      let openBrackets = (fixed.match(/\[/g) || []).length
      let closeBrackets = (fixed.match(/\]/g) || []).length
      const neededBrackets = openBrackets - closeBrackets
      
      // 添加缺失的闭合括号
      if (neededBrackets > 0) {
        fixed += ']'.repeat(neededBrackets)
      }
      if (neededBraces > 0) {
        fixed += '}'.repeat(neededBraces)
      }
    }
  }
  
  // 7. 最后尝试移除可能导致问题的控制字符
  fixed = fixed.replace(/[\x00-\x1F\x7F]/g, '')
  
  return fixed
}

/**
 * 尝试从截断的 JSON 中提取部分有效数据
 */
function tryExtractPartialJSON(jsonString: string): any | null {
  try {
    console.log('🔍 尝试提取部分 JSON，输入长度:', jsonString.length)
    
    // 首先尝试提取基本字段（title, destination, summary, duration）
    const title = extractField(jsonString, 'title')
    const destination = extractField(jsonString, 'destination')
    const summary = extractField(jsonString, 'summary')
    const duration = extractField(jsonString, 'duration')
    
    console.log('🔍 提取到的基本字段:', { 
      title, 
      destination, 
      summary: summary?.substring(0, 50),
      duration 
    })
    
    // 尝试找到 days 数组的开始位置
    const daysStartPattern = /"days"\s*:\s*\[/g
    const daysMatch = daysStartPattern.exec(jsonString)
    
    if (!daysMatch) {
      console.warn('⚠️ 未找到 days 数组')
      // 即使没有 days，也尝试返回基本字段
      if (title || destination || summary) {
        return {
          title: title || '旅行行程',
          destination: destination || '',
          duration: duration ? parseInt(duration) : 0,
          summary: summary || '',
          days: []
        }
      }
      return null
    }
    
    // 从 days 数组开始位置提取内容
    const daysStartPos = daysMatch.index + daysMatch[0].length
    const daysContent = jsonString.substring(daysStartPos)
    
    // 查找所有完整的 day 对象（包括处理嵌套的 timeSlots）
    const dayObjects: any[] = []
    let braceDepth = 0
    let bracketDepth = 0
    let currentDay = ''
    let inString = false
    let escapeNext = false
    
    for (let i = 0; i < daysContent.length; i++) {
      const char = daysContent[i]
      
      if (escapeNext) {
        currentDay += char
        escapeNext = false
        continue
      }
      
      if (char === '\\') {
        escapeNext = true
        currentDay += char
        continue
      }
      
      if (char === '"') {
        inString = !inString
        currentDay += char
        continue
      }
      
      if (!inString) {
        if (char === '{') {
          braceDepth++
          currentDay += char
        } else if (char === '}') {
          braceDepth--
          currentDay += char
          if (braceDepth === 0 && bracketDepth === 0) {
            // 找到一个完整的 day 对象
            try {
              // 先尝试修复可能的转义问题
              let dayStr = currentDay
              dayStr = dayStr.replace(/"([a-zA-Z_][a-zA-Z0-9_]*)\\":/g, '"$1":')
              dayStr = dayStr.replace(/":\s*\\"/g, '": "')
              
              const dayObj = JSON.parse(dayStr)
              dayObjects.push(dayObj)
              console.log(`✅ 成功提取第 ${dayObjects.length} 天的数据`)
            } catch (parseError: any) {
              // 如果解析失败，尝试修复后再次解析
              try {
                // 更激进的修复
                let dayStr = currentDay
                // 修复所有常见的转义问题
                dayStr = dayStr.replace(/\\"/g, '"')
                dayStr = dayStr.replace(/\\'/g, "'")
                // 移除末尾的逗号
                dayStr = dayStr.replace(/,(\s*[}\]])/g, '$1')
                
                const dayObj = JSON.parse(dayStr)
                dayObjects.push(dayObj)
                console.log(`✅ 通过修复成功提取第 ${dayObjects.length} 天的数据`)
              } catch {
                console.warn(`⚠️ 无法解析第 ${dayObjects.length + 1} 天的数据，跳过`)
                // 继续处理下一个
              }
            }
            currentDay = ''
          }
        } else if (char === '[') {
          bracketDepth++
          currentDay += char
        } else if (char === ']') {
          bracketDepth--
          currentDay += char
          // 如果数组关闭且不在字符串中，继续处理
        } else {
          currentDay += char
        }
      } else {
        currentDay += char
      }
    }
    
    console.log(`🔍 提取到 ${dayObjects.length} 个完整的 day 对象`)
    
    if (dayObjects.length > 0) {
      // 尝试构建部分完整的 JSON
      const partialJSON = {
        title: title || '旅行行程',
        destination: destination || '',
        duration: duration ? parseInt(duration) : dayObjects.length,
        summary: summary || '',
        days: dayObjects,
        recommendations: null,
        totalCost: 0
      }
      
      console.log('✅ 成功构建部分 JSON，包含', dayObjects.length, '天的数据')
      return partialJSON
    } else if (title || destination || summary) {
      // 即使没有 days，也返回基本字段
      console.log('⚠️ 没有提取到完整的 day 对象，但返回基本字段')
      return {
        title: title || '旅行行程',
        destination: destination || '',
        duration: duration ? parseInt(duration) : 0,
        summary: summary || '',
        days: []
      }
    }
  } catch (error: any) {
    console.warn('⚠️ 提取部分 JSON 失败:', error.message || error)
  }
  
  return null
}

/**
 * 从 JSON 字符串中提取指定字段的值
 * 支持正常的 JSON 格式和错误的转义格式
 */
function extractField(jsonString: string, fieldName: string): string | null {
  // 尝试多种模式来提取字段值
  
  // 1. 正常格式："field": "value"
  let pattern = new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*(?:\\\\.[^"]*)*)"`, 'g')
  let match = pattern.exec(jsonString)
  
  if (match && match[1]) {
    return match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\\\/g, '\\')
  }
  
  // 2. 正常格式（无引号值，如数字）："field": 123
  pattern = new RegExp(`"${fieldName}"\\s*:\\s*([0-9.]+)`, 'g')
  match = pattern.exec(jsonString)
  
  if (match && match[1]) {
    return match[1]
  }
  
  // 3. 错误转义格式："field\": \"value"
  pattern = new RegExp(`"${fieldName}\\"?:\\s*\\\\?"([^"]*(?:\\\\.[^"]*)*)\\"?`, 'g')
  match = pattern.exec(jsonString)
  
  if (match && match[1]) {
    let value = match[1]
    value = value.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\\\/g, '\\')
    return value
  }
  
  // 4. 字段名前有转义：\"field\": "value"
  pattern = new RegExp(`\\\\?"${fieldName}\\"?\\s*:\\s*"([^"]*(?:\\\\.[^"]*)*)"`, 'g')
  match = pattern.exec(jsonString)
  
  if (match && match[1]) {
    return match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\\\/g, '\\')
  }
  
  // 5. 尝试提取到字符串结束或下一个字段（处理截断的JSON）
  pattern = new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*)`, 'g')
  match = pattern.exec(jsonString)
  
  if (match && match[1]) {
    // 即使字符串未闭合，也返回已提取的部分
    return match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\\\/g, '\\')
  }
  
  return null
}

}