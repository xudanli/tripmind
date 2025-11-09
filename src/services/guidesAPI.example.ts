// @ts-nocheck
/**
 * 旅行攻略 API 服务 - API集成示例
 * 
 * 这个文件展示了如何集成不同的API服务来获取旅行攻略
 */

/**
 * 示例1: 集成自己的后端API
 */
export async function fetchFromCustomAPI(destination: string, limit: number) {
  const response = await fetch(`https://your-api.com/travel-guides`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.API_KEY}`
    },
    body: JSON.stringify({
      destination,
      limit,
      language: 'zh-CN'
    })
  })
  
  const data = await response.json()
  return data.guides.map((guide: any) => ({
    id: guide.id,
    title: guide.title,
    excerpt: guide.summary || guide.excerpt,
    url: guide.link || guide.url,
    source: guide.source || '旅行指南',
    publishedAt: guide.published_at || guide.date,
    tags: guide.tags || [],
    imageUrl: guide.image_url,
    author: guide.author,
    readTime: guide.read_time
  }))
}

/**
 * 示例2: 集成Medium API (需要API Key)
 */
export async function fetchFromMedium(destination: string, limit: number) {
  // 注意：Medium API需要认证
  const response = await fetch(`https://api.medium.com/v1/search/posts?q=travel+${destination}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${process.env.MEDIUM_API_KEY}`,
      'Accept': 'application/json'
    }
  })
  
  const data = await response.json()
  return data.data.map((post: any) => ({
    id: post.id,
    title: post.title,
    excerpt: post.subtitle || post.content.substring(0, 200),
    url: post.url,
    source: 'Medium',
    publishedAt: new Date(post.publishedAt).toISOString(),
    tags: post.tags || [],
    author: post.author?.name
  }))
}

/**
 * 示例3: 集成RSS Feed
 */
export async function fetchFromRSS(destination: string, limit: number) {
  // 使用RSS解析库（需要安装：npm install rss-parser）
  // const Parser = require('rss-parser')
  // const parser = new Parser()
  // 
  // const feed = await parser.parseURL(`https://www.travelblog.com/rss?tag=${destination}`)
  // 
  // return feed.items.slice(0, limit).map((item: any) => ({
  //   id: item.guid || item.link,
  //   title: item.title,
  //   excerpt: item.contentSnippet || item.content?.substring(0, 200),
  //   url: item.link,
  //   source: feed.title || 'Travel Blog',
  //   publishedAt: item.pubDate,
  //   tags: item.categories || []
  // }))
}

/**
 * 示例4: 使用Google Custom Search API
 */
export async function fetchFromGoogleSearch(destination: string, limit: number) {
  const apiKey = process.env.GOOGLE_API_KEY
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID
  
  const response = await fetch(
    `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=travel+guide+${destination}&num=${limit}`
  )
  
  const data = await response.json()
  return data.items?.map((item: any) => ({
    id: item.link,
    title: item.title,
    excerpt: item.snippet,
    url: item.link,
    source: item.displayLink || 'Web',
    publishedAt: item.pagemap?.metatags?.[0]?.['article:published_time'] || new Date().toISOString(),
    tags: []
  })) || []
}

/**
 * 示例5: 使用内容聚合服务（如Contentful, Strapi等）
 */
export async function fetchFromCMS(destination: string, limit: number) {
  // Contentful示例
  // const response = await fetch(
  //   `https://cdn.contentful.com/spaces/${SPACE_ID}/environments/master/entries?content_type=travelGuide&query=${destination}&limit=${limit}`,
  //   {
  //     headers: {
  //       'Authorization': `Bearer ${CONTENTFUL_ACCESS_TOKEN}`
  //     }
  //   }
  // )
  // 
  // const data = await response.json()
  // return data.items.map((item: any) => ({
  //   id: item.sys.id,
  //   title: item.fields.title,
  //   excerpt: item.fields.excerpt,
  //   url: item.fields.url,
  //   source: item.fields.source || 'Travel Guide',
  //   publishedAt: item.sys.createdAt,
  //   tags: item.fields.tags || []
  // }))
}

