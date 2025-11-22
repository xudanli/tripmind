# 灵感模式后端接口需求文档

## 📋 概述

本文档说明灵感模式（Inspiration Mode）需要后端提供的接口。**灵感模式的数据保存结构必须与 Planner 模式完全相同**，使用相同的数据结构和接口。

**注意：Seeker 模式的数据保存结构也必须与 Planner 模式完全相同，使用相同的数据结构和接口。**

---

## 🔄 三种模式的对比

### 相同点
- ✅ **数据保存结构完全相同** - 所有模式都使用相同的 `CreateItineraryRequest` 接口
- ✅ **后端接口完全相同** - 所有模式都使用 `POST /itinerary` 接口
- ✅ 详情页结构完全相同（都使用 `InspirationHero` 和 `ExperienceDay` 组件）
- ✅ 详情页加载逻辑相同（如果有 `backendItineraryId`，从后端加载）

### 不同点

#### 1. 输入信息格式不同（仅前端生成阶段）

| 模式 | 输入方式 | 输入字段 |
|------|---------|---------|
| **Planner** | 结构化表单 | destination, duration, budget, preferences, travelStyle |
| **Seeker** | 卡片选择 | currentMood, desiredExperience, budget, duration |
| **Inspiration** | 自然语言输入 | input（如"我想去一个安静的地方放松"） |

#### 2. 前端数据特点不同（仅前端展示阶段）

| 模式 | 数据特点 |
|------|---------|
| **Planner** | 保留所有文本内容和图片 |
| **Seeker** | 保留所有文本内容和图片（但当前详情页被禁用） |
| **Inspiration** | **只保留图片数据，移除所有文本描述** |

#### 3. 保存到后端的数据结构（完全相同）

- ✅ **所有模式都转换为 `CreateItineraryRequest` 格式**
- ✅ **使用相同的数据转换函数** `convertFrontendDataToCreateRequest`
- ✅ **使用相同的后端接口** `POST /itinerary`

---

## 🎯 灵感模式和 Seeker 模式需要的后端接口

**重要：灵感模式和 Seeker 模式与 Planner 模式使用完全相同的数据结构和接口。**

### 1. 创建行程接口（与 Planner 模式共用）

**接口路径：** `POST /itinerary`

**接口描述：** 创建行程（Planner 模式、Seeker 模式和灵感模式共用此接口）

**请求参数：**

```typescript
interface CreateItineraryRequest {
  destination: string
  startDate: string  // YYYY-MM-DD
  days: number
  data: {
    days: Array<{
      day: number
      date: string  // YYYY-MM-DD
      activities: Array<{
        time: string  // HH:mm
        title: string
        type: 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'
        duration: number  // 分钟数
        location: {
          lat: number
          lng: number
        }
        notes: string
        cost: number
      }>
    }>
    totalCost: number
    summary: string
    // 可选：灵感模式特有字段
    selectedLocation?: string  // 用户选择的目的地
    inspirationConfig?: any  // 动态生成的配置
  }
  preferences?: {
    interests?: string[]
    budget?: 'low' | 'medium' | 'high'
    travelStyle?: 'relaxed' | 'moderate' | 'intensive'
  }
  status?: 'draft' | 'published' | 'archived'
  // 可选：模式标识（用于区分灵感模式和planner模式）
  mode?: 'planner' | 'inspiration'
}
```

