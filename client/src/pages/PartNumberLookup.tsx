import { useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

export default function PartNumberLookup() {
  const [input, setInput] = useState("");
  const [partNumber, setPartNumber] = useState("");

  const { data: parts = [], isFetching, isFetched } = trpc.parts.getBySku.useQuery(
    { sku: partNumber },
    { enabled: !!partNumber }
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Part Number 查询</h1>
        <p className="text-sm text-muted-foreground">输入 Part Number，快速查看品牌、库存、价格、描述和替代号码</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="例如：DL3614"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setPartNumber(input.trim());
              }}
            />
            <Button onClick={() => setPartNumber(input.trim())} disabled={!input.trim() || isFetching}>
              <Search className="h-4 w-4 mr-1" /> 查询
            </Button>
          </div>
        </CardContent>
      </Card>

      {isFetched && !isFetching && partNumber && parts.length === 0 && (
        <Card><CardContent className="py-6 text-sm text-muted-foreground">未找到 Part Number：{partNumber}</CardContent></Card>
      )}

      {parts.map((part) => (
        <Card key={part.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>{part.sku}</span>
              <Badge variant="outline">库存 {part.stockQuantity ?? 0}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm md:grid-cols-2">
            <div><span className="text-muted-foreground">品牌：</span>{part.manufacturer || "-"}</div>
            <div><span className="text-muted-foreground">价格：</span>${part.retail || part.listPrice || part.unitPrice || "0.00"}</div>
            <div className="md:col-span-2"><span className="text-muted-foreground">描述：</span>{part.description || part.name || "-"}</div>
            <div className="md:col-span-2"><span className="text-muted-foreground">替代号码：</span>{part.mfgPartNumber || "-"}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
