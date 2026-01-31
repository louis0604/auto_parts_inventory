import { useState } from "react";
import { useLocation } from "wouter";
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
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { ArrowLeft, Upload } from "lucide-react";

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

export default function AddPart() {
  const [, navigate] = useLocation();
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: lineCodes = [] } = trpc.lineCodes.list.useQuery();
  const utils = trpc.useUtils();

  const { register, handleSubmit, reset, setValue, watch } = useForm<PartFormData>({
    defaultValues: {
      sku: "",
      name: "",
      description: "",
      stockQuantity: 0,
      orderPoint: 0,
      unitPrice: "0",
      unit: "件",
      minStockThreshold: 0,
      imageUrl: "",
    },
  });

  const createMutation = trpc.parts.create.useMutation({
    onSuccess: () => {
      toast.success("配件添加成功");
      // 失效缓存，确保列表页面显示最新数据
      utils.parts.list.invalidate();
      navigate("/parts");
    },
    onError: (error) => {
      toast.error(`添加失败: ${error.message}`);
    },
  });

  const uploadImageMutation = trpc.storage.uploadImage.useMutation({
    onSuccess: (data) => {
      setUploadedImageUrl(data.url);
      setValue("imageUrl", data.url);
      toast.success("图片上传成功");
      setIsUploading(false);
    },
    onError: (error) => {
      toast.error(`图片上传失败: ${error.message}`);
      setIsUploading(false);
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("图片大小不能超过5MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("请上传图片文件");
      return;
    }

    setIsUploading(true);

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      uploadImageMutation.mutate({
        fileName: file.name,
        fileData: base64,
        contentType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (data: PartFormData) => {
    // Convert lineCodeId from string to number or undefined
    const lineCodeId = data.lineCodeId === undefined ? undefined : Number(data.lineCodeId);
    
    createMutation.mutate({
      ...data,
      lineCodeId: lineCodeId === 0 ? undefined : lineCodeId,
      unitPrice: data.retail || "0", // 使用retail作为unitPrice的默认值
      imageUrl: uploadedImageUrl || data.imageUrl || undefined,
    });
  };

  const lineCodeId = watch("lineCodeId");

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/parts")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回配件列表
        </Button>
        <h1 className="text-3xl font-bold">添加配件</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl">
        <div className="bg-card rounded-lg border p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4">基本信息</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sku">配件编号 (Part Number) *</Label>
                <Input
                  id="sku"
                  {...register("sku", { required: true })}
                  placeholder="例如: BRK-001"
                />
              </div>
              <div>
                <Label htmlFor="name">配件名称 (Description) *</Label>
                <Input
                  id="name"
                  {...register("name", { required: true })}
                  placeholder="例如: 刹车片"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="lineCodeId">产品线 (Line) *</Label>
                <Select
                  value={lineCodeId === undefined ? "" : String(lineCodeId)}
                  onValueChange={(value) => {
                    setValue("lineCodeId", value === "" ? undefined : Number(value));
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择产品线" />
                  </SelectTrigger>
                  <SelectContent>
                    {lineCodes.map((lineCode) => (
                      <SelectItem key={lineCode.id} value={String(lineCode.id)}>
                        {lineCode.code} - {lineCode.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <h2 className="text-lg font-semibold mb-4">配件图片</h2>
            <div className="space-y-4">
              {uploadedImageUrl && (
                <div className="border rounded-lg p-4">
                  <img
                    src={uploadedImageUrl}
                    alt="配件图片"
                    className="w-full h-64 object-contain"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent transition-colors">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {isUploading ? "上传中..." : "点击上传配件图片"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      支持 JPG, PNG, GIF, 最大5MB
                    </p>
                  </div>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </Label>
              </div>
            </div>
          </div>

          {/* Inventory Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4">库存信息</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stockQuantity">当前库存 (QOH)</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  {...register("stockQuantity", { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="orderPoint">订货点 (Order Point)</Label>
                <Input
                  id="orderPoint"
                  type="number"
                  {...register("orderPoint", { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Cost Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4">成本信息</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="replCost">Repl Cost *</Label>
                <Input
                  id="replCost"
                  {...register("replCost", { required: true })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="avgCost">Avg Cost</Label>
                <Input
                  id="avgCost"
                  {...register("avgCost")}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Price Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4">价格信息</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price1">Price 1</Label>
                <Input
                  id="price1"
                  {...register("price1")}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="price2">Price 2</Label>
                <Input
                  id="price2"
                  {...register("price2")}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="price3">Price 3</Label>
                <Input
                  id="price3"
                  {...register("price3")}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="retail">零售价 (Retail) *</Label>
                <Input
                  id="retail"
                  {...register("retail", { required: true })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="listPrice">标价 (List)</Label>
                <Input
                  id="listPrice"
                  {...register("listPrice")}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="description">备注</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="配件的额外说明信息..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "添加中..." : "添加配件"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/parts")}
            >
              取消
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
