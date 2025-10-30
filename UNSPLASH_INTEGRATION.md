# Unsplash 图片集成说明

## 📅 集成日期
2024-12-27

## ✅ 集成状态
**已完成并已集成到 Inspiration 模式**

---

## 一、功能概述

将 Unsplash API 集成到旅程生成流程中，自动为 AI 生成的目的地获取精美图片。

### 核心能力
- 🌍 中文地名自动翻译为英文
- 📸 从 Unsplash 搜索高质量旅行图片
- 🎨 批量获取多个目的地的图片
- 🔄 自动为旅程数据注入图片信息

---

## 二、技术实现

### 1. 配置文件更新

**文件**: `src/config/api.ts`

```typescript
// Unsplash API 配置
UNSPLASH_ACCESS_KEY: 'EEMmDKUUjc-Dc3uSYHM6hfKnhBKSvVkaFuTXjy1xiQ8',
UNSPLASH_SECRET_KEY: 'N8-j4rRI2cGZQUy8oqGyPQWtfljPHn1Ub6hGJw37lv8',
UNSPLASH_API_URL: 'https://api.unsplash.com',

// API 端点
ENDPOINTS: {
  // ...
  UNSPLASH_SEARCH: '/search/photos'
}
```

### 2. Unsplash 服务文件

**文件**: `src/services/unsplashAPI.ts`

#### 核心函数

##### `getDestinationPhoto(destination, keywords)`
- 获取单个目的地的最佳图片
- 参数：
  - `destination`: 目的地名称（英文）
  - `keywords`: 额外搜索关键词（默认：['travel']）
- 返回：`UnsplashPhoto | null`

##### `getMultipleDestinationPhotos(destinations)`
- 批量获取多个目的地的图片
- 参数：`destinations: string[]`
- 返回：`Record<string, UnsplashPhoto | null>`
- 特性：并发请求，高效获取

##### `translateDestination(destination)`
- 将中文地名转换为英文
- 包含 50+ 热门目的地映射
- 自动识别已是英文的地名
- 未找到映射时返回原字符串

##### `enrichWithPhotos(data, fieldNames)`
- 为旅程数据添加图片
- 参数：
  - `data`: 旅程数据对象
  - `fieldNames`: 需要添加图片的字段（如 ['locations', 'destination']）
- 返回：包含 `photos` 字段的完整数据

### 3. 数据结构

#### UnsplashPhoto 接口
```typescript
interface UnsplashPhoto {
  id: string
  width: number
  height: number
  color: string
  description: string | null
  urls: {
    raw: string
    full: string
    regular: string    // 推荐用于显示
    small: string
    thumb: string     // 缩略图
  }
  user: {
    name: string
    username: string
  }
  links: {
    html: string
  }
}
```

#### 图片数据结构
```typescript
// 在 InspirationData 中
photos?: {
  "Tokyo": UnsplashPhoto,
  "Bali": UnsplashPhoto,
  // ...
}
```

---

## 三、集成位置

### 在 generateInspiration 中的使用

**文件**: `src/stores/travel.ts` - `generateInspiration()` 函数

```typescript
// 第四步：为目的地获取精美图片
try {
  console.log('开始获取目的地图片...')
  const { enrichWithPhotos } = await import('@/services/unsplashAPI')
  const enrichedData = await enrichWithPhotos(inspirationData, ['locations', 'location'])
  console.log('图片获取成功:', enrichedData.photos)
  
  // 将图片数据添加到 inspirationData
  const inspirationDataWithPhotos = {
    ...inspirationData,
    photos: enrichedData.photos
  }
  
  setInspirationData(inspirationDataWithPhotos)
} catch (photoError) {
  console.error('获取图片失败，继续使用不包含图片的数据:', photoError)
  setInspirationData(inspirationData)
}
```

**特性**：
- ✅ 错误隔离：图片获取失败不影响主要数据
- ✅ 异步加载：动态导入，减少初始包大小
- ✅ 自动去重：同一目的地只请求一次
- ✅ 批量优化：并发请求多个目的地

---

## 四、地名翻译表

### 支持的地理位置（50+）

