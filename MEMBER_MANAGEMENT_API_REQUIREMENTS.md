# 旅伴管理接口需求文档

## 概述

本文档描述了前端旅伴管理功能所需的所有后端接口。这些接口用于实现行程成员（旅伴）的完整管理功能，包括成员的增删改查、邀请成员、成员统计等。

**基础路径：** `/api/v1/journeys/{journeyId}/members`

**认证：** 所有接口都需要 JWT Token（Bearer Token）

**Content-Type：** `application/json`

---

## 接口列表

### 1. 获取成员列表 ✅ 必须实现

**接口路径：** `GET /api/v1/journeys/{journeyId}/members`

**接口描述：** 获取指定行程的所有成员列表

**调用时机：**
- 打开旅伴管理页面时
- 成员列表发生变化后刷新时

**路径参数：**
- `journeyId` (string, 必填): 行程ID（UUID）

**响应格式：**
```json
{
  "success": true,
  "data": [
    {
      "id": "member_001",
      "name": "张三",
      "email": "zhangsan@example.com",
      "role": "owner",
      "userId": "user_001",
      "createdAt": "2025-11-25T10:00:00.000Z",
      "updatedAt": "2025-11-25T10:00:00.000Z"
    }
  ]
}
```

**字段说明：**
- `id`: 成员ID（UUID）
- `name`: 成员名称
- `email`: 成员邮箱（可选）
- `role`: 角色（`owner` | `admin` | `member`）
- `userId`: 关联的用户ID（如果成员已注册，否则为 null）
- `createdAt`: 创建时间（ISO 8601格式）
- `updatedAt`: 更新时间（ISO 8601格式）

**错误响应：**
- `404`: 行程不存在
- `403`: 无权访问此行程的成员列表

---

### 2. 邀请成员 ✅ 必须实现

**接口路径：** `POST /api/v1/journeys/{journeyId}/members/invite`

**接口描述：** 通过邮箱邀请成员加入行程

**调用时机：**
- 用户点击"邀请成员"按钮并填写表单后提交时

**路径参数：**
- `journeyId` (string, 必填): 行程ID（UUID）

**请求体：**
```json
{
  "email": "newmember@example.com",
  "role": "member",
  "message": "欢迎加入我们的冰岛之旅！"
}
```

**字段说明：**
- `email` (string, 必填): 被邀请人的邮箱地址
- `role` (string, 可选): 角色（`member` | `admin`），默认 `member`
- `message` (string, 可选): 邀请消息（最多500字符）

**响应格式：**
```json
{
  "success": true,
  "message": "邀请已发送",
  "data": {
    "id": "inv_123456",
    "email": "newmember@example.com",
    "role": "member",
    "status": "pending",
    "expiresAt": "2025-12-02T10:00:00.000Z"
  }
}
```

**错误响应：**
- `400`: 邮箱格式不正确、角色无效
- `403`: 无权邀请成员到此行程
- `409`: 该邮箱已被邀请或已是成员

---

### 3. 添加成员 ✅ 建议实现

**接口路径：** `POST /api/v1/journeys/{journeyId}/members`

**接口描述：** 直接添加成员到行程（无需邀请流程）

**调用时机：**
- 当用户接受邀请后自动调用
- 管理员直接添加成员时

**路径参数：**
- `journeyId` (string, 必填): 行程ID（UUID）

**请求体：**
```json
{
  "name": "新成员",
  "email": "newmember@example.com",
  "role": "member",
  "userId": "user_003"
}
```

**字段说明：**
- `name` (string, 必填): 成员名称
- `email` (string, 可选): 成员邮箱
- `role` (string, 可选): 角色（`member` | `admin`），默认 `member`
- `userId` (string, 可选): 关联的用户ID（如果成员已注册）

**响应格式：**
```json
{
  "success": true,
  "message": "成员添加成功",
  "data": {
    "id": "member_004",
    "name": "新成员",
    "email": "newmember@example.com",
    "role": "member",
    "userId": "user_003",
    "createdAt": "2025-11-25T13:00:00.000Z",
    "updatedAt": "2025-11-25T13:00:00.000Z"
  }
}
```

