/**
 * JSON 解析和修复工具函数
 * 统一处理 AI 返回的 JSON 响应中的常见问题
 */

/**
 * 解析选项接口
 */
export interface ParseOptions {
  verbose?: boolean;
  maxRepairAttempts?: number;
  allowPartial?: boolean;
}

/**
 * 从响应文本中提取完整的 JSON 对象或数组 - 优化版本
 */
export function extractJSONObject(text: string): string {
  if (!text || typeof text !== 'string') {
    throw new Error('输入必须是有效的字符串');
  }

  let cleaned = cleanMarkdownCodeBlocks(text);
  
  // 同时查找 { 和 [ 作为 JSON 开始
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  
  let jsonStart = -1;
  let isObject = true;
  
  if (firstBrace === -1 && firstBracket === -1) {
    throw new Error('未找到 JSON 对象或数组');
  } else if (firstBrace === -1) {
    jsonStart = firstBracket;
    isObject = false;
  } else if (firstBracket === -1) {
    jsonStart = firstBrace;
  } else {
    jsonStart = Math.min(firstBrace, firstBracket);
    isObject = firstBrace < firstBracket;
  }

  const openChar = isObject ? '{' : '[';
  const closeChar = isObject ? '}' : ']';
  
  let count = 0;
  let inString = false;
  let escapeNext = false;
  let jsonEnd = -1;

  for (let i = jsonStart; i < cleaned.length; i++) {
    const char = cleaned[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (inString) continue;
    
    if (char === openChar) {
      count++;
    } else if (char === closeChar) {
      count--;
      if (count === 0) {
        jsonEnd = i + 1;
        break;
      }
    }
  }
  
  if (jsonEnd === -1) {
    // 如果找不到完整的 JSON，尝试修复结构
    return attemptStructureRepair(cleaned.substring(jsonStart));
  }
  
  return cleaned.substring(jsonStart, jsonEnd);
}

/**
 * 尝试修复不完整的 JSON 结构
 */
function attemptStructureRepair(incompleteJson: string): string {
  let repaired = incompleteJson;
  
  // 计算需要补充的括号
  const braceStats = countBrackets(repaired);
  const neededBraces = braceStats.openBraces - braceStats.closeBraces;
  const neededBrackets = braceStats.openBrackets - braceStats.closeBrackets;
  
  // 移除尾随逗号
  repaired = repaired.replace(/,\s*$/, '');
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
  
  // 补充缺失的闭合括号
  if (neededBrackets > 0) repaired += ']'.repeat(neededBrackets);
  if (neededBraces > 0) repaired += '}'.repeat(neededBraces);
  
  return repaired;
}

/**
 * 统计括号数量（忽略字符串内的括号）
 */
function countBrackets(text: string): { openBraces: number; closeBraces: number; openBrackets: number; closeBrackets: number } {
  let openBraces = 0;
  let closeBraces = 0;
  let openBrackets = 0;
  let closeBrackets = 0;
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (inString) continue;
    
    if (char === '{') openBraces++;
    if (char === '}') closeBraces++;
    if (char === '[') openBrackets++;
    if (char === ']') closeBrackets++;
  }
  
  return { openBraces, closeBraces, openBrackets, closeBrackets };
}

/**
 * 清理 AI 响应中的 markdown 代码块标记
 */
