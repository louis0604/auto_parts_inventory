import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileSpreadsheet, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { trpc } from "@/lib/trpc";

export function BulkImportPartsPage() {
  const [, setLocation] = useLocation();
  const [importing, setImporting] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);

  const { data: categories } = trpc.partCategories.list.useQuery();
  const { data: suppliers } = trpc.suppliers.list.useQuery();
  const { data: lineCodes } = trpc.lineCodes.list.useQuery();

  const bulkCreateMutation = trpc.parts.bulkCreate.useMutation({
    onSuccess: (result) => {
      toast.success(`成功导入 ${result.success} 个配件`);
      if (result.failed > 0) {
        toast.warning(`${result.failed} 个配件导入失败`);
      }
      setParsedData([]);
      setLocation("/parts");
    },
    onError: (error) => {
      toast.error(`批量导入失败: ${error.message}`);
    },
  });

  const downloadTemplate = () => {
    const template = [
      {
        "PICTURE": "",
        "Line": "DEL",
        "Partnumber": "DL3614",
        "Description": "Oil filter",
        "QOH ": "0",
        "List Price": "15.00",
        "Repl Cost": "10.00",
        "Retail": "13.56",
        "Price 1": "",
        "Price 2": "",
        "Price 3": "",
        "Order Qty": "",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "配件导入模板");
    
    // 设置列宽
    ws['!cols'] = [
      { wch: 12 }, // PICTURE
      { wch: 10 }, // Line
      { wch: 15 }, // Partnumber
      { wch: 25 }, // Description
      { wch: 10 }, // QOH
      { wch: 12 }, // List Price
      { wch: 12 }, // Repl Cost
      { wch: 12 }, // Retail
      { wch: 10 }, // Price 1
      { wch: 10 }, // Price 2
      { wch: 10 }, // Price 3
      { wch: 10 }, // Order Qty
    ];

    XLSX.writeFile(wb, "配件导入模板.xlsx");
    toast.success("模板已下载");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    
    // 使用ExcelJS读取文件以支持图片提取
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        
        // 使用ExcelJS读取文件（支持图片提取）
        const excelWorkbook = new ExcelJS.Workbook();
        await excelWorkbook.xlsx.load(arrayBuffer);
        const excelWorksheet = excelWorkbook.worksheets[0];
        
        // 提取图片信息：建立行号到图片buffer的映射
        const imageMap = new Map<number, { buffer: any; extension: string }>();
        for (const image of excelWorksheet.getImages()) {
          const rowIndex = image.range.tl.nativeRow; // 图片所在行（0-based）
          const media = (excelWorkbook.model as any).media;
          const img = media?.find((m: any) => m.index === image.imageId);
          if (img && img.buffer) {
            imageMap.set(rowIndex, {
              buffer: img.buffer,
              extension: img.extension || 'png'
            });
          }
        }
        
        // 使用xlsx库解析数据（更快）
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          toast.error("Excel文件为空");
          setImporting(false);
          return;
        }

        // 解析数据，适配用户提供的模板格式
        const parsed = jsonData
          .map((row: any, index: number) => {
          // 查找Line Code ID
          const lineCodeStr = row["Line"] || row["lineCode"] || "";
          const lineCode = lineCodes?.find(lc => lc.code === lineCodeStr);

          // 价格字段处理：优先使用List Price作为unitPrice
          const listPrice = row["List Price"] || row["listPrice"] || "";
          const replCost = row["Repl Cost"] || row["replCost"] || "";
          const retail = row["Retail"] || row["retail"] || "";
          
          // unitPrice使用List Price，如果没有则使用Retail，再没有则使用Repl Cost
          const unitPrice = listPrice || retail || replCost || "0.00";

          return {
            sku: String(row["Partnumber"] || row["sku"] || ""),
            name: String(row["Description"] || row["name"] || ""),
            lineCodeId: lineCode?.id || null,
            description: String(row["Description"] || row["description"] || ""),
            // 必填字段：unitPrice
            unitPrice: String(unitPrice),
            // 必填字段：unit（单位），默认为EA
            unit: String(row["Unit"] || row["unit"] || "EA"),
            // 必填字段：minStockThreshold（最小库存阈值），默认为0
            minStockThreshold: Number(row["Min Stock"] || row["minStockThreshold"] || 0),
            // 额外价格字段 - 使用用户模板的字段名
            listPrice: String(listPrice),
            replCost: String(replCost),
            retail: String(retail),
            price1: String(row["Price 1"] || row["price1"] || ""),
            price2: String(row["Price 2"] || row["price2"] || ""),
            price3: String(row["Price 3"] || row["price3"] || ""),
            // Inventory
            stockQuantity: Number(row["QOH "] || row["QOH"] || row["stockQuantity"] || 0),
            orderPoint: Number(row["Order Qty"] || row["orderPoint"] || 0),
            // 图片URL（如果有）
            imageUrl: String(row["PICTURE"] || row["imageUrl"] || ""),
            // 图片base64（如果有嵌入图片）
            imageBase64: (() => {
              const imgData = imageMap.get(index + 1); // +1因为Excel行号从1开始，但有表头行
              if (imgData && imgData.buffer) {
                // 将buffer转换为base64
                const uint8Array = new Uint8Array(imgData.buffer);
                let binary = '';
                for (let i = 0; i < uint8Array.length; i++) {
                  binary += String.fromCharCode(uint8Array[i]);
                }
                return {
                  data: btoa(binary),
                  extension: imgData.extension
                };
              }
              return null;
            })(),
          };
        })
          .filter((item: any) => {
            // 过滤掉SKU为空的行（Excel模板末尾可能有空行）
            return item.sku && item.sku.trim().length > 0;
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
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => setLocation("/parts")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回配件列表
        </Button>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6" />
            批量导入配件
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="excel-upload"
                disabled={importing}
              />
              <label htmlFor="excel-upload" className="cursor-pointer block">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-base text-muted-foreground mb-2">
                  {importing ? "正在解析..." : "点击选择Excel文件"}
                </p>
                <p className="text-sm text-muted-foreground">
                  支持 .xlsx 和 .xls 格式
                </p>
              </label>
            </div>
          </div>

          {/* 数据预览 */}
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <Label>3. 数据预览</Label>
              <div className="border rounded-lg p-4 max-h-80 overflow-auto">
                <p className="text-sm mb-4">
                  共 <strong className="text-lg">{parsedData.length}</strong> 条数据待导入
                </p>
                <div className="space-y-2">
                  {parsedData.slice(0, 10).map((item, index) => (
                    <div key={index} className="p-3 bg-muted rounded flex justify-between items-center">
                      <div>
                        <strong className="text-base">{item.sku}</strong>
                        <span className="text-sm text-muted-foreground ml-2">- {item.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {!item.lineCodeId && (
                          <span className="text-destructive">(产品线未找到)</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {parsedData.length > 10 && (
                    <p className="text-muted-foreground text-center pt-2">
                      ...还有 {parsedData.length - 10} 条数据
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 导入按钮 */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setParsedData([]);
                setLocation("/parts");
              }}
              size="lg"
            >
              取消
            </Button>
            <Button
              onClick={handleImport}
              disabled={parsedData.length === 0 || bulkCreateMutation.isPending}
              size="lg"
            >
              {bulkCreateMutation.isPending ? "导入中..." : `确认导入 ${parsedData.length} 条数据`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
