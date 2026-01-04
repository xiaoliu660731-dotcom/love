# LoveApp 部署指南 - 快速版

## 🚀 3 分钟快速部署

### 前置要求
- ✅ 已有 GitHub 账户
- ✅ 已有 Vercel 账户（可用 GitHub 快速登录）
- ✅ 已安装 Git 和 Node.js

---

## 步骤 1️⃣ : 创建 GitHub 仓库并上传代码

### 方法 A：使用自动脚本（推荐）

**Windows:**
```bash
双击 deploy.bat
```

**Mac/Linux:**
```bash
bash deploy.sh
```

### 方法 B：手动上传

1. 在 GitHub 创建新仓库：
   - 访问 https://github.com/new
   - 名称：`love-app`
   - 选择 `Private`（私密）
   - 点击 `Create repository`

2. 在项目根目录运行：
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/love-app.git
git push -u origin main
```

3. 输入 GitHub 用户名
4. 输入 GitHub Personal Token（从 https://github.com/settings/tokens 生成）

---

## 步骤 2️⃣ : Vercel 部署

1. 访问 https://vercel.com
2. 用 GitHub 账户登录
3. 点击 `Add New...` → `Project`
4. 选择 `Import an Existing Project`
5. 搜索 `love-app` 仓库
6. 点击 `Import`
7. 保持默认设置，点击 `Deploy`
8. **等待 2-5 分钟**

---

## 步骤 3️⃣ : 获取应用链接

部署完成后，你会看到：
```
🎉 Congratulations! Your project has been successfully deployed.
```

复制链接，例如：`https://love-app-abc123.vercel.app`

---

## 步骤 4️⃣ : 在手机上使用

### 方式 1：直接打开（推荐）
1. 在手机浏览器打开：`https://love-app-abc123.vercel.app`
2. 输入密码登录
3. 完成！

### 方式 2：添加到主屏幕
1. 用浏览器打开应用链接
2. Chrome：点击 ⋮ → `安装应用`
3. Safari：点击 ⬆️ → `添加到主屏幕`
4. 给应用命名，点击 `添加`

---

## ✅ 测试流程

### 测试数据同步
1. **女朋友的手机**：
   - 打开同一链接
   - 输入**相同的密码**
   - 应该看到相同的数据

2. **测试写入**：
   - 你的手机：添加日记/消费/计划
   - 女朋友的手机：刷新，应该显示新数据

### 常见问题

| 问题 | 解决方案 |
|-----|--------|
| 显示 "Deployment not found" | 等待 5 分钟后重试 |
| 密码无法登录 | 检查密码大小写，重新打开链接 |
| 手机上看不到图片 | 清除浏览器缓存，重新刷新 |
| 无法上传照片 | 检查手机网络连接 |

---

## 🔄 更新应用

如果需要修改代码：

1. 编辑 `src/index.tsx`
2. 本地测试：`npm start`
3. 推送到 GitHub：
```bash
git add .
git commit -m "Update features"
git push
```
4. Vercel 自动部署（2-3 分钟内）

---

## 📱 分享给女朋友

1. **初次使用**：
   - 分享链接和密码
   - 她打开链接，输入密码
   - 完成登录

2. **日常使用**：
   - 给她保存应用到主屏幕
   - 就像用普通 App 一样

---

## 🛡️ 安全建议

- ✅ 使用强密码（8+ 字符，含数字和特殊字符）
- ✅ Vercel 使用 HTTPS 加密
- ✅ 选择 GitHub 私密仓库
- ✅ 定期更新代码（添加新功能时）

---

## 🚨 故障排查

### 部署失败
```bash
# 本地测试构建
npm run build

# 查看错误日志
npm run build 2>&1
```

### 数据无法同步
1. 检查 Bmob 配置（在 `src/index.tsx` 中）
2. 检查网络连接
3. 在浏览器开发者工具（F12）查看 Console 错误

### 女朋友无法登录
- 确认密码完全相同
- 检查大小写
- 清除浏览器缓存后重试

---

## 📞 需要帮助？

遇到问题？按照以下顺序排查：

1. **检查网络** - 确保手机连接到 WiFi
2. **查看日志** - F12 打开开发者工具
3. **清除缓存** - 浏览器设置中清除数据
4. **重新部署** - 在 Vercel 仪表板点击重新部署

---

## 🎉 恭喜！

你现在拥有了一个完全在线的情侣应用！

**功能包括：**
- ✅ 日记（支持照片）
- ✅ 相册（按日期组织）
- ✅ 消费记账（分类统计）
- ✅ 计划清单（完成率追踪）
- ✅ 心情日志（7天趋势）
- ✅ 关系计数（184天）
- ✅ 数据完全同步

**不需要：**
- ❌ 安装任何应用
- ❌ 支付任何费用
- ❌ 配置任何服务器

祝你们使用愉快！💕
