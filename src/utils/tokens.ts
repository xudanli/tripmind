/**
 * Token 计算工具（纯函数）
 */

/**
 * 计算最大 token 数
 * 基础 2000 + 每天 800 + 20% 缓冲，最大 8192
 */
export function calcMaxTokens(days: number): number {
  const base = 2000
  const perDay = 800
  const buffer = 0.2
  
  const calculated = Math.floor((base + perDay * days) * (1 + buffer))
  return Math.min(calculated, 8192)
}

/**
 * 计算框架生成的 token 限制（第一阶段）
 */
export function calcFrameworkMaxTokens(days: number): number {
  return Math.min(calcMaxTokens(days), 4000)
}

/**
 * 计算每日详细信息的 token 限制（第二阶段）
 */
export function calcDayDetailsMaxTokens(): number {
  return 4000
}

