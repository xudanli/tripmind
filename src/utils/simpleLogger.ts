/**
 * 简单的日志适配器（替代已删除的 LoggingAdapter）
 */
export class SimpleLogger {
  private enabled: boolean

  constructor(enabled: boolean = false) {
    this.enabled = enabled
  }

  log(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(`[Logger] ${message}`, ...args)
    }
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[Logger] ${message}`, ...args)
  }

  error(message: string, ...args: any[]): void {
    console.error(`[Logger] ${message}`, ...args)
  }
}

