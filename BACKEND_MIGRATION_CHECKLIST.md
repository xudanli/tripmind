# 后端迁移检查清单

本文档列出当前在前端实现，但应该迁移到后端的功能。

## 📋 概述

**原则：**
- 业务逻辑应该在后端处理
- 数据验证和修复应该在后端完成
- 复杂计算应该在后端执行
- 前端主要负责展示和用户交互

---

## 🔴 高优先级（必须迁移）

### 1. 数据格式验证和修复

**当前位置：** `src/services/itineraryAPI.ts:278-300`

**问题：**
```typescript
// 前端在验证和修复数据格式
if (typeof apiData.data.totalCost !== 'number') {
  console.warn('[ItineraryAPI] totalCost 格式不正确，尝试转换:', apiData.data.totalCost)
  const parsed = typeof apiData.data.totalCost === 'string' 
    ? parseFloat(apiData.data.totalCost) 
    : Number(apiData.data.totalCost)
  apiData.data.totalCost = isNaN(parsed) ? 0 : parsed
}
```

**应该：**
- 后端在生成数据时就应该确保格式正确
- 后端API应该返回标准化的数据类型
- 前端不应该需要修复后端返回的数据

**迁移建议：**
- 后端在生成行程时验证所有数值字段
- 使用TypeScript类型确保类型安全
- 返回前进行数据清洗和标准化

---

### 2. 总费用计算

**当前位置：** `src/services/itineraryAPI.ts:162-169`

**问题：**
```typescript
// 如果 totalCost 为 0，尝试从 activities 计算总和
if (totalCost === 0 && days.length > 0) {
  totalCost = days.reduce((sum, day) => {
    return sum + day.timeSlots.reduce((daySum, slot) => {
      return daySum + (slot.cost || 0)
    }, 0)
  }, 0)
}
```

**应该：**
- 后端在生成行程时就应该计算好总费用
- 如果后端返回的totalCost为0，说明后端计算有问题
- 前端不应该承担计算总费用的责任

**迁移建议：**
- 后端在生成行程时自动计算totalCost
- 每次更新活动费用时，后端自动重新计算totalCost
- 提供专门的接口用于重新计算总费用

---

### 3. 数据转换逻辑

**当前位置：** `src/services/itineraryAPI.ts:106-178`

**问题：**
```typescript
// 前端将API返回的数据转换为前端格式
export function convertAPIResponseToFrontendFormat(
  apiResponse: GenerateItineraryResponse,
  destination: string
): FrontendItineraryData {
  // 大量的数据转换逻辑
  const days: FrontendItineraryDay[] = data.days.map((day) => ({
    day: day.day,
    date: day.date,
    timeSlots: day.activities.map((activity) => {
      // 字段映射和转换
      cost: typeof activity.cost === 'number' ? activity.cost : (typeof activity.cost === 'string' ? parseFloat(activity.cost) || 0 : 0),
      duration: typeof activity.duration === 'number' ? activity.duration : (typeof activity.duration === 'string' ? parseInt(activity.duration) || 60 : 60)
    })
  }))
}
```

**应该：**
- 后端应该直接返回前端需要的格式
- 或者提供统一的数据格式，减少前端转换
- 类型转换应该在服务端完成

**迁移建议：**
- 统一前后端数据格式规范
- 后端返回标准化的JSON格式
- 减少前端的数据转换逻辑

---

### 4. 货币推断和格式化

**当前位置：** `src/utils/currency.ts:263-345`

**问题：**
```typescript
// 前端根据目的地推断货币
export function getCurrencyForDestination(destination: string): CurrencyInfo {
  // 大量的if-else逻辑判断国家/地区
  if (destination.includes('瑞士') || destination.includes('Switzerland')) {
    return { code: 'CHF', symbol: 'CHF', name: '瑞士法郎' }
  }
  // ... 更多判断
}
```

**应该：**
- 货币推断应该在后端完成
- 后端有更准确的地理位置数据
- 可以维护更完整的货币映射表

**迁移建议：**
- 后端在生成行程时自动推断货币
- 提供货币查询接口
- 后端维护完整的国家-货币映射表

---

## 🟡 中优先级（建议迁移）

### 5. 文本解析逻辑

**当前位置：** `src/components/TravelDetail/ExperienceDay/TimeSlotCard.vue:855-894`

