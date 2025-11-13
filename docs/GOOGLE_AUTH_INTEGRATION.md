# Google OAuth 登录集成指南

本文档说明如何在项目中使用 Google OAuth 登录功能。

## 功能概述

实现了完整的 Google OAuth 2.0 登录流程：
1. 用户点击 Google 登录按钮
2. Google 弹出 OAuth 授权窗口
3. Google 返回 ID token 给前端
4. 前端发送 token 到后端验证
5. 后端验证成功后返回用户信息
6. 前端保存用户状态并完成登录

## 文件结构

```
src/
├── services/
│   └── googleAuth.ts          # Google OAuth 服务（初始化、配置、验证）
├── components/
│   └── GoogleSignIn.vue       # Google 登录按钮组件
├── stores/
│   └── user.ts                # 用户状态管理（已更新支持 Google 登录）
└── config/
    └── api.ts                 # API 配置（已添加 Google OAuth 端点）
```

## 环境变量配置

在 `.env.local` 文件中添加以下配置：

```env
# Google OAuth 配置
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# 后端 API 配置
VITE_API_BASE_URL=https://api.emotional-travel.com
```

### 获取 Google Client ID

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google Identity Services API（或 Google+ API）
4. 创建 OAuth 2.0 客户端 ID：
   - 应用类型：**Web 应用**
   - **已授权的 JavaScript 来源**（重要！）：
     - 开发环境：`http://localhost:5173`（根据你的开发服务器端口调整）
     - 生产环境：`https://yourdomain.com`
   - **已授权的重定向 URI**（可选，GSI 通常不需要）：
     - 开发环境：`http://localhost:5173`
     - 生产环境：`https://yourdomain.com`
5. 复制客户端 ID 到 `.env.local`

**⚠️ 重要提示：**
- 必须配置"已授权的 JavaScript 来源"，否则会出现 `origin_mismatch` 错误
- 来源必须包含协议（`http://` 或 `https://`）
- 不能包含路径或端口号（开发环境除外）
- 配置保存后可能需要等待几分钟生效

详细配置步骤请参考：[GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)

## 使用方法

### 方法 1：使用 GoogleSignIn 组件（推荐）

```vue
<template>
  <div>
    <GoogleSignIn
      @success="handleLoginSuccess"
      @error="handleLoginError"
    />
  </div>
</template>

<script setup lang="ts">
import { GoogleSignIn } from '@/components/GoogleSignIn.vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

const handleLoginSuccess = async (userInfo: any) => {
  // userInfo 已经包含后端验证后的用户信息
  // userStore 已经自动更新
  console.log('登录成功:', userInfo)
  
  // 跳转到目标页面
  if (userStore.pendingIntent) {
    const intent = userStore.pendingIntent
    userStore.clearIntent()
    
    if (intent.mode === 'planner') {
      router.push('/planner')
    } else if (intent.mode === 'seeker') {
      router.push('/seeker')
    } else {
      router.push('/inspiration')
    }
  } else {
    router.push('/travel-list')
  }
}

const handleLoginError = (error: Error) => {
  console.error('登录失败:', error)
  // 显示错误提示
  message.error('登录失败: ' + error.message)
}
</script>
```

### 方法 2：在 Modal 中使用

```vue
<template>
  <a-modal v-model:open="visible" title="登录" @ok="handleOk">
    <GoogleSignIn
      @success="handleLoginSuccess"
      @error="handleLoginError"
    />
  </a-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { GoogleSignIn } from '@/components/GoogleSignIn.vue'
import { useUserStore } from '@/stores/user'

const visible = ref(false)
const userStore = useUserStore()

const handleLoginSuccess = (userInfo: any) => {
  visible.value = false
  // 处理登录成功逻辑
}

const handleLoginError = (error: Error) => {
  console.error('登录失败:', error)
}

const handleOk = () => {
  // Modal 的确定按钮（可选）
}
</script>
```

### 方法 3：直接使用服务（高级用法）

```typescript
import { 
  initializeGoogleSignIn,
  configureGoogleSignIn,
  renderGoogleSignInButton,
  verifyGoogleToken
} from '@/services/googleAuth'
import { useUserStore } from '@/stores/user'

// 初始化
await initializeGoogleSignIn()

// 配置
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
configureGoogleSignIn(clientId, async (response) => {
  const userStore = useUserStore()
  await userStore.loginWithGoogle(response.credential)
})

// 渲染按钮
renderGoogleSignInButton('my-button-id')
```

## 组件 Props

`GoogleSignIn` 组件支持以下 props：

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `theme` | `'outline' \| 'filled_blue' \| 'filled_black'` | `'outline'` | 按钮主题 |
| `size` | `'large' \| 'medium' \| 'small'` | `'large'` | 按钮大小 |
| `text` | `'signin_with' \| 'signup_with' \| 'continue_with' \| 'signin'` | `'signin_with'` | 按钮文本 |
| `shape` | `'rectangular' \| 'pill' \| 'circle' \| 'square'` | `'rectangular'` | 按钮形状 |
| `logoAlignment` | `'left' \| 'center'` | `'left'` | Logo 对齐方式 |

