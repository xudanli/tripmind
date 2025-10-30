import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import i18n from '@/i18n'

export const useI18nStore = defineStore('i18n', () => {
  // 直接从 i18n 读取当前语言
  const currentLocale = computed({
    get: () => i18n.global.locale.value,
    set: (value: string) => {
      i18n.global.locale.value = value
      localStorage.setItem('preferred-locale', value)
      console.log('语言已切换到:', value)
    }
  })

  const setLocale = (lang: string) => {
    console.log('切换语言:', lang, '当前语言:', currentLocale.value)
    i18n.global.locale.value = lang
    localStorage.setItem('preferred-locale', lang)
    console.log('切换后语言:', i18n.global.locale.value)
  }

  // 从 localStorage 加载语言设置
  const loadLocale = () => {
    const saved = localStorage.getItem('preferred-locale')
    if (saved && ['zh-CN', 'en-US'].includes(saved)) {
      i18n.global.locale.value = saved
      console.log('从 localStorage 加载语言:', saved)
    }
  }

  return {
    currentLocale,
    setLocale,
    loadLocale
  }
})
