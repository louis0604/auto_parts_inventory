import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ChevronDown, ChevronRight, Package, Car, Tag } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PartResult {
  id: number;
  sku: string;
  name: string;
  manufacturer: string | null;
  lineCode: string | null;
  stockQuantity: number | null;
  retail: string | null;
  listPrice: string | null;
  replCost: string | null;
  partGroupId: number | null;
  partGroupName: string | null;
  categoryId: number | null;
  categoryName: string | null;
  yearRange: string | null;
  fitmentNotes: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PartLookup() {
  // Vehicle filters
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMakeId, setSelectedMakeId] = useState<string>("");
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  // Category / Group filters
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  // Text search
  const [searchText, setSearchText] = useState("");
  const [searchInput, setSearchInput] = useState("");
  // Collapsed groups
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // ── Data queries ────────────────────────────────────────────────────────────
  const { data: makes = [] } = trpc.vehicles.getMakes.useQuery();
  const { data: models = [] } = trpc.vehicles.getModels.useQuery(
    Number(selectedMakeId),
    { enabled: !!selectedMakeId }
  );
  const { data: categories = [] } = trpc.partCategories.list.useQuery();
  const { data: groups = [] } = trpc.partGroups.listByCategory.useQuery(
    Number(selectedCategoryId),
    { enabled: !!selectedCategoryId }
  );

  // Build query params – only include defined values
  const queryParams = useMemo(() => ({
    year: selectedYear ? Number(selectedYear) : undefined,
    makeId: selectedMakeId ? Number(selectedMakeId) : undefined,
    modelId: selectedModelId ? Number(selectedModelId) : undefined,
    categoryId: selectedCategoryId ? Number(selectedCategoryId) : undefined,
    groupId: selectedGroupId ? Number(selectedGroupId) : undefined,
    searchText: searchText || undefined,
  }), [selectedYear, selectedMakeId, selectedModelId, selectedCategoryId, selectedGroupId, searchText]);

  const { data: results = [], isLoading, isFetching } = trpc.partLookup.search.useQuery(
    queryParams,
    { enabled: !!(selectedYear || selectedMakeId || selectedCategoryId || selectedGroupId || searchText) }
  );

  // ── Derived data ────────────────────────────────────────────────────────────

  // Group results by partGroupName (or "Uncategorized")
  const groupedResults = useMemo(() => {
    const map = new Map<string, PartResult[]>();
    for (const part of results as PartResult[]) {
      const key = part.partGroupName ?? "Uncategorized";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(part);
    }
    return map;
  }, [results]);

  // Year range: 1960 – current year + 2
  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    const years: number[] = [];
    for (let y = current + 2; y >= 1960; y--) years.push(y);
    return years;
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSearch = () => {
    setSearchText(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) next.delete(groupName);
      else next.add(groupName);
      return next;
    });
  };

  const handleMakeChange = (value: string) => {
    setSelectedMakeId(value);
    setSelectedModelId("");
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
    setSelectedGroupId("");
  };

  const handleReset = () => {
    setSelectedYear("");
    setSelectedMakeId("");
    setSelectedModelId("");
    setSelectedCategoryId("");
    setSelectedGroupId("");
    setSearchText("");
    setSearchInput("");
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  const hasFilter = !!(selectedYear || selectedMakeId || selectedCategoryId || selectedGroupId || searchText);
  const totalParts = (results as PartResult[]).length;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">配件查询</h1>
            <p className="text-muted-foreground text-sm">按车辆、分类或关键字查询适配配件</p>
          </div>
          {hasFilter && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              重置筛选
            </Button>
          )}
        </div>

        {/* Filter panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="h-4 w-4" />
              车辆 &amp; 分类筛选
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Year */}
              <div className="space-y-1">
                <Label className="text-xs">年份</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="年份" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={String(y)} className="text-xs">
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Make */}
              <div className="space-y-1">
                <Label className="text-xs">品牌 (Make)</Label>
                <Select value={selectedMakeId} onValueChange={handleMakeChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="选择品牌" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {makes.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)} className="text-xs">
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Model */}
              <div className="space-y-1">
                <Label className="text-xs">型号 (Model)</Label>
                <Select
                  value={selectedModelId}
                  onValueChange={setSelectedModelId}
                  disabled={!selectedMakeId}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="选择型号" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {models.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)} className="text-xs">
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <Label className="text-xs">分类 (Category)</Label>
                <Select value={selectedCategoryId} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Group */}
              <div className="space-y-1">
                <Label className="text-xs">分组 (Group)</Label>
                <Select
                  value={selectedGroupId}
                  onValueChange={setSelectedGroupId}
                  disabled={!selectedCategoryId}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="选择分组" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={String(g.id)} className="text-xs">
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search text */}
              <div className="space-y-1">
                <Label className="text-xs">关键字搜索</Label>
                <div className="flex gap-1">
                  <Input
                    className="h-8 text-xs"
                    placeholder="配件号/名称..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <Button size="sm" className="h-8 px-2" onClick={handleSearch}>
                    <Search className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {!hasFilter ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Package className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">请选择筛选条件开始查询</p>
            <p className="text-sm mt-1">选择车辆信息或分类，或输入关键字搜索配件</p>
          </div>
        ) : isLoading || isFetching ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3" />
            <span>查询中...</span>
          </div>
        ) : totalParts === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Search className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">未找到匹配配件</p>
            <p className="text-sm mt-1">请尝试调整筛选条件或关键字</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Summary bar */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
              <Tag className="h-4 w-4" />
              <span>共找到 <strong className="text-foreground">{totalParts}</strong> 个配件，分 <strong className="text-foreground">{groupedResults.size}</strong> 组</span>
            </div>

            {/* Column headers */}
            <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 rounded-md">
              <div className="col-span-3">制造商</div>
              <div className="col-span-1">Line</div>
              <div className="col-span-2">配件号</div>
              <div className="col-span-2">名称/描述</div>
              <div className="col-span-1 text-right">库存</div>
              <div className="col-span-1 text-right">售价</div>
              <div className="col-span-1 text-right">定价</div>
              <div className="col-span-1 text-right">年份</div>
            </div>

            {/* Grouped results */}
            {Array.from(groupedResults.entries()).map(([groupName, parts]) => {
              const isCollapsed = collapsedGroups.has(groupName);
              return (
                <div key={groupName} className="rounded-lg overflow-hidden border border-border">
                  {/* Group header (red row like LaserCat) */}
                  <button
                    className="w-full flex items-center justify-between px-3 py-2 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold transition-colors"
                    onClick={() => toggleGroup(groupName)}
                  >
                    <div className="flex items-center gap-2">
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      <span>{groupName}</span>
                      <Badge variant="secondary" className="bg-red-900 text-white text-xs border-0 ml-1">
                        {parts.length}
                      </Badge>
                    </div>
                  </button>

                  {/* Part rows */}
                  {!isCollapsed && (
                    <div className="divide-y divide-border">
                      {parts.map((part, idx) => (
                        <div
                          key={part.id}
                          className={`grid grid-cols-12 gap-2 px-3 py-2 text-xs hover:bg-muted/40 transition-colors ${
                            idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                          }`}
                        >
                          {/* Row number + manufacturer */}
                          <div className="col-span-3 flex items-start gap-2">
                            <span className="text-muted-foreground w-5 shrink-0">{idx + 1}.</span>
                            <div>
                              <div className="font-semibold text-foreground">
                                {part.manufacturer ?? "—"}
                              </div>
                              {part.fitmentNotes && (
                                <div className="text-muted-foreground text-[10px] mt-0.5">
                                  {part.fitmentNotes}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Line code */}
                          <div className="col-span-1 font-mono text-muted-foreground">
                            {part.lineCode ?? "—"}
                          </div>

                          {/* Part number (SKU) */}
                          <div className="col-span-2 font-mono font-medium text-primary">
                            {part.sku}
                          </div>

                          {/* Description */}
                          <div className="col-span-2 text-muted-foreground truncate" title={part.name}>
                            {part.name}
                          </div>

                          {/* Stock */}
                          <div className="col-span-1 text-right">
                            <span
                              className={
                                (part.stockQuantity ?? 0) > 0
                                  ? "text-green-600 font-medium"
                                  : "text-red-500"
                              }
                            >
                              {part.stockQuantity ?? 0}
                            </span>
                          </div>

                          {/* Sell price (retail) */}
                          <div className="col-span-1 text-right font-medium">
                            {part.retail ? `$${Number(part.retail).toFixed(2)}` : "—"}
                          </div>

                          {/* List price */}
                          <div className="col-span-1 text-right text-muted-foreground">
                            {part.listPrice ? `$${Number(part.listPrice).toFixed(2)}` : "—"}
                          </div>

                          {/* Year range */}
                          <div className="col-span-1 text-right text-muted-foreground">
                            {part.yearRange ?? "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
