import { eq, desc, sql, and, or, like, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  parts, 
  suppliers, 
  customers, 
  partCategories,
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
export async function getAllParts(): Promise<Part[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(parts).orderBy(desc(parts.createdAt));
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
  sku: string;
  name: string;
  categoryId?: number;
  supplierId?: number;
  description?: string;
  unitPrice: string;
  stockQuantity?: number;
  minStockThreshold?: number;
  unit?: string;
}): Promise<Part> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(parts).values(data);
  return (await db.select().from(parts).where(eq(parts.id, Number(result.insertId))))[0]!;
}

export async function updatePart(id: number, data: Partial<Part>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(parts).set(data).where(eq(parts.id, id));
}

export async function deletePart(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(parts).where(eq(parts.id, id));
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
