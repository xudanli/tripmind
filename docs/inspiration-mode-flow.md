# 灵感模式：从推荐目的地到生成旅程的完整流程

## 概述

灵感模式（Inspiration Mode）采用两步生成流程：
1. **第一步**：基于人格问卷生成推荐目的地列表（8-12个）
2. **第二步**：用户选择目的地后，生成完整的心理旅程行程

---

## 完整流程图

```
用户填写人格问卷
    ↓
提交问卷 (handleQuestionnaireSubmit)
    ↓
travelStore.generatePsychologicalJourney(profile, undefined)
    ↓
deepseekAPI.generatePsychologicalJourney(personalityProfile, language, userCountry, undefined)
    ↓
┌─────────────────────────────────────────────────────────┐
│ 第一步：生成推荐目的地列表                               │
├─────────────────────────────────────────────────────────┤
│ 1. 计算五维人格向量 (calculatePersonalityVector)        │
│ 2. 匹配心理旅程模板 (matchPsychologicalTemplate)        │
│ 3. 构建推荐目的地提示词                                   │
│ 4. 调用 AI 生成 8-12 个目的地推荐                        │
│    - 优先用户国家内 3-5 个                                │
│    - 至少 5 个国际目的地                                  │
│    - 每个包含：name, country, reason, reasoning          │
│ 5. 生成 AI 推荐消息 (aiRecommendationMessage)            │
│ 6. 返回推荐列表（无完整行程）                             │
└─────────────────────────────────────────────────────────┘
    ↓
UI 显示推荐目的地列表 + AI 推荐理由
    ↓
用户选择一个目的地
    ↓
点击"生成旅程"按钮 (handleGenerateItinerary)
    ↓
travelStore.generatePsychologicalJourney(profile, selectedDestination)
    ↓
deepseekAPI.generatePsychologicalJourney(personalityProfile, language, userCountry, selectedDestination)
    ↓
┌─────────────────────────────────────────────────────────┐
│ 第二步：生成完整旅程                                     │
├─────────────────────────────────────────────────────────┤
│ 1. 检测到 selectedDestination 存在                       │
│ 2. 跳过推荐步骤（recommendedDestinations = []）          │
│ 3. 调用 generateInspirationJourney(...)                 │
│    - 传入：psychologicalPrompt + selectedDestination    │
│    - AI 生成完整行程（包含 days 数组）                   │
│    - 返回 itineraryData                                 │
│ 4. 生成双轨 JSON (generateDualTrackJSON)                 │
│    - 外部轨迹：时间、地点、活动、交通、预算               │
│    - 内部轨迹：情绪阶段、心理任务、仪式设计                │
│ 5. 标记 hasFullItinerary = true                          │
│ 6. 返回完整行程数据                                       │
└─────────────────────────────────────────────────────────┘
    ↓
检查 hasFullItinerary || days 存在
    ↓
自动跳转到旅行详情页 (createTravel)
```

---

## 详细步骤说明

### 步骤 1：用户填写人格问卷

**文件位置**: `src/components/Inspiration/PersonalityQuestionnaire.vue`

**问卷内容**:
- M (动机): motivation, motivation_detail
- E (情绪): dominant_emotion, desired_emotion
- R (节奏): travel_rhythm, activity_density
- S (社交): social_preference, social_intensity
- N (需求): cognitive_need, post_journey_goal

**触发**: 用户点击"生成推荐目的地"按钮

---

### 步骤 2：生成推荐目的地列表

**文件位置**: 
- `src/views/InspirationView.vue` - `handleQuestionnaireSubmit()`
- `src/stores/travel.ts` - `generatePsychologicalJourney()`
- `src/services/deepseekAPI.ts` - `generatePsychologicalJourney()`

**流程**:

1. **UI 层** (`InspirationView.vue:519-587`)
   ```typescript
   // 保存问卷数据
   savedPersonalityProfile.value = profile
   
   // 调用 store，不传目的地
   await travelStore.generatePsychologicalJourney(profile)
   ```

2. **Store 层** (`travel.ts:467-551`)
   ```typescript
   // 获取用户地理位置
   const userCountry = getUserLocation()?.country
   
   // 调用 API 层，不传目的地
   const inspirationData = await generateJourneyAPI(
     personalityProfile, 
     currentLanguage, 
     userCountry, 
     undefined  // 无 selectedDestination
   )
   ```

