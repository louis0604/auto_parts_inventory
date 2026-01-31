import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema.js';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

console.log('🌱 Seeding Line Codes...');

const lineCodes = [
  { id: 90007, code: 'BSH', description: 'Bosch Wiper Blade' },
  { id: 90001, code: 'ACE', description: 'AC Evaporator' },
  { id: 90003, code: 'MON', description: 'Monroe Shock Absorber' },
  { id: 90002, code: 'DOR', description: 'Dorman Parts' },
  { id: 90005, code: 'WAI', description: 'WAI Alternator' },
  { id: 90006, code: 'ECO', description: 'Economy Parts' },
  { id: 90004, code: 'MPA', description: 'Master Pro Air Filter' },
  { id: 90009, code: 'DNS', description: 'Denso Spark Plug' },
  { id: 90008, code: 'DEN', description: 'Delphi Fuel Pump' },
  { id: 90010, code: 'BAW', description: 'Baw Brake Pad' },
];

for (const lineCode of lineCodes) {
  await db.insert(schema.lineCodes).values(lineCode);
  console.log(`✅ Added: ${lineCode.code} - ${lineCode.description}`);
}

console.log('✨ Line Codes seeded successfully!');
await connection.end();
