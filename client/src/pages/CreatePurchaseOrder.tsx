import { useForm, useFieldArray } from "react-hook-form";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

type OrderFormData = {
  orderNumber: string;
  supplierId?: number;
  notes?: string;
  items: Array<{
    partId: number;
    quantity: number;
    unitPrice: string;
  }>;
};

export default function CreatePurchaseOrder() {
  const [, setLocation] = useLocation();
  
  const { data: suppliers } = trpc.suppliers.list.useQuery();
  const { data: parts } = trpc.parts.list.useQuery();
  
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
      items: [{ partId: 0, quantity: 1, unitPrice: "0" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");

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
      ...data,
      items: validItems.map(item => ({
        ...item,
        unitPrice: parseFloat(item.unitPrice) || 0,
      })),
    });
  };

  const calculateTotal = () => {
    return watchItems.reduce((sum, item) => {
      const part = parts?.find(p => p.id === item.partId);
      const price = parseFloat(item.unitPrice) || (part?.unitPrice ? parseFloat(part.unitPrice) : 0);
      return sum + (price * item.quantity);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8">
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="orderNumber">订单号 *</Label>
              <Input
                id="orderNumber"
                {...register("orderNumber", { required: true })}
              />
            </div>
            <div>
              <Label>供应商 *</Label>
              <Select
                onValueChange={(value) => setValue("supplierId", parseInt(value))}
              >
                <SelectTrigger>
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
              rows={3}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">配件明细</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ partId: 0, quantity: 1, unitPrice: "0" })}
              >
                <Plus className="mr-2 h-4 w-4" />
                添加配件
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-[2fr,1fr,1fr,1fr,auto] gap-4 font-medium text-sm">
                <div>配件</div>
                <div>数量</div>
                <div>单价</div>
                <div>小计</div>
                <div>操作</div>
              </div>

              {fields.map((field, index) => {
                const selectedPart = parts?.find(p => p.id === watchItems[index]?.partId);
                const unitPrice = parseFloat(watchItems[index]?.unitPrice) || 
                                (selectedPart?.unitPrice ? parseFloat(selectedPart.unitPrice) : 0);
                const subtotal = unitPrice * watchItems[index]?.quantity;

                return (
                  <div key={field.id} className="grid grid-cols-[2fr,1fr,1fr,1fr,auto] gap-4 items-center">
                    <Select
                      value={watchItems[index]?.partId?.toString()}
                      onValueChange={(value) => {
                        const partId = parseInt(value);
                        setValue(`items.${index}.partId`, partId);
                        const part = parts?.find(p => p.id === partId);
                        if (part?.unitPrice) {
                          setValue(`items.${index}.unitPrice`, part.unitPrice);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择配件" />
                      </SelectTrigger>
                      <SelectContent>
                        {parts?.map((part) => (
                          <SelectItem key={part.id} value={part.id.toString()}>
                            {part.lineCode?.name || "N/A"} - {part.partNumber} - {part.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      min="1"
                      {...register(`items.${index}.quantity` as const, {
                        valueAsNumber: true,
                        min: 1,
                      })}
                    />

                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`items.${index}.unitPrice` as const)}
                    />

                    <div className="font-medium">
                      ¥{subtotal.toFixed(2)}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <div className="text-xl font-bold">
                总计: ¥{calculateTotal().toFixed(2)}
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
  );
}
