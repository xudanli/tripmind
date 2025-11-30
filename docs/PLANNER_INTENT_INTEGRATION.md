# Planner 模式意图识别集成文档

## 📋 概述

本文档说明 Planner 模式如何集成意图识别功能，以及后端接口需要做的相应更改。

---

## 🎯 功能说明

### 当前实现

Planner 模式在生成行程前，会：
1. 从用户填写的结构化表单数据构建自然语言描述
2. 调用意图识别服务（`intentService.ts`）获取意图信息
3. 将意图信息作为上下文传递给行程生成接口

### 优势

- **智能理解**：从结构化数据中提取深层意图
- **增强生成**：意图信息帮助后端生成更贴合用户需求的行程
- **数据完整**：保存意图信息，便于后续分析和优化
- **容错处理**：意图识别失败不影响主流程

---

## 🔄 工作流程

```
用户填写表单（目的地、天数、预算、兴趣偏好）
  ↓
构建自然语言描述："我想去京都，计划5天，舒适型预算，喜欢自然风光、美食探店..."
  ↓
调用意图识别服务：intentService.detectIntent()
  { input: "我想去京都...", language: "zh-CN" }
  ↓
获取意图信息：
  {
    intentType: "cultural_exchange",
    keywords: ["京都", "自然风光", "美食"],
    emotionTone: "calm",
    description: "用户希望进行文化交流和美食探索",
    confidence: 0.85
  }
  ↓
调用生成接口：POST /api/v1/journeys/generate
  {
    destination: "京都",
    days: 5,
    startDate: "2024-01-01",
    preferences: { budget: "medium" },
    intent: { ... }  // 意图信息
  }
  ↓
后端利用意图信息优化行程生成
  ↓
返回生成的行程数据
```

---

## 📡 后端接口更改

### 接口：`POST /api/v1/journeys/generate`

#### 请求参数更新

**原接口定义：**
```typescript
interface GenerateItineraryRequest {
  destination: string
  days: number
  startDate: string
  preferences?: {
    budget?: 'low' | 'medium' | 'high'
    travelStyle?: 'relaxed' | 'moderate' | 'intensive'
  }
}
```

**更新后的接口定义：**
```typescript
interface GenerateItineraryRequest {
  destination?: string         // 更新：改为可选（不提供时系统会根据其他信息自动推荐）
  days: number
  startDate: string
  preferences?: {
    interests?: string[]      // 新增：兴趣列表
    budget?: 'low' | 'medium' | 'high'
    travelStyle?: 'relaxed' | 'moderate' | 'intensive'
  }
  intent?: {                  // 新增：意图识别数据（可选）
    intentType: string        // 意图类型
    keywords: string[]        // 提取的关键词列表
    emotionTone: string       // 情感倾向
    description: string       // 意图描述
    confidence?: number       // 置信度（0-1）
  }
}
```

**重要更新：**
- `destination` 字段改为可选，如果不提供，系统会根据 `intent`、`preferences.interests` 等信息自动推荐目的地
- 如果不提供 `destination`，建议至少提供 `intent` 或 `preferences.interests` 之一，以便系统更好地推荐目的地

#### 意图类型说明

常见的意图类型包括：
- `photography_exploration` - 摄影探索
- `cultural_exchange` - 文化交流
- `emotional_healing` - 情感疗愈
- `mind_healing` - 心灵疗愈
- `extreme_exploration` - 极限探索
- `urban_creation` - 城市创作
- `general` - 通用意图（默认）

#### 情感倾向说明

常见的情感倾向包括：
- `calm` - 平静、放松
- `active` - 活跃、积极
- `romantic` - 浪漫
- `adventurous` - 冒险
- `contemplative` - 沉思
- `energetic` - 充满活力

---

## 💡 后端实现建议

### 1. 接收意图信息和处理目的地推荐（可选）

```typescript
// 后端控制器示例（伪代码）
async generateItinerary(request: GenerateItineraryRequest) {
  const { destination, days, startDate, preferences, intent } = request
  
  // 如果没有提供目的地，根据其他信息自动推荐
  let finalDestination = destination
  if (!finalDestination) {
    // 调用目的地推荐接口
    const recommendedDestinations = await recommendDestinations({
      intent: intent,
      preferences: preferences,
      days: days
    })
    if (recommendedDestinations && recommendedDestinations.length > 0) {
      finalDestination = recommendedDestinations[0].name
      console.log('自动推荐目的地:', finalDestination)
    } else {
      throw new Error('无法推荐目的地，请提供 destination 或更多信息')
    }
  }
  
  // intent 字段是可选的，如果不存在，使用原有逻辑
  if (intent) {
    console.log('收到意图信息:', {
      intentType: intent.intentType,
      keywords: intent.keywords,
      emotionTone: intent.emotionTone
    })
  }
  
  // 使用 finalDestination 生成行程
  // ... 生成行程逻辑
}
```

