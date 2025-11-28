# 后端迁移实施指南 - 第四部分：货币推断和格式化

## 📋 概述

本文档指导后端开发人员如何在后端实现货币推断和格式化功能，确保前端无需进行货币相关的业务逻辑处理。

---

## 🎯 目标

**当前问题：**
- 前端根据目的地字符串推断货币（不准确）
- 前端维护国家-货币映射表
- 前端需要处理货币格式化逻辑
- 货币推断逻辑复杂，容易出错

**目标状态：**
- 后端根据准确的地理位置信息推断货币
- 后端维护完整的国家-货币映射表
- 后端返回标准化的货币信息
- 前端直接使用后端返回的货币信息

---

## 📝 当前前端逻辑

### 前端货币推断逻辑

**文件位置：** `src/utils/currency.ts:263-345`

```typescript
// 前端根据目的地字符串推断货币
export function getCurrencyForDestination(destination: string): CurrencyInfo {
  // 1. 提取国家信息
  const country = extractCountryFromDestination(destination)
  
  // 2. 查找国家-货币映射
  if (country && countryCurrencyMap[country]) {
    return countryCurrencyMap[country]
  }
  
  // 3. 字符串匹配（不准确）
  const normalized = destination.toLowerCase()
  for (const [key, currency] of Object.entries(countryCurrencyMap)) {
    if (normalized.includes(key.toLowerCase())) {
      return currency
    }
  }
  
  // 4. 默认返回人民币
  return { code: 'CNY', symbol: '¥', name: '人民币' }
}
```

### 问题分析

1. **不准确**：基于字符串匹配，容易误判
2. **不完整**：映射表可能不完整
3. **维护困难**：前端代码中维护大量映射关系
4. **无法处理复杂情况**：如多货币国家、特殊地区等

---

## 🔧 实施步骤

### 步骤1：创建货币服务

**文件位置：** `src/services/currencyService.ts`

