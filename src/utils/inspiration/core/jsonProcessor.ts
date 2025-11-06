// path: src/utils/inspiration/core/jsonProcessor.ts
/**
 * JSON 处理工具模块（修正版）
 */
import { cleanMarkdownCodeBlocks, fixJSONIssues } from '@/utils/jsonParser'
import { logger } from './logger' // ✅ 改用兼容层 logger（含 log/warn/error）

export interface ParseOptions {
  verbose?: boolean
  maxRepairAttempts?: number
  allowPartial?: boolean
}

/** 用于函数签名的最小 Logger 形状 */
type LogLike = {
  log: (msg: string, data?: unknown) => void
  warn: (msg: string, data?: unknown) => void
  error: (msg: string, data?: unknown) => void
}

export class JSONProcessor {
  /** 提取 JSON 对象或数组（去除 markdown 代码块包装） */
  static extractJSONObjectOrArray(text: string): string {
    const cleaned = cleanMarkdownCodeBlocks(text)
    const firstBrace = cleaned.indexOf('{')
    const firstBracket = cleaned.indexOf('[')
    if (firstBrace === -1 && firstBracket === -1) return cleaned
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
      const ch = text[i]
      if (escapeNext) { escapeNext = false; continue }
      if (ch === '\\') { escapeNext = true; continue }
      if (ch === '"') { inString = !inString; continue }
      if (inString) continue
      if (ch === '{' || ch === '[') braceCount++
      else if (ch === '}' || ch === ']') {
        braceCount--
        if (braceCount === 0) return i
      }
    }
    return text.length - 1
  }

  /** 安全解析 JSON（统一入口） */
  static parseSafe<T extends object = Record<string, unknown>>(
    raw: string,
    options: ParseOptions = {}
  ): T | null {
    const { verbose = false, maxRepairAttempts = 5, allowPartial = false } = options
    const log: LogLike = logger // ✅ 使用已有兼容层

    if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
      log.warn('❌ 输入为空或无效')
      return null
    }

    const strategies: Array<{ name: string; fn: () => unknown }> = [
      { name: '直接解析', fn: () => JSON.parse(cleanMarkdownCodeBlocks(raw)) },
      { name: '提取解析', fn: () => JSON.parse(this.extractJSONObjectOrArray(raw)) },
      { name: '基础修复', fn: () => JSON.parse(fixJSONIssues(raw)) },
    ]
    if (allowPartial) {
      strategies.push({ name: '截取修复', fn: () => this.attemptPartialParse(raw, log) })
    }

    let lastError: Error | null = null

    for (const strategy of strategies.slice(0, maxRepairAttempts)) {
      try {
        if (verbose) log.log(`尝试 ${strategy.name}...`)
        const result = strategy.fn()
        if (verbose) log.log(`✅ ${strategy.name} 成功`)
        return result as T
      } catch (e: unknown) {
        const err = e as Error
        lastError = err
        log.warn(`❌ ${strategy.name} 失败:`, err?.message ?? String(err))

        const m = err?.message?.match(/position\s+(\d+)/i)
        if (m) {
          const pos = parseInt(m[1]!, 10)
          const context = raw.substring(Math.max(0, pos - 100), Math.min(raw.length, pos + 100))
          log.warn(`错误位置 ${pos} 上下文: ...${context}...`)

          if (strategy.name === '基础修复') {
            try {
              const enhanced = this.enhancedFixAtPosition(raw, pos)
              const result = JSON.parse(enhanced)
              log.warn('✅ 使用位置增强修复成功')
              return result as T
            } catch {
              /* 继续下个策略 */
            }
          }
        }
      }
    }

    if (verbose && lastError) {
      log.error('❌ 所有 JSON 解析尝试都失败', lastError)
      log.error('最后错误:', lastError.message)
      log.error('原始响应前500字符:', raw.substring(0, 500))
      log.error('原始响应后500字符:', raw.substring(Math.max(0, raw.length - 500)))
    }
    return null
  }

  /** 部分解析：完整失败时的降级 */
  static attemptPartialParse(text: string, log: LogLike): any {
    const cleaned = cleanMarkdownCodeBlocks(text)

    try {
      const withFixedStrings = this.fixUnterminatedStringsInJSON(cleaned)
      const result = this.tryRepairAndParse(withFixedStrings, log, '修复未终止字符串后的 JSON')
      if (result) return result
    } catch { /* 继续 */ }

    const lastValidEnd = this.findLastValidJSONEnd(cleaned)
    if (lastValidEnd > 0 && lastValidEnd > cleaned.length * 0.15) {
      const partial = cleaned.substring(0, lastValidEnd)
      const result = this.tryRepairAndParse(partial, log, `部分 JSON (${lastValidEnd}/${cleaned.length} 字符)`)
      if (result) return result
    }

    const days = this.extractDaysArray(cleaned, log)
    if (days) return days

    const field = this.extractLastCompleteField(cleaned, log)
    if (field) return field

    const slots = this.extractTimeSlotsArray(cleaned, log)
    if (slots) return slots

    throw new Error('无法提取有效的部分 JSON')
  }

  /** 修复 JSON 中未终止的字符串 */
  private static fixUnterminatedStringsInJSON(text: string): string {
    let result = ''
    let inString = false
    let escapeNext = false
    let stringStart = -1
    let braceDepth = 0
    let bracketDepth = 0

    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      const next = i < text.length - 1 ? text[i + 1] : ''

      if (escapeNext) { result += ch; escapeNext = false; continue }
      if (ch === '\\') { result += ch; escapeNext = true; continue }

      if (ch === '"') {
        if (!inString) {
          inString = true
          stringStart = i
          result += ch
        } else {
          const isEnd = next === ',' || next === '}' || next === ']' || next === ':' || /^\s*[,}\]:]/.test(text.substring(i + 1, i + 10))
          if (isEnd) { inString = false; result += ch }
          else { result += '\\"' } // 可能是未转义引号
        }
        continue
      }

      if (!inString) {
        if (ch === '{') braceDepth++
        if (ch === '}') braceDepth--
        if (ch === '[') bracketDepth++
        if (ch === ']') bracketDepth--
      }
      // 行内换行 → 转义
      if (inString && (ch === '\n' || ch === '\r')) result += '\\n'
      else result += ch
    }

    if (inString) {
      // 智能闭合
      let last = text.length - 1
      while (last > stringStart && /\s/.test(text[last]!)) last--
      const strLen = last - stringStart
      if (strLen > 100) result += '"'
      else result += '"'
      // 补括号
      if (braceDepth > 0) result += '}'.repeat(braceDepth)
      if (bracketDepth > 0) result += ']'.repeat(bracketDepth)
    }

    return result
  }

  /** 提取 timeSlots 数组（dayDetails 降级） */
  private static extractTimeSlotsArray(cleaned: string, log: LogLike): any | null {
    const m = cleaned.match(/"timeSlots"\s*:\s*\[/i)
    if (!m || m.index === undefined) return null

    const start = m.index! + m[0].length // ✅ 非空断言
    let depth = 1, inString = false, esc = false
    let lastEnd = -1

    for (let i = start; i < cleaned.length; i++) {
      const ch = cleaned[i]
      if (esc) { esc = false; continue }
      if (ch === '\\') { esc = true; continue }
      if (ch === '"') { inString = !inString; continue }
      if (!inString) {
        if (ch === '{') depth++
        if (ch === '}') {
          depth--
          if (depth === 1) lastEnd = i + 1
          if (depth === 0) break
        }
      }
    }

    if (lastEnd > start && lastEnd > cleaned.length * 0.2) {
      const before = cleaned.substring(0, m.index!)
      const body = cleaned.substring(start, lastEnd).replace(/,\s*$/, '')
      const truncated = `${before.trim()} "timeSlots": [${body}]}`

      try {
        const fixed = fixJSONIssues(truncated)
        const { neededBraces, neededBrackets } = this.repairUnclosedBrackets(fixed) // ✅ 正确字段
        const final = fixed + '}'.repeat(Math.max(0, neededBraces)) + ']'.repeat(Math.max(0, neededBrackets))
        const result = JSON.parse(final)
        log.warn(`✅ 使用截断到最后一个完整 timeSlot 的 JSON (${final.length}/${cleaned.length} 字符)`)
        return result
      } catch (e: unknown) {
        const err = e as Error
        log.warn(`⚠️ 提取 timeSlots 失败: ${err.message}`)
        return null
      }
    }
    return null
  }

  /** 解析 + 修复尝试 */
  private static tryRepairAndParse(json: string, log: LogLike, ctx: string): any {
    try {
      const fixed = fixJSONIssues(json)
      const result = JSON.parse(fixed)
      log.warn(`✅ 使用${ctx}`)
      return result
    } catch (e: unknown) {
      const err = e as Error
      log.warn(`⚠️ ${ctx}解析失败: ${err.message}`)
      try { return JSON.parse(json) } catch { return null }
    }
  }

  /** 提取 days 数组（被截断时） */
  private static extractDaysArray(cleaned: string, log: LogLike): any | null {
    const m = cleaned.match(/"days"\s*:\s*\[/i)
    if (!m || m.index === undefined) return null

    const start = m.index! + m[0].length // ✅ 非空断言
    const { lastCompleteDayEnd } = this.findLastCompleteDay(cleaned, start)

    if (lastCompleteDayEnd > start && lastCompleteDayEnd > cleaned.length * 0.15) {
      const before = cleaned.substring(0, m.index!)
      const body = cleaned.substring(start, lastCompleteDayEnd).replace(/,\s*$/, '')
      const truncated = `${before.trim()} "days": [${body}]}`

      return this.tryRepairDaysArray(truncated, cleaned.length, log)
    }
    return null
  }

  private static findLastCompleteDay(cleaned: string, daysStart: number) {
    let depth = 1, inStr = false, esc = false
    let lastEnd = -1
    let lastStart = daysStart

    let i = daysStart
    while (i < cleaned.length && /\s/.test(cleaned[i]!)) i++

    for (; i < cleaned.length; i++) {
      const ch = cleaned[i]
      if (!ch) break
      if (esc) { esc = false; continue }
      if (ch === '\\') { esc = true; continue }
      if (ch === '"') { inStr = !inStr; continue }
      if (!inStr) {
        if (ch === '{' || ch === '[') { depth++; if (ch === '{' && depth === 2) lastStart = i }
        else if (ch === '}' || ch === ']') {
          depth--
          if (depth === 1 && ch === '}') {
            lastEnd = i + 1
            let j = i + 1
            while (j < cleaned.length && /\s/.test(cleaned[j]!)) j++
            if (j < cleaned.length && cleaned[j] === ',') continue
          }
          if (depth === 0) break
        }
      }
    }
    return { lastCompleteDayEnd: lastEnd, lastCompleteDayStart: lastStart }
  }

  private static tryRepairDaysArray(truncated: string, originalLength: number, log: LogLike): any | null {
    try {
      const fixed = fixJSONIssues(truncated)
      const { neededBraces, neededBrackets } = this.repairUnclosedBrackets(fixed) // ✅
      const final = fixed + '}'.repeat(Math.max(0, neededBraces)) + ']'.repeat(Math.max(0, neededBrackets))
      const result = JSON.parse(final)
      log.warn(`✅ 使用截断到最后一个完整 day 的 JSON (${final.length}/${originalLength} 字符)`)
      return result
    } catch (e: unknown) {
      const err = e as Error
      log.warn(`⚠️ 截断到 day 失败: ${err.message}`)
      return null
    }
  }

  private static extractLastCompleteField(cleaned: string, log: LogLike): any | null {
    const lastValidBrace = cleaned.lastIndexOf('{')
    if (lastValidBrace <= 0 || lastValidBrace <= cleaned.length * 0.2) return null

    for (let i = cleaned.length - 1; i >= lastValidBrace; i--) {
      const ch = cleaned[i]
      if ((ch === ',' || ch === '}') && i > lastValidBrace + 100 && i > 0) {
        const beforeChar = cleaned[i - 1]
        if (beforeChar && (beforeChar === '"' || beforeChar === ']' || beforeChar === '}' || /[\d\w]/.test(beforeChar))) {
          const truncated = cleaned.substring(0, i + (ch === ',' ? 1 : 0))
          const result = this.tryRepairField(truncated, cleaned.length, log)
          if (result) return result
        }
      }
    }
    return null
  }

  private static tryRepairField(truncated: string, originalLength: number, log: LogLike): any | null {
    try {
      let fixed = fixJSONIssues(truncated)
      fixed = this.repairUnclosedStrings(fixed)
      const { neededBraces, neededBrackets } = this.repairUnclosedBrackets(fixed) // ✅
      let final = fixed.replace(/,\s*$/, '')
      if (neededBrackets > 0) final += ']'.repeat(neededBrackets)
      if (neededBraces > 0) final += '}'.repeat(neededBraces)
      const result = JSON.parse(final)
      log.warn(`✅ 使用字段边界截断修复的 JSON (${final.length}/${originalLength} 字符)`)
      return result
    } catch {
      return null
    }
  }

  private static repairUnclosedStrings(text: string): string {
    let inStr = false, esc = false
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      if (esc) { esc = false; continue }
      if (ch === '\\') { esc = true; continue }
      if (ch === '"') inStr = !inStr
    }
    return inStr ? text.replace(/"([^"]*)$/, '"$1"') : text
  }

  private static repairUnclosedBrackets(text: string): { neededBraces: number; neededBrackets: number } {
    let openBraces = 0, closeBraces = 0, openBrackets = 0, closeBrackets = 0
    let inStr = false, esc = false
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      if (esc) { esc = false; continue }
      if (ch === '\\') { esc = true; continue }
      if (ch === '"') { inStr = !inStr; continue }
      if (!inStr) {
        if (ch === '{') openBraces++
        if (ch === '}') closeBraces++
        if (ch === '[') openBrackets++
        if (ch === ']') closeBrackets++
      }
    }
    return { neededBraces: Math.max(0, openBraces - closeBraces), neededBrackets: Math.max(0, openBrackets - closeBrackets) }
  }

  private static findLastValidJSONEnd(text: string): number {
    let lastValidEnd = -1, depth = 0, inStr = false, esc = false
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      if (esc) { esc = false; continue }
      if (ch === '\\') { esc = true; continue }
      if (ch === '"') { inStr = !inStr; continue }
      if (!inStr) {
        if (ch === '{' || ch === '[') depth++
        if (ch === '}' || ch === ']') {
          depth--
          if (depth === 0) lastValidEnd = i + 1
        }
      }
    }
    return lastValidEnd
  }

  private static enhancedFixAtPosition(text: string, errorPosition: number): string {
    let fixed = cleanMarkdownCodeBlocks(text)
    const start = Math.max(0, errorPosition - 200)
    const end = Math.min(fixed.length, errorPosition + 200)
    // 缺逗号修复（保守）
    for (let i = errorPosition - 1; i >= Math.max(0, errorPosition - 50); i--) {
      const ch = fixed[i]
      const next = fixed[i + 1]
      if ((ch === '"' || /[\d\w}]/.test(ch ?? '')) && next && !/[,\]}"]/.test(next)) {
        const m = fixed.substring(i + 1).match(/^\s*([^,\s\]}])/)
        if (m && m[1] === '"') {
          fixed = fixed.substring(0, i + 1) + ',' + fixed.substring(i + 1)
          break
        }
      }
    }
    fixed = fixJSONIssues(fixed)
    return fixed
  }
}

/** === 导出向后兼容 === */
export function parseJSONSafe<T extends object = Record<string, unknown>>(raw: string): T | null {
  return JSONProcessor.parseSafe<T>(raw, { verbose: true, allowPartial: true, maxRepairAttempts: 5 })
}
export const extractJSONObjectOrArray = JSONProcessor.extractJSONObjectOrArray
