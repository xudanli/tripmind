/**
 * 灵感模式核心工具模块 - 向后兼容入口
 * 
 * 本文件已重构为模块化结构，所有功能已迁移到 /core 目录
 * 此处仅作为向后兼容的导出入口
 * 
 * @deprecated 建议直接使用 @/utils/inspiration/core 中的模块
 */

// 重新导出所有核心模块的功能，保持向后兼容
export {
  // 语言工具
  pickLang,
  isLangEnglish,
  buildDestinationConstraint,
  LanguageUtils,
  
  // JSON 处理
  parseJSONSafe,
  extractJSONObjectOrArray,
  JSONProcessor,
  
  // 意图处理
  buildIntentOptionsPrompt,
  IntentProcessor,
  INTENTS,
  
  // 推荐系统
  normalizeRecommendations,
  fallbackRecommendations,
  RecommendationProcessor,
  
  // 校验器
  validateInspirationItinerary,
  Validator,
  
  // DeepSeek API
  askDeepSeek,
  
  // 日志工具
  logger,
  LoggingAdapter,
  
  // 参考目录
  buildReferenceCatalog,
  
  // 类型定义
  type Recommendation,
  type ValidationResult,
  type ReferenceCatalogResult,
  type ParseOptions,
  type IntentType,
  type I18nTemplate,
  type Language,
  type LangCode
} from './inspiration/core'
