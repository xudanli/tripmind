# 灵感模式创建旅程逻辑文档 - 第三部分：数据转换与存储

## 📋 文档说明

本文档详细说明灵感模式在创建旅程时的数据清理、转换和存储逻辑，包括数据过滤规则、动态配置生成、Travel 对象创建等。

---

## 一、数据清理流程

### 1.1 清理目标

灵感模式的核心特点：**只保留图片数据，移除所有文本描述和封面图片**

**保留的数据：**
- ✅ 基础结构：`day`, `date`, `time`, `coordinates`
- ✅ 图片数据：`details.images`, `details.photos`
- ✅ 用户选择：`selectedLocation`
- ✅ 动态配置：`inspirationConfig`

**移除的数据：**
- ❌ 文本描述：`theme`, `mood`, `summary`, `title`, `activity`, `notes`, `localTip`
- ❌ 封面图片：`coverImage`
- ❌ 其他文本字段：`coreInsight`, `journeyBackground`, `description`

### 1.2 清理实现

**位置：** `src/views/InspirationView.vue` - `createTravel` 函数

```typescript
// 创建 Travel 并保存到列表
// 将选中的地点和配置文件保存到 data 中
// 移除时间线文本内容和封面数据，只保留图片
const travelDataWithSelection: any = {
  ...data,
  selectedLocation: selectedLocation.value, // 保存用户选择的地点
  inspirationConfig, // 保存动态生成的配置
  
  // 移除封面图片
  coverImage: undefined,
  
  // 清理时间线文本内容，只保留图片数据
  days: data.days?.map((day: any) => ({
    day: day.day,
    date: day.date,
    timeSlots: day.timeSlots?.map((slot: any) => ({
      time: slot.time,
      coordinates: slot.coordinates,
      // 只保留图片相关数据
      details: slot.details ? {
        images: slot.details.images,
        photos: slot.details.photos
      } : undefined
    })) || []
  })) || []
}
```

### 1.3 清理规则详解

#### 顶层字段清理

```typescript
{
  ...data,  // 保留原始数据的所有字段
  coverImage: undefined,  // 明确移除封面图片
  // ... 其他字段保留
}
```

**保留的顶层字段：**
- `title`: 旅程标题
- `destination`: 目的地
- `location`: 位置
- `locations`: 候选列表（如果有）
- `duration`: 天数
- `days`: 天数数组（会被深度清理）
- `selectedLocation`: 用户选择的地点
- `inspirationConfig`: 动态配置

**移除的顶层字段：**
- `coverImage`: 封面图片

#### 天数数组清理

```typescript
days: data.days?.map((day: any) => ({
  day: day.day,        // 保留：天数序号
  date: day.date,      // 保留：日期
  // 移除：theme, mood, summary 等文本字段
  timeSlots: day.timeSlots?.map((slot: any) => ({
    // 时间段清理
  })) || []
})) || []
```

**保留的 day 字段：**
- `day`: 天数序号（数字）
- `date`: 日期字符串
- `timeSlots`: 时间段数组（会被深度清理）

**移除的 day 字段：**
- `theme`: 主题
- `mood`: 情绪
- `summary`: 总结
- 其他文本描述字段

#### 时间段清理

```typescript
timeSlots: day.timeSlots?.map((slot: any) => ({
  time: slot.time,                    // 保留：时间
  coordinates: slot.coordinates,      // 保留：坐标
  details: slot.details ? {
    images: slot.details.images,      // 保留：图片数组
    photos: slot.details.photos       // 保留：照片数组
  } : undefined
  // 移除：title, activity, description, notes, localTip 等
})) || []
```

**保留的 slot 字段：**
- `time`: 时间字符串
- `coordinates`: 坐标对象 `{ lat, lng }`
- `details.images`: 图片 URL 数组
- `details.photos`: 照片 URL 数组

**移除的 slot 字段：**
- `title`: 标题
- `activity`: 活动描述
- `type`: 类型
- `description`: 描述
- `notes`: 备注
- `localTip`: 本地提示
- `details` 中的其他文本字段

