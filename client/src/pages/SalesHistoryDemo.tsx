import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Search, Check } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function SalesHistoryDemo() {
  const [partSku, setPartSku] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<{
    invoiceId: number;
    invoiceNumber: string;
    invoiceDate: Date;
    quantity: number;
    unitPrice: string;
    customerName: string;
  } | null>(null);

  const { data: salesHistory, isLoading, refetch } = trpc.credits.getSalesHistory.useQuery(
    partSku,
    { enabled: false }
  );

  const handleSearch = () => {
    if (!partSku.trim()) {
      toast.error("请输入配件编号");
      return;
    }
    refetch();
  };

  const handleSelectInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    toast.success(`已选择销售单：${invoice.invoiceNumber}`);
  };

  return (
    <div className="container py-6">
      <Card>
        <CardHeader>
          <CardTitle>销售历史查询演示</CardTitle>
          <p className="text-sm text-muted-foreground">
            输入配件SKU查询该配件的销售历史，选择销售记录后可用于创建退货单或保修单
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Section */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="partSku">配件编号 (SKU)</Label>
                <Input
                  id="partSku"
                  placeholder="输入配件SKU，例如: BRK-001"
                  value={partSku}
                  onChange={(e) => setPartSku(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} disabled={isLoading}>
                  <Search className="h-4 w-4 mr-2" />
                  查询销售历史
                </Button>
              </div>
            </div>
          </div>

          {/* Sales History Table */}
          {salesHistory && salesHistory.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">销售历史记录</h3>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>销售单号</TableHead>
                      <TableHead>日期</TableHead>
                      <TableHead>数量</TableHead>
                      <TableHead>单价</TableHead>
                      <TableHead>客户</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesHistory.map((record) => (
                      <TableRow
                        key={record.invoiceId}
                        className={
                          selectedInvoice?.invoiceId === record.invoiceId
                            ? "bg-primary/5"
                            : ""
                        }
                      >
                        <TableCell className="font-medium">
                          {record.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          {new Date(record.invoiceDate).toLocaleDateString("zh-CN")}
                        </TableCell>
                        <TableCell>{record.quantity}</TableCell>
                        <TableCell>¥{parseFloat(record.unitPrice).toFixed(2)}</TableCell>
                        <TableCell>{record.customerName}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={
                              selectedInvoice?.invoiceId === record.invoiceId
                                ? "default"
                                : "outline"
                            }
                            onClick={() => handleSelectInvoice(record)}
                          >
                            {selectedInvoice?.invoiceId === record.invoiceId ? (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                已选择
                              </>
                            ) : (
                              "选择"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {salesHistory && salesHistory.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              未找到该配件的销售记录
            </div>
          )}

          {/* Selected Invoice Info */}
          {selectedInvoice && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-base">已选择的销售记录</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">原始销售单号</Label>
                    <p className="font-medium">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">销售日期</Label>
                    <p className="font-medium">
                      {new Date(selectedInvoice.invoiceDate).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">客户</Label>
                    <p className="font-medium">{selectedInvoice.customerName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">数量</Label>
                    <p className="font-medium">{selectedInvoice.quantity}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">单价</Label>
                    <p className="font-medium">
                      ¥{parseFloat(selectedInvoice.unitPrice).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    💡 在实际的退货单或保修单创建表单中，这些信息将自动填充到表单字段，
                    原始销售单号将显示在退货/保修单的配件明细下方。
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Usage Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">功能说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>1. 查询销售历史：</strong>输入配件SKU（例如：BRK-001），点击"查询销售历史"按钮
              </p>
              <p>
                <strong>2. 选择销售记录：</strong>从查询结果中选择要关联的销售单号
              </p>
              <p>
                <strong>3. 自动填充信息：</strong>选择后，原始销售单号、客户、数量等信息将自动填充
              </p>
              <p>
                <strong>4. 创建退货/保修单：</strong>在实际应用中，这些信息会自动填充到创建表单，
                并在退货单/保修单的配件明细下方显示原始销售单号
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