**响应数据：**

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
    createdAt: string
    updatedAt: string
  }
}
```

**关键说明：**
- ✅ Planner 模式和灵感模式使用**完全相同**的接口和数据结构
- ✅ 灵感模式需要将前端的 `timeSlots` 转换为 `activities` 格式
- ✅ 灵感模式可以在 `data` 字段中添加额外字段（如 `selectedLocation`, `inspirationConfig`），但核心结构必须一致

---

### 2. 获取行程详情接口（与 Planner 模式共用）

**接口路径：** `GET /itinerary/:id`

**接口描述：** 获取行程详细信息（Planner 模式和灵感模式共用）

**请求参数：**
- `id`: 行程ID（路径参数）

**响应数据：** 与 `CreateItineraryResponse` 的 `data` 字段格式相同

---

### 3. 获取行程列表接口（与 Planner 模式共用）

**接口路径：** `GET /itinerary`

**接口描述：** 获取行程列表（Planner 模式和灵感模式共用）

**请求参数：**

```typescript
interface GetItineraryListParams {
  status?: 'draft' | 'published' | 'archived'
  mode?: 'planner' | 'inspiration'  // 可选：按模式筛选
  page?: number
  limit?: number
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
  total: number
  page: number
  limit: number
}
```

---

### 4. 更新行程接口（与 Planner 模式共用）

**接口路径：** `PUT /itinerary/:id`

**接口描述：** 更新行程信息（Planner 模式和灵感模式共用）

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

**响应数据：** 与创建接口相同

---

### 5. 删除行程接口（与 Planner 模式共用）

**接口路径：** `DELETE /itinerary/:id`

**接口描述：** 删除行程（Planner 模式和灵感模式共用）

**响应数据：**

```typescript
interface DeleteItineraryResponse {
  success: boolean
  message: string
}
```

---

## 📊 接口对比表

| 功能 | Planner 模式 | 灵感模式 | 是否共用 |
|------|-------------|---------|---------|
| 创建行程 | `POST /itinerary` | `POST /itinerary` | ✅ **完全相同** |
| 获取详情 | `GET /itinerary/:id` | `GET /itinerary/:id` | ✅ **完全相同** |
| 获取列表 | `GET /itinerary` | `GET /itinerary` | ✅ **完全相同** |
| 更新行程 | `PUT /itinerary/:id` | `PUT /itinerary/:id` | ✅ **完全相同** |
| 删除行程 | `DELETE /itinerary/:id` | `DELETE /itinerary/:id` | ✅ **完全相同** |

---

## 🔧 前端使用方式

### 创建灵感行程

**关键：灵感模式必须将前端数据转换为与 Planner 模式相同的数据结构。**

```typescript
// 在 createTravel() 函数中，灵感模式创建 Travel 之前
import { convertFrontendDataToCreateRequest, createItinerary } from '@/services/itineraryAPI'

const createInspirationItinerary = async (
  inspirationData: InspirationData,
  selectedLocation: string,
  startDate: string = new Date().toISOString().split('T')[0]
) => {
  // 1. 将灵感模式的 days/timeSlots 转换为与 Planner 模式相同的格式
  const frontendItineraryData = {
    days: inspirationData.days.map(day => ({
      day: day.day,
      date: day.date,
      timeSlots: day.timeSlots.map(slot => ({
        time: slot.time,
        coordinates: slot.coordinates || { lat: 0, lng: 0 },
        // 转换为 activities 需要的字段
        title: slot.details?.title || '',  // 如果有标题
        type: slot.details?.type || 'attraction' as const,
        duration: slot.details?.duration || 60,
        cost: slot.details?.cost || 0,
        // notes 可以为空（灵感模式移除文本描述）
        details: {
          notes: '',  // 灵感模式不保存文本描述
          description: '',
          // 但可以保留图片
          images: slot.details?.images,
          photos: slot.details?.photos
        }
      }))
    })),
    totalCost: 0,  // 灵感模式可能没有成本信息
    summary: ''  // 灵感模式不保存文本摘要
  }

  // 2. 转换为后端请求格式（与 Planner 模式使用相同的转换函数）
  const createRequest = convertFrontendDataToCreateRequest(
    frontendItineraryData as any,
    selectedLocation,
    startDate,
    undefined,  // preferences 可以为空
    'draft'
  )

  // 3. 可选：添加灵感模式特有字段到 data 中
  createRequest.data = {
    ...createRequest.data,
    selectedLocation: selectedLocation,
    inspirationConfig: inspirationConfig  // 如果有配置
  }

  // 4. 可选：添加模式标识
  createRequest.mode = 'inspiration'

  // 5. 调用与 Planner 模式相同的接口
  const backendItinerary = await createItinerary(createRequest)
  return backendItinerary.id  // 返回 backendItineraryId
}
```

### 数据转换关键点

**重要：灵感模式需要将 `timeSlots` 转换为 `activities` 格式**

```typescript
// 前端灵感模式数据格式
{
  days: [{
    day: 1,
    date: "2024-01-01",
    timeSlots: [{
      time: "09:00",
      coordinates: { lat: 64.123, lng: -21.456 },
      details: {
        images: { cover: "...", gallery: [...] },
        photos: [...]
      }
    }]
  }]
}

