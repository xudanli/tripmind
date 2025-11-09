# 外部数据源与 API 调用说明

该文档持续更新，概述当前前端项目直接调用的第三方服务、用途、关键参数与注意事项。所有请求均在浏览器端发起，请确保在 `.env.local` 中配置对应的 Key，并关注跨域/速率限制。

---

## 1. OpenAI Chat Completions
- **用途**：灵感模式与 Planner 模式调用 LLM（默认 `gpt-4o-mini`）生成行程框架、每日详情、提示语等。
- **端点**：`POST https://api.openai.com/v1/chat/completions`
- **环境变量**：`VITE_OPENAI_API_KEY`（可选 `VITE_OPENAI_PROXY_BASE` 指向中转服务）
- **控制台输出**：若网络/代理异常，会出现 `net::ERR_PROXY_CONNECTION_FAILED` 或 `OpenAI API call failed`。

## 2. DeepSeek API
- **用途**：生成旅程框架、每日活动、心理洞察等（与 OpenAI 互斥，取决于个人偏好设置）。
- **端点**：由 `src/services/deepseekAPI.ts` 管理，默认 `https://api.deepseek.com/v1/completions`。
- **环境变量**：`VITE_DEEPSEEK_API_KEY`
- **控制台输出**：错误时会打印 `[DeepSeekClient]` 开头的日志。

## 3. Google Maps Directions API
- **用途**：获取公共交通/步行路线摘要，构成每个时间段的“交通方式”卡片。
- **端点**：`GET https://maps.googleapis.com/maps/api/directions/json`
- **关键参数**：`origin`、`destination`、`mode=transit`、`language`、`alternatives=true`
- **环境变量**：`VITE_GOOGLE_MAPS_API_KEY`
- **控制台输出**：
  - 成功：`[TransportInsights] Google Maps success`
  - 失败：`[TransportInsights] Google directions failed`

## 4. Mapbox Directions / Geocoding API（备用）
- **用途**：当 Google 不可用时，回退到 Mapbox 获取驾车/步行/骑行方案。
- **端点**：
  - 地理编码：`GET https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json`
  - 路径规划：`GET https://api.mapbox.com/directions/v5/mapbox/{profile}/{from};{to}`
- **环境变量**：`VITE_MAPBOX_ACCESS_TOKEN`
- **控制台输出**：
  - 成功：`[TransportInsights] Mapbox success`
  - 失败：`[TransportInsights] Mapbox directions failed` / `Mapbox geocoding failed`

## 5. Mapbox Geocoding API
- **用途**：优先用于反向地理编码（经纬度 → 国家 / 省州 / 城市标签），支撑灵感详情页的地点展示。
- **端点**：`GET https://api.mapbox.com/geocoding/v5/mapbox.places/{lng},{lat}.json`
- **环境变量**：`VITE_MAPBOX_ACCESS_TOKEN`、`VITE_MAPBOX_API_URL`
- **控制台输出**：`[Geocode] Mapbox reverse lookup failed`（失败时）
- **回退**：若 Mapbox 无结果，会自动回退到 Nominatim。

## 6. Google Places Details API
- **用途**：获取景点/餐厅的开放时间（`opening_hours.weekday_text`）。
- **端点**：  
  - `GET https://maps.googleapis.com/maps/api/place/findplacefromtext/json`（获取 `place_id`）  
  - `GET https://maps.googleapis.com/maps/api/place/details/json`
- **环境变量**：`VITE_GOOGLE_MAPS_API_KEY`
- **控制台输出**：
  - 成功：`[OpeningInsights] Google Places success`
  - 无匹配：`[OpeningInsights] no placeId found`

## 7. TripAdvisor (RapidAPI)
- **用途**：查询门票价格区间、票务信息、评分（用于“费用详情”卡片）。
- **端点**：  
  - `GET https://travel-advisor.p.rapidapi.com/locations/search`  
  - `GET https://travel-advisor.p.rapidapi.com/attractions/get-details`
- **环境变量**：  
  - `VITE_TRIPADVISOR_RAPIDAPI_KEY`  
  - `VITE_TRIPADVISOR_RAPIDAPI_HOST`（默认 `travel-advisor.p.rapidapi.com`）
- **控制台输出**：
  - 成功：`[PricingInsights] TripAdvisor success`
  - 失败/无结果：`[PricingInsights] no TripAdvisor locationId`、`pricing fetch failed`

## 8. Eventbrite API
- **用途**：获取目的地当日的节庆/活动，显示在“当地节庆”卡片，并提供订阅链接。
- **端点**：`GET https://www.eventbriteapi.com/v3/events/search`
- **环境变量**：  
  - `VITE_EVENTBRITE_API_TOKEN`  
  - `VITE_EVENTBRITE_API_URL`（默认 `https://www.eventbriteapi.com`）
- **控制台输出**：
  - 成功：`[FestivalEvents] Eventbrite success`
  - 无活动：`[FestivalEvents] no events found`
  - 在行程合并阶段：`[JourneyService] Festival events attached`

## 9. Unsplash / Pexels
- **用途**：为灵感详情和时间段生成配图；Unsplash 失败时回退 Pexels。
- **端点**：
  - `GET https://api.unsplash.com/search/photos`
  - `GET https://api.pexels.com/v1/search`
- **环境变量**：`VITE_UNSPLASH_ACCESS_KEY`、`VITE_PEXELS_API_KEY`
- **控制台输出**：`[Pexels]` / `Unsplash搜索失败，尝试使用 Pexels` 等。

---

### 日志观察技巧
1. 打开浏览器控制台，勾选 “Preserve log”，重新生成一次灵感旅程。
2. 关注上述前缀的 `console.info` / `console.warn`，即可确认每个数据源是否命中。
3. `TimeSlotCard` 组件会额外打印 `[TimeSlotCard] Generated details for …`，展示最终渲染的数据结构，便于对照页面内容。

### 持续维护
- 若新增/替换 API，请同步更新此文档以及 `.env.local` 示例、`src/config/api.ts` 配置。
- 如需记录请求耗时/命中率，可在对应函数内扩展日志或埋点。

> 建议在提交新功能前更新此文档，确保团队其他成员能快速了解数据来源与依赖。

