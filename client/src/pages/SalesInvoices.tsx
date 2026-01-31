import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
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
import { Plus, FileText, Trash2, X, Printer } from "lucide-react";
import { toast } from "sonner";
import { useForm, useFieldArray } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { SalesInvoiceDetail } from "@/components/SalesInvoiceDetail";

type InvoiceFormData = {
  invoiceNumber: string;
  customerId: number;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  notes?: string;
  items: {
    partId: number;
    quantity: number;
    unitPrice: string;
  }[];
};

export default function SalesInvoices() {
  const [, params] = useRoute("/sales-invoices/:id");
  const [, setLocation] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<number | null>(null);
  const [detailInvoiceId, setDetailInvoiceId] = useState<number | null>(null);

  // 如果有路由参数id，自动打开详情页
  useEffect(() => {
    if (params?.id) {
      const invoiceId = parseInt(params.id);
      if (!isNaN(invoiceId)) {
        setDetailInvoiceId(invoiceId);
      }
    }
  }, [params?.id]);

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

  const deleteMutation = trpc.salesInvoices.delete.useMutation({
    onSuccess: () => {
      toast.success("发票已删除");
      refetch();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const [deleteInvoiceId, setDeleteInvoiceId] = useState<number | null>(null);

  const handleDelete = (id: number) => {
    setDeleteInvoiceId(id);
  };

  const confirmDelete = () => {
    if (deleteInvoiceId !== null) {
      deleteMutation.mutate(deleteInvoiceId);
      setDeleteInvoiceId(null);
    }
  };

  const updateStatusMutation = trpc.salesInvoices.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("状态已更新");
      refetch();
    },
    onError: (error) => {
      toast.error(`状态更新失败: ${error.message}`);
    },
  });

  const { register, handleSubmit, reset, control, watch, setValue } = useForm<InvoiceFormData>({
    defaultValues: {
      invoiceNumber: `INV-${Date.now()}`,
      customerId: 0,
      vehicleYear: "",
      vehicleMake: "",
      vehicleModel: "",
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
    
    // 将车辆信息添加到notes中
    let notes = data.notes || "";
    if (data.vehicleYear || data.vehicleMake || data.vehicleModel) {
      const vehicleInfo = `车辆: ${data.vehicleYear || ""} ${data.vehicleMake || ""} ${data.vehicleModel || ""}`.trim();
      notes = vehicleInfo + (notes ? `\n${notes}` : "");
    }
    
    createMutation.mutate({
      ...data,
      notes,
    });
  };

  const handlePrint = (invoiceId: number) => {
    setViewingInvoice(invoiceId);
    // 延迟打印以确保对话框已渲染
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // 从notes中提取车辆信息
  const extractVehicleInfo = (notes?: string) => {
    if (!notes) return null;
    const match = notes.match(/车辆:\s*(.+)/);
    return match ? match[1].split('\n')[0] : null;
  };

  const selectedCustomerId = watch("customerId");
  const selectedCustomer = customers?.find(c => c.id === selectedCustomerId);

  const watchedItems = watch("items");

  // 计算总金额
  const calculateTotal = () => {
    return watchedItems.reduce((sum, item) => {
      const part = parts?.find(p => p.id === item.partId);
      const price = parseFloat(item.unitPrice || part?.unitPrice || "0");
      return sum + (price * item.quantity);
    }, 0);
  };

  // 查看发票详情
  const viewInvoiceDetails = invoices?.find(inv => inv.id === viewingInvoice);
  const viewCustomer = customers?.find(c => c.id === viewInvoiceDetails?.customerId);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">销售发票</h1>
          <p className="text-muted-foreground">管理销售发票和出库记录</p>
        </div>
        <Button onClick={() => setLocation("/sales-invoices/create")}>
          <Plus className="h-4 w-4 mr-2" />
          创建发票
        </Button>
      </div>

      {/* 发票列表 */}
      <Card>
        <CardHeader>
          <CardTitle>发票列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : invoices && invoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>发票编号</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>总金额</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const customer = customers?.find(c => c.id === invoice.customerId);
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono">
                        <button
                          onClick={() => setLocation(`/sales-invoices/${invoice.id}`)}
                          className="text-blue-600 hover:underline cursor-pointer"
                        >
                          {invoice.invoiceNumber}
                        </button>
                      </TableCell>
                      <TableCell>{customer?.name || "-"}</TableCell>
                       <TableCell className="font-semibold">${parseFloat(invoice.totalAmount).toFixed(2)}</TableCell>
                      <TableCell>
                        <Select
                          value={invoice.status}
                          onValueChange={(value) => {
                            updateStatusMutation.mutate({
                              id: invoice.id,
                              status: value as "pending" | "completed" | "cancelled",
                            });
                          }}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue>
                              <Badge 
                                variant={
                                  invoice.status === "completed" ? "default" : 
                                  invoice.status === "pending" ? "secondary" : 
                                  "destructive"
                                }
                              >
                                {invoice.status === "completed" ? "已完成" : 
                                 invoice.status === "pending" ? "待处理" : 
                                 "已取消"}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">待处理</SelectItem>
                            <SelectItem value="completed">已完成</SelectItem>
                            <SelectItem value="cancelled">已取消</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{new Date(invoice.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrint(invoice.id)}
                        >
                          <Printer className="h-4 w-4 mr-1" />
                          打印
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(invoice.id)}
                          className="hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>暂无销售发票</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 创建发票对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>创建销售发票</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>发票编号</Label>
                <Input {...register("invoiceNumber")} required />
              </div>
              <div className="space-y-2">
                <Label>客户</Label>
                <Select
                  value={String(selectedCustomerId)}
                  onValueChange={(value) => setValue("customerId", Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择客户" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map((customer) => (
                      <SelectItem key={customer.id} value={String(customer.id)}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 车辆信息 */}
            <div className="space-y-2">
              <Label>车辆信息（可选）</Label>
              <div className="grid grid-cols-3 gap-4">
                <Input {...register("vehicleYear")} placeholder="年份 (如: 2018)" />
                <Input {...register("vehicleMake")} placeholder="品牌 (如: SUBARU)" />
                <Input {...register("vehicleModel")} placeholder="型号 (如: OUTBACK)" />
              </div>
            </div>

            {/* 配件列表 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>配件列表</Label>
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
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>配件</TableHead>
                      <TableHead className="w-40">数量</TableHead>
                      <TableHead className="w-48">单价</TableHead>
                      <TableHead className="w-44">小计</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => {
                      const selectedPartId = watchedItems[index]?.partId;
                      const selectedPart = parts?.find(p => p.id === selectedPartId);
                      const quantity = watchedItems[index]?.quantity || 0;
                      const unitPrice = watchedItems[index]?.unitPrice || selectedPart?.unitPrice || "0";
                      const subtotal = parseFloat(unitPrice) * quantity;

                      return (
                        <TableRow key={field.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            {selectedPart ? (
                              <div className="space-y-1">
                                <div className="font-mono font-semibold">{selectedPart.sku}</div>
                                <div className="text-sm text-muted-foreground">{selectedPart.name}</div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => setValue(`items.${index}.partId`, 0)}
                                >
                                  更换
                                </Button>
                              </div>
                            ) : (
                              <Select
                                value={String(selectedPartId || "")}
                                onValueChange={(value) => {
                                  const partId = Number(value);
                                  setValue(`items.${index}.partId`, partId);
                                  const part = parts?.find(p => p.id === partId);
                                  if (part) {
                                    setValue(`items.${index}.unitPrice`, part.unitPrice);
                                  }
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="选择配件" />
                                </SelectTrigger>
                                <SelectContent>
                                  {parts?.map((part) => (
                                    <SelectItem key={part.id} value={String(part.id)}>
                                      <div className="flex flex-col">
                                        <span className="font-mono font-semibold">{part.sku}</span>
                                        <span className="text-xs text-muted-foreground">{part.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              className="w-full text-center"
                              {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              className="w-full text-right"
                              {...register(`items.${index}.unitPrice` as const)}
                            />
                          </TableCell>
                          <TableCell className="font-semibold">
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
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end pt-2">
                <div className="text-lg font-bold">
                  总金额: ${calculateTotal().toFixed(2)}
                </div>
              </div>
            </div>

            {/* 备注 */}
            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea {...register("notes")} rows={3} />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "创建中..." : "创建发票"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 打印预览对话框 - 专业发票格式 */}
      {viewingInvoice && viewInvoiceDetails && (
        <Dialog open={!!viewingInvoice} onOpenChange={() => setViewingInvoice(null)}>
          <DialogContent className="max-w-[1000px] max-h-[90vh] overflow-y-auto print:max-w-full print:h-auto bg-card text-card-foreground">
            <DialogHeader className="print:hidden">
              <DialogTitle>销售发票打印预览</DialogTitle>
            </DialogHeader>
            <div className="print:p-8" id="invoice-print">
              {/* 公司信息头部 */}
              <div className="border-b-2 border-black pb-4 mb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-4xl font-bold text-blue-600">CHASE</h1>
                  <p className="text-xl text-blue-800 font-semibold">auto parts</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-bold text-lg">汽车配件库存管理系统</p>
                  <p>地址: 示例地址</p>
                  <p>电话: (000) 000-0000</p>
                  <p>HST/GST: 000000000</p>
                </div>
              </div>

              {/* 客户和发票信息 */}
              <div className="grid grid-cols-2 gap-8 mb-6">
                <div className="bg-gray-100 p-4">
                  <p className="font-bold mb-2">SOLD TO:</p>
                  <p className="font-semibold">{viewCustomer?.name}</p>
                  <p>{viewCustomer?.address || "N/A"}</p>
                  <p>{viewCustomer?.phone || "N/A"}</p>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="font-semibold">发票编号:</span>
                    <span>{viewInvoiceDetails.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">日期:</span>
                    <span>{new Date(viewInvoiceDetails.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">状态:</span>
                    <span>{viewInvoiceDetails.status === "completed" ? "已完成" : "已取消"}</span>
                  </div>
                  {extractVehicleInfo(viewInvoiceDetails.notes || undefined) && (
                    <div className="flex justify-between">
                      <span className="font-semibold">车辆:</span>
                      <span>{extractVehicleInfo(viewInvoiceDetails.notes || undefined) || ""}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 发票标题 */}
              <h2 className="text-3xl font-bold text-right mb-4">
                INVOICE: {viewInvoiceDetails.invoiceNumber}
              </h2>

              {/* 配件明细表格 */}
              <div className="border border-black mb-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-black">
                      <TableHead className="border-r border-black w-8 text-center">#</TableHead>
                      <TableHead className="border-r border-black w-24">SKU</TableHead>
                      <TableHead className="border-r border-black">配件描述</TableHead>
                      <TableHead className="border-r border-black w-20 text-center">订购</TableHead>
                      <TableHead className="border-r border-black w-20 text-center">发货</TableHead>
                      <TableHead className="border-r border-black w-24 text-right">建议价</TableHead>
                      <TableHead className="border-r border-black w-24 text-right">净价</TableHead>
                      <TableHead className="w-28 text-right">金额</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(viewInvoiceDetails as any).items?.map((item: any, index: number) => {
                      const part = parts?.find(p => p.id === item.partId);
                      const supplier = part?.supplierId ? customers?.find(s => s.id === part.supplierId) : null;
                      return (
                        <TableRow key={index} className="border-b border-gray-300">
                          <TableCell className="border-r border-gray-300 text-center">{index + 1}</TableCell>
                          <TableCell className="border-r border-gray-300 font-mono text-sm">
                            {part?.sku || "-"}
                          </TableCell>
                          <TableCell className="border-r border-gray-300">
                            <div>
                              <p className="font-semibold">{part?.name || "-"}</p>
                              {part?.description && (
                                <p className="text-xs text-gray-600">{part.description || ""}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="border-r border-gray-300 text-center">{item.quantity}</TableCell>
                          <TableCell className="border-r border-gray-300 text-center">{item.quantity}</TableCell>
                          <TableCell className="border-r border-gray-300 text-right">
                            ${parseFloat(item.unitPrice).toFixed(2)}
                          </TableCell>
                          <TableCell className="border-r border-gray-300 text-right">
                            ${parseFloat(item.unitPrice).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ${parseFloat(item.subtotal).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* 总计 */}
              <div className="flex justify-end mb-6">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-lg font-bold border-t-2 border-black pt-2">
                    <span>总计:</span>
                    <span>${parseFloat(viewInvoiceDetails.totalAmount).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* 备注 */}
              {viewInvoiceDetails.notes && (
                <div className="mt-4 text-sm">
                  <p className="font-semibold">备注:</p>
                  <p className="text-gray-700">{viewInvoiceDetails.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 print:hidden">
              <Button variant="outline" onClick={() => setViewingInvoice(null)}>
                关闭
              </Button>
              <Button onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                打印
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-print, #invoice-print * {
            visibility: visible;
          }
          #invoice-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      {/* Invoice Detail Dialog */}
      <SalesInvoiceDetail
        invoiceId={detailInvoiceId}
        open={detailInvoiceId !== null}
        onClose={() => setDetailInvoiceId(null)}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteInvoiceId !== null} onOpenChange={() => setDeleteInvoiceId(null)}>
        <DialogContent className="bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>确定要删除这个销售发票吗？此操作无法撤销。</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteInvoiceId(null)}>
                取消
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
                删除
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
