# 成员管理接口文档

## 概述

本文档描述了行程成员管理相关的所有接口，包括成员的增删改查、邀请成员、成员统计等功能。

**基础路径：** `/api/v1/journeys/{journeyId}/members`

**认证：** 所有接口都需要 JWT Token（Bearer Token）

---

## 1. 获取成员列表

### 接口信息

**接口路径：** `GET /api/v1/journeys/{journeyId}/members`

**接口描述：** 获取指定行程的所有成员列表

**认证：** 需要 JWT Token（Bearer Token）

---

### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `journeyId` | string | 是 | 行程ID（UUID） |

---

### 请求示例

#### cURL

```bash
curl -X GET "http://localhost:3000/api/v1/journeys/5c3ea7c9-46ef-4476-b37d-32c1a1ec9b2d/members" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### JavaScript/TypeScript

```typescript
const journeyId = '5c3ea7c9-46ef-4476-b37d-32c1a1ec9b2d';

const response = await fetch(`/api/v1/journeys/${journeyId}/members`, {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const result = await response.json();
console.log('成员列表:', result);
```

---

### 响应数据

#### 成功响应（200 OK）

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
    },
    {
      "id": "member_002",
      "name": "李四",
      "email": "lisi@example.com",
      "role": "admin",
      "userId": "user_002",
      "createdAt": "2025-11-25T11:00:00.000Z",
      "updatedAt": "2025-11-25T11:00:00.000Z"
    },
    {
      "id": "member_003",
      "name": "王五",
      "email": "wangwu@example.com",
      "role": "member",
      "userId": null,
      "createdAt": "2025-11-25T12:00:00.000Z",
      "updatedAt": "2025-11-25T12:00:00.000Z"
    }
  ]
}
```

#### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `success` | boolean | 是否成功 |
| `data` | array | 成员列表 |
| `data[].id` | string | 成员ID（UUID） |
| `data[].name` | string | 成员名称 |
| `data[].email` | string | 成员邮箱（可选） |
| `data[].role` | string | 角色：`owner`（所有者）、`admin`（管理员）、`member`（普通成员） |
| `data[].userId` | string \| null | 关联的用户ID（如果成员已注册，否则为 null） |
| `data[].createdAt` | string | 创建时间（ISO 8601格式） |
| `data[].updatedAt` | string | 更新时间（ISO 8601格式） |

---

### 错误响应

#### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "行程不存在: 5c3ea7c9-46ef-4476-b37d-32c1a1ec9b2d",
  "error": "Not Found"
}
```

#### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "无权访问此行程的成员列表",
  "error": "Forbidden"
}
```

---

## 2. 邀请成员

### 接口信息

**接口路径：** `POST /api/v1/journeys/{journeyId}/members/invite`

**接口描述：** 通过邮箱邀请成员加入行程

**认证：** 需要 JWT Token（Bearer Token）

**Content-Type：** `application/json`

---

### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `journeyId` | string | 是 | 行程ID（UUID） |

---

### 请求参数

#### 请求体结构

```json
{
  "email": "newmember@example.com",
  "role": "member",
  "message": "欢迎加入我们的冰岛之旅！"
}
```

#### 字段说明

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `email` | string | 是 | 被邀请人的邮箱地址 |
| `role` | string | 否 | 角色：`member`（普通成员）、`admin`（管理员），默认 `member` |
| `message` | string | 否 | 邀请消息（可选） |

---

### 请求示例

#### cURL

```bash
curl -X POST "http://localhost:3000/api/v1/journeys/5c3ea7c9-46ef-4476-b37d-32c1a1ec9b2d/members/invite" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newmember@example.com",
    "role": "member",
    "message": "欢迎加入我们的冰岛之旅！"
  }'
```

#### JavaScript/TypeScript

```typescript
const journeyId = '5c3ea7c9-46ef-4476-b37d-32c1a1ec9b2d';

const inviteData = {
  email: 'newmember@example.com',
  role: 'member',
  message: '欢迎加入我们的冰岛之旅！',
};

const response = await fetch(`/api/v1/journeys/${journeyId}/members/invite`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(inviteData),
});

const result = await response.json();
console.log('邀请结果:', result);
```

---

### 响应数据

#### 成功响应（200 OK）

```json
{
  "success": true,
  "message": "邀请已发送",
  "data": {
    "invitationId": "inv_123456",
    "email": "newmember@example.com",
    "role": "member",
    "status": "pending",
    "expiresAt": "2025-12-02T10:00:00.000Z"
  }
}
```

#### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `success` | boolean | 是否成功 |
| `message` | string | 提示消息 |
| `data` | object | 邀请信息 |
| `data.invitationId` | string | 邀请ID |
| `data.email` | string | 被邀请人邮箱 |
| `data.role` | string | 分配的角色 |
| `data.status` | string | 邀请状态：`pending`（待接受）、`accepted`（已接受）、`expired`（已过期） |
| `data.expiresAt` | string | 邀请过期时间（ISO 8601格式） |

---

### 错误响应

#### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": [
    "邮箱格式不正确",
    "角色必须是 member 或 admin"
  ],
  "error": "Bad Request"
}
```

#### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "无权邀请成员到此行程",
  "error": "Forbidden"
}
```

