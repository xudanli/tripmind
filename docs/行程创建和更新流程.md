# 行程创建和更新流程文档

本文档详细说明从创建行程到更新行程的完整流程，包括所有 API 调用。

## 一、创建行程流程

### 1.1 入口：TravelListView.vue - `handleSubmit()`

**触发位置**：用户点击"创建行程"按钮

**流程步骤**：

1. **构建自然语言描述**
   - **文件**：`src/views/TravelListView.vue`
   - **函数**：`buildNaturalLanguageDescription(formData)`
   - **说明**：从结构化表单数据构建自然语言描述，用于意图识别

2. **识别用户意图**（调用 `intentService.detect()`）
   - **文件**：`src/views/TravelListView.vue`
   - **服务**：`src/services/intentService.ts`
   - **函数**：`intentService.detect(naturalLanguageInput, language)`
   - **说明**：
     - 使用 AI 检测用户意图（调用 DeepSeek API）
     - 返回意图类型、关键词、情感基调等信息
     - 如果识别失败，不影响主流程，继续生成行程
   - **返回**：`IntentResult`（包含 intentType、keywords、emotionTone、description、confidence）

3. **生成行程数据**（调用 `travelStore.generateItinerary()`）
   - **文件**：`src/stores/travel.ts`
   - **函数**：`generateItinerary(mode: 'planner' | 'inspiration', intentData?: any)`
   - **调用接口**：
     - `POST /api/v1/journeys/generate` - 生成行程
     - **参数**：
       - `destination`: 目的地
       - `days`: 天数
       - `startDate`: 开始日期
       - `preferences`: 用户偏好
       - `mode`: 'planner' 或 'inspiration'
       - `intent`: 意图信息（包含 intentType、keywords、emotionTone、description、confidence）
     - **选项**：
       - `enrichWithLocationInfo: true` - 自动获取位置信息
       - `onProgress`: 进度回调
   - **返回**：`FrontendItineraryData`（包含 days 和 timeSlots）

2. **保存行程到后端**（调用 `createJourneyFromFrontendData()`）
   - **文件**：`src/services/itineraryAPI.ts`
   - **函数**：`createJourneyFromFrontendData(request, options)`
   - **调用接口**：
     - `POST /api/v1/journeys/from-frontend-data` - 创建行程
     - **参数**：
       - `itineraryData`: 完整的行程数据（包含 days 和 timeSlots）
       - `startDate`: 开始日期
     - **选项**：
       - `enrichWithLocationInfo: true` - 自动获取位置信息
   - **内部流程**：
     - 创建行程后，如果 `enrichWithLocationInfo` 为 true：
       1. 调用 `enrichItineraryWithLocationInfo()` 获取位置信息
       2. 调用 `updateJourneyFromFrontendData()` 更新位置信息到后端
       3. 调用 `getItineraryDetail()` 重新获取完整数据
   - **返回**：创建的行程数据（包含 id）

3. **更新行程数据**（可选，在 TravelListView.vue 中）
   - **文件**：`src/views/TravelListView.vue`
   - **调用接口**：
     - `PATCH /api/v1/journeys/{journeyId}/from-frontend-data` - 更新行程
     - **说明**：在创建后立即更新一次，确保数据完整

4. **创建本地 Travel 对象**
   - **文件**：`src/stores/travelList.ts`
   - **函数**：`createTravel(travelData)`
   - **说明**：在本地 store 中创建 Travel 对象，用于列表显示

5. **跳转到详情页**
   - 使用 `backendItineraryId` 跳转到 `/travel/{id}`

### 1.2 接口调用总结（创建流程）

```
1. POST /api/v1/journeys/generate
   ↓ (如果 enrichWithLocationInfo = true)
2. enrichItineraryWithLocationInfo() (内部调用 generateLocationBatch)
   ↓
3. POST /api/v1/journeys/from-frontend-data
   ↓ (如果 enrichWithLocationInfo = true)
4. enrichItineraryWithLocationInfo() (内部调用 generateLocationBatch)
   ↓
5. PATCH /api/v1/journeys/{journeyId}/from-frontend-data (更新位置信息)
   ↓
6. GET /api/v1/journeys/{journeyId} (重新获取完整数据)
   ↓ (可选，在 TravelListView 中)
7. PATCH /api/v1/journeys/{journeyId}/from-frontend-data (再次更新)
```

