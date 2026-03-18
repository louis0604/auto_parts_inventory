import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Car, Search, Plus, ChevronRight } from "lucide-react";
import { Link } from "wouter";

export default function VehicleLookup() {
  // Selected vehicle state
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMakeId, setSelectedMakeId] = useState<number | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [selectedEngineId, setSelectedEngineId] = useState<number | null>(null);
  const [partSearch, setPartSearch] = useState("");

  // Dialog state for adding new vehicle data
  const [showAddMake, setShowAddMake] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [showAddEngine, setShowAddEngine] = useState(false);
  const [newMakeName, setNewMakeName] = useState("");
  const [newModelName, setNewModelName] = useState("");
  const [newEngineCode, setNewEngineCode] = useState("");
  const [newDisplacement, setNewDisplacement] = useState("");
  const [newCylinders, setNewCylinders] = useState("");
  const [newFuelType, setNewFuelType] = useState("Gas");

  // Data queries
  const { data: makes, refetch: refetchMakes } = trpc.vehicles.getMakes.useQuery();
  const { data: models, refetch: refetchModels } = trpc.vehicles.getModels.useQuery(
    selectedMakeId ?? 0,
    { enabled: !!selectedMakeId }
  );
  const { data: engines, refetch: refetchEngines } = trpc.vehicles.getEngines.useQuery(
    { year: selectedYear ?? 0, makeId: selectedMakeId ?? 0, modelId: selectedModelId ?? 0 },
    { enabled: !!(selectedYear && selectedMakeId && selectedModelId) }
  );
  const { data: parts } = trpc.parts.list.useQuery();

  // Generate year list (current year + 2 down to 1960)
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear() + 2;
    const result: number[] = [];
    for (let y = currentYear; y >= 1960; y--) {
      result.push(y);
    }
    return result;
  }, []);

  // Selected vehicle info
  const selectedMake = makes?.find(m => m.id === selectedMakeId);
  const selectedModel = models?.find(m => m.id === selectedModelId);
  const selectedEngine = engines?.find(e => e.id === selectedEngineId);

  // Filter parts based on search
  const filteredParts = useMemo(() => {
    if (!parts) return [];
    if (!partSearch.trim()) return parts.slice(0, 50);
    const q = partSearch.toLowerCase();
    return parts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.description?.toLowerCase().includes(q))
    ).slice(0, 100);
  }, [parts, partSearch]);

  // Mutations
  const createMakeMutation = trpc.vehicles.createMake.useMutation({
    onSuccess: () => {
      toast.success("品牌已添加");
      setNewMakeName("");
      setShowAddMake(false);
      refetchMakes();
    },
    onError: (e) => toast.error(`添加失败: ${e.message}`),
  });

  const createModelMutation = trpc.vehicles.createModel.useMutation({
    onSuccess: () => {
      toast.success("车型已添加");
      setNewModelName("");
      setShowAddModel(false);
      refetchModels();
    },
    onError: (e) => toast.error(`添加失败: ${e.message}`),
  });

  const createEngineMutation = trpc.vehicles.createEngine.useMutation({
    onSuccess: () => {
      toast.success("发动机已添加");
      setNewEngineCode("");
      setNewDisplacement("");
      setNewCylinders("");
      setShowAddEngine(false);
      refetchEngines();
    },
    onError: (e) => toast.error(`添加失败: ${e.message}`),
  });

  const handleReset = () => {
    setSelectedYear(null);
    setSelectedMakeId(null);
    setSelectedModelId(null);
    setSelectedEngineId(null);
    setPartSearch("");
  };

  const vehicleLabel = [
    selectedYear,
    selectedMake?.name,
    selectedModel?.name,
    selectedEngine?.engineCode,
  ].filter(Boolean).join(" ");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Car className="h-8 w-8" />
            车辆查询
          </h1>
          <p className="text-muted-foreground mt-1">按车辆年份、品牌、型号查询适配配件</p>
        </div>
        {vehicleLabel && (
          <Badge variant="outline" className="text-base px-4 py-2">
            {vehicleLabel}
          </Badge>
        )}
      </div>

      {/* Vehicle Selection Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">选择车辆</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Year */}
            <div className="space-y-2">
              <Label>年份</Label>
              <Select
                value={selectedYear?.toString() ?? ""}
                onValueChange={(v) => {
                  setSelectedYear(Number(v));
                  setSelectedEngineId(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择年份" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {years.map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Make */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>品牌 (Make)</Label>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowAddMake(true)}>
                  <Plus className="h-3 w-3 mr-1" />添加
                </Button>
              </div>
              <Select
                value={selectedMakeId?.toString() ?? ""}
                onValueChange={(v) => {
                  setSelectedMakeId(Number(v));
                  setSelectedModelId(null);
                  setSelectedEngineId(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择品牌" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {makes?.map(m => (
                    <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>车型 (Model)</Label>
                {selectedMakeId && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowAddModel(true)}>
                    <Plus className="h-3 w-3 mr-1" />添加
                  </Button>
                )}
              </div>
              <Select
                value={selectedModelId?.toString() ?? ""}
                onValueChange={(v) => {
                  setSelectedModelId(Number(v));
                  setSelectedEngineId(null);
                }}
                disabled={!selectedMakeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedMakeId ? "选择车型" : "请先选择品牌"} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {models?.map(m => (
                    <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Engine */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>发动机 (Engine)</Label>
                {selectedYear && selectedMakeId && selectedModelId && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowAddEngine(true)}>
                    <Plus className="h-3 w-3 mr-1" />添加
                  </Button>
                )}
              </div>
              <Select
                value={selectedEngineId?.toString() ?? ""}
                onValueChange={(v) => setSelectedEngineId(Number(v))}
                disabled={!(selectedYear && selectedMakeId && selectedModelId)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    selectedYear && selectedMakeId && selectedModelId
                      ? (engines?.length === 0 ? "无发动机数据" : "选择发动机")
                      : "请先选择年份/品牌/车型"
                  } />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {engines?.map(e => (
                    <SelectItem key={e.id} value={e.id.toString()}>
                      {e.engineCode || `${e.displacement || ""} ${e.cylinders ? e.cylinders + "缸" : ""} ${e.fuelType || ""}`.trim() || "未知发动机"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {vehicleLabel && (
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1 p-3 bg-muted rounded-lg text-sm">
                <span className="font-medium">当前车辆：</span>
                <span className="ml-2 font-mono">{vehicleLabel}</span>
              </div>
              <Button variant="outline" onClick={handleReset}>重置</Button>
              <Link href={`/sales-invoices/create?vehicle=${encodeURIComponent(vehicleLabel)}`}>
                <Button>
                  <ChevronRight className="h-4 w-4 mr-1" />
                  创建销售发票
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parts Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">配件查询</CardTitle>
            {vehicleLabel && (
              <Badge variant="secondary">适用于: {vehicleLabel}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索配件号、名称或描述..."
                value={partSearch}
                onChange={(e) => setPartSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {filteredParts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Line Code</TableHead>
                  <TableHead>配件号 (SKU)</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>库存</TableHead>
                  <TableHead>零售价</TableHead>
                  <TableHead>建议价</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParts.map((part) => (
                  <TableRow key={part.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-sm font-semibold">
                      {(part as any).lineCode?.name || "-"}
                    </TableCell>
                    <TableCell className="font-mono">{part.sku}</TableCell>
                    <TableCell>{part.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-48 truncate">
                      {part.description || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        (part.stockQuantity ?? 0) > (part.minStockThreshold ?? 0)
                          ? "default"
                          : "destructive"
                      }>
                        {part.stockQuantity ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${parseFloat(part.retail || "0").toFixed(2)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      ${parseFloat(part.listPrice || part.retail || "0").toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Car className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{partSearch ? "未找到匹配的配件" : "请输入配件号或名称进行搜索"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Make Dialog */}
      <Dialog open={showAddMake} onOpenChange={setShowAddMake}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加汽车品牌</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>品牌名称 (英文大写)</Label>
              <Input
                value={newMakeName}
                onChange={(e) => setNewMakeName(e.target.value.toUpperCase())}
                placeholder="例如: HONDA, TOYOTA, BMW"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddMake(false)}>取消</Button>
              <Button
                onClick={() => createMakeMutation.mutate({ name: newMakeName })}
                disabled={!newMakeName.trim() || createMakeMutation.isPending}
              >
                添加
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Model Dialog */}
      <Dialog open={showAddModel} onOpenChange={setShowAddModel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加车型 - {selectedMake?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>车型名称 (英文大写)</Label>
              <Input
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value.toUpperCase())}
                placeholder="例如: CIVIC, ACCORD, CAMRY"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddModel(false)}>取消</Button>
              <Button
                onClick={() => createModelMutation.mutate({ makeId: selectedMakeId!, name: newModelName })}
                disabled={!newModelName.trim() || createModelMutation.isPending}
              >
                添加
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Engine Dialog */}
      <Dialog open={showAddEngine} onOpenChange={setShowAddEngine}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              添加发动机 - {selectedYear} {selectedMake?.name} {selectedModel?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>发动机代码</Label>
                <Input
                  value={newEngineCode}
                  onChange={(e) => setNewEngineCode(e.target.value)}
                  placeholder="例如: 4-1799 1.8L SOHC"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>排量</Label>
                <Input
                  value={newDisplacement}
                  onChange={(e) => setNewDisplacement(e.target.value)}
                  placeholder="例如: 1.8L"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>气缸数</Label>
                <Input
                  type="number"
                  value={newCylinders}
                  onChange={(e) => setNewCylinders(e.target.value)}
                  placeholder="例如: 4"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>燃料类型</Label>
                <Select value={newFuelType} onValueChange={setNewFuelType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gas">汽油 (Gas)</SelectItem>
                    <SelectItem value="Diesel">柴油 (Diesel)</SelectItem>
                    <SelectItem value="Hybrid">混合动力 (Hybrid)</SelectItem>
                    <SelectItem value="Electric">纯电动 (Electric)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddEngine(false)}>取消</Button>
              <Button
                onClick={() => createEngineMutation.mutate({
                  year: selectedYear!,
                  makeId: selectedMakeId!,
                  modelId: selectedModelId!,
                  engineCode: newEngineCode || undefined,
                  displacement: newDisplacement || undefined,
                  cylinders: newCylinders ? Number(newCylinders) : undefined,
                  fuelType: newFuelType,
                })}
                disabled={createEngineMutation.isPending}
              >
                添加
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
