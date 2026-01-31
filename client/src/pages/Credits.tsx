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
import { Plus, RotateCcw, Trash2, X, Eye } from "lucide-react";
import { toast } from "sonner";
import { useForm, useFieldArray } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { CreditFormWithSalesHistory } from "@/components/CreditFormWithSalesHistory";

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
  const [, params] = useRoute("/credits/:id");
  const [, setLocation] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [detailCreditId, setDetailCreditId] = useState<number | null>(null);

  // 如果有路由参数id，自动打开详情页
  useEffect(() => {
    if (params?.id) {
      const creditId = parseInt(params.id);
      if (!isNaN(creditId)) {
        setDetailCreditId(creditId);
      }
    }
  }, [params?.id]);

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

  const deleteMutation = trpc.credits.delete.useMutation({
    onSuccess: () => {
      toast.success("退货单已删除");
      refetch();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const [deleteCreditId, setDeleteCreditId] = useState<number | null>(null);

  const handleDelete = (id: number) => {
    setDeleteCreditId(id);
  };

  const confirmDelete = () => {
    if (deleteCreditId !== null) {
      deleteMutation.mutate(deleteCreditId);
      setDeleteCreditId(null);
    }
  };

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
            <Button onClick={() => setLocation("/credits/create")}>
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
                          onClick={() => setLocation(`/credits/${credit.id}`)}
                          className="text-blue-600 hover:underline cursor-pointer"
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(credit.id)}
                          className="hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

      {/* 创建退货单对话框 - 集成销售历史功能 */}
      <CreditFormWithSalesHistory
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={refetch}
      />

      {/* 退货单详情对话框 */}
      {detailCreditId && (
        <CreditDetail
          creditId={detailCreditId}
          onClose={() => setDetailCreditId(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteCreditId !== null} onOpenChange={() => setDeleteCreditId(null)}>
        <DialogContent className="bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>确定要删除这个退货单吗？此操作无法撤销。</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteCreditId(null)}>
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
            <div className="col-span-2">
              <Label className="text-muted-foreground">原始销售单号</Label>
              {credit.originalInvoiceNumber ? (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-green-50 border-green-500 text-green-700 font-mono text-base px-3 py-1">
                    {credit.originalInvoiceNumber}
                  </Badge>
                  <span className="text-xs text-muted-foreground">关联的销售记录</span>
                </div>
              ) : (
                <div className="text-muted-foreground">未关联销售单</div>
              )}
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
