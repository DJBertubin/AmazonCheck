# Amazon Multi-Account Web Application

## Overview

This is a full-stack Amazon Seller Hub platform designed for agencies and sellers to manage unlimited Amazon seller accounts from a single unified dashboard. The application enables multi-account switching, marketplace selection, performance analytics, PPC campaign tracking, listing management, and inventory monitoring across different Amazon marketplaces (US, CA, MX, UK, DE, FR, IT, ES, JP, AU).

The platform follows the Frogetor Admin Dashboard design system with a dark sidebar, light top navbar, glass-card widgets, and a blue primary color theme.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens matching Frogetor theme
- **State Management**: React Context API for account/marketplace switching
- **Data Fetching**: TanStack Query (React Query) for server state management
- **Charts**: Recharts for data visualization

**Design System:**
- Follows Frogetor Admin Dashboard styling with 12-16px rounded cards, blue primary theme, dark sidebar, and glass-card widgets
- Spacing system uses Tailwind units (20-24px gutters, 16-20px card padding)
- Component library uses shadcn/ui "new-york" style variant
- Custom CSS variables for theme colors defined in HSL format

**Key UI Components:**
- Dark left sidebar navigation with account/organization context
- Light top navbar with account switcher dropdown, marketplace selector, notifications, and user profile
- Dashboard with KPI cards in responsive grid (4 columns → 2 → 1)
- Data tables with search, filtering, and status badges
- Chart visualizations for sales trends and PPC metrics

**Account Context System:**
The application implements a sophisticated multi-account switching mechanism via `AccountContext`:
- Maintains current account ID and marketplace selection
- Automatically loads user's accounts on mount
- Defaults to favorited account or first available
- Triggers data refresh across all pages when switching accounts
- Supports "All Accounts" aggregated view option

### Backend Architecture

**Technology Stack:**
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESNext modules
- **Database ORM**: Drizzle ORM for type-safe database queries
- **Authentication**: Replit Auth (OpenID Connect) with Passport.js strategy
- **Session Management**: express-session with PostgreSQL session store (connect-pg-simple)

**API Design:**
RESTful API structure with authentication middleware:
- `/api/auth/user` - Get authenticated user profile
- `/api/accounts` - List all accounts for current user
- `/api/marketplaces/:accountId` - Get marketplace connections for account
- `/api/dashboard` - Dashboard metrics filtered by account/marketplace
- `/api/listings` - Product listings data
- `/api/ppc/campaigns` - PPC campaign data
- `/api/ppc/metrics` - PPC performance metrics
- `/api/inventory` - Inventory and restock data

**Authentication Flow:**
- Uses Replit's OpenID Connect provider for user authentication
- Session-based authentication with HTTP-only secure cookies
- 7-day session TTL stored in PostgreSQL
- `isAuthenticated` middleware protects all API routes
- User identity linked to database records via OIDC subject claim

**Storage Layer:**
Abstracted storage interface (`IStorage`) provides CRUD operations for:
- User management (upsert, get)
- Organization management
- Account management with favorite/pin functionality
- Marketplace connections per account
- Product listings, PPC campaigns, inventory, metrics, notifications

### Database Schema

**Core Tables:**
- `users` - User profiles synced from Replit Auth (id, email, name, profile image)
- `organizations` - Agency/seller organizations
- `user_org_roles` - Many-to-many relationship between users and organizations with role permissions
- `accounts` - Individual Amazon seller accounts (brand name, seller ID, status, favorite flag)
- `marketplace_connections` - Links accounts to specific marketplaces (US, CA, etc.) with active status
- `listings` - Product catalog (ASIN, SKU, title, price, status, category, rank, reviews)
- `ppc_campaigns` - PPC campaign data (name, budget, status, metrics like spend, sales, ACOS, clicks, impressions)
- `inventory` - Stock levels (product name, SKU, stock on hand, days on hand, category)
- `dashboard_metrics` - Aggregated performance metrics by account/marketplace/date
- `notifications` - User alerts and notifications
- `sessions` - Session storage for authentication (required by connect-pg-simple)

**Key Relationships:**
- Organizations have many accounts
- Users belong to organizations through user_org_roles
- Accounts have many marketplace connections
- Each account has listings, campaigns, and inventory filtered by marketplace
- All data tables link back to accountId for multi-account isolation

**Data Isolation:**
All queries filter by accountId and marketplace to ensure proper data segregation between accounts. The frontend passes these parameters via query strings, and the backend enforces them in storage methods.

### External Dependencies

**Database:**
- **Provider**: Neon Serverless PostgreSQL (configured via `@neondatabase/serverless`)
- **Connection**: WebSocket-based pooled connections for serverless environments
- **Environment Variable**: `DATABASE_URL` (required)

**Authentication Service:**
- **Provider**: Replit Auth (OpenID Connect)
- **Configuration**: `ISSUER_URL` (defaults to https://replit.com/oidc), `REPL_ID`, `SESSION_SECRET`
- **User Data**: Email, first name, last name, profile image URL synced to users table

**UI Component Library:**
- **shadcn/ui**: Pre-built accessible components based on Radix UI primitives
- **Radix UI**: Headless UI component primitives (20+ components including Dialog, Dropdown, Select, Toast, etc.)
- All components styled with Tailwind CSS following Frogetor design tokens

**Development Tools:**
- **Replit Integrations**: Vite plugins for runtime error overlay, cartographer (code mapping), and dev banner
- **Build Pipeline**: Vite for client bundling, esbuild for server bundling to ESM format

**Chart Library:**
- **Recharts**: Composable chart components (Area, Bar, Line charts) with responsive containers
- Custom chart components wrapper for consistent theming

**Session Storage:**
- PostgreSQL-backed session store using `connect-pg-simple`
- Requires `sessions` table (auto-created: false, manual migration expected)