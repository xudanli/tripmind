/**
 * DeepSeek LLM 客户端适配层
 * 统一 LLM 调用接口，提供超时、重试、JSON 模式等功能
 */

import { chatWithDeepSeek } from '@/services/deepseekAPI'
import { LoggingAdapter } from '@/utils/inspiration/core/logger'
import { parseSafe, tryRepairAndParse, extractDaysArray, extractTimeSlotsArray, type ParseResult } from '@/utils/jsonProcessor'

// ==================== 类型定义 ====================

export interface LLMCallOptions {
  temperature?: number
  max_tokens?: number
  retries?: number
  timeout?: number
}

export interface JsonFromLLMOptions extends LLMCallOptions {
  strict?: boolean     // 默认 false：允许修复
  fallbackArrays?: ('days'|'timeSlots')[] // 默认 ['days','timeSlots']
}

export interface LLMResponse {
  content: string
  truncated?: boolean
  attempt?: number
}

// ==================== LLM 客户端 ====================

export class DeepSeekClient {
  private logger: LoggingAdapter

  constructor(logger?: LoggingAdapter) {
    this.logger = logger || new LoggingAdapter(false)
  }

  /**
   * 调用 LLM（统一接口）
   */
  async callLLM(
    systemPrompt: string,
    userContent: string,
    options: LLMCallOptions = {}
  ): Promise<LLMResponse> {
    const {
      temperature = 0.8,
      max_tokens = 2000,
      retries = 3,
      timeout = 120000 // 增加到 120 秒，因为生成旅程需要较长时间
    } = options

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userContent || '' }
    ]

    let lastError: Error | null = null

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await Promise.race([
          chatWithDeepSeek(messages, { temperature, max_tokens }),
          this.createTimeoutPromise(timeout)
        ])

        const content = (response || '').trim()
        const truncated = this.detectTruncation(content)

        return {
          content,
          truncated,
          attempt: attempt + 1
        }
      } catch (error: any) {
        lastError = error
        if (attempt < retries - 1) {
          const delay = Math.pow(2, attempt) * 100
          this.logger.warn(`⚠️ LLM 调用失败，${delay}ms 后重试 (${attempt + 1}/${retries})`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError || new Error('DeepSeek API 调用失败')
  }

  /**
   * JSON-only 模式：调用 LLM 并解析 JSON
   * 使用 FSM 基础的 JSON 修复器处理未闭合字符串和不平衡括号
   */
  async jsonFromLLM<T = unknown>(
    systemPrompt: string,
    userContent: string,
    options: JsonFromLLMOptions = {}
  ): Promise<T> {
    const { strict = false, fallbackArrays = ['days', 'timeSlots'], ...llmOptions } = options
    
    const response = await this.callLLM(systemPrompt, userContent, llmOptions)
    const raw = response.content

    // 第一步：尝试直接解析（使用 FSM 修复器）
    const first = parseSafe<T>(raw)
    if (first.ok) {
      if (first.truncated) {
        this.logger.warn('⚠️ JSON 被截断，但已成功解析可用部分')
      }
      return first.data
    }

    this.logger.warn('❌ 直接解析 失败: ' + first.error.message)
    if (first.pos !== undefined) {
      this.logger.warn('错误位置 ' + first.pos + ' 上下文: ' + (first.context ?? ''))
    }

    if (strict) {
      throw first.error
    }

    // 第二步：尝试提取特定数组（days 或 timeSlots）
    this.logger.log('尝试 提取解析...')
    for (const key of fallbackArrays) {
      const r: ParseResult<any> = key === 'days' 
        ? extractDaysArray(raw)
        : extractTimeSlotsArray(raw)

      if (r.ok) {
        this.logger.warn(`✅ 使用截断到最后一个完整 ${key === 'days' ? 'day' : 'timeSlot'} 的 JSON`)
        // 如果提取的是数组，需要包装成对象格式（根据调用上下文）
        // 对于 timeSlots，可能需要包装成 { timeSlots: [...] }
        // 对于 days，可能需要包装成 { days: [...] }
        const wrapped = key === 'days' 
          ? { days: r.data } as T
          : { timeSlots: r.data } as T
        return wrapped
      } else if (!r.ok) {
        this.logger.warn(`⚠️ 提取 ${key} 失败: ${r.error.message}`)
      }
    }

    // 第三步：尝试综合修复策略
    this.logger.log('尝试 综合修复...')
    const last = tryRepairAndParse<T>(raw)
    if (last.ok) {
      this.logger.warn('✅ 使用综合修复策略成功解析')
      return last.data
    }

    // 第四步：如果解析失败且响应被截断，尝试降温重试
    if (response.truncated) {
      this.logger.warn('⚠️ JSON 解析失败且响应被截断，尝试降温重试...')
      try {
        const retryResponse = await this.callLLM(
          systemPrompt + '\n\n⚠️ CRITICAL: You MUST return complete, valid JSON. Ensure the JSON structure is fully closed. If the response is too long, prioritize structure completeness over content length.',
          userContent,
          { ...llmOptions, temperature: Math.max(0.3, (llmOptions.temperature || 0.8) - 0.2), max_tokens: Math.min((llmOptions.max_tokens || 2000) + 500, 4000) }
        )
        
        const retryFirst = parseSafe<T>(retryResponse.content)
        if (retryFirst.ok) {
          this.logger.warn('✅ 重试后成功解析')
          return retryFirst.data
        }

        const retryLast = tryRepairAndParse<T>(retryResponse.content)
        if (retryLast.ok) {
          this.logger.warn('✅ 重试后使用综合修复成功解析')
          return retryLast.data
        }
      } catch (retryError) {
        this.logger.warn('⚠️ 重试也失败了，继续使用原始响应尝试最后修复')
      }
    }

    // 第五步：最后尝试 - 如果期望的是 timeSlots，尝试从原始文本中提取部分数据
    if (fallbackArrays.includes('timeSlots')) {
      this.logger.log('尝试最后的手段：从原始文本中提取部分 timeSlots...')
      try {
        // 尝试找到最后一个完整的 timeSlot 对象
        const timeSlotPattern = /"timeSlots"\s*:\s*\[/i
        const match = raw.match(timeSlotPattern)
        if (match && match.index !== undefined) {
          const start = match.index + match[0].length
          // 尝试提取至少一个完整的 timeSlot
          const partial = raw.slice(start)
          // 查找第一个完整的对象 {...}
          const objStart = partial.indexOf('{')
          if (objStart >= 0) {
            let depth = 0
            let inStr = false
            let esc = false
            let end = -1
            for (let i = objStart; i < partial.length; i++) {
              const ch = partial[i]
              if (inStr) {
                if (esc) { esc = false; continue }
                if (ch === '\\') { esc = true; continue }
                if (ch === '"') { inStr = false; continue }
              } else {
                if (ch === '"') { inStr = true; continue }
                if (ch === '{') { depth++; continue }
                if (ch === '}') {
                  depth--
                  if (depth === 0) { end = i + 1; break }
                }
              }
            }
            if (end > objStart) {
              const singleSlot = partial.slice(objStart, end)
              try {
                // 使用 parseSafe 来安全解析单个对象
                const wrapped = `[${singleSlot}]`
                const result = parseSafe<any[]>(wrapped)
                if (result.ok && Array.isArray(result.data) && result.data.length > 0) {
                  const slotObj = result.data[0]
                  if (slotObj && typeof slotObj === 'object') {
                    this.logger.warn('✅ 成功提取至少一个 timeSlot，返回部分数据')
                    return { timeSlots: [slotObj] } as T
                  }
                }
              } catch (e) {
                // 忽略单个 slot 解析失败
              }
            }
          }
        }
      } catch (e) {
        // 忽略最后尝试的错误
      }
    }

    // 所有策略都失败，抛出错误
    throw new Error(`无法解析 LLM 返回的 JSON: ${first.error.message}`)
  }

  /**
   * 检测响应是否被截断
   */
  private detectTruncation(content: string): boolean {
    const trimmed = content.trim()
    if (!trimmed) return false
    
    // 检查是否以完整的 JSON 结构结尾
    const endsWithComplete = trimmed.endsWith('}') || trimmed.endsWith(']')
    if (endsWithComplete) {
      // 进一步检查括号是否匹配
      const openBraces = (trimmed.match(/{/g) || []).length
      const closeBraces = (trimmed.match(/}/g) || []).length
      const openBrackets = (trimmed.match(/\[/g) || []).length
      const closeBrackets = (trimmed.match(/\]/g) || []).length
      
      return openBraces !== closeBraces || openBrackets !== closeBrackets
    }
    
    return true
  }

  /**
   * 创建超时 Promise
   */
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`LLM 调用超时 (${timeout}ms)`)), timeout)
    })
  }
}

// ==================== 导出函数 ====================

/**
 * 创建 DeepSeek 客户端实例
 */
export function createDeepSeekClient(logger?: LoggingAdapter): DeepSeekClient {
  return new DeepSeekClient(logger)
}

/**
 * 向后兼容：askDeepSeek
 */
export async function askDeepSeek(
  systemPrompt: string,
  userContent: string,
  options: LLMCallOptions = {}
): Promise<string> {
  const client = createDeepSeekClient()
  const response = await client.callLLM(systemPrompt, userContent, options)
  return response.content
}

