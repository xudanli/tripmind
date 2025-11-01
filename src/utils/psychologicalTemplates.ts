/**
 * 心理旅程模板库
 * 基于 M-E-R-S-N 五维人格向量匹配对应的心理旅程模板
 */

export interface PsychologicalTemplate {
  templateName: string
  psychologicalFlow: string[]
  symbolicElements: string[]
  recommendedRhythm: string
  socialMode: string
  coreInsight: string
  matchConditions: {
    motivation?: string[]
    emotion?: string[]
    rhythm?: string[]
    social?: string[]
    need?: string[]
  }
}

export const psychologicalTemplates: PsychologicalTemplate[] = [
  {
    templateName: '救赎型',
    psychologicalFlow: ['召唤', '释放', '共燃', '沉淀', '转化'],
    symbolicElements: ['火', '雨', '夜路'],
    recommendedRhythm: '中速流动+夜晚爆发',
    socialMode: '结伴共燃',
    coreInsight: '只有燃烧过的夜，才能照亮回程。',
    matchConditions: {
      motivation: ['救赎'],
      emotion: ['倦怠'],
      rhythm: ['中速流动'],
      social: ['一两位挚友', '一小群陌生人']
    }
  },
  {
    templateName: '觉醒型',
    psychologicalFlow: ['召唤', '体验', '顿悟', '整合', '行动'],
    symbolicElements: ['光', '镜', '水面'],
    recommendedRhythm: '快节奏探索',
    socialMode: '独行或小群探索',
    coreInsight: '未知的边界，是自我的映射。',
    matchConditions: {
      motivation: ['探索'],
      emotion: ['好奇'],
      rhythm: ['快节奏探索']
    }
  },
  {
    templateName: '重逢型',
    psychologicalFlow: ['召唤', '回忆', '对话', '宽恕', '合一'],
    symbolicElements: ['桥', '信', '海'],
    recommendedRhythm: '中速流动',
    socialMode: '一两位挚友或独行',
    coreInsight: '分离的彼岸，总有重逢的桥。',
    matchConditions: {
      motivation: ['重逢'],
      social: ['一两位挚友', '独行'],
      emotion: ['孤独']
    }
  },
  {
    templateName: '超越型',
    psychologicalFlow: ['召唤', '挑战', '突破', '平衡', '新生'],
    symbolicElements: ['山', '风', '天空'],
    recommendedRhythm: '中速流动或快节奏探索',
    socialMode: '灵活（独行或结伴）',
    coreInsight: '限制是虚构的墙，自由在风之上。',
    matchConditions: {
      motivation: ['重启'],
      emotion: ['焦虑', '兴奋'],
      need: ['转化']
    }
  }
]

/**
 * 计算五维人格向量
 */
export interface PersonalityVector {
  M: string  // Motivation (动机)
  E: string  // Emotion (情绪)
  R: string  // Rhythm (节奏)
  S: string  // Social (社交)
  N: string  // Need (需求)
}

export function calculatePersonalityVector(profile: {
  motivation: string
  motivation_detail: string
  dominant_emotion: string
  desired_emotion: string
  travel_rhythm: string
  activity_density: string
  social_preference: string
  social_intensity: number
  cognitive_need: string
  post_journey_goal: string
}): PersonalityVector {
  return {
    M: profile.motivation,  // 主值
    E: profile.dominant_emotion,  // 主值
    R: profile.travel_rhythm,  // 主值
    S: profile.social_preference,  // 主值
    N: profile.cognitive_need  // 主值
  }
}

/**
 * 匹配心理旅程模板（使用权重计算相似度）
 * 权重：M 30%、E 25%、R 20%、S 15%、N 10%
 */
