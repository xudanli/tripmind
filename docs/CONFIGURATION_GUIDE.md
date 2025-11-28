# 配置管理指南

## 概述

本文档说明项目中新增的配置管理模块的使用方法和最佳实践。

## 配置模块

### 1. 货币配置 (`src/config/currency.ts`)

统一管理默认货币，避免硬编码。

#### 使用方法

```typescript
import { getDefaultCurrency, getDefaultCurrencyCode } from '@/config/currency'

// 获取默认货币信息
const currency = getDefaultCurrency()
// 返回: { code: 'CNY', symbol: '¥', name: '人民币' }

// 获取默认货币代码
const currencyCode = getDefaultCurrencyCode()
// 返回: 'CNY'
```

#### 优先级

1. 用户配置的偏好货币（`userProfile.preferredCurrency`）
2. 系统默认货币（`DEFAULT_VALUES.DEFAULT_CURRENCY_CODE`）
3. 硬编码的后备值（仅作为最后的后备方案）

#### 配置方式

**用户偏好货币：**
- 通过用户设置页面配置
- 存储在 `localStorage` 中的 `user_profile`

**系统默认货币：**
- 修改 `src/utils/travelConstants.ts` 中的 `DEFAULT_CURRENCY_CODE`
- 或通过环境变量配置（如果支持）

### 2. URL配置 (`src/config/urls.ts`)

统一管理所有外部服务的URL，支持环境变量覆盖。

#### 使用方法

```typescript
import { EXTERNAL_URLS, MAP_URLS, BOOKING_PLATFORMS, VISA_URLS } from '@/config/urls'

// 使用地图服务URL
const googleMapsUrl = `${MAP_URLS.GOOGLE_MAPS}${locationName}`

// 使用预订平台URL
const tripAdvisorUrl = `${BOOKING_PLATFORMS.TRIPADVISOR}${activityName}`

// 使用签证服务URL
const japanVisaUrl = VISA_URLS.JAPAN
```

#### 环境变量支持

所有URL都支持通过环境变量覆盖：

```bash
# .env
VITE_GOOGLE_MAPS_URL=https://maps.google.com
VITE_TRIPADVISOR_URL=https://www.tripadvisor.com
VITE_BOOKING_COM_URL=https://www.booking.com
```

#### 配置结构

```typescript
export const EXTERNAL_URLS = {
  MAPS: MAP_URLS,           // 地图服务
  BOOKING: BOOKING_PLATFORMS, // 预订平台
  VISA: VISA_URLS,          // 签证服务
  IMAGES: IMAGE_SERVICES,    // 图片服务
  OTHER: OTHER_SERVICES,     // 其他服务
}
```

### 3. 默认值配置 (`src/config/defaults.ts`)

统一管理所有默认值，支持从用户配置读取。

#### 使用方法

```typescript
import { DEFAULT_CONFIG } from '@/config/defaults'

// 行程默认值
const defaultDuration = DEFAULT_CONFIG.TRIP.DEFAULT_DURATION // 5天
const defaultParticipants = DEFAULT_CONFIG.TRIP.DEFAULT_PARTICIPANTS // 1人
const defaultBudget = DEFAULT_CONFIG.TRIP.DEFAULT_BUDGET // 0

// 活动默认值
const defaultActivityDuration = DEFAULT_CONFIG.ACTIVITY.DEFAULT_DURATION // 60分钟
const defaultBufferTime = DEFAULT_CONFIG.ACTIVITY.DEFAULT_BUFFER_TIME // 15分钟

// 用户默认值（支持从用户配置读取）
const defaultLanguage = DEFAULT_CONFIG.USER.DEFAULT_LANGUAGE // 'zh-CN'
const defaultCurrency = DEFAULT_CONFIG.USER.DEFAULT_CURRENCY // 'CNY'
const defaultTransportMode = DEFAULT_CONFIG.USER.DEFAULT_TRANSPORT_MODE

// UI默认值
const mapFallbackDelay = DEFAULT_CONFIG.UI.MAP_FALLBACK_DELAY // 500毫秒
const debounceDelay = DEFAULT_CONFIG.UI.DEFAULT_DEBOUNCE_DELAY // 300毫秒
```

#### 用户配置支持

部分默认值支持从用户配置读取：

- `DEFAULT_LANGUAGE`: 从 `userProfile.interfaceLanguage` 读取
- `DEFAULT_CURRENCY`: 从 `userProfile.preferredCurrency` 读取
- `DEFAULT_TRANSPORT_MODE`: 从 `userProfile.preferredTransportMode` 读取

