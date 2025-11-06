// API 配置文件
export const API_CONFIG = {
  // DeepSeek API 配置
  DEEPSEEK_API_KEY: 'sk-989f235589864c379120c947d4758cac',
  DEEPSEEK_BASE_URL: 'https://api.deepseek.com',
  
  // Unsplash API 配置
  UNSPLASH_ACCESS_KEY: 'EEMmDKUUjc-Dc3uSYHM6hfKnhBKSvVkaFuTXjy1xiQ8',
  UNSPLASH_SECRET_KEY: 'N8-j4rRI2cGZQUy8oqGyPQWtfljPHn1Ub6hGJw37lv8',
  UNSPLASH_API_URL: 'https://api.unsplash.com',
  
  // iStockPhoto (Getty Images) API 配置
  // 注意：iStockPhoto 是 Getty Images 的一部分，需要 API key 和付费订阅
  // 获取 API key: https://developers.gettyimages.com/
  ISTOCKPHOTO_API_KEY: import.meta.env.VITE_ISTOCKPHOTO_API_KEY || '',
  ISTOCKPHOTO_API_SECRET: import.meta.env.VITE_ISTOCKPHOTO_API_SECRET || '',
  ISTOCKPHOTO_API_URL: 'https://api.gettyimages.com/v3',
  
  // 基础URL - 根据环境切换
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.emotional-travel.com',
  
  // API 端点
  ENDPOINTS: {
    DEEPSEEK_CHAT: '/v1/chat/completions',
    DETECT_EMOTION: '/emotional-travel/detect-emotion',
    EMOTIONAL_STATES: '/emotional-travel/emotional-states',
    GENERATE_NARRATIVE: '/emotional-travel/generate-narrative',
    NARRATIVE_EXAMPLES: '/emotional-travel/narrative-examples',
    ADJUST_RHYTHM: '/emotional-travel/adjust-rhythm',
    MATCH_DESTINATIONS: '/emotional-travel/match-destinations',
    GENERATE_PLAN: '/emotional-travel/generate-plan',
    SUBMIT_FEEDBACK: '/emotional-travel/learn-feedback',
    EMOTION_COLORS: '/emotional-travel/emotion-colors',
    TEMPORAL_PERCEPTION: '/emotional-travel/temporal-perception',
    // Unsplash API 端点
    UNSPLASH_SEARCH: '/search/photos',
    // iStockPhoto (Getty Images) API 端点
    ISTOCKPHOTO_SEARCH: '/search/images',
    ISTOCKPHOTO_OAUTH: '/oauth2/token',
    // 旅行攻略 API 端点
    TRAVEL_GUIDES: '/travel-guides',
    TRAVEL_GUIDES_SEARCH: '/travel-guides/search',
    // 图片代理端点（后端需要实现）
    PROXY_ISTOCKPHOTO: '/api/proxy/istockphoto'
  },
  
  // 请求配置
  REQUEST_CONFIG: {
    TIMEOUT: 30000, // 30秒超时
    RETRY_ATTEMPTS: 3, // 重试次数
    RETRY_DELAY: 1000 // 重试延迟（毫秒）
  },
  
  // 情感状态映射
  EMOTION_MAPPING: {
    tired: { color: '#708090', rhythm: 'slow', preference: 'relaxation' },
    joyful: { color: '#FFD700', rhythm: 'fast', preference: 'adventure' },
    peaceful: { color: '#87CEEB', rhythm: 'moderate', preference: 'nature' },
    nostalgic: { color: '#DDA0DD', rhythm: 'slow', preference: 'culture' },
    adventurous: { color: '#FF6347', rhythm: 'fast', preference: 'adventure' },
    romantic: { color: '#FF69B4', rhythm: 'moderate', preference: 'romance' }
  },
  
  // 默认值
  DEFAULTS: {
    EMOTION: 'peaceful',
    INTENSITY: 3,
    DURATION: 5,
    BUDGET: 'comfort'
  }
}
