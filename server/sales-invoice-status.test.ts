import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";
import { appRouter } from "./routers";

describe("Sales Invoice Status Management", () => {
  let testInvoiceId: number;
  const userId = 1; // Fixed test user ID

  beforeAll(async () => {
    // Create test customer
    const customer = await db.createCustomer({
      name: "Test Customer for Status",
      phone: "1234567890",
    });

    // Create test part
    const part = await db.createPart({
      sku: "TEST-STATUS-001",
      name: "Test Part for Status",
      category: "Test",
      lineCode: "TEST",
      stockQuantity: 100,
      unitPrice: "10.00",
      minStockThreshold: 10,
    });

    // Create test invoice
    const invoice = await db.createSalesInvoice({
      invoiceNumber: `TEST-STATUS-${Date.now()}`,
      customerId: customer.id,
      totalAmount: "100.00",
      createdBy: userId,
    });

    await db.createSalesInvoiceItem({
      salesInvoiceId: invoice.id,
      partId: part.id,
      quantity: 10,
      unitPrice: "10.00",
      subtotal: "100.00",
    });

    testInvoiceId = invoice.id;
  });

  it("should update invoice status to pending", async () => {
    const caller = appRouter.createCaller({ user: { id: userId, role: "admin" } } as any);
    
    const result = await caller.salesInvoices.updateStatus({
      id: testInvoiceId,
      status: "pending",
    });

    expect(result.success).toBe(true);

    const invoice = await db.getSalesInvoiceById(testInvoiceId);
    expect(invoice?.status).toBe("pending");
  });

  it("should update invoice status to completed", async () => {
    const caller = appRouter.createCaller({ user: { id: userId, role: "admin" } } as any);
    
    const result = await caller.salesInvoices.updateStatus({
      id: testInvoiceId,
      status: "completed",
    });

    expect(result.success).toBe(true);

    const invoice = await db.getSalesInvoiceById(testInvoiceId);
    expect(invoice?.status).toBe("completed");
  });

  it("should update invoice status to cancelled", async () => {
    const caller = appRouter.createCaller({ user: { id: userId, role: "admin" } } as any);
    
    const result = await caller.salesInvoices.updateStatus({
      id: testInvoiceId,
      status: "cancelled",
    });

    expect(result.success).toBe(true);

    const invoice = await db.getSalesInvoiceById(testInvoiceId);
    expect(invoice?.status).toBe("cancelled");
  });

  it("should allow status transition from cancelled back to completed", async () => {
    const caller = appRouter.createCaller({ user: { id: userId, role: "admin" } } as any);
    
    // First set to cancelled
    await caller.salesInvoices.updateStatus({
      id: testInvoiceId,
      status: "cancelled",
    });

    // Then change back to completed
    const result = await caller.salesInvoices.updateStatus({
      id: testInvoiceId,
      status: "completed",
    });

    expect(result.success).toBe(true);

    const invoice = await db.getSalesInvoiceById(testInvoiceId);
    expect(invoice?.status).toBe("completed");
  });
});
