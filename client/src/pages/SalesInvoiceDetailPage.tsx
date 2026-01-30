import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, RotateCcw, X, Printer } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function SalesInvoiceDetailPage() {
  const [, params] = useRoute("/sales-invoices/:id");
  const [, setLocation] = useLocation();
  const invoiceId = params?.id ? parseInt(params.id) : null;

  const { data: invoice, isLoading, refetch } = trpc.salesInvoices.getById.useQuery(
    invoiceId!,
    { enabled: !!invoiceId }
  );

  const cancelMutation = trpc.salesInvoices.cancel.useMutation({
    onSuccess: () => {
      toast.success("发票已取消");
      refetch();
    },
    onError: (error) => {
      toast.error(`取消失败: ${error.message}`);
    },
  });

  const updateStatusMutation = trpc.salesInvoices.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("状态已更新");
      refetch();
    },
    onError: (error) => {
      toast.error(`状态更新失败: ${error.message}`);
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

  if (!invoice) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">发票不存在</div>
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
            onClick={() => setLocation("/sales-invoices")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <h1 className="text-3xl font-bold">销售发票详情 - {invoice.invoiceNumber}</h1>
        </div>
        <div className="flex gap-2">
          {invoice.status === "completed" && (
            <Button
              variant="outline"
              onClick={() => setLocation(`/credits?from_invoice=${invoice.id}`)}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              创建退货单
            </Button>
          )}
          {invoice.status === "pending" && (
            <>
              <Button
                variant="outline"
                onClick={() => cancelMutation.mutate(invoice.id)}
                disabled={cancelMutation.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                取消发票
              </Button>
              <Button
                onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: "completed" })}
                disabled={updateStatusMutation.isPending}
              >
                标记为已完成
              </Button>
            </>
          )}
          <Button
            variant="outline"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4 mr-2" />
            打印
          </Button>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">Date</div>
              <div className="font-medium">{format(new Date(invoice.invoiceDate), "yyyy-MM-dd")}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Time</div>
              <div className="font-medium">{invoice.invoiceTime || "N/A"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Type</div>
              <div className="font-medium capitalize">{invoice.type}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Invoice #</div>
              <div className="font-medium font-mono">{invoice.invoiceNumber}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Customer</div>
              <div className="font-medium">{invoice.customerName}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="font-medium capitalize">{invoice.status}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Created By</div>
              <div className="font-medium">{invoice.createdByName}</div>
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
                  {invoice.items.map((item, index) => (
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
                    <td className="p-3 text-right">${parseFloat(invoice.totalAmount).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div>
              <h3 className="text-lg font-semibold mb-2">备注</h3>
              <div className="p-4 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap">
                {invoice.notes}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
