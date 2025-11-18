# 灵感模式创建旅程逻辑文档 - 第二部分：数据生成流程

## 📋 文档说明

本文档详细说明灵感模式数据生成的完整流程，包括 API 调用、服务层处理、媒体增强等步骤。

---

## 一、数据生成入口

### 1.1 `generateInspiration` - Store 层入口

**位置：** `src/stores/travel.ts`

**函数签名：**
```typescript
const generateInspiration = async (
  input: string,
  options?: {
    selectedDestination?: string
    mode?: 'candidates' | 'full'
  }
) => {
  // 生成灵感数据
}
```

**核心流程：**
```typescript
const generateInspiration = async (input: string, options?: {
  selectedDestination?: string
  mode?: 'candidates' | 'full'
}) => {
  setLoading(true)
  setError(null)
  setCurrentMode('inspiration')
  lastInspirationInput.value = input

  try {
    // 1. 调用 API 生成灵感数据
    const result = await generateInspirationJourney(input, {
      selectedDestination: options?.selectedDestination,
      mode: options?.mode || 'full'
    })

    // 2. 媒体增强（异步，不阻塞）
    enrichInspirationMedia(result).catch(err => {
      console.warn('媒体增强失败:', err)
    })

    // 3. 保存到 store
    setInspirationData(result)
    return result
  } catch (err) {
    setError(err)
    throw err
  } finally {
    setLoading(false)
  }
}
```

**参数说明：**
- `input`: 用户输入的灵感需求（自然语言）
- `options.selectedDestination`: 用户选择的目的地（用于候选模式生成完整行程）
- `options.mode`: 生成模式
  - `'candidates'`: 生成候选目的地列表（8-12个）
  - `'full'`: 直接生成完整详细行程

**返回值：** `InspirationData` 对象

### 1.2 `generateInspirationForDestination` - 为指定目的地生成完整行程

**位置：** `src/stores/travel.ts`

**函数签名：**
```typescript
const generateInspirationForDestination = async (destination: string) => {
  // 为指定目的地生成完整行程
}
```

**实现：**
```typescript
const generateInspirationForDestination = async (destination: string) => {
  const baseInput = lastInspirationInput.value
  const normalizedDestination = safeStr(destination)
  
  if (!baseInput) {
    throw new Error('缺少原始灵感输入，请先输入灵感需求。')
  }
  if (!normalizedDestination) {
    throw new Error('需要提供有效的目的地。')
  }
  
  // 使用原始输入和选中的目的地，生成完整行程
  return generateInspiration(baseInput, { 
    selectedDestination: normalizedDestination,
    mode: 'full' 
  })
}
```

**使用场景：**
- 用户从候选列表中选择目的地后
- 需要生成该目的地的完整详细行程

---

## 二、API 层：`generateInspirationJourney`

### 2.1 函数位置和签名

**位置：** `src/apis/inspiration.ts`

**函数签名：**
```typescript
export async function generateInspirationJourney(
  input: string,
  options?: {
    selectedDestination?: string
    mode?: 'candidates' | 'full'
  }
): Promise<InspirationData>
```

### 2.2 核心流程

```typescript
export async function generateInspirationJourney(
  input: string,
  options?: {
    selectedDestination?: string
    mode?: 'candidates' | 'full'
  }
): Promise<InspirationData> {
  // 1. 创建旅程生成服务
  const journeyService = createJourneyService({
    llm: deepseekAPI,
    logger: console
  })

  // 2. 调用服务生成旅程
  const itinerary = await journeyService.generateJourney({
    input,
    selectedDestination: options?.selectedDestination,
    mode: options?.mode || 'full'
  })

  // 3. 转换为 InspirationData 格式
  return toInspirationData(itinerary)
}
```

**依赖：**
- `JourneyService`: 旅程生成服务（核心逻辑）
- `deepseekAPI`: LLM API 客户端
- `toInspirationData`: 数据转换函数

---

## 三、服务层：`JourneyService.generateJourney`

### 3.1 服务类结构

**位置：** `src/services/journeyService.ts`

**类定义：**
```typescript
class JourneyService {
  constructor(private deps: {
    llm: LLMClient
    logger: Logger
  }) {}

  async generateJourney(params: {
    input: string
    selectedDestination?: string
    mode?: 'candidates' | 'full'
  }): Promise<Itinerary> {
    // 生成旅程的核心逻辑
  }
}
```

### 3.2 生成流程（详细步骤）

#### 步骤 1: 意图识别

```typescript
// 1. 识别用户意图
const intent = await analyzeUserIntent({
  input: params.input,
  llm: this.deps.llm,
  logger: this.deps.logger
})
```

**`analyzeUserIntent` 功能：**
- 分析用户输入的自然语言
- 提取关键词、意图类型、情感倾向
- 返回 `IntentResult` 对象

