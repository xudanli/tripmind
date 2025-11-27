# 快速创建完整行程的接口调用方案

## 方案一：使用 AI 生成（推荐，完整流程）

### 接口调用顺序

1. **AI 生成行程**
   ```
   POST /api/v1/itinerary/generate
   ```
   - 生成完整的行程数据（包含所有天数和活动）

2. **创建基础行程**
   ```
   POST /api/v1/journeys
   ```
   - 创建基础行程，获取 `journeyId`

3. **更新完整行程数据**
   ```
   PATCH /api/v1/journeys/{journeyId}/from-frontend-data
   ```
   - 使用前端数据格式更新完整行程

### 示例代码

```typescript
// 步骤 1: AI 生成行程
const generateResponse = await fetch('/api/v1/itinerary/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    destination: '冰岛',
    days: 5,
    startDate: '2025-12-01',
    preferences: {
      budget: 'medium',
      travelStyle: 'moderate'
    }
  })
})
const { data: itineraryData } = await generateResponse.json()

// 步骤 2: 创建基础行程
const createResponse = await fetch('/api/v1/journeys', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    destination: '冰岛',
    startDate: '2025-12-01',
    days: 5,
    data: {
      days: itineraryData.days.slice(0, 1), // 至少包含一天
      totalCost: itineraryData.totalCost,
      summary: itineraryData.summary
    },
    preferences: {
      budget: 'medium',
      travelStyle: 'moderate'
    },
    status: 'draft'
  })
})
const { data: journey } = await createResponse.json()
const journeyId = journey.id

// 步骤 3: 更新完整行程
const updateResponse = await fetch(`/api/v1/journeys/${journeyId}/from-frontend-data`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    itineraryData: {
      destination: '冰岛',
      duration: 5,
      days: itineraryData.days,
      totalCost: itineraryData.totalCost,
      summary: itineraryData.summary,
      title: '冰岛之旅'
    },
    startDate: '2025-12-01'
  })
})
const { data: updatedJourney } = await updateResponse.json()
```

---

## 方案二：手动创建（快速测试，无需 AI）

### 接口调用顺序

1. **创建基础行程（包含完整数据）**
   ```
   POST /api/v1/journeys
   ```
   - 一次性创建包含所有天数和活动的完整行程

### 示例代码

```typescript
// 一次性创建完整行程
const createResponse = await fetch('/api/v1/journeys', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    destination: '冰岛',
    startDate: '2025-12-01',
    days: 5,
    data: {
      days: [
        {
          day: 1,
          date: '2025-12-01',
          activities: [
            {
              time: '10:00',
              title: '参观蓝湖温泉',
              type: 'attraction',
              duration: 120,
              location: { lat: 63.8808, lng: -22.4494 },
              notes: '享受地热温泉',
              cost: 50
            },
            {
              time: '14:00',
              title: '午餐',
              type: 'meal',
              duration: 60,
              location: { lat: 63.8808, lng: -22.4494 },
              notes: '当地特色餐厅',
              cost: 30
            }
          ]
        },
        {
          day: 2,
          date: '2025-12-02',
          activities: [
            {
              time: '09:00',
              title: '黄金圈一日游',
              type: 'attraction',
              duration: 480,
              location: { lat: 64.2553, lng: -20.5133 },
              notes: '参观间歇泉、瀑布等',
              cost: 100
            }
          ]
        }
        // ... 更多天数
      ],
      totalCost: 500,
      summary: '5天冰岛之旅，探索自然奇观'
    },
    preferences: {
      budget: 'medium',
      travelStyle: 'moderate'
    },
    status: 'draft'
  })
})
const { data: journey } = await createResponse.json()
```

---

## 方案三：分步创建（灵活控制）

### 接口调用顺序

1. **创建基础行程**
   ```
   POST /api/v1/journeys
   ```
   - 创建基础行程，获取 `journeyId`

2. **添加天数（批量或单个）**
   ```
   POST /api/v1/journeys/{journeyId}/days
   ```
   - 批量添加天数，或单个添加

3. **为每个天数添加活动**
   ```
   POST /api/v1/journeys/{journeyId}/days/{dayId}/slots
   ```
   - 为每个天数添加活动（slots）

### 示例代码

