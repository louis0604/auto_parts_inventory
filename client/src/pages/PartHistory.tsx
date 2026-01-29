import { useRoute, Link } from "wouter";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

  // 筛选状态
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["sale", "purchase", "credit", "warranty", "adjustment"]);

  // 操作类型选项
  const typeOptions = [
    { value: "sale", label: "销售" },
    { value: "purchase", label: "入库" },
    { value: "credit", label: "退货" },
    { value: "warranty", label: "保修" },
    { value: "adjustment", label: "调整" },
  ];

  // 筛选逻辑
  const filteredHistory = useMemo(() => {
    return history.filter((record: any) => {
      // 类型筛选
      if (!selectedTypes.includes(record.type)) return false;

      // 时间范围筛选
      const recordDate = new Date(record.date);
      if (startDate && recordDate < new Date(startDate)) return false;
      if (endDate && recordDate > new Date(endDate)) return false;

      return true;
    });
  }, [history, selectedTypes, startDate, endDate]);

  // 统计信息
  const stats = useMemo(() => {
    const totalAmount = filteredHistory.reduce((sum: number, record: any) => {
      // totalAmount 可能是字符串或数字，需要转换为数字
      const amount = typeof record.totalAmount === 'string' 
        ? parseFloat(record.totalAmount) 
        : (record.totalAmount || 0);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    return {
      count: filteredHistory.length,
      totalAmount: totalAmount.toFixed(2),
    };
  }, [filteredHistory]);

  // 切换类型选择
  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // 重置筛选
  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedTypes(["sale", "purchase", "credit", "warranty", "adjustment"]);
  };

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

      {/* Filters */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">筛选条件</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 时间范围 */}
          <div className="space-y-4">
            <div>
              <Label>开始日期</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>结束日期</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* 操作类型 */}
          <div className="md:col-span-2">
            <Label className="mb-3 block">操作类型</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {typeOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${option.value}`}
                    checked={selectedTypes.includes(option.value)}
                    onCheckedChange={() => toggleType(option.value)}
                  />
                  <label
                    htmlFor={`type-${option.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="mt-4"
            >
              重置筛选
            </Button>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">筛选结果</p>
              <p className="text-2xl font-bold">{stats.count} 条</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">总记录数</p>
              <p className="text-2xl font-bold">{history.length} 条</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">筛选总金额</p>
              <p className="text-2xl font-bold">${stats.totalAmount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">已选类型</p>
              <p className="text-lg font-semibold">{selectedTypes.length} / {typeOptions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">操作历史</h2>
          <p className="text-sm text-gray-500 mt-1">
            显示 {stats.count} / {history.length} 条记录
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
            {filteredHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                  {history.length === 0 ? "暂无操作记录" : "没有符合筛选条件的记录"}
                </TableCell>
              </TableRow>
            ) : (
              filteredHistory.map((record: any, index: number) => (
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