### 1.4 清理前后对比

**清理前（原始数据）：**
```typescript
{
  title: "瑞士琉森之旅",
  destination: "瑞士琉森",
  coverImage: "https://example.com/cover.jpg",
  days: [
    {
      day: 1,
      date: "2024-01-01",
      theme: "探索古城",
      timeSlots: [
        {
          time: "09:00",
          title: "参观琉森湖",
          activity: "乘船游览",
          coordinates: { lat: 47.0502, lng: 8.3093 },
          details: {
            description: "美丽的湖泊...",
            images: ["https://example.com/image1.jpg"],
            photos: ["https://example.com/photo1.jpg"],
            notes: "建议早上前往"
          }
        }
      ]
    }
  ]
}
```

**清理后（存储数据）：**
```typescript
{
  title: "瑞士琉森之旅",
  destination: "瑞士琉森",
  coverImage: undefined,
  selectedLocation: "瑞士琉森",
  inspirationConfig: { /* 动态配置 */ },
  days: [
    {
      day: 1,
      date: "2024-01-01",
      timeSlots: [
        {
          time: "09:00",
          coordinates: { lat: 47.0502, lng: 8.3093 },
          details: {
            images: ["https://example.com/image1.jpg"],
            photos: ["https://example.com/photo1.jpg"]
          }
        }
      ]
    }
  ]
}
```

---

## 二、动态配置生成

### 2.1 配置生成函数

**位置：** `src/utils/generateInspirationConfig.ts`

**函数签名：**
```typescript
export function generateInspirationConfig(
  data: InspirationData
): DynamicInspirationConfig
```

**调用时机：** 在创建 Travel 之前，数据清理之后

```typescript
let inspirationConfig = null
try {
  const { generateInspirationConfig } = await import('@/utils/generateInspirationConfig')
  inspirationConfig = generateInspirationConfig(data)
  console.log('✅ 生成动态配置成功:', inspirationConfig)
} catch (error) {
  console.error('❌ 生成动态配置失败:', error)
  // 即使配置生成失败，也继续创建旅程
}
```

**特点：**
- 配置生成失败不影响旅程创建
- 配置用于详情页的个性化展示
- 基于实际生成的数据动态生成

### 2.2 配置结构

```typescript
interface DynamicInspirationConfig {
  // 地点Moodboard映射（根据实际生成的地点）
  locationMoodMap: Record<string, Array<{ icon: string; text: string }>>
  
  // 意图类型Moodboard（根据识别的意图）
  intentMoodMap?: Record<string, Array<{ icon: string; text: string }>>
  
  // 视觉诗模板（基于实际highlights生成）
  poetryTemplates: Array<{ poetry: string; tags: string[] }>
  
  // AI反馈模板（基于意图类型）
  aiFeedbackTemplates: Array<(input: string) => string>
  
  // AI总结诗模板（基于意图类型和地点）
  summaryPoemTemplates: Record<string, Array<(location: string) => string>>
  
  // 底部AI语句模板（基于意图类型）
  echoStatementTemplates: Record<string, string | string[]>
}
```

### 2.3 配置生成逻辑

#### 地点 Moodboard 映射

```typescript
locationMoodMap: {
  "瑞士琉森": [
    { icon: "🏔️", text: "雪山" },
    { icon: "🌊", text: "湖泊" },
    { icon: "🏰", text: "古城" }
  ]
}
```

**生成规则：**
- 从 `data.destination` 或 `data.location` 提取地点
- 从 `data.highlights` 提取关键词
- 根据关键词匹配图标（使用 `keywordIconMap`）
- 生成地点相关的 Moodboard 数组

#### 视觉诗模板

```typescript
poetryTemplates: [
  {
    poetry: "在琉森的湖畔，时间慢了下来",
    tags: ["宁静", "自然", "放松"]
  }
]
```

**生成规则：**
- 基于 `data.highlights` 生成诗意描述
- 提取情感标签
- 生成多个模板供详情页使用

#### AI 反馈模板