// 转换为后端需要的格式
{
  days: 1,
  data: {
    days: [{
      day: 1,
      date: "2024-01-01",
      activities: [{  // timeSlots → activities
        time: "09:00",
        title: "",  // 灵感模式可以为空
        type: "attraction",
        duration: 60,
        location: { lat: 64.123, lng: -21.456 },
        notes: "",  // 灵感模式不保存文本
        cost: 0
      }]
    }],
    totalCost: 0,
    summary: ""
  }
}
```

### 加载灵感行程详情

```typescript
// 在 TravelDetailView.vue 的 onMounted 中
// 使用与 Planner 模式相同的加载逻辑
if (travel.value?.mode === 'inspiration') {
  const backendItineraryId = travel.value.data?.backendItineraryId
  if (backendItineraryId) {
    // 使用与 Planner 模式相同的接口
    const { getItineraryDetail } = await import('@/services/itineraryAPI')
    const backendItinerary = await getItineraryDetail(backendItineraryId)
    
    // 将后端数据转换为前端格式（与 Planner 模式相同）
    // ...
  }
}
```

---

## 📝 数据转换规则

### 灵感模式 → 后端格式

灵感模式在保存到后端之前，需要转换为与 Planner 模式相同的数据结构：

**转换步骤：**

1. **timeSlots → activities**
   ```typescript
   activities = timeSlots.map(slot => ({
     time: slot.time,
     title: slot.details?.title || '',  // 灵感模式可能为空
     type: slot.details?.type || 'attraction',
     duration: slot.details?.duration || 60,
     location: slot.coordinates || { lat: 0, lng: 0 },
     notes: '',  // 灵感模式不保存文本描述
     cost: slot.details?.cost || 0
   }))
   ```

2. **添加必需字段**
   - `destination`: 从 `selectedLocation` 或 `data.destination` 获取
   - `startDate`: 使用当前日期或用户指定的日期
   - `days`: 天数（从 `days` 数组长度获取）
   - `totalCost`: 默认为 0（灵感模式可能没有成本信息）
   - `summary`: 默认为空字符串（灵感模式不保存文本摘要）

3. **保留可选字段**
   - 可以在 `data` 对象中添加 `selectedLocation` 和 `inspirationConfig`
   - 这些字段不影响核心数据结构，但可以为前端提供额外信息

---

## 📋 总结

**重要结论：灵感模式的数据保存结构必须与 Planner 模式完全相同**

### 核心要点

1. ✅ **使用相同的接口** - `POST /itinerary`, `GET /itinerary/:id` 等
2. ✅ **使用相同的数据结构** - `CreateItineraryRequest` 格式
3. ✅ **使用相同的数据转换函数** - `convertFrontendDataToCreateRequest`
4. ✅ **时间槽转换** - 将 `timeSlots` 转换为 `activities` 格式
5. ✅ **字段填充** - 即使灵感模式不保存文本，也需要填充必需字段（可以为空）

### 数据差异说明

虽然灵感模式前端不显示文本内容，但保存到后端时：
- ✅ 必须包含 `title`, `notes`, `summary` 等字段（可以为空字符串）
- ✅ 必须包含 `type`, `duration`, `cost` 等字段（可以使用默认值）
- ✅ 必须符合 `CreateItineraryRequest` 的完整结构
- ✅ 可以在 `data` 中添加额外字段（如 `inspirationConfig`）用于前端展示

**实现建议：** 灵感模式在保存前，使用与 Planner 模式相同的数据转换函数，确保数据结构完全一致。

---

## 🧠 灵感模式生成阶段接口需求

**注意：以下接口用于灵感模式的生成阶段（创建行程之前），与上述数据保存接口不同。**

### 1. 意图识别接口（推荐）

**接口路径：** `POST /inspiration/detect-intent`

**接口描述：** 分析用户自然语言输入，识别旅行意图、关键词、情感倾向等

**请求参数：**

```typescript
interface DetectIntentRequest {
  input: string  // 用户自然语言输入，如"我想去一个安静的地方放松"
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

**意图类型说明：**
- `photography_exploration` - 摄影探索
- `cultural_exchange` - 文化交流
- `emotional_healing` - 情感疗愈
- `mind_healing` - 心灵疗愈
- `extreme_exploration` - 极限探索
- `urban_creation` - 城市创作
- 其他...

**使用场景：**
- 在用户输入后，快速识别用户意图
- 为后续目的地推荐和行程生成提供依据

**当前实现：** 前端通过 LLM API 直接调用（`IntentService.detect`）

**后端优势：**
- 可以缓存常见意图识别结果
- 统一的意图分类管理
- 更好的性能和成本控制

---

### 2. 目的地推荐接口（推荐）

**接口路径：** `POST /inspiration/recommend-destinations`

**接口描述：** 根据用户意图和需求，推荐候选目的地列表（8-12个）

**请求参数：**

```typescript
interface RecommendDestinationsRequest {
  input: string  // 用户自然语言输入
  intent?: {
    intentType: string
    keywords: string[]
    emotionTone: string
  }  // 意图识别结果（可选，如果不提供会在后端识别）
  language?: string  // 语言代码，默认 'zh-CN'
  userCountry?: string  // 用户所在国家
  userNationality?: string  // 用户国籍
  userPermanentResidency?: string  // 用户永久居住地
  heldVisas?: string[]  // 用户持有的签证
  visaFreeDestinations?: string[]  // 免签目的地列表
  visaInfoSummary?: string | null  // 签证信息摘要
  limit?: number  // 返回数量，默认 10，范围 8-12
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

**使用场景：**
- 用户输入后，如果意图不够明确，先推荐候选目的地
- 用户选择目的地后，再生成完整行程

**当前实现：** 前端通过 LLM API 调用（`JourneyService.generateJourney` with `mode: 'candidates'`）

**后端优势：**
- 可以结合本地数据库和AI推荐
- 更好的目的地数据管理
- 可以记录推荐历史，优化推荐算法

---

### 3. 生成完整行程接口（推荐）

**接口路径：** `POST /inspiration/generate-itinerary`

**接口描述：** 根据用户输入和意图，生成完整的详细行程

**请求参数：**

```typescript
interface GenerateItineraryRequest {
  input: string  // 用户自然语言输入
  selectedDestination?: string  // 用户选择的目的地（可选）
  intent?: {
    intentType: string
    keywords: string[]
    emotionTone: string
  }  // 意图识别结果（可选）
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
interface GenerateItineraryResponse {
  success: boolean
  data: {
    title: string
    destination?: string
    location?: string
    locations?: string[]  // 如果 mode === 'candidates'，返回候选列表
    duration: string | number
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
          // ... 其他详情
        }
      }>
    }>
    hasFullItinerary?: boolean  // 是否有完整行程
    generationMode?: 'full' | 'candidates'
    highlights?: string[]
    // ... 其他字段
  }
}
```

**使用场景：**
- 用户选择目的地后，生成完整的详细行程
- 或用户输入明确时，直接生成完整行程

**当前实现：** 前端通过 LLM API 调用（`JourneyService.generateJourney`）

**后端优势：**
- 统一管理行程生成逻辑
- 可以缓存常见行程生成结果
- 更好的性能优化和成本控制
- 可以记录生成历史，优化生成质量

---

### 4. 天数提取接口（可选）

**接口路径：** `POST /inspiration/extract-days`

**接口描述：** 从用户输入中提取行程天数

**请求参数：**

```typescript
interface ExtractDaysRequest {
  input: string  // 用户输入
  language?: string  // 语言代码，默认 'zh-CN'
}
```

**响应数据：**

```typescript
interface ExtractDaysResponse {
  success: boolean
  data: {
    days: number | null  // 提取到的天数，如果未提取到则为 null
    confidence?: number  // 置信度
  }
}
```

**使用场景：**
- 快速从用户输入中提取天数信息
- 为行程生成提供天数参数

**当前实现：** 前端通过正则表达式和规则提取（`extractDaysFromInput`）

**后端优势：**
- 可以使用AI更准确地提取
- 统一的天数提取逻辑

---

## 📊 生成阶段接口对比

| 功能 | 当前实现 | 后端接口 | 推荐优先级 |
|------|---------|---------|-----------|
| 意图识别 | 前端 LLM API 调用 | `POST /inspiration/detect-intent` | ⭐⭐⭐ 高 |
| 目的地推荐 | 前端 LLM API 调用 | `POST /inspiration/recommend-destinations` | ⭐⭐⭐ 高 |
| 生成完整行程 | 前端 LLM API 调用 | `POST /inspiration/generate-itinerary` | ⭐⭐⭐ 高 |
| 天数提取 | 前端正则提取 | `POST /inspiration/extract-days` | ⭐ 低（可选） |

---

## 🎯 完整流程示例

### 流程一：候选模式（先推荐目的地，再生成行程）

```
1. 用户输入："我想去一个安静的地方放松"
   ↓
