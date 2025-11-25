# 后端接口需求文档

## 📋 概述

本文档说明旅行规划系统（Planner、Seeker、Inspiration 三种模式）需要后端提供的所有接口规范。

**核心原则：所有模式的数据保存结构必须完全相同，使用统一的数据结构和接口。**

---

## 📊 接口分类

### 一、数据保存接口（所有模式共用）

所有模式创建行程后，都使用相同的接口保存到数据库。

| 接口 | 方法 | 路径 | 说明 | 优先级 |
|------|------|------|------|--------|
| 创建行程 | POST | `/api/v1/journeys` | 创建新行程 | ⭐⭐⭐ 必须 |
| 获取行程详情 | GET | `/api/v1/journeys/:id` | 获取行程详细信息 | ⭐⭐⭐ 必须 |
| 获取行程列表 | GET | `/api/v1/journeys` | 获取用户行程列表 | ⭐⭐ 推荐 |
| 更新行程 | PUT | `/api/v1/journeys/:id` | 更新行程信息 | ⭐ 可选 |
| 删除行程 | DELETE | `/api/v1/journeys/:id` | 删除行程 | ⭐ 可选 |

### 二、生成阶段接口（每种模式独立）

每种模式有不同的生成逻辑，可以有不同的接口。

| 模式 | 接口 | 方法 | 路径 | 说明 | 优先级 |
|------|------|------|------|------|--------|
| **Inspiration** | 意图识别 | POST | `/api/inspiration/detect-intent` | 识别用户意图 | ⭐⭐ 推荐 |
| **Inspiration** | 目的地推荐 | POST | `/api/inspiration/recommend-destinations` | 推荐候选目的地 | ⭐⭐ 推荐 |
| **Inspiration** | 生成行程 | POST | `/api/inspiration/generate-itinerary` | 生成完整行程 | ⭐⭐⭐ 必须 |
| **Seeker** | 生成行程 | POST | `/api/seeker/generate-travel-plan` | 根据心情生成行程 | ⭐⭐⭐ 必须 |

---

## 一、数据保存接口（所有模式共用）

### 1. 创建行程接口

**接口路径：** `POST /api/v1/journeys`

**请求头：**
```
Content-Type: application/json
Authorization: Bearer {token}  // 如果需要认证
```

**请求参数：**

```typescript
interface CreateItineraryRequest {
  destination: string  // 目的地，必填
  startDate: string  // 开始日期，格式：YYYY-MM-DD，必填
  days: number  // 行程天数，必填
  data: {
    days: Array<{
      day: number  // 第几天，从1开始
      date: string  // 日期，格式：YYYY-MM-DD
      activities: Array<{
        time: string  // 时间，格式：HH:mm
        title: string  // 活动标题
        type: 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'  // 活动类型
        duration: number  // 持续时间（分钟）
        location: {
          lat: number  // 纬度
          lng: number  // 经度
        }
        notes: string  // 备注（可以为空字符串）
        cost: number  // 费用（可以为0）
      }>
    }>
    totalCost: number  // 总费用
    summary: string  // 行程摘要（可以为空字符串）
    // 可选：模式特有字段
    selectedLocation?: string  // 灵感模式：用户选择的目的地
    inspirationConfig?: any  // 灵感模式：动态配置
    moodData?: {  // Seeker模式：心情数据
      currentMood?: string
      desiredExperience?: string
    }
  }
  preferences?: {  // 用户偏好（可选）
    interests?: string[]  // 兴趣列表
    budget?: 'low' | 'medium' | 'high'  // 预算等级
    travelStyle?: 'relaxed' | 'moderate' | 'intensive'  // 旅行节奏
  }
  status?: 'draft' | 'published' | 'archived'  // 状态，默认 'draft'
  mode?: 'planner' | 'seeker' | 'inspiration'  // 模式标识（可选）
}
```

**请求示例：**

```json
{
  "destination": "冰岛",
  "startDate": "2024-06-01",
  "days": 5,
  "data": {
    "days": [
      {
        "day": 1,
        "date": "2024-06-01",
        "activities": [
          {
            "time": "09:00",
            "title": "抵达雷克雅未克",
            "type": "transport",
            "duration": 60,
            "location": {
              "lat": 64.1466,
              "lng": -21.9426
            },
            "notes": "机场大巴前往市区",
            "cost": 2500
          }
        ]
      }
    ],
    "totalCost": 50000,
    "summary": "5天冰岛之旅"
  },
  "preferences": {
    "budget": "medium",
    "travelStyle": "moderate"
  },
  "status": "draft",
  "mode": "inspiration"
}
```