```typescript
// 步骤 1: 创建基础行程
const createResponse = await fetch('/api/v1/journeys', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    destination: '冰岛',
    startDate: '2025-12-01',
    days: 5,
    data: {
      days: [], // 先创建空数组
      totalCost: 0,
      summary: '5天冰岛之旅'
    },
    status: 'draft'
  })
})
const { data: journey } = await createResponse.json()
const journeyId = journey.id

// 步骤 2: 批量添加天数
const addDaysResponse = await fetch(`/api/v1/journeys/${journeyId}/days`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify([
    { day: 1, date: '2025-12-01' },
    { day: 2, date: '2025-12-02' },
    { day: 3, date: '2025-12-03' },
    { day: 4, date: '2025-12-04' },
    { day: 5, date: '2025-12-05' }
  ])
})
const { data: days } = await addDaysResponse.json()

// 步骤 3: 为第一天添加活动
const day1Id = days[0].id
const addSlotResponse = await fetch(`/api/v1/journeys/${journeyId}/days/${day1Id}/slots`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    time: '10:00',
    title: '参观蓝湖温泉',
    type: 'attraction',
    duration: 120,
    location: { lat: 63.8808, lng: -22.4494 },
    notes: '享受地热温泉',
    cost: 50
  })
})
const { data: activity } = await addSlotResponse.json()
```

---

## 方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **方案一：AI 生成** | 完整、自动化、数据丰富 | 需要 AI 服务，耗时较长 | 正常用户流程 |
| **方案二：手动创建** | 快速、可控、无需 AI | 需要手动准备数据 | 快速测试、演示 |
| **方案三：分步创建** | 灵活、可控制每个步骤 | 接口调用次数多 | 需要动态添加内容 |

---

## 快速测试脚本（cURL）

### 方案二：手动创建（最快）

```bash
# 1. 创建完整行程
curl -X POST "http://localhost:3000/api/v1/journeys" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "destination": "冰岛",
    "startDate": "2025-12-01",
    "days": 3,
    "data": {
      "days": [
        {
          "day": 1,
          "date": "2025-12-01",
          "activities": [
            {
              "time": "10:00",
              "title": "参观蓝湖温泉",
              "type": "attraction",
              "duration": 120,
              "location": { "lat": 63.8808, "lng": -22.4494 },
              "notes": "享受地热温泉",
              "cost": 50
            }
          ]
        },
        {
          "day": 2,
          "date": "2025-12-02",
          "activities": [
            {
              "time": "09:00",
              "title": "黄金圈一日游",
              "type": "attraction",
              "duration": 480,
              "location": { "lat": 64.2553, "lng": -20.5133 },
              "notes": "参观间歇泉、瀑布等",
              "cost": 100
            }
          ]
        }
      ],
      "totalCost": 150,
      "summary": "3天冰岛之旅"
    },
    "preferences": {
      "budget": "medium",
      "travelStyle": "moderate"
    },
    "status": "draft"
  }'
```

---

## 接口详细说明

### 1. POST /api/v1/journeys
**创建行程（基础或完整）**

**请求体**:
```typescript
{
  destination: string          // 必填：目的地
  startDate: string           // 必填：开始日期 (YYYY-MM-DD)
  days: number               // 必填：天数
  data: {
    days: ItineraryDay[]      // 必填：至少包含一天的数据
    totalCost: number         // 必填：总费用
    summary: string           // 必填：摘要
  }
  preferences?: {             // 可选：偏好设置
    budget?: 'low' | 'medium' | 'high'
    travelStyle?: 'relaxed' | 'moderate' | 'intensive'
  }
  status?: 'draft' | 'published' | 'archived'  // 可选：状态
}
```

**响应**:
```typescript
{
  success: boolean
  data: {
    id: string                // 行程ID (UUID)
    destination: string
    startDate: string
    daysCount: number
    // ... 其他字段
  }
}
```

### 2. PATCH /api/v1/journeys/{journeyId}/from-frontend-data
**使用前端数据格式更新完整行程**

**请求体**:
```typescript
{
  itineraryData: {
    destination: string
    duration: number
    days: FrontendItineraryDay[]  // 前端格式的 days
    totalCost: number
    summary: string
    title?: string
    // ... 其他字段
  }
  startDate: string
}
```

### 3. POST /api/v1/journeys/{journeyId}/days
**添加天数（批量或单个）**

**请求体（批量）**:
```typescript
[
  { day: 1, date: '2025-12-01' },
  { day: 2, date: '2025-12-02' }
]
```

**请求体（单个）**:
```typescript
{
  day: 1,
  date: '2025-12-01'
}
```

### 4. POST /api/v1/journeys/{journeyId}/days/{dayId}/slots
**为天数添加活动**

**请求体**:
```typescript
{
  time: string              // HH:mm
  title: string
  type: 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'
  duration: number          // 分钟
  location: {
    lat: number
    lng: number
  }
  notes: string
  cost: number
}
```

---

## 推荐方案

**快速测试推荐：方案二（手动创建）**
- 最快：只需 1 个接口调用
- 可控：完全控制数据内容
- 适合：单元测试、快速验证

**正常流程推荐：方案一（AI 生成）**
- 完整：包含所有数据
- 自动化：AI 自动生成内容
- 适合：实际用户使用