export function matchPsychologicalTemplate(
  vector: PersonalityVector,
  profile: {
    motivation_detail: string
    desired_emotion: string
    activity_density: string
    social_intensity: number
    post_journey_goal: string
  }
): { template: PsychologicalTemplate; score: number; matchDetails: any } {
  // 权重配置
  const weights = {
    M: 0.30,  // 动机 30%
    E: 0.25,  // 情绪 25%
    R: 0.20,  // 节奏 20%
    S: 0.15,  // 社交 15%
    N: 0.10   // 需求 10%
  }
  
  // 计算每个模板的匹配分数
  const scores = psychologicalTemplates.map(template => {
    let totalScore = 0
    const matchDetails: any = {
      M: 0,
      E: 0,
      R: 0,
      S: 0,
      N: 0
    }
    
    // M: 动机匹配（30%）
    if (template.matchConditions.motivation?.includes(vector.M)) {
      matchDetails.M = 1
      totalScore += weights.M * 100
    }
    
    // E: 情绪匹配（25%）
    if (template.matchConditions.emotion?.includes(vector.E)) {
      matchDetails.E = 1
      totalScore += weights.E * 100
    }
    
    // R: 节奏匹配（20%）
    if (template.matchConditions.rhythm?.includes(vector.R)) {
      matchDetails.R = 1
      totalScore += weights.R * 100
    }
    
    // S: 社交匹配（15%）
    if (template.matchConditions.social?.includes(vector.S)) {
      matchDetails.S = 1
      totalScore += weights.S * 100
    }
    
    // N: 需求匹配（10%）
    if (template.matchConditions.need?.includes(vector.N)) {
      matchDetails.N = 1
      totalScore += weights.N * 100
    }
    
    return { 
      template, 
      score: totalScore,
      matchDetails,
      matchedDimensions: Object.values(matchDetails).filter(v => v === 1).length
    }
  })
  
  // 选择得分最高的模板
  scores.sort((a, b) => {
    // 优先按总分排序，如果总分相同，按匹配维度数排序
    if (Math.abs(a.score - b.score) < 0.01) {
      return b.matchedDimensions - a.matchedDimensions
    }
    return b.score - a.score
  })
  
  const bestMatch = scores[0]
  
  // 确保 bestMatch 存在
  if (!bestMatch || scores.length === 0) {
    const defaultTemplate = psychologicalTemplates[0]
    if (!defaultTemplate) {
      throw new Error('心理旅程模板库为空')
    }
    console.warn('⚠️ 未找到匹配模板，使用默认模板')
    return {
      template: defaultTemplate,
      score: 0,
      matchDetails: {}
    }
  }
  
  console.log('📊 模板匹配结果:', {
    selected: bestMatch.template.templateName,
    score: bestMatch.score.toFixed(2),
    matchDetails: bestMatch.matchDetails,
    allScores: scores.map(s => ({
      name: s.template.templateName,
      score: s.score.toFixed(2),
      dimensions: s.matchedDimensions
    }))
  })
  
  // 如果最高分太低，使用默认模板（觉醒型）
  if (bestMatch.score < 20) {
    const defaultTemplate = psychologicalTemplates.find(t => t.templateName === '觉醒型') || psychologicalTemplates[1]
    if (!defaultTemplate) {
      const fallbackTemplate = psychologicalTemplates[0]
      if (!fallbackTemplate) {
        throw new Error('心理旅程模板库为空')
      }
      return {
        template: fallbackTemplate,
        score: 0,
        matchDetails: {}
      }
    }
    console.warn('⚠️ 匹配分数过低，使用默认模板')
    return {
      template: defaultTemplate,
      score: 0,
      matchDetails: {}
    }
  }
  
  return {
    template: bestMatch.template,
    score: bestMatch.score,
    matchDetails: bestMatch.matchDetails
  }
}

/**
 * 生成内部轨道（心理旅程任务）
 */
export function generateInternalTrack(
  template: PsychologicalTemplate,
  vector: PersonalityVector,
  profile: {
    motivation_detail: string
    desired_emotion: string
    activity_density: string
    social_intensity: number
    post_journey_goal: string
  }
): Array<{
  stage: string
  question?: string
  ritual?: string
  action?: string
  reflection?: string
}> {
  const internalTrack = template.psychologicalFlow.map((stage, index) => {
    const baseItem: any = { stage }
    
    // 根据阶段和模板生成对应的任务
    switch (stage) {
      case '召唤':
        baseItem.question = `什么在召唤我踏上这段旅程？`
        baseItem.ritual = '在出发前写下三个期待'
        break
      case '释放':
      case '体验':
      case '回忆':
      case '挑战':
        baseItem.question = template.templateName === '救赎型' 
          ? `我需要从哪些负担中被解放？`
          : template.templateName === '觉醒型'
          ? `此刻我在体验什么？它如何映射我的内在？`
          : template.templateName === '重逢型'
          ? `我想与谁或什么重新连接？`
          : `什么限制了我？我如何突破？`
        baseItem.ritual = template.symbolicElements[0] 
          ? `象征仪式：与${template.symbolicElements[0]}对话`
          : '写下并释放'
        break
      case '共燃':
      case '顿悟':
      case '对话':
      case '突破':
        baseItem.question = `与他人/自己的连接带来了什么？`
        baseItem.reflection = '记录三个关键时刻的感受'
        break
      case '沉淀':
      case '整合':
      case '宽恕':
      case '平衡':
        baseItem.question = `我需要让什么沉淀下来？`
        baseItem.action = '找一个安静时刻，写下领悟'
        break
      case '转化':
      case '行动':
      case '合一':
      case '新生':
        baseItem.question = `我能带回哪一点光？`
        baseItem.action = `制定返程后的一项微行动：${profile.post_journey_goal}`
        baseItem.ritual = '在旅程结束时完成一个象征仪式'
        break
    }
    
    return baseItem
  })
  
  return internalTrack
}

