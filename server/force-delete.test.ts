import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Force Delete Operations", () => {
  const testUserId = 1;
  let testCustomerId: number;
  let testSupplierId: number;
  let testPartId: number;

  beforeAll(async () => {
    // Create test data
    const customer = await db.createCustomer({
      name: "Test Customer for Delete",
      contactPerson: "John Doe",
      phone: "123-456-7890",
      email: "delete-test@example.com",
    });
    testCustomerId = customer.id;

    const supplier = await db.createSupplier({
      name: "Test Supplier for Delete",
      contactPerson: "Jane Smith",
      phone: "098-765-4321",
      email: "supplier-delete@example.com",
    });
    testSupplierId = supplier.id;

    const part = await db.createPart({
      sku: "DELETE-TEST-001",
      name: "Test Part for Delete",
      stockQuantity: 50,
      minStockThreshold: 5,
      unit: "EA",
      unitPrice: "25.00",
      supplierId: testSupplierId,
    });
    testPartId = part.id;
  });

  describe("forceDeletePart", () => {
    it("should delete part with all related records", async () => {
      // Create related records
      const salesInvoice = await db.createSalesInvoice({
        invoiceNumber: `INV-DELETE-${Date.now()}`,
        customerId: testCustomerId,
        totalAmount: "100.00",
        createdBy: testUserId,
      });

      await db.createSalesInvoiceItem({
        salesInvoiceId: salesInvoice.id,
        partId: testPartId,
        quantity: 2,
        unitPrice: "50.00",
        subtotal: "100.00",
      });

      const credit = await db.createCredit({
        creditNumber: `CR-DELETE-${Date.now()}`,
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

      const warranty = await db.createWarranty({
        warrantyNumber: `WR-DELETE-${Date.now()}`,
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

      await db.createInventoryLedgerEntry({
        partId: testPartId,
        transactionType: "sale",
        quantity: -2,
        balanceAfter: 48,
        referenceType: "sales_invoice",
        referenceId: salesInvoice.id,
        operatedBy: testUserId,
      });

      // Force delete the part
      await db.forceDeletePart(testPartId);

      // Verify part is deleted
      const deletedPart = await db.getPartById(testPartId);
      expect(deletedPart).toBeFalsy();
    });
  });

  describe("forceDeleteCustomer", () => {
    it("should delete customer with all related records", async () => {
      const customer = await db.createCustomer({
        name: "Customer to Delete",
        contactPerson: "Test Person",
        phone: "111-222-3333",
      });

      const part = await db.createPart({
        sku: `DELETE-CUST-${Date.now()}`,
        name: "Part for Customer Delete Test",
        stockQuantity: 100,
        minStockThreshold: 10,
        unit: "EA",
        unitPrice: "30.00",
      });

      // Create sales invoice
      const invoice = await db.createSalesInvoice({
        invoiceNumber: `INV-CUST-DEL-${Date.now()}`,
        customerId: customer.id,
        totalAmount: "60.00",
        createdBy: testUserId,
      });

      await db.createSalesInvoiceItem({
        salesInvoiceId: invoice.id,
        partId: part.id,
        quantity: 2,
        unitPrice: "30.00",
        subtotal: "60.00",
      });

      // Create credit
      const credit = await db.createCredit({
        creditNumber: `CR-CUST-DEL-${Date.now()}`,
        customerId: customer.id,
        totalAmount: "30.00",
        createdBy: testUserId,
      });

      await db.createCreditItem({
        creditId: credit.id,
        partId: part.id,
        quantity: 1,
        unitPrice: "30.00",
        subtotal: "30.00",
      });

      // Create warranty
      const warranty = await db.createWarranty({
        warrantyNumber: `WR-CUST-DEL-${Date.now()}`,
        customerId: customer.id,
        totalAmount: "30.00",
        createdBy: testUserId,
      });

      await db.createWarrantyItem({
        warrantyId: warranty.id,
        partId: part.id,
        quantity: 1,
        unitPrice: "30.00",
        subtotal: "30.00",
      });

      // Force delete customer
      await db.forceDeleteCustomer(customer.id);

      // Verify customer is deleted
      const deletedCustomer = await db.getCustomerById(customer.id);
      expect(deletedCustomer).toBeFalsy();

      // Cleanup: delete the part
      await db.forceDeletePart(part.id);
    });
  });

  describe("forceDeleteSupplier", () => {
    it("should delete supplier with all related records", async () => {
      const supplier = await db.createSupplier({
        name: "Supplier to Delete",
        contactPerson: "Test Supplier Person",
        phone: "444-555-6666",
      });

      const part = await db.createPart({
        sku: `DELETE-SUPP-${Date.now()}`,
        name: "Part for Supplier Delete Test",
        stockQuantity: 200,
        minStockThreshold: 20,
        unit: "EA",
        unitPrice: "40.00",
        supplierId: supplier.id,
      });

      // Create purchase order
      const order = await db.createPurchaseOrder({
        orderNumber: `PO-SUPP-DEL-${Date.now()}`,
        supplierId: supplier.id,
        totalAmount: "80.00",
        createdBy: testUserId,
      });

      await db.createPurchaseOrderItem({
        purchaseOrderId: order.id,
        partId: part.id,
        quantity: 2,
        unitPrice: "40.00",
        subtotal: "80.00",
      });

      // Force delete supplier
      await db.forceDeleteSupplier(supplier.id);

      // Verify supplier is deleted
      const deletedSupplier = await db.getSupplierById(supplier.id);
      expect(deletedSupplier).toBeFalsy();

      // Verify part still exists but supplierId is null
      const updatedPart = await db.getPartById(part.id);
      expect(updatedPart).not.toBeNull();
      expect(updatedPart!.supplierId).toBeNull();

      // Cleanup: delete the part
      await db.forceDeletePart(part.id);
    });
  });
});
