import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function DirectManualInstructions() {
  const [cookiesText, setCookiesText] = useState('');
  const [isInjecting, setIsInjecting] = useState(false);
  const [injectionStatus, setInjectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const { toast } = useToast();

  const handleInjectCookies = async () => {
    if (!cookiesText.trim()) {
      toast({
        title: "No cookies provided",
        description: "Please paste your cookies from the browser",
        variant: "destructive"
      });
      return;
    }

    setIsInjecting(true);
    try {
      // Parse cookies (assuming JSON format or simple text)
      let cookies;
      try {
        cookies = JSON.parse(cookiesText);
      } catch {
        // Try to parse as simple text format
        const lines = cookiesText.split('\n').filter(line => line.trim());
        cookies = lines.map(line => {
          const [name, value] = line.split('=');
          return {
            name: name?.trim(),
            value: value?.trim(),
            domain: '.kinrayweblink.cardinalhealth.com'
          };
        }).filter(cookie => cookie.name && cookie.value);
      }

      const response = await fetch('/api/inject-cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookies })
      });

      const result = await response.json();

      if (response.ok) {
        setInjectionStatus('success');
        toast({
          title: "Cookies injected successfully",
          description: `Stored ${result.cookieCount} session cookies. You can now search medications.`,
        });
      } else {
        setInjectionStatus('error');
        toast({
          title: "Cookie injection failed",
          description: result.error || "Failed to inject cookies",
          variant: "destructive"
        });
      }
    } catch (error) {
      setInjectionStatus('error');
      toast({
        title: "Error processing cookies",
        description: "Please check your cookie format and try again",
        variant: "destructive"
      });
    } finally {
      setIsInjecting(false);
    }
  };

  return (
    <Card className="pharma-card">
      <CardHeader>
        <CardTitle>Manual Cookie Extraction (Railway Required)</CardTitle>
        <CardDescription>
          Railway deployment cannot run browser automation. Extract cookies manually from your logged-in browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <Alert>
          <ExternalLink className="h-4 w-4" />
          <AlertDescription>
            <strong>Step 1:</strong> Open{' '}
            <a 
              href="https://kinrayweblink.cardinalhealth.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium"
            >
              kinrayweblink.cardinalhealth.com
            </a>{' '}
            and log in completely (including 2FA if required)
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-medium">Step 2: Extract Cookies</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm bg-muted p-4 rounded-lg">
            <li>Press <kbd className="px-2 py-1 bg-background rounded text-xs">F12</kbd> to open Developer Tools</li>
            <li>Click the <strong>Application</strong> tab</li>
            <li>In the left sidebar, expand <strong>Cookies</strong></li>
            <li>Click on <strong>https://kinrayweblink.cardinalhealth.com</strong></li>
            <li>Select all cookies and copy them</li>
          </ol>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">Step 3: Paste Cookies Here</h4>
          <Textarea
            value={cookiesText}
            onChange={(e) => setCookiesText(e.target.value)}
            placeholder="Paste your cookies here (JSON format or name=value format, one per line)"
            className="min-h-[120px] font-mono text-sm"
            disabled={isInjecting}
          />
          
          <Button 
            onClick={handleInjectCookies}
            disabled={isInjecting || !cookiesText.trim()}
            className="w-full"
          >
            {isInjecting ? 'Injecting Cookies...' : 'Inject Session Cookies'}
          </Button>
          
          {injectionStatus === 'success' && (
            <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Cookies successfully injected! You can now search medications.</span>
            </div>
          )}
        </div>

        <Alert>
          <AlertDescription>
            <strong>Alternative:</strong> If you're having trouble, you can also copy cookies as JSON format:
            <code className="block mt-2 text-xs bg-background p-2 rounded">
              {"[{\"name\":\"JSESSIONID\",\"value\":\"ABC123\",\"domain\":\"...\"}]"}
            </code>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}