#### 409 Conflict

```json
{
  "statusCode": 409,
  "message": "该邮箱已被邀请或已是成员",
  "error": "Conflict"
}
```

---

## 3. 添加成员

### 接口信息

**接口路径：** `POST /api/v1/journeys/{journeyId}/members`

**接口描述：** 直接添加成员到行程（无需邀请流程）

**认证：** 需要 JWT Token（Bearer Token）

**Content-Type：** `application/json`

---

### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `journeyId` | string | 是 | 行程ID（UUID） |

---

### 请求参数

#### 请求体结构

```json
{
  "name": "新成员",
  "email": "newmember@example.com",
  "role": "member",
  "userId": "user_003"
}
```

#### 字段说明

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `name` | string | 是 | 成员名称 |
| `email` | string | 否 | 成员邮箱 |
| `role` | string | 否 | 角色：`member`（普通成员）、`admin`（管理员），默认 `member` |
| `userId` | string | 否 | 关联的用户ID（如果成员已注册） |

---

### 请求示例

#### cURL

```bash
curl -X POST "http://localhost:3000/api/v1/journeys/5c3ea7c9-46ef-4476-b37d-32c1a1ec9b2d/members" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "新成员",
    "email": "newmember@example.com",
    "role": "member",
    "userId": "user_003"
  }'
```

---

### 响应数据

#### 成功响应（200 OK）

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

---

### 错误响应

#### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": [
    "成员名称不能为空",
    "邮箱格式不正确"
  ],
  "error": "Bad Request"
}
```

#### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "无权添加成员到此行程",
  "error": "Forbidden"
}
```

#### 409 Conflict

```json
{
  "statusCode": 409,
  "message": "该用户已是此行程的成员",
  "error": "Conflict"
}
```

---

## 4. 更新成员信息

### 接口信息

**接口路径：** `PATCH /api/v1/journeys/{journeyId}/members/{memberId}`

**接口描述：** 更新成员信息（如修改角色、名称等）

**认证：** 需要 JWT Token（Bearer Token）

**Content-Type：** `application/json`

---

### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `journeyId` | string | 是 | 行程ID（UUID） |
| `memberId` | string | 是 | 成员ID（UUID） |

---

### 请求参数

#### 请求体结构

所有字段都是可选的，只传入需要更新的字段即可。

```json
{
  "name": "更新后的名称",
  "role": "admin",
  "email": "updated@example.com"
}
```

#### 字段说明

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `name` | string | 否 | 成员名称 |
| `role` | string | 否 | 角色：`admin`（管理员）、`member`（普通成员） |
| `email` | string | 否 | 成员邮箱 |

---

### 请求示例

#### cURL

```bash
curl -X PATCH "http://localhost:3000/api/v1/journeys/5c3ea7c9-46ef-4476-b37d-32c1a1ec9b2d/members/member_002" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'
```

---

