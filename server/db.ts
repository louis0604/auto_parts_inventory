import { eq, desc, sql, and, or, like, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  parts, 
  suppliers, 
  customers, 
  partCategories,
  lineCodes,
  purchaseOrders,
  purchaseOrderItems,
  salesInvoices,
  salesInvoiceItems,
  inventoryLedger,
  lowStockAlerts,
  credits,
  creditItems,
  warranties,
  warrantyItems,
  auditLogs,
  type Part,
  type Supplier,
  type Customer,
  type PartCategory,
  type LineCode,
  type InsertLineCode,
  type PurchaseOrder,
  type SalesInvoice,
  type InventoryLedgerEntry,
  type LowStockAlert,
  type Credit,
  type Warranty,
  type AuditLog,
  type InsertAuditLog,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== Line Codes =====
export async function getAllLineCodes(): Promise<LineCode[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(lineCodes).orderBy(lineCodes.code);
}

export async function createLineCode(data: { code: string; description?: string }): Promise<LineCode> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(lineCodes).values(data);
  return (await db.select().from(lineCodes).where(eq(lineCodes.id, Number(result.insertId))))[0]!;
}

export async function updateLineCode(data: { id: number; code: string; description?: string }): Promise<LineCode> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(lineCodes).set({ code: data.code, description: data.description }).where(eq(lineCodes.id, data.id));
  return (await db.select().from(lineCodes).where(eq(lineCodes.id, data.id)))[0]!;
}

export async function deleteLineCode(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(lineCodes).where(eq(lineCodes.id, id));
}

// ===== Part Categories =====
export async function getAllPartCategories(): Promise<PartCategory[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(partCategories).orderBy(partCategories.name);
}

export async function createPartCategory(data: { name: string; description?: string }): Promise<PartCategory> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(partCategories).values(data);
  return (await db.select().from(partCategories).where(eq(partCategories.id, Number(result.insertId))))[0]!;
}

// ===== Suppliers =====
export async function getAllSuppliers(): Promise<Supplier[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
}

export async function getSupplierById(id: number): Promise<Supplier | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  return result[0];
}

export async function createSupplier(data: {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}): Promise<Supplier> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(suppliers).values(data);
  return (await db.select().from(suppliers).where(eq(suppliers.id, Number(result.insertId))))[0]!;
}

export async function updateSupplier(id: number, data: Partial<Supplier>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(suppliers).set(data).where(eq(suppliers.id, id));
}

export async function deleteSupplier(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(suppliers).where(eq(suppliers.id, id));
}

// ===== Customers =====
export async function getAllCustomers(): Promise<Customer[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(customers).orderBy(desc(customers.createdAt));
}

export async function getCustomerById(id: number): Promise<Customer | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result[0];
}

export async function createCustomer(data: {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}): Promise<Customer> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(customers).values(data);
  return (await db.select().from(customers).where(eq(customers.id, Number(result.insertId))))[0]!;
}

export async function updateCustomer(id: number, data: Partial<Customer>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(customers).set(data).where(eq(customers.id, id));
}

export async function deleteCustomer(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(customers).where(eq(customers.id, id));
}

// ===== Parts =====
export async function getLineCodesBySku(sku: string) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      id: parts.id,
      lineCodeId: parts.lineCodeId,
      lineCodeName: lineCodes.code,
      sku: parts.sku,
      name: parts.name,
      unitPrice: parts.unitPrice,
    })
    .from(parts)
    .leftJoin(lineCodes, eq(parts.lineCodeId, lineCodes.id))
    .where(eq(parts.sku, sku));
  return result.filter(r => r.lineCodeName !== null);
}

export async function getPartsBySku(sku: string) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      id: parts.id,
      lineCodeId: parts.lineCodeId,
      lineCodeName: lineCodes.code,
      sku: parts.sku,
      name: parts.name,
      cost: parts.cost,
      unitPrice: parts.unitPrice,
      replCost: parts.replCost,
    })
    .from(parts)
    .leftJoin(lineCodes, eq(parts.lineCodeId, lineCodes.id))
    .where(and(eq(parts.sku, sku), eq(parts.isArchived, false)));
  return result;
}

export async function getAllParts(): Promise<(Part & { lineCode?: string | null })[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      id: parts.id,
      sku: parts.sku,
      name: parts.name,
      lineCodeId: parts.lineCodeId,
      lineCode: lineCodes.code,
      categoryId: parts.categoryId,
      supplierId: parts.supplierId,
      description: parts.description,
      // Pricing fields
      listPrice: parts.listPrice,
      cost: parts.cost,
      retail: parts.retail,
      coreCost: parts.coreCost,
      coreRetail: parts.coreRetail,
      unitPrice: parts.unitPrice,
      // Inventory fields
      stockQuantity: parts.stockQuantity,
      minStockThreshold: parts.minStockThreshold,
      orderQty: parts.orderQty,
      orderMultiple: parts.orderMultiple,
      // Units
      stockingUnit: parts.stockingUnit,
      purchaseUnit: parts.purchaseUnit,
      unit: parts.unit,
      // Additional fields
      manufacturer: parts.manufacturer,
      mfgPartNumber: parts.mfgPartNumber,
      weight: parts.weight,
      imageUrl: parts.imageUrl,
      createdAt: parts.createdAt,
      updatedAt: parts.updatedAt,
    })
    .from(parts)
    .leftJoin(lineCodes, eq(parts.lineCodeId, lineCodes.id))
    .where(eq(parts.isArchived, false))
    .orderBy(desc(parts.createdAt));
  return result as any;
}

