/*
 Lightweight mock database for Inspiration mode.
 - In-memory store with optional localStorage persistence
 - Minimal schema validation without external deps
 - Seed data for quick verification before hooking a real DB
*/

export type InspirationStage =
  | 'summon'
  | 'reflection'
  | 'awakening'
  | 'internalization'
  | 'transformation'

export interface Destination {
  id: string
  name: string
  country: string
  lat?: number
  lng?: number
  symbolicArchetype?: string
  description?: string
  cognitiveDensity?: number // 1-10
  recommendedStage?: InspirationStage
  keywords?: string[]
  images?: { cover?: string; gallery?: string[] }
  // 自动打标：根据关键词/象征/描述推断的意图标签（仅当 cognitiveDensity > 7 时赋值）
  intentTags?: Array<
    | 'emotional_healing'
    | 'mind_healing'
    | 'extreme_exploration'
    | 'cultural_exchange'
    | 'photography_exploration'
    | 'urban_creation'
  >
  createdAt: string
  updatedAt: string
}

export interface PsychologicalTrigger {
  id: string
  destinationId: string
  emotion: string
  theme?: string
  description?: string
  ritualExamples?: Array<{ title: string; steps?: string[]; durationMin?: number }>
  soundscape?: string
  scentProfile?: { top?: string; base?: string }
  createdAt: string
}

export interface UserReflection {
  id: string
  destinationId: string | null
  userId: string
  reflectionText?: string
  emotionTone?: string
  createdAt: string
}

type DbShape = {
  destinations: Destination[]
  triggers: PsychologicalTrigger[]
  reflections: UserReflection[]
}

const STORAGE_KEY = 'inspiration_db_v1'

// ---------- Utilities ----------
function nowIso(): string {
  return new Date().toISOString()
}

function uuid(): string {
  // Simple RFC4122 v4-ish ID for mock usage
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// ---------- Validation (lightweight) ----------
export function validateDestination(d: any): d is Destination {
  const ok =
    d &&
    typeof d.id === 'string' &&
    typeof d.name === 'string' &&
    typeof d.country === 'string' &&
    typeof d.createdAt === 'string' &&
    typeof d.updatedAt === 'string'

  if (!ok) return false
  if (d.cognitiveDensity != null) {
    if (typeof d.cognitiveDensity !== 'number') return false
    if (d.cognitiveDensity < 1 || d.cognitiveDensity > 10) return false
  }
  return true
}

export function validateTrigger(t: any): t is PsychologicalTrigger {
  const ok =
    t &&
    typeof t.id === 'string' &&
    typeof t.destinationId === 'string' &&
    typeof t.emotion === 'string' &&
    typeof t.createdAt === 'string'
  return !!ok
}

export function validateReflection(r: any): r is UserReflection {
  const ok =
    r &&
    typeof r.id === 'string' &&
    (typeof r.destinationId === 'string' || r.destinationId === null) &&
    typeof r.userId === 'string' &&
    typeof r.createdAt === 'string'
  return !!ok
}

function isDbShape(db: any): db is DbShape {
  if (!db || typeof db !== 'object') return false
  if (!Array.isArray(db.destinations) || !Array.isArray(db.triggers) || !Array.isArray(db.reflections)) return false
  return true
}

// ---------- Persistence ----------
function loadFromStorage(): DbShape | null {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!isDbShape(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

function saveToStorage(db: DbShape): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
    }
  } catch {
    // no-op in SSR or storage denied
  }
}

