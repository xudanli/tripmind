# 后端API实现指南 - 多平台攻略聚合

## 概述

为了聚合马蜂窝、携程、穷游网、飞猪、TripAdvisor、Lonely Planet、Rough Guides、Wikitravel 等平台的攻略，需要后端API支持。

## API端点

### 1. 平台搜索接口

**端点：** `POST /travel-guides/platform-search`

**请求体：**
```json
{
  "destination": "日本",
  "platforms": [
    {
      "name": "马蜂窝",
      "domain": "mafengwo.cn",
      "searchUrl": "https://www.mafengwo.cn/search/q.php?q="
    },
    {
      "name": "携程",
      "domain": "ctrip.com",
      "searchUrl": "https://you.ctrip.com/travels/search?query="
    }
    // ... 其他平台
  ],
  "limit": 50
}
```

**响应：**
```json
{
  "success": true,
  "data": [
    {
      "id": "mafengwo_12345",
      "title": "日本关西7日深度游攻略",
      "excerpt": "从京都到奈良，完整攻略...",
      "url": "https://www.mafengwo.cn/i/12345.html",
      "source": "马蜂窝",
      "publishedAt": "2024-01-15T00:00:00Z",
      "tags": ["日本", "关西", "京都"],
      "imageUrl": "https://...",
      "author": "作者名称",
      "readTime": 5
    }
  ]
}
```

## 后端实现方案

### 方案1：使用Google Custom Search API（推荐）

**优点：**
- 无需爬虫
- 合法合规
- 结果质量高

**实现：**
```python
# Python示例
import requests
import json

def search_platform_guides(destination, platform, api_key, search_engine_id):
    query = f"site:{platform['domain']} {destination} 攻略"
    
    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        'key': api_key,
        'cx': search_engine_id,
        'q': query,
        'num': 10,
        'hl': 'zh-CN'
    }
    
    response = requests.get(url, params=params)
    data = response.json()
    
    guides = []
    for item in data.get('items', []):
        guides.append({
            'id': f"{platform['name']}_{item['link']}",
            'title': item['title'],
            'excerpt': item['snippet'],
            'url': item['link'],
            'source': platform['name'],
            'publishedAt': extract_date(item),
            'tags': [destination, platform['name']]
        })
    
    return guides
```

### 方案2：网页爬虫（需要后端代理）

**注意事项：**
- 遵守robots.txt
- 设置合理的请求间隔
- 处理反爬虫机制
- 遵守网站使用条款

**实现框架：**
```python
# Python + Scrapy示例
import scrapy
from scrapy.crawler import CrawlerProcess

class TravelGuideSpider(scrapy.Spider):
    name = 'travel_guides'
    
    def start_requests(self):
        destination = self.destination
        platform = self.platform
        
        url = f"{platform['searchUrl']}{destination}"
        yield scrapy.Request(url=url, callback=self.parse)
    
    def parse(self, response):
        # 解析页面，提取攻略列表
        guides = []
        for item in response.css('div.guide-item'):
            guides.append({
                'title': item.css('h2::text').get(),
                'url': item.css('a::attr(href)').get(),
                'excerpt': item.css('p.excerpt::text').get(),
                # ...
            })
        return guides
```

### 方案3：RSS Feed聚合

**适用平台：**
- 部分平台提供RSS feed
- 可以订阅更新

**实现：**
```python
import feedparser

def fetch_rss_guides(rss_url, platform_name):
    feed = feedparser.parse(rss_url)
    guides = []
    
    for entry in feed.entries:
        guides.append({
            'title': entry.title,
            'url': entry.link,
            'excerpt': entry.summary,
            'source': platform_name,
            'publishedAt': entry.published,
            'tags': [tag.term for tag in entry.tags]
        })
    
    return guides
```

## 平台特定实现

### 马蜂窝 (mafengwo.cn)
- 搜索URL: `https://www.mafengwo.cn/search/q.php?q={关键词}`
- 建议使用Google Custom Search或官方API（如果有）

### 携程 (ctrip.com)
- 搜索URL: `https://you.ctrip.com/travels/search?query={关键词}`
- 有官方开放平台，可申请API

