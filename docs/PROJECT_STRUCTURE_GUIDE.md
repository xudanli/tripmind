# AI Travel Companion 项目文件说明

本文整理项目主要目录与文档作用，方便快速定位代码或扩展位置。

---

## 顶层结构

| 路径 | 内容说明 |
|------|----------|
| `README.md` | 项目简介、启动命令、环境变量示例。 |
| `package.json` | 依赖与 npm 脚本。 |
| `vite.config.ts` | Vite 开发/构建配置。 |
| `tsconfig*.json` | TypeScript 编译配置。 |
| `env.d.ts` | `.env` 中运行时变量的类型声明。 |
| `public/` | 静态资源与对外公开文档（打包时原样复制）。 |
| `docs/` | 代码架构、API、流程等说明文档。 |
| `scripts/` | Node 脚本，用于生成报告或数据迁移。 |

---

## `src/` 目录

| 目录 | 作用 |
|------|------|
| `main.ts` | Vue 应用入口，挂载路由、Pinia、i18n。 |
| `App.vue` | 根组件，包含全局布局与路由出口。 |
| `router/` | Vue Router 配置。 |
| `stores/` | Pinia 状态管理（旅程列表、用户信息、i18n 等）。 |
| `assets/` | 全局样式、图片等静态资源。 |
| `components/` | 业务组件库：<br>• `TravelDetail/` 行程详情页组件（核心逻辑在 `ExperienceDay.vue`）<br>• `TravelDetail/TaskList.vue` 任务清单<br>• `TravelDetail/ExperienceDay/TimeSlotCard.vue` 行程卡片等 |
| `views/` | 页面级组件（与路由对应，如 `InspirationView.vue`、`TravelDetailView.vue`）。 |
| `services/` | 与外部世界交互的模块：<br>• `journeyService.ts` 行程生成 orchestrator<br>• `journey/` 子目录拆分框架/日程/交通/Tips 生成<br>• `deepseekAPI.ts`、`openaiAPI.ts` LLM 调用封装<br>• `locationInsights.ts`（Mapbox）、`eventInsights.ts`（Eventbrite）<br>• `guidesAPI.ts` 等指南/拓展服务 |
| `utils/` | 通用工具：`preparationChecklist.ts`（目的地准备任务）、`geocode.ts`、`travelConstants.ts` 等。 |
| `prompts/` | LLM 提示词模板，按业务拆分。 |
| `llm/` | LLM 客户端封装。 |
| `types/` & `schemas/` & `validators/` | TypeScript 类型、行程 schema 与校验逻辑。 |
| `constants/` | 国家、推荐项等常量。 |
| `locales/` & `i18n.ts` | 国际化文案与初始化。 |

---

## `docs/` 文档

| 文档 | 内容摘要 |
|------|----------|
| `PROJECT_STRUCTURE_GUIDE.md`（本文） | 目录结构与文档说明。 |
| `BACKEND_ARCHITECTURE.md` | 建议的后端服务架构与模块拆分。 |
| `BACKEND_API_GUIDE.md` | 后端 REST 接口设计及数据聚合方案。 |
| `TRAVEL_GUIDES_API.md` | 旅行攻略聚合服务说明。 |
| `EXTERNAL_APIS.md`、`external-integrations.md` | 外部平台集成与环境变量说明。 |
| `PROMPT_USAGE_GUIDE.md` | LLM 提示词设计规范。 |
| `inspiration-mode-flow.md` | 灵感模式流程、调用数据流。 |
| `TEST_GUIDE.md` | 测试策略建议。 |

公开给业务或 QA 使用的文档副本保存在 `public/docs/` 中，可直接通过开发服务器访问。

---

## 数据与缓存

- 行程、任务、安全提示等数据通过 Pinia store 写入 `localStorage`，刷新后仍能保留。
- `ExperienceDay.vue` 会在生成安全提示时，将 AI 返回结果缓存到 `travel.data.safetyNotices`（按语言区分）。

---

## 重要脚本与命令（`package.json`）

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（Vite）。 |
| `npm run build` | 生产构建。 |
| `npm run preview` | 构建产物预览。 |
| `npm run type-check` | `vue-tsc --build`，对编辑器提示之外做类型检查。 |

---

## 研发建议

- 新功能优先在 `services/` 封装 API，再由 `components/` 消费，保持展示层与数据层分离。
- 新增外部服务时同步更新 `docs/EXTERNAL_APIS.md` 并在 `.env.local` 配置说明。
- 所有用户可见文案需加入 `locales`，确保中英文一致。
- 与行程生成相关的提示词变动需同步更新 `prompts/` 与相关文档。

如需进一步了解某块业务，可结合本指南和对应目录下的文档交叉查阅。欢迎在 `docs/` 中补充新模块说明，保持知识同步。 

