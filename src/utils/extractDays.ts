/**
 * 从用户输入中提取天数信息（纯函数）
 */

/**
 * 从用户输入中提取天数
 * 支持中文和英文格式
 */
export function extractDaysFromInput(input: string, language: string = 'zh-CN'): number | null {
  const isEnglish = language.startsWith('en')
  
  // 中文模式：匹配"6天"、"6日"、"六天"等
  if (!isEnglish) {
    // 匹配数字+天/日
    const zhPattern1 = /(\d+)\s*[天日]/
    const match1 = input.match(zhPattern1)
    if (match1 && match1[1]) {
      const days = parseInt(match1[1], 10)
      if (days > 0 && days <= 30) {
        return days
      }
    }
    
    // 匹配中文数字+天/日
    const zhNumbers: Record<string, number> = {
      '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
      '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
      '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15
    }
    for (const [zhNum, num] of Object.entries(zhNumbers)) {
      if (input.includes(`${zhNum}天`) || input.includes(`${zhNum}日`)) {
        return num
      }
    }
  } else {
    // 英文模式：匹配"6 days"、"6-day"等
    const enPattern1 = /(\d+)\s*days?/i
    const match1 = input.match(enPattern1)
    if (match1 && match1[1]) {
      const days = parseInt(match1[1], 10)
      if (days > 0 && days <= 30) {
        return days
      }
    }
    
    // 匹配"6-day"格式
    const enPattern2 = /(\d+)\s*-\s*day/i
    const match2 = input.match(enPattern2)
    if (match2 && match2[1]) {
      const days = parseInt(match2[1], 10)
      if (days > 0 && days <= 30) {
        return days
      }
    }
  }
  
  return null
}

