import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, Cookie } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SimpleCookieInterface() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [extractionMessage, setExtractionMessage] = useState('');
  const [cookieCount, setCookieCount] = useState(0);

  const { toast } = useToast();

  const handleAutomaticExtraction = async () => {
    if (!username || !password) {
      toast({
        title: "Missing credentials",
        description: "Please enter your Kinray username and password",
        variant: "destructive"
      });
      return;
    }

    setIsExtracting(true);
    setExtractionStatus('idle');
    setExtractionMessage('Starting automatic cookie extraction...');

    try {
      const response = await fetch('/api/extract-cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (response.ok) {
        setExtractionStatus('success');
        setExtractionMessage(`Successfully extracted ${result.cookieCount} session cookies`);
        setCookieCount(result.cookieCount);
        toast({
          title: "Cookie extraction successful",
          description: `Extracted and injected ${result.cookieCount} session cookies. You can now search for medications.`,
        });
        setPassword(''); // Clear password for security
      } else if (result.requiresManualCookies || result.deployment === 'Railway') {
        setExtractionStatus('error');
        setExtractionMessage('Railway deployment requires manual cookie extraction - scroll down to "Manual Cookie Injection" section');
        toast({
          title: "Manual Cookie Extraction Required",
          description: "Railway deployment cannot run browser automation. Please use manual cookie extraction below.",
          variant: "default"
        });
      } else {
        setExtractionStatus('error');
        setExtractionMessage(result.message || result.error || 'Cookie extraction failed');
        toast({
          title: "Cookie extraction failed",
          description: result.message || result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      setExtractionStatus('error');
      setExtractionMessage('Network error during cookie extraction');
      toast({
        title: "Connection error",
        description: "Failed to connect to the extraction service",
        variant: "destructive"
      });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div>
          <Label htmlFor="kinray-username">Kinray Username/Email</Label>
          <Input
            id="kinray-username"
            type="email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your.email@gmail.com"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="kinray-password">Password</Label>
          <Input
            id="kinray-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your Kinray password"
            className="mt-1"
          />
        </div>

        <Button 
          onClick={handleAutomaticExtraction} 
          disabled={isExtracting}
          className="w-full"
        >
          {isExtracting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Extracting cookies...
            </>
          ) : (
            <>
              <Cookie className="w-4 h-4 mr-2" />
              Extract Session Cookies
            </>
          )}
        </Button>

        {extractionMessage && (
          <Alert className={extractionStatus === 'success' ? 'border-green-200 bg-green-50' : extractionStatus === 'error' ? 'border-red-200 bg-red-50' : ''}>
            <div className="flex items-center">
              {extractionStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
              {extractionStatus === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
              {extractionStatus === 'idle' && <Loader2 className="h-4 w-4 animate-spin" />}
              <AlertDescription className="ml-2">
                {extractionMessage}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {extractionStatus === 'success' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-medium text-blue-900 mb-2">Important Notes:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your credentials are only used for cookie extraction and are not stored</li>
              <li>• If 2FA is enabled, the system will wait for you to complete it</li>
              <li>• Extracted cookies are automatically injected and ready for searches</li>
              <li>• This process may take 30-60 seconds to complete</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}