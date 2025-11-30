/**
 * 简单的 JSON 处理器（替代已删除的 JSONProcessor）
 */
export class SimpleJSONProcessor {
  parseSafe<T>(json: string, options?: any): T | null {
    try {
      return JSON.parse(json) as T
    } catch (error) {
      console.warn('[JSONProcessor] 解析失败:', error)
      return null
    }
  }

  parse<T>(json: string): T {
    return JSON.parse(json) as T
  }
}

export const JSONProcessor = new SimpleJSONProcessor()

