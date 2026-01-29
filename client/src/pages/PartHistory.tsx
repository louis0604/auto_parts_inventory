import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Package, ShoppingCart, RotateCcw, Wrench, Settings } from "lucide-react";

export default function PartHistory() {
  const [, params] = useRoute("/parts/:id/history");
  const partId = params?.id ? parseInt(params.id) : 0;

  const { data: part, isLoading: partLoading } = trpc.parts.getById.useQuery(partId);
  const { data: history = [], isLoading: historyLoading } = trpc.parts.getHistory.useQuery(partId);

  if (partLoading || historyLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!part) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">配件不存在</p>
          <Link href="/parts">
            <Button className="mt-4">返回配件列表</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "sale":
        return <ShoppingCart className="w-4 h-4" />;
      case "purchase":
        return <Package className="w-4 h-4" />;
      case "credit":
        return <RotateCcw className="w-4 h-4" />;
      case "warranty":
        return <Wrench className="w-4 h-4" />;
      case "adjustment":
        return <Settings className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    const config = {
      sale: { label: "销售", variant: "default" as const },
      purchase: { label: "入库", variant: "secondary" as const },
      credit: { label: "退货", variant: "outline" as const },
      warranty: { label: "保修", variant: "destructive" as const },
      adjustment: { label: "调整", variant: "secondary" as const },
    };
    const { label, variant } = config[type as keyof typeof config] || { label: type, variant: "default" as const };
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {getTypeIcon(type)}
        {label}
      </Badge>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/parts">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回配件列表
          </Button>
        </Link>
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-start gap-6">
            {part.imageUrl && (
              <img
                src={part.imageUrl}
                alt={part.name}
                className="w-24 h-24 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{part.sku}</h1>
              <p className="text-lg text-gray-600 mb-4">{part.name}</p>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">当前库存：</span>
                  <span className="font-semibold ml-2">{part.stockQuantity}</span>
                </div>
                <div>
                  <span className="text-gray-500">零售价：</span>
                  <span className="font-semibold ml-2">${part.retail || "-"}</span>
                </div>
                <div>
                  <span className="text-gray-500">标价：</span>
                  <span className="font-semibold ml-2">${part.listPrice || "-"}</span>
                </div>
                <div>
                  <span className="text-gray-500">订货点：</span>
                  <span className="font-semibold ml-2">{part.orderPoint || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">操作历史</h2>
          <p className="text-sm text-gray-500 mt-1">
            共 {history.length} 条记录
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">类型</TableHead>
              <TableHead className="w-40">日期时间</TableHead>
              <TableHead className="w-40">单号</TableHead>
              <TableHead className="w-24 text-right">数量</TableHead>
              <TableHead className="w-32 text-right">单价</TableHead>
              <TableHead className="w-32 text-right">总金额</TableHead>
              <TableHead>客户/供应商</TableHead>
              <TableHead>备注</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                  暂无操作记录
                </TableCell>
              </TableRow>
            ) : (
              history.map((record: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{getTypeBadge(record.type)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(record.date).toLocaleDateString('zh-CN')}</div>
                      {record.time && (
                        <div className="text-gray-500">{record.time}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {record.referenceNumber || "-"}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {record.quantity > 0 ? "+" : ""}{record.quantity}
                  </TableCell>
                  <TableCell className="text-right">
                    {record.unitPrice ? `$${record.unitPrice}` : "-"}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {record.totalAmount ? `$${record.totalAmount}` : "-"}
                  </TableCell>
                  <TableCell>{record.customerName || "-"}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {record.notes || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
