import { API_CONFIG } from '@/config/api'
import { extractJSONObject, cleanMarkdownCodeBlocks, safeParseJSON } from '@/utils/jsonParser'
import { chatWithOpenAI } from './openaiAPI'
import { chatWithGemini } from './geminiAPI'
import { getUserPreferredLLMProvider, getUserPreferredLLMModel } from '@/config/userProfile'

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

export interface LLMChatOptions {
    model?: string
    temperature?: number
    max_tokens?: number
  enforceJson?: boolean
}

async function callDeepSeek(
  messages: ChatMessage[],
  options: LLMChatOptions = {}
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
 * 调用 DeepSeek API 进行聊天（保留旧导出）
 */
export async function chatWithDeepSeek(
  messages: ChatMessage[],
  options: LLMChatOptions = {}
): Promise<string> {
  return callDeepSeek(messages, options)
}

/**
 * 根据用户偏好选择 LLM 调用
 */
export async function chatWithLLM(
  messages: ChatMessage[],
  options: LLMChatOptions = {}
): Promise<string> {
  let provider: ReturnType<typeof getUserPreferredLLMProvider> = 'deepseek'
  try {
    provider = getUserPreferredLLMProvider()
  } catch (error) {
    console.warn('[LLM] 获取用户首选模型提供商失败，使用默认 DeepSeek。', error)
  }
  if (provider === 'openai') {
    let modelFromProfile = ''
    try {
      modelFromProfile = getUserPreferredLLMModel()
    } catch (error) {
      console.warn('[LLM] 获取 OpenAI 模型配置失败，使用默认值。', error)
    }
    const response = await chatWithOpenAI(messages, {
      ...options,
      model: options.model || modelFromProfile || API_CONFIG.OPENAI_DEFAULT_MODEL
    })
    if (response) {
      return response
    }
    console.warn('[LLM] OpenAI 响应为空或调用失败，回退使用 DeepSeek。')
  }
  
  if (provider === 'gemini') {
    let modelFromProfile = ''
    try {
      modelFromProfile = getUserPreferredLLMModel()
    } catch (error) {
      console.warn('[LLM] 获取 Gemini 模型配置失败，使用默认值。', error)
    }
    const response = await chatWithGemini(messages, {
      ...options,
      model: options.model || modelFromProfile || API_CONFIG.GEMINI_DEFAULT_MODEL
    })
    if (response) {
      return response
    }
    console.warn('[LLM] Gemini 响应为空或调用失败，回退使用 DeepSeek。')
  }
  
  return callDeepSeek(messages, options)
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
    const response = await chatWithLLM(messages, {
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
    const response = await chatWithLLM(messages, {
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
 * 生成目的地安全提示/注意事项
 */
export async function generateTravelSafetyNotice({
  destination,
  summary = '',
  highlights = '',
  language = 'zh-CN',
}: {
  destination: string
  summary?: string
  highlights?: string
  language?: string
}): Promise<string> {
  const normalizedDestination = destination.trim()
  const isEnglish = language.toLowerCase().startsWith('en')

  const systemPrompt = isEnglish
    ? `You are a seasoned travel safety consultant. Provide concise, practical safety guidance tailored to the given destination and trip summary. Respond with a single paragraph (max 2 sentences, ≤ 80 words). Focus on weather, terrain, local regulations, required gear, and emergency precautions. Avoid generic advice; be destination-specific.`
    : `你是一名资深旅行安全顾问。请根据目的地与行程摘要，提供精炼、实用的安全提示。用一段话回复（不超过2句话、80字以内），重点覆盖天气、地形、当地规定、装备要求与紧急应对，避免空泛泛的提醒。`

  const contextSegments = [
    summary?.trim(),
    highlights?.trim(),
  ]
    .filter(Boolean)
    .join('\n\n')

  const userPrompt = isEnglish
    ? `Destination: ${normalizedDestination || 'Unknown'}

Trip Context:
${contextSegments || 'No additional trip context provided.'}

Please provide destination-specific safety guidance.`
    : `目的地：${normalizedDestination || '未知目的地'}

行程背景：
${contextSegments || '无额外行程摘要。'}

请给出目的地相关的旅行安全提示。`

  try {
    const response = await chatWithLLM(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        temperature: 0.5,
        max_tokens: isEnglish ? 220 : 200,
      }
    )

    return response ? response.trim() : ''
  } catch (error) {
    console.error('Failed to generate travel safety notice:', error)
    return ''
  }
}

// planner 相关函数已删除

// seeker 相关函数已删除

/**
 * 识别用户意图并匹配体验类型
 */

// 灵感模式相关函数已删除（inspiration 模式相关）
// 如果需要这些功能，请使用后端 API
