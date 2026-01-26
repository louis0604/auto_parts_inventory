import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import ERPToolbar from "@/components/ERPToolbar";
import { BulkImportParts } from "@/components/BulkImportParts";
import { ImageUpload } from "@/components/ImageUpload";
import LineCodeManagement from "@/components/LineCodeManagement";
import { Edit, Trash2, Upload } from "lucide-react";

type PartFormData = {
  // Basic info
  sku: string; // Part
  name: string; // Description
  lineCodeId?: number; // Line
  categoryId?: number;
  supplierId?: number; // Vendor
  description?: string;
  
  // Pricing
  listPrice?: string; // List
  cost?: string; // Cost
  retail?: string; // Retail
  coreCost?: string; // Core Cost
  coreRetail?: string; // Core Retail
  unitPrice: string; // 保留兼容性
  
  // Inventory
  stockQuantity: number;
  minStockThreshold: number;
  orderQty?: number; // Order Qty
  orderMultiple?: number; // Order Multiple
  
  // Units
  stockingUnit?: string; // Stocking Unit
  purchaseUnit?: string; // Purchase Unit
  unit: string; // 保留兼容性
  
  // Additional
  manufacturer?: string; // Manufacturer
  mfgPartNumber?: string; // Mfg Part #
  weight?: string; // Weight
  imageUrl?: string; // Part Image
};

