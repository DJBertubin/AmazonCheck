import { Bell, Search, ChevronDown, Star, Check, Building2 } from 'lucide-react';
import logoImage from '@assets/generated_images/ber2bytesync_app_logo_300x300_c0f5470f.png';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAccountContext } from '@/contexts/AccountContext';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export function TopNavbar() {
  const { user } = useAuth();
  const {
    currentAccountId,
    currentMarketplace,
    accounts,
    marketplaceConnections,
    setCurrentAccountId,
    setCurrentMarketplace,
  } = useAccountContext();
  
  const [accountSearch, setAccountSearch] = useState('');

  const currentAccount = accounts.find(a => a.id === currentAccountId);
  
  const filteredAccounts = accounts.filter(account =>
    account.brandName.toLowerCase().includes(accountSearch.toLowerCase()) ||
    account.sellerId?.toLowerCase().includes(accountSearch.toLowerCase())
  );

  const favoriteAccounts = filteredAccounts.filter(a => a.isFavorite);
  const otherAccounts = filteredAccounts.filter(a => !a.isFavorite);

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

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-card border-b border-card-border">
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="min-w-[240px] justify-between hover-elevate active-elevate-2"
              data-testid="button-account-switcher"
            >
              <div className="flex items-center gap-2">
                {currentAccountId === 'all' ? (
                  <>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">All Accounts</span>
                  </>
                ) : currentAccount ? (
                  <>
                    <div className={`h-2 w-2 rounded-full ${currentAccount.status === 'active' ? 'bg-status-online' : 'bg-status-offline'}`} />
                    <span className="font-medium truncate">{currentAccount.brandName}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Select Account</span>
                )}
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[320px] max-h-[400px] overflow-y-auto" data-testid="dropdown-account-switcher">
            <div className="p-2 sticky top-0 bg-popover z-10">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search accounts..."
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  className="pl-8"
                  data-testid="input-account-search"
                />
              </div>
            </div>
            
            <DropdownMenuItem
              onClick={() => setCurrentAccountId('all')}
              className="hover-elevate active-elevate-2"
              data-testid="option-all-accounts"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium">All Accounts (Aggregated)</span>
                </div>
                {currentAccountId === 'all' && <Check className="h-4 w-4 text-primary" />}
              </div>
            </DropdownMenuItem>
            
            {favoriteAccounts.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Favorites
                </div>
                {favoriteAccounts.map((account) => (
                  <DropdownMenuItem
                    key={account.id}
                    onClick={() => setCurrentAccountId(account.id)}
                    className="hover-elevate active-elevate-2"
                    data-testid={`option-account-${account.id}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Star className="h-3.5 w-3.5 fill-primary text-primary flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{account.brandName}</div>
                          <div className="text-xs text-muted-foreground truncate">ID: {account.sellerId}</div>
                        </div>
                        <div className={`h-2 w-2 rounded-full flex-shrink-0 ${account.status === 'active' ? 'bg-status-online' : 'bg-status-offline'}`} />
                      </div>
                      {currentAccountId === account.id && <Check className="h-4 w-4 text-primary flex-shrink-0 ml-2" />}
                    </div>
                  </DropdownMenuItem>
                ))}
              </>
            )}
            
            {otherAccounts.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  All Accounts
                </div>
                {otherAccounts.map((account) => (
                  <DropdownMenuItem
                    key={account.id}
                    onClick={() => setCurrentAccountId(account.id)}
                    className="hover-elevate active-elevate-2"
                    data-testid={`option-account-${account.id}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{account.brandName}</div>
                          <div className="text-xs text-muted-foreground truncate">ID: {account.sellerId}</div>
                        </div>
                        <div className={`h-2 w-2 rounded-full flex-shrink-0 ${account.status === 'active' ? 'bg-status-online' : 'bg-status-offline'}`} />
                      </div>
                      {currentAccountId === account.id && <Check className="h-4 w-4 text-primary flex-shrink-0 ml-2" />}
                    </div>
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {currentAccountId && currentAccountId !== 'all' && marketplaceConnections.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="min-w-[180px] justify-between hover-elevate active-elevate-2"
                data-testid="button-marketplace-switcher"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{currentMarketplace || 'US'}</span>
                  <span className="text-xs text-muted-foreground">({marketplaceNames[currentMarketplace || 'US']})</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" data-testid="dropdown-marketplace-switcher">
              {marketplaceConnections.map((connection) => (
                <DropdownMenuItem
                  key={connection.id}
                  onClick={() => setCurrentMarketplace(connection.marketplace)}
                  disabled={!connection.isActive}
                  className="hover-elevate active-elevate-2"
                  data-testid={`option-marketplace-${connection.marketplace}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{connection.marketplace}</span>
                      <span className="text-xs text-muted-foreground">({marketplaceNames[connection.marketplace]})</span>
                      {!connection.isActive && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                    </div>
                    {currentMarketplace === connection.marketplace && <Check className="h-4 w-4 text-primary" />}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="relative hover-elevate active-elevate-2"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-destructive rounded-full" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="gap-2 hover-elevate active-elevate-2"
              data-testid="button-user-menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profileImageUrl || ''} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden md:block">
                <div className="text-sm font-medium">{user?.firstName} {user?.lastName}</div>
                <div className="text-xs text-muted-foreground">{user?.email}</div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" data-testid="dropdown-user-menu">
            <DropdownMenuItem asChild className="hover-elevate active-elevate-2">
              <a href="/api/logout" data-testid="link-logout">
                Log out
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
