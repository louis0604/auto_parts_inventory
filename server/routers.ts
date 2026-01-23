import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";

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
        await db.deleteSupplier(input);
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
        await db.deleteCustomer(input);
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
    lowStock: protectedProcedure.query(async () => {
      return await db.getLowStockParts();
    }),
    create: protectedProcedure
      .input(z.object({
        sku: z.string().min(1),
        name: z.string().min(1),
        categoryId: z.number().optional(),
        supplierId: z.number().optional(),
        description: z.string().optional(),
        unitPrice: z.string(),
        stockQuantity: z.number().default(0),
        minStockThreshold: z.number().default(10),
        unit: z.string().default("件"),
      }))
      .mutation(async ({ input, ctx }) => {
        const part = await db.createPart(input);
        
        // Create initial inventory ledger entry if stock > 0
        if (input.stockQuantity > 0) {
          await db.createInventoryLedgerEntry({
            partId: part.id,
            transactionType: "in",
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
          sku: z.string().min(1).optional(),
          name: z.string().min(1).optional(),
          categoryId: z.number().optional(),
          supplierId: z.number().optional(),
          description: z.string().optional(),
          unitPrice: z.string().optional(),
          minStockThreshold: z.number().optional(),
          unit: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await db.updatePart(input.id, input.data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        await db.deletePart(input);
        return { success: true };
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
        
        const newStock = part.stockQuantity + input.quantity;
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
        if (newStock < part.minStockThreshold) {
          await db.createLowStockAlert({
            partId: input.partId,
            currentStock: newStock,
            minThreshold: part.minStockThreshold,
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
          
          const newStock = part.stockQuantity + item.quantity;
          await db.updatePart(item.partId, { stockQuantity: newStock });
          
          await db.createInventoryLedgerEntry({
            partId: item.partId,
            transactionType: "in",
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
          if (part.stockQuantity < item.quantity) {
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
            const newStock = part.stockQuantity - item.quantity;
            await db.updatePart(item.partId, { stockQuantity: newStock });
            
            await db.createInventoryLedgerEntry({
              partId: item.partId,
              transactionType: "out",
              quantity: -item.quantity,
              balanceAfter: newStock,
              referenceType: "sales_invoice",
              referenceId: invoice.id,
              notes: `销售发票 ${invoice.invoiceNumber} 出库`,
              operatedBy: ctx.user.id,
            });
            
            // Check for low stock
            if (newStock < part.minStockThreshold) {
              await db.createLowStockAlert({
                partId: item.partId,
                currentStock: newStock,
                minThreshold: part.minStockThreshold,
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
        currentStock: part.stockQuantity,
        minThreshold: part.minStockThreshold,
        unitPrice: parseFloat(part.unitPrice),
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
});

export type AppRouter = typeof appRouter;