---

## 二、查看行程详情流程

### 2.1 入口：TravelDetailView.vue - `onMounted()`

**触发位置**：用户打开行程详情页

**流程步骤**：

1. **获取行程 ID**
   - 从路由参数获取 `id`
   - 如果是 UUID 格式，直接使用
   - 如果不是，从 store 中查找对应的 `backendItineraryId`

2. **加载行程详情**（调用 `loadItineraryFromBackend()`）
   - **文件**：`src/views/TravelDetailView.vue`
   - **函数**：`loadItineraryFromBackend(backendItineraryId)`
   - **调用接口**：
     - `GET /api/v1/journeys/{journeyId}` - 获取行程详情
     - **返回**：基础行程数据（包含 days 和 activities）
   
3. **批量获取活动详情**（可选）
   - **调用接口**：
     - `GET /api/v1/journeys/{journeyId}/activities/batch` - 批量获取活动详情
     - **参数**：
       - `dayIds`: 天的 ID 数组（可选）
     - **说明**：如果 `getItineraryDetail` 返回的 activities 缺少 details，调用此接口获取完整信息
     - **返回**：`{ activities: { [dayId]: Activity[] } }`

4. **获取目的地 ID**（可选）
   - **调用接口**：
     - `POST /api/v1/destinations/find-or-create` - 查找或创建目的地
     - **说明**：如果后端没有返回 `destinationId`，通过目的地名称查找或创建

5. **获取位置信息**（可选）
   - **条件**：如果活动缺少位置信息
   - **调用接口**：
     - `enrichItineraryWithLocationInfo()` (内部调用 `generateLocationBatch`)
     - `PATCH /api/v1/journeys/{journeyId}/from-frontend-data` - 更新位置信息

6. **数据转换和更新**
   - 将后端数据转换为前端格式（`activities` → `timeSlots`）
   - 合并活动详情（如果有批量获取的数据）
   - 更新 `travel.value.data.itineraryData.days`

### 2.2 接口调用总结（查看详情流程）

```
1. GET /api/v1/journeys/{journeyId}
   ↓ (如果缺少 destinationId)
2. POST /api/v1/destinations/find-or-create
   ↓ (如果缺少活动详情)
3. GET /api/v1/journeys/{journeyId}/activities/batch
   ↓ (如果缺少位置信息)
4. enrichItineraryWithLocationInfo() (内部调用 generateLocationBatch)
   ↓
5. PATCH /api/v1/journeys/{journeyId}/from-frontend-data (更新位置信息)
```

---

## 三、更新行程流程

### 3.1 入口：多个位置

#### 3.1.1 在详情页更新（TravelDetailView.vue）

**触发位置**：用户在详情页编辑活动后保存

**流程步骤**：

1. **用户编辑活动**
   - 在 `ExperienceDay.vue` 中编辑活动
   - 调用 `updateJourneyFromFrontendData()`

2. **更新接口调用**
   - **文件**：`src/services/itineraryAPI.ts`
   - **函数**：`updateJourneyFromFrontendData(journeyId, request)`
   - **调用接口**：
     - `PATCH /api/v1/journeys/{journeyId}/from-frontend-data` - 更新行程
     - **参数**：
       - `itineraryData`: 完整的行程数据（包含所有 days 和 timeSlots）
       - `startDate`: 开始日期
     - **说明**：此接口会完全替换现有的 days 和 activities 数据

3. **重新加载数据**（可选）
   - 如果更新接口返回的 days 为空，调用 `getItineraryDetail()` 重新获取

#### 3.1.2 在列表页更新（TravelListStore）

**触发位置**：通过 `travelListStore.updateTravel()` 更新

**流程步骤**：

1. **更新本地数据**
   - **文件**：`src/stores/travelList.ts`
   - **函数**：`updateTravel(id, updates)`
   - **说明**：先更新本地数据，然后异步同步到后端

2. **同步到后端**（异步）
   - **调用接口**：
     - `PATCH /api/v1/journeys/{journeyId}` - 更新行程（标准格式）
     - **参数**：
       - `destination`: 目的地
       - `startDate`: 开始日期
       - `summary`: 摘要
       - `totalCost`: 总费用
       - `status`: 状态
       - `preferences`: 偏好
       - `practicalInfo`: 实用信息
     - **说明**：只更新提供的字段，不会替换整个 days 数组

