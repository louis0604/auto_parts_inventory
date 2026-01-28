import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useForm, useFieldArray } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type WarrantyFormData = {
  warrantyNumber: string;
  customerId: number;
  customerNumber?: string;
  originalInvoiceNumber?: string;
  claimReason: string;
  notes?: string;
  items: {
    partId: number;
    partSku?: string;
    quantity: number;
    unitPrice: string;
    selectedInvoiceNumber?: string;
  }[];
};

interface WarrantyFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function WarrantyFormWithSalesHistory({ open, onClose, onSuccess }: WarrantyFormProps) {
  const [searchingSku, setSearchingSku] = useState<string>("");
  const [searchingIndex, setSearchingIndex] = useState<number | null>(null);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [selectedSalesRecord, setSelectedSalesRecord] = useState<any>(null);

  const { data: customers } = trpc.customers.list.useQuery();
  const { data: parts } = trpc.parts.list.useQuery();
  const getSalesHistory = trpc.warranties.getSalesHistory.useQuery(searchingSku, {
    enabled: false,
  });

  const createMutation = trpc.warranties.create.useMutation({
    onSuccess: () => {
      toast.success("保修单创建成功");
      onClose();
      onSuccess();
      reset();
      setSalesHistory([]);
      setSelectedSalesRecord(null);
    },
    onError: (error) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });

