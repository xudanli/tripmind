# 硬编码问题分析与解决方案

## 概述

本文档分析了项目中存在的硬编码问题，并提供了系统性的解决方案。

## 一、硬编码问题分类

### 1.1 货币相关硬编码（高优先级）

#### 问题描述
项目中大量使用硬编码的人民币（CNY）作为默认货币，导致：
- 刷新页面后货币信息丢失，显示为人民币
- 无法根据用户位置或目的地自动推断货币
- 代码中散落多处 `{ code: 'CNY', symbol: '¥', name: '人民币' }`

#### 影响文件
- `src/utils/currency.ts` - 3处
- `src/components/TravelDetail/BudgetManager.vue` - 3处
- `src/components/TravelDetail/MemberManagement.vue` - 3处
- `src/components/TravelDetail/ExperienceDay.vue` - 6处
- `src/components/TravelDetail/ExperienceDay/TimeSlotCard.vue` - 1处
- `src/views/TravelListView.vue` - 1处
- `src/components/TravelDetail/ExperienceDay/slotFormatters.ts` - 1处
- `src/App.vue` - 1处
- `src/config/userProfile.ts` - 1处

#### 解决方案

**步骤1：创建统一的默认货币配置**

```typescript
// src/config/currency.ts
import { DEFAULT_VALUES } from '@/utils/travelConstants'
import { getCurrencyByCode } from '@/utils/currency'
import type { CurrencyInfo } from '@/utils/currency'

/**
 * 获取默认货币信息
 * 优先使用用户配置，其次使用系统默认值
 */
export function getDefaultCurrency(): CurrencyInfo {
  // 1. 尝试从用户配置获取
  const userProfile = getUserProfileOrDefault()
  if (userProfile.preferredCurrency) {
    const currency = getCurrencyByCode(userProfile.preferredCurrency)
    if (currency) return currency
  }
  
  // 2. 尝试从系统配置获取
  const systemDefault = DEFAULT_VALUES.DEFAULT_CURRENCY_CODE
  const currency = getCurrencyByCode(systemDefault)
  if (currency) return currency
  
  // 3. 最后使用硬编码的默认值（仅作为后备）
  return { code: 'CNY', symbol: '¥', name: '人民币' }
}

/**
 * 获取默认货币代码
 */
export function getDefaultCurrencyCode(): string {
  return getDefaultCurrency().code
}
```

**步骤2：替换所有硬编码的货币默认值**

将所有 `{ code: 'CNY', symbol: '¥', name: '人民币' }` 替换为 `getDefaultCurrency()`

**步骤3：改进货币推断逻辑**

确保货币推断优先级：
1. 后端返回的货币信息（最准确）
2. 从目的地/位置推断
3. 用户配置的偏好货币
4. 系统默认货币

### 1.2 URL硬编码（中优先级）

#### 问题描述
大量外部服务URL硬编码在代码中，包括：
- 地图服务URL（Google Maps, 高德地图等）
- 预订平台URL（Booking.com, TripAdvisor等）
- API端点URL
- 图片服务URL

#### 影响文件
- `src/utils/travelConstants.ts` - 已部分集中管理
- `src/components/TravelDetail/ExperienceDay.vue` - 多处
- `src/config/visa.ts` - 签证申请URL
- `src/config/api.ts` - API配置（已有环境变量支持）

#### 解决方案

**步骤1：完善URL配置管理**

```typescript
// src/config/urls.ts
export const EXTERNAL_URLS = {
  // 地图服务
  MAPS: {
    GOOGLE: 'https://www.google.com/maps/search/?api=1&query=',
    GAODE: 'https://www.amap.com/search?query=',
    APPLE: 'maps://maps.apple.com/?q=',
  },
  
  // 预订平台
  BOOKING: {
    TRIPADVISOR: 'https://www.tripadvisor.com/Search?q=',
    GETYOURGUIDE: 'https://www.getyourguide.com/s/?q=',
    BOOKING_COM: 'https://www.booking.com/searchresults.html?ss=',
    // ... 其他平台
  },
  
  // 签证服务
  VISA: {
    JAPAN: 'https://www.cn.emb-japan.go.jp/consular/visa_shikaku.htm',
    MALAYSIA: 'https://www.malaysiavisa.com.my/',
    // ... 其他国家
  },
} as const
```

