# POI 搜索接口 - 前端需求文档

## 概述

本文档描述了前端"搜索附近"功能对后端 POI 搜索接口的需求。前端在行程详情页的体验日组件中，允许用户搜索当前位置附近的兴趣点（POI），包括餐厅、景点、住宿、加油站、充电桩、休息站等。

---

## 接口信息

**接口路径：** `POST /api/v1/poi/search`

**接口描述：** 搜索兴趣点（POI），供前端 ExperienceDay 组件使用

**认证：** 不需要认证（公开接口）

**Content-Type：** `application/json`

---

## 前端发送的请求参数

### 请求体结构

```json
{
  "query": "餐厅",
  "destination": "冰岛雷克雅未克",
  "latitude": 64.1466,
  "longitude": -21.9426,
  "type": "restaurant",
  "limit": 20
}
```

### 字段说明

| 字段名 | 类型 | 必填 | 说明 | 前端来源 |
|--------|------|------|------|----------|
| `query` | string | 是 | 搜索关键词 | 根据选择的类别自动生成：<br>- restaurant: "餐厅"<br>- attraction: "景点"<br>- accommodation: "酒店"<br>- shopping: "购物"<br>- gas_station: "加油站"<br>- ev_charging: "充电桩"<br>- rest_area: "休息站" |
| `destination` | string | 否 | 目的地名称 | 从行程数据中获取：`travel.destination` 或 `travel.location` |
| `latitude` | number | 否 | 纬度（-90 到 90） | 从当前活动的位置坐标获取：`slot.coordinates.lat` |
| `longitude` | number | 否 | 经度（-180 到 180） | 从当前活动的位置坐标获取：`slot.coordinates.lng` |
| `type` | string | 否 | POI 类型 | 前端类别映射：<br>- `restaurant` → `restaurant`<br>- `attraction` → `attraction`<br>- `accommodation` → `hotel`<br>- `gas_station` → `all`（后端不支持，使用 all）<br>- `ev_charging` → `all`（后端不支持，使用 all）<br>- `rest_area` → `all`（后端不支持，使用 all） |
| `limit` | number | 否 | 返回数量限制 | 固定值：`20` |

### 前端请求示例

```typescript
// 前端代码示例
const backendResults = await searchPOI({
  query: searchQuery,           // "餐厅"、"景点"等
  destination: destination,      // "冰岛雷克雅未克"
  latitude: coordinates?.lat,    // 64.1466
  longitude: coordinates?.lng,   // -21.9426
  type: backendType,             // "restaurant"、"attraction"等
  limit: 20
})
```

---

## 前端期望的响应格式

### 成功响应（200 OK）

```json
{
  "data": [
    {
      "id": "poi-123",
      "name": "卢浮宫",
      "address": "Rue de Rivoli, 75001 Paris, France",
      "latitude": 48.8606,
      "longitude": 2.3376,
      "type": "attraction",
      "rating": 4.5,
      "imageUrl": "https://example.com/image.jpg",
      "description": "世界著名的艺术博物馆，收藏了来自世界各地的珍贵艺术品"
    }
  ],
  "total": 1
}
```

### 响应字段说明

| 字段 | 类型 | 必填 | 说明 | 前端用途 |
|------|------|------|------|----------|
| `data` | array | 是 | POI 列表 | 直接使用，转换为前端格式 |
| `data[].id` | string | 是 | POI ID | 用于唯一标识 |
| `data[].name` | string | **是** | POI 名称 | **重要：必须提供，前端会显示在名称区域** |
| `data[].address` | string | **强烈建议** | 地址 | **重要：如果为空，前端会显示"地址未知"** |
| `data[].latitude` | number | 是 | 纬度 | 用于地图定位和距离计算 |
| `data[].longitude` | number | 是 | 经度 | 用于地图定位和距离计算 |
| `data[].type` | string | 是 | POI 类型 | 用于分类显示 |
| `data[].rating` | number | 否 | 评分（0-5） | 如果提供，前端会显示评分标签（⭐ 4.5） |
| `data[].imageUrl` | string | 否 | 图片URL | 如果提供，前端会显示POI照片 |
| `data[].description` | string | **强烈建议** | 描述/推荐理由 | **重要：如果 address 为空，前端会尝试使用 description 作为地址的备用值** |
| `total` | number | 是 | 总数量 | 用于显示搜索结果统计 |

