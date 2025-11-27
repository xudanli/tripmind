# 创建行程流程测试指南

## 测试步骤

### 1. 启动应用（如果未启动）

```bash
npm run dev
```

### 2. 访问 Planner 页面

打开浏览器访问：`http://localhost:5173/planner`（或应用配置的端口）

### 3. 填写行程信息

按照以下步骤填写：

#### 步骤 1: 选择目的地
- 输入目的地，例如：`冰岛`、`日本`、`巴黎` 等

#### 步骤 2: 选择时间和天数
- 选择行程天数（例如：5天、7天、10天）
- 选择开始日期（必须选择未来日期）

#### 步骤 3: 选择预算和旅行风格
- 选择预算：`low`（低）、`medium`（中）、`high`（高）
- 选择旅行风格：`relaxed`（轻松）、`moderate`（适中）、`intensive`（紧凑）

#### 步骤 4: 提交并生成行程
- 点击"生成行程"按钮
- 等待 AI 生成行程（可能需要几秒到几十秒）

### 4. 验证创建流程

创建流程包含以下步骤，可以在浏览器控制台查看日志：

#### 步骤 1/4: AI 生成行程
- 调用 `POST /api/v1/itinerary/generate` 生成行程
- 日志标识：`🚀 [Planner] 步骤 1/3: 开始生成行程...`
- 成功标识：`✅ [Planner] 步骤 1/3: 行程生成完成`

#### 步骤 2/4: 获取生成的行程数据
- 从 `travelStore.itineraryData` 获取数据
- 日志标识：`📊 [Planner] 步骤 2/3: 获取生成的行程数据...`
- 验证数据包含：`title`、`destination`、`days`、`totalCost`

#### 步骤 3/4: 保存到后端数据库

**3.1 创建基础行程**
- 调用 `POST /api/v1/journeys` 创建基础行程
- 日志标识：`📤 [Planner] 创建基础行程请求数据:`
- 请求数据包含：
  - `destination`: 目的地
  - `startDate`: 开始日期
  - `days`: 天数
  - `data.days`: 至少包含一天的数据（满足后端验证）
  - `preferences`: 偏好设置
  - `status`: 'draft'
- 成功标识：`✅ [Planner] 基础行程已创建，journeyId: {uuid}`

**3.2 使用前端数据格式更新行程**
- 调用 `PATCH /api/v1/journeys/{journeyId}/from-frontend-data` 更新完整行程
- 日志标识：`📤 [Planner] 从前端数据格式更新行程请求数据:`
- 请求数据包含：
  - `itineraryData.days`: 完整的行程天数数据
  - `itineraryData.destination`: 目的地
  - `itineraryData.duration`: 天数
  - `itineraryData.totalCost`: 总费用
  - `itineraryData.summary`: 摘要
  - `startDate`: 开始日期
- 成功标识：`✅ [Planner] 步骤 3/4: 行程已保存到后端`

#### 步骤 4/4: 创建本地 Travel 对象并跳转
- 创建本地 Travel 对象用于立即显示
- 日志标识：`💾 [Planner] 步骤 4/4: 创建 Travel 对象用于显示...`
- 成功标识：`✅ [Planner] 步骤 4/4: Travel 创建成功`
- 跳转到详情页：`/travel/{backendItineraryId}` 或 `/travel/{newTravel.id}`

### 5. 验证结果

#### 5.1 检查后端数据
- 行程应已保存到数据库
- `backendItineraryId` 应为有效的 UUID 格式
- 行程数据应包含完整的 `days` 数组

#### 5.2 检查前端显示
- 应成功跳转到详情页
- 详情页应显示完整的行程信息
- 所有天数数据应正确显示

#### 5.3 检查控制台日志
- 不应有错误日志
- 所有步骤应显示成功标识
- 如果出现错误，查看错误详情

### 6. 常见问题排查

#### 问题 1: "行程数据不能为空：至少需要一天的行程"
- **原因**: 创建基础行程时 `data.days` 为空数组
- **解决**: 已修复，确保至少包含一天的数据

#### 问题 2: "invalid input syntax for type uuid"
- **原因**: 使用前端临时 ID 而不是后端 UUID
- **解决**: 已修复，优先使用 `backendItineraryId` 进行跳转

#### 问题 3: AI 生成失败
- **原因**: AI 服务未配置或网络问题
- **解决**: 检查 AI 服务配置和网络连接

#### 问题 4: 后端接口调用失败
- **原因**: 后端服务未启动或认证失败
- **解决**: 检查后端服务状态和认证配置

### 7. 测试检查清单

- [ ] 应用已启动
- [ ] 可以访问 Planner 页面
- [ ] 可以填写所有表单字段
- [ ] AI 生成行程成功
- [ ] 创建基础行程成功（返回 UUID）
- [ ] 更新完整行程成功
- [ ] 成功跳转到详情页
- [ ] 详情页显示完整数据
- [ ] 控制台无错误日志
- [ ] 后端数据库中有对应记录

### 8. 测试数据示例

```javascript
// 测试用例 1: 基本创建
{
  destination: "冰岛",
  days: 5,
  startDate: "2025-12-01",
  preferences: {
    budget: "medium",
    travelStyle: "moderate"
  }
}

// 测试用例 2: 短途旅行
{
  destination: "日本",
  days: 3,
  startDate: "2025-12-15",
  preferences: {
    budget: "high",
    travelStyle: "intensive"
  }
}

// 测试用例 3: 长途旅行
{
  destination: "欧洲",
  days: 14,
  startDate: "2025-12-20",
  preferences: {
    budget: "high",
    travelStyle: "relaxed"
  }
}
```

## API 调用顺序

1. `POST /api/v1/itinerary/generate` - AI 生成行程
2. `POST /api/v1/journeys` - 创建基础行程（获取 journeyId）
3. `PATCH /api/v1/journeys/{journeyId}/from-frontend-data` - 更新完整行程数据
4. `GET /api/v1/journeys/{journeyId}` - 详情页加载行程数据（跳转后）

## 注意事项

1. **数据格式**: 确保 `data.days` 至少包含一天的数据，满足后端验证要求
2. **ID 格式**: 跳转时优先使用 `backendItineraryId`（UUID），而不是前端临时 ID
3. **错误处理**: 如果后端保存失败，会继续使用临时数据，但会显示警告
4. **数据同步**: 详情页会从后端重新加载数据，确保数据一致性

