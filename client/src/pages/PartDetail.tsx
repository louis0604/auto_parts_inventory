import { Link, useRoute, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Trash2, History, Package } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type PartFormData = {
  sku: string;
  name: string;
  lineCodeId?: number;
  stockQuantity: number;
  replCost?: string;
  avgCost?: string;
  price1?: string;
  price2?: string;
  price3?: string;
  retail?: string;
  listPrice?: string;
  orderPoint?: number;
  imageUrl?: string;
  notes?: string;
};

export default function PartDetail() {
  const [, params] = useRoute("/parts/:id");
  const [, setLocation] = useLocation();
  const partId = params?.id ? parseInt(params.id) : 0;

  const { data: part, isLoading: partLoading } = trpc.parts.getById.useQuery(partId);
  const { data: lineCodes = [] } = trpc.lineCodes.list.useQuery();

  const [formData, setFormData] = useState<PartFormData>({
    sku: "",
    name: "",
    stockQuantity: 0,
    orderPoint: 0,
  });

  // 当配件数据加载完成后，填充表单
  useEffect(() => {
    if (part) {
      setFormData({
        sku: part.sku,
        name: part.name,
        lineCodeId: part.lineCodeId || undefined,
        stockQuantity: part.stockQuantity,
        replCost: part.replCost || undefined,
        avgCost: part.avgCost || undefined,
        price1: part.price1 || undefined,
        price2: part.price2 || undefined,
        price3: part.price3 || undefined,
        retail: part.retail || undefined,
        listPrice: part.listPrice || undefined,
        orderPoint: part.orderPoint || undefined,
        imageUrl: part.imageUrl || undefined,
        notes: part.description || undefined,
      });
    }
  }, [part]);

  const updateMutation = trpc.parts.update.useMutation({
    onSuccess: () => {
      toast.success("配件信息更新成功");
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  const deleteMutation = trpc.parts.delete.useMutation({
    onSuccess: () => {
      toast.success("配件已删除");
      setLocation("/parts");
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      id: partId,
      data: {
        sku: formData.sku,
        name: formData.name,
        lineCodeId: formData.lineCodeId,
        stockQuantity: formData.stockQuantity,
        retail: formData.retail,
        listPrice: formData.listPrice,
        replCost: formData.replCost,
        avgCost: formData.avgCost,
        price1: formData.price1,
        price2: formData.price2,
        price3: formData.price3,
        imageUrl: formData.imageUrl,
        description: formData.notes,
      },
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(partId);
  };

  const handleInputChange = (field: keyof PartFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const uploadImageMutation = trpc.storage.uploadImage.useMutation();

  const handleImageUpload = async (file: File) => {
    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        
        // Upload to S3 via tRPC
        const result = await uploadImageMutation.mutateAsync({
          fileName: file.name,
          fileData: base64Data,
          contentType: file.type,
        });
        
        // Update form data with new image URL
        handleInputChange("imageUrl", result.url);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Image upload failed:", error);
      alert("图片上传失败，请重试");
    }
  };

  if (partLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!part) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">配件不存在</p>
          <Link href="/parts">
            <Button>返回配件列表</Button>
          </Link>
        </div>
      </div>
    );
  }

  const lineCode = lineCodes.find(lc => lc.id === formData.lineCodeId);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/parts">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回配件列表
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div>
              {lineCode && (
                <div className="text-sm text-gray-500 mb-1">
                  产品线: {lineCode.code} - {lineCode.description}
                </div>
              )}
              <h1 className="text-3xl font-bold">{part.sku}</h1>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/parts/${partId}/history`}>
            <Button variant="outline">
              <History className="w-4 h-4 mr-2" />
              查看操作历史
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            保存修改
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                删除配件
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除</AlertDialogTitle>
                <AlertDialogDescription>
                  确定要删除配件 {part.sku} 吗？此操作无法撤销。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
                  删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white p-6 rounded-lg border space-y-6">
        <div className="grid grid-cols-2 gap-6">
          {/* 左侧：图片和基本信息 */}
          <div className="space-y-4">
            <div>
              <Label>配件图片</Label>
              <div 
                className="relative w-full h-64 bg-gray-50 rounded mt-2 border-2 border-gray-300 hover:border-blue-400 transition-colors cursor-pointer flex items-center justify-center group"
                onClick={() => document.getElementById('image-upload')?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files[0];
                  if (file && file.type.startsWith('image/')) {
                    await handleImageUpload(file);
                  }
                }}
              >
                {formData.imageUrl ? (
                  <img
                    src={formData.imageUrl}
                    alt={formData.name}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      console.error('图片加载失败:', formData.imageUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <Package className="w-12 h-12 mb-2" />
                    <span className="text-sm">点击或拖拽上传图片</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium bg-white px-3 py-1 rounded shadow">
                    点击更换图片
                  </span>
                </div>
              </div>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />
            </div>

            <div>
              <Label>Part Number (SKU) *</Label>
              <Input
                value={formData.sku}
                onChange={(e) => handleInputChange("sku", e.target.value)}
                required
              />
            </div>

            <div>
              <Label>配件名称 (Description) *</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            <div>
              <Label>产品线 (Line)</Label>
              <Select
                value={formData.lineCodeId?.toString() || "none"}
                onValueChange={(value) => handleInputChange("lineCodeId", value === "none" ? undefined : parseInt(value))}
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
              <Label>备注</Label>
              <Textarea
                value={formData.notes || ""}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={4}
              />
            </div>
          </div>

          {/* 右侧：库存和价格信息 */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>当前库存 (QOH) *</Label>
                <Input
                  type="number"
                  value={formData.stockQuantity}
                  onChange={(e) => handleInputChange("stockQuantity", parseInt(e.target.value) || 0)}
                  required
                />
              </div>
              <div>
                <Label>订货点 (Order Point)</Label>
                <Input
                  type="number"
                  value={formData.orderPoint || 0}
                  onChange={(e) => handleInputChange("orderPoint", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">成本信息</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Repl Cost</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.replCost || ""}
                  onChange={(e) => handleInputChange("replCost", e.target.value || undefined)}
                />
                </div>
                <div>
                  <Label>Avg Cost</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.avgCost || ""}
                  onChange={(e) => handleInputChange("avgCost", e.target.value || undefined)}
                />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">价格信息</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price 1</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price1 || ""}
                  onChange={(e) => handleInputChange("price1", e.target.value || undefined)}
                />
                </div>
                <div>
                  <Label>Price 2</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price2 || ""}
                  onChange={(e) => handleInputChange("price2", e.target.value || undefined)}
                />
                </div>
                <div>
                  <Label>Price 3</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price3 || ""}
                  onChange={(e) => handleInputChange("price3", e.target.value || undefined)}
                />
                </div>
                <div>
                  <Label>零售价 (Retail)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.retail || ""}
                  onChange={(e) => handleInputChange("retail", e.target.value || undefined)}
                />
                </div>
                <div>
                  <Label>标价 (List)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.listPrice || ""}
                  onChange={(e) => handleInputChange("listPrice", e.target.value || undefined)}
                />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
