# InspirationHero 组件数据字段获取说明

本文档说明 `src/components/TravelDetail/InspirationHero.vue` 组件中各个显示字段的数据来源。

## 数据源结构

组件从以下位置获取数据：
- `props.travel` - Travel 对象（来自 store）
- `props.travel.data` - 旅行数据对象（`travelData`）
- `itineraryData` - 行程数据（从 `travelData` 中提取）

## 字段映射表

### 1. 标题 (heroTitle)
**显示位置：** 页面主标题 `<h1 class="hero-title">`

**数据获取优先级：**
```typescript
data?.title ||
itineraryData.value?.title ||
props.travel?.title ||
默认值: '灵感旅程'
```

**对应数据结构字段：**
- `travel.data.title`
- `travel.data.days[].title` (如果存在 days)
- `travel.title`

---

### 2. 目的地 (heroDestination)
**显示位置：** 页面元信息区域，带 📍 图标

**数据获取优先级：**
```typescript
// 第一优先级：从 travel 对象获取
travel?.location ||
data?.selectedLocation ||
itineraryData.value?.destination ||
data?.location ||
data?.destination

// 第二优先级：从第一个时间槽获取
itineraryData.value?.days[0]?.timeSlots[0]?.location

// 第三优先级：通过坐标反向地理编码获取
reverseGeocodeDetail(coords.lat, coords.lng)
```

**对应数据结构字段：**
- `travel.location` ⭐ **主要字段**
- `travel.data.location`
- `travel.data.selectedLocation`
- `travel.data.days[0].timeSlots[0].location`

---

### 3. 封面图片 (heroCoverImage)
**显示位置：** 页面顶部背景图

**数据获取优先级：**
```typescript
props.travel?.coverImage ||
data?.coverImage ||
根据目的地生成 Unsplash URL ||
默认: 'https://source.unsplash.com/1600x450/?travel'
```

**对应数据结构字段：**
- `travel.coverImage`
- `travel.data.coverImage`

---

### 4. 天数 (dayCount)
**显示位置：** 页面元信息区域，带 📅 图标

**数据获取：**
```typescript
itineraryData.value?.days?.length || 
props.travel?.duration || 
0
```

**对应数据结构字段：**
- `travel.data.days.length`
- `travel.duration`

---

### 5. 核心洞察 (heroCoreInsight)
**显示位置：** 带 💡 图标的洞察卡片

**数据获取优先级：**
```typescript
// 第一优先级：安全提示
data?.safetyNotices[locale] ||
data?.safetyNotice ||

// 第二优先级：核心洞察
data?.coreInsight ||
data?.narrative?.threshold ||
data?.narrative?.stillness ||
''
```

**对应数据结构字段：**
- `travel.data.coreInsight` ⭐ **主要字段**
- `travel.data.safetyNotice`
- `travel.data.safetyNotices[locale]`
- `travel.data.narrative.threshold`
- `travel.data.narrative.stillness`

---

### 6. 支持文本 (heroSupportingText)
**显示位置：** 核心洞察下方的描述文本

**数据获取优先级：**
```typescript
// 如果 heroItinerarySummary 存在，优先使用
heroItinerarySummary.value ||

// 否则使用
data?.narrative?.mirror ||
data?.cognitiveTriggers?.questions?.[0] ||
''
```

**heroItinerarySummary 的获取优先级：**
```typescript
itineraryData.value?.summary ||
data?.summary ||
data?.journeyBackground ||
data?.aiMessage ||
props.travel?.description
```

**对应数据结构字段：**
- `travel.data.summary` ⭐ **主要字段**
- `travel.data.journeyBackground`
- `travel.data.aiMessage`
- `travel.data.narrative.mirror`
- `travel.description`

---

### 7. 旅程背景 (heroJourneyBackground)
**显示位置：** 支持文本下方的背景描述

**数据获取优先级：**
```typescript
data?.journeyBackground ||
data?.summary ||
data?.aiMessage ||
itineraryData.value?.summary ||
props.travel?.description ||
''
```

**对应数据结构字段：**
- `travel.data.journeyBackground` ⭐ **主要字段**
- `travel.data.summary`
- `travel.data.aiMessage`
- `travel.description`

---

### 8. 标签芯片 (heroChips)
**显示位置：** 标题下方的标签区域

**数据获取来源：**
```typescript
// 从以下字段收集标签（最多4个）
data?.themes[] ||
data?.highlights[] ||
data?.moodKeywords[] ||
itineraryData.value?.days[0-2]?.theme
```

