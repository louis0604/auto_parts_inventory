import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Parts Management", () => {
  it("should list all parts", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const parts = await caller.parts.list();
    expect(Array.isArray(parts)).toBe(true);
  });

  it("should get low stock parts", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const lowStockParts = await caller.parts.lowStock();
    expect(Array.isArray(lowStockParts)).toBe(true);
  });
});

describe("Dashboard", () => {
  it("should return dashboard statistics", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.dashboard.stats();
    expect(stats).toBeDefined();
    expect(typeof stats.totalParts).toBe("number");
    expect(typeof stats.totalSuppliers).toBe("number");
    expect(typeof stats.totalCustomers).toBe("number");
    expect(typeof stats.lowStockCount).toBe("number");
  });
});

describe("Suppliers", () => {
  it("should list all suppliers", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const suppliers = await caller.suppliers.list();
    expect(Array.isArray(suppliers)).toBe(true);
  });
});

describe("Customers", () => {
  it("should list all customers", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const customers = await caller.customers.list();
    expect(Array.isArray(customers)).toBe(true);
  });
});

describe("Purchase Orders", () => {
  it("should list all purchase orders", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const orders = await caller.purchaseOrders.list();
    expect(Array.isArray(orders)).toBe(true);
  });
});

describe("Sales Invoices", () => {
  it("should list all sales invoices", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const invoices = await caller.salesInvoices.list();
    expect(Array.isArray(invoices)).toBe(true);
  });
});
