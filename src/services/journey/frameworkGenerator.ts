import { buildJourneyPrompt, type JourneyPromptArgs } from '@/prompts/inspiration/journey'
import { calcFrameworkMaxTokens } from '@/utils/tokens'
import type { IntentResult, Itinerary } from '@/validators/itinerarySchema'
import type { TravelContext } from '@/types/travel'
import { LLM_DEFAULT_OPTIONS } from './constants'
import { logInfo, logWarn, logError } from './logger'

interface GenerateFrameworkParams {
  input: string
  intent: IntentResult
  ctx: TravelContext
  selectedDestination?: string
  estimatedDays: number
  referenceCatalog: string
  locationGuidance?: string
  llm: any
  logger: any
}

export async function generateFramework({
  input,
  intent,
  ctx,
  selectedDestination,
  estimatedDays,
  referenceCatalog,
  locationGuidance,
  llm,
  logger,
}: GenerateFrameworkParams): Promise<Itinerary> {
  const startDate: string = new Date().toISOString().split('T')[0] || new Date().toISOString().substring(0, 10)

  const promptArgs: JourneyPromptArgs = {
    language: ctx.language,
    intent,
    startDate,
    targetDays: estimatedDays,
    userCountry: ctx.userCountry,
    selectedDestination,
    userNationality: ctx.userNationality,
    userPermanentResidency: ctx.userPermanentResidency,
    heldVisas: ctx.heldVisas,
    visaFreeDestinations: ctx.visaFreeDestinations,
    visaInfoSummary: ctx.visaInfoSummary || undefined,
    referenceCatalog,
    locationGuidance,
  }

  const systemPrompt = buildJourneyPrompt(promptArgs)
  const enhancedInput = buildEnhancedInput(input, estimatedDays, ctx.language)

  logInfo(logger, '正在调用 AI 生成基础框架')
  try {
    const maxTokens = Math.min(calcFrameworkMaxTokens(estimatedDays), 3000)
    logInfo(logger, `使用 max_tokens: ${maxTokens}`)

    const response = await llm.jsonFromLLM(systemPrompt, enhancedInput, {
      ...LLM_DEFAULT_OPTIONS,
      temperature: 0.8,
      max_tokens: maxTokens,
    })

    if (!response || typeof response !== 'object') {
      logError(logger, 'AI 返回的不是对象', typeof response)
      throw new Error('AI 返回的内容格式不正确')
    }

    const parsed = response as Itinerary
    if (!parsed.title || !parsed.destination) {
      logWarn(logger, 'AI 返回的数据缺少必要字段，尝试修复...')
      parsed.title = parsed.title || '旅行灵感'
      parsed.destination = parsed.destination || selectedDestination || '未指定目的地'
    }

    if (parsed.days && Array.isArray(parsed.days)) {
      parsed.duration = parsed.days.length
    } else if (parsed.duration && !parsed.days) {
      parsed.days = []
    }

    logInfo(logger, `框架生成成功：${parsed.days?.length || 0} 天`)
    return parsed
  } catch (error: any) {
    const isJsonParseIssue = error instanceof Error && error.message.includes('无法解析 LLM 返回的 JSON')
    if (isJsonParseIssue) {
      logWarn(logger, 'AI 框架输出不完整，改用安全回退', error)
    } else {
      logError(logger, '生成框架失败', error)
    }

    logWarn(logger, '使用最小框架作为回退')
    return {
      title: ctx.language.startsWith('en') ? 'Travel Inspiration' : '旅行灵感',
      destination: selectedDestination || '未指定目的地',
      duration: estimatedDays,
      summary: ctx.language.startsWith('en')
        ? 'Unable to generate full framework. Please try again.'
        : '无法生成完整框架，请重试。',
      psychologicalFlow: [],
      coreInsight: '',
      days: Array.from({ length: estimatedDays }, (_, i) => ({
        day: i + 1,
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        theme: '',
        mood: '',
        summary: '',
        psychologicalStage: '',
        timeSlots: [],
      })),
    }
  }
}

function buildEnhancedInput(input: string, estimatedDays: number, language: string): string {
  const isEnglish = language.startsWith('en')
  const frameworkNote = isEnglish
    ? `\n\n⚠️ FIRST STAGE: Generate the framework structure for ${estimatedDays} days:
- Include: title, destination, duration, summary, psychologicalFlow, coreInsight
- For each day: day number, date, theme, mood, summary, psychologicalStage
- You can include basic timeSlots structure, but detailed location information will be generated separately
- Focus on the psychological journey and daily themes, not detailed addresses/transportation`
    : `\n\n⚠️ 第一阶段：生成${estimatedDays}天的基础框架结构：
- 包含：title, destination, duration, summary, psychologicalFlow, coreInsight
- 每天：day number, date, theme, mood, summary, psychologicalStage
- 可以包含基本的timeSlots结构，但详细的地理位置信息将单独生成
- 专注于心理旅程和每日主题，而非详细地址/交通信息`

  return isEnglish
    ? `${input}\n\n⚠️ IMPORTANT REMINDER: Please ensure you generate exactly ${estimatedDays} days. The "days" array MUST contain ${estimatedDays} day objects.${frameworkNote}`
    : `${input}\n\n⚠️ 重要提醒：请确保生成恰好${estimatedDays}天的完整行程，days数组必须包含${estimatedDays}个day对象。${frameworkNote}`
}
