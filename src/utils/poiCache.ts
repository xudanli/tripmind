/**
 * POI搜索缓存工具
 * 将搜索结果缓存到localStorage，减少重复的AI API调用
 */

interface CachedPOIResult {
  data: any[] // POIResult[]
  timestamp: number
  location: string
  category: string
  language: string
}

const CACHE_PREFIX = 'poi_search_cache_'
const CACHE_EXPIRY_HOURS = 24 // 缓存24小时

/**
 * 生成缓存键
 */
function generateCacheKey(location: { name: string; address?: string }, category: string, language: string): string {
  const locationKey = `${location.name}_${location.address || ''}`.trim().replace(/\s+/g, '_')
  const categoryKey = category
  const languageKey = language.split('-')[0] // 只取语言代码，如 'zh-CN' -> 'zh'
  
  return `${CACHE_PREFIX}${locationKey}_${categoryKey}_${languageKey}`
}

/**
 * 检查缓存是否过期
 */
function isCacheExpired(timestamp: number): boolean {
  const now = Date.now()
  const expiryTime = CACHE_EXPIRY_HOURS * 60 * 60 * 1000 // 转换为毫秒
  return (now - timestamp) > expiryTime
}

/**
 * 从缓存获取搜索结果
 */
export function getCachedPOIResults(
  location: { name: string; address?: string },
  category: string,
  language: string
): any[] | null {
  try {
    const cacheKey = generateCacheKey(location, category, language)
    const cached = localStorage.getItem(cacheKey)
    
    if (!cached) {
      return null
    }
    
    const parsed: CachedPOIResult = JSON.parse(cached)
    
    // 检查是否过期
    if (isCacheExpired(parsed.timestamp)) {
      console.log(`🗑️ 缓存已过期，删除: ${cacheKey}`)
      localStorage.removeItem(cacheKey)
      return null
    }
    
    // 验证缓存数据是否匹配当前搜索条件
    if (parsed.location !== location.name || parsed.category !== category || parsed.language !== language) {
      console.log(`⚠️ 缓存数据不匹配，忽略缓存`)
      return null
    }
    
    const cacheAge = Math.floor((Date.now() - parsed.timestamp) / 1000 / 60) // 分钟
    console.log(`✅ 从缓存获取搜索结果 (${cacheAge}分钟前)`)
    return parsed.data
  } catch (error) {
    console.warn('⚠️ 读取缓存失败:', error)
    return null
  }
}

/**
 * 保存搜索结果到缓存
 */
export function setCachedPOIResults(
  location: { name: string; address?: string },
  category: string,
  language: string,
  results: any[]
): void {
  try {
    const cacheKey = generateCacheKey(location, category, language)
    const cacheData: CachedPOIResult = {
      data: results,
      timestamp: Date.now(),
      location: location.name,
      category,
      language
    }
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData))
    console.log(`💾 搜索结果已缓存: ${cacheKey}`)
  } catch (error) {
    console.warn('⚠️ 保存缓存失败:', error)
    // 如果存储空间不足，尝试清理旧缓存
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.log('🧹 存储空间不足，清理旧缓存...')
      clearExpiredCache()
      // 重试一次
      try {
        const cacheKey = generateCacheKey(location, category, language)
        const cacheData: CachedPOIResult = {
          data: results,
          timestamp: Date.now(),
          location: location.name,
          category,
          language
        }
        localStorage.setItem(cacheKey, JSON.stringify(cacheData))
        console.log(`💾 重新保存缓存成功`)
      } catch (retryError) {
        console.error('❌ 重新保存缓存失败:', retryError)
      }
    }
  }
}

/**
 * 清理过期的缓存
 */
export function clearExpiredCache(): void {
  try {
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key)
          if (cached) {
            const parsed: CachedPOIResult = JSON.parse(cached)
            if (isCacheExpired(parsed.timestamp)) {
              keysToRemove.push(key)
            }
          }
        } catch (error) {
          // 如果解析失败，也删除（可能是损坏的数据）
          keysToRemove.push(key)
        }
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
      console.log(`🗑️ 已删除过期缓存: ${key}`)
    })
    
    if (keysToRemove.length > 0) {
      console.log(`✅ 清理完成，删除了 ${keysToRemove.length} 个过期缓存`)
    }
  } catch (error) {
    console.error('❌ 清理缓存失败:', error)
  }
}

/**
 * 清除所有POI搜索缓存
 */
export function clearAllPOICache(): void {
  try {
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })
    
    console.log(`✅ 已清除所有POI搜索缓存 (${keysToRemove.length} 条)`)
    return keysToRemove.length
  } catch (error) {
    console.error('❌ 清除缓存失败:', error)
    return 0
  }
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats(): { total: number; expired: number; valid: number } {
  try {
    let total = 0
    let expired = 0
    let valid = 0
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_PREFIX)) {
        total++
        try {
          const cached = localStorage.getItem(key)
          if (cached) {
            const parsed: CachedPOIResult = JSON.parse(cached)
            if (isCacheExpired(parsed.timestamp)) {
              expired++
            } else {
              valid++
            }
          }
        } catch (error) {
          expired++ // 无法解析的视为过期
        }
      }
    }
    
    return { total, expired, valid }
  } catch (error) {
    console.error('❌ 获取缓存统计失败:', error)
    return { total: 0, expired: 0, valid: 0 }
  }
}