```typescript
/**
 * 货币服务
 */

/**
 * 国家-货币映射表（完整版）
 */
const COUNTRY_CURRENCY_MAP: Record<string, {
  code: string
  symbol: string
  name: {
    zh: string
    en: string
  }
}> = {
  // 亚洲
  'CN': { code: 'CNY', symbol: '¥', name: { zh: '人民币', en: 'CNY' } },
  'JP': { code: 'JPY', symbol: '¥', name: { zh: '日元', en: 'JPY' } },
  'KR': { code: 'KRW', symbol: '₩', name: { zh: '韩元', en: 'KRW' } },
  'SG': { code: 'SGD', symbol: 'S$', name: { zh: '新加坡元', en: 'SGD' } },
  'MY': { code: 'MYR', symbol: 'RM', name: { zh: '马来西亚林吉特', en: 'MYR' } },
  'TH': { code: 'THB', symbol: '฿', name: { zh: '泰铢', en: 'THB' } },
  'VN': { code: 'VND', symbol: '₫', name: { zh: '越南盾', en: 'VND' } },
  'ID': { code: 'IDR', symbol: 'Rp', name: { zh: '印尼盾', en: 'IDR' } },
  'PH': { code: 'PHP', symbol: '₱', name: { zh: '菲律宾比索', en: 'PHP' } },
  'IN': { code: 'INR', symbol: '₹', name: { zh: '印度卢比', en: 'INR' } },
  'HK': { code: 'HKD', symbol: 'HK$', name: { zh: '港币', en: 'HKD' } },
  'TW': { code: 'TWD', symbol: 'NT$', name: { zh: '新台币', en: 'TWD' } },
  'MO': { code: 'MOP', symbol: 'MOP$', name: { zh: '澳门元', en: 'MOP' } },

  // 欧洲
  'CH': { code: 'CHF', symbol: 'CHF', name: { zh: '瑞士法郎', en: 'CHF' } },
  'GB': { code: 'GBP', symbol: '£', name: { zh: '英镑', en: 'GBP' } },
  'FR': { code: 'EUR', symbol: '€', name: { zh: '欧元', en: 'EUR' } },
  'DE': { code: 'EUR', symbol: '€', name: { zh: '欧元', en: 'EUR' } },
  'IT': { code: 'EUR', symbol: '€', name: { zh: '欧元', en: 'EUR' } },
  'ES': { code: 'EUR', symbol: '€', name: { zh: '欧元', en: 'EUR' } },
  'NL': { code: 'EUR', symbol: '€', name: { zh: '欧元', en: 'EUR' } },
  'BE': { code: 'EUR', symbol: '€', name: { zh: '欧元', en: 'EUR' } },
  'AT': { code: 'EUR', symbol: '€', name: { zh: '欧元', en: 'EUR' } },
  'PT': { code: 'EUR', symbol: '€', name: { zh: '欧元', en: 'EUR' } },
  'GR': { code: 'EUR', symbol: '€', name: { zh: '欧元', en: 'EUR' } },
  'IE': { code: 'EUR', symbol: '€', name: { zh: '欧元', en: 'EUR' } },
  'FI': { code: 'EUR', symbol: '€', name: { zh: '欧元', en: 'EUR' } },
  'DK': { code: 'DKK', symbol: 'kr', name: { zh: '丹麦克朗', en: 'DKK' } },
  'SE': { code: 'SEK', symbol: 'kr', name: { zh: '瑞典克朗', en: 'SEK' } },
  'NO': { code: 'NOK', symbol: 'kr', name: { zh: '挪威克朗', en: 'NOK' } },
  'PL': { code: 'PLN', symbol: 'zł', name: { zh: '波兰兹罗提', en: 'PLN' } },
  'CZ': { code: 'CZK', symbol: 'Kč', name: { zh: '捷克克朗', en: 'CZK' } },
  'HU': { code: 'HUF', symbol: 'Ft', name: { zh: '匈牙利福林', en: 'HUF' } },
  'RU': { code: 'RUB', symbol: '₽', name: { zh: '俄罗斯卢布', en: 'RUB' } },

  // 美洲
  'US': { code: 'USD', symbol: '$', name: { zh: '美元', en: 'USD' } },
  'CA': { code: 'CAD', symbol: 'C$', name: { zh: '加元', en: 'CAD' } },
  'MX': { code: 'MXN', symbol: '$', name: { zh: '墨西哥比索', en: 'MXN' } },
  'BR': { code: 'BRL', symbol: 'R$', name: { zh: '巴西雷亚尔', en: 'BRL' } },
  'AR': { code: 'ARS', symbol: '$', name: { zh: '阿根廷比索', en: 'ARS' } },
  'CL': { code: 'CLP', symbol: '$', name: { zh: '智利比索', en: 'CLP' } },

  // 大洋洲
  'AU': { code: 'AUD', symbol: 'A$', name: { zh: '澳元', en: 'AUD' } },
  'NZ': { code: 'NZD', symbol: 'NZ$', name: { zh: '新西兰元', en: 'NZD' } },

  // 中东
  'AE': { code: 'AED', symbol: 'د.إ', name: { zh: '阿联酋迪拉姆', en: 'AED' } },
  'SA': { code: 'SAR', symbol: '﷼', name: { zh: '沙特里亚尔', en: 'SAR' } },
  'IL': { code: 'ILS', symbol: '₪', name: { zh: '以色列新谢克尔', en: 'ILS' } },
  'TR': { code: 'TRY', symbol: '₺', name: { zh: '土耳其里拉', en: 'TRY' } },

  // 非洲
  'ZA': { code: 'ZAR', symbol: 'R', name: { zh: '南非兰特', en: 'ZAR' } },
  'EG': { code: 'EGP', symbol: 'E£', name: { zh: '埃及镑', en: 'EGP' } },
}

/**
 * 国家名称到ISO代码的映射
 */
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  // 中文名称
  '中国': 'CN',
  '日本': 'JP',
  '韩国': 'KR',
  '新加坡': 'SG',
  '马来西亚': 'MY',
  '泰国': 'TH',
  '越南': 'VN',
  '印度尼西亚': 'ID',
  '菲律宾': 'PH',
  '印度': 'IN',
  '香港': 'HK',
  '台湾': 'TW',
  '澳门': 'MO',
  '瑞士': 'CH',
  '英国': 'GB',
  '法国': 'FR',
  '德国': 'DE',
  '意大利': 'IT',
  '西班牙': 'ES',
  '荷兰': 'NL',
  '比利时': 'BE',
  '奥地利': 'AT',
  '葡萄牙': 'PT',
  '希腊': 'GR',
  '爱尔兰': 'IE',
  '芬兰': 'FI',
  '丹麦': 'DK',
  '瑞典': 'SE',
  '挪威': 'NO',
  '波兰': 'PL',
  '捷克': 'CZ',
  '匈牙利': 'HU',
  '俄罗斯': 'RU',
  '美国': 'US',
  '加拿大': 'CA',
  '墨西哥': 'MX',
  '巴西': 'BR',
  '阿根廷': 'AR',
  '智利': 'CL',
  '澳大利亚': 'AU',
  '新西兰': 'NZ',
  '阿联酋': 'AE',
  '沙特阿拉伯': 'SA',
  '以色列': 'IL',
  '土耳其': 'TR',
  '南非': 'ZA',
  '埃及': 'EG',
  
  // 英文名称
  'China': 'CN',
  'Japan': 'JP',
  'South Korea': 'KR',
  'Korea': 'KR',
  'Singapore': 'SG',
  'Malaysia': 'MY',
  'Thailand': 'TH',
  'Vietnam': 'VN',
  'Indonesia': 'ID',
  'Philippines': 'PH',
  'India': 'IN',
  'Hong Kong': 'HK',
  'Taiwan': 'TW',
  'Macau': 'MO',
  'Switzerland': 'CH',
  'United Kingdom': 'GB',
  'UK': 'GB',
  'France': 'FR',
  'Germany': 'DE',
  'Italy': 'IT',
  'Spain': 'ES',
  'Netherlands': 'NL',
  'Belgium': 'BE',
  'Austria': 'AT',
  'Portugal': 'PT',
  'Greece': 'GR',
  'Ireland': 'IE',
  'Finland': 'FI',
  'Denmark': 'DK',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Poland': 'PL',
  'Czech Republic': 'CZ',
  'Hungary': 'HU',
  'Russia': 'RU',
  'United States': 'US',
  'USA': 'US',
  'Canada': 'CA',
  'Mexico': 'MX',
  'Brazil': 'BR',
  'Argentina': 'AR',
  'Chile': 'CL',
  'Australia': 'AU',
  'New Zealand': 'NZ',
  'United Arab Emirates': 'AE',
  'UAE': 'AE',
  'Saudi Arabia': 'SA',
  'Israel': 'IL',
  'Turkey': 'TR',
  'South Africa': 'ZA',
  'Egypt': 'EG',
}

/**
 * 根据国家代码获取货币信息
 */
export function getCurrencyByCountryCode(countryCode: string, language: string = 'zh'): {
  code: string
  symbol: string
  name: string
} | null {
  const currency = COUNTRY_CURRENCY_MAP[countryCode.toUpperCase()]
  if (!currency) {
    return null
  }

  return {
    code: currency.code,
    symbol: currency.symbol,
    name: language === 'zh' ? currency.name.zh : currency.name.en
  }
}

/**
 * 根据国家名称获取货币信息
 */
export function getCurrencyByCountryName(countryName: string, language: string = 'zh'): {
  code: string
  symbol: string
  name: string
} | null {
  // 1. 尝试直接匹配
  const countryCode = COUNTRY_NAME_TO_CODE[countryName]
  if (countryCode) {
    return getCurrencyByCountryCode(countryCode, language)
  }

  // 2. 尝试不区分大小写匹配
  const normalized = countryName.trim()
  for (const [name, code] of Object.entries(COUNTRY_NAME_TO_CODE)) {
    if (name.toLowerCase() === normalized.toLowerCase()) {
      return getCurrencyByCountryCode(code, language)
    }
  }

  // 3. 尝试包含匹配
  for (const [name, code] of Object.entries(COUNTRY_NAME_TO_CODE)) {
    if (normalized.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(normalized.toLowerCase())) {
      return getCurrencyByCountryCode(code, language)
    }
  }

  return null
}

/**
 * 根据坐标获取货币信息（使用地理编码API）
 */
export async function getCurrencyByCoordinates(
  lat: number,
  lng: number
): Promise<{
  code: string
  symbol: string
  name: string
} | null> {
  try {
    // 使用地理编码API获取国家信息
    // 这里可以使用Google Geocoding API、OpenCage API等
    const countryCode = await reverseGeocode(lat, lng)
    if (countryCode) {
      return getCurrencyByCountryCode(countryCode, 'zh')
    }
  } catch (error) {
    console.error('根据坐标获取货币失败:', error)
  }

  return null
}

/**
 * 根据目的地信息推断货币
 * 优先级：坐标 > 国家代码 > 国家名称 > 默认
 */
export async function inferCurrency(destination: {
  countryCode?: string
  countryName?: string
  coordinates?: { lat: number, lng: number }
  address?: string
}, language: string = 'zh'): Promise<{
  code: string
  symbol: string
  name: string
}> {
  // 优先级1：使用国家代码（最准确）
  if (destination.countryCode) {
    const currency = getCurrencyByCountryCode(destination.countryCode, language)
    if (currency) {
      return currency
    }
  }

  // 优先级2：使用坐标（准确）
  if (destination.coordinates) {
    const currency = await getCurrencyByCoordinates(
      destination.coordinates.lat,
      destination.coordinates.lng
    )
    if (currency) {
      return currency
    }
  }

  // 优先级3：使用国家名称
  if (destination.countryName) {
    const currency = getCurrencyByCountryName(destination.countryName, language)
    if (currency) {
      return currency
    }
  }

  // 优先级4：从地址中提取国家名称
  if (destination.address) {
    // 尝试从地址中提取国家信息
    const countryName = extractCountryFromAddress(destination.address)
    if (countryName) {
      const currency = getCurrencyByCountryName(countryName, language)
      if (currency) {
        return currency
      }
    }
  }

  // 默认返回人民币
  return {
    code: 'CNY',
    symbol: '¥',
    name: language === 'zh' ? '人民币' : 'CNY'
  }
}

/**
 * 格式化金额
 */
export function formatCurrency(
  amount: number,
  currency: { code: string, symbol: string }
): string {
  if (amount == null || isNaN(amount)) {
    return `${currency.symbol}0`
  }

  // 对于日元、韩元、越南盾、印尼盾等小面额货币，不显示小数点
  const noDecimalCurrencies = ['JPY', 'KRW', 'VND', 'IDR']
  if (noDecimalCurrencies.includes(currency.code)) {
    return `${currency.symbol}${Math.round(amount)}`
  }

  // 其他货币保留两位小数
  return `${currency.symbol}${amount.toFixed(2)}`
}
```

