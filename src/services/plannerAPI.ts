import { chatWithDeepSeek } from './deepseekAPI'
import type { PlannerFormData } from '@/stores/travel'

export interface PlannerItineraryRequest {
  destination: string
  duration: number
  budget: string
  preferences: string[]
  travelStyle: string
  customRequirements?: string
}

export interface TimeSlot {
  time: string
  activity: string
  location: string
  icon: string
  category: string
  categoryColor: string
  notes?: string
  estimatedDuration: number
  estimatedCost: number
  coordinates?: {
    lat: number
    lng: number
  }
}

export interface DayPlan {
  date: string
  title: string
  description: string
  status: 'planned' | 'in-progress' | 'completed'
  stats: {
    duration: number
    cost: number
  }
  timeSlots: TimeSlot[]
}

export interface PlannerItineraryResponse {
  title: string
  destination: string
  duration: number
  totalCost: number
  summary: string
  days: DayPlan[]
  recommendations: {
    bestTimeToVisit: string
    weatherAdvice: string
    packingTips: string[]
    localTips: string[]
    emergencyContacts: string[]
  }
  aiInsights: {
    optimizationSuggestions: string[]
    alternativeActivities: string[]
    budgetOptimization: string[]
    culturalNotes: string[]
  }
}

class PlannerAPI {
  /**
   * 生成智能行程
   */
  async generateItinerary(request: PlannerItineraryRequest): Promise<PlannerItineraryResponse> {
    try {
      const prompt = this.buildItineraryPrompt(request)
      const response = await chatWithDeepSeek([
        { role: 'user', content: prompt }
      ])
      
      // 解析 AI 响应
      let itineraryData = this.parseItineraryResponse(response, request)
      // 统一保证天数与用户填写一致（若 AI 生成天数不足则补齐占位日）
      itineraryData = this.ensureDuration(itineraryData, request.duration, request.destination)
      // 回填目的地与标题，避免硬编码默认值
      if (!itineraryData.destination || itineraryData.destination === '目的地') {
        itineraryData.destination = request.destination
      }
      if (!itineraryData.title || itineraryData.title === '智能行程规划') {
        itineraryData.title = `${request.destination}行程规划`
      }
      
      return itineraryData
    } catch (error) {
      console.error('生成行程失败:', error)
      throw new Error('AI 行程生成失败，请重试')
    }
  }

  /**
   * 优化现有行程
   */
  async optimizeItinerary(currentItinerary: PlannerItineraryResponse, optimizationType: 'time' | 'cost' | 'route'): Promise<PlannerItineraryResponse> {
    try {
      const prompt = this.buildOptimizationPrompt(currentItinerary, optimizationType)
      const response = await chatWithDeepSeek([
        { role: 'user', content: prompt }
      ])
      
      const optimizedData = this.parseItineraryResponse(response)
      return optimizedData
    } catch (error) {
      console.error('优化行程失败:', error)
      throw new Error('行程优化失败，请重试')
    }
  }

  /**
   * 获取目的地实时信息
   */
  async getDestinationInfo(destination: string): Promise<{
    weather: string
    bestTimeToVisit: string
    localTips: string[]
    emergencyContacts: string[]
  }> {
    try {
      const prompt = `请提供关于目的地"${destination}"的实时信息：
1. 当前天气状况和建议
2. 最佳旅游时间
3. 3-5个实用的当地小贴士
4. 紧急联系方式

请以JSON格式返回，包含weather, bestTimeToVisit, localTips, emergencyContacts字段。`
      
      const response = await chatWithDeepSeek([
        { role: 'user', content: prompt }
      ])
      return JSON.parse(response || '{}')
    } catch (error) {
      console.error('获取目的地信息失败:', error)
      return {
        weather: '请查询当地天气预报',
        bestTimeToVisit: '春秋季节较为适宜',
        localTips: ['注意当地文化习俗', '准备常用药品'],
        emergencyContacts: ['当地报警电话', '中国领事馆电话']
      }
    }
  }

