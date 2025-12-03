/**
 * i18n 工具函数
 * 提供语言相关的工具函数
 */

/**
 * 获取当前语言
 * @returns 当前语言代码 'zh-CN' | 'en-US' | 'en'
 */
export function getCurrentLanguage(): 'zh-CN' | 'en-US' | 'en' {
  // 1. 优先从 localStorage 读取用户设置
  const saved = localStorage.getItem('preferred-locale')
  if (saved) {
    if (saved === 'en-US' || saved === 'en') {
      return 'en-US'
    }
    if (saved === 'zh-CN') {
      return 'zh-CN'
    }
  }

  // 2. 从浏览器语言设置推断
  const browserLang = navigator.language || (navigator as any).userLanguage || 'zh-CN'
  if (browserLang.startsWith('en')) {
    return 'en-US'
  }
  if (browserLang.startsWith('zh')) {
    return 'zh-CN'
  }

  // 3. 默认返回中文
  return 'zh-CN'
}

