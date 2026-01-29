import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-openid",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Line Code Management", () => {
  let testLineCodeId: number;

  beforeEach(async () => {
    // Clean up: delete all test line codes
    const allLineCodes = await db.getAllLineCodes();
    for (const lc of allLineCodes) {
      if (lc.code.startsWith("TEST")) {
        try {
          await db.deleteLineCode(lc.id);
        } catch (e) {
          // Ignore if already deleted
        }
      }
    }
  });

  it("should create a new line code", async () => {
    const caller = appRouter.createCaller(createTestContext());
    const result = await caller.lineCodes.create({
      code: "TEST001",
      description: "Test Line Code 1",
    });

    expect(result).toBeDefined();
    expect(result.code).toBe("TEST001");
    expect(result.description).toBe("Test Line Code 1");
    testLineCodeId = result.id;
  });

  it("should list all line codes", async () => {
    const caller = appRouter.createCaller(createTestContext());
    // Create test line codes
    await caller.lineCodes.create({
      code: "TEST002",
      description: "Test Line Code 2",
    });
    await caller.lineCodes.create({
      code: "TEST003",
      description: "Test Line Code 3",
    });

    const result = await caller.lineCodes.list();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(2);

    const testCodes = result.filter((lc: any) => lc.code.startsWith("TEST"));
    expect(testCodes.length).toBeGreaterThanOrEqual(2);
  });

  it("should update a line code", async () => {
    const caller = appRouter.createCaller(createTestContext());
    // Create a line code first
    const created = await caller.lineCodes.create({
      code: "TEST004",
      description: "Original Description",
    });

    // Update it
    const updated = await caller.lineCodes.update({
      id: created.id,
      code: "TEST004_UPDATED",
      description: "Updated Description",
    });

    expect(updated).toBeDefined();
    expect(updated.code).toBe("TEST004_UPDATED");
    expect(updated.description).toBe("Updated Description");

    // Clean up
    await db.deleteLineCode(created.id);
  });

  it("should delete a line code", async () => {
    const caller = appRouter.createCaller(createTestContext());
    // Create a line code first
    const created = await caller.lineCodes.create({
      code: "TEST005",
      description: "To be deleted",
    });

    // Delete it
    await caller.lineCodes.delete(created.id);

    // Verify it's deleted
    const allLineCodes = await db.getAllLineCodes();
    const found = allLineCodes.find((lc: any) => lc.id === created.id);
    expect(found).toBeUndefined();
  });

  it("should handle line code without description", async () => {
    const caller = appRouter.createCaller(createTestContext());
    const result = await caller.lineCodes.create({
      code: "TEST006",
    });

    expect(result).toBeDefined();
    expect(result.code).toBe("TEST006");
    expect(result.description).toBeNull();

    // Clean up
    await db.deleteLineCode(result.id);
  });

  it("should prevent deleting line code that is in use by parts", async () => {
    const caller = appRouter.createCaller(createTestContext());
    // Create a line code
    const lineCode = await caller.lineCodes.create({
      code: "TEST007",
      description: "Line code in use",
    });

    // Create a part using this line code
    const part = await caller.parts.create({
      sku: "TEST-PART-001",
      name: "Test Part",
      lineCodeId: lineCode.id,
      stockQuantity: 10,
      unitPrice: "10.00",
      unit: "EA",
      minStockThreshold: 5,
    });

    // Try to delete the line code - should fail
    let deleteError;
    try {
      await caller.lineCodes.delete(lineCode.id);
    } catch (error: any) {
      deleteError = error;
    }

    expect(deleteError).toBeDefined();

    // Clean up: delete part first, then line code
    await db.forceDeletePart(part.id);
    await db.deleteLineCode(lineCode.id);
  });
});