### 前端数据转换逻辑

前端会将后端返回的数据转换为以下格式：

```typescript
// 前端 POIResult 格式
{
  name: {
    chinese: backendResult.name,    // 使用后端 name
    english: backendResult.name,     // 使用后端 name
    local: backendResult.name        // 使用后端 name
  },
  address: {
    chinese: backendResult.address || backendResult.description || '',
    english: backendResult.address || backendResult.description || '',
    local: backendResult.address || backendResult.description || ''
  },
  coordinates: {
    lat: backendResult.latitude,
    lng: backendResult.longitude
  },
  recommendation: backendResult.description || '推荐前往',
  rating: backendResult.rating ? {
    score: backendResult.rating,
    platform: 'TripAdvisor'
  } : undefined,
  photo: backendResult.imageUrl
}
```

**重要转换规则：**
1. **name 字段**：如果为空，前端会使用 "未知地点" 作为默认值
2. **address 字段**：如果为空，前端会尝试使用 `description` 作为备用值；如果仍然为空，前端会显示 "地址未知"
3. **description 字段**：如果为空，前端会使用 "推荐前往" 作为默认值

---

## 前端显示需求

### 1. POI 卡片显示内容

前端会在搜索结果卡片中显示以下信息：

- **名称区域**：显示 `name`（中文、英文、本地语言）
- **评分标签**：如果 `rating` 存在，显示 ⭐ 评分（颜色：≥4 绿色，≥3 橙色，<3 红色）
- **地址信息**：显示 `address`，如果为空则显示 "地址未知"
- **推荐理由**：显示 `description` 或 "推荐前往"
- **照片**：如果 `imageUrl` 存在，显示POI照片
- **操作按钮**：
  - "添加到行程"：将POI添加到当前行程
  - "查看详情"：查看POI详细信息

### 2. 前端支持的POI类别

前端支持以下6个类别：

| 前端类别 | 前端显示 | 后端 type 参数 | 搜索 query |
|---------|---------|---------------|-----------|
| `restaurant` | 餐饮 🍽️ | `restaurant` | "餐厅" |
| `attraction` | 景点 🏛️ | `attraction` | "景点" |
| `accommodation` | 住宿 🏨 | `hotel` | "酒店" |
| `gas_station` | 加油站 ⛽ | `all` | "加油站" |
| `ev_charging` | 充电桩 🔌 | `all` | "充电桩" |
| `rest_area` | 休息站 🛋️ | `all` | "休息站" |

**注意：** 对于 `gas_station`、`ev_charging`、`rest_area`，前端会发送 `type: "all"`，因为后端目前不支持这些特定类型。后端应该根据 `query` 参数（"加油站"、"充电桩"、"休息站"）来过滤结果。

---

## 错误处理需求

### 400 Bad Request - 参数验证失败

```json
{
  "statusCode": 400,
  "message": [
    "query should not be empty",
    "latitude must be a number"
  ],
  "error": "Bad Request"
}
```

**前端处理：**
- 前端会捕获 400 错误，记录警告日志，返回空数组
- 不会抛出异常，不会阻塞用户操作
- 如果后端返回空结果，前端会自动回退到 AI 搜索

### 其他错误

**前端处理：**
- 前端会捕获错误，记录错误日志
- 自动回退到 AI 搜索（使用 `searchNearbyPOI` 函数）
- 保证用户体验的连续性

---

## 特殊需求和注意事项

### 1. 数据完整性要求

