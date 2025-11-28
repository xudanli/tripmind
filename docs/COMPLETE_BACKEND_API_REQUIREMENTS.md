# 后端接口需求完整文档

## 📋 概述

本文档汇总了前端所需的所有后端接口，包括已实现和未实现的接口。所有接口都遵循统一的认证、错误处理和响应格式规范。

**基础路径：** `/api/v1`

**认证方式：** JWT Token (Bearer Token)

**Content-Type：** `application/json`

---

## 📊 接口总览

### 按优先级分类

| 优先级 | 接口数 | 已实现 | 未实现 | 完成率 |
|--------|--------|--------|--------|--------|
| ⭐⭐⭐ 必须 | 12 | 12 | 0 | 100% |
| ⭐⭐ 推荐 | 8 | 8 | 0 | 100% |
| ⭐ 可选 | 4 | 4 | 0 | 100% |
| **总计** | **24** | **24** | **0** | **100%** |

### 按功能模块分类

| 功能模块 | 接口数 | 已实现 | 未实现 | 完成率 |
|---------|--------|--------|--------|--------|
| 行程管理 | 6 | 6 | 0 | 100% |
| Days 管理 | 2 | 2 | 0 | 100% |
| Inspiration 模式 | 4 | 4 | 0 | 100% |
| Seeker 模式 | 1 | 1 | 0 | 100% |
| 外部数据 | 3 | 3 | 0 | 100% |
| 预算管理 | 5 | 5 | 0 | 100% |
| 成员管理 | 6 | 6 | 0 | 100% |
| **总计** | **27** | **27** | **0** | **100%** |

---

## 一、行程管理接口（✅ 已全部实现）

### 1. 创建行程

**接口路径：** `POST /api/v1/journeys`

**优先级：** ⭐⭐⭐ 必须

**请求体：**
```typescript
interface CreateItineraryRequest {
  destination: string  // 目的地，必填
  startDate: string  // 开始日期，格式：YYYY-MM-DD，必填
  days: number  // 行程天数，必填
  data: {
    days: Array<{
      day: number
      date: string
      activities: Array<{
        time: string
        title: string
        type: 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'
        duration: number
        location: { lat: number; lng: number }
        notes: string
        cost: number
      }>
    }>
    totalCost: number
    summary: string
    currency?: string  // 货币代码，如 'ISK', 'USD', 'CNY'
    currencyInfo?: {  // 货币详细信息
      code: string
      symbol: string
      name: string
    }
  }
  preferences?: {
    interests?: string[]
    budget?: 'low' | 'medium' | 'high'
    travelStyle?: 'relaxed' | 'moderate' | 'intensive'
  }
  status?: 'draft' | 'published' | 'archived'
  mode?: 'planner' | 'seeker' | 'inspiration'
}
```

**响应格式：**
```typescript
interface CreateItineraryResponse {
  success: boolean
  data: {
    id: string
    destination: string
    startDate: string
    daysCount: number
    summary: string
    totalCost: number
    currency?: string
    currencyInfo?: {
      code: string
      symbol: string
      name: string
    }
    // ... 其他字段
  }
}
```

### 2. 获取行程详情

**接口路径：** `GET /api/v1/journeys/:id`

**优先级：** ⭐⭐⭐ 必须

**响应格式：** 与创建行程接口的响应 `data` 字段格式完全相同

### 3. 获取行程列表

**接口路径：** `GET /api/v1/journeys`

**优先级：** ⭐⭐ 推荐

**查询参数：**
- `status?: 'draft' | 'published' | 'archived'`
- `mode?: 'planner' | 'seeker' | 'inspiration'`
- `page?: number`
- `limit?: number`

### 4. 更新行程

**接口路径：** `PATCH /api/v1/journeys/:id`

**优先级：** ⭐⭐⭐ 必须

**请求体：** 所有字段可选，只传入需要更新的字段

### 5. 删除行程

**接口路径：** `DELETE /api/v1/journeys/:id`

**优先级：** ⭐ 可选

### 6. 从前端数据创建行程

**接口路径：** `POST /api/v1/journeys/from-frontend-data`

**优先级：** ⭐⭐⭐ 必须

**说明：** 用于处理前端 `timeSlots` 格式的数据，避免后端验证 `data.days` 为空的问题

---

## 二、Days 管理接口（✅ 已全部实现）

### 1. 获取行程天数

**接口路径：** `GET /api/v1/journeys/{journeyId}/days`

**优先级：** ⭐⭐ 推荐

### 2. 创建行程天数

**接口路径：** `POST /api/v1/journeys/{journeyId}/days`

