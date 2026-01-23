import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AIRestocking() {
  const { data, isLoading, refetch, isRefetching } = trpc.ai.restockingSuggestions.useQuery();

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "高":
      case "high":
        return <Badge variant="destructive" className="neon-text">高优先级</Badge>;
      case "中":
      case "medium":
        return <Badge variant="outline" className="neon-border-cyan">中优先级</Badge>;
      case "低":
      case "low":
        return <Badge variant="secondary">低优先级</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card className="neon-border-pink">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 neon-text-pink">
              <Sparkles className="h-6 w-6" />
              AI智能补货建议
            </CardTitle>
            <Button
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="neon-border-cyan"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
              重新分析
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
              <p className="text-muted-foreground">AI正在分析库存数据...</p>
            </div>
          ) : data ? (
            <>
              {data.analysis && (
                <Alert className="neon-border-cyan">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="neon-text-cyan">分析总结</AlertTitle>
                  <AlertDescription className="mt-2 text-foreground">
                    {data.analysis}
                  </AlertDescription>
                </Alert>
              )}

              {data.suggestions && data.suggestions.length > 0 ? (
                <div className="border rounded-lg neon-border-pink overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-card/50">
                        <TableHead className="text-accent">SKU</TableHead>
                        <TableHead className="text-accent">配件名称</TableHead>
                        <TableHead className="text-accent">建议补货数量</TableHead>
                        <TableHead className="text-accent">优先级</TableHead>
                        <TableHead className="text-accent">补货理由</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.suggestions.map((suggestion: any, index: number) => (
                        <TableRow key={index} className="hover:bg-card/30">
                          <TableCell className="font-mono text-sm">{suggestion.sku}</TableCell>
                          <TableCell className="font-medium">{suggestion.name}</TableCell>
                          <TableCell>
                            <span className="text-lg font-bold text-accent neon-text">
                              {suggestion.suggestedQuantity}
                            </span>
                          </TableCell>
                          <TableCell>{getPriorityBadge(suggestion.priority)}</TableCell>
                          <TableCell className="max-w-md">
                            <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">当前无需补货建议</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>无法获取补货建议，请稍后重试</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="neon-border-cyan">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">关于AI补货建议</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            • AI系统基于当前库存水平、最低库存阈值和历史数据进行分析
          </p>
          <p>
            • 建议补货数量考虑了安全库存和配件周转率
          </p>
          <p>
            • 优先级根据库存紧急程度和配件重要性自动评估
          </p>
          <p>
            • 建议仅供参考，实际补货决策应结合业务实际情况
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
