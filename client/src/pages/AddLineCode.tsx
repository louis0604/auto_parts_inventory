import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Tag } from "lucide-react";

export default function AddLineCode() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    code: "",
    description: "",
  });

  const createMutation = trpc.lineCodes.create.useMutation({
    onSuccess: () => {
      toast.success("Line Code 添加成功");
      setLocation("/line-codes");
    },
    onError: (error) => {
      toast.error(`添加失败: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error("请输入 Line Code");
      return;
    }
    createMutation.mutate({
      code: formData.code.trim(),
      description: formData.description?.trim() || undefined,
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => setLocation("/line-codes")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回 Line Code 列表
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-6 w-6" />
            添加 Line Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                placeholder="例如: DEL, SUBARU, HONDA"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
              <p className="text-sm text-muted-foreground">
                产品线代码，通常为2-10个字符的缩写
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                placeholder="例如: Delphi, Subaru Parts, Honda Parts"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                可选，用于说明该Line Code的含义
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/line-codes")}
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
