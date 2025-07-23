import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ManualCookieInterfaceProps {
  onCookiesInjected: () => void;
}

export function ManualCookieInterface({ onCookiesInjected }: ManualCookieInterfaceProps) {
  const [cookieJson, setCookieJson] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const cookieTemplate = `[
  {
    "name": "JSESSIONID",
    "value": "YOUR_SESSION_ID_HERE",
    "domain": ".kinrayweblink.cardinalhealth.com",
    "path": "/",
    "httpOnly": true,
    "secure": true
  },
  {
    "name": "abck",
    "value": "YOUR_ABCK_VALUE_HERE",
    "domain": ".cardinalhealth.com",
    "path": "/",
    "httpOnly": false,
    "secure": true
  }
]`;

  const instructions = [
    {
      step: "1. Log into Kinray Portal",
      description: "Open kinrayweblink.cardinalhealth.com and log in completely",
      icon: "🌐"
    },
    {
      step: "2. Open Developer Tools",
      description: "Press F12 or right-click → Inspect",
      icon: "🔧"
    },
    {
      step: "3. Navigate to Cookies",
      description: "Go to Application → Cookies → kinrayweblink.cardinalhealth.com",
      icon: "🍪"
    },
    {
      step: "4. Copy All Cookies",
      description: "Select all cookies and copy them in JSON format",
      icon: "📋"
    }
  ];

  const handleInjectCookies = async () => {
    if (!cookieJson.trim()) {
      setStatus('error');
      setMessage('Please paste your cookies in JSON format');
      return;
    }

    setIsProcessing(true);
    setStatus('idle');
    setMessage('');

    try {
      // Validate JSON format
      const cookies = JSON.parse(cookieJson);
      
      if (!Array.isArray(cookies)) {
        throw new Error('Cookies must be an array of cookie objects');
      }

      const response = await fetch('/api/inject-cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookies })
      });

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        setMessage(`Successfully stored ${result.cookieCount} session cookies`);
        onCookiesInjected();
      } else {
        setStatus('error');
        setMessage(result.error || 'Failed to inject cookies');
      }
    } catch (err) {
      setStatus('error');
      if (err instanceof SyntaxError) {
        setMessage('Invalid JSON format. Please check your cookie data.');
      } else {
        setMessage('Network error during cookie injection');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const copyTemplate = () => {
    navigator.clipboard.writeText(cookieTemplate);
    setMessage('Template copied to clipboard');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <Card className="pharma-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Manual Cookie Extraction</span>
          <Badge variant="outline">Required for Railway</Badge>
        </CardTitle>
        <CardDescription>
          Browser automation is not available on Railway. Please extract cookies manually from your browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Instructions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Step-by-Step Instructions</h3>
          
          <div className="grid gap-3">
            {instructions.map((instruction, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                <span className="text-2xl">{instruction.icon}</span>
                <div>
                  <h4 className="font-medium">{instruction.step}</h4>
                  <p className="text-sm text-muted-foreground">{instruction.description}</p>
                </div>
              </div>
            ))}
          </div>

          <Alert>
            <ExternalLink className="h-4 w-4" />
            <AlertDescription>
              Make sure you're fully logged into{' '}
              <a 
                href="https://kinrayweblink.cardinalhealth.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                kinrayweblink.cardinalhealth.com
              </a>{' '}
              before extracting cookies.
            </AlertDescription>
          </Alert>
        </div>

        {/* Cookie Template */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Cookie Template</h3>
            <Button variant="outline" size="sm" onClick={copyTemplate}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Template
            </Button>
          </div>
          
          <Textarea
            value={cookieTemplate}
            readOnly
            className="font-mono text-sm min-h-[200px]"
            placeholder="Cookie template will appear here..."
          />
        </div>

        {/* Cookie Input */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Paste Your Cookies</h3>
          <Textarea
            value={cookieJson}
            onChange={(e) => setCookieJson(e.target.value)}
            placeholder="Paste your extracted cookies in JSON format here..."
            className="font-mono text-sm min-h-[150px]"
            disabled={isProcessing}
          />
          
          <Button 
            onClick={handleInjectCookies}
            disabled={isProcessing || !cookieJson.trim()}
            className="w-full"
          >
            {isProcessing ? 'Injecting Cookies...' : 'Inject Session Cookies'}
          </Button>
        </div>

        {/* Status Messages */}
        {status === 'success' && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800 dark:text-green-200">Success</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-800 dark:text-red-200">Error</span>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{message}</p>
          </div>
        )}

        {message && status === 'idle' && (
          <p className="text-sm text-muted-foreground text-center">{message}</p>
        )}
      </CardContent>
    </Card>
  );
}