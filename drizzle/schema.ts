import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Line codes table
 */
export const lineCodes = mysqlTable("line_codes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LineCode = typeof lineCodes.$inferSelect;
export type InsertLineCode = typeof lineCodes.$inferInsert;

/**
 * Part categories table
 */
export const partCategories = mysqlTable("part_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PartCategory = typeof partCategories.$inferSelect;
export type InsertPartCategory = typeof partCategories.$inferInsert;

/**
 * Suppliers table
 */
export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  contactPerson: varchar("contactPerson", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  accountsPayable: decimal("accountsPayable", { precision: 15, scale: 2 }).default("0.00").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

/**
 * Customers table
 */
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  contactPerson: varchar("contactPerson", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  accountsReceivable: decimal("accountsReceivable", { precision: 15, scale: 2 }).default("0.00").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

/**
 * Parts table
 */
export const parts = mysqlTable("parts", {
  id: int("id").autoincrement().primaryKey(),
  sku: varchar("sku", { length: 100 }).notNull(), // Part
  name: varchar("name", { length: 200 }).notNull(), // Description
  lineCodeId: int("lineCodeId").references(() => lineCodes.id), // Line
  categoryId: int("categoryId").references(() => partCategories.id),
  supplierId: int("supplierId").references(() => suppliers.id), // Vendor
  description: text("description"),
  
  // Pricing fields
  listPrice: decimal("listPrice", { precision: 15, scale: 2 }), // List
  cost: decimal("cost", { precision: 15, scale: 2 }), // Cost
  retail: decimal("retail", { precision: 15, scale: 2 }), // Retail
  coreCost: decimal("coreCost", { precision: 15, scale: 2 }), // Core Cost
  coreRetail: decimal("coreRetail", { precision: 15, scale: 2 }), // Core Retail
  unitPrice: decimal("unitPrice", { precision: 15, scale: 2 }).notNull(), // 保留兼容性
  
  // Inventory fields
  stockQuantity: int("stockQuantity").default(0).notNull(),
  minStockThreshold: int("minStockThreshold").default(10).notNull(),
  orderQty: int("orderQty").default(0), // Order Qty
  orderMultiple: int("orderMultiple").default(1), // Order Multiple
  
  // Units
  stockingUnit: varchar("stockingUnit", { length: 20 }).default("EA"), // Stocking Unit
  purchaseUnit: varchar("purchaseUnit", { length: 20 }).default("EA"), // Purchase Unit
  unit: varchar("unit", { length: 50 }).default("件").notNull(), // 保留兼容性
  
  // Additional fields
  manufacturer: varchar("manufacturer", { length: 200 }), // Manufacturer
  mfgPartNumber: varchar("mfgPartNumber", { length: 100 }), // Mfg Part #
  weight: decimal("weight", { precision: 10, scale: 2 }), // Weight
  imageUrl: varchar("imageUrl", { length: 500 }), // Part Image URL
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Part = typeof parts.$inferSelect;
export type InsertPart = typeof parts.$inferInsert;

/**
 * Purchase orders table
 */
export const purchaseOrders = mysqlTable("purchase_orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 100 }).notNull().unique(),
  supplierId: int("supplierId").notNull().references(() => suppliers.id),
  orderDate: timestamp("orderDate").defaultNow().notNull(),
  orderTime: varchar("orderTime", { length: 10 }), // Time in HH:MM:SS format
  type: mysqlEnum("type", ["purchase", "return"]).default("purchase").notNull(), // Purchase or Return
  totalAmount: decimal("totalAmount", { precision: 15, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "received", "cancelled"]).default("pending").notNull(),
  notes: text("notes"),
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;

/**
 * Purchase order items table
 */
export const purchaseOrderItems = mysqlTable("purchase_order_items", {
  id: int("id").autoincrement().primaryKey(),
  purchaseOrderId: int("purchaseOrderId").notNull().references(() => purchaseOrders.id, { onDelete: "cascade" }),
  partId: int("partId").notNull().references(() => parts.id),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 15, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;

/**
 * Sales invoices table
 */
export const salesInvoices = mysqlTable("sales_invoices", {
  id: int("id").autoincrement().primaryKey(),
  invoiceNumber: varchar("invoiceNumber", { length: 100 }).notNull().unique(), // Doc #
  customerId: int("customerId").notNull().references(() => customers.id), // Cust #
  customerNumber: varchar("customerNumber", { length: 50 }), // Customer's own reference number
  invoiceDate: timestamp("invoiceDate").defaultNow().notNull(), // Date
  invoiceTime: varchar("invoiceTime", { length: 10 }), // Time in HH:MM:SS format
  type: mysqlEnum("type", ["invoice", "return", "credit"]).default("invoice").notNull(), // Type: Invoice/Return/Credit
  totalAmount: decimal("totalAmount", { precision: 15, scale: 2 }).notNull(), // Total
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("pending").notNull(),
  notes: text("notes"),
  createdBy: int("createdBy").notNull().references(() => users.id), // Counterman
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SalesInvoice = typeof salesInvoices.$inferSelect;
export type InsertSalesInvoice = typeof salesInvoices.$inferInsert;

/**
 * Sales invoice items table
 */
export const salesInvoiceItems = mysqlTable("sales_invoice_items", {
  id: int("id").autoincrement().primaryKey(),
  salesInvoiceId: int("salesInvoiceId").notNull().references(() => salesInvoices.id, { onDelete: "cascade" }),
  partId: int("partId").notNull().references(() => parts.id),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 15, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SalesInvoiceItem = typeof salesInvoiceItems.$inferSelect;
export type InsertSalesInvoiceItem = typeof salesInvoiceItems.$inferInsert;

/**
 * Inventory ledger table - tracks all inventory movements
 */
export const inventoryLedger = mysqlTable("inventory_ledger", {
  id: int("id").autoincrement().primaryKey(),
  partId: int("partId").notNull().references(() => parts.id),
  transactionType: mysqlEnum("transactionType", ["in", "out", "adjustment"]).notNull(),
  quantity: int("quantity").notNull(),
  balanceAfter: int("balanceAfter").notNull(),
  referenceType: varchar("referenceType", { length: 50 }),
  referenceId: int("referenceId"),
  notes: text("notes"),
  operatedBy: int("operatedBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InventoryLedgerEntry = typeof inventoryLedger.$inferSelect;
export type InsertInventoryLedgerEntry = typeof inventoryLedger.$inferInsert;

/**
 * Low stock alerts table
 */
export const lowStockAlerts = mysqlTable("low_stock_alerts", {
  id: int("id").autoincrement().primaryKey(),
  partId: int("partId").notNull().references(() => parts.id),
  currentStock: int("currentStock").notNull(),
  minThreshold: int("minThreshold").notNull(),
  isResolved: boolean("isResolved").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export type LowStockAlert = typeof lowStockAlerts.$inferSelect;
export type InsertLowStockAlert = typeof lowStockAlerts.$inferInsert;