**IntentResult 结构：**
```typescript
interface IntentResult {
  intentType: string        // 意图类型（如 'relaxation', 'adventure'）
  keywords: string[]        // 关键词列表
  mood: string             // 情感倾向
  duration?: number         // 期望天数
  budget?: string           // 预算范围
}
```

#### 步骤 2: 目的地解析

```typescript
// 2. 解析目的地
const selectedDestination = params.selectedDestination
const destination = this.resolveDestination([
  selectedDestination,
  intent.destination,
  params.input.match(/去|到|前往|游览|探索\s*([^，。！？\s]+)/)?.[1]
])
```

**`resolveDestination` 逻辑：**
- 优先级：用户选择 > 意图识别 > 输入文本提取
- 过滤无效值（如 "未指定目的地"）
- 返回规范化后的目的地字符串

#### 步骤 3: 确定天数

```typescript
// 3. 确定行程天数
const estimatedDays = await this.determineDays(
  intent.duration,
  destination,
  intent
)
```

**`determineDays` 逻辑：**
1. 如果用户明确指定天数 → 直接使用
2. 否则根据目的地智能推荐
   - 调用 `getRecommendedDaysForDestination(destination, intentType)`
   - 返回推荐天数（通常 3-7 天）

#### 步骤 4: 生成行程框架

```typescript
// 4. 生成行程框架
const framework = await generateItineraryFramework({
  intent,
  destination,
  days: estimatedDays,
  selectedDestination,
  mode: params.mode,
  llm: this.deps.llm,
  logger: this.deps.logger
})
```

**两种模式：**

**A. 候选模式 (`mode === 'candidates'`)**
```typescript
// 生成候选目的地列表（8-12个）
const candidates = await generateDestinationCandidates({
  intent,
  llm: this.deps.llm,
  logger: this.deps.logger
})

return {
  destination: null,
  locations: candidates,  // 候选列表
  days: [],              // 空数组
  // ... 其他字段
}
```

**B. 完整模式 (`mode === 'full'`)**
```typescript
// 生成完整行程框架
const framework = await generateFullItineraryFramework({
  intent,
  destination,
  days: estimatedDays,
  llm: this.deps.llm,
  logger: this.deps.logger
})

return {
  destination: destination,
  days: framework.days,  // 每日框架
  // ... 其他字段
}
```

**框架结构：**
```typescript
interface ItineraryFramework {
  destination: string
  days: DayFramework[]
  theme?: string
  mood?: string
}

interface DayFramework {
  day: number
  date: string
  theme?: string
  timeSlots: TimeSlotFramework[]
}

interface TimeSlotFramework {
  time: string
  activity?: string
  type?: string
}
```

#### 步骤 5: 生成每日详情（仅完整模式）

```typescript
if (mode === 'candidates') {
  // 候选模式：跳过详情生成
  return validatedFramework
}

// 完整模式：生成每日详情
const itineraryWithDetails = await generateDayDetailsForAllDays({
  framework,
  intent,
  ctx,
  destination,
  isHighAltitude: this.isHighAltitudeDestination(destination),
  llm: this.deps.llm,
  logger: this.deps.logger
})
```

**`generateDayDetailsForAllDays` 功能：**
- 为每一天的每个时间段生成详细内容
- 包括：活动描述、地点、时间、坐标等
- 串行处理，保证地理连续性

**优化策略：**
- 如果天数较多（>5天），先快速生成前3天，让用户看到进度
- 后续天数异步生成

#### 步骤 6: 生成景点简介

```typescript
const itineraryWithNarratives = await generateScenicIntrosForAllSlots({
  itinerary: itineraryWithoutDuplicateArrivals,
  ctx,
  llm: this.deps.llm,
  logger: this.deps.logger
})
```

**功能：** 基于地理位置信息生成每个景点的诗意简介

#### 步骤 7: 生成交通指南

```typescript
const itineraryWithTransport = await generateTransportGuidesForAllSlots({
  itinerary: itineraryWithNarratives,
  ctx,
  llm: this.deps.llm,
  logger: this.deps.logger
})
```

**功能：** 为每个时间段生成交通方式和路线建议

#### 步骤 8: 生成 Tips（可选）

```typescript
if (estimatedDays <= 3) {
  // 短行程：同步生成 Tips
  finalItinerary = await generateTipsForAllSlots({
    itinerary: itineraryWithTransport,
    ctx,
    llm: this.deps.llm,
    logger: this.deps.logger
  })
} else {
  // 长行程：异步生成 Tips（不阻塞）
  generateTipsForAllSlots({...}).catch(err => {
    logger.warn('异步生成 Tips 失败:', err)
  })
}
```