export async function getPartById(id: number): Promise<Part | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(parts).where(eq(parts.id, id)).limit(1);
  return result[0];
}

export async function searchParts(query: string): Promise<Part[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(parts).where(
    or(
      like(parts.name, `%${query}%`),
      like(parts.sku, `%${query}%`)
    )
  ).orderBy(parts.name);
}

export async function createPart(data: {
  // Basic info - 保疙5个必填项
  lineCodeId: number; // Line (必填)
  sku: string; // Part Number (必填)
  name: string; // Description (必填)
  description?: string | null;
  categoryId?: number | null;
  supplierId?: number | null;
  
  // Inventory
  stockQuantity?: number | null;
  minStockThreshold?: number | null;
  orderPoint?: number | null;
  orderQty?: number | null;
  
  // Pricing
  listPrice?: string | null;
  cost?: string | null;
  retail: string; // Retail (必填)
  replCost: string; // Repl Cost (必填)
  avgCost?: string | null;
  price1?: string | null;
  price2?: string | null;
  price3?: string | null;
  unitPrice?: string | null;
  coreCost?: string | null;
  coreRetail?: string | null;
  
  // Order info
  orderMultiple?: number | null;
  
  // Units
  stockingUnit?: string | null;
  purchaseUnit?: string | null;
  unit?: string | null;
  
  // Additional
  manufacturer?: string | null;
  mfgPartNumber?: string | null;
  weight?: string | null;
  imageUrl?: string | null;
}): Promise<Part> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 只插入必填字段和用户提供的字段，其他由数据库默认值处理
  const insertData: any = {
    // 必填字段
    sku: data.sku,
    name: data.name,
    lineCodeId: data.lineCodeId,
    retail: data.retail,
    replCost: data.replCost,
  };
  
  // 添加用户提供的可选字段
  if (data.categoryId !== undefined && data.categoryId !== null) insertData.categoryId = data.categoryId;
  if (data.supplierId !== undefined && data.supplierId !== null) insertData.supplierId = data.supplierId;
  if (data.description) insertData.description = data.description;
  if (data.listPrice) insertData.listPrice = data.listPrice;
  if (data.cost) insertData.cost = data.cost;
  if (data.avgCost) insertData.avgCost = data.avgCost;
  if (data.price1) insertData.price1 = data.price1;
  if (data.price2) insertData.price2 = data.price2;
  if (data.price3) insertData.price3 = data.price3;
  if (data.coreCost) insertData.coreCost = data.coreCost;
  if (data.coreRetail) insertData.coreRetail = data.coreRetail;
  if (data.unitPrice) insertData.unitPrice = data.unitPrice;
  if (data.stockQuantity !== undefined) insertData.stockQuantity = data.stockQuantity;
  if (data.minStockThreshold !== undefined) insertData.minStockThreshold = data.minStockThreshold;
  if (data.orderPoint !== undefined) insertData.orderPoint = data.orderPoint;
  if (data.orderQty !== undefined) insertData.orderQty = data.orderQty;
  if (data.orderMultiple !== undefined) insertData.orderMultiple = data.orderMultiple;
  if (data.stockingUnit) insertData.stockingUnit = data.stockingUnit;
  if (data.purchaseUnit) insertData.purchaseUnit = data.purchaseUnit;
  if (data.unit) insertData.unit = data.unit;
  if (data.manufacturer) insertData.manufacturer = data.manufacturer;
  if (data.mfgPartNumber) insertData.mfgPartNumber = data.mfgPartNumber;
  if (data.weight) insertData.weight = data.weight;
  if (data.imageUrl) insertData.imageUrl = data.imageUrl;
  
  const [result] = await db.insert(parts).values(insertData);
  return (await db.select().from(parts).where(eq(parts.id, Number(result.insertId))))[0]!;
}

export async function bulkCreateParts(partsData: Array<{
  sku: string;
  name: string;
  lineCodeId?: number | null;
  categoryId?: number | null;
  supplierId?: number | null;
  description?: string;
  unitPrice: string;
  unit?: string;
  stockQuantity?: number;
  minStockThreshold?: number;
  orderPoint?: number;
  listPrice?: string;
  replCost?: string;
  retail?: string;
  price1?: string;
  price2?: string;
  price3?: string;
  imageBase64?: { data: string; extension: string } | null;
  imageUrl?: string;
  // 兼容旧字段名
  currentStock?: number;
  minStock?: number;
}>): Promise<{ success: number; failed: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let success = 0;
  let failed = 0;

  for (const partData of partsData) {
    try {
      // 如果有图片base64数据，上传到S3
      let finalImageUrl = partData.imageUrl || "";
      if (partData.imageBase64 && partData.imageBase64.data) {
        try {
          // 将base64转换为Buffer
          const imageBuffer = Buffer.from(partData.imageBase64.data, 'base64');
          const extension = partData.imageBase64.extension || 'png';
          const fileName = `parts/${partData.sku}-${Date.now()}.${extension}`;
          
          // 上传到S3
          const { storagePut } = await import('./storage');
          const result = await storagePut(fileName, imageBuffer, `image/${extension}`);
          finalImageUrl = result.url;
          console.log(`Uploaded image for part ${partData.sku}: ${finalImageUrl}`);
        } catch (uploadError) {
          console.error(`Failed to upload image for part ${partData.sku}:`, uploadError);
          // 继续创建配件，但不使用图片
        }
      }
      
      await db.insert(parts).values({
        sku: partData.sku,
        name: partData.name,
        lineCodeId: partData.lineCodeId || undefined,
        categoryId: partData.categoryId || undefined,
        supplierId: partData.supplierId || undefined,
        description: partData.description || "",
        unitPrice: partData.unitPrice,
        unit: partData.unit || "个",
        stockQuantity: partData.stockQuantity ?? partData.currentStock ?? 0,
        minStockThreshold: partData.minStockThreshold ?? partData.minStock ?? 0,
        orderQty: partData.orderPoint || undefined,
        listPrice: partData.listPrice || undefined,
        cost: partData.replCost || undefined,
        retail: partData.retail || undefined,
        imageUrl: finalImageUrl || undefined,
      });
      success++;
    } catch (error) {
      console.error(`Failed to create part ${partData.sku}:`, error);
      failed++;
    }
  }

  return { success, failed };
}

