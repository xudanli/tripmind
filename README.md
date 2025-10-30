# 🌍 AI 旅行伴侣（TripMind）

一个基于 Vue 3 + TypeScript + Vite 的智能旅行应用，集成 DeepSeek 等大模型，实现「Planner 计划生成」与「Inspiration 灵感体验」两大模式，并支持国际化与动态多媒体体验。

## ✨ 主要功能

- **Planner 模式（智能行程）**：
  - 多步骤表单（目的地 → 天数 → 预算 → 偏好 → 确认）
  - 自定义要求字段会被纳入 AI 提示词
  - AI 生成含每日 theme/mood/activities 的结构化 JSON 行程
  - 解析健壮：自动修复不规范 JSON、补全天数、降级渲染不崩溃
  - 详情页完全动态：`PlannerHero`、`PlannerTimeline`、`PlannerSidebar`

- **Inspiration 模式（五段式心智流）**：
  - Summon/Reflection/Awakening/Internalization/Transformation 五阶段
  - 动态诗句、呼吸节奏联动、心跳/低语声效
  - 「对话」阶段四大支柱 If… 提问与思考停顿
  - 国家识别：自动推断当前国家与目的地国家

- **其他**：
  - 国际化（i18n）、Pinia 状态管理、Ant Design Vue 组件
  - Unsplash 图片补全、音频反馈、动画细节

## 🛠️ 技术栈

- Vue 3 + TypeScript + Vite
- Pinia / Vue Router / Ant Design Vue
- DeepSeek API（可替换）/ Unsplash API
- 强健的 AI JSON 解析与修复（见 `src/services/plannerAPI.ts`）

## 🚀 快速开始

### 环境要求
- Node.js ≥ 20.19（或 22.12）
- npm（或 pnpm/yarn）

### 克隆与安装
```bash
git clone git@github.com:xudanli/tripmind.git
cd ai-travel-companion
npm install
```

### 本地开发
```bash
npm run dev
```

### 构建与预览
```bash
npm run build
npm run preview
```

## 🔑 环境变量

在项目根目录创建 `.env.local`，根据需要配置：
```
VITE_DEEPSEEK_API_KEY=your_key_here
VITE_UNSPLASH_ACCESS_KEY=your_key_here
```

如使用自建代理或不同模型，参考 `src/services/deepseekAPI.ts`/`src/config/api.ts`。

## 📦 目录与关键文件

```
src/
├─ components/TravelDetail/
│  ├─ PlannerHero.vue / PlannerTimeline.vue / PlannerSidebar.vue
│  ├─ InspirationHero.vue / ExperienceDay.vue
├─ services/
│  ├─ plannerAPI.ts        # 构建提示词、解析/修复 AI JSON、时长补齐
│  ├─ deepseekAPI.ts       # DeepSeek 聊天与灵感旅程生成
├─ stores/travel.ts        # 核心状态（Planner / Inspiration）
├─ utils/countryGuess.ts   # 国家识别工具
└─ views/                  # 视图与多步布局
```

更多细节：
- `PLANNER_AI_INTEGRATION.md`：Planner 提示词与结构
- `UNSPLASH_INTEGRATION.md`：图片获取说明
- `五段式心智流实施计划.md`：Inspiration 阶段设计

## 🧪 开发调试要点

- 若 AI 返回天数不足，`ensureDuration` 会自动补全占位日程。
- 解析失败会逐层尝试：清洗 → 修复换行/引号 → 平衡括号 → 最小可用降级。
- 详情页读取 `plannerItinerary`，确保与生成内容一致。

## 🌐 国际化

语言文件位于 `src/locales/`，默认支持 `zh-CN` 与 `en-US`，可在 `src/i18n.ts` 扩展。

## 🧩 常见问题（FAQ）

- 推送到 GitHub 提示 `Permission denied (publickey)`：
  1) 生成密钥并添加到 GitHub SSH Keys；2) 远程地址使用 SSH：`git@github.com:xudanli/tripmind.git`。
- AI 返回 JSON 不合法：查看控制台清洗日志，或在 `plannerAPI.ts` 中调整修复策略。

## 📄 许可证

MIT License

---

**愿每一次出发，都抵达心中的风景。** ✈️🌍

## 📊 灵感模式覆盖报告

生成目的地覆盖报告（读取 `src/utils/inspirationDb.ts` 的本地数据快照），会输出：

- `public/reports/inspiration-cities.json`：目的地明细（国家、名称、经纬度）
- `public/reports/inspiration-coverage.md`：覆盖统计（国家数、每国计数、目的地清单）

运行命令：

```bash
npm run report:inspiration
```

生成后可通过本地 dev 服务器直接访问（如 `/reports/inspiration-coverage.md`）。