# 三种模式对比文档

## 📋 概述

本文档对比 Planner、Seeker、Inspiration 三种模式在**生成阶段**和**保存阶段**的接口和参数差异。

---

## 🔍 核心结论

### 1. 生成阶段的接口和参数

**三个模式的生成接口和输入参数都不一样**，因为它们接受的输入格式完全不同：

| 模式 | 生成接口 | 输入参数 | 说明 |
|------|---------|---------|------|
| **Planner** | `POST /api/v1/journeys/generate` | `{ destination, days, startDate, preferences }` | 结构化表单输入 |
| **Inspiration** | `POST /api/inspiration/generate-itinerary` | `{ input, selectedDestination, intent, language, ... }` | 自然语言输入 |
| **Seeker** | `POST /api/seeker/generate-travel-plan` | `{ currentMood, desiredExperience, budget, duration, ... }` | 心情和体验输入 |

### 2. 保存阶段的接口和参数

**三个模式保存到数据库时使用相同的接口和参数格式**：

| 接口 | 方法 | 路径 | 输入参数 |
|------|------|------|---------|
| **创建行程** | POST | `/api/v1/journeys` | `CreateItineraryRequest`（统一格式） |

---

## 📊 详细对比

### 一、生成阶段（生成行程接口）

#### 1. Planner 模式

**接口：** `POST /api/v1/journeys/generate`

**输入参数：**
```typescript
interface GenerateItineraryRequest {
  destination?: string         // 目的地，可选（不提供时系统会根据其他信息自动推荐）
  days: number                // 天数，必填，范围 1-30
  startDate: string           // 开始日期，格式：YYYY-MM-DD，必填
  preferences?: {             // 用户偏好，可选
    interests?: string[]      // 兴趣列表
    budget?: 'low' | 'medium' | 'high'
    travelStyle?: 'relaxed' | 'moderate' | 'intensive'
  }
  intent?: {                  // 意图识别数据（可选，用于优化行程生成）
    intentType: string        // 意图类型，如 'photography_exploration', 'cultural_exchange', 'emotional_healing' 等
    keywords: string[]        // 提取的关键词列表
    emotionTone: string       // 情感倾向，如 'calm', 'active', 'romantic' 等
    description: string       // 意图描述
    confidence?: number       // 置信度（0-1）
  }
}
```

**说明：**
- `destination` 字段为可选，如果不提供，系统会根据 `intent`、`preferences.interests` 等信息自动推荐目的地
- `intent` 字段为可选，如果提供，后端可以利用意图信息优化行程生成
- 意图信息由前端通过意图识别接口（`POST /api/inspiration/detect-intent`）获取
- 如果后端不支持 `intent` 字段，会忽略该字段，不影响正常流程
- 如果不提供 `destination`，建议至少提供 `intent` 或 `preferences.interests` 之一，以便系统更好地推荐目的地
- **详细文档：** 参见 [生成旅行行程接口文档](./JOURNEY_GENERATE_API.md)

**调用位置：**
- `src/stores/travel.ts` → `generateItinerary('planner')`
- `src/services/itineraryAPI.ts` → `generateItinerary()`

**特点：**
- ✅ 结构化输入：目的地、天数、开始日期都是明确的
- ✅ 直接生成完整行程
- ✅ 返回格式：`FrontendItineraryData`（包含 `days`、`timeSlots`）

---

#### 2. Inspiration 模式

**接口：** `POST /api/inspiration/generate-itinerary`

**输入参数：**
```typescript
interface GenerateItineraryRequest {
  input: string                          // 用户自然语言输入，必填
  selectedDestination?: string           // 用户选择的目的地（可选）
  intent?: {                             // 意图识别结果（可选）
    intentType: string
    keywords: string[]
    emotionTone: string
  }
  language?: string                      // 语言代码，默认 'zh-CN'
  userCountry?: string                   // 用户所在国家
  userNationality?: string               // 用户国籍
  userPermanentResidency?: string        // 永久居民身份
  heldVisas?: string[]                   // 已持有的签证
  visaFreeDestinations?: string[]        // 免签目的地列表
  visaInfoSummary?: string | null        // 签证信息摘要
  transportPreference?: 'public_transit_and_walking' | 'driving_and_walking'
  userRequestedDays?: number             // 用户期望的天数（可选）
  mode?: 'full' | 'candidates'          // 生成模式，默认 'full'
}
```

