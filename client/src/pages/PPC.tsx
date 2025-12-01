import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from 'lucide-react';
import { useAccountContext } from '@/contexts/AccountContext';
import { useState } from 'react';
import type { PPCCampaign } from '@shared/schema';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface PPCMetrics {
  spendData: Array<{ date: string; spend: number }>;
  acosData: Array<{ date: string; acos: number }>;
}

export default function PPC() {
  const { currentAccountId, currentMarketplace } = useAccountContext();
  const [dateRange, setDateRange] = useState('30');

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<PPCCampaign[]>({
    queryKey: ['/api/ppc/campaigns', currentAccountId, currentMarketplace],
    enabled: !!currentAccountId && !!currentMarketplace,
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery<PPCMetrics>({
    queryKey: ['/api/ppc/metrics', currentAccountId, currentMarketplace, dateRange],
    enabled: !!currentAccountId && !!currentMarketplace,
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
      enabled: { variant: 'default', label: 'Enabled' },
      paused: { variant: 'secondary', label: 'Paused' },
      archived: { variant: 'destructive', label: 'Archived' },
    };
    
    const config = statusConfig[status] || statusConfig.enabled;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">PPC Analytics</h1>
        <p className="text-muted-foreground mt-1">Monitor and optimize your advertising campaigns</p>
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger data-testid="select-date-range">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <SelectValue placeholder="Select date range" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="60">Last 60 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-xl" data-testid="card-spend-chart">
          <CardHeader>
            <CardTitle>Ad Spend Trend</CardTitle>
            <p className="text-sm text-muted-foreground">Daily advertising spend over time</p>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-[300px]" />
            ) : (
              <ChartContainer
                config={{
                  spend: {
                    label: 'Spend ($)',
                    color: 'hsl(var(--chart-3))',
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics?.spendData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="spend"
                      stroke="hsl(var(--chart-3))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl" data-testid="card-acos-chart">
          <CardHeader>
            <CardTitle>ACOS Trend</CardTitle>
            <p className="text-sm text-muted-foreground">Advertising Cost of Sale percentage</p>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-[300px]" />
            ) : (
              <ChartContainer
                config={{
                  acos: {
                    label: 'ACOS (%)',
                    color: 'hsl(var(--chart-1))',
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics?.acosData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="acos"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl" data-testid="card-campaigns-table">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Campaign Performance</CardTitle>
            <p className="text-sm text-muted-foreground" data-testid="text-campaign-count">
              {campaigns.length} campaigns
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {campaignsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Daily Budget</TableHead>
                    <TableHead className="text-right">Spend</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">ACOS</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id} className="hover-elevate" data-testid={`row-campaign-${campaign.id}`}>
                      <TableCell className="font-medium">{campaign.campaignName}</TableCell>
                      <TableCell className="text-sm capitalize">{campaign.campaignType.replace('_', ' ')}</TableCell>
                      <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell className="text-right">
                        {campaign.dailyBudget ? `$${Number(campaign.dailyBudget).toFixed(2)}` : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${Number(campaign.spend).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-success">
                        ${Number(campaign.sales).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {campaign.acos ? (
                          <span className={Number(campaign.acos) > 30 ? 'text-danger font-medium' : ''}>
                            {Number(campaign.acos).toFixed(1)}%
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell className="text-right">{campaign.clicks?.toLocaleString() || 0}</TableCell>
                      <TableCell className="text-right">{campaign.impressions?.toLocaleString() || 0}</TableCell>
                    </TableRow>
                  ))}
                  {campaigns.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No campaigns found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
