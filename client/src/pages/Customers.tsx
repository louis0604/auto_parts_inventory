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
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

type CustomerFormData = {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
};

export default function Customers() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<number | null>(null);

  const { data: customers, isLoading, refetch } = trpc.customers.list.useQuery();
  
  const createMutation = trpc.customers.create.useMutation({
    onSuccess: () => {
      toast.success("客户添加成功");
      setIsAddDialogOpen(false);
      refetch();
      reset();
    },
    onError: (error) => {
      toast.error(`添加失败: ${error.message}`);
    },
  });

  const updateMutation = trpc.customers.update.useMutation({
    onSuccess: () => {
      toast.success("客户更新成功");
      setEditingCustomer(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  const deleteMutation = trpc.customers.delete.useMutation({
    onSuccess: () => {
      toast.success("客户删除成功");
      refetch();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const { register, handleSubmit, reset, setValue } = useForm<CustomerFormData>({
    defaultValues: {
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    if (editingCustomer) {
      updateMutation.mutate({
        id: editingCustomer,
        data,
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer.id);
    setValue("name", customer.name);
    setValue("contactPerson", customer.contactPerson || "");
    setValue("phone", customer.phone || "");
    setValue("email", customer.email || "");
    setValue("address", customer.address || "");
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("确定要删除这个客户吗？")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card className="neon-border-cyan">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 neon-text-cyan">
              <Users className="h-6 w-6" />
              客户管理
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingCustomer(null);
                    reset();
                  }}
                  className="neon-border-pink"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  添加客户
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="neon-text-cyan">
                    {editingCustomer ? "编辑客户" : "添加新客户"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">客户名称 *</Label>
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
                        setEditingCustomer(null);
                        reset();
                      }}
                    >
                      取消
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {editingCustomer ? "更新" : "添加"}
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
          ) : customers && customers.length > 0 ? (
            <div className="border rounded-lg neon-border-cyan overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-card/50">
                    <TableHead className="text-accent">客户名称</TableHead>
                    <TableHead className="text-accent">联系人</TableHead>
                    <TableHead className="text-accent">联系电话</TableHead>
                    <TableHead className="text-accent">电子邮箱</TableHead>
                    <TableHead className="text-accent">应收账款</TableHead>
                    <TableHead className="text-accent text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-card/30">
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
                            onClick={() => handleEdit(customer)}
                            className="hover:text-primary"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(customer.id)}
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
            <div className="text-center py-8 text-muted-foreground">暂无客户数据</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
