// API 配置文件
export const API_CONFIG = {
  // DeepSeek API 配置
  DEEPSEEK_API_KEY: import.meta.env.VITE_DEEPSEEK_API_KEY || '',
  DEEPSEEK_BASE_URL: import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  
  // OpenAI API 配置
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY || '',
  OPENAI_BASE_URL: import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com',
  OPENAI_DEFAULT_MODEL: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
  
  // Unsplash API 配置
  UNSPLASH_ACCESS_KEY: import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '',
  UNSPLASH_SECRET_KEY: import.meta.env.VITE_UNSPLASH_SECRET_KEY || '',
  UNSPLASH_API_URL: import.meta.env.VITE_UNSPLASH_API_URL || 'https://api.unsplash.com',
  PEXELS_API_KEY: import.meta.env.VITE_PEXELS_API_KEY || '',
  PEXELS_API_URL: import.meta.env.VITE_PEXELS_API_URL || 'https://api.pexels.com',
  GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  GOOGLE_MAPS_BASE_URL: import.meta.env.VITE_GOOGLE_MAPS_BASE_URL || 'https://maps.googleapis.com',
  TRIPADVISOR_RAPIDAPI_KEY: import.meta.env.VITE_TRIPADVISOR_RAPIDAPI_KEY || '',
  TRIPADVISOR_RAPIDAPI_HOST: import.meta.env.VITE_TRIPADVISOR_RAPIDAPI_HOST || 'travel-advisor.p.rapidapi.com',
  GETYOURGUIDE_API_KEY: import.meta.env.VITE_GETYOURGUIDE_API_KEY || '',
  EVENTBRITE_API_TOKEN: import.meta.env.VITE_EVENTBRITE_API_TOKEN || '',
  EVENTBRITE_API_URL: import.meta.env.VITE_EVENTBRITE_API_URL || 'https://www.eventbriteapi.com',
  MAPBOX_ACCESS_TOKEN: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '',
  MAPBOX_API_URL: import.meta.env.VITE_MAPBOX_API_URL || 'https://api.mapbox.com',
  
  // 基础URL - 根据环境切换（包含 /api）
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.emotional-travel.com/api',
  
  // API 端点
  ENDPOINTS: {
    DEEPSEEK_CHAT: '/v1/chat/completions',
    OPENAI_CHAT: '/v1/chat/completions',
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
    // Pexels API 端点
    PEXELS_SEARCH: '/v1/search',
    // 旅行攻略 API 端点
    TRAVEL_GUIDES: '/travel-guides',
    TRAVEL_GUIDES_SEARCH: '/travel-guides/search',
    // 签证信息 API 端点
    VISA_INFO: '/visa/info',
    VISA_MULTI_DESTINATION_ANALYSIS: '/visa/multi-destination-analysis',
    VISA_ADMIN_POLICIES: '/visa/admin/policies',
    // 认证相关 API 端点（不包含 /api，因为 BASE_URL 已包含）
    GOOGLE_AUTH: '/auth/google',
    AUTH_PROFILE: '/auth/profile',
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