### 2. 利用意图信息优化生成

#### 方式一：在提示词中加入意图信息

```typescript
// 构建生成提示词
let prompt = `为${destination}生成${days}天的行程安排。`

// 如果有意图信息，加入提示词
if (intent) {
  prompt += `\n\n用户意图分析：`
  prompt += `\n- 意图类型：${intent.intentType}`
  prompt += `\n- 关键词：${intent.keywords.join('、')}`
  prompt += `\n- 情感倾向：${intent.emotionTone}`
  prompt += `\n- 意图描述：${intent.description}`
  prompt += `\n\n请根据以上意图信息，生成更贴合用户需求的行程。`
}
```

#### 方式二：根据情感倾向调整行程风格

```typescript
// 根据情感倾向调整行程节奏
let travelPace = 'moderate' // 默认中等节奏

if (intent?.emotionTone === 'calm') {
  travelPace = 'relaxed' // 平静倾向 → 慢节奏
} else if (intent?.emotionTone === 'active' || intent?.emotionTone === 'energetic') {
  travelPace = 'intensive' // 活跃倾向 → 快节奏
}

// 使用 travelPace 调整行程安排
```

#### 方式三：使用关键词优化活动推荐

```typescript
// 根据关键词推荐相关活动
if (intent?.keywords) {
  const keywordActivities = {
    '自然风光': ['公园', '山景', '海滩', '森林'],
    '美食': ['餐厅', '市场', '小吃街', '特色料理'],
    '历史文化': ['博物馆', '古迹', '寺庙', '历史建筑'],
    // ... 更多映射
  }
  
  // 根据关键词匹配活动类型
  const relevantActivities = intent.keywords
    .flatMap(keyword => keywordActivities[keyword] || [])
    .filter(Boolean)
}
```

### 3. 容错处理

```typescript
// 如果 intent 字段不存在或格式不正确，不影响主流程
try {
  if (request.intent) {
    // 验证意图数据格式
    if (!request.intent.intentType || !Array.isArray(request.intent.keywords)) {
      console.warn('意图数据格式不正确，忽略意图信息')
      // 继续使用原有逻辑
    } else {
      // 使用意图信息优化生成
    }
  }
} catch (error) {
  console.warn('处理意图信息时出错，使用默认逻辑:', error)
  // 继续使用原有逻辑，不影响行程生成
}
```

---

## ✅ 兼容性说明

### 向后兼容

- `intent` 字段为**可选字段**
- 如果前端不传递 `intent` 字段，后端使用原有逻辑
- 如果后端不支持 `intent` 字段，会忽略该字段，不影响正常流程

### 前端容错

前端已经做了容错处理：
- 意图识别失败不影响主流程
- 如果后端不支持 `intent` 字段，不会报错

---

## 📝 测试建议

### 1. 测试用例

**测试用例 1：有意图信息**
```json
{
  "destination": "京都",
  "days": 5,
  "startDate": "2024-01-01",
  "preferences": {
    "budget": "medium"
  },
  "intent": {
    "intentType": "cultural_exchange",
    "keywords": ["京都", "文化", "历史"],
    "emotionTone": "calm",
    "description": "用户希望进行文化交流",
    "confidence": 0.85
  }
}
```

**测试用例 2：无意图信息（向后兼容）**
```json
{
  "destination": "京都",
  "days": 5,
  "startDate": "2024-01-01",
  "preferences": {
    "budget": "medium"
  }
}
```

**测试用例 3：意图信息格式不完整**
```json
{
  "destination": "京都",
  "days": 5,
  "startDate": "2024-01-01",
  "intent": {
    "intentType": "cultural_exchange"
    // 缺少其他字段
  }
}
```

### 2. 验证点

- ✅ 有意图信息时，行程生成是否利用了意图信息
- ✅ 无意图信息时，行程生成是否正常工作
- ✅ 意图信息格式不完整时，是否容错处理
- ✅ 生成的行程质量是否有提升

---

## 🔗 相关文档

- [生成旅行行程接口详细文档](./JOURNEY_GENERATE_API.md) - 完整的接口文档，包含请求/响应格式、错误处理、使用示例等
- [后端接口需求完整文档](./COMPLETE_BACKEND_API_REQUIREMENTS.md) - 所有后端接口的汇总文档

---

## 📅 更新记录

- **2024-01-XX**: 初始版本，添加 Planner 模式意图识别集成说明
- **2024-01-XX**: 更新接口定义，`destination` 字段改为可选，支持自动推荐目的地