2. 调用意图识别接口：POST /inspiration/detect-intent
   返回：{ intentType: 'emotional_healing', keywords: ['安静', '放松'], ... }
   ↓
3. 调用目的地推荐接口：POST /inspiration/recommend-destinations
   返回：{ locations: ['冰岛', '挪威', '瑞士', ...] }
   ↓
4. 用户选择目的地："冰岛"
   ↓
5. 调用生成完整行程接口：POST /inspiration/generate-itinerary
   { selectedDestination: '冰岛', mode: 'full' }
   返回：完整的行程数据
   ↓
6. 用户确认，调用创建行程接口：POST /itinerary
   保存到后端数据库
```

### 流程二：直接生成模式（直接生成完整行程）

```
1. 用户输入："我想去冰岛看极光"
   ↓
2. 调用生成完整行程接口：POST /inspiration/generate-itinerary
   { input: '我想去冰岛看极光', mode: 'full' }
   返回：完整的行程数据
   ↓
3. 用户确认，调用创建行程接口：POST /itinerary
   保存到后端数据库
```

---

### 流程三：Seeker 模式流程

```
1. 用户选择心情和体验需求：
   { currentMood: 'calm', desiredExperience: 'nature', budget: 'comfort', duration: 'week' }
   ↓
2. 调用生成行程接口：POST /seeker/generate-travel-plan
   { currentMood: 'calm', desiredExperience: 'nature', budget: 'comfort', duration: 'week' }
   返回：完整的行程数据
   ↓
