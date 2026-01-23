import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BarChart3, ArrowUp, ArrowDown, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function InventoryLedger() {
  const [selectedPartId, setSelectedPartId] = useState<number | null>(null);

  const { data: parts } = trpc.parts.list.useQuery();
  const { data: ledgerEntries, isLoading } = trpc.inventoryLedger.getByPart.useQuery(
    selectedPartId || 0,
    { enabled: !!selectedPartId }
  );

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "in":
        return <ArrowUp className="h-4 w-4 text-accent" />;
      case "out":
        return <ArrowDown className="h-4 w-4 text-destructive" />;
      case "adjustment":
        return <RefreshCw className="h-4 w-4 text-primary" />;
      default:
        return null;
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "in":
        return <Badge variant="default" className="bg-accent">入库</Badge>;
      case "out":
        return <Badge variant="destructive">出库</Badge>;
      case "adjustment":
        return <Badge variant="outline" className="neon-border-pink">调整</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card className="neon-border-cyan">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 neon-text-cyan">
            <BarChart3 className="h-6 w-6" />
            库存分类账
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="partSelect">选择配件查看库存记录</Label>
            <Select
              value={selectedPartId?.toString() || ""}
              onValueChange={(value) => setSelectedPartId(value ? parseInt(value) : null)}
            >
              <SelectTrigger id="partSelect" className="neon-border-cyan">
                <SelectValue placeholder="请选择配件" />
              </SelectTrigger>
              <SelectContent>
                {parts?.map((part) => (
                  <SelectItem key={part.id} value={part.id.toString()}>
                    {part.name} ({part.sku}) - 当前库存: {part.stockQuantity} {part.unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPartId ? (
            isLoading ? (
              <div className="text-center py-8 text-muted-foreground">加载中...</div>
            ) : ledgerEntries && ledgerEntries.length > 0 ? (
              <div className="border rounded-lg neon-border-cyan overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-card/50">
                      <TableHead className="text-accent">日期时间</TableHead>
                      <TableHead className="text-accent">交易类型</TableHead>
                      <TableHead className="text-accent">数量变化</TableHead>
                      <TableHead className="text-accent">结存</TableHead>
                      <TableHead className="text-accent">关联单据</TableHead>
                      <TableHead className="text-accent">备注</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerEntries.map((entry) => (
                      <TableRow key={entry.id} className="hover:bg-card/30">
                        <TableCell className="font-mono text-sm">
                          {new Date(entry.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(entry.transactionType)}
                            {getTransactionBadge(entry.transactionType)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-mono font-bold ${
                              entry.quantity > 0 ? "text-accent" : "text-destructive"
                            }`}
                          >
                            {entry.quantity > 0 ? "+" : ""}
                            {entry.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono font-bold neon-text">
                          {entry.balanceAfter}
                        </TableCell>
                        <TableCell className="text-sm">
                          {entry.referenceType && entry.referenceId ? (
                            <span className="text-muted-foreground">
                              {entry.referenceType === "purchase_order" && "采购订单"}
                              {entry.referenceType === "sales_invoice" && "销售发票"}
                              {entry.referenceType === "manual" && "手动调整"}
                              {entry.referenceType === "initial" && "初始化"}
                              {entry.referenceId && ` #${entry.referenceId}`}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {entry.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                该配件暂无库存变动记录
              </div>
            )
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>请选择配件查看库存变动记录</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
