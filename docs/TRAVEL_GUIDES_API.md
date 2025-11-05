# 旅行攻略 API 集成指南

## 概述

旅行攻略功能已接入真实API支持，可以对接多种数据源获取全球精选旅行文章。

## API 配置

### 1. 后端API配置

在 `src/config/api.ts` 中配置你的API端点：

```typescript
export const API_CONFIG = {
  BASE_URL: 'https://your-api.com', // 你的后端API地址
  ENDPOINTS: {
    TRAVEL_GUIDES_SEARCH: '/travel-guides/search' // 搜索端点
  }
}
```

### 2. API 接口规范

#### 请求格式

```
GET /travel-guides/search?destination={目的地}&limit={数量}&language={语言}
```

**参数：**
- `destination` (string): 目的地名称，如 "日本"、"Tokyo"
- `limit` (number): 返回数量限制，默认50
- `language` (string): 语言代码，如 "zh-CN"、"en-US"

**Headers：**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {YOUR_API_KEY}" // 可选
}
```

#### 响应格式

```json
{
  "success": true,
  "data": [
    {
      "id": "guide_001",
      "title": "文章标题",
      "excerpt": "文章摘要...",
      "url": "https://example.com/article",
      "source": "来源名称",
      "publishedAt": "2024-01-15T00:00:00Z",
      "tags": ["标签1", "标签2"],
      "imageUrl": "https://example.com/image.jpg", // 可选
      "author": "作者名称", // 可选
      "readTime": 5 // 可选，阅读时长（分钟）
    }
  ],
  "message": "成功",
  "error": null
}
```

### 3. 错误处理

API会自动处理以下情况：
- **网络错误**：自动降级到本地数据
- **超时**：30秒超时，自动使用fallback
- **API错误**：捕获错误并使用本地数据

## 使用示例

### 基本使用

```typescript
import { getTravelGuides } from '@/services/guidesAPI'

// 获取日本相关攻略
const guides = await getTravelGuides('日本', 50)

// 不使用fallback（仅API数据）
const guides = await getTravelGuides('日本', 50, false)
```

### 自定义API集成

如果需要集成其他API（如Medium、RSS等），可以参考 `src/services/guidesAPI.example.ts` 中的示例代码。

## 环境变量配置

如果需要在不同环境使用不同的API地址，可以设置环境变量：

```bash
# .env.development
VITE_API_BASE_URL=https://dev-api.example.com

# .env.production
VITE_API_BASE_URL=https://api.example.com
```

## Fallback机制

系统提供了完善的fallback机制：

1. **优先使用真实API**：首先尝试从配置的API获取数据
2. **多源聚合**：如果主API数据不足，可以从RSS等其他源补充
3. **本地数据fallback**：如果API失败或返回空，自动使用本地示例数据

## 扩展数据源

### 添加RSS源

编辑 `src/services/guidesAPI.ts` 中的 `fetchGuidesFromRSS` 函数：

```typescript
async function fetchGuidesFromRSS(destination: string, limit: number) {
  // 使用RSS解析库
  const parser = new RSSParser()
  const feed = await parser.parseURL(`https://blog.example.com/rss?tag=${destination}`)
  
  return feed.items.map(item => ({
    id: item.guid,
    title: item.title,
    excerpt: item.contentSnippet,
    url: item.link,
    source: 'Travel Blog',
    publishedAt: item.pubDate,
    tags: item.categories || []
  }))
}
```

### 添加第三方API

参考 `guidesAPI.example.ts` 中的示例，添加新的数据源函数，然后在 `fetchGuidesFromMultipleSources` 中调用。

## 测试

### 测试API连接

```typescript
// 在浏览器控制台测试
import { getTravelGuides } from '@/services/guidesAPI'

getTravelGuides('日本', 10).then(guides => {
  console.log('获取到的攻略:', guides)
})
```

### 测试Fallback

断开网络或使用错误的API地址，系统应该自动使用本地数据。

## 注意事项

1. **CORS问题**：如果API存在CORS限制，需要通过后端代理
2. **API密钥**：敏感信息应存储在环境变量中，不要提交到代码库
3. **速率限制**：注意API的调用频率限制，考虑添加缓存
4. **数据格式**：确保API返回的数据格式符合 `TravelGuide` 接口定义

## 故障排查

### API返回空数据

1. 检查API地址是否正确
2. 检查网络连接
3. 查看浏览器控制台的错误信息
4. 确认API返回的数据格式是否正确

### Fallback不工作

1. 确认 `useFallback` 参数为 `true`
2. 检查本地数据是否正确加载
3. 查看控制台日志

## 下一步

- [ ] 添加缓存机制（避免重复请求）
- [ ] 添加请求重试机制
- [ ] 支持更多数据源（Medium、Dev.to等）
- [ ] 添加用户偏好设置（语言、来源筛选等）

