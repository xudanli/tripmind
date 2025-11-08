/**
 * 旅行攻略 API 服务
 * 获取全球精选旅行文章，根据目的地筛选
 */

import { API_CONFIG } from '@/config/api'
import { chatWithLLM } from './deepseekAPI'
import { parseJSONSafe } from '@/utils/inspiration/core/jsonProcessor'

export interface TravelGuide {
  id: string
  title: string
  excerpt: string
  url: string
  source: string
  publishedAt: string
  tags?: string[]
  imageUrl?: string
  author?: string
  readTime?: number
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// 全球精选旅行文章库（示例数据，实际应该从 API 获取）
const GLOBAL_GUIDES_DATABASE: TravelGuide[] = [
  // 日本相关
  {
    id: 'guide_001',
    title: '日本关西深度游：京都、大阪、奈良7日全攻略',
    excerpt: '从古都京都的寺庙文化，到大阪的美食天堂，再到奈良的鹿群，这篇攻略带你深度体验关西地区的独特魅力...',
    url: 'https://example.com/guides/japan-kansai',
    source: '旅行指南',
    publishedAt: '2024-01-15',
    tags: ['日本', '关西', '京都', '大阪', '奈良']
  },
  {
    id: 'guide_002',
    title: '东京自由行完全指南：从浅草寺到涩谷',
    excerpt: '探索东京的最佳路线、必游景点、美食推荐和购物攻略，让你轻松玩转这座现代化大都市...',
    url: 'https://example.com/guides/tokyo',
    source: '旅行指南',
    publishedAt: '2024-02-20',
    tags: ['日本', '东京', '自由行']
  },
  // 欧洲相关
  {
    id: 'guide_003',
    title: '欧洲四国15日游：法意瑞德经典路线',
    excerpt: '从巴黎的浪漫到罗马的历史，从瑞士的雪山到德国的啤酒节，一次旅行体验欧洲多国风情...',
    url: 'https://example.com/guides/europe-4-countries',
    source: '旅行指南',
    publishedAt: '2024-03-10',
    tags: ['欧洲', '法国', '意大利', '瑞士', '德国']
  },
  {
    id: 'guide_004',
    title: '冰岛环岛自驾：10天探索极地风光',
    excerpt: '黄金圈、蓝湖温泉、极光观赏...这份详细的自驾攻略帮你规划完美的冰岛之旅...',
    url: 'https://example.com/guides/iceland',
    source: '旅行指南',
    publishedAt: '2024-04-05',
    tags: ['冰岛', '自驾', '极光']
  },
  // 东南亚相关
  {
    id: 'guide_005',
    title: '泰国曼谷+清迈7日游：寺庙与美食的完美结合',
    excerpt: '大皇宫、卧佛寺、周末夜市、泰式按摩...体验泰国的文化魅力和美食诱惑...',
    url: 'https://example.com/guides/thailand',
    source: '旅行指南',
    publishedAt: '2024-05-12',
    tags: ['泰国', '曼谷', '清迈']
  },
  {
    id: 'guide_006',
    title: '巴厘岛度假攻略：海滩、SPA、美食全体验',
    excerpt: '乌布梯田、圣泉寺、海神庙，还有地道的印尼美食和顶级SPA体验...',
    url: 'https://example.com/guides/bali',
    source: '旅行指南',
    publishedAt: '2024-06-18',
    tags: ['印度尼西亚', '巴厘岛', '度假']
  },
  // 美洲相关
  {
    id: 'guide_007',
    title: '美国西海岸自驾：洛杉矶到旧金山的海岸公路之旅',
    excerpt: '沿着加州1号公路，从洛杉矶出发，经过圣巴巴拉、大苏尔，最终到达旧金山...',
    url: 'https://example.com/guides/usa-west-coast',
    source: '旅行指南',
    publishedAt: '2024-07-22',
    tags: ['美国', '加州', '自驾']
  },
  {
    id: 'guide_008',
    title: '加拿大落基山脉：班夫国家公园深度游',
    excerpt: '露易丝湖、梦莲湖、哥伦比亚冰原...探索加拿大最壮丽的自然风光...',
    url: 'https://example.com/guides/canada-rockies',
    source: '旅行指南',
    publishedAt: '2024-08-15',
    tags: ['加拿大', '班夫', '国家公园']
  },
  // 大洋洲相关
  {
    id: 'guide_009',
    title: '新西兰南岛环岛：从皇后镇到米尔福德峡湾',
    excerpt: '跳伞、蹦极、冰川徒步...体验新西兰的极限运动和自然奇观...',
    url: 'https://example.com/guides/new-zealand',
    source: '旅行指南',
    publishedAt: '2024-09-10',
    tags: ['新西兰', '皇后镇', '峡湾']
  },
  {
    id: 'guide_010',
    title: '澳大利亚东海岸：悉尼、黄金海岸、大堡礁',
    excerpt: '歌剧院、邦迪海滩、大堡礁潜水...感受澳洲的阳光与海滩文化...',
    url: 'https://example.com/guides/australia',
    source: '旅行指南',
    publishedAt: '2024-10-05',
    tags: ['澳大利亚', '悉尼', '大堡礁']
  }
]

/**
 * 根据目的地关键词匹配攻略
 */
function matchDestination(guide: TravelGuide, destination: string): number {
  if (!destination) return 0
  
  const destLower = destination.toLowerCase()
  let score = 0
  
  // 检查标题
  if (guide.title.toLowerCase().includes(destLower)) {
    score += 10
  }
  
  // 检查摘要
  if (guide.excerpt.toLowerCase().includes(destLower)) {
    score += 5
  }
  
  // 检查标签
  if (guide.tags) {
    guide.tags.forEach(tag => {
      if (tag.toLowerCase().includes(destLower)) {
        score += 8
      }
    })
  }
  
  return score
}

/**
 * 调用真实API获取旅行攻略
 */
async function fetchGuidesFromAPI(
  destination: string,
  limit: number = 50
): Promise<TravelGuide[]> {
  try {
    const baseURL = API_CONFIG.BASE_URL || 'https://api.emotional-travel.com'
    const endpoint = `${baseURL}${API_CONFIG.ENDPOINTS.TRAVEL_GUIDES_SEARCH}`
    
    // 如果是本地开发环境且API不可用，直接返回空数组，避免错误
    if (baseURL.includes('localhost') || baseURL.includes('127.0.0.1') || baseURL.includes(':8181')) {
      // 静默失败，不抛出错误
      return []
    }
    
    const params = new URLSearchParams({
      destination: destination,
      limit: limit.toString(),
      language: 'zh-CN' // 可以根据用户设置调整
    })

    const response = await fetch(`${endpoint}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 如果需要认证，可以添加：
        // 'Authorization': `Bearer ${API_CONFIG.API_KEY}`
      },
      // 添加超时控制
      signal: AbortSignal.timeout(API_CONFIG.REQUEST_CONFIG.TIMEOUT || 30000)
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const result: ApiResponse<TravelGuide[]> = await response.json()
    
    if (result.success && result.data) {
      return result.data
    } else {
      throw new Error(result.message || result.error || 'Failed to fetch guides')
    }
  } catch (error: any) {
    // 静默处理网络错误，不打印到控制台
    // 只在开发环境且不是网络错误时打印
    if (error.name !== 'TypeError' && error.message !== 'Failed to fetch') {
      console.warn('API调用失败（将使用fallback）:', error.message)
    }
    // 返回空数组而不是抛出错误，让fallback机制接管
    return []
  }
}


/**
 * 使用AI筛选和排序攻略
 */
async function filterAndSortGuidesWithAI(
  guides: TravelGuide[],
  destination: string,
  limit: number
): Promise<TravelGuide[]> {
  if (guides.length === 0) {
    return guides
  }

  try {
    const systemPrompt = `你是一位旅行内容专家。请根据用户的目的地，从给定的攻略列表中筛选出最相关、最有价值的攻略，并按相关性排序。

评估标准：
1. 标题和内容与目的地的相关性
2. 内容的完整性和实用性
3. 来源的权威性（马蜂窝、携程、TripAdvisor等知名平台优先）
4. 内容的时效性

返回格式：JSON数组，包含攻略的ID，按相关性从高到低排序。
例如：["guide_123", "guide_456", "guide_789"]`

    const guidesSummary = guides.slice(0, 50).map((guide, index) => ({
      id: guide.id,
      title: guide.title,
      source: guide.source,
      excerpt: guide.excerpt.substring(0, 100)
    }))

    const userPrompt = `目的地：${destination}

攻略列表：
${JSON.stringify(guidesSummary, null, 2)}

请筛选出最相关的${limit}篇攻略，返回ID数组。`

    const response = await chatWithLLM([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      temperature: 0.5, // 降低温度以提高排序稳定性
      max_tokens: 500
    })

    // 解析AI返回的ID列表
    try {
      const selectedIds = parseJSONSafe<string[]>(response)
      
      if (selectedIds && Array.isArray(selectedIds) && selectedIds.length > 0) {
        // 根据AI选择的ID重新排序
        const guideMap = new Map(guides.map(g => [g.id, g]))
        const sorted = selectedIds
          .map(id => guideMap.get(id))
          .filter((g): g is TravelGuide => g !== undefined)
        
        // 如果AI选择的不足，补充剩余的
        const remainingIds = new Set(selectedIds)
        const remaining = guides.filter(g => !remainingIds.has(g.id))
        
        return [...sorted, ...remaining].slice(0, limit)
      }
    } catch {
      // 解析失败，使用AI进行简单评分排序
      return await scoreGuidesWithAI(guides, destination, limit)
    }

    return guides.slice(0, limit)
  } catch (error) {
    console.error('AI筛选失败:', error)
    return guides.slice(0, limit)
  }
}

/**
 * 使用AI为攻略评分并排序
 */
async function scoreGuidesWithAI(
  guides: TravelGuide[],
  destination: string,
  limit: number
): Promise<TravelGuide[]> {
  try {
    const systemPrompt = `你是一位旅行内容评分专家。请为每篇攻略打分（0-100分），基于：
1. 与目的地的相关性（40分）
2. 内容实用性（30分）
3. 来源权威性（20分）
4. 时效性（10分）

返回格式：JSON对象，key是攻略ID，value是分数。
例如：{"guide_123": 85, "guide_456": 72, "guide_789": 90}`

    const guidesList = guides.slice(0, 30).map(g => ({
      id: g.id,
      title: g.title,
      source: g.source,
      excerpt: g.excerpt.substring(0, 80)
    }))

    const userPrompt = `目的地：${destination}

攻略列表：
${JSON.stringify(guidesList, null, 2)}

请为每篇攻略打分。`

    const response = await chatWithLLM([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      temperature: 0.3,
      max_tokens: 800
    })

    try {
      const scores = parseJSONSafe<Record<string, number>>(response)
      
      if (scores && typeof scores === 'object' && scores !== null) {
        // 按分数排序
        return guides
          .map(guide => ({
            guide,
            score: scores[guide.id] || 50 // 默认50分
          }))
          .sort((a, b) => b.score - a.score)
          .map(item => item.guide)
          .slice(0, limit)
      }
    } catch {
      // 解析失败，使用默认排序
    }

    return guides.slice(0, limit)
  } catch (error) {
    console.error('AI评分失败:', error)
    return guides.slice(0, limit)
  }
}

/**
 * 使用AI直接推荐攻略（基于知识库）
 */
async function recommendGuidesWithAI(
  destination: string,
  limit: number = 50
): Promise<TravelGuide[]> {
  try {
    const systemPrompt = `你是一位资深的旅行攻略专家，拥有丰富的全球旅行知识。根据用户提供的目的地，推荐最值得阅读的旅行攻略主题和内容。

请为目的地推荐${limit}篇攻略主题，每篇包含：
- title: 攻略标题（吸引人且具体）
- excerpt: 攻略摘要（50-100字，介绍攻略的核心内容）
- tags: 相关标签（3-5个）
- source: 推荐来源平台（如：马蜂窝、携程、TripAdvisor、Lonely Planet等）

返回格式：JSON数组，每个元素包含 id, title, excerpt, url, source, publishedAt, tags 字段。
url可以是示例URL格式，如：https://example.com/guide/{id}`

    const userPrompt = `目的地：${destination}

请推荐${limit}篇最值得阅读的旅行攻略，涵盖：
- 必游景点和路线规划
- 美食推荐
- 住宿建议
- 交通指南
- 文化体验
- 预算规划
- 实用贴士

返回JSON格式的攻略列表。`

    const response = await chatWithLLM([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      temperature: 0.8,
      max_tokens: 4000
    })

    try {
      const aiGuides = parseJSONSafe<any[]>(response)
      
      if (aiGuides && Array.isArray(aiGuides) && aiGuides.length > 0) {
        return aiGuides.map((guide: any, index: number) => ({
          id: guide.id || `ai_guide_${Date.now()}_${index}`,
          title: guide.title || '旅行攻略',
          excerpt: guide.excerpt || '',
          url: guide.url || `https://example.com/guide/${guide.id}`,
          source: guide.source || 'AI推荐',
          publishedAt: guide.publishedAt || new Date().toISOString(),
          tags: guide.tags || [destination],
          author: 'AI推荐',
          imageUrl: guide.imageUrl
        })).slice(0, limit)
      }
    } catch (error) {
      console.error('AI推荐解析失败:', error)
    }

    return []
  } catch (error) {
    console.error('AI推荐失败:', error)
    return []
  }
}

/**
 * 从RSS Feed获取攻略（备用方案）
 */
async function fetchGuidesFromRSS(
  destination: string,
  limit: number = 50
): Promise<TravelGuide[]> {
  try {
    // 示例：使用Google RSS搜索
    const searchQuery = encodeURIComponent(`travel guide ${destination}`)
    const rssUrl = `https://www.google.com/alerts/feeds/00000000000000000000/0000000000000000000?q=${searchQuery}`
    
    // 注意：实际使用时需要处理CORS问题，可能需要通过后端代理
    // 或者使用其他RSS源，如：
    // - Medium RSS: https://medium.com/feed/tag/{tag}
    // - 专门的旅行博客RSS
    
    // 这里只是示例，实际实现需要根据选定的RSS源来解析
    return []
  } catch (error) {
    console.error('RSS获取失败:', error)
    return []
  }
}

/**
 * 从多个数据源聚合获取攻略（AI增强版）
 */
async function fetchGuidesFromMultipleSources(
  destination: string,
  limit: number = 50,
  useAI: boolean = true
): Promise<TravelGuide[]> {
  const allGuides: TravelGuide[] = []
  
  try {
    // 1. 优先从主API获取（静默失败，不抛出错误）
    const apiGuides = await fetchGuidesFromAPI(destination, limit)
    if (apiGuides.length > 0) {
      allGuides.push(...apiGuides)
    }
    
    // 2. 如果启用AI，尝试AI直接推荐（快速且智能）
    if (useAI && allGuides.length < limit) {
      try {
        const aiGuides = await recommendGuidesWithAI(destination, limit - allGuides.length)
        if (aiGuides.length > 0) {
          allGuides.push(...aiGuides)
          console.log(`AI推荐了${aiGuides.length}篇攻略`)
        }
      } catch (error) {
        console.warn('AI推荐失败:', error)
      }
    }
    
    // 3. 如果数据仍不足，尝试RSS
    if (allGuides.length < limit) {
      try {
        const rssGuides = await fetchGuidesFromRSS(destination, limit - allGuides.length)
        allGuides.push(...rssGuides)
      } catch (rssError) {
        console.warn('RSS获取失败:', rssError)
      }
    }
    
    // 5. 使用AI筛选和排序（如果启用且有多条结果）
    if (useAI && allGuides.length > 1) {
      try {
        const filteredGuides = await filterAndSortGuidesWithAI(allGuides, destination, limit)
        return filteredGuides
      } catch (error) {
        console.warn('AI筛选失败，使用默认排序:', error)
      }
    }
    
    // 去重
    const uniqueGuides = deduplicateGuides(allGuides)
    return uniqueGuides.slice(0, limit)
  } catch (error) {
    console.error('多源聚合失败:', error)
    return []
  }
}

/**
 * 去重攻略
 */
function deduplicateGuides(guides: TravelGuide[]): TravelGuide[] {
  const seen = new Set<string>()
  return guides.filter(guide => {
    if (seen.has(guide.url)) {
      return false
    }
    seen.add(guide.url)
    return true
  })
}

/**
 * 获取指定目的地的旅行攻略（AI增强版）
 * @param destination 目的地名称
 * @param limit 返回数量限制（默认50篇）
 * @param useFallback 是否使用本地数据作为fallback（默认true）
 * @param useAI 是否使用AI增强搜索和推荐（默认true）
 * @returns 攻略列表
 */
export async function getTravelGuides(
  destination: string,
  limit: number = 50,
  useFallback: boolean = true,
  useAI: boolean = true
): Promise<TravelGuide[]> {
  if (!destination) {
    return useFallback ? GLOBAL_GUIDES_DATABASE.slice(0, Math.min(limit, 10)) : []
  }

  try {
    // 尝试从真实API获取（AI增强）
    const guides = await fetchGuidesFromMultipleSources(destination, limit, useAI)
    
    if (guides.length > 0) {
      return guides
    }
    
    // 如果API返回空，且启用fallback，使用本地数据
    if (useFallback) {
      console.log('API返回空，使用本地数据作为fallback')
      const matchedGuides = GLOBAL_GUIDES_DATABASE.map(guide => ({
        guide,
        score: matchDestination(guide, destination)
      }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.guide)

      // 如果没有匹配的攻略，返回一些通用攻略
      if (matchedGuides.length === 0) {
        return GLOBAL_GUIDES_DATABASE.slice(0, Math.min(limit, 10))
      }

      return matchedGuides
    }
    
    return []
  } catch (error) {
    console.error('获取旅行攻略失败:', error)
    
    // 错误时也使用fallback
    if (useFallback) {
      console.log('使用本地数据作为错误fallback')
      const matchedGuides = GLOBAL_GUIDES_DATABASE.map(guide => ({
        guide,
        score: matchDestination(guide, destination)
      }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.guide)

      return matchedGuides.length > 0 
        ? matchedGuides 
        : GLOBAL_GUIDES_DATABASE.slice(0, Math.min(limit, 10))
    }
    
    return []
  }
}

/**
 * 获取所有可用的攻略（用于测试或默认显示）
 */
export async function getAllGuides(limit: number = 50): Promise<TravelGuide[]> {
  return GLOBAL_GUIDES_DATABASE.slice(0, limit)
}

