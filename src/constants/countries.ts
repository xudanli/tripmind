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
  }
}