/**
 * 生成外部轨道（实际行程活动）
 */
export async function generateExternalTrack(
  template: PsychologicalTemplate,
  vector: PersonalityVector,
  profile: {
    motivation_detail: string
    desired_emotion: string
    activity_density: string
    social_intensity: number
    post_journey_goal: string
  },
  itineraryData?: any
): Promise<Array<{
  time: string
  activity: string
  location: string
  type: string
  budget?: number
  notes?: string
}>> {
  // 如果已有行程数据，从中提取外部轨道
  if (itineraryData?.days) {
    const externalTrack: any[] = []
    
    itineraryData.days.forEach((day: any) => {
      if (day.timeSlots) {
        day.timeSlots.forEach((slot: any) => {
          externalTrack.push({
            time: slot.time,
            activity: slot.title || slot.activity,
            location: slot.location,
            type: slot.type || slot.category,
            budget: slot.cost,
            notes: slot.notes
          })
        })
      }
    })
    
    return externalTrack
  }
  
  // 如果没有行程数据，返回基于模板的示例结构
  const rhythmMap: Record<string, number> = {
    '快节奏探索': 4,
    '中速流动': 3,
    '慢速沉浸': 2
  }
  
  const activityCount = rhythmMap[vector.R] || 3
  
  // 从目的地数据库抽样（需要后续实现）
  const sampleActivities = [
    { time: '09:00', activity: '雨后海边步行', location: '青岛海岸', type: 'attraction' },
    { time: '19:30', activity: '夜火共谈', location: '山顶营地', type: 'community' }
  ]
  
  return sampleActivities.slice(0, activityCount)
}

/**
 * 生成双轨 JSON 结构（完整版）
 */
export async function generateDualTrackJSON(
  template: PsychologicalTemplate,
  vector: PersonalityVector,
  profile: {
    motivation_detail: string
    desired_emotion: string
    activity_density: string
    social_intensity: number
    post_journey_goal: string
  },
  itineraryData?: any
) {
  // 生成内部轨道
  const internalTrack = generateInternalTrack(template, vector, profile)
  
  // 生成外部轨道
  const externalTrack = await generateExternalTrack(template, vector, profile, itineraryData)
  
  // 构建完整的人格画像
  const personaProfile = {
    type: template.templateName,
    motivation: vector.M,
    motivation_detail: profile.motivation_detail,
    dominantEmotion: vector.E,
    desiredEmotion: profile.desired_emotion,
    travelRhythm: vector.R,
    activityDensity: profile.activity_density,
    socialPreference: vector.S,
    socialIntensity: profile.social_intensity,
    cognitiveNeed: vector.N,
    postJourneyGoal: profile.post_journey_goal
  }
  
  // 构建旅程设计
  const journeyDesign = {
    title: itineraryData?.title || `${template.templateName}之旅`,
    coreInsight: template.coreInsight,
    psychologicalFlow: template.psychologicalFlow,
    symbolicElements: template.symbolicElements,
    recommendedRhythm: template.recommendedRhythm,
    socialMode: template.socialMode,
    dualTracks: {
      external: externalTrack,
      internal: internalTrack
    }
  }
  
  return {
    personaProfile,
    journeyDesign,
    // 保留原有结构以兼容
    psychologicalJourney: {
      templateName: template.templateName,
      personalityVector: vector,
      psychologicalFlow: template.psychologicalFlow,
      symbolicElements: template.symbolicElements,
      recommendedRhythm: template.recommendedRhythm,
      socialMode: template.socialMode,
      coreInsight: template.coreInsight,
      profile: profile
    },
    itinerary: itineraryData || null
  }
}

