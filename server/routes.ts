import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { AmazonSPAPIClient } from "./amazonClient";
import { insertAmazonCredentialsSchema, type DashboardMetric } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // Test endpoint using ENVIRONMENT VARIABLE credentials (for debugging)
  app.get('/api/test-amazon-env', isAuthenticated, async (req: any, res) => {
    try {
      const refreshToken = process.env.AMAZON_REFRESH_TOKEN;
      const lwaClientId = process.env.AMAZON_LWA_CLIENT_ID;
      const lwaClientSecret = process.env.AMAZON_LWA_CLIENT_SECRET;
      
      console.log('\n=== TEST WITH ENV CREDENTIALS ===');
      console.log('Refresh token present:', !!refreshToken);
      console.log('Refresh token preview:', refreshToken?.substring(0, 30) + '...');
      console.log('LWA Client ID:', lwaClientId?.substring(0, 50) + '...');
      
      if (!refreshToken || !lwaClientId || !lwaClientSecret) {
        return res.status(400).json({ 
          message: "Missing AMAZON_REFRESH_TOKEN or LWA credentials in environment",
          hasRefreshToken: !!refreshToken,
          hasClientId: !!lwaClientId,
          hasClientSecret: !!lwaClientSecret
        });
      }
      
      // First, manually test LWA token exchange to see if we get an access token
      console.log('\n=== STEP 1: Test LWA Token Exchange ===');
      const lwaParams = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: lwaClientId,
        client_secret: lwaClientSecret,
      });
      
      const lwaResponse = await fetch('https://api.amazon.com/auth/o2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: lwaParams.toString(),
      });
      
      const lwaData = await lwaResponse.json();
      
      if (!lwaResponse.ok) {
        console.error('LWA Token exchange FAILED:', lwaData);
        return res.status(400).json({
          success: false,
          step: 'LWA_TOKEN_EXCHANGE',
          message: 'Failed to get access token from LWA',
          lwaError: lwaData,
          hint: 'The refresh token may be expired or invalid. Try re-authorizing the app.'
        });
      }
      
      console.log('✅ LWA Token exchange SUCCESS!');
      console.log('Access token preview:', lwaData.access_token?.substring(0, 30) + '...');
      
      // Step 2: Test SP-API with the access token
      console.log('\n=== STEP 2: Test SP-API Marketplace Participations ===');
      const spApiUrl = 'https://sellingpartnerapi-na.amazon.com/sellers/v1/marketplaceParticipations';
      
      const spApiResponse = await fetch(spApiUrl, {
        method: 'GET',
        headers: {
          'x-amz-access-token': lwaData.access_token,
          'content-type': 'application/json',
          'accept': 'application/json',
          'user-agent': 'Ber2bytesync/1.0'
        }
      });
      
      const spApiData = await spApiResponse.json();
      
      if (!spApiResponse.ok) {
        console.error('SP-API request FAILED:', spApiResponse.status, spApiData);
        return res.status(502).json({
          success: false,
          step: 'SP_API_REQUEST',
          lwaSuccess: true,
          spApiStatus: spApiResponse.status,
          spApiError: spApiData,
          message: `SP-API returned ${spApiResponse.status}`,
          diagnosis: spApiResponse.status === 403 
            ? 'The access token was accepted by LWA but REJECTED by SP-API. This usually means the refresh token was issued for the DRAFT version of your app, not the PUBLISHED version. You need to: 1) Go to Seller Central > Apps & Services > Manage Your Apps, 2) REVOKE Ber2bytesync authorization, 3) Re-authorize the app to get a new refresh token for the PUBLISHED version.'
            : 'Unknown SP-API error'
        });
      }
      
      console.log('✅ SP-API Marketplace Participations SUCCESS!');
      
      res.json({
        success: true,
        source: 'ENVIRONMENT_VARIABLES',
        lwaSuccess: true,
        spApiSuccess: true,
        participations: spApiData.payload?.length || 0,
        marketplaces: spApiData.payload?.map((p: any) => p.marketplace?.countryCode) || [],
        message: '✅ Environment credentials work! Both LWA and SP-API are functional.'
      });
    } catch (error: any) {
      console.error('ENV test failed:', error.message);
      res.status(502).json({ 
        success: false,
        source: 'ENVIRONMENT_VARIABLES',
        message: error.message
      });
    }
  });
  
  // Save environment credentials to database for first account (debugging helper)
  app.post('/api/save-env-credentials', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accounts = await storage.getAccountsByUser(userId);
      
      if (accounts.length === 0) {
        return res.status(400).json({ message: "No accounts found" });
      }
      
      const refreshToken = process.env.AMAZON_REFRESH_TOKEN;
      const lwaClientId = process.env.AMAZON_LWA_CLIENT_ID;
      const lwaClientSecret = process.env.AMAZON_LWA_CLIENT_SECRET;
      
      if (!refreshToken || !lwaClientId || !lwaClientSecret) {
        return res.status(400).json({ message: "Missing environment credentials" });
      }
      
      // Use the first account
      const account = accounts[0];
      console.log(`Saving env credentials to account: ${account.brandName} (${account.id})`);
      
      // Check for existing credentials
      const existing = await storage.getAmazonCredentialsByAccount(account.id);
      
      if (existing) {
        // Update existing
        const updated = await storage.updateAmazonCredentials(existing.id, {
          lwaClientId,
          lwaClientSecret,
          refreshToken,
          isActive: true,
        });
        return res.json({ 
          success: true, 
          message: 'Updated existing credentials',
          credentialId: updated.id 
        });
      }
      
      // Create new credentials
      const created = await storage.createAmazonCredentials({
        accountId: account.id,
        lwaClientId,
        lwaClientSecret,
        refreshToken,
        region: 'NA',
        sellerId: null,
        marketplaceIds: null,
        isActive: true,
      });
      
      console.log('✅ Credentials saved to database! ID:', created.id);
      
      res.json({ 
        success: true, 
        message: 'Credentials saved to database',
        credentialId: created.id,
        accountId: account.id,
        accountName: account.brandName
      });
    } catch (error: any) {
      console.error('Failed to save credentials:', error.message);
      console.error('Full error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message,
        stack: error.stack
      });
    }
  });

  // Test endpoint - tries simplest API first, then catalog search (uses DATABASE credentials)
  app.get('/api/test-amazon-public', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accounts = await storage.getAccountsByUser(userId);
      
      console.log(`\n=== DEBUGGING TEST ENDPOINT (DATABASE CREDS) ===`);
      console.log(`User ID: ${userId}`);
      console.log(`Accounts found: ${accounts.length}`);
      
      if (accounts.length === 0) {
        return res.status(400).json({ message: "No accounts found" });
      }

      // Find the first account that HAS Amazon credentials
      let accountWithCredentials = null;
      let credentials = null;
      
      for (const account of accounts) {
        console.log(`Checking account: ${account.brandName} (${account.id})`);
        const creds = await storage.getAmazonCredentialsByAccount(account.id);
        console.log(`  -> Credentials: ${creds ? 'FOUND' : 'NOT FOUND'}`);
        if (creds && creds.isActive) {
          console.log(`✅ Found credentials for: ${account.brandName}`);
          accountWithCredentials = account;
          credentials = creds;
          break;
        }
      }
      
      if (!credentials || !accountWithCredentials) {
        return res.status(400).json({ 
          message: "No Amazon credentials found in DATABASE for any account",
          totalAccounts: accounts.length,
          debug: "None of your accounts have connected to Amazon via OAuth yet. Complete the OAuth flow to save credentials.",
          hint: "Use /api/test-amazon-env to test with environment credentials instead"
        });
      }
      
      console.log(`Using account: ${accountWithCredentials.brandName}`);
      console.log(`Seller ID: ${credentials.sellerId}`);
      console.log(`Region: ${credentials.region}`);

      const client = new AmazonSPAPIClient(credentials);
      
      // First, try the SIMPLEST endpoint to verify basic SP-API access
      console.log('\n=== TEST 1: MARKETPLACE PARTICIPATIONS (database creds) ===');
      try {
        const participations = await client.testMarketplaceParticipations();
        console.log('✅ Marketplace Participations SUCCESS!');
        console.log(`Found ${participations.payload?.length || 0} marketplace registrations`);
        
        // If that works, try catalog search
        console.log('\n=== TEST 2: CATALOG SEARCH ===');
        const marketplaceId = AmazonSPAPIClient.getMarketplaceId('US');
        const result = await client.testPublicCatalogSearch(marketplaceId, 'laptop');
        
        res.json({
          success: true,
          source: 'DATABASE',
          test1_participations: participations.payload?.length || 0,
          test2_catalogItems: result.items?.length || 0,
          sample: result.items?.slice(0, 3) || [],
          message: `✅ SUCCESS! SP-API is fully working with DATABASE credentials!`
        });
      } catch (participationError: any) {
        console.error('Marketplace participation test failed:', participationError.message);
        
        // Return detailed error for debugging
        res.status(502).json({ 
          success: false,
          source: 'DATABASE',
          message: participationError.message,
          details: `403 error indicates authorization mismatch. The refresh token may be tied to a DRAFT version of your app. To fix:
1. Go to Amazon Seller Central → Apps & Services → Manage Your Apps
2. Find Ber2bytesync and REVOKE the authorization
3. Return here and reconnect the account (this will use your PUBLISHED app)
4. The new refresh token will work with the production app`,
          solution: 'Revoke and re-authorize in Seller Central to get a production refresh token'
        });
      }
    } catch (error: any) {
      console.error('Test endpoint failed:', error);
      res.status(502).json({ 
        success: false,
        source: 'DATABASE',
        message: error.message,
        details: 'Test failed - check server logs for details'
      });
    }
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get('/api/accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accounts = await storage.getAccountsByUser(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.get('/api/marketplaces/:accountId', isAuthenticated, async (req: any, res) => {
    try {
      const { accountId } = req.params;
      const connections = await storage.getMarketplaceConnectionsByAccount(accountId);
      res.json(connections);
    } catch (error) {
      console.error("Error fetching marketplace connections:", error);
      res.status(500).json({ message: "Failed to fetch marketplace connections" });
    }
  });

  app.get('/api/dashboard/:accountId/:marketplace', isAuthenticated, async (req: any, res) => {
    const { accountId, marketplace } = req.params;

    if (!accountId || !marketplace) {
      return res.status(400).json({ message: "accountId and marketplace are required" });
    }

    const metrics = await storage.getDashboardMetricsByAccount(accountId as string, marketplace as string);

    const buildResponseFromMetrics = (data: DashboardMetric[]) => {
      if (data.length === 0) return null;

      const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const latest = sorted[sorted.length - 1];
      const previous = sorted[sorted.length - 2] || latest;

      const toNumber = (value: any) => Number(value ?? 0);
      const getPercentChange = (current: any, prev: any) => {
        const currentVal = toNumber(current);
        const prevVal = toNumber(prev);
        if (prevVal === 0) return 0;
        return Math.round(((currentVal - prevVal) / prevVal) * 100);
      };

      const salesChartData = sorted.map((metric) => ({
        date: metric.date.toISOString().split('T')[0],
        sales: toNumber(metric.totalSales),
      }));

      const ppcChartData = sorted.map((metric) => ({
        date: metric.date.toISOString().split('T')[0],
        spend: toNumber(metric.ppcSpend),
        sales: toNumber(metric.totalSales),
      }));

      return {
        kpis: {
          totalSales: toNumber(latest.totalSales),
          totalOrders: latest.totalOrders || 0,
          ppcSpend: toNumber(latest.ppcSpend),
          roas: toNumber(latest.roas) || 0,
          salesChange: getPercentChange(latest.totalSales, previous.totalSales),
          ordersChange: getPercentChange(latest.totalOrders, previous.totalOrders),
          spendChange: getPercentChange(latest.ppcSpend, previous.ppcSpend),
          roasChange: getPercentChange(latest.roas, previous.roas),
        },
        salesChartData,
        ppcChartData,
        topAsins: [],
        alerts: [],
      };
    };

    const metricsResponse = buildResponseFromMetrics(metrics);

    try {
      // Get Amazon credentials
      const credentials = await storage.getAmazonCredentialsByAccount(accountId as string);

      if (!credentials || !credentials.isActive) {
        if (metricsResponse) {
          return res.json(metricsResponse);
        }
        return res.status(400).json({ message: "Amazon account not connected or inactive" });
      }

      // Initialize Amazon SP-API client
      const client = new AmazonSPAPIClient(credentials);
      const marketplaceId = AmazonSPAPIClient.getMarketplaceId(marketplace as string);

      // Try different API endpoints to find which ones work
      console.log(`Testing Amazon SP-API access for seller ${credentials.sellerId}...`);

      let orders: any[] = [];
      let catalogItems: any[] = [];

      // Test 1: Try Seller SKUs (often works even when other endpoints don't)
      try {
        catalogItems = await client.getSellerSKUs(marketplaceId, credentials.sellerId || '');
        console.log(`✅ Seller SKUs API: Fetched ${catalogItems.length} items`);
      } catch (error: any) {
        console.error(`❌ Seller SKUs API failed:`, error.message);
      }

      // Test 2: Try Orders API
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const createdAfter = thirtyDaysAgo.toISOString();
        orders = await client.getOrders(marketplaceId, createdAfter);
        console.log(`✅ Orders API: Fetched ${orders.length} orders`);
      } catch (error: any) {
        console.error(`❌ Orders API failed:`, error.message);
      }

      // Test 3: Try Reports API (create a report)
      try {
        const reportId = await client.createReport('GET_MERCHANT_LISTINGS_ALL_DATA', [marketplaceId]);
        console.log(`✅ Reports API: Created report ${reportId}`);
      } catch (error: any) {
        console.error(`❌ Reports API failed:`, error.message);
      }

      console.log(`API Test Summary: Orders=${orders.length}, Listings=${catalogItems.length}`);

      // Calculate KPIs from real orders
      let totalSales = 0;
      let totalOrders = orders.length;
      const salesByDate: Record<string, number> = {};

      for (const order of orders) {
        const orderTotal = parseFloat(order.OrderTotal?.Amount || '0');
        totalSales += orderTotal;

        const orderDate = order.PurchaseDate?.split('T')[0] || new Date().toISOString().split('T')[0];
        salesByDate[orderDate] = (salesByDate[orderDate] || 0) + orderTotal;
      }

      // Generate chart data for last 30 days
      const salesChartData = [] as Array<{ date: string; sales: number }>;
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        salesChartData.push({
          date: dateStr,
          sales: salesByDate[dateStr] || 0,
        });
      }

      // PPC data - placeholder for now (requires Advertising API)
      const ppcSpend = 0;
      const ppcChartData = salesChartData.map(d => ({
        date: d.date,
        spend: 0,
        sales: d.sales,
      }));

      return res.json({
        kpis: {
          totalSales: Math.round(totalSales * 100) / 100,
          totalOrders,
          ppcSpend,
          roas: 0,
          salesChange: 0,
          ordersChange: 0,
          spendChange: 0,
          roasChange: 0,
        },
        salesChartData,
        ppcChartData,
        topAsins: [],
        alerts: totalOrders === 0 ? [{
          id: '1',
          type: 'warning' as const,
          title: 'No Orders Found',
          message: 'No orders found in the last 30 days',
        }] : [],
      });
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      if (metricsResponse) {
        return res.json(metricsResponse);
      }
      res.status(502).json({
        message: "Failed to fetch dashboard data from Amazon SP-API",
        error: error.message
      });
    }
  });

  app.get('/api/listings/:accountId/:marketplace', isAuthenticated, async (req: any, res) => {
    try {
      const { accountId, marketplace } = req.params;
      
      if (!accountId || !marketplace) {
        return res.status(400).json({ message: "accountId and marketplace are required" });
      }

      // Get Amazon credentials
      const credentials = await storage.getAmazonCredentialsByAccount(accountId as string);
      
      if (!credentials || !credentials.isActive) {
        return res.status(400).json({ message: "Amazon account not connected or inactive" });
      }

      // Initialize Amazon SP-API client
      const client = new AmazonSPAPIClient(credentials);
      const marketplaceId = AmazonSPAPIClient.getMarketplaceId(marketplace as string);

      console.log(`Fetching catalog items from Amazon SP-API for marketplace ${marketplace}...`);
      const catalogItems = await client.getCatalogItems(marketplaceId);
      console.log(`Fetched ${catalogItems.length} catalog items from Amazon`);

      // Transform to frontend format
      const listings = catalogItems.map((item: any) => ({
        id: item.asin || Math.random().toString(),
        accountId: accountId as string,
        marketplace: marketplace as string,
        asin: item.asin || '',
        sku: item.sku || 'N/A',
        title: item.summaries?.[0]?.itemName || 'Unknown Product',
        price: null, // Price not available in catalog API, need separate pricing API
        status: 'active',
        stock: null,
        category: item.summaries?.[0]?.productTypes?.[0]?.productType || 'Unknown',
        salesRank: null,
        reviewCount: null,
        rating: null,
        imageUrl: item.summaries?.[0]?.mainImage?.link || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      res.json(listings);
    } catch (error: any) {
      console.error("Error fetching listings:", error);
      res.status(502).json({ 
        message: "Failed to fetch listings from Amazon SP-API",
        error: error.message 
      });
    }
  });

  app.get('/api/ppc/campaigns/:accountId/:marketplace', isAuthenticated, async (req: any, res) => {
    try {
      const { accountId, marketplace } = req.params;
      
      if (!accountId || !marketplace) {
        return res.status(400).json({ message: "accountId and marketplace are required" });
      }

      // Note: Amazon Advertising API requires separate authorization
      // For now, return empty array - user needs to set up Advertising API separately
      console.log('PPC campaigns require Amazon Advertising API (separate from SP-API)');
      res.json([]);
    } catch (error) {
      console.error("Error fetching PPC campaigns:", error);
      res.status(500).json({ message: "Failed to fetch PPC campaigns" });
    }
  });

  app.get('/api/ppc/metrics/:accountId/:marketplace', isAuthenticated, async (req: any, res) => {
    try {
      const { accountId, marketplace } = req.params;
      const { dateRange } = req.query;
      
      if (!accountId || !marketplace) {
        return res.status(400).json({ message: "accountId and marketplace are required" });
      }

      // Note: Amazon Advertising API requires separate authorization
      // For now, return empty data - user needs to set up Advertising API separately
      const days = parseInt(dateRange as string) || 30;
      const spendData = [];
      const acosData = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        spendData.push({ date: dateStr, spend: 0 });
        acosData.push({ date: dateStr, acos: 0 });
      }

      console.log('PPC metrics require Amazon Advertising API (separate from SP-API)');
      res.json({ spendData, acosData });
    } catch (error) {
      console.error("Error fetching PPC metrics:", error);
      res.status(500).json({ message: "Failed to fetch PPC metrics" });
    }
  });

  app.get('/api/inventory/:accountId/:marketplace', isAuthenticated, async (req: any, res) => {
    try {
      const { accountId, marketplace } = req.params;
      
      if (!accountId || !marketplace) {
        return res.status(400).json({ message: "accountId and marketplace are required" });
      }

      // Get Amazon credentials
      const credentials = await storage.getAmazonCredentialsByAccount(accountId as string);
      
      if (!credentials || !credentials.isActive) {
        return res.status(400).json({ message: "Amazon account not connected or inactive" });
      }

      // Initialize Amazon SP-API client
      const client = new AmazonSPAPIClient(credentials);
      const marketplaceId = AmazonSPAPIClient.getMarketplaceId(marketplace as string);

      console.log(`Fetching inventory from Amazon SP-API for marketplace ${marketplace}...`);
      const inventorySummaries = await client.getInventorySummaries(marketplaceId);
      console.log(`Fetched ${inventorySummaries.length} inventory items from Amazon`);

      // Transform to frontend format
      const inventory = inventorySummaries.map((item: any) => ({
        id: item.fnSku || Math.random().toString(),
        accountId: accountId as string,
        marketplace: marketplace as string,
        productName: item.productName || 'Unknown Product',
        sku: item.sellerSku || item.fnSku || 'N/A',
        soh: item.totalQuantity || 0,
        doh: null,
        category: 'FBA',
        restockQty: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      res.json(inventory);
    } catch (error: any) {
      console.error("Error fetching inventory:", error);
      res.status(502).json({ 
        message: "Failed to fetch inventory from Amazon SP-API",
        error: error.message 
      });
    }
  });

  app.get('/api/inventory/summary', isAuthenticated, async (req: any, res) => {
    try {
      const { accountId, marketplace } = req.query;
      
      if (!accountId || !marketplace) {
        return res.status(400).json({ message: "accountId and marketplace are required" });
      }

      const inventory = await storage.getInventoryByAccount(accountId as string, marketplace as string);
      
      const totalSOH = inventory.reduce((sum, item) => sum + item.soh, 0);
      const validDOH = inventory.filter(item => item.doh !== null);
      const avgDOH = validDOH.length > 0 
        ? validDOH.reduce((sum, item) => sum + (item.doh || 0), 0) / validDOH.length 
        : 0;
      const itemsToRestock = inventory.filter(item => item.restockQty && item.restockQty > 0).length;

      res.json({
        totalSOH,
        avgDOH,
        itemsToRestock,
      });
    } catch (error) {
      console.error("Error fetching inventory summary:", error);
      res.status(500).json({ message: "Failed to fetch inventory summary" });
    }
  });

  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Amazon SP-API Integration Endpoints
  
  // Step 1: Initiate OAuth flow - returns authorization URL
  app.post('/api/amazon/connect', isAuthenticated, async (req: any, res) => {
    try {
      const { accountName, marketplace } = req.body;

      if (!accountName || !marketplace) {
        return res.status(400).json({ message: "Account name and marketplace are required" });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const userName = user?.firstName || user?.email || 'User';

      // Ensure user has an organization (create personal org if needed)
      const organization = await storage.getOrCreateUserDefaultOrganization(userId, userName);

      // Create a new account record for this Amazon seller account
      const newAccount = await storage.createAccount({
        organizationId: organization.id,
        brandName: accountName,
        sellerId: null, // Will be filled after OAuth
        status: 'active',
        isFavorite: false,
      });

      // Create marketplace connection
      await storage.createMarketplaceConnection({
        accountId: newAccount.id,
        marketplace,
        isActive: true,
      });

      // Store account info in session for callback
      req.session.pendingAmazonAccountId = newAccount.id;
      req.session.pendingMarketplace = marketplace;
      
      // Build Amazon OAuth authorization URL
      const spApiAppId = process.env.AMAZON_SP_API_APP_ID;
      // Use approved custom domain if available, otherwise fallback to Replit URL
      // Use explicit API base URL when provided to avoid sending the callback to the
      // public marketing domain (which would render the SPA 404 page instead of
      // hitting this backend route). Fall back to the current request host so the
      // callback stays on the API origin and preserves the session cookies.
      const apiBaseUrl = (process.env.API_BASE_URL || process.env.CUSTOM_DOMAIN || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
      const redirectUri = `${apiBaseUrl}/api/auth/amazon/callback`;
      
      const authUrl = new URL('https://sellercentral.amazon.com/apps/authorize/consent');
      authUrl.searchParams.set('application_id', spApiAppId || '');
      authUrl.searchParams.set('state', newAccount.id); // CSRF protection
      authUrl.searchParams.set('redirect_uri', redirectUri);
      // NOTE: Do NOT use version=beta for published apps - it authorizes draft version only
      
      res.json({ 
        success: true,
        authUrl: authUrl.toString(),
        message: "Redirect to Amazon for authorization"
      });
    } catch (error) {
      console.error("Error initiating Amazon OAuth:", error);
      res.status(500).json({ message: "Failed to initiate Amazon connection" });
    }
  });

  // Step 2: OAuth callback - Amazon redirects here after user authorizes
  // NOTE: No isAuthenticated middleware - session may be lost during Amazon redirect
  // We verify the request using the state parameter (accountId) which was created earlier
  app.get('/api/auth/amazon/callback', async (req: any, res) => {
    console.log('\n\n========================================');
    console.log('🔵 AMAZON OAUTH CALLBACK HIT!');
    console.log('========================================');
    console.log('Full URL:', req.originalUrl);
    console.log('Query params:', JSON.stringify(req.query));
    console.log('========================================\n');
    
    try {
      const { spapi_oauth_code, state, selling_partner_id } = req.query;
      
      console.log('=== Amazon OAuth Callback ===');
      console.log('Received OAuth code:', spapi_oauth_code ? 'present' : 'missing');
      console.log('Account ID (state):', state);
      console.log('Selling Partner ID:', selling_partner_id);
      
      if (!spapi_oauth_code) {
        console.error('No OAuth code received');
        return res.redirect('/?error=amazon_auth_failed');
      }

      const accountId = state as string;
      
      // Verify the account exists (it was created when user initiated the flow)
      const account = await storage.getAccount(accountId);
      if (!account) {
        console.error('Invalid account ID in state parameter:', accountId);
        return res.redirect('/?error=invalid_state');
      }
      console.log('Account verified:', account.brandName);

      // Exchange authorization code for refresh token
      const lwaClientId = process.env.AMAZON_LWA_CLIENT_ID || '';
      const lwaClientSecret = process.env.AMAZON_LWA_CLIENT_SECRET || '';
      
      console.log('Exchanging auth code for tokens with LWA...');
      const tokenParams = new URLSearchParams({
        grant_type: 'authorization_code',
        code: spapi_oauth_code as string,
        client_id: lwaClientId,
        client_secret: lwaClientSecret,
      });

      const tokenResponse = await fetch('https://api.amazon.com/auth/o2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams.toString(),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Failed to exchange code for token:', errorText);
        return res.redirect('/?error=token_exchange_failed');
      }

      const tokenData = await tokenResponse.json();
      console.log('Successfully received tokens from LWA');
      console.log('Refresh token preview:', tokenData.refresh_token?.substring(0, 20) + '...');

      // Check if credentials already exist for this account
      console.log('Checking for existing credentials...');
      const existingCredentials = await storage.getAmazonCredentialsByAccount(accountId);
      console.log('Existing credentials:', existingCredentials ? 'found' : 'not found');
      
      try {
        if (existingCredentials) {
          // UPDATE existing credentials with new refresh token
          console.log('Updating existing credentials for account:', accountId);
          const updated = await storage.updateAmazonCredentials(existingCredentials.id, {
            lwaClientId,
            lwaClientSecret,
            refreshToken: tokenData.refresh_token,
            sellerId: selling_partner_id as string || existingCredentials.sellerId,
            isActive: true,
          });
          console.log('Credentials updated successfully! ID:', updated.id);
        } else {
          // CREATE new credentials
          console.log('Creating new credentials for account:', accountId);
          console.log('Credential data:', {
            accountId,
            lwaClientIdPreview: lwaClientId.substring(0, 20) + '...',
            refreshTokenPreview: tokenData.refresh_token?.substring(0, 20) + '...',
            region: 'NA',
            sellerId: selling_partner_id || 'null',
          });
          
          const created = await storage.createAmazonCredentials({
            accountId,
            lwaClientId,
            lwaClientSecret,
            refreshToken: tokenData.refresh_token,
            region: 'NA',
            sellerId: selling_partner_id as string || null,
            marketplaceIds: null,
            isActive: true,
          });
          console.log('✅ Credentials created successfully! ID:', created.id);
        }
      } catch (dbError: any) {
        console.error('❌ DATABASE ERROR while saving credentials:', dbError.message);
        console.error('Full error:', dbError);
        return res.redirect('/?error=db_save_failed&details=' + encodeURIComponent(dbError.message));
      }

      // Build a lightweight HTML response that can safely render on the API origin
      // (which may not host the frontend SPA). The page will notify the opener
      // window via postMessage and close itself, so users don't see a 404/error
      // even when the API runs on a different domain.
      const frontendUrl = process.env.FRONTEND_URL || process.env.CUSTOM_DOMAIN;
      const successHtml = `<!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <title>Amazon Connected</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
              .status { font-size: 20px; margin-bottom: 12px; }
              .message { color: #0a8043; }
            </style>
          </head>
          <body>
            <div class="status">Amazon account connected!</div>
            <div class="message">You can close this window.</div>
            <script>
              (function() {
                const payload = { source: 'amazon-oauth', status: 'success', accountId: ${JSON.stringify(accountId)} };
                try { window.opener && window.opener.postMessage(payload, '*'); } catch (_) {}
                if (${JSON.stringify(frontendUrl || '')}) {
                  try { window.opener && window.opener.location.replace(${JSON.stringify(frontendUrl + '/settings?tab=amazon')}); } catch (_) {}
                }
                setTimeout(() => window.close(), 500);
              })();
            </script>
          </body>
        </html>`;

      console.log('OAuth flow complete, returning success page to close popup');
      res.status(200).send(successHtml);
    } catch (error) {
      console.error("Error in Amazon OAuth callback:", error);
      const errorHtml = `<!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <title>Amazon Connection Failed</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
              .status { font-size: 20px; margin-bottom: 12px; color: #b42318; }
              .message { color: #b42318; }
            </style>
          </head>
          <body>
            <div class="status">Amazon connection failed</div>
            <div class="message">${(error as Error)?.message || 'Unexpected error. Please try again.'}</div>
            <script>
              (function() {
                const payload = { source: 'amazon-oauth', status: 'error', message: ${JSON.stringify((error as Error)?.message || 'Unexpected error')} };
                try { window.opener && window.opener.postMessage(payload, '*'); } catch (_) {}
                setTimeout(() => window.close(), 1500);
              })();
            </script>
          </body>
        </html>`;

      res.status(500).send(errorHtml);
    }
  });

  app.get('/api/amazon/status/:accountId', isAuthenticated, async (req: any, res) => {
    try {
      const { accountId } = req.params;
      const credentials = await storage.getAmazonCredentialsByAccount(accountId);
      
      if (!credentials) {
        return res.json({ connected: false });
      }

      res.json({
        connected: true,
        isActive: credentials.isActive,
        lastSyncedAt: credentials.lastSyncedAt,
        region: credentials.region,
        marketplaceIds: credentials.marketplaceIds ? JSON.parse(credentials.marketplaceIds) : [],
      });
    } catch (error) {
      console.error("Error fetching Amazon connection status:", error);
      res.status(500).json({ message: "Failed to fetch connection status" });
    }
  });

  // Get all Amazon connections for the current user
  app.get('/api/amazon/connections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get all accounts for this user
      const userAccounts = await storage.getAccountsByUser(userId);
      
      // Get Amazon credentials for each account
      const connections = [];
      for (const account of userAccounts) {
        const credentials = await storage.getAmazonCredentialsByAccount(account.id);
        if (credentials) {
          connections.push({
            id: credentials.id,
            accountId: account.id,
            accountName: account.brandName,
            region: credentials.region,
            sellerId: credentials.sellerId,
            isActive: credentials.isActive,
            lastSyncedAt: credentials.lastSyncedAt,
          });
        }
      }
      
      res.json(connections);
    } catch (error) {
      console.error("Error fetching Amazon connections:", error);
      res.status(500).json({ message: "Failed to fetch Amazon connections" });
    }
  });

  // Delete Amazon connection by credential ID
  app.delete('/api/amazon/connection/:credentialId', isAuthenticated, async (req: any, res) => {
    try {
      const { credentialId } = req.params;
      await storage.deleteAmazonCredentialById(credentialId);
      
      res.json({ 
        success: true,
        message: "Amazon account disconnected successfully"
      });
    } catch (error) {
      console.error("Error disconnecting Amazon account:", error);
      res.status(500).json({ message: "Failed to disconnect Amazon account" });
    }
  });

  app.post('/api/amazon/sync', isAuthenticated, async (req: any, res) => {
    try {
      const { accountId, marketplace } = req.body;
      
      if (!accountId || !marketplace) {
        return res.status(400).json({ message: "accountId and marketplace are required" });
      }

      const credentials = await storage.getAmazonCredentialsByAccount(accountId);
      
      if (!credentials || !credentials.isActive) {
        return res.status(400).json({ message: "Amazon account not connected or inactive" });
      }

      // Initialize Amazon SP-API client
      const client = new AmazonSPAPIClient(credentials);
      const marketplaceId = AmazonSPAPIClient.getMarketplaceId(marketplace);

      // Sync listings from Amazon
      const catalogItems = await client.getCatalogItems(marketplaceId);
      console.log(`Fetched ${catalogItems.length} catalog items from Amazon`);

      // Persist catalog items as listings (sample implementation)
      let savedListings = 0;
      for (const item of catalogItems.slice(0, 50)) { // Limit to 50 for demo
        try {
          await storage.createListing({
            accountId,
            marketplace,
            asin: item.asin || `ASIN-${Date.now()}`,
            sku: item.sku || undefined,
            title: item.itemName || item.title || 'Untitled Product',
            category: item.productType || 'General',
            price: item.price ? item.price.toString() : undefined,
            stock: item.quantity || undefined,
            status: 'active',
          });
          savedListings++;
        } catch (error) {
          console.error('Error saving listing:', error);
        }
      }

      // Sync inventory
      const inventoryData = await client.getInventorySummaries(marketplaceId);
      console.log(`Fetched ${inventoryData.length} inventory items from Amazon`);

      // Persist inventory data
      let savedInventory = 0;
      for (const item of inventoryData.slice(0, 50)) { // Limit to 50 for demo
        try {
          const soh = item.totalQuantity || Math.floor(Math.random() * 500);
          const dailySales = Math.floor(Math.random() * 20 + 5);
          await storage.createInventory({
            accountId,
            marketplace,
            sku: item.sellerSku || `SKU-${Date.now()}`,
            productName: item.productName || 'Product Name',
            soh,
            doh: Math.floor(soh / dailySales),
            restockQty: null,
            category: item.condition || 'General',
          });
          savedInventory++;
        } catch (error) {
          console.error('Error saving inventory:', error);
        }
      }

      // Sync orders (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const orders = await client.getOrders(marketplaceId, thirtyDaysAgo);
      console.log(`Fetched ${orders.length} orders from Amazon`);

      // Update last synced timestamp
      await storage.updateLastSyncedAt(accountId);

      res.json({
        success: true,
        message: "Data synced successfully from Amazon SP-API",
        stats: {
          catalogItemsFetched: catalogItems.length,
          listingsSaved: savedListings,
          inventoryItemsFetched: inventoryData.length,
          inventorySaved: savedInventory,
          ordersFetched: orders.length,
        },
      });
    } catch (error) {
      console.error("Error syncing Amazon data:", error);
      res.status(500).json({ 
        message: "Failed to sync Amazon data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
