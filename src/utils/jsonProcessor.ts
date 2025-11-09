/**
 * Minimal, production-safe JSON repairer for LLM outputs
 * 使用有限状态机（FSM）处理未闭合字符串和不平衡括号
 */

export type ParseResult<T = unknown> = {
  ok: true; data: T; truncated?: boolean;
} | {
  ok: false; error: Error; pos?: number; context?: string;
};

const MD_FENCE_RE = /```(?:json)?|```/gi;
const CTRL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;
const BOM_RE = /^\uFEFF/;
const SMART_QUOTES_RE = /[""„‟＂❝❞〝〞]/g;
const SMART_SINGLE_RE = /[''‚‛＇❛❜]/g;

/** ---- Public API ---- */

export function parseSafe<T = unknown>(raw: string): ParseResult<T> {
  try {
    const cleaned = sanitize(raw);
    const { slice, truncated } = truncateToBalanced(cleaned);
    const repaired = repair(slice);
    const data = JSON.parse(repaired) as T;
    return { ok: true, data, truncated };
  } catch (e: any) {
    const pos = extractJSONErrorPos(e);
    return { ok: false, error: e, pos, context: contextAround(raw, pos) };
  }
}

/** Extract only last fully-closed "days" array JSON and parse */
export function extractDaysArray(raw: string): ParseResult<any[]> {
  return extractArrayByKey(raw, '"days"');
}

/** Extract only last fully-closed "timeSlots" array JSON and parse */
export function extractTimeSlotsArray(raw: string): ParseResult<any[]> {
  return extractArrayByKey(raw, '"timeSlots"');
}

/** Try both: full → days → timeSlots */
export function tryRepairAndParse<T = unknown>(raw: string): ParseResult<T> {
  const full = parseSafe<T>(raw);
  if (full.ok) return full;

  const days = extractDaysArray(raw);
  if (days.ok) return days as ParseResult<T>;

  const slots = extractTimeSlotsArray(raw);
  if (slots.ok) return slots as ParseResult<T>;

  return full;
}

/** ---- Core pipeline ---- */

function sanitize(s: string): string {
  return s
    .replace(BOM_RE, '')
    .replace(MD_FENCE_RE, '')
    .replace(CTRL_RE, '')
    .replace(SMART_QUOTES_RE, '"')
    .replace(SMART_SINGLE_RE, "'");
}

/** Brace/Bracket balancer with string awareness */
function truncateToBalanced(input: string): { slice: string; truncated: boolean } {
  let inStr = false, escape = false;
  let depth = 0;
  let lastBalanced = -1;
  const len = input.length;

  for (let i = 0; i < len; i++) {
    const ch = input.charAt(i);

    if (inStr) {
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inStr = false; }
      continue;
    }

    if (ch === '"') { inStr = true; continue; }
    if (ch === '{' || ch === '[') { depth++; }
    else if (ch === '}' || ch === ']') { depth = Math.max(0, depth - 1); }

    if (depth === 0) lastBalanced = i + 1;
  }

  if (lastBalanced === -1) {
    // try detect first JSON object/array start
    const start = input.search(/[{\[]/);
    return start >= 0 ? { slice: input.slice(start), truncated: true } : { slice: input, truncated: true };
  }
  const slice = input.slice(0, lastBalanced);
  const truncated = lastBalanced < input.length;
  return { slice, truncated };
}

/** Heuristic repairs: close strings/newlines-in-strings/add trailing closers/fix commas/fix numbers */
function repair(input: string): string {
  // 1) escape newlines inside strings + ensure all strings closed + fix unterminated numbers
  let out = '';
  let inStr = false, escape = false;
  let inNumber = false;
  let numberStart = -1;
  
  for (let i = 0; i < input.length; i++) {
    const ch = input.charAt(i);
    
    // Handle numbers (outside strings)
    if (!inStr) {
      if (!inNumber && /[0-9]/.test(ch)) {
        inNumber = true;
        numberStart = i;
      } else if (inNumber) {
        const nextChar = input.charAt(i + 1)
        if (ch === '.' && i + 1 < input.length && /[0-9]/.test(nextChar)) {
          // Valid decimal point with following digit
          out += ch;
          continue;
        } else if (ch === '.' && (i + 1 >= input.length || !/[0-9]/.test(nextChar))) {
          // Unterminated fractional number (e.g., "12." at end or before non-digit)
          // Remove the trailing dot or add 0
          out += '0';
          inNumber = false;
          continue;
        } else if (!/[0-9.eE+-]/.test(ch)) {
          // Number ended
          inNumber = false;
        }
      }
    }
    
    out +=
      (inStr && (ch === '\n' || ch === '\r')) ? '\\n'
      : ch;

    if (inStr) {
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inStr = false; }
      continue;
    } else {
      if (ch === '"') inStr = true;
    }
  }
  
  // Close unterminated number at end
  if (inNumber && numberStart >= 0) {
    // Check if ends with a dot
    if (out.endsWith('.')) {
      out = out.slice(0, -1);
    }
  }
  
  if (inStr) out += '"'; // close unterminated string

  // 2) add missing trailing closers by a second pass
  const closers = missingClosers(out);
  out += closers;

  // 3) insert missing commas between object members/array items (conservative)
  out = fixMissingCommas(out);

  return out;
}