3. **API 层** (`deepseekAPI.ts:846-1104`)
   
   **a. 计算人格向量和匹配模板**
   ```typescript
   const vector = calculatePersonalityVector(personalityProfile)
   const matchResult = matchPsychologicalTemplate(vector, ...)
   const template = matchResult.template
   ```
   
   **b. 检查是否有 selectedDestination**
   ```typescript
   if (!selectedDestination) {
     // 生成推荐列表
   }
   ```
   
   **c. 构建推荐提示词**
   - 包含用户心理画像（M-E-R-S-N）
   - 包含匹配的模板信息
   - 包含地理位置偏好
   - 要求返回 JSON 数组格式
   
   **d. 调用 AI 生成推荐**
   ```typescript
   const response = await chatWithDeepSeek(messages, {
     temperature: 0.8,
     max_tokens: 4000
   })
   ```
   
   **e. 解析 AI 响应**
   - 清理 markdown 代码块
   - 提取 JSON 数组
   - 解析为推荐目的地列表
   - 每个目的地包含：`name`, `country`, `reason`, `reasoning`
   
   **f. 生成 AI 推荐消息**
   ```typescript
   aiRecommendationMessage = `根据你的心理画像（${template.templateName}），
   我为你精心选择了 ${recommendedDestinations.length} 个目的地...`
   ```
   
   **g. 返回结果**（无完整行程）
   ```typescript
   return {
     recommendedDestinations: [...],  // 8-12 个目的地
     locations: [...],                // 目的地名称数组
     locationDetails: {...},          // 详细信息映射
     aiMessage: aiRecommendationMessage,
     hasFullItinerary: false,          // 标记为未生成完整行程
     // ... 模板信息
   }
   ```

4. **UI 显示推荐列表**
   - 显示所有推荐目的地
   - 显示每个目的地的推荐理由（reason）和判断思路（reasoning）
   - 显示 AI 推荐消息
   - 显示"生成旅程"按钮（但需要先选择目的地）

---

### 步骤 3：用户选择目的地

**文件位置**: `src/views/InspirationView.vue`

**交互**:
- 用户点击推荐列表中的某个目的地
- `selectedLocation.value = destinationName`
- UI 高亮显示选中的目的地
- 显示该目的地的 `reason` 和 `reasoning`

---

### 步骤 4：生成完整旅程

**文件位置**: 
- `src/views/InspirationView.vue` - `handleGenerateItinerary()`
- `src/services/deepseekAPI.ts` - `generatePsychologicalJourney()` 和 `generateInspirationJourney()`

**流程**:

1. **UI 层** (`InspirationView.vue:591-635`)
   ```typescript
   // 检查是否选择了目的地
   if (!selectedLocation.value) {
     message.warning('请先选择一个目的地')
     return
   }
   
   // 使用保存的问卷数据
   await travelStore.generatePsychologicalJourney(
     savedPersonalityProfile.value, 
     selectedLocation.value  // 传入选择的目的地
   )
   ```

2. **Store 层** (`travel.ts:467-551`)
   ```typescript
   // 传入 selectedDestination
   const inspirationData = await generateJourneyAPI(
     personalityProfile, 
     currentLanguage, 
     userCountry, 
     selectedDestination  // 有值了！
   )
   ```

3. **API 层** (`deepseekAPI.ts:1109-1200`)
   
   **a. 检测 selectedDestination**
   ```typescript
   if (selectedDestination) {
     // 跳过推荐步骤
     recommendedDestinations = []
     console.log('✅ 用户已选择目的地，跳过推荐生成步骤')
   }
   ```
   
   **b. 构建心理旅程提示词**
   ```typescript
   const destinationConstraint = `📍 重要约束：用户已选择"${selectedDestination}"
   作为目的地。你必须为该地点生成行程，不得更改...`
   
   const psychologicalPrompt = `基于以下心理画像生成${template.templateName}旅程：
   - 动机：${motivation}（寻求：${motivation_detail}）
   - 情绪：从 ${dominant_emotion} 到 ${desired_emotion}
   - 节奏：${travel_rhythm}...
   ${destinationConstraint}`
   ```
   
   **c. 调用 generateInspirationJourney**
   ```typescript
   itineraryData = await generateInspirationJourney(
     psychologicalPrompt,  // 包含心理画像和目的地约束
     language, 
     userCountry, 
     selectedDestination   // 强制使用这个目的地
   )
   ```
   
   **d. generateInspirationJourney 内部** (`deepseekAPI.ts:1276-2220`)
   
   - 检测用户意图：`detectInspirationIntent(psychologicalPrompt)`
   - 构建系统提示词（包含双轨设计要求）
   - 调用 AI 生成完整行程：
     ```typescript
     const response = await chatWithDeepSeek(messages, {
       temperature: 0.8,
       max_tokens: 8192  // DeepSeek 最大限制
     })
     ```
   - 解析 JSON 响应：
     ```typescript
     const parsed = safeParseJSON(cleaned)  // 使用统一工具
     ```
   - 返回行程数据：
     ```typescript
     {
       title: "旅程标题",
       destination: selectedDestination,
       duration: 5,
       days: [
         {
           day: 1,
           theme: "召唤：召唤之声",
           psychologicalStage: "召唤",
           timeSlots: [
             {
               time: "09:00",
               activity: "活动名称",
               location: "具体地点",
               internalTrack: {
                 question: "心理反思问题",
                 ritual: "象征仪式",
                 reflection: "反思提示"
               }
             }
           ]
         }
       ],
       // ...
     }
     ```
   
   **e. 生成双轨 JSON**
   ```typescript
   dualTrackData = await generateDualTrackJSON(
     template,      // 心理模板
     vector,        // 人格向量
     profile,       // 详细画像
     itineraryData  // 外部轨迹
   )
   ```
   
   **f. 返回完整结果**
   ```typescript
   return {
     // 推荐信息（已选择的目的地）
     recommendedDestinations: [{ name: selectedDestination, ... }],
     
     // 完整行程
     days: itineraryData.days,
     destination: itineraryData.destination,
     duration: itineraryData.duration,
     
     // 双轨数据
     journeyDesign: dualTrackData?.journeyDesign,
     
     // 标记
     hasFullItinerary: true,  // ✅ 已生成完整行程
     
     // ...
   }
   ```

