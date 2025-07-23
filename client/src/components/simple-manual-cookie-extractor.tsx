import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

export function SimpleManualCookieExtractor() {
  const [cookies, setCookies] = useState('');
  const [status, setStatus] = useState<'idle' | 'injecting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleInjectCookies = async () => {
    if (!cookies.trim()) {
      setStatus('error');
      setMessage('Please paste cookies first');
      return;
    }

    setStatus('injecting');
    setMessage('Injecting cookies...');

    try {
      let cookieArray;
      
      // Try JSON first
      try {
        cookieArray = JSON.parse(cookies);
      } catch {
        // Parse the actual cookie format from browser (name=value format)
        cookieArray = cookies.split('\n')
          .filter(line => line.trim() && line.includes('='))
          .map(line => {
            const trimmedLine = line.trim();
            const equalIndex = trimmedLine.indexOf('=');
            if (equalIndex === -1) return null;
            
            const name = trimmedLine.substring(0, equalIndex).trim();
            const value = trimmedLine.substring(equalIndex + 1).trim();
            
            return {
              name: name,
              value: value,
              domain: '.kinrayweblink.cardinalhealth.com'
            };
          })
          .filter(cookie => cookie !== null);
      }

      const response = await fetch('/api/inject-cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookies: cookieArray })
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(`Success! Stored ${result.cookieCount} cookies. You can now search medications.`);
      } else {
        setStatus('error');
        setMessage(result.error || 'Failed to inject cookies');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Error processing cookies. Check format and try again.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Cookie Extraction</CardTitle>
        <CardDescription>
          Railway requires manual cookie extraction. No browser automation available.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <Alert>
          <ExternalLink className="h-4 w-4" />
          <AlertDescription>
            <strong>Step 1:</strong> Log into{' '}
            <a 
              href="https://kinrayweblink.cardinalhealth.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              kinrayweblink.cardinalhealth.com
            </a>
          </AlertDescription>
        </Alert>

        <div className="text-sm space-y-2">
          <p><strong>Step 2: Extract cookies</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Press F12 (Developer Tools)</li>
            <li>Go to Application → Cookies → kinrayweblink.cardinalhealth.com</li>
            <li>Copy all cookies</li>
            <li>Paste below</li>
          </ol>
        </div>

        <Textarea
          value={cookies}
          onChange={(e) => setCookies(e.target.value)}
          placeholder={`Paste cookies here (name=value format, one per line):
_abck=AC756293DF37C...
ak_bmsc=58B66B03F19235A...
dtCookie=v_4_srv_11_sn_B83C...`}
          className="min-h-[100px] font-mono text-sm"
          disabled={status === 'injecting'}
        />

        <Button 
          onClick={handleInjectCookies}
          disabled={status === 'injecting' || !cookies.trim()}
          className="w-full"
        >
          {status === 'injecting' ? 'Injecting...' : 'Inject Cookies'}
        </Button>

        {status === 'success' && (
          <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-medium">{message}</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}