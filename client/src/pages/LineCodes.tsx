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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Edit, Trash2, Plus, Tag } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type LineCodeFormData = {
  code: string;
  description?: string;
};

export default function LineCodes() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingLineCode, setEditingLineCode] = useState<{ id: number; code: string; description?: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [formData, setFormData] = useState<LineCodeFormData>({
    code: "",
    description: "",
  });

  const { data: lineCodes = [], refetch } = trpc.lineCodes.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.lineCodes.create.useMutation({
    onSuccess: () => {
      toast.success("Line Code 添加成功");
      setIsAddDialogOpen(false);
      utils.lineCodes.list.invalidate();
      resetForm();
    },
    onError: (error) => {
      toast.error(`添加失败: ${error.message}`);
    },
  });

  const updateMutation = trpc.lineCodes.update.useMutation({
    onSuccess: () => {
      toast.success("Line Code 更新成功");
      setEditingLineCode(null);
      utils.lineCodes.list.invalidate();
      resetForm();
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  const deleteMutation = trpc.lineCodes.delete.useMutation({
    onSuccess: () => {
      toast.success("Line Code 删除成功");
      setDeleteConfirmId(null);
      utils.lineCodes.list.invalidate();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({ code: "", description: "" });
  };

  const handleAdd = () => {
    if (!formData.code.trim()) {
      toast.error("请输入 Line Code");
      return;
    }
    createMutation.mutate({
      code: formData.code.trim(),
      description: formData.description?.trim() || undefined,
    });
  };

  const handleEdit = (lineCode: { id: number; code: string; description?: string }) => {
    setEditingLineCode(lineCode);
    setFormData({
      code: lineCode.code,
      description: lineCode.description || "",
    });
  };

  const handleUpdate = () => {
    if (!editingLineCode) return;
    if (!formData.code.trim()) {
      toast.error("请输入 Line Code");
      return;
    }
    updateMutation.mutate({
      id: editingLineCode.id,
      code: formData.code.trim(),
      description: formData.description?.trim() || undefined,
    });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Tag className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Line Code 管理</h1>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          添加 Line Code
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line Code 列表</CardTitle>
        </CardHeader>
        <CardContent>
          {lineCodes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无 Line Code</p>
              <p className="text-sm mt-2">点击上方按钮添加第一个 Line Code</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Code</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead className="w-32 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineCodes.map((lineCode: any) => (
                  <TableRow key={lineCode.id}>
                    <TableCell className="font-mono font-semibold">{lineCode.code}</TableCell>
                    <TableCell>{lineCode.description || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(lineCode)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmId(lineCode.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加 Line Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                placeholder="例如: DEL, SUBARU, HONDA"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                placeholder="例如: Delphi, Subaru Parts, Honda Parts"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                resetForm();
              }}
            >
              取消
            </Button>
            <Button onClick={handleAdd} disabled={createMutation.isPending}>
              {createMutation.isPending ? "添加中..." : "添加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingLineCode} onOpenChange={(open) => !open && setEditingLineCode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑 Line Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-code">Code *</Label>
              <Input
                id="edit-code"
                placeholder="例如: DEL, SUBARU, HONDA"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">描述</Label>
              <Input
                id="edit-description"
                placeholder="例如: Delphi, Subaru Parts, Honda Parts"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingLineCode(null);
                resetForm();
              }}
            >
              取消
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "更新中..." : "更新"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个 Line Code 吗？此操作无法撤销。
              <br />
              <strong className="text-destructive">注意：如果有配件正在使用此 Line Code，删除操作将失败。</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