**响应数据：**

```typescript
interface CreateItineraryResponse {
  success: boolean
  data: {
    id: string  // 行程ID
    destination: string
    startDate: string
    daysCount: number
    summary: string
    totalCost: number
    days: Array<{
      day: number
      date: string
      activities: Array<{
        time: string
        title: string
        type: string
        duration: number
        location: {
          lat: number
          lng: number
        }
        notes: string
        cost: number
      }>
    }>
    preferences?: {
      interests?: string[]
      budget?: 'low' | 'medium' | 'high'
      travelStyle?: 'relaxed' | 'moderate' | 'intensive'
    }
    status: 'draft' | 'published' | 'archived'
    createdAt: string  // ISO 8601 格式
    updatedAt: string  // ISO 8601 格式
  }
}
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "id": "itinerary_123456",
    "destination": "冰岛",
    "startDate": "2024-06-01",
    "daysCount": 5,
    "summary": "5天冰岛之旅",
    "totalCost": 50000,
    "days": [...],
    "status": "draft",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**错误响应：**

```json
{
  "success": false,
  "error": "错误信息",
  "code": "ERROR_CODE"
}
```

---

### 2. 获取行程详情接口

**接口路径：** `GET /api/itinerary/:id`

**请求参数：**
- `id`: 行程ID（路径参数）

**响应数据：**

与创建行程接口的响应 `data` 字段格式完全相同。

---

### 3. 获取行程列表接口

**接口路径：** `GET /api/itinerary`

**查询参数：**

```typescript
interface GetItineraryListParams {
  status?: 'draft' | 'published' | 'archived'  // 筛选状态
  mode?: 'planner' | 'seeker' | 'inspiration'  // 筛选模式
  page?: number  // 页码，从1开始
  limit?: number  // 每页数量，默认10
}
```

**响应数据：**

```typescript
interface GetItineraryListResponse {
  success: boolean
  data: Array<{
    id: string
    destination: string
    startDate: string
    days: number
    summary?: string
    totalCost?: number
    status: 'draft' | 'published' | 'archived'
    createdAt: string
    updatedAt: string
  }>
  total: number  // 总记录数
  page: number  // 当前页码
  limit: number  // 每页数量
}
```

---

### 4. 更新行程接口

**接口路径：** `PUT /api/itinerary/:id`

**请求参数：**

```typescript
interface UpdateItineraryRequest {
  destination?: string
  startDate?: string
  days?: number
  summary?: string
  totalCost?: number
  preferences?: {
    interests?: string[]
    budget?: 'low' | 'medium' | 'high'
    travelStyle?: 'relaxed' | 'moderate' | 'intensive'
  }
  status?: 'draft' | 'published' | 'archived'
}
```

**响应数据：** 与创建行程接口相同

---

### 5. 删除行程接口

**接口路径：** `DELETE /api/itinerary/:id`

**响应数据：**

```typescript
interface DeleteItineraryResponse {
  success: boolean
  message: string
}
```

---

## 二、生成阶段接口

### 1. 灵感模式：意图识别接口

**接口路径：** `POST /api/inspiration/detect-intent`

**请求参数：**

```typescript
interface DetectIntentRequest {
  input: string  // 用户自然语言输入，必填
  language?: string  // 语言代码，默认 'zh-CN'
}
```

**响应数据：**

```typescript
interface DetectIntentResponse {
  success: boolean
  data: {
    intentType: string  // 意图类型，如 'photography_exploration', 'cultural_exchange', 'emotional_healing' 等
    keywords: string[]  // 提取的关键词列表
    emotionTone: string  // 情感倾向，如 'calm', 'active', 'romantic' 等
    description: string  // 意图描述
    confidence?: number  // 置信度（0-1）
  }
}
```

---

### 2. 灵感模式：目的地推荐接口

**接口路径：** `POST /api/inspiration/recommend-destinations`

**请求参数：**

```typescript
interface RecommendDestinationsRequest {
  input: string  // 用户自然语言输入，必填
  intent?: {  // 意图识别结果（可选，如果不提供会在后端识别）
    intentType: string
    keywords: string[]
    emotionTone: string
  }
  language?: string  // 语言代码，默认 'zh-CN'
  userCountry?: string  // 用户所在国家
  userNationality?: string  // 用户国籍
  userPermanentResidency?: string  // 用户永久居住地
  heldVisas?: string[]  // 用户持有的签证
  visaFreeDestinations?: string[]  // 免签目的地列表
  visaInfoSummary?: string | null  // 签证信息摘要
  limit?: number  // 返回数量，默认10，范围8-12
}
```

**响应数据：**

```typescript
interface RecommendDestinationsResponse {
  success: boolean
  data: {
    locations: string[]  // 推荐的目的地列表，如 ["冰岛", "挪威", "瑞士", ...]
    locationDetails?: {  // 可选：目的地详情
      [location: string]: {
        country?: string
        description?: string
        highlights?: string[]
        bestSeason?: string
      }
    }
    reasoning?: string  // 推荐理由
  }
}
```

---

### 3. 灵感模式：生成完整行程接口

**接口路径：** `POST /api/inspiration/generate-itinerary`

**请求参数：**

```typescript
interface GenerateInspirationItineraryRequest {
  input: string  // 用户自然语言输入，必填
  selectedDestination?: string  // 用户选择的目的地（可选）
  intent?: {  // 意图识别结果（可选）
    intentType: string
    keywords: string[]
    emotionTone: string
  }
  language?: string  // 语言代码，默认 'zh-CN'
  userCountry?: string
  userNationality?: string
  userPermanentResidency?: string
  heldVisas?: string[]
  visaFreeDestinations?: string[]
  visaInfoSummary?: string | null
  transportPreference?: 'public_transit_and_walking' | 'driving_and_walking'
  userRequestedDays?: number  // 用户期望的天数（可选）
  mode?: 'full' | 'candidates'  // 生成模式，默认 'full'
}
```

**响应数据：**

```typescript
interface GenerateInspirationItineraryResponse {
  success: boolean
  data: {
    title: string  // 行程标题
    destination?: string  // 目的地
    location?: string  // 位置
    locations?: string[]  // 如果 mode === 'candidates'，返回候选列表
    duration: string | number  // 行程时长
    days?: Array<{
      day: number
      date: string
      theme?: string
      mood?: string
      summary?: string
      timeSlots: Array<{
        time: string
        title?: string
        activity?: string
        coordinates?: { lat: number; lng: number }
        type?: string
        duration?: number
        cost?: number
        details?: {
          images?: { cover?: string; gallery?: string[] }
          photos?: any
          notes?: string
          description?: string
        }
      }>
    }>
    hasFullItinerary?: boolean  // 是否有完整行程
    generationMode?: 'full' | 'candidates'
    highlights?: string[]  // 体验亮点
  }
}
```

**注意：** 此接口返回的是前端展示格式，保存到数据库前需要转换为 `CreateItineraryRequest` 格式。

---

### 4. Seeker模式：生成行程接口

**接口路径：** `POST /api/seeker/generate-travel-plan`

**请求参数：**

```typescript
interface GenerateSeekerTravelPlanRequest {
  currentMood: string  // 当前心情，必填，如 'calm', 'active', 'romantic', 'adventurous', 'cultural'
  desiredExperience: string  // 期望体验，必填，如 'sightseeing', 'nature', 'food', 'shopping', 'nightlife', 'adventure'
  budget: string  // 预算范围，必填，如 'economy', 'comfort', 'luxury'
  duration: string  // 时长类型，必填，如 'weekend', 'week', 'extended'
  language?: string  // 语言代码，默认 'zh-CN'
  userCountry?: string  // 用户所在国家
  userNationality?: string  // 用户国籍
}
```

**响应数据：**

```typescript
interface GenerateSeekerTravelPlanResponse {
  success: boolean
  data: {
    destination: string  // 推荐的目的地
    duration: number  // 行程天数
    itinerary: Array<{
      day: number
      title: string
      theme?: string
      activities: Array<{
        time: string
        activity: string
        type: string
        location?: string
        notes?: string
      }>
    }>
    recommendations?: {
      accommodation?: string
      transportation?: string
      food?: string
      tips?: string
    }
    detectedIntent?: {
      intentType: string
      keywords: string[]
      emotionTone: string
      description: string
    }
  }
}
```

**注意：** 此接口返回的是前端展示格式，保存到数据库前需要转换为 `CreateItineraryRequest` 格式。

---

## 三、数据模型规范

### 核心数据结构

所有模式保存到数据库时，必须使用相同的 `CreateItineraryRequest` 结构：

```typescript
interface CreateItineraryRequest {
  destination: string  // 必填
  startDate: string  // 必填，格式：YYYY-MM-DD
  days: number  // 必填
  data: {
    days: Array<{
      day: number  // 必填，从1开始
      date: string  // 必填，格式：YYYY-MM-DD
      activities: Array<{
        time: string  // 必填，格式：HH:mm
        title: string  // 必填（可以为空字符串）
        type: 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'  // 必填
        duration: number  // 必填，单位：分钟
        location: {  // 必填
          lat: number
          lng: number
        }
        notes: string  // 必填（可以为空字符串）
        cost: number  // 必填（可以为0）
      }>
    }>
    totalCost: number  // 必填（可以为0）
    summary: string  // 必填（可以为空字符串）
  }
  preferences?: {  // 可选
    interests?: string[]
    budget?: 'low' | 'medium' | 'high'
    travelStyle?: 'relaxed' | 'moderate' | 'intensive'
  }
  status?: 'draft' | 'published' | 'archived'  // 可选，默认 'draft'
  mode?: 'planner' | 'seeker' | 'inspiration'  // 可选，模式标识
}
```

### 关键约束

1. **必需字段必须填充**：即使前端不保存文本内容（如灵感模式），后端也必须接受这些字段，可以为空字符串或默认值。
2. **数据结构统一**：所有模式都必须转换为相同的 `CreateItineraryRequest` 格式。
3. **活动类型限制**：`type` 字段只能是预定义的几种类型之一。
4. **日期格式**：所有日期字段必须使用 `YYYY-MM-DD` 格式。
5. **时间格式**：时间字段必须使用 `HH:mm` 格式。

---

## 四、错误处理

### 统一错误响应格式

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

---

## 五、接口优先级

### 必须实现（P0）

1. ✅ `POST /api/itinerary` - 创建行程
2. ✅ `GET /api/itinerary/:id` - 获取行程详情
3. ✅ `POST /api/inspiration/generate-itinerary` - 灵感模式生成行程
4. ✅ `POST /api/seeker/generate-travel-plan` - Seeker模式生成行程

### 推荐实现（P1）

1. ⭐ `GET /api/itinerary` - 获取行程列表
2. ⭐ `POST /api/inspiration/detect-intent` - 意图识别
3. ⭐ `POST /api/inspiration/recommend-destinations` - 目的地推荐

### 可选实现（P2）

1. `PUT /api/itinerary/:id` - 更新行程
2. `DELETE /api/itinerary/:id` - 删除行程

---

## 六、注意事项

1. **数据格式转换**：生成阶段接口返回的数据格式可能与保存接口不同，前端需要负责转换。
2. **模式标识**：保存时可以包含 `mode` 字段用于区分不同模式，但不影响数据结构。
3. **可选字段处理**：所有可选字段都应该有合理的默认值。
4. **数据验证**：后端应该验证所有必需字段，并检查数据格式。
5. **空值处理**：即使前端不保存某些字段（如文本描述），后端也应该接受空字符串或默认值。

---

## 七、示例流程

### Planner 模式

```
1. 前端收集表单数据（destination, days, budget, preferences）
2. 前端生成行程（可前端实现，也可后端支持）
3. 前端调用：POST /api/itinerary（转换为统一格式）
4. 后端保存到数据库
```

### Seeker 模式

```
1. 前端收集卡片选择（currentMood, desiredExperience, budget, duration）
2. 前端调用：POST /api/seeker/generate-travel-plan
3. 后端返回行程数据
4. 前端调用：POST /api/itinerary（转换为统一格式）
5. 后端保存到数据库
```

### Inspiration 模式

```
1. 前端接收用户自然语言输入
2. 前端调用：POST /api/inspiration/detect-intent（可选）
3. 前端调用：POST /api/inspiration/recommend-destinations（可选）
4. 前端调用：POST /api/inspiration/generate-itinerary
5. 后端返回行程数据
6. 前端调用：POST /api/itinerary（转换为统一格式）
7. 后端保存到数据库
```

---

**文档版本：** v1.0  
**最后更新：** 2024年1月

