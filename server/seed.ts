/**
 * Seed script: imports vehicle makes/models and parts data into the database.
 * Run with: npx tsx server/seed.ts
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import {
  vehicleMakes,
  vehicleModels,
  partCategories,
  partGroups,
  lineCodes,
  parts,
  partVehicleFitments,
} from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const db = drizzle(process.env.DATABASE_URL);

// ─── Load data files ──────────────────────────────────────────────────────────
const nhtsaPath = "/home/ubuntu/nhtsa_vehicles.json";
const partsPath = "/home/ubuntu/parts_data_fixed.json";

const nhtsaData: Record<string, { make_id: number; models: { model_id: number; model_name: string }[] }> =
  JSON.parse(fs.readFileSync(nhtsaPath, "utf-8"));

const partsData: {
  categories: { name: string; code: string }[];
  groups_by_category: Record<string, string[]>;
  parts: {
    sku: string;
    name: string;
    manufacturer: string;
    lineCode: string;
    category: string;
    group: string;
    retail: string;
    listPrice: string;
    replCost: string;
    stockQuantity: number;
    description: string;
  }[];
  fitments: {
    partSku: string;
    make: string;
    model: string;
    yearFrom: number;
    yearTo: number;
  }[];
} = JSON.parse(fs.readFileSync(partsPath, "utf-8"));

async function seed() {
  console.log("=== Starting seed ===");

  // ── 1. Insert vehicle makes ──────────────────────────────────────────────
  console.log("\n[1/6] Inserting vehicle makes...");
  const makeNameToId: Record<string, number> = {};

  for (const [makeName] of Object.entries(nhtsaData)) {
    try {
      const existing = await db.select().from(vehicleMakes).where(eq(vehicleMakes.name, makeName)).limit(1);
      if (existing.length > 0) {
        makeNameToId[makeName] = existing[0].id;
      } else {
        const [result] = await db.insert(vehicleMakes).values({ name: makeName });
        makeNameToId[makeName] = (result as any).insertId;
      }
    } catch (e) {
      console.error(`  Error inserting make ${makeName}:`, e);
    }
  }
  console.log(`  Inserted/found ${Object.keys(makeNameToId).length} makes`);

  // ── 2. Insert vehicle models ─────────────────────────────────────────────
  console.log("\n[2/6] Inserting vehicle models...");
  const modelKey = (makeId: number, modelName: string) => `${makeId}::${modelName}`;
  const modelKeyToId: Record<string, number> = {};

  for (const [makeName, makeData] of Object.entries(nhtsaData)) {
    const makeId = makeNameToId[makeName];
    if (!makeId) continue;

    for (const model of makeData.models) {
      const mName = model.model_name;
      const key = modelKey(makeId, mName);
      try {
        const existing = await db
          .select()
          .from(vehicleModels)
          .where(and(eq(vehicleModels.makeId, makeId), eq(vehicleModels.name, mName)))
          .limit(1);
        if (existing.length > 0) {
          modelKeyToId[key] = existing[0].id;
        } else {
          const [result] = await db.insert(vehicleModels).values({ makeId, name: mName });
          modelKeyToId[key] = (result as any).insertId;
        }
      } catch (e) {
        console.error(`  Error inserting model ${mName}:`, e);
      }
    }
  }
  console.log(`  Inserted/found ${Object.keys(modelKeyToId).length} models`);

  // ── 3. Insert part categories ────────────────────────────────────────────
  console.log("\n[3/6] Inserting part categories...");
  const catNameToId: Record<string, number> = {};

  for (const cat of partsData.categories) {
    try {
      const existing = await db.select().from(partCategories).where(eq(partCategories.name, cat.name)).limit(1);
      if (existing.length > 0) {
        catNameToId[cat.name] = existing[0].id;
      } else {
        const [result] = await db.insert(partCategories).values({ name: cat.name });
        catNameToId[cat.name] = (result as any).insertId;
      }
    } catch (e) {
      console.error(`  Error inserting category ${cat.name}:`, e);
    }
  }
  console.log(`  Inserted/found ${Object.keys(catNameToId).length} categories`);

  // ── 4. Insert part groups ────────────────────────────────────────────────
  console.log("\n[4/6] Inserting part groups...");
  const groupKey = (catId: number, groupName: string) => `${catId}::${groupName}`;
  const groupKeyToId: Record<string, number> = {};

  for (const [catName, groups] of Object.entries(partsData.groups_by_category)) {
    const catId = catNameToId[catName];
    if (!catId) continue;

    for (const groupName of groups) {
      const key = groupKey(catId, groupName);
      try {
        const existing = await db
          .select()
          .from(partGroups)
          .where(and(eq(partGroups.categoryId, catId), eq(partGroups.name, groupName)))
          .limit(1);
        if (existing.length > 0) {
          groupKeyToId[key] = existing[0].id;
        } else {
          const [result] = await db.insert(partGroups).values({ categoryId: catId, name: groupName });
          groupKeyToId[key] = (result as any).insertId;
        }
      } catch (e) {
        console.error(`  Error inserting group ${groupName}:`, e);
      }
    }
  }
  console.log(`  Inserted/found ${Object.keys(groupKeyToId).length} groups`);

  // ── 5. Insert line codes + parts ─────────────────────────────────────────
  console.log("\n[5/6] Inserting line codes and parts...");
  const lineCodeToId: Record<string, number> = {};
  const skuToPartId: Record<string, number> = {};

  let partsInserted = 0;
  let partsSkipped = 0;

  for (const part of partsData.parts) {
    // Ensure line code exists
    if (!lineCodeToId[part.lineCode]) {
      try {
        const existing = await db.select().from(lineCodes).where(eq(lineCodes.code, part.lineCode)).limit(1);
        if (existing.length > 0) {
          lineCodeToId[part.lineCode] = existing[0].id;
        } else {
          const [result] = await db.insert(lineCodes).values({
            code: part.lineCode,
            description: part.manufacturer.replace(/^ALT:/, ""),
          });
          lineCodeToId[part.lineCode] = (result as any).insertId;
        }
      } catch (e) {
        console.error(`  Error inserting line code ${part.lineCode}:`, e);
        continue;
      }
    }

    const lineCodeId = lineCodeToId[part.lineCode];
    const catId = catNameToId[part.category];
    const gKey = catId ? groupKey(catId, part.group) : null;
    const partGroupId = gKey ? groupKeyToId[gKey] : undefined;

    try {
      // Check if part already exists by SKU
      const existing = await db.select().from(parts).where(eq(parts.sku, part.sku)).limit(1);
      if (existing.length > 0) {
        skuToPartId[part.sku] = existing[0].id;
        partsSkipped++;
        continue;
      }

      const [result] = await db.insert(parts).values({
        sku: part.sku,
        name: part.name,
        lineCodeId,
        categoryId: catId || undefined,
        partGroupId: partGroupId || undefined,
        manufacturer: part.manufacturer,
        description: part.description,
        retail: part.retail,
        replCost: part.replCost,
        listPrice: part.listPrice,
        stockQuantity: part.stockQuantity,
      });
      skuToPartId[part.sku] = (result as any).insertId;
      partsInserted++;
    } catch (e) {
      console.error(`  Error inserting part ${part.sku}:`, e);
    }
  }
  console.log(`  Inserted ${partsInserted} parts, skipped ${partsSkipped} existing`);

  // ── 6. Insert fitments ───────────────────────────────────────────────────
  console.log("\n[6/6] Inserting fitments...");
  let fitmentsInserted = 0;
  let fitmentsSkipped = 0;

  for (const fitment of partsData.fitments) {
    const partId = skuToPartId[fitment.partSku];
    if (!partId) {
      fitmentsSkipped++;
      continue;
    }

    const makeId = makeNameToId[fitment.make];
    if (!makeId) {
      fitmentsSkipped++;
      continue;
    }

    const mKey = modelKey(makeId, fitment.model);
    const modelId = modelKeyToId[mKey];
    if (!modelId) {
      fitmentsSkipped++;
      continue;
    }

    try {
      // Check for duplicate
      const existing = await db
        .select()
        .from(partVehicleFitments)
        .where(
          and(
            eq(partVehicleFitments.partId, partId),
            eq(partVehicleFitments.makeId, makeId),
            eq(partVehicleFitments.modelId, modelId),
          )
        )
        .limit(1);

      if (existing.length > 0) {
        fitmentsSkipped++;
        continue;
      }

      await db.insert(partVehicleFitments).values({
        partId,
        makeId,
        modelId,
        yearFrom: fitment.yearFrom,
        yearTo: fitment.yearTo,
      });
      fitmentsInserted++;
    } catch (e) {
      // Skip duplicate errors silently
      fitmentsSkipped++;
    }
  }
  console.log(`  Inserted ${fitmentsInserted} fitments, skipped ${fitmentsSkipped}`);

  console.log("\n=== Seed complete ===");
  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