### 响应数据

#### 成功响应（200 OK）

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

---

### 错误响应

#### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": [
    "角色必须是 admin 或 member",
    "不能将 owner 角色修改为其他角色"
  ],
  "error": "Bad Request"
}
```

#### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "无权修改此成员信息",
  "error": "Forbidden"
}
```

#### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "成员不存在: member_002",
  "error": "Not Found"
}
```

---

## 5. 移除成员

### 接口信息

**接口路径：** `DELETE /api/v1/journeys/{journeyId}/members/{memberId}`

**接口描述：** 从行程中移除成员

**认证：** 需要 JWT Token（Bearer Token）

---

### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `journeyId` | string | 是 | 行程ID（UUID） |
| `memberId` | string | 是 | 成员ID（UUID） |

---

### 请求示例

#### cURL

```bash
curl -X DELETE "http://localhost:3000/api/v1/journeys/5c3ea7c9-46ef-4476-b37d-32c1a1ec9b2d/members/member_003" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### JavaScript/TypeScript

```typescript
const journeyId = '5c3ea7c9-46ef-4476-b37d-32c1a1ec9b2d';
const memberId = 'member_003';

const response = await fetch(`/api/v1/journeys/${journeyId}/members/${memberId}`, {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const result = await response.json();
console.log('删除结果:', result);
```

---

### 响应数据

#### 成功响应（200 OK）

```json
{
  "success": true,
  "message": "成员已移除"
}
```

---

### 错误响应

#### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "无权移除此成员",
  "error": "Forbidden"
}
```

#### 403 Forbidden - 不能移除所有者

```json
{
  "statusCode": 403,
  "message": "不能移除行程所有者",
  "error": "Forbidden"
}
```

#### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "成员不存在或不属于此行程: member_003",
  "error": "Not Found"
}
```

---

## 6. 获取成员统计信息（可选）

### 接口信息

**接口路径：** `GET /api/v1/journeys/{journeyId}/members/stats`

**接口描述：** 获取成员的统计信息（任务数、成本等）

**认证：** 需要 JWT Token（Bearer Token）

**注意：** 如果成员列表接口已包含统计信息，此接口可省略

---

### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `journeyId` | string | 是 | 行程ID（UUID） |

---

### 请求示例

#### cURL

```bash
curl -X GET "http://localhost:3000/api/v1/journeys/5c3ea7c9-46ef-4476-b37d-32c1a1ec9b2d/members/stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 响应数据

#### 成功响应（200 OK）

```json
{
  "success": true,
  "data": {
    "members": [
      {
        "memberId": "member_001",
        "tasksCount": 5,
        "totalCost": 15000,
        "currencyCode": "ISK"
      },
      {
        "memberId": "member_002",
        "tasksCount": 3,
        "totalCost": 8000,
        "currencyCode": "ISK"
      }
    ],
    "summary": {
      "totalMembers": 2,
      "totalTasks": 8,
      "assignedTasks": 8,
      "totalCost": 23000,
      "currencyCode": "ISK"
    }
  }
}
```

---

## 权限说明

### 角色权限

| 操作 | owner | admin | member |
|------|-------|-------|--------|
| 查看成员列表 | ✅ | ✅ | ✅ |
| 邀请成员 | ✅ | ✅ | ❌ |
| 添加成员 | ✅ | ✅ | ❌ |
| 更新成员信息 | ✅ | ✅（仅限非owner成员） | ❌ |
| 移除成员 | ✅ | ✅（仅限非owner成员） | ❌ |
| 移除自己 | ✅ | ✅ | ✅ |

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

## 接口优先级

### 必须实现（P0）
1. ✅ 获取成员列表
2. ✅ 邀请成员
3. ✅ 移除成员

### 建议实现（P1）
4. ✅ 添加成员（直接添加，无需邀请）
5. ✅ 更新成员信息（修改角色等）

### 可选实现（P2）
6. ⚠️ 获取成员统计信息（如果列表接口已包含，可省略）

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

## 更新日志

- **2025-11-25**: 初始版本，包含所有基础成员管理接口

