/**
 * 灵感提示词构建模块
 */

export type LanguageCode = 'zh-CN' | 'en' | string

const isEN = (lang: LanguageCode) => String(lang).startsWith('en')

/**
 * 构建灵感提示词
 */
export function buildHintPrompt(userInput: string, lang: LanguageCode = 'zh-CN'): string {
  const en = isEN(lang)
  const input = userInput || (en ? 'I want to travel' : '我想去旅行')
  
  return en
    ? `You are a creative travel inspiration assistant. Based on the user's partial input, provide concise and inspiring suggestions to help them express their travel ideas.

User's current input: "${input}"

Provide 2-3 short, inspiring suggestions (each no more than 15 words) that:
- Help the user clarify their feelings and needs
- Inspire them to think about what they truly want
- Guide them to express their travel dreams
- Use warm, encouraging, and poetic language

Return ONLY the suggestions, one per line, NO numbering, NO bullet points, just plain text.`
    : `你是一位富有创意的旅行灵感助手。根据用户的输入片段，提供简洁而有启发性的建议，帮助他们表达旅行想法。

用户当前输入："${input}"

请提供2-3条简短有启发的建议（每条不超过15字），要求：
- 帮助用户澄清感受和需求
- 启发他们思考真正想要什么
- 引导他们表达旅行梦想
- 使用温暖、鼓励、富有诗意的语言

只需返回建议内容，每行一条，不要编号，不要项目符号，纯文本返回。`
}
