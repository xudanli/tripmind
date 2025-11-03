/**
 * 日志工具模块
 * 统一管理日志输出，支持 verbose 模式
 */

/**
 * 日志适配器 - 统一管理日志输出
 */
export class LoggingAdapter {
  constructor(private verbose: boolean = false) {}

  info(msg: string, ...args: any[]): void {
    if (this.verbose) console.log(msg, ...args)
  }

  warn(msg: string, ...args: any[]): void {
    if (this.verbose) console.warn(msg, ...args)
  }

  error(msg: string, err?: Error | any): void {
    if (this.verbose) {
      console.error(msg, err?.message || err || '')
    }
  }

  log(msg: string, ...args: any[]): void {
    if (this.verbose) console.log(msg, ...args)
  }
}

/**
 * 全局日志工具（向后兼容）
 */
export const logger = {
  log: (msg: string, data?: any, limit?: number) => {
    if (limit && data) {
      const str = typeof data === 'string' ? data : JSON.stringify(data)
      console.log(msg, str.substring(0, limit) + (str.length > limit ? '...' : ''))
    } else {
      console.log(msg, data)
    }
  },
  
  warn: (msg: string, data?: any, limit?: number) => {
    if (limit && data) {
      const str = typeof data === 'string' ? data : JSON.stringify(data)
      console.warn(msg, str.substring(0, limit) + (str.length > limit ? '...' : ''))
    } else {
      console.warn(msg, data)
    }
  },
  
  error: (msg: string, data?: any, limit?: number) => {
    if (limit && data) {
      const str = typeof data === 'string' ? data : JSON.stringify(data)
      console.error(msg, str.substring(0, limit) + (str.length > limit ? '...' : ''))
    } else {
      console.error(msg, data)
    }
  }
}

