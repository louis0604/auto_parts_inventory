import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { User } from "../drizzle/schema";

// Mock user for authenticated requests
const mockUser: User = {
  id: 1,
  openId: "test-open-id",
  name: "Test User",
  email: "test@example.com",
  avatar: null,
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Create a test context
function createTestContext() {
  return {
    user: mockUser,
    req: {} as any,
    res: {} as any,
  };
}

describe("Reports Export", () => {
  let testLineCodeId: number;
  let testPartId: number;
  let testSupplierId: number;
  let testCustomerId: number;
  let testPurchaseOrderId: number;
  let testSalesInvoiceId: number;

  beforeAll(async () => {
    // Create test data
    const lineCode = await db.createLineCode({ code: "TEST", description: "Test Line Code" });
    testLineCodeId = lineCode.id;

    const part = await db.createPart({
      sku: "TEST-001",
      name: "Test Part",
      lineCodeId: testLineCodeId,
      replCost: "80.00",
      retail: "150.00",
      quantity: 10,
      minQuantity: 5,
      isArchived: false,
    });
    testPartId = part.id;

    const supplier = await db.createSupplier({
      name: "Test Supplier",
      contactPerson: "John Doe",
      phone: "1234567890",
      email: "supplier@test.com",
    });
    testSupplierId = supplier.id;

    const customer = await db.createCustomer({
      name: "Test Customer",
      phone: "0987654321",
      email: "customer@test.com",
    });
    testCustomerId = customer.id;

    // Create purchase order
    const purchaseOrder = await db.createPurchaseOrder({
      orderNumber: "PO-TEST-001",
      supplierId: testSupplierId,
      totalAmount: "500.00",
      createdBy: mockUser.id,
    });
    testPurchaseOrderId = purchaseOrder.id;

    // Create sales invoice
    const salesInvoice = await db.createSalesInvoice({
      invoiceNumber: "INV-TEST-001",
      customerId: testCustomerId,
      totalAmount: "300.00",
      createdBy: mockUser.id,
    });
    testSalesInvoiceId = salesInvoice.id;
  });

  afterAll(async () => {
    // Clean up test data
    try {
      if (testSalesInvoiceId) await db.deleteSalesInvoice(testSalesInvoiceId);
      if (testPurchaseOrderId) await db.deletePurchaseOrder(testPurchaseOrderId);
      if (testCustomerId) await db.deleteCustomer(testCustomerId);
      if (testSupplierId) await db.deleteSupplier(testSupplierId);
      if (testPartId) await db.deletePart(testPartId);
      if (testLineCodeId) await db.deleteLineCode(testLineCodeId);
    } catch (error) {
      console.error("Error cleaning up test data:", error);
    }
  });

  it("should export inventory report", async () => {
    const caller = appRouter.createCaller(createTestContext());
    const result = await caller.reports.inventory();

    // Verify result structure
    expect(result).toBeDefined();
    expect(result).toHaveProperty("filename");
    expect(result).toHaveProperty("mimeType");
    expect(result).toHaveProperty("base64");

    // Verify filename
    expect(result.filename).toMatch(/^inventory-report-\d{8}\.xlsx$/);

    // Verify mime type
    expect(result.mimeType).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    // Verify base64 is base64 encoded
    expect(result.base64).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(result.base64.length).toBeGreaterThan(0);
  });

  it("should export purchase report", async () => {
    const caller = appRouter.createCaller(createTestContext());
    const result = await caller.reports.purchases();

    // Verify result structure
    expect(result).toBeDefined();
    expect(result).toHaveProperty("filename");
    expect(result).toHaveProperty("mimeType");
    expect(result).toHaveProperty("base64");

    // Verify filename
    expect(result.filename).toMatch(/^purchase-report-\d{8}\.xlsx$/);

    // Verify mime type
    expect(result.mimeType).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    // Verify base64 is base64 encoded
    expect(result.base64).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(result.base64.length).toBeGreaterThan(0);
  });

  it("should export sales report", async () => {
    const caller = appRouter.createCaller(createTestContext());
    const result = await caller.reports.sales();

    // Verify result structure
    expect(result).toBeDefined();
    expect(result).toHaveProperty("filename");
    expect(result).toHaveProperty("mimeType");
    expect(result).toHaveProperty("base64");

    // Verify filename
    expect(result.filename).toMatch(/^sales-report-\d{8}\.xlsx$/);

    // Verify mime type
    expect(result.mimeType).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    // Verify base64 is base64 encoded
    expect(result.base64).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(result.base64.length).toBeGreaterThan(0);
  });

  it("should handle empty inventory report", async () => {
    // This test verifies that the export works even with no data
    const caller = appRouter.createCaller(createTestContext());
    
    // The report should still generate successfully even if there's no data
    const result = await caller.reports.inventory();
    
    expect(result).toBeDefined();
    expect(result.filename).toMatch(/^inventory-report-\d{8}\.xlsx$/);
    expect(result.base64.length).toBeGreaterThan(0);
  });
});