### 3.2 接口调用总结（更新流程）

**方式1：使用 from-frontend-data 接口（完整更新）**
```
PATCH /api/v1/journeys/{journeyId}/from-frontend-data
↓ (如果返回的 days 为空)
GET /api/v1/journeys/{journeyId}
```

**方式2：使用标准更新接口（部分更新）**
```
PATCH /api/v1/journeys/{journeyId}
```

---

## 四、关键接口说明

### 4.1 生成行程接口

**接口**：`POST /api/v1/journeys/generate`

**用途**：根据用户输入生成行程数据

**特点**：
- 支持 `planner` 和 `inspiration` 两种模式
- 可以自动推荐目的地（inspiration 模式）
- 可以自动获取位置信息（`enrichWithLocationInfo` 选项）

### 4.2 创建行程接口（前端格式）

**接口**：`POST /api/v1/journeys/from-frontend-data`

**用途**：使用前端数据格式创建完整行程

**特点**：
- 接受 `timeSlots` 格式（前端格式）
- 自动转换为后端的 `activities` 格式
- 支持 `practicalInfo` 字段
- 支持 `details` 字段（活动详细信息）

### 4.3 更新行程接口（前端格式）

**接口**：`PATCH /api/v1/journeys/{journeyId}/from-frontend-data`

**用途**：使用前端数据格式更新完整行程

**特点**：
- 完全替换现有的 days 和 activities 数据
- 需要提供完整的 days 数组
- 支持 `practicalInfo` 字段
- 支持 `details` 字段

### 4.4 更新行程接口（标准格式）

**接口**：`PATCH /api/v1/journeys/{journeyId}`

**用途**：部分更新行程信息

**特点**：
- 只更新提供的字段
- 不会替换整个 days 数组
- 适合更新元信息（如 summary、totalCost 等）

### 4.5 获取行程详情接口

**接口**：`GET /api/v1/journeys/{journeyId}`

**用途**：获取行程的完整信息

**返回**：
- 基础行程信息
- days 数组（包含 activities）
- 可能不包含完整的 details 信息

### 4.6 批量获取活动详情接口

**接口**：`GET /api/v1/journeys/{journeyId}/activities/batch`

**用途**：批量获取活动的详细信息（包含完整的 details）

**参数**：
- `dayIds`: 天的 ID 数组（可选，不提供则获取所有天的活动）

**返回**：
- `{ activities: { [dayId]: Activity[] } }`

### 4.7 获取位置信息接口

**内部函数**：`enrichItineraryWithLocationInfo()`

**用途**：为活动获取详细的位置信息

**内部调用**：
- `generateLocationBatch()` - 批量生成位置信息

**特点**：
- 会调用 TripAdvisor API 获取位置详情
- 将位置信息合并到 `details` 字段中

---

## 五、数据格式转换

### 5.1 前端格式 → 后端格式

**前端格式**：
```typescript
{
  days: [{
    day: 1,
    date: "2024-06-01",
    timeSlots: [{
      time: "09:00",
      title: "活动标题",
      type: "attraction",
      coordinates: { lat: 47.0502, lng: 8.3093 },
      notes: "活动描述",
      details: {
        highlights: [...],
        insiderTip: "...",
        bookingSignal: "..."
      },
      cost: 0,
      duration: 90
    }]
  }]
}
```

**后端格式**：
```typescript
{
  days: [{
    day: 1,
    date: "2024-06-01",
    activities: [{
      time: "09:00",
      title: "活动标题",
      type: "attraction",
      location: { lat: 47.0502, lng: 8.3093 },
      notes: "活动描述",
      details: {
        highlights: [...],
        insiderTip: "...",
        bookingSignal: "..."
      },
      cost: 0,
      duration: 90
    }]
  }]
}
```

**转换规则**：
- `timeSlots` → `activities`
- `coordinates` → `location`
- 其他字段保持不变

### 5.2 后端格式 → 前端格式

**转换位置**：`loadItineraryFromBackend()` 函数中

