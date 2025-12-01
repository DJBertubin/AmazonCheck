import { db } from "./db";
import { storage } from "./storage";
import { userOrgRoles } from "@shared/schema";

async function seed() {
  console.log("Starting database seed...");

  try {
    // Create a demo user
    const user = await storage.upsertUser({
      id: "demo-user-123",
      email: "demo@example.com",
      firstName: "Demo",
      lastName: "User",
      profileImageUrl: null,
    });

    console.log("Created user:", user.email);

    const org = await storage.createOrganization({
      name: "Demo Agency",
      description: "Sample agency managing multiple Amazon seller accounts",
    });

    console.log("Created organization:", org.name);

    // Link user to organization
    await db.insert(userOrgRoles).values({
      userId: user.id,
      organizationId: org.id,
      role: "admin",
    });

    console.log("Linked user to organization");

    const account1 = await storage.createAccount({
      organizationId: org.id,
      brandName: "Premium Home Goods",
      sellerId: "A1B2C3D4E5F6G7",
      status: "active",
      isFavorite: true,
    });

    const account2 = await storage.createAccount({
      organizationId: org.id,
      brandName: "Tech Accessories Plus",
      sellerId: "H8I9J0K1L2M3N4",
      status: "active",
      isFavorite: false,
    });

    const account3 = await storage.createAccount({
      organizationId: org.id,
      brandName: "Outdoor Adventures",
      sellerId: "O5P6Q7R8S9T0U1",
      status: "inactive",
      isFavorite: false,
    });

    console.log("Created 3 sample accounts");

    for (const account of [account1, account2, account3]) {
      await storage.createMarketplaceConnection({
        accountId: account.id,
        marketplace: "US",
        isActive: true,
      });

      await storage.createMarketplaceConnection({
        accountId: account.id,
        marketplace: "CA",
        isActive: true,
      });

      await storage.createMarketplaceConnection({
        accountId: account.id,
        marketplace: "UK",
        isActive: false,
      });
    }

    console.log("Created marketplace connections");

    for (let i = 0; i < 10; i++) {
      await storage.createListing({
        accountId: account1.id,
        marketplace: "US",
        asin: `B0${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        sku: `SKU-${1000 + i}`,
        title: `Premium Product ${i + 1} - High Quality Home Essential`,
        category: i % 3 === 0 ? "Home & Kitchen" : i % 3 === 1 ? "Electronics" : "Sports & Outdoors",
        price: (Math.random() * 100 + 20).toFixed(2),
        stock: Math.floor(Math.random() * 200),
        status: i % 5 === 0 ? "suppressed" : i % 7 === 0 ? "inactive" : "active",
      });
    }

    for (let i = 0; i < 8; i++) {
      await storage.createListing({
        accountId: account2.id,
        marketplace: "US",
        asin: `B0${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        sku: `TECH-${2000 + i}`,
        title: `Tech Accessory ${i + 1} - Latest Innovation`,
        category: "Electronics",
        price: (Math.random() * 50 + 10).toFixed(2),
        stock: Math.floor(Math.random() * 150),
        status: i % 6 === 0 ? "missing_info" : "active",
      });
    }

    console.log("Created sample listings");

    for (let i = 0; i < 5; i++) {
      await storage.createPPCCampaign({
        accountId: account1.id,
        marketplace: "US",
        campaignName: `Premium Campaign ${i + 1}`,
        campaignType: i % 2 === 0 ? "sponsored_products" : "sponsored_brands",
        status: i === 4 ? "paused" : "enabled",
        dailyBudget: (Math.random() * 100 + 50).toFixed(2),
        spend: (Math.random() * 500 + 100).toFixed(2),
        sales: (Math.random() * 2000 + 500).toFixed(2),
        acos: (Math.random() * 30 + 15).toFixed(2),
        clicks: Math.floor(Math.random() * 1000 + 200),
        impressions: Math.floor(Math.random() * 10000 + 2000),
      });
    }

    for (let i = 0; i < 4; i++) {
      await storage.createPPCCampaign({
        accountId: account2.id,
        marketplace: "US",
        campaignName: `Tech Campaign ${i + 1}`,
        campaignType: "sponsored_products",
        status: "enabled",
        dailyBudget: (Math.random() * 80 + 40).toFixed(2),
        spend: (Math.random() * 400 + 80).toFixed(2),
        sales: (Math.random() * 1500 + 300).toFixed(2),
        acos: (Math.random() * 25 + 20).toFixed(2),
        clicks: Math.floor(Math.random() * 800 + 150),
        impressions: Math.floor(Math.random() * 8000 + 1500),
      });
    }

    console.log("Created PPC campaigns");

    for (let i = 0; i < 12; i++) {
      const soh = Math.floor(Math.random() * 500 + 50);
      const dailySales = Math.floor(Math.random() * 20 + 5);
      const doh = Math.floor(soh / dailySales);
      
      await storage.createInventory({
        accountId: account1.id,
        marketplace: "US",
        sku: `SKU-${1000 + i}`,
        productName: `Premium Product ${i + 1}`,
        soh,
        doh,
        restockQty: doh < 30 ? Math.floor(Math.random() * 200 + 100) : null,
        category: i % 3 === 0 ? "Home & Kitchen" : i % 3 === 1 ? "Electronics" : "Sports & Outdoors",
      });
    }

    for (let i = 0; i < 8; i++) {
      const soh = Math.floor(Math.random() * 400 + 40);
      const dailySales = Math.floor(Math.random() * 15 + 4);
      const doh = Math.floor(soh / dailySales);
      
      await storage.createInventory({
        accountId: account2.id,
        marketplace: "US",
        sku: `TECH-${2000 + i}`,
        productName: `Tech Accessory ${i + 1}`,
        soh,
        doh,
        restockQty: doh < 25 ? Math.floor(Math.random() * 150 + 80) : null,
        category: "Electronics",
      });
    }

    console.log("Created inventory items");

    // Create dashboard metrics for the past 60 days
    const today = new Date();
    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Metrics for account1 US marketplace
      const baseSales = 2000 + Math.random() * 1000;
      const baseOrders = 50 + Math.floor(Math.random() * 30);
      const ppcSpend = 150 + Math.random() * 100;
      
      await db.insert((await import("@shared/schema")).dashboardMetrics).values({
        accountId: account1.id,
        marketplace: "US",
        date,
        totalSales: Number(baseSales.toFixed(2)),
        totalOrders: baseOrders,
        sessions: baseOrders * (15 + Math.floor(Math.random() * 10)),
        conversionRate: Number((5 + Math.random() * 5).toFixed(2)),
        ppcSpend: Number(ppcSpend.toFixed(2)),
        roas: Number((baseSales / ppcSpend).toFixed(2)),
      });

      // Metrics for account1 CA marketplace
      const caSales = 1200 + Math.random() * 600;
      const caOrders = 30 + Math.floor(Math.random() * 20);
      const caPpcSpend = 80 + Math.random() * 50;
      
      await db.insert((await import("@shared/schema")).dashboardMetrics).values({
        accountId: account1.id,
        marketplace: "CA",
        date,
        totalSales: Number(caSales.toFixed(2)),
        totalOrders: caOrders,
        sessions: caOrders * (12 + Math.floor(Math.random() * 8)),
        conversionRate: Number((4 + Math.random() * 4).toFixed(2)),
        ppcSpend: Number(caPpcSpend.toFixed(2)),
        roas: Number((caSales / caPpcSpend).toFixed(2)),
      });

      // Metrics for account2 US marketplace
      const acc2Sales = 1500 + Math.random() * 800;
      const acc2Orders = 40 + Math.floor(Math.random() * 25);
      const acc2PpcSpend = 100 + Math.random() * 70;
      
      await db.insert((await import("@shared/schema")).dashboardMetrics).values({
        accountId: account2.id,
        marketplace: "US",
        date,
        totalSales: Number(acc2Sales.toFixed(2)),
        totalOrders: acc2Orders,
        sessions: acc2Orders * (14 + Math.floor(Math.random() * 9)),
        conversionRate: Number((4.5 + Math.random() * 4.5).toFixed(2)),
        ppcSpend: Number(acc2PpcSpend.toFixed(2)),
        roas: Number((acc2Sales / acc2PpcSpend).toFixed(2)),
      });
    }

    console.log("Created dashboard metrics for 60 days");

    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
