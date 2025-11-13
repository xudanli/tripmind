# 故障排除指南

## Google OAuth 登录问题

### 问题 1: `Error 400: origin_mismatch`

**原因：** Google Cloud Console 中未配置"已授权的 JavaScript 来源"

**解决方案：**
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 进入：API 和服务 > 凭据
3. 编辑你的 OAuth 2.0 客户端 ID
4. 在"已授权的 JavaScript 来源"中添加：
   - 开发环境：`http://localhost:5173`（根据实际端口调整）
   - 生产环境：`https://yourdomain.com`

详细步骤请参考：[GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)

---

### 问题 2: `Cannot POST /api/api/auth/google`（重复的 /api）

**原因：** `VITE_API_BASE_URL` 环境变量可能已包含 `/api`，导致 URL 拼接时重复

**解决方案：**

#### 方案 1：修改环境变量（推荐）

在 `.env.local` 中，确保 `VITE_API_BASE_URL` **不包含** `/api`：

```env
# ✅ 正确
VITE_API_BASE_URL=http://localhost:3000
# 或
VITE_API_BASE_URL=https://api.emotional-travel.com

# ❌ 错误（会导致 /api/api/auth/google）
VITE_API_BASE_URL=http://localhost:3000/api
```

#### 方案 2：修改端点配置

如果后端 API 基础 URL 必须包含 `/api`，可以修改端点配置：

在 `src/config/api.ts` 中：

```typescript
ENDPOINTS: {
  // 如果 BASE_URL 已经包含 /api，端点就不需要 /api 前缀
  GOOGLE_AUTH: '/auth/google',  // 而不是 '/api/auth/google'
  AUTH_PROFILE: '/auth/profile', // 而不是 '/api/auth/profile'
}
```

**当前代码已自动处理：** 代码会自动检测并移除 `BASE_URL` 末尾的 `/api`，避免重复。

---

### 问题 3: `403 Forbidden` 或 `The given origin is not allowed`

**原因：** Google OAuth 客户端 ID 配置问题

**解决方案：**
1. 检查 Google Cloud Console 中的"已授权的 JavaScript 来源"
2. 确保添加的来源与浏览器地址栏显示的完全一致
3. 包括协议（`http://` 或 `https://`）
4. 开发环境可以包含端口号
5. 配置保存后等待 1-2 分钟生效

---

### 问题 4: `ERR_PROXY_CONNECTION_FAILED`

**原因：** 网络连接问题（代理、防火墙等）

**解决方案：**
1. 检查网络连接
2. 检查代理设置
3. 检查防火墙是否阻止访问 Google 服务
4. 如果无法访问 Google 服务，可能需要使用 VPN 或更换网络环境

---

## 后端 API 问题

### 问题 5: `404 Not Found` 或 `Cannot POST /api/auth/google`

**原因：** 后端 API 端点不存在或 URL 配置错误

**检查清单：**

1. **检查后端服务是否运行**
   ```bash
   # 检查后端服务是否在运行
   curl http://localhost:3000/api/auth/google
   ```

2. **检查环境变量配置**
   ```env
   # .env.local
   VITE_API_BASE_URL=http://localhost:3000
   # 注意：不要包含 /api
   ```

3. **检查后端路由配置**
   - 确保后端有 `/api/auth/google` 端点
   - 检查后端服务是否在正确的端口运行

4. **检查 CORS 配置**
   - 确保后端允许来自前端的跨域请求
   - 检查后端 CORS 配置

---

## 调试技巧

### 查看实际请求的 URL

在浏览器控制台查看网络请求，检查实际发送的 URL：

1. 打开开发者工具 > 网络（Network）标签
2. 尝试登录
3. 查看失败的请求
4. 检查请求 URL 是否正确

### 查看环境变量

在代码中添加调试日志：

```typescript
console.log('BASE_URL:', API_CONFIG.BASE_URL)
console.log('Endpoint:', API_CONFIG.ENDPOINTS.GOOGLE_AUTH)
console.log('Full URL:', fullUrl)
```

### 测试后端 API

使用 curl 或 Postman 测试后端 API：

```bash
curl -X POST http://localhost:3000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"token":"your-google-id-token"}'
```

---

## 常见配置示例

### 开发环境配置

```env
# .env.local
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_API_BASE_URL=http://localhost:3000
```

### 生产环境配置

```env
# .env.production
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_API_BASE_URL=https://api.emotional-travel.com
```

---

## 获取帮助

如果以上方法都无法解决问题，请：

1. 检查浏览器控制台的完整错误信息
2. 检查网络请求的详细信息（URL、状态码、响应内容）
3. 检查后端日志
4. 参考相关文档：
   - [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)
   - [GOOGLE_AUTH_INTEGRATION.md](./GOOGLE_AUTH_INTEGRATION.md)
   - [auth.md](./auth.md)

