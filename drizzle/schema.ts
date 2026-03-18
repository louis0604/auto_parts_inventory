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
  sku: varchar("sku", { length: 100 }).notNull(), // Part Number (必填)
  name: varchar("name", { length: 200 }).notNull(), // Description (必填)
  lineCodeId: int("lineCodeId").notNull().references(() => lineCodes.id), // Line (必填)
  categoryId: int("categoryId").references(() => partCategories.id), // 可选
  supplierId: int("supplierId").references(() => suppliers.id), // Vendor (可选)
  description: text("description"), // 可选
  
  // Pricing fields
  listPrice: decimal("listPrice", { precision: 15, scale: 2 }), // List (可选)
  cost: decimal("cost", { precision: 15, scale: 2 }), // Cost (可选)
  retail: decimal("retail", { precision: 15, scale: 2 }).notNull(), // Retail (必填)
  replCost: decimal("replCost", { precision: 15, scale: 2 }).notNull(), // Repl Cost (必填)
  avgCost: decimal("avgCost", { precision: 15, scale: 2 }), // Average Cost (可选)
  price1: decimal("price1", { precision: 15, scale: 2 }), // Price 1 (可选)
  price2: decimal("price2", { precision: 15, scale: 2 }), // Price 2 (可选)
  price3: decimal("price3", { precision: 15, scale: 2 }), // Price 3 (可选)
  coreCost: decimal("coreCost", { precision: 15, scale: 2 }), // Core Cost (可选)
  coreRetail: decimal("coreRetail", { precision: 15, scale: 2 }), // Core Retail (可选)
  unitPrice: decimal("unitPrice", { precision: 15, scale: 2 }), // 保留兼容性(可选)
  
  // Inventory fields
  stockQuantity: int("stockQuantity").default(0),
  minStockThreshold: int("minStockThreshold").default(10),
  orderPoint: int("orderPoint").default(0), // Order Point (可选)
  orderQty: int("orderQty").default(0), // Order Qty (可选)
  orderMultiple: int("orderMultiple").default(1), // Order Multiple (可选)
  
  // Units
  stockingUnit: varchar("stockingUnit", { length: 20 }).default("EA"), // Stocking Unit (可选)
  purchaseUnit: varchar("purchaseUnit", { length: 20 }).default("EA"), // Purchase Unit (可选)
  unit: varchar("unit", { length: 50 }).default("件"), // 保留兼容性(可选)
  
  // Additional fields
  manufacturer: varchar("manufacturer", { length: 200 }), // Manufacturer (可选)
  mfgPartNumber: varchar("mfgPartNumber", { length: 100 }), // Mfg Part # (可选)
  weight: decimal("weight", { precision: 10, scale: 2 }), // Weight (可选)
  imageUrl: varchar("imageUrl", { length: 500 }), // Part Image URL (可选)
  
  // Category/Group classification
  partGroupId: int("partGroupId").references(() => partGroups.id), // Part group (e.g. Front Disc Brake Rotor)
  
  // Soft delete
  isArchived: boolean("isArchived").default(false),
  archivedAt: timestamp("archivedAt"),
  
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
  type: mysqlEnum("type", ["inbound", "outbound"]).default("inbound").notNull(), // Inbound (入库) or Outbound (出库)
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
  poNumber: varchar("poNumber", { length: 100 }), // P.O. # (Purchase Order reference)
  jobNumber: varchar("jobNumber", { length: 100 }), // Job #
  ref: varchar("ref", { length: 200 }), // Reference
  // Vehicle info
  vehicleYear: int("vehicleYear"),
  vehicleMake: varchar("vehicleMake", { length: 100 }),
  vehicleModel: varchar("vehicleModel", { length: 100 }),
  vehicleEngine: varchar("vehicleEngine", { length: 100 }),
  vehicleVin: varchar("vehicleVin", { length: 50 }),
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
  codes: varchar("codes", { length: 50 }), // Price codes (e.g. C2C, PC, QP)
  suggPrice: decimal("suggPrice", { precision: 15, scale: 2 }), // Suggested retail price
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
  transactionType: mysqlEnum("transactionType", ["purchase", "sale", "credit", "warranty", "adjustment"]).notNull(),
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

/**
 * Credits table - customer returns
 */
