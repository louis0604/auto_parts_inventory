import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

function createTestContext() {
  const ctx: TrpcContext = {
    user: {
      id: 1,
      openId: "test-open-id",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "password",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    clearCookie: () => {},
  };
  const caller = appRouter.createCaller(ctx);
  return { ctx, caller };
}

describe("Parts Archive (Soft Delete) Feature", () => {
  let testPartId: number;

  beforeEach(async () => {
    // Create a test part
    const part = await db.createPart({
      sku: "TEST-ARCHIVE-001",
      name: "Test Part for Archive",
      description: "Test part for archive functionality",
      unitPrice: "100.00",
      stockQuantity: 10,
      minStockThreshold: 5,
      unit: "件",
    });
    testPartId = part.id;
  });

  it("should archive a part (soft delete)", async () => {
    const { caller } = await createTestContext();

    // Archive the part
    await caller.parts.archive(testPartId);

    // Verify part is archived
    const archivedParts = await caller.parts.listArchived();
    const archivedPart = archivedParts.find((p) => p.id === testPartId);
    expect(archivedPart).toBeDefined();
    expect(archivedPart?.sku).toBe("TEST-ARCHIVE-001");

    // Verify part is not in active list
    const activeParts = await caller.parts.list();
    const activePart = activeParts.find((p) => p.id === testPartId);
    expect(activePart).toBeUndefined();
  });

  it("should restore an archived part", async () => {
    const { caller } = await createTestContext();

    // Archive the part first
    await caller.parts.archive(testPartId);

    // Restore the part
    await caller.parts.restore(testPartId);

    // Verify part is back in active list
    const activeParts = await caller.parts.list();
    const activePart = activeParts.find((p) => p.id === testPartId);
    expect(activePart).toBeDefined();
    expect(activePart?.sku).toBe("TEST-ARCHIVE-001");

    // Verify part is not in archived list
    const archivedParts = await caller.parts.listArchived();
    const archivedPart = archivedParts.find((p) => p.id === testPartId);
    expect(archivedPart).toBeUndefined();
  });

  it("should bulk archive multiple parts", async () => {
    const { caller } = await createTestContext();

    // Create additional test parts
    const part2 = await db.createPart({
      sku: "TEST-ARCHIVE-002",
      name: "Test Part 2",
      description: "Test part 2",
      unitPrice: "200.00",
      stockQuantity: 20,
      minStockThreshold: 10,
      unit: "件",
    });

    const part3 = await db.createPart({
      sku: "TEST-ARCHIVE-003",
      name: "Test Part 3",
      description: "Test part 3",
      unitPrice: "300.00",
      stockQuantity: 30,
      minStockThreshold: 15,
      unit: "件",
    });

    // Bulk archive
    const result = await caller.parts.bulkArchive([testPartId, part2.id, part3.id]);

    expect(result.archived).toBe(3);
    expect(result.failed).toBe(0);
    expect(result.total).toBe(3);

    // Verify all parts are archived
    const archivedParts = await caller.parts.listArchived();
    expect(archivedParts.filter((p) => [testPartId, part2.id, part3.id].includes(p.id)).length).toBe(3);
  });

  it("should list only archived parts", async () => {
    const { caller } = await createTestContext();

    // Create and archive a part
    await caller.parts.archive(testPartId);

    // Create another active part
    const activePart = await db.createPart({
      sku: "TEST-ACTIVE-001",
      name: "Active Part",
      description: "This part should remain active",
      unitPrice: "150.00",
      stockQuantity: 15,
      minStockThreshold: 5,
      unit: "件",
    });

    // Get archived parts
    const archivedParts = await caller.parts.listArchived();
    expect(archivedParts.some((p) => p.id === testPartId)).toBe(true);
    expect(archivedParts.some((p) => p.id === activePart.id)).toBe(false);

    // Get active parts
    const activeParts = await caller.parts.list();
    expect(activeParts.some((p) => p.id === testPartId)).toBe(false);
    expect(activeParts.some((p) => p.id === activePart.id)).toBe(true);
  });
});
