# LLM 调用总览（AI Travel Companion）

> 目的：给后端/基础架构同学快速了解当前前端里所有 LLM 调用点、依赖与数据流，方便排期抽空实现或接入真实服务。

## 1. 基础架构

| 组件 | 位置 | 职责 |
| --- | --- | --- |
| `DeepSeekClient` | `src/llm/deepseekClient.ts` | 统一 LLM 适配层，提供 `callLLM`（自由文本）与 `jsonFromLLM`（JSON-only）两个接口，带重试、超时、截断检测与多重 JSON 修复。 |
| `chatWithLLM` | `src/services/deepseekAPI.ts` | 根据用户偏好选择 DeepSeek 或 OpenAI，构造 `messages` 并调用后端 `DEEPSEEK_CHAT`/OpenAI 代理。 |
| Prompts | `src/prompts/**` | 以模块化方式存储系统提示词（灵感、Planner、Persona 等）。目前大多数服务直接内联 prompt，后续可迁移。 |
| JSON 工具 | `src/utils/inspiration/core/jsonProcessor.ts`, `src/utils/jsonProcessor.ts` | 处理 LLM JSON 的解析、修复、提取（days/timeSlots）。 |

### 运行流程（以 `jsonFromLLM` 为例）
1. 业务模块构造 `systemPrompt` + `userPrompt`。
2. 通过 `DeepSeekClient` 调用 `chatWithLLM`（内部支持 DeepSeek/OpenAI）。
3. `jsonFromLLM` 先尝试原样解析 → fallback 提取数组 → 综合修复 → 必要时降温重试。
4. 返回结构化结果或抛出错误，由业务层处理。

## 2. 主要调用场景

| 模块 | 文件 | LLM 功能 | 产出 | 备注 |
| --- | --- | --- | --- | --- |
| 旅程生成主流程 | `src/services/journeyService.ts` + `journey/**` | 生成框架、逐日细化、景点简介、交通建议、Tips | `Itinerary` JSON | 核心灵感模式。多阶段串行调用 LLM。 |
| Planner 模式 | `src/services/deepseekAPI.ts` → `generatePlannerItinerary` | 生成结构化行程（含 daily activities） | JSON（title/summary/days/tips） | 直接调用 `chatWithLLM`，后续解析 JSON。 |
| Seeker 模式 | `generateSeekerRecommendation` | 心情推荐、情绪提示 | JSON（destination/reason/highlights/tips/message） | 语气偏情感，温度更高。 |
| Inspiration API | `src/apis/inspiration.ts` + `src/services/inspirationAPI.ts` | 灵感提示、人格对话、场景叙事 | 文本或 JSON | 包含 persona、心理旅程、灵感提示等多组 prompt。 |
| Persona Service | `src/services/personaService.ts` | 人格画像、推荐语、心理模板 | JSON（personas/recommendations） | 依赖 `DeepSeekClient.jsonFromLLM`。 |
| Discussion Area | `src/components/TravelDetail/DiscussionArea.vue` | 旅程讨论/总结 | 文本/结构化 reply | 在前端组件内直接实例化 LLM 客户端。 |
| Intent Service | `src/services/intentService.ts` | 识别用户输入意图并提取结构化字段 | JSON（意图类型、目的地、时间等） | 先用于 planner 表单预填。 |
| 提示词工具 | `src/services/journey/scenicIntroGenerator.ts` 等 | 各类子生成器（景点介绍、交通、Tips） | JSON（slot 内容） | 全部走 `llm.jsonFromLLM`。 |

> 后续如果需要服务端托管 LLM 调用，可以此表为清单，逐个迁移到后端。

## 3. Prompt 资产 & 配置

- `src/prompts/inspiration/*`：灵感模式的通用 prompt（意图识别、旅程生成、服装/交通提示等）。
- `PROMPT_USAGE_GUIDE.md`：概述 prompt 使用指南（位于仓库根目录）。
- `PLANNER_AI_INTEGRATION.md`：Planner 模式 LLM 接入说明。
- 环境变量：  
  - `VITE_DEEPSEEK_API_KEY`, `VITE_DEEPSEEK_BASE_URL`  
  - `VITE_OPENAI_API_KEY`, `VITE_OPENAI_BASE_URL`, `VITE_OPENAI_MODEL`  
  - 由 `API_CONFIG` 统一读取。

## 4. 数据契约（示例）

