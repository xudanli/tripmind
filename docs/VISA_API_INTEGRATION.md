# 签证 API 对接说明

## 概述

已根据 `docs/visa-api.md` 文档完成签证相关接口的前端对接。系统支持后端 API 和前端静态数据两种模式，自动切换。

## 已实现的功能

### 1. API 服务 (`src/services/visaAPI.ts`)

实现了以下接口：

- ✅ `getVisaInfo()` - 查询签证信息
- ✅ `analyzeMultiDestinationVisa()` - 多目的地签证分析
- ✅ `getVisaPolicies()` - 获取签证政策列表（管理接口）
- ✅ `createVisaPolicy()` - 创建签证政策（管理接口）
- ✅ `updateVisaPolicy()` - 更新签证政策（管理接口）
- ✅ `deleteVisaPolicy()` - 删除签证政策（管理接口）
- ✅ `getVisaPolicyHistory()` - 获取政策变更历史（管理接口）
- ✅ `checkVisaAPIAvailable()` - 检查后端 API 是否可用

### 2. 配置更新

- ✅ 更新 `src/config/api.ts` 添加签证接口端点
- ✅ 更新 `src/config/visa.ts` 支持后端 API 调用（向后兼容）

### 3. 前端集成

- ✅ 更新 `src/views/TravelDetailView.vue` 支持异步加载签证信息
- ✅ 保持向后兼容，如果后端不可用，自动回退到静态数据

## 环境变量配置

在 `.env.local` 中配置以下变量以启用后端 API：

```bash
# 签证 API 基础地址（可选，如果未设置则使用 VITE_API_BASE_URL）
VITE_VISA_API_BASE_URL=http://localhost:3000/api

# 或者使用通用 API 基础地址
VITE_API_BASE_URL=http://localhost:3000/api

# 或者显式启用签证 API
VITE_USE_VISA_API=true
```

## 使用方式

### 自动切换模式

系统会根据环境变量自动选择使用后端 API 还是静态数据：

1. **如果配置了后端 API 地址**：优先使用后端 API，失败时回退到静态数据
2. **如果未配置后端 API**：直接使用静态数据（同步）

### 在组件中使用

```typescript
import { getVisaInfo } from '@/config/visa'

// 异步调用（如果配置了后端 API）
const visaInfos = await getVisaInfo('JP', 'CN', null)

// 或者同步调用（如果未配置后端 API）
const visaInfos = getVisaInfo('JP', 'CN', null)
```

### 在 TravelDetailView 中的实现

`TravelDetailView.vue` 已经更新为使用异步方式加载签证信息：

```typescript
const visaInfo = ref<VisaInfo | null>(null)
const visaInfoLoading = ref(false)

const loadVisaInfo = async () => {
  // 自动处理异步/同步调用
  const visaInfos = await getVisaInfo(countryCode, nationalityCode, permanentResidencyCode)
  // ...
}

// 监听目的地变化，自动重新加载
watch([destinationCountry, multiDestinationVisaAnalysis], () => {
  loadVisaInfo()
}, { immediate: true })
```

## API 接口说明

### 1. 查询签证信息

```typescript
GET /api/visa/info?destinationCountry=JP&nationalityCode=CN
```

### 2. 多目的地签证分析

```typescript
POST /api/visa/multi-destination-analysis
{
  "destinationCountries": ["JP", "TH", "SG"],
  "nationalityCode": "CN"
}
```

### 3. 管理接口（需要认证）

- `GET /api/visa/admin/policies` - 获取政策列表
- `POST /api/visa/admin/policies` - 创建政策
- `PATCH /api/visa/admin/policies/:id` - 更新政策
- `DELETE /api/visa/admin/policies/:id` - 删除政策
- `GET /api/visa/admin/policies/:id/history` - 获取变更历史

## 向后兼容

系统完全向后兼容：

1. **同步函数保持不变**：
   - `isVisaFreeOrOnArrival()` - 使用静态数据
   - `getVisaDescription()` - 使用静态数据
   - `analyzeMultiDestinationVisa()` - 使用静态数据

2. **异步函数自动回退**：
   - `getVisaInfo()` - 如果后端不可用，自动使用静态数据

## 错误处理

- 后端 API 调用失败时，自动回退到静态数据
- 所有错误都会记录到控制台，便于调试
- 不会因为后端不可用而导致功能完全失效

## 测试建议

1. **测试后端 API 模式**：
   ```bash
   # 在 .env.local 中设置
   VITE_VISA_API_BASE_URL=http://localhost:3000/api
   ```

2. **测试静态数据模式**：
   ```bash
   # 不设置或注释掉 VITE_VISA_API_BASE_URL
   ```

3. **测试回退机制**：
   - 设置后端地址但后端服务未启动
   - 应该自动回退到静态数据，不报错

## 注意事项

1. **类型安全**：`getVisaInfo` 支持同步和异步两种调用方式，TypeScript 会根据环境自动推断类型

2. **性能考虑**：后端 API 调用是异步的，建议在组件中使用 `watch` 或 `onMounted` 来加载数据

3. **数据一致性**：确保后端 API 返回的数据格式与 `VisaInfo` 接口一致

4. **缓存策略**：后端 API 应该实现适当的缓存策略，减少数据库查询

## 后续优化建议

1. 添加请求重试机制
2. 实现请求去重（避免重复请求）
3. 添加请求缓存（前端缓存）
4. 实现加载状态指示器
5. 添加错误提示 UI