export async function updatePart(id: number, data: Partial<Part>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(parts).set(data).where(eq(parts.id, id));
}

export async function deletePart(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if part is referenced in purchase order items
  const poItems = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.partId, id)).limit(1);
  if (poItems.length > 0) {
    throw new Error("该配件已被采购订单引用，无法删除。请先删除相关订单。");
  }
  
  // Check if part is referenced in sales invoice items
  const siItems = await db.select().from(salesInvoiceItems).where(eq(salesInvoiceItems.partId, id)).limit(1);
  if (siItems.length > 0) {
    throw new Error("该配件已被销售发票引用，无法删除。请先删除相关发票。");
  }
  
  // Check if part has inventory ledger entries
  const ledgerEntries = await db.select().from(inventoryLedger).where(eq(inventoryLedger.partId, id)).limit(1);
  if (ledgerEntries.length > 0) {
    throw new Error("该配件已有库存变动记录，无法删除。请联系管理员处理。");
  }
  
  await db.delete(parts).where(eq(parts.id, id));
}

/**
 * Force delete a supplier and all its related records (admin only)
 */
export async function forceDeleteSupplier(supplierId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("数据库连接失败");

  // 删除所有相关记录
  // 1. 删除采购订单和其明细
  const supplierOrders = await db.select({ id: purchaseOrders.id }).from(purchaseOrders).where(eq(purchaseOrders.supplierId, supplierId));
  for (const order of supplierOrders) {
    await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, order.id));
  }
  await db.delete(purchaseOrders).where(eq(purchaseOrders.supplierId, supplierId));
  
  // 2. 将供应商的配件supplierId设为null（不删除配件）
  await db.update(parts).set({ supplierId: null }).where(eq(parts.supplierId, supplierId));
  
  // 删除供应商
  await db.delete(suppliers).where(eq(suppliers.id, supplierId));
}

export async function forceDeleteCustomer(customerId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("数据库连接失败");

  // 删除所有相关记录
  // 1. 删除销售发票和其明细
  const customerInvoices = await db.select({ id: salesInvoices.id }).from(salesInvoices).where(eq(salesInvoices.customerId, customerId));
  for (const invoice of customerInvoices) {
    await db.delete(salesInvoiceItems).where(eq(salesInvoiceItems.salesInvoiceId, invoice.id));
  }
  await db.delete(salesInvoices).where(eq(salesInvoices.customerId, customerId));
  
  // 2. 删除退货单和其明细
  const customerCredits = await db.select({ id: credits.id }).from(credits).where(eq(credits.customerId, customerId));
  for (const credit of customerCredits) {
    await db.delete(creditItems).where(eq(creditItems.creditId, credit.id));
  }
  await db.delete(credits).where(eq(credits.customerId, customerId));
  
  // 3. 删除保修单和其明细
  const customerWarranties = await db.select({ id: warranties.id }).from(warranties).where(eq(warranties.customerId, customerId));
  for (const warranty of customerWarranties) {
    await db.delete(warrantyItems).where(eq(warrantyItems.warrantyId, warranty.id));
  }
  await db.delete(warranties).where(eq(warranties.customerId, customerId));
  
  // 删除客户
  await db.delete(customers).where(eq(customers.id, customerId));
}

/**
 * Archive a part (soft delete)
 */
export async function archivePart(partId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(parts)
    .set({ isArchived: true, archivedAt: new Date() })
    .where(eq(parts.id, partId));
}

/**
 * Restore an archived part
 */
export async function restorePart(partId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(parts)
    .set({ isArchived: false, archivedAt: null })
    .where(eq(parts.id, partId));
}

/**
 * Get all archived parts
 */
export async function getArchivedParts(): Promise<(Part & { lineCode?: string | null })[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      id: parts.id,
      sku: parts.sku,
      name: parts.name,
      lineCodeId: parts.lineCodeId,
      lineCode: lineCodes.code,
      categoryId: parts.categoryId,
      supplierId: parts.supplierId,
      description: parts.description,
      listPrice: parts.listPrice,
      cost: parts.cost,
      retail: parts.retail,
      unitPrice: parts.unitPrice,
      stockQuantity: parts.stockQuantity,
      minStockThreshold: parts.minStockThreshold,
      orderPoint: parts.orderPoint,
      unit: parts.unit,
      imageUrl: parts.imageUrl,
      isArchived: parts.isArchived,
      archivedAt: parts.archivedAt,
      createdAt: parts.createdAt,
      updatedAt: parts.updatedAt,
    })
    .from(parts)
    .leftJoin(lineCodes, eq(parts.lineCodeId, lineCodes.id))
    .where(eq(parts.isArchived, true))
    .orderBy(desc(parts.archivedAt));
  return result as any;
}