**错误响应：**
- `400`: 成员名称不能为空、邮箱格式不正确
- `403`: 无权添加成员到此行程
- `409`: 该用户已是此行程的成员

---

### 4. 更新成员信息 ✅ 建议实现

**接口路径：** `PATCH /api/v1/journeys/{journeyId}/members/{memberId}`

**接口描述：** 更新成员信息（如修改角色、名称等）

**调用时机：**
- 管理员修改成员角色时
- 更新成员名称或邮箱时

**路径参数：**
- `journeyId` (string, 必填): 行程ID（UUID）
- `memberId` (string, 必填): 成员ID（UUID）

**请求体：**
所有字段都是可选的，只传入需要更新的字段即可。
```json
{
  "name": "更新后的名称",
  "role": "admin",
  "email": "updated@example.com"
}
```

**字段说明：**
- `name` (string, 可选): 成员名称
- `role` (string, 可选): 角色（`admin` | `member`）
- `email` (string, 可选): 成员邮箱

**响应格式：**
```json
{
  "success": true,
  "message": "成员信息更新成功",
  "data": {
    "id": "member_002",
    "name": "李四",
    "email": "lisi@example.com",
    "role": "admin",
    "userId": "user_002",
    "createdAt": "2025-11-25T11:00:00.000Z",
    "updatedAt": "2025-11-25T14:00:00.000Z"
  }
}
```

**错误响应：**
- `400`: 角色必须是 admin 或 member、不能将 owner 角色修改为其他角色
- `403`: 无权修改此成员信息
- `404`: 成员不存在

---

### 5. 移除成员 ✅ 必须实现

**接口路径：** `DELETE /api/v1/journeys/{journeyId}/members/{memberId}`

**接口描述：** 从行程中移除成员

**调用时机：**
- 管理员点击"移除成员"按钮并确认时
- 成员自己退出行程时

**路径参数：**
- `journeyId` (string, 必填): 行程ID（UUID）
- `memberId` (string, 必填): 成员ID（UUID）

**响应格式：**
```json
{
  "success": true,
  "message": "成员已移除"
}
```

**错误响应：**
- `403`: 无权移除此成员、不能移除行程所有者
- `404`: 成员不存在或不属于此行程

---

## 权限说明

### 角色权限矩阵

| 操作 | owner | admin | member |
|------|-------|-------|--------|
| 查看成员列表 | ✅ | ✅ | ✅ |
| 邀请成员 | ✅ | ✅ | ❌ |
| 添加成员 | ✅ | ✅ | ❌ |
| 更新成员信息 | ✅ | ✅（仅限非owner成员） | ❌ |
| 移除成员 | ✅ | ✅（仅限非owner成员） | ✅（仅限自己） |

### 特殊规则

1. **owner 角色：**
   - 不能修改自己的角色
   - 不能被移除
   - 拥有所有权限

2. **admin 角色：**
   - 可以管理普通成员（member）
   - 不能管理 owner
   - 不能修改其他 admin 的角色（除非自己是 owner）

3. **member 角色：**
   - 只能查看成员列表
   - 可以移除自己（退出行程）

---

## 前端功能说明

### 1. 成员列表显示
- 显示所有成员的头像、名称、角色标签
- 显示每个成员的任务数和成本统计（前端计算）
- 支持下拉菜单操作（分配任务、查看成本分摊、移除成员）

### 2. 邀请成员
- 通过邮箱邀请新成员
- 可选择角色（member/admin）
- 可添加邀请消息

### 3. 任务分配
- **注意：** 任务分配功能通过更新任务接口实现，不是成员管理接口
- 接口路径：`PATCH /api/v1/journeys/{journeyId}/tasks/{taskId}`
- 请求体包含 `assignedTo` 字段（成员ID）

### 4. 成本分摊
- **注意：** 成本分摊功能目前是前端计算和存储
- 如果需要后端持久化，建议使用预算管理相关接口
- 接口路径：`POST /api/v1/journeys/{journeyId}/expenses`（如果存在）

