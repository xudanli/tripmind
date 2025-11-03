/**
 * 校验器模块
 * 负责数据验证，提供详细的错误上下文
 */

// ==================== 类型定义 ====================

export interface ValidationResult {
  ok: boolean
  error?: string
}

// ==================== 校验器类 ====================

/**
 * 校验器类
 */
export class Validator {
  /**
   * 校验灵感模式行程数据
   * 提供详细的错误路径信息
   */
  static validateInspirationItinerary(obj: any): ValidationResult {
    // 基础字段校验
    const basicChecks = [
      { condition: !obj, error: '行程数据为空' },
      { condition: !obj?.title || typeof obj.title !== 'string', error: '缺少 title 字段或格式错误' },
      { condition: !obj?.destination || typeof obj.destination !== 'string', error: '缺少 destination 字段或格式错误' },
      { condition: !obj?.days || !Array.isArray(obj.days), error: '缺少 days 字段或格式错误' },
    ]
    
    for (const check of basicChecks) {
      if (check.condition) return { ok: false, error: check.error }
    }
    
    // 校验 days 数组
    return this.validateDays(obj.days)
  }

  /**
   * 校验 days 数组
   */
  private static validateDays(days: any[]): ValidationResult {
    if (!Array.isArray(days) || days.length === 0) {
      return { ok: false, error: 'days 数组为空或格式错误' }
    }
    
    for (let i = 0; i < days.length; i++) {
      const day = days[i]
      if (!day.timeSlots || !Array.isArray(day.timeSlots)) {
        return { ok: false, error: `days[${i}].timeSlots 缺少字段或格式错误` }
      }
      
      const slotError = this.validateTimeSlots(day.timeSlots, i)
      if (slotError) return slotError
    }
    
    return { ok: true }
  }

  /**
   * 校验 timeSlots 数组
   * 提供详细的错误路径
   */
  private static validateTimeSlots(slots: any[], dayIndex: number): ValidationResult | null {
    for (let j = 0; j < slots.length; j++) {
      const slot = slots[j]
      const missing: string[] = []
      
      if (!slot.time) missing.push('time')
      if (!slot.title) missing.push('title')
      if (!slot.activity) missing.push('activity')
      
      if (missing.length > 0) {
        return { 
          ok: false, 
          error: `days[${dayIndex}].timeSlots[${j}] 缺少字段 (${missing.join(', ')})` 
        }
      }
    }
    return null
  }
}

// ==================== 导出函数 ====================

/**
 * 校验灵感模式行程数据（向后兼容）
 */
export function validateInspirationItinerary(obj: any): ValidationResult {
  return Validator.validateInspirationItinerary(obj)
}