#### 配置方式

**用户配置：**
- 通过用户设置页面配置
- 存储在 `localStorage` 中的 `user_profile`

**系统默认值：**
- 修改 `src/config/defaults.ts` 中的默认值
- 或修改 `src/utils/travelConstants.ts` 中的相关常量

## 最佳实践

### 1. 使用配置而非硬编码

**❌ 错误示例：**
```typescript
const currency = { code: 'CNY', symbol: '¥', name: '人民币' }
const url = 'https://www.tripadvisor.com/Search?q='
const duration = 60
```

**✅ 正确示例：**
```typescript
import { getDefaultCurrency } from '@/config/currency'
import { BOOKING_PLATFORMS } from '@/config/urls'
import { DEFAULT_CONFIG } from '@/config/defaults'

const currency = getDefaultCurrency()
const url = `${BOOKING_PLATFORMS.TRIPADVISOR}`
const duration = DEFAULT_CONFIG.ACTIVITY.DEFAULT_DURATION
```

### 2. 优先使用用户配置

所有配置都应该：
1. 优先从用户配置读取
2. 其次从系统配置读取
3. 最后使用硬编码的后备值

### 3. 保持向后兼容

- 通过重新导出保持向后兼容（如 `travelConstants.ts` 从 `urls.ts` 重新导出）
- 避免破坏现有代码的导入路径

### 4. 类型安全

- 使用 TypeScript 类型定义
- 使用 `as const` 确保类型推断
- 为配置添加 JSDoc 注释

## 环境变量配置

### 支持的环境变量

**URL配置：**
- `VITE_GOOGLE_MAPS_URL` - Google Maps URL
- `VITE_TRIPADVISOR_URL` - TripAdvisor URL
- `VITE_BOOKING_COM_URL` - Booking.com URL
- `VITE_SKYSCANNER_URL` - Skyscanner URL
- `VITE_EXPEDIA_URL` - Expedia URL
- `VITE_KAYAK_URL` - Kayak URL
- 更多URL配置见 `src/config/urls.ts`

### 配置示例

```bash
# .env.development
VITE_GOOGLE_MAPS_URL=https://maps.google.com
VITE_TRIPADVISOR_URL=https://www.tripadvisor.com

# .env.production
VITE_GOOGLE_MAPS_URL=https://maps.google.com
VITE_TRIPADVISOR_URL=https://www.tripadvisor.com
```

## 迁移指南

### 从硬编码迁移到配置

**步骤1：识别硬编码**
- 搜索代码中的硬编码值（如 `'CNY'`, `'https://...'`, `60` 等）
- 确定应该使用哪个配置模块

**步骤2：导入配置**
```typescript
// 根据需要使用相应的配置
import { getDefaultCurrency } from '@/config/currency'
import { BOOKING_PLATFORMS } from '@/config/urls'
import { DEFAULT_CONFIG } from '@/config/defaults'
```

**步骤3：替换硬编码**
```typescript
// 替换前
const currency = { code: 'CNY', symbol: '¥', name: '人民币' }

// 替换后
const currency = getDefaultCurrency()
```

**步骤4：测试验证**
- 测试配置是否正确读取
- 测试用户配置是否生效
- 测试环境变量是否生效

## 常见问题

### Q: 如何修改系统默认货币？

A: 修改 `src/utils/travelConstants.ts` 中的 `DEFAULT_CURRENCY_CODE`，或通过用户设置页面配置用户偏好货币。

### Q: 如何添加新的URL配置？

A: 在 `src/config/urls.ts` 中添加新的URL常量，支持通过环境变量覆盖。

### Q: 如何添加新的默认值？

A: 在 `src/config/defaults.ts` 中添加新的默认值，支持从用户配置读取。

### Q: 配置修改后需要重启吗？

A: 是的，修改配置文件后需要重启开发服务器。

## 相关文档

- [硬编码问题分析与解决方案](./HARDCODE_ANALYSIS_AND_SOLUTION.md)
- [货币硬编码修复总结](./CURRENCY_HARDCODE_FIX_SUMMARY.md)
- [URL和默认值硬编码修复总结](./URL_AND_DEFAULTS_FIX_SUMMARY.md)
- [默认值硬编码修复总结](./DEFAULTS_FIX_SUMMARY.md)