export const credits = mysqlTable("credits", {
  id: int("id").autoincrement().primaryKey(),
  creditNumber: varchar("creditNumber", { length: 100 }).notNull().unique(),
  customerId: int("customerId").notNull().references(() => customers.id),
  customerNumber: varchar("customerNumber", { length: 50 }),
  creditDate: timestamp("creditDate").defaultNow().notNull(),
  creditTime: varchar("creditTime", { length: 10 }),
  originalInvoiceId: int("originalInvoiceId").references(() => salesInvoices.id),
  originalInvoiceNumber: varchar("originalInvoiceNumber", { length: 100 }),
  totalAmount: decimal("totalAmount", { precision: 15, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("pending").notNull(),
  reason: text("reason"),
  notes: text("notes"),
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Credit = typeof credits.$inferSelect;
export type InsertCredit = typeof credits.$inferInsert;

/**
 * Credit items table
 */
export const creditItems = mysqlTable("credit_items", {
  id: int("id").autoincrement().primaryKey(),
  creditId: int("creditId").notNull().references(() => credits.id, { onDelete: "cascade" }),
  partId: int("partId").notNull().references(() => parts.id),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 15, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditItem = typeof creditItems.$inferSelect;
export type InsertCreditItem = typeof creditItems.$inferInsert;

/**
 * Warranties table - warranty claims and replacements
 */
export const warranties = mysqlTable("warranties", {
  id: int("id").autoincrement().primaryKey(),
  warrantyNumber: varchar("warrantyNumber", { length: 100 }).notNull().unique(),
  customerId: int("customerId").notNull().references(() => customers.id),
  customerNumber: varchar("customerNumber", { length: 50 }),
  warrantyDate: timestamp("warrantyDate").defaultNow().notNull(),
  warrantyTime: varchar("warrantyTime", { length: 10 }),
  originalInvoiceId: int("originalInvoiceId").references(() => salesInvoices.id),
  originalInvoiceNumber: varchar("originalInvoiceNumber", { length: 100 }),
  totalAmount: decimal("totalAmount", { precision: 15, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "completed"]).default("pending").notNull(),
  claimReason: text("claimReason"),
  notes: text("notes"),
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Warranty = typeof warranties.$inferSelect;
export type InsertWarranty = typeof warranties.$inferInsert;

/**
 * Warranty items table
 */
export const warrantyItems = mysqlTable("warranty_items", {
  id: int("id").autoincrement().primaryKey(),
  warrantyId: int("warrantyId").notNull().references(() => warranties.id, { onDelete: "cascade" }),
  partId: int("partId").notNull().references(() => parts.id),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 15, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WarrantyItem = typeof warrantyItems.$inferSelect;
export type InsertWarrantyItem = typeof warrantyItems.$inferInsert;

/**
 * Audit logs table - tracks all system operations
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  userName: varchar("userName", { length: 200 }),
  action: mysqlEnum("action", ["create", "update", "delete"]).notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(), // parts, customers, suppliers, etc.
  entityId: int("entityId").notNull(),
  entityName: varchar("entityName", { length: 200 }), // Name or identifier of the entity
  changes: text("changes"), // JSON string of changes (for update operations)
  ipAddress: varchar("ipAddress", { length: 50 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Vehicle makes table (e.g. HONDA, FORD, TOYOTA)
 */
export const vehicleMakes = mysqlTable("vehicle_makes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VehicleMake = typeof vehicleMakes.$inferSelect;
export type InsertVehicleMake = typeof vehicleMakes.$inferInsert;

/**
 * Vehicle models table (e.g. CIVIC, ACCORD)
 */
export const vehicleModels = mysqlTable("vehicle_models", {
  id: int("id").autoincrement().primaryKey(),
  makeId: int("makeId").notNull().references(() => vehicleMakes.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VehicleModel = typeof vehicleModels.$inferSelect;
export type InsertVehicleModel = typeof vehicleModels.$inferInsert;

/**
 * Vehicle engines table (year + make + model + engine spec)
 */
export const vehicleEngines = mysqlTable("vehicle_engines", {
  id: int("id").autoincrement().primaryKey(),
  year: int("year").notNull(),
  makeId: int("makeId").notNull().references(() => vehicleMakes.id, { onDelete: "cascade" }),
  modelId: int("modelId").notNull().references(() => vehicleModels.id, { onDelete: "cascade" }),
  engineCode: varchar("engineCode", { length: 50 }), // e.g. "4-1799 1.8L SOHC"
  displacement: varchar("displacement", { length: 50 }), // e.g. "1.8L"
  cylinders: int("cylinders"), // e.g. 4
  fuelType: varchar("fuelType", { length: 30 }), // e.g. "Gas", "Diesel"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VehicleEngine = typeof vehicleEngines.$inferSelect;
export type InsertVehicleEngine = typeof vehicleEngines.$inferInsert;

/**
 * Part groups table (sub-category within a category, e.g. "Engine Filters & PCV")
 */
export const partGroups = mysqlTable("part_groups", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull().references(() => partCategories.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PartGroup = typeof partGroups.$inferSelect;
export type InsertPartGroup = typeof partGroups.$inferInsert;

/**
 * Part vehicle fitments table - which parts fit which vehicles
 */
export const partVehicleFitments = mysqlTable("part_vehicle_fitments", {
  id: int("id").autoincrement().primaryKey(),
  partId: int("partId").notNull().references(() => parts.id, { onDelete: "cascade" }),
  vehicleEngineId: int("vehicleEngineId").references(() => vehicleEngines.id, { onDelete: "cascade" }),
  // Denormalized for flexible lookup without requiring full vehicle record
  yearFrom: int("yearFrom"), // e.g. 2019
  yearTo: int("yearTo"),   // e.g. 2024
  makeId: int("makeId").references(() => vehicleMakes.id, { onDelete: "cascade" }),
  modelId: int("modelId").references(() => vehicleModels.id, { onDelete: "cascade" }),
  engineNote: varchar("engineNote", { length: 200 }), // e.g. "2.5L DOHC"
  notes: text("notes"), // fitment notes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PartVehicleFitment = typeof partVehicleFitments.$inferSelect;
export type InsertPartVehicleFitment = typeof partVehicleFitments.$inferInsert;
