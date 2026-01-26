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
import { Plus, Edit, Trash2, TruckIcon } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

type SupplierFormData = {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
};

export default function Suppliers() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<number | null>(null);
  const [forceDeleteDialogOpen, setForceDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<any>(null);

  const { data: suppliers, isLoading, refetch } = trpc.suppliers.list.useQuery();
  
  const createMutation = trpc.suppliers.create.useMutation({
    onSuccess: () => {
      toast.success("供应商添加成功");
      setIsAddDialogOpen(false);
      refetch();
      reset();
    },
    onError: (error) => {
      toast.error(`添加失败: ${error.message}`);
    },
  });

  const updateMutation = trpc.suppliers.update.useMutation({
    onSuccess: () => {
      toast.success("供应商更新成功");
      setEditingSupplier(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  const deleteMutation = trpc.suppliers.delete.useMutation({
    onSuccess: () => {
      toast.success("供应商删除成功");
      refetch();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
      // 如果删除失败，打开强制删除对话框
      if (supplierToDelete) {
        setForceDeleteDialogOpen(true);
      }
    },
  });

  const forceDeleteMutation = trpc.suppliers.forceDelete.useMutation({
    onSuccess: () => {
      toast.success("供应商已强制删除");
      setForceDeleteDialogOpen(false);
      setSupplierToDelete(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`强制删除失败: ${error.message}`);
    },
  });

  const { register, handleSubmit, reset, setValue } = useForm<SupplierFormData>({
    defaultValues: {
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  const onSubmit = (data: SupplierFormData) => {
    if (editingSupplier) {
      updateMutation.mutate({
        id: editingSupplier,
        data,
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier.id);
    setValue("name", supplier.name);
    setValue("contactPerson", supplier.contactPerson || "");
    setValue("phone", supplier.phone || "");
    setValue("email", supplier.email || "");
    setValue("address", supplier.address || "");
    setIsAddDialogOpen(true);
  };

  const handleDelete = (supplier: any) => {
    if (confirm("确定要删除这个供应商吗？")) {
      setSupplierToDelete(supplier);
      deleteMutation.mutate(supplier.id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card className="neon-border-cyan">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 neon-text-cyan">
              <TruckIcon className="h-6 w-6" />
              供应商管理
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingSupplier(null);
                    reset();
                  }}
                  className="neon-border-pink"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  添加供应商
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="neon-text-cyan">
                    {editingSupplier ? "编辑供应商" : "添加新供应商"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">供应商名称 *</Label>
                    <Input
                      id="name"
                      {...register("name", { required: true })}
                      className="neon-border-cyan"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactPerson">联系人</Label>
                      <Input
                        id="contactPerson"
                        {...register("contactPerson")}
                        className="neon-border-cyan"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">联系电话</Label>
                      <Input
                        id="phone"
                        {...register("phone")}
                        className="neon-border-cyan"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">电子邮箱</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      className="neon-border-cyan"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">地址</Label>
                    <Textarea
                      id="address"
                      {...register("address")}
                      className="neon-border-cyan"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        setEditingSupplier(null);
                        reset();
                      }}
                    >
                      取消
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {editingSupplier ? "更新" : "添加"}
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
          ) : suppliers && suppliers.length > 0 ? (
            <div className="border rounded-lg neon-border-cyan overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-card/50">
                    <TableHead className="text-accent">供应商名称</TableHead>
                    <TableHead className="text-accent">联系人</TableHead>
                    <TableHead className="text-accent">联系电话</TableHead>
                    <TableHead className="text-accent">电子邮箱</TableHead>
                    <TableHead className="text-accent">应付账款</TableHead>
                    <TableHead className="text-accent text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.id} className="hover:bg-card/30">
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.contactPerson || "-"}</TableCell>
                      <TableCell>{supplier.phone || "-"}</TableCell>
                      <TableCell>{supplier.email || "-"}</TableCell>
                      <TableCell className="font-mono">
                        ¥{parseFloat(supplier.accountsPayable).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(supplier)}
                            className="hover:text-primary"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(supplier)}
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
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">暂无供应商数据</div>
          )}
        </CardContent>
      </Card>

      {/* 强制删除确认对话框 */}
      <Dialog open={forceDeleteDialogOpen} onOpenChange={setForceDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">强制删除供应商</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              该供应商已有相关记录，无法直接删除。
            </p>
            {supplierToDelete && (
              <div className="p-4 border rounded-lg space-y-2">
                <p><strong>供应商名称：</strong>{supplierToDelete.name}</p>
                <p><strong>联系人：</strong>{supplierToDelete.contactPerson || "-"}</p>
                <p><strong>联系电话：</strong>{supplierToDelete.phone || "-"}</p>
              </div>
            )}
            <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-sm font-semibold text-destructive mb-2">强制删除将会：</p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>删除该供应商的所有采购订单</li>
                <li>删除该供应商的所有配件</li>
                <li>删除供应商本身</li>
              </ul>
              <p className="text-sm text-destructive mt-2 font-semibold">
                此操作不可恢复！
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setForceDeleteDialogOpen(false);
                  setSupplierToDelete(null);
                }}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (supplierToDelete) {
                    forceDeleteMutation.mutate(supplierToDelete.id);
                  }
                }}
              >
                确认强制删除
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
