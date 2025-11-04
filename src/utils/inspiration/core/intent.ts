/**
 * 意图处理模块（增强版）
 * - 词库分桶：core / motives / contexts / negatives
 * - 评分：词命中 + 共现模式 + 强度/社交修饰
 * - 向后兼容 buildIntentOptionsPrompt()
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

export type Lang = 'zh' | 'en'

type KeywordBucket = {
  core: string[]
  motives?: string[]
  contexts?: string[]
  negatives?: string[]
}

export type IntentLexicon = Record<IntentType, Record<Lang, KeywordBucket>>

export type Weights = {
  core: number
  motives: number
  contexts: number
  negatives: number
  cooccurrenceBoost: number
  intensityBoost: number
  solitudePenalty: number
  socialBoost: number
}

// ==================== 词库（中英） ====================

export const INTENT_LEXICON: IntentLexicon = {
  photography_exploration: {
    zh: {
      core: ['摄影','拍摄','扫街','取景','构图','长曝光','胶片','定格','画面感','镜头','相机','三脚架'],
      motives: ['记录灵感','表达','自我风格','作品集','审美','创作'],
      contexts: ['黄金时段','蓝调','夜拍','街头','展览','美术馆','暗夜','布光'],
      negatives: ['纯放松','静修','疗愈','断网']
    },
    en: {
      core: ['photography','shoot','street','composition','long exposure','film','frame','lens','camera','tripod'],
      motives: ['record ideas','express','personal style','portfolio','aesthetics','create'],
      contexts: ['golden hour','blue hour','night shot','street','exhibition','museum','low light','lighting'],
      negatives: ['retreat','detox','healing','unplug']
    }
  },
  mind_healing: {
    zh: {
      core: ['冥想','正念','静修','泡汤','温泉','森林浴','断网','躺','慢','放空','呼吸训练'],
      motives: ['倦怠','压力大','恢复','重新出发','调节睡眠','放下紧绷'],
      contexts: ['禅修营','静默徒步','山谷','湖畔','书店','茶室','栈道'],
      negatives: ['打卡','通宵','极限','赶场','拍大片']
    },
    en: {
      core: ['meditation','mindfulness','retreat','onsen','hot spring','forest bathing','digital detox','slow','breathe'],
      motives: ['burnout','stress','recover','restart','sleep adjust','let go'],
      contexts: ['zen camp','silent hiking','valley','lakeside','bookstore','tea house','boardwalk'],
      negatives: ['check-in run','all-nighter','extreme','rush','cinematic shooting']
    }
  },
  nature_discovery: {
    zh: {
      core: ['徒步','露营','星空','观鸟','峡谷','瀑布','海岸线','火山','草原','环湖','观景台','轻装'],
      motives: ['亲近自然','探索未知','解压','活力'],
      contexts: ['国家公园','步道','海拔','山口','营地','林线'],
      negatives: ['商场','夜店','纯城市']
    },
    en: {
      core: ['hike','camp','stargazing','birding','canyon','waterfall','coastline','volcano','grassland','loop lake','viewpoint'],
      motives: ['get close to nature','explore unknown','de-stress','vitality'],
      contexts: ['national park','trail','elevation','pass','campground','tree line'],
      negatives: ['mall','nightclub','pure city']
    }
  },
  urban_creation: {
    zh: {
      core: ['建筑漫游','街拍','人文','旧城','工业风','咖啡巡礼','博物馆','展馆','街区走读','设计参考','城市漫步','美食','探店','餐厅'],
      motives: ['城市灵感','社交','创作素材','design reference','记录城市'],
      contexts: ['地标','旧工厂','咖啡馆','餐吧','艺廊','夜色','交通便利'],
      negatives: ['荒野','静修','无人区']
    },
    en: {
      core: ['architecture walk','street photo','humanities','old town','industrial style','cafe hopping','museum','gallery','district stroll','food','dining','restaurant'],
      motives: ['urban inspiration','social','creative material','design reference','document city'],
      contexts: ['landmark','factory loft','cafe','bistro','art gallery','nightscape','metro access'],
      negatives: ['wilderness','retreat','no man\'s land']
    }
  },
  emotional_healing: {
    zh: {
      core: ['和解','告别','重启','写信','焚写仪式','沉浸式独处','倾诉','纪念','放流'],
      motives: ['分手','内耗','遗憾','想放下','开始新的自己'],
      contexts: ['海边放流','森林仪式','教堂','风铃','夜航火车','静默日','灯塔'],
      negatives: ['聚会狂欢','购物开黑','极限肾上腺素']
    },
    en: {
      core: ['reconcile','farewell','restart','letter writing','burning ritual','immersive solitude','confide','commemorate','release to sea'],
      motives: ['breakup','rumination','regret','let go','new self'],
      contexts: ['seaside release','forest ritual','church','wind chime','night train','silent day','lighthouse'],
      negatives: ['party hard','shopping spree','adrenaline']
    }
  },
  extreme_exploration: {
    zh: {
      core: ['冲浪','攀岩','溯溪','滑翔','越野','潜水','雪线','冰裂','速降','高差','冰攀'],
      motives: ['突破','挑战边界','肾上腺素','认证','课程'],
      contexts: ['零基础','进阶','教练','保护','装备','天气窗','安全等级','适应性训练'],
      negatives: ['静养','疗愈','伤后期','慢旅行']
    },
    en: {
      core: ['surf','climb','canyoning','paraglide','offroad','diving','snow line','ice crack','rappel','vertical gain','ice climbing'],
      motives: ['breakthrough','push limits','adrenaline','certification','course'],
      contexts: ['beginner','advance','coach','protection','gear','weather window','safety grade','acclimatization'],
      negatives: ['recovery','healing','post-injury','slow travel']
    }
  },
  cultural_exchange: {
    zh: {
      core: ['市集','工坊','手作','非遗','厨艺课','家宴','语言交换','走亲访友','文化走读','美食','料理','风味','品尝','餐饮','餐厅'],
      motives: ['认识当地人','理解文化','学习','共创','交流'],
      contexts: ['社群','民宿主','当地家庭','学校','庙会','合作社','home dining'],
      negatives: ['纯独处','拒绝社交']
    },
    en: {
      core: ['market','workshop','handcraft','intangible heritage','cooking class','home dining','language exchange','home visit','cultural walk','food','cuisine','gastronomy','dining','restaurant','taste'],
      motives: ['meet locals','understand culture','learn','co-create','exchange'],
      contexts: ['community','host','local family','school','temple fair','co-op','home dining'],
      negatives: ['pure solitude','anti-social']
    }
  }
}

// ==================== 展示文案（向后兼容） ====================

const INTENT_DESCRIPTIONS: Record<IntentType, { en: string; zh: string }> = {
  photography_exploration: { en: 'create/shoot', zh: '创作/拍摄' },
  mind_healing: { en: 'rest/heal', zh: '休息/疗愈' },
  nature_discovery: { en: 'explore nature', zh: '探索自然' },
  urban_creation: { en: 'document urban life', zh: '记录城市' },
  emotional_healing: { en: 'emotional release', zh: '情感释放' },
  extreme_exploration: { en: 'self-challenge', zh: '挑战自我' },
  cultural_exchange: { en: 'cultural connection', zh: '文化连接' }
}

export class IntentProcessor {
  static buildOptionsPrompt(lang: string = 'zh-CN'): string {
    const isEnglish = lang.startsWith('en')
    return INTENTS.map(intent => this.buildIntentLine(intent, isEnglish ? 'en' : 'zh')).join('\n')
  }

  private static buildIntentLine(intent: IntentType, lang: Lang): string {
    const pack = INTENT_LEXICON[intent][lang]
    const desc = INTENT_DESCRIPTIONS[intent][lang]
    const keywords = (pack.core ?? []).slice(0, 8).join(lang === 'en' ? ', ' : '、')
    const label = lang === 'en' ? 'keywords' : '关键词'
    return lang === 'en'
      ? `- ${intent}: user wants to ${desc} (${label}: ${keywords})`
      : `- ${intent}: 用户想要${desc}（${label}：${keywords}）`
  }
}

export function buildIntentOptionsPrompt(lang: string = 'zh-CN'): string {
  return IntentProcessor.buildOptionsPrompt(lang)
}

// ==================== 评分逻辑 ====================

const INTENSITY_WORDS_ZH = ['一定要','迫不及待','燃','极限','狠狠','立刻','马上','要破个界']
const INTENSITY_WORDS_EN = ['asap','must','cannot wait','right now','push limit']

const SOLITUDE_WORDS_ZH = ['一个人','独处','静默','想安静','不社交']
const SOLITUDE_WORDS_EN = ['alone','solitude','silent','quiet time','no social']

const SOCIAL_WORDS_ZH = ['一起','结伴','语言交换','聚会','社群','家宴','home dining']
const SOCIAL_WORDS_EN = ['together','group','language exchange','party','community','home dining','host']

export const defaultWeights: Weights = {
  core: 3,
  motives: 2,
  contexts: 1.5,
  negatives: 2.5,
  cooccurrenceBoost: 2,
  intensityBoost: 1.5,
  solitudePenalty: 2,
  socialBoost: 1.5
}

export function scoreIntent(
  text: string,
  lang: Lang,
  lexicon: IntentLexicon = INTENT_LEXICON,
  weights: Weights = defaultWeights
) {
  const t = normalize(text)
  const hit = (arr?: string[]) => (arr ?? []).filter(k => t.includes(k.toLowerCase()))
  const intensityWords = lang === 'zh' ? INTENSITY_WORDS_ZH : INTENSITY_WORDS_EN
  const solitudeWords  = lang === 'zh' ? SOLITUDE_WORDS_ZH  : SOLITUDE_WORDS_EN
  const socialWords    = lang === 'zh' ? SOCIAL_WORDS_ZH    : SOCIAL_WORDS_EN

  let results: Record<IntentType, number> = {} as any

  for (const intent of INTENTS) {
    const pack = lexicon[intent][lang]
    let s = 0

    s += hit(pack.core).length     * weights.core
    s += hit(pack.motives).length  * weights.motives
    s += hit(pack.contexts).length * weights.contexts
    s -= hit(pack.negatives).length* weights.negatives

    // —— 共现加权 —— //
    if (intent === 'photography_exploration') {
      if (['相机','镜头','三脚架','camera','lens','tripod'].some(w => t.includes(w))
       && ['日出','蓝调','夜拍','黄金时段','golden hour','blue hour','night'].some(w => t.includes(w))) {
        s += weights.cooccurrenceBoost
      }
    }

    if (intent === 'extreme_exploration') {
      if (['教练','保护','装备','天气窗','coach','gear','protection','weather window'].some(w => t.includes(w))) {
        s += weights.cooccurrenceBoost
      }
    }

    if (intent === 'cultural_exchange') {
      if (['工坊','市集','家庭','语言交换','home dining','workshop','market','family'].some(w => t.includes(w))) {
        s += weights.cooccurrenceBoost
      }
    }

    // —— 强度/社交修饰 —— //
    if (intensityWords.some(w => t.includes(w.toLowerCase()))) s += weights.intensityBoost
    if (solitudeWords.some(w => t.includes(w.toLowerCase())) && intent === 'cultural_exchange') s -= weights.solitudePenalty
    if (socialWords.some(w => t.includes(w.toLowerCase())) && intent === 'cultural_exchange') s += weights.socialBoost

    results[intent] = s
  }

  const sorted = Object.entries(results).sort((a,b)=>b[1]-a[1])
  const [top, second] = sorted
  const delta = ((top?.[1] ?? 0) - (second?.[1] ?? 0))

  return {
    scores: results,
    primary: top?.[0] as IntentType | undefined,
    secondary: delta < 2 ? (second?.[0] as IntentType | undefined) : undefined,
    confidence: Math.max(0, Math.min(1, (top?.[1] ?? 0) / 10))
  }
}

// ==================== 工具函数 ====================

export function normalize(s: string) {
  return s
    .toLowerCase()
    // 全角转半角（简单版）
    .replace(/[\uFF01-\uFF5E]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/\s+/g,' ')
    .trim()
}
