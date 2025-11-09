import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import i18n from '@/i18n'

export const useI18nStore = defineStore('i18n', () => {
  // 直接从 i18n 读取当前语言
  const normalizeLocale = (value: string): 'zh-CN' | 'en-US' => {
    return value === 'en-US' ? 'en-US' : 'zh-CN'
  }

  const currentLocale = computed({
    get: () => i18n.global.locale.value,
    set: (value: string) => {
      const normalized = normalizeLocale(value)
      i18n.global.locale.value = normalized
      localStorage.setItem('preferred-locale', normalized)
      console.log('语言已切换到:', normalized)
    }
  })

  const setLocale = (lang: string) => {
    console.log('切换语言:', lang, '当前语言:', currentLocale.value)
    const normalized = normalizeLocale(lang)
    i18n.global.locale.value = normalized
    localStorage.setItem('preferred-locale', normalized)
    console.log('切换后语言:', i18n.global.locale.value)
  }

  // 从 localStorage 加载语言设置
  const loadLocale = () => {
    const saved = localStorage.getItem('preferred-locale')
    if (saved && ['zh-CN', 'en-US'].includes(saved)) {
      const normalized = normalizeLocale(saved)
      i18n.global.locale.value = normalized
      console.log('从 localStorage 加载语言:', normalized)
    }
  }

  return {
    currentLocale,
    setLocale,
    loadLocale
  }
})
