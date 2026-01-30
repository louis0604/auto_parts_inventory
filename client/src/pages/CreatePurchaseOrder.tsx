import { useForm, useFieldArray } from "react-hook-form";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Search } from "lucide-react";
import { useState } from "react";

type OrderFormData = {
  orderNumber: string;
  supplierId?: number;
  type: "purchase" | "return";
  notes?: string;
  items: Array<{
    partId: number;
    sku: string;
    lineCode: string;
    name: string;
    quantity: number;
    unitPrice: string;
  }>;
};

type PartOption = {
  id: number;
  sku: string;
  lineCodeName: string | null;
  name: string;
  cost: string | null;
  replCost: string | null;
};

export default function CreatePurchaseOrder() {
  const [, setLocation] = useLocation();
  const [searchingIndex, setSearchingIndex] = useState<number | null>(null);
  const [partOptions, setPartOptions] = useState<PartOption[]>([]);
  const [selectingForIndex, setSelectingForIndex] = useState<number | null>(null);
  const utils = trpc.useUtils();
  
  const { data: suppliers } = trpc.suppliers.list.useQuery();
  
  const createMutation = trpc.purchaseOrders.create.useMutation({
    onSuccess: () => {
      toast.success("采购订单创建成功");
      setLocation("/purchase-orders");
    },
    onError: (error) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });

  const { register, handleSubmit, control, watch, setValue } = useForm<OrderFormData>({
    defaultValues: {
      orderNumber: `PO-${Date.now()}`,
      type: "purchase",
      items: [{ partId: 0, sku: "", lineCode: "", name: "", quantity: 1, unitPrice: "0" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");
  const watchType = watch("type");

  const handleSearchPart = async (index: number) => {
    const sku = watchItems[index].sku.trim();
    if (!sku) {
      toast.error("请输入配件号");
      return;
    }

    setSearchingIndex(index);
    
    try {
      // 查询配件信息
      const parts = await utils.client.parts.getBySku.query({ sku });
      
      if (parts) {
        
        if (parts.length === 0) {
          toast.error(`未找到配件号: ${sku}`);
        } else if (parts.length === 1) {
          // 只有一个配件，直接填充
          const part = parts[0];
          setValue(`items.${index}.partId`, part.id);
          setValue(`items.${index}.lineCode`, part.lineCodeName || "N/A");
          setValue(`items.${index}.name`, part.name);
          setValue(`items.${index}.unitPrice`, part.replCost || part.cost || "0");
          toast.success("配件信息已填充");
        } else {
          // 多个配件（不同Line Code），显示选择对话框
          setPartOptions(parts);
          setSelectingForIndex(index);
        }
      } else {
        toast.error("查询失败");
      }
    } catch (error) {
      toast.error("查询配件失败");
    } finally {
      setSearchingIndex(null);
    }
  };

  const onSubmit = (data: OrderFormData) => {
    if (!data.supplierId) {
      toast.error("请选择供应商");
      return;
    }

    const validItems = data.items.filter(item => item.partId > 0);
    if (validItems.length === 0) {
      toast.error("请至少添加一个配件");
      return;
    }

    createMutation.mutate({
      orderNumber: data.orderNumber,
      supplierId: data.supplierId,
      type: data.type,
      notes: data.notes,
      items: validItems.map(item => ({
        partId: item.partId,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice) || 0,
      })),
    });
  };

  const calculateSubtotal = (index: number) => {
    const item = watchItems[index];
    const price = parseFloat(item.unitPrice) || 0;
    return (price * item.quantity).toFixed(2);
  };

  const calculateTotal = () => {
    return watchItems.reduce((sum, item) => {
      const price = parseFloat(item.unitPrice) || 0;
      return sum + (price * item.quantity);
    }, 0).toFixed(2);
  };

  return (
    <>
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/purchase-orders")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <h1 className="text-3xl font-bold">创建采购订单</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="orderNumber">订单号 *</Label>
              <Input
                id="orderNumber"
                {...register("orderNumber", { required: true })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="type">订单类型 *</Label>
              <Select
                value={watchType}
                onValueChange={(value) => setValue("type", value as "purchase" | "return")}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="选择订单类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">入库 (Purchase)</SelectItem>
                  <SelectItem value="return">出库 (Return)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="supplier">供应商 *</Label>
              <Select
                value={watch("supplierId")?.toString()}
                onValueChange={(value) => setValue("supplierId", parseInt(value))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="选择供应商" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">备注</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">配件明细</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ partId: 0, sku: "", lineCode: "", name: "", quantity: 1, unitPrice: "0" })}
              >
                <Plus className="mr-2 h-4 w-4" />
                添加配件
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">#</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">配件号 (SKU)</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Line Code</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">配件名称</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">数量</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">单价</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">小计</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr key={field.id} className="border-t">
                      <td className="px-4 py-3 text-sm">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Input
                            {...register(`items.${index}.sku`)}
                            placeholder="输入配件号"
                            className="w-32"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleSearchPart(index)}
                            disabled={searchingIndex === index}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{watchItems[index].lineCode || "-"}</td>
                      <td className="px-4 py-3 text-sm">{watchItems[index].name || "-"}</td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                          min="1"
                          className="w-20"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          step="0.01"
                          {...register(`items.${index}.unitPrice`)}
                          className="w-24"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm">¥{calculateSubtotal(index)}</td>
                      <td className="px-4 py-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="text-right">
                <div className="text-lg font-semibold">
                  总计: <span className="text-2xl">¥{calculateTotal()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/purchase-orders")}
            >
              取消
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "创建中..." : "创建订单"}
            </Button>
          </div>
        </form>
      </div>
    </div>

    {/* Line Code 选择对话框 */}
    <Dialog open={selectingForIndex !== null} onOpenChange={(open) => !open && setSelectingForIndex(null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>选择Line Code</DialogTitle>
          <DialogDescription>
            找到{partOptions.length}个相同配件号的配件，请选择正确的Line Code：
          </DialogDescription>
        </DialogHeader>
        <RadioGroup
          onValueChange={(value) => {
            const selectedPart = partOptions.find(p => p.id === parseInt(value));
            if (selectedPart && selectingForIndex !== null) {
              setValue(`items.${selectingForIndex}.partId`, selectedPart.id);
              setValue(`items.${selectingForIndex}.lineCode`, selectedPart.lineCodeName || "N/A");
              setValue(`items.${selectingForIndex}.name`, selectedPart.name);
              setValue(`items.${selectingForIndex}.unitPrice`, selectedPart.replCost || selectedPart.cost || "0");
              toast.success("配件信息已填充");
              setSelectingForIndex(null);
              setPartOptions([]);
            }
          }}
        >
          <div className="space-y-3">
            {partOptions.map((part) => (
              <div key={part.id} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                <RadioGroupItem value={part.id.toString()} id={`part-${part.id}`} />
                <label htmlFor={`part-${part.id}`} className="flex-1 cursor-pointer">
                  <div className="font-medium">
                    Line Code: {part.lineCodeName || "N/A"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {part.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    单价: ${part.replCost || part.cost || "0"}
                  </div>
                </label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </DialogContent>
    </Dialog>
    </>
  );
}