4. **UI 验证和跳转** (`InspirationView.vue:620-624`)
   ```typescript
   if (travelStore.inspirationData?.hasFullItinerary || 
       travelStore.inspirationData?.days) {
     message.success('行程生成成功！')
     createTravel()  // 跳转到详情页
   }
   ```

---

## 关键数据结构

### 推荐目的地数据结构
```typescript
{
  name: string              // "冈仁波齐·神山环线"
  country: string           // "中国"
  reason: string            // "推荐理由（2-3句话）"
  reasoning: string         // "判断思路（2-3句话）"
  description?: string      // 可选描述
}
```

### 完整行程数据结构
```typescript
{
  title: string
  destination: string
  duration: number
  days: Array<{
    day: number
    theme: string
    psychologicalStage: "召唤" | "映照" | "觉醒" | "沉淀" | "转化"
    timeSlots: Array<{
      time: string
      activity: string
      location: string
      internalTrack: {
        question: string
        ritual: string
        reflection: string
      }
    }>
  }>
  hasFullItinerary: true
}
```

---

## 关键决策点

### 1. 是否有 selectedDestination？
- **无** → 生成推荐列表，返回 `hasFullItinerary: false`
- **有** → 跳过推荐，直接生成完整行程，返回 `hasFullItinerary: true`

### 2. 推荐目的地的优先级
- 用户国家内：3-5 个（优先）
- 国际目的地：至少 5 个（来自不同国家）
- 总数：8-12 个

### 3. AI 提示词中的目的地约束
```typescript
📍 CRITICAL: The user has selected "${selectedDestination}" as the destination.
You MUST generate an itinerary specifically for this location.
Do NOT change or replace it with another destination.
```

### 4. 双轨设计
- **外部轨迹**：时间、地点、活动、交通、预算（可执行行程）
- **内部轨迹**：情绪阶段、心理任务、仪式设计（体验旅程）

---

## 错误处理

1. **推荐生成失败** → 使用默认推荐（冈仁波齐）
2. **JSON 解析失败** → 使用 `safeParseJSON` 工具多重修复
3. **完整行程生成失败** → 显示错误消息，允许重试
4. **AI 未使用选择的目的地** → 记录警告日志，但信任 AI 结果

---

## 调试日志关键字

- `✅ 开始调用 generatePsychologicalJourney（第一步：推荐目的地）...`
- `🚀 开始调用AI生成目的地推荐...`
- `✅ AI推荐了 X 个目的地`
- `✅ 用户已选择目的地，跳过推荐生成步骤`
- `✅ 开始生成完整行程，选择的目的地: XXX`
- `✅ 完整行程已生成，准备跳转到详情页`

---

## 相关文件

- `src/views/InspirationView.vue` - UI 交互层
- `src/components/Inspiration/PersonalityQuestionnaire.vue` - 问卷组件
- `src/stores/travel.ts` - 状态管理层
- `src/services/deepseekAPI.ts` - AI 生成逻辑层
- `src/utils/psychologicalTemplates.ts` - 心理模板和向量计算
- `src/utils/jsonParser.ts` - JSON 解析工具