---

### 步骤2：在生成行程时自动推断货币

**文件位置：** 行程生成服务

```typescript
import { inferCurrency } from '@/services/currencyService'

/**
 * 生成行程（带货币推断）
 */
export async function generateItinerary(request: {
  destination: string
  // 其他参数...
}): Promise<any> {
  // 1. 调用AI生成行程
  const rawData = await callAIGenerateItinerary(request)

  // 2. 推断货币
  const currency = await inferCurrency({
    countryName: request.destination,
    // 如果有坐标，也可以传入
    coordinates: rawData.coordinates
  })

  // 3. 为行程添加货币信息
  const itinerary = {
    ...rawData,
    currency: currency.code,
    currencyInfo: currency
  }

  // 4. 为每个活动添加货币信息（如果需要）
  if (itinerary.days) {
    itinerary.days = itinerary.days.map((day: any) => ({
      ...day,
      activities: day.activities.map((activity: any) => ({
        ...activity,
        currency: currency.code,
        currencyInfo: currency
      }))
    }))
  }

  return itinerary
}
```

---

### 步骤3：创建货币查询接口

**文件位置：** API路由

```typescript
import { inferCurrency, getCurrencyByCountryCode } from '@/services/currencyService'

/**
 * 查询货币信息
 * GET /api/v1/currency/infer
 * 
 * 查询参数：
 * - countryCode: 国家代码（ISO 3166-1 alpha-2）
 * - countryName: 国家名称
 * - lat: 纬度
 * - lng: 经度
 * - address: 地址
 */
export async function inferCurrencyAPI(req: Request, res: Response) {
  const { countryCode, countryName, lat, lng, address, language = 'zh' } = req.query

  try {
    const currency = await inferCurrency({
      countryCode: countryCode as string,
      countryName: countryName as string,
      coordinates: lat && lng ? {
        lat: parseFloat(lat as string),
        lng: parseFloat(lng as string)
      } : undefined,
      address: address as string
    }, language as string)

    return res.json({
      success: true,
      data: currency
    })
  } catch (error) {
    console.error('推断货币失败:', error)
    return res.status(500).json({
      success: false,
      message: '推断货币失败'
    })
  }
}

/**
 * 根据国家代码获取货币
 * GET /api/v1/currency/:countryCode
 */
export async function getCurrencyByCodeAPI(req: Request, res: Response) {
  const { countryCode } = req.params
  const { language = 'zh' } = req.query

  try {
    const currency = getCurrencyByCountryCode(countryCode, language as string)
    
    if (!currency) {
      return res.status(404).json({
        success: false,
        message: '未找到该国家的货币信息'
      })
    }

    return res.json({
      success: true,
      data: currency
    })
  } catch (error) {
    console.error('获取货币失败:', error)
    return res.status(500).json({
      success: false,
      message: '获取货币失败'
    })
  }
}
```

