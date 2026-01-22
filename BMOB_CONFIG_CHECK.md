# Bmob 配置检查清单

## 🔍 当前配置状态

### 配置信息
```
Secret Key: e7380f4b2947ad26
API Key: 1234567890123456
```

## ✅ 需要验证的项目

### 1️⃣ Bmob 账户与应用
- [ ] 登录 https://www.bmob.cn/
- [ ] 进入【我的应用】
- [ ] 验证应用名称和密钥是否匹配
- [ ] 检查 Secret Key 是否为 `e7380f4b2947ad26`
- [ ] 检查 API Key 是否为 `1234567890123456`

### 2️⃣ 数据表验证（必须全部创建）
在 Bmob 后台检查以下数据表是否存在：

- [ ] **Diary** 表
  - 字段：text (字符串), mood (字符串), author (字符串), createdAt (日期), secretCode (字符串)
  - 权限：需要设置为可读写

- [ ] **PlanTask** 表
  - 字段：description (字符串), completed (布尔/字符串), author (字符串), targetDate (字符串), secretCode (字符串), createdAt (日期)

- [ ] **Accounting** 表
  - 字段：description (字符串), amount (字符串/数字), category (字符串), author (字符串), createdAt (日期), secretCode (字符串)

- [ ] **MoodEntry** 表
  - 字段：mood (字符串), moodValue (字符串/数字), note (字符串), author (字符串), recordDate (字符串), secretCode (字符串), createdAt (日期)

- [ ] **PhotoEntry** 表
  - 字段：photoUrl (字符串), photoBase64 (字符串), caption (字符串), author (字符串), uploadDate (字符串), secretCode (字符串), createdAt (日期)

### 3️⃣ 权限设置
- [ ] 所有表的读写权限已开放
- [ ] 确认没有 IP 白名单限制
- [ ] 确认 API 配额充足

### 4️⃣ 测试连接

运行以下命令测试：
```bash
cd e:\桌面\love-app
npm install  # 确保依赖已安装
npm start    # 启动开发服务器
```

在浏览器打开并检查：
1. 打开浏览器开发者工具 (F12)
2. 进入 Console 标签
3. 查看是否有错误信息
4. 应该能看到 "Bmob 初始化尝试完成" 的日志

### 5️⃣ 功能测试

登录应用并尝试：
- [ ] 写日记（应该能保存到 Bmob）
- [ ] 添加计划
- [ ] 记一笔账
- [ ] 记录心情
- [ ] 上传照片

## ⚠️ 常见问题

### 问题1：显示 "表不存在" 错误
**解决**：进入 Bmob 后台手动创建对应数据表

### 问题2：数据保存失败
**解决**：检查权限设置，确保 API Key 和 Secret Key 正确

### 问题3：跨域错误
**解决**：检查 Bmob 后台是否配置了 CORS 或域名白名单

## 📋 下一步

完成以上检查后，通知我以下信息：
1. ✅ 所有表都已创建
2. ✅ 测试写入和读取成功
3. ✅ 没有错误信息

然后我们可以：
1. 进行部署配置
2. 生成部署到 Vercel 的步骤
3. 创建安卓安装说明
