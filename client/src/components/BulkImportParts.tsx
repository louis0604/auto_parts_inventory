import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { trpc } from "@/lib/trpc";

type BulkImportPartsProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function BulkImportParts({ open, onOpenChange, onSuccess }: BulkImportPartsProps) {
  const [importing, setImporting] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);

  const { data: categories } = trpc.partCategories.list.useQuery();
  const { data: suppliers } = trpc.suppliers.list.useQuery();

  const bulkCreateMutation = trpc.parts.bulkCreate.useMutation({
    onSuccess: (result) => {
      toast.success(`成功导入 ${result.success} 个配件`);
      if (result.failed > 0) {
        toast.warning(`${result.failed} 个配件导入失败`);
      }
      setParsedData([]);
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`批量导入失败: ${error.message}`);
    },
  });

  const downloadTemplate = () => {
    const template = [
      {
        "SKU编号": "PART-001",
        "配件名称": "示例配件",
        "配件描述": "这是一个示例配件",
        "分类名称": "发动机部件",
        "供应商名称": "示例供应商",
        "单价": "100.00",
        "当前库存": "50",
        "最低库存": "10",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "配件导入模板");
    
    // 设置列宽
    ws['!cols'] = [
      { wch: 15 }, // SKU编号
      { wch: 20 }, // 配件名称
      { wch: 30 }, // 配件描述
      { wch: 15 }, // 分类名称
      { wch: 20 }, // 供应商名称
      { wch: 10 }, // 单价
      { wch: 10 }, // 当前库存
      { wch: 10 }, // 最低库存
    ];

    XLSX.writeFile(wb, "配件导入模板.xlsx");
    toast.success("模板已下载");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          toast.error("Excel文件为空");
          setImporting(false);
          return;
        }

        // 解析数据
        const parsed = jsonData.map((row: any) => {
          // 查找分类ID
          const categoryName = row["分类名称"] || row["category"] || "";
          const category = categories?.find((c: any) => c.name === categoryName);

          // 查找供应商ID
          const supplierName = row["供应商名称"] || row["supplier"] || "";
          const supplier = suppliers?.find(s => s.name === supplierName);

          return {
            sku: row["SKU编号"] || row["sku"] || "",
            name: row["配件名称"] || row["name"] || "",
            description: row["配件描述"] || row["description"] || "",
            categoryId: category?.id || null,
            supplierId: supplier?.id || null,
            unitPrice: String(row["单价"] || row["price"] || "0"),
            currentStock: Number(row["当前库存"] || row["stock"] || 0),
            minStock: Number(row["最低库存"] || row["minStock"] || 0),
          };
        });

        setParsedData(parsed);
        toast.success(`已解析 ${parsed.length} 条数据，请确认后导入`);
      } catch (error) {
        console.error("解析Excel失败:", error);
        toast.error("解析Excel文件失败，请检查文件格式");
      } finally {
        setImporting(false);
      }
    };

    reader.readAsArrayBuffer(file);
    e.target.value = ""; // 重置input以允许重复上传同一文件
  };

  const handleImport = () => {
    if (parsedData.length === 0) {
      toast.error("没有可导入的数据");
      return;
    }

    bulkCreateMutation.mutate(parsedData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            批量导入配件
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 步骤说明 */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <h4 className="font-semibold text-sm">导入步骤：</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>下载Excel模板文件</li>
              <li>按照模板格式填写配件数据</li>
              <li>上传填写好的Excel文件</li>
              <li>确认数据无误后点击导入</li>
            </ol>
          </div>

          {/* 模板下载 */}
          <div className="space-y-2">
            <Label>1. 下载模板</Label>
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              下载Excel模板
            </Button>
          </div>

          {/* 文件上传 */}
          <div className="space-y-2">
            <Label>2. 上传Excel文件</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="excel-upload"
                disabled={importing}
              />
              <label htmlFor="excel-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {importing ? "正在解析..." : "点击选择Excel文件"}
                </p>
              </label>
            </div>
          </div>

          {/* 数据预览 */}
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <Label>3. 数据预览</Label>
              <div className="border rounded-lg p-4 max-h-60 overflow-auto">
                <p className="text-sm mb-2">
                  共 <strong>{parsedData.length}</strong> 条数据待导入
                </p>
                <div className="space-y-1 text-xs">
                  {parsedData.slice(0, 5).map((item, index) => (
                    <div key={index} className="p-2 bg-muted rounded">
                      <strong>{item.sku}</strong> - {item.name}
                      {!item.categoryId && (
                        <span className="text-destructive ml-2">(分类未找到)</span>
                      )}
                      {!item.supplierId && (
                        <span className="text-destructive ml-2">(供应商未找到)</span>
                      )}
                    </div>
                  ))}
                  {parsedData.length > 5 && (
                    <p className="text-muted-foreground text-center pt-2">
                      ...还有 {parsedData.length - 5} 条数据
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 导入按钮 */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setParsedData([]);
                onOpenChange(false);
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleImport}
              disabled={parsedData.length === 0 || bulkCreateMutation.isPending}
            >
              {bulkCreateMutation.isPending ? "导入中..." : `确认导入 ${parsedData.length} 条数据`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
