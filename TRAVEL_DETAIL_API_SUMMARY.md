# 旅行详情页接口对接汇总

本文档汇总了旅行详情页（`TravelDetailView.vue`）及其子组件对接的所有后端接口。

## 一、行程相关接口

### 1. 获取行程详情
- **接口函数**: `getItineraryDetail(journeyId: string)`
- **后端接口**: `GET /api/v1/journeys/{journeyId}`
- **调用位置**: 
  - `TravelDetailView.vue` - `onMounted` 和 `handleTravelRefresh`
  - `TravelDetailView.vue` - `loadItineraryFromBackend`
- **用途**: 获取行程基本信息（目的地、天数、总费用、摘要等）

### 2. 批量获取活动详情
- **接口函数**: `batchGetActivities(journeyId: string, options?: { dayIds?: string[] })`
- **后端接口**: `GET /api/v1/journeys/{journeyId}/activities/batch`
- **调用位置**: `TravelDetailView.vue` - `loadItineraryFromBackend`
- **用途**: 批量获取行程中所有活动的详细信息（包括完整的 `details` 字段）

### 3. 更新行程信息
- **接口函数**: `updateItinerary(id: string, request: UpdateItineraryRequest)`
- **后端接口**: `PATCH /api/v1/journeys/{journeyId}`
- **调用位置**: `InspirationHero.vue` - `handleSaveJourneyInfo`
- **用途**: 更新行程的基本信息（标题、目的地、开始日期、天数、预算等）

### 4. 添加天到行程
- **接口函数**: `addDayToJourney(journeyId: string, request: AddDayRequest)`
- **后端接口**: `POST /api/v1/journeys/{journeyId}/days`
- **调用位置**: `ExperienceDay.vue`
- **用途**: 在行程中添加新的一天

### 5. 为指定天数添加时间段
- **接口函数**: `addSlotToDay(journeyId: string, dayId: string, slotData: AddSlotToDayRequest)`
- **后端接口**: `POST /api/v1/journeys/{journeyId}/days/{dayId}/slots`
- **调用位置**: 
  - `ExperienceDay.vue` - `handleSaveEdit`（保存新增活动时）
  - `ExperienceDay.vue` - `addPOIToItinerary`（添加 POI 到行程时）
- **用途**: 为指定天数添加时间段（活动）
- **参数说明**:
  - `time`: 时间段（HH:MM 格式）
  - `title`: 活动标题
  - `type`: 活动类型（'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'）
  - `duration`: 持续时间（分钟数）
  - `location`: 位置坐标（{ lat: number, lng: number }）
  - `notes`: 备注（可选）
  - `cost`: 费用（可选）
  - `locationDetails`: 位置详细信息（可选，包含多语言名称、地址、交通、开放时间等）
- **备注**: 
  - 当用户手动添加新活动或从 POI 搜索添加活动时，会自动调用此接口
  - 如果缺少 `backendItineraryId` 或 `dayId`，会跳过接口调用（只在前端添加）
  - 接口调用失败不会阻止前端操作，会显示警告消息
  - 如果获取了位置信息，会自动包含 `locationDetails` 字段

### 6. 删除指定时间段（活动）
- **接口函数**: `deleteSlot(journeyId: string, dayId: string, slotId: string)`
- **后端接口**: `DELETE /api/v1/journeys/{journeyId}/days/{dayId}/slots/{slotId}`
- **调用位置**: `ExperienceDay.vue` - `handleDeleteSlot`（删除活动时）
- **用途**: 删除指定天数中的时间段（活动）
- **参数说明**:
  - `journeyId`: 行程ID（UUID）
  - `dayId`: 天数ID（UUID）
  - `slotId`: 活动ID（UUID）
- **备注**: 
  - 当用户确认删除活动时，会先在前端删除（立即显示），然后调用后端接口
  - 如果缺少 `backendItineraryId`、`dayId` 或 `slotId`，会跳过接口调用（只在前端删除）
  - 接口调用失败不会阻止前端操作，会显示警告消息

### 7. 丰富行程位置信息
- **接口函数**: `enrichItineraryWithLocationInfo(itineraryData, destination, onProgress?)`
- **后端接口**: 内部调用 `generateLocationBatch`
- **调用位置**: `TravelDetailView.vue` - `loadItineraryFromBackend`
- **用途**: 为行程中的所有活动批量获取位置信息（如果批量接口未返回完整位置信息时使用）

