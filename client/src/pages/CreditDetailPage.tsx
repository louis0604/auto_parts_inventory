import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function CreditDetailPage() {
  const [, params] = useRoute("/credits/:id");
  const [, setLocation] = useLocation();
  const creditId = params?.id ? parseInt(params.id) : null;

  const { data: credit, isLoading, refetch } = trpc.credits.getById.useQuery(
    creditId!,
    { enabled: !!creditId }
  );

  const cancelMutation = trpc.credits.cancel.useMutation({
    onSuccess: () => {
      toast.success("退货单已取消");
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

  if (!credit) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">退货单不存在</div>
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
            onClick={() => setLocation("/credits")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <h1 className="text-3xl font-bold">退货单详情 - {credit.creditNumber}</h1>
        </div>
        <div className="flex gap-2">
          {credit.status === "pending" && (
            <Button
              variant="outline"
              onClick={() => cancelMutation.mutate(credit.id)}
              disabled={cancelMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              取消退货单
            </Button>
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
              <div className="font-medium">{format(new Date(credit.creditDate), "yyyy-MM-dd")}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Credit #</div>
              <div className="font-medium font-mono">{credit.creditNumber}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Customer</div>
              <div className="font-medium">{credit.customerName}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="font-medium capitalize">{credit.status}</div>
            </div>
            {credit.customerNumber && (
              <div>
                <div className="text-sm text-muted-foreground">Customer #</div>
                <div className="font-medium">{credit.customerNumber}</div>
              </div>
            )}
            {credit.originalInvoiceNumber && (
              <div>
                <div className="text-sm text-muted-foreground">Original Invoice</div>
                <div className="font-medium font-mono">{credit.originalInvoiceNumber}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-muted-foreground">Created By</div>
              <div className="font-medium">{credit.createdByName}</div>
            </div>
          </div>

          {/* Reason */}
          {credit.reason && (
            <div>
              <h3 className="text-lg font-semibold mb-2">退货原因</h3>
              <div className="p-4 bg-muted/50 rounded-lg text-sm">
                {credit.reason}
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
                  {credit.items.map((item, index) => (
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
                    <td className="p-3 text-right">${parseFloat(credit.totalAmount).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {credit.notes && (
            <div>
              <h3 className="text-lg font-semibold mb-2">备注</h3>
              <div className="p-4 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap">
                {credit.notes}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
