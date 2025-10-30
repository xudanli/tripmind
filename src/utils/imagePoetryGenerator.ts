/**
 * 照片提示语生成器
 * 你是一位AI旅行作家，专为照片生成诗意描述
 */

export type ToneType = 'cool-light' | 'warm-light' | 'nature' | 'urban'

export interface PoetryResult {
  mainPrompt: string // 主提示语（≤12字）
  extendedPrompt: string // 延伸句（≤25字）
  tags: string[] // 主题标签
  tone: ToneType // 色调类型
}

// 冷光调：抽象、宁静、有距离感
const coolLightTemplates = {
  mainPrompts: [
    '光影之间的沉默',
    '时间在这里静止',
    '距离产生美感',
    '冷静的呼吸',
    '被稀释的光',
    '抽象的真实',
    '平静下的张力',
    '疏离的温度'
  ],
  extendedPrompts: [
    '每一帧都在诉说着被遗忘的故事',
    '光与影的对话，在距离中完成',
    '冷静的表象下藏着未说出口的情绪',
    '时间被凝固，只留下永恒的瞬间',
    '抽象与具象之间，是内心的投影',
    '宁静中蕴含着不可言说的力量',
    '距离让人看见，也让人忘记',
    '被稀释的光，依然照亮前路'
  ],
  tags: ['冷光', '抽象', '距离', '宁静', '沉思', '疏离']
}

// 暖光调：温柔、疗愈、有体温
const warmLightTemplates = {
  mainPrompts: [
    '温暖在指尖流淌',
    '被光拥抱的瞬间',
    '治愈系的光影',
    '温柔的触摸',
    '有温度的呼吸',
    '治愈的光束',
    '暖色调的梦',
    '温柔的庇护'
  ],
  extendedPrompts: [
    '这一刻，所有的疲惫都被光温柔地包裹',
    '温暖在指尖流淌，治愈着每一个疲惫的灵魂',
    '被光拥抱的瞬间，时间也变得柔软',
    '温柔的光影里，藏着最真实的自己',
    '有温度的呼吸，让每一个瞬间都变得珍贵',
    '治愈的光束穿透阴霾，带来内心的平静',
    '暖色调的梦里，所有伤口都在悄悄愈合',
    '温柔的庇护下，一切都是那么安详'
  ],
  tags: ['温暖', '治愈', '温柔', '疗愈', '体温', '拥抱']
}

// 自然调：呼吸感、沉浸
const natureTemplates = {
  mainPrompts: [
    '大地的呼吸',
    '自然的节拍',
    '融入天地间',
    '与自然同频',
    '沉浸式聆听',
    '回归本源',
    '生命的律动',
    '自然的召唤'
  ],
  extendedPrompts: [
    '每一次呼吸都与大地相连，感受自然的节拍',
    '融入天地间，发现自己与万物的连接',
    '与自然同频共振，找回内心的节奏',
    '沉浸式地聆听，听见自然最真实的语言',
    '回归本源，在自然中找到最初的自己',
    '生命的律动在大地的怀抱中愈发清晰',
    '自然的召唤指引着我们找到内心的方向',
    '大地的呼吸里，藏着所有答案的线索'
  ],
  tags: ['自然', '呼吸', '沉浸', '大地', '节拍', '回归']
}

// 城市调：理性、思辨、诗意
const urbanTemplates = {
  mainPrompts: [
    '城市的呼吸',
    '理性的诗意',
    '思考的瞬间',
    '城市的节奏',
    '理性与感性的平衡',
    '城市的光影',
    '思辨的空间',
    '理性的温度'
  ],
  extendedPrompts: [
    '在城市的光影中，理性与感性找到了平衡点',
    '思考的瞬间，发现城市背后的诗意逻辑',
    '城市的呼吸里，藏着无数个未被发现的故事',
    '理性与感性的平衡，在城市空间中完美呈现',
    '城市的光影诉说着现代生活的另一种可能',
    '思辨的空间里，每一次停留都是新的开始',
    '理性的温度让冰冷的建筑也有了人的气息',
    '在城市的节奏中，找到属于自己的一拍'
  ],
  tags: ['城市', '理性', '思辨', '诗意', '节奏', '平衡']
}

/**
 * 根据图像URL、描述或颜色推断色调
 */
function detectImageTone(
  imageUrl?: string,
  description?: string | null,
  color?: string
): ToneType {
  // 1. 尝试从Unsplash的color字段推断
  if (color) {
    // 解析hex颜色为RGB
    const hex = color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    
    // 计算色调：冷色（蓝、青）vs 暖色（红、橙、黄）
    const avg = (r + g + b) / 3
    const redDominance = r / (r + g + b + 1)
    const blueDominance = b / (r + g + b + 1)
    
    // 判断色温
    if (blueDominance > 0.4 && avg < 150) {
      return 'cool-light' // 偏蓝、偏暗 = 冷光
    } else if (redDominance > 0.35 && avg > 180) {
      return 'warm-light' // 偏红、偏亮 = 暖光
    } else if (avg < 100 && Math.abs(r - g) < 30 && Math.abs(g - b) < 30) {
      return 'cool-light' // 低饱和灰色 = 冷光
    } else if (avg > 200) {
      return 'warm-light' // 高亮度 = 暖光
    }
  }
  
  // 2. 从描述中提取关键词推断
  if (description) {
    const desc = description.toLowerCase()
    
    // 自然相关关键词
    if (/nature|natural|forest|mountain|ocean|sea|lake|river|tree|green|blue sky|landscape|wild/.test(desc)) {
      return 'nature'
    }
    
    // 城市相关关键词
    if (/city|urban|street|building|architecture|skyline|urban|metropolitan|downtown|cityscape|bridge/.test(desc)) {
      return 'urban'
    }
    
    // 冷光关键词
    if (/cold|cool|blue|ice|snow|frozen|minimal|abstract|minimalist|calm|serene|peaceful/.test(desc)) {
      return 'cool-light'
    }
    
    // 暖光关键词
    if (/warm|sunset|sunrise|golden|orange|yellow|sunny|cozy|soft|gentle|healing/.test(desc)) {
      return 'warm-light'
    }
  }
  
  // 3. 从URL路径推断
  if (imageUrl) {
    const url = imageUrl.toLowerCase()
    if (/nature|landscape|forest|mountain|ocean/.test(url)) {
      return 'nature'
    }
    if (/city|urban|street|building|architecture/.test(url)) {
      return 'urban'
    }
    if (/blue|cold|cool|winter|ice/.test(url)) {
      return 'cool-light'
    }
    if (/warm|sunset|sunrise|golden|orange/.test(url)) {
      return 'warm-light'
    }
  }
  
  // 4. 默认根据意图类型推断
  return 'nature' // 默认自然调
}