---

### 步骤4：在行程数据中包含货币信息

**文件位置：** 行程数据结构

```typescript
/**
 * 行程数据结构（包含货币信息）
 */
export interface ItineraryData {
  id?: string
  title: string
  destination: string
  currency: string  // 货币代码，如 'CHF'
  currencyInfo: {   // 货币详细信息
    code: string
    symbol: string
    name: string
  }
  days: ItineraryDay[]
  totalCost: number
  summary: string
}

/**
 * 活动数据结构（包含货币信息）
 */
export interface TimeSlot {
  // ... 其他字段
  cost: number
  currency?: string  // 如果活动使用不同货币
  currencyInfo?: {   // 货币详细信息
    code: string
    symbol: string
    name: string
  }
}
```

---

### 步骤5：更新数据库模型

**文件位置：** 数据库模型

```typescript
// MongoDB示例
const ItinerarySchema = new mongoose.Schema({
  title: { type: String, required: true },
  destination: { type: String, required: true },
  currency: { type: String, required: true, default: 'CNY' },  // 货币代码
  currencyInfo: {
    code: { type: String, required: true },
    symbol: { type: String, required: true },
    name: { type: String, required: true }
  },
  days: [ItineraryDaySchema],
  totalCost: { type: Number, default: 0 },
  summary: { type: String, default: '' }
})
```

