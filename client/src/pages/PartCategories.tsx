import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { Plus, Trash2, ChevronRight, Layers, Tag } from "lucide-react";

// Default categories matching LaserCat reference system
const DEFAULT_CATEGORIES = [
  "00. <All Groups>",
  "01. Ignition & Engine Filters",
  "02. Belts & Cooling",
  "03. Fuel & Emission",
  "04. Electrical",
  "05. Heating & Air Conditioning",
  "06. Brakes & Wheel Bearings",
  "07. Chassis & Steering",
  "08. Exhaust & Clutch",
  "09. Engine",
  "10. Drive Train",
  "11. Vision, Manuals, & Misc.",
];

export default function PartCategories() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null);
  const [deleteGroupId, setDeleteGroupId] = useState<number | null>(null);

  const { data: categories, refetch: refetchCategories } = trpc.partCategories.list.useQuery();
  const { data: groups, refetch: refetchGroups } = trpc.partGroups.listByCategory.useQuery(
    selectedCategoryId ?? 0,
    { enabled: !!selectedCategoryId }
  );

  const selectedCategory = categories?.find(c => c.id === selectedCategoryId);

  // Mutations
  const createCategoryMutation = trpc.partCategories.create.useMutation({
    onSuccess: () => {
      toast.success("分类已添加");
      setNewCategoryName("");
      setShowAddCategory(false);
      refetchCategories();
    },
    onError: (e) => toast.error(`添加失败: ${e.message}`),
  });

  const deleteCategoryMutation = trpc.partCategories.delete.useMutation({
    onSuccess: () => {
      toast.success("分类已删除");
      setDeleteCategoryId(null);
      if (selectedCategoryId === deleteCategoryId) setSelectedCategoryId(null);
      refetchCategories();
    },
    onError: (e) => toast.error(`删除失败: ${e.message}`),
  });

  const createGroupMutation = trpc.partGroups.create.useMutation({
    onSuccess: () => {
      toast.success("分组已添加");
      setNewGroupName("");
      setShowAddGroup(false);
      refetchGroups();
    },
    onError: (e) => toast.error(`添加失败: ${e.message}`),
  });

  const deleteGroupMutation = trpc.partGroups.delete.useMutation({
    onSuccess: () => {
      toast.success("分组已删除");
      setDeleteGroupId(null);
      refetchGroups();
    },
    onError: (e) => toast.error(`删除失败: ${e.message}`),
  });

  const handleSeedDefaults = () => {
    const existingNames = categories?.map(c => c.name) || [];
    const toAdd = DEFAULT_CATEGORIES.filter(name => !existingNames.includes(name));
    if (toAdd.length === 0) {
      toast.info("默认分类已全部存在");
      return;
    }
    // Add them one by one
    Promise.all(toAdd.map(name => createCategoryMutation.mutateAsync({ name }))).then(() => {
      toast.success(`已添加 ${toAdd.length} 个默认分类`);
      refetchCategories();
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Layers className="h-8 w-8" />
            配件分类管理
          </h1>
          <p className="text-muted-foreground mt-1">管理配件的分类（Category）和分组（Group）</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeedDefaults}>
            导入默认分类
          </Button>
          <Button onClick={() => setShowAddCategory(true)}>
            <Plus className="h-4 w-4 mr-2" />
            添加分类
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categories Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              分类列表 (Category)
              <Badge variant="secondary">{categories?.length ?? 0}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categories && categories.length > 0 ? (
              <div className="space-y-1">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedCategoryId === cat.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedCategoryId(cat.id)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-medium truncate">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <ChevronRight className={`h-4 w-4 ${selectedCategoryId === cat.id ? "opacity-100" : "opacity-40"}`} />
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 w-7 p-0 ${selectedCategoryId === cat.id ? "hover:bg-primary-foreground/20 text-primary-foreground" : "hover:bg-destructive/10 text-destructive"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteCategoryId(cat.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Layers className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="mb-3">暂无分类</p>
                <Button variant="outline" size="sm" onClick={handleSeedDefaults}>
                  导入默认分类
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Groups Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                分组列表 (Group)
                {selectedCategory && (
                  <Badge variant="outline">{selectedCategory.name}</Badge>
                )}
              </CardTitle>
              {selectedCategoryId && (
                <Button size="sm" onClick={() => setShowAddGroup(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加分组
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedCategoryId ? (
              <div className="text-center py-12 text-muted-foreground">
                <Tag className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>请先选择左侧分类</p>
              </div>
            ) : groups && groups.length > 0 ? (
              <div className="space-y-1">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted"
                  >
                    <span className="font-medium">{group.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-destructive/10 text-destructive"
                      onClick={() => setDeleteGroupId(group.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Tag className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="mb-3">该分类下暂无分组</p>
                <Button variant="outline" size="sm" onClick={() => setShowAddGroup(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加分组
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加配件分类</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>分类名称</Label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="例如: 01. Ignition & Engine Filters"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddCategory(false)}>取消</Button>
              <Button
                onClick={() => createCategoryMutation.mutate({ name: newCategoryName })}
                disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
              >
                添加
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Group Dialog */}
      <Dialog open={showAddGroup} onOpenChange={setShowAddGroup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加分组 - {selectedCategory?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>分组名称</Label>
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="例如: Engine Filters & PCV"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddGroup(false)}>取消</Button>
              <Button
                onClick={() => createGroupMutation.mutate({ categoryId: selectedCategoryId!, name: newGroupName })}
                disabled={!newGroupName.trim() || createGroupMutation.isPending}
              >
                添加
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirm */}
      <AlertDialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除分类</AlertDialogTitle>
            <AlertDialogDescription>
              删除分类将同时删除其下所有分组，此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteCategoryId && deleteCategoryMutation.mutate(deleteCategoryId)}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Group Confirm */}
      <AlertDialog open={!!deleteGroupId} onOpenChange={() => setDeleteGroupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除分组</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销，确认删除该分组？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteGroupId && deleteGroupMutation.mutate(deleteGroupId)}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
