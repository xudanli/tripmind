# 异步位置信息生成接口集成文档

## 概述

已成功集成后端异步位置信息生成接口，前端可以根据活动数量自动选择使用同步或异步接口，提升用户体验。

## 已完成的改动

### 1. 类型定义和接口函数 (`src/services/locationAPI.ts`)

- ✅ 添加了异步任务相关的类型定义（完全符合 API 文档）：
  - `JobStatus`: 任务状态类型（'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused' | 'not_found'）
  - `JobStatusData`: 任务状态数据（包含 `result?: BatchLocationResult[]` 字段）
  - `EnqueueLocationBatchResponse`: 异步任务入队响应（`{ success: boolean, jobId: string }`）
  - `JobStatusResponse`: 任务状态查询响应（`{ success: boolean, data: JobStatusData }`）
  - `JobResultResponse`: 任务结果响应（`{ success: boolean, data: BatchLocationResult[] }`）

- ✅ 实现了三个新的异步接口函数（完全符合 API 文档）：
  - `generateLocationBatchAsync()`: 发起异步批量生成任务（`POST /api/location/generate-batch-async`）
  - `getLocationJobStatus()`: 查询任务状态（`GET /api/location/job/:jobId`）
  - `getLocationJobResult()`: 获取任务结果（`GET /api/location/job/:jobId/result`）

- ✅ 优化：优先使用任务状态响应中的 `result` 字段（如果存在），避免额外请求

### 2. Vue Composable (`src/composables/useLocationGeneration.ts`)

- ✅ 创建了 `useLocationGeneration` composable，提供：
  - `generateAsync()`: 发起异步生成任务
  - `pollStatus()`: 手动轮询任务状态
  - `cancel()`: 取消任务（停止轮询）
  - 响应式状态：`isGenerating`, `progress`, `jobId`, `currentJobStatus`
  - 自动轮询功能，支持动态调整轮询间隔
  - 进度回调、完成回调、错误回调

### 3. 自动选择接口逻辑 (`src/services/itineraryAPI.ts`)

- ✅ 修改了 `enrichItineraryWithLocationInfo()` 函数：
  - 根据活动数量自动选择同步或异步接口
  - 活动数量 > 5：使用异步接口
  - 活动数量 <= 5：使用同步接口
  - 添加了 `enrichWithLocationInfoAsync()` 辅助函数处理异步任务

## 使用方式

### 在 Service 层使用（已自动集成）

`enrichItineraryWithLocationInfo()` 函数已自动根据活动数量选择接口，无需手动调用：

```typescript
// 自动选择同步或异步接口
const enrichedData = await enrichItineraryWithLocationInfo(
  itineraryData,
  destination,
  (message) => console.log(message) // 进度回调
)
```

### 在组件中使用 Composable（可选）

如果需要更细粒度的控制，可以在组件中使用 `useLocationGeneration` composable：

```vue
<script setup lang="ts">
import { useLocationGeneration } from '@/composables/useLocationGeneration'
import type { BatchActivity } from '@/services/locationAPI'

const {
  generateAsync,
  cancel,
  isGenerating,
  progress,
  jobId
} = useLocationGeneration({
  onProgress: (progress) => {
    console.log(`生成进度: ${progress}%`)
  },
  onComplete: (results) => {
    console.log('生成完成:', results)
  },
  onError: (error) => {
    console.error('生成失败:', error)
  }
})

const handleGenerate = async () => {
  const activities: BatchActivity[] = [
    {
      activityName: '铁力士峰云端漫步',
      destination: '瑞士琉森',
      activityType: 'attraction',
      coordinates: { lat: 46.7704, lng: 8.4050 }
    }
  ]
  
  try {
    await generateAsync(activities)
  } catch (error) {
    // 错误已在 onError 回调中处理
  }
}
</script>

<template>
  <div>
    <button @click="handleGenerate" :disabled="isGenerating">
      {{ isGenerating ? `生成中... ${progress}%` : '生成位置信息' }}
    </button>
    
    <button v-if="isGenerating" @click="cancel">取消</button>
  </div>
</template>
```

## 接口选择逻辑

### 同步接口（活动数量 <= 5）

