import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, ShoppingCart, DollarSign, Target, AlertTriangle } from 'lucide-react';
import { useAccountContext } from '@/contexts/AccountContext';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface DashboardData {
  kpis: {
    totalSales: number;
    totalOrders: number;
    ppcSpend: number;
    roas: number;
    salesChange: number;
    ordersChange: number;
    spendChange: number;
    roasChange: number;
  };
  salesChartData: Array<{ date: string; sales: number }>;
  ppcChartData: Array<{ date: string; spend: number; sales: number }>;
  topAsins: Array<{
    asin: string;
    title: string;
    sales: number;
    orders: number;
    imageUrl?: string;
  }>;
  alerts: Array<{
    id: string;
    type: 'alert' | 'warning';
    title: string;
    message: string;
  }>;
}

export default function Dashboard() {
  const { currentAccountId, currentMarketplace } = useAccountContext();

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['/api/dashboard', currentAccountId, currentMarketplace],
    enabled: !!currentAccountId && !!currentMarketplace,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Total Sales',
      value: `$${data?.kpis.totalSales.toLocaleString() || '0'}`,
      change: data?.kpis.salesChange || 0,
      icon: DollarSign,
      color: 'text-chart-1',
    },
    {
      title: 'Total Orders',
      value: data?.kpis.totalOrders.toLocaleString() || '0',
      change: data?.kpis.ordersChange || 0,
      icon: ShoppingCart,
      color: 'text-chart-2',
    },
    {
      title: 'PPC Spend',
      value: `$${data?.kpis.ppcSpend.toLocaleString() || '0'}`,
      change: data?.kpis.spendChange || 0,
      icon: TrendingUp,
      color: 'text-chart-3',
    },
    {
      title: 'ROAS',
      value: `${data?.kpis.roas.toFixed(2) || '0.00'}x`,
      change: data?.kpis.roasChange || 0,
      icon: Target,
      color: 'text-chart-4',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your Amazon seller performance</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card, index) => (
          <Card key={index} className="rounded-xl hover-elevate" data-testid={`card-${card.title.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`text-${card.title.toLowerCase().replace(/\s+/g, '-')}-value`}>{card.value}</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className={`h-3 w-3 ${card.change >= 0 ? 'text-success' : 'text-danger'}`} />
                <p className={`text-xs ${card.change >= 0 ? 'text-success' : 'text-danger'}`}>
                  {card.change >= 0 ? '+' : ''}{card.change}% from last period
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-xl" data-testid="card-sales-chart">
        <CardHeader>
          <CardTitle>Sales Trend</CardTitle>
          <p className="text-sm text-muted-foreground">Daily sales over the last 30 days</p>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              sales: {
                label: 'Sales',
                color: 'hsl(var(--chart-1))',
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.salesChartData || []}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="hsl(var(--chart-1))"
                  fill="url(#salesGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="rounded-xl" data-testid="card-ppc-chart">
        <CardHeader>
          <CardTitle>PPC Spend vs Sales</CardTitle>
          <p className="text-sm text-muted-foreground">Comparison of ad spend and generated sales</p>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              spend: {
                label: 'Spend',
                color: 'hsl(var(--chart-3))',
              },
              sales: {
                label: 'Sales',
                color: 'hsl(var(--chart-1))',
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.ppcChartData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="spend" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sales" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-xl" data-testid="card-top-asins">
          <CardHeader>
            <CardTitle>Top ASINs</CardTitle>
            <p className="text-sm text-muted-foreground">Best performing products by sales</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.topAsins.map((asin, index) => (
                <div
                  key={asin.asin}
                  className="flex items-center gap-4 p-3 rounded-lg hover-elevate"
                  data-testid={`row-asin-${index}`}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-muted rounded flex items-center justify-center">
                    {asin.imageUrl ? (
                      <img src={asin.imageUrl} alt={asin.title} className="w-full h-full object-cover rounded" />
                    ) : (
                      <span className="text-xl font-bold text-muted-foreground">#{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{asin.title}</p>
                    <p className="text-sm text-muted-foreground">ASIN: {asin.asin}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${asin.sales.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{asin.orders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl" data-testid="card-risk-alerts">
          <CardHeader>
            <CardTitle>Risk Alerts</CardTitle>
            <p className="text-sm text-muted-foreground">Important notifications</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${alert.type === 'alert' ? 'border-destructive/30 bg-destructive/5' : 'border-warning/30 bg-warning/5'}`}
                  data-testid={`alert-${alert.id}`}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${alert.type === 'alert' ? 'text-destructive' : 'text-warning'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                    </div>
                  </div>
                </div>
              ))}
              {(!data?.alerts || data.alerts.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No alerts at this time</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
