import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("订单删除功能测试", () => {
  let testSupplierId: number;
  let testCustomerId: number;
  let testPartId: number;
  let testLineCodeId: number;
  let testPurchaseOrderId: number;
  let testSalesInvoiceId: number;
  let testCreditId: number;
  let testWarrantyId: number;
  const timestamp = Date.now();

  // 创建测试数据
  beforeAll(async () => {
    // 创建测试供应商
    const supplier = await db.createSupplier({
      name: "测试供应商-订单删除",
      contactPerson: "测试联系人",
      phone: "1234567890",
      email: "test@example.com",
    });
    testSupplierId = supplier.id;

    // 创建测试客户
    const customer = await db.createCustomer({
      name: "测试客户-订单删除",
      contactPerson: "测试联系人",
      phone: "1234567890",
      email: "customer@example.com",
    });
    testCustomerId = customer.id;

    // 创建测试Line Code
    const lineCode = await db.createLineCode({
      code: `TEST-DEL-${timestamp}`,
      description: "测试Line Code",
    });
    testLineCodeId = lineCode.id;

    // 创建测试配件
    const part = await db.createPart({
      sku: "TEST-DELETE-001",
      name: "测试配件-订单删除",
      lineCodeId: lineCode.id,
      supplierId: testSupplierId,
      quantity: 100,
      minQuantity: 10,
      unitPrice: "10.00",
      cost: "5.00",
      replCost: "6.00",
      retail: "15.00",
    });
    testPartId = part.id;

    // 创建测试采购订单
    const purchaseOrder = await db.createPurchaseOrder({
      orderNumber: "PO-DELETE-TEST-001",
      supplierId: testSupplierId,
      totalAmount: "100.00",
      createdBy: 1,
    });
    testPurchaseOrderId = purchaseOrder.id;

    // 创建测试销售发票
    const salesInvoice = await db.createSalesInvoice({
      invoiceNumber: "SI-DELETE-TEST-001",
      customerId: testCustomerId,
      totalAmount: "150.00",
      status: "pending",
      createdBy: 1,
      items: [
        {
          partId: testPartId,
          quantity: 10,
          unitPrice: "15.00",
        },
      ],
    });
    testSalesInvoiceId = salesInvoice.id;

    // 创建测试退货单
    const credit = await db.createCredit({
      creditNumber: "CR-DELETE-TEST-001",
      customerId: testCustomerId,
      originalInvoiceNumber: "SI-DELETE-TEST-001",
      reason: "测试退货",
      totalAmount: "30.00",
      status: "pending",
      createdBy: 1,
      items: [
        {
          partId: testPartId,
          quantity: 2,
          unitPrice: "15.00",
        },
      ],
    });
    testCreditId = credit.id;

    // 创建测试保修单
    const warranty = await db.createWarranty({
      warrantyNumber: "WR-DELETE-TEST-001",
      customerId: testCustomerId,
      originalInvoiceNumber: "SI-DELETE-TEST-001",
      claimReason: "测试保修",
      totalAmount: "15.00",
      status: "pending",
      createdBy: 1,
      items: [
        {
          partId: testPartId,
          quantity: 1,
          unitPrice: "15.00",
        },
      ],
    });
    testWarrantyId = warranty.id;
  });

  // 清理测试数据
  afterAll(async () => {
    // 删除测试数据（如果还存在）
    try {
      await db.deletePurchaseOrder(testPurchaseOrderId);
    } catch (e) {
      // 已删除，忽略错误
    }
    try {
      await db.deleteSalesInvoice(testSalesInvoiceId);
    } catch (e) {
      // 已删除，忽略错误
    }
    try {
      await db.deleteCredit(testCreditId);
    } catch (e) {
      // 已删除，忽略错误
    }
    try {
      await db.deleteWarranty(testWarrantyId);
    } catch (e) {
      // 已删除，忽略错误
    }
    await db.forceDeletePart(testPartId);
    await db.forceDeleteCustomer(testCustomerId);
    await db.forceDeleteSupplier(testSupplierId);
    await db.deleteLineCode(testLineCodeId);
  });

  it("应该成功删除采购订单", async () => {
    // 删除采购订单
    await db.deletePurchaseOrder(testPurchaseOrderId);

    // 验证订单已被删除
    const order = await db.getPurchaseOrderById(testPurchaseOrderId);
    expect(order).toBeUndefined();
  });

  it("应该成功删除销售发票", async () => {
    // 删除销售发票
    await db.deleteSalesInvoice(testSalesInvoiceId);

    // 验证发票已被删除
    const invoice = await db.getSalesInvoiceById(testSalesInvoiceId);
    expect(invoice).toBeUndefined();
  });

  it("应该成功删除退货单", async () => {
    // 删除退货单
    await db.deleteCredit(testCreditId);

    // 验证退货单已被删除
    const credit = await db.getCreditById(testCreditId);
    expect(credit).toBeNull();
  });

  it("应该成功删除保修单", async () => {
    // 删除保修单
    await db.deleteWarranty(testWarrantyId);

    // 验证保修单已被删除
    const warranty = await db.getWarrantyById(testWarrantyId);
    expect(warranty).toBeNull();
  });
});
