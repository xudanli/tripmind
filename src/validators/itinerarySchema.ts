/**
 * 行程数据 Zod Schema 定义
 */

import { z } from 'zod'

// ==================== 基础 Schema ====================

export const IntentResultSchema = z.object({
  intentType: z.string(),
  keywords: z.array(z.string()).default([]),
  emotionTone: z.string().default('neutral'),
  description: z.string().default(''),
})

export const ItinerarySchema = z.object({
  title: z.string(),
  destination: z.string(),
  duration: z.number().int().positive(),
  summary: z.string(),
  psychologicalFlow: z.array(z.string()),
  coreInsight: z.string(),
  days: z.array(z.any()),
  totalCost: z.number().nonnegative().optional(),
  recommendations: z.any().optional(),
})

// ==================== 类型导出 ====================

export type IntentResult = z.infer<typeof IntentResultSchema>
export type Itinerary = z.infer<typeof ItinerarySchema>

