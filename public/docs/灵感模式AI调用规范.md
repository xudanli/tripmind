# 灵感模式 AI 调用与数据规范

> 面向开发者的实现说明：调用链、可调参数、输入/输出结构、错误与回退、本地库融合点。

## 1. 总览
- 入口（Store）：`src/stores/travel.ts` → `generateInspiration(input)`
- 意图识别：`detectInspirationIntent(input, language)`（`src/services/deepseekAPI.ts`）
- 旅程生成：`generateInspirationJourney(input, language, userCountry?)`（同上）
- 富化字段：`utils/countryGuess.ts` → `currentCountry`、`locationCountries`
- 本地回退：AI 失败时使用 `src/utils/inspirationDb.ts` 组装卡片
- 参考目录注入：将本地库目的地作为 System 消息注入，指导 AI 优先用真实地点

流程（简）：
1) 用户输入 → 2) 意图识别（轻量对话） → 3) 旅程生成（强约束 JSON） → 4) 解析/修复/校验 → 5) 富化 → 6) 设置到 Store → 7) 视图渲染

## 2. 意图识别
- 方法：`detectInspirationIntent(input: string, language: string): Promise<{ intentType: string; keywords: string[]; emotionTone: string; description: string }>`
- 作用：抽取 `intentType / keywords / emotionTone / description`，作为旅程生成的语义信号。
- 主要意图类型（可扩展）：
  - `emotional_healing`（或 `mind_healing`）
  - `extreme_exploration`
  - `cultural_exchange`
  - `photography_exploration`
  - `urban_creation`
  - 其他/默认

## 3. 旅程生成（核心）
- 方法：`generateInspirationJourney(input: string, language = 'zh-CN', userCountry?: string): Promise<InspirationData>`
- Prompt 结构：
  - System（中/英双语两套）：
    - 角色设定（“灵感设计师”）与四大支柱（脱离/认知情境/内化流程/行动化）
    - 严格 JSON 结构要求（字段必须齐全）
    - 关键约束：`locations` 5–8 个，覆盖 ≥5 国家；每个地点需在 `locationDetails` 中有完整条目
  - System（参考目录）：
    - 从 `inspirationDb.listDestinations()` 动态生成“参考目的地目录”，按国家分组，每国最多 3 条，总量 ≈ 48
    - 目的：减少“凭空捏造地点”，引导返回真实地名
  - User：用户自然语言输入

- 模型调用封装：`chatWithDeepSeek(messages, { model?: string, temperature?: number, max_tokens?: number })`
  - 默认：`model=deepseek-chat`，`temperature≈0.8`，`max_tokens≈4000`

## 4. 返回数据结构（简版 Schema）
`InspirationData` 关键字段（已在 `src/stores/travel.ts` 定义）：
- 主题与背景：`title` / `coreInsight` / `journeyBackground`
- 心智流五阶段（必填）：`mentalFlowStages.summon|reflection|awakening|internalization|transformation`（各含 `theme/activities/emotionalGoal/symbolicElement`）
- 认知触发与治愈设计：`cognitiveTriggers` / `healingDesign`
- 行动化：`postJourneyChallenge`
- 关键词：`keywords: string[]`
- 目的地：
  - `currentCountry: string`
  - `locationCountries: Record<string, string>`
  - `locations: string[]`（5–8 个，≥5 国家）
  - `locationDetails[地点]: { name, country, duration, budget, highlights[], aiMessage }`
- 汇总：`duration` / `budget` / `highlights[]` / `aiMessage` / `concept`

注意：服务端会对 JSON 进行清理/修复与校验；缺关键字段会抛错。

## 5. 错误处理与回退
- 清理：移除 ```json 代码块、截取首尾 `{}`
- 修复：`fixJSONResponse` 针对常见格式问题二次修复
- 校验：缺 `title/locations/locationDetails` 等即报错
- 回退：`generateInspiration` 的 `catch` 内，会使用 `inspirationDb.listDestinations()` 取一个候选快速组装本地卡片，保证 UI 不中断

## 6. 与本地目的地库的结合
- 参考目录注入：在 `generateInspirationJourney` 内作为 system 消息传给模型
- 目录页：`/inspiration/catalog` 可浏览/筛选本地库（卡片视图）
- 本地字段（`src/utils/inspirationDb.ts` → `Destination`）：`name/country/lat/lng/symbolicArchetype/description/cognitiveDensity/recommendedStage/keywords/images`

## 7. 可调参数与扩展建议
- 模型/采样：调 `chatWithDeepSeek` 的 `model/temperature/max_tokens`
- 意图类型：在 `detectInspirationIntent` 内新增或细分类型；用于影响关键词与地点选择
- 强化硬约束：可在注入参考目录前，先按 `intentType` 对本地库做“预筛选”，仅把匹配的候选写入 reference system 消息
- 多语言：`language` 自动来自 i18n；Prompt 已提供中/英两套模板
- 图片风格：`InspirationHero.vue` 中的关键词拼装可按意图追加“视觉风格词”（如 calm/serene/adventure/urban 等）

## 8. 示例
输入：
> 最近有些疲惫，想在海边安静几天，最好能拍点照片，预算中等，5天左右。

可能输出（节选）：
- `intentType`: `emotional_healing`
- `keywords`: `['安静','海边','摄影','中等预算','5天']`
- `locations`: 5–8 个（含中国/日本/希腊/葡萄牙等海边地点）
- `locationDetails['普罗旺斯·薰衣草冥想田']`：包含 `duration/budget/highlights/aiMessage`

## 9. 测试与验证
- 页面 `/inspiration`：输入不同语句，观察阶段/亮点/地点是否契合
- 页面 `/inspiration/catalog`：对照地点是否来自本地库；封面、标签、认知密度呈现是否完整
- 报告脚本：`npm run report:inspiration` 生成 `public/reports/` 下的统计用于覆盖验证

## 10. 文件索引
- Store：`src/stores/travel.ts`
- API：`src/services/deepseekAPI.ts`
- 本地库：`src/utils/inspirationDb.ts`
- 国家识别：`src/utils/countryGuess.ts`
- 目录页：`src/views/InspirationCatalogView.vue`
- 生成报告：`scripts/generate_inspiration_report.ts`

---
如需将“意图类型说明 + 输入示例 + 输出示例”独立成一页，请告知我要面向产品还是工程同学，我会补充更适合的范例和落地建议。


