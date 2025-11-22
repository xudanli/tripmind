# 灵感模式后端API对接说明

## 📋 概述

本文档说明如何将灵感模式前端代码对接后端提供的API接口。

---

## 🔧 配置

### 环境变量

在 `.env` 文件中添加配置：

```bash
# 是否使用灵感模式后端API（默认启用）
VITE_USE_INSPIRATION_BACKEND_API=true

# 后端API基础URL
VITE_API_BASE_URL=http://localhost:3000/api
```

### API配置

后端API基础路径：`/api/inspiration`

所有接口都需要JWT Bearer Token认证。

---

## 📦 已创建的文件

### 1. API客户端文件

**文件路径：** `src/services/inspirationBackendAPI.ts`

**功能：** 包含所有后端API调用的封装函数

**导出的函数：**
- `detectIntent()` - 意图识别
- `recommendDestinations()` - 目的地推荐
- `generateItinerary()` - 生成完整行程
- `extractDays()` - 天数提取

### 2. API文档

**文件路径：** `docs/INSPIRATION_API.md`

**内容：** 完整的后端API接口规范文档

---

## 🔄 对接方式

### 自动Fallback机制

代码已经实现了自动fallback机制：

1. **优先使用后端API**（如果启用）
2. **失败时自动fallback到前端实现**

### 已更新的文件

**文件路径：** `src/apis/inspiration.ts`

**更新内容：**
- `detectInspirationIntent()` - 支持后端API调用
- `generateInspirationJourney()` - 支持后端API调用

**工作流程：**

```typescript
// 1. 检查是否启用后端API
if (USE_BACKEND_API) {
  try {
    // 2. 调用后端API
    const result = await backendAPI.call(...)
    return result
  } catch (error) {
    // 3. 失败时fallback到前端实现
    console.warn('后端API失败，使用前端实现')
  }
}

// 4. 使用前端实现（原有逻辑）
```

---

## 🚀 使用方法

### 当前状态

**代码已自动支持后端API调用，无需修改业务逻辑。**

前端代码会自动：
1. 检测环境变量 `VITE_USE_INSPIRATION_BACKEND_API`
2. 如果启用，优先调用后端API
3. 如果失败，自动fallback到前端实现

### 启用后端API

1. **设置环境变量：**

```bash
# .env.development 或 .env.production
VITE_USE_INSPIRATION_BACKEND_API=true
VITE_API_BASE_URL=http://your-backend-url/api
```

2. **确保后端接口已实现：**

后端需要实现以下接口：
- `POST /api/inspiration/detect-intent` - 意图识别
- `POST /api/inspiration/recommend-destinations` - 目的地推荐
- `POST /api/inspiration/generate-itinerary` - 生成行程
- `POST /api/inspiration/extract-days` - 天数提取（可选）

3. **确保认证正常：**

后端接口需要JWT Bearer Token认证，前端会自动通过 `authenticatedFetch` 添加认证头。

### 禁用后端API（使用前端实现）

```bash
# .env.development 或 .env.production
VITE_USE_INSPIRATION_BACKEND_API=false
```

---

## 📊 接口对接详情

### 1. 意图识别接口

**后端接口：** `POST /api/inspiration/detect-intent`

**前端调用：**
```typescript
import { detectIntent } from '@/services/inspirationBackendAPI'

const result = await detectIntent({
  input: '我想去一个安静的地方放松',
  language: 'zh-CN'
})
```

**自动对接：**
- `detectInspirationIntent()` 函数已自动支持后端API调用

### 2. 目的地推荐接口

**后端接口：** `POST /api/inspiration/recommend-destinations`

**前端调用：**
```typescript
import { recommendDestinations } from '@/services/inspirationBackendAPI'

const result = await recommendDestinations({
  input: '我想去一个安静的地方放松',
  language: 'zh-CN',
  limit: 10
})
```

**注意：** 此接口需要在业务逻辑中显式调用，或在 `generateItinerary` 接口中集成。

### 3. 生成完整行程接口

**后端接口：** `POST /api/inspiration/generate-itinerary`

**前端调用：**
```typescript
import { generateItinerary } from '@/services/inspirationBackendAPI'

const result = await generateItinerary({
  input: '我想去冰岛看极光，5天行程',
  selectedDestination: '冰岛',
  language: 'zh-CN',
  mode: 'full',
  userRequestedDays: 5
})
```

**自动对接：**
- `generateInspirationJourney()` 函数已自动支持后端API调用
- 会自动调用意图识别和天数提取接口（如果需要）

### 4. 天数提取接口

**后端接口：** `POST /api/inspiration/extract-days`

**前端调用：**
```typescript
import { extractDays } from '@/services/inspirationBackendAPI'

const result = await extractDays({
  input: '我想去冰岛5天',
  language: 'zh-CN'
})
```

**自动对接：**
- `generateInspirationJourney()` 函数会自动调用此接口（如果启用后端API）

---

## 🔍 调试

### 查看日志

后端API调用会有详细的日志输出：

```
[InspirationBackendAPI] 意图识别请求: {...}
[InspirationBackendAPI] 意图识别成功: {...}
[InspirationBackendAPI] 生成行程请求: {...}
[InspirationBackendAPI] 生成行程成功: {...}
```

### 检查配置

```typescript
// 在浏览器控制台检查
console.log('USE_BACKEND_API:', import.meta.env.VITE_USE_INSPIRATION_BACKEND_API)
console.log('API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
```

---

## ⚠️ 注意事项

1. **认证要求：** 所有后端接口都需要JWT Bearer Token认证
2. **错误处理：** 后端API失败时会自动fallback到前端实现，不会中断流程
3. **数据格式：** 后端返回的数据格式会自动转换为前端需要的格式
4. **向后兼容：** 如果后端API未启用或失败，会自动使用前端实现，保证功能正常

---

## 📝 测试

### 测试后端API连接

```typescript
// 在浏览器控制台测试
import { detectIntent } from '@/services/inspirationBackendAPI'

detectIntent({
  input: '我想去一个安静的地方放松',
  language: 'zh-CN'
}).then(result => {
  console.log('✅ 后端API正常:', result)
}).catch(error => {
  console.error('❌ 后端API失败:', error)
})
```

---

## 🎯 下一步

1. ✅ 后端API客户端已创建
2. ✅ API文档已保存
3. ✅ 前端代码已更新，支持后端API调用
4. ⏳ 等待后端接口实现
5. ⏳ 测试后端接口连接
6. ⏳ 验证数据格式转换

---

**文档版本：** v1.0  
**最后更新：** 2024年1月