export default function Parts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLineCodeFilter, setSelectedLineCodeFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("stocking");
  const [forceDeleteDialogOpen, setForceDeleteDialogOpen] = useState(false);
  const [partToDelete, setPartToDelete] = useState<{id: number, name: string, sku: string} | null>(null);
  const [bulkImportDialogOpen, setBulkImportDialogOpen] = useState(false);

  const { data: parts, isLoading, refetch } = trpc.parts.list.useQuery();
  const { data: categories } = trpc.partCategories.list.useQuery();
  const { data: suppliers } = trpc.suppliers.list.useQuery();
  const { data: lineCodes } = trpc.lineCodes.list.useQuery();
  
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
      setIsAddDialogOpen(false);
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

  const forceDeleteMutation = trpc.parts.forceDelete.useMutation({
    onSuccess: () => {
      toast.success("配件已强制删除，所有相关记录已清除");
      setForceDeleteDialogOpen(false);
      setPartToDelete(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`强制删除失败: ${error.message}`);
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
    // 将空字符串转换为undefined，确保后端验证通过
    const cleanData = {
      ...data,
      lineCodeId: data.lineCodeId || undefined,
      categoryId: data.categoryId || undefined,
      supplierId: data.supplierId || undefined,
      description: data.description || undefined,
      listPrice: data.listPrice || undefined,
      cost: data.cost || undefined,
      retail: data.retail || undefined,
      coreCost: data.coreCost || undefined,
      coreRetail: data.coreRetail || undefined,
      orderQty: data.orderQty || undefined,
      orderMultiple: data.orderMultiple || undefined,
      stockingUnit: data.stockingUnit || undefined,
      purchaseUnit: data.purchaseUnit || undefined,
      manufacturer: data.manufacturer || undefined,
      mfgPartNumber: data.mfgPartNumber || undefined,
      weight: data.weight || undefined,
      imageUrl: data.imageUrl || undefined,
    };

    if (editingPart) {
      updateMutation.mutate({
        id: editingPart,
        data: {
          sku: cleanData.sku,
          name: cleanData.name,
          categoryId: cleanData.categoryId,
          supplierId: cleanData.supplierId,
          description: cleanData.description,
          unitPrice: cleanData.unitPrice,
          minStockThreshold: cleanData.minStockThreshold,
          unit: cleanData.unit,
        },
      });
    } else {
      createMutation.mutate(cleanData);
    }
  };

  const handleEdit = (part: any) => {
    setEditingPart(part.id);
    setValue("sku", part.sku);
    setValue("name", part.name);
    setValue("lineCodeId", part.lineCodeId);
    setValue("categoryId", part.categoryId);
    setValue("supplierId", part.supplierId);
    setValue("description", part.description || "");
    // Pricing
    setValue("listPrice", part.listPrice || "");
    setValue("cost", part.cost || "");
    setValue("retail", part.retail || "");
    setValue("coreCost", part.coreCost || "");
    setValue("coreRetail", part.coreRetail || "");
    setValue("unitPrice", part.unitPrice);
    // Inventory
    setValue("stockQuantity", part.stockQuantity);
    setValue("minStockThreshold", part.minStockThreshold);
    setValue("orderQty", part.orderQty || 0);
    setValue("orderMultiple", part.orderMultiple || 1);
    // Units
    setValue("stockingUnit", part.stockingUnit || "EA");
    setValue("purchaseUnit", part.purchaseUnit || "EA");
    setValue("unit", part.unit);
    // Additional
    setValue("manufacturer", part.manufacturer || "");
    setValue("mfgPartNumber", part.mfgPartNumber || "");
    setValue("weight", part.weight || "");
    setValue("imageUrl", part.imageUrl || "");
    setIsAddDialogOpen(true);
  };

  const handleDelete = (part: any) => {
    if (confirm("确定要删除这个配件吗？此操作无法撤销。")) {
      deleteMutation.mutate(part.id, {
        onError: (error) => {
          // If delete fails due to references, offer force delete option
          if (error.message.includes("库存变动记录") || error.message.includes("引用")) {
            setPartToDelete({ id: part.id, name: part.name, sku: part.sku });
            setForceDeleteDialogOpen(true);
          }
        },
      });
    }
  };

  const handleForceDelete = () => {
    if (partToDelete) {
      forceDeleteMutation.mutate(partToDelete.id);
    }
  };

  const handleAdd = () => {
    setEditingPart(null);
    reset();
    setIsAddDialogOpen(true);
  };

  const filteredParts = parts?.filter(
    (part) => {
      // 搜索过滤
      const matchesSearch = part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        part.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (part.lineCode && part.lineCode.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Line Code筛选
      const matchesLineCode = selectedLineCodeFilter === "all" || 
        (selectedLineCodeFilter === "none" && !part.lineCode) ||
        part.lineCode === selectedLineCodeFilter;
      
      return matchesSearch && matchesLineCode;
    }
  );

  return (
    <div className="flex flex-col h-full">
      {/* ERP Toolbar */}
      <div className="flex items-center gap-2">
        <ERPToolbar
          onAdd={handleAdd}
          onRefresh={() => refetch()}
          showAdd={true}
          showRefresh={true}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setBulkImportDialogOpen(true)}
        >
          <Upload className="h-4 w-4 mr-1" />
          批量导入
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-gray-50 p-4">
        {/* Search and Filter Bar */}
        <div className="bg-white border border-gray-300 rounded p-3 mb-3">
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium w-16">搜索:</Label>
            <Input
              placeholder="输入配件名称、SKU或Line Code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
            <Label className="text-sm font-medium whitespace-nowrap">Line Code:</Label>
            <Select value={selectedLineCodeFilter} onValueChange={setSelectedLineCodeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择Line Code" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="none">未设置</SelectItem>
                {lineCodes?.map((lc) => (
                  <SelectItem key={lc.id} value={lc.code}>{lc.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white border border-gray-300 rounded">
          <TabsList className="erp-tabs flex w-full justify-start rounded-none bg-gray-50">
            <TabsTrigger value="stocking" className={`erp-tab ${activeTab === "stocking" ? "erp-tab-active" : ""}`}>
              1. 库存
            </TabsTrigger>
            <TabsTrigger value="pricing" className={`erp-tab ${activeTab === "pricing" ? "erp-tab-active" : ""}`}>
              2. 定价
            </TabsTrigger>
            <TabsTrigger value="linecodes" className={`erp-tab ${activeTab === "linecodes" ? "erp-tab-active" : ""}`}>
              3. Line Code管理
            </TabsTrigger>
            <TabsTrigger value="codes" className={`erp-tab ${activeTab === "codes" ? "erp-tab-active" : ""}`}>
              4. 编码
            </TabsTrigger>
            <TabsTrigger value="history" className={`erp-tab ${activeTab === "history" ? "erp-tab-active" : ""}`}>
              5. 历史
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stocking" className="p-4">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : filteredParts && filteredParts.length > 0 ? (
              <div className="overflow-auto">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th className="w-16">图片</th>
                      <th className="w-28">Line Code</th>
                      <th className="w-32">SKU</th>
                      <th>配件名称</th>
                      <th className="w-32">分类</th>
                      <th className="w-32">供应商</th>
                      <th className="w-24">库存数量</th>
                      <th className="w-24">最低库存</th>
                      <th className="w-24">单位</th>
                      <th className="w-24">单价</th>
                      <th className="w-32">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParts.map((part) => (
                      <tr key={part.id}>
                        <td>
                          {part.imageUrl ? (
                            <img
                              src={part.imageUrl}
                              alt={part.name}
                              className="w-12 h-12 object-cover rounded border"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                              <span className="text-gray-400 text-xs">无图</span>
                            </div>
                          )}
                        </td>
                        <td className="text-gray-600 font-mono text-xs">{part.lineCode || "-"}</td>
                        <td className="font-mono text-xs">{part.sku}</td>
                        <td className="font-medium">{part.name}</td>
                        <td className="text-gray-600">
                          {categories?.find((c) => c.id === part.categoryId)?.name || "-"}
                        </td>
                        <td className="text-gray-600">
                          {suppliers?.find((s) => s.id === part.supplierId)?.name || "-"}
                        </td>
                        <td className={`text-right ${part.stockQuantity < part.minStockThreshold ? "text-red-600 font-bold" : ""}`}>
                          {part.stockQuantity}
                        </td>
                        <td className="text-right text-gray-600">{part.minStockThreshold}</td>
                        <td className="text-center">{part.unit}</td>
                        <td className="text-right">${part.unitPrice}</td>
                        <td>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(part)}
                              className="h-7 px-2 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(part)}
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
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg mb-2">暂无配件数据</p>
                <p className="text-sm">点击工具栏的"添加"按钮创建新配件</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pricing" className="p-4">
            <div className="text-center py-12 text-gray-500">定价信息</div>
          </TabsContent>

          <TabsContent value="linecodes" className="p-0">
            <LineCodeManagement />
          </TabsContent>

          <TabsContent value="codes" className="p-4">
            <div className="text-center py-12 text-gray-500">编码信息</div>
          </TabsContent>

          <TabsContent value="history" className="p-4">
            <div className="text-center py-12 text-gray-500">历史记录</div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Status Bar */}
      <div className="erp-status-bar">
        <span>共 {filteredParts?.length || 0} 条记录</span>
        <span>库存管理系统 v1.0</span>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPart ? "编辑配件" : "添加配件"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* 左右两列布局 */}
            <div className="grid grid-cols-2 gap-6">
              {/* 左列 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lineCodeId">Line</Label>
                  <Select
                    value={watch("lineCodeId")?.toString() || "none"}
                    onValueChange={(value) => setValue("lineCodeId", value === "none" ? undefined : parseInt(value))}
                  >
                    <SelectTrigger className="erp-field-input">
                      <SelectValue placeholder="选择Line" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-</SelectItem>
                      {lineCodes?.map((lc) => (
                        <SelectItem key={lc.id} value={lc.id.toString()}>
                          {lc.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">Part <span className="text-red-500">*</span></Label>
                  <Input
                    id="sku"
                    {...register("sku", { required: true })}
                    placeholder="60091003"
                    className="erp-field-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Description <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    {...register("name", { required: true })}
                    placeholder="配件描述"
                    className="erp-field-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orderQty">Order Qty</Label>
                  <Input
                    id="orderQty"
                    {...register("orderQty", { valueAsNumber: true })}
                    type="number"
                    placeholder="0"
                    className="erp-field-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="listPrice">List</Label>
                  <Input
                    id="listPrice"
                    {...register("listPrice")}
                    type="text"
                    placeholder="0.00"
                    className="erp-field-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost">Cost</Label>
                  <Input
                    id="cost"
                    {...register("cost")}
                    type="text"
                    placeholder="0.00"
                    className="erp-field-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retail">Retail <span className="text-red-500">*</span></Label>
                  <Input
                    id="retail"
                    {...register("retail")}
                    type="text"
                    placeholder="0"
                    className="erp-field-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coreCost">Core Cost</Label>
                  <Input
                    id="coreCost"
                    {...register("coreCost")}
                    type="text"
                    placeholder="0.00"
                    className="erp-field-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coreRetail">Core Retail</Label>
                  <Input
                    id="coreRetail"
                    {...register("coreRetail")}
                    type="text"
                    placeholder="0.00"
                    className="erp-field-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplierId">Vendor</Label>
                  <Select
                    value={watch("supplierId")?.toString() || "none"}
                    onValueChange={(value) => setValue("supplierId", value === "none" ? undefined : parseInt(value))}
                  >
                    <SelectTrigger className="erp-field-input">
                      <SelectValue placeholder="选择Vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-</SelectItem>
                      {suppliers?.map((sup) => (
                        <SelectItem key={sup.id} value={sup.id.toString()}>
                          {sup.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Select value="none" disabled>
                    <SelectTrigger className="erp-field-input">
                      <SelectValue placeholder="-" />
                    </SelectTrigger>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mfgPartNumber">Mfg Part #</Label>
                  <Input
                    id="mfgPartNumber"
                    {...register("mfgPartNumber")}
                    placeholder=""
                    className="erp-field-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orderMultiple">Order Multiple</Label>
                  <Input
                    id="orderMultiple"
                    {...register("orderMultiple", { valueAsNumber: true })}
                    type="number"
                    placeholder="1"
                    className="erp-field-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight</Label>
                  <Input
                    id="weight"
                    {...register("weight")}
                    type="text"
                    placeholder="0.00"
                    className="erp-field-input"
                  />
                </div>
              </div>

              {/* 右列 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Part Image</Label>
                  <ImageUpload
                    value={watch("imageUrl")}
                    onChange={(url) => setValue("imageUrl", url)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stockingUnit">Stocking Unit</Label>
                  <Select
                    value={watch("stockingUnit") || "EA"}
                    onValueChange={(value) => setValue("stockingUnit", value)}
                  >
                    <SelectTrigger className="erp-field-input">
                      <SelectValue placeholder="EA" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EA">EA</SelectItem>
                      <SelectItem value="BOX">BOX</SelectItem>
                      <SelectItem value="CASE">CASE</SelectItem>
                      <SelectItem value="PAIR">PAIR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchaseUnit">Purchase Unit</Label>
                  <Select
                    value={watch("purchaseUnit") || "EA"}
                    onValueChange={(value) => setValue("purchaseUnit", value)}
                  >
                    <SelectTrigger className="erp-field-input">
                      <SelectValue placeholder="EA" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EA">EA</SelectItem>
                      <SelectItem value="BOX">BOX</SelectItem>
                      <SelectItem value="CASE">CASE</SelectItem>
                      <SelectItem value="PAIR">PAIR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 pt-8">
                  <Label>库存信息</Label>
                  <div className="border border-gray-300 rounded p-3 space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="stockQuantity" className="text-sm">库存数量</Label>
                      <Input
                        id="stockQuantity"
                        {...register("stockQuantity", { valueAsNumber: true })}
                        type="number"
                        placeholder="0"
                        className="erp-field-input"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="minStockThreshold" className="text-sm">最低库存</Label>
                      <Input
                        id="minStockThreshold"
                        {...register("minStockThreshold", { valueAsNumber: true })}
                        type="number"
                        placeholder="10"
                        className="erp-field-input"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="unitPrice" className="text-sm">单价 (Retail) <span className="text-red-500">*</span></Label>
                      <Input
                        id="unitPrice"
                        {...register("unitPrice", { required: true })}
                        type="text"
                        placeholder="0.00"
                        className="erp-field-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">备注</Label>
                  <textarea
                    id="description"
                    {...register("description")}
                    placeholder="备注信息..."
                    className="erp-field-input min-h-[100px] resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
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
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingPart ? "保存" : "添加"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Force Delete Confirmation Dialog */}
      <Dialog open={forceDeleteDialogOpen} onOpenChange={setForceDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 text-lg font-bold">⚠️ 强制删除确认</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-sm text-gray-700 mb-2">
                您尝试删除的配件已被其他记录引用，无法直接删除。
              </p>
              {partToDelete && (
                <div className="mt-2 p-2 bg-white rounded border">
                  <p className="text-sm font-semibold">SKU: {partToDelete.sku}</p>
                  <p className="text-sm">名称: {partToDelete.name}</p>
                </div>
              )}
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm font-bold text-red-700 mb-2">强制删除将会：</p>
              <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
                <li>删除该配件的所有库存变动记录</li>
                <li>删除相关的采购订单明细</li>
                <li>删除相关的销售发票明细</li>
                <li>删除配件本身</li>
              </ul>
              <p className="text-sm font-bold text-red-700 mt-3">
                ⚠️ 此操作不可逆，请谨慎确认！
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setForceDeleteDialogOpen(false);
                  setPartToDelete(null);
                }}
              >
                取消
              </Button>
              <Button
                type="button"
                onClick={handleForceDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={forceDeleteMutation.isPending}
              >
                {forceDeleteMutation.isPending ? "删除中..." : "确认强制删除"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 批量导入对话框 */}
      <BulkImportParts
        open={bulkImportDialogOpen}
        onOpenChange={setBulkImportDialogOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
