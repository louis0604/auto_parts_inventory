import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, ArrowLeft, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type WarrantyFormData = {
  warrantyNumber: string;
  customerId: number;
  customerNumber?: string;
  originalInvoiceNumber?: string;
  claimReason: string;
  notes?: string;
  items: {
    partId: number;
    quantity: number;
    unitPrice: string;
    selectedInvoiceNumber?: string;
  }[];
};

type PartOption = {
  id: number;
  sku: string;
  lineCodeName: string | null;
  name: string;
  unitPrice: string | null;
};

export default function CreateWarranty() {
  const [, setLocation] = useLocation();
  const [searchingSku, setSearchingSku] = useState<string>("");
  const [searchingIndex, setSearchingIndex] = useState<number | null>(null);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [partOptions, setPartOptions] = useState<PartOption[]>([]);
  const [selectingForIndex, setSelectingForIndex] = useState<number | null>(null);
  const [skuInputs, setSkuInputs] = useState<{ [key: number]: string }>({});
  
  const { data: customers } = trpc.customers.list.useQuery();
  const { data: parts } = trpc.parts.list.useQuery();
  const utils = trpc.useUtils();
  
  const createMutation = trpc.warranties.create.useMutation({
    onSuccess: () => {
      toast.success("保修单创建成功");
      setLocation("/warranties");
    },
    onError: (error) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });

  const { register, handleSubmit, control, watch, setValue } = useForm<WarrantyFormData>({
    defaultValues: {
      warrantyNumber: `WR-${Date.now()}`,
      customerId: 0,
      customerNumber: "",
      originalInvoiceNumber: "",
      claimReason: "",
      notes: "",
      items: [{ partId: 0, quantity: 1, unitPrice: "0" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");

  const handleSearchSalesHistory = async (sku: string, index: number) => {
    if (!sku) {
      toast.error("请先选择配件");
      return;
    }
    
    setSearchingSku(sku);
    setSearchingIndex(index);
    
    try {
      const response = await fetch(`/api/trpc/warranties.getSalesHistory?input=${encodeURIComponent(JSON.stringify(sku))}`);
      const data = await response.json();
      setSalesHistory(data.result?.data || []);
    } catch (error) {
      toast.error("查询销售历史失败");
    }
  };

  const handleSelectSalesRecord = (record: any, index: number) => {
    setValue(`items.${index}.selectedInvoiceNumber`, record.invoiceNumber);
    setSalesHistory([]);
    setSearchingIndex(null);
    toast.success(`已选择原始发票: ${record.invoiceNumber}`);
  };

  const onSubmit = (data: WarrantyFormData) => {
    if (!data.customerId) {
      toast.error("请选择客户");
      return;
    }

    if (!data.claimReason) {
      toast.error("请填写保修原因");
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
        unitPrice: String(item.unitPrice || "0"),
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

  const handleSearchPart = async (index: number) => {
    const sku = skuInputs[index]?.trim();
    if (!sku) {
      toast.error("请输入配件号");
      return;
    }

    setSearchingIndex(index);
    try {
      const results = await utils.client.parts.getBySku.query({ sku });
      
      if (!results || results.length === 0) {
        toast.error(`未找到配件号 ${sku}`);
        setSearchingIndex(null);
        return;
      }

      if (results.length === 1) {
        const part = results[0];
        setValue(`items.${index}.partId`, part.id);
        if (part.unitPrice) {
          setValue(`items.${index}.unitPrice`, String(part.unitPrice));
        }
        toast.success(`已填充配件: ${part.lineCodeName} - ${part.sku} - ${part.name}`);
      } else {
        setPartOptions(results);
        setSelectingForIndex(index);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("查询失败，请重试");
    } finally {
      setSearchingIndex(null);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setLocation("/warranties")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <h1 className="text-3xl font-bold">创建保修单</h1>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="warrantyNumber">保修单号 *</Label>
                <Input
                  id="warrantyNumber"
                  {...register("warrantyNumber")}
                  required
                />
              </div>
              <div>
                <Label htmlFor="customer">客户 *</Label>
                <Select
                  onValueChange={(value) => setValue("customerId", parseInt(value))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择客户" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerNumber">客户编号</Label>
                <Input
                  id="customerNumber"
                  {...register("customerNumber")}
                />
              </div>
              <div>
                <Label htmlFor="originalInvoiceNumber">原始发票号</Label>
                <Input
                  id="originalInvoiceNumber"
                  {...register("originalInvoiceNumber")}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="claimReason">保修原因 *</Label>
              <Textarea
                id="claimReason"
                {...register("claimReason")}
                required
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="notes">备注</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                rows={3}
              />
            </div>

            {/* Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>配件明细</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ partId: 0, quantity: 1, unitPrice: "0" })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  添加配件
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>配件号 (SKU)</TableHead>
                    <TableHead>Line Code</TableHead>
                    <TableHead>配件名称</TableHead>
                    <TableHead>数量</TableHead>
                    <TableHead>单价</TableHead>
                    <TableHead>原始发票</TableHead>
                    <TableHead>小计</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => {
                    const selectedPart = parts?.find(p => p.id === watchItems[index]?.partId);
                    const unitPrice = parseFloat(watchItems[index]?.unitPrice) || 
                                    (selectedPart?.unitPrice ? parseFloat(selectedPart.unitPrice) : 0);
                    const subtotal = unitPrice * (watchItems[index]?.quantity || 0);

                    return (
                      <TableRow key={field.id}>
                        <TableCell>
                          <div className="flex gap-2">
                            <Input
                              placeholder="输入配件号"
                              value={skuInputs[index] || ""}
                              onChange={(e) => setSkuInputs({ ...skuInputs, [index]: e.target.value })}
                              className="w-32"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleSearchPart(index)}
                              disabled={searchingIndex === index}
                            >
                              <Search className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {selectedPart?.lineCode?.name || "-"}
                        </TableCell>
                        <TableCell>
                          {selectedPart?.name || "-"}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...register(`items.${index}.unitPrice` as const)}
                            className="w-32"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {watchItems[index]?.selectedInvoiceNumber || "-"}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const part = parts?.find(p => p.id === watchItems[index]?.partId);
                                if (part) {
                                  handleSearchSalesHistory(part.sku, index);
                                }
                              }}
                            >
                              <Search className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>¥{subtotal.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex justify-end">
                <div className="text-lg font-semibold">
                  总计: ¥{calculateTotal().toFixed(2)}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/warranties")}
              >
                取消
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "创建中..." : "创建保修单"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Sales History Dialog */}
      <Dialog open={salesHistory.length > 0} onOpenChange={() => {
        setSearchingIndex(null);
        setSalesHistory([]);
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>选择原始销售记录</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {salesHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                没有找到相关销售记录
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>发票号</TableHead>
                    <TableHead>日期</TableHead>
                    <TableHead>数量</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono">{record.invoiceNumber}</TableCell>
                      <TableCell>{new Date(record.invoiceDate).toLocaleDateString()}</TableCell>
                      <TableCell>{record.quantity}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleSelectSalesRecord(record, searchingIndex!)}
                        >
                          选择
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
                if (selectedPart.unitPrice) {
                  setValue(`items.${selectingForIndex}.unitPrice`, String(selectedPart.unitPrice));
                }
                toast.success(`已选择: ${selectedPart.lineCodeName} - ${selectedPart.sku}`);
                setSelectingForIndex(null);
                setPartOptions([]);
              }
            }}
          >
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {partOptions.map((part) => (
                <div
                  key={part.id}
                  className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent cursor-pointer"
                  onClick={() => {
                    const radio = document.getElementById(`part-${part.id}`) as HTMLButtonElement;
                    radio?.click();
                  }}
                >
                  <RadioGroupItem value={part.id.toString()} id={`part-${part.id}`} />
                  <label className="flex-1 cursor-pointer" htmlFor={`part-${part.id}`}>
                    <div className="font-medium">Line Code: {part.lineCodeName || "N/A"}</div>
                    <div className="text-sm text-muted-foreground">{part.name}</div>
                    <div className="text-sm font-semibold mt-1">单价: ${part.unitPrice || "0.00"}</div>
                  </label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </DialogContent>
      </Dialog>
    </div>
  );
}