// ---------- Seed Data ----------
const seed: DbShape = {
  destinations: [
    {
      id: uuid(),
      name: '冈仁波齐·神山环线',
      country: '中国',
      lat: 31.0675,
      lng: 81.3119,
      symbolicArchetype: 'mountain',
      description: '高原朝圣之路，适合“敬畏/觉醒”的心智阶段。',
      cognitiveDensity: 9,
      recommendedStage: 'awakening',
      keywords: ['朝圣', '雪山', '呼吸', '敬畏'],
      images: { cover: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: uuid(),
      name: '海边清晨·潮汐冥想',
      country: '日本',
      lat: 35.0116,
      lng: 135.7681,
      symbolicArchetype: 'water',
      description: '水的节律配合呼吸，安抚焦虑情绪，适合“映照/内化”。',
      cognitiveDensity: 6,
      recommendedStage: 'reflection',
      keywords: ['海浪', '清晨', '缓慢', '镜语'],
      images: { cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: uuid(),
      name: '冰岛·雷克雅未克极光之夜',
      country: '冰岛',
      lat: 64.1466,
      lng: -21.9426,
      symbolicArchetype: 'light',
      description: '火与冰的交汇处，在极光下体验“觉醒”的闪光时刻。',
      cognitiveDensity: 8,
      recommendedStage: 'awakening',
      keywords: ['极光', '火山', '夜空', '转化'],
      images: { cover: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: uuid(),
      name: '普罗旺斯·薰衣草冥想田',
      country: '法国',
      lat: 43.8345,
      lng: 5.7808,
      symbolicArchetype: 'flower',
      description: '气味唤醒记忆，色彩带来平静，适合“内化”阶段的疗愈。',
      cognitiveDensity: 5,
      recommendedStage: 'internalization',
      keywords: ['香气', '紫色', '疗愈', '柔软'],
      images: { cover: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: uuid(),
      name: '智利·巴塔哥尼亚风之谷',
      country: '智利',
      lat: -51.7963,
      lng: -72.9981,
      symbolicArchetype: 'wind',
      description: '无边旷野中的徒步与风声，是“有益的脱离”的最佳场景。',
      cognitiveDensity: 7,
      recommendedStage: 'summon',
      keywords: ['风', '荒野', '自由', '出发'],
      images: { cover: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: uuid(),
      name: '不丹·帕罗谷静心寺',
      country: '不丹',
      lat: 27.4305,
      lng: 89.4133,
      symbolicArchetype: 'silence',
      description: '山间寺庙的钟声与风铃，象征“转化”与内在平衡。',
      cognitiveDensity: 9,
      recommendedStage: 'transformation',
      keywords: ['禅', '静默', '仪式', '平衡'],
      images: { cover: 'https://images.unsplash.com/photo-1553909489-df03aef8e9a3?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: uuid(),
      name: '挪威·罗弗敦群岛黎明行走',
      country: '挪威',
      lat: 68.1545,
      lng: 13.6140,
      symbolicArchetype: 'horizon',
      description: '海天之间的长光，是“召唤”阶段的最佳隐喻。',
      cognitiveDensity: 6,
      recommendedStage: 'summon',
      keywords: ['黎明', '光', '行走', '宁静'],
      images: { cover: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: uuid(),
      name: '印度·瓦拉纳西河畔祈火',
      country: '印度',
      lat: 25.3176,
      lng: 82.9739,
      symbolicArchetype: 'fire',
      description: '恒河之火照亮自我转化的勇气，象征“觉醒”的重生。',
      cognitiveDensity: 10,
      recommendedStage: 'awakening',
      keywords: ['火', '仪式', '生命', '重生'],
      images: { cover: 'https://images.unsplash.com/photo-1508435230180-0481a5d8a1f0?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    // ---------- 新增国际目的地数据 ----------
    // 南美洲
    {
      id: uuid(),
      name: '秘鲁·马丘比丘天空之城',
      country: '秘鲁',
      lat: -13.1631,
      lng: -72.5450,
      symbolicArchetype: 'ruins',
      description: '印加古城的神秘能量场，激发“召唤”阶段的探索欲望。',
      cognitiveDensity: 8,
      recommendedStage: 'summon',
      keywords: ['古城', '神秘', '探索', '文明'],
      images: { cover: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: uuid(),
      name: '巴西·亚马逊雨林深处',
      country: '巴西',
      lat: -3.4653,
      lng: -62.2159,
      symbolicArchetype: 'jungle',
      description: '原始雨林的生机与混沌，适合“内化”阶段的自我对话。',
      cognitiveDensity: 7,
      recommendedStage: 'internalization',
      keywords: ['雨林', '生命', '混沌', '净化'],
      images: { cover: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },

    // 非洲
    {
      id: uuid(),
      name: '摩洛哥·撒哈拉星空营地',
      country: '摩洛哥',
      lat: 31.7917,
      lng: -4.5,
      symbolicArchetype: 'desert',
      description: '沙漠的极简与星空的浩瀚，引发“觉醒”时刻的宇宙连接。',
      cognitiveDensity: 9,
      recommendedStage: 'awakening',
      keywords: ['沙漠', '星空', '极简', '无限'],
      images: { cover: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: uuid(),
      name: '肯尼亚·马赛马拉草原日落',
      country: '肯尼亚',
      lat: -1.4061,
      lng: 35.0105,
      symbolicArchetype: 'savanna',
      description: '动物大迁徙的生命轮回，映照“转化”阶段的内在变化。',
      cognitiveDensity: 7,
      recommendedStage: 'transformation',
      keywords: ['草原', '生命', '轮回', '野性'],
      images: { cover: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: uuid(),
      name: '埃及·金字塔冥想之旅',
      country: '埃及',
      lat: 29.9792,
      lng: 31.1342,
      symbolicArchetype: 'pyramid',
      description: '古老文明的几何能量，助力“映照”阶段的内在平衡。',
      cognitiveDensity: 8,
      recommendedStage: 'reflection',
      keywords: ['金字塔', '几何', '永恒', '智慧'],
      images: { cover: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },

    // 欧洲
    {
      id: uuid(),
      name: '希腊·圣托里尼蓝顶教堂',
      country: '希腊',
      lat: 36.3932,
      lng: 25.4615,
      symbolicArchetype: 'island',
      description: '爱琴海的蓝白纯粹，抚慰心灵，适合“内化”阶段的情绪疗愈。',
      cognitiveDensity: 5,
      recommendedStage: 'internalization',
      keywords: ['海岛', '蓝色', '纯粹', '平静'],
      images: { cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: uuid(),
      name: '意大利·托斯卡纳田园时光',
      country: '意大利',
      lat: 43.4637,
      lng: 11.8734,
      symbolicArchetype: 'countryside',
      description: '田园诗般的慢生活，唤醒“召唤”阶段的生活热情。',
      cognitiveDensity: 4,
      recommendedStage: 'summon',
      keywords: ['田园', '慢生活', '诗意', '收获'],
      images: { cover: 'https://images.unsplash.com/photo-1499602211854-122b55ef5c6a?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: uuid(),
      name: '瑞士·阿尔卑斯山静修',
      country: '瑞士',
      lat: 46.8182,
      lng: 8.2275,
      symbolicArchetype: 'alps',
      description: '雪山湖泊的纯净能量，促进“转化”阶段的身心整合。',
      cognitiveDensity: 7,
      recommendedStage: 'transformation',
      keywords: ['雪山', '湖泊', '纯净', '整合'],
      images: { cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },

    // 北美洲
    {
      id: uuid(),
      name: '美国·亚利桑那塞多纳能量漩涡',
      country: '美国',
      lat: 34.8697,
      lng: -111.7600,
      symbolicArchetype: 'vortex',
      description: '地球能量漩涡点，激发“觉醒”阶段的灵性感知。',
      cognitiveDensity: 8,
      recommendedStage: 'awakening',
      keywords: ['能量', '漩涡', '灵性', '大地'],
      images: { cover: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: uuid(),
      name: '加拿大·班夫国家公园冰川湖',
      country: '加拿大',
      lat: 51.4968,
      lng: -116.1829,
      symbolicArchetype: 'glacier',
      description: '冰川与翡翠湖的对话，适合“映照”阶段的深度沉思。',
      cognitiveDensity: 7,
      recommendedStage: 'reflection',
      keywords: ['冰川', '湖泊', '翡翠', '沉思'],
      images: { cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },

    // 大洋洲
    {
      id: uuid(),
      name: '澳大利亚·乌鲁鲁红色巨石',
      country: '澳大利亚',
      lat: -25.3444,
      lng: 131.0369,
      symbolicArchetype: 'monolith',
      description: '原住民圣地的古老智慧，引发“召唤”阶段的生命意义探索。',
      cognitiveDensity: 8,
      recommendedStage: 'summon',
      keywords: ['巨石', '红色', '土著', '神圣'],
      images: { cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: uuid(),
      name: '新西兰·霍比屯童话森林',
      country: '新西兰',
      lat: -37.8721,
      lng: 175.6829,
      symbolicArchetype: 'forest',
      description: '魔幻现实主义的森林漫步，唤醒“内化”阶段的童真与创意。',
      cognitiveDensity: 6,
      recommendedStage: 'internalization',
      keywords: ['森林', '童话', '创意', '魔法'],
      images: { cover: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },

    // 亚洲其他国家
    {
      id: uuid(),
      name: '泰国·清迈寺庙禅修',
      country: '泰国',
      lat: 18.7883,
      lng: 98.9853,
      symbolicArchetype: 'temple',
      description: '泰北寺庙的宁静氛围，促进“转化”阶段的心灵平静。',
      cognitiveDensity: 6,
      recommendedStage: 'transformation',
      keywords: ['寺庙', '禅修', '宁静', '佛教'],
      images: { cover: 'https://images.unsplash.com/photo-1553909489-df03aef8e9a3?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: uuid(),
      name: '尼泊尔·喜马拉雅徒步',
      country: '尼泊尔',
      lat: 28.3949,
      lng: 84.1240,
      symbolicArchetype: 'himalaya',
      description: '世界屋脊的攀登之旅，象征“觉醒”阶段的自我超越。',
      cognitiveDensity: 9,
      recommendedStage: 'awakening',
      keywords: ['喜马拉雅', '徒步', '攀登', '超越'],
      images: { cover: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    // ---------- 第二批新增国际目的地 ----------
    // 中东地区
    {
      id: uuid(),
      name: '阿联酋·迪拜沙漠冲沙',
      country: '阿联酋',
      lat: 24.4539,
      lng: 54.3773,
      symbolicArchetype: 'dune',
      description: '金色沙丘的起伏韵律，体验"召唤"阶段的冒险精神。',
      cognitiveDensity: 6,
      recommendedStage: 'summon',
      keywords: ['沙丘', '冒险', '金色', '流动'],
      images: { cover: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: uuid(),
      name: '土耳其·卡帕多奇亚热气球',
      country: '土耳其',
      lat: 38.6431,
      lng: 34.8287,
      symbolicArchetype: 'balloon',
      description: '空中俯瞰奇异地貌，获得"觉醒"阶段的宏观视角。',
      cognitiveDensity: 7,
      recommendedStage: 'awakening',
      keywords: ['热气球', '空中', '奇异', '俯瞰'],
      images: { cover: 'https://images.unsplash.com/photo-1505993597083-3bd19fb75e57?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: uuid(),
      name: '以色列·死海漂浮冥想',
      country: '以色列',
      lat: 31.5590,
      lng: 35.4732,
      symbolicArchetype: 'salt',
      description: '无重力的漂浮体验，促进"内化"阶段的深度放松。',
      cognitiveDensity: 5,
      recommendedStage: 'internalization',
      keywords: ['漂浮', '盐湖', '失重', '疗愈'],
      images: { cover: 'https://images.unsplash.com/photo-1559666647-0bd93e8c7977?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },

    // 东南亚
    {
      id: uuid(),
      name: '印度尼西亚·巴厘岛圣泉沐浴',
      country: '印度尼西亚',
      lat: -8.5193,
      lng: 115.1889,
      symbolicArchetype: 'spring',
      description: '神圣泉水的净化仪式，象征"转化"阶段的心灵洗涤。',
      cognitiveDensity: 6,
      recommendedStage: 'transformation',
      keywords: ['圣泉', '净化', '仪式', '重生'],
      images: { cover: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: uuid(),
      name: '越南·下龙湾海上峰林',
      country: '越南',
      lat: 20.9101,
      lng: 107.1839,
      symbolicArchetype: 'karst',
      description: '海上石灰岩的奇观，引发"映照"阶段的审美沉思。',
      cognitiveDensity: 6,
      recommendedStage: 'reflection',
      keywords: ['峰林', '海上', '奇观', '倒影'],
      images: { cover: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: uuid(),
      name: '柬埔寨·吴哥窟日出冥想',
      country: '柬埔寨',
      lat: 13.4125,
      lng: 103.8670,
      symbolicArchetype: 'sunrise',
      description: '古老寺庙的日出时刻，体验"觉醒"阶段的历史连接。',
      cognitiveDensity: 8,
      recommendedStage: 'awakening',
      keywords: ['日出', '古寺', '历史', '永恒'],
      images: { cover: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },

    // 欧洲其他
    {
      id: uuid(),
      name: '西班牙·圣地亚哥朝圣之路',
      country: '西班牙',
      lat: 42.8805,
      lng: -8.5456,
      symbolicArchetype: 'pilgrimage',
      description: '千年朝圣之路的行走冥想，适合"召唤"阶段的目标寻找。',
      cognitiveDensity: 7,
      recommendedStage: 'summon',
      keywords: ['朝圣', '行走', '目标', '坚持'],
      images: { cover: 'https://images.unsplash.com/photo-1543785734-4b6e564642f8?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: uuid(),
      name: '爱尔兰·莫赫悬崖听涛',
      country: '爱尔兰',
      lat: 52.9719,
      lng: -9.4265,
      symbolicArchetype: 'cliff',
      description: '大西洋悬崖的壮阔，激发"映照"阶段的情绪释放。',
      cognitiveDensity: 7,
      recommendedStage: 'reflection',
      keywords: ['悬崖', '听涛', '壮阔', '释放'],
      images: { cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: uuid(),
      name: '奥地利·哈尔施塔特湖光山色',
      country: '奥地利',
      lat: 47.5622,
      lng: 13.6493,
      symbolicArchetype: 'lake',
      description: '湖畔小镇的宁静美景，促进"内化"阶段的和谐感受。',
      cognitiveDensity: 5,
      recommendedStage: 'internalization',
      keywords: ['湖畔', '宁静', '和谐', '美景'],
      images: { cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },

    // 非洲其他
    {
      id: uuid(),
      name: '坦桑尼亚·乞力马扎罗攀登',
      country: '坦桑尼亚',
      lat: -3.0674,
      lng: 37.3556,
      symbolicArchetype: 'summit',
      description: '非洲之巅的攀登挑战，象征"转化"阶段的自我突破。',
      cognitiveDensity: 9,
      recommendedStage: 'transformation',
      keywords: ['雪山', '攀登', '挑战', '巅峰'],
      images: { cover: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: uuid(),
      name: '南非·开普敦桌山云海',
      country: '南非',
      lat: -33.9628,
      lng: 18.4094,
      symbolicArchetype: 'table',
      description: '平顶山的云海奇观，带来"觉醒"阶段的视野拓展。',
      cognitiveDensity: 7,
      recommendedStage: 'awakening',
      keywords: ['桌山', '云海', '视野', '奇迹'],
      images: { cover: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },

    // 南美洲其他
    {
      id: uuid(),
      name: '阿根廷·伊瓜苏瀑布雷鸣',
      country: '阿根廷',
      lat: -25.6953,
      lng: -54.4367,
      symbolicArchetype: 'waterfall',
      description: '世界最宽瀑布的能量冲击，适合"映照"阶段的情绪净化。',
      cognitiveDensity: 8,
      recommendedStage: 'reflection',
      keywords: ['瀑布', '雷鸣', '能量', '冲击'],
      images: { cover: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: uuid(),
      name: '哥伦比亚·咖啡庄园慢生活',
      country: '哥伦比亚',
      lat: 4.5709,
      lng: -74.2973,
      symbolicArchetype: 'coffee',
      description: '咖啡种植园的悠闲时光，促进"内化"阶段的生活品味。',
      cognitiveDensity: 4,
      recommendedStage: 'internalization',
      keywords: ['咖啡', '慢生活', '香气', '品味'],
      images: { cover: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },

    // 太平洋岛国
    {
      id: uuid(),
      name: '斐济·珊瑚礁浮潜',
      country: '斐济',
      lat: -17.7134,
      lng: 178.0650,
      symbolicArchetype: 'coral',
      description: '彩色珊瑚礁的水下世界，引发"召唤"阶段的好奇探索。',
      cognitiveDensity: 6,
      recommendedStage: 'summon',
      keywords: ['珊瑚', '浮潜', '色彩', '探索'],
      images: { cover: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: uuid(),
      name: '马尔代夫·水下餐厅用餐',
      country: '马尔代夫',
      lat: 4.1742,
      lng: 73.5089,
      symbolicArchetype: 'underwater',
      description: '海底世界的用餐体验，带来"觉醒"阶段的视角转换。',
      cognitiveDensity: 7,
      recommendedStage: 'awakening',
      keywords: ['水下', '用餐', '视角', '转换'],
      images: { cover: 'https://images.unsplash.com/photo-1516496636080-14fb876e029d?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },

    // 中亚地区
    {
      id: uuid(),
      name: '乌兹别克斯坦·撒马尔罕古城',
      country: '乌兹别克斯坦',
      lat: 39.6550,
      lng: 66.9750,
      symbolicArchetype: 'silkroad',
      description: '丝绸之路的古老城市，激发"映照"阶段的历史沉思。',
      cognitiveDensity: 7,
      recommendedStage: 'reflection',
      keywords: ['丝绸之路', '古城', '历史', '文明'],
      images: { cover: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: uuid(),
      name: '蒙古·戈壁沙漠星空',
      country: '蒙古',
      lat: 43.2202,
      lng: 101.1702,
      symbolicArchetype: 'gobi',
      description: '戈壁夜空的银河观测，促进"内化"阶段的宇宙连接。',
      cognitiveDensity: 8,
      recommendedStage: 'internalization',
      keywords: ['戈壁', '星空', '银河', '浩瀚'],
      images: { cover: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1200', gallery: [] },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  {
    id: uuid(),
    name: '南极·白色大陆静默航行',
    country: '南极',
    lat: -64.8259,
    lng: -63.4933,
    symbolicArchetype: 'iceberg',
    description: '地球最后净土的极致纯净，带来"觉醒"阶段的根本性思考。',
    cognitiveDensity: 10,
    recommendedStage: 'awakening',
    keywords: ['冰川', '纯净', '极限', '孤独'],
    images: { cover: 'https://images.unsplash.com/photo-1584556818262-12cbb5ad0c51?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '格陵兰·因纽特文化体验',
    country: '格陵兰',
    lat: 64.1814,
    lng: -51.6941,
    symbolicArchetype: 'arctic',
    description: '北极圈内的原始生活，促进"内化"阶段的简单回归。',
    cognitiveDensity: 8,
    recommendedStage: 'internalization',
    keywords: ['北极', '因纽特', '简单', '生存'],
    images: { cover: 'https://images.unsplash.com/photo-1516567723766-4d5b6d972098?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },

  // 中东特色
  {
    id: uuid(),
    name: '阿曼·瓦希巴沙漠贝都因之夜',
    country: '阿曼',
    lat: 22.5593,
    lng: 58.1562,
    symbolicArchetype: 'bedouin',
    description: '沙漠游牧民族的星空露营，体验"召唤"阶段的原始召唤。',
    cognitiveDensity: 7,
    recommendedStage: 'summon',
    keywords: ['贝都因', '游牧', '星空', '传统'],
    images: { cover: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '约旦·佩特拉古城探秘',
    country: '约旦',
    lat: 30.3285,
    lng: 35.4444,
    symbolicArchetype: 'rose_city',
    description: '玫瑰色古城的千年秘密，激发"映照"阶段的历史想象。',
    cognitiveDensity: 8,
    recommendedStage: 'reflection',
    keywords: ['玫瑰城', '秘密', '考古', '时光'],
    images: { cover: 'https://images.unsplash.com/photo-1555400112-7e0e6806b8ac?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },

  // 非洲特色
  {
    id: uuid(),
    name: '马达加斯加·猴面包树大道',
    country: '马达加斯加',
    lat: -20.2500,
    lng: 44.4167,
    symbolicArchetype: 'baobab',
    description: '奇特树木的生命力象征，带来"转化"阶段的韧性培养。',
    cognitiveDensity: 7,
    recommendedStage: 'transformation',
    keywords: ['猴面包树', '奇特', '生命力', '韧性'],
    images: { cover: 'https://images.unsplash.com/photo-1571583235146-9aa06633a96e?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '纳米比亚·红色沙丘日出',
    country: '纳米比亚',
    lat: -24.5883,
    lng: 15.9391,
    symbolicArchetype: 'red_dune',
    description: '世界最古老沙丘的色彩变幻，促进"觉醒"阶段的美学感知。',
    cognitiveDensity: 7,
    recommendedStage: 'awakening',
    keywords: ['红色沙丘', '古老', '色彩', '光影'],
    images: { cover: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },

  // 亚洲特色
  {
    id: uuid(),
    name: '斯里兰卡·高山茶园火车',
    country: '斯里兰卡',
    lat: 6.9824,
    lng: 80.7710,
    symbolicArchetype: 'tea_train',
    description: '穿越茶园的慢速火车，适合"内化"阶段的节奏调整。',
    cognitiveDensity: 5,
    recommendedStage: 'internalization',
    keywords: ['茶园', '火车', '慢速', '节奏'],
    images: { cover: 'https://images.unsplash.com/photo-1558862102-4ce0cfad1e29?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '缅甸·蒲甘热气球日出',
    country: '缅甸',
    lat: 21.1722,
    lng: 94.8600,
    symbolicArchetype: 'pagoda',
    description: '万千佛塔的日出美景，带来"觉醒"阶段的灵性体验。',
    cognitiveDensity: 8,
    recommendedStage: 'awakening',
    keywords: ['佛塔', '日出', '灵性', '万千'],
    images: { cover: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },

  // 欧洲特色
  {
    id: uuid(),
    name: '葡萄牙·罗卡角天涯海角',
    country: '葡萄牙',
    lat: 38.7804,
    lng: -9.4989,
    symbolicArchetype: 'cape',
    description: '欧洲大陆最西端的海角，象征"召唤"阶段的边界突破。',
    cognitiveDensity: 6,
    recommendedStage: 'summon',
    keywords: ['天涯海角', '边界', '海洋', '勇气'],
    images: { cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '捷克·布拉格查理大桥',
    country: '捷克',
    lat: 50.0865,
    lng: 14.4110,
    symbolicArchetype: 'bridge',
    description: '连接古今的石桥漫步，促进"映照"阶段的时空思考。',
    cognitiveDensity: 6,
    recommendedStage: 'reflection',
    keywords: ['石桥', '连接', '古今', '艺术'],
    images: { cover: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },

  // 南美特色
  {
    id: uuid(),
    name: '玻利维亚·乌尤尼盐湖天空之镜',
    country: '玻利维亚',
    lat: -20.1338,
    lng: -67.4891,
    symbolicArchetype: 'mirror',
    description: '世界最大盐湖的镜像效果，带来"映照"阶段的自我审视。',
    cognitiveDensity: 9,
    recommendedStage: 'reflection',
    keywords: ['盐湖', '镜像', '倒影', '真实'],
    images: { cover: 'https://images.unsplash.com/photo-1559666647-0bd93e8c7977?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '厄瓜多尔·加拉帕戈斯群岛',
    country: '厄瓜多尔',
    lat: -0.9538,
    lng: -91.0077,
    symbolicArchetype: 'evolution',
    description: '达尔文进化论的灵感源地，激发"觉醒"阶段的生命思考。',
    cognitiveDensity: 8,
    recommendedStage: 'awakening',
    keywords: ['进化', '独特', '自然', '探索'],
    images: { cover: 'https://images.unsplash.com/photo-1572286427392-41c0550cce9d?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },

  // 北美特色
  {
    id: uuid(),
    name: '墨西哥·奇琴伊察玛雅遗迹',
    country: '墨西哥',
    lat: 20.6843,
    lng: -88.5678,
    symbolicArchetype: 'pyramid',
    description: '玛雅文明的天文智慧，促进"内化"阶段的古老连接。',
    cognitiveDensity: 7,
    recommendedStage: 'internalization',
    keywords: ['玛雅', '天文', '智慧', '文明'],
    images: { cover: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '哥斯达黎加·蒙特维德云雾森林',
    country: '哥斯达黎加',
    lat: 10.3000,
    lng: -84.8000,
    symbolicArchetype: 'cloud_forest',
    description: '云雾缭绕的神秘森林，适合"召唤"阶段的冒险探索。',
    cognitiveDensity: 7,
    recommendedStage: 'summon',
    keywords: ['云雾', '森林', '神秘', '生态'],
    images: { cover: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },

  // 大洋洲特色
  {
    id: uuid(),
    name: '巴布亚新几内亚·部落文化',
    country: '巴布亚新几内亚',
    lat: -6.3150,
    lng: 143.9555,
    symbolicArchetype: 'tribe',
    description: '原始部落的传统仪式，带来"转化"阶段的文化冲击。',
    cognitiveDensity: 9,
    recommendedStage: 'transformation',
    keywords: ['部落', '原始', '仪式', '文化'],
    images: { cover: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '瓦努阿图·活火山观测',
    country: '瓦努阿图',
    lat: -17.5250,
    lng: 168.3500,
    symbolicArchetype: 'volcano',
    description: '近距离观测活火山喷发，激发"觉醒"阶段的自然敬畏。',
    cognitiveDensity: 9,
    recommendedStage: 'awakening',
    keywords: ['火山', '喷发', '自然力', '敬畏'],
    images: { cover: 'https://images.unsplash.com/photo-1507501336603-6e31db2be093?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },

  // 特殊地区
  {
    id: uuid(),
    name: '西藏·纳木错圣湖朝拜',
    country: '中国',
    lat: 30.7000,
    lng: 90.5000,
    symbolicArchetype: 'holy_lake',
    description: '世界海拔最高圣湖的朝圣，促进"内化"阶段的灵性连接。',
    cognitiveDensity: 9,
    recommendedStage: 'internalization',
    keywords: ['圣湖', '海拔', '朝圣', '纯净'],
    images: { cover: 'https://images.unsplash.com/photo-154533086-6c6c6f8f2b2d?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '俄罗斯·贝加尔湖蓝冰',
    country: '俄罗斯',
    lat: 53.5000,
    lng: 108.0000,
    symbolicArchetype: 'blue_ice',
    description: '世界最深湖泊的冬季蓝冰，带来"映照"阶段的极致美感。',
    cognitiveDensity: 8,
    recommendedStage: 'reflection',
    keywords: ['蓝冰', '冬季', '深邃', '纯净'],
    images: { cover: 'https://images.unsplash.com/photo-1584556818262-12cbb5ad0c51?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '塞舌尔·花岗岩海滩',
    country: '塞舌尔',
    lat: -4.6191,
    lng: 55.4515,
    symbolicArchetype: 'granite',
    description: '独特花岗岩地貌的海滩，适合"内化"阶段的独特体验。',
    cognitiveDensity: 6,
    recommendedStage: 'internalization',
    keywords: ['花岗岩', '独特', '海滩', '平衡'],
    images: { cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '毛里求斯·七色土奇观',
    country: '毛里求斯',
    lat: -20.4044,
    lng: 57.4728,
    symbolicArchetype: 'color_earth',
    description: '七彩土壤的自然奇迹，激发"觉醒"阶段的多样性认知。',
    cognitiveDensity: 7,
    recommendedStage: 'awakening',
    keywords: ['七色土', '奇迹', '多样', '自然'],
    images: { cover: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },

  // 文化深度
  {
    id: uuid(),
    name: '伊朗·伊斯法罕皇家广场',
    country: '伊朗',
    lat: 32.6546,
    lng: 51.6670,
    symbolicArchetype: 'persian',
    description: '波斯帝国辉煌遗迹，促进"映照"阶段的文明思考。',
    cognitiveDensity: 8,
    recommendedStage: 'reflection',
    keywords: ['波斯', '皇家', '文明', '辉煌'],
    images: { cover: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '埃塞俄比亚·拉利贝拉岩石教堂',
    country: '埃塞俄比亚',
    lat: 12.0317,
    lng: 39.0419,
    symbolicArchetype: 'rock_church',
    description: '整块岩石雕刻的教堂，象征"转化"阶段的信念力量。',
    cognitiveDensity: 8,
    recommendedStage: 'transformation',
    keywords: ['岩石教堂', '雕刻', '信念', '奇迹'],
    images: { cover: 'https://images.unsplash.com/photo-1553909489-df03aef8e9a3?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '伊朗·卡尚盐漠之眼',
    country: '伊朗',
    lat: 33.812,
    lng: 51.417,
    symbolicArchetype: 'desert',
    description: '盐漠中干裂的地表如意识裂隙，适合“映照”与“自我觉察”。',
    cognitiveDensity: 8,
    recommendedStage: 'reflection',
    keywords: ['盐', '寂静', '幻觉', '自省'],
    images: { cover: 'https://images.unsplash.com/photo-1603450848787-3b1c6b3a7ff5?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '格鲁吉亚·卡兹别克山星语营地',
    country: '格鲁吉亚',
    lat: 42.66,
    lng: 44.64,
    symbolicArchetype: 'sky',
    description: '夜空浩瀚下，时间的概念被稀释，适合“召唤”的阶段开启。',
    cognitiveDensity: 7,
    recommendedStage: 'summon',
    keywords: ['星空', '孤独', '呼吸', '远方'],
    images: { cover: 'https://images.unsplash.com/photo-1503264116251-35a269479413?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '芬兰·索因拉蒂冰湖静思屋',
    country: '芬兰',
    lat: 61.15,
    lng: 28.91,
    symbolicArchetype: 'ice',
    description: '在冻结的湖面上冥想，寒冷让思绪沉静，适合“内化”。',
    cognitiveDensity: 6,
    recommendedStage: 'internalization',
    keywords: ['寒冷', '呼吸', '寂静', '透明'],
    images: { cover: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '尼泊尔·木斯塘石壁洞窟',
    country: '尼泊尔',
    lat: 28.938,
    lng: 83.942,
    symbolicArchetype: 'cave',
    description: '古老洞窟的壁画与风声交织，是“内在重生”的隐喻。',
    cognitiveDensity: 9,
    recommendedStage: 'awakening',
    keywords: ['洞穴', '时间', '遗迹', '重生'],
    images: { cover: 'https://images.unsplash.com/photo-1590608897129-79da98d15943?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '葡萄牙·辛特拉薄雾宫',
    country: '葡萄牙',
    lat: 38.787,
    lng: -9.389,
    symbolicArchetype: 'mist',
    description: '雾中的城堡象征“界限的模糊”，帮助思维从定义中脱出。',
    cognitiveDensity: 5,
    recommendedStage: 'reflection',
    keywords: ['雾', '梦', '边界', '象征'],
    images: { cover: 'https://images.unsplash.com/photo-1508349937151-22b09b19b4cb?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '阿根廷·乌马瓦卡红谷',
    country: '阿根廷',
    lat: -23.2,
    lng: -65.35,
    symbolicArchetype: 'earth',
    description: '红色山谷的层叠岩石如地球记忆，唤醒“时间感”的觉察。',
    cognitiveDensity: 7,
    recommendedStage: 'awakening',
    keywords: ['红色', '岩层', '时间', '共鸣'],
    images: { cover: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '摩洛哥·舍夫沙万蓝巷',
    country: '摩洛哥',
    lat: 35.171,
    lng: -5.269,
    symbolicArchetype: 'color',
    description: '蓝色街巷如梦境迷宫，带来“自我溶解”的映照体验。',
    cognitiveDensity: 6,
    recommendedStage: 'reflection',
    keywords: ['蓝', '迷宫', '梦境', '映照'],
    images: { cover: 'https://images.unsplash.com/photo-1561484930-87a76cde3039?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '挪威·特罗姆瑟极夜书屋',
    country: '挪威',
    lat: 69.649,
    lng: 18.956,
    symbolicArchetype: 'night',
    description: '长夜与书页并存的空间，帮助思想“静默发光”。',
    cognitiveDensity: 8,
    recommendedStage: 'internalization',
    keywords: ['极夜', '书', '孤独', '光'],
    images: { cover: 'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '中国·青海湖风语岸',
    country: '中国',
    lat: 36.9,
    lng: 99.9,
    symbolicArchetype: 'wind',
    description: '风与水交织的高原湖岸，是“召唤与出发”的能量点。',
    cognitiveDensity: 8,
    recommendedStage: 'summon',
    keywords: ['风', '湖', '辽阔', '出发'],
    images: { cover: 'https://images.unsplash.com/photo-1620633093172-bd2e8201d3c4?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '希腊·圣托里尼风之塔',
    country: '希腊',
    lat: 36.3932,
    lng: 25.4615,
    symbolicArchetype: 'air',
    description: '白墙与风塔间的回声，是“转化”阶段的开放之门。',
    cognitiveDensity: 5,
    recommendedStage: 'transformation',
    keywords: ['白', '风塔', '回声', '开放'],
    images: { cover: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '新西兰·蒂卡波湖观星台',
    country: '新西兰',
    lat: -44.0,
    lng: 170.48,
    symbolicArchetype: 'cosmos',
    description: '浩瀚星空下的观测站，象征“觉醒的无限性”。',
    cognitiveDensity: 9,
    recommendedStage: 'awakening',
    keywords: ['星空', '静默', '宇宙', '扩展'],
    images: { cover: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '南极·白色大陆静默航行',
    country: '南极',
    lat: -64.8259,
    lng: -63.4933,
    symbolicArchetype: 'iceberg',
    description: '地球最后净土的极致纯净，带来"觉醒"阶段的根本性思考。',
    cognitiveDensity: 10,
    recommendedStage: 'awakening',
    keywords: ['冰川', '纯净', '极限', '孤独'],
    images: { cover: 'https://images.unsplash.com/photo-1584556818262-12cbb5ad0c51?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '格陵兰·因纽特文化体验',
    country: '格陵兰',
    lat: 64.1814,
    lng: -51.6941,
    symbolicArchetype: 'arctic',
    description: '北极圈内的原始生活，促进"内化"阶段的简单回归。',
    cognitiveDensity: 8,
    recommendedStage: 'internalization',
    keywords: ['北极', '因纽特', '简单', '生存'],
    images: { cover: 'https://images.unsplash.com/photo-1516567723766-4d5b6d972098?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },

  // 中东特色
  {
    id: uuid(),
    name: '阿曼·瓦希巴沙漠贝都因之夜',
    country: '阿曼',
    lat: 22.5593,
    lng: 58.1562,
    symbolicArchetype: 'bedouin',
    description: '沙漠游牧民族的星空露营，体验"召唤"阶段的原始召唤。',
    cognitiveDensity: 7,
    recommendedStage: 'summon',
    keywords: ['贝都因', '游牧', '星空', '传统'],
    images: { cover: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '约旦·佩特拉古城探秘',
    country: '约旦',
    lat: 30.3285,
    lng: 35.4444,
    symbolicArchetype: 'rose_city',
    description: '玫瑰色古城的千年秘密，激发"映照"阶段的历史想象。',
    cognitiveDensity: 8,
    recommendedStage: 'reflection',
    keywords: ['玫瑰城', '秘密', '考古', '时光'],
    images: { cover: 'https://images.unsplash.com/photo-1555400112-7e0e6806b8ac?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },

  // 非洲特色
  {
    id: uuid(),
    name: '马达加斯加·猴面包树大道',
    country: '马达加斯加',
    lat: -20.2500,
    lng: 44.4167,
    symbolicArchetype: 'baobab',
    description: '奇特树木的生命力象征，带来"转化"阶段的韧性培养。',
    cognitiveDensity: 7,
    recommendedStage: 'transformation',
    keywords: ['猴面包树', '奇特', '生命力', '韧性'],
    images: { cover: 'https://images.unsplash.com/photo-1571583235146-9aa06633a96e?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '纳米比亚·红色沙丘日出',
    country: '纳米比亚',
    lat: -24.5883,
    lng: 15.9391,
    symbolicArchetype: 'red_dune',
    description: '世界最古老沙丘的色彩变幻，促进"觉醒"阶段的美学感知。',
    cognitiveDensity: 7,
    recommendedStage: 'awakening',
    keywords: ['红色沙丘', '古老', '色彩', '光影'],
    images: { cover: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },

  // 亚洲特色
  {
    id: uuid(),
    name: '斯里兰卡·高山茶园火车',
    country: '斯里兰卡',
    lat: 6.9824,
    lng: 80.7710,
    symbolicArchetype: 'tea_train',
    description: '穿越茶园的慢速火车，适合"内化"阶段的节奏调整。',
    cognitiveDensity: 5,
    recommendedStage: 'internalization',
    keywords: ['茶园', '火车', '慢速', '节奏'],
    images: { cover: 'https://images.unsplash.com/photo-1558862102-4ce0cfad1e29?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '缅甸·蒲甘热气球日出',
    country: '缅甸',
    lat: 21.1722,
    lng: 94.8600,
    symbolicArchetype: 'pagoda',
    description: '万千佛塔的日出美景，带来"觉醒"阶段的灵性体验。',
    cognitiveDensity: 8,
    recommendedStage: 'awakening',
    keywords: ['佛塔', '日出', '灵性', '万千'],
    images: { cover: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },

  // 欧洲特色
  {
    id: uuid(),
    name: '葡萄牙·罗卡角天涯海角',
    country: '葡萄牙',
    lat: 38.7804,
    lng: -9.4989,
    symbolicArchetype: 'cape',
    description: '欧洲大陆最西端的海角，象征"召唤"阶段的边界突破。',
    cognitiveDensity: 6,
    recommendedStage: 'summon',
    keywords: ['天涯海角', '边界', '海洋', '勇气'],
    images: { cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '捷克·布拉格查理大桥',
    country: '捷克',
    lat: 50.0865,
    lng: 14.4110,
    symbolicArchetype: 'bridge',
    description: '连接古今的石桥漫步，促进"映照"阶段的时空思考。',
    cognitiveDensity: 6,
    recommendedStage: 'reflection',
    keywords: ['石桥', '连接', '古今', '艺术'],
    images: { cover: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },

  // 南美特色
  {
    id: uuid(),
    name: '玻利维亚·乌尤尼盐湖天空之镜',
    country: '玻利维亚',
    lat: -20.1338,
    lng: -67.4891,
    symbolicArchetype: 'mirror',
    description: '世界最大盐湖的镜像效果，带来"映照"阶段的自我审视。',
    cognitiveDensity: 9,
    recommendedStage: 'reflection',
    keywords: ['盐湖', '镜像', '倒影', '真实'],
    images: { cover: 'https://images.unsplash.com/photo-1559666647-0bd93e8c7977?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '厄瓜多尔·加拉帕戈斯群岛',
    country: '厄瓜多尔',
    lat: -0.9538,
    lng: -91.0077,
    symbolicArchetype: 'evolution',
    description: '达尔文进化论的灵感源地，激发"觉醒"阶段的生命思考。',
    cognitiveDensity: 8,
    recommendedStage: 'awakening',
    keywords: ['进化', '独特', '自然', '探索'],
    images: { cover: 'https://images.unsplash.com/photo-1572286427392-41c0550cce9d?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },

  // 北美特色
  {
    id: uuid(),
    name: '墨西哥·奇琴伊察玛雅遗迹',
    country: '墨西哥',
    lat: 20.6843,
    lng: -88.5678,
    symbolicArchetype: 'pyramid',
    description: '玛雅文明的天文智慧，促进"内化"阶段的古老连接。',
    cognitiveDensity: 7,
    recommendedStage: 'internalization',
    keywords: ['玛雅', '天文', '智慧', '文明'],
    images: { cover: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '哥斯达黎加·蒙特维德云雾森林',
    country: '哥斯达黎加',
    lat: 10.3000,
    lng: -84.8000,
    symbolicArchetype: 'cloud_forest',
    description: '云雾缭绕的神秘森林，适合"召唤"阶段的冒险探索。',
    cognitiveDensity: 7,
    recommendedStage: 'summon',
    keywords: ['云雾', '森林', '神秘', '生态'],
    images: { cover: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },

  // 大洋洲特色
  {
    id: uuid(),
    name: '巴布亚新几内亚·部落文化',
    country: '巴布亚新几内亚',
    lat: -6.3150,
    lng: 143.9555,
    symbolicArchetype: 'tribe',
    description: '原始部落的传统仪式，带来"转化"阶段的文化冲击。',
    cognitiveDensity: 9,
    recommendedStage: 'transformation',
    keywords: ['部落', '原始', '仪式', '文化'],
    images: { cover: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '瓦努阿图·活火山观测',
    country: '瓦努阿图',
    lat: -17.5250,
    lng: 168.3500,
    symbolicArchetype: 'volcano',
    description: '近距离观测活火山喷发，激发"觉醒"阶段的自然敬畏。',
    cognitiveDensity: 9,
    recommendedStage: 'awakening',
    keywords: ['火山', '喷发', '自然力', '敬畏'],
    images: { cover: 'https://images.unsplash.com/photo-1507501336603-6e31db2be093?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },

  // 特殊地区
  {
    id: uuid(),
    name: '西藏·纳木错圣湖朝拜',
    country: '中国',
    lat: 30.7000,
    lng: 90.5000,
    symbolicArchetype: 'holy_lake',
    description: '世界海拔最高圣湖的朝圣，促进"内化"阶段的灵性连接。',
    cognitiveDensity: 9,
    recommendedStage: 'internalization',
    keywords: ['圣湖', '海拔', '朝圣', '纯净'],
    images: { cover: 'https://images.unsplash.com/photo-154533086-6c6c6f8f2b2d?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '俄罗斯·贝加尔湖蓝冰',
    country: '俄罗斯',
    lat: 53.5000,
    lng: 108.0000,
    symbolicArchetype: 'blue_ice',
    description: '世界最深湖泊的冬季蓝冰，带来"映照"阶段的极致美感。',
    cognitiveDensity: 8,
    recommendedStage: 'reflection',
    keywords: ['蓝冰', '冬季', '深邃', '纯净'],
    images: { cover: 'https://images.unsplash.com/photo-1584556818262-12cbb5ad0c51?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
, 

// 继续添加更多独特目的地
  // 岛屿天堂
  {
    id: uuid(),
    name: '塞舌尔·花岗岩海滩',
    country: '塞舌尔',
    lat: -4.6191,
    lng: 55.4515,
    symbolicArchetype: 'granite',
    description: '独特花岗岩地貌的海滩，适合"内化"阶段的独特体验。',
    cognitiveDensity: 6,
    recommendedStage: 'internalization',
    keywords: ['花岗岩', '独特', '海滩', '平衡'],
    images: { cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '毛里求斯·七色土奇观',
    country: '毛里求斯',
    lat: -20.4044,
    lng: 57.4728,
    symbolicArchetype: 'color_earth',
    description: '七彩土壤的自然奇迹，激发"觉醒"阶段的多样性认知。',
    cognitiveDensity: 7,
    recommendedStage: 'awakening',
    keywords: ['七色土', '奇迹', '多样', '自然'],
    images: { cover: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },

  // 文化深度
  {
    id: uuid(),
    name: '伊朗·伊斯法罕皇家广场',
    country: '伊朗',
    lat: 32.6546,
    lng: 51.6670,
    symbolicArchetype: 'persian',
    description: '波斯帝国辉煌遗迹，促进"映照"阶段的文明思考。',
    cognitiveDensity: 8,
    recommendedStage: 'reflection',
    keywords: ['波斯', '皇家', '文明', '辉煌'],
    images: { cover: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '埃塞俄比亚·拉利贝拉岩石教堂',
    country: '埃塞俄比亚',
    lat: 12.0317,
    lng: 39.0419,
    symbolicArchetype: 'rock_church',
    description: '整块岩石雕刻的教堂，象征"转化"阶段的信念力量。',
    cognitiveDensity: 8,
    recommendedStage: 'transformation',
    keywords: ['岩石教堂', '雕刻', '信念', '奇迹'],
    images: { cover: 'https://images.unsplash.com/photo-1553909489-df03aef8e9a3?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '智利·阿塔卡马沙漠天文观测',
    country: '智利',
    lat: -23.5000,
    lng: -70.0000,
    symbolicArchetype: 'observatory',
    description: '世界最干燥沙漠的星空观测，带来"觉醒"阶段的宇宙视角。',
    cognitiveDensity: 9,
    recommendedStage: 'awakening',
    keywords: ['天文', '干燥', '宇宙', '观测'],
    images: { cover: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '美国·死亡谷国家公园',
    country: '美国',
    lat: 36.5054,
    lng: -117.0794,
    symbolicArchetype: 'death_valley',
    description: '北美最低 hottest 点的生存挑战，促进"转化"阶段的韧性培养。',
    cognitiveDensity: 8,
    recommendedStage: 'transformation',
    keywords: ['极端', '炎热', '生存', '挑战'],
    images: { cover: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '俄罗斯·奥伊米亚康极寒体验',
    country: '俄罗斯',
    lat: 63.4648,
    lng: 142.7738,
    symbolicArchetype: 'cold_pole',
    description: '地球最寒冷居住地的极限体验，激发"召唤"阶段的生存意志。',
    cognitiveDensity: 9,
    recommendedStage: 'summon',
    keywords: ['极寒', '极限', '生存', '意志'],
    images: { cover: 'https://images.unsplash.com/photo-1516567723766-4d5b6d972098?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },

  // 文化秘境
  {
    id: uuid(),
    name: '也门·希巴姆泥砖古城',
    country: '也门',
    lat: 15.9272,
    lng: 48.6264,
    symbolicArchetype: 'mud_skyscraper',
    description: '沙漠中的"曼哈顿"，古老泥砖建筑的智慧，适合"映照"阶段。',
    cognitiveDensity: 8,
    recommendedStage: 'reflection',
    keywords: ['泥砖', '古城', '智慧', '沙漠'],
    images: { cover: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '马里·杰内大清真寺',
    country: '马里',
    lat: 13.9050,
    lng: -4.5550,
    symbolicArchetype: 'mud_mosque',
    description: '世界最大泥砖建筑的年复一年重建，象征"内化"阶段的持续修行。',
    cognitiveDensity: 7,
    recommendedStage: 'internalization',
    keywords: ['泥砖', '清真寺', '重建', '持续'],
    images: { cover: 'https://images.unsplash.com/photo-1553909489-df03aef8e9a3?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '印度·克久拉霍性庙',
    country: '印度',
    lat: 24.8529,
    lng: 79.9226,
    symbolicArchetype: 'kama_sutra',
    description: '古老性爱雕塑的艺术表达，带来"觉醒"阶段的生命认知。',
    cognitiveDensity: 8,
    recommendedStage: 'awakening',
    keywords: ['性庙', '艺术', '生命', '表达'],
    images: { cover: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },

  // 自然奇观
  {
    id: uuid(),
    name: '委内瑞拉·安赫尔瀑布',
    country: '委内瑞拉',
    lat: 5.9700,
    lng: -62.5364,
    symbolicArchetype: 'angel_falls',
    description: '世界最高瀑布的壮观景象，激发"召唤"阶段的向上力量。',
    cognitiveDensity: 8,
    recommendedStage: 'summon',
    keywords: ['最高瀑布', '壮观', '向上', '力量'],
    images: { cover: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '中国·张掖丹霞地貌',
    country: '中国',
    lat: 38.9150,
    lng: 100.1300,
    symbolicArchetype: 'rainbow_mountains',
    description: '七彩山脉的自然调色板，促进"映照"阶段的色彩感知。',
    cognitiveDensity: 7,
    recommendedStage: 'reflection',
    keywords: ['丹霞', '七彩', '色彩', '自然'],
    images: { cover: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '菲律宾·巧克力山',
    country: '菲律宾',
    lat: 9.8333,
    lng: 124.1667,
    symbolicArchetype: 'chocolate_hills',
    description: '千座圆锥形山的奇特景观，带来"内化"阶段的规律感受。',
    cognitiveDensity: 6,
    recommendedStage: 'internalization',
    keywords: ['巧克力山', '奇特', '规律', '几何'],
    images: { cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },

  // 宗教灵性
  {
    id: uuid(),
    name: '沙特阿拉伯·麦加朝觐',
    country: '沙特阿拉伯',
    lat: 21.4225,
    lng: 39.8262,
    symbolicArchetype: 'kaaba',
    description: '伊斯兰教最大规模的朝圣，象征"转化"阶段的信仰力量。',
    cognitiveDensity: 10,
    recommendedStage: 'transformation',
    keywords: ['麦加', '朝觐', '信仰', '团结'],
    images: { cover: 'https://images.unsplash.com/photo-1553909489-df03aef8e9a3?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '以色列·耶路撒冷哭墙',
    country: '以色列',
    lat: 31.7767,
    lng: 35.2345,
    symbolicArchetype: 'wailing_wall',
    description: '千年历史的祈祷之墙，促进"内化"阶段的情感释放。',
    cognitiveDensity: 9,
    recommendedStage: 'internalization',
    keywords: ['哭墙', '祈祷', '历史', '情感'],
    images: { cover: 'https://images.unsplash.com/photo-1584556818262-12cbb5ad0c51?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },

  // 冒险体验
  {
    id: uuid(),
    name: '新西兰·皇后镇蹦极',
    country: '新西兰',
    lat: -45.0312,
    lng: 168.6626,
    symbolicArchetype: 'bungee',
    description: '世界蹦极发源地的极限跳跃，激发"召唤"阶段的勇气释放。',
    cognitiveDensity: 8,
    recommendedStage: 'summon',
    keywords: ['蹦极', '极限', '勇气', '释放'],
    images: { cover: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '瑞士·阿尔卑斯山滑翔伞',
    country: '瑞士',
    lat: 46.5197,
    lng: 6.6322,
    symbolicArchetype: 'paragliding',
    description: '雪山之间的自由飞翔，带来"觉醒"阶段的解放感受。',
    cognitiveDensity: 7,
    recommendedStage: 'awakening',
    keywords: ['滑翔伞', '自由', '飞翔', '雪山'],
    images: { cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },

  // 水下世界
  {
    id: uuid(),
    name: '埃及·红海潜水',
    country: '埃及',
    lat: 27.0000,
    lng: 33.0000,
    symbolicArchetype: 'red_sea',
    description: '世界最佳潜水地的珊瑚花园，促进"映照"阶段的海洋连接。',
    cognitiveDensity: 7,
    recommendedStage: 'reflection',
    keywords: ['红海', '潜水', '珊瑚', '海洋'],
    images: { cover: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '帕劳·水母湖浮游',
    country: '帕劳',
    lat: 7.1619,
    lng: 134.2969,
    symbolicArchetype: 'jellyfish',
    description: '与无毒水母共游的奇妙体验，带来"内化"阶段的温柔连接。',
    cognitiveDensity: 6,
    recommendedStage: 'internalization',
    keywords: ['水母', '共游', '温柔', '奇妙'],
    images: { cover: 'https://images.unsplash.com/photo-1516496636080-14fb876e029d?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
, 

// 特殊文化体验
  // 土著文化
  {
    id: uuid(),
    name: '澳大利亚·乌鲁鲁原住民仪式',
    country: '澳大利亚',
    lat: -25.3444,
    lng: 131.0369,
    symbolicArchetype: 'dreamtime',
    description: '原住民梦幻时代的传统仪式，促进"觉醒"阶段的古老智慧连接。',
    cognitiveDensity: 8,
    recommendedStage: 'awakening',
    keywords: ['原住民', '梦幻时代', '仪式', '智慧'],
    images: { cover: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '加拿大·因纽特狗拉雪橇',
    country: '加拿大',
    lat: 64.8259,
    lng: -63.4933,
    symbolicArchetype: 'dog_sled',
    description: '北极圈内的传统交通方式，带来"内化"阶段的简单生活体验。',
    cognitiveDensity: 7,
    recommendedStage: 'internalization',
    keywords: ['因纽特', '雪橇', '传统', '简单'],
    images: { cover: 'https://images.unsplash.com/photo-1516567723766-4d5b6d972098?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },

  // 节日庆典
  {
    id: uuid(),
    name: '巴西·里约狂欢节',
    country: '巴西',
    lat: -22.9068,
    lng: -43.1729,
    symbolicArchetype: 'carnival',
    description: '世界最大狂欢节的激情释放，激发"召唤"阶段的生命热情。',
    cognitiveDensity: 8,
    recommendedStage: 'summon',
    keywords: ['狂欢节', '激情', '舞蹈', '释放'],
    images: { cover: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '泰国·清迈水灯节',
    country: '泰国',
    lat: 18.7883,
    lng: 98.9853,
    symbolicArchetype: 'lantern',
    description: '万千天灯升空的祈福仪式，象征"转化"阶段的希望寄托。',
    cognitiveDensity: 7,
    recommendedStage: 'transformation',
    keywords: ['水灯节', '天灯', '祈福', '希望'],
    images: { cover: 'https://images.unsplash.com/photo-1505993597083-3bd19fb75e57?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },

  // 修行体验
  {
    id: uuid(),
    name: '印度·瑞诗凯诗瑜伽修行',
    country: '印度',
    lat: 30.1072,
    lng: 78.2975,
    symbolicArchetype: 'yoga',
    description: '世界瑜伽之都的深度修行，促进"内化"阶段的身心平衡。',
    cognitiveDensity: 7,
    recommendedStage: 'internalization',
    keywords: ['瑜伽', '修行', '平衡', '身心'],
    images: { cover: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '日本·高野山佛教修行',
    country: '日本',
    lat: 34.2129,
    lng: 135.5860,
    symbolicArchetype: 'buddhist',
    description: '千年佛教圣地的僧院住宿，带来"映照"阶段的禅意体验。',
    cognitiveDensity: 8,
    recommendedStage: 'reflection',
    keywords: ['高野山', '佛教', '禅修', '僧院'],
    images: { cover: 'https://images.unsplash.com/photo-1553909489-df03aef8e9a3?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },

  // 艺术创作
  {
    id: uuid(),
    name: '意大利·佛罗伦萨艺术沉浸',
    country: '意大利',
    lat: 43.7696,
    lng: 11.2558,
    symbolicArchetype: 'renaissance',
    description: '文艺复兴之都的艺术熏陶，激发"觉醒"阶段的创造力。',
    cognitiveDensity: 7,
    recommendedStage: 'awakening',
    keywords: ['文艺复兴', '艺术', '创作', '美'],
    images: { cover: 'https://images.unsplash.com/photo-1499602211854-122b55ef5c6a?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: uuid(),
    name: '法国·巴黎左岸文学咖啡馆',
    country: '法国',
    lat: 48.8566,
    lng: 2.3522,
    symbolicArchetype: 'literature',
    description: '海明威、萨特曾驻足的文学圣地，促进"内化"阶段的思考深度。',
    cognitiveDensity: 6,
    recommendedStage: 'internalization',
    keywords: ['文学', '咖啡馆', '思考', '创作'],
    images: { cover: 'https://images.unsplash.com/photo-1508424759085-6b2b3b3b3b3b?w=1200', gallery: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  // ---------- Urban Mindful Destinations ----------
{
  id: uuid(),
  name: '日本·东京中目黑慢行桥',
  country: '日本',
  lat: 35.641,
  lng: 139.699,
  symbolicArchetype: 'bridge',
  description: '城市的喧哗被水声切割，桥下的回响教人重新感受节奏。',
  cognitiveDensity: 5,
  recommendedStage: 'reflection',
  keywords: ['水声', '慢行', '节奏', '镜面'],
  images: { cover: 'https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=1200', gallery: [] },
  createdAt: nowIso(),
  updatedAt: nowIso(),
},
{
  id: uuid(),
  name: '法国·巴黎圣马丁运河晨光角落',
  country: '法国',
  lat: 48.871,
  lng: 2.365,
  symbolicArchetype: 'light',
  description: '水面反光与老建筑的交错，让人思考“现代的静默”。',
  cognitiveDensity: 6,
  recommendedStage: 'summon',
  keywords: ['晨光', '倒影', '静默', '老城区'],
  images: { cover: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=1200', gallery: [] },
  createdAt: nowIso(),
  updatedAt: nowIso(),
},
{
  id: uuid(),
  name: '中国·成都宽窄巷隐茶阁',
  country: '中国',
  lat: 30.666,
  lng: 104.062,
  symbolicArchetype: 'tea',
  description: '一盏清茶，一段留白，适合“内化”阶段的安静练习。',
  cognitiveDensity: 6,
  recommendedStage: 'internalization',
  keywords: ['茶', '呼吸', '留白', '安静'],
  images: { cover: 'https://images.unsplash.com/photo-1553184118-1e96d9a0b239?w=1200', gallery: [] },
  createdAt: nowIso(),
  updatedAt: nowIso(),
},
{
  id: uuid(),
  name: '葡萄牙·里斯本屋顶花园图书馆',
  country: '葡萄牙',
  lat: 38.716,
  lng: -9.139,
  symbolicArchetype: 'garden',
  description: '阅读与风共存的地方，象征“知识的呼吸”。',
  cognitiveDensity: 7,
  recommendedStage: 'reflection',
  keywords: ['书', '风', '屋顶', '思考'],
  images: { cover: 'https://images.unsplash.com/photo-1473187983305-f615310e7daa?w=1200', gallery: [] },
  createdAt: nowIso(),
  updatedAt: nowIso(),
},
{
  id: uuid(),
  name: '德国·柏林旧厂艺术仓库',
  country: '德国',
  lat: 52.52,
  lng: 13.405,
  symbolicArchetype: 'metal',
  description: '废墟与创作并存，提醒我们“重生不是重建”。',
  cognitiveDensity: 8,
  recommendedStage: 'awakening',
  keywords: ['废墟', '艺术', '重生', '声音'],
  images: { cover: 'https://images.unsplash.com/photo-1532960402370-7e5d1b7b8b73?w=1200', gallery: [] },
  createdAt: nowIso(),
  updatedAt: nowIso(),
},
{
  id: uuid(),
  name: '西班牙·巴塞罗那旧港长椅',
  country: '西班牙',
  lat: 41.378,
  lng: 2.185,
  symbolicArchetype: 'seat',
  description: '海风与人声混合的界面，是“映照”阶段的真实课堂。',
  cognitiveDensity: 5,
  recommendedStage: 'reflection',
  keywords: ['海风', '停顿', '人群', '呼吸'],
  images: { cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200', gallery: [] },
  createdAt: nowIso(),
  updatedAt: nowIso(),
},
{
  id: uuid(),
  name: '韩国·首尔汉江夜跑线',
  country: '韩国',
  lat: 37.55,
  lng: 126.98,
  symbolicArchetype: 'flow',
  description: '城市仍在流动，你的脚步是与之对话的方式。',
  cognitiveDensity: 7,
  recommendedStage: 'transformation',
  keywords: ['流动', '身体', '节奏', '夜'],
  images: { cover: 'https://images.unsplash.com/photo-1506812574058-fc75fa93fead?w=1200', gallery: [] },
  createdAt: nowIso(),
  updatedAt: nowIso(),
},
{
  id: uuid(),
  name: '意大利·米兰隐巷壁画院落',
  country: '意大利',
  lat: 45.464,
  lng: 9.19,
  symbolicArchetype: 'color',
  description: '艺术藏于平凡墙面，提醒人“觉醒常在日常”。',
  cognitiveDensity: 5,
  recommendedStage: 'awakening',
  keywords: ['街头艺术', '色彩', '日常', '觉醒'],
  images: { cover: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=1200', gallery: [] },
  createdAt: nowIso(),
  updatedAt: nowIso(),
},
{
  id: uuid(),
  name: '土耳其·伊斯坦布尔加拉塔塔顶风台',
  country: '土耳其',
  lat: 41.025,
  lng: 28.974,
  symbolicArchetype: 'wind',
  description: '俯瞰两洲交汇的风口，适合“转化”与放下控制的练习。',
  cognitiveDensity: 8,
  recommendedStage: 'transformation',
  keywords: ['风', '俯瞰', '交汇', '释放'],
  images: { cover: 'https://images.unsplash.com/photo-1522431231321-9b76f7ebcfaa?w=1200', gallery: [] },
  createdAt: nowIso(),
  updatedAt: nowIso(),
},
{
  id: uuid(),
  name: '加拿大·蒙特利尔旧书巷',
  country: '加拿大',
  lat: 45.501,
  lng: -73.567,
  symbolicArchetype: 'memory',
  description: '尘封书页的气味让人记起“过去也是一种呼吸”。',
  cognitiveDensity: 6,
  recommendedStage: 'internalization',
  keywords: ['书页', '气味', '记忆', '留痕'],
  images: { cover: 'https://images.unsplash.com/photo-1473187983305-f615310e7daa?w=1200', gallery: [] },
  createdAt: nowIso(),
  updatedAt: nowIso(),
},


  ],
  triggers: [],
  reflections: [],
}

// ---------- In-memory Store ----------
let db: DbShape = loadFromStorage() ?? seed

export function verifyDb(): { ok: true } | { ok: false; reason: string } {
  if (!isDbShape(db)) return { ok: false, reason: 'shape_invalid' }
  for (const d of db.destinations) if (!validateDestination(d)) return { ok: false, reason: 'destination_invalid' }
  for (const t of db.triggers) if (!validateTrigger(t)) return { ok: false, reason: 'trigger_invalid' }
  for (const r of db.reflections) if (!validateReflection(r)) return { ok: false, reason: 'reflection_invalid' }
  return { ok: true }
}

// ---------- Query APIs ----------
export function listDestinations(params?: { country?: string; stage?: InspirationStage; keyword?: string }): Destination[] {
  let list = [...db.destinations]
  // 1) 删除认知密度 < 7 的目的地（仅当有显式数值时才过滤）
  list = list.filter(d => (typeof d.cognitiveDensity === 'number' ? d.cognitiveDensity >= 7 : true))
  if (params?.country) list = list.filter(d => d.country === params.country)
  if (params?.stage) list = list.filter(d => d.recommendedStage === params.stage)
  if (params?.keyword) list = list.filter(d => (d.keywords ?? []).some(k => k.includes(params.keyword!)))
  // 2) 为认知密度 > 7 的目的地自动打上意图标签
  return list.map(d => {
    const density = typeof d.cognitiveDensity === 'number' ? d.cognitiveDensity : undefined
    if (density != null && density > 7) {
      const tags = inferIntentTags(d)
      return { ...d, intentTags: tags }
    }
    return d
  })
}

export function getDestination(id: string): Destination | undefined {
  return db.destinations.find(d => d.id === id)
}

export function listTriggers(destinationId: string): PsychologicalTrigger[] {
  return db.triggers.filter(t => t.destinationId === destinationId)
}

export function listReflections(userId: string): UserReflection[] {
  return db.reflections.filter(r => r.userId === userId)
}

// ---------- Mutations ----------
export function addDestination(input: Omit<Destination, 'id' | 'createdAt' | 'updatedAt'>): Destination {
  const item: Destination = { ...input, id: uuid(), createdAt: nowIso(), updatedAt: nowIso() }
  if (!validateDestination(item)) throw new Error('invalid_destination')
  db.destinations.push(item)
  saveToStorage(db)
  return item
}

export function addTrigger(input: Omit<PsychologicalTrigger, 'id' | 'createdAt'>): PsychologicalTrigger {
  const item: PsychologicalTrigger = { ...input, id: uuid(), createdAt: nowIso() }
  if (!validateTrigger(item)) throw new Error('invalid_trigger')
  db.triggers.push(item)
  saveToStorage(db)
  return item
}

export function addReflection(input: Omit<UserReflection, 'id' | 'createdAt'>): UserReflection {
  const item: UserReflection = { ...input, id: uuid(), createdAt: nowIso() }
  if (!validateReflection(item)) throw new Error('invalid_reflection')
  db.reflections.push(item)
  saveToStorage(db)
  return item
}

// Utility to reset to seed during development
export function resetToSeed(): void {
  db = JSON.parse(JSON.stringify(seed))
  saveToStorage(db)
}

export function _getDbSnapshot(): DbShape {
  // for debugging / tests
  return JSON.parse(JSON.stringify(db))
}


// ---------- Intent Tagging Heuristics ----------
function inferIntentTags(d: Destination): Destination['intentTags'] {
  const text = `${(d.keywords || []).join(' ')} ${d.symbolicArchetype || ''} ${d.description || ''}`.toLowerCase()
  const zh = `${(d.keywords || []).join(' ')} ${d.symbolicArchetype || ''} ${d.description || ''}`

  const has = (arr: string[]) => arr.some(k => text.includes(k) || zh.includes(k))

  const tags: Set<NonNullable<Destination['intentTags']>[number]> = new Set()

  // emotional_healing / mind_healing（疗愈/静心/慢节奏/自然陪伴）
  if (
    has(['疗愈', '静', '冥想', '内化', '平静', '宁静', '安静', '治愈', 'healing', 'calm', 'serene', 'meditation']) ||
    has(['lake', 'forest', 'holy_lake', 'spring', 'tea_train', 'island', 'holy', 'temple']) ||
    has(['湖', '森', '圣湖', '泉', '茶园', '海风'])
  ) {
    tags.add('emotional_healing')
    tags.add('mind_healing')
  }

  // extreme_exploration（挑战/攀登/极限环境/突破自我）
  if (
    has(['summit', 'mountain', 'volcano', 'desert', 'glacier', 'iceberg']) ||
    has(['攀登', '挑战', '极限', '高原', '峰', '火山', '沙漠', '冰川', '雪山'])
  ) {
    tags.add('extreme_exploration')
  }

  // cultural_exchange（人文/传统/仪式/在地交流）
  if (
    has(['ritual', 'ceremony', 'temple', 'pagoda', 'persian', 'tribe', 'bedouin', 'rock_church', 'silkroad']) ||
    has(['仪式', '传统', '寺庙', '佛塔', '波斯', '部落', '贝都因', '岩石教堂', '丝绸之路', '朝圣', '人文'])
  ) {
    tags.add('cultural_exchange')
  }

  // photography_exploration（光影/风景/取景地/拍摄主题）
  if (
    has(['photography', 'photo', 'aurora', 'mirror', 'cliff', 'karst', 'blue_ice', 'light']) ||
    has(['摄影', '光影', '极光', '镜像', '悬崖', '喀斯特', '蓝冰', '取景'])
  ) {
    tags.add('photography_exploration')
  }

  // urban_creation（城市/建筑/街区/创作与观察）
  if (
    has(['city', 'urban', 'architecture', 'bridge', 'seat', 'flow', 'color']) ||
    has(['城市', '建筑', '街头', '桥', '长椅', '流动', '色彩'])
  ) {
    tags.add('urban_creation')
  }

  return Array.from(tags)
}