**调用位置：**
- `src/apis/inspiration.ts` → `generateInspirationJourney()`
- `src/services/inspirationBackendAPI.ts` → `generateItinerary()`

**特点：**
- ✅ 自然语言输入：用户输入自由文本
- ✅ 可返回候选目的地列表（`mode: 'candidates'`）或完整行程（`mode: 'full'`）
- ✅ 自动检测输入中的目的地，如果包含目的地则直接生成完整行程
- ✅ 返回格式：`InspirationData`（包含 `locations`、`days`、`hasFullItinerary`）

---

#### 3. Seeker 模式

**接口：** `POST /api/seeker/generate-travel-plan`

**输入参数：**
```typescript
interface GenerateSeekerTravelPlanRequest {
  currentMood: string        // 当前心情，必填，如 'calm', 'active', 'romantic', 'adventurous', 'cultural'
  desiredExperience: string  // 期望体验，必填，如 'sightseeing', 'nature', 'food', 'shopping', 'nightlife', 'adventure'
  budget: string             // 预算范围，必填，如 'economy', 'comfort', 'luxury'
  duration: string           // 时长类型，必填，如 'weekend', 'week', 'extended'
  language?: string          // 语言代码，默认 'zh-CN'
  userCountry?: string       // 用户所在国家
  userNationality?: string   // 用户国籍
}
```

**调用位置：**
- `src/stores/travel.ts` → `generateItinerary('seeker')`
- `src/services/seekerBackendAPI.ts` → `generateSeekerTravelPlan()`

**特点：**
- ✅ 心情和体验输入：基于用户当前心情和期望体验
- ✅ 自动推荐目的地和生成行程
- ✅ 返回格式：`SeekerTravelPlanData`（包含 `destination`、`duration`、`itinerary`）

---

### 二、保存阶段（创建行程接口）

#### 所有模式共用

**接口：** `POST /api/itinerary`

**输入参数：**
```typescript
interface CreateItineraryRequest {
  destination: string          // 目的地，必填
  startDate: string           // 开始日期，格式：YYYY-MM-DD，必填
  days: number                // 行程天数，必填
  data: {
    days: Array<{
      day: number             // 第几天，从1开始
      date: string            // 日期，格式：YYYY-MM-DD
      activities: Array<{
        time: string          // 时间，格式：HH:mm
        title: string         // 活动标题
        type: 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'
        duration: number      // 持续时间（分钟）
        location: { lat: number; lng: number }
        notes: string         // 备注
        cost: number          // 费用
      }>
    }>
    totalCost: number         // 总费用
    summary: string           // 行程摘要
  }
  preferences?: {
    budget?: 'low' | 'medium' | 'high'
    travelStyle?: 'relaxed' | 'moderate' | 'intensive'
  }
  status?: 'draft' | 'published' | 'archived'
  // 注意：接口中没有 mode 字段
}
```

**调用位置：**
- `src/views/PlannerView.vue` → `createItinerary(createRequest)`
- `src/views/InspirationView.vue` → `createItinerary(createRequest)`
- `src/views/SeekerView.vue` → `createItinerary(createRequest)`
- `src/services/itineraryAPI.ts` → `createItinerary()`

**特点：**
- ✅ 统一的数据格式：所有模式都转换为相同的 `CreateItineraryRequest` 格式
- ✅ 使用 `convertFrontendDataToCreateRequest()` 函数进行转换
- ✅ 模式特有字段（如 `selectedLocation`、`inspirationConfig`、`seekerConfig`）保存在本地 `Travel.data` 中，不发送到后端

