import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, TruckIcon, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

type SupplierFormData = {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
};

export default function EditSupplier() {
  const [, params] = useRoute("/suppliers/:id/edit");
  const [, setLocation] = useLocation();
  const supplierId = params?.id ? parseInt(params.id) : null;

  const { data: suppliers, isLoading } = trpc.suppliers.list.useQuery();
  const supplier = suppliers?.find((s: any) => s.id === supplierId);

  const updateMutation = trpc.suppliers.update.useMutation({
    onSuccess: () => {
      toast.success("供应商更新成功");
      setLocation("/suppliers");
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  const { register, handleSubmit, setValue } = useForm<SupplierFormData>({
    defaultValues: {
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  useEffect(() => {
    if (supplier) {
      setValue("name", supplier.name);
      setValue("contactPerson", supplier.contactPerson || "");
      setValue("phone", supplier.phone || "");
      setValue("email", supplier.email || "");
      setValue("address", supplier.address || "");
    }
  }, [supplier, setValue]);

  const onSubmit = (formData: SupplierFormData) => {
    if (!supplierId) return;
    updateMutation.mutate({
      id: supplierId,
      data: formData,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">供应商不存在</p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => setLocation("/suppliers")}>
                返回列表
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => setLocation("/suppliers")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回供应商列表
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TruckIcon className="h-6 w-6" />
            编辑供应商
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">供应商名称 *</Label>
              <Input
                id="name"
                placeholder="例如: ABC汽配公司"
                {...register("name", { required: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPerson">联系人</Label>
              <Input
                id="contactPerson"
                placeholder="例如: 张三"
                {...register("contactPerson")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">电话</Label>
              <Input
                id="phone"
                placeholder="例如: 138-0000-0000"
                {...register("phone")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="例如: contact@example.com"
                {...register("email")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">地址</Label>
              <Textarea
                id="address"
                placeholder="例如: 广东省深圳市南山区..."
                rows={3}
                {...register("address")}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/suppliers")}
                size="lg"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                size="lg"
              >
                {updateMutation.isPending ? "更新中..." : "保存修改"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