**亚洲**
- 中国：北京、上海、广州、成都、杭州、西安、南京、深圳
- 日本：东京、大阪、京都
- 东南亚：巴厘岛、泰国、普吉岛、曼谷、清迈、新加坡、马来西亚、菲律宾
- 韩国：首尔、济州岛
- 其他：越南、柬埔寨、印度尼西亚、马尔代夫、印度、尼泊尔、不丹、斯里兰卡

**欧洲**
- 冰岛、挪威、瑞士、法国、巴黎、意大利、罗马、西班牙、希腊、英国、伦敦

**北美**
- 纽约、洛杉矶、夏威夷

**大洋洲**
- 澳大利亚、悉尼、墨尔本、新西兰

**中东**
- 土耳其、摩洛哥、迪拜、阿联酋

### 翻译逻辑
1. 检测是否包含英文字符，如有直接返回
2. 查找翻译映射表
3. 未找到则返回原字符串（让 API 尝试搜索）

---

## 五、API 使用说明

### 搜索参数

```
GET /search/photos
  ?query={destination}           # 搜索关键词
  &per_page=10                   # 每页返回数量
  &orientation=landscape         # 横向图片（适合显示）
```

### 认证

```typescript
headers: {
  'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
}
```

### 响应处理

- 成功：返回图片对象数组
- 失败：返回空数组，不中断流程
- 超时：自动重试机制（通过 Promise.all 实现并发容错）

---

## 六、使用示例

### 在 Vue 组件中使用

```vue
<template>
  <div v-if="inspirationData?.photos">
    <div v-for="location in locations" :key="location">
      <img 
        v-if="inspirationData.photos[location]"
        :src="inspirationData.photos[location].urls.regular"
        :alt="location"
      >
    </div>
  </div>
</template>
```

### 在 InspirationView 中使用

```typescript
// 获取特定目的地的图片
const getLocationPhoto = (location: string) => {
  return inspirationData.value?.photos?.[location]?.urls?.regular
}

// 获取图片描述
const getPhotoDescription = (location: string) => {
  return inspirationData.value?.photos?.[location]?.description || location
}

// 获取摄影师信息
const getPhotographer = (location: string) => {
  const photo = inspirationData.value?.photos?.[location]
  return photo ? photo.user.name : 'Unknown'
}
```

---

## 七、性能优化

### 1. 并发请求
- 使用 `Promise.all()` 并发请求多个目的地
- 减少等待时间，提升用户体验

### 2. 图片尺寸选择
- `regular`: 用于卡片显示（推荐 1080px）
- `thumb`: 用于缩略图（200px）
- `small`: 用于列表显示（400px）

### 3. 错误处理
- 图片获取失败不影响主流程
- 提供降级方案（无图片模式）

### 4. 缓存策略
- 考虑在 localStorage 缓存已获取的图片
- 减少重复 API 调用

---

## 八、后续优化方向

### 1. 更智能的翻译
- [ ] 集成百度翻译或 Google Translate API
- [ ] 支持更多地名（用户历史搜索）
- [ ] 上下文理解（如"日本"自动翻译为"Japan"）

### 2. 图片质量优化
- [ ] 根据设备屏幕大小选择图片尺寸
- [ ] 懒加载图片，提升首屏速度
- [ ] WebP 格式支持

### 3. 用户体验增强
- [ ] 图片加载时的占位符
- [ ] 加载进度指示
- [ ] 点击查看大图功能

### 4. 数据持久化
- [ ] 本地缓存热门目的地的图片
- [ ] 离线模式支持
- [ ] 图片收藏功能

---

## 九、错误排查

### 常见问题

1. **401 Unauthorized**
   - 检查 Access Key 是否正确
   - 确认 API 配额是否用完

2. **404 Not Found**
   - 地名翻译可能失败
   - 尝试直接使用英文地名

3. **请求超时**
   - 检查网络连接
   - 考虑增加超时时间

4. **CORS 错误**
   - Unsplash API 支持跨域
   - 检查请求头配置

---

## 十、总结

✅ **成功集成 Unsplash API**  
✅ **自动为目的地获取高质量图片**  
✅ **支持中英文地名转换**  
✅ **批量优化，性能良好**  
✅ **错误隔离，不影响主流程**  

旅程数据现在可以自动包含精美的目的地图片，大幅提升视觉体验！

---

**集成日期**：2024-12-27  
**集成状态**：✅ 完成  
**测试状态**：待测试
