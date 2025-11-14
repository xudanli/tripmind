# Google OAuth 登录集成指南（后端托管版）

前端已经切换为“后端托管”模式：所有 OAuth 协议细节全部由服务器处理，浏览器只负责跳转、等待回调，并通过 HttpOnly Cookie 维护会话。本指南描述新的接入方式。

---

## 1. 登录流程概览

1. 用户点击“使用 Google 账号登录”按钮。
2. 前端直接跳转到后端 `/api/auth/google`（或部署域名下的等价路径）。
3. 后端发起 Google 授权、获取用户信息，并写入 `app_session`（HttpOnly Cookie）。
4. 后端将用户重定向回 `FRONTEND_ORIGIN`（携带可选的 `redirect` 参数）。
5. 前端加载时调用 `/api/auth/me`，如果返回 200，即表示已登录，可获得用户资料。

> 重点：前端不再需要 `GoogleSignIn` 组件、也不需要管理 ID Token/JWT。所有登录状态通过 Cookie 维护，请求时设置 `credentials: 'include'` 即可。

---

## 2. 关键代码位置

```
src/
├── stores/
│   └── user.ts                # Pinia 用户状态（含 login redirect、/auth/me 调用）
├── services/
│   └── authAPI.ts             # 封装 redirect、/auth/me、/auth/logout
├── views/
│   ├── HomeView.vue           # 登录入口（按钮跳转）
│   └── LoginView.vue          # 登录页 & 登录后重定向逻辑
└── config/
    └── api.ts                 # API 基础地址及认证端点
```

---

## 3. 环境变量

```env
# 后端 API 配置（必须指向包含 /api 的域名，例如 http://localhost:3000/api）
VITE_API_BASE_URL=https://api.emotional-travel.com/api

# （可选）启用开发者离线登录
VITE_ENABLE_DEV_LOGIN=true
VITE_AUTH_MODE=mock
```

如需后端自行拼接完整登录地址，可额外提供 `VITE_AUTH_BASE_URL` 等扩展字段，在 `authAPI.ts` 中拼接。

---

## 4. 前端调用方式

### 4.1 触发登录

```ts
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 在按钮点击时调用
const handleLogin = () => {
  const currentPath = route.fullPath || '/travel-list'
  userStore.startLogin(currentPath)  // 内部执行 window.location.href = `<API>/auth/google?redirect=...`
}
```

### 4.2 会话检测

`userStore` 会在应用初始化时调用 `/api/auth/me`：

```ts
const { user, isLoggedIn } = useUserStore()

watchEffect(() => {
  if (isLoggedIn.value) {
    console.log('当前用户：', user.value)
  }
})
```

`authAPI.fetchCurrentUser()` 自动附带 `credentials: 'include'`，所以浏览器会在同域或跨域（需要 CORS + Allow-Credentials）的情况下附上 `app_session` Cookie。

### 4.3 退出登录

```ts
const handleLogout = async () => {
  await userStore.logout()          // 调用 /api/auth/logout 并清理本地状态
  router.push('/login')
}
```

---

## 5. API 端点约定

| HTTP 方法 | 路径                | 说明                     |
|-----------|---------------------|--------------------------|
| GET       | `/api/auth/google`  | 跳转到 Google OAuth（后端托管） |
| GET       | `/api/auth/me`      | 返回当前登录用户信息（401 表示未登录） |
| POST      | `/api/auth/logout`  | 注销当前会话，清除 Cookie |

响应示例（`/api/auth/me`）：

```json
{
  "id": "user-123",
  "email": "user@example.com",
  "nickname": "Traveler",
  "avatarUrl": "https://lh3.googleusercontent.com/..."
}
```

后端必须设置：

- `Set-Cookie: app_session=...; HttpOnly; Secure; SameSite=None`（跨域场景）
- `Access-Control-Allow-Credentials: true`，并允许 `FRONTEND_ORIGIN`

---

## 6. 组件/服务更新要点

1. **移除 `GoogleSignIn.vue`、`googleAuth.ts` 等前端 SDK 依赖。**
2. `authAPI.ts` 新增三个核心方法：
   - `redirectToGoogleLogin(redirectPath?: string)`
   - `fetchCurrentUser()` — GET `/auth/me`
   - `logoutSession()` — POST `/auth/logout`
3. `userStore`：
   - `startLogin()` 内部调用 redirect。
   - `restoreUser()` 页面加载时调用 `/auth/me` 并更新 Pinia。
   - 登出时触发后端 `/auth/logout`，再清理本地缓存。
   - 保留 `devLogin` 逻辑作为无法访问 Google 时的临时方案。
4. 所有依赖认证的请求需带 `credentials: 'include'`（参见 `journeyTemplates.ts`、`visaAPI.ts`、`emotionalTravelAPI.ts` 等示例）。

---

## 7. 常见问题 & 排查

### 7.1 重定向后仍显示未登录
- 浏览器未携带 `app_session`：检查后端 CORS、`SameSite=None`、是否 HTTPS。
- `/api/auth/me` 返回 401：会话过期或 Cookie 路径不匹配。
- 解决：确认后端日志，检查 `Set-Cookie` 是否到达浏览器（可在 DevTools → Network → Response Headers 查看）。

### 7.2 跨域请求被拒绝
- 需确保后端返回头包含：
  ```
  Access-Control-Allow-Origin: https://localhost:5173
  Access-Control-Allow-Credentials: true
  ```
- 前端 fetch/axios 必须设置 `credentials: 'include'` 或 `withCredentials: true`。

### 7.3 无法访问 Google，如何调试？
- 在 `.env.local` 中启用 `VITE_ENABLE_DEV_LOGIN=true` 或 `VITE_AUTH_MODE=mock`。
- 登录页/首页会显示“使用临时体验账号继续”按钮，直接写入本地 mock 用户，方便开发。

### 7.4 如何指定登录后回跳页面？
- 调用 `userStore.startLogin(redirectPath)` 时传入完整路径，例如：
  ```ts
  userStore.startLogin('/planner')
  ```
- 后端应读取 `redirect` 查询参数，并在授权成功后重定向回 `${FRONTEND_ORIGIN}${redirect}`。

---

## 8. 与旧实现的差异

| 旧方案（前端 GSI） | 新方案（后端托管） |
| ------------------ | ------------------- |
| 前端嵌入 Google SDK，渲染按钮 | 前端只渲染普通按钮 |
| GSI 返回 ID Token → 前端调用 `/auth/google` | 直接跳转 `/auth/google`，由后端同 Google 交互 |
| 前端保存 JWT 到 `localStorage` | 后端写入 HttpOnly Cookie，会话透明 |
| 每个请求带 `Authorization` 头 | 每个请求 `credentials: 'include'`，后端读 Cookie |

> 迁移完成后，务必删除残余的 `googleAuth.ts`、`GoogleSignIn.vue`、`loginWithGoogle` 等旧代码，避免二义性。

---

## 9. 参考

- [Google Identity Services](https://developers.google.com/identity/gsi/web)（后端仍需配置 OAuth Client）
- [SameSite Cookie 说明](https://developer.mozilla.org/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [CORS with Credentials](https://developer.mozilla.org/docs/Web/HTTP/CORS)

如需进一步扩展（例如多身份提供商、短信登录），可在此基础上新增 `/api/auth/{provider}`，前端只需复用 `userStore.startLogin()`。