/**
 * Force delete a part and all its related records (admin only)
 */
export async function forceDeletePart(partId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete low stock alerts
  await db.delete(lowStockAlerts).where(eq(lowStockAlerts.partId, partId));
  
  // Delete inventory ledger entries
  await db.delete(inventoryLedger).where(eq(inventoryLedger.partId, partId));
  
  // Delete credit items (customer returns)
  await db.delete(creditItems).where(eq(creditItems.partId, partId));
  
  // Delete warranty items
  await db.delete(warrantyItems).where(eq(warrantyItems.partId, partId));
  
  // Delete purchase order items
  await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.partId, partId));
  
  // Delete sales invoice items
  await db.delete(salesInvoiceItems).where(eq(salesInvoiceItems.partId, partId));
  
  // Delete the part
  await db.delete(parts).where(eq(parts.id, partId));
}

export async function getLowStockParts(): Promise<Part[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(parts).where(
    sql`${parts.stockQuantity} < ${parts.minStockThreshold}`
  ).orderBy(parts.name);
}

// ===== Inventory Ledger =====
export async function createInventoryLedgerEntry(data: {
  partId: number;
  transactionType: "purchase" | "sale" | "credit" | "warranty" | "adjustment";
  quantity: number;
  balanceAfter: number;
  referenceType?: string;
  referenceId?: number;
  notes?: string;
  operatedBy: number;
}): Promise<InventoryLedgerEntry> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(inventoryLedger).values(data);
  return (await db.select().from(inventoryLedger).where(eq(inventoryLedger.id, Number(result.insertId))))[0]!;
}

export async function getInventoryLedgerByPart(partId: number): Promise<InventoryLedgerEntry[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(inventoryLedger).where(eq(inventoryLedger.partId, partId)).orderBy(desc(inventoryLedger.createdAt));
}

// ===== Low Stock Alerts =====
export async function createLowStockAlert(data: {
  partId: number;
  currentStock: number;
  minThreshold: number;
}): Promise<LowStockAlert> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(lowStockAlerts).values(data);
  return (await db.select().from(lowStockAlerts).where(eq(lowStockAlerts.id, Number(result.insertId))))[0]!;
}

export async function getUnresolvedLowStockAlerts(): Promise<LowStockAlert[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(lowStockAlerts).where(eq(lowStockAlerts.isResolved, false)).orderBy(desc(lowStockAlerts.createdAt));
}

export async function resolveLowStockAlert(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(lowStockAlerts).set({ isResolved: true, resolvedAt: new Date() }).where(eq(lowStockAlerts.id, id));
}

// ===== Purchase Orders =====
export async function getAllPurchaseOrders(): Promise<PurchaseOrder[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.createdAt));
}

export async function getPurchaseOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  // Get order with supplier and creator info
  const [order] = await db
    .select({
      id: purchaseOrders.id,
      orderNumber: purchaseOrders.orderNumber,
      supplierId: purchaseOrders.supplierId,
      supplierName: suppliers.name,
      orderDate: purchaseOrders.orderDate,
      orderTime: purchaseOrders.orderTime,
      type: purchaseOrders.type,
      totalAmount: purchaseOrders.totalAmount,
      status: purchaseOrders.status,
      notes: purchaseOrders.notes,
      createdBy: purchaseOrders.createdBy,
      createdByName: users.name,
      createdAt: purchaseOrders.createdAt,
      updatedAt: purchaseOrders.updatedAt,
    })
    .from(purchaseOrders)
    .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
    .leftJoin(users, eq(purchaseOrders.createdBy, users.id))
    .where(eq(purchaseOrders.id, id))
    .limit(1);
  
  if (!order) return undefined;
  
  // Get items with part details
  const items = await db
    .select({
      id: purchaseOrderItems.id,
      purchaseOrderId: purchaseOrderItems.purchaseOrderId,
      partId: purchaseOrderItems.partId,
      partSku: parts.sku,
      partName: parts.name,
      lineCode: lineCodes.code,
      quantity: purchaseOrderItems.quantity,
      unitPrice: purchaseOrderItems.unitPrice,
      subtotal: purchaseOrderItems.subtotal,
      createdAt: purchaseOrderItems.createdAt,
    })
    .from(purchaseOrderItems)
    .leftJoin(parts, eq(purchaseOrderItems.partId, parts.id))
    .leftJoin(lineCodes, eq(parts.lineCodeId, lineCodes.id))
    .where(eq(purchaseOrderItems.purchaseOrderId, id));
  
  return { ...order, items };
}

export async function createPurchaseOrder(data: {
  orderNumber: string;
  supplierId: number;
  type?: "inbound" | "outbound";
  totalAmount: string;
  notes?: string;
  createdBy: number;
}): Promise<PurchaseOrder> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(purchaseOrders).values(data);
  return (await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, Number(result.insertId))))[0]!;
}

export async function createPurchaseOrderItem(data: {
  purchaseOrderId: number;
  partId: number;
  quantity: number;
  unitPrice: string;
  subtotal: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(purchaseOrderItems).values(data);
}

export async function updatePurchaseOrderStatus(id: number, status: "pending" | "received" | "cancelled"): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(purchaseOrders).set({ status }).where(eq(purchaseOrders.id, id));
}

