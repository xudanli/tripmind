/**
 * JSON 解析和修复工具函数
 * 统一处理 AI 返回的 JSON 响应中的常见问题
 */

/**
 * 从响应文本中提取完整的 JSON 对象
 */
export function extractJSONObject(text: string): string {
  // 清理 markdown 代码块标记
  let cleaned = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim()
  
  // 查找第一个 { 
  const firstBrace = cleaned.indexOf('{')
  if (firstBrace === -1) {
    throw new Error('未找到 JSON 对象')
  }
  
  // 从第一个 { 开始，找到完整的 JSON
  let braceCount = 0
  let jsonEnd = -1
  
  for (let i = firstBrace; i < cleaned.length; i++) {
    if (cleaned[i] === '{') {
      braceCount++
    } else if (cleaned[i] === '}') {
      braceCount--
      if (braceCount === 0) {
        jsonEnd = i + 1
        break
      }
    }
  }
  
  if (jsonEnd === -1) {
    // 如果找不到完整的 JSON，返回从第一个 { 开始的子串
    return cleaned.substring(firstBrace)
  }
  
  return cleaned.substring(firstBrace, jsonEnd)
}

/**
 * 清理 AI 响应中的 markdown 代码块标记
 */
export function cleanMarkdownCodeBlocks(text: string): string {
  return text
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim()
}

/**
 * 修复常见的 JSON 格式问题
 */
export function fixJSONIssues(jsonString: string): string {
  let fixed = jsonString
  
  // 尝试直接解析，如果成功则返回
  try {
    JSON.parse(fixed)
    return fixed
  } catch {
    // 需要修复，继续处理
  }
  
  // 1. 修复字段名后的转义问题："field\": -> "field":
  fixed = fixed.replace(/"([a-zA-Z_][a-zA-Z0-9_]*)\\":/g, '"$1":')
  
  // 2. 修复值前的转义：": \" -> ": "
  fixed = fixed.replace(/":\s*\\"/g, '": "')
  
  // 3. 移除尾随逗号
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1')
  
  // 4. 修复单引号为双引号
  fixed = fixed.replace(/([{,]\s*)'([^']+)':\s*'([^']*)'/g, '$1"$2": "$3"')
  
  // 5. 修复未闭合的字符串引号
  fixed = fixed.replace(/":\s*"([^"]*?)(?=\s*[,}\]]|$)/g, (match, content) => {
    if (content && !content.endsWith('"')) {
      const escaped = content.replace(/"/g, '\\"').replace(/\\/g, '')
      return `": "${escaped}"`
    }
    return match
  })
  
  // 6. 修复截断的 JSON - 找到最后一个完整的对象
  let braceCount = 0
  let bracketCount = 0
  let lastValidIndex = fixed.length
  let inString = false
  let escapeNext = false
  
  for (let i = 0; i < fixed.length; i++) {
    const char = fixed[i]
    
    if (escapeNext) {
      escapeNext = false
      continue
    }
    
    if (char === '\\') {
      escapeNext = true
      continue
    }
    
    if (char === '"') {
      inString = !inString
      continue
    }
    
    if (!inString) {
      if (char === '{') braceCount++
      if (char === '}') {
        braceCount--
        if (braceCount === 0 && bracketCount === 0) {
          lastValidIndex = i + 1
        }
      }
      if (char === '[') bracketCount++
      if (char === ']') bracketCount--
    }
  }
  
  // 如果结构不完整，截取到最后一个完整对象
  if (braceCount !== 0 || bracketCount !== 0) {
    fixed = fixed.substring(0, lastValidIndex)
    
    // 补充缺失的闭合括号
    if (!fixed.trim().endsWith('}')) {
      const openBraces = (fixed.match(/{/g) || []).length
      const closeBraces = (fixed.match(/}/g) || []).length
      const neededBraces = openBraces - closeBraces
      
      const openBrackets = (fixed.match(/\[/g) || []).length
      const closeBrackets = (fixed.match(/\]/g) || []).length
      const neededBrackets = openBrackets - closeBrackets
      
      if (neededBrackets > 0) fixed += ']'.repeat(neededBrackets)
      if (neededBraces > 0) fixed += '}'.repeat(neededBraces)
    }
  }
  
  // 7. 移除控制字符
  fixed = fixed.replace(/[\x00-\x1F\x7F]/g, '')
  
  return fixed
}

/**
 * 安全地解析 JSON，带有多重修复尝试
 */
export function safeParseJSON(text: string): any {
  try {
    // 尝试直接解析
    return JSON.parse(text)
  } catch {
    // 尝试提取 JSON 对象
    try {
      const extracted = extractJSONObject(text)
      return JSON.parse(extracted)
    } catch {
      // 尝试修复后解析
      try {
        const fixed = fixJSONIssues(text)
        return JSON.parse(fixed)
      } catch (error) {
        console.error('JSON 解析失败:', error)
        throw error
      }
    }
  }
}

/**
 * 从文本中提取特定字段的值
 */
export function extractField(jsonString: string, fieldName: string): string | null {
  const regex = new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*)"`, 'g')
  const match = regex.exec(jsonString)
  return match ? match[1] : null
}

