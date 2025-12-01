import { Home, LayoutList, Package, Settings, TrendingUp, TestTube2 } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Link, useLocation } from 'wouter';
import logoImage from '@assets/generated_images/ber2bytesync_app_logo_300x300_c0f5470f.png';

const navigationItems = [
  {
    title: 'Dashboard',
    url: '/',
    icon: Home,
  },
  {
    title: 'Listing Analyzer',
    url: '/listings',
    icon: LayoutList,
  },
  {
    title: 'PPC Analytics',
    url: '/ppc',
    icon: TrendingUp,
  },
  {
    title: 'Inventory & Restock',
    url: '/inventory',
    icon: Package,
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
  },
  {
    title: 'Test Amazon API',
    url: '/test-amazon',
    icon: TestTube2,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="Ber2bytesync logo" className="w-10 h-10" />
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">Ber2bytesync</h1>
            <p className="text-xs text-sidebar-foreground/60">Amazon Seller Hub</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