---

## 📝 总结

### 问题1：三个模式的输入参数是否一样？

**答：不一样**

- **Planner 模式**：结构化输入（目的地、天数、开始日期、偏好）
- **Inspiration 模式**：自然语言输入（自由文本 + 可选目的地）
- **Seeker 模式**：心情和体验输入（心情、体验、预算、时长）

### 问题2：三个模式是否都要调用生成旅行行程接口？

**答：是的，但调用的接口不同**

1. **生成阶段（创建行程之前）**：
   - ✅ Planner 模式：调用 `POST /api/v1/journeys/generate`
   - ✅ Inspiration 模式：调用 `POST /api/inspiration/generate-itinerary`
   - ✅ Seeker 模式：调用 `POST /api/seeker/generate-travel-plan`
   - **每个模式都有自己的生成接口**

2. **保存阶段（创建行程时）**：
   - ✅ 所有模式：都调用 `POST /api/itinerary`
   - **所有模式使用相同的保存接口**

---

## 🔄 数据流程

### Planner 模式流程

```
用户填写表单
  ↓
调用生成接口：POST /api/v1/journeys/generate
  { destination, days, startDate, preferences }
  ↓
返回：FrontendItineraryData（包含 days 和 timeSlots）
  ↓
用户确认
  ↓
转换为 CreateItineraryRequest 格式
  ↓
调用保存接口：POST /api/v1/journeys
  ↓
保存到数据库
```

### Inspiration 模式流程

```
用户输入自然语言："我想去冰岛看极光"
  ↓
检测目的地（可选）
  ↓
调用生成接口：POST /api/inspiration/generate-itinerary
  { input, selectedDestination, mode: 'full' | 'candidates', ... }
  ↓
返回：InspirationData（包含 locations 或 days）
  ↓
用户选择目的地（如果是候选模式）
  ↓
用户确认
  ↓
转换为 CreateItineraryRequest 格式
  ↓
调用保存接口：POST /api/v1/journeys
  ↓
保存到数据库
```

### Seeker 模式流程

```
用户选择心情和体验
  ↓
调用生成接口：POST /api/seeker/generate-travel-plan
  { currentMood, desiredExperience, budget, duration, ... }
  ↓
返回：SeekerTravelPlanData（包含 destination、duration、itinerary）
  ↓
用户确认
  ↓
转换为 CreateItineraryRequest 格式
  ↓
调用保存接口：POST /api/v1/journeys
  ↓
保存到数据库
```

---

## 🎯 关键区别

| 方面 | Planner | Inspiration | Seeker |
|------|---------|-------------|--------|
| **输入方式** | 结构化表单 | 自然语言文本 | 心情和体验选择 |
| **生成接口** | `/api/v1/journeys/generate` | `/api/inspiration/generate-itinerary` | `/api/seeker/generate-travel-plan` |
| **输入参数** | `{ destination, days, startDate, preferences }` | `{ input, selectedDestination, mode, ... }` | `{ currentMood, desiredExperience, budget, duration }` |
| **输出格式** | `FrontendItineraryData` | `InspirationData` | `SeekerTravelPlanData` |
| **保存接口** | ✅ 相同：`POST /api/v1/journeys` | ✅ 相同：`POST /api/v1/journeys` | ✅ 相同：`POST /api/v1/journeys` |
| **保存参数** | ✅ 相同：`CreateItineraryRequest` | ✅ 相同：`CreateItineraryRequest` | ✅ 相同：`CreateItineraryRequest` |

---

## ✅ 结论

1. **生成阶段的输入参数不一样**：三个模式接受的输入格式完全不同，因此需要不同的生成接口和参数。

2. **生成阶段都要调用接口**：每个模式都有自己的生成接口，在创建行程之前都会调用相应的生成接口。

3. **保存阶段使用相同接口**：所有模式创建行程后，都调用相同的 `POST /api/itinerary` 接口，使用统一的 `CreateItineraryRequest` 格式保存数据。

