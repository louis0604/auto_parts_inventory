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
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

export default function Customers() {
  const [, setLocation] = useLocation();
  const [forceDeleteDialogOpen, setForceDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<any>(null);

  const { data: customers, isLoading, refetch } = trpc.customers.list.useQuery();

  const deleteMutation = trpc.customers.delete.useMutation({
    onSuccess: () => {
      toast.success("客户删除成功");
      refetch();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
      // 如果删除失败，打开强制删除对话框
      if (customerToDelete) {
        setForceDeleteDialogOpen(true);
      }
    },
  });

  const forceDeleteMutation = trpc.customers.forceDelete.useMutation({
    onSuccess: () => {
      toast.success("客户已强制删除");
      setForceDeleteDialogOpen(false);
      setCustomerToDelete(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`强制删除失败: ${error.message}`);
    },
  });

  const handleDelete = (customer: any) => {
    setCustomerToDelete(customer);
    deleteMutation.mutate(customer.id);
  };

  const handleForceDelete = () => {
    if (customerToDelete) {
      forceDeleteMutation.mutate(customerToDelete.id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">客户管理</h1>
        </div>
        <Link href="/customers/add">
          <Button size="lg">
            <Plus className="h-4 w-4 mr-2" />
            添加客户
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>客户列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : customers && customers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>客户名称</TableHead>
                  <TableHead>联系人</TableHead>
                  <TableHead>联系电话</TableHead>
                  <TableHead>电子邮箱</TableHead>
                  <TableHead>应收账款</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer: any) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.contactPerson || "-"}</TableCell>
                    <TableCell>{customer.phone || "-"}</TableCell>
                    <TableCell>{customer.email || "-"}</TableCell>
                    <TableCell className="font-mono">
                      ¥{parseFloat(customer.accountsReceivable).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/customers/${customer.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(customer)}
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
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无客户数据</p>
              <p className="text-sm mt-2">点击上方按钮添加第一个客户</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 强制删除确认对话框 */}
      <Dialog open={forceDeleteDialogOpen} onOpenChange={setForceDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">强制删除客户</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              该客户已有相关记录，无法直接删除。
            </p>
            {customerToDelete && (
              <div className="p-4 border rounded-lg space-y-2">
                <p><strong>客户名称：</strong>{customerToDelete.name}</p>
                <p><strong>联系人：</strong>{customerToDelete.contactPerson || "-"}</p>
                <p><strong>联系电话：</strong>{customerToDelete.phone || "-"}</p>
              </div>
            )}
            <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-sm font-semibold text-destructive mb-2">强制删除将会：</p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>删除该客户的所有销售发票</li>
                <li>删除该客户的所有退货记录</li>
                <li>删除该客户的所有保修记录</li>
                <li>删除客户本身</li>
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
                setCustomerToDelete(null);
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
