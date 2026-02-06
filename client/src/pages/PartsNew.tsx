import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

import { ImageUpload } from "@/components/ImageUpload";
import { Edit, Trash2, Upload, Search, Download } from "lucide-react";
import { downloadBase64File } from "@/lib/download";

type PartFormData = {
  // Basic info
  sku: string;
  name: string;
  lineCodeId?: number;
  description?: string;
  
  // Pricing
  replCost?: string;
  avgCost?: string;
  price1?: string;
  price2?: string;
  price3?: string;
  retail?: string;
  listPrice?: string;
  
  // Inventory
  stockQuantity: number;
  orderPoint?: number;
  
  // Image
  imageUrl?: string;
  
  // Legacy fields for compatibility
  unitPrice: string;
  unit: string;
  minStockThreshold: number;
};

export default function PartsNew() {
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLineCodeFilter, setSelectedLineCodeFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<number | null>(null);
  const [selectedPartIds, setSelectedPartIds] = useState<Set<number>>(new Set());
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");

  const { data: parts = [], refetch } = trpc.parts.list.useQuery();
  const { data: archivedParts = [] } = trpc.parts.listArchived.useQuery();
  const { data: lineCodes = [] } = trpc.lineCodes.list.useQuery();
  
  const utils = trpc.useUtils();

  const createMutation = trpc.parts.create.useMutation({
    onSuccess: () => {
      toast.success("配件添加成功");
      setIsAddDialogOpen(false);
      utils.parts.list.invalidate();
      reset();
      setUploadedImageUrl("");
    },
    onError: (error) => {
      toast.error(`添加失败: ${error.message}`);
    },
  });

  const updateMutation = trpc.parts.update.useMutation({
    onSuccess: () => {
      toast.success("配件更新成功");
      setEditingPart(null);
      utils.parts.list.invalidate();
      reset();
      setUploadedImageUrl("");
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  const archiveMutation = trpc.parts.archive.useMutation({
    onSuccess: () => {
      toast.success("配件已归档");
      utils.parts.list.invalidate();
    },
    onError: (error) => {
      toast.error(`归档失败: ${error.message}`);
    },
  });

  const bulkArchiveMutation = trpc.parts.bulkArchive.useMutation({
    onSuccess: (result: { archived: number; failed: number; total: number }) => {
      if (result.failed > 0) {
        toast.warning(`批量归档完成：${result.archived}个成功，${result.failed}个失败`);
      } else {
        toast.success(`批量归档成功：${result.archived}个配件已归档`);
      }
      setSelectedPartIds(new Set());
      setIsBulkDeleteDialogOpen(false);
      utils.parts.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(`批量归档失败: ${error.message}`);
    },
  });

  const restoreMutation = trpc.parts.restore.useMutation({
    onSuccess: () => {
      toast.success("配件已恢复");
      utils.parts.list.invalidate();
      utils.parts.listArchived.invalidate();
    },
    onError: (error) => {
      toast.error(`恢复失败: ${error.message}`);
    },
  });

  const bulkRestoreMutation = trpc.parts.bulkRestore.useMutation({
    onSuccess: (result: { restored: number; failed: number; total: number }) => {
      if (result.failed > 0) {
        toast.warning(`批量恢复完成：${result.restored}个成功，${result.failed}个失败`);
      } else {
        toast.success(`批量恢复成功：${result.restored}个配件已恢复`);
      }
      setSelectedPartIds(new Set());
      utils.parts.list.invalidate();
      utils.parts.listArchived.invalidate();
    },
    onError: (error: any) => {
      toast.error(`批量恢复失败: ${error.message}`);
    },
  });

  const forceDeleteMutation = trpc.parts.forceDelete.useMutation({
    onSuccess: () => {
      toast.success("配件已永久删除");
      utils.parts.listArchived.invalidate();
    },
    onError: (error) => {
      toast.error(`永久删除失败: ${error.message}`);
    },
  });

  const bulkForceDeleteMutation = trpc.parts.bulkForceDelete.useMutation({
    onSuccess: (result: { deleted: number; failed: number; total: number }) => {
      if (result.failed > 0) {
        toast.warning(`批量永久删除完成：${result.deleted}个成功，${result.failed}个失败`);
      } else {
        toast.success(`批量永久删除成功：${result.deleted}个配件已永久删除`);
      }
      setSelectedPartIds(new Set());
      utils.parts.listArchived.invalidate();
    },
    onError: (error: any) => {
      toast.error(`批量永久删除失败: ${error.message}`);
    },
  });

  const { register, handleSubmit, reset, setValue, watch } = useForm<PartFormData>({
    defaultValues: {
      stockQuantity: 0,
      minStockThreshold: 10,
      orderPoint: 0,
      unit: "件",
      unitPrice: "0",
    },
  });

  const onSubmit = (data: PartFormData) => {
    // Clean data: convert empty strings to undefined
    const cleanData = {
      ...data,
      lineCodeId: data.lineCodeId || undefined,
      replCost: data.replCost || undefined,
      avgCost: data.avgCost || undefined,
      price1: data.price1 || undefined,
      price2: data.price2 || undefined,
      price3: data.price3 || undefined,
      retail: data.retail || undefined,
      listPrice: data.listPrice || undefined,
      orderPoint: data.orderPoint || 0,
      imageUrl: uploadedImageUrl || undefined,
    };

    if (editingPart) {
      updateMutation.mutate({ id: editingPart, data: cleanData });
    } else {
      createMutation.mutate(cleanData);
    }
  };

  const handleEdit = (part: any) => {
    setEditingPart(part.id);
    reset({
      sku: part.sku,
      name: part.name,
      lineCodeId: part.lineCodeId || undefined,
      description: part.description || "",
      replCost: part.replCost || "",
      avgCost: part.avgCost || "",
      price1: part.price1 || "",
      price2: part.price2 || "",
      price3: part.price3 || "",
      retail: part.retail || "",
      listPrice: part.listPrice || "",
      stockQuantity: part.stockQuantity,
      orderPoint: part.orderPoint || 0,
      unitPrice: part.unitPrice,
      unit: part.unit,
      minStockThreshold: part.minStockThreshold,
    });
    setUploadedImageUrl(part.imageUrl || "");
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    // If there are selected items, delete all selected items
    if (selectedPartIds.size > 0) {
      setIsBulkDeleteDialogOpen(true);
    } else {
      // Single delete
      if (confirm("确定要删除这个配件吗？")) {
        archiveMutation.mutate(id);
      }
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredParts.map((part) => part.id));
      setSelectedPartIds(allIds);
    } else {
      setSelectedPartIds(new Set());
    }
  };

  const handleSelectPart = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedPartIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedPartIds(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedPartIds.size === 0) {
      toast.error("请至少选择一个配件");
      return;
    }
    setIsBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = () => {
    bulkArchiveMutation.mutate(Array.from(selectedPartIds));
  };

  // Filter parts based on active tab
  const currentParts = activeTab === "active" ? parts : archivedParts;
  const filteredParts = currentParts.filter((part) => {
    const matchesSearch =
      part.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLineCode =
      selectedLineCodeFilter === "all" ||
      (part.lineCodeId && part.lineCodeId.toString() === selectedLineCodeFilter);
    return matchesSearch && matchesLineCode;
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">配件管理</h1>
      </div>
      
      {/* 标签页切换 */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === "active"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("active")}
        >
          活跃配件 ({parts.length})
        </button>
        <button
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === "archived"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("archived")}
        >
          已归档 ({archivedParts.length})
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div />
        <div className="flex gap-2">
          {selectedPartIds.size > 0 && (
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={bulkArchiveMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              删除选中 ({selectedPartIds.size})
            </Button>
          )}
          <Link href="/parts/import">
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              批量导入
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const report = await trpc.reports.inventory.mutate();
                downloadBase64File(report);
                toast.success("库存报表已导出");
              } catch (error: unknown) {
                toast.error("导出失败: " + (error instanceof Error ? error.message : String(error)));
              }
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            导出库存报表
          </Button>
          <Link href="/parts/add">
            <Button>
              添加配件
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="搜索配件编号或名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedLineCodeFilter} onValueChange={setSelectedLineCodeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="筛选产品线" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有产品线</SelectItem>
            {lineCodes.map((lc) => (
              <SelectItem key={lc.id} value={lc.id.toString()}>
                {lc.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Parts Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedPartIds.size === filteredParts.length && filteredParts.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
              </TableHead>
              <TableHead className="w-20">图片</TableHead>
              <TableHead className="w-24">Line</TableHead>
              <TableHead className="w-32">Part Number</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-20 text-right">QOH</TableHead>
              <TableHead className="w-24 text-right">Retail</TableHead>
              <TableHead className="w-24 text-right">List</TableHead>
              <TableHead className="w-24 text-right">Order Point</TableHead>
              <TableHead className="w-24 text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParts.map((part) => {
              const lineCode = lineCodes.find((lc) => lc.id === part.lineCodeId);
              return (
                <TableRow key={part.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedPartIds.has(part.id)}
                      onChange={(e) => handleSelectPart(part.id, e.target.checked)}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </TableCell>
                  <TableCell>
                    {part.imageUrl ? (
                      <img
                        src={part.imageUrl}
                        alt={part.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                        无图片
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{lineCode?.code || "-"}</TableCell>
                  <TableCell>
                    <Link href={`/parts/${part.id}`} className="text-blue-600 hover:underline font-medium">
                      {part.sku}
                    </Link>
                  </TableCell>
                  <TableCell>{part.name}</TableCell>
                  <TableCell className="text-right">{part.stockQuantity}</TableCell>
                  <TableCell className="text-right">${part.retail || "-"}</TableCell>
                  <TableCell className="text-right">${part.listPrice || "-"}</TableCell>
                  <TableCell className="text-right">{part.orderPoint || 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      {activeTab === "active" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(part.id)}
                          className="h-7 px-2 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (selectedPartIds.size > 0) {
                                // 批量恢复
                                const count = selectedPartIds.size;
                                if (window.confirm(`是否确认恢复选中的 ${count} 个配件？`)) {
                                  bulkRestoreMutation.mutate(Array.from(selectedPartIds));
                                }
                              } else {
                                // 单个恢复
                                if (window.confirm(`确认恢复该配件？`)) {
                                  restoreMutation.mutate(part.id);
                                }
                              }
                            }}
                            className="h-7 px-2 hover:bg-green-50"
                          >
                            <span className="text-sm text-green-600">恢复</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (selectedPartIds.size > 0) {
                                // 批量永久删除
                                const count = selectedPartIds.size;
                                if (window.confirm(`警告：您即将永久删除选中的 ${count} 个配件，此操作不可恢复！是否继续？`)) {
                                  bulkForceDeleteMutation.mutate(Array.from(selectedPartIds));
                                }
                              } else {
                                // 单个永久删除
                                if (window.confirm(`警告：您即将永久删除该配件，此操作不可恢复！是否继续？`)) {
                                  forceDeleteMutation.mutate(part.id);
                                }
                              }
                            }}
                            className="h-7 px-2 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPart ? "编辑配件" : "添加配件"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <Label>配件编号 (Part Number) *</Label>
                  <Input {...register("sku", { required: true })} placeholder="BRK-001" />
                </div>
                <div>
                  <Label>配件名称 (Description) *</Label>
                  <Input {...register("name", { required: true })} placeholder="刹车片" />
                </div>
                <div>
                  <Label>产品线 (Line)</Label>
                  <Select
                    value={watch("lineCodeId")?.toString() || "none"}
                    onValueChange={(value) => setValue("lineCodeId", value === "none" ? undefined : parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择产品线" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">无</SelectItem>
                      {lineCodes.map((lc) => (
                        <SelectItem key={lc.id} value={lc.id.toString()}>
                          {lc.code} - {lc.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>库存数量 (QOH)</Label>
                  <Input type="number" {...register("stockQuantity", { valueAsNumber: true })} />
                </div>
                <div>
                  <Label>订货点 (Order Point)</Label>
                  <Input type="number" {...register("orderPoint", { valueAsNumber: true })} />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <Label>替换成本 (Repl Cost)</Label>
                  <Input {...register("replCost")} placeholder="0.00" />
                </div>
                <div>
                  <Label>平均成本 (Avg Cost)</Label>
                  <Input {...register("avgCost")} placeholder="0.00" />
                </div>
                <div>
                  <Label>价格1 (Price 1)</Label>
                  <Input {...register("price1")} placeholder="0.00" />
                </div>
                <div>
                  <Label>价格2 (Price 2)</Label>
                  <Input {...register("price2")} placeholder="0.00" />
                </div>
                <div>
                  <Label>价格3 (Price 3)</Label>
                  <Input {...register("price3")} placeholder="0.00" />
                </div>
              </div>
            </div>

            {/* Full Width Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>零售价 (Retail)</Label>
                <Input {...register("retail")} placeholder="0.00" />
              </div>
              <div>
                <Label>标价 (List)</Label>
                <Input {...register("listPrice")} placeholder="0.00" />
              </div>
            </div>

            <div>
              <Label>配件图片</Label>
            <ImageUpload
              value={uploadedImageUrl}
              onChange={(url) => setUploadedImageUrl(url || "")}
            />
            </div>

            <div>
              <Label>描述</Label>
              <Input {...register("description")} placeholder="详细描述..." />
            </div>

            {/* Hidden legacy fields */}
            <input type="hidden" {...register("unitPrice")} value="0" />
            <input type="hidden" {...register("unit")} value="件" />
            <input type="hidden" {...register("minStockThreshold")} value={10} />

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">
                {editingPart ? "更新" : "添加"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认批量删除</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              您即将删除 <span className="font-bold text-red-600">{selectedPartIds.size}</span> 个配件。
            </p>
            <p className="text-sm text-gray-500">
              此操作将同时删除相关的库存记录和历史数据，且不可恢复。请确认您要继续吗？
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBulkDeleteDialogOpen(false)}
              disabled={bulkArchiveMutation.isPending}
            >
              取消
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmBulkDelete}
              disabled={bulkArchiveMutation.isPending}
            >
              {bulkArchiveMutation.isPending ? "删除中..." : "确认删除"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
