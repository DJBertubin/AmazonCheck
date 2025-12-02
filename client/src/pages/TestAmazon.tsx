import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface TestResult {
  success: boolean;
  message: string;
  itemsFound?: number;
  sample?: any[];
  details?: string;
  solution?: string;
}

export default function TestAmazon() {
  const { data, isLoading, error, refetch } = useQuery<TestResult>({
    queryKey: ['/api/test-amazon-public'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/test-amazon-public', { credentials: 'include' });
        const text = await res.text();

        let parsed: any = {};
        try {
          parsed = text ? JSON.parse(text) : {};
        } catch {
          parsed = { message: text || res.statusText };
        }

        const gatewayHint = [502, 503, 504].includes(res.status)
          ? 'The API server is unreachable. Start the backend or check the proxy configuration and try again.'
          : undefined;

        if (!res.ok) {
          return {
            success: false,
            message: parsed.message || res.statusText || 'Request failed',
            details: parsed.details || parsed.diagnosis || gatewayHint,
            solution: parsed.solution ?? gatewayHint,
            sample: parsed.sample,
          } satisfies TestResult;
        }

        return {
          success: true,
          message: parsed.message || 'Test succeeded',
          itemsFound: parsed.test2_catalogItems ?? parsed.itemsFound,
          sample: parsed.sample,
        } satisfies TestResult;
      } catch (err: any) {
        return {
          success: false,
          message: err?.message || 'Request failed',
          details: 'Network error while calling /api/test-amazon-public. Verify the API server is reachable.',
        } satisfies TestResult;
      }
    },
    enabled: false, // Don't auto-run
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Amazon SP-API Test</h1>
        <p className="text-muted-foreground mt-2">
          Test the public catalog search endpoint to verify your Amazon SP-API approval is active
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Public Catalog Search Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This test calls a non-restricted catalog endpoint: <code className="bg-muted px-2 py-1 rounded text-xs">GET /catalog/2022-04-01/items?keywords=laptop</code>
          </p>
          
          <Button 
            onClick={() => refetch()} 
            disabled={isLoading}
            className="hover-elevate active-elevate-2"
            data-testid="button-test-api"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Testing...' : 'Run Test'}
          </Button>

          {data && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                {data.success ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">{data.message}</span>
                    </div>
                    <div className="text-sm">
                      <strong>Items Found:</strong> {data.itemsFound}
                    </div>
                    {data.sample && data.sample.length > 0 && (
                      <div className="mt-4">
                        <strong className="text-sm">Sample Results:</strong>
                        <pre className="mt-2 p-3 bg-background rounded text-xs overflow-auto max-h-64">
                          {JSON.stringify(data.sample, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-destructive">
                      <XCircle className="h-5 w-5" />
                      <span className="font-semibold">Test Failed</span>
                    </div>
                  <div className="text-sm">
                    <strong>Error:</strong> {data.message}
                  </div>
                  {(data.details || data.solution) && (
                    <div className="text-sm text-muted-foreground space-y-2">
                      {data.details && <p>{data.details}</p>}
                      {data.solution && (
                        <p className="font-medium text-foreground">Solution: {data.solution}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            </Card>
          )}

          {error && (
            <Card className="bg-destructive/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" />
                  <span className="font-semibold">Request Failed</span>
                </div>
                <p className="text-sm mt-2">{error.message}</p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What This Test Means</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong className="text-green-600">✅ If the test succeeds:</strong>
            <p className="text-muted-foreground mt-1">Your Amazon SP-API approval is fully active! All endpoints should work within a few hours.</p>
          </div>
          <div>
            <strong className="text-destructive">❌ If you still get 403 errors:</strong>
            <p className="text-muted-foreground mt-1">
              The API approval is still propagating through Amazon's systems. This can take 24-48 hours after receiving the approval email. 
              Try again tomorrow.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