| 功能 | LLM JSON 关键字段 |
| --- | --- |
| Journey Itinerary (`Itinerary`) | `{ title, summary, destination, days: [{ day, theme, timeSlots: [{ time,title,activity,transport,tips }] }], tips[] }` |
| Planner Itinerary | `{ title, summary, days: [{ day, theme, activities: [{ time,name,description,cost }] }], budget, tips }` |
| Seeker Recommendation | `{ destination, reason, summary, highlights[], tips[], message }` |
| Persona Service | `{ persona: { traits, tone, quote }, recommendations[], storyBoard[] }` |
| Discussion AI 回复 | `{ author, role, content, suggestedActions[] }` （组件内部定义） |

> 实际字段可参考各服务文件内的 `map`/`validator`，后端实现时请保持一致或输出对应 DTO。

## 5. 后端落地注意事项

1. **统一代理层**：建议在后端封装与 DeepSeek/OpenAI 的调用，前端只调用自有 API，避免在浏览器暴露 API Key。
2. **流控与重试**：`DeepSeekClient` 目前在前端做了重试/超时，迁移后需在后端还原相同策略。
3. **JSON 修复**：如果后端能保证返回稳定 JSON，可下掉一部分前端修复逻辑；否则需要保留等价的 parse/repair。
4. **缓存/异步生成**：旅程生成存在多次串行 LLM 调用，可考虑后端落地时增加任务队列或分阶段返回。
5. **监控日志**：`LoggingAdapter` 现在在控制台输出，后端需对每次调用记录 prompt/耗时/失败原因便于调试。

---

> 若需要更细的分模块说明（例如 JourneyService 下的 day generator、transport generator 等），可以在此文档基础上继续拆分章节。告诉我你希望优先深入哪一块，我可以按模块依次输出详细说明。

## 6. 模块详解：灵感旅程生成管线

> 对应文件：`src/services/journeyService.ts` + `src/services/journey/*.ts`

### 6.1 入口：`JourneyService.generateJourney`

| 步骤 | 代码 | 描述 | LLM 形式 |
| --- | --- | --- | --- |
| (1) 解析意图 & 天数 | `determineDays()` | 根据用户输入、关键词和 `destinationDays` 映射估算天数。 | 无 |
| (2) 参考目录 | `buildReferenceCatalog()` | 拉取地理/文化参考数据，作为 prompt context。 | 无（内部可选 LLM） |
| (3) 框架生成 | `generateFramework()` | 通过 LLM 生成旅程框架（目的地、主题、Day skeleton）。 | `llm.jsonFromLLM` |
| (4) Daily 详情 | `generateDayDetailsForAllDays()` | 逐日扩写 timeSlots（activity、餐饮、住宿等）。 | `llm.jsonFromLLM` |
| (5) 景点叙事 | `generateScenicIntrosForAllSlots()` | 为每个 timeSlot 补充 narrative / background。 | `llm.callLLM`（自由文本） |
| (6) 交通建议 | `generateTransportGuidesForAllSlots()` | 补充交通方式、时间、花费建议。 | `llm.jsonFromLLM` |
| (7) Tips | `generateTipsForAllSlots()` | 天数≤3 同步生成，>3 异步生成。 | `llm.jsonFromLLM` |
| (8) 校验修复 | `validateAndFix()` | JSON schema 校验、去重、补字段。 | 无 |

### 6.2 子模块输入/输出

1. **Framework Generator (`journey/frameworkGenerator.ts`)**
   - **Input**：用户原始输入、解出的 intent、参考目录、目标天数。
   - **Prompt 要点**：  
     - 角色：资深旅行设计师。  
     - 需输出 `destination`, `days[]`, `storyHooks`, `emotionTone` 等键。  
   - **Output**：`Itinerary` 风格 JSON（仅 skeleton）。

2. **Day Details Generator (`journey/dayDetailsGenerator.ts`)**
   - **Input**：上一步的 framework + intent/context。
   - **Prompt**：强调地理连续性、避免重复抵达 slot、输出 `{ day, timeSlots[] }`。  
   - **Output**：补齐 `timeSlots`，每个 slot 含 `title/activity/transport/meal/hotel/tips`。

3. **Scenic Intro Generator (`journey/scenicIntroGenerator.ts`)**
   - **Input**：包含地理坐标/地点名的 timeSlots。
   - **Prompt**：将景点背景、文化故事转化为 2-3 句 narrative。  
   - **Output**：在 slot 上追加 `narrative`, `localInsight`。

4. **Transport Generator (`journey/transportGenerator.ts`)**
   - **Input**：timeSlots、可能的地理对。  
   - **Prompt**：要求输出 `transportPlan`（方式、耗时、费用、碳排提示）。  
   - **Output**：为 slot 写入 `transportRecommendation` 数组。

5. **Tips Generator (`journey/tipsGenerator.ts`)**
   - **Input**：带 narrative + transport 的完整 itinerary。  
   - **Prompt**：根据活动内容生成实用建议/备选方案。  
   - **Output**：slot-level `proTips`，以及日级 tips。