**优先级：** ⭐⭐ 推荐

---

## 三、Inspiration 模式接口（✅ 已全部实现）

### 1. 意图识别

**接口路径：** `POST /api/inspiration/detect-intent`

**优先级：** ⭐⭐ 推荐

### 2. 目的地推荐

**接口路径：** `POST /api/inspiration/recommend-destinations`

**优先级：** ⭐⭐ 推荐

### 3. 生成行程

**接口路径：** `POST /api/inspiration/generate-itinerary`

**优先级：** ⭐⭐⭐ 必须

### 4. 天数提取

**接口路径：** `POST /api/inspiration/extract-days`

**优先级：** ⭐ 可选

---

## 四、Seeker 模式接口（✅ 已全部实现）

### 1. 生成行程

**接口路径：** `POST /api/seeker/generate-travel-plan`

**优先级：** ⭐⭐⭐ 必须

---

## 五、外部数据接口（✅ 已全部实现）

### 1. 搜索目的地

**接口路径：** `GET /api/external/locations`

**优先级：** ⭐⭐ 推荐

### 2. 获取景点详情

**接口路径：** `GET /api/external/attractions/:id`

**优先级：** ⭐⭐ 推荐

### 3. 获取天气信息

**接口路径：** `GET /api/v1/destinations/:id/weather`

**优先级：** ⭐ 可选

---

## 六、预算管理接口（✅ 已全部实现）

### 1. 获取支出列表

**接口路径：** `GET /api/v1/journeys/{journeyId}/expenses`

**优先级：** ⭐⭐⭐ 必须

**状态：** ✅ 已实现

**实现位置：** `src/services/itineraryAPI.ts:getExpenses`

**查询参数（可选）：**
- `category?: string` - 按分类筛选
- `startDate?: string` - 开始日期（YYYY-MM-DD）
- `endDate?: string` - 结束日期（YYYY-MM-DD）
- `payerId?: string` - 按付款人筛选

**响应格式：**
```typescript
{
  success: boolean
  data: Expense[]
  total: number  // 总支出金额
}

interface Expense {
  id: string
  title: string
  amount: number
  currencyCode: string  // 货币代码，如 'ISK', 'USD', 'CNY'
  category?: string  // 分类：'交通', '住宿', '餐饮', '景点', '购物', '其他'
  location?: string  // 位置/商家
  payerId?: string  // 付款人ID
  payerName?: string  // 付款人名称（用于显示）
  splitType?: 'none' | 'equal' | 'custom'  // 分摊方式
  splitDetails?: Record<string, number>  // 自定义分摊详情 { memberId: amount }
  date: string  // 日期，格式：YYYY-MM-DD
  notes?: string  // 备注
  createdAt: string  // 创建时间，ISO 8601格式
  updatedAt: string  // 更新时间，ISO 8601格式
}
```

### 2. 创建支出

**接口路径：** `POST /api/v1/journeys/{journeyId}/expenses`

**优先级：** ⭐⭐⭐ 必须

**状态：** ✅ 已实现

**实现位置：** `src/services/itineraryAPI.ts:createExpense`

**请求体：**
```typescript
{
  title: string  // 必填
  amount: number  // 必填，必须 > 0
  currencyCode?: string  // 可选，默认使用行程目的地货币
  category?: string  // 可选
  location?: string  // 可选
  payerId?: string  // 可选，付款人ID
  payerName?: string  // 可选，付款人名称
  splitType?: 'none' | 'equal' | 'custom'  // 可选，默认 'none'
  splitDetails?: Record<string, number>  // 可选，当 splitType='custom' 时必填
  date?: string  // 可选，格式：YYYY-MM-DD，默认今天
  notes?: string  // 可选
}
```

### 3. 更新支出

**接口路径：** `PATCH /api/v1/journeys/{journeyId}/expenses/{expenseId}`

**优先级：** ⭐⭐ 推荐

**状态：** ✅ 已实现

**实现位置：** `src/services/itineraryAPI.ts:updateExpense`

**请求体：** 所有字段可选，只传入需要更新的字段

### 4. 删除支出

**接口路径：** `DELETE /api/v1/journeys/{journeyId}/expenses/{expenseId}`

**优先级：** ⭐⭐ 推荐

**状态：** ✅ 已实现

**实现位置：** `src/services/itineraryAPI.ts:deleteExpense`

**响应格式：**
```typescript
{
  success: boolean
  message: string
}
```

### 5. 更新预算总额

**接口路径：** `PATCH /api/v1/journeys/{journeyId}`

**优先级：** ⭐⭐⭐ 必须

