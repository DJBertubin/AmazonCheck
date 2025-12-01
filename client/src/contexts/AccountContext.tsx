import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Account, MarketplaceConnection } from '@shared/schema';

interface AccountContextType {
  currentAccountId: string | null;
  currentMarketplace: string | null;
  accounts: Account[];
  allAccounts: Account[];
  marketplaceConnections: MarketplaceConnection[];
  setCurrentAccountId: (id: string | null) => void;
  setCurrentMarketplace: (marketplace: string | null) => void;
  isLoading: boolean;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null);
  const [currentMarketplace, setCurrentMarketplace] = useState<string | null>(null);

  const { data: allAccounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
  });

  const { data: amazonConnections = [] } = useQuery<Array<{
    id: string;
    accountId: string;
    isActive: boolean;
  }>>({
    queryKey: ['/api/amazon/connections'],
  });

  // Filter to only show accounts with active Amazon connections
  const accounts = useMemo(() => {
    return allAccounts.filter(account =>
      amazonConnections.some(conn => conn.accountId === account.id && conn.isActive)
    );
  }, [allAccounts, amazonConnections]);

  const { data: marketplaceConnections = [], isLoading: marketplacesLoading } = useQuery<MarketplaceConnection[]>({
    queryKey: ['/api/marketplaces', currentAccountId],
    queryFn: async () => {
      const response = await fetch(`/api/marketplaces/${currentAccountId}`);
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!currentAccountId && currentAccountId !== 'all',
  });

  useEffect(() => {
    if (accounts.length > 0) {
      // If we don't have a current account, or current account is no longer in the list
      const currentIsValid = currentAccountId && accounts.some(a => a.id === currentAccountId);
      
      if (!currentAccountId || !currentIsValid) {
        const favoriteAccount = accounts.find(a => a.isFavorite);
        const selectedId = favoriteAccount?.id || accounts[0]?.id;
        if (selectedId && selectedId !== currentAccountId) {
          setCurrentAccountId(selectedId);
        }
      }
    }
  }, [accounts, currentAccountId]);

  useEffect(() => {
    if (marketplaceConnections.length > 0 && !currentMarketplace && currentAccountId !== 'all') {
      const activeMarketplace = marketplaceConnections.find(m => m.isActive);
      setCurrentMarketplace(activeMarketplace?.marketplace || marketplaceConnections[0].marketplace);
    }
  }, [marketplaceConnections, currentMarketplace, currentAccountId]);

  return (
    <AccountContext.Provider
      value={{
        currentAccountId,
        currentMarketplace,
        accounts,
        allAccounts,
        marketplaceConnections,
        setCurrentAccountId,
        setCurrentMarketplace,
        isLoading: accountsLoading || marketplacesLoading,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccountContext() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccountContext must be used within an AccountProvider');
  }
  return context;
}
