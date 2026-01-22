@echo off
REM 快速部署到 Vercel 脚本
REM 运行此脚本前，确保已完成 Vercel 账户设置

echo ========================================
echo LoveApp - Vercel 部署助手
echo ========================================
echo.

REM 检查 Git 是否已安装
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Git 未安装，请先安装 Git
    echo 访问: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo ✅ Git 已安装
echo.

REM 检查项目目录
if not exist "package.json" (
    echo ❌ 错误：package.json 不存在
    echo 请在项目根目录运行此脚本
    pause
    exit /b 1
)

echo ✅ 项目文件检查通过
echo.

REM 步骤 1：初始化 Git（如果需要）
if not exist ".git" (
    echo 📌 第一步：初始化 Git 仓库...
    git init
    echo ✅ Git 仓库已初始化
    echo.
    echo ⚠️  请执行：
    echo    git remote add origin https://github.com/YOUR_USERNAME/love-app.git
    echo    （将 YOUR_USERNAME 替换为你的 GitHub 用户名）
    echo.
) else (
    echo ✅ Git 仓库已存在
    echo.
)

REM 步骤 2：构建检查
echo 📌 第二步：构建检查...
call npm run build >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 构建失败！
    echo 请运行以下命令查看详细错误：
    echo    npm run build
    pause
    exit /b 1
)
echo ✅ 构建成功
echo.

REM 步骤 3：提交代码
echo 📌 第三步：提交代码到 Git...
git add .
git commit -m "LoveApp deployment: %date% %time%" >nul 2>nul
echo ✅ 代码已提交
echo.

REM 步骤 4：推送到 GitHub
echo 📌 第四步：推送到 GitHub...
echo.
echo 运行：git push -u origin main
echo.
git push -u origin main

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ⚠️  推送失败，可能需要配置 GitHub Token
    echo 请按照以下步骤操作：
    echo 1. 访问：https://github.com/settings/tokens
    echo 2. 生成 Personal Access Token
    echo 3. 复制 token
    echo 4. 当要求输入密码时，粘贴 token
    pause
) else (
    echo.
    echo ✅ 代码已推送到 GitHub
)

echo.
echo ========================================
echo 📝 接下来的步骤：
echo ========================================
echo.
echo 1️⃣  访问 https://vercel.com
echo 2️⃣  用 GitHub 账户登录
echo 3️⃣  选择 "New Project" 或 "Import Project"
echo 4️⃣  选择 "love-app" 仓库
echo 5️⃣  点击 "Deploy"
echo 6️⃣  等待完成（通常 2-5 分钟）
echo 7️⃣  获得你的应用网址
echo.
echo ========================================
echo 💡 部署完成后：
echo ========================================
echo.
echo ✅ 用浏览器打开你的网址
echo ✅ 输入密码登录
echo ✅ 分享给女朋友（用同一密码登录）
echo ✅ 开始使用！
echo.
pause
