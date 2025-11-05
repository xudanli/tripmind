/**
 * 行程天数规范化工具
 * 用于补齐或裁剪行程天数，确保与目标天数一致
 */

/**
 * 规范化选项
 */
export interface NormalizeOptions {
  clipIfExceed?: boolean // 超出是否裁剪（默认 false：不裁剪，只同步 duration）
  stageCycle?: string[]  // 心理阶段循环
  language?: 'zh-CN' | 'en' | string
}

const isEN = (lang?: string) => String(lang || 'zh-CN').startsWith('en')

/**
 * 规范化行程天数
 * @param parsed 解析后的行程数据
 * @param targetDays 目标天数
 * @param startDateISO 开始日期（ISO 格式）
 * @param opts 选项
 * @returns 规范化后的行程数据
 */
export function normalizeDays(
  parsed: any,
  targetDays: number,
  startDateISO: string,
  opts: NormalizeOptions = {}
): any {
  const lang = opts.language || 'zh-CN'
  const stages = opts.stageCycle || (isEN(lang) 
    ? ['Summon', 'Mirror', 'Awaken', 'Settle', 'Transform']
    : ['召唤', '映照', '觉醒', '沉淀', '转化'])
  
  if (!Array.isArray(parsed?.days)) return parsed

  const toISO = (d: Date) => d.toISOString().split('T')[0]
  const destName = parsed?.destination || ''

  let days = parsed.days as any[]

  // 裁剪策略
  if (opts.clipIfExceed && days.length > targetDays) {
    days = days.slice(0, targetDays)
  }

  // 补齐策略
  if (days.length < targetDays) {
    const refDay = days[days.length - 1] || days[0] || {}
    const baseDate = new Date(startDateISO)

    for (let i = days.length; i < targetDays; i++) {
      const d = new Date(baseDate)
      d.setDate(baseDate.getDate() + i)
      const stage = stages[i % stages.length]
      
      const theme = isEN(lang)
        ? `${stage}: ${stage === 'Summon' ? 'The Call' : stage}`
        : `${stage}：${stage === '召唤' ? '召唤之声' : stage}`
      
      const mood = isEN(lang)
        ? (stage === 'Summon' ? 'exploration' : stage.toLowerCase())
        : (stage === '召唤' ? '探索' : stage)

      const baseSlot = (refDay.timeSlots && refDay.timeSlots[0]) || {}
      const hour = 8 + (i % 3) // 8/9/10 点的变化
      const minute = (i * 17) % 60

      const slot = {
        time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        title: isEN(lang) 
          ? `${stage} walk: breathe with the city` 
          : `${stage}时刻：与城市同频的步行`,
        activity: baseSlot.activity || (isEN(lang) ? 'Exploration' : '探索'),
        location: baseSlot.location || destName,
        type: baseSlot.type || 'attraction',
        category: baseSlot.category || (isEN(lang) ? 'Explore' : '探索'),
        duration: baseSlot.duration || 120,
        notes: baseSlot.notes || (isEN(lang)
          ? `A gentle ${stage.toLowerCase()} session. Move slowly, notice textures, light and small sounds. Write down one sentence at the end.`
          : `一段关于「${stage}」的轻柔体验。放慢步伐，留意纹理、光影与细微声音。结束时写下一句感受。`),
        localTip: baseSlot.localTip || (isEN(lang) ? 'Start early to avoid crowds' : '建议早些开始以避开人流'),
        cost: baseSlot.cost ?? 0,
        coordinates: baseSlot.coordinates || { lat: 0, lng: 0 },
        internalTrack: baseSlot.internalTrack || {
          question: isEN(lang) 
            ? `What is ${stage.toLowerCase()} asking from me today?` 
            : `${stage}阶段：今天它向我提出了什么问题？`,
          ritual: isEN(lang) ? 'Write one sentence after the activity' : '活动结束后写下一句感受',
          reflection: isEN(lang) ? 'Notice body rhythm and breath' : '留意身体的节奏与呼吸',
        },
        details: baseSlot.details || {
          name: { 
            chinese: destName || '目的地', 
            english: destName || 'Destination', 
            local: destName 
          },
          address: { 
            chinese: '', 
            english: '', 
            local: '', 
            landmark: '' 
          },
          transportation: { 
            fromStation: { walkTime: '', distance: '' }, 
            busLines: [], 
            busStop: '', 
            subway: { available: false, lines: [], station: '' }, 
            parking: '' 
          },
          openingHours: { 
            days: '', 
            hours: '', 
            holidays: '', 
            closedDays: [] 
          },
          pricing: { 
            general: 0, 
            detail: { 
              setMeal: { min: 0, max: 0, unit: '' }, 
              aLaCarte: { min: 0, max: 0, unit: '' }, 
              children: { price: 0, ageLimit: 12, unit: '' }, 
              groupDiscount: { percentage: 0, minPeople: 0 } 
            } 
          },
          rating: { 
            score: 0, 
            platform: '', 
            reviewCount: 0 
          },
          recommendations: { 
            bestTime: '', 
            bookingRequired: false, 
            bookingAdvance: '', 
            suggestedDuration: '', 
            dressCode: '', 
            seasonal: '', 
            specialNotes: [] 
          },
          description: { 
            cuisine: '', 
            specialty: '', 
            atmosphere: '', 
            highlights: [] 
          },
        },
      }

      days.push({
        day: i + 1,
        date: toISO(d),
        theme,
        mood,
        summary: isEN(lang) 
          ? `A ${stage.toLowerCase()} day continuing the journey in ${destName}.` 
          : `处于「${stage}」阶段，在${destName}延续你的节奏。`,
        psychologicalStage: stage,
        timeSlots: [slot],
      })
    }
  }

  parsed.days = days
  parsed.duration = days.length
  return parsed
}