**转换规则**：
- `activities` → `timeSlots`
- `location` → `coordinates`
- 合并批量获取的 `details` 信息
- 保留所有 `details` 字段（highlights、insiderTip、bookingSignal 等）

---

## 六、问题诊断

### 6.1 只显示部分信息的问题

**可能原因**：

1. **数据转换时丢失**
   - 检查 `loadItineraryFromBackend()` 中的数据转换逻辑
   - 确保所有 `details` 字段都被正确保留

2. **批量获取活动详情失败**
   - 检查 `batchGetActivities()` 是否成功
   - 检查返回的 `activitiesMap` 是否正确

3. **数据更新时被覆盖**
   - 检查 `Object.assign()` 是否正确合并数据
   - 确保使用新数组触发 Vue 响应式更新

4. **后端返回数据不完整**
   - 检查 `getItineraryDetail()` 返回的数据
   - 检查是否需要调用 `batchGetActivities()` 获取完整信息

### 6.2 调试建议

1. **查看控制台日志**：
   - `[TravelDetailView] 从后端加载行程详情`
   - `[TravelDetailView] 转换为前端格式成功`
   - `[TravelDetailView] ✅ 已更新 itineraryData.days`
   - `✅ [后端数据优先] 从 data.itineraryData.days 获取行程数据`

2. **检查数据流**：
   - 后端返回的数据 → 数据转换 → 前端显示
   - 确保每个步骤都正确执行

3. **验证数据结构**：
   - 检查 `travel.value.data.itineraryData.days` 是否包含所有天的数据
   - 检查每个 `day.timeSlots` 是否包含所有活动
   - 检查每个 `slot.details` 是否包含完整信息

---

## 七、优化建议

### 7.1 减少接口调用

**问题**：创建行程时可能调用多次更新接口

**建议**：
- 在 `createJourneyFromFrontendData()` 中，如果已经获取了位置信息，就不需要再次更新
- 在 `TravelListView.vue` 中，创建后不需要再次调用 `updateJourneyFromFrontendData()`

### 7.2 统一数据格式

**问题**：前端使用 `timeSlots`，后端使用 `activities`，转换逻辑分散

**建议**：
- 在 API 层统一处理格式转换
- 前端始终使用 `timeSlots` 格式
- 只在 API 调用时转换为后端格式

### 7.3 优化数据加载

**问题**：查看详情时可能调用多个接口

**建议**：
- 后端接口返回完整数据（包括 details）
- 减少对 `batchGetActivities()` 的依赖
- 使用缓存机制避免重复请求

---

## 八、接口调用流程图

```
创建行程：
用户提交表单
  ↓
generateItinerary() → POST /api/v1/journeys/generate
  ↓ (如果 enrichWithLocationInfo = true)
enrichItineraryWithLocationInfo() → generateLocationBatch()
  ↓
createJourneyFromFrontendData() → POST /api/v1/journeys/from-frontend-data
  ↓ (如果 enrichWithLocationInfo = true)
enrichItineraryWithLocationInfo() → generateLocationBatch()
  ↓
updateJourneyFromFrontendData() → PATCH /api/v1/journeys/{journeyId}/from-frontend-data
  ↓
getItineraryDetail() → GET /api/v1/journeys/{journeyId}
  ↓ (可选，在 TravelListView 中)
updateJourneyFromFrontendData() → PATCH /api/v1/journeys/{journeyId}/from-frontend-data

查看详情：
页面加载
  ↓
getItineraryDetail() → GET /api/v1/journeys/{journeyId}
  ↓ (如果缺少 destinationId)
findOrCreateDestination() → POST /api/v1/destinations/find-or-create
  ↓ (如果缺少活动详情)
batchGetActivities() → GET /api/v1/journeys/{journeyId}/activities/batch
  ↓ (如果缺少位置信息)
enrichItineraryWithLocationInfo() → generateLocationBatch()
  ↓
updateJourneyFromFrontendData() → PATCH /api/v1/journeys/{journeyId}/from-frontend-data

更新行程：
用户编辑活动
  ↓
updateJourneyFromFrontendData() → PATCH /api/v1/journeys/{journeyId}/from-frontend-data
  ↓ (如果返回的 days 为空)
getItineraryDetail() → GET /api/v1/journeys/{journeyId}
```

