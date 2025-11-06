/**
 * 签证文案拼接工具（纯函数）
 */

import type { TravelContext } from '@/types/travel'

/**
 * 构建签证上下文文案
 */
export function buildVisaContextText(ctx: TravelContext, language: string): string {
  const isEn = language.startsWith('en')
  const parts: string[] = []

  if (ctx.userNationality) {
    parts.push(
      isEn
        ? `\n🌍 User Nationality (for display format & visa requirements): User's passport nationality is ${ctx.userNationality}.`
        : `\n🌍 用户国籍（用于显示格式和签证要求）：用户护照国籍为 ${ctx.userNationality}。`
    )
  }

  if (ctx.userPermanentResidency) {
    parts.push(
      isEn
        ? `\n🪪 User Permanent Residency: User holds permanent residency status (e.g., Green Card, Permanent Residence) in ${ctx.userPermanentResidency}.`
        : `\n🪪 用户永久居民身份：用户在 ${ctx.userPermanentResidency} 持有永久居民身份（如绿卡、永久居留权）。`
    )
  }

  if (ctx.heldVisas && ctx.heldVisas.length > 0) {
    parts.push(
      isEn
        ? `\n🎫 User Already Holds Visas: User already has valid visas for countries with codes: ${ctx.heldVisas.join(', ')}.`
        : `\n🎫 用户已持有签证：用户已持有以下国家的有效签证：${ctx.heldVisas.join(', ')}。`
    )
  }

  if (ctx.visaFreeDestinations && ctx.visaFreeDestinations.length > 0) {
    parts.push(
      isEn
        ? `\n✅ Visa-free/Visa-on-arrival destinations for this user (country codes): ${ctx.visaFreeDestinations.join(', ')}.`
        : `\n✅ 对用户免签或落地签的目的地（国家代码）：${ctx.visaFreeDestinations.join(', ')}。`
    )
  }

  if (ctx.visaInfoSummary) {
    parts.push(
      isEn
        ? `\n📋 Visa information for destination: ${ctx.visaInfoSummary}`
        : `\n📋 目的地签证信息：${ctx.visaInfoSummary}`
    )
  }

  return parts.join('')
}

