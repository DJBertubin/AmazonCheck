import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organizations table
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User-Organization roles table
export const userOrgRoles = pgTable("user_org_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  role: varchar("role", { length: 50 }).notNull(), // admin, member, viewer
  createdAt: timestamp("created_at").defaultNow(),
});

// Amazon Seller Accounts table
export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id),
  brandName: varchar("brand_name", { length: 255 }).notNull(),
  sellerId: varchar("seller_id", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default('active'), // active, inactive, suspended
  isFavorite: boolean("is_favorite").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Marketplace Connections table
export const marketplaceConnections = pgTable("marketplace_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => accounts.id),
  marketplace: varchar("marketplace", { length: 10 }).notNull(), // US, CA, MX, UK, DE, FR, IT, ES, JP, AU
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Amazon SP-API Credentials table
export const amazonCredentials = pgTable("amazon_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => accounts.id),
  lwaClientId: varchar("lwa_client_id", { length: 255 }).notNull(),
  lwaClientSecret: varchar("lwa_client_secret", { length: 255 }).notNull(),
  refreshToken: text("refresh_token").notNull(),
  region: varchar("region", { length: 20 }).notNull(), // NA, EU, FE (North America, Europe, Far East)
  sellerId: varchar("seller_id", { length: 255 }),
  marketplaceIds: text("marketplace_ids"), // JSON array of marketplace IDs
  isActive: boolean("is_active").notNull().default(true),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Listings table
export const listings = pgTable("listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => accounts.id),
  marketplace: varchar("marketplace", { length: 10 }).notNull(),
  asin: varchar("asin", { length: 20 }).notNull(),
  sku: varchar("sku", { length: 255 }),
  title: text("title").notNull(),
  imageUrl: text("image_url"),
  category: varchar("category", { length: 255 }),
  price: decimal("price", { precision: 10, scale: 2 }),
  stock: integer("stock"),
  status: varchar("status", { length: 50 }).notNull().default('active'), // active, inactive, suppressed, missing_info
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// PPC Campaigns table
export const ppcCampaigns = pgTable("ppc_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => accounts.id),
  marketplace: varchar("marketplace", { length: 10 }).notNull(),
  campaignName: varchar("campaign_name", { length: 255 }).notNull(),
  campaignType: varchar("campaign_type", { length: 50 }).notNull(), // sponsored_products, sponsored_brands, sponsored_display
  status: varchar("status", { length: 50 }).notNull().default('enabled'), // enabled, paused, archived
  dailyBudget: decimal("daily_budget", { precision: 10, scale: 2 }),
  spend: decimal("spend", { precision: 10, scale: 2 }).default('0'),
  sales: decimal("sales", { precision: 10, scale: 2 }).default('0'),
  acos: decimal("acos", { precision: 5, scale: 2 }), // Advertising Cost of Sale percentage
  clicks: integer("clicks").default(0),
  impressions: integer("impressions").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inventory table
export const inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => accounts.id),
  marketplace: varchar("marketplace", { length: 10 }).notNull(),
  sku: varchar("sku", { length: 255 }).notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  soh: integer("soh").notNull(), // Stock on Hand
  doh: integer("doh"), // Days on Hand
  restockQty: integer("restock_qty"), // Recommended restock quantity
  category: varchar("category", { length: 255 }),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dashboard metrics table (for storing aggregated data)
export const dashboardMetrics = pgTable("dashboard_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => accounts.id),
  marketplace: varchar("marketplace", { length: 10 }).notNull(),
  date: timestamp("date").notNull(),
  totalSales: decimal("total_sales", { precision: 12, scale: 2 }).default('0'),
  totalOrders: integer("total_orders").default(0),
  ppcSpend: decimal("ppc_spend", { precision: 10, scale: 2 }).default('0'),
  roas: decimal("roas", { precision: 5, scale: 2 }), // Return on Ad Spend
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  accountId: varchar("account_id").references(() => accounts.id),
  type: varchar("type", { length: 50 }).notNull(), // alert, warning, info
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userOrgRoles: many(userOrgRoles),
  notifications: many(notifications),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  userOrgRoles: many(userOrgRoles),
  accounts: many(accounts),
}));

export const userOrgRolesRelations = relations(userOrgRoles, ({ one }) => ({
  user: one(users, {
    fields: [userOrgRoles.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [userOrgRoles.organizationId],
    references: [organizations.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [accounts.organizationId],
    references: [organizations.id],
  }),
  marketplaceConnections: many(marketplaceConnections),
  amazonCredentials: many(amazonCredentials),
  listings: many(listings),
  ppcCampaigns: many(ppcCampaigns),
  inventory: many(inventory),
  dashboardMetrics: many(dashboardMetrics),
  notifications: many(notifications),
}));

export const marketplaceConnectionsRelations = relations(marketplaceConnections, ({ one }) => ({
  account: one(accounts, {
    fields: [marketplaceConnections.accountId],
    references: [accounts.id],
  }),
}));

export const amazonCredentialsRelations = relations(amazonCredentials, ({ one }) => ({
  account: one(accounts, {
    fields: [amazonCredentials.accountId],
    references: [accounts.id],
  }),
}));

export const listingsRelations = relations(listings, ({ one }) => ({
  account: one(accounts, {
    fields: [listings.accountId],
    references: [accounts.id],
  }),
}));

export const ppcCampaignsRelations = relations(ppcCampaigns, ({ one }) => ({
  account: one(accounts, {
    fields: [ppcCampaigns.accountId],
    references: [accounts.id],
  }),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  account: one(accounts, {
    fields: [inventory.accountId],
    references: [accounts.id],
  }),
}));

export const dashboardMetricsRelations = relations(dashboardMetrics, ({ one }) => ({
  account: one(accounts, {
    fields: [dashboardMetrics.accountId],
    references: [accounts.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [notifications.accountId],
    references: [accounts.id],
  }),
}));

// Insert schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMarketplaceConnectionSchema = createInsertSchema(marketplaceConnections).omit({
  id: true,
  createdAt: true,
});

export const insertListingSchema = createInsertSchema(listings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPPCCampaignSchema = createInsertSchema(ppcCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertAmazonCredentialsSchema = createInsertSchema(amazonCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

export type UserOrgRole = typeof userOrgRoles.$inferSelect;

export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;

export type InsertMarketplaceConnection = z.infer<typeof insertMarketplaceConnectionSchema>;
export type MarketplaceConnection = typeof marketplaceConnections.$inferSelect;

export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;

export type InsertPPCCampaign = z.infer<typeof insertPPCCampaignSchema>;
export type PPCCampaign = typeof ppcCampaigns.$inferSelect;

export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventory.$inferSelect;

export type DashboardMetric = typeof dashboardMetrics.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertAmazonCredentials = z.infer<typeof insertAmazonCredentialsSchema>;
export type AmazonCredentials = typeof amazonCredentials.$inferSelect;
