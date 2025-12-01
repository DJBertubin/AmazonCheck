import type { AmazonCredentials } from "@shared/schema";

interface SPAPIConfig {
  region: string;
  lwaClientId: string;
  lwaClientSecret: string;
  refreshToken: string;
}

interface AccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Amazon SP-API endpoints
const SP_API_ENDPOINTS: Record<string, string> = {
  NA: "sellingpartnerapi-na.amazon.com",
  EU: "sellingpartnerapi-eu.amazon.com",
  FE: "sellingpartnerapi-fe.amazon.com",
};

// Amazon LWA (Login with Amazon) token endpoint
const LWA_TOKEN_URL = "https://api.amazon.com/auth/o2/token";

// Marketplace ID mappings
const MARKETPLACE_IDS: Record<string, string> = {
  US: "ATVPDKIKX0DER",
  CA: "A2EUQ1WTGCTBG2",
  MX: "A1AM78C64UM0Y8",
  UK: "A1F83G8C2ARO7P",
  DE: "A1PA6795UKMFR9",
  FR: "A13V1IB3VIYZZH",
  IT: "APJ6JRA9NG5V4",
  ES: "A1RKKUPIHCS9HS",
  JP: "A1VC38T7YXB528",
  AU: "A39IBJ37TRP1C6",
};

/**
 * Amazon SP-API Client - LWA-only authentication (October 2023+)
 * 
 * As of October 2, 2023, Amazon SP-API no longer requires:
 * - AWS IAM credentials
 * - AWS Signature Version 4 signing
 * 
 * Authentication is now handled exclusively via LWA OAuth 2.0 tokens.
 */
export class AmazonSPAPIClient {
  private config: SPAPIConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(credentials: AmazonCredentials) {
    // ALWAYS use environment secrets for LWA credentials
    // The refresh token must have been issued for these same credentials
    const envLwaClientId = process.env.AMAZON_LWA_CLIENT_ID || '';
    const envLwaClientSecret = process.env.AMAZON_LWA_CLIENT_SECRET || '';
    
    // Log credential comparison for debugging
    console.log('=== SP-API Credential Check ===');
    console.log('Environment LWA Client ID:', envLwaClientId.substring(0, 40) + '...');
    console.log('Database LWA Client ID:', credentials.lwaClientId.substring(0, 40) + '...');
    console.log('Client IDs match:', envLwaClientId === credentials.lwaClientId);
    console.log('Refresh token preview:', credentials.refreshToken.substring(0, 20) + '...');
    
    // Warn if there's a mismatch
    if (envLwaClientId && envLwaClientId !== credentials.lwaClientId) {
      console.warn('WARNING: Environment LWA Client ID does not match database! This will cause 403 errors.');
      console.warn('The refresh token was issued for a different LWA client.');
    }
    
    this.config = {
      region: credentials.region,
      // Use environment secrets - they should match the published app
      lwaClientId: envLwaClientId || credentials.lwaClientId,
      lwaClientSecret: envLwaClientSecret || credentials.lwaClientSecret,
      refreshToken: credentials.refreshToken,
    };

    console.log(`Initializing SP-API client for region: ${credentials.region} (LWA-only auth)`);
  }

