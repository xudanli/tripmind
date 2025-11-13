import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: {
    'zh': ['zh-CN'],
    'zh-CN': ['zh-CN'],
    'en': ['en-US'],
    'en-US': ['en-US'],
    'default': ['zh-CN']
  },
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
    'zh': zhCN, // 添加 'zh' 作为 'zh-CN' 的别名
    'en': enUS  // 添加 'en' 作为 'en-US' 的别名
  },
  globalInjection: true,
  missingWarn: false, // 禁用缺失键的警告（因为我们有回退处理）
  fallbackWarn: false // 禁用回退警告
})

export default i18n
