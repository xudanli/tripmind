# Google OAuth 2.0 配置指南

## 错误说明

如果遇到 `Error 400: origin_mismatch` 错误，说明在 Google Cloud Console 中没有正确配置"已授权的 JavaScript 来源"（Authorized JavaScript origins）。

## 配置步骤

### 1. 访问 Google Cloud Console

1. 打开 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择你的项目（或创建新项目）
3. 进入 **API 和服务** > **凭据**（Credentials）

### 2. 找到或创建 OAuth 2.0 客户端 ID

1. 在"凭据"页面，找到 **OAuth 2.0 客户端 ID**
2. 如果没有，点击 **+ 创建凭据** > **OAuth 2.0 客户端 ID**
3. 应用类型选择：**Web 应用**

### 3. 配置已授权的 JavaScript 来源

在 OAuth 2.0 客户端配置中，找到 **已授权的 JavaScript 来源**（Authorized JavaScript origins）部分，添加以下来源：

#### 开发环境（本地开发）
```
http://localhost:5173
http://localhost:3000
http://127.0.0.1:5173
http://127.0.0.1:3000
```

#### 生产环境（部署后）
```
https://yourdomain.com
https://www.yourdomain.com
```

**重要提示：**
- 必须包含协议（`http://` 或 `https://`）
- 不能包含路径（不能有 `/login` 等）
- 不能包含端口号（除非是开发环境）
- 不能以斜杠结尾

### 4. 配置已授权的重定向 URI（可选）

如果需要使用重定向流程，还需要配置 **已授权的重定向 URI**（Authorized redirect URIs）：

#### 开发环境
```
http://localhost:5173
http://localhost:5173/login
http://127.0.0.1:5173
http://127.0.0.1:5173/login
```

#### 生产环境
```
https://yourdomain.com
https://yourdomain.com/login
```

**注意：** 对于 Google Identity Services (GSI)，通常不需要配置重定向 URI，因为我们使用的是弹出窗口模式。

### 5. 保存配置

1. 点击 **保存** 或 **创建**
2. 复制生成的 **客户端 ID**（Client ID）
3. 将客户端 ID 添加到 `.env.local` 文件：

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### 6. 重启开发服务器

配置完成后，重启开发服务器：

```bash
npm run dev
```

## 常见问题

### Q: 为什么需要配置 JavaScript 来源？

A: Google OAuth 2.0 要求明确指定哪些域名可以调用 Google 登录 API，这是安全措施，防止未授权的网站使用你的客户端 ID。

### Q: 开发环境应该添加哪些来源？

A: 根据你的开发服务器端口添加：
- Vite 默认端口：`http://localhost:5173`
- 如果使用其他端口，也要添加对应的来源

### Q: 如何查看当前使用的来源？

A: 在浏览器控制台查看错误信息，通常会显示：
```
Error 400: origin_mismatch
The redirect URI in the request, http://localhost:5173, does not match the ones authorized for the OAuth client.
```

### Q: 配置后仍然报错？

A: 检查以下几点：
1. 确保 `.env.local` 中的 `VITE_GOOGLE_CLIENT_ID` 正确
2. 确保添加的来源与浏览器地址栏显示的完全一致（包括协议和端口）
3. 配置保存后可能需要等待几分钟生效
4. 清除浏览器缓存并刷新页面

### Q: 生产环境如何配置？

A: 生产环境需要：
1. 使用 HTTPS（Google 要求）
2. 添加你的实际域名（如 `https://yourdomain.com`）
3. 确保域名已正确解析

## 配置示例

### 完整的 OAuth 2.0 客户端配置示例

**应用名称：** AI Travel Companion

**已授权的 JavaScript 来源：**
```
http://localhost:5173
http://localhost:3000
https://yourdomain.com
```

**已授权的重定向 URI：**（可选，GSI 通常不需要）
```
http://localhost:5173
https://yourdomain.com
```

## 验证配置

配置完成后，可以通过以下方式验证：

1. 打开浏览器开发者工具
2. 访问登录页面
3. 点击 Google 登录按钮
4. 如果配置正确，应该弹出 Google 登录窗口
5. 如果仍然报错，检查控制台中的错误信息

## 相关文档

- [Google Identity Services 文档](https://developers.google.com/identity/gsi/web)
- [OAuth 2.0 客户端配置](https://support.google.com/cloud/answer/6158849)
- [Google Cloud Console](https://console.cloud.google.com/)

