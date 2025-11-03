/**
 * 灵感模式核心工具模块 - 统一导出
 * 模块化重构版本
 */

// ==================== 语言工具 ====================
export { 
  LanguageUtils,
  pickLang,
  isLangEnglish,
  buildDestinationConstraint,
  type I18nTemplate,
  type Language,
  type LangCode
} from './language'

// ==================== JSON 处理 ====================
export {
  JSONProcessor,
  parseJSONSafe,
  extractJSONObjectOrArray,
  type ParseOptions
} from './jsonProcessor'

// ==================== 意图处理 ====================
export {
  IntentProcessor,
  buildIntentOptionsPrompt,
  INTENTS,
  type IntentType
} from './intent'

// ==================== 推荐系统 ====================
export {
  RecommendationProcessor,
  normalizeRecommendations,
  fallbackRecommendations,
  type Recommendation
} from './recommendation'

// ==================== 校验器 ====================
export {
  Validator,
  validateInspirationItinerary,
  type ValidationResult
} from './validator'

// ==================== DeepSeek API ====================
export {
  askDeepSeek
} from './deepseek'

// ==================== 日志工具 ====================
export {
  LoggingAdapter,
  logger
} from './logger'

// ==================== 参考目录构建 ====================
export { buildReferenceCatalog, type ReferenceCatalogResult } from './referenceCatalog'

