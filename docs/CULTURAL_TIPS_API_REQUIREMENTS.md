# 当地文化提示后端接口需求文档

## 📋 当前实现方式

### 前端显示逻辑
- **数据来源**：`slot.details?.recommendations?.culturalTips`
- **显示位置**：`SlotInfoGrid.vue` 组件中的"当地文化提示"信息块
- **显示格式**：列表形式，每条提示以项目符号（•）显示

### 当前数据流
1. **Inspiration 模式**：通过前端 AI 生成（`tipsGenerator.ts`）
2. **Planner 模式**：目前可能缺失，需要从后端接口获取

---

## 🎯 后端接口需求

### 1. 接口设计

#### 方案 A：在现有位置信息接口中扩展（推荐）

**接口路径**：`POST /api/location/generate` 或 `POST /api/location/generate-batch`

**扩展响应数据结构**：

```typescript
export interface LocationInfo {
  // ... 现有字段 ...
  
  // 新增字段：当地文化提示
  culturalTips?: string | string[]  // 支持字符串（换行分隔）或数组格式
}
```

**数据格式要求**：
- 如果返回字符串：使用换行符（`\n`）分隔多条提示
- 如果返回数组：直接使用数组格式
- 每条提示建议长度：≤ 18 个汉字（中文）或 ≤ 18 个单词（英文）
- 格式示例：
  ```json
  {
    "culturalTips": "• 进入寺庙需脱鞋，保持安静\n• 避免在公共场合大声喧哗\n• 拍照前请征得同意"
  }
  ```
  或
  ```json
  {
    "culturalTips": [
      "• 进入寺庙需脱鞋，保持安静",
      "• 避免在公共场合大声喧哗",
      "• 拍照前请征得同意"
    ]
  }
  ```

#### 方案 B：独立的文化提示接口

**接口路径**：`POST /api/cultural-tips/generate`

**请求参数**：
```typescript
interface GenerateCulturalTipsRequest {
  activityName: string
  destination: string
  activityType: 'attraction' | 'meal' | 'hotel' | 'shopping' | 'transport' | 'ocean'
  coordinates: {
    lat: number
    lng: number
    region?: string
  }
  language?: string  // 'zh-CN' | 'en-US'
}
```

**响应数据**：
```typescript
interface CulturalTipsResponse {
  success: boolean
  data: {
    activityName: string
    culturalTips: string[]  // 文化提示列表
  }
}
```

---

### 2. 内容生成要求

#### 2.1 提示内容范围
每条文化提示应涵盖以下方面：

1. **行为礼仪**
   - 当地习俗和传统
   - 公共场所行为规范
   - 宗教场所注意事项

2. **需要避免的事项**
   - 文化禁忌
   - 不礼貌的行为
   - 可能冒犯当地人的举动

3. **友好沟通提醒**
   - 常用礼貌用语
   - 沟通方式建议
   - 肢体语言注意事项

#### 2.2 内容格式规范
- **语言**：根据请求的 `language` 参数返回对应语言
- **长度**：每条提示 ≤ 18 个汉字（中文）或 ≤ 18 个单词（英文）
- **数量**：建议返回 2-3 条提示
- **格式**：每条提示以项目符号（•）开头

#### 2.3 示例

**中文示例**：
```json
{
  "culturalTips": [
    "• 进入寺庙需脱鞋，保持安静",
    "• 避免在公共场合大声喧哗",
    "• 拍照前请征得同意"
  ]
}
```

**英文示例**：
```json
{
  "culturalTips": [
    "• Remove shoes before entering temples, maintain silence",
    "• Avoid loud conversations in public places",
    "• Ask permission before taking photos"
  ]
}
```

---

### 3. 数据合并逻辑

#### 3.1 前端处理
在 `convertLocationInfoToDetails` 函数中，将 `culturalTips` 合并到 `recommendations` 对象：

```typescript
recommendations: {
  // ... 其他字段 ...
  culturalTips: locationInfo.culturalTips  // 新增
}
```

#### 3.2 数据优先级
1. **后端接口返回的 culturalTips**（优先级最高）
2. 前端 AI 生成的 culturalTips（如果后端没有返回）
3. 空数组（如果都没有）

---

### 4. 批量接口支持

如果使用方案 A（扩展位置信息接口），批量接口应同时支持：

**批量请求**：`POST /api/location/generate-batch`

**响应格式**：
```typescript
interface BatchLocationResult {
  activityName: string
  locationInfo: LocationInfo  // 包含 culturalTips 字段
}
```

---

### 5. 错误处理

- 如果生成失败，返回空数组 `[]` 或 `null`
- 如果部分活动生成失败，其他活动的数据正常返回
- 前端应优雅降级，不显示文化提示信息块

---

### 6. 性能要求

- **响应时间**：单次请求 < 3 秒
- **批量处理**：每次最多 10 个活动，总耗时 < 10 秒
- **缓存策略**：相同目的地和活动类型的文化提示可以缓存

---

### 7. 测试用例

#### 测试场景 1：景点类活动
```json
{
  "activityName": "大皇宫",
  "destination": "泰国曼谷",
  "activityType": "attraction",
  "coordinates": { "lat": 13.7500, "lng": 100.4915 }
}
```

**期望返回**：
- 包含关于泰国寺庙/皇宫的文化提示
- 提及着装要求、行为规范等

#### 测试场景 2：餐饮类活动
```json
{
  "activityName": "传统日式料理",
  "destination": "日本东京",
  "activityType": "meal",
  "coordinates": { "lat": 35.6762, "lng": 139.6503 }
}
```

**期望返回**：
- 包含关于日本用餐礼仪的提示
- 提及筷子使用、用餐顺序等

---

## 📝 实现建议

### 推荐方案：方案 A（扩展位置信息接口）

**优点**：
1. 数据获取更高效（一次请求获取所有信息）
2. 减少网络请求次数
3. 数据一致性更好（位置信息和文化提示一起返回）
4. 前端代码改动最小

**实现步骤**：
1. 后端扩展 `LocationInfo` 接口，添加 `culturalTips` 字段
2. 后端在生成位置信息时，同时生成文化提示
3. 前端更新 `convertLocationInfoToDetails` 函数，将 `culturalTips` 合并到 `recommendations`
4. 前端显示逻辑无需改动（已支持从 `recommendations.culturalTips` 读取）

---

## 🔄 前端代码改动

### 需要修改的文件

1. **`src/services/locationAPI.ts`**
   - 扩展 `LocationInfo` 接口，添加 `culturalTips` 字段
   - 更新 `convertLocationInfoToDetails` 函数

2. **`src/components/TravelDetail/ExperienceDay/SlotInfoGrid.vue`**
   - 无需改动（已支持显示 `recommendations.culturalTips`）

---

## ✅ 验收标准

1. ✅ 后端接口返回 `culturalTips` 字段
2. ✅ 前端正确解析并显示文化提示
3. ✅ 支持中英文切换
4. ✅ 批量接口正常工作
5. ✅ 错误情况下优雅降级

