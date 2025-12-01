import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useAccountContext } from '@/contexts/AccountContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, CheckCircle, XCircle, Link as LinkIcon, Plus } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { currentAccountId, marketplaceConnections, currentMarketplace, accounts } = useAccountContext();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [selectedMarketplace, setSelectedMarketplace] = useState('US');

  const marketplaceNames: Record<string, string> = {
    US: 'United States',
    CA: 'Canada',
    MX: 'Mexico',
    UK: 'United Kingdom',
    DE: 'Germany',
    FR: 'France',
    IT: 'Italy',
    ES: 'Spain',
    JP: 'Japan',
    AU: 'Australia',
  };

  // Fetch all Amazon connections for the user
  const { data: amazonConnections, isLoading: connectionsLoading } = useQuery<Array<{
    id: string;
    accountId: string;
    accountName: string;
    region: string;
    sellerId: string | null;
    isActive: boolean;
    lastSyncedAt: string | null;
  }>>({
    queryKey: ['/api/amazon/connections'],
    enabled: !!user,
  });

  const handleAddAccount = () => {
    if (!newAccountName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an account name',
        variant: 'destructive',
      });
      return;
    }

    connectMutation.mutate({ accountName: newAccountName, marketplace: selectedMarketplace });
    setIsAddDialogOpen(false);
    setNewAccountName('');
    setSelectedMarketplace('US');
  };

  // Connect new Amazon account mutation - opens OAuth popup
  const connectMutation = useMutation({
    mutationFn: async ({ accountName, marketplace }: { accountName: string; marketplace: string }) => {
      const response = await apiRequest('POST', '/api/amazon/connect', {
        accountName,
        marketplace,
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.authUrl) {
        // Open Amazon authorization popup
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const popup = window.open(
          data.authUrl,
          'Amazon Authorization',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        // Listen for successful authorization
        const checkPopup = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkPopup);
            // Refresh connections and accounts list after popup closes
            queryClient.invalidateQueries({ queryKey: ['/api/amazon/connections'] });
            queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
            
            // Check URL params for success/error
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('success') === 'true') {
              toast({
                title: 'Success',
                description: 'Amazon account connected successfully',
              });
              // Clean up URL
              window.history.replaceState({}, '', '/settings?tab=amazon');
            }
          }
        }, 500);
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to initiate Amazon connection',
        variant: 'destructive',
      });
    },
  });

  // Sync data mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/amazon/sync', {
        accountId: currentAccountId,
        marketplace: currentMarketplace,
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Success',
        description: `Synced ${data.stats.catalogItems} listings, ${data.stats.inventoryItems} inventory items, ${data.stats.orders} orders`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/amazon/status', currentAccountId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to sync Amazon data',
        variant: 'destructive',
      });
    },
  });

  // Disconnect/delete Amazon connection mutation
  const disconnectMutation = useMutation({
    mutationFn: async (credentialId: string) => {
      return apiRequest('DELETE', `/api/amazon/connection/${credentialId}`, undefined);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Amazon account disconnected successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/amazon/connections'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to disconnect Amazon account',
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList data-testid="tabs-settings">
          <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
          <TabsTrigger value="amazon" data-testid="tab-amazon">Amazon Integration</TabsTrigger>
          <TabsTrigger value="marketplaces" data-testid="tab-marketplaces">Marketplaces</TabsTrigger>
          <TabsTrigger value="preferences" data-testid="tab-preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and profile picture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.profileImageUrl || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">Profile Picture</p>
                  <p className="text-xs text-muted-foreground mt-1">Managed by your account provider</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    defaultValue={user?.firstName || ''}
                    disabled
                    data-testid="input-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    defaultValue={user?.lastName || ''}
                    disabled
                    data-testid="input-last-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={user?.email || ''}
                  disabled
                  data-testid="input-email"
                />
                <p className="text-xs text-muted-foreground">
                  Your profile information is managed by your authentication provider
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="amazon" className="space-y-6">
          {/* Debug Section */}
          <Card className="rounded-xl border-yellow-500/50 bg-yellow-50/10">
            <CardHeader>
              <CardTitle className="text-sm">Debug Tools</CardTitle>
              <CardDescription className="text-xs">Development tools for testing Amazon API</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    const res = await apiRequest('POST', '/api/save-env-credentials', undefined);
                    const data = await res.json();
                    toast({
                      title: data.success ? 'Success' : 'Error',
                      description: data.message || JSON.stringify(data),
                    });
                    queryClient.invalidateQueries({ queryKey: ['/api/amazon/connections'] });
                  } catch (err: any) {
                    toast({ title: 'Error', description: err.message, variant: 'destructive' });
                  }
                }}
                data-testid="button-save-env-creds"
              >
                Save Env Credentials to DB
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/test-amazon-env', { credentials: 'include' });
                    const data = await res.json();
                    toast({
                      title: data.success ? 'Env Test Success' : 'Env Test Failed',
                      description: data.message || JSON.stringify(data),
                    });
                  } catch (err: any) {
                    toast({ title: 'Error', description: err.message, variant: 'destructive' });
                  }
                }}
                data-testid="button-test-env"
              >
                Test Env Credentials
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/test-amazon-public', { credentials: 'include' });
                    const data = await res.json();
                    toast({
                      title: data.success ? 'DB Test Success' : 'DB Test Failed',
                      description: data.message || JSON.stringify(data),
                    });
                  } catch (err: any) {
                    toast({ title: 'Error', description: err.message, variant: 'destructive' });
                  }
                }}
                data-testid="button-test-db"
              >
                Test DB Credentials
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Amazon Seller Accounts</CardTitle>
                  <CardDescription>
                    Manage your connected Amazon Seller Central accounts
                  </CardDescription>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-amazon-account">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Amazon Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Connect Amazon Seller Account</DialogTitle>
                      <DialogDescription>
                        Enter your account details and select marketplace to connect
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="accountName">Account Name</Label>
                        <Input
                          id="accountName"
                          placeholder="e.g., My Amazon Store"
                          value={newAccountName}
                          onChange={(e) => setNewAccountName(e.target.value)}
                          data-testid="input-account-name"
                        />
                        <p className="text-xs text-muted-foreground">
                          Choose a name to identify this Amazon account
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="marketplace">Marketplace</Label>
                        <Select value={selectedMarketplace} onValueChange={setSelectedMarketplace}>
                          <SelectTrigger id="marketplace" data-testid="select-marketplace">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="US">United States (US)</SelectItem>
                            <SelectItem value="CA">Canada (CA)</SelectItem>
                            <SelectItem value="MX">Mexico (MX)</SelectItem>
                            <SelectItem value="UK">United Kingdom (UK)</SelectItem>
                            <SelectItem value="DE">Germany (DE)</SelectItem>
                            <SelectItem value="FR">France (FR)</SelectItem>
                            <SelectItem value="IT">Italy (IT)</SelectItem>
                            <SelectItem value="ES">Spain (ES)</SelectItem>
                            <SelectItem value="JP">Japan (JP)</SelectItem>
                            <SelectItem value="AU">Australia (AU)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={handleAddAccount}
                          disabled={connectMutation.isPending || !newAccountName.trim()}
                          className="flex-1"
                          data-testid="button-connect-submit"
                        >
                          <LinkIcon className="h-4 w-4 mr-2" />
                          {connectMutation.isPending ? 'Connecting...' : 'Connect to Amazon'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsAddDialogOpen(false)}
                          disabled={connectMutation.isPending}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {connectionsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : amazonConnections && amazonConnections.length > 0 ? (
                <div className="space-y-3">
                  {amazonConnections.map((connection) => (
                    <div
                      key={connection.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`amazon-connection-${connection.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                          <CheckCircle className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium">{connection.accountName}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                            <span>Region: {connection.region}</span>
                            {connection.sellerId && (
                              <>
                                <span>•</span>
                                <span>ID: {connection.sellerId}</span>
                              </>
                            )}
                            {connection.lastSyncedAt && (
                              <>
                                <span>•</span>
                                <span>
                                  Last synced: {new Date(connection.lastSyncedAt).toLocaleDateString()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={connection.isActive ? 'default' : 'secondary'}>
                          {connection.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          onClick={() => disconnectMutation.mutate(connection.id)}
                          disabled={disconnectMutation.isPending}
                          size="sm"
                          variant="ghost"
                          data-testid={`button-delete-${connection.id}`}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <LinkIcon className="h-8 w-8 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Connect Your Amazon Seller Account</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                      Securely link your Amazon Seller Central account to automatically sync your listings, inventory, orders, and PPC campaigns.
                    </p>
                    
                    <p className="text-sm text-muted-foreground">
                      Use the "+ Add Amazon Account" dropdown above to connect your first Amazon Seller Central account.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg border">
                      <CheckCircle className="h-5 w-5 text-green-500 mb-2" />
                      <p className="font-medium text-sm mb-1">Secure OAuth Integration</p>
                      <p className="text-xs text-muted-foreground">
                        Your credentials are encrypted and never shared
                      </p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg border">
                      <RefreshCw className="h-5 w-5 text-blue-500 mb-2" />
                      <p className="font-medium text-sm mb-1">Automatic Sync</p>
                      <p className="text-xs text-muted-foreground">
                        Data updates every 6 hours automatically
                      </p>
                    </div>
                  </div>

                  <div className="text-sm p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                    <p className="font-medium text-foreground mb-2">What gets synced:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>✓ Product catalog & listings</li>
                      <li>✓ Inventory levels & FBA stock</li>
                      <li>✓ Orders & sales data</li>
                      <li>✓ PPC campaigns & advertising metrics</li>
                      <li>✓ Customer reviews & ratings</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketplaces" className="space-y-6">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Marketplace Connections</CardTitle>
              <CardDescription>Manage your Amazon marketplace integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketplaceConnections.map((connection) => (
                  <div
                    key={connection.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                    data-testid={`marketplace-${connection.marketplace}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{connection.marketplace}</span>
                      </div>
                      <div>
                        <p className="font-medium">{marketplaceNames[connection.marketplace]}</p>
                        <p className="text-sm text-muted-foreground">
                          Amazon {connection.marketplace}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={connection.isActive ? 'default' : 'secondary'}>
                        {connection.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Switch checked={connection.isActive} data-testid={`switch-${connection.marketplace}`} />
                    </div>
                  </div>
                ))}
                {marketplaceConnections.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No marketplace connections found</p>
                    <p className="text-xs mt-1">Select an account to view its marketplace connections</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how you receive alerts and updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Low Stock Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications when inventory is low
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-low-stock-alerts" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Listing Suppression Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when listings are suppressed
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-suppression-alerts" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">PPC Performance Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Alerts for campaigns with high ACOS
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-ppc-alerts" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Display Preferences</CardTitle>
              <CardDescription>Customize your viewing experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Compact View</p>
                  <p className="text-sm text-muted-foreground">
                    Show more data in tables and lists
                  </p>
                </div>
                <Switch data-testid="switch-compact-view" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-Refresh Data</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically refresh dashboard data every 5 minutes
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-auto-refresh" />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button className="hover-elevate active-elevate-2" data-testid="button-save-preferences">
              Save Preferences
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
