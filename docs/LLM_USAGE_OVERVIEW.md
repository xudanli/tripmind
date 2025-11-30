# LLM 调用总览（AI Travel Companion）

> 目的：给后端/基础架构同学快速了解当前前端里所有 LLM 调用点、依赖与数据流，方便排期抽空实现或接入真实服务。

## 1. 基础架构

| 组件 | 位置 | 职责 |
| --- | --- | --- |
| `DeepSeekClient` | `src/llm/deepseekClient.ts` | 统一 LLM 适配层，提供 `callLLM`（自由文本）与 `jsonFromLLM`（JSON-only）两个接口，带重试、超时、截断检测与多重 JSON 修复。 |
| `chatWithLLM` | `src/services/deepseekAPI.ts` | 根据用户偏好选择 DeepSeek 或 OpenAI，构造 `messages` 并调用后端 `DEEPSEEK_CHAT`/OpenAI 代理。 |
| Prompts | `src/prompts/**` | 以模块化方式存储系统提示词（灵感、Planner、Persona 等）。目前大多数服务直接内联 prompt，后续可迁移。 |
| JSON 工具 | `src/utils/jsonProcessor.ts` | 处理 LLM JSON 的解析、修复、提取（days/timeSlots）。 |

### 运行流程（以 `jsonFromLLM` 为例）
1. 业务模块构造 `systemPrompt` + `userPrompt`。
2. 通过 `DeepSeekClient` 调用 `chatWithLLM`（内部支持 DeepSeek/OpenAI）。
3. `jsonFromLLM` 先尝试原样解析 → fallback 提取数组 → 综合修复 → 必要时降温重试。
4. 返回结构化结果或抛出错误，由业务层处理。

## 2. 主要调用场景

| 模块 | 文件 | LLM 功能 | 产出 | 备注 |
| --- | --- | --- | --- | --- |
| Planner 模式 | `src/services/itineraryAPI.ts` → `generateItinerary` | 生成结构化行程（含 daily activities） | JSON（title/summary/days/tips） | 调用后端 API `/api/v1/journeys/generate`。 |
| Persona Service | `src/services/personaService.ts` | 人格画像、推荐语、心理模板 | JSON（personas/recommendations） | 依赖 `DeepSeekClient.jsonFromLLM`。 |
| Discussion Area | `src/components/TravelDetail/DiscussionArea.vue` | 旅程讨论/总结 | 文本/结构化 reply | 在前端组件内直接实例化 LLM 客户端。 |
| Intent Service | `src/services/intentService.ts` | 识别用户输入意图并提取结构化字段 | JSON（意图类型、目的地、时间等） | 先用于 planner 表单预填。 |

> 后续如果需要服务端托管 LLM 调用，可以此表为清单，逐个迁移到后端。

## 3. Prompt 资产 & 配置

- `src/prompts/planner/*`：Planner 模式的通用 prompt。
- `PROMPT_USAGE_GUIDE.md`：概述 prompt 使用指南（位于仓库根目录）。
- `PLANNER_AI_INTEGRATION.md`：Planner 模式 LLM 接入说明。
- 环境变量：  
  - `VITE_DEEPSEEK_API_KEY`, `VITE_DEEPSEEK_BASE_URL`  
  - `VITE_OPENAI_API_KEY`, `VITE_OPENAI_BASE_URL`, `VITE_OPENAI_MODEL`  
  - 由 `API_CONFIG` 统一读取。

## 4. 数据契约（示例）

| 功能 | LLM JSON 关键字段 |
| --- | --- |
| Planner Itinerary | `{ title, summary, days: [{ day, theme, activities: [{ time,name,description,cost }] }], budget, tips }` |
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

## 6. 模块详解：Planner 模式行程生成

> 对应文件：`src/services/deepseekAPI.ts` 中 `generatePlannerItinerary`

### 6.1 业务场景

- 用户已知目的地、天数、预算、旅行偏好，期望获得“结构化 + 可执行”的行程计划。
- 输出需包含每日活动、时间、地点、费用估算及整体预算提示。
- 前端目前直接调用 LLM（无后端代理），应尽快迁移。

### 6.2 调用流程

1. 收集表单参数：`destination`, `duration`, `budget`, `preferences[]`, `travelStyle`, `travelers`, `language`。
2. 组装系统/用户 prompt（根据语言切换中英文版本），强调：
   - Planner persona（高效、理性、数据驱动）。
   - 必须返回 JSON，含 `title/summary/days/budget/tips`。
3. 调用 `chatWithLLM(messages, { temperature: 0.7, max_tokens: 4000 })`。
4. 去除 ```json 包裹后直接 `JSON.parse`。
5. 将结果映射到前端 UI 所需结构（`PlannerOverview`, `PlannerTimeline`）。

### 6.3 数据契约

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

### 6.4 与后端协作建议

- **参数校验**：建议后端对所有输入字段进行约束（例如 duration <= 14 天）以控制成本。
- **模型选择**：Planner 需要较强的结构化输出，可优先使用 `json_from_text` 能力或 server-side parser。
- **缓存策略**：用户可能多次调整同一行程参数，可结合 key（destination+duration+budget hash）做缓存。
- **增量编辑**：未来可考虑“编辑某天”的接口，提示词需要支持局部更新。

---

> 如需继续拆解 Persona Service / Discussion Area 等模块，请继续告知优先级。