/**
 * 生成照片提示语
 * @param imageUrl 图片URL（可选）
 * @param description 图片描述（可选）
 * @param color Unsplash返回的颜色值（可选）
 * @param intentType 意图类型（可选，用于推断）
 */
export async function generatePhotoPoetry(
  imageUrl?: string,
  description?: string | null,
  color?: string,
  intentType?: string
): Promise<PoetryResult> {
  // 模拟AI生成延迟
  await new Promise(resolve => setTimeout(resolve, 800))
  
  // 推断色调
  const tone = detectImageTone(imageUrl, description, color)
  
  // 根据意图类型调整（如果提供了）
  let finalTone = tone
  if (intentType) {
    if (intentType === 'photography_exploration' || intentType === 'urban_creation') {
      finalTone = 'urban'
    } else if (intentType === 'emotional_healing' || intentType === 'mind_healing') {
      finalTone = 'nature'
    }
  }
  
  // 根据色调选择模板
  let templates: typeof coolLightTemplates
  switch (finalTone) {
    case 'cool-light':
      templates = coolLightTemplates
      break
    case 'warm-light':
      templates = warmLightTemplates
      break
    case 'urban':
      templates = urbanTemplates
      break
    case 'nature':
    default:
      templates = natureTemplates
      break
  }
  
  // 随机选择主提示语和延伸句
  const mainPromptIndex = Math.floor(Math.random() * templates.mainPrompts.length)
  const extendedPromptIndex = Math.floor(Math.random() * templates.extendedPrompts.length)
  
  const mainPrompt = templates.mainPrompts[mainPromptIndex]
  const extendedPrompt = templates.extendedPrompts[extendedPromptIndex]
  
  // 从描述中提取关键词作为标签，结合模板标签
  const extractedTags = extractTagsFromDescription(description)
  const allTags = [...new Set([...extractedTags, ...templates.tags])].slice(0, 3)
  
  return {
    mainPrompt,
    extendedPrompt,
    tags: allTags,
    tone: finalTone
  }
}

/**
 * 从描述中提取关键词标签
 */
function extractTagsFromDescription(description?: string | null): string[] {
  if (!description) return []
  
  const desc = description.toLowerCase()
  const keywordMap: Record<string, string> = {
    // 自然相关
    'nature': '自然', 'forest': '森林', 'mountain': '山', 'ocean': '海',
    'lake': '湖', 'river': '河', 'landscape': '风景', 'sky': '天空',
    // 城市相关
    'city': '城市', 'urban': '都市', 'street': '街道', 'building': '建筑',
    'architecture': '建筑', 'bridge': '桥', 'skyline': '天际线',
    // 情感相关
    'peaceful': '宁静', 'calm': '平静', 'serene': '安详', 'warm': '温暖',
    'cold': '冷', 'beautiful': '美', 'stunning': '震撼', 'amazing': '惊艳',
    // 时间相关
    'sunset': '日落', 'sunrise': '日出', 'night': '夜晚', 'day': '白天',
    'morning': '清晨', 'evening': '傍晚', 'golden hour': '黄金时刻',
    // 光线相关
    'light': '光', 'shadow': '影', 'sunlight': '阳光', 'moonlight': '月光',
    // 颜色相关
    'blue': '蓝', 'green': '绿', 'orange': '橙', 'red': '红', 'yellow': '黄'
  }
  
  const foundTags: string[] = []
  for (const [key, tag] of Object.entries(keywordMap)) {
    if (desc.includes(key) && !foundTags.includes(tag)) {
      foundTags.push(tag)
      if (foundTags.length >= 3) break
    }
  }
  
  return foundTags
}

/**
 * 格式化提示语为字符串（用于显示）
 */
export function formatPoetryDisplay(poetry: PoetryResult): string {
  return `主提示语："${poetry.mainPrompt}"\n补充句："${poetry.extendedPrompt}"\n主题标签：${poetry.tags.map(t => `#${t}`).join(' ')}`
}

/**
 * 简化版：只返回主提示语（兼容现有代码）
 */
export async function generatePoetryText(
  imageUrl: string,
  description?: string | null,
  color?: string,
  intentType?: string
): Promise<string> {
  const result = await generatePhotoPoetry(imageUrl, description, color, intentType)
  return result.mainPrompt
}

