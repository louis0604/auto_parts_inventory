import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useLocation } from "wouter";

interface SalesInvoiceDetailProps {
  invoiceId: number | null;
  open: boolean;
  onClose: () => void;
  onCreateCredit?: (invoice: any) => void;
}

export function SalesInvoiceDetail({ invoiceId, open, onClose, onCreateCredit }: SalesInvoiceDetailProps) {
  const [, setLocation] = useLocation();
  const { data: invoice, isLoading } = trpc.salesInvoices.getById.useQuery(
    invoiceId!,
    { enabled: !!invoiceId }
  );

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>销售发票详情 - {invoice.invoiceNumber}</DialogTitle>
            {invoice.status === "completed" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (onCreateCredit) {
                    onCreateCredit(invoice);
                  } else {
                    // 如果没有回调，导航到Credits页面并传递发票信息
                    setLocation(`/credits?from_invoice=${invoice.id}`);
                  }
                  onClose();
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                创建退货单
              </Button>
            )}
          </div>
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
                <div className="text-sm text-muted-foreground">Cust #</div>
                <div className="font-medium">{invoice.customerNumber || "N/A"}</div>
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
                      <th className="text-right p-3 font-medium">Sale Price</th>
                      <th className="text-right p-3 font-medium">Cost</th>
                      <th className="text-right p-3 font-medium">Extension</th>
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
                        <td className="p-3 text-right text-muted-foreground">
                          ${item.partCost ? parseFloat(item.partCost).toFixed(2) : "N/A"}
                        </td>
                        <td className="p-3 text-right font-medium">${parseFloat(item.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted font-semibold">
                    <tr>
                      <td colSpan={7} className="p-3 text-right">Total:</td>
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
                <div className="p-4 bg-muted/50 rounded-lg text-sm">
                  {invoice.notes}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
