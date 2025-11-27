# 邀请链接问题排查指南

## 问题描述

当用户点击邀请邮件中的链接时，可能会遇到以下错误：

```
{"head":{"ret":-5002,"cgi":"xmspamchecklogicsvr/xmsafejump","time":1764259118,"msg":"","stack":"Invalid url"}}
```

这是 **QQ邮箱的安全检查服务** 返回的错误，表示链接被拦截。

## 问题原因

### 1. 链接指向 localhost 或内网地址
QQ邮箱的安全检查会拦截指向本地地址（如 `localhost`、`127.0.0.1`）或内网地址的链接，认为这些链接不安全。

### 2. 链接格式问题
- URL 中包含特殊字符未正确编码
- URL 过长或格式不规范
- 缺少必要的协议（http/https）

### 3. 域名未备案或未认证
如果使用自定义域名，QQ邮箱可能会检查域名的可信度。

## 解决方案

### 方案1：使用公网域名（推荐）

**后端配置：**

1. 确保邀请链接使用公网可访问的域名，而不是 `localhost`：
   ```typescript
   // ❌ 错误示例
   const inviteUrl = `http://localhost:5173/invite/${invitationId}`
   
   // ✅ 正确示例
   const inviteUrl = `https://your-domain.com/invite/${invitationId}`
   ```

2. 在环境变量中配置前端域名：
   ```env
   FRONTEND_URL=https://your-domain.com
   ```

3. 生成邀请链接时使用配置的域名：
   ```typescript
   const frontendUrl = process.env.FRONTEND_URL || 'https://your-domain.com'
   const inviteUrl = `${frontendUrl}/invite/${invitationId}?journeyId=${journeyId}&email=${email}&role=${role}`
   ```

### 方案2：使用 URL 短链接服务

如果暂时无法使用公网域名，可以使用 URL 短链接服务：

1. 使用短链接服务（如 bit.ly、tinyurl.com）将 localhost 链接转换为短链接
2. 在邮件中发送短链接而不是直接链接

**注意：** 这种方法只是临时解决方案，建议尽快使用公网域名。

### 方案3：使用测试邮箱

在开发阶段，可以使用其他邮箱服务（如 Gmail、Outlook）进行测试，这些服务对 localhost 链接的限制较少。

### 方案4：配置邮件服务白名单

如果必须使用 localhost 进行测试，可以：
1. 在 QQ邮箱设置中添加域名白名单（如果支持）
2. 使用邮件客户端（如 Outlook、Thunderbird）而不是网页版邮箱

## 前端实现

### 接受邀请页面

已创建 `/invite/:invitationId` 路由和 `AcceptInvitationView.vue` 组件，用于处理邀请链接。

**URL 格式：**
```
https://your-domain.com/invite/{invitationId}?journeyId={journeyId}&email={email}&role={role}&journeyName={journeyName}&message={message}
```

**参数说明：**
- `invitationId`: 邀请ID（必需）
- `journeyId`: 行程ID（必需）
- `email`: 被邀请人邮箱（可选）
- `role`: 角色（可选，默认 'member'）
- `journeyName`: 行程名称（可选）
- `message`: 邀请消息（可选）

### 使用示例

**后端生成邀请链接：**
```typescript
const invitationId = 'inv_123456'
const journeyId = 'journey_789'
const email = 'user@example.com'
const role = 'member'
const journeyName = '冰岛之旅'

const inviteUrl = `${FRONTEND_URL}/invite/${invitationId}?` +
  `journeyId=${encodeURIComponent(journeyId)}&` +
  `email=${encodeURIComponent(email)}&` +
  `role=${encodeURIComponent(role)}&` +
  `journeyName=${encodeURIComponent(journeyName)}`
```

## 后端 API 建议

### 验证邀请接口（建议实现）

```typescript
// GET /api/v1/invitations/:invitationId
// 验证邀请有效性，返回邀请信息
interface VerifyInvitationResponse {
  success: boolean
  data: {
    invitationId: string
    journeyId: string
    email: string
    role: string
    status: 'pending' | 'accepted' | 'expired'
    expiresAt: string
    journeyName?: string
    message?: string
  }
}
```

前端可以调用此接口验证邀请，而不是从 URL 参数获取信息。

## 测试建议

1. **开发环境：**
   - 使用公网域名或内网穿透工具（如 ngrok）
   - 使用其他邮箱服务测试

2. **生产环境：**
   - 确保使用 HTTPS
   - 使用已备案的域名
   - 配置正确的 CORS 和 CSP 策略

## 常见问题

### Q: 为什么 Gmail 可以打开，但 QQ邮箱不行？
A: 不同邮箱服务的安全策略不同。QQ邮箱对 localhost 和内网地址的限制更严格。

### Q: 可以使用 IP 地址吗？
A: 不推荐。QQ邮箱可能会拦截 IP 地址链接。建议使用域名。

### Q: 如何快速测试邀请功能？
A: 可以使用内网穿透工具（如 ngrok）将 localhost 映射到公网地址，或使用测试邮箱服务。

## 相关文件

- 接受邀请页面：`src/views/AcceptInvitationView.vue`
- 路由配置：`src/router/index.ts`
- 成员管理组件：`src/components/TravelDetail/MemberManagement.vue`
- 成员 API：`src/services/itineraryAPI.ts`

