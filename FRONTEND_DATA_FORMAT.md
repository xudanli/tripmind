# 从前端数据格式创建行程接口文档

## 接口信息

**接口路径**: `POST /api/v1/journeys/from-frontend-data`

**接口描述**: 接受前端提供的完整行程数据格式（包含 `itineraryData` 和 `tasks`），自动转换为标准格式并创建行程

**认证**: 需要 JWT Token（Bearer Token）

**Content-Type**: `application/json`

---

## 请求参数

### 请求体结构

```typescript
{
  itineraryData: {
    title: string                    // 行程标题
    destination: string              // 目的地（必填）
    duration: number                 // 行程天数
    budget?: string                  // 预算：'low' | 'medium' | 'high'
    preferences?: string[] | {       // 偏好设置
      interests?: string[]
      budget?: 'low' | 'medium' | 'high'
      travelStyle?: 'relaxed' | 'moderate' | 'intensive'
    }
    travelStyle?: string             // 旅行风格
    itinerary?: any[]                // 行程数组（可选）
    recommendations?: {              // 推荐信息
      accommodation?: string
      transportation?: string
      food?: string
      tips?: string
      [key: string]: any
    }
    days: Array<{                    // 天数数组（必填，至少包含一天）
      id: string                     // 天数ID（后端必须返回，用于批量获取活动详情）
      day: number                    // 天数编号（从1开始）
      date: string                   // 日期（YYYY-MM-DD）
      timeSlots: Array<{             // 时间段数组（前端格式）
        time: string                 // 时间（HH:MM，必填）
        title: string                // 标题（必填）
        activity?: string            // 活动名称（可选）
        type: string                 // 类型（必填）：'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'
        coordinates: {               // 坐标（必填）
          lat: number                // 纬度
          lng: number                // 经度
        }
        notes?: string               // 备注（可选）
        details?: {                  // 详细信息（可选，但建议包含）
          [key: string]: any         // 可以包含任意字段
        }
        cost?: number                // 费用（可选）
        duration?: number            // 时长（分钟，可选）
      }>
    }>
    totalCost?: number               // 总费用（可选）
    summary?: string                 // 摘要（可选）
  }
  startDate?: string                 // 开始日期（YYYY-MM-DD，可选）
  tasks?: Array<{                    // 任务列表（可选）
    title: string
    completed?: boolean
    links?: Array<{
      label: string
      url: string
    }>
  }>
}
```

---

## 数据转换说明

### 前端格式 → 后端格式

后端需要将前端的 `timeSlots` 转换为后端的 `activities`：

**前端格式 (timeSlots)**:
```json
{
  "time": "09:00",
  "title": "探秘雷克雅未克大教堂",
  "type": "attraction",
  "coordinates": { "lat": 64.1419, "lng": -21.9274 },
  "notes": "建议提前购票",
  "details": { ... },
  "cost": 1200,
  "duration": 90
}
```

**后端格式 (activities)**:
```json
{
  "time": "09:00",
  "title": "探秘雷克雅未克大教堂",
  "type": "attraction",
  "location": { "lat": 64.1419, "lng": -21.9274 },
  "notes": "建议提前购票",
  "details": { ... },
  "cost": 1200,
  "duration": 90
}
```

### 关键转换点

1. **coordinates → location**: 前端使用 `coordinates`，后端使用 `location`
2. **details 字段**: 应该完整保留，包含所有详细信息
3. **字段映射**:
   - `time` → `time` (保持不变)
   - `title` → `title` (保持不变)
   - `type` → `type` (保持不变)
   - `coordinates` → `location` (需要转换)
   - `notes` → `notes` (保持不变)
   - `details` → `details` (保持不变)
   - `cost` → `cost` (保持不变)
   - `duration` → `duration` (保持不变)

---

## 请求示例

### cURL

```bash
curl -X POST "http://localhost:3000/api/v1/journeys/from-frontend-data" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "itineraryData": {
      "title": "冰岛之旅",
      "destination": "冰岛",
      "duration": 5,
      "budget": "medium",
      "preferences": ["nature", "adventure"],
      "travelStyle": "moderate",
      "days": [
        {
          "id": "day-id-1",
          "day": 1,
          "date": "2025-11-24",
          "timeSlots": [
            {
              "time": "09:00",
              "title": "探秘雷克雅未克大教堂的螺旋天际",
              "type": "attraction",
              "coordinates": {
                "lat": 64.1419,
                "lng": -21.9274
              },
              "notes": "建议提前在线购票",
              "details": {
                "name": {
                  "chinese": "探秘雷克雅未克大教堂的螺旋天际",
                  "english": "Hallgrímskirkja Spiral Skyline Tour"
                },
                "rating": 4.7
              },
              "cost": 1200,
              "duration": 90
            }
          ]
        }
      ],
      "totalCost": 1200,
      "summary": "5天的冰岛之旅"
    },
    "startDate": "2025-11-24"
  }'
```

---

## 响应数据

### 成功响应（201 Created）

