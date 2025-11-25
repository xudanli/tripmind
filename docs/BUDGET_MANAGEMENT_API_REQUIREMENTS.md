# 预算管理接口需求文档

## 📋 概述

本文档说明预算管理功能需要后端提供的所有接口规范。

预算管理功能包括：
- 预算总额设置和更新
- 支出记录的增删改查
- 预算统计和计算（已花费、剩余预算等）

---

## 📊 接口列表

### 方案一：独立支出接口（推荐）

| 接口 | 方法 | 路径 | 说明 | 优先级 |
|------|------|------|------|--------|
| 获取支出列表 | GET | `/api/v1/journeys/{journeyId}/expenses` | 获取行程的所有支出记录 | ⭐⭐⭐ 必须 |
| 创建支出 | POST | `/api/v1/journeys/{journeyId}/expenses` | 添加新的支出记录 | ⭐⭐⭐ 必须 |
| 更新支出 | PATCH | `/api/v1/journeys/{journeyId}/expenses/{expenseId}` | 更新支出记录 | ⭐⭐ 推荐 |
| 删除支出 | DELETE | `/api/v1/journeys/{journeyId}/expenses/{expenseId}` | 删除支出记录 | ⭐⭐ 推荐 |
| 更新预算总额 | PATCH | `/api/v1/journeys/{journeyId}` | 更新行程的预算总额（使用现有接口） | ⭐⭐⭐ 必须 |

### 方案二：通过行程更新接口（简化方案）

如果后端不支持独立的支出接口，可以通过更新行程接口来保存支出数据：

| 接口 | 方法 | 路径 | 说明 | 优先级 |
|------|------|------|------|--------|
| 更新行程（包含预算和支出） | PATCH | `/api/v1/journeys/{journeyId}` | 更新预算总额和支出列表 | ⭐⭐⭐ 必须 |

---

## 📝 详细接口规范

### 1. 获取支出列表

**接口路径：** `GET /api/v1/journeys/{journeyId}/expenses`

**路径参数：**
- `journeyId` (string, 必填) - 行程ID

**查询参数（可选）：**
- `category` (string) - 按分类筛选
- `startDate` (string) - 开始日期（YYYY-MM-DD）
- `endDate` (string) - 结束日期（YYYY-MM-DD）
- `payerId` (string) - 按付款人筛选

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

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": "exp_123456",
      "title": "午餐",
      "amount": 2500,
      "currencyCode": "ISK",
      "category": "餐饮",
      "location": "雷克雅未克市中心餐厅",
      "payerId": "user_001",
      "payerName": "张三",
      "splitType": "equal",
      "date": "2025-11-25",
      "notes": "四人AA",
      "createdAt": "2025-11-25T12:00:00Z",
      "updatedAt": "2025-11-25T12:00:00Z"
    }
  ],
  "total": 2500
}
```

---

### 2. 创建支出

**接口路径：** `POST /api/v1/journeys/{journeyId}/expenses`

**路径参数：**
- `journeyId` (string, 必填) - 行程ID

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

**响应格式：**
```typescript
{
  success: boolean
  data: Expense
  message?: string
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "id": "exp_123456",
    "title": "午餐",
    "amount": 2500,
    "currencyCode": "ISK",
    "category": "餐饮",
    "location": "雷克雅未克市中心餐厅",
    "payerId": "user_001",
    "payerName": "张三",
    "splitType": "equal",
    "date": "2025-11-25",
    "notes": "四人AA",
    "createdAt": "2025-11-25T12:00:00Z",
    "updatedAt": "2025-11-25T12:00:00Z"
  },
  "message": "支出创建成功"
}
```

---

### 3. 更新支出

**接口路径：** `PATCH /api/v1/journeys/{journeyId}/expenses/{expenseId}`

**路径参数：**
- `journeyId` (string, 必填) - 行程ID
- `expenseId` (string, 必填) - 支出ID

**请求体：**
```typescript
{
  title?: string
  amount?: number  // 必须 > 0
  currencyCode?: string
  category?: string
  location?: string
  payerId?: string
  payerName?: string
  splitType?: 'none' | 'equal' | 'custom'
  splitDetails?: Record<string, number>
  date?: string  // 格式：YYYY-MM-DD
  notes?: string
}
```

**响应格式：**
```typescript
{
  success: boolean
  data: Expense
  message?: string
}
```

---

### 4. 删除支出

**接口路径：** `DELETE /api/v1/journeys/{journeyId}/expenses/{expenseId}`

**路径参数：**
- `journeyId` (string, 必填) - 行程ID
- `expenseId` (string, 必填) - 支出ID

**响应格式：**
```typescript
{
  success: boolean
  message: string
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "支出删除成功"
}
```

---

### 5. 更新预算总额

**接口路径：** `PATCH /api/v1/journeys/{journeyId}`

**说明：** 使用现有的更新行程接口，更新 `totalCost` 字段。

**请求体：**
```typescript
{
  totalCost: number  // 预算总额，必须 >= 0
}
```

**响应格式：**
```typescript
{
  success: boolean
  data: {
    id: string
    totalCost: number
    // ... 其他行程字段
  }
}
```

---

## 🔄 数据流程

### 创建支出流程
```
用户填写支出表单
  ↓
