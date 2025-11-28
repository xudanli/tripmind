# URL和默认值硬编码修复总结

## 修复完成时间
2024年（当前日期）

## 修复概述

已成功修复项目中URL和默认值相关的硬编码问题，统一使用配置化管理。

## 修复内容

### 1. URL配置优化

**文件：** `src/config/urls.ts`

创建了统一的URL配置模块，包括：
- **地图服务URL**：Google Maps、高德地图、百度地图、Apple Maps等
- **预订平台URL**：TripAdvisor、Booking.com、Skyscanner、Expedia等
- **签证服务URL**：各国签证申请网站
- **图片服务URL**：Unsplash等
- **其他服务URL**：IATA、CDC、UNWTO等

**特性：**
- 支持环境变量覆盖（通过 `import.meta.env`）
- 使用 `as const` 确保类型安全
- 统一导出便于访问

**修复的文件：**
1. **src/utils/travelConstants.ts**
   - 从 `urls.ts` 重新导出 `MAP_URLS` 和 `BOOKING_PLATFORMS`
   - 保持向后兼容，不影响现有代码

2. **src/components/TravelDetail/ExperienceDay.vue**
   - 替换硬编码的航班搜索URL（Skyscanner、Google Flights、Expedia、Kayak）
   - 替换硬编码的图片服务URL（Unsplash）
   - 替换硬编码的地区特定平台URL（Tabelog、Naver）

3. **src/config/visa.ts**
   - 替换所有硬编码的签证申请URL（8处）
   - 使用 `VISA_URLS` 常量

### 2. 默认值配置优化

**文件：** `src/config/defaults.ts`

创建了统一的默认值配置模块，包括：
- **行程默认值**：默认天数、参与人数、预算
- **活动默认值**：默认时长、缓冲时间
- **用户默认值**：默认语言、货币、交通方式（支持从用户配置读取）
- **UI默认值**：地图延迟、防抖延迟、分页大小等

**特性：**
- 支持从用户配置读取（通过 `getUserProfileOrDefault()`）
- 使用 getter 函数实现动态读取
- 统一导出便于访问

## 修复统计

### URL硬编码修复
- **修复文件数：** 3个文件
- **修复硬编码处数：** 约15处
- **新增配置模块：** 1个（`src/config/urls.ts`）

### 默认值硬编码修复
- **新增配置模块：** 1个（`src/config/defaults.ts`）
- **支持用户配置读取：** 是

## 修复效果

### URL配置使用示例

**修复前：**
```typescript
// ❌ 硬编码
const url = `https://www.tripadvisor.com/Search?q=${name}`
```

**修复后：**
```typescript
// ✅ 使用配置
import { BOOKING_PLATFORMS } from '@/config/urls'
const url = `${BOOKING_PLATFORMS.TRIPADVISOR}${name}`
```

### 默认值配置使用示例

**修复前：**
```typescript
// ❌ 硬编码
const duration = 60 // 分钟
```

**修复后：**
```typescript
// ✅ 使用配置
import { DEFAULT_CONFIG } from '@/config/defaults'
const duration = DEFAULT_CONFIG.ACTIVITY.DEFAULT_DURATION
```

## 优势

1. **统一管理**：所有URL和默认值都通过统一配置获取
2. **环境变量支持**：URL可以通过环境变量覆盖，便于不同环境使用不同配置
3. **用户配置支持**：默认值支持从用户配置读取，提供个性化体验
4. **向后兼容**：通过重新导出保持向后兼容，不影响现有代码
5. **类型安全**：使用 TypeScript 和 `as const` 确保类型安全

## 后续建议

1. **逐步迁移**
   - 可以逐步将其他文件中的硬编码默认值迁移到 `defaults.ts`
   - 不需要一次性全部迁移，可以在修改相关代码时顺便迁移

2. **环境变量配置**
   - 可以在 `.env` 文件中添加URL配置说明
   - 添加配置验证，确保URL格式正确

3. **测试验证**
   - 测试不同环境变量配置下的URL是否正确
   - 测试用户配置对默认值的影响

## 相关文档

- [硬编码问题分析与解决方案](./HARDCODE_ANALYSIS_AND_SOLUTION.md)
- [货币硬编码修复总结](./CURRENCY_HARDCODE_FIX_SUMMARY.md)

