import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";

interface PurchaseOrderDetailProps {
  orderId: number | null;
  open: boolean;
  onClose: () => void;
}

export function PurchaseOrderDetail({ orderId, open, onClose }: PurchaseOrderDetailProps) {
  const { data: order, isLoading } = trpc.purchaseOrders.getById.useQuery(
    orderId!,
    { enabled: !!orderId }
  );

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>采购订单详情 - {order.orderNumber}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">加载中...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Date</div>
                <div className="font-medium">{format(new Date(order.orderDate), "yyyy-MM-dd")}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Time</div>
                <div className="font-medium">{order.orderTime || "N/A"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Type</div>
                <div className="font-medium capitalize">{order.type}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Order #</div>
                <div className="font-medium font-mono">{order.orderNumber}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Supplier</div>
                <div className="font-medium">{order.supplierName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="font-medium capitalize">{order.status}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Created By</div>
                <div className="font-medium">{order.createdByName}</div>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h3 className="text-lg font-semibold mb-3">配件明细</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium">#</th>
                      <th className="text-left p-3 font-medium">Line Code</th>
                      <th className="text-left p-3 font-medium">Part (SKU)</th>
                      <th className="text-left p-3 font-medium">Description</th>
                      <th className="text-right p-3 font-medium">Qty</th>
                      <th className="text-right p-3 font-medium">Unit Price</th>
                      <th className="text-right p-3 font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => (
                      <tr key={item.id} className="border-t hover:bg-muted/30">
                        <td className="p-3">{index + 1}</td>
                        <td className="p-3">
                          <span className="font-mono text-sm">{item.lineCode || "-"}</span>
                        </td>
                        <td className="p-3">
                          <div className="font-mono text-sm font-semibold">{item.partSku}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{item.partName}</div>
                        </td>
                        <td className="p-3 text-right font-medium">{item.quantity}</td>
                        <td className="p-3 text-right">${parseFloat(item.unitPrice).toFixed(2)}</td>
                        <td className="p-3 text-right font-medium">${parseFloat(item.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted font-semibold">
                    <tr>
                      <td colSpan={6} className="p-3 text-right">Total:</td>
                      <td className="p-3 text-right">${parseFloat(order.totalAmount).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div>
                <h3 className="text-lg font-semibold mb-2">备注</h3>
                <div className="p-4 bg-muted/50 rounded-lg text-sm">
                  {order.notes}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
