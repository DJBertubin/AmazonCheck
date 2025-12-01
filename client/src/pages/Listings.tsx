import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Search, Filter } from 'lucide-react';
import { useAccountContext } from '@/contexts/AccountContext';
import { useState } from 'react';
import type { Listing } from '@shared/schema';

export default function Listings() {
  const { currentAccountId, currentMarketplace } = useAccountContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data: listings = [], isLoading } = useQuery<Listing[]>({
    queryKey: ['listings', currentAccountId, currentMarketplace],
    queryFn: async () => {
      const response = await fetch(`/api/listings/${currentAccountId}/${currentMarketplace}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: !!currentAccountId && !!currentMarketplace,
  });

  const filteredListings = listings.filter((listing) => {
    const matchesSearch = 
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.asin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || listing.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = Array.from(new Set(listings.map(l => l.category).filter(Boolean)));

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      active: { variant: 'default', label: 'Active' },
      inactive: { variant: 'secondary', label: 'Inactive' },
      suppressed: { variant: 'destructive', label: 'Suppressed' },
      missing_info: { variant: 'outline', label: 'Missing Info' },
    };
    
    const config = statusConfig[status] || statusConfig.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Listing Analyzer</h1>
        <p className="text-muted-foreground mt-1">Manage and analyze your product listings</p>
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ASIN, SKU, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                data-testid="input-listing-search"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suppressed">Suppressed</SelectItem>
                <SelectItem value="missing_info">Missing Info</SelectItem>
              </SelectContent>
            </Select>

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
              variant="outline" 
              className="hover-elevate active-elevate-2" 
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setCategoryFilter('all');
              }}
              data-testid="button-reset-filters"
            >
              <Filter className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl" data-testid="card-listings-table">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Listings</CardTitle>
            <p className="text-sm text-muted-foreground" data-testid="text-listing-count">
              {filteredListings.length} of {listings.length} listings
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Image</TableHead>
                    <TableHead>ASIN</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredListings.map((listing) => (
                    <TableRow key={listing.id} className="hover-elevate" data-testid={`row-listing-${listing.asin}`}>
                      <TableCell>
                        <div className="h-16 w-16 bg-muted rounded flex items-center justify-center overflow-hidden">
                          {listing.imageUrl ? (
                            <img
                              src={listing.imageUrl}
                              alt={listing.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">No image</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{listing.asin}</TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate font-medium">{listing.title}</div>
                        {listing.sku && (
                          <div className="text-xs text-muted-foreground">SKU: {listing.sku}</div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(listing.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{listing.category || 'N/A'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {listing.price ? `$${Number(listing.price).toFixed(2)}` : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        {listing.stock !== null && listing.stock !== undefined ? (
                          <span className={listing.stock < 10 ? 'text-danger font-medium' : ''}>
                            {listing.stock}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredListings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No listings found matching your filters
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