3. 用户确认，调用创建行程接口：POST /itinerary
   保存到后端数据库
```

**注意：Seeker 模式应该使用后端接口生成行程，与灵感模式一样。**

---

## 🎯 Seeker 模式生成阶段接口需求

**注意：以下接口用于 Seeker 模式的生成阶段（创建行程之前），与数据保存接口不同。**

### Seeker 模式生成行程接口（必须）

**接口路径：** `POST /seeker/generate-travel-plan`

**当前实现：** Seeker 模式目前通过 `emotionalTravelAPI.generateTravelPlan` 调用后端API（端点：`/emotional-travel/generate-plan`），应该统一使用 `/seeker/generate-travel-plan` 接口。

**接口描述：** 根据用户心情和体验需求，生成适合的旅行计划

**请求参数：**

```typescript
interface GenerateSeekerTravelPlanRequest {
  currentMood: string  // 当前心情，如 'calm', 'active', 'romantic', 'adventurous', 'cultural'
  desiredExperience: string  // 期望体验，如 'sightseeing', 'nature', 'food', 'shopping', 'nightlife', 'adventure'
  budget: string  // 预算范围，如 'economy', 'comfort', 'luxury'
  duration: string  // 时长类型，如 'weekend', 'week', 'extended'
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

**使用场景：**
- 用户选择心情和体验需求后，生成适合的旅行计划
- AI 根据用户的心情推荐目的地和行程

**当前实现：** 
- 前端通过 `emotionalTravelAPI.generateTravelPlan` 调用后端API（端点：`/emotional-travel/generate-plan`）
- **建议：统一使用 `/seeker/generate-travel-plan` 接口**

**后端优势：**
- 统一管理行程生成逻辑
- 可以缓存常见行程生成结果
- 更好的性能优化和成本控制
- 与其他模式（灵感模式）保持一致的接口风格

---

## 📝 总结

**灵感模式和 Seeker 模式需要的后端接口分为两类：**

### 1. 生成阶段接口（创建行程之前）

#### 灵感模式：
- ✅ **意图识别接口**（推荐）- `POST /inspiration/detect-intent`
- ✅ **目的地推荐接口**（推荐）- `POST /inspiration/recommend-destinations`
- ✅ **生成完整行程接口**（推荐）- `POST /inspiration/generate-itinerary`
- ⭐ **天数提取接口**（可选）- `POST /inspiration/extract-days`

#### Seeker 模式：
- ✅ **生成行程接口**（必须）- `POST /seeker/generate-travel-plan`
  - **当前端点：** `/emotional-travel/generate-plan`（通过 `emotionalTravelAPI.generateTravelPlan`）
  - **建议统一：** `/seeker/generate-travel-plan`

### 2. 数据保存接口（创建行程之后）

**所有模式共用：**
- ✅ **创建行程接口**（必须）- `POST /itinerary`（Planner、Seeker、灵感模式共用）
- ✅ **获取行程详情接口**（推荐）- `GET /itinerary/:id`（所有模式共用）
- ✅ **获取行程列表接口**（可选）- `GET /itinerary`（所有模式共用）
- ✅ **更新/删除接口**（可选）- `PUT /itinerary/:id`, `DELETE /itinerary/:id`（所有模式共用）

---

## 📊 三种模式接口对比表

| 功能 | Planner | Seeker | Inspiration | 是否共用 |
|------|---------|--------|-------------|---------|
| **生成阶段** |
| 生成行程 | 前端直接生成（或可后端支持） | ✅ `POST /seeker/generate-travel-plan`（必须） | ✅ `POST /inspiration/generate-itinerary`（推荐） | ❌ 否 |
| 意图识别 | 不需要 | 不需要 | `POST /inspiration/detect-intent` | ❌ 否 |
| 目的地推荐 | 不需要 | 不需要 | `POST /inspiration/recommend-destinations` | ❌ 否 |
| **数据保存** |
| 创建行程 | `POST /itinerary` | `POST /itinerary` | `POST /itinerary` | ✅ **完全相同** |
| 获取详情 | `GET /itinerary/:id` | `GET /itinerary/:id` | `GET /itinerary/:id` | ✅ **完全相同** |
| 获取列表 | `GET /itinerary` | `GET /itinerary` | `GET /itinerary` | ✅ **完全相同** |
| 更新/删除 | `PUT /itinerary/:id` | `PUT /itinerary/:id` | `PUT /itinerary/:id` | ✅ **完全相同** |

---

## 🎯 关键要点

1. **数据保存接口：** 所有模式必须使用相同的接口和数据结构
   - ✅ 都使用 `POST /itinerary` 创建行程
   - ✅ 都使用 `CreateItineraryRequest` 数据结构
   - ✅ 都使用 `convertFrontendDataToCreateRequest` 转换函数

2. **生成阶段接口：** 每种模式有不同的生成逻辑
   - **Planner 模式**：前端直接生成（使用表单数据），或可后端支持
   - **Seeker 模式**：✅ **必须使用后端接口** `POST /seeker/generate-travel-plan`（基于心情和体验）
   - **灵感模式**：✅ **推荐使用后端接口** `POST /inspiration/generate-itinerary`（基于自然语言输入）

3. **数据转换：** 无论哪种模式，保存到后端时都必须转换为相同的数据结构
   - `timeSlots` → `activities`
   - 填充必需字段（即使为空）
   - 可以在 `data` 中添加模式特有字段（如 `inspirationConfig`, `moodData`）

---

**实现建议：** 所有模式在保存前，使用与 Planner 模式相同的数据转换函数，确保数据结构完全一致。