调用 POST /api/v1/journeys/{journeyId}/expenses
  ↓
后端保存支出记录
  ↓
返回创建的支出数据
  ↓
前端更新本地状态和UI
```

### 更新预算流程
```
用户修改预算总额
  ↓
调用 PATCH /api/v1/journeys/{journeyId} (更新 totalCost)
  ↓
后端更新行程预算
  ↓
返回更新后的行程数据
  ↓
前端更新本地状态和UI
```

---

## 📊 数据结构说明

### Expense 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 支出ID，后端生成 |
| `title` | string | 是 | 支出标题/名称 |
| `amount` | number | 是 | 支出金额，必须 > 0 |
| `currencyCode` | string | 是 | 货币代码（ISO 4217），如 'ISK', 'USD', 'CNY' |
| `category` | string | 否 | 分类：'交通', '住宿', '餐饮', '景点', '购物', '其他' |
| `location` | string | 否 | 位置/商家名称 |
| `payerId` | string | 否 | 付款人ID（成员ID或用户ID） |
| `payerName` | string | 否 | 付款人名称（用于显示） |
| `splitType` | string | 否 | 分摊方式：'none'（不分摊）、'equal'（平均分摊）、'custom'（自定义分摊） |
| `splitDetails` | object | 否 | 自定义分摊详情，格式：`{ memberId: amount }` |
| `date` | string | 是 | 支出日期，格式：YYYY-MM-DD |
| `notes` | string | 否 | 备注信息 |
| `createdAt` | string | 是 | 创建时间，ISO 8601格式 |
| `updatedAt` | string | 是 | 更新时间，ISO 8601格式 |

### 分摊方式说明

1. **none（不分摊）**：支出由付款人独自承担
2. **equal（平均分摊）**：支出平均分配给所有成员
3. **custom（自定义分摊）**：通过 `splitDetails` 指定每个成员的分摊金额

---

## ⚠️ 注意事项

1. **货币处理**：
   - 支出可以使用不同货币
   - 前端需要处理货币转换（如果需要统一显示）
   - 后端可以存储原始货币和金额

2. **数据验证**：
   - `amount` 必须 > 0
   - `date` 必须是有效的日期格式
   - `splitDetails` 的总和必须等于 `amount`（当 `splitType='custom'` 时）

3. **权限控制**：
   - 只有行程的创建者或成员可以管理支出
   - 删除支出需要确认操作

4. **数据同步**：
   - 支出数据需要实时同步到后端
   - 多设备访问时需要保证数据一致性

5. **性能考虑**：
   - 支出列表可能很长，建议支持分页
   - 可以按日期、分类等条件筛选

---

## 🎯 优先级说明

- ⭐⭐⭐ **必须**：核心功能，必须实现
- ⭐⭐ **推荐**：重要功能，建议实现
- ⭐ **可选**：增强功能，可选实现

---

## 📝 简化方案（如果后端不支持独立支出接口）

如果后端暂时不支持独立的支出接口，可以通过更新行程接口来保存支出数据：

**请求体格式：**
```typescript
{
  totalCost: number  // 预算总额
  data: {
    expenses: Expense[]  // 支出列表
  }
}
```

这种方式虽然可行，但不够灵活，每次更新都需要发送完整的支出列表，不适合大量支出的场景。

