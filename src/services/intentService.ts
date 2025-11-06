/**
 * 意图检测服务
 * 融合本地评分和 AI 检测，提供冲突消解
 */

import { buildDetectIntentPrompt } from '@/prompts/inspiration/intent'
import { IntentResultSchema } from '@/validators/itinerarySchema'
import type { IntentResult } from '@/validators/itinerarySchema'
import { DeepSeekClient } from '@/llm/deepseekClient'
import { LoggingAdapter } from '@/utils/inspiration/core/logger'
import { JSONProcessor } from '@/utils/inspiration/core/jsonProcessor'
import { isEnglish } from '@/utils/lang'

// ==================== 类型定义 ====================

export interface IntentServiceDeps {
  llm: DeepSeekClient
  jsonParser: typeof JSONProcessor
  logger: LoggingAdapter
}

// ==================== 意图检测服务 ====================

export class IntentService {
  constructor(private deps: IntentServiceDeps) {}

  /**
   * 检测用户意图（本地 + AI 融合）
   */
  async detect(userInput: string, language: string): Promise<IntentResult> {
    const { llm, jsonParser, logger } = this.deps
    const isEn = isEnglish(language)

    // 1. 本地评分（快速 fallback）
    let localScore: any = null
    try {
      const { scoreIntent } = await import('@/utils/inspiration/core/intent')
      const lang: 'zh' | 'en' = isEn ? 'en' : 'zh'
      localScore = scoreIntent(userInput, lang)
      logger.log('🔍 本地意图评分:', JSON.stringify(localScore), 500)
    } catch (err) {
      logger.warn('⚠️ 本地意图评分失败，继续使用AI:', err)
    }

    // 2. AI 检测
    const systemPrompt = buildDetectIntentPrompt(userInput, language)
    
    try {
      const response = await llm.jsonFromLLM(systemPrompt, userInput, {
        temperature: 0.7,
        max_tokens: 500
      })

      logger.log('🔍 AI 意图检测响应:', JSON.stringify(response), 500)

      // 3. Zod 验证
      const aiResult = IntentResultSchema.safeParse(response)
      if (aiResult.success) {
        // 4. 冲突消解：融合本地评分和 AI 结果
        return this.resolveConflict(aiResult.data, localScore, language)
      }

      // AI 结果验证失败，使用本地评分或默认值
      if (localScore) {
        return this.localScoreToIntentResult(localScore, language)
      }

      throw new Error('AI 意图检测失败且无本地评分')
    } catch (error: any) {
      logger.error('❌ AI 意图检测失败:', error)

      // Fallback: 使用本地评分
      if (localScore) {
        return this.localScoreToIntentResult(localScore, language)
      }

      // 最终 fallback: 返回默认值
      return {
        intentType: 'general',
        keywords: [],
        emotionTone: 'neutral',
        description: isEn ? 'General travel' : '一般旅行'
      }
    }
  }

  /**
   * 冲突消解：融合本地评分和 AI 结果
   */
  private resolveConflict(
    aiResult: IntentResult,
    localScore: any,
    language: string
  ): IntentResult {
    if (!localScore) return aiResult

    const isEn = isEnglish(language)

    // 如果本地评分置信度高（>0.7），且与 AI 结果不一致，优先使用本地评分
    if (localScore.confidence > 0.7 && localScore.primary !== aiResult.intentType) {
      return {
        intentType: localScore.primary,
        keywords: aiResult.keywords.length > 0 ? aiResult.keywords : [],
        emotionTone: aiResult.emotionTone || 'neutral',
        description: isEn
          ? `Intent detected: ${localScore.primary} (confidence: ${Number(localScore.confidence || 0).toFixed(2)})`
          : `检测到的意图：${localScore.primary}（置信度：${Math.round(Number(localScore.confidence || 0) * 100)}%）`
      }
    }

    // 否则使用 AI 结果，但补充本地评分的关键词
    return {
      ...aiResult,
      keywords: [
        ...(aiResult.keywords || []),
        ...(localScore.keywords || [])
      ].filter((v, i, arr) => arr.indexOf(v) === i) // 去重
    }
  }

  /**
   * 将本地评分转换为 IntentResult
   */
  private localScoreToIntentResult(localScore: any, language: string): IntentResult {
    const isEn = isEnglish(language)
    return {
      intentType: localScore.primary || 'general',
      keywords: localScore.keywords || [],
      emotionTone: localScore.emotionTone || 'neutral',
      description: isEn
        ? `Intent detected: ${localScore.primary} (confidence: ${Number(localScore.confidence || 0).toFixed(2)})`
        : `检测到的意图：${localScore.primary}（置信度：${Math.round(Number(localScore.confidence || 0) * 100)}%）`
    }
  }
}

// ==================== 导出函数 ====================

/**
 * 创建意图检测服务实例
 */
export function createIntentService(deps?: Partial<IntentServiceDeps>): IntentService {
  const defaultDeps: IntentServiceDeps = {
    llm: new DeepSeekClient(),
    jsonParser: JSONProcessor,
    logger: new LoggingAdapter(false)
  }

  return new IntentService({ ...defaultDeps, ...deps })
}

