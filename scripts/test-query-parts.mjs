import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema.ts';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

const { parts } = schema;

// 查询所有TEST配件
const result = await db.select().from(parts).where(schema.sql`sku LIKE 'TEST%'`);

console.log('TEST配件查询结果:');
console.log(JSON.stringify(result, null, 2));

await connection.end();
