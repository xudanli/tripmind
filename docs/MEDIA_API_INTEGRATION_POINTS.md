# 媒体服务 API 集成点

## 概述

本文档列出了所有需要调用新媒体服务 API (`/api/v1/media`) 的位置，以及如何从旧的直接调用第三方 API 迁移到新的统一接口。

---

## 需要更新的位置

### 1. 活动图片加载 - `ExperienceDay.vue`

#### 位置 1: 获取活动图片列表（预览模态框）

**文件**: `src/components/TravelDetail/ExperienceDay.vue`  
**行数**: 1150-1154  
**当前实现**:
```typescript
const images = await getActivityImagesList(slot, destination.value, {
  orientation: 'landscape',
  size: 'regular',
  count: 9,
})
```

**当前使用的函数**: `getActivityImagesList` from `@/services/unsplashAPI.ts`  
**应该改为**: 使用 `searchImage` from `@/services/mediaAPI.ts`

**迁移方案**:
```typescript
import { searchImage } from '@/services/mediaAPI'
import { generateSearchQuery } from '@/services/unsplashAPI' // 保留用于生成搜索关键词

// 替换 getActivityImagesList 调用
const query = generateSearchQuery(slot, destination.value)
const result = await searchImage({
  query: query,
  provider: 'all', // 搜索所有提供商
  limit: 9,
  orientation: 'landscape'
})

const images = result.data.map(img => img.url)
```

---

#### 位置 2: 搜索视频（预览模态框）

**文件**: `src/components/TravelDetail/ExperienceDay.vue`  
**行数**: 1168-1170  
**当前实现**:
```typescript
const query = generateSearchQuery(slot, destination.value)
if (query) {
  const [video] = await searchPexelsVideos(query, { perPage: 1, orientation: 'landscape' })
}
```

**当前使用的函数**: `searchPexelsVideos` from `@/services/pexelsAPI.ts`  
**应该改为**: 使用 `searchVideo` from `@/services/mediaAPI.ts`

**迁移方案**:
```typescript
import { searchVideo } from '@/services/mediaAPI'
import { generateSearchQuery } from '@/services/unsplashAPI'

const query = generateSearchQuery(slot, destination.value)
if (query) {
  const result = await searchVideo({
    query: query,
    provider: 'pexels',
    limit: 1
  })
  const video = result.data[0] || null
  // 需要将 VideoInfo 转换为 InspirationVideo 格式（如果需要）
}
```

---

#### 位置 3: 加载单张活动图片（封面）

**文件**: `src/components/TravelDetail/ExperienceDay.vue`  
**行数**: 1360-1363  
**当前实现**:
```typescript
const imageUrl = await getActivityImage(slot, destination.value, {
  orientation: 'landscape',
  size: 'regular'
})
```

**当前使用的函数**: `getActivityImage` from `@/services/unsplashAPI.ts`  
**应该改为**: 使用 `searchImage` from `@/services/mediaAPI.ts`

**迁移方案**:
```typescript
import { searchImage } from '@/services/mediaAPI'
import { generateSearchQuery } from '@/services/unsplashAPI'

const query = generateSearchQuery(slot, destination.value)
const result = await searchImage({
  query: query,
  provider: 'all',
  limit: 1,
  orientation: 'landscape'
})

const imageUrl = result.data[0]?.url || null
```

---

### 2. 灵感模式视频加载 - `travel.ts` (store)

#### 位置: 为灵感模式丰富视频内容

**文件**: `src/stores/travel.ts`  
**行数**: 338  
**当前实现**:
```typescript
const results = await searchPexelsVideos(query, { perPage: 1, orientation: 'landscape' })
video = results?.[0] ?? null
```

**当前使用的函数**: `searchPexelsVideos` from `@/services/pexelsAPI.ts`  
**应该改为**: 使用 `searchVideo` from `@/services/mediaAPI.ts`

**迁移方案**:
```typescript
import { searchVideo } from '@/services/mediaAPI'

const result = await searchVideo({
  query: query,
  provider: 'pexels',
  limit: 1
})

// 需要将 VideoInfo 转换为 InspirationVideo 格式
const video = result.data[0] ? convertVideoInfoToInspiration(result.data[0]) : null
```

**注意**: 需要创建一个转换函数，将 `VideoInfo` 转换为 `InspirationVideo` 格式。

---

## 数据格式转换

### VideoInfo → InspirationVideo

需要创建一个转换函数：

