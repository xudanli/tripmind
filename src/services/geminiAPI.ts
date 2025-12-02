import { API_CONFIG } from '@/config/api'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface GeminiContent {
  parts: Array<{ text: string }>
  role?: string
}

interface GeminiRequest {
  contents: GeminiContent[]
  generationConfig?: {
    temperature?: number
    maxOutputTokens?: number
    responseMimeType?: string
  }
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>
      role: string
    }
    finishReason: string
  }>
  usageMetadata?: {
    promptTokenCount: number
    candidatesTokenCount: number
    totalTokenCount: number
  }
}

export async function chatWithGemini(
  messages: ChatMessage[],
  options: {
    model?: string
    temperature?: number
    max_tokens?: number
    enforceJson?: boolean
  } = {}
): Promise<string> {
  if (!API_CONFIG.GEMINI_API_KEY) {
    console.warn('[Gemini] GEMINI_API_KEY 未配置，无法调用 Gemini 服务，自动回退到 DeepSeek。')
    return ''
  }

  const model = options.model || API_CONFIG.GEMINI_DEFAULT_MODEL
  
  // 转换消息格式为 Gemini 格式
  // Gemini 不支持 system 消息，需要将 system 消息合并到第一个 user 消息中
  const contents: GeminiContent[] = []
  let systemContent = ''
  
  for (const msg of messages) {
    if (msg.role === 'system') {
      // 收集所有 system 消息
      systemContent += (systemContent ? '\n\n' : '') + msg.content
    } else if (msg.role === 'user') {
      // 将 system 内容合并到第一个 user 消息
      const userContent = systemContent ? systemContent + '\n\n' + msg.content : msg.content
      contents.push({
        parts: [{ text: userContent }],
        role: 'user'
      })
      systemContent = '' // 清空，system 消息只在第一个 user 消息前
    } else if (msg.role === 'assistant') {
      contents.push({
        parts: [{ text: msg.content }],
        role: 'model'
      })
    }
  }
  
  // 如果最后还有 system 内容但没有 user 消息，将其作为第一个 user 消息
  if (systemContent && contents.length === 0) {
    contents.push({
      parts: [{ text: systemContent }],
      role: 'user'
    })
  }

  const requestBody: GeminiRequest = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.max_tokens ?? 2000,
      ...(options.enforceJson ? { responseMimeType: 'application/json' } : {})
    }
  }

  try {
    // Gemini API 格式: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}
    const url = `${API_CONFIG.GEMINI_BASE_URL}/v1beta/models/${model}:generateContent?key=${API_CONFIG.GEMINI_API_KEY}`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || response.statusText}`)
    }

    const data: GeminiResponse = await response.json()
    const candidate = data.candidates?.[0]
    
    if (candidate?.finishReason === 'SAFETY') {
      console.warn('[Gemini] 模型因安全原因拒绝生成内容')
      return ''
    }
    
    const text = candidate?.content?.parts?.[0]?.text
    return text?.trim() || ''
  } catch (error) {
    console.error('Gemini API call failed:', error)
    return ''
  }
}

