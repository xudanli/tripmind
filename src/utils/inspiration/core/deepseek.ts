/**
 * DeepSeek API 封装模块
 * 提供带重试机制的 API 调用
 */

import { chatWithDeepSeek } from '@/services/deepseekAPI'

// ==================== 类型定义 ====================

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface AskDeepSeekOptions {
  temperature?: number
  max_tokens?: number
  retries?: number
}

// ==================== DeepSeek 客户端封装 ====================

/**
 * 调用 DeepSeek API，带重试机制
 */
export async function askDeepSeek(
  systemPrompt: string,
  userContent: string,
  opts?: AskDeepSeekOptions
): Promise<string> {
  const { temperature = 0.8, max_tokens = 2000, retries = 3 } = opts || {}
  
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent || '' }
  ]
  
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await chatWithDeepSeek(messages, {
        temperature,
        max_tokens
      })
      return (response || '').trim()
    } catch (error: any) {
      lastError = error
      if (attempt === retries - 1) {
        throw error
      }
      // 短暂延迟后重试（指数退避）
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100))
    }
  }
  
  throw lastError || new Error('DeepSeek API 调用失败')
}