**步骤2：使用环境变量管理可配置URL**

```typescript
// src/config/api.ts (扩展)
export const API_CONFIG = {
  // ... 现有配置
  
  // 外部服务URL（可通过环境变量覆盖）
  EXTERNAL_SERVICES: {
    GOOGLE_MAPS: import.meta.env.VITE_GOOGLE_MAPS_URL || 'https://www.google.com/maps',
    TRIPADVISOR: import.meta.env.VITE_TRIPADVISOR_URL || 'https://www.tripadvisor.com',
    // ... 其他服务
  }
}
```

### 1.3 默认值硬编码（中优先级）

#### 问题描述
各种默认值散落在代码中：
- 默认时长、预算、人数等
- 默认文本、提示信息
- 默认配置参数

#### 解决方案

**步骤1：集中管理默认值**

```typescript
// src/config/defaults.ts
export const DEFAULT_CONFIG = {
  // 行程相关
  TRIP: {
    DEFAULT_DURATION: 5, // 天
    DEFAULT_PARTICIPANTS: 1,
    DEFAULT_BUDGET: 0,
  },
  
  // 活动相关
  ACTIVITY: {
    DEFAULT_DURATION: 60, // 分钟
    DEFAULT_BUFFER_TIME: 15, // 分钟
  },
  
  // 用户相关
  USER: {
    DEFAULT_LANGUAGE: 'zh-CN',
    DEFAULT_CURRENCY: 'CNY',
    DEFAULT_TRANSPORT_MODE: 'public_transit_and_walking',
  },
  
  // UI相关
  UI: {
    MAP_FALLBACK_DELAY: 500, // 毫秒
    DEBOUNCE_DELAY: 300, // 毫秒
  },
} as const
```

**步骤2：从用户配置或系统配置读取**

所有默认值应该：
1. 优先从用户配置读取
2. 其次从系统配置读取
3. 最后使用硬编码的默认值

### 1.4 文本硬编码（低优先级）

#### 问题描述
部分文本直接硬编码在代码中，应该使用i18n

#### 解决方案
- 已使用i18n的地方继续使用
- 未使用i18n的文本迁移到 `src/locales/` 中

## 二、实施计划

### 阶段1：货币硬编码修复（高优先级）✅ 已完成

1. **创建统一配置**
   - [x] 创建 `src/config/currency.ts`
   - [x] 实现 `getDefaultCurrency()` 函数
   - [x] 更新 `src/utils/travelConstants.ts` 中的默认货币配置

2. **替换硬编码**
   - [x] 替换 `src/utils/currency.ts` 中的硬编码
   - [x] 替换 `src/components/TravelDetail/BudgetManager.vue` 中的硬编码
   - [x] 替换 `src/components/TravelDetail/MemberManagement.vue` 中的硬编码
   - [x] 替换 `src/components/TravelDetail/ExperienceDay.vue` 中的硬编码
   - [x] 替换其他文件中的硬编码

3. **测试验证**
   - [ ] 测试刷新后货币信息是否正确
   - [ ] 测试不同目的地的货币推断
   - [ ] 测试用户偏好货币设置

### 阶段2：URL配置优化（中优先级）✅ 已完成

1. **集中管理URL**
   - [x] 创建 `src/config/urls.ts`
   - [x] 迁移所有硬编码URL到配置文件
   - [x] 支持环境变量覆盖

2. **更新引用**
   - [x] 更新 `src/utils/travelConstants.ts` 从 `urls.ts` 重新导出（保持向后兼容）
   - [x] 更新 `src/components/TravelDetail/ExperienceDay.vue` 中的硬编码URL
   - [x] 更新 `src/config/visa.ts` 中的硬编码URL

### 阶段3：默认值集中管理（中优先级）✅ 已完成

1. **创建默认值配置**
   - [x] 创建 `src/config/defaults.ts`
   - [x] 迁移所有硬编码默认值