**必须提供的字段：**
- `id`：POI唯一标识
- `name`：POI名称（**必须**，不能为空）
- `latitude`、`longitude`：坐标（**必须**）
- `type`：POI类型

**强烈建议提供的字段：**
- `address`：地址（如果为空，前端会显示"地址未知"）
- `description`：描述/推荐理由（如果为空，前端会使用"推荐前往"）

**可选但建议提供的字段：**
- `rating`：评分（如果提供，前端会显示评分标签）
- `imageUrl`：图片URL（如果提供，前端会显示POI照片）

### 2. 搜索策略

前端发送请求时的优先级：

1. **如果提供了坐标**（`latitude` 和 `longitude`）：
   - 优先使用坐标搜索
   - 同时提供 `destination` 作为上下文

2. **如果只提供了目的地**（`destination`）：
   - 使用目的地名称搜索
   - 不提供坐标

3. **搜索关键词**（`query`）：
   - 根据选择的类别自动生成
   - 例如：选择"餐厅"类别 → `query: "餐厅"`

### 3. 结果数量

- 前端固定请求 `limit: 20`
- 建议后端返回 10-20 个结果，保证搜索质量
- 如果结果过多，前端会显示前20个

### 4. 多语言支持

- 前端支持中文和英文界面
- 后端返回的 `name` 和 `address` 可以是任意语言
- 前端会直接显示后端返回的内容

### 5. 回退机制

如果后端搜索失败或返回空结果：
- 前端会自动回退到 AI 搜索（`searchNearbyPOI`）
- 使用 DeepSeek AI 生成搜索结果
- 保证用户体验的连续性

### 6. 缓存机制

- 前端不实现缓存（由后端或外部服务实现）
- 如果后端实现了缓存，前端会受益

---

## 前端代码位置

### 主要文件

1. **接口调用**：`src/services/externalAPI.ts`
   - 函数：`searchPOI(request: POISearchRequest): Promise<POISearchResult[]>`

2. **组件实现**：`src/components/TravelDetail/ExperienceDay.vue`
   - 搜索模态框：第 454-603 行
   - 搜索逻辑：第 2633-2720 行
   - 数据转换：第 2569-2617 行

3. **类型定义**：
   - `src/services/externalAPI.ts`：`POISearchRequest`、`POISearchResult`、`POISearchResponse`
   - `src/services/poiSearchAPI.ts`：`POICategory`、`POIResult`

---

## 测试建议

### 测试场景

1. **基本搜索**：
   - 提供坐标和目的地，搜索"餐厅"
   - 验证返回结果的完整性和准确性

2. **边界情况**：
   - `name` 为空：验证前端是否使用 "未知地点"
   - `address` 为空：验证前端是否显示 "地址未知"
   - `description` 为空：验证前端是否使用 "推荐前往"

3. **特殊类别**：
   - 搜索"加油站"、"充电桩"、"休息站"
   - 验证后端是否能根据 `query` 正确过滤结果

4. **错误处理**：
   - 发送无效参数，验证 400 错误响应
   - 验证前端是否正确处理错误

5. **数据质量**：
   - 验证返回的坐标是否准确
   - 验证地址格式是否清晰
   - 验证描述是否有助于用户决策

---

## 总结

### 关键要求

1. **数据完整性**：`name` 和 `address` 字段必须尽可能提供，避免前端显示"未知地点"或"地址未知"
2. **搜索准确性**：根据 `query` 和 `type` 参数返回相关结果
3. **错误处理**：400 错误返回详细的验证信息，其他错误不影响前端流程
4. **响应格式**：严格按照文档格式返回，确保前端能正确解析

### 优先级

- **P0（必须）**：`id`、`name`、`latitude`、`longitude`、`type`
- **P1（强烈建议）**：`address`、`description`
- **P2（建议）**：`rating`、`imageUrl`

---

**文档版本：** 1.0  
**最后更新：** 2025-01-26  
**维护者：** 前端开发团队

