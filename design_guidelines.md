# Design Guidelines for Amazon Multi-Account Web Application

## Design Approach
**Reference-Based Approach**: This application follows the **Frogetor Admin Dashboard** template styling exactly. This is a dashboard-focused SaaS application where consistency, data density, and professional enterprise aesthetics are paramount.

---

## Core Visual Design

### Color System
- **Primary Theme**: Black/Dark Grey (professional black buttons for primary actions, links, active states)
- **Sidebar**: Black/Dark background (professional dashboard aesthetic)
- **Top Navbar**: Light background (clean, modern contrast)
- **Cards**: Glass-card widget style with subtle shadows and transparency effects
- **Status Indicators**: Green (active/healthy), Grey (inactive), Red (alerts/warnings), Yellow (warnings)

### Typography
- Use Frogetor's typography system
- Clear hierarchy: Large headings for page titles, medium for card headers, standard for body text
- Consistent sizing across all dashboard components
- Tabular numbers for all metrics and financial data

### Layout System
**Spacing Primitives**: Use Tailwind spacing units consistently
- **Gutters**: 20-24px between major sections (`gap-5` to `gap-6`)
- **Card Padding**: 16-20px internal padding (`p-4` to `p-5`)
- **Section Margins**: 24-32px between major page sections (`mb-6` to `mb-8`)

**Grid System**:
- 4-column KPI card grid on dashboard (responsive to 2 columns on tablet, 1 on mobile)
- Sidebar: Fixed 240-280px width on desktop, collapsible on mobile
- Main content: Full-width with max-width container for optimal reading

### Border Radius
- **Cards**: 12-16px rounded corners (`rounded-xl`)
- **Buttons**: 8px (`rounded-lg`)
- **Dropdowns**: 8-12px (`rounded-lg`)
- **Badges**: 6px (`rounded-md`)

---

## Component Library

### Navigation Components

**Dark Left Sidebar**:
- Fixed position, full height
- Logo at top (24px top padding)
- Navigation items with icons (Heroicons or Font Awesome)
- Active state: Blue background highlight
- Hover: Subtle lightening effect
- Grouped sections with category labels

**Light Top Navbar**:
- Account Switcher Dropdown (left side)
- Marketplace Dropdown (next to account switcher)
- Right side: Notifications icon (with badge count), User Profile dropdown
- Height: 64px, shadow below for depth

### Account Switcher Dropdown
- Search bar at top of dropdown
- Account list items showing:
  - Brand name (bold)
  - Marketplace badges (small pills)
  - Seller ID (muted text)
  - Status indicator (colored dot - green/grey)
- Favorites section at top (starred accounts)
- "All Accounts (Aggregated)" option with distinct styling
- Max height: 400px with scroll

### Marketplace Dropdown
- Flag icons for each marketplace
- Marketplace code (US, CA, MX, EU, etc.)
- Active marketplace highlighted

### Data Display Components

**KPI Stat Cards**:
- Glass-card style with subtle background
- Large number (2xl-3xl font size)
- Label below (text-sm, muted)
- Icon in top-right corner
- Optional: Small trend indicator (↑ 12% with color)
- Consistent height across all KPI cards

**Charts**:
- Use Chart.js or Recharts with Frogetor's blue theme
- Clean gridlines (subtle grey)
- Blue area fills for primary metrics
- Tooltips on hover matching card style

**Tables**:
- Frogetor table design with alternating row backgrounds
- Header row: Bold, slightly larger text, bottom border
- Sortable columns with arrow indicators
- Action buttons in last column
- Pagination at bottom (showing "1-10 of 245")

**Badges**:
- Small pills with rounded corners
- Status colors: Green (Active), Red (Inactive), Yellow (Suppressed), Grey (Missing Info)
- Text: Uppercase, small font (text-xs), bold

**Buttons**:
- Primary: Black background, white text, 8px radius
- Secondary: White background, black border, black text
- Danger: Red background for destructive actions
- All buttons: Consistent padding (px-4 py-2), hover states with slight darkening

---

## Page-Specific Layouts

### Dashboard Page
- 4 KPI cards in grid (Sales, Orders, PPC Spend, ROAS)
- Sales Chart (full width, 400px height)
- PPC Spend vs Sales comparison chart (full width)
- 2-column layout below: "Top ASIN" table (left, 60%), "Risk Alerts" card (right, 40%)

### Listing Analyzer Page
- Filter panel at top (Category dropdown, Status multi-select, Search bar)
- Results count display
- Full-width table with columns: Image thumbnail, ASIN, Title, Status badge, Price, Stock, Actions
- Pagination controls

### PPC Page
- Top row: Campaign dropdown, Date range selector (Calendar picker)
- 2-column chart row: Spend Chart (left), ACOS Chart (right)
- Campaign performance table below (full width)

### Inventory & Restock Page
- 3 summary cards: Total SOH, Avg DOH, Items to Restock (color-coded backgrounds)
- Filter bar (Search, Category, Low Stock toggle)
- Inventory table with columns: SKU, Product, SOH, DOH, Restock Qty (highlighted), Actions

### Settings Page
- Tabbed interface (Profile, Marketplaces, Preferences)
- Form layouts with proper spacing (24px between form groups)
- Save button bottom-right

---

## Images
No hero images required - this is a dashboard application focused on data and functionality. Use icons throughout from Heroicons or Font Awesome via CDN.

---

## Accessibility & Responsiveness
- Mobile: Sidebar collapses to hamburger menu, cards stack to single column
- Tablet: 2-column layouts for cards
- Desktop: Full multi-column layouts
- High contrast for all text on backgrounds
- Focus states on all interactive elements (blue outline)