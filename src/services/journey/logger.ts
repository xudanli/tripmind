import { LoggingAdapter } from '@/utils/inspiration/core/logger'

export const logStep = (logger: LoggingAdapter, title: string) => {
  logger.log(`\n🧩 ${title}`)
}

export const logInfo = (logger: LoggingAdapter, message: string) => {
  logger.log(`  ✅ ${message}`)
}

export const logWarn = (logger: LoggingAdapter, description: string, error?: unknown) => {
  const suffix = error ? `: ${String(error)}` : ''
  logger.warn(`⚠️ ${description}${suffix}`)
}

export const logError = (logger: LoggingAdapter, description: string, error?: unknown) => {
  const suffix = error ? `: ${String(error)}` : ''
  logger.error(`❌ ${description}${suffix}`)
}
