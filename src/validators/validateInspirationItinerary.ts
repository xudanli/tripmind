/**
 * 灵感模式行程校验器
 * 提供业务层校验（地理/时序/字段完整）
 */

import { Validator } from '@/utils/inspiration/core/validator'
import { ItinerarySchema } from './itinerarySchema'
import type { Itinerary } from './itinerarySchema'

// ==================== 业务校验 ====================

export interface ValidationResult {
  ok: boolean
  error?: string
  warnings?: string[]
  fixed?: Itinerary
}

/**
 * 校验并自动修复行程数据
 */
export function validateInspirationItinerary(obj: any): ValidationResult {
  const warnings: string[] = []
  let fixed: Itinerary | undefined

  // 1. Zod Schema 校验
  const zodResult = ItinerarySchema.safeParse(obj)
  if (!zodResult.success) {
    return {
      ok: false,
      error: `Schema 校验失败: ${zodResult.error.message}`,
      warnings
    }
  }

  const itinerary = zodResult.data

  // 2. 业务校验：duration === days.length
  if (itinerary.duration !== itinerary.days.length) {
    warnings.push(`duration (${itinerary.duration}) 与 days.length (${itinerary.days.length}) 不一致，已同步`)
    fixed = { ...itinerary, duration: itinerary.days.length }
  }

  // 3. 基础字段校验（使用现有 Validator）
  const basicResult = Validator.validateInspirationItinerary(fixed || itinerary)
  if (!basicResult.ok) {
    return {
      ok: false,
      error: basicResult.error,
      warnings,
      fixed
    }
  }

  // 4. 检查 timeSlots 完整性
  const slotsWarnings = checkTimeSlotsCompleteness(fixed || itinerary)
  warnings.push(...slotsWarnings)

  // 5. 自动修复：确保 details.recommendations 存在
  if (!fixed) {
    fixed = { ...itinerary }
  }
  fixed = ensureRecommendationsStructure(fixed)

  return {
    ok: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    fixed: fixed !== itinerary ? fixed : undefined
  }
}

/**
 * 检查 timeSlots 完整性
 */
function checkTimeSlotsCompleteness(itinerary: Itinerary): string[] {
  const warnings: string[] = []

  for (let i = 0; i < itinerary.days.length; i++) {
    const day = itinerary.days[i]
    if (!day.timeSlots || day.timeSlots.length === 0) {
      warnings.push(`days[${i}] 缺少 timeSlots`)
      continue
    }

    for (let j = 0; j < day.timeSlots.length; j++) {
      const slot = day.timeSlots[j]
      
      // 检查必要字段
      if (!slot.location) {
        warnings.push(`days[${i}].timeSlots[${j}] 缺少 location`)
      }
      if (!slot.details) {
        warnings.push(`days[${i}].timeSlots[${j}] 缺少 details`)
      }
    }
  }

  return warnings
}

/**
 * 确保 recommendations 结构存在
 */
function ensureRecommendationsStructure(itinerary: Itinerary): Itinerary {
  const fixed = { ...itinerary, days: [...itinerary.days] }

  for (let i = 0; i < fixed.days.length; i++) {
    const day = fixed.days[i]
    if (!day.timeSlots) continue

    fixed.days[i] = {
      ...day,
      timeSlots: day.timeSlots.map((slot: any) => {
        if (!slot.details) {
          return { ...slot, details: {} }
        }
        if (!slot.details.recommendations || typeof slot.details.recommendations !== 'object' || Array.isArray(slot.details.recommendations)) {
          return {
            ...slot,
            details: {
              ...slot.details,
              recommendations: {}
            }
          }
        }
        return slot
      })
    }
  }

  return fixed
}