## 二、POI 搜索接口

### 8. POI 搜索（后端接口）
- **接口函数**: `searchPOI(request: POISearchRequest)`
- **后端接口**: `POST /api/v1/poi/search`
- **调用位置**: `ExperienceDay.vue` - `performSearch`
- **用途**: 搜索附近的 POI（景点、餐厅、酒店等）
- **备注**: 优先使用后端接口，如果返回空结果或失败，会回退到 AI 搜索（`searchNearbyPOI`）

## 三、位置信息接口

### 9. 生成单个活动位置信息
- **接口函数**: `generateLocation(request: GenerateLocationRequest)`
- **后端接口**: `POST /api/v1/location/generate`
- **调用位置**: `ExperienceDay.vue` - `addPOIToItinerary`
- **用途**: 当用户将 POI 添加到行程时，获取该 POI 的详细位置信息（包括预计停留时间、开放时间、票价、交通信息等）
- **触发时机**: 用户点击"添加到行程"按钮后，异步调用

### 10. 批量生成位置信息
- **接口函数**: `generateLocationBatch(request: GenerateLocationBatchRequest)`
- **后端接口**: `POST /api/v1/location/generate-batch`
- **调用位置**: `itineraryAPI.ts` - `enrichItineraryWithLocationInfo`（内部调用）
- **用途**: 批量获取多个活动的位置信息

## 四、安全提示接口

### 11. 获取安全提示
- **接口函数**: `getSafetyNotice(journeyId: string)`
- **后端接口**: `GET /api/v1/journeys/{journeyId}/safety-notice`
- **调用位置**: 
  - `ExperienceDay.vue` - `onMounted`
  - `SafetyNoticeCard.vue` - `loadSafetyNotice`
- **用途**: 获取特定行程的安全提示

### 12. 生成安全提示
- **接口函数**: `generateSafetyNotice(journeyId: string, request: GenerateSafetyNoticeRequest)`
- **后端接口**: `POST /api/v1/journeys/{journeyId}/safety-notice`
- **调用位置**: 
  - `ExperienceDay.vue` - `handleGenerateSafetyNotice`
  - `SafetyNoticeCard.vue` - `handleGenerate`
- **用途**: 生成或重新生成行程的安全提示
- **参数**: 包含 `userNationality`（用户国籍）

## 五、通用旅行安全通知接口

### 13. 获取通用旅行安全通知列表
- **接口函数**: `getTravelAlerts(request: GetTravelAlertsRequest)`
- **后端接口**: `GET /api/v1/alerts`
- **调用位置**: `SafetyNoticeCard.vue` - `loadTravelAlerts`
- **用途**: 获取通用旅行安全通知列表（不特定于某个行程）
- **参数**: `destination`（目的地）、`countryCode`（国家代码）、`date`（日期）

## 六、任务管理接口

### 14. 获取任务列表
- **接口函数**: `getTasks(journeyId: string)`
- **后端接口**: `GET /api/v1/journeys/{journeyId}/tasks`
- **调用位置**: `TaskList.vue` - `onMounted` 和 `loadTasks`
- **用途**: 获取行程的准备任务列表

### 15. 创建任务
- **接口函数**: `createTask(journeyId: string, request: CreateTaskRequest)`
- **后端接口**: `POST /api/v1/journeys/{journeyId}/tasks`
- **调用位置**: `TaskList.vue` - `handleAddTask`
- **用途**: 创建新的自定义任务

### 16. 更新任务
- **接口函数**: `updateTask(journeyId: string, taskId: string, request: UpdateTaskRequest)`
- **后端接口**: `PATCH /api/v1/journeys/{journeyId}/tasks/{taskId}`
- **调用位置**: `TaskList.vue` - `handleTaskToggle`
- **用途**: 更新任务状态（完成/未完成）或其他信息

### 17. 删除任务
- **接口函数**: `deleteTask(journeyId: string, taskId: string)`
- **后端接口**: `DELETE /api/v1/journeys/{journeyId}/tasks/{taskId}`
- **调用位置**: 
  - `TaskList.vue` - `handleDeleteTask`（单个删除）
  - `TaskList.vue` - `handleClearCompleted`（批量删除已完成任务）
