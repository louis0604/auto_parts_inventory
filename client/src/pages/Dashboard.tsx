import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, Users, TruckIcon } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: lowStockParts } = trpc.parts.lowStock.useQuery();
  const { data: alerts } = trpc.lowStockAlerts.list.useQuery();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="neon-border-cyan animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "配件总数",
      value: stats?.totalParts || 0,
      icon: Package,
      color: "text-accent",
      link: "/parts",
    },
    {
      title: "供应商",
      value: stats?.totalSuppliers || 0,
      icon: TruckIcon,
      color: "text-primary",
      link: "/suppliers",
    },
    {
      title: "客户",
      value: stats?.totalCustomers || 0,
      icon: Users,
      color: "text-secondary",
      link: "/customers",
    },
    {
      title: "低库存预警",
      value: stats?.lowStockCount || 0,
      icon: AlertTriangle,
      color: "text-destructive",
      link: "/parts?filter=lowStock",
    },
  ];

  return (
    <div className="p-6 space-y-6 scan-line">
      {/* Header */}
      <div className="hud-corners p-6 relative">
        <h1 className="text-3xl font-bold neon-text-cyan mb-2">库存管理系统</h1>
        <p className="text-muted-foreground">实时监控您的汽车配件库存状态</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.link}>
            <Card className="neon-border-cyan hover:neon-border-pink transition-all cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color} group-hover:neon-text transition-all`} />
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${stat.color} neon-text`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Low Stock Alerts */}
      {lowStockParts && lowStockParts.length > 0 && (
        <Card className="neon-border-pink">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 neon-text-pink">
              <AlertTriangle className="h-5 w-5" />
              低库存预警
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockParts.slice(0, 5).map((part) => (
                <div
                  key={part.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border hover:border-primary transition-all"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{part.name}</p>
                    <p className="text-sm text-muted-foreground">SKU: {part.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">当前库存</p>
                    <p className="text-lg font-bold text-destructive neon-text">
                      {part.stockQuantity} {part.unit}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      最低: {part.minStockThreshold} {part.unit}
                    </p>
                  </div>
                </div>
              ))}
              {lowStockParts.length > 5 && (
                <Link href="/parts?filter=lowStock">
                  <Button variant="outline" className="w-full neon-border-cyan">
                    查看全部 {lowStockParts.length} 个低库存配件
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="neon-border-cyan">
        <CardHeader>
          <CardTitle className="neon-text-cyan">快速操作</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/parts">
              <Button className="w-full" variant="default">
                添加配件
              </Button>
            </Link>
            <Link href="/purchase-orders">
              <Button className="w-full" variant="secondary">
                创建采购订单
              </Button>
            </Link>
            <Link href="/sales-invoices">
              <Button className="w-full" variant="secondary">
                创建销售发票
              </Button>
            </Link>
            <Link href="/inventory-ledger">
              <Button className="w-full" variant="outline">
                查看库存记录
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
