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
  DialogTrigger,
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
import { Plus, FileText, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useForm, useFieldArray } from "react-hook-form";
import { Badge } from "@/components/ui/badge";

type InvoiceFormData = {
  invoiceNumber: string;
  customerId: number;
  notes?: string;
  items: {
    partId: number;
    quantity: number;
    unitPrice: string;
  }[];
};

export default function SalesInvoices() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: invoices, isLoading, refetch } = trpc.salesInvoices.list.useQuery();
  const { data: customers } = trpc.customers.list.useQuery();
  const { data: parts } = trpc.parts.list.useQuery();
  
  const createMutation = trpc.salesInvoices.create.useMutation({
    onSuccess: () => {
      toast.success("销售发票创建成功");
      setIsAddDialogOpen(false);
      refetch();
      reset();
    },
    onError: (error) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });

  const cancelMutation = trpc.salesInvoices.cancel.useMutation({
    onSuccess: () => {
      toast.success("发票已取消");
      refetch();
    },
    onError: (error) => {
      toast.error(`取消失败: ${error.message}`);
    },
  });

  const { register, handleSubmit, reset, control, watch, setValue } = useForm<InvoiceFormData>({
    defaultValues: {
      invoiceNumber: `INV-${Date.now()}`,
      customerId: 0,
      notes: "",
      items: [{ partId: 0, quantity: 1, unitPrice: "0" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const onSubmit = (data: InvoiceFormData) => {
    if (!data.customerId) {
      toast.error("请选择客户");
      return;
    }
    if (data.items.length === 0 || data.items.some(item => !item.partId)) {
      toast.error("请至少添加一个配件");
      return;
    }
    createMutation.mutate(data);
  };

  const handleCancel = (id: number) => {
    if (confirm("确定要取消这个发票吗？")) {
      cancelMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="neon-border-cyan">待处理</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-accent">已完成</Badge>;
      case "cancelled":
        return <Badge variant="destructive">已取消</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card className="neon-border-cyan">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 neon-text-cyan">
              <FileText className="h-6 w-6" />
              销售发票管理
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    reset({
                      invoiceNumber: `INV-${Date.now()}`,
                      customerId: 0,
                      notes: "",
                      items: [{ partId: 0, quantity: 1, unitPrice: "0" }],
                    });
                  }}
                  className="neon-border-pink"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  创建销售发票
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="neon-text-cyan">创建销售发票</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="invoiceNumber">发票号 *</Label>
                      <Input
                        id="invoiceNumber"
                        {...register("invoiceNumber", { required: true })}
                        className="neon-border-cyan"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerId">客户 *</Label>
                      <Select
                        value={watch("customerId")?.toString() || ""}
                        onValueChange={(value) => setValue("customerId", parseInt(value))}
                      >
                        <SelectTrigger className="neon-border-cyan">
                          <SelectValue placeholder="选择客户" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers?.map((cust) => (
                            <SelectItem key={cust.id} value={cust.id.toString()}>
                              {cust.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">备注</Label>
                    <Textarea
                      id="notes"
                      {...register("notes")}
                      className="neon-border-cyan"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>销售明细</Label>
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

                    <div className="space-y-2">
                      {fields.map((field, index) => {
                        const selectedPart = parts?.find(p => p.id === watch(`items.${index}.partId`));
                        return (
                          <div key={field.id} className="space-y-2">
                            <div className="flex gap-2 items-end">
                              <div className="flex-1 space-y-1">
                                <Label className="text-xs">配件</Label>
                                <Select
                                  value={watch(`items.${index}.partId`)?.toString() || ""}
                                  onValueChange={(value) => {
                                    const partId = parseInt(value);
                                    setValue(`items.${index}.partId`, partId);
                                    const part = parts?.find(p => p.id === partId);
                                    if (part) {
                                      setValue(`items.${index}.unitPrice`, part.unitPrice);
                                    }
                                  }}
                                >
                                  <SelectTrigger className="neon-border-cyan">
                                    <SelectValue placeholder="选择配件" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {parts?.map((part) => (
                                      <SelectItem key={part.id} value={part.id.toString()}>
                                        {part.name} ({part.sku}) - 库存: {part.stockQuantity}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="w-24 space-y-1">
                                <Label className="text-xs">数量</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                                  className="neon-border-cyan"
                                />
                              </div>
                              <div className="w-32 space-y-1">
                                <Label className="text-xs">单价 (¥)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...register(`items.${index}.unitPrice`)}
                                  className="neon-border-cyan"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                disabled={fields.length === 1}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                            {selectedPart && watch(`items.${index}.quantity`) > selectedPart.stockQuantity && (
                              <p className="text-xs text-destructive neon-text">
                                ⚠️ 库存不足！当前库存: {selectedPart.stockQuantity} {selectedPart.unit}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        reset();
                      }}
                    >
                      取消
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      创建发票
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : invoices && invoices.length > 0 ? (
            <div className="border rounded-lg neon-border-cyan overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-card/50">
                    <TableHead className="text-accent">发票号</TableHead>
                    <TableHead className="text-accent">客户</TableHead>
                    <TableHead className="text-accent">发票日期</TableHead>
                    <TableHead className="text-accent">总金额</TableHead>
                    <TableHead className="text-accent">状态</TableHead>
                    <TableHead className="text-accent text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const customer = customers?.find(c => c.id === invoice.customerId);
                    return (
                      <TableRow key={invoice.id} className="hover:bg-card/30">
                        <TableCell className="font-mono text-sm">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{customer?.name || "-"}</TableCell>
                        <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                        <TableCell className="font-mono">¥{parseFloat(invoice.totalAmount).toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {invoice.status === "pending" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancel(invoice.id)}
                                className="hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">暂无销售发票数据</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