## 事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `success` | `userInfo: any` | 登录成功，返回后端验证后的用户信息 |
| `error` | `error: Error` | 登录失败，返回错误对象 |

## 后端 API 要求

后端需要实现 `/auth/google/verify` 端点：

### 请求格式

```http
POST /auth/google/verify
Content-Type: application/json

{
  "token": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij..."
}
```

### 响应格式（成功）

```json
{
  "id": "123456789",
  "sub": "123456789",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "picture": "https://lh3.googleusercontent.com/...",
  "email_verified": true
}
```

### 响应格式（失败）

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Invalid token",
  "message": "Token verification failed"
}
```

### 后端验证步骤

1. 接收前端发送的 ID token
2. 使用 Google 的验证库验证 token（例如：Node.js 使用 `google-auth-library`）
3. 验证 token 的有效性、过期时间、签名等
4. 从 token 中提取用户信息
5. 可选：在数据库中查找或创建用户记录
6. 返回用户信息给前端

### Node.js 后端示例

```javascript
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post('/auth/google/verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    // 验证 token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    
    // 返回用户信息
    res.json({
      id: payload.sub,
      sub: payload.sub,
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      email_verified: payload.email_verified,
    });
  } catch (error) {
    res.status(401).json({
      error: 'Invalid token',
      message: error.message,
    });
  }
});
```

## 用户状态管理

用户登录后，状态会自动保存到：
- Pinia store (`useUserStore`)
- localStorage（用于页面刷新后恢复状态）

### 检查登录状态

```typescript
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

if (userStore.isLoggedIn) {
  console.log('用户已登录:', userStore.user)
} else {
  console.log('用户未登录')
}
```

### 登出

```typescript
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
userStore.logout()
```

## 更新现有代码

### 更新 HomeView.vue

将现有的 `showLoginModal` 函数更新为使用 `GoogleSignIn` 组件：

```vue
<template>
  <!-- ... -->
  <a-modal v-model:open="loginModalVisible" :title="t('login.title')">
    <GoogleSignIn
      @success="handleGoogleLoginSuccess"
      @error="handleGoogleLoginError"
    />
  </a-modal>
</template>

<script setup lang="ts">
import GoogleSignIn from '@/components/GoogleSignIn.vue'
// ... 其他导入

const loginModalVisible = ref(false)

const showLoginModal = (mode: 'planner' | 'seeker' | 'inspiration') => {
  userStore.saveIntent({ mode })
  loginModalVisible.value = true
}

const handleGoogleLoginSuccess = async (userInfo: any) => {
  loginModalVisible.value = false
  
  const intent = userStore.pendingIntent
  if (intent) {
    userStore.clearIntent()
    if (intent.mode === 'planner') router.push('/planner')
    else if (intent.mode === 'seeker') router.push('/seeker')
    else router.push('/inspiration')
  } else {
    router.push('/travel-list')
  }
}

const handleGoogleLoginError = (error: Error) => {
  console.error('登录失败:', error)
  message.error('登录失败: ' + error.message)
}
</script>
```

## 故障排除

### 1. "Google Identity Services 未初始化"

**原因：** Google Identity Services 脚本未加载完成

**解决：** 确保 `initializeGoogleSignIn()` 在组件挂载后调用

### 2. "未配置 VITE_GOOGLE_CLIENT_ID"

**原因：** 环境变量未设置

**解决：** 在 `.env.local` 中添加 `VITE_GOOGLE_CLIENT_ID`

### 3. "后端验证失败: 401"

**原因：** 
- Token 无效或已过期
- 后端验证逻辑有误
- Client ID 不匹配

**解决：** 
- 检查后端验证逻辑
- 确保前后端使用相同的 Client ID
- 检查 token 是否在有效期内

### 4. CORS 错误

**原因：** 后端未配置 CORS

**解决：** 在后端添加 CORS 中间件，允许前端域名访问

## 安全注意事项

1. **永远不要在前端存储敏感信息**
2. **ID token 必须发送到后端验证**，不要仅在前端解析使用
3. **使用 HTTPS** 在生产环境中
4. **验证 token 的签名和过期时间**
5. **检查 token 的 audience（aud）字段**，确保匹配你的 Client ID

## 参考资源

- [Google Identity Services 文档](https://developers.google.com/identity/gsi/web)
- [Google OAuth 2.0 文档](https://developers.google.com/identity/protocols/oauth2)
- [Google Auth Library (Node.js)](https://github.com/googleapis/google-auth-library-nodejs)

