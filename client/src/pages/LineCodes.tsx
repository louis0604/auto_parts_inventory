import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
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

export default function LineCodes() {
  const [, setLocation] = useLocation();
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const { data: lineCodes = [] } = trpc.lineCodes.list.useQuery();
  const utils = trpc.useUtils();

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
        <Link href="/line-codes/add">
          <Button size="lg">
            <Plus className="w-4 h-4 mr-2" />
            添加 Line Code
          </Button>
        </Link>
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
                          onClick={() => setLocation(`/line-codes/${lineCode.id}/edit`)}
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