// ===== Sales Invoices =====
export async function getAllSalesInvoices(): Promise<SalesInvoice[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(salesInvoices).orderBy(desc(salesInvoices.createdAt));
}

export async function getSalesInvoiceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  // Get invoice with customer and creator info
  const [invoice] = await db
    .select({
      id: salesInvoices.id,
      invoiceNumber: salesInvoices.invoiceNumber,
      customerId: salesInvoices.customerId,
      customerName: customers.name,
      customerNumber: salesInvoices.customerNumber,
      invoiceDate: salesInvoices.invoiceDate,
      invoiceTime: salesInvoices.invoiceTime,
      type: salesInvoices.type,
      totalAmount: salesInvoices.totalAmount,
      status: salesInvoices.status,
      notes: salesInvoices.notes,
      createdBy: salesInvoices.createdBy,
      createdByName: users.name,
      createdAt: salesInvoices.createdAt,
      updatedAt: salesInvoices.updatedAt,
    })
    .from(salesInvoices)
    .leftJoin(customers, eq(salesInvoices.customerId, customers.id))
    .leftJoin(users, eq(salesInvoices.createdBy, users.id))
    .where(eq(salesInvoices.id, id))
    .limit(1);
  
  if (!invoice) return undefined;
  
  // Get items with part details
  const items = await db
    .select({
      id: salesInvoiceItems.id,
      salesInvoiceId: salesInvoiceItems.salesInvoiceId,
      partId: salesInvoiceItems.partId,
      partSku: parts.sku,
      partName: parts.name,
      partCost: parts.cost,
      lineCode: lineCodes.code,
      quantity: salesInvoiceItems.quantity,
      unitPrice: salesInvoiceItems.unitPrice,
      subtotal: salesInvoiceItems.subtotal,
      createdAt: salesInvoiceItems.createdAt,
    })
    .from(salesInvoiceItems)
    .leftJoin(parts, eq(salesInvoiceItems.partId, parts.id))
    .leftJoin(lineCodes, eq(parts.lineCodeId, lineCodes.id))
    .where(eq(salesInvoiceItems.salesInvoiceId, id));
  
  return { ...invoice, items };
}

export async function createSalesInvoice(data: {
  invoiceNumber: string;
  customerId: number;
  totalAmount: string;
  notes?: string;
  createdBy: number;
}): Promise<SalesInvoice> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(salesInvoices).values(data);
  return (await db.select().from(salesInvoices).where(eq(salesInvoices.id, Number(result.insertId))))[0]!;
}

export async function createSalesInvoiceItem(data: {
  salesInvoiceId: number;
  partId: number;
  quantity: number;
  unitPrice: string;
  subtotal: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(salesInvoiceItems).values(data);
}

export async function updateSalesInvoiceStatus(id: number, status: "pending" | "completed" | "cancelled"): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(salesInvoices).set({ status }).where(eq(salesInvoices.id, id));
}

// ===== Dashboard Statistics =====
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;

  const [totalPartsResult] = await db.select({ count: sql<number>`count(*)` }).from(parts);
  const [totalSuppliersResult] = await db.select({ count: sql<number>`count(*)` }).from(suppliers);
  const [totalCustomersResult] = await db.select({ count: sql<number>`count(*)` }).from(customers);
  const [lowStockCountResult] = await db.select({ count: sql<number>`count(*)` }).from(parts).where(
    sql`${parts.stockQuantity} < ${parts.minStockThreshold}`
  );

  return {
    totalParts: totalPartsResult?.count || 0,
    totalSuppliers: totalSuppliersResult?.count || 0,
    totalCustomers: totalCustomersResult?.count || 0,
    lowStockCount: lowStockCountResult?.count || 0,
  };
}

// ===== Credits (Customer Returns) =====
export async function getAllCredits() {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db
    .select({
      id: credits.id,
      creditNumber: credits.creditNumber,
      customerId: credits.customerId,
      customerName: customers.name,
      customerNumber: credits.customerNumber,
      creditDate: credits.creditDate,
      creditTime: credits.creditTime,
      originalInvoiceNumber: credits.originalInvoiceNumber,
      totalAmount: credits.totalAmount,
      status: credits.status,
      reason: credits.reason,
      notes: credits.notes,
      createdBy: credits.createdBy,
      createdByName: users.name,
      createdAt: credits.createdAt,
    })
    .from(credits)
    .leftJoin(customers, eq(credits.customerId, customers.id))
    .leftJoin(users, eq(credits.createdBy, users.id))
    .orderBy(desc(credits.createdAt));
  
  return results;
}

export async function getCreditById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [credit] = await db
    .select({
      id: credits.id,
      creditNumber: credits.creditNumber,
      customerId: credits.customerId,
      customerName: customers.name,
      customerNumber: credits.customerNumber,
      creditDate: credits.creditDate,
      creditTime: credits.creditTime,
      originalInvoiceNumber: credits.originalInvoiceNumber,
      totalAmount: credits.totalAmount,
      status: credits.status,
      reason: credits.reason,
      notes: credits.notes,
      createdBy: credits.createdBy,
      createdByName: users.name,
      createdAt: credits.createdAt,
    })
    .from(credits)
    .leftJoin(customers, eq(credits.customerId, customers.id))
    .leftJoin(users, eq(credits.createdBy, users.id))
    .where(eq(credits.id, id));
  
  if (!credit) return null;
  
  const items = await db
    .select({
      id: creditItems.id,
      partId: creditItems.partId,
      partName: parts.name,
      partSku: parts.sku,
      quantity: creditItems.quantity,
      unitPrice: creditItems.unitPrice,
      subtotal: creditItems.subtotal,
    })
    .from(creditItems)
    .leftJoin(parts, eq(creditItems.partId, parts.id))
    .where(eq(creditItems.creditId, id));
  
  return { ...credit, items };
}

