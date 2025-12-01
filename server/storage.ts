import {
  users,
  organizations,
  accounts,
  marketplaceConnections,
  userOrgRoles,
  listings,
  ppcCampaigns,
  inventory,
  dashboardMetrics,
  notifications,
  amazonCredentials,
  type User,
  type UpsertUser,
  type Organization,
  type InsertOrganization,
  type Account,
  type InsertAccount,
  type MarketplaceConnection,
  type InsertMarketplaceConnection,
  type Listing,
  type InsertListing,
  type PPCCampaign,
  type InsertPPCCampaign,
  type Inventory,
  type InsertInventory,
  type DashboardMetric,
  type Notification,
  type InsertNotification,
  type AmazonCredentials,
  type InsertAmazonCredentials,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  getOrganizationsByUser(userId: string): Promise<Organization[]>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  getOrCreateUserDefaultOrganization(userId: string, userName: string): Promise<Organization>;
  
  getAccountsByOrganization(organizationId: string): Promise<Account[]>;
  getAccountsByUser(userId: string): Promise<Account[]>;
  getAccount(id: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: string, updates: Partial<InsertAccount>): Promise<Account>;
  
  getMarketplaceConnectionsByAccount(accountId: string): Promise<MarketplaceConnection[]>;
  createMarketplaceConnection(connection: InsertMarketplaceConnection): Promise<MarketplaceConnection>;
  
  getListingsByAccount(accountId: string, marketplace: string): Promise<Listing[]>;
  createListing(listing: InsertListing): Promise<Listing>;
  
  getPPCCampaignsByAccount(accountId: string, marketplace: string): Promise<PPCCampaign[]>;
  createPPCCampaign(campaign: InsertPPCCampaign): Promise<PPCCampaign>;
  
  getInventoryByAccount(accountId: string, marketplace: string): Promise<Inventory[]>;
  createInventory(item: InsertInventory): Promise<Inventory>;
  
  getDashboardMetricsByAccount(accountId: string, marketplace: string): Promise<DashboardMetric[]>;
  
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
  
  getAmazonCredentialsByAccount(accountId: string): Promise<AmazonCredentials | undefined>;
  createAmazonCredentials(credentials: InsertAmazonCredentials): Promise<AmazonCredentials>;
  updateAmazonCredentials(id: string, updates: Partial<InsertAmazonCredentials>): Promise<AmazonCredentials>;
  updateLastSyncedAt(accountId: string): Promise<void>;
  deleteAmazonCredentials(accountId: string): Promise<void>;
  deleteAmazonCredentialById(credentialId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getOrganizationsByUser(userId: string): Promise<Organization[]> {
    const result = await db
      .select({ organization: organizations })
      .from(userOrgRoles)
      .innerJoin(organizations, eq(userOrgRoles.organizationId, organizations.id))
      .where(eq(userOrgRoles.userId, userId));
    
    return result.map(r => r.organization);
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [organization] = await db.insert(organizations).values(org).returning();
    return organization;
  }

  async getOrCreateUserDefaultOrganization(userId: string, userName: string): Promise<Organization> {
    // Check if user already has any organizations
    const existingOrgs = await this.getOrganizationsByUser(userId);
    
    if (existingOrgs.length > 0) {
      return existingOrgs[0]; // Return first organization
    }

    // Create a personal organization for the user
    const [organization] = await db
      .insert(organizations)
      .values({
        name: `${userName}'s Organization`,
        description: 'Personal organization',
      })
      .returning();

    // Link user to organization as admin
    await db.insert(userOrgRoles).values({
      userId,
      organizationId: organization.id,
      role: 'admin',
    });

    return organization;
  }

  async getAccountsByOrganization(organizationId: string): Promise<Account[]> {
    return await db
      .select()
      .from(accounts)
      .where(eq(accounts.organizationId, organizationId))
      .orderBy(desc(accounts.isFavorite), accounts.brandName);
  }

  async getAccountsByUser(userId: string): Promise<Account[]> {
    const userOrgs = await this.getOrganizationsByUser(userId);
    const allAccounts: Account[] = [];
    
    for (const org of userOrgs) {
      const orgAccounts = await this.getAccountsByOrganization(org.id);
      allAccounts.push(...orgAccounts);
    }
    
    return allAccounts;
  }

  async getAccount(id: string): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db.insert(accounts).values(account).returning();
    return newAccount;
  }

  async updateAccount(id: string, updates: Partial<InsertAccount>): Promise<Account> {
    const [updatedAccount] = await db
      .update(accounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(accounts.id, id))
      .returning();
    return updatedAccount;
  }

  async getMarketplaceConnectionsByAccount(accountId: string): Promise<MarketplaceConnection[]> {
    return await db
      .select()
      .from(marketplaceConnections)
      .where(eq(marketplaceConnections.accountId, accountId))
      .orderBy(desc(marketplaceConnections.isActive));
  }

  async createMarketplaceConnection(connection: InsertMarketplaceConnection): Promise<MarketplaceConnection> {
    const [newConnection] = await db.insert(marketplaceConnections).values(connection).returning();
    return newConnection;
  }

  async getListingsByAccount(accountId: string, marketplace: string): Promise<Listing[]> {
    return await db
      .select()
      .from(listings)
      .where(and(eq(listings.accountId, accountId), eq(listings.marketplace, marketplace)))
      .orderBy(desc(listings.updatedAt));
  }

  async createListing(listing: InsertListing): Promise<Listing> {
    const [newListing] = await db.insert(listings).values(listing).returning();
    return newListing;
  }

  async getPPCCampaignsByAccount(accountId: string, marketplace: string): Promise<PPCCampaign[]> {
    return await db
      .select()
      .from(ppcCampaigns)
      .where(and(eq(ppcCampaigns.accountId, accountId), eq(ppcCampaigns.marketplace, marketplace)))
      .orderBy(desc(ppcCampaigns.spend));
  }

  async createPPCCampaign(campaign: InsertPPCCampaign): Promise<PPCCampaign> {
    const [newCampaign] = await db.insert(ppcCampaigns).values(campaign).returning();
    return newCampaign;
  }

  async getInventoryByAccount(accountId: string, marketplace: string): Promise<Inventory[]> {
    return await db
      .select()
      .from(inventory)
      .where(and(eq(inventory.accountId, accountId), eq(inventory.marketplace, marketplace)))
      .orderBy(inventory.doh);
  }

  async createInventory(item: InsertInventory): Promise<Inventory> {
    const [newItem] = await db.insert(inventory).values(item).returning();
    return newItem;
  }

  async getDashboardMetricsByAccount(accountId: string, marketplace: string): Promise<DashboardMetric[]> {
    return await db
      .select()
      .from(dashboardMetrics)
      .where(and(eq(dashboardMetrics.accountId, accountId), eq(dashboardMetrics.marketplace, marketplace)))
      .orderBy(desc(dashboardMetrics.date))
      .limit(30);
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async getAmazonCredentialsByAccount(accountId: string): Promise<AmazonCredentials | undefined> {
    const [credentials] = await db
      .select()
      .from(amazonCredentials)
      .where(eq(amazonCredentials.accountId, accountId));
    return credentials;
  }

  async createAmazonCredentials(credentials: InsertAmazonCredentials): Promise<AmazonCredentials> {
    const [newCredentials] = await db
      .insert(amazonCredentials)
      .values(credentials)
      .returning();
    return newCredentials;
  }

  async updateAmazonCredentials(id: string, updates: Partial<InsertAmazonCredentials>): Promise<AmazonCredentials> {
    const [updatedCredentials] = await db
      .update(amazonCredentials)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(amazonCredentials.id, id))
      .returning();
    return updatedCredentials;
  }

  async updateLastSyncedAt(accountId: string): Promise<void> {
    await db
      .update(amazonCredentials)
      .set({ lastSyncedAt: new Date() })
      .where(eq(amazonCredentials.accountId, accountId));
  }

  async deleteAmazonCredentials(accountId: string): Promise<void> {
    await db
      .delete(amazonCredentials)
      .where(eq(amazonCredentials.accountId, accountId));
  }

  async deleteAmazonCredentialById(credentialId: string): Promise<void> {
    await db
      .delete(amazonCredentials)
      .where(eq(amazonCredentials.id, credentialId));
  }
}

export const storage = new DatabaseStorage();