  const { register, handleSubmit, reset, control, watch, setValue } = useForm<WarrantyFormData>({
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

  const handleSearchSalesHistory = async (sku: string, index: number) => {
    if (!sku.trim()) {
      toast.error("请输入配件SKU");
      return;
    }

    setSearchingSku(sku);
    setSearchingIndex(index);
    
    try {
      const result = await getSalesHistory.refetch();
      if (result.data && result.data.length > 0) {
        setSalesHistory(result.data);
        toast.success(`找到 ${result.data.length} 条销售记录`);
      } else {
        setSalesHistory([]);
        toast.info("未找到该配件的销售记录");
      }
    } catch (error) {
      toast.error("查询失败");
    }
  };

  const handleSelectSalesRecord = (record: any, index: number) => {
    setSelectedSalesRecord(record);
    
    // Find the part by SKU
    const part = parts?.find(p => p.sku === searchingSku);
    if (part) {
      setValue(`items.${index}.partId`, part.id);
      setValue(`items.${index}.quantity`, record.quantity);
      setValue(`items.${index}.unitPrice`, record.unitPrice);
      setValue(`items.${index}.selectedInvoiceNumber`, record.invoiceNumber);
      
      // Auto-fill customer if not selected
      if (!watch("customerId")) {
        const customer = customers?.find(c => c.name === record.customerName);
        if (customer) {
          setValue("customerId", customer.id);
        }
      }
      
      // Auto-fill original invoice number
      setValue("originalInvoiceNumber", record.invoiceNumber);
    }
    
    toast.success(`已选择销售单：${record.invoiceNumber}`);
    setSalesHistory([]);
    setSearchingIndex(null);
  };

  const onSubmit = (data: WarrantyFormData) => {
    if (!data.customerId) {
      toast.error("请选择客户");
      return;
    }

    if (!data.claimReason) {
      toast.error("请选择保修原因");
      return;
    }

    const validItems = data.items.filter(item => item.partId > 0 && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error("请至少添加一个配件");
      return;
    }

    createMutation.mutate({
      warrantyNumber: data.warrantyNumber,
      customerId: data.customerId,
      customerNumber: data.customerNumber,
      originalInvoiceNumber: data.originalInvoiceNumber,
      claimReason: data.claimReason,
      notes: data.notes,
      items: validItems.map(item => ({
        partId: item.partId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });
  };

  const watchedItems = watch("items");
  const totalAmount = watchedItems.reduce((sum, item) => {
    return sum + (parseFloat(item.unitPrice) || 0) * (item.quantity || 0);
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建保修单</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="warrantyNumber">保修单号 *</Label>
              <Input id="warrantyNumber" {...register("warrantyNumber")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerId">客户 *</Label>
              <Select
                value={watch("customerId")?.toString() || ""}
                onValueChange={(value) => setValue("customerId", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择客户（或通过销售记录自动填充）" />
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
            <div className="space-y-2">
              <Label htmlFor="customerNumber">客户编号</Label>
              <Input id="customerNumber" {...register("customerNumber")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="originalInvoiceNumber">原始销售单号</Label>
              <Input 
                id="originalInvoiceNumber" 
                {...register("originalInvoiceNumber")} 
                placeholder="通过销售记录自动填充"
                className={watch("originalInvoiceNumber") ? "bg-green-50 border-green-300" : ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="claimReason">保修原因 *</Label>
            <Select
              value={watch("claimReason") || ""}
              onValueChange={(value) => setValue("claimReason", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择保修原因" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="defective">产品缺陷</SelectItem>
                <SelectItem value="malfunction">功能故障</SelectItem>
                <SelectItem value="damaged">运输损坏</SelectItem>
                <SelectItem value="other">其他原因</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">保修配件</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ partId: 0, quantity: 1, unitPrice: "0" })}
              >
                <Plus className="h-4 w-4 mr-1" />
                添加配件
              </Button>
            </div>

            {fields.map((field, index) => {
              const selectedPart = parts?.find(p => p.id === watch(`items.${index}.partId`));
              const quantity = watch(`items.${index}.quantity`) || 0;
              const unitPrice = parseFloat(watch(`items.${index}.unitPrice`) || "0");
              const subtotal = quantity * unitPrice;
              const selectedInvoice = watch(`items.${index}.selectedInvoiceNumber`);

              return (
                <Card key={field.id} className="relative">
                  <CardContent className="pt-6 space-y-4">
                    {/* SKU Search */}
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label>配件SKU</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            placeholder="输入SKU查询销售历史..."
                            value={watch(`items.${index}.partSku`) || ""}
                            onChange={(e) => setValue(`items.${index}.partSku`, e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const sku = watch(`items.${index}.partSku`);
                              if (sku) handleSearchSalesHistory(sku, index);
                            }}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mt-7"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    {/* Sales History Results */}
                    {searchingIndex === index && salesHistory.length > 0 && (
                      <div className="border rounded-lg p-4 bg-blue-50 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">销售历史记录</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSalesHistory([]);
                              setSearchingIndex(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>销售单号</TableHead>
                              <TableHead>日期</TableHead>
                              <TableHead>数量</TableHead>
                              <TableHead>单价</TableHead>
                              <TableHead>客户</TableHead>
                              <TableHead className="text-right">操作</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {salesHistory.map((record) => (
                              <TableRow key={record.invoiceId}>
                                <TableCell className="font-mono text-sm">{record.invoiceNumber}</TableCell>
                                <TableCell>{new Date(record.invoiceDate).toLocaleDateString("zh-CN")}</TableCell>
                                <TableCell>{record.quantity}</TableCell>
                                <TableCell>¥{parseFloat(record.unitPrice).toFixed(2)}</TableCell>
                                <TableCell>{record.customerName}</TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => handleSelectSalesRecord(record, index)}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    选择
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Part Details */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-2">
                        <Label>配件 *</Label>
                        <Select
                          value={watch(`items.${index}.partId`)?.toString() || ""}
                          onValueChange={(value) => {
                            const partId = parseInt(value);
                            setValue(`items.${index}.partId`, partId);
                            const part = parts?.find(p => p.id === partId);
                            if (part) {
                              setValue(`items.${index}.unitPrice`, part.unitPrice);
                              setValue(`items.${index}.partSku`, part.sku);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择配件" />
                          </SelectTrigger>
                          <SelectContent>
                            {parts?.map((part) => (
                              <SelectItem key={part.id} value={part.id.toString()}>
                                {part.sku} - {part.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedPart && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {selectedPart.description || "无描述"}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>数量 *</Label>
                        <Input
                          type="number"
                          min="1"
                          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        />
                      </div>
                      <div>
                        <Label>单价 *</Label>
                        <Input {...register(`items.${index}.unitPrice`)} />
                      </div>
                    </div>

                    {/* Selected Invoice Badge */}
                    {selectedInvoice && (
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="bg-green-50 border-green-300">
                          关联销售单：{selectedInvoice}
                        </Badge>
                      </div>
                    )}

                    {/* Subtotal */}
                    <div className="flex justify-end">
                      <div className="text-right">
                        <Label className="text-muted-foreground">小计</Label>
                        <div className="text-lg font-semibold">¥{subtotal.toFixed(2)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Total and Notes */}
          <div className="space-y-4">
            <div className="flex justify-end">
              <div className="text-right">
                <Label className="text-muted-foreground">总金额</Label>
                <div className="text-2xl font-bold text-primary">¥{totalAmount.toFixed(2)}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">备注</Label>
              <Textarea id="notes" {...register("notes")} rows={2} placeholder="其他备注信息..." />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "创建中..." : "创建保修单"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
