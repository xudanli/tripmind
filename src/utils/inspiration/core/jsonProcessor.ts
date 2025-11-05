/**
 * JSON 处理工具模块
 * 负责 JSON 解析、提取和修复
 */

import { cleanMarkdownCodeBlocks, fixJSONIssues } from '@/utils/jsonParser'
import { LoggingAdapter } from './logger'

// ==================== 类型定义 ====================

export interface ParseOptions {
  verbose?: boolean
  maxRepairAttempts?: number
  allowPartial?: boolean
}

// ==================== JSON 处理工具类 ====================

/**
 * JSON 处理工具类
 * 提供安全的 JSON 解析和修复功能
 */
export class JSONProcessor {
  /**
   * 提取 JSON 对象或数组（去除 markdown 代码块包装）
   */
  static extractJSONObjectOrArray(text: string): string {
    let cleaned = cleanMarkdownCodeBlocks(text)
    
    const firstBrace = cleaned.indexOf('{')
    const firstBracket = cleaned.indexOf('[')
    
    if (firstBrace === -1 && firstBracket === -1) {
      return cleaned
    }
    
    const start = this.findJSONStart(firstBrace, firstBracket)
    const end = this.findJSONEnd(cleaned, start)
    
    return cleaned.substring(start, end + 1)
  }

  private static findJSONStart(firstBrace: number, firstBracket: number): number {
    if (firstBrace === -1) return firstBracket
    if (firstBracket === -1) return firstBrace
    return Math.min(firstBrace, firstBracket)
  }

  private static findJSONEnd(text: string, start: number): number {
    let braceCount = 0
    let inString = false
    let escapeNext = false
    
    for (let i = start; i < text.length; i++) {
      const char = text[i]
      
      if (escapeNext) {
        escapeNext = false
        continue
      }
      
      if (char === '\\') {
        escapeNext = true
        continue
      }
      
      if (char === '"') {
        inString = !inString
        continue
      }
      
      if (inString) continue
      
      if (char === '{' || char === '[') {
        braceCount++
      } else if (char === '}' || char === ']') {
        braceCount--
        if (braceCount === 0) {
          return i
        }
      }
    }
    
    return text.length - 1
  }

  /**
   * 安全解析 JSON（统一入口）
   * 使用泛型约束增强类型安全
   */
  static parseSafe<T extends object = Record<string, unknown>>(
    raw: string,
    options: ParseOptions = {}
  ): T | null {
    const { verbose = false, maxRepairAttempts = 5, allowPartial = false } = options
    const log = new LoggingAdapter(verbose)
    
    if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
      log.warn('❌ 输入为空或无效')
      return null
    }
    
    const strategies = [
      { name: '直接解析', fn: () => JSON.parse(cleanMarkdownCodeBlocks(raw)) },
      { name: '提取解析', fn: () => JSON.parse(this.extractJSONObjectOrArray(raw)) },
      { name: '基础修复', fn: () => JSON.parse(fixJSONIssues(raw)) },
    ]
    
    if (allowPartial) {
      strategies.push({ 
        name: '截取修复', 
        fn: () => this.attemptPartialParse(raw, log) 
      })
    }
    
    let lastError: Error | null = null
    
    for (const strategy of strategies.slice(0, maxRepairAttempts)) {
      try {
        log.info(`尝试 ${strategy.name}...`)
        const result = strategy.fn()
        log.info(`✅ ${strategy.name} 成功`)
        return result as T
      } catch (error: any) {
        lastError = error
        log.warn(`❌ ${strategy.name} 失败:`, error?.message || String(error))
        
        // 如果是 JSON 解析错误，显示错误位置上下文
        if (error?.message?.includes('position')) {
          const posMatch = error.message.match(/position (\d+)/)
          if (posMatch) {
            const pos = parseInt(posMatch[1])
            const context = raw.substring(Math.max(0, pos - 100), Math.min(raw.length, pos + 100))
            log.warn(`错误位置 ${pos} 上下文: ...${context}...`)
            
            // 尝试在错误位置附近进行智能修复
            if (strategy.name === '基础修复') {
              try {
                const enhancedFixed = this.enhancedFixAtPosition(raw, pos)
                const result = JSON.parse(enhancedFixed)
                log.warn(`✅ 使用位置增强修复成功`)
                return result as T
              } catch {
                // 增强修复也失败，继续下一个策略
              }
            }
          }
        }
      }
    }
    
    // 所有策略都失败，输出详细错误信息
    if (verbose && lastError) {
      log.error('❌ 所有 JSON 解析尝试都失败', lastError)
      log.error('最后错误:', lastError.message)
      log.error('原始响应前500字符:', raw.substring(0, 500))
      log.error('原始响应后500字符:', raw.substring(Math.max(0, raw.length - 500)))
    }
    
