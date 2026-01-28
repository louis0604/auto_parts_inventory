import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Credits and Warranties API", () => {
  let testCustomerId: number;
  let testPartId: number;
  const testUserId = 1; // Use default user ID

  beforeAll(async () => {
    // Create test customer
    const customer = await db.createCustomer({
      name: "Test Customer for Credits",
      contactPerson: "John Doe",
      phone: "123-456-7890",
      email: "test@example.com",
    });
    testCustomerId = customer.id;

    // Create test part
    const part = await db.createPart({
      sku: "TEST-CREDIT-001",
      name: "Test Part for Credits",
      stockQuantity: 100,
      minStockThreshold: 10,
      unit: "EA",
      unitPrice: "50.00",
    });
    testPartId = part.id;
  });

  describe("Credits (Customer Returns)", () => {
    it("should create a credit and increase inventory", async () => {
      const initialPart = await db.getPartById(testPartId);
      const initialStock = initialPart!.stockQuantity;

      const credit = await db.createCredit({
        creditNumber: `CR-TEST-${Date.now()}`,
        customerId: testCustomerId,
        customerNumber: "CUST001",
        originalInvoiceNumber: "INV-12345",
        totalAmount: "100.00",
        reason: "Defective product",
        notes: "Customer returned due to manufacturing defect",
        createdBy: testUserId,
      });

      expect(credit).toBeDefined();
      expect(credit.id).toBeGreaterThan(0);
      expect(credit.creditNumber).toContain("CR-TEST-");
      expect(credit.customerId).toBe(testCustomerId);

      // Create credit item
      await db.createCreditItem({
        creditId: credit.id,
        partId: testPartId,
        quantity: 5,
        unitPrice: "20.00",
        subtotal: "100.00",
      });

      // Update inventory
      await db.updatePart(testPartId, { stockQuantity: initialStock + 5 });

      // Create inventory ledger entry
      await db.createInventoryLedgerEntry({
        partId: testPartId,
        transactionType: "credit",
        quantity: 5,
        balanceAfter: initialStock + 5,
        referenceType: "credit",
        referenceId: credit.id,
        notes: `退货单 ${credit.creditNumber} 入库`,
        operatedBy: testUserId,
      });

      // Verify inventory increased
      const updatedPart = await db.getPartById(testPartId);
      expect(updatedPart!.stockQuantity).toBe(initialStock + 5);

      // Verify credit can be retrieved
      const retrievedCredit = await db.getCreditById(credit.id);
      expect(retrievedCredit).toBeDefined();
      expect(retrievedCredit!.creditNumber).toBe(credit.creditNumber);
      expect(retrievedCredit!.items).toHaveLength(1);
      expect(retrievedCredit!.items[0].quantity).toBe(5);
    });

    it("should list all credits", async () => {
      const credits = await db.getAllCredits();
      expect(credits).toBeDefined();
      expect(Array.isArray(credits)).toBe(true);
      expect(credits.length).toBeGreaterThan(0);
    });

    it("should update credit status", async () => {
      const credit = await db.createCredit({
        creditNumber: `CR-STATUS-${Date.now()}`,
        customerId: testCustomerId,
        totalAmount: "50.00",
        createdBy: testUserId,
      });

      await db.updateCreditStatus(credit.id, "cancelled");
      const updatedCredit = await db.getCreditById(credit.id);
      expect(updatedCredit!.status).toBe("cancelled");
    });
  });

  describe("Warranties", () => {
    it("should create a warranty and decrease inventory", async () => {
      const initialPart = await db.getPartById(testPartId);
      const initialStock = initialPart!.stockQuantity;

      const warranty = await db.createWarranty({
        warrantyNumber: `WR-TEST-${Date.now()}`,
        customerId: testCustomerId,
        customerNumber: "CUST001",
        originalInvoiceNumber: "INV-67890",
        totalAmount: "150.00",
        claimReason: "Part failed within warranty period",
        notes: "Customer reported engine noise",
        createdBy: testUserId,
      });

      expect(warranty).toBeDefined();
      expect(warranty.id).toBeGreaterThan(0);
      expect(warranty.warrantyNumber).toContain("WR-TEST-");
      expect(warranty.customerId).toBe(testCustomerId);

      // Create warranty item
      await db.createWarrantyItem({
        warrantyId: warranty.id,
        partId: testPartId,
        quantity: 3,
        unitPrice: "50.00",
        subtotal: "150.00",
      });

      // Update inventory (warranty replacement reduces stock)
      await db.updatePart(testPartId, { stockQuantity: initialStock - 3 });

      // Create inventory ledger entry
      await db.createInventoryLedgerEntry({
        partId: testPartId,
        transactionType: "warranty",
        quantity: -3,
        balanceAfter: initialStock - 3,
        referenceType: "warranty",
        referenceId: warranty.id,
        notes: `保修单 ${warranty.warrantyNumber} 出库`,
        operatedBy: testUserId,
      });

      // Verify inventory decreased
      const updatedPart = await db.getPartById(testPartId);
      expect(updatedPart!.stockQuantity).toBe(initialStock - 3);

      // Verify warranty can be retrieved
      const retrievedWarranty = await db.getWarrantyById(warranty.id);
      expect(retrievedWarranty).toBeDefined();
      expect(retrievedWarranty!.warrantyNumber).toBe(warranty.warrantyNumber);
      expect(retrievedWarranty!.items).toHaveLength(1);
      expect(retrievedWarranty!.items[0].quantity).toBe(3);
    });

    it("should list all warranties", async () => {
      const warranties = await db.getAllWarranties();
      expect(warranties).toBeDefined();
      expect(Array.isArray(warranties)).toBe(true);
      expect(warranties.length).toBeGreaterThan(0);
    });

    it("should update warranty status through workflow", async () => {
      const warranty = await db.createWarranty({
        warrantyNumber: `WR-WORKFLOW-${Date.now()}`,
        customerId: testCustomerId,
        totalAmount: "75.00",
        claimReason: "Testing status workflow",
        createdBy: testUserId,
      });

      // Test status transitions: pending -> approved -> completed
      expect(warranty.status).toBe("pending");

      await db.updateWarrantyStatus(warranty.id, "approved");
      let updatedWarranty = await db.getWarrantyById(warranty.id);
      expect(updatedWarranty!.status).toBe("approved");

      await db.updateWarrantyStatus(warranty.id, "completed");
      updatedWarranty = await db.getWarrantyById(warranty.id);
      expect(updatedWarranty!.status).toBe("completed");

      // Test rejection path
      const rejectedWarranty = await db.createWarranty({
        warrantyNumber: `WR-REJECT-${Date.now()}`,
        customerId: testCustomerId,
        totalAmount: "25.00",
        createdBy: testUserId,
      });

      await db.updateWarrantyStatus(rejectedWarranty.id, "rejected");
      const rejectedResult = await db.getWarrantyById(rejectedWarranty.id);
      expect(rejectedResult!.status).toBe("rejected");
    });
  });

  describe("Inventory Ledger Integration", () => {
    it("should record credit transactions in inventory ledger", async () => {
      const ledgerEntries = await db.getInventoryLedgerByPart(testPartId);
      const creditEntries = ledgerEntries.filter(e => e.transactionType === "credit");
      expect(creditEntries.length).toBeGreaterThan(0);
      expect(creditEntries[0].quantity).toBeGreaterThan(0); // Credits increase inventory
    });

    it("should record warranty transactions in inventory ledger", async () => {
      const ledgerEntries = await db.getInventoryLedgerByPart(testPartId);
      const warrantyEntries = ledgerEntries.filter(e => e.transactionType === "warranty");
      expect(warrantyEntries.length).toBeGreaterThan(0);
      expect(warrantyEntries[0].quantity).toBeLessThan(0); // Warranties decrease inventory
    });
  });
});
