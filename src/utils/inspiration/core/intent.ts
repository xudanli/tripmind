/**
 * 意图处理模块
 * 负责意图类型定义和处理
 */

// ==================== 类型定义 ====================

export const INTENTS = [
  'photography_exploration',
  'mind_healing', 
  'nature_discovery',
  'urban_creation',
  'emotional_healing',
  'extreme_exploration',
  'cultural_exchange'
] as const

export type IntentType = typeof INTENTS[number]

// ==================== 配置数据 ====================

const INTENT_KEYWORDS: Record<IntentType, { zh: string[]; en: string[] }> = {
  photography_exploration: {
    zh: ['拍', '创作', '光', '视觉', '记录', '镜头'],
    en: ['shoot', 'create', 'light', 'visual', 'record', 'lens']
  },
  mind_healing: {
    zh: ['放空', '疗愈', '安静', '呼吸', '独处', '慢'],
    en: ['empty', 'heal', 'quiet', 'breathe', 'alone', 'slow']
  },
  nature_discovery: {
    zh: ['走走', '徒步', '冒险', '风', '山', '自然'],
    en: ['walk', 'hike', 'adventure', 'wind', 'mountain', 'nature']
  },
  urban_creation: {
    zh: ['建筑', '街拍', '人文', '色彩', '光影', '城市'],
    en: ['architecture', 'street', 'culture', 'color', 'light', 'city']
  },
  emotional_healing: {
    zh: ['离别', '放下', '自省', '重生', '安静', '治愈'],
    en: ['farewell', 'let go', 'introspect', 'rebirth', 'quiet', 'heal']
  },
  extreme_exploration: {
    zh: ['冲浪', '攀岩', '徒步', '风', '山', '挑战'],
    en: ['surf', 'climb', 'hike', 'wind', 'mountain', 'challenge']
  },
  cultural_exchange: {
    zh: ['市集', '工坊', '学习', '对话', '交流', '文化'],
    en: ['market', 'workshop', 'learn', 'dialogue', 'exchange', 'culture']
  }
}

const INTENT_DESCRIPTIONS: Record<IntentType, { en: string; zh: string }> = {
  photography_exploration: { en: 'create/shoot', zh: '创作/拍摄' },
  mind_healing: { en: 'rest/heal', zh: '休息/疗愈' },
  nature_discovery: { en: 'explore nature', zh: '探索自然' },
  urban_creation: { en: 'document urban life', zh: '记录城市' },
  emotional_healing: { en: 'emotional release', zh: '情感释放' },
  extreme_exploration: { en: 'self-challenge', zh: '挑战自我' },
  cultural_exchange: { en: 'cultural connection', zh: '文化连接' }
}

// ==================== 意图处理类 ====================

/**
 * 意图处理类
 */
export class IntentProcessor {
  /**
   * 生成意图选项的提示词
   */
  static buildOptionsPrompt(lang: string = 'zh-CN'): string {
    const isEnglish = lang.startsWith('en')
    return INTENTS.map(intent => this.buildIntentLine(intent, isEnglish ? 'en' : 'zh')).join('\n')
  }

  /**
   * 构建单个意图的描述行
   * 简化中英文逻辑，通过模板参数化
   */
  private static buildIntentLine(intent: IntentType, lang: 'en' | 'zh'): string {
    const { zh, en } = INTENT_KEYWORDS[intent]
    const desc = INTENT_DESCRIPTIONS[intent][lang]
    const keywords = (lang === 'en' ? en : zh).join(lang === 'en' ? ', ' : '、')
    const label = lang === 'en' ? 'keywords' : '关键词'
    
    return lang === 'en'
      ? `- ${intent}: user wants to ${desc} (${label}: ${keywords})`
      : `- ${intent}: 用户想要${desc}（${label}：${keywords}）`
  }
}

// ==================== 导出函数 ====================

/**
 * 生成意图选项的提示词（向后兼容）
 */
export function buildIntentOptionsPrompt(lang: string = 'zh-CN'): string {
  return IntentProcessor.buildOptionsPrompt(lang)
}

