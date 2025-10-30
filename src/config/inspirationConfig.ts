/**
 * 灵感模式配置文件
 * 用于存储临时模板数据，待后续集成AI生成API后逐步替换
 */

// 视觉诗模板（临时方案，待集成AI生成）
export const poetryTemplates = [
  { poetry: "你的这张照片像是风在说：'我也在远行。'", tags: ['光', '孤独', '远行'] },
  { poetry: "时间在这里停止了脚步，留下永恒的温柔。", tags: ['静谧', '温柔', '时光'] },
  { poetry: "每一束光都在诉说一个秘密，等待被发现。", tags: ['光影', '秘密', '发现'] },
  { poetry: "天空与大地在此相遇，诉说着自然的诗篇。", tags: ['自然', '诗篇', '相遇'] },
  { poetry: "这一刻，世界只属于你和这片天地。", tags: ['自在', '天地', '当下'] },
  { poetry: "风带我来到这里，告诉我这里的故事。", tags: ['故事', '风中', '探索'] }
]

// AI反馈模板（临时方案，待集成AI生成）
export const aiFeedbackTemplates = [
  (input: string) => `"${input}"...这句话里有种特别的光。让我为你扩展这个想法。`,
  (input: string) => `我感受到了你文字中的情绪。这里有几种可能的展开方向...`,
  (input: string) => `这个想法很美，像是藏在城市缝隙里的故事。`,
  (input: string) => `我看到了你的灵感雏形，它正在成形...`
]

// AI总结诗模板（临时方案，待集成AI生成）
export const summaryPoemTemplates = {
  emotional_healing: [
    (location: string) => `${location}的宁静在你心中种下了疗愈的种子。`,
    (location: string) => `每一次呼吸都与大地相连，你已找到内心的平静。`,
    (location: string) => `在这里，时间慢了下来，给了你重新认识自己的机会。`
  ],
  mind_healing: [
    (location: string) => `${location}的宁静在你心中种下了疗愈的种子。`,
    (location: string) => `每一次呼吸都与大地相连，你已找到内心的平静。`,
    (location: string) => `在这里，时间慢了下来，给了你重新认识自己的机会。`
  ],
  extreme_exploration: [
    (location: string) => `${location}的挑战在你心中点燃了勇气的火焰。`,
    (location: string) => `每一座山峰都在见证你的突破，你已经超越了自己。`,
    (location: string) => `极限之外，是更广阔的可能性。`
  ],
  photography_exploration: [
    (location: string) => `${location}的光影在你心里种下了自由的影子。`,
    (location: string) => `每一帧都是时间的定格，记录着属于你的视觉诗篇。`,
    (location: string) => `镜头下的世界，藏着无数个未被发现的故事。`
  ],
  default: [
    (location: string) => `${location}的光影在你心里种下了自由的影子。`,
    (location: string) => `这座城市的故事已经融入你的记忆，等待下次相遇。`,
    (location: string) => `每一次旅程都是向内探索的延伸，你已找到属于自己的光。`,
    (location: string) => `灵感在这里生根，未来会在别处开花。`,
    (location: string) => `你的足迹在${location}留下了不可磨灭的印记。`
  ]
}

// 底部AI语句模板（临时方案，待集成AI生成）
export const echoStatementTemplates = {
  photography_exploration: '每一个光影，都是你的自画像。',
  urban_creation: '每一个光影，都是你的自画像。',
  emotional_healing: '你在路上找到的，远不止风景。',
  extreme_exploration: '每一个选择，都在塑造你的故事。',
  default: [
    '每一个光影，都是你的自画像。',
    '你在路上找到的，远不止风景。',
    '灵感是一场没有终点的旅行。',
    '每一个选择，都在塑造你的故事。',
    '时间会记住这一刻，就像你会记住这里。'
  ]
}

