import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Line Codes
  lineCodes: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllLineCodes();
    }),
    create: protectedProcedure
      .input(z.object({
        code: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createLineCode(input);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        code: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateLineCode(input);
      }),
    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        return await db.deleteLineCode(input);
      }),
  }),

  // Part Categories
  partCategories: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllPartCategories();
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createPartCategory(input);
      }),
  }),

  // Suppliers
  suppliers: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllSuppliers();
    }),
    getById: protectedProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await db.getSupplierById(input);
      }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        contactPerson: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        address: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createSupplier(input);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().min(1).optional(),
          contactPerson: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().email().optional(),
          address: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await db.updateSupplier(input.id, input.data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        // Use forceDelete to handle all related records
        await db.forceDeleteSupplier(input);
        return { success: true };
      }),
    forceDelete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }) => {
        // Only admin can force delete
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: '仅管理员可以强制删除' });
        }
        await db.forceDeleteSupplier(input);
        return { success: true };
      }),
  }),

  // Customers
  customers: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllCustomers();
    }),
    getById: protectedProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await db.getCustomerById(input);
      }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        contactPerson: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        address: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createCustomer(input);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().min(1).optional(),
          contactPerson: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().email().optional(),
          address: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await db.updateCustomer(input.id, input.data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        // Use forceDelete to handle all related records
        await db.forceDeleteCustomer(input);
        return { success: true };
      }),
    forceDelete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }) => {
        // Only admin can force delete
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: '仅管理员可以强制删除' });
        }
        await db.forceDeleteCustomer(input);
        return { success: true };
      }),
  }),

  // Parts
  parts: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllParts();
    }),
    getById: protectedProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await db.getPartById(input);
      }),
    search: protectedProcedure
      .input(z.string())
      .query(async ({ input }) => {
        return await db.searchParts(input);
      }),
    getLineCodesBySku: protectedProcedure
      .input(z.object({ sku: z.string() }))
      .query(async ({ input }) => {
        return await db.getLineCodesBySku(input.sku);
      }),
    getBySku: protectedProcedure
      .input(z.object({ sku: z.string() }))
      .query(async ({ input }) => {
        return await db.getPartsBySku(input.sku);
      }),
    lowStock: protectedProcedure.query(async () => {
      return await db.getLowStockParts();
    }),
    bulkCreate: protectedProcedure
      .input(z.array(z.object({
        sku: z.string().min(1),
        name: z.string().min(1),
        lineCodeId: z.number().nullable().optional(),
        categoryId: z.number().nullable().optional(),
        supplierId: z.number().nullable().optional(),
        description: z.string().optional(),
        unitPrice: z.string(),
        unit: z.string().optional(),
        stockQuantity: z.number().optional(),
        minStockThreshold: z.number().optional(),
        orderPoint: z.number().optional(),
        // 价格字段
        listPrice: z.string().optional(),
        replCost: z.string().optional(),
        retail: z.string().optional(),
        price1: z.string().optional(),
        price2: z.string().optional(),
        price3: z.string().optional(),
        // 图片
        imageBase64: z.object({
          data: z.string(),
          extension: z.string()
        }).nullable().optional(),
        imageUrl: z.string().optional(),
        // 兼容旧字段名
        currentStock: z.number().optional(),
        minStock: z.number().optional(),
      })))
      .mutation(async ({ input }) => {
        return await db.bulkCreateParts(input);
      }),
    create: protectedProcedure
      .input(z.object({
        // Basic info - 保疙5个必填项
        lineCodeId: z.number(), // Line (必填)
        sku: z.string().min(1), // Part Number (必填)
        name: z.string().min(1), // Description (必填)
        description: z.string().nullable().optional(),
        categoryId: z.number().nullable().optional(),
        supplierId: z.number().nullable().optional(),
        
        // Inventory
        stockQuantity: z.number().nullable().optional(),
        minStockThreshold: z.number().nullable().optional(),
        orderQty: z.number().nullable().optional(),
        orderPoint: z.number().nullable().optional(),
        
        // Pricing
        listPrice: z.string().nullable().optional(),
        cost: z.string().nullable().optional(),
        retail: z.string(), // Retail (必填)
        replCost: z.string(), // Repl Cost (必填)
        avgCost: z.string().nullable().optional(),
        price1: z.string().nullable().optional(),
        price2: z.string().nullable().optional(),
        price3: z.string().nullable().optional(),
        unitPrice: z.string().nullable().optional(),
        coreCost: z.string().nullable().optional(),
        coreRetail: z.string().nullable().optional(),
        
        // Order info
        orderMultiple: z.number().nullable().optional(),
        
        // Units
        stockingUnit: z.string().nullable().optional(),
        purchaseUnit: z.string().nullable().optional(),
        unit: z.string().nullable().optional(),
        
        // Additional
        manufacturer: z.string().nullable().optional(),
        mfgPartNumber: z.string().nullable().optional(),
        weight: z.string().nullable().optional(),
        imageUrl: z.string().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const part = await db.createPart(input);
        
        // Create initial inventory ledger entry if stock > 0
        if (input.stockQuantity && input.stockQuantity > 0) {
          await db.createInventoryLedgerEntry({
            partId: part.id,
            transactionType: "purchase",
            quantity: input.stockQuantity,
            balanceAfter: input.stockQuantity,
            referenceType: "initial",
            notes: "初始库存",
            operatedBy: ctx.user.id,
          });
        }
        
        return part;
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          // Basic info
          lineCodeId: z.number().optional(), // 可选，但不能为null
          sku: z.string().min(1).optional(),
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          categoryId: z.number().nullable().optional(),
          supplierId: z.number().nullable().optional(),
          
          // Inventory
          stockQuantity: z.number().optional(),
          minStockThreshold: z.number().optional(),
          orderQty: z.number().nullable().optional(),
          
          // Pricing
          listPrice: z.string().optional(),
          cost: z.string().optional(),
          retail: z.string().optional(),
          unitPrice: z.string().optional(),
          coreCost: z.string().optional(),
          coreRetail: z.string().optional(),
          replCost: z.string().optional(),
          avgCost: z.string().optional(),
          price1: z.string().optional(),
          price2: z.string().optional(),
          price3: z.string().optional(),
          
          // Order info
          orderMultiple: z.number().nullable().optional(),
          
          // Units
          stockingUnit: z.string().optional(),
          purchaseUnit: z.string().optional(),
          unit: z.string().optional(),
          
          // Additional
          manufacturer: z.string().optional(),
          mfgPartNumber: z.string().optional(),
          weight: z.string().optional(),
          imageUrl: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await db.updatePart(input.id, input.data);
        return { success: true };
      }),
    // Delete (alias for archive)
    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        await db.archivePart(input);
        return { success: true };
      }),
    // Archive (soft delete)
    archive: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        await db.archivePart(input);
        return { success: true };
      }),
    // Bulk archive
    bulkArchive: protectedProcedure
      .input(z.array(z.number()))
      .mutation(async ({ input: partIds }) => {
        let archived = 0;
        let failed = 0;
        for (const id of partIds) {
          try {
            await db.archivePart(id);
            archived++;
          } catch (error) {
            failed++;
            console.error(`Failed to archive part ${id}:`, error);
          }
        }
        return { archived, failed, total: partIds.length };
      }),
    // Restore archived part
    restore: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        await db.restorePart(input);
        return { success: true };
      }),
    // Bulk restore
    bulkRestore: protectedProcedure
      .input(z.array(z.number()))
      .mutation(async ({ input: partIds }) => {
        let restored = 0;
        let failed = 0;
        for (const id of partIds) {
          try {
            await db.restorePart(id);
            restored++;
          } catch (error) {
            failed++;
            console.error(`Failed to restore part ${id}:`, error);
          }
        }
        return { restored, failed, total: partIds.length };
      }),
    // List archived parts
    listArchived: protectedProcedure.query(async () => {
      return await db.getArchivedParts();
    }),
    // Permanent delete (admin only)
    forceDelete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }) => {
        // Only admin can force delete
        if (ctx.user.role !== 'admin') {
          throw new Error("只有管理员才能永久删除配件");
        }
        await db.forceDeletePart(input);
        return { success: true };
      }),
    // Bulk permanent delete (admin only)
    bulkForceDelete: protectedProcedure
      .input(z.array(z.number()))
      .mutation(async ({ input: partIds, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error("只有管理员才能永久删除配件");
        }
        let deleted = 0;
        let failed = 0;
        for (const id of partIds) {
          try {
            await db.forceDeletePart(id);
            deleted++;
          } catch (error) {
            failed++;
            console.error(`Failed to permanently delete part ${id}:`, error);
          }
        }
        return { deleted, failed, total: partIds.length };
      }),
    getHistory: protectedProcedure
      .input(z.number())
      .query(async ({ input: partId }) => {
        return await db.getPartHistory(partId);
      }),
    adjustStock: protectedProcedure
      .input(z.object({
        partId: z.number(),
        quantity: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const part = await db.getPartById(input.partId);
        if (!part) throw new Error("配件不存在");
        
        const newStock = (part.stockQuantity ?? 0) + input.quantity;
        if (newStock < 0) throw new Error("库存不足");
        
        await db.updatePart(input.partId, { stockQuantity: newStock });
        
        await db.createInventoryLedgerEntry({
          partId: input.partId,
          transactionType: "adjustment",
          quantity: input.quantity,
          balanceAfter: newStock,
          referenceType: "manual",
          notes: input.notes || "手动调整",
          operatedBy: ctx.user.id,
        });
        
        // Check for low stock
        if (part.minStockThreshold !== null && newStock < part.minStockThreshold) {
          await db.createLowStockAlert({
            partId: input.partId,
            currentStock: newStock,
            minThreshold: part.minStockThreshold ?? 0,
          });
        }
        
        return { success: true, newStock };
      }),
  }),

  // Inventory Ledger
  inventoryLedger: router({
    getByPart: protectedProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await db.getInventoryLedgerByPart(input);
      }),
  }),

  // Low Stock Alerts
  lowStockAlerts: router({
    list: protectedProcedure.query(async () => {
      return await db.getUnresolvedLowStockAlerts();
    }),
    resolve: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        await db.resolveLowStockAlert(input);
        return { success: true };
      }),
  }),

  // Purchase Orders
  purchaseOrders: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllPurchaseOrders();
    }),
    getById: protectedProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await db.getPurchaseOrderById(input);
      }),
    create: protectedProcedure
      .input(z.object({
        orderNumber: z.string().min(1),
        supplierId: z.number(),
        type: z.enum(["inbound", "outbound"]).default("inbound"),
        items: z.array(z.object({
          partId: z.number(),
          quantity: z.number().min(1),
          unitPrice: z.string(),
        })),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const totalAmount = input.items.reduce((sum, item) => {
          return sum + parseFloat(item.unitPrice) * item.quantity;
        }, 0).toFixed(2);
        
        const order = await db.createPurchaseOrder({
          orderNumber: input.orderNumber,
          supplierId: input.supplierId,
          type: input.type,
          totalAmount,
          notes: input.notes,
          createdBy: ctx.user.id,
        });
        
        for (const item of input.items) {
          const subtotal = (parseFloat(item.unitPrice) * item.quantity).toFixed(2);
          await db.createPurchaseOrderItem({
            purchaseOrderId: order.id,
            partId: item.partId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal,
          });
          
          // Update stock based on order type
          if (input.type === "inbound") {
            // Inbound: increase stock
            await db.adjustStock(item.partId, item.quantity);
          } else if (input.type === "outbound") {
            // Outbound: decrease stock
            await db.adjustStock(item.partId, -item.quantity);
          }
        }
        
        return order;
      }),
    receive: protectedProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }) => {
        const order = await db.getPurchaseOrderById(input);
        if (!order) throw new Error("订单不存在");
        if (order.status !== "pending") throw new Error("订单状态不正确");
        
        // Update stock for each item
        for (const item of order.items) {
          const part = await db.getPartById(item.partId);
          if (!part) continue;
          
          const newStock = (part.stockQuantity ?? 0) + item.quantity;
          await db.updatePart(item.partId, { stockQuantity: newStock });
          
          await db.createInventoryLedgerEntry({
            partId: item.partId,
            transactionType: "purchase",
            quantity: item.quantity,
            balanceAfter: newStock,
            referenceType: "purchase_order",
            referenceId: order.id,
            notes: `采购订单 ${order.orderNumber} 入库`,
            operatedBy: ctx.user.id,
          });
        }
        
        await db.updatePurchaseOrderStatus(input, "received");
        return { success: true };
      }),
    cancel: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        await db.updatePurchaseOrderStatus(input, "cancelled");
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        await db.deletePurchaseOrder(input);
        return { success: true };
      }),
  }),

  // Sales Invoices
  salesInvoices: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllSalesInvoices();
    }),
    getById: protectedProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await db.getSalesInvoiceById(input);
      }),
    create: protectedProcedure
      .input(z.object({
        invoiceNumber: z.string().min(1),
        customerId: z.number(),
        items: z.array(z.object({
          partId: z.number(),
          quantity: z.number().min(1),
          unitPrice: z.string(),
        })),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Validate stock availability
        for (const item of input.items) {
          const part = await db.getPartById(item.partId);
          if (!part) throw new Error(`配件 ID ${item.partId} 不存在`);
          if ((part.stockQuantity ?? 0) < item.quantity) {
            throw new Error(`配件 ${part.name} 库存不足`);
          }
        }
        
        const totalAmount = input.items.reduce((sum, item) => {
          return sum + parseFloat(item.unitPrice) * item.quantity;
        }, 0).toFixed(2);
        
        const invoice = await db.createSalesInvoice({
          invoiceNumber: input.invoiceNumber,
          customerId: input.customerId,
          totalAmount,
          notes: input.notes,
          createdBy: ctx.user.id,
        });
        
        for (const item of input.items) {
          const subtotal = (parseFloat(item.unitPrice) * item.quantity).toFixed(2);
          await db.createSalesInvoiceItem({
            salesInvoiceId: invoice.id,
            partId: item.partId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal,
          });
          
          // Update stock
          const part = await db.getPartById(item.partId);
          if (part) {
            const newStock = (part.stockQuantity ?? 0) - item.quantity;
            await db.updatePart(item.partId, { stockQuantity: newStock });
            
            await db.createInventoryLedgerEntry({
              partId: item.partId,
              transactionType: "sale",
              quantity: -item.quantity,
              balanceAfter: newStock,
              referenceType: "sales_invoice",
              referenceId: invoice.id,
              notes: `销售发票 ${invoice.invoiceNumber} 出库`,
              operatedBy: ctx.user.id,
            });
            
            // Check for low stock
            if (part.minStockThreshold !== null && newStock < part.minStockThreshold) {
              await db.createLowStockAlert({
                partId: item.partId,
                currentStock: newStock,
                minThreshold: part.minStockThreshold ?? 0,
              });
            }
          }
        }
        
        await db.updateSalesInvoiceStatus(invoice.id, "completed");
        return invoice;
      }),
    cancel: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        await db.updateSalesInvoiceStatus(input, "cancelled");
        return { success: true };
      }),
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "completed", "cancelled"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateSalesInvoiceStatus(input.id, input.status);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        await db.deleteSalesInvoice(input);
        return { success: true };
      }),
  }),

  // Dashboard
  dashboard: router({
    stats: protectedProcedure.query(async () => {
      return await db.getDashboardStats();
    }),
  }),

  // AI-powered Restocking Suggestions
  ai: router({
    restockingSuggestions: protectedProcedure.query(async () => {
      const lowStockParts = await db.getLowStockParts();
      
      if (lowStockParts.length === 0) {
        return {
          suggestions: [],
          analysis: "当前所有配件库存充足，无需补货。",
        };
      }

      // Prepare data for AI analysis
      const partsData = lowStockParts.map(part => ({
        name: part.name,
        sku: part.sku,
        currentStock: part.stockQuantity ?? 0,
        minThreshold: part.minStockThreshold ?? 0,
        unitPrice: parseFloat(part.unitPrice ?? '0'),
        unit: part.unit,
      }));

      const prompt = `你是一个汽车配件库存管理专家。请分析以下低库存配件数据，并提供智能补货建议：

${JSON.stringify(partsData, null, 2)}

请为每个配件提供：
1. 建议补货数量（考虑最低库存阈值和安全库存）
2. 优先级（高/中/低）
3. 补货理由

请以JSON格式返回，格式如下：
{
  "analysis": "整体分析总结",
  "suggestions": [
    {
      "sku": "配件SKU",
      "name": "配件名称",
      "suggestedQuantity": 建议补货数量,
      "priority": "优先级",
      "reason": "补货理由"
    }
  ]
}`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "你是一个专业的汽车配件库存管理顾问，擅长分析库存数据并提供补货建议。" },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "restocking_suggestions",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  analysis: { type: "string", description: "整体分析总结" },
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        sku: { type: "string" },
                        name: { type: "string" },
                        suggestedQuantity: { type: "number" },
                        priority: { type: "string" },
                        reason: { type: "string" },
                      },
                      required: ["sku", "name", "suggestedQuantity", "priority", "reason"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["analysis", "suggestions"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
        const result = JSON.parse(contentStr || "{}");
        return result;
      } catch (error) {
        console.error("AI analysis failed:", error);
        return {
          suggestions: [],
          analysis: "AI分析暂时不可用，请稍后重试。",
        };
      }
    }),
  }),

  // Credits (Customer Returns)
  credits: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllCredits();
    }),
    getById: protectedProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await db.getCreditById(input);
      }),
    create: protectedProcedure
      .input(z.object({
        creditNumber: z.string().min(1),
        customerId: z.number(),
        customerNumber: z.string().optional(),
        originalInvoiceNumber: z.string().optional(),
        items: z.array(z.object({
          partId: z.number(),
          quantity: z.number().min(1),
          unitPrice: z.string(),
        })),
        reason: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const totalAmount = input.items.reduce((sum, item) => {
          return sum + parseFloat(item.unitPrice) * item.quantity;
        }, 0).toFixed(2);
        
        const credit = await db.createCredit({
          creditNumber: input.creditNumber,
          customerId: input.customerId,
          customerNumber: input.customerNumber,
          originalInvoiceNumber: input.originalInvoiceNumber,
          totalAmount,
          reason: input.reason,
          notes: input.notes,
          createdBy: ctx.user.id,
        });
        
        for (const item of input.items) {
          const subtotal = (parseFloat(item.unitPrice) * item.quantity).toFixed(2);
          await db.createCreditItem({
            creditId: credit.id,
            partId: item.partId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal,
          });
          
          // Update stock (return to inventory)
          const part = await db.getPartById(item.partId);
          if (part) {
            const newStock = (part.stockQuantity ?? 0) + item.quantity;
            await db.updatePart(item.partId, { stockQuantity: newStock });
            
            await db.createInventoryLedgerEntry({
              partId: item.partId,
              transactionType: "credit",
              quantity: item.quantity,
              balanceAfter: newStock,
              referenceType: "credit",
              referenceId: credit.id,
              notes: `退货单 ${credit.creditNumber} 入库`,
              operatedBy: ctx.user.id,
            });
          }
        }
        
        await db.updateCreditStatus(credit.id, "completed");
        return credit;
      }),
    cancel: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        await db.updateCreditStatus(input, "cancelled");
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        await db.deleteCredit(input);
        return { success: true };
      }),
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "completed", "cancelled"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateCreditStatus(input.id, input.status);
        return { success: true };
      }),
    getSalesHistory: protectedProcedure
      .input(z.string())
      .query(async ({ input }) => {
        return await db.getSalesHistoryByPartSku(input);
      }),
  }),

  // Warranties
  warranties: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllWarranties();
    }),
    getById: protectedProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await db.getWarrantyById(input);
      }),
    create: protectedProcedure
      .input(z.object({
        warrantyNumber: z.string().min(1),
        customerId: z.number(),
        customerNumber: z.string().optional(),
        originalInvoiceNumber: z.string().optional(),
        items: z.array(z.object({
          partId: z.number(),
          quantity: z.number().min(1),
          unitPrice: z.string(),
        })),
        claimReason: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Validate stock availability for warranty replacements
        for (const item of input.items) {
          const part = await db.getPartById(item.partId);
          if (!part) throw new Error(`配件 ID ${item.partId} 不存在`);
          if ((part.stockQuantity ?? 0) < item.quantity) {
            throw new Error(`配件 ${part.name} 库存不足，无法提供保修替换`);
          }
        }
        
        const totalAmount = input.items.reduce((sum, item) => {
          return sum + parseFloat(item.unitPrice) * item.quantity;
        }, 0).toFixed(2);
        
        const warranty = await db.createWarranty({
          warrantyNumber: input.warrantyNumber,
          customerId: input.customerId,
          customerNumber: input.customerNumber,
          originalInvoiceNumber: input.originalInvoiceNumber,
          totalAmount,
          claimReason: input.claimReason,
          notes: input.notes,
          createdBy: ctx.user.id,
        });
        
        for (const item of input.items) {
          const subtotal = (parseFloat(item.unitPrice) * item.quantity).toFixed(2);
          await db.createWarrantyItem({
            warrantyId: warranty.id,
            partId: item.partId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal,
          });
          
          // Update stock (warranty replacement reduces inventory)
          const part = await db.getPartById(item.partId);
          if (part) {
            const newStock = (part.stockQuantity ?? 0) - item.quantity;
            await db.updatePart(item.partId, { stockQuantity: newStock });
            
            await db.createInventoryLedgerEntry({
              partId: item.partId,
              transactionType: "warranty",
              quantity: -item.quantity,
              balanceAfter: newStock,
              referenceType: "warranty",
              referenceId: warranty.id,
              notes: `保修单 ${warranty.warrantyNumber} 出库`,
              operatedBy: ctx.user.id,
            });
            
            // Check for low stock
            if (part.minStockThreshold !== null && newStock < part.minStockThreshold) {
              await db.createLowStockAlert({
                partId: item.partId,
                currentStock: newStock,
                minThreshold: part.minStockThreshold ?? 0,
              });
            }
          }
        }
        
        await db.updateWarrantyStatus(warranty.id, "completed");
        return warranty;
      }),
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "approved", "rejected", "completed"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateWarrantyStatus(input.id, input.status);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        await db.deleteWarranty(input);
        return { success: true };
      }),
    getSalesHistory: protectedProcedure
      .input(z.string())
      .query(async ({ input }) => {
        return await db.getSalesHistoryByPartSku(input);
      }),
  }),

  // Storage (Image Upload)
  storage: router({
    uploadImage: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64
        contentType: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { storagePut } = await import("./storage.js");
        
        // 生成随机后缀防止文件名冲突
        const randomSuffix = Math.random().toString(36).substring(2, 10);
        const ext = input.fileName.split(".").pop();
        const fileKey = `parts/${Date.now()}-${randomSuffix}.${ext}`;
        
        // 将base64转为Buffer
        const base64Data = input.fileData.split(",")[1];
        const buffer = Buffer.from(base64Data, "base64");
        
        // 上传到S3
        const result = await storagePut(fileKey, buffer, input.contentType);
        
        return {
          url: result.url,
          key: result.key,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
