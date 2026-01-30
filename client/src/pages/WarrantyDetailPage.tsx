import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function WarrantyDetailPage() {
  const [, params] = useRoute("/warranties/:id");
  const [, setLocation] = useLocation();
  const warrantyId = params?.id ? parseInt(params.id) : null;

  const { data: warranty, isLoading, refetch } = trpc.warranties.getById.useQuery(
    warrantyId!,
    { enabled: !!warrantyId }
  );

  const updateStatusMutation = trpc.warranties.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("状态更新成功");
      refetch();
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
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

  if (!warranty) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">保修单不存在</div>
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
            onClick={() => setLocation("/warranties")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <h1 className="text-3xl font-bold">保修单详情 - {warranty.warrantyNumber}</h1>
        </div>
        <div className="flex gap-2">
          {warranty.status === "pending" && (
            <>
              <Button
                variant="outline"
                onClick={() => updateStatusMutation.mutate({ id: warranty.id, status: "rejected" })}
                disabled={updateStatusMutation.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                拒绝
              </Button>
              <Button
                onClick={() => updateStatusMutation.mutate({ id: warranty.id, status: "approved" })}
                disabled={updateStatusMutation.isPending}
              >
                批准
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
              <div className="font-medium">{format(new Date(warranty.warrantyDate), "yyyy-MM-dd")}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Warranty #</div>
              <div className="font-medium font-mono">{warranty.warrantyNumber}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Customer</div>
              <div className="font-medium">{warranty.customerName}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="font-medium capitalize">{warranty.status}</div>
            </div>
            {warranty.customerNumber && (
              <div>
                <div className="text-sm text-muted-foreground">Customer #</div>
                <div className="font-medium">{warranty.customerNumber}</div>
              </div>
            )}
            {warranty.originalInvoiceNumber && (
              <div>
                <div className="text-sm text-muted-foreground">Original Invoice</div>
                <div className="font-medium font-mono">{warranty.originalInvoiceNumber}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-muted-foreground">Created By</div>
              <div className="font-medium">{warranty.createdByName}</div>
            </div>
          </div>

          {/* Claim Reason */}
          {warranty.claimReason && (
            <div>
              <h3 className="text-lg font-semibold mb-2">保修原因</h3>
              <div className="p-4 bg-muted/50 rounded-lg text-sm">
                {warranty.claimReason}
              </div>
            </div>
          )}

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
                  {warranty.items.map((item, index) => (
                    <tr key={item.id} className="border-t hover:bg-muted/30">
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3">
                        <span className="font-mono text-sm">-</span>
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
                    <td className="p-3 text-right">${parseFloat(warranty.totalAmount).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {warranty.notes && (
            <div>
              <h3 className="text-lg font-semibold mb-2">备注</h3>
              <div className="p-4 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap">
                {warranty.notes}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