**状态：** ✅ 已实现（通过更新行程接口实现）

**实现位置：** `src/services/itineraryAPI.ts:updateItinerary`

**说明：** 使用现有的更新行程接口，更新 `totalCost` 字段

**请求体：**
```typescript
{
  totalCost: number  // 预算总额，必须 >= 0
}
```

**详细文档：** 参考 [预算管理接口需求文档](./BUDGET_MANAGEMENT_API_REQUIREMENTS.md)

---

## 七、成员管理接口（⚠️ 部分实现）

### 1. 获取成员列表

**接口路径：** `GET /api/v1/journeys/{journeyId}/members`

**优先级：** ⭐⭐⭐ 必须

**状态：** ✅ 已实现

**响应格式：**
```typescript
{
  success: boolean
  data: Member[]
}

interface Member {
  id: string
  name: string
  email?: string
  role: 'owner' | 'admin' | 'member'
  userId?: string | null
  createdAt: string
  updatedAt: string
}
```

### 2. 邀请成员

**接口路径：** `POST /api/v1/journeys/{journeyId}/members/invite`

**优先级：** ⭐⭐⭐ 必须

**状态：** ✅ 已实现

**请求体：**
```typescript
{
  email: string  // 必填
  role?: 'member' | 'admin'  // 可选，默认 'member'
  message?: string  // 可选，邀请消息（最多500字符）
}
```

**响应格式：**
```typescript
{
  success: boolean
  message: string
  data: {
    id: string  // 邀请ID
    email: string
    role: string
    status: 'pending' | 'accepted' | 'expired'
    expiresAt: string  // ISO 8601格式
  }
}
```

### 3. 添加成员

**接口路径：** `POST /api/v1/journeys/{journeyId}/members`

**优先级：** ⭐⭐ 推荐

**状态：** ✅ 已实现

**请求体：**
```typescript
{
  name: string  // 必填
  email?: string  // 可选
  role?: 'member' | 'admin'  // 可选，默认 'member'
  userId?: string  // 可选，关联的用户ID
}
```

### 4. 更新成员信息

**接口路径：** `PATCH /api/v1/journeys/{journeyId}/members/{memberId}`

**优先级：** ⭐⭐ 推荐

**状态：** ✅ 已实现

**请求体：** 所有字段可选

### 5. 移除成员

**接口路径：** `DELETE /api/v1/journeys/{journeyId}/members/{memberId}`

**优先级：** ⭐⭐⭐ 必须

**状态：** ✅ 已实现

### 6. 验证邀请

**接口路径：** `GET /api/v1/journeys/invitations/{invitationId}`

**优先级：** ⭐⭐⭐ 必须

**状态：** ✅ 已实现

**实现位置：** `src/services/itineraryAPI.ts:verifyInvitation`

**说明：** 用于验证邀请链接的有效性，获取邀请信息（公开接口，无需认证）

**路径参数：**
- `invitationId` (string, 必填) - 邀请ID（从URL参数获取）

**响应格式：**
```typescript
{
  success: boolean
  data: {
    invitationId: string
    journeyId: string
    email: string
    role: 'member' | 'admin'
    journeyName?: string  // 行程名称（用于显示）
    message?: string  // 邀请消息
    status: 'pending' | 'accepted' | 'expired'
    expiresAt: string
    invitedBy?: {
      id: string
      name: string
      email?: string
    }
  }
}
```

**错误响应：**
- `404`: 邀请不存在或已过期
- `400`: 邀请ID无效

**详细文档：** 参考 [成员管理接口需求文档](../MEMBER_MANAGEMENT_API_REQUIREMENTS.md)

---

## 八、统一错误响应格式

所有接口的错误响应都应遵循以下格式：

```typescript
interface ErrorResponse {
  success: false
  error: string  // 错误描述
  code: string  // 错误代码
  details?: any  // 详细错误信息（可选）
}
```

### 常见错误代码

- `VALIDATION_ERROR` - 参数验证失败
- `NOT_FOUND` - 资源不存在
- `UNAUTHORIZED` - 未授权
- `FORBIDDEN` - 禁止访问
- `INTERNAL_ERROR` - 服务器内部错误
- `CONFLICT` - 资源冲突（如重复邀请）

---

## 九、接口实现优先级

### P0 - 必须实现（核心功能，影响主要业务流程）