export function cleanMarkdownCodeBlocks(text: string): string {
  let cleaned = text
  
  // 移除各种 markdown 代码块格式（包括反引号和 json 标记的组合）
  cleaned = cleaned.replace(/```json\s*\n?/gi, '')
  cleaned = cleaned.replace(/```json\{/gi, '{')  // 处理 ```json{ 这种格式
  cleaned = cleaned.replace(/```\s*\n?/g, '')
  cleaned = cleaned.replace(/`json\s*\n?/gi, '')
  cleaned = cleaned.replace(/`json\{/gi, '{')  // 处理 `json{ 这种格式
  cleaned = cleaned.replace(/`{/g, '{')  // 处理单独的 `{ 
  cleaned = cleaned.replace(/`/g, '')  // 移除所有剩余的反引号
  
  // 移除可能的前后空白字符和换行
  cleaned = cleaned.trim()
  
  return cleaned
}

/**
 * 修复常见的 JSON 格式问题
 */
export function fixJSONIssues(jsonString: string): string {
  // 首先清理 markdown 代码块
  let fixed = cleanMarkdownCodeBlocks(jsonString)
  
  // 尝试直接解析，如果成功则返回
  try {
    JSON.parse(fixed)
    return fixed
  } catch {
    // 需要修复，继续处理
  }
  
  // 1. 修复字符串值后面直接跟对象或数组的情况："field": "value" { -> "field": "value",
  // 例如："local": "Carretera San José-Monteverde" { -> "local": "Carretera San José-Monteverde",
  // 需要在字段值的引号后添加逗号
  fixed = fixed.replace(/":\s*"([^"]*?)"\s*\{/g, '": "$1", {')
  fixed = fixed.replace(/":\s*"([^"]*?)"\s*\[/g, '": "$1", [')
  
  // 2. 修复字段值后面多余的引号和逗号："field": value ", " -> "field": value,
  fixed = fixed.replace(/":\s*([^":,\[\]{}]+)\s*",\s*"/g, '": $1, "')
  fixed = fixed.replace(/":\s*([^":,\[\]{}]+)\s*"\s*,/g, '": $1,')
  
  // 3. 修复重复的字段定义（保留第一个）
  fixed = fixed.replace(/"([^"]+)":\s*([^,}]+),\s*"\1":/g, '"$1": $2,')
  
  // 4. 修复字段名后的转义问题："field\": -> "field":
  fixed = fixed.replace(/"([a-zA-Z_][a-zA-Z0-9_]*)\\":/g, '"$1":')
  
  // 5. 修复值前的转义：": \" -> ": "
  fixed = fixed.replace(/":\s*\\"/g, '": "')
  
  // 6. 移除尾随逗号
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1')
  
  // 7. 修复单引号为双引号
  fixed = fixed.replace(/([{,]\s*)'([^']+)':\s*'([^']*)'/g, '$1"$2": "$3"')
  
  // 8. 修复字符串值中包含特殊字符但缺少转义的情况
  // 处理字符串中未转义的引号（在字符串值中间）
  fixed = fixed.replace(/":\s*"([^"]*)"([^,}\]])\s*"/g, (match, content, after) => {
    // 如果字符串后面跟着非逗号/括号字符，可能是未转义的引号
    if (after.trim() && !after.match(/^[,}\]]/)) {
      return `": "${content.replace(/"/g, '\\"')}",`
    }
    return match
  })
  
  // 9. 修复数字后面多余的引号和重复字段："field": 6 ", "field": 6, -> "field": 6,
  // 处理 "duration": 6 ", "duration": 6, 这种情况
  fixed = fixed.replace(/":\s*(\d+(?:\.\d+)?)\s*",\s*"([^"]+)":\s*\1\s*,/g, '": $1,')
  fixed = fixed.replace(/":\s*(\d+(?:\.\d+)?)\s*"\s*,/g, '": $1,')
  fixed = fixed.replace(/":\s*(\d+(?:\.\d+)?)\s*",\s*/g, '": $1, ')
  
  // 10. 修复数字和布尔值后面的多余引号（在字段值位置）
  fixed = fixed.replace(/":\s*((?:true|false|null|\d+(?:\.\d+)?))\s*",/g, '": $1,')
  
  // 11. 修复未闭合的字符串引号（处理截断的字符串值）
  // 首先处理字符串中包含换行符的情况
  fixed = fixed.replace(/":\s*"([^"]*(?:\\.[^"]*)*)"\s*,/g, (match, content) => {
    // 如果字符串值中有未转义的换行符，需要转义
    if (content.includes('\n') && !content.includes('\\n')) {
      const escaped = content
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
      return `": "${escaped}",`
    }
    return match
  })
  
  // 然后处理未闭合的字符串（在对象或数组末尾，被截断的情况）
  fixed = fixed.replace(/":\s*"([^"]*?)(?=\s*[,}\]]|$)/g, (match, content, offset) => {
    // 检查这个匹配后面是否跟着逗号、右括号或结束（说明字符串未闭合）
    const afterMatch = fixed.substring(offset + match.length, offset + match.length + 5)
    
    // 如果内容不以引号结尾，且后面跟着逗号、右括号或空白，说明字符串被截断
    if (!content.endsWith('"') && (afterMatch.startsWith(',') || afterMatch.startsWith('}') || afterMatch.startsWith(']') || afterMatch.trim() === '')) {
      // 转义内容中的特殊字符
      const escaped = content
        .replace(/\\/g, '\\\\')  // 先转义反斜杠
        .replace(/"/g, '\\"')    // 转义引号
        .replace(/\n/g, '\\n')   // 转义换行符
        .replace(/\r/g, '\\r')   // 转义回车符
        .replace(/\t/g, '\\t')   // 转义制表符
      return `": "${escaped}"`
    }
    return match
  })
  
  // 12. 修复截断的 JSON - 找到最后一个完整的对象
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
  
  // 13. 移除控制字符
  fixed = fixed.replace(/[\x00-\x1F\x7F]/g, '')
  
  // 14. 最后再次尝试移除重复字段（使用更精确的正则）
  // 处理 "field": value ", "field": value 这种情况
  // 例如："duration": 6 ", "duration": 6, -> "duration": 6,
  const duplicateFieldPattern = /"([^"]+)":\s*([^,}]+)\s*",\s*"\1":\s*\2\s*,/g
  fixed = fixed.replace(duplicateFieldPattern, '"$1": $2,')
  
  // 15. 修复数字值后面多余的引号（更全面的匹配，包括负数和浮点数）
  fixed = fixed.replace(/":\s*(-?\d+(?:\.\d+)?)\s*",\s*(?=")/g, '": $1, ')
  
  // 16. 修复字符串值后直接跟对象/数组但缺少逗号的情况（更精确的匹配）
  // 处理类似 "local": "text" {"chinese": "..." 的情况
  fixed = fixed.replace(/"([^"]*)"\s*\{\s*"([^"]+)":/g, '"$1", { "$2":')
  fixed = fixed.replace(/"([^"]*)"\s*\[\s*"([^"]+)":/g, '"$1", [ "$2":')
  fixed = fixed.replace(/"([^"]*)"\s*\[\s*\{/g, '"$1", [ {')
  
  return fixed
}

/**
 * 安全地解析 JSON - 优化版本
 */
export function safeParseJSON(text: string, options: ParseOptions = {}): any {
  const { verbose = false, maxRepairAttempts = 3, allowPartial = false } = options;
  
  if (!text || typeof text !== 'string') {
    throw new Error('输入必须是有效的字符串');
  }
  
  const log = verbose ? console.log : () => {};
  
  // 尝试序列：直接解析 → 提取 → 修复 → 截取修复
  const attempts: Array<{ name: string; fn: () => any }> = [
    { name: '直接解析', fn: () => JSON.parse(cleanMarkdownCodeBlocks(text)) },
    { name: '提取 JSON', fn: () => JSON.parse(extractJSONObject(text)) },
    { name: '基础修复', fn: () => JSON.parse(fixJSONIssues(text)) },
  ];
  
  if (allowPartial) {
    attempts.push({ 
      name: '截取修复', 
      fn: () => attemptPartialParse(text, verbose) 
    });
  }
  
  let lastError: Error | null = null;
  
  for (const attempt of attempts.slice(0, maxRepairAttempts)) {
    try {
      log(`尝试 ${attempt.name}...`);
      const result = attempt.fn();
      log(`✅ ${attempt.name} 成功`);
      return result;
    } catch (error: any) {
      lastError = error;
      log(`❌ ${attempt.name} 失败: ${error.message}`);
      
      if (verbose && error.message?.includes('position')) {
        const posMatch = error.message.match(/position (\d+)/);
        if (posMatch) {
          const pos = parseInt(posMatch[1]);
          const context = text.substring(Math.max(0, pos - 50), Math.min(text.length, pos + 50));
          log(`错误位置上下文: ...${context}...`);
        }
      }
    }
  }
  
  throw new Error(`所有 JSON 解析尝试都失败。最后错误: ${lastError?.message}`);
}

/**
 * 尝试部分解析（当完整解析失败时）
 */
function attemptPartialParse(text: string, verbose: boolean = false): any {
  const cleaned = cleanMarkdownCodeBlocks(text);
  
  // 找到最后一个完整的对象
  let lastValidEnd = -1;
  let maxDepth = 0;
  let currentDepth = 0;
  let inString = false;
  let escapeNext = false;
  let lastValidBrace = -1;
  
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{' || char === '[') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
        if (char === '{') {
          lastValidBrace = i;
        }
      } else if (char === '}' || char === ']') {
        currentDepth--;
        if (currentDepth === 0) {
          lastValidEnd = i + 1;
        }
      }
    }
  }
  
  // 如果找到完整的 JSON 对象
  if (lastValidEnd > 0 && lastValidEnd > cleaned.length * 0.3) {
    const partialJson = cleaned.substring(0, lastValidEnd);
    
    // 尝试修复并解析
    try {
      const fixed = fixJSONIssues(partialJson);
      const result = JSON.parse(fixed);
      if (verbose) {
        console.warn(`✅ 使用部分 JSON (${lastValidEnd}/${cleaned.length} 字符)`);
      }
      return result;
    } catch (parseError: any) {
      if (verbose) {
        console.warn(`⚠️ 部分 JSON 解析失败: ${parseError.message}`);
      }
    }
  }
  
  // 如果找不到完整对象，尝试从最后一个完整的字段开始截取
  if (lastValidBrace > 0 && lastValidBrace > cleaned.length * 0.3) {
    // 尝试找到最后一个完整的字段（以逗号结尾）
    let lastComma = cleaned.lastIndexOf(',', lastValidBrace + 2000);
    if (lastComma > lastValidBrace && lastComma > cleaned.length * 0.3) {
      const truncated = cleaned.substring(0, lastComma + 1);
      
      // 尝试修复结构
      try {
        const fixed = attemptStructureRepair(truncated);
        const result = JSON.parse(fixed);
        if (verbose) {
          console.warn(`✅ 使用截断修复的 JSON (${lastComma}/${cleaned.length} 字符)`);
        }
        return result;
      } catch (error) {
        if (verbose) {
          console.warn(`⚠️ 截断修复也失败`);
        }
      }
    }
  }
  
  throw new Error('无法提取有效的部分 JSON');
}

/**
 * 从文本中提取特定字段的值
 */
export function extractField(jsonString: string, fieldName: string): string | null {
  const regex = new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*)"`, 'g')
  const match = regex.exec(jsonString)
  return match ? (match[1] || null) : null
}