  /**
   * Get access token using refresh token (OAuth 2.0)
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      console.log('Using cached access token');
      return this.accessToken;
    }

    console.log('Requesting new access token from LWA...');
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: this.config.refreshToken,
      client_id: this.config.lwaClientId,
      client_secret: this.config.lwaClientSecret,
    });

    const response = await fetch(LWA_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('LWA token error:', response.status, errorBody);
      throw new Error(`Failed to get access token: ${response.statusText} - ${errorBody}`);
    }

    const data: AccessTokenResponse = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

    console.log('Successfully obtained access token, expires in:', data.expires_in, 'seconds');
    return this.accessToken;
  }

  /**
   * Make authenticated request to SP-API using LWA token only
   * No AWS SigV4 signing required as of October 2023!
   */
  private async makeRequest(
    path: string,
    method: string = "GET",
    marketplaceIds?: string[],
    body?: any
  ): Promise<any> {
    const accessToken = await this.getAccessToken();
    const hostname = SP_API_ENDPOINTS[this.config.region] || SP_API_ENDPOINTS.NA;

    // Build URL
    const [basePath, existingQuery] = path.split("?");
    const url = new URL(`https://${hostname}${basePath}`);

    if (existingQuery) {
      existingQuery.split("&").forEach(param => {
        const [key, value] = param.split("=");
        if (key) {
          url.searchParams.set(key, decodeURIComponent(value ?? ""));
        }
      });
    }

    if (marketplaceIds && marketplaceIds.length > 0) {
      url.searchParams.set("marketplaceIds", marketplaceIds.join(","));
    }

    // Simple LWA-only headers - no SigV4, no IAM
    const headers: Record<string, string> = {
      "x-amz-access-token": accessToken,
      "content-type": "application/json",
      "accept": "application/json",
      "user-agent": "Ber2bytesync/1.0 (Language=TypeScript)"
    };

    console.log("SP-API request URL:", url.toString());
    console.log("SP-API request headers:", JSON.stringify(headers, null, 2));

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`SP-API Error - Status: ${response.status}, URL: ${url.toString()}`);
      console.error(`SP-API Error Response: ${errorText}`);
      throw new Error(`SP-API request failed (${response.status}): ${errorText}`);
    }

    const responseData = await response.json();
    console.log("SP-API Success - Received data:", JSON.stringify(responseData).substring(0, 200));
    return responseData;
  }

  /**
   * Get catalog items (listings) from Amazon
   */
  async getCatalogItems(marketplaceId: string): Promise<any[]> {
    const path = "/catalog/2022-04-01/items";
    const data = await this.makeRequest(path, 'GET', [marketplaceId]);
    return data.items || [];
  }

  /**
   * Test simplest endpoint - marketplace participations (requires minimal permissions)
   */
  async testMarketplaceParticipations(): Promise<any> {
    console.log(`\nTesting SIMPLEST endpoint: /sellers/v1/marketplaceParticipations`);
    const path = `/sellers/v1/marketplaceParticipations`;
    const data = await this.makeRequest(path, 'GET');
    console.log(`Marketplace participations SUCCESS - Found ${data.payload?.length || 0} marketplaces`);
    return data;
  }

  /**
   * Test public catalog search endpoint (non-restricted)
   */
  async testPublicCatalogSearch(marketplaceId: string, keywords: string = 'laptop'): Promise<any> {
    console.log(`\nTesting PUBLIC catalog search endpoint with keywords: "${keywords}"`);
    const path = `/catalog/2022-04-01/items?keywords=${encodeURIComponent(keywords)}`;
    const data = await this.makeRequest(path, 'GET', [marketplaceId]);
    console.log(`Public catalog search SUCCESS - Found ${data.items?.length || 0} items`);
    return data;
  }

  /**
   * Get seller's own SKUs using the Catalog Items API (search by seller)
   */
  async getSellerSKUs(marketplaceId: string, sellerId: string): Promise<any[]> {
    try {
      const path = `/catalog/2022-04-01/items?sellerId=${sellerId}&pageSize=20`;
      const data = await this.makeRequest(path, 'GET', [marketplaceId]);
      return data.items || [];
    } catch (error: any) {
      console.error("Error fetching seller SKUs:", error.message);
      return [];
    }
  }

  /**
   * Create a report request
   */
  async createReport(reportType: string, marketplaceIds: string[]): Promise<string> {
    const path = "/reports/2021-06-30/reports";
    const body = {
      reportType,
      marketplaceIds,
    };
    const data = await this.makeRequest(path, 'POST', undefined, body);
    return data.reportId;
  }

  /**
   * Get report document
   */
  async getReport(reportId: string): Promise<any> {
    const path = `/reports/2021-06-30/reports/${reportId}`;
    return await this.makeRequest(path, 'GET');
  }

  /**
   * Get inventory summary
   */
  async getInventorySummaries(marketplaceId: string): Promise<any[]> {
    const path = "/fba/inventory/v1/summaries";
    const data = await this.makeRequest(path, 'GET', [marketplaceId]);
    return data.inventorySummaries || [];
  }

  /**
   * Get orders
   */
  async getOrders(marketplaceId: string, createdAfter: string): Promise<any[]> {
    const path = `/orders/v0/orders?CreatedAfter=${createdAfter}`;
    const data = await this.makeRequest(path, 'GET', [marketplaceId]);
    return data.Orders || [];
  }

  /**
   * Get seller metrics
   */
  async getSellerMetrics(marketplaceId: string): Promise<any> {
    try {
      const path = "/sales/v1/orderMetrics";
      const data = await this.makeRequest(path, 'GET', [marketplaceId]);
      return data;
    } catch (error) {
      console.error("Error fetching seller metrics:", error);
      return null;
    }
  }

  /**
   * Get advertising campaigns (Sponsored Products)
   */
  async getAdvertisingCampaigns(profileId: string): Promise<any[]> {
    try {
      const path = `/sp/campaigns?stateFilter=enabled,paused,archived`;
      const data = await this.makeRequest(path, 'GET');
      return data || [];
    } catch (error) {
      console.error("Error fetching ad campaigns:", error);
      return [];
    }
  }

  /**
   * Convert marketplace code to Amazon marketplace ID
   */
  static getMarketplaceId(marketplace: string): string {
    return MARKETPLACE_IDS[marketplace] || MARKETPLACE_IDS.US;
  }

  /**
   * Get all supported marketplaces for a region
   */
  static getMarketplacesForRegion(region: string): string[] {
    const regionMarketplaces: Record<string, string[]> = {
      NA: ["US", "CA", "MX"],
      EU: ["UK", "DE", "FR", "IT", "ES"],
      FE: ["JP", "AU"],
    };
    return regionMarketplaces[region] || [];
  }
}
