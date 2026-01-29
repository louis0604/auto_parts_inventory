import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
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
import { Plus, Edit, Trash2, TruckIcon } from "lucide-react";
import { toast } from "sonner";

export default function Suppliers() {
  const [, setLocation] = useLocation();
  const [forceDeleteDialogOpen, setForceDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<any>(null);

  const { data: suppliers, isLoading, refetch } = trpc.suppliers.list.useQuery();

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

  const handleDelete = (supplier: any) => {
    setSupplierToDelete(supplier);
    deleteMutation.mutate(supplier.id);
  };

  const handleForceDelete = () => {
    if (supplierToDelete) {
      forceDeleteMutation.mutate(supplierToDelete.id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TruckIcon className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">供应商管理</h1>
        </div>
        <Link href="/suppliers/add">
          <Button size="lg">
            <Plus className="h-4 w-4 mr-2" />
            添加供应商
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>供应商列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : suppliers && suppliers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>供应商名称</TableHead>
                  <TableHead>联系人</TableHead>
                  <TableHead>联系电话</TableHead>
                  <TableHead>电子邮箱</TableHead>
                  <TableHead>应付账款</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier: any) => (
                  <TableRow key={supplier.id}>
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
                          onClick={() => setLocation(`/suppliers/${supplier.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(supplier)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <TruckIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无供应商数据</p>
              <p className="text-sm mt-2">点击上方按钮添加第一个供应商</p>
            </div>
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
          </div>
          <div className="flex justify-end gap-2">
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
              onClick={handleForceDelete}
              disabled={forceDeleteMutation.isPending}
            >
              {forceDeleteMutation.isPending ? "删除中..." : "确认强制删除"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