  /**
   * 构建行程生成提示词
   */
  private buildItineraryPrompt(request: PlannerItineraryRequest): string {
    const { destination, duration, budget, preferences, travelStyle, customRequirements } = request
    const days = duration
    const startDate = new Date().toISOString().split('T')[0]
    const preferenceText = preferences.join('、') || '通用偏好'
    const extra = customRequirements && customRequirements.trim() ? `；自定义要求：${customRequirements.trim()}` : ''
    const preferenceGuidance = `预算：${budget}；节奏：${travelStyle}；务必兼顾当地特色体验与休息节奏${extra}`
    const dateInstructions = `建议从 ${startDate} 开始，连续 ${days} 天`

    const prompt = `
你是一名专业旅行规划师与文案设计师，具备旅行地理知识、交通衔接逻辑与创意叙事能力。
请为以下需求生成一份【专业可执行 + 富有叙事感 + 自动衔接交通 + 每日主题】的旅行行程规划书。

---
🗺️ 目的地：${destination}
📆 行程天数：${days}天
💡 用户偏好：${preferenceText}
🎯 偏好具体要求：${preferenceGuidance}
📅 时间指引：${dateInstructions}
---

请严格按照以下JSON结构输出，不要添加额外说明：

{
  "days": [
    {
      "day": 1,
      "date": "${startDate}",
      "theme": "当天主题名称（如‘初遇之光’、‘风与时间的边界’）",
      "mood": "当天氛围关键词（如‘探索’、‘放松’、‘觉醒’）",
      "summary": "以叙事语气总结当日体验（不少于40字）",
      "activities": [
        {
          "time": "09:00",
          "title": "富有画面感与吸引力的活动标题",
          "type": "attraction | meal | hotel | shopping | transport",
          "duration": 120,
          "location": {"lat": 34.9949, "lng": 135.7850},
          "notes": "详细的体验描述，包括景点亮点、文化背景、拍照建议与感受描写。",
          "localTip": "一条实用或文化建议（如‘寺庙禁止拍照，请轻声交谈’或‘最佳观景时间为傍晚6点’）",
          "transport": {
            "mode": "car | walk | train | ferry",
            "from": "上一个活动地点",
            "to": "当前活动地点",
            "duration": 30,
            "notes": "交通方式与建议（如‘自驾沿海公路，风景极佳’）"
          },
          "cost": 400
        }
      ]
    }
  ],
  "totalCost": 8000,
  "summary": "行程整体总结：概括旅行节奏、体验核心、文化亮点与情感线索（不少于100字）"
}

---
重要规则：
1️⃣ 时间与地理逻辑：
- 每日行程应符合地理连续性（同一区域内合理移动，不跳跃）。
- 交通时间自动计算，避免重复返回或长途跨区。
- 各活动之间需有合理休息与用餐安排。

2️⃣ 标题与内容创意：
- 活动标题必须生动、有画面感，避免“游览”“参观”“品尝”等通用词。
- 景点标题例："登上海雾缭绕的神庙"、"追逐极光的尽头"。
- 美食标题例："在清晨的咖啡香里看日出"、"街角炭火上的晚餐"。
- 酒店标题例："夜宿山谷间的玻璃穹顶"。

3️⃣ notes 字段：
- 包含【文化 + 实用 + 情绪】三层内容；
- 每项不少于40字，既有执行信息，又有感官描写；
- 风格介于旅行攻略与散文之间，语言自然、真诚、有温度。

4️⃣ localTip 字段：
- 必须存在，提供独特的当地提示或注意事项（文化、交通、拍照、礼仪）。

5️⃣ theme 与 mood：
- 每天必须有一个“主题词”和“情绪词”；
- 主题应与整体旅程主线呼应；
- mood 用于传递当天氛围（如“静”“探”“放”“燃”“悟”）。

6️⃣ summary（每日与整体）：
- 每日summary应以第一人称或第二人称书写，让读者能“身临其境”；
- 总体summary需形成旅行叙事闭环，如“从未知到领悟”“从喧嚣到安静”。

7️⃣ 严格输出JSON数据，不添加多余文字或注释。
`

    return prompt
  }

  /**
   * 构建优化提示词
   */
  private buildOptimizationPrompt(itinerary: PlannerItineraryResponse, type: 'time' | 'cost' | 'route'): string {
    const optimizationFocus = {
      time: '时间效率',
      cost: '成本控制',
      route: '路线优化'
    }[type]

    return `请优化以下${itinerary.destination}行程的${optimizationFocus}：

**当前行程：**
${JSON.stringify(itinerary, null, 2)}

**优化要求：**
- 优化类型：${optimizationFocus}
- 保持原有偏好和风格
- 提供具体的优化建议
- 确保行程的可行性和实用性

请返回优化后的完整行程JSON，格式与原始行程相同。`
  }

