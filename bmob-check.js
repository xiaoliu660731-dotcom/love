#!/usr/bin/env node

/**
 * Bmob 配置自动检查脚本
 * 运行：node bmob-check.js
 */

const Bmob = require("hydrogen-js-sdk");

const BMOB_SECRET_KEY = "e7380f4b2947ad26";
const BMOB_API_KEY = "1234567890123456";

console.log("\n========================================");
console.log("🔍 Bmob 配置检查工具");
console.log("========================================\n");

// 1. 初始化检查
console.log("📌 第一步：初始化 Bmob...");
try {
  Bmob.initialize(BMOB_SECRET_KEY, BMOB_API_KEY);
  console.log("✅ Bmob 初始化成功\n");
} catch (err) {
  console.error("❌ Bmob 初始化失败:", err.message);
  process.exit(1);
}

// 2. 检查各个表
const tables = ["Diary", "PlanTask", "Accounting", "MoodEntry", "PhotoEntry"];
console.log("📌 第二步：检查数据表是否存在...\n");

async function checkTables() {
  let allTablesExist = true;

  for (const tableName of tables) {
    try {
      // @ts-ignore
      const query = Bmob.Query(tableName);
      // 尝试查询第一条记录，仅用于检查表是否存在
      const result = await query.find();
      console.log(`✅ 表 "${tableName}" 存在 (${result.length || 0} 条记录)`);
    } catch (err) {
      const errMsg = err.message || err.toString();
      if (err.code === 20004 || errMsg.includes("not find") || errMsg.includes("不存在")) {
        console.log(`⚠️  表 "${tableName}" 不存在 - 需要在 Bmob 后台创建`);
        allTablesExist = false;
      } else {
        console.log(`⚠️  表 "${tableName}" 查询结果不确定`);
      }
    }
  }

  console.log("\n========================================");
  if (allTablesExist) {
    console.log("✅ 所有表都已创建！");
  } else {
    console.log("⚠️  某些表不存在，请在 Bmob 后台创建");
  }
  console.log("========================================\n");

  // 3. 显示配置摘要
  console.log("📋 配置摘要：");
  console.log(`- Secret Key: ${BMOB_SECRET_KEY}`);
  console.log(`- API Key: ${BMOB_API_KEY}`);
  console.log(`- 需要的表数: ${tables.length}`);
  console.log(`- 表状态: ${allTablesExist ? "✅ 完整" : "⚠️ 不完整"}\n`);

  // 4. 提供后续步骤
  console.log("📝 后续步骤：");
  if (allTablesExist) {
    console.log("1. ✅ 运行 npm start 启动应用");
    console.log("2. 📱 在浏览器输入密码进行登录测试");
    console.log("3. 📸 测试各功能（日记、记账、计划等）");
    console.log("4. 🚀 确认无误后部署到 Vercel\n");
  } else {
    console.log("1. 进入 https://www.bmob.cn/");
    console.log("2. 选择对应的应用");
    console.log("3. 在【数据】中创建缺失的表");
    console.log("4. 表创建完成后重新运行此脚本\n");
  }
}

checkTables().catch((err) => {
  console.error("❌ 检查过程出错:", err);
  process.exit(1);
});