```typescript
aiFeedbackTemplates: [
  (input: string) => `根据你的需求"${input}"，我为你推荐了...`
]
```

**生成规则：**
- 基于用户原始输入
- 生成个性化的 AI 反馈语句
- 支持动态插入用户输入内容

---

## 三、天数计算逻辑

### 3.1 计算优先级

```typescript
const actualDuration = data.days && Array.isArray(data.days)
  ? data.days.length
  : (parseInt(data.duration) || (data.days?.length || 5))
```

**优先级顺序：**
1. **`data.days.length`** - 如果 `days` 数组存在且为数组
2. **`parseInt(data.duration)`** - 如果 `duration` 字段存在且可解析
3. **`data.days?.length`** - 备用检查（防止数组不存在）
4. **默认值 `5`** - 如果以上都失败

### 3.2 计算示例

**示例 1：有 days 数组**
```typescript
data = {
  days: [
    { day: 1, ... },
    { day: 2, ... },
    { day: 3, ... }
  ],
  duration: "5"
}
// actualDuration = 3 (使用 days.length)
```

**示例 2：只有 duration**
```typescript
data = {
  duration: "7"
}
// actualDuration = 7 (使用 parseInt(duration))
```

**示例 3：都没有**
```typescript
data = {}
// actualDuration = 5 (使用默认值)
```

### 3.3 日志记录

```typescript
console.log('📊 创建旅程 - 天数信息:', {
  durationField: data.duration,
  daysArrayLength: data.days?.length,
  actualDuration: actualDuration
})
```

**用途：** 调试和排查天数计算问题

---

## 四、Travel 对象创建

### 4.1 创建函数调用

**位置：** `src/views/InspirationView.vue` - `createTravel` 函数

```typescript
const newTravel = travelListStore.createTravel({
  title: data.title || '灵感之旅',
  location: selectedLocation.value || data.location || '待定',
  description: '', // 灵感模式不保存文本描述
  mode: 'inspiration',
  status: 'active',
  duration: actualDuration,
  participants: 1,
  budget: 0,
  coverImage: undefined, // 不保存封面图片
  data: travelDataWithSelection // 保存详细的灵感数据（已移除文本内容）
})
```

### 4.2 字段说明

| 字段 | 值 | 说明 |
|------|-----|------|
| `title` | `data.title \|\| '灵感之旅'` | 旅程标题，默认"灵感之旅" |
| `location` | `selectedLocation \|\| data.location \|\| '待定'` | 位置，优先使用用户选择 |
| `description` | `''` | **始终为空字符串**（灵感模式特点） |
| `mode` | `'inspiration'` | 模式标识 |
| `status` | `'active'` | 状态 |
| `duration` | `actualDuration` | 计算后的天数 |
| `participants` | `1` | 默认 1 人 |
| `budget` | `0` | 默认 0 |
| `coverImage` | `undefined` | **不保存封面图片**（灵感模式特点） |
| `data` | `travelDataWithSelection` | 清理后的详细数据 |

### 4.3 关键字段特点

#### `description` 字段

```typescript
description: '', // 灵感模式不保存文本描述
```

**原因：** 灵感模式只保留图片数据，不保存文本描述

#### `coverImage` 字段

```typescript
coverImage: undefined, // 不保存封面图片
```

**原因：** 灵感模式不显示封面图片

#### `data` 字段

```typescript
data: travelDataWithSelection
```

**内容：** 包含清理后的完整数据
- 已移除所有文本描述
- 只保留图片和基础结构
- 包含 `selectedLocation` 和 `inspirationConfig`

---

## 五、存储到列表

### 5.1 Store 层创建

**位置：** `src/stores/travelList.ts`

**函数签名：**
```typescript
createTravel(travelData: {
  title: string
  location: string
  description: string
  mode: string
  status: string
  duration: number
  participants: number
  budget: number
  coverImage?: string
  data?: any
}): Travel
```

### 5.2 创建流程

