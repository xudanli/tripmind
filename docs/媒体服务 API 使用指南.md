# 媒体服务 API 使用指南

## 概述

媒体服务 API 提供了统一的接口来搜索图片、视频，以及保存媒体URL到数据库。所有接口都通过后端代理，无需在前端配置 API Key。

**服务文件**: `src/services/mediaAPI.ts`

---

## 接口列表

### 1. 搜索图片

```typescript
import { searchImage, type SearchImageRequest, type ImageInfo } from '@/services/mediaAPI'

// 搜索图片
const result = await searchImage({
  query: '巴黎埃菲尔铁塔',
  provider: 'all', // 'unsplash' | 'pexels' | 'all'
  limit: 10,
  orientation: 'landscape' // 'landscape' | 'portrait' | 'squarish'
})

console.log('找到图片:', result.data.length)
console.log('总数量:', result.total)

// 使用图片
result.data.forEach((image: ImageInfo) => {
  console.log('图片URL:', image.url)
  console.log('缩略图:', image.thumbnailUrl)
  console.log('摄影师:', image.photographer)
  console.log('来源:', image.provider)
})
```

### 2. 搜索视频

```typescript
import { searchVideo, type SearchVideoRequest, type VideoInfo } from '@/services/mediaAPI'

// 搜索视频
const result = await searchVideo({
  query: '巴黎旅行',
  provider: 'pexels', // 目前仅支持 'pexels'
  limit: 10
})

console.log('找到视频:', result.data.length)

// 使用视频
result.data.forEach((video: VideoInfo) => {
  console.log('视频URL:', video.url)
  console.log('缩略图:', video.thumbnailUrl)
  console.log('时长:', video.duration, '秒')
  console.log('摄影师:', video.photographer)
})
```

### 3. 上传媒体（保存URL）

```typescript
import { uploadMedia, type UploadMediaRequest } from '@/services/mediaAPI'

// 保存用户选择的图片URL到数据库
const media = await uploadMedia({
  url: 'https://images.unsplash.com/photo-1234567890',
  mediaType: 'image', // 'image' | 'video'
  metadata: {
    title: '巴黎埃菲尔铁塔',
    destination: '巴黎',
    selectedBy: 'user123'
  }
})

console.log('媒体ID:', media.id)
console.log('创建时间:', media.createdAt)
```

### 4. 获取媒体详情

```typescript
import { getMediaDetail } from '@/services/mediaAPI'

// 根据媒体ID获取详细信息
const media = await getMediaDetail('550e8400-e29b-41d4-a716-446655440000')

console.log('媒体URL:', media.url)
console.log('元数据:', media.metadata)
```

---

## 完整示例

### 场景：为活动搜索并保存图片

```typescript
import { searchImage, uploadMedia } from '@/services/mediaAPI'

async function selectImageForActivity(activityName: string, destination: string) {
  try {
    // 1. 搜索图片
    const searchQuery = `${destination} ${activityName}`
    const searchResult = await searchImage({
      query: searchQuery,
      provider: 'all',
      limit: 20,
      orientation: 'landscape'
    })
    
    if (searchResult.data.length === 0) {
      console.warn('未找到相关图片')
      return null
    }
    
    // 2. 用户选择第一张图片（实际应用中应该让用户选择）
    const selectedImage = searchResult.data[0]
    
    // 3. 保存到数据库
    const savedMedia = await uploadMedia({
      url: selectedImage.url,
      mediaType: 'image',
      metadata: {
        title: activityName,
        destination: destination,
        provider: selectedImage.provider,
        photographer: selectedImage.photographer,
        sourceUrl: selectedImage.sourceUrl
      }
    })
    
    console.log('图片已保存，媒体ID:', savedMedia.id)
    return savedMedia
    
  } catch (error: any) {
    console.error('选择图片失败:', error.message)
    return null
  }
}

// 使用
const media = await selectImageForActivity('埃菲尔铁塔', '巴黎')
```

### 场景：搜索视频用于目的地

```typescript
import { searchVideo } from '@/services/mediaAPI'

async function getDestinationVideos(destination: string) {
  try {
    const result = await searchVideo({
      query: `${destination} travel`,
      provider: 'pexels',
      limit: 5
    })
    
    return result.data.map(video => ({
      id: video.id,
      url: video.url,
      thumbnail: video.thumbnailUrl,
      duration: video.duration,
      description: video.description
    }))
  } catch (error: any) {
    console.error('搜索视频失败:', error.message)
    return []
  }
}

// 使用
const videos = await getDestinationVideos('冰岛')
```

---

## 错误处理

所有接口都会抛出错误，建议使用 try-catch 处理：

```typescript
import { searchImage } from '@/services/mediaAPI'

try {
  const result = await searchImage({
    query: '巴黎',
    limit: 10
  })
  // 处理成功结果
} catch (error: any) {
  if (error.message.includes('404')) {
    console.error('接口不存在')
  } else if (error.message.includes('502')) {
    console.error('第三方服务不可用')
  } else {
    console.error('搜索失败:', error.message)
  }
  // 使用备用方案或显示错误提示
}
```

---

## 与旧 API 的对比

### 旧方式（直接调用第三方API）

```typescript
// ❌ 旧方式：需要在前端配置 API Key
import { searchUnsplashPhotos } from '@/services/unsplashAPI'
import { searchPexelsPhotos } from '@/services/pexelsAPI'

const unsplashPhotos = await searchUnsplashPhotos('巴黎', { per_page: 10 })
const pexelsPhotos = await searchPexelsPhotos('巴黎', { per_page: 10 })
```

### 新方式（通过后端统一接口）

```typescript
// ✅ 新方式：无需配置 API Key，统一接口
import { searchImage } from '@/services/mediaAPI'

const result = await searchImage({
  query: '巴黎',
  provider: 'all', // 自动搜索所有提供商
  limit: 10
})
```

---

## 注意事项

1. **API Key 配置**：所有 API Key 都在后端配置，前端无需关心
2. **错误处理**：如果第三方服务不可用，接口会返回空结果或抛出错误
3. **性能优化**：建议对搜索结果进行缓存，避免重复请求
4. **数据格式**：返回的数据格式已统一，无需处理不同提供商的差异

---

## 迁移建议

如果现有代码使用了 `unsplashAPI.ts` 或 `pexelsAPI.ts`，可以逐步迁移到新的 `mediaAPI.ts`：

1. **保持向后兼容**：旧的 API 文件可以保留，新功能使用新接口
2. **逐步迁移**：在修改相关功能时，顺便迁移到新接口
3. **统一格式**：新接口返回的数据格式更统一，便于处理

---

**文档版本**: 1.0  
**最后更新**: 2025-01-26