**优化策略：**
- 短行程（≤3天）：同步生成，保证完整性
- 长行程（>3天）：异步生成，优先返回基本行程

#### 步骤 9: 校验和修复

```typescript
return this.validateAndFix(finalItinerary)
```

**`validateAndFix` 功能：**
1. 同步 `duration` 字段（根据 `days.length`）
2. 确保 `recommendations` 结构存在
3. 修复缺失字段
4. 返回校验后的数据

---

## 四、数据转换：`toInspirationData`

### 4.1 转换函数

**位置：** `src/apis/inspiration.ts`

**功能：** 将 `Itinerary` 格式转换为 `InspirationData` 格式

```typescript
function toInspirationData(itinerary: Itinerary): InspirationData {
  return {
    title: itinerary.title || '灵感之旅',
    destination: itinerary.destination,
    location: itinerary.destination,
    locations: itinerary.locations,  // 候选列表（如果有）
    duration: itinerary.duration || itinerary.days?.length || 5,
    days: itinerary.days,
    hasFullItinerary: Array.isArray(itinerary.days) && itinerary.days.length > 0,
    theme: itinerary.theme,
    mood: itinerary.mood,
    highlights: itinerary.highlights,
    // ... 其他字段
  }
}
```

**关键字段映射：**
- `Itinerary.destination` → `InspirationData.destination` 和 `location`
- `Itinerary.days` → `InspirationData.days`
- `Itinerary.days.length > 0` → `hasFullItinerary: true`

---

## 五、媒体增强：`enrichInspirationMedia`

### 5.1 函数位置和功能

**位置：** `src/stores/travel.ts` 或相关工具文件

**功能：** 为灵感数据添加图片和媒体内容

```typescript
async function enrichInspirationMedia(data: InspirationData): Promise<void> {
  if (!data.days || data.days.length === 0) return

  // 为每个时间段添加图片
  for (const day of data.days) {
    for (const slot of day.timeSlots || []) {
      if (slot.coordinates) {
        // 根据坐标获取地点图片
        const images = await fetchLocationImages(slot.coordinates)
        slot.details = {
          ...slot.details,
          images: images
        }
      }
    }
  }
}
```

**特点：**
- 异步执行，不阻塞主流程
- 失败不影响数据生成
- 基于坐标获取地点相关图片

---

## 六、数据流图

```
用户输入灵感需求
    ↓
InspirationView.handleSubmit()
    ↓
travelStore.generateInspiration(input, options)
    ↓
generateInspirationJourney(input, options) [API层]
    ↓
JourneyService.generateJourney() [服务层]
    ├─ 1. analyzeUserIntent() - 意图识别
    ├─ 2. resolveDestination() - 目的地解析
    ├─ 3. determineDays() - 确定天数
    ├─ 4. generateItineraryFramework() - 生成框架
    │   ├─ mode === 'candidates' → generateDestinationCandidates()
    │   └─ mode === 'full' → generateFullItineraryFramework()
    ├─ 5. generateDayDetailsForAllDays() - 生成每日详情（仅完整模式）
    ├─ 6. generateScenicIntrosForAllSlots() - 生成景点简介
    ├─ 7. generateTransportGuidesForAllSlots() - 生成交通指南
    ├─ 8. generateTipsForAllSlots() - 生成 Tips（可选）
    └─ 9. validateAndFix() - 校验和修复
    ↓
toInspirationData() - 数据转换
    ↓
enrichInspirationMedia() - 媒体增强（异步）
    ↓
travelStore.inspirationData = result
    ↓
UI 更新显示结果
```

---

## 七、关键数据结构

### 7.1 Itinerary（服务层返回）

```typescript
interface Itinerary {
  title?: string
  destination?: string
  locations?: string[]  // 候选目的地列表
  duration?: number
  days?: DayPlan[]
  theme?: string
  mood?: string
  highlights?: string[]
}

interface DayPlan {
  day: number
  date: string
  theme?: string
  timeSlots: TimeSlot[]
}

interface TimeSlot {
  time: string
  title?: string
  activity?: string
  coordinates?: { lat: number; lng: number }
  details?: {
    images?: string[]
    photos?: string[]
    description?: string
    // ... 其他字段
  }
}
```

### 7.2 InspirationData（Store 层存储）

```typescript
interface InspirationData {
  title?: string
  destination?: string
  location?: string
  locations?: string[]  // 候选目的地列表
  duration?: string | number
  days?: DayPlan[]
  hasFullItinerary?: boolean  // 是否有完整行程
  coverImage?: string
  theme?: string
  mood?: string
  highlights?: string[]
  // ... 其他字段
}
```

---

**第二部分结束，共约 300 行**

**下一部分：** 数据转换与存储（`createTravel` 中的数据清理和存储逻辑）