```typescript
createTravel(travelData) {
  const newTravel: Travel = {
    id: generateId(),           // 生成唯一 ID
    title: travelData.title,
    location: travelData.location,
    description: travelData.description,
    mode: travelData.mode,
    status: travelData.status,
    duration: travelData.duration,
    participants: travelData.participants,
    budget: travelData.budget,
    coverImage: travelData.coverImage,
    data: travelData.data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  // 添加到列表
  this.travels.push(newTravel)
  
  // 保存到本地存储
  this.saveToLocalStorage()
  
  return newTravel
}
```

### 5.3 本地存储

**存储方式：** `localStorage`

**键名：** `travel-list`（或类似）

**格式：** JSON 字符串

**保存时机：**
- 创建新旅程时
- 更新旅程时
- 删除旅程时

---

## 六、跳转到详情页

### 6.1 路由跳转

```typescript
message.success('旅程创建成功！')

// 跳转到旅行详情页
router.push(`/travel/${newTravel.id}`)
```

**路由格式：** `/travel/:id`

**参数：** `newTravel.id`（新创建的旅程 ID）

### 6.2 成功提示

```typescript
message.success('旅程创建成功！')
```

**显示时机：** 在跳转之前

**用途：** 给用户反馈，确认创建成功

---

## 七、完整数据流图

```
travelStore.inspirationData (原始数据)
    ↓
createTravel() 函数
    ↓
数据验证
    ├─ 检查数据是否存在
    ├─ 处理目的地选择
    ├─ 检查是否需要生成完整行程
    └─ 验证多目的地场景
    ↓
数据清理
    ├─ 移除 coverImage
    ├─ 清理 days 数组（移除文本，保留图片）
    └─ 清理 timeSlots（移除文本，保留图片）
    ↓
生成动态配置
    ├─ generateInspirationConfig(data)
    └─ 生成 locationMoodMap, poetryTemplates 等
    ↓
计算天数
    ├─ 优先使用 days.length
    ├─ 其次使用 parseInt(duration)
    └─ 默认值 5
    ↓
创建 Travel 对象
    ├─ travelListStore.createTravel({...})
    └─ 保存到列表和本地存储
    ↓
跳转到详情页
    ├─ router.push(`/travel/${newTravel.id}`)
    └─ 显示成功提示
```

---

## 八、错误处理

### 8.1 数据验证错误

```typescript
if (!data) {
  message.error('数据未生成')
  return
}

if (!targetLocation) {
  message.warning('请先选择目的地')
  return
}
```

**处理方式：** 显示错误提示，中断流程

### 8.2 完整行程生成失败

```typescript
const success = await handleGenerateFullItinerary()
if (!success) return

data = travelStore.inspirationData
if (!data?.hasFullItinerary) {
  message.warning('详细行程生成失败')
  return
}
```

**处理方式：** 显示警告，中断流程

### 8.3 配置生成失败

```typescript
try {
  inspirationConfig = generateInspirationConfig(data)
} catch (error) {
  console.error('❌ 生成动态配置失败:', error)
  // 即使配置生成失败，也继续创建旅程
}
```

**处理方式：** 记录错误，但不中断流程（配置是可选的）

---

## 九、关键数据结构对比

### 9.1 清理前 vs 清理后

| 字段 | 清理前 | 清理后 |
|------|--------|--------|
| `coverImage` | `string \| undefined` | `undefined` |
| `days[].theme` | `string` | ❌ 移除 |
| `days[].mood` | `string` | ❌ 移除 |
| `days[].timeSlots[].title` | `string` | ❌ 移除 |
| `days[].timeSlots[].activity` | `string` | ❌ 移除 |
| `days[].timeSlots[].details.description` | `string` | ❌ 移除 |
| `days[].timeSlots[].details.images` | `string[]` | ✅ 保留 |
| `days[].timeSlots[].details.photos` | `string[]` | ✅ 保留 |
| `selectedLocation` | ❌ 不存在 | ✅ 新增 |
| `inspirationConfig` | ❌ 不存在 | ✅ 新增 |

---

**第三部分结束，共约 300 行**

**下一部分：** UI交互与状态管理（用户交互流程、状态管理、组件渲染逻辑）