---

## ✅ 验证清单

完成实施后，确保以下场景都能正确处理：

- [ ] 根据国家代码推断货币正确
- [ ] 根据国家名称推断货币正确
- [ ] 根据坐标推断货币正确
- [ ] 从地址中提取国家信息正确
- [ ] 生成行程时自动推断货币
- [ ] 行程数据中包含货币信息
- [ ] 货币查询接口正常工作
- [ ] 支持多语言货币名称
- [ ] 处理边界情况（未知国家、无效坐标等）

---

## 📊 测试用例

```typescript
describe('货币推断', () => {
  it('应该根据国家代码推断货币', async () => {
    const currency = await inferCurrency({
      countryCode: 'CH'
    })
    expect(currency.code).toBe('CHF')
    expect(currency.symbol).toBe('CHF')
  })

  it('应该根据国家名称推断货币', async () => {
    const currency = await inferCurrency({
      countryName: '瑞士'
    })
    expect(currency.code).toBe('CHF')
  })

  it('应该根据坐标推断货币', async () => {
    const currency = await inferCurrency({
      coordinates: { lat: 46.8182, lng: 8.2275 }  // 瑞士坐标
    })
    expect(currency.code).toBe('CHF')
  })

  it('应该处理未知国家', async () => {
    const currency = await inferCurrency({
      countryName: '未知国家'
    })
    expect(currency.code).toBe('CNY')  // 默认返回人民币
  })
})
```

---

## 🚀 部署建议

1. **数据维护**：
   - 将国家-货币映射表存储在数据库中，便于维护
   - 可以创建管理界面，方便更新映射关系

2. **性能优化**：
   - 缓存货币推断结果
   - 对于常见国家，可以直接返回，无需查询

3. **扩展性**：
   - 支持多货币国家（如某些国家同时使用多种货币）
   - 支持历史货币（如某些国家曾经使用过的货币）

---

## 📝 总结

完成货币推断和格式化后，所有高优先级迁移任务已完成：

- [第一部分：数据格式验证和修复](./BACKEND_MIGRATION_GUIDE_PART1.md) ✅
- [第二部分：总费用计算](./BACKEND_MIGRATION_GUIDE_PART2.md) ✅
- [第三部分：数据转换逻辑统一](./BACKEND_MIGRATION_GUIDE_PART3.md) ✅
- [第四部分：货币推断和格式化](./BACKEND_MIGRATION_GUIDE_PART4.md) ✅

所有高优先级迁移任务已完成！前端可以移除相应的业务逻辑代码，直接使用后端返回的数据。

