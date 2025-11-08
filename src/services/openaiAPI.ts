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
  response_format?: { type: 'json_object' | 'text' }
}

interface ChatCompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: ChatMessage & { refusal?: string }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function chatWithOpenAI(
  messages: ChatMessage[],
  options: {
    model?: string
    temperature?: number
    max_tokens?: number
    enforceJson?: boolean
  } = {}
): Promise<string> {
  if (!API_CONFIG.OPENAI_API_KEY) {
    console.warn('[OpenAI] OPENAI_API_KEY 未配置，无法调用 OpenAI 服务，自动回退到 DeepSeek。')
    return ''
  }

  const requestBody: ChatCompletionRequest = {
    model: options.model || API_CONFIG.OPENAI_DEFAULT_MODEL,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 2000,
    stream: false
  }

  if (options.enforceJson) {
    requestBody.response_format = { type: 'json_object' }
  }

  try {
    const response = await fetch(`${API_CONFIG.OPENAI_BASE_URL}${API_CONFIG.ENDPOINTS.OPENAI_CHAT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`)
    }

    const data: ChatCompletionResponse = await response.json()
    const choice = data.choices?.[0]?.message
    if (choice?.refusal) {
      console.warn('[OpenAI] 模型拒绝生成内容：', choice.refusal)
      return ''
    }
    return choice?.content?.trim() || ''
  } catch (error) {
    console.error('OpenAI API call failed:', error)
    return ''
  }
}

