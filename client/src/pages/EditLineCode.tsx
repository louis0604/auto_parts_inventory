import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Tag, Loader2 } from "lucide-react";

export default function EditLineCode() {
  const [, params] = useRoute("/line-codes/:id/edit");
  const [, setLocation] = useLocation();
  const lineCodeId = params?.id ? parseInt(params.id) : null;

  const [formData, setFormData] = useState({
    code: "",
    description: "",
  });

  const { data: lineCodes, isLoading } = trpc.lineCodes.list.useQuery();
  const lineCode = lineCodes?.find((lc: any) => lc.id === lineCodeId);

  useEffect(() => {
    if (lineCode) {
      setFormData({
        code: lineCode.code,
        description: lineCode.description || "",
      });
    }
  }, [lineCode]);

  const updateMutation = trpc.lineCodes.update.useMutation({
    onSuccess: () => {
      toast.success("Line Code 更新成功");
      setLocation("/line-codes");
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lineCodeId) return;
    if (!formData.code.trim()) {
      toast.error("请输入 Line Code");
      return;
    }
    updateMutation.mutate({
      id: lineCodeId,
      code: formData.code.trim(),
      description: formData.description?.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lineCode) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Line Code 不存在</p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => setLocation("/line-codes")}>
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
        <Button variant="ghost" onClick={() => setLocation("/line-codes")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回 Line Code 列表
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-6 w-6" />
            编辑 Line Code
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
