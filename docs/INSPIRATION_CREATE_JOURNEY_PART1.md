# 灵感模式创建旅程逻辑文档 - 第一部分：概述与入口

## 📋 文档说明

本文档详细说明灵感模式（Inspiration Mode）创建旅程的完整逻辑流程。文档分为多个部分，每部分约300行。

**文档结构：**
- 第一部分：概述与入口（本文档）
- 第二部分：数据生成流程
- 第三部分：数据转换与存储
- 第四部分：UI交互与状态管理

---

## 一、概述

### 1.1 灵感模式的特点

灵感模式是一种基于用户自然语言输入的智能旅行规划模式，具有以下特点：

- **输入方式**：用户通过自然语言描述旅行需求（如"我想去一个安静的地方放松"）
- **生成模式**：支持两种模式
  - `candidates`：生成候选目的地列表（8-12个推荐地点）
  - `full`：直接生成完整详细行程
- **数据特点**：灵感模式只保留图片数据，移除所有文本描述和封面图片

### 1.2 创建旅程的完整流程

```
用户输入灵感需求
    ↓
生成灵感数据（候选列表或完整行程）
    ↓
用户选择目的地（如果是候选模式）
    ↓
生成完整详细行程（如果需要）
    ↓
数据清理（移除文本，只保留图片）
    ↓
生成动态配置
    ↓
创建 Travel 对象
    ↓
跳转到详情页
```

---

## 二、入口函数

### 2.1 主要入口：`createTravel`

**位置：** `src/views/InspirationView.vue`

**函数签名：**
```typescript
const createTravel = async () => {
  // 创建 Travel 并跳转到详情页
}
```

**核心职责：**
1. 验证数据完整性
2. 处理目的地选择逻辑
3. 确保有完整行程数据
4. 清理文本内容，只保留图片
5. 生成动态配置
6. 创建 Travel 对象并保存
7. 跳转到详情页

### 2.2 数据验证流程

```typescript
// 步骤 1: 检查基础数据
let data = travelStore.inspirationData
if (!data) {
  message.error('数据未生成')
  return
}

// 步骤 2: 处理目的地选择
if (!selectedLocation.value && hasSpecificDestination.value) {
  const dest = data.destination || data.location
  if (dest) {
    selectedLocation.value = dest
  }
}

// 步骤 3: 检查是否需要生成完整行程
if (!data.hasFullItinerary) {
  const targetLocation = selectedLocation.value || data.destination || data.location
  if (!targetLocation) {
    message.warning('请先选择目的地')
    return
  }
  
  // 生成完整行程
  const success = await handleGenerateFullItinerary()
  if (!success) return
  
  // 重新获取数据
  data = travelStore.inspirationData
  if (!data?.hasFullItinerary) {
    message.warning('详细行程生成失败')
    return
  }
}

// 步骤 4: 验证多目的地场景
if (data.locations && data.locations.length > 0) {
  if (!selectedLocation.value) {
    message.warning('请先选择目的地')
    return
  }
}
```

### 2.3 数据清理逻辑

灵感模式的核心特点：**只保留图片数据，移除所有文本内容**

```typescript
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

**清理规则：**
- ✅ 保留：`day`, `date`, `time`, `coordinates`
- ✅ 保留：`details.images`, `details.photos`
- ❌ 移除：`theme`, `mood`, `summary`, `title`, `activity`, `notes`, `localTip`
- ❌ 移除：`coreInsight`, `journeyBackground`, `summary`（顶层）
- ❌ 移除：`coverImage`

### 2.4 天数计算逻辑

```typescript
// 确保使用补齐后的天数
const actualDuration = data.days && Array.isArray(data.days) 
  ? data.days.length 
  : (parseInt(data.duration) || (data.days?.length || 5))
