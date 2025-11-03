import { API_CONFIG } from '@/config/api'
import { extractJSONObject, cleanMarkdownCodeBlocks, safeParseJSON } from '@/utils/jsonParser'

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

// 灵感模式相关函数已移动到 inspirationAPI.ts，此处重新导出以保持向后兼容
export {
  generateInspirationHint,
  detectInspirationIntent,
  personaVoiceBank,
  getPersonaVoice,
  switchPersonaBasedOnEmotion,
  generatePersonaResponse,
  generatePsychologicalJourney,
  generateInspirationJourney
} from './inspirationAPI'
