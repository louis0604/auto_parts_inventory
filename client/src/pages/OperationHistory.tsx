import { Link, useRoute } from "wouter";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, ShoppingCart, RotateCcw, Wrench, Settings } from "lucide-react";

export default function OperationHistory() {
  const [, params] = useRoute("/operation-history/:partId?");
  const partIdParam = params?.partId ? parseInt(params.partId) : undefined;

  // 如果有partId参数，只查询该配件的历史；否则查询所有配件的历史
  const { data: part } = trpc.parts.getById.useQuery(partIdParam!, { enabled: !!partIdParam });
  const { data: history = [], isLoading: historyLoading } = trpc.parts.getHistory.useQuery(
    partIdParam || 0,
    { enabled: !!partIdParam }
  );

  // 筛选状态
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["sale", "purchase", "credit", "warranty", "adjustment"]);
  const [searchSku, setSearchSku] = useState("");

  // 操作类型选项
  const typeOptions = [
    { value: "sale", label: "销售", icon: ShoppingCart },
    { value: "purchase", label: "入库", icon: Package },
    { value: "credit", label: "退货", icon: RotateCcw },
    { value: "warranty", label: "保修", icon: Wrench },
    { value: "adjustment", label: "调整", icon: Settings },
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

      // SKU搜索筛选
      if (searchSku && !record.partSku?.toLowerCase().includes(searchSku.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [history, selectedTypes, startDate, endDate, searchSku]);

  // 统计信息
  const stats = useMemo(() => {
    const totalAmount = filteredHistory.reduce((sum: number, record: any) => {
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
    setSearchSku("");
    setSelectedTypes(["sale", "purchase", "credit", "warranty", "adjustment"]);
  };

  // 获取类型徽章
  const getTypeBadge = (type: string) => {
    const typeConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      sale: { label: "销售", variant: "default" },
      purchase: { label: "入库", variant: "secondary" },
      credit: { label: "退货", variant: "destructive" },
      warranty: { label: "保修", variant: "outline" },
      adjustment: { label: "调整", variant: "secondary" },
    };
    const config = typeConfig[type] || { label: type, variant: "outline" as const };
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  // 根据操作类型生成详情页链接
  const getRecordDetailUrl = (type: string, recordId: number): string => {
    switch (type) {
      case "sale":
        return `/sales-invoices/${recordId}`;
      case "purchase":
        return `/purchase-orders/${recordId}`;
      case "credit":
        return `/credits/${recordId}`;
      case "warranty":
        return `/warranties/${recordId}`;
      default:
        return "#";
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          {part ? `${part.sku} - 操作历史` : "配件操作历史"}
        </h1>
        <p className="text-gray-500">
          {part ? `查看配件 ${part.name} 的所有操作记录` : "查看所有配件的操作记录"}
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">筛选条件</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 时间范围筛选 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>开始日期</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>结束日期</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* SKU搜索 */}
          {!partIdParam && (
            <div>
              <Label>配件编号 (SKU)</Label>
              <Input
                placeholder="输入配件编号搜索..."
                value={searchSku}
                onChange={(e) => setSearchSku(e.target.value)}
              />
            </div>
          )}

          {/* 操作类型筛选 */}
          <div>
            <Label className="mb-2 block">操作类型</Label>
            <div className="flex flex-wrap gap-3">
              {typeOptions.map(({ value, label, icon: Icon }) => (
                <div key={value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${value}`}
                    checked={selectedTypes.includes(value)}
                    onCheckedChange={() => toggleType(value)}
                  />
                  <label
                    htmlFor={`type-${value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-1"
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-between items-center pt-2">
            <Button variant="outline" onClick={resetFilters}>
              重置筛选
            </Button>
            <div className="text-sm text-gray-600">
              显示 <span className="font-semibold">{stats.count}</span> 条记录 / 共 <span className="font-semibold">{history.length}</span> 条
              {selectedTypes.length < typeOptions.length && (
                <span className="ml-2">
                  (已选 {selectedTypes.length} 种类型)
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500">筛选结果数量</div>
            <div className="text-2xl font-bold">{stats.count} 条</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500">筛选总金额</div>
            <div className="text-2xl font-bold">${stats.totalAmount}</div>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card>
        <CardContent className="pt-6">
          {historyLoading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {history.length === 0 ? "暂无操作记录" : "没有符合筛选条件的记录"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  {!partIdParam && <TableHead>配件编号</TableHead>}
                  <TableHead>操作类型</TableHead>
                  <TableHead>单号</TableHead>
                  <TableHead>数量</TableHead>
                  <TableHead>单价</TableHead>
                  <TableHead>总金额</TableHead>
                  <TableHead>备注</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((record: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                    {!partIdParam && (
                      <TableCell>
                        <Link href={`/parts/${record.partId}`} className="text-blue-600 hover:underline">
                          {record.partSku}
                        </Link>
                      </TableCell>
                    )}
                    <TableCell>{getTypeBadge(record.type)}</TableCell>
                    <TableCell>
                      {record.recordId && record.type !== "adjustment" ? (
                        <Link
                          href={getRecordDetailUrl(record.type, record.recordId)}
                          className="text-blue-600 hover:underline"
                        >
                          {record.referenceNumber}
                        </Link>
                      ) : (
                        <span className="text-gray-500">{record.referenceNumber || "-"}</span>
                      )}
                    </TableCell>
                    <TableCell>{record.quantity}</TableCell>
                    <TableCell>${record.unitPrice}</TableCell>
                    <TableCell className="font-medium">${record.totalAmount}</TableCell>
                    <TableCell className="text-gray-500">{record.notes || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
