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
  // Basic info
  lineCodeId?: number | null;
  sku: string;
  name: string;
  description?: string;
  categoryId?: number | null;
  supplierId?: number | null;
  
  // Inventory
  stockQuantity?: number;
  minStockThreshold?: number;
  orderQty?: number | null;
  
  // Pricing
  list?: string | null;
  cost?: string | null;
  retail?: string | null;
  unitPrice: string;
  coreCost?: string | null;
  coreRetail?: string | null;
  
  // Order info
  orderMultiple?: number | null;
  
  // Units
  stockingUnit?: string | null;
  purchaseUnit?: string | null;
  unit?: string;
  
  // Additional
  manufacturer?: string | null;
  mfgPartNumber?: string | null;
  weight?: string | null;
  imageUrl?: string | null;
}): Promise<Part> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(parts).values(data);
  return (await db.select().from(parts).where(eq(parts.id, Number(result.insertId))))[0]!;
}

export async function bulkCreateParts(partsData: Array<{
  sku: string;
  name: string;
  categoryId?: number | null;
  supplierId?: number | null;
  description?: string;
  unitPrice: string;
  currentStock?: number;
  minStock?: number;
}>): Promise<{ success: number; failed: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let success = 0;
  let failed = 0;

  for (const partData of partsData) {
    try {
      await db.insert(parts).values({
        sku: partData.sku,
        name: partData.name,
        categoryId: partData.categoryId || undefined,
        supplierId: partData.supplierId || undefined,
        description: partData.description || "",
        unitPrice: partData.unitPrice,
        stockQuantity: partData.currentStock || 0,
        minStockThreshold: partData.minStock || 0,
        unit: "个",
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
  await db.delete(purchaseOrders).where(eq(purchaseOrders.supplierId, supplierId));
  await db.delete(parts).where(eq(parts.supplierId, supplierId));
  
  // 删除供应商
  await db.delete(suppliers).where(eq(suppliers.id, supplierId));
}

export async function forceDeleteCustomer(customerId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("数据库连接失败");

  // 删除所有相关记录
  await db.delete(salesInvoices).where(eq(salesInvoices.customerId, customerId));
  
  // 删除客户
  await db.delete(customers).where(eq(customers.id, customerId));
}

/**
 * Force delete a part and all its related records (admin only)
 */
export async function forceDeletePart(partId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete inventory ledger entries
  await db.delete(inventoryLedger).where(eq(inventoryLedger.partId, partId));
  
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
  transactionType: "in" | "out" | "adjustment";
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
  const [order] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).limit(1);
  if (!order) return undefined;
  
  const items = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, id));
  return { ...order, items };
}

export async function createPurchaseOrder(data: {
  orderNumber: string;
  supplierId: number;
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
  const [invoice] = await db.select().from(salesInvoices).where(eq(salesInvoices.id, id)).limit(1);
  if (!invoice) return undefined;
  
  const items = await db.select().from(salesInvoiceItems).where(eq(salesInvoiceItems.salesInvoiceId, id));
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