**对应数据结构字段：**
- `travel.data.themes[]`
- `travel.data.highlights[]`
- `travel.data.moodKeywords[]`
- `travel.data.days[].theme`

---

### 9. 模式标签 (heroModeLabel)
**显示位置：** 页面顶部左侧标签 "AI 灵感行程"

**数据获取：**
```typescript
翻译键: 'travelDetail.inspirationHero.modeLabel'
默认值: 'AI 灵感行程'
```

---

### 10. 状态标签 (journeyStatusLabel)
**显示位置：** 页面顶部右侧标签 "AI 已生成"

**数据获取优先级：**
```typescript
data?.statusLabel ||
(travel?.status === 'completed' ? '已完成' : '') ||
(itineraryData.value ? 'AI 已生成' : '')
```

**对应数据结构字段：**
- `travel.data.statusLabel`
- `travel.status`

---

### 11. 人物画像名称 (travelPersonaName)
**显示位置：** 页面元信息区域，带 👑 图标（如果存在）

**数据获取优先级：**
```typescript
data?.persona?.displayName ||
data?.persona?.name ||
data?.aiPersona ||
data?.travelStyle ||
''
```

**对应数据结构字段：**
- `travel.data.persona.displayName`
- `travel.data.persona.name`
- `travel.data.aiPersona`
- `travel.data.travelStyle`

---

### 12. 旅行心情 (travelMood)
**显示位置：** 页面元信息区域，带 😊 图标（如果存在）

**数据获取优先级：**
```typescript
data?.moodKeywords?.[0] ||
data?.mood ||
data?.journeyMood ||
''
```

**对应数据结构字段：**
- `travel.data.moodKeywords[0]`
- `travel.data.mood`
- `travel.data.journeyMood`

---

## 行程路线显示

**注意：** 当前 `InspirationHero.vue` 组件**没有显示**带箭头的行程路线（如 "雷克雅未克 → 蓝湖温泉"）。

如果需要显示行程路线，需要：
1. 从 `travel.data.days[]` 中提取每个 day 的主要 location
2. 使用箭头连接：`location1 → location2 → location3`
3. 在模板中添加新的显示区域

**建议数据结构：**
```typescript
// 可以从 days 中提取
travel.data.days.map(day => {
  // 从 day.timeSlots 中提取主要 location
  const mainLocation = day.timeSlots[0]?.location || day.title
  return mainLocation
}).join(' → ')
```

---

## 完整数据示例

基于你提供的埃及行程数据结构，字段映射如下：

```json
{
  "title": "埃及经典之旅｜开罗+阿斯旺+卢克索+红海8日游",  // → heroTitle
  "location": "埃及・开罗・阿斯旺・卢克索・红海",          // → heroDestination
  "coverImage": "https://source.unsplash.com/...",        // → heroCoverImage
  "duration": 8,                                          // → dayCount
  "coreInsight": "从金字塔的远古奇迹到尼罗河的文明长廊...", // → heroCoreInsight
  "summary": "8天埃及经典之旅，包含吉萨金字塔群...",      // → heroSupportingText
  "journeyBackground": [                                   // → heroJourneyBackground (数组会被 join)
    "吉萨金字塔群是古代世界七大奇迹中仅存的建筑物...",
    "尼罗河是世界第一长河，孕育了古埃及文明...",
    "红海以其丰富的海洋生物和珊瑚礁而闻名..."
  ],
  "mode_tags": ["pyramid", "nile_cruise", ...],           // → heroChips (部分)
  "days": [                                               // → 用于提取行程路线
    { "title": "抵达开罗 · 文明古都", "location": "开罗" },
    { "title": "开罗 · 金字塔奇迹", "location": "开罗" },
    ...
  ]
}
```

---

## 总结

**主要数据来源：**
- `travel.data.title` - 标题
- `travel.location` - 目的地 ⭐
- `travel.data.coreInsight` - 核心洞察 ⭐
- `travel.data.summary` - 支持文本 ⭐
- `travel.data.journeyBackground` - 旅程背景 ⭐
- `travel.data.coverImage` - 封面图片
- `travel.data.days[]` - 行程天数
- `travel.data.themes[]` / `highlights[]` / `moodKeywords[]` - 标签

**组件文件位置：**
`/home/devbox/ai-travel-companion/src/components/TravelDetail/InspirationHero.vue`

