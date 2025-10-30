/**
 * 根据AI生成的灵感数据动态生成配置文件
 * 用于在创建旅程时生成个性化的配置
 */

import type { InspirationData } from '@/stores/travel'
import { keywordIconMap } from '@/config/inspirationConfig'

export interface DynamicInspirationConfig {
  // 地点Moodboard映射（根据实际生成的地点）
  locationMoodMap: Record<string, Array<{ icon: string; text: string }>>
  
  // 意图类型Moodboard（根据识别的意图）
  intentMoodMap?: Record<string, Array<{ icon: string; text: string }>>
  
  // 视觉诗模板（基于实际highlights生成）
  poetryTemplates: Array<{ poetry: string; tags: string[] }>
  
  // AI反馈模板（基于意图类型）
  aiFeedbackTemplates: Array<(input: string) => string>
  
  // AI总结诗模板（基于意图类型和地点）
  summaryPoemTemplates: Record<string, Array<(location: string) => string>>
  
  // 底部AI语句模板（基于意图类型）
  echoStatementTemplates: Record<string, string | string[]>
}

/**
 * 根据关键词匹配图标
 */
export function getIconByKeyword(text: string): string {
  // 优先使用配置文件中的关键词映射
  for (const [key, icon] of Object.entries(keywordIconMap)) {
    if (text.includes(key)) {
      return icon
    }
  }
  
  // 备用图标映射
  const fallbackIcons: Record<string, string> = {
    '光': '✨',
    '影': '🌆',
    '海': '🌊',
    '山': '🏔️',
    '城': '🏙️',
    '风': '💨',
    '星': '⭐',
    '月': '🌙',
    '花': '🌸',
    '雪': '❄️',
    '云': '☁️',
    '火': '🔥',
    '水': '💧',
    '树': '🌲',
    '路': '🛤️'
  }
  
  for (const [key, icon] of Object.entries(fallbackIcons)) {
    if (text.includes(key)) {
      return icon
    }
  }
  
  return '✨' // 默认图标
}

/**
 * 从highlights生成moodboard项
 */
function generateMoodItems(highlights: any[]): Array<{ icon: string; text: string }> {
  if (!highlights || highlights.length === 0) {
    return [
      { icon: '🌊', text: '探索' },
      { icon: '💙', text: '体验' },
      { icon: '🎵', text: '感受' }
    ]
  }
  
  return highlights.slice(0, 3).map((highlight: any) => {
    const text = typeof highlight === 'string' 
      ? highlight 
      : (highlight.title || highlight.description || highlight.feeling || '')
    
    const icon = getIconByKeyword(text)
    
    // 提取关键词作为text（最多4个字）
    const displayText = typeof highlight === 'string'
      ? highlight.substring(0, 4)
      : (highlight.title?.substring(0, 4) || highlight.feeling?.substring(0, 4) || text.substring(0, 4))
    
    return { icon, text: displayText || text }
  })
}

/**
 * 根据意图类型生成AI反馈模板
 */
function generateAIFeedbackTemplates(intentType?: string): Array<(input: string) => string> {
  const templates: Array<(input: string) => string> = []
  
  if (intentType === 'photography_exploration' || intentType === 'urban_creation') {
    templates.push(
      (input: string) => `"${input}"...这句话里有种特别的光。让我为你扩展这个想法。`,
      (input: string) => `我看到了你的灵感雏形，它正在成形...`,
      (input: string) => `这个想法很美，像是藏在城市缝隙里的故事。`
    )
  } else if (intentType === 'emotional_healing' || intentType === 'mind_healing') {
    templates.push(
      (input: string) => `我感受到了你文字中的情绪。这里有几种可能的展开方向...`,
      (input: string) => `这个想法很温柔，让我为你找到适合的疗愈体验。`,
      (input: string) => `我看到了你的需要，让我为你设计一段平静的旅程。`
    )
  } else if (intentType === 'extreme_exploration') {
    templates.push(
      (input: string) => `"${input}"...这句话里有冒险的味道。让我为你规划一次突破之旅。`,
      (input: string) => `我看到了你的勇气，让我为你设计一次极限挑战。`,
      (input: string) => `这个想法很刺激，让我为你找到最合适的冒险路线。`
    )
  } else {
    // 默认模板
    templates.push(
      (input: string) => `"${input}"...这句话里有种特别的光。让我为你扩展这个想法。`,
      (input: string) => `我感受到了你文字中的情绪。这里有几种可能的展开方向...`,
      (input: string) => `这个想法很美，像是藏在城市缝隙里的故事。`,
      (input: string) => `我看到了你的灵感雏形，它正在成形...`
    )
  }
  
  return templates
}

/**
 * 根据意图类型和地点生成总结诗模板
 */
function generateSummaryPoemTemplates(intentType?: string, locations?: string[]): Record<string, Array<(location: string) => string>> {
  const templates: Record<string, Array<(location: string) => string>> = {
    default: [
      (location: string) => `${location}的光影在你心里种下了自由的影子。`,
      (location: string) => `这座城市的故事已经融入你的记忆，等待下次相遇。`,
      (location: string) => `每一次旅程都是向内探索的延伸，你已找到属于自己的光。`
    ]
  }
  
  if (intentType === 'emotional_healing' || intentType === 'mind_healing') {
    templates[intentType] = [
      (location: string) => `${location}的宁静在你心中种下了疗愈的种子。`,
      (location: string) => `每一次呼吸都与大地相连，你已找到内心的平静。`,
      (location: string) => `在这里，时间慢了下来，给了你重新认识自己的机会。`
    ]
  } else if (intentType === 'extreme_exploration') {
    templates[intentType] = [
      (location: string) => `${location}的挑战在你心中点燃了勇气的火焰。`,
      (location: string) => `每一座山峰都在见证你的突破，你已经超越了自己。`,
      (location: string) => `极限之外，是更广阔的可能性。`
    ]
  } else if (intentType === 'photography_exploration') {
    templates[intentType] = [
      (location: string) => `${location}的光影在你心里种下了自由的影子。`,
      (location: string) => `每一帧都是时间的定格，记录着属于你的视觉诗篇。`,
      (location: string) => `镜头下的世界，藏着无数个未被发现的故事。`
    ]
  }
  
  return templates
}

