import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { sql } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function clearAllData() {
  console.log("🔌 Connecting to database...");
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  try {
    console.log("🗑️  Clearing all data from tables...");

    // 按照外键依赖顺序删除数据
    // 1. 先删除所有子表（有外键的表）
    await db.execute(sql`DELETE FROM purchase_order_items`);
    console.log("✅ Cleared purchase_order_items");

    await db.execute(sql`DELETE FROM sales_invoice_items`);
    console.log("✅ Cleared sales_invoice_items");

    await db.execute(sql`DELETE FROM credit_items`);
    console.log("✅ Cleared credit_items");

    await db.execute(sql`DELETE FROM warranty_items`);
    console.log("✅ Cleared warranty_items");

    // inventory_transactions table doesn't exist in current schema
    // await db.execute(sql`DELETE FROM inventory_transactions`);
    // console.log("✅ Cleared inventory_transactions");

    await db.execute(sql`DELETE FROM inventory_ledger`);
    console.log("✅ Cleared inventory_ledger");

    // 2. 删除主表
    await db.execute(sql`DELETE FROM purchase_orders`);
    console.log("✅ Cleared purchase_orders");

    await db.execute(sql`DELETE FROM sales_invoices`);
    console.log("✅ Cleared sales_invoices");

    await db.execute(sql`DELETE FROM credits`);
    console.log("✅ Cleared credits");

    await db.execute(sql`DELETE FROM warranties`);
    console.log("✅ Cleared warranties");

    await db.execute(sql`DELETE FROM parts`);
    console.log("✅ Cleared parts");

    await db.execute(sql`DELETE FROM customers`);
    console.log("✅ Cleared customers");

    await db.execute(sql`DELETE FROM suppliers`);
    console.log("✅ Cleared suppliers");

    await db.execute(sql`DELETE FROM line_codes`);
    console.log("✅ Cleared line_codes");

    // 3. 删除用户表（保留系统创建的管理员用户）
    await db.execute(sql`DELETE FROM users WHERE id != 1`);
    console.log("✅ Cleared users (kept admin user)");

    console.log("\n✨ All data cleared successfully! Database is now clean.");
  } catch (error) {
    console.error("❌ Error clearing data:", error);
    process.exit(1);
  } finally {
    await connection.end();
    console.log("🔌 Database connection closed");
  }
}

clearAllData();
