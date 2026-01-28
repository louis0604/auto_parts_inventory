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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, RotateCcw, Trash2, X, Eye } from "lucide-react";
import { toast } from "sonner";
import { useForm, useFieldArray } from "react-hook-form";
import { Badge } from "@/components/ui/badge";

type CreditFormData = {
  creditNumber: string;
  customerId: number;
  customerNumber?: string;
  originalInvoiceNumber?: string;
  reason?: string;
  notes?: string;
  items: {
    partId: number;
    quantity: number;
    unitPrice: string;
  }[];
};

export default function Credits() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [detailCreditId, setDetailCreditId] = useState<number | null>(null);

  const { data: credits, isLoading, refetch } = trpc.credits.list.useQuery();
  const { data: customers } = trpc.customers.list.useQuery();
  const { data: parts } = trpc.parts.list.useQuery();
  
  const createMutation = trpc.credits.create.useMutation({
    onSuccess: () => {
      toast.success("退货单创建成功");
      setIsAddDialogOpen(false);
      refetch();
      reset();
    },
    onError: (error) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });

  const cancelMutation = trpc.credits.cancel.useMutation({
    onSuccess: () => {
      toast.success("退货单已取消");
      refetch();
    },
    onError: (error) => {
      toast.error(`取消失败: ${error.message}`);
    },
  });

  const { register, handleSubmit, reset, control, watch, setValue } = useForm<CreditFormData>({
    defaultValues: {
      creditNumber: `CR-${Date.now()}`,
      customerId: 0,
      customerNumber: "",
      originalInvoiceNumber: "",
      reason: "",
      notes: "",
      items: [{ partId: 0, quantity: 1, unitPrice: "0" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const onSubmit = (data: CreditFormData) => {
    if (!data.customerId) {
      toast.error("请选择客户");
      return;
    }

    const validItems = data.items.filter(item => item.partId > 0 && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error("请至少添加一个配件");
      return;
    }

    createMutation.mutate({
      ...data,
      items: validItems,
    });
  };

  const watchedItems = watch("items");
  const totalAmount = watchedItems.reduce((sum, item) => {
    return sum + (parseFloat(item.unitPrice) || 0) * (item.quantity || 0);
  }, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-600">已完成</Badge>;
      case "pending":
        return <Badge variant="outline">待处理</Badge>;
      case "cancelled":
        return <Badge variant="destructive">已取消</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-6 w-6" />
              退货管理
            </CardTitle>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              创建退货单
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : credits && credits.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>退货单号</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>原始发票号</TableHead>
                  <TableHead>退货日期</TableHead>
                  <TableHead>总金额</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>退货原因</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credits.map((credit) => (
                  <TableRow key={credit.id}>
                    <TableCell>
                      <button
                        onClick={() => setDetailCreditId(credit.id)}
                        className="text-blue-600 hover:underline font-mono"
                      >
                        {credit.creditNumber}
                      </button>
                    </TableCell>
                    <TableCell>{credit.customerName}</TableCell>
                    <TableCell className="font-mono">{credit.originalInvoiceNumber || "-"}</TableCell>
                    <TableCell>
                      {new Date(credit.creditDate).toLocaleDateString("zh-CN")}
                    </TableCell>
                    <TableCell className="font-mono">${parseFloat(credit.totalAmount).toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(credit.status)}</TableCell>
                    <TableCell className="max-w-xs truncate">{credit.reason || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDetailCreditId(credit.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {credit.status === "pending" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm("确定要取消这个退货单吗？")) {
                                cancelMutation.mutate(credit.id);
                              }
                            }}
                          >
                            取消
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              暂无退货记录
            </div>
          )}
        </CardContent>
      </Card>

      {/* 创建退货单对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>创建退货单</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="creditNumber">退货单号</Label>
                <Input id="creditNumber" {...register("creditNumber")} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerId">客户 *</Label>
                <Select
                  value={watch("customerId")?.toString() || ""}
                  onValueChange={(value) => setValue("customerId", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择客户" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerNumber">客户编号</Label>
                <Input id="customerNumber" {...register("customerNumber")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="originalInvoiceNumber">原始发票号</Label>
                <Input id="originalInvoiceNumber" {...register("originalInvoiceNumber")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">退货原因</Label>
              <Textarea id="reason" {...register("reason")} rows={2} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>退货配件</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ partId: 0, quantity: 1, unitPrice: "0" })}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  添加配件
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">配件</TableHead>
                    <TableHead className="w-32">数量</TableHead>
                    <TableHead className="w-40">单价</TableHead>
                    <TableHead className="w-36">小计</TableHead>
                    <TableHead className="w-20">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => {
                    const selectedPart = parts?.find(p => p.id === watch(`items.${index}.partId`));
                    const quantity = watch(`items.${index}.quantity`) || 0;
                    const unitPrice = parseFloat(watch(`items.${index}.unitPrice`) || "0");
                    const subtotal = quantity * unitPrice;

                    return (
                      <TableRow key={field.id}>
                        <TableCell>
                          <Select
                            value={watch(`items.${index}.partId`)?.toString() || ""}
                            onValueChange={(value) => {
                              const partId = parseInt(value);
                              setValue(`items.${index}.partId`, partId);
                              const part = parts?.find(p => p.id === partId);
                              if (part && part.retail) {
                                setValue(`items.${index}.unitPrice`, part.retail);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="选择配件" />
                            </SelectTrigger>
                            <SelectContent>
                              {parts?.map((part) => (
                                <SelectItem key={part.id} value={part.id.toString()}>
                                  {part.sku} - {part.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            className="w-full text-center"
                            {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full text-right"
                            {...register(`items.${index}.unitPrice`)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-right">
                          ${subtotal.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="flex justify-end text-lg font-semibold">
                总金额: <span className="ml-2 font-mono">${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">备注</Label>
              <Textarea id="notes" {...register("notes")} rows={2} />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "创建中..." : "创建退货单"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 退货单详情对话框 */}
      {detailCreditId && (
        <CreditDetail
          creditId={detailCreditId}
          onClose={() => setDetailCreditId(null)}
        />
      )}
    </div>
  );
}

// 退货单详情组件
function CreditDetail({ creditId, onClose }: { creditId: number; onClose: () => void }) {
  const { data: credit, isLoading } = trpc.credits.getById.useQuery(creditId);

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>退货单详情</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">加载中...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!credit) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>退货单详情 - {credit.creditNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">客户</Label>
              <div className="font-medium">{credit.customerName}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">客户编号</Label>
              <div className="font-medium">{credit.customerNumber || "-"}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">原始发票号</Label>
              <div className="font-medium font-mono">{credit.originalInvoiceNumber || "-"}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">退货日期</Label>
              <div className="font-medium">
                {new Date(credit.creditDate).toLocaleDateString("zh-CN")}
                {credit.creditTime && ` ${credit.creditTime}`}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">状态</Label>
              <div>
                {credit.status === "completed" && <Badge className="bg-green-600">已完成</Badge>}
                {credit.status === "pending" && <Badge variant="outline">待处理</Badge>}
                {credit.status === "cancelled" && <Badge variant="destructive">已取消</Badge>}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">操作人</Label>
              <div className="font-medium">{credit.createdByName}</div>
            </div>
          </div>

          {credit.reason && (
            <div>
              <Label className="text-muted-foreground">退货原因</Label>
              <div className="mt-1 p-3 bg-muted rounded-md">{credit.reason}</div>
            </div>
          )}

          <div>
            <Label className="text-lg font-semibold mb-2 block">退货配件明细</Label>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>配件名称</TableHead>
                  <TableHead className="text-right">数量</TableHead>
                  <TableHead className="text-right">单价</TableHead>
                  <TableHead className="text-right">小计</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credit.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono">{item.partSku}</TableCell>
                    <TableCell>{item.partName}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right font-mono">
                      ${parseFloat(item.unitPrice).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${parseFloat(item.subtotal).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end mt-4 text-lg font-semibold">
              总金额: <span className="ml-2 font-mono">${parseFloat(credit.totalAmount).toFixed(2)}</span>
            </div>
          </div>

          {credit.notes && (
            <div>
              <Label className="text-muted-foreground">备注</Label>
              <div className="mt-1 p-3 bg-muted rounded-md">{credit.notes}</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