```json
{
  "success": true,
  "data": {
    "id": "journey-uuid",
    "destination": "冰岛",
    "startDate": "2025-11-24",
    "daysCount": 5,
    "summary": "5天的冰岛之旅",
    "totalCost": 1200,
    "days": [
      {
        "id": "day-uuid",
        "day": 1,
        "date": "2025-11-24",
        "activities": [
          {
            "id": "activity-uuid",
            "time": "09:00",
            "title": "探秘雷克雅未克大教堂的螺旋天际",
            "type": "attraction",
            "location": {
              "lat": 64.1419,
              "lng": -21.9274
            },
            "notes": "建议提前在线购票",
            "details": { ... },
            "cost": 1200,
            "duration": 90
          }
        ]
      }
    ],
    "status": "draft",
    "createdAt": "2025-11-26T16:36:35.175Z",
    "updatedAt": "2025-11-26T16:36:35.175Z"
  }
}
```

---

## 常见问题排查

### 问题 1: activities 数组为空

**症状**: 创建成功后，返回的 `days[0].activities` 是空数组 `[]`

**可能原因**:
1. 后端没有正确转换 `timeSlots` → `activities`
2. 后端验证过滤了某些字段
3. `details` 字段过大或格式不正确

**排查步骤**:
1. 检查后端日志，确认是否收到 `timeSlots` 数据
2. 检查后端转换逻辑是否正确
3. 验证 `coordinates` → `location` 转换
4. 检查 `details` 字段是否被正确保存

### 问题 2: 数据验证失败

**症状**: 返回 400 Bad Request

**可能原因**:
1. 缺少必填字段（`destination`, `days`, `timeSlots`）
2. 字段格式不正确（日期格式、坐标格式等）
3. `timeSlots` 数组为空

**解决方案**:
- 确保所有必填字段都存在
- 验证日期格式为 `YYYY-MM-DD`
- 验证时间格式为 `HH:MM`
- 确保每个 `timeSlot` 都有 `time`, `title`, `type`, `coordinates`

### 问题 3: details 字段丢失

**症状**: 创建成功后，`activities[0].details` 为空或不存在

**可能原因**:
1. 后端没有保存 `details` 字段
2. `details` 字段过大，被截断
3. 后端数据库字段限制

**解决方案**:
- 检查后端是否支持保存 `details` 字段
- 确认数据库字段类型（JSON/JSONB）
- 检查是否有字段大小限制

---

## 前端使用示例

### TypeScript

```typescript
import { createJourneyFromFrontendData } from '@/services/itineraryAPI'

const frontendData = {
  itineraryData: {
    title: '冰岛之旅',
    destination: '冰岛',
    duration: 5,
    budget: 'medium',
    preferences: ['nature', 'adventure'],
    travelStyle: 'moderate',
    days: [
      {
        day: 1,
        date: '2025-11-24',
        timeSlots: [
          {
            time: '09:00',
            title: '探秘雷克雅未克大教堂',
            type: 'attraction',
            coordinates: { lat: 64.1419, lng: -21.9274 },
            notes: '建议提前购票',
            details: { ... },
            cost: 1200,
            duration: 90
          }
        ]
      }
    ],
    totalCost: 1200,
    summary: '5天的冰岛之旅'
  },
  startDate: '2025-11-24'
}

try {
  const result = await createJourneyFromFrontendData(frontendData)
  console.log('创建成功:', result.id)
  // 跳转到详情页
  router.push(`/travel/${result.id}`)
} catch (error) {
  console.error('创建失败:', error)
}
```

---

## 调试信息

前端已添加详细的调试日志，包括：

1. **请求前验证**:
   - 验证必填字段
   - 检查每个 `timeSlot` 的完整性
   - 验证坐标信息

2. **请求数据记录**:
   - 记录每个 day 的 `timeSlots` 数量
   - 记录每个 `timeSlot` 的关键字段

3. **响应数据检查**:
   - 检查返回的 `days` 数组
   - 检查每个 day 的 `activities` 数量
   - 如果 `activities` 为空，自动重新获取详情

4. **错误处理**:
   - 详细的错误信息
   - 自动重试机制（如果返回数据不完整）

---

## 注意事项

1. **数据格式**: 确保 `timeSlots` 数组不为空，至少包含一个有效的活动
2. **坐标格式**: `coordinates` 必须包含 `lat` 和 `lng` 两个数字字段
3. **日期格式**: 所有日期字段必须使用 `YYYY-MM-DD` 格式
4. **时间格式**: 时间字段必须使用 `HH:MM` 格式（24小时制）
5. **details 字段**: 虽然可选，但建议包含完整的 `details` 信息，以便后端保存
6. **后端转换**: 后端需要正确将 `timeSlots` 转换为 `activities`，并保留所有字段

---

## 测试脚本

已创建测试脚本：`test-create-from-frontend-data.js`

运行测试：
```bash
node test-create-from-frontend-data.js
```

测试脚本会：
1. 发送创建请求
2. 检查响应数据
3. 验证 `activities` 是否正确转换
4. 如果 `activities` 为空，会显示警告
5. 自动获取详情进行验证