### 6.3 关键注意点

- **串行依赖**：每一步的输出字段会被下一步 prompt 继续引用，因此后端迁移时需保持完全一致的 JSON 结构。
- **性能**：大部分生成器按天/slot 串行执行，天数较多时耗时显著。后端可考虑：  
  - 并行生成不同 day（保证地理连续性的情况下）。  
  - 拆分为“快照 + 异步补全”模式，先返回 framework + 前几天细节。
- **可配置项**：温度、max tokens、fallback arrays，目前写死在生成器内，可抽出到配置文件便于后端调参。
- **日志**：每个生成步骤都使用 `LoggingAdapter` 写 console，迁移后建议对应打点到 log pipeline。

---

> 下一步如果需要 Planner 或 Seeker 模式的同级拆解，请指明，我会继续追加章节。

## 7. 模块详解：Planner 模式行程生成

> 对应文件：`src/services/deepseekAPI.ts` 中 `generatePlannerItinerary`

### 7.1 业务场景

- 用户已知目的地、天数、预算、旅行偏好，期望获得“结构化 + 可执行”的行程计划。
- 输出需包含每日活动、时间、地点、费用估算及整体预算提示。
- 前端目前直接调用 LLM（无后端代理），应尽快迁移。

### 7.2 调用流程

1. 收集表单参数：`destination`, `duration`, `budget`, `preferences[]`, `travelStyle`, `travelers`, `language`。
2. 组装系统/用户 prompt（根据语言切换中英文版本），强调：
   - Planner persona（高效、理性、数据驱动）。
   - 必须返回 JSON，含 `title/summary/days/budget/tips`。
3. 调用 `chatWithLLM(messages, { temperature: 0.7, max_tokens: 4000 })`。
4. 去除 ```json 包裹后直接 `JSON.parse`。
5. 将结果映射到前端 UI 所需结构（`PlannerOverview`, `PlannerTimeline`）。

### 7.3 数据契约

```jsonc
{
  "title": "行程标题",
  "summary": "摘要",
  "budget": { "currency": "CNY", "total": 8000 },
  "days": [
    {
      "day": 1,
      "date": "可选",
      "theme": "主题",
      "activities": [
        {
          "time": "09:00",
          "name": "活动名称",
          "location": "地点",
          "description": "描述",
          "type": "sightseeing | dining | transport",
          "cost": 120,
          "duration": "2h"
        }
      ],
      "tips": ["..."]
    }
  ],
  "tips": [
    "总体优化建议",
    "预算提示"
  ]
}
```

### 7.4 与后端协作建议

- **参数校验**：建议后端对所有输入字段进行约束（例如 duration <= 14 天）以控制成本。
- **模型选择**：Planner 需要较强的结构化输出，可优先使用 `json_from_text` 能力或 server-side parser。
- **缓存策略**：用户可能多次调整同一行程参数，可结合 key（destination+duration+budget hash）做缓存。
- **增量编辑**：未来可考虑“编辑某天”的接口，提示词需要支持局部更新。

---

## 8. 模块详解：Seeker 模式情绪推荐

> 对应文件：`src/services/deepseekAPI.ts` 中 `generateSeekerRecommendation`

### 8.1 业务场景

- 输入为用户当前心情/渴望体验/预算/时长。
- 输出一份情绪调性较强的旅行推荐（目的地、理由、体验描述、情感 tips）。
- 前端用于 `SeekerHero` 和 `SeekerMoodNotes` 展示。

### 8.2 调用流程

1. 组装系统 prompt（温柔陪伴者 persona）+ 用户 prompt（心情、体验、预算、时长）。
2. `chatWithLLM(messages, { temperature: 0.8, max_tokens: 1500 })`。
3. 去除 ```json 包裹后 `JSON.parse`。

### 8.3 数据契约

```jsonc
{
  "destination": "京都",
  "reason": "春季樱花与静谧街区适合放慢节奏",
  "summary": "描述整体体验",
  "highlights": [
    "清晨哲学之道散步",
    "町屋茶屋体验"
  ],
  "tips": [
    "安排一段无计划时间，允许自己随意走走",
    "把预算留给让你安心的住宿"
  ],
  "message": "今天就慢一点吧，风会为你留路。"
}
```

### 8.4 特殊考虑

- **语气一致性**：Prompt 中包含 persona 语料示例，后端实现需保留。
- **多语言**：`language` 参数控制输出语言，默认中文。
- **安全性**：需过滤敏感/不当内容，可在后端增加 moderation。

---

> 如需继续拆解 Persona Service / Inspiration API / Discussion Area 等模块，请继续告知优先级。

