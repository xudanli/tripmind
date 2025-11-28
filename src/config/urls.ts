/**
 * 外部服务URL配置
 * 统一管理所有外部服务的URL，支持环境变量覆盖
 */

// 从环境变量读取，如果没有则使用默认值
const getEnvUrl = (key: string, defaultValue: string): string => {
  return import.meta.env[key] || defaultValue
}

/**
 * 地图服务URL
 */
export const MAP_URLS = {
  // Google Maps
  GOOGLE_MAPS: getEnvUrl('VITE_GOOGLE_MAPS_URL', 'https://www.google.com/maps/search/?api=1&query='),
  GOOGLE_FLIGHTS: getEnvUrl('VITE_GOOGLE_FLIGHTS_URL', 'https://www.google.com/travel/flights?q='),
  
  // 高德地图（中国）
  GAODE_WEB: getEnvUrl('VITE_GAODE_MAPS_URL', 'https://www.amap.com/search?query='),
  GAODE_IOS: 'iosamap://search?query=',
  GAODE_ANDROID: 'androidamap://poi?sourceApplication=travel&keywords=',
  
  // 百度地图（中国）
  BAIDU_ANDROID: 'baidumap://map/search?query=',
  
  // 腾讯地图（中国）
  TENCENT_WECHAT: 'https://apis.map.qq.com/uri/v1/search?keyword=',
  
  // Apple Maps
  APPLE_MAPS: 'maps://maps.apple.com/?q=',
} as const

/**
 * 预订平台URL
 */
export const BOOKING_PLATFORMS = {
  // 景点/活动预订
  TRIPADVISOR: getEnvUrl('VITE_TRIPADVISOR_URL', 'https://www.tripadvisor.com/Search?q='),
  GETYOURGUIDE: getEnvUrl('VITE_GETYOURGUIDE_URL', 'https://www.getyourguide.com/s/?q='),
  VIATOR: getEnvUrl('VITE_VIATOR_URL', 'https://www.viator.com/searchResults/all?text='),
  DIANPING: getEnvUrl('VITE_DIANPING_URL', 'https://www.dianping.com/search?keyword='),
  
  // 住宿预订
  BOOKING_COM: getEnvUrl('VITE_BOOKING_COM_URL', 'https://www.booking.com/searchresults.html?ss='),
  AGODA: getEnvUrl('VITE_AGODA_URL', 'https://www.agoda.com/search?city='),
  AIRBNB: getEnvUrl('VITE_AIRBNB_URL', 'https://www.airbnb.com/s/'),
  
  // 交通/机票预订
  SKYSCANNER: getEnvUrl('VITE_SKYSCANNER_URL', 'https://www.skyscanner.com/transport/flights/'),
  EXPEDIA: getEnvUrl('VITE_EXPEDIA_URL', 'https://www.expedia.com/Flights-Search?destination='),
  KAYAK: getEnvUrl('VITE_KAYAK_URL', 'https://www.kayak.com/flights/'),
  
  // 地区特定平台
  TABELOG: 'https://tabelog.com/tw/search/?sa=&sk=', // 日本餐厅
  NAVER: 'https://search.naver.com/search.naver?query=', // 韩国搜索
} as const

/**
 * 签证服务URL
 */
export const VISA_URLS = {
  JAPAN: 'https://www.cn.emb-japan.go.jp/consular/visa_shikaku.htm',
  MALAYSIA: 'https://www.malaysiavisa.com.my/',
  VIETNAM: 'https://evisa.xuatnhapcanh.gov.vn/',
  USA: 'https://www.ustraveldocs.com/cn_zh/',
  TURKEY: 'https://www.evisa.gov.tr/',
  AUSTRALIA: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing',
  AUSTRALIA_ETA: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/electronic-travel-authority-601',
  ICELAND: 'https://www.schengenvisainfo.com/zh/iceland-visa/',
} as const

/**
 * 图片服务URL
 */
export const IMAGE_SERVICES = {
  UNSPLASH: getEnvUrl('VITE_UNSPLASH_URL', 'https://source.unsplash.com/1600x450/?'),
  UNSPLASH_TRAVEL: 'https://source.unsplash.com/1600x450/?travel',
} as const

/**
 * 其他外部服务URL
 */
export const OTHER_SERVICES = {
  // 准备清单相关
  ARGENTINA_MIGRATION: 'https://www.argentina.gob.ar/interior/migraciones',
  CHILE_CONSULAR: 'https://tramites.minrel.gov.cl/',
  IATA_TRAVEL_CENTRE: 'https://www.iatatravelcentre.com/',
  AEROLINEAS_ARGENTINAS: 'https://www.aerolineas.com.ar/en-ar',
  LATAM_AIRLINES: 'https://www.latamairlines.com/',
  IAATO_MEMBER_OPERATOR: 'https://iaato.org/travel-to-antarctica/find-a-member-operator/',
  IAATO_TRAVEL_INSURANCE: 'https://iaato.org/travel-to-antarctica/travel-insurance/',
  IAATO_PACKING_LIST: 'https://iaato.org/travel-to-antarctica/packing-list/',
  CDC_ANTARCTICA: 'https://wwwnc.cdc.gov/travel/destinations/traveler/none/antarctica',
  OAG_BAGGAGE: 'https://www.oag.com/baggage-allowance',
  UNWTO: 'https://www.unwto.org/tourism-data/unwto-tourism-dashboard',
  US_STATE_DEPT: 'https://travel.state.gov/content/travel/en/international-travel.html',
  WMO_CLIMATE: 'https://public.wmo.int/en/our-mandate/climate',
  CHINA_MFA: 'https://cs.mfa.gov.cn/',
} as const

/**
 * 导出所有URL配置（便于统一访问）
 */
export const EXTERNAL_URLS = {
  MAPS: MAP_URLS,
  BOOKING: BOOKING_PLATFORMS,
  VISA: VISA_URLS,
  IMAGES: IMAGE_SERVICES,
  OTHER: OTHER_SERVICES,
} as const

