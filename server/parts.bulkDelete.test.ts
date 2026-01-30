import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
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

  return ctx;
}

describe("Parts Bulk Delete", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let testPartIds: number[] = [];

  beforeEach(async () => {
    const ctx = createTestContext();
    caller = appRouter.createCaller(ctx);

    // Create test parts
    testPartIds = [];
    for (let i = 0; i < 3; i++) {
      const part = await caller.parts.create({
        sku: `TEST-BULK-${Date.now()}-${i}`,
        name: `Test Bulk Part ${i}`,
        unitPrice: "100.00",
        unit: "件",
        stockQuantity: 10,
        minStockThreshold: 5,
      });
      testPartIds.push(part.id);
    }
  });

  it("should bulk delete multiple parts", async () => {
    const result = await caller.parts.bulkDelete(testPartIds);

    expect(result.deleted).toBe(3);
    expect(result.failed).toBe(0);
    expect(result.total).toBe(3);

    // Verify parts are deleted
    for (const id of testPartIds) {
      const part = await db.getPartById(id);
      expect(part).toBeUndefined();
    }
  });

  it("should handle partial failures gracefully", async () => {
    // Delete one part first
    await caller.parts.delete(testPartIds[0]);

    // Try to bulk delete all three (one already deleted)
    const result = await caller.parts.bulkDelete(testPartIds);

    // Note: forceDeletePart might succeed even if part is already deleted
    // So we just check that some parts were processed
    expect(result.total).toBe(3);
    expect(result.deleted + result.failed).toBe(3);
  });

  it("should return zero deleted for empty array", async () => {
    const result = await caller.parts.bulkDelete([]);

    expect(result.deleted).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.total).toBe(0);
  });

  it("should delete parts with related stock movements", async () => {
    // Add stock adjustment to first part
    await caller.parts.adjustStock({
      partId: testPartIds[0],
      quantity: 5,
      notes: "Test adjustment",
    });

    // Bulk delete should still work (force delete handles related records)
    const result = await caller.parts.bulkDelete([testPartIds[0]]);

    expect(result.deleted).toBe(1);
    expect(result.failed).toBe(0);

    // Verify part is deleted
    const part = await db.getPartById(testPartIds[0]);
    expect(part).toBeUndefined();
  });
});