export async function createCredit(data: {
  creditNumber: string;
  customerId: number;
  customerNumber?: string;
  originalInvoiceNumber?: string;
  totalAmount: string;
  reason?: string;
  notes?: string;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(credits).values(data);
  return (await db.select().from(credits).where(eq(credits.id, Number(result.insertId))))[0]!;
}

export async function createCreditItem(data: {
  creditId: number;
  partId: number;
  quantity: number;
  unitPrice: string;
  subtotal: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(creditItems).values(data);
}

export async function updateCreditStatus(id: number, status: "pending" | "completed" | "cancelled"): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(credits).set({ status }).where(eq(credits.id, id));
}

// ===== Warranties =====
export async function getAllWarranties() {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db
    .select({
      id: warranties.id,
      warrantyNumber: warranties.warrantyNumber,
      customerId: warranties.customerId,
      customerName: customers.name,
      customerNumber: warranties.customerNumber,
      warrantyDate: warranties.warrantyDate,
      warrantyTime: warranties.warrantyTime,
      originalInvoiceNumber: warranties.originalInvoiceNumber,
      totalAmount: warranties.totalAmount,
      status: warranties.status,
      claimReason: warranties.claimReason,
      notes: warranties.notes,
      createdBy: warranties.createdBy,
      createdByName: users.name,
      createdAt: warranties.createdAt,
    })
    .from(warranties)
    .leftJoin(customers, eq(warranties.customerId, customers.id))
    .leftJoin(users, eq(warranties.createdBy, users.id))
    .orderBy(desc(warranties.createdAt));
  
  return results;
}

export async function getWarrantyById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [warranty] = await db
    .select({
      id: warranties.id,
      warrantyNumber: warranties.warrantyNumber,
      customerId: warranties.customerId,
      customerName: customers.name,
      customerNumber: warranties.customerNumber,
      warrantyDate: warranties.warrantyDate,
      warrantyTime: warranties.warrantyTime,
      originalInvoiceNumber: warranties.originalInvoiceNumber,
      totalAmount: warranties.totalAmount,
      status: warranties.status,
      claimReason: warranties.claimReason,
      notes: warranties.notes,
      createdBy: warranties.createdBy,
      createdByName: users.name,
      createdAt: warranties.createdAt,
    })
    .from(warranties)
    .leftJoin(customers, eq(warranties.customerId, customers.id))
    .leftJoin(users, eq(warranties.createdBy, users.id))
    .where(eq(warranties.id, id));
  
  if (!warranty) return null;
  
  const items = await db
    .select({
      id: warrantyItems.id,
      partId: warrantyItems.partId,
      partName: parts.name,
      partSku: parts.sku,
      quantity: warrantyItems.quantity,
      unitPrice: warrantyItems.unitPrice,
      subtotal: warrantyItems.subtotal,
    })
    .from(warrantyItems)
    .leftJoin(parts, eq(warrantyItems.partId, parts.id))
    .where(eq(warrantyItems.warrantyId, id));
  
  return { ...warranty, items };
}

