import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Check, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function PurchaseOrderDetailPage() {
  const [, params] = useRoute("/purchase-orders/:id");
  const [, setLocation] = useLocation();
  const orderId = params?.id ? parseInt(params.id) : null;

  const { data: order, isLoading, refetch } = trpc.purchaseOrders.getById.useQuery(
    orderId!,
    { enabled: !!orderId }
  );

  const receiveMutation = trpc.purchaseOrders.receive.useMutation({
    onSuccess: () => {
      toast.success("订单已入库");
      refetch();
    },
    onError: (error) => {
      toast.error(`入库失败: ${error.message}`);
    },
  });

  const cancelMutation = trpc.purchaseOrders.cancel.useMutation({
    onSuccess: () => {
      toast.success("订单已取消");
      refetch();
    },
    onError: (error) => {
      toast.error(`取消失败: ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">订单不存在</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setLocation("/purchase-orders")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <h1 className="text-3xl font-bold">采购订单详情 - {order.orderNumber}</h1>
        </div>
        <div className="flex gap-2">
          {order.status === "pending" && (
            <>
              <Button
                variant="outline"
                onClick={() => cancelMutation.mutate(order.id)}
                disabled={cancelMutation.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                取消订单
              </Button>
              <Button
                onClick={() => receiveMutation.mutate(order.id)}
                disabled={receiveMutation.isPending}
              >
                <Check className="h-4 w-4 mr-2" />
                确认入库
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="pt-6 space-y-6">
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
        </CardContent>
      </Card>
    </div>
  );
}