### 穷游网 (qyer.com)
- 搜索URL: `https://www.qyer.com/search?query={关键词}`
- 部分内容有RSS feed

### TripAdvisor
- 有官方API: https://developer.tripadvisor.com/
- 需要申请API Key
- 支持搜索和评论数据

### Lonely Planet
- 搜索URL: `https://www.lonelyplanet.com/search?q={关键词}`
- 部分内容可通过RSS获取

## 数据处理

### 去重
```python
def deduplicate_guides(guides):
    seen_urls = set()
    unique_guides = []
    
    for guide in guides:
        if guide['url'] not in seen_urls:
            seen_urls.add(guide['url'])
            unique_guides.append(guide)
    
    return unique_guides
```

### 排序
```python
def sort_guides_by_relevance(guides, destination):
    def score(guide):
        score = 0
        if destination in guide['title']:
            score += 10
        if '攻略' in guide['title'] or '指南' in guide['title']:
            score += 5
        # 更多评分规则...
        return score
    
    return sorted(guides, key=score, reverse=True)
```

## 缓存策略

```python
# 使用Redis缓存搜索结果
import redis
import json
import hashlib

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def get_cached_guides(destination, platform):
    cache_key = f"guides:{destination}:{platform['name']}"
    cached = redis_client.get(cache_key)
    
    if cached:
        return json.loads(cached)
    
    guides = fetch_guides(destination, platform)
    # 缓存24小时
    redis_client.setex(cache_key, 86400, json.dumps(guides))
    
    return guides
```

## 错误处理

```python
def safe_search_platform(destination, platform):
    try:
        return search_platform(destination, platform)
    except Exception as e:
        logger.error(f"搜索{platform['name']}失败: {e}")
        return []
```

## 环境变量配置

```bash
# .env
GOOGLE_API_KEY=your_google_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
TRIPADVISOR_API_KEY=your_tripadvisor_key
REDIS_URL=redis://localhost:6379
```

## 部署建议

1. **使用代理池**：避免IP被封
2. **设置请求间隔**：尊重网站服务器
3. **监控和日志**：记录请求状态
4. **错误重试**：实现指数退避重试
5. **限流控制**：避免过载

## 法律合规

⚠️ **重要提示：**
- 遵守各网站的robots.txt
- 遵守网站使用条款
- 不要过度请求
- 考虑使用官方API
- 如有疑问，咨询法律顾问

## 快速开始

### Node.js示例

```javascript
const express = require('express');
const axios = require('axios');
const app = express();

app.post('/travel-guides/platform-search', async (req, res) => {
  const { destination, platforms, limit } = req.body;
  const guides = [];
  
  for (const platform of platforms) {
    try {
      // 使用Google Custom Search
      const results = await searchViaGoogle(destination, platform);
      guides.push(...results);
    } catch (error) {
      console.error(`搜索${platform.name}失败:`, error);
    }
  }
  
  res.json({
    success: true,
    data: guides.slice(0, limit)
  });
});

async function searchViaGoogle(destination, platform) {
  const query = `site:${platform.domain} ${destination} 攻略`;
  // 实现Google Custom Search API调用
  // ...
}
```

### Python Flask示例

```python
from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

@app.route('/travel-guides/platform-search', methods=['POST'])
def platform_search():
    data = request.json
    destination = data['destination']
    platforms = data['platforms']
    limit = data.get('limit', 50)
    
    guides = []
    for platform in platforms:
        try:
            results = search_platform(destination, platform)
            guides.extend(results)
        except Exception as e:
            print(f"搜索{platform['name']}失败: {e}")
    
    return jsonify({
        'success': True,
        'data': guides[:limit]
    })
```

## 测试

```bash
# 测试API
curl -X POST http://localhost:3000/travel-guides/platform-search \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "日本",
    "platforms": [
      {"name": "马蜂窝", "domain": "mafengwo.cn", "searchUrl": "https://www.mafengwo.cn/search/q.php?q="}
    ],
    "limit": 10
  }'
```