// 地点Moodboard映射（临时方案，待改为动态生成）
export const locationMoodMap: Record<string, Array<{icon: string, text: string}>> = {
  '西藏冈仁波齐': [
    { icon: '🏔️', text: '神圣转山' },
    { icon: '⭐', text: '星空冥想' },
    { icon: '☁️', text: '云上行走' }
  ],
  '云南梅里雪山': [
    { icon: '❄️', text: '日照金山' },
    { icon: '🏞️', text: '雨崩徒步' },
    { icon: '♨️', text: '温泉疗愈' }
  ],
  '挪威北极圈': [
    { icon: '🌌', text: '极光追逐' },
    { icon: '🌊', text: '峡湾悬崖' },
    { icon: '☀️', text: '午夜太阳' }
  ],
  '冰岛火山地带': [
    { icon: '🌋', text: '火山探险' },
    { icon: '🧊', text: '冰川徒步' },
    { icon: '💨', text: '地热漂浮' }
  ],
  '秘鲁马丘比丘': [
    { icon: '🏛️', text: '印加古道' },
    { icon: '🌅', text: '古城日出' },
    { icon: '🦅', text: '安第斯鹰' }
  ],
  '新西兰南岛': [
    { icon: '🚁', text: '直升机徒步' },
    { icon: '🪂', text: '跳伞极限' },
    { icon: '🌌', text: '星空疗愈' }
  ],
  '肯尼亚马赛马拉': [
    { icon: '🦁', text: '野生动物' },
    { icon: '🎈', text: '热气球日出' },
    { icon: '👥', text: '部落体验' }
  ],
  '智利阿塔卡马沙漠': [
    { icon: '🌟', text: '星空冥想' },
    { icon: '💧', text: '间歇泉地热' },
    { icon: '☁️', text: '盐湖漂浮' }
  ]
}

// 意图类型Moodboard（临时方案，待改为基于AI结果生成）
export const intentMoodMap: Record<string, Array<{icon: string, text: string}>> = {
  emotional_healing: [
    { icon: '🧘', text: '静心冥想' },
    { icon: '🌊', text: '自然疗愈' },
    { icon: '🌸', text: '内心对话' }
  ],
  mind_healing: [
    { icon: '🧘', text: '静心冥想' },
    { icon: '🌊', text: '自然疗愈' },
    { icon: '🌸', text: '内心对话' }
  ],
  extreme_exploration: [
    { icon: '⛰️', text: '极限挑战' },
    { icon: '💪', text: '自我突破' },
    { icon: '🎯', text: '冒险体验' }
  ],
  cultural_exchange: [
    { icon: '👥', text: '人文交流' },
    { icon: '🏛️', text: '文化探索' },
    { icon: '🌍', text: '世界连接' }
  ],
  photography_exploration: [
    { icon: '📸', text: '光影捕捉' },
    { icon: '🌊', text: '自然光影' },
    { icon: '🎨', text: '创意构图' }
  ]
}

// 关键词到图标的映射（用于动态生成moodboard）
export const keywordIconMap: Record<string, string> = {
  '转山': '🏔️', '朝圣': '🙏', '星空': '⭐', '露营': '⛺',
  '徒步': '🥾', '登山': '⛰️', '观景': '👁️', '冰川': '🧊',
  '极光': '🌌', '温泉': '♨️', '漂浮': '💧', '冥想': '🧘',
  '观鸟': '🦅', '野生动物': '🦁', '海滩': '🏖️', '潜水': '🤿',
  '火山': '🌋', '地热': '💨', '沙漠': '🏜️', '草原': '🌾'
}

// 标签颜色映射
export const tagColorMap: Record<string, string> = {
  '光': 'gold',
  '孤独': 'blue',
  '宁静': 'cyan',
  '远行': 'green',
  '静谧': 'purple',
  '温柔': 'pink',
  '时光': 'orange',
  '光影': 'volcano',
  '秘密': 'magenta',
  '发现': 'lime',
  '自然': 'green',
  '诗篇': 'cyan',
  '相遇': 'blue',
  '自在': 'orange',
  '天地': 'geekblue',
  '当下': 'purple',
  '故事': 'red',
  '风中': 'cyan',
  '探索': 'gold',
  '瞬间': 'cyan',
  '记录': 'blue'
}

// 拼贴风格的标签颜色映射（蓝色/青绿色系）
export const tagColorMapForCollage: Record<string, string> = {
  '光': 'cyan',
  '孤独': 'blue',
  '宁静': 'geekblue',
  '远行': 'cyan',
  '静谧': 'blue',
  '温柔': 'cyan',
  '时光': 'geekblue',
  '光影': 'cyan',
  '秘密': 'blue',
  '发现': 'cyan',
  '自然': 'green',
  '诗篇': 'cyan',
  '相遇': 'blue',
  '自在': 'geekblue',
  '天地': 'cyan',
  '当下': 'blue',
  '故事': 'cyan',
  '风中': 'blue',
  '探索': 'cyan',
  '瞬间': 'cyan',
  '记录': 'blue'
}

// 配色主题
export const colorThemes = [
  { name: '冷光', value: 'cool-light' },
  { name: '暖影', value: 'warm-shadow' },
  { name: '混调', value: 'mixed' }
]

// 环境音URL（待替换为真实资源）
export const soundUrls = {
  morning: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // TODO: 替换为真实环境音
  afternoon: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', // TODO: 替换为真实环境音
  evening: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' // TODO: 替换为真实环境音
}

