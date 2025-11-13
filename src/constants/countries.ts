/**
 * 国家配置常量
 */

import type { CountryInfo } from '@/types/location'

export const PRESET_COUNTRIES: Record<string, CountryInfo> = {
  // 中国
  'CN': { 
    name: '中国', 
    code: 'CN', 
    flag: '🇨🇳',
    currency: 'CNY',
    language: '中文'
  },
  
  // 美国
  'US': { 
    name: '美国', 
    code: 'US', 
    flag: '🇺🇸',
    currency: 'USD',
    language: '英语'
  },
  
  // 日本
  'JP': { 
    name: '日本', 
    code: 'JP', 
    flag: '🇯🇵',
    currency: 'JPY',
    language: '日语'
  },
  
  // 韩国
  'KR': { 
    name: '韩国', 
    code: 'KR', 
    flag: '🇰🇷',
    currency: 'KRW',
    language: '韩语'
  },
  
  // 新加坡
  'SG': { 
    name: '新加坡', 
    code: 'SG', 
    flag: '🇸🇬',
    currency: 'SGD',
    language: '英语'
  },
  
  // 泰国
  'TH': { 
    name: '泰国', 
    code: 'TH', 
    flag: '🇹🇭',
    currency: 'THB',
    language: '泰语'
  },
  
  // 马来西亚
  'MY': { 
    name: '马来西亚', 
    code: 'MY', 
    flag: '🇲🇾',
    currency: 'MYR',
    language: '马来语'
  },
  
  // 印度尼西亚
  'ID': { 
    name: '印度尼西亚', 
    code: 'ID', 
    flag: '🇮🇩',
    currency: 'IDR',
    language: '印尼语'
  },
  
  // 越南
  'VN': { 
    name: '越南', 
    code: 'VN', 
    flag: '🇻🇳',
    currency: 'VND',
    language: '越南语'
  },
  
  // 菲律宾
  'PH': { 
    name: '菲律宾', 
    code: 'PH', 
    flag: '🇵🇭',
    currency: 'PHP',
    language: '菲律宾语'
  },
  
  // 澳大利亚
  'AU': { 
    name: '澳大利亚', 
    code: 'AU', 
    flag: '🇦🇺',
    currency: 'AUD',
    language: '英语'
  },
  
  // 加拿大
  'CA': { 
    name: '加拿大', 
    code: 'CA', 
    flag: '🇨🇦',
    currency: 'CAD',
    language: '英语/法语'
  },
  
  // 新西兰
  'NZ': { 
    name: '新西兰', 
    code: 'NZ', 
    flag: '🇳🇿',
    currency: 'NZD',
    language: '英语'
  },
  
  // 英国
  'GB': { 
    name: '英国', 
    code: 'GB', 
    flag: '🇬🇧',
    currency: 'GBP',
    language: '英语'
  },
  
  // 法国
  'FR': { 
    name: '法国', 
    code: 'FR', 
    flag: '🇫🇷',
    currency: 'EUR',
    language: '法语'
  },
  
  // 意大利
  'IT': { 
    name: '意大利', 
    code: 'IT', 
    flag: '🇮🇹',
    currency: 'EUR',
    language: '意大利语'
  },
  
  // 德国
  'DE': { 
    name: '德国', 
    code: 'DE', 
    flag: '🇩🇪',
    currency: 'EUR',
    language: '德语'
  },
  
  // 西班牙
  'ES': { 
    name: '西班牙', 
    code: 'ES', 
    flag: '🇪🇸',
    currency: 'EUR',
    language: '西班牙语'
  },
  
  // 芬兰
  'FI': { 
    name: '芬兰', 
    code: 'FI', 
    flag: '🇫🇮',
    currency: 'EUR',
    language: '芬兰语'
  },
  
  // 冰岛
  'IS': { 
    name: '冰岛', 
    code: 'IS', 
    flag: '🇮🇸',
    currency: 'ISK',
    language: '冰岛语'
  },
  
  // 中国台湾
  'TW': { 
    name: '中国台湾', 
    code: 'TW', 
    flag: '🇹🇼',
    currency: 'TWD',
    language: '中文'
  },
  
  // 中国香港
  'HK': { 
    name: '中国香港', 
    code: 'HK', 
    flag: '🇭🇰',
    currency: 'HKD',
    language: '中文'
  },
  
  // 中国澳门
  'MO': { 
    name: '中国澳门', 
    code: 'MO', 
    flag: '🇲🇴',
    currency: 'MOP',
    language: '中文'
  },
  
  // 埃及
  'EG': { 
    name: '埃及', 
    code: 'EG', 
    flag: '🇪🇬',
    currency: 'EGP',
    language: '阿拉伯语'
  },

  // ================== 补充常见旅行目的地 ==================

  // 瑞士
  'CH': {
    name: '瑞士',
    code: 'CH',
    flag: '🇨🇭',
    currency: 'CHF',
    language: '德语/法语/意大利语'
  },

  // 奥地利
  'AT': {
    name: '奥地利',
    code: 'AT',
    flag: '🇦🇹',
    currency: 'EUR',
    language: '德语'
  },

  // 荷兰
  'NL': {
    name: '荷兰',
    code: 'NL',
    flag: '🇳🇱',
    currency: 'EUR',
    language: '荷兰语'
  },

  // 比利时
  'BE': {
    name: '比利时',
    code: 'BE',
    flag: '🇧🇪',
    currency: 'EUR',
    language: '荷兰语/法语/德语'
  },

  // 葡萄牙
  'PT': {
    name: '葡萄牙',
    code: 'PT',
    flag: '🇵🇹',
    currency: 'EUR',
    language: '葡萄牙语'
  },

  // 希腊
  'GR': {
    name: '希腊',
    code: 'GR',
    flag: '🇬🇷',
    currency: 'EUR',
    language: '希腊语'
  },

  // 土耳其
  'TR': {
    name: '土耳其',
    code: 'TR',
    flag: '🇹🇷',
    currency: 'TRY',
    language: '土耳其语'
  },

  // 阿联酋
  'AE': {
    name: '阿联酋',
    code: 'AE',
    flag: '🇦🇪',
    currency: 'AED',
    language: '阿拉伯语'
  },

  // 沙特阿拉伯
  'SA': {
    name: '沙特阿拉伯',
    code: 'SA',
    flag: '🇸🇦',
    currency: 'SAR',
    language: '阿拉伯语'
  },

  // 挪威
  'NO': {
    name: '挪威',
    code: 'NO',
    flag: '🇳🇴',
    currency: 'NOK',
    language: '挪威语'
  },

  // 瑞典
  'SE': {
    name: '瑞典',
    code: 'SE',
    flag: '🇸🇪',
    currency: 'SEK',
    language: '瑞典语'
  },

  // 丹麦
  'DK': {
    name: '丹麦',
    code: 'DK',
    flag: '🇩🇰',
    currency: 'DKK',
    language: '丹麦语'
  },

  // 捷克
  'CZ': {
    name: '捷克',
    code: 'CZ',
    flag: '🇨🇿',
    currency: 'CZK',
    language: '捷克语'
  },

  // 匈牙利
  'HU': {
    name: '匈牙利',
    code: 'HU',
    flag: '🇭🇺',
    currency: 'HUF',
    language: '匈牙利语'
  },

  // 印度
  'IN': {
    name: '印度',
    code: 'IN',
    flag: '🇮🇳',
    currency: 'INR',
    language: '印地语/英语'
  },

  // 尼泊尔
  'NP': {
    name: '尼泊尔',
    code: 'NP',
    flag: '🇳🇵',
    currency: 'NPR',
    language: '尼泊尔语'
  },

  // 斯里兰卡
  'LK': {
    name: '斯里兰卡',
    code: 'LK',
    flag: '🇱🇰',
    currency: 'LKR',
    language: '僧伽罗语/英语'
  },

  // 摩洛哥
  'MA': {
    name: '摩洛哥',
    code: 'MA',
    flag: '🇲🇦',
    currency: 'MAD',
    language: '阿拉伯语/法语'
  },

  // 南非
  'ZA': {
    name: '南非',
    code: 'ZA',
    flag: '🇿🇦',
    currency: 'ZAR',
    language: '英语'
  },

  // 巴西
  'BR': {
    name: '巴西',
    code: 'BR',
    flag: '🇧🇷',
    currency: 'BRL',
    language: '葡萄牙语'
  },

  // 墨西哥
  'MX': {
    name: '墨西哥',
    code: 'MX',
    flag: '🇲🇽',
    currency: 'MXN',
    language: '西班牙语'
  },

  // 阿根廷
  'AR': {
    name: '阿根廷',
    code: 'AR',
    flag: '🇦🇷',
    currency: 'ARS',
    language: '西班牙语'
  },

  // 智利
  'CL': {
    name: '智利',
    code: 'CL',
    flag: '🇨🇱',
    currency: 'CLP',
    language: '西班牙语'
  },

  // 秘鲁
  'PE': {
    name: '秘鲁',
    code: 'PE',
    flag: '🇵🇪',
    currency: 'PEN',
    language: '西班牙语'
  }
}