---

## 数据模型

### Member 实体

```typescript
interface Member {
  id: string                    // 成员ID（UUID）
  name: string                  // 成员名称
  email?: string                // 成员邮箱（可选）
  role: 'owner' | 'admin' | 'member'  // 角色
  userId?: string | null        // 关联的用户ID（如果已注册）
  journeyId: string            // 所属行程ID
  createdAt: string            // 创建时间（ISO 8601）
  updatedAt: string            // 更新时间（ISO 8601）
}
```

### Invitation 实体（邀请）

```typescript
interface Invitation {
  id: string                   // 邀请ID（UUID）
  journeyId: string            // 行程ID
  email: string                // 被邀请人邮箱
  role: 'member' | 'admin'     // 分配的角色
  message?: string             // 邀请消息（可选）
  status: 'pending' | 'accepted' | 'expired'  // 邀请状态
  invitedBy: string            // 邀请人ID
  expiresAt: string            // 过期时间（ISO 8601）
  createdAt: string            // 创建时间（ISO 8601）
  updatedAt: string            // 更新时间（ISO 8601）
}
```

---

## 接口优先级

### P0 - 必须实现（核心功能）
1. ✅ **获取成员列表** - `GET /api/v1/journeys/{journeyId}/members`
2. ✅ **邀请成员** - `POST /api/v1/journeys/{journeyId}/members/invite`
3. ✅ **移除成员** - `DELETE /api/v1/journeys/{journeyId}/members/{memberId}`

### P1 - 建议实现（完整功能）
4. ✅ **添加成员** - `POST /api/v1/journeys/{journeyId}/members`
5. ✅ **更新成员信息** - `PATCH /api/v1/journeys/{journeyId}/members/{memberId}`

---

## 注意事项

1. **邀请流程：**
   - 邀请发送后，被邀请人需要通过邮件中的链接接受邀请
   - 邀请有有效期（建议7天）
   - 如果被邀请人已注册，可以直接加入；如果未注册，需要先注册

2. **成员限制：**
   - 建议设置每个行程的最大成员数（如20人）
   - owner 角色只能有一个

3. **数据一致性：**
   - 移除成员时，需要处理该成员分配的任务（建议取消分配或重新分配）
   - 移除成员时，需要处理该成员相关的支出记录（建议保留记录但标记为已移除）

4. **性能优化：**
   - 成员列表接口可以支持分页（如果成员数量较多）
   - 统计信息可以缓存，避免每次请求都计算

5. **安全性：**
   - 验证用户是否有权限操作指定的行程
   - 验证成员是否属于指定的行程
   - 防止权限提升攻击（如普通成员尝试将自己提升为 admin）

---

## 测试用例建议

### 1. 获取成员列表
- ✅ 正常获取列表
- ✅ 空列表（新行程）
- ✅ 无权限访问
- ✅ 行程不存在

### 2. 邀请成员
- ✅ 正常邀请
- ✅ 邮箱格式错误
- ✅ 重复邀请
- ✅ 无权限邀请

### 3. 添加成员
- ✅ 正常添加
- ✅ 必填字段缺失
- ✅ 重复添加
- ✅ 无权限添加

### 4. 更新成员信息
- ✅ 正常更新
- ✅ 部分更新
- ✅ 无权限更新
- ✅ 尝试修改 owner 角色

### 5. 移除成员
- ✅ 正常移除
- ✅ 移除 owner（应失败）
- ✅ 移除不存在的成员
- ✅ 无权限移除

---

## 相关接口

### 任务管理接口（用于任务分配）
- 更新任务：`PATCH /api/v1/journeys/{journeyId}/tasks/{taskId}`
- 请求体包含 `assignedTo` 字段（成员ID）

### 预算管理接口（用于成本分摊，可选）
- 如果成本分摊需要后端持久化，建议使用预算管理相关接口
- 接口路径：`POST /api/v1/journeys/{journeyId}/expenses`（如果存在）

---

## 更新日志

- **2025-01-XX**: 初始版本，包含所有基础成员管理接口需求