2. **更新代码**
   - [x] 更新 `src/components/TravelDetail/ExperienceDay.vue` 中的硬编码默认值
   - [x] 更新 `src/components/TravelDetail/DiscussionArea.vue` 中的硬编码默认值
   - [x] 更新 `src/components/TravelDetail/BookingInfo.vue` 中的硬编码默认值
   - [x] 实现从用户配置读取的逻辑
   - [ ] 其他文件中的硬编码默认值（可选，逐步迁移）

### 阶段4：代码清理（低优先级）✅ 已完成

1. **清理TODO注释**
   - [x] 为所有TODO项添加详细说明
   - [x] 标记为未来功能或计划功能
   - [ ] 移除过时的注释（可选，逐步清理）

2. **文档更新**
   - [x] 更新相关文档
   - [x] 添加配置说明（`CONFIGURATION_GUIDE.md`）

## 三、代码示例

### 3.1 货币配置使用示例

**修改前：**
```typescript
// ❌ 硬编码
return { code: 'CNY', symbol: '¥', name: '人民币' }
```

**修改后：**
```typescript
// ✅ 使用配置
import { getDefaultCurrency } from '@/config/currency'
return getDefaultCurrency()
```

### 3.2 URL配置使用示例

**修改前：**
```typescript
// ❌ 硬编码
const url = `https://www.tripadvisor.com/Search?q=${name}`
```

**修改后：**
```typescript
// ✅ 使用配置
import { EXTERNAL_URLS } from '@/config/urls'
const url = `${EXTERNAL_URLS.BOOKING.TRIPADVISOR}${name}`
```

### 3.3 默认值使用示例

**修改前：**
```typescript
// ❌ 硬编码
const duration = 60 // 分钟
```

**修改后：**
```typescript
// ✅ 使用配置
import { DEFAULT_CONFIG } from '@/config/defaults'
const duration = DEFAULT_CONFIG.ACTIVITY.DEFAULT_DURATION
```

## 四、注意事项

1. **向后兼容**
   - 确保修改不影响现有功能
   - 保留必要的后备默认值

2. **性能考虑**
   - 配置读取应该高效
   - 避免频繁读取用户配置

3. **测试覆盖**
   - 每个修改都应该有对应的测试
   - 特别关注边界情况

4. **文档更新**
   - 更新相关API文档
   - 添加配置说明

## 五、优先级总结

| 优先级 | 问题类型 | 影响范围 | 预计工作量 |
|--------|---------|---------|-----------|
| 🔴 高 | 货币硬编码 | 8个文件，18处 | 2-3天 |
| 🟡 中 | URL硬编码 | 多个文件 | 1-2天 |
| 🟡 中 | 默认值硬编码 | 多个文件 | 1-2天 |
| 🟢 低 | 文本硬编码 | 少量文件 | 0.5天 |

## 六、相关文件清单

### 需要修改的文件

**货币相关：**
- `src/utils/currency.ts`
- `src/components/TravelDetail/BudgetManager.vue`
- `src/components/TravelDetail/MemberManagement.vue`
- `src/components/TravelDetail/ExperienceDay.vue`
- `src/components/TravelDetail/ExperienceDay/TimeSlotCard.vue`
- `src/views/TravelListView.vue`
- `src/components/TravelDetail/ExperienceDay/slotFormatters.ts`
- `src/App.vue`
- `src/config/userProfile.ts`

**URL相关：**
- `src/utils/travelConstants.ts` (已有部分管理)
- `src/components/TravelDetail/ExperienceDay.vue`
- `src/config/visa.ts`

**默认值相关：**
- 多个组件文件

### 需要创建的文件

- `src/config/currency.ts` - 货币配置
- `src/config/urls.ts` - URL配置
- `src/config/defaults.ts` - 默认值配置

## 七、后续优化建议

1. **配置中心**
   - 考虑将部分配置迁移到后端
   - 支持动态配置更新

2. **环境变量管理**
   - 完善 `.env` 文件说明
   - 添加配置验证

3. **类型安全**
   - 为所有配置添加TypeScript类型
   - 使用 `as const` 确保类型推断

4. **测试覆盖**
   - 添加配置相关的单元测试
   - 添加集成测试