- **用途**: 删除任务

## 七、目的地相关接口

### 18. 查找或创建目的地
- **接口函数**: `findOrCreateDestination(name: string)`
- **后端接口**: `POST /api/v1/destinations/find-or-create`（推测）
- **调用位置**: `TravelDetailView.vue` - `loadItineraryFromBackend`
- **用途**: 如果后端未返回 `destinationId`，通过目的地名称查找或创建目的地，获取 `destinationId`（用于天气接口等）

## 八、接口调用流程图

```
TravelDetailView (页面加载)
├── getItineraryDetail (获取行程基本信息)
├── findOrCreateDestination (如果缺少 destinationId)
├── batchGetActivities (批量获取活动详情)
└── enrichItineraryWithLocationInfo (如果需要，批量获取位置信息)
    └── generateLocationBatch (内部调用)

ExperienceDay (体验日组件)
├── getSafetyNotice (加载安全提示)
├── searchPOI (搜索附近 POI)
│   └── (失败时回退到 searchNearbyPOI - AI 搜索)
├── handleSaveEdit (保存编辑)
│   └── addSlotToDay (保存新增活动时调用)
├── handleDeleteSlot (删除活动)
│   └── deleteSlot (删除时间段)
└── addPOIToItinerary (添加 POI 到行程)
    ├── addSlotToDay (添加时间段到后端)
    └── generateLocation (获取单个活动位置信息)

InspirationHero (编辑行程信息)
└── updateItinerary (更新行程信息)

TaskList (任务列表)
├── getTasks (加载任务列表)
├── createTask (创建任务)
├── updateTask (更新任务状态)
└── deleteTask (删除任务)

SafetyNoticeCard (安全提示卡片)
├── getSafetyNotice (加载安全提示)
├── generateSafetyNotice (生成安全提示)
└── getTravelAlerts (加载通用旅行安全通知)
```

## 九、接口调用时机总结

### 页面加载时
1. `getItineraryDetail` - 获取行程基本信息
2. `batchGetActivities` - 获取活动详情
3. `getSafetyNotice` - 加载安全提示
4. `getTasks` - 加载任务列表
5. `getTravelAlerts` - 加载通用旅行安全通知

### 用户操作时
1. **搜索 POI**: `searchPOI` → (失败时) `searchNearbyPOI`
2. **添加 POI 到行程**: `generateLocation` → `addSlotToDay` (先获取位置信息，再添加时间段)
3. **手动添加活动**: `addSlotToDay` (保存新增活动时)
4. **删除活动**: `deleteSlot` (删除时间段)
5. **编辑行程信息**: `updateItinerary`
6. **生成安全提示**: `generateSafetyNotice`
7. **任务管理**: `createTask` / `updateTask` / `deleteTask`
8. **刷新行程**: `getItineraryDetail` → `batchGetActivities`

## 十、注意事项

1. **预计停留时间传递**: 当添加 POI 到行程时，`generateLocation` 接口返回的 `visitDuration` 会被更新到时间槽的 `duration` 字段。

2. **数据优先级**: 
   - 行程数据优先使用 `itineraryData.days`（后端数据）
   - 如果 `itineraryData.days` 为空，则使用 `data.days`（本地数据）

3. **错误处理**: 
   - POI 搜索失败时会回退到 AI 搜索
   - 位置信息获取失败不会影响已添加的 POI（只记录警告）
   - `addSlotToDay` 接口调用失败不会阻止前端操作，会显示警告消息

4. **UUID 验证**: 页面加载时会验证路由参数是否为有效的 UUID 格式，如果不是，会尝试从 store 中查找对应的 `backendItineraryId`。

5. **时间段添加逻辑**:
   - 当用户手动添加新活动或从 POI 搜索添加活动时，会自动调用 `addSlotToDay` 接口
   - 如果缺少 `backendItineraryId` 或 `dayId`，会跳过接口调用（只在前端添加）
   - 接口调用成功后，会使用后端返回的 `activityId` 更新前端数据
   - `duration` 字段会自动从字符串格式（如 "30分钟"、"1小时"）转换为分钟数