    return null
  }

  /**
   * 尝试部分解析（当完整解析失败时）
   */
  static attemptPartialParse(text: string, log: LoggingAdapter): any {
    const cleaned = cleanMarkdownCodeBlocks(text)
    
    // 策略1: 查找最后一个完整的顶层 JSON 对象
    let lastValidEnd = this.findLastValidJSONEnd(cleaned)
    
    if (lastValidEnd > 0 && lastValidEnd > cleaned.length * 0.15) {
      const partialJson = cleaned.substring(0, lastValidEnd)
      const result = this.tryRepairAndParse(partialJson, log, `部分 JSON (${lastValidEnd}/${cleaned.length} 字符)`)
      if (result) return result
    }
    
    // 策略2: 尝试提取 days 数组
    const daysResult = this.extractDaysArray(cleaned, log)
    if (daysResult) return daysResult
    
    // 策略3: 查找最后一个完整的字段
    const fieldResult = this.extractLastCompleteField(cleaned, log)
    if (fieldResult) return fieldResult
    
    throw new Error('无法提取有效的部分 JSON')
  }

  /**
   * 尝试修复并解析 JSON
   */
  private static tryRepairAndParse(
    json: string,
    log: LoggingAdapter,
    context: string
  ): any {
    try {
      const fixed = fixJSONIssues(json)
      const result = JSON.parse(fixed)
      log.warn(`✅ 使用${context}`)
      return result
    } catch (parseError: any) {
      log.warn(`⚠️ ${context}解析失败: ${parseError.message}`)
      try {
        return JSON.parse(json)
      } catch {
        return null
      }
    }
  }

  /**
   * 提取 days 数组（如果 JSON 被截断）
   */
  private static extractDaysArray(cleaned: string, log: LoggingAdapter): any | null {
    const daysMatch = cleaned.match(/"days"\s*:\s*\[/i)
    if (!daysMatch || daysMatch.index === undefined) return null
    
    const daysStart = daysMatch.index + daysMatch[0].length
    const { lastCompleteDayEnd } = this.findLastCompleteDay(cleaned, daysStart)
    
    if (lastCompleteDayEnd > daysStart && lastCompleteDayEnd > cleaned.length * 0.15) {
      const beforeDays = cleaned.substring(0, daysMatch.index)
      let daysArray = cleaned.substring(daysStart, lastCompleteDayEnd).replace(/,\s*$/, '')
      const truncated = beforeDays.trim() + ` "days": [${daysArray}]}`
      
      return this.tryRepairDaysArray(truncated, cleaned.length, log)
    }
    
    return null
  }

  /**
   * 查找最后一个完整的 day 对象
   */
  private static findLastCompleteDay(cleaned: string, daysStart: number): {
    lastCompleteDayEnd: number
    lastCompleteDayStart: number
  } {
    let depth = 1
    let inString = false
    let escapeNext = false
    let lastCompleteDayEnd = -1
    let lastCompleteDayStart = daysStart
    
    let i = daysStart
    while (i < cleaned.length) {
      const char = cleaned[i]
      if (!char || !/\s/.test(char)) break
      i++
    }
    
    for (; i < cleaned.length; i++) {
      const char = cleaned[i]
      if (!char) break
      
      if (escapeNext) {
        escapeNext = false
        continue
      }
      
      if (char === '\\') {
        escapeNext = true
        continue
      }
      
      if (char === '"') {
        inString = !inString
        continue
      }
      
      if (!inString) {
        if (char === '{' || char === '[') {
          depth++
          if (char === '{' && depth === 2) {
            lastCompleteDayStart = i
          }
        } else if (char === '}' || char === ']') {
          depth--
          if (depth === 1 && char === '}') {
            lastCompleteDayEnd = i + 1
            let j = i + 1
            while (j < cleaned.length) {
              const nextChar = cleaned[j]
              if (!nextChar || !/\s/.test(nextChar)) break
              j++
            }
            if (j < cleaned.length && cleaned[j] === ',') {
              continue
            }
          }
          if (depth === 0) break
        }
      }
    }
    
    return { lastCompleteDayEnd, lastCompleteDayStart }
  }

  /**
   * 尝试修复并解析 days 数组
   */
  private static tryRepairDaysArray(
    truncated: string,
    originalLength: number,
    log: LoggingAdapter
  ): any | null {
    try {
      const fixed = fixJSONIssues(truncated)
      const { needed } = this.repairUnclosedBrackets(fixed)
      const final = needed > 0 ? fixed + '}'.repeat(needed) : fixed
      const result = JSON.parse(final)
      log.warn(`✅ 使用截断到最后一个完整 day 的 JSON (${final.length}/${originalLength} 字符)`)
      return result
    } catch (error: any) {
      log.warn(`⚠️ 截断到 day 失败: ${error.message}`)
      return null
    }
  }

  /**
   * 查找最后一个完整的字段
   */
  private static extractLastCompleteField(cleaned: string, log: LoggingAdapter): any | null {
    const lastValidBrace = cleaned.lastIndexOf('{')
    if (lastValidBrace <= 0 || lastValidBrace <= cleaned.length * 0.2) return null
    
    // 简化策略：从后往前找最后一个逗号或右括号
    for (let i = cleaned.length - 1; i >= lastValidBrace; i--) {
      const char = cleaned[i]
      if ((char === ',' || char === '}') && i > lastValidBrace + 100 && i > 0) {
        const beforeChar = cleaned[i - 1]
        if (beforeChar && (beforeChar === '"' || beforeChar === ']' || beforeChar === '}' || /[\d\w]/.test(beforeChar))) {
          const truncated = cleaned.substring(0, i + (char === ',' ? 1 : 0))
          const result = this.tryRepairField(truncated, cleaned.length, log)
          if (result) return result
        }
      }
    }
    
    return null
  }

  /**
   * 尝试修复字段
   */
  private static tryRepairField(
    truncated: string,
    originalLength: number,
    log: LoggingAdapter
  ): any | null {
    try {
      let fixed = fixJSONIssues(truncated)
      fixed = this.repairUnclosedStrings(fixed)
      const { neededBraces, neededBrackets } = this.repairUnclosedBrackets(fixed)
      
      let final = fixed.replace(/,\s*$/, '')
      if (neededBrackets > 0) final += ']'.repeat(neededBrackets)
      if (neededBraces > 0) final += '}'.repeat(neededBraces)
      
      const result = JSON.parse(final)
      log.warn(`✅ 使用字段边界截断修复的 JSON (${final.length}/${originalLength} 字符)`)
      return result
    } catch (error: any) {
      return null
    }
  }

  /**
   * 修复未闭合的字符串
   */
  private static repairUnclosedStrings(text: string): string {
    let inString = false
    let escapeNext = false
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      if (escapeNext) {
        escapeNext = false
        continue
      }
      if (char === '\\') {
        escapeNext = true
        continue
      }
      if (char === '"') {
        inString = !inString
      }
    }
    
    return inString ? text.replace(/"([^"]*)$/, '"$1"') : text
  }

  /**
   * 修复未闭合的括号
   */
  private static repairUnclosedBrackets(text: string): {
    neededBraces: number
    neededBrackets: number
  } {
    let openBraces = 0
    let closeBraces = 0
    let openBrackets = 0
    let closeBrackets = 0
    let inString = false
    let escapeNext = false
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      if (escapeNext) {
        escapeNext = false
        continue
      }
      if (char === '\\') {
        escapeNext = true
        continue
      }
      if (char === '"') {
        inString = !inString
        continue
      }
      if (!inString) {
        if (char === '{') openBraces++
        if (char === '}') closeBraces++
        if (char === '[') openBrackets++
        if (char === ']') closeBrackets++
      }
    }
    
    return {
      neededBraces: openBraces - closeBraces,
      neededBrackets: openBrackets - closeBrackets
    }
  }

  /**
   * 查找最后一个有效的 JSON 结束位置
   */
  private static findLastValidJSONEnd(text: string): number {
    let lastValidEnd = -1
    let currentDepth = 0
    let inString = false
    let escapeNext = false
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      
      if (escapeNext) {
        escapeNext = false
        continue
      }
      
      if (char === '\\') {
        escapeNext = true
        continue
      }
      
      if (char === '"') {
        inString = !inString
        continue
      }
      
      if (!inString) {
        if (char === '{' || char === '[') currentDepth++
        if (char === '}' || char === ']') {
          currentDepth--
          if (currentDepth === 0) lastValidEnd = i + 1
        }
      }
    }
    
    return lastValidEnd
  }

  /**
   * 在指定位置进行增强修复
   */
  private static enhancedFixAtPosition(text: string, errorPosition: number): string {
    let fixed = cleanMarkdownCodeBlocks(text)
    
    // 在错误位置附近查找并修复常见问题
    const start = Math.max(0, errorPosition - 200)
    const end = Math.min(fixed.length, errorPosition + 200)
    const context = fixed.substring(start, end)
    
    // 1. 检查是否有缺少逗号的情况
    // 在错误位置前查找可能的字段结束位置
    for (let i = errorPosition - 1; i >= Math.max(0, errorPosition - 50); i--) {
      const char = fixed[i]
      const nextChar = fixed[i + 1]
      
      // 如果找到一个字符串或值的结束，但后面没有逗号或右括号
      if ((char === '"' || /[\d\w}]/.test(char)) && nextChar && !/[,\]}"]/.test(nextChar)) {
        // 检查下一个非空白字符
        const nextNonWs = fixed.substring(i + 1).match(/^\s*([^,\s\]}])/)
        if (nextNonWs && nextNonWs[1] === '"') {
          // 在字段值后添加逗号
          fixed = fixed.substring(0, i + 1) + ',' + fixed.substring(i + 1)
          break
        }
      }
    }
    
    // 2. 修复可能的未转义引号
    fixed = fixJSONIssues(fixed)
    
    return fixed
  }
}

// ==================== 导出函数 ====================

/**
 * 安全解析 JSON（向后兼容）
 */
export function parseJSONSafe<T extends object = Record<string, unknown>>(
  raw: string
): T | null {
  return JSONProcessor.parseSafe<T>(raw, {
    verbose: true,
    allowPartial: true,
    maxRepairAttempts: 5
  })
}

/**
 * 提取 JSON 对象或数组（向后兼容）
 */
export const extractJSONObjectOrArray = JSONProcessor.extractJSONObjectOrArray

