import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutList, TrendingUp, Package, BarChart3, Shield, Check, Globe, DollarSign, Star, MessageCircle, Layers } from 'lucide-react';
import logoImage from '@assets/Ber2bytes Web copy_1763529860811.png';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img src={logoImage} alt="ber2bytesync logo" className="w-32 h-32" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            Ber2bytesync
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Professional Amazon Seller Central management platform for agencies and sellers. 
            Manage unlimited Amazon seller accounts, track real-time performance metrics, analyze PPC campaigns, monitor inventory levels, and optimize product listings across all marketplaces from one unified dashboard.
          </p>
          <Button
            size="lg"
            className="text-lg px-8 py-6 rounded-xl hover-elevate active-elevate-2"
            asChild
            data-testid="button-login"
          >
            <a href="/api/login">
              Get Started Free
            </a>
          </Button>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-4">Features</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Complete Amazon Seller Central integration with real-time data synchronization via Amazon SP-API
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: LayoutList,
                title: 'Multi-Account Management',
                description: 'Manage unlimited Amazon seller accounts from a single dashboard. Seamlessly switch between accounts with instant data refresh and account-specific performance insights. Perfect for agencies managing multiple clients or sellers with multiple brands.',
              },
              {
                icon: BarChart3,
                title: 'Performance Analytics Dashboard',
                description: 'Real-time performance metrics including total sales, order volume, revenue trends, and growth analytics. View sales charts, order trends, and KPI tracking across all your Amazon marketplaces with data synced directly from Amazon SP-API.',
              },
              {
                icon: TrendingUp,
                title: 'PPC Campaign Analytics',
                description: 'Monitor Amazon Advertising (PPC) campaign performance with detailed metrics including ad spend, ACOS (Advertising Cost of Sale), ROAS (Return on Ad Spend), clicks, impressions, and conversion tracking across all campaigns.',
              },
              {
                icon: Package,
                title: 'Inventory Monitoring',
                description: 'Track FBA inventory levels, stock on hand, days of inventory remaining, and receive restock alerts. Monitor inventory health across all SKUs and marketplaces to prevent stockouts and optimize inventory turnover.',
              },
              {
                icon: Shield,
                title: 'Listing Health Analyzer',
                description: 'Analyze product listing quality, identify suppressed listings, detect missing required information (images, bullet points, descriptions), track listing status, and find optimization opportunities to improve product visibility and conversions.',
              },
              {
                icon: Globe,
                title: 'Global Marketplace Support',
                description: 'Full support for all Amazon marketplaces: North America (US, CA, MX), Europe (UK, DE, FR, IT, ES), and Asia-Pacific (JP, AU). Switch between marketplaces instantly and view market-specific performance data.',
              },
              {
                icon: DollarSign,
                title: 'Automated Pricing',
                description: 'Dynamic repricing engine that automatically adjusts your product prices based on competitor pricing, Buy Box status, inventory levels, and custom pricing rules. Maximize profits while staying competitive across all marketplaces.',
              },
              {
                icon: Star,
                title: 'Feedback and Reviews',
                description: 'Monitor customer feedback and product reviews in real-time. Track review ratings, sentiment analysis, and automated alerts for negative feedback. Respond quickly to customer concerns and improve seller performance metrics.',
              },
              {
                icon: MessageCircle,
                title: 'Buyer/Seller Messaging',
                description: 'Centralized inbox for all buyer-seller messages across multiple accounts and marketplaces. Manage customer inquiries, automate responses, track response times, and maintain excellent customer communication from one dashboard.',
              },
              {
                icon: Layers,
                title: 'Multi-Channel',
                description: 'Synchronize inventory, orders, and pricing across Amazon and other sales channels (Shopify, eBay, Walmart, etc.). Prevent overselling, centralize order fulfillment, and manage your entire ecommerce operation from one platform.',
              },
            ].map((feature, index) => (
              <Card key={index} className="rounded-xl hover-elevate">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mb-16" id="pricing">
          <h2 className="text-3xl font-bold text-center mb-4">Pricing</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Simple, transparent pricing. No hidden fees.
          </p>
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            <Card className="rounded-xl hover-elevate">
              <CardHeader>
                <CardTitle className="text-2xl">Free</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Up to 3 Amazon seller accounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Basic analytics dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">All marketplace support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Real-time SP-API data sync</span>
                  </li>
                </ul>
                <Button className="w-full rounded-xl hover-elevate active-elevate-2" variant="outline" asChild>
                  <a href="/api/login">Start Free</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-xl hover-elevate border-primary shadow-lg">
              <CardHeader>
                <div className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full mb-2">
                  Most Popular
                </div>
                <CardTitle className="text-2xl">Professional</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$49</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Up to 15 Amazon seller accounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Advanced analytics &amp; reporting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">PPC campaign tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Inventory monitoring &amp; alerts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Listing health analyzer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Priority email support</span>
                  </li>
                </ul>
                <Button className="w-full rounded-xl hover-elevate active-elevate-2" asChild>
                  <a href="/api/login">Get Started</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-xl hover-elevate">
              <CardHeader>
                <CardTitle className="text-2xl">Agency</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$199</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Unlimited Amazon seller accounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">All Professional features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Multi-user team access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">White-label options</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">API access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Dedicated account manager</span>
                  </li>
                </ul>
                <Button className="w-full rounded-xl hover-elevate active-elevate-2" variant="outline" asChild>
                  <a href="/api/login">Contact Sales</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="rounded-xl bg-primary text-primary-foreground">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to streamline your Amazon seller operations?</h2>
            <p className="text-lg mb-6 opacity-90">
              Start managing your Amazon seller accounts with real-time data from Amazon SP-API
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 py-6 rounded-xl hover-elevate active-elevate-2"
              asChild
              data-testid="button-cta-login"
            >
              <a href="/api/login">
                Get Started Free - No Credit Card Required
              </a>
            </Button>
          </CardContent>
        </Card>

        <div className="mt-16 pt-8 border-t text-center text-sm text-muted-foreground">
          <p className="mb-2">
            <strong>Data Privacy:</strong> Ber2bytesync uses Amazon SP-API to securely access your seller data. We never store sensitive information and comply with Amazon's data protection requirements.
          </p>
          <p>
            <strong>Support:</strong> For questions or assistance, contact us at admin@ber2bytes.com
          </p>
        </div>
      </div>
    </div>
  );
}
