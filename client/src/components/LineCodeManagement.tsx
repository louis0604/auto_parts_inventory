import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import ERPToolbar from "@/components/ERPToolbar";
import { Edit, Trash2 } from "lucide-react";

type LineCodeFormData = {
  code: string;
  description?: string;
};

export default function LineCodeManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingLineCode, setEditingLineCode] = useState<number | null>(null);

  const { data: lineCodes, isLoading, refetch } = trpc.lineCodes.list.useQuery();

  const { register, handleSubmit, reset, setValue } = useForm<LineCodeFormData>({
    defaultValues: {
      code: "",
      description: "",
    },
  });

  const createMutation = trpc.lineCodes.create.useMutation({
    onSuccess: () => {
      toast.success("Line Code添加成功");
      setIsAddDialogOpen(false);
      refetch();
      reset();
    },
    onError: (error) => {
      toast.error(`添加失败: ${error.message}`);
    },
  });

  const updateMutation = trpc.lineCodes.update.useMutation({
    onSuccess: () => {
      toast.success("Line Code更新成功");
      setIsAddDialogOpen(false);
      setEditingLineCode(null);
      refetch();
      reset();
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  const deleteMutation = trpc.lineCodes.delete.useMutation({
    onSuccess: () => {
      toast.success("Line Code删除成功");
      refetch();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const onSubmit = (data: LineCodeFormData) => {
    if (editingLineCode) {
      updateMutation.mutate({
        id: editingLineCode,
        ...data,
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (lineCode: any) => {
    setEditingLineCode(lineCode.id);
    setValue("code", lineCode.code);
    setValue("description", lineCode.description || "");
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("确定要删除这个Line Code吗？")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAdd = () => {
    setEditingLineCode(null);
    reset();
    setIsAddDialogOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* ERP Toolbar */}
      <ERPToolbar
        onAdd={handleAdd}
        onRefresh={() => refetch()}
        showAdd={true}
        showRefresh={true}
      />

      {/* Main Content Area */}
      <div className="flex-1 bg-gray-50 p-4">
        {/* Table */}
        <div className="bg-white border border-gray-300 rounded">
          <div className="p-4">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : lineCodes && lineCodes.length > 0 ? (
              <div className="overflow-auto">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th className="w-32">Line Code</th>
                      <th>描述</th>
                      <th className="w-32">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineCodes.map((lineCode) => (
                      <tr key={lineCode.id}>
                        <td className="font-mono font-semibold">{lineCode.code}</td>
                        <td className="text-gray-600">{lineCode.description || "-"}</td>
                        <td>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(lineCode)}
                              className="h-7 px-2 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(lineCode.id)}
                              className="h-7 px-2 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                暂无Line Code，点击"添加"按钮创建
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLineCode ? "编辑Line Code" : "添加Line Code"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Line Code <span className="text-red-500">*</span></Label>
              <Input
                id="code"
                {...register("code", { required: true })}
                placeholder="例如: SUBARU"
                className="erp-field-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                {...register("description")}
                placeholder="Line Code描述..."
                className="erp-field-input"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setEditingLineCode(null);
                  reset();
                }}
              >
                取消
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingLineCode ? "更新" : "添加"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
