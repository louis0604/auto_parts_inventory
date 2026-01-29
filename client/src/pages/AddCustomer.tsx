import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Users } from "lucide-react";
import { useForm } from "react-hook-form";

type CustomerFormData = {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
};

export default function AddCustomer() {
  const [, setLocation] = useLocation();

  const createMutation = trpc.customers.create.useMutation({
    onSuccess: () => {
      toast.success("客户添加成功");
      setLocation("/customers");
    },
    onError: (error) => {
      toast.error(`添加失败: ${error.message}`);
    },
  });

  const { register, handleSubmit } = useForm<CustomerFormData>({
    defaultValues: {
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => setLocation("/customers")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回客户列表
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            添加客户
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">客户名称 *</Label>
              <Input
                id="name"
                placeholder="例如: 张三、李四汽修店"
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
                placeholder="例如: customer@example.com"
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
                onClick={() => setLocation("/customers")}
                size="lg"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                size="lg"
              >
                {createMutation.isPending ? "添加中..." : "添加"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
