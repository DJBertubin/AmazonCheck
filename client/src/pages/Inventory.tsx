import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Search, Package, Clock, TrendingDown } from 'lucide-react';
import { useAccountContext } from '@/contexts/AccountContext';
import { useState } from 'react';
import type { Inventory as InventoryType } from '@shared/schema';

interface InventorySummary {
  totalSOH: number;
  avgDOH: number;
  itemsToRestock: number;
}

export default function Inventory() {
  const { currentAccountId, currentMarketplace } = useAccountContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const { data: inventory = [], isLoading: inventoryLoading } = useQuery<InventoryType[]>({
    queryKey: ['/api/inventory', currentAccountId, currentMarketplace],
    enabled: !!currentAccountId && !!currentMarketplace,
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<InventorySummary>({
    queryKey: ['/api/inventory/summary', currentAccountId, currentMarketplace],
    enabled: !!currentAccountId && !!currentMarketplace,
  });

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = 
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesLowStock = !lowStockOnly || (item.doh !== null && item.doh < 30);

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const categories = Array.from(new Set(inventory.map(i => i.category).filter(Boolean)));

  const getStockLevel = (doh: number | null) => {
    if (doh === null) return { color: 'text-muted-foreground', label: 'N/A' };
    if (doh < 15) return { color: 'text-danger', label: 'Critical' };
    if (doh < 30) return { color: 'text-warning', label: 'Low' };
    return { color: 'text-success', label: 'Healthy' };
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory & Restock</h1>
        <p className="text-muted-foreground mt-1">Monitor stock levels and restock recommendations</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-xl hover-elevate" data-testid="card-total-soh">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Stock on Hand
            </CardTitle>
            <Package className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-total-soh">
                {summary?.totalSOH.toLocaleString() || '0'}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Units across all SKUs</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl hover-elevate" data-testid="card-avg-doh">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Days on Hand
            </CardTitle>
            <Clock className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-avg-doh">
                {summary?.avgDOH.toFixed(0) || '0'} days
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Average inventory coverage</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl hover-elevate bg-destructive/5 border-destructive/20" data-testid="card-items-to-restock">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Items to Restock
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold text-destructive" data-testid="text-items-to-restock">
                {summary?.itemsToRestock || '0'}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">SKUs requiring restock</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by SKU or product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                data-testid="input-inventory-search"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger data-testid="select-category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category || ''}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={lowStockOnly ? 'default' : 'outline'}
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className="hover-elevate active-elevate-2"
              data-testid="button-low-stock-filter"
            >
              {lowStockOnly ? 'Showing Low Stock' : 'Show Low Stock Only'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl" data-testid="card-inventory-table">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Inventory Status</CardTitle>
            <p className="text-sm text-muted-foreground" data-testid="text-inventory-count">
              {filteredInventory.length} of {inventory.length} items
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {inventoryLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">SOH</TableHead>
                    <TableHead className="text-right">DOH</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    <TableHead className="text-right">Restock Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => {
                    const stockLevel = getStockLevel(item.doh);
                    return (
                      <TableRow key={item.id} className="hover-elevate" data-testid={`row-inventory-${item.sku}`}>
                        <TableCell className="font-mono text-sm font-medium">{item.sku}</TableCell>
                        <TableCell className="max-w-md truncate">{item.productName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.category || 'N/A'}</TableCell>
                        <TableCell className="text-right font-medium">{item.soh.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <span className={stockLevel.color}>
                            {item.doh !== null ? `${item.doh} days` : 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`text-sm font-medium ${stockLevel.color}`}>
                            {stockLevel.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.restockQty && item.restockQty > 0 ? (
                            <span className="font-bold text-primary">
                              {item.restockQty.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredInventory.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No inventory items found matching your filters
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