  /**
   * 解析AI响应
   */
  private parseItineraryResponse(response: string, context?: PlannerItineraryRequest): PlannerItineraryResponse {
    try {
      // 尝试提取JSON部分（兼容多种围栏与格式）
      let jsonString = ''
      if (!response) throw new Error('Empty response')

      // 1) 优先匹配 ```json ... ``` 或 ``` ... ```
      const fenceMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
      if (fenceMatch && fenceMatch[1]) {
        jsonString = fenceMatch[1].trim()
      }

      // 2) 若未匹配，尝试提取第一个大括号包裹的 JSON 片段
      if (!jsonString) {
        const braceMatch = response.match(/\{[\s\S]*\}/)
        if (braceMatch) jsonString = braceMatch[0]
      }

      // 3) 兜底：直接使用原始内容
      if (!jsonString) jsonString = response.trim()
      
      const tryParse = (text: string) => {
        try { return JSON.parse(text) } catch { return null }
      }

      let data = tryParse(jsonString)

      // 如果第一次解析失败，尝试进行常见修复
      if (!data) {
        // 将字符串内部的裸换行统一转义为 \n，避免 LLM 在字符串里直接插入换行导致 JSON 失效
        const sanitizeStringNewlines = (s: string): string => {
          let out = ''
          let inStr = false
          let escaped = false
          for (let i = 0; i < s.length; i++) {
            const ch = s[i]
            if (!inStr) {
              if (ch === '"') { out += ch; inStr = true; escaped = false; continue }
              out += ch; continue
            }
            // in string
            if (escaped) { out += ch; escaped = false; continue }
            if (ch === '\\') { out += ch; escaped = true; continue }
            if (ch === '"') { out += ch; inStr = false; continue }
            if (ch === '\n' || ch === '\r') { out += '\\n'; continue }
            out += ch
          }
          return out
        }

        let fixed = sanitizeStringNewlines(jsonString)
          // 中文/弯引号转直引号
          .replace(/[“”]/g, '"')
          .replace(/[‘’]/g, '\'')
          // 删除行内注释与多余注释块
          .replace(/\/\/.*$/gm, '')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          // 删除对象/数组末尾多余逗号
          .replace(/,\s*(\}|\])/g, '$1')
          // 删除 JSON 外围杂项字符
          .trim()

        data = tryParse(fixed)
      }

