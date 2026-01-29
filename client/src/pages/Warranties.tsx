import { useState, useEffect } from "react";
import { useRoute } from "wouter";
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
import { Plus, Shield, Trash2, X, Eye } from "lucide-react";
import { toast } from "sonner";
import { useForm, useFieldArray } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { WarrantyFormWithSalesHistory } from "@/components/WarrantyFormWithSalesHistory";

type WarrantyFormData = {
  warrantyNumber: string;
  customerId: number;
  customerNumber?: string;
  originalInvoiceNumber?: string;
  claimReason?: string;
  notes?: string;
  items: {
    partId: number;
    quantity: number;
    unitPrice: string;
  }[];
};

export default function Warranties() {
  const [, params] = useRoute("/warranties/:id");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [detailWarrantyId, setDetailWarrantyId] = useState<number | null>(null);

  // 如果有路由参数id，自动打开详情页
  useEffect(() => {
    if (params?.id) {
      const warrantyId = parseInt(params.id);
      if (!isNaN(warrantyId)) {
        setDetailWarrantyId(warrantyId);
      }
    }
  }, [params?.id]);

  const { data: warranties, isLoading, refetch } = trpc.warranties.list.useQuery();
  const { data: customers } = trpc.customers.list.useQuery();
  const { data: parts } = trpc.parts.list.useQuery();
  
  const createMutation = trpc.warranties.create.useMutation({
    onSuccess: () => {
      toast.success("保修单创建成功");
      setIsAddDialogOpen(false);
      refetch();
      reset();
    },
    onError: (error) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });

  const updateStatusMutation = trpc.warranties.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("状态更新成功");
      refetch();
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  const { register, handleSubmit, reset, control, watch, setValue } = useForm<WarrantyFormData>({
    defaultValues: {
      warrantyNumber: `WR-${Date.now()}`,
      customerId: 0,
      customerNumber: "",
      originalInvoiceNumber: "",
      claimReason: "",
      notes: "",
      items: [{ partId: 0, quantity: 1, unitPrice: "0" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const onSubmit = (data: WarrantyFormData) => {
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
      case "approved":
        return <Badge variant="default" className="bg-blue-600">已批准</Badge>;
      case "pending":
        return <Badge variant="outline">待处理</Badge>;
      case "rejected":
        return <Badge variant="destructive">已拒绝</Badge>;
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
              <Shield className="h-6 w-6" />
              保修管理
            </CardTitle>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              创建保修单
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : warranties && warranties.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>保修单号</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>原始发票号</TableHead>
                  <TableHead>保修日期</TableHead>
                  <TableHead>总金额</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>索赔原因</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warranties.map((warranty) => (
                  <TableRow key={warranty.id}>
                    <TableCell>
                      <button
                        onClick={() => setDetailWarrantyId(warranty.id)}
                        className="text-blue-600 hover:underline font-mono"
                      >
                        {warranty.warrantyNumber}
                      </button>
                    </TableCell>
                    <TableCell>{warranty.customerName}</TableCell>
                    <TableCell className="font-mono">{warranty.originalInvoiceNumber || "-"}</TableCell>
                    <TableCell>
                      {new Date(warranty.warrantyDate).toLocaleDateString("zh-CN")}
                    </TableCell>
                    <TableCell className="font-mono">${parseFloat(warranty.totalAmount).toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(warranty.status)}</TableCell>
                    <TableCell className="max-w-xs truncate">{warranty.claimReason || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDetailWarrantyId(warranty.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {warranty.status === "pending" && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-blue-600"
                              onClick={() => {
                                if (confirm("确定要批准这个保修申请吗？")) {
                                  updateStatusMutation.mutate({ id: warranty.id, status: "approved" });
                                }
                              }}
                            >
                              批准
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (confirm("确定要拒绝这个保修申请吗？")) {
                                  updateStatusMutation.mutate({ id: warranty.id, status: "rejected" });
                                }
                              }}
                            >
                              拒绝
                            </Button>
                          </>
                        )}
                        {warranty.status === "approved" && (
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-green-600"
                            onClick={() => {
                              if (confirm("确定要标记为已完成吗？")) {
                                updateStatusMutation.mutate({ id: warranty.id, status: "completed" });
                              }
                            }}
                          >
                            完成
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
              暂无保修记录
            </div>
          )}
        </CardContent>
      </Card>

      {/* 创建保修单对话框 - 集成销售历史功能 */}
      <WarrantyFormWithSalesHistory
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={refetch}
      />
      {/* Old Dialog - Commented out
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>创建保修单</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="warrantyNumber">保修单号</Label>
                <Input id="warrantyNumber" {...register("warrantyNumber")} required />
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
              <Label htmlFor="claimReason">索赔原因</Label>
              <Textarea id="claimReason" {...register("claimReason")} rows={2} placeholder="请描述保修原因和问题..." />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>保修替换配件</Label>
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
                {createMutation.isPending ? "创建中..." : "创建保修单"}
              </Button>
            </div>
          </form>
        </DialogContent>
       </Dialog>
      End of Old Dialog */}

      {/* 保修单详情对话框 */}
      {detailWarrantyId && (
        <WarrantyDetail
          warrantyId={detailWarrantyId}
          onClose={() => setDetailWarrantyId(null)}
        />
      )}
    </div>
  );
}

// 保修单详情组件
function WarrantyDetail({ warrantyId, onClose }: { warrantyId: number; onClose: () => void }) {
  const { data: warranty, isLoading } = trpc.warranties.getById.useQuery(warrantyId);

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>保修单详情</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">加载中...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!warranty) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>保修单详情 - {warranty.warrantyNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">客户</Label>
              <div className="font-medium">{warranty.customerName}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">客户编号</Label>
              <div className="font-medium">{warranty.customerNumber || "-"}</div>
            </div>
            <div className="col-span-2">
              <Label className="text-muted-foreground">原始销售单号</Label>
              {warranty.originalInvoiceNumber ? (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-green-50 border-green-500 text-green-700 font-mono text-base px-3 py-1">
                    {warranty.originalInvoiceNumber}
                  </Badge>
                  <span className="text-xs text-muted-foreground">关联的销售记录</span>
                </div>
              ) : (
                <div className="text-muted-foreground">未关联销售单</div>
              )}
            </div>
            <div>
              <Label className="text-muted-foreground">保修日期</Label>
              <div className="font-medium">
                {new Date(warranty.warrantyDate).toLocaleDateString("zh-CN")}
                {warranty.warrantyTime && ` ${warranty.warrantyTime}`}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">状态</Label>
              <div>
                {warranty.status === "completed" && <Badge className="bg-green-600">已完成</Badge>}
                {warranty.status === "approved" && <Badge className="bg-blue-600">已批准</Badge>}
                {warranty.status === "pending" && <Badge variant="outline">待处理</Badge>}
                {warranty.status === "rejected" && <Badge variant="destructive">已拒绝</Badge>}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">操作人</Label>
              <div className="font-medium">{warranty.createdByName}</div>
            </div>
          </div>

          {warranty.claimReason && (
            <div>
              <Label className="text-muted-foreground">索赔原因</Label>
              <div className="mt-1 p-3 bg-muted rounded-md">{warranty.claimReason}</div>
            </div>
          )}

          <div>
            <Label className="text-lg font-semibold mb-2 block">保修替换配件明细</Label>
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
                {warranty.items.map((item) => (
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
              总金额: <span className="ml-2 font-mono">${parseFloat(warranty.totalAmount).toFixed(2)}</span>
            </div>
          </div>

          {warranty.notes && (
            <div>
              <Label className="text-muted-foreground">备注</Label>
              <div className="mt-1 p-3 bg-muted rounded-md">{warranty.notes}</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