- **接口**: `POST /api/location/generate-batch`
- **特点**: 立即返回结果，等待时间短
- **适用场景**: 少量活动，可以等待

### 异步接口（活动数量 > 5）

- **接口**: `POST /api/location/generate-batch-async`
- **特点**: 立即返回 `jobId`，不阻塞
- **适用场景**: 大量活动，需要显示进度
- **轮询**: 自动轮询任务状态，动态调整轮询间隔
  - 初始阶段（0-50%）：3-5秒间隔
  - 后期阶段（50-100%）：1-2秒间隔

## 错误处理

### 任务状态说明

- `waiting`: 任务在队列中等待
- `active`: 任务正在执行
- `completed`: 任务完成
- `failed`: 任务失败
- `delayed`: 任务延迟
- `paused`: 任务暂停
- `not_found`: 任务不存在

### 错误处理示例

所有错误都会通过 `onError` 回调或抛出异常的方式处理：

```typescript
try {
  await generateAsync(activities)
} catch (error) {
  if (error.message.includes('任务失败')) {
    // 处理任务失败
  } else if (error.message.includes('任务不存在')) {
    // 处理任务不存在
  } else {
    // 处理其他错误
  }
}
```

## 性能优化

### 1. 动态轮询间隔

根据任务进度动态调整轮询间隔，减少不必要的请求：

```typescript
// 初始阶段：较长间隔（3-5秒）
if (progress < 50) {
  return 3000
} else {
  // 后期阶段：较短间隔（1-2秒）
  return 1000
}
```

### 2. 自动去重

在 `enrichItineraryWithLocationInfo` 中，使用 `Set` 记录已处理的活动，防止重复调用：

```typescript
const processedKeys = new Set<string>()
const key = `${slot.title}|${slot.type}`
if (!processedKeys.has(key)) {
  // 处理活动
}
```

## 向后兼容

- ✅ 同步接口保持不变，现有代码无需修改
- ✅ 可以渐进式迁移，不影响现有功能
- ✅ 新功能是可选的，不影响现有用户体验

## 测试建议

### 1. 单元测试

测试 `useLocationGeneration` composable：

```typescript
describe('useLocationGeneration', () => {
  it('should generate location info asynchronously', async () => {
    const { result } = renderHook(() => useLocationGeneration())
    
    const activities = [/* ... */]
    await act(async () => {
      await result.current.generateAsync(activities)
    })
    
    expect(result.current.isGenerating).toBe(false)
  })
})
```

### 2. 集成测试

- 测试活动数量 <= 5 时使用同步接口
- 测试活动数量 > 5 时使用异步接口
- 测试任务状态轮询
- 测试任务完成回调
- 测试错误处理
- 测试取消功能

## 相关文件

- `src/services/locationAPI.ts`: 位置信息生成 API 服务（完全符合 API 文档）
- `src/services/itineraryAPI.ts`: 行程 API 服务（包含自动选择逻辑）
- `src/composables/useLocationGeneration.ts`: 异步位置信息生成 Composable
- `src/composables/useItineraryData.ts`: 行程数据管理 Composable（已集成）

## API 文档

详细的位置信息生成 API 文档请参考：[位置信息生成 API 文档](./location-api.md)

## 实现细节

### 接口路径

所有接口路径都符合 API 文档规范：
- 异步批量生成：`POST /api/location/generate-batch-async`
- 查询任务状态：`GET /api/location/job/:jobId`
- 获取任务结果：`GET /api/location/job/:jobId/result`

### 响应格式处理

- ✅ 完全符合 API 文档的响应格式
- ✅ 优先使用任务状态响应中的 `result` 字段（如果存在），减少网络请求
- ✅ 如果状态响应中没有 `result`，则调用结果接口获取

### 错误处理

- ✅ 处理所有任务状态（waiting, active, completed, failed, delayed, paused, not_found）
- ✅ 网络错误重试机制
- ✅ 任务超时处理（最多轮询 5 分钟）

## 后续优化建议

1. ⚪ 添加任务结果缓存，避免重复请求
2. ⚪ 使用 WebSocket 接收任务完成通知（如果后端支持）
3. ⚪ 添加任务重试机制
4. ⚪ 添加任务超时处理
5. ⚪ 在 UI 中显示进度条

