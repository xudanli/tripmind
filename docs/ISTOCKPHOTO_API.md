# iStockPhoto API 集成指南

## 概述

iStockPhoto 是 Getty Images 的一部分，提供高质量的图片资源。本指南说明如何配置和使用 iStockPhoto API。

## 前置要求

1. **Getty Images 开发者账户**
   - 访问 https://developers.gettyimages.com/
   - 注册开发者账户
   - 获取 API Key 和 API Secret

2. **付费订阅**
   - iStockPhoto API 需要付费订阅
   - 根据使用量计费

## 配置

### 1. 环境变量配置

在 `.env` 文件中添加：

```bash
# iStockPhoto (Getty Images) API 配置
VITE_ISTOCKPHOTO_API_KEY=your_api_key_here
VITE_ISTOCKPHOTO_API_SECRET=your_api_secret_here
```

### 2. 后端代理实现

由于 CORS 限制，必须通过后端代理调用 iStockPhoto API。后端需要实现以下端点：

**端点：** `GET /api/proxy/istockphoto/search`

**查询参数：**
- `query` (string, required): 搜索关键词
- `page_size` (number, optional): 每页结果数量（默认 10）
- `orientation` (string, optional): 图片方向 - `horizontal`, `vertical`, `square`

**请求示例：**
```
GET /api/proxy/istockphoto/search?query=travel&page_size=10&orientation=horizontal
```

**响应格式：**
```json
{
  "images": [
    {
      "id": "123456789",
      "title": "Travel Image",
      "caption": "Beautiful travel destination",
      "width": 1920,
      "height": 1080,
      "display_sizes": [
        {
          "name": "comp",
          "uri": "https://media.gettyimages.com/..."
        },
        {
          "name": "preview",
          "uri": "https://media.gettyimages.com/..."
        },
        {
          "name": "thumb",
          "uri": "https://media.gettyimages.com/..."
        }
      ]
    }
  ]
}
```

### 3. 后端代理实现示例（Node.js/Express）

```javascript
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Getty Images API 配置
const GETTY_API_KEY = process.env.ISTOCKPHOTO_API_KEY;
const GETTY_API_SECRET = process.env.ISTOCKPHOTO_API_SECRET;
const GETTY_API_URL = 'https://api.gettyimages.com/v3';

// 获取 OAuth Token（需要缓存，避免频繁请求）
let cachedToken = null;
let tokenExpiry = null;

async function getOAuthToken() {
  // 如果 token 未过期，直接返回缓存的 token
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const response = await axios.post(
      `${GETTY_API_URL}/oauth2/token`,
      {
        grant_type: 'client_credentials'
      },
      {
        auth: {
          username: GETTY_API_KEY,
          password: GETTY_API_SECRET
        }
      }
    );

    cachedToken = response.data.access_token;
    // Token 有效期通常是 3600 秒，提前 5 分钟刷新
    tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

    return cachedToken;
  } catch (error) {
    console.error('获取 Getty Images OAuth Token 失败:', error);
    throw error;
  }
}

// 搜索图片
router.get('/search', async (req, res) => {
  try {
    const { query, page_size = 10, orientation = 'horizontal' } = req.query;

    if (!query) {
      return res.status(400).json({ error: '查询参数 query 是必需的' });
    }

    // 获取 OAuth Token
    const token = await getOAuthToken();

    // 调用 Getty Images API
    const response = await axios.get(`${GETTY_API_URL}/search/images`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Api-Key': GETTY_API_KEY
      },
      params: {
        phrase: query,
        page_size: parseInt(page_size),
        orientation: orientation,
        fields: 'id,title,caption,display_sizes,width,height'
      }
    });

    // 返回格式化的结果
    res.json({
      images: response.data.images || []
    });
  } catch (error) {
    console.error('iStockPhoto API 搜索失败:', error);
    
    if (error.response) {
      res.status(error.response.status).json({
        error: error.response.data.message || 'iStockPhoto API 请求失败'
      });
    } else {
      res.status(500).json({
        error: '服务器内部错误'
      });
    }
  }
});

module.exports = router;
```

## 使用方式

### 前端调用

前端代码已经自动集成了 iStockPhoto API。当 Unsplash 失败时，会自动尝试使用 iStockPhoto：

```typescript
import { searchIStockPhoto, searchIStockPhotoSingle } from '@/services/istockphotoAPI'

// 搜索多张图片
const photos = await searchIStockPhoto('travel', {
  orientation: 'landscape',
  per_page: 10
})

// 搜索单张图片
const photo = await searchIStockPhotoSingle('mountain', {
  orientation: 'landscape'
})
```

### 自动回退机制

系统实现了多层回退机制：

1. **Unsplash API**（主要）
2. **iStockPhoto API**（如果配置了 API key）
3. **Picsum Photos**（备用，无需 API key）

## 注意事项

1. **API 限制**
   - Getty Images API 有速率限制
   - 建议实现请求缓存和限流

2. **成本控制**
   - iStockPhoto 按使用量计费
   - 建议实现使用量监控和限制

3. **图片许可**
   - 确保遵守 Getty Images 的许可协议
   - 仅用于授权用途

4. **错误处理**
   - 如果 iStockPhoto API 失败，会自动回退到备用方案
   - 不会影响应用的正常运行

## 测试

### 测试 API 配置

```bash
# 检查环境变量
echo $VITE_ISTOCKPHOTO_API_KEY
echo $VITE_ISTOCKPHOTO_API_SECRET
```

### 测试后端代理

```bash
curl "http://localhost:8181/api/proxy/istockphoto/search?query=travel&page_size=5"
```

## 故障排除

### 问题：API 认证失败

**原因：** API key 或 secret 配置错误

**解决：**
1. 检查环境变量是否正确设置
2. 验证 API key 和 secret 是否有效
3. 确认后端代理正确传递了认证信息

### 问题：CORS 错误

**原因：** 直接在前端调用 Getty Images API

**解决：** 必须通过后端代理调用，不能直接在前端调用

### 问题：没有返回结果

**原因：** 可能是搜索词不匹配或 API 限制

**解决：**
1. 尝试不同的搜索关键词
2. 检查 API 使用量是否超限
3. 查看后端日志了解详细错误信息

## 参考资源

- [Getty Images API 文档](https://developers.gettyimages.com/api/)
- [iStockPhoto 官网](https://www.istockphoto.com/)
- [API 认证指南](https://developers.gettyimages.com/api/docs/v3/oauth2.html)

