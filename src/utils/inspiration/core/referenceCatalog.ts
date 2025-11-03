/**
 * 参考目录构建模块
 * 负责从灵感数据库构建参考目的地目录
 */

import { LanguageUtils } from './language'

// ==================== 类型定义 ====================

export interface ReferenceCatalogResult {
  referenceCatalog: string
  locationGuidance?: string
}

// ==================== 参考目录构建函数 ====================

/**
 * 构建参考目的地目录
 */
export async function buildReferenceCatalog(
  userCountry?: string,
  lang: string = 'zh-CN'
): Promise<ReferenceCatalogResult> {
  const langObj = LanguageUtils.pickLang(lang)
  
  try {
    const { listDestinations } = await import('@/utils/inspirationDb')
    const all = listDestinations(userCountry ? { country: userCountry } : undefined)
    
    const result: ReferenceCatalogResult = {
      referenceCatalog: '',
      locationGuidance: undefined
    }
    
    if (userCountry && all.length > 0) {
      // 优先显示用户国家的目的地
      const userCountryDests = all.filter(d => d.country === userCountry).slice(0, 10)
      const otherCountryDests = all.filter(d => d.country !== userCountry).slice(0, 8)
      
      const lines: string[] = []
      if (userCountryDests.length > 0) {
        const names = userCountryDests.map(d => d.name).join(', ')
        lines.push(langObj.referenceCatalog.priority(userCountry, names))
      }
      
      // 按国家分组其他国家的推荐（每个国家最多2个）
      const grouped: Record<string, { name: string; country: string }[]> = {}
      for (const d of otherCountryDests) {
        (grouped[d.country] ||= []).push({ name: d.name, country: d.country })
      }
      const otherCountries = Object.keys(grouped).sort()
      for (const c of otherCountries) {
        const picks = (grouped[c] || []).slice(0, 2)
        if (picks.length === 0) continue
        const names = picks.map(p => p.name).join(', ')
        lines.push(langObj.referenceCatalog.other(c, names))
      }
      
      if (lines.length) {
        result.referenceCatalog = langObj.referenceCatalog.header(userCountry) + '\n' + lines.join('\n')
        result.locationGuidance = langObj.locationGuidance(userCountry)
      }
    } else {
      // 未指定用户国家，使用原来的逻辑
      const grouped: Record<string, { name: string; country: string }[]> = {}
      for (const d of all) {
        (grouped[d.country] ||= []).push({ name: d.name, country: d.country })
      }
      const lines: string[] = []
      const countries = Object.keys(grouped).sort()
      let total = 0
      for (const c of countries) {
        const picks = (grouped[c] || []).slice(0, 3)
        if (picks.length === 0) continue
        const names = picks.map(p => p.name).join(', ')
        lines.push(langObj.referenceCatalog.other(c, names))
        total += picks.length
        if (total >= 48) break
      }
      if (lines.length) {
        result.referenceCatalog = langObj.referenceCatalog.fallback + '\n' + lines.join('\n')
      }
    }
    
    return result
  } catch (error) {
    console.warn('⚠️ 构建参考目录失败:', error)
    return { referenceCatalog: '' }
  }
}