      // 仍然失败，尝试再次移除不可见字符与控制字符
      if (!data) {
        const reClean = (s: string) => s
          .replace(/[\u0000-\u001F\u007F\u00A0]/g, ' ')
          .replace(/,\s*(\}|\])/g, '$1')
          .trim()
        data = tryParse(reClean(jsonString)) || tryParse(reClean(jsonString.replace(/[“”‘’]/g, '"')))
      }

      // 依旧失败：尝试闭合未完成的字符串与括号（LLM 截断场景）
      if (!data) {
        const repairTruncation = (s: string): string => {
          let out = ''
          const stack: string[] = []
          let inStr = false
          let escaped = false
          for (let i = 0; i < s.length; i++) {
            const ch = s[i]
            out += ch
            if (inStr) {
              if (escaped) { escaped = false; continue }
              if (ch === '\\') { escaped = true; continue }
              if (ch === '"') { inStr = false; continue }
              continue
            } else {
              if (ch === '"') { inStr = true; continue }
              if (ch === '{' || ch === '[') stack.push(ch)
              else if (ch === '}') { if (stack[stack.length - 1] === '{') stack.pop() }
              else if (ch === ']') { if (stack[stack.length - 1] === '[') stack.pop() }
            }
          }
          // 如果结束时仍在字符串中，补齐引号
          if (inStr) out += '"'
          // 补齐未闭合的括号
          while (stack.length) {
            const top = stack.pop()
            out += (top === '{') ? '}' : ']'
          }
          return out
        }
        const repaired = repairTruncation(jsonString)
        data = tryParse(repaired)
      }

      // 依旧失败：截断到最后一个完整的 '}'，再做括号/字符串闭合
      if (!data) {
        const lastBrace = jsonString.lastIndexOf('}')
        if (lastBrace > 0) {
          const truncated = jsonString.slice(0, lastBrace + 1)
          const attempt = truncated
          // 复用 repairTruncation 以补齐外层 ] / }
          const repairedTruncated = ((): string => {
            let out = ''
            const stack: string[] = []
            let inStr = false
            let escaped = false
            for (let i = 0; i < attempt.length; i++) {
              const ch = attempt[i]
              out += ch
              if (inStr) {
                if (escaped) { escaped = false; continue }
                if (ch === '\\') { escaped = true; continue }
                if (ch === '"') { inStr = false; continue }
              } else {
                if (ch === '"') { inStr = true; continue }
                if (ch === '{' || ch === '[') stack.push(ch)
                else if (ch === '}') { if (stack[stack.length - 1] === '{') stack.pop() }
                else if (ch === ']') { if (stack[stack.length - 1] === '[') stack.pop() }
              }
            }
            if (inStr) out += '"'
            while (stack.length) out += (stack.pop() === '{') ? '}' : ']'
            return out
          })()
          data = tryParse(repairedTruncated)
        }
      }

      if (!data) {
        // 最后一次尝试：从文本头部粗提取关键信息构造最小行程（确保不崩）
        const head = (jsonString || '').slice(0, 2000)
        const get = (re: RegExp) => {
          const m = head.match(re)
          return m && m[1] ? m[1].trim() : ''
        }
        const date = get(/"date"\s*:\s*"([^"]*)"/)
        const theme = get(/"theme"\s*:\s*"([^"]*)"/)
        const mood = get(/"mood"\s*:\s*"([^"]*)"/)
        const summary = get(/"summary"\s*:\s*"([\s\S]*?)"\s*,\s*"activities"/)

        if (date || theme || summary) {
          return {
            title: `${context?.destination || '目的地'}行程规划`,
            destination: context?.destination || '目的地',
            duration: context?.duration || 1,
            totalCost: 0,
            summary: summary || '',
            days: [
              {
                date: date || 'Day 1',
                title: theme || '第一天',
                description: summary || '',
                status: 'planned',
                stats: { duration: 6, cost: 0 },
                timeSlots: []
              }
            ],
            recommendations: { bestTimeToVisit: '', weatherAdvice: '', packingTips: [], localTips: [], emergencyContacts: [] },
            aiInsights: { optimizationSuggestions: [], alternativeActivities: [], budgetOptimization: [], culturalNotes: [] }
          }
        }

        throw new Error('JSON parse failed after sanitization')
      }

      // 新模板：只有 days/totalCost/summary，需要转换为内部结构
      if (data && Array.isArray(data.days) && !data.title) {
        const mappedDays: DayPlan[] = data.days.map((d: any, idx: number) => {
          const totalMinutes = (d.activities || []).reduce((acc: number, a: any) => acc + (a.duration || 0), 0)
          const totalCost = (d.activities || []).reduce((acc: number, a: any) => acc + (a.cost || 0), 0)
          return {
            date: `Day ${d.day || idx + 1}`,
            title: d.theme || `第${d.day || idx + 1}天`,
            description: d.summary || '',
            status: 'planned',
            stats: { duration: Math.round(totalMinutes / 60), cost: totalCost },
            timeSlots: (d.activities || []).map((a: any) => ({
              time: a.time || '10:00',
              activity: a.title || '',
              location: a.transport?.to || '',
              icon: '📍',
              category: a.type || 'attraction',
              categoryColor: 'blue',
              notes: (a.notes ? a.notes : '') + (a.localTip ? ` ｜提示：${a.localTip}` : ''),
              estimatedDuration: Math.max(1, Math.round((a.duration || 60) / 60)),
              estimatedCost: a.cost || 0
            }))
          }
        })

        const totalCost = data.totalCost || mappedDays.reduce((acc: number, d: DayPlan) => acc + (d.stats?.cost || 0), 0)

        const mapped: PlannerItineraryResponse = {
          title: `${context?.destination || '目的地'}行程规划`,
          destination: context?.destination || '目的地',
          duration: mappedDays.length,
          totalCost,
          summary: data.summary || '',
          days: mappedDays,
          recommendations: {
            bestTimeToVisit: '',
            weatherAdvice: '',
            packingTips: [],
            localTips: [],
            emergencyContacts: []
          },
          aiInsights: {
            optimizationSuggestions: [],
            alternativeActivities: [],
            budgetOptimization: [],
            culturalNotes: []
          }
        }
        return mapped
      }

      // 旧模板：已包含完整字段
      if (!data.title || !data.days || !Array.isArray(data.days)) {
        // 返回一个最小可用结构（带上下文）
        return {
          title: `${context?.destination || '目的地'}行程规划`,
          destination: context?.destination || '目的地',
          duration: (data.days && Array.isArray(data.days)) ? data.days.length : 0,
          totalCost: data.totalCost || 0,
          summary: data.summary || '',
          days: (data.days || []).map((_: any, idx: number) => ({
            date: `Day ${idx + 1}`,
            title: `第${idx + 1}天`,
            description: '',
            status: 'planned',
            stats: { duration: 0, cost: 0 },
            timeSlots: []
          })),
          recommendations: { bestTimeToVisit: '', weatherAdvice: '', packingTips: [], localTips: [], emergencyContacts: [] },
          aiInsights: { optimizationSuggestions: [], alternativeActivities: [], budgetOptimization: [], culturalNotes: [] }
        }
      }
      return data as PlannerItineraryResponse
    } catch (error) {
      console.error('解析AI响应失败:', error)
      console.warn('[plannerAPI] Raw response head:', (response || '').slice(0, 500))
      // 返回默认行程作为后备（带上下文）
      return {
        title: `${context?.destination || '目的地'}行程规划`,
        destination: context?.destination || '目的地',
        duration: context?.duration || 3,
        totalCost: 0,
        summary: '',
        days: [
          {
            date: 'Day 1',
            title: '第一天',
            description: '',
            status: 'planned',
            stats: { duration: 6, cost: 0 },
            timeSlots: []
          }
        ],
        recommendations: { bestTimeToVisit: '', weatherAdvice: '', packingTips: [], localTips: [], emergencyContacts: [] },
        aiInsights: { optimizationSuggestions: [], alternativeActivities: [], budgetOptimization: [], culturalNotes: [] }
      }
    }
  }

  // 兜底：默认行程
  private getDefaultItinerary(): PlannerItineraryResponse {
    return {
      title: '智能行程规划',
      destination: '目的地',
      duration: 3,
      totalCost: 3000,
      summary: '这是一个示例行程，用于在 AI 返回不可解析时保证页面可用。',
      days: [
        {
          date: 'Day 1',
          title: '第一天 - 抵达与适应',
          description: '抵达后办理入住，适应节奏，傍晚在市区随性漫步。',
          status: 'planned',
          stats: { duration: 6, cost: 800 },
          timeSlots: [
            { time: '10:00', activity: '抵达与入住', location: '机场/酒店', icon: '✈️', category: 'transport', categoryColor: 'blue', notes: '提前准备好预订信息', estimatedDuration: 2, estimatedCost: 200 },
            { time: '17:00', activity: '城市傍晚漫步', location: '市中心', icon: '🌆', category: 'attraction', categoryColor: 'purple', notes: '轻装出行，注意保暖', estimatedDuration: 2, estimatedCost: 0 }
          ]
        }
      ],
      recommendations: { bestTimeToVisit: '', weatherAdvice: '', packingTips: [], localTips: [], emergencyContacts: [] },
      aiInsights: { optimizationSuggestions: [], alternativeActivities: [], budgetOptimization: [], culturalNotes: [] }
    }
  }

  // 补齐/规范行程天数
  private ensureDuration(itin: PlannerItineraryResponse, targetDays: number, destination?: string): PlannerItineraryResponse {
    try {
      if (!targetDays || targetDays <= 0) return itin
      const days = Array.isArray(itin.days) ? [...itin.days] : []
      for (let i = days.length; i < targetDays; i++) {
        days.push({
          date: `Day ${i + 1}`,
          title: `第${i + 1}天${destination ? ' - ' + destination + '探索' : ''}`.trim(),
          description: '',
          status: 'planned',
          stats: { duration: 0, cost: 0 },
          timeSlots: []
        })
      }
      return { ...itin, duration: targetDays, days }
    } catch {
      return itin
    }
  }
}

export const plannerAPI = new PlannerAPI()