/**
 * 根据highlights生成视觉诗模板
 */
function generatePoetryTemplates(highlights: any[]): Array<{ poetry: string; tags: string[] }> {
  if (!highlights || highlights.length === 0) {
    return [
      { poetry: "你的这张照片像是风在说：'我也在远行。'", tags: ['光', '孤独', '远行'] },
      { poetry: "时间在这里停止了脚步，留下永恒的温柔。", tags: ['静谧', '温柔', '时光'] }
    ]
  }
  
  return highlights.slice(0, 6).map((highlight: any) => {
    const description = typeof highlight === 'string'
      ? highlight
      : (highlight.description || highlight.feeling || highlight.title || '')
    
    const feeling = typeof highlight === 'object' && highlight.feeling
      ? highlight.feeling
      : ''
    
    // 生成诗意描述（基于description）
    const poetry = feeling 
      ? `${description}，${feeling}`
      : `你的这张照片诉说着${description}的故事。`
    
    // 提取标签（从title、feeling、description中提取关键词）
    const tags: string[] = []
    if (typeof highlight === 'object') {
      if (highlight.title) tags.push(highlight.title.substring(0, 2))
      if (highlight.feeling) tags.push(highlight.feeling.substring(0, 2))
      if (highlight.description) {
        const descTags = highlight.description.match(/[\u4e00-\u9fa5]{2}/g) || []
        tags.push(...descTags.slice(0, 2))
      }
    } else {
      const matchedTags = highlight.match(/[\u4e00-\u9fa5]{2}/g) || []
      tags.push(...matchedTags.slice(0, 3))
    }
    
    // 确保至少有默认标签
    if (tags.length === 0) {
      tags.push('光', '瞬间', '记忆')
    }
    
    return {
      poetry: poetry || "每一束光都在诉说一个秘密，等待被发现。",
      tags: tags.slice(0, 3)
    }
  })
}

/**
 * 生成底部AI语句模板
 */
function generateEchoStatementTemplates(intentType?: string): Record<string, string | string[]> {
  const templates: Record<string, string | string[]> = {
    default: [
      '每一个光影，都是你的自画像。',
      '你在路上找到的，远不止风景。',
      '灵感是一场没有终点的旅行。'
    ]
  }
  
  if (intentType === 'photography_exploration' || intentType === 'urban_creation') {
    templates[intentType] = '每一个光影，都是你的自画像。'
  } else if (intentType === 'emotional_healing') {
    templates[intentType] = '你在路上找到的，远不止风景。'
  } else if (intentType === 'extreme_exploration') {
    templates[intentType] = '每一个选择，都在塑造你的故事。'
  }
  
  return templates
}

/**
 * 根据灵感数据生成动态配置
 */
export function generateInspirationConfig(inspirationData: InspirationData): DynamicInspirationConfig {
  const intentType = inspirationData.detectedIntent?.intentType
  const locations = inspirationData.locations || (inspirationData.location ? [inspirationData.location] : [])
  const highlights = Array.isArray(inspirationData.highlights) 
    ? inspirationData.highlights 
    : []
  
  // 生成地点Moodboard映射
  const locationMoodMap: Record<string, Array<{ icon: string; text: string }>> = {}
  
  if (inspirationData.locationDetails) {
    // 从locationDetails中提取highlights生成moodboard
    for (const [location, details] of Object.entries(inspirationData.locationDetails)) {
      if (details.highlights && Array.isArray(details.highlights)) {
        locationMoodMap[location] = generateMoodItems(details.highlights)
      } else {
        // 如果没有highlights，使用默认的
        locationMoodMap[location] = [
          { icon: '🌊', text: '探索' },
          { icon: '💙', text: '体验' },
          { icon: '🎵', text: '感受' }
        ]
      }
    }
  } else {
    // 如果没有locationDetails，为每个location生成默认moodboard
    for (const location of locations) {
      locationMoodMap[location] = generateMoodItems(highlights)
    }
  }
  
  // 生成意图类型Moodboard（如果意图类型存在）
  const intentMoodMap: Record<string, Array<{ icon: string; text: string }>> = {}
  if (intentType) {
    // 基于highlights或关键字生成
    intentMoodMap[intentType] = generateMoodItems(highlights)
  }
  
  // 生成视觉诗模板
  const poetryTemplates = generatePoetryTemplates(highlights)
  
  // 生成AI反馈模板
  const aiFeedbackTemplates = generateAIFeedbackTemplates(intentType)
  
  // 生成总结诗模板
  const summaryPoemTemplates = generateSummaryPoemTemplates(intentType, locations)
  
  // 生成底部AI语句模板
  const echoStatementTemplates = generateEchoStatementTemplates(intentType)
  
  return {
    locationMoodMap,
    intentMoodMap,
    poetryTemplates,
    aiFeedbackTemplates,
    summaryPoemTemplates,
    echoStatementTemplates
  }
}