export async function createWarranty(data: {
  warrantyNumber: string;
  customerId: number;
  customerNumber?: string;
  originalInvoiceNumber?: string;
  totalAmount: string;
  claimReason?: string;
  notes?: string;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(warranties).values(data);
  return (await db.select().from(warranties).where(eq(warranties.id, Number(result.insertId))))[0]!;
}

export async function createWarrantyItem(data: {
  warrantyId: number;
  partId: number;
  quantity: number;
  unitPrice: string;
  subtotal: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(warrantyItems).values(data);
}

export async function updateWarrantyStatus(id: number, status: "pending" | "approved" | "rejected" | "completed"): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(warranties).set({ status }).where(eq(warranties.id, id));
}


// ===== Audit Logs =====
export async function createAuditLog(data: {
  userId: number;
  userName?: string;
  action: "create" | "update" | "delete";
  entityType: string;
  entityId: number;
  entityName?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<AuditLog> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [log] = await db.insert(auditLogs).values({
    userId: data.userId,
    userName: data.userName,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    entityName: data.entityName,
    changes: data.changes ? JSON.stringify(data.changes) : null,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
  }).$returningId();

  const created = await db.select().from(auditLogs).where(eq(auditLogs.id, log.id)).limit(1);
  return created[0];
}

export async function getAllAuditLogs(filters?: {
  userId?: number;
  action?: "create" | "update" | "delete";
  entityType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<AuditLog[]> {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(auditLogs);

  const conditions = [];
  if (filters?.userId) {
    conditions.push(eq(auditLogs.userId, filters.userId));
  }
  if (filters?.action) {
    conditions.push(eq(auditLogs.action, filters.action));
  }
  if (filters?.entityType) {
    conditions.push(eq(auditLogs.entityType, filters.entityType));
  }
  if (filters?.startDate) {
    conditions.push(sql`${auditLogs.createdAt} >= ${filters.startDate}`);
  }
  if (filters?.endDate) {
    conditions.push(sql`${auditLogs.createdAt} <= ${filters.endDate}`);
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  query = query.orderBy(desc(auditLogs.createdAt)) as any;

  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }

  return await query;
}

export async function getAuditLogsByEntity(entityType: string, entityId: number): Promise<AuditLog[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(auditLogs)
    .where(and(
      eq(auditLogs.entityType, entityType),
      eq(auditLogs.entityId, entityId)
    ))
    .orderBy(desc(auditLogs.createdAt));
}


export async function deleteCredit(creditId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete credit items first
  await db.delete(creditItems).where(eq(creditItems.creditId, creditId));
  
  // Delete the credit
  await db.delete(credits).where(eq(credits.id, creditId));
}

export async function deleteWarranty(warrantyId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete warranty items first
  await db.delete(warrantyItems).where(eq(warrantyItems.warrantyId, warrantyId));
  
  // Delete the warranty
  await db.delete(warranties).where(eq(warranties.id, warrantyId));
}

export async function getSalesHistoryByPartSku(sku: string): Promise<Array<{
  invoiceId: number;
  invoiceNumber: string;
  invoiceDate: Date;
  quantity: number;
  unitPrice: string;
  customerName: string;
}>> {
  const db = await getDb();
  if (!db) return [];

  // Find the part by SKU
  const part = await db.select().from(parts).where(eq(parts.sku, sku)).limit(1);
  if (!part || part.length === 0) return [];

  const partId = part[0].id;

  // Get sales history for this part
  const history = await db
    .select({
      invoiceId: salesInvoices.id,
      invoiceNumber: salesInvoices.invoiceNumber,
      invoiceDate: salesInvoices.invoiceDate,
      quantity: salesInvoiceItems.quantity,
      unitPrice: salesInvoiceItems.unitPrice,
      customerName: customers.name,
    })
    .from(salesInvoiceItems)
    .innerJoin(salesInvoices, eq(salesInvoiceItems.salesInvoiceId, salesInvoices.id))
    .innerJoin(customers, eq(salesInvoices.customerId, customers.id))
    .where(eq(salesInvoiceItems.partId, partId))
    .orderBy(desc(salesInvoices.invoiceDate));

  return history;
}

// Delete purchase order and all related records
export async function deletePurchaseOrder(orderId: number) {
  const dbConn = await getDb();
  if (!dbConn) throw new Error("Database connection failed");
  
  // Delete purchase order items first
  await dbConn.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, orderId));
  
  // Delete inventory ledger entries (using referenceType and referenceId)
  await dbConn.delete(inventoryLedger).where(
    and(
      eq(inventoryLedger.referenceType, "purchase_order"),
      eq(inventoryLedger.referenceId, orderId)
    )
  );
  
  // Delete the purchase order
  await dbConn.delete(purchaseOrders).where(eq(purchaseOrders.id, orderId));
}

// Delete sales invoice and all related records
export async function deleteSalesInvoice(invoiceId: number) {
  const dbConn = await getDb();
  if (!dbConn) throw new Error("Database connection failed");
  
  // Delete sales invoice items first
  await dbConn.delete(salesInvoiceItems).where(eq(salesInvoiceItems.salesInvoiceId, invoiceId));
  
  // Delete inventory ledger entries (using referenceType and referenceId)
  await dbConn.delete(inventoryLedger).where(
    and(
      eq(inventoryLedger.referenceType, "sales_invoice"),
      eq(inventoryLedger.referenceId, invoiceId)
    )
  );
  
  // Delete the sales invoice
  await dbConn.delete(salesInvoices).where(eq(salesInvoices.id, invoiceId));
}

/**
 * Get complete history of all operations for a specific part
 * Returns sales, purchases, credits, warranties, and inventory adjustments
 */
export async function getPartHistory(partId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  // Get sales history
  const salesHistory = await db
    .select({
      id: salesInvoiceItems.id,
      recordId: salesInvoices.id, // 用于链接跳转的主记录ID
      type: sql<string>`'sale'`.as('type'),
      date: salesInvoices.invoiceDate,
      time: salesInvoices.invoiceTime,
      referenceNumber: salesInvoices.invoiceNumber,
      quantity: salesInvoiceItems.quantity,
      unitPrice: salesInvoiceItems.unitPrice,
      totalAmount: sql<string>`${salesInvoiceItems.quantity} * ${salesInvoiceItems.unitPrice}`,
      customerName: customers.name,
      notes: salesInvoices.notes,
      createdAt: salesInvoices.createdAt,
    })
    .from(salesInvoiceItems)
    .innerJoin(salesInvoices, eq(salesInvoiceItems.salesInvoiceId, salesInvoices.id))
    .leftJoin(customers, eq(salesInvoices.customerId, customers.id))
    .where(eq(salesInvoiceItems.partId, partId))
    .orderBy(desc(salesInvoices.invoiceDate));
  
  // Get purchase history
  const purchaseHistory = await db
    .select({
      id: purchaseOrderItems.id,
      recordId: purchaseOrders.id, // 用于链接跳转的主记录ID
      type: sql<string>`'purchase'`.as('type'),
      date: purchaseOrders.orderDate,
      time: sql<string>`NULL`.as('time'),
      referenceNumber: purchaseOrders.orderNumber,
      quantity: purchaseOrderItems.quantity,
      unitPrice: purchaseOrderItems.unitPrice,
      totalAmount: sql<string>`${purchaseOrderItems.quantity} * ${purchaseOrderItems.unitPrice}`,
      supplierName: suppliers.name,
      notes: purchaseOrders.notes,
      createdAt: purchaseOrders.createdAt,
    })
    .from(purchaseOrderItems)
    .innerJoin(purchaseOrders, eq(purchaseOrderItems.purchaseOrderId, purchaseOrders.id))
    .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
    .where(eq(purchaseOrderItems.partId, partId))
    .orderBy(desc(purchaseOrders.orderDate));
  
  // Get credit (return) history
  const creditHistory = await db
    .select({
      id: creditItems.id,
      recordId: credits.id, // 用于链接跳转的主记录ID
      type: sql<string>`'credit'`.as('type'),
      date: credits.creditDate,
      time: credits.creditTime,
      referenceNumber: credits.creditNumber,
      quantity: creditItems.quantity,
      unitPrice: creditItems.unitPrice,
      totalAmount: sql<string>`${creditItems.quantity} * ${creditItems.unitPrice}`,
      customerName: customers.name,
      notes: credits.notes,
      createdAt: credits.createdAt,
    })
    .from(creditItems)
    .innerJoin(credits, eq(creditItems.creditId, credits.id))
    .leftJoin(customers, eq(credits.customerId, customers.id))
    .where(eq(creditItems.partId, partId))
    .orderBy(desc(credits.creditDate));
  
  // Get warranty history
  const warrantyHistory = await db
    .select({
      id: warrantyItems.id,
      recordId: warranties.id, // 用于链接跳转的主记录ID
      type: sql<string>`'warranty'`.as('type'),
      date: warranties.warrantyDate,
      time: warranties.warrantyTime,
      referenceNumber: warranties.warrantyNumber,
      quantity: warrantyItems.quantity,
      unitPrice: warrantyItems.unitPrice,
      totalAmount: sql<string>`${warrantyItems.quantity} * ${warrantyItems.unitPrice}`,
      customerName: customers.name,
      notes: warranties.notes,
      createdAt: warranties.createdAt,
    })
    .from(warrantyItems)
    .innerJoin(warranties, eq(warrantyItems.warrantyId, warranties.id))
    .leftJoin(customers, eq(warranties.customerId, customers.id))
    .where(eq(warrantyItems.partId, partId))
    .orderBy(desc(warranties.warrantyDate));
  
  // Get inventory adjustment history
  const adjustmentHistory = await db
    .select({
      id: inventoryLedger.id,
      recordId: sql<number>`NULL`.as('recordId'), // 调整记录没有详情页
      type: inventoryLedger.transactionType,
      date: sql<Date>`DATE(${inventoryLedger.createdAt})`.as('date'),
      time: sql<string>`TIME(${inventoryLedger.createdAt})`.as('time'),
      referenceNumber: inventoryLedger.referenceType,
      quantity: inventoryLedger.quantity,
      unitPrice: sql<string>`NULL`.as('unitPrice'),
      totalAmount: sql<string>`NULL`.as('totalAmount'),
      notes: inventoryLedger.notes,
      createdAt: inventoryLedger.createdAt,
    })
    .from(inventoryLedger)
    .where(
      and(
        eq(inventoryLedger.partId, partId),
        eq(inventoryLedger.transactionType, "adjustment")
      )
    )
    .orderBy(desc(inventoryLedger.createdAt));
  
  // Combine all histories and sort by date
  const allHistory = [
    ...salesHistory.map(h => ({ ...h, category: 'sales' as const })),
    ...purchaseHistory.map(h => ({ ...h, category: 'purchase' as const, customerName: h.supplierName })),
    ...creditHistory.map(h => ({ ...h, category: 'credit' as const })),
    ...warrantyHistory.map(h => ({ ...h, category: 'warranty' as const })),
    ...adjustmentHistory.map(h => ({ ...h, category: 'adjustment' as const, customerName: null })),
  ].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });
  
  return allHistory;
}

