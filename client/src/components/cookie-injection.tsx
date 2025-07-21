import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Upload, Check } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export function CookieInjection() {
  const [cookieData, setCookieData] = useState('');
  const [isInjecting, setIsInjecting] = useState(false);
  const [injectionResult, setInjectionResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleInjectCookies = async () => {
    if (!cookieData.trim()) return;

    setIsInjecting(true);
    setInjectionResult(null);

    try {
      // Parse cookies from browser export format
      let cookies;
      try {
        // Try JSON format first
        cookies = JSON.parse(cookieData);
      } catch {
        // Try parsing Netscape format or other formats
        cookies = parseCookieString(cookieData);
      }

      const response = await apiRequest('/api/inject-cookies', {
        method: 'POST',
        body: JSON.stringify({ cookies }),
      });

      if (response.ok) {
        setInjectionResult({ success: true, message: 'Session cookies injected successfully! You can now search without authentication.' });
        setCookieData('');
      } else {
        throw new Error('Cookie injection failed');
      }
    } catch (error) {
      setInjectionResult({ success: false, message: 'Failed to inject cookies. Please check the format and try again.' });
    } finally {
      setIsInjecting(false);
    }
  };

  const parseCookieString = (cookieString: string) => {
    // Parse simple key=value format
    return cookieString.split('\n').map(line => {
      const [name, value] = line.split('=');
      return {
        name: name?.trim(),
        value: value?.trim(),
        domain: '.cardinalhealth.com',
        path: '/'
      };
    }).filter(cookie => cookie.name && cookie.value);
  };

  return (
    <Card className="pharma-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Session Cookie Injection
        </CardTitle>
        <CardDescription>
          Bypass authentication by injecting your browser's session cookies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>How to extract cookies:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Go to Kinray portal in your browser (where you're logged in)</li>
              <li>Press F12 → Application tab → Cookies → kinrayweblink.cardinalhealth.com</li>
              <li>Copy all cookies or use browser extension to export as JSON</li>
              <li>Paste the cookie data below</li>
            </ol>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <label className="text-sm font-medium">Cookie Data</label>
          <Textarea
            placeholder="Paste your browser cookies here (JSON format or key=value pairs)"
            value={cookieData}
            onChange={(e) => setCookieData(e.target.value)}
            rows={8}
            className="font-mono text-xs"
          />
        </div>

        <Button 
          onClick={handleInjectCookies}
          disabled={!cookieData.trim() || isInjecting}
          className="w-full"
        >
          {isInjecting ? (
            "Injecting Cookies..."
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Inject Session Cookies
            </>
          )}
        </Button>

        {injectionResult && (
          <Alert variant={injectionResult.success ? "default" : "destructive"}>
            {injectionResult.success ? (
              <Check className="h-4 w-4" />
            ) : (
              <Info className="h-4 w-4" />
            )}
            <AlertDescription>
              {injectionResult.message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}