```typescript
import { VideoInfo } from '@/services/mediaAPI'
import { InspirationVideo } from '@/services/pexelsAPI'

function convertVideoInfoToInspiration(videoInfo: VideoInfo): InspirationVideo {
  return {
    id: videoInfo.id,
    downloadUrl: videoInfo.url,
    thumbnailUrl: videoInfo.thumbnailUrl || '',
    width: videoInfo.width,
    height: videoInfo.height,
    duration: videoInfo.duration,
    description: videoInfo.description || '',
    photographer: videoInfo.photographer || '',
    photographerUrl: videoInfo.sourceUrl || ''
  }
}
```

### ImageInfo → 图片 URL

新接口返回的 `ImageInfo` 已经包含 `url` 字段，直接使用即可：

```typescript
const imageUrl = imageInfo.url // 直接使用
const thumbnailUrl = imageInfo.thumbnailUrl || imageInfo.url // 使用缩略图或原图
```

---

## 迁移优先级

### P0 - 高优先级（核心功能）

1. ✅ **ExperienceDay.vue - 获取活动图片列表** (位置 1)
   - 影响：图片预览模态框
   - 用户影响：高

2. ✅ **ExperienceDay.vue - 加载单张活动图片** (位置 3)
   - 影响：活动卡片封面图片
   - 用户影响：高

### P1 - 中优先级（增强功能）

3. ⚠️ **ExperienceDay.vue - 搜索视频** (位置 2)
   - 影响：活动预览中的视频
   - 用户影响：中

4. ⚠️ **travel.ts - 灵感模式视频** (位置 4)
   - 影响：灵感模式的视频内容
   - 用户影响：中

---

## 迁移步骤

### 步骤 1: 更新导入语句

```typescript
// 旧代码
import { getActivityImagesList, getActivityImage } from '@/services/unsplashAPI'
import { searchPexelsVideos } from '@/services/pexelsAPI'

// 新代码
import { searchImage, searchVideo } from '@/services/mediaAPI'
import { generateSearchQuery } from '@/services/unsplashAPI' // 保留用于生成搜索关键词
```

### 步骤 2: 创建辅助函数（可选）

在 `src/utils/mediaHelpers.ts` 或新文件中创建转换函数：

```typescript
import { VideoInfo, ImageInfo } from '@/services/mediaAPI'
import { InspirationVideo } from '@/services/pexelsAPI'

export function convertVideoInfoToInspiration(videoInfo: VideoInfo): InspirationVideo {
  // 转换逻辑
}

export function convertImageInfoToUrl(imageInfo: ImageInfo, size: 'small' | 'regular' | 'full' = 'regular'): string {
  // 根据 size 返回合适的 URL
  if (size === 'small' && imageInfo.thumbnailUrl) {
    return imageInfo.thumbnailUrl
  }
  return imageInfo.url
}
```

### 步骤 3: 逐步替换调用

按照优先级顺序，逐个替换函数调用。

### 步骤 4: 测试

- 测试图片加载是否正常
- 测试视频加载是否正常
- 测试错误处理（API 不可用时的降级方案）

---

## 向后兼容

为了平滑迁移，建议：

1. **保留旧函数**：暂时保留 `unsplashAPI.ts` 和 `pexelsAPI.ts` 中的函数
2. **添加降级方案**：如果新接口失败，回退到旧接口
3. **逐步迁移**：先迁移一个位置，测试通过后再迁移其他位置

### 降级方案示例

```typescript
async function getActivityImageWithFallback(slot: any, destination?: string) {
  try {
    // 尝试使用新接口
    const query = generateSearchQuery(slot, destination)
    const result = await searchImage({
      query: query,
      provider: 'all',
      limit: 1,
      orientation: 'landscape'
    })
    return result.data[0]?.url || null
  } catch (error) {
    console.warn('新媒体接口失败，使用旧接口:', error)
    // 降级到旧接口
    return await getActivityImage(slot, destination, {
      orientation: 'landscape',
      size: 'regular'
    })
  }
}
```

---

## 注意事项

1. **搜索关键词生成**：`generateSearchQuery` 函数可以保留，因为它只是生成搜索关键词，不涉及 API 调用
2. **数据格式差异**：新接口返回的数据格式可能与旧接口不同，需要适配
3. **错误处理**：新接口可能抛出错误，需要适当的错误处理
4. **缓存策略**：如果使用了缓存，需要确保缓存键与新接口兼容

---

## 测试清单

- [ ] 图片搜索功能正常
- [ ] 视频搜索功能正常
- [ ] 图片预览模态框正常
- [ ] 活动卡片封面图片正常显示
- [ ] 灵感模式视频正常加载
- [ ] 错误处理正常（API 不可用时的降级）
- [ ] 性能无明显下降

---

**文档版本**: 1.0  
**最后更新**: 2025-01-26

