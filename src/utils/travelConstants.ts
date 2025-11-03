/**
 * 旅行组件常量配置
 * 统一管理硬编码的文本、URL、默认值等
 */

// 中文文本常量
export const TEXT_CONSTANTS = {
  // 活动相关
  ESTIMATED_STAY: '预计停留',
  MINUTES: '分钟',
  WALKING: '步行',
  MINUTES_REACHABLE: '分钟可达',
  WALKING_NOT_REACHABLE: '步行不可达',
  BUS: '公交',
  ROUTE: '路',
  BOOKING_REQUIRED: '需',
  BOOKING_ADVANCE_DEFAULT: '提前1天',
  BOOKING_ADVANCE_PREFIX: '提前预订',
  NO_BOOKING_REQUIRED: '无需预订',
  CHILDREN: '儿童',
  PEOPLE_PLUS: '人+',
  DISCOUNT: '折',
  HIGHLIGHTS: '亮点',
  DURATION: '时长',
  COST: '费用',
  TOTAL_COST: '预计总费用',
  
  // 信息字段标签
  TRANSPORTATION: '交通',
  BOOKING: '预订',
  OPENING_HOURS: '开放时间',
  LOCATION: '位置',
  PRE_TRIP_ADVICE: '行前建议',
  DRESS_CODE: '穿搭',
  BEST_TIME: '最佳时段',
  SUITABLE_FOR: '适合',
  PRICING_DETAILS: '费用详情',
  TRANSPORTATION_COST: '交通花费',
  NOT_SUITABLE_FOR: '不适合人群',
  NOTES: '注意事项',
  LOCAL_NAME: '当地名称',
  DETAILED_DESCRIPTION: '详细说明',
  CUISINE_TYPE: '类型',
  SPECIALTY: '特色',
  ATMOSPHERE: '氛围',
  POLITE_PHRASES: '礼貌用语',
  
  // 操作按钮
  NAVIGATE: '导航',
  BOOK: '预订',
  CONTACT: '联系',
  MORE: '更多',
  COLLAPSE: '收起',
  
  // 编辑相关
  ACTIVITY_NAME: '活动名称',
  ACTIVITY_DESCRIPTION: '活动说明',
  ACTIVITY_TYPE: '活动类型',
  SAVE: '保存',
  CANCEL: '取消',
  
  // 活动类型
  ATTRACTION: '景点',
  RESTAURANT: '餐饮',
  ACCOMMODATION: '住宿',
  SHOPPING: '购物',
  TRANSPORT: '交通',
  
  // 默认值
  DEFAULT_INSPIRATION_TITLE: '在风中遇见自己',
  DEFAULT_CORE_INSIGHT: '真正的自由，是在上升与降落之间找到内心的平衡',
  DEFAULT_SUPPORTING_TEXT: '当放手被看见，视角会更轻，信任也会更靠近。',
  DEFAULT_SOURCE: '官方数据',
  DEFAULT_RATING_PLATFORM: 'TripAdvisor',
  NO_ADDRESS_INFO: '暂无地址信息',
  NO_CONTACT_INFO: '暂无联系方式',
  ADDRESS: '地址',
  PHONE: '电话',
  EMAIL: '邮箱',
  WEBSITE: '网站',
  BOOKING_SUGGESTION: '预订建议',
  COMMON_BOOKING_PLATFORMS: '常用预订平台',
  CLOSE: '关闭',
  
  // 旅行建议
  TRAVEL_SUGGESTIONS: '📋 旅行建议',
  BEST_TIME_TO_VISIT: '最佳旅行时间',
  WEATHER_ADVICE: '天气建议',
  PACKING_TIPS: '打包提示',
  LOCAL_TIPS: '当地提示',
  
  // 信息来源
  INFORMATION_SOURCE: '信息来源',
  UPDATED: '更新',
  
  // 评分相关
  REVIEWS: '条',
  
  // 季节提示
  SEASONAL_TIP: '季节提示',
  
  // 其他
  DAY: 'Day',
  ACTIVITY: '活动',
  BOOKING_COM_LABEL: 'Booking.com',
  DIANPING_LABEL: '大众点评',
} as const

// 国家/地区判断关键词
export const COUNTRY_KEYWORDS = {
  CHINA: ['中国', 'China', 'CN'],
} as const

// 地图服务URL模板
export const MAP_URLS = {
  // 中国地图服务
  GAODE_IOS: 'iosamap://search?query=',
  GAODE_ANDROID: 'androidamap://poi?sourceApplication=travel&keywords=',
  GAODE_WEB: 'https://www.amap.com/search?query=',
  BAIDU_ANDROID: 'baidumap://map/search?query=',
  TENCENT_WECHAT: 'https://apis.map.qq.com/uri/v1/search?keyword=',
  APPLE_MAPS: 'maps://maps.apple.com/?q=',
  
  // 海外地图服务
  GOOGLE_MAPS: 'https://www.google.com/maps/search/?api=1&query=',
} as const

// 预订平台URL模板
export const BOOKING_PLATFORMS = {
  TRIPADVISOR: 'https://www.tripadvisor.com/Search?q=',
  BOOKING_COM: 'https://www.booking.com/searchresults.html?ss=',
  DIANPING: 'https://www.dianping.com/search/keyword/',
} as const

// 默认值
export const DEFAULT_VALUES = {
  // 时长计算
  DURATION_BUFFER: 15, // 分钟，用于计算预计停留时长范围
  
  // 货币
  DEFAULT_CURRENCY_COUNTRY: '中国',
  DEFAULT_CURRENCY_CODE: 'CNY',
  
  // 地图超时
  MAP_FALLBACK_DELAY: 500, // 毫秒
  
  // 中国地区默认值
  CHINA_REGION_DEFAULT: '中国',
} as const

// 情绪颜色映射
export const MOOD_COLORS: Record<string, string> = {
  '探索': 'blue',
  '放松': 'green',
  '冒险': 'orange',
  '文化': 'purple',
  '美食': 'red',
  '自然': 'cyan',
  '艺术': 'magenta',
  '期待': 'blue',
  '紧张': 'orange',
}

// 活动类型映射
export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  'attraction': TEXT_CONSTANTS.ATTRACTION,
  'restaurant': TEXT_CONSTANTS.RESTAURANT,
  'accommodation': TEXT_CONSTANTS.ACCOMMODATION,
  'shopping': TEXT_CONSTANTS.SHOPPING,
  'transport': TEXT_CONSTANTS.TRANSPORT,
}

export const ACTIVITY_TYPE_COLORS: Record<string, string> = {
  'attraction': 'blue',
  'restaurant': 'orange',
  'accommodation': 'green',
  'shopping': 'purple',
  'transport': 'cyan',
}