```

**优先级：**
1. `data.days.length`（如果 days 数组存在）
2. `parseInt(data.duration)`（如果 duration 字段存在）
3. `data.days?.length`（备用）
4. 默认值 `5` 天

### 2.5 创建 Travel 对象

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

**关键字段说明：**
- `description`: 始终为空字符串（灵感模式不保存文本描述）
- `coverImage`: 始终为 `undefined`（不保存封面图片）
- `data`: 包含清理后的数据，只保留图片和基础结构

---

## 三、辅助函数

### 3.1 `canCreateJourney` - 判断是否可以创建旅程

**位置：** `src/views/InspirationView.vue`

```typescript
const canCreateJourney = computed(() => {
  const data = inspirationResult.value
  if (!data) return false
  if (generatingFullItinerary.value || loading.value) return false
  
  // 如果有完整行程，检查 days 数组
  if (data.hasFullItinerary) {
    return Array.isArray(data.days) && data.days.length > 0
  }
  
  // 候选模式：需要选择目的地后才能点击
  if (hasSpecificDestination.value) {
    return true
  }
  
  // 否则需要用户选择目的地
  return Boolean(selectedLocation.value)
})
```

**判断逻辑：**
1. 数据不存在 → `false`
2. 正在生成中 → `false`
3. 有完整行程 → 检查 `days` 数组是否有效
4. 有明确目的地 → `true`
5. 需要用户选择 → 检查 `selectedLocation` 是否存在

### 3.2 `hasSpecificDestination` - 判断是否有明确目的地

```typescript
const hasSpecificDestination = computed(() => {
  if (!inspirationResult.value) return false
  
  // 如果有完整行程，说明已有明确目的地
  if (inspirationResult.value.hasFullItinerary || inspirationResult.value.days) {
    return true
  }
  
  // 如果有明确的 destination 字段，且不是推荐列表
  if (inspirationResult.value.destination && 
      (!inspirationResult.value.locations || inspirationResult.value.locations.length === 0)) {
    return true
  }
  
  // 如果 location 存在且 locations 不存在，说明是单一明确目的地
  if (inspirationResult.value.location && 
      (!inspirationResult.value.locations || inspirationResult.value.locations.length === 0)) {
    return true
  }
  
  return false
})
```

### 3.3 `handleGenerateFullItinerary` - 生成完整行程

```typescript
const handleGenerateFullItinerary = async () => {
  if (!selectedLocation.value) {
    message.warning('请先选择目的地')
    return false
  }

  generatingFullItinerary.value = true
  try {
    await travelStore.generateInspirationForDestination(selectedLocation.value)
    message.success('详细行程已生成！')
    return true
  } catch (error) {
    console.error('生成详细行程失败:', error)
    message.error('生成详细行程失败，请稍后重试')
    return false
  } finally {
    generatingFullItinerary.value = false
  }
}
```

**流程：**
1. 验证目的地是否已选择
2. 设置生成状态
3. 调用 `travelStore.generateInspirationForDestination`
4. 处理成功/失败情况
5. 重置状态

---

## 四、动态配置生成

### 4.1 `generateInspirationConfig`

**位置：** `src/utils/generateInspirationConfig.ts`

**作用：** 根据灵感数据生成动态配置文件，用于详情页展示

**调用时机：** 在创建 Travel 之前

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

---

## 五、数据流向图

```
用户输入
    ↓
InspirationView.handleSubmit()
    ↓
travelStore.generateInspiration()
    ↓
generateInspirationJourney() [API层]
    ↓
JourneyService.generateJourney() [服务层]
    ↓
返回 InspirationData
    ↓
enrichInspirationMedia() [媒体增强]
    ↓
travelStore.inspirationData
    ↓
用户选择目的地（可选）
    ↓
handleGenerateFullItinerary() [如果需要]
    ↓
createTravel()
    ↓
数据清理（移除文本）
    ↓
generateInspirationConfig()
    ↓
travelListStore.createTravel()
    ↓
router.push('/travel/:id')
```

---

## 六、关键数据结构

### 6.1 InspirationData（生成后的数据）

```typescript
interface InspirationData {
  title?: string
  destination?: string
  location?: string
  locations?: string[]  // 候选目的地列表
  duration?: string | number
  days?: DayPlan[]
  hasFullItinerary?: boolean
  coverImage?: string
  // ... 其他字段
}
```

### 6.2 清理后的数据（travelDataWithSelection）

```typescript
{
  ...data,
  selectedLocation: string,  // 用户选择的目的地
  inspirationConfig: object,  // 动态配置
  coverImage: undefined,      // 移除封面
  days: [                     // 清理后的天数数据
    {
      day: number,
      date: string,
      timeSlots: [
        {
          time: string,
          coordinates: { lat, lng },
          details: {
            images: string[],
            photos: string[]
          }
        }
      ]
    }
  ]
}
```

---

**第一部分结束，共约 300 行**

**下一部分：** 数据生成流程（`generateInspiration` 和 `generateInspirationJourney` 的详细逻辑）