/** Count missing closers using non-string scan */
function missingClosers(s: string): string {
  let inStr = false, esc = false;
  const stack: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s.charAt(i);
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') { inStr = false; }
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '{' || ch === '[') stack.push(ch);
    else if (ch === '}' || ch === ']') stack.pop();
  }
  if (!stack.length) return '';
  return stack.reverse().map(c => c === '{' ? '}' : ']').join('');
}

/** Very conservative comma fixer at object/array boundaries */
function fixMissingCommas(s: string): string {
  // Pattern: `}"` → `}", "`  OR `]"` → `]", "`
  // only when the `"` starts a key (looking back for : or , or { )
  // We implement with a small state machine to avoid touching strings
  let out = '';
  let inStr = false, esc = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charAt(i);
    out += ch;

    if (inStr) {
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') { inStr = false; }
      continue;
    }

    if (ch === '"') { inStr = true; continue; }

    // Insert comma after } or ] if next significant char starts a string key/value
    if ((ch === '}' || ch === ']')) {
      const j = skipWS(s, i + 1);
      if (j < s.length && s[j] === '"') {
        // look behind to ensure we're inside object/array context: previous non-ws should be } ] " digit etc., and before that likely :
        // keep conservative: if previous non-ws is not { [ , :  then add comma
        const k = rskipWS(s, i - 1);
        if (k >= 0 && s[k] && !'{[,:'.includes(s[k])) {
          out += ',';
        }
      }
    }
  }
  return out;
}

function skipWS(s: string, i: number): number {
  while (i < s.length) {
    const ch = s.charAt(i)
    if (ch === undefined || !/\s/.test(ch)) break
    i++
  }
  return i
}
function rskipWS(s: string, i: number): number {
  while (i >= 0) {
    const ch = s.charAt(i)
    if (ch === undefined || !/\s/.test(ch)) break
    i--
  }
  return i
}

/** Parse a specific array by key name safely */
function extractArrayByKey(raw: string, key: string): ParseResult<any[]> {
  try {
    const cleaned = sanitize(raw);
    
    // Try multiple patterns to find the key
    const patterns = [
      new RegExp(`"${key.replace(/"/g, '')}"\\s*:`, 'i'),  // "key":
      new RegExp(`'${key.replace(/['"]/g, '')}'\\s*:`, 'i'),  // 'key':
      new RegExp(`${key.replace(/['"]/g, '')}\\s*:`, 'i')   // key: (unquoted)
    ];
    
    let idx = -1;
    let match: RegExpMatchArray | null = null;
    
    for (const pattern of patterns) {
      match = cleaned.match(pattern);
      if (match && match.index !== undefined) {
        idx = match.index;
        break;
      }
    }
    
    if (idx < 0) {
      // Try lastIndexOf as fallback
      idx = cleaned.lastIndexOf(key);
      if (idx < 0) throw new Error(`Key ${key} not found`);
    }
    
    // find start '[' after key
    let start = cleaned.indexOf('[', idx);
    if (start < 0) {
      // Maybe the array is nested in an object, try to find it
      // Look for the colon after the key
      const colonIdx = cleaned.indexOf(':', idx);
      if (colonIdx >= 0) {
        start = cleaned.indexOf('[', colonIdx);
      }
    }
    
    if (start < 0) throw new Error('Array start not found');
    
    const sliced = sliceBalancedArray(cleaned, start);
    const repaired = repair(sliced);
    const data = JSON.parse(repaired);
    if (!Array.isArray(data)) throw new Error('Parsed value is not an array');
    return { ok: true, data };
  } catch (e: any) {
    const pos = extractJSONErrorPos(e);
    return { ok: false, error: e, pos, context: contextAround(raw, pos) };
  }
}

function sliceBalancedArray(s: string, start: number): string {
  // slice from '[' to last balanced ']' with string awareness
  let depth = 0;
  let inStr = false, esc = false;
  let end = -1;
  let lastValidEnd = -1;
  
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') inStr = false;
    } else {
      if (ch === '"') inStr = true;
      else if (ch === '[') {
        depth++;
        if (depth === 1) lastValidEnd = i + 1; // Track start of array
      }
      else if (ch === ']') {
        depth--;
        if (depth === 0) { 
          end = i + 1; 
          break; 
        } else if (depth > 0) {
          // Track the last valid closing bracket at current depth
          lastValidEnd = i + 1;
        }
      }
    }
  }
  
  if (end === -1) {
    // If we didn't find a complete array, try to use the last valid position
    // This helps when the array is truncated but we have some valid elements
    if (lastValidEnd > start && depth > 0) {
      // We have some valid content, use it
      end = lastValidEnd;
    } else {
      // fall back to end-of-string, will be closed by repair()
      end = s.length;
    }
  }
  
  return s.slice(start, end);
}

/** helpers */
function extractJSONErrorPos(e: Error): number | undefined {
  const m = /position\s+(\d+)/i.exec(e.message) || /at line.*column.*position\s+(\d+)/i.exec(e.message);
  return m && m[1] ? +m[1] : undefined;
}
function contextAround(s: string, pos?: number, span = 80): string {
  if (pos === undefined) return '';
  const a = Math.max(0, pos - span);
  const b = Math.min(s.length, pos + span);
  return `${s.slice(a, pos)}⟦HERE⟧${s.slice(pos, b)}`;
}