**问题：**
```typescript
// 前端解析开放时间文本
const parseOpeningHours = (text: string): string[] => {
  if (!text) return []
  let cleanText = text.replace(/^开放时间[：:]\s*/, '')
  const items = cleanText.split(/[；;。.\n]/).filter(item => item.trim())
  return items.map(item => item.trim()).filter(Boolean)
}

// 前端解析价格文本
const parsePricing = (text: string): Array<{ label: string; value: string }> => {
  // 解析逻辑
}
```

**应该：**
- 后端在生成数据时就应该结构化存储
- 开放时间应该作为结构化数据返回（如：`{ monday: "9:00-18:00", tuesday: "9:00-18:00" }`）
- 价格应该作为结构化数据返回（如：`{ adult: 92, child: 46, family: 230 }`）

**迁移建议：**
- 后端返回结构化的开放时间数据
- 后端返回结构化的价格数据
- 减少前端文本解析工作

---

### 6. 图片搜索和获取

**当前位置：** `src/services/pexelsAPI.ts`, `src/services/unsplashAPI.ts`, `src/services/istockphotoAPI.ts`

**问题：**
- 前端直接调用第三方图片API
- API密钥可能暴露在前端代码中
- 图片搜索逻辑在前端

**应该：**
- 图片搜索应该通过后端代理
- 后端管理API密钥
- 可以添加图片缓存和CDN

**迁移建议：**
- 创建后端图片搜索接口
- 后端代理所有第三方图片API调用
- 实现图片缓存机制

---

### 7. 位置信息获取和转换

**当前位置：** `src/services/locationAPI.ts:197-242`

**问题：**
```typescript
// 前端将位置信息转换为前端格式
export function convertLocationInfoToDetails(locationInfo: LocationInfo): any {
  return {
    name: {
      chinese: locationInfo.chineseName,
      english: locationInfo.localName,
      local: locationInfo.localName
    },
    // 大量字段映射
  }
}
```

**应该：**
- 后端应该直接返回前端需要的格式
- 减少前端数据转换

**迁移建议：**
- 统一位置信息数据格式
- 后端直接返回标准化格式

---

## 🟢 低优先级（可选迁移）

### 8. 类型图标映射

**当前位置：** `src/components/TravelDetail/ExperienceDay/TimeSlotCard.vue:840-852`

**问题：**
```typescript
// 前端维护类型到图标的映射
const getTypeIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    transport: '✈',
    transportation: '✈',
    attraction: '📍',
    // ...
  }
  return iconMap[type.toLowerCase()] || '📍'
}
```

**应该：**
- 可以保留在前端（UI相关）
- 或者后端返回图标信息

**迁移建议：**
- 如果图标是业务逻辑的一部分，可以移到后端
- 如果只是UI展示，可以保留在前端

---

### 9. 日期计算

**当前位置：** `src/views/SeekerView.vue:413-416`

**问题：**
```typescript
// 前端计算日期
const date = new Date()
date.setDate(date.getDate() + index)
const dateStr = date.toISOString().split('T')[0]
```

**应该：**
- 日期计算可以保留在前端（简单计算）
- 复杂日期逻辑应该在后端

**迁移建议：**
- 简单日期计算可以保留在前端
- 时区处理、节假日等复杂逻辑应该在后端

---

## 📊 总结

### 必须迁移（高优先级）
1. ✅ 数据格式验证和修复
2. ✅ 总费用计算
3. ✅ 数据转换逻辑
4. ✅ 货币推断和格式化

### 建议迁移（中优先级）
5. ⚠️ 文本解析逻辑（改为结构化数据）
6. ⚠️ 图片搜索和获取（通过后端代理）
7. ⚠️ 位置信息转换（统一格式）

### 可选迁移（低优先级）
8. ℹ️ 类型图标映射（UI相关，可保留）
9. ℹ️ 日期计算（简单计算，可保留）

---

## 🎯 迁移优先级建议

**第一阶段（立即）：**
- 数据格式验证和修复
- 总费用计算
- 货币推断

**第二阶段（近期）：**
- 数据转换逻辑统一
- 文本解析改为结构化数据
- 图片API代理

**第三阶段（长期）：**
- 优化数据格式
- 完善缓存机制
- 性能优化

---

## 📝 注意事项

1. **向后兼容**：迁移时要确保不影响现有功能
2. **渐进式迁移**：可以逐步迁移，不需要一次性完成
3. **测试覆盖**：迁移后要确保充分测试
4. **文档更新**：更新API文档和数据格式文档