/**
 * Adjust stock quantity for a part
 * @param partId - The ID of the part
 * @param quantityChange - The quantity to add (positive) or subtract (negative)
 * @param options - Optional parameters for the adjustment
 * @returns The updated part with new stock quantity
 */
export async function adjustStock(
  partId: number,
  quantityChange: number,
  options?: {
    referenceType?: string;
    referenceId?: number;
    notes?: string;
    operatedBy?: number;
  }
) {
  // Get current part
  const part = await getPartById(partId);
  if (!part) {
    throw new Error(`Part with ID ${partId} not found`);
  }

  // Calculate new stock quantity
  const newStock = part.stockQuantity + quantityChange;
  if (newStock < 0) {
    throw new Error(`Insufficient stock for part ${part.sku}. Current: ${part.stockQuantity}, Requested: ${Math.abs(quantityChange)}`);
  }

  // Update part stock quantity
  await updatePart(partId, { stockQuantity: newStock });

  // Create inventory ledger entry
  await createInventoryLedgerEntry({
    partId,
    transactionType: "adjustment",
    quantity: quantityChange,
    balanceAfter: newStock,
    referenceType: options?.referenceType || "adjustment",
    referenceId: options?.referenceId,
    notes: options?.notes || "库存调整",
    operatedBy: options?.operatedBy || 1, // Default to system user
  });

  // Check for low stock and create alert if needed
  if (newStock < part.minStockThreshold) {
    await createLowStockAlert({
      partId,
      currentStock: newStock,
      minThreshold: part.minStockThreshold,
    });
  }

  return await getPartById(partId);
}
