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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

type PartFormData = {
  sku: string;
  name: string;
  categoryId?: number;
  supplierId?: number;
  description?: string;
  unitPrice: string;
  stockQuantity: number;
  minStockThreshold: number;
  unit: string;
};

export default function Parts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<number | null>(null);

  const { data: parts, isLoading, refetch } = trpc.parts.list.useQuery();
  const { data: categories } = trpc.partCategories.list.useQuery();
  const { data: suppliers } = trpc.suppliers.list.useQuery();
  
  const createMutation = trpc.parts.create.useMutation({
    onSuccess: () => {
      toast.success("配件添加成功");
      setIsAddDialogOpen(false);
      refetch();
      reset();
    },
    onError: (error) => {
      toast.error(`添加失败: ${error.message}`);
    },
  });

  const updateMutation = trpc.parts.update.useMutation({
    onSuccess: () => {
      toast.success("配件更新成功");
      setEditingPart(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  const deleteMutation = trpc.parts.delete.useMutation({
    onSuccess: () => {
      toast.success("配件删除成功");
      refetch();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const { register, handleSubmit, reset, setValue, watch } = useForm<PartFormData>({
    defaultValues: {
      sku: "",
      name: "",
      description: "",
      unitPrice: "0",
      stockQuantity: 0,
      minStockThreshold: 10,
      unit: "件",
    },
  });

  const onSubmit = (data: PartFormData) => {
    if (editingPart) {
      updateMutation.mutate({
        id: editingPart,
        data: {
          sku: data.sku,
          name: data.name,
          categoryId: data.categoryId,
          supplierId: data.supplierId,
          description: data.description,
          unitPrice: data.unitPrice,
          minStockThreshold: data.minStockThreshold,
          unit: data.unit,
        },
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (part: any) => {
    setEditingPart(part.id);
    setValue("sku", part.sku);
    setValue("name", part.name);
    setValue("categoryId", part.categoryId);
    setValue("supplierId", part.supplierId);
    setValue("description", part.description || "");
    setValue("unitPrice", part.unitPrice);
    setValue("stockQuantity", part.stockQuantity);
    setValue("minStockThreshold", part.minStockThreshold);
    setValue("unit", part.unit);
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("确定要删除这个配件吗？")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredParts = parts?.filter(
    (part) =>
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <Card className="neon-border-cyan">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 neon-text-cyan">
              <Package className="h-6 w-6" />
              配件管理
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingPart(null);
                    reset();
                  }}
                  className="neon-border-pink"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  添加配件
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="neon-text-cyan">
                    {editingPart ? "编辑配件" : "添加新配件"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU *</Label>
                      <Input
                        id="sku"
                        {...register("sku", { required: true })}
                        className="neon-border-cyan"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">配件名称 *</Label>
                      <Input
                        id="name"
                        {...register("name", { required: true })}
                        className="neon-border-cyan"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="categoryId">分类</Label>
                      <Select
                        value={watch("categoryId")?.toString() || ""}
                        onValueChange={(value) => setValue("categoryId", value ? parseInt(value) : undefined)}
                      >
                        <SelectTrigger className="neon-border-cyan">
                          <SelectValue placeholder="选择分类" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">无分类</SelectItem>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supplierId">供应商</Label>
                      <Select
                        value={watch("supplierId")?.toString() || ""}
                        onValueChange={(value) => setValue("supplierId", value ? parseInt(value) : undefined)}
                      >
                        <SelectTrigger className="neon-border-cyan">
                          <SelectValue placeholder="选择供应商" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">无供应商</SelectItem>
                          {suppliers?.map((sup) => (
                            <SelectItem key={sup.id} value={sup.id.toString()}>
                              {sup.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">描述</Label>
                    <Input
                      id="description"
                      {...register("description")}
                      className="neon-border-cyan"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="unitPrice">单价 (¥) *</Label>
                      <Input
                        id="unitPrice"
                        type="number"
                        step="0.01"
                        {...register("unitPrice", { required: true })}
                        className="neon-border-cyan"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stockQuantity">初始库存</Label>
                      <Input
                        id="stockQuantity"
                        type="number"
                        {...register("stockQuantity", { valueAsNumber: true })}
                        className="neon-border-cyan"
                        disabled={!!editingPart}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minStockThreshold">最低库存</Label>
                      <Input
                        id="minStockThreshold"
                        type="number"
                        {...register("minStockThreshold", { valueAsNumber: true })}
                        className="neon-border-cyan"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">单位</Label>
                    <Input
                      id="unit"
                      {...register("unit")}
                      className="neon-border-cyan"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        setEditingPart(null);
                        reset();
                      }}
                    >
                      取消
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {editingPart ? "更新" : "添加"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索配件名称或SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 neon-border-cyan"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : filteredParts && filteredParts.length > 0 ? (
            <div className="border rounded-lg neon-border-cyan overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-card/50">
                    <TableHead className="text-accent">SKU</TableHead>
                    <TableHead className="text-accent">名称</TableHead>
                    <TableHead className="text-accent">单价</TableHead>
                    <TableHead className="text-accent">库存</TableHead>
                    <TableHead className="text-accent">最低库存</TableHead>
                    <TableHead className="text-accent">状态</TableHead>
                    <TableHead className="text-accent text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParts.map((part) => {
                    const isLowStock = part.stockQuantity < part.minStockThreshold;
                    return (
                      <TableRow key={part.id} className="hover:bg-card/30">
                        <TableCell className="font-mono text-sm">{part.sku}</TableCell>
                        <TableCell className="font-medium">{part.name}</TableCell>
                        <TableCell>¥{parseFloat(part.unitPrice).toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={isLowStock ? "text-destructive font-bold neon-text" : ""}>
                            {part.stockQuantity} {part.unit}
                          </span>
                        </TableCell>
                        <TableCell>
                          {part.minStockThreshold} {part.unit}
                        </TableCell>
                        <TableCell>
                          {isLowStock ? (
                            <span className="text-destructive text-sm neon-text-pink">库存不足</span>
                          ) : (
                            <span className="text-accent text-sm">正常</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(part)}
                              className="hover:text-primary"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(part.id)}
                              className="hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "未找到匹配的配件" : "暂无配件数据"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