1. ✅ **预算管理接口**（5个接口）- **已完成**
   - ✅ `GET /api/v1/journeys/{journeyId}/expenses` - 获取支出列表
   - ✅ `POST /api/v1/journeys/{journeyId}/expenses` - 创建支出
   - ✅ `PATCH /api/v1/journeys/{journeyId}/expenses/{expenseId}` - 更新支出
   - ✅ `DELETE /api/v1/journeys/{journeyId}/expenses/{expenseId}` - 删除支出
   - ✅ `PATCH /api/v1/journeys/{journeyId}` - 更新预算总额（通过更新行程接口）
   - **实现位置：** `src/services/itineraryAPI.ts`
   - **组件集成：** `src/components/TravelDetail/BudgetManager.vue`

2. ✅ **邀请验证接口** - **已完成**
   - ✅ `GET /api/v1/journeys/invitations/{invitationId}` - 验证邀请
   - **实现位置：** `src/services/itineraryAPI.ts:verifyInvitation`
   - **组件集成：** `src/views/AcceptInvitationView.vue`
   - **特性：** 公开接口（无需认证）、状态验证、错误处理

### P1 - 推荐实现（重要功能，提升用户体验）

3. ✅ **预算管理接口（扩展）** - **已完成**
   - ✅ `PATCH /api/v1/journeys/{journeyId}/expenses/{expenseId}` - 更新支出
   - ✅ `DELETE /api/v1/journeys/{journeyId}/expenses/{expenseId}` - 删除支出

### P2 - 可选实现（增强功能）

4. ⭐ 接口错误处理优化
5. ⭐ 接口性能优化（缓存、分页等）

---

## 十、数据格式要求

### 货币信息

所有涉及金额的接口都应包含货币信息：

```typescript
{
  currencyCode: string  // ISO 4217 货币代码，如 'ISK', 'USD', 'CNY'
  currencyInfo?: {  // 可选，货币详细信息
    code: string
    symbol: string  // 货币符号，如 'kr', '$', '¥'
    name: string  // 货币名称，如 'Icelandic Króna', 'US Dollar', '人民币'
  }
}
```

### 日期时间格式

- **日期：** `YYYY-MM-DD`（如 `2025-11-25`）
- **时间：** `HH:mm`（如 `09:00`）
- **ISO 8601：** 用于 `createdAt`、`updatedAt`、`expiresAt` 等字段（如 `2025-11-25T10:00:00.000Z`）

### 坐标格式

```typescript
{
  location: {
    lat: number  // 纬度
    lng: number  // 经度
  }
}
```

---

## 十一、认证要求

所有接口都需要 JWT Token 认证：

**请求头：**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**未认证或Token无效时返回：**
```json
{
  "success": false,
  "error": "未授权",
  "code": "UNAUTHORIZED"
}
```

---

## 十二、相关文档

- [后端接口需求文档](./BACKEND_API_REQUIREMENTS.md) - 核心行程管理接口
- [预算管理接口需求文档](./BUDGET_MANAGEMENT_API_REQUIREMENTS.md) - 预算管理详细规范
- [成员管理接口需求文档](../MEMBER_MANAGEMENT_API_REQUIREMENTS.md) - 成员管理详细规范
- [API实现状态检查报告](./API_IMPLEMENTATION_STATUS.md) - 接口实现状态

---

## 十三、更新日志

- **2025-01-XX**: 创建完整接口需求文档，汇总所有模块的接口需求
- **2025-01-XX**: 添加货币信息字段要求
- **2025-01-XX**: 添加邀请验证接口需求
- **2025-01-XX**: 预算管理接口全部实现完成
  - ✅ 获取支出列表接口（GET `/api/v1/journeys/{journeyId}/expenses`）
  - ✅ 创建支出接口（POST `/api/v1/journeys/{journeyId}/expenses`）
  - ✅ 更新支出接口（PATCH `/api/v1/journeys/{journeyId}/expenses/{expenseId}`）
  - ✅ 删除支出接口（DELETE `/api/v1/journeys/{journeyId}/expenses/{expenseId}`）
  - ✅ 更新预算总额（通过更新行程接口）
  - 所有接口已符合后端文档要求，包含完整的前端验证、错误处理和数据清理
  - 实现位置：`src/services/itineraryAPI.ts`
  - 组件集成：`src/components/TravelDetail/BudgetManager.vue`
- **2025-01-XX**: 邀请验证接口实现完成
  - ✅ 验证邀请接口（GET `/api/v1/journeys/invitations/{invitationId}`）
  - 公开接口（无需认证）、状态验证、错误处理
  - 实现位置：`src/services/itineraryAPI.ts:verifyInvitation`
  - 组件集成：`src/views/AcceptInvitationView.vue`
  - **所有接口已全部实现完成，完成率 100%**

---

**文档版本：** v1.2  
**最后更新：** 2025年1月

