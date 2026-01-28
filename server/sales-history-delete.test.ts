import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Sales History and Delete Features", () => {
  const testUserId = 1;
  let testCustomerId: number;
  let testPartId: number;
  let testSalesInvoiceId: number;
  let testCreditId: number;
  let testWarrantyId: number;

  beforeAll(async () => {
    // Create test customer
    const customer = await db.createCustomer({
      name: "Test Customer for Sales History",
      contactPerson: "John Doe",
      phone: "123-456-7890",
      email: "saleshistory@example.com",
    });
    testCustomerId = customer.id;

    // Create test part with unique SKU
    const part = await db.createPart({
      sku: `SALES-HIST-${Date.now()}`,
      name: "Test Part for Sales History",
      stockQuantity: 100,
      minStockThreshold: 10,
      unit: "EA",
      unitPrice: "50.00",
    });
    testPartId = part.id;

    // Create sales invoice
    const invoice = await db.createSalesInvoice({
      invoiceNumber: `INV-HIST-${Date.now()}`,
      customerId: testCustomerId,
      totalAmount: "100.00",
      createdBy: testUserId,
    });
    testSalesInvoiceId = invoice.id;

    await db.createSalesInvoiceItem({
      salesInvoiceId: testSalesInvoiceId,
      partId: testPartId,
      quantity: 2,
      unitPrice: "50.00",
      subtotal: "100.00",
    });
  });

  describe("Sales History Query", () => {
    it("should retrieve sales history by part SKU", async () => {
      const part = await db.getPartById(testPartId);
      expect(part).toBeTruthy();

      const history = await db.getSalesHistoryByPartSku(part!.sku);
      
      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);

      const record = history[0];
      expect(record).toHaveProperty("invoiceId");
      expect(record).toHaveProperty("invoiceNumber");
      expect(record).toHaveProperty("invoiceDate");
      expect(record).toHaveProperty("quantity");
      expect(record).toHaveProperty("unitPrice");
      expect(record).toHaveProperty("customerName");
      
      expect(record.quantity).toBe(2);
      expect(record.unitPrice).toBe("50.00");
    });

    it("should return empty array for non-existent SKU", async () => {
      const history = await db.getSalesHistoryByPartSku("NON-EXISTENT-SKU");
      expect(history).toEqual([]);
    });
  });

  describe("Credit Delete", () => {
    it("should delete credit and its items", async () => {
      // Create a credit
      const credit = await db.createCredit({
        creditNumber: `CR-DEL-${Date.now()}`,
        customerId: testCustomerId,
        totalAmount: "50.00",
        createdBy: testUserId,
      });

      await db.createCreditItem({
        creditId: credit.id,
        partId: testPartId,
        quantity: 1,
        unitPrice: "50.00",
        subtotal: "50.00",
      });

      // Delete the credit
      await db.deleteCredit(credit.id);

      // Verify credit is deleted
      const deletedCredit = await db.getCreditById(credit.id);
      expect(deletedCredit).toBeFalsy();
    });
  });

  describe("Warranty Delete", () => {
    it("should delete warranty and its items", async () => {
      // Create a warranty
      const warranty = await db.createWarranty({
        warrantyNumber: `WR-DEL-${Date.now()}`,
        customerId: testCustomerId,
        totalAmount: "50.00",
        createdBy: testUserId,
      });

      await db.createWarrantyItem({
        warrantyId: warranty.id,
        partId: testPartId,
        quantity: 1,
        unitPrice: "50.00",
        subtotal: "50.00",
      });

      // Delete the warranty
      await db.deleteWarranty(warranty.id);

      // Verify warranty is deleted
      const deletedWarranty = await db.getWarrantyById(warranty.id);
      expect(deletedWarranty).toBeFalsy();
    });
  });

  describe("Credit Status Management", () => {
    it("should update credit status", async () => {
      // Create a credit
      const credit = await db.createCredit({
        creditNumber: `CR-STATUS-${Date.now()}`,
        customerId: testCustomerId,
        totalAmount: "50.00",
        createdBy: testUserId,
      });

      await db.createCreditItem({
        creditId: credit.id,
        partId: testPartId,
        quantity: 1,
        unitPrice: "50.00",
        subtotal: "50.00",
      });

      // Initial status should be pending
      let creditData = await db.getCreditById(credit.id);
      expect(creditData?.status).toBe("pending");

      // Update to completed
      await db.updateCreditStatus(credit.id, "completed");
      creditData = await db.getCreditById(credit.id);
      expect(creditData?.status).toBe("completed");

      // Update to cancelled
      await db.updateCreditStatus(credit.id, "cancelled");
      creditData = await db.getCreditById(credit.id);
      expect(creditData?.status).toBe("cancelled");

      // Cleanup
      await db.deleteCredit(credit.id);
    });
  });
});
