import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Cookie, User, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AutomaticCookieExtraction() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
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
    setStatusMessage('Starting automatic cookie extraction...');

    try {
      const response = await fetch('/api/extract-cookies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (response.ok) {
        setExtractionStatus('success');
        setStatusMessage(`Successfully extracted ${result.cookieCount} session cookies`);
        toast({
          title: "Cookie extraction successful",
          description: `Extracted and injected ${result.cookieCount} session cookies. You can now search for medications.`,
        });
        
        // Clear password for security
        setPassword('');
      } else {
        setExtractionStatus('error');
        setStatusMessage(result.message || result.error || 'Cookie extraction failed');
        toast({
          title: "Cookie extraction failed",
          description: result.message || result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      setExtractionStatus('error');
      setStatusMessage('Network error during cookie extraction');
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
    <div className="space-y-6">
      <Alert className="border-blue-200 bg-blue-50">
        <Cookie className="h-4 w-4" />
        <AlertDescription>
          <strong>Automatic Cookie Extraction</strong><br/>
          Enter your Kinray portal credentials to automatically extract session cookies. 
          The system will log in, handle authentication, and extract the required cookies for medication searches.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Kinray Username/Email
          </Label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your Kinray username or email"
            disabled={isExtracting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your Kinray password"
            disabled={isExtracting}
          />
        </div>

        <Button 
          onClick={handleAutomaticExtraction}
          disabled={isExtracting || !username || !password}
          className="w-full"
        >
          {isExtracting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Extracting Cookies...
            </>
          ) : (
            <>
              <Cookie className="mr-2 h-4 w-4" />
              Extract Session Cookies Automatically
            </>
          )}
        </Button>
      </div>

      {statusMessage && (
        <Alert className={`${
          extractionStatus === 'success' ? 'border-green-200 bg-green-50' :
          extractionStatus === 'error' ? 'border-red-200 bg-red-50' :
          'border-blue-200 bg-blue-50'
        }`}>
          {extractionStatus === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : extractionStatus === 'error' ? (
            <AlertCircle className="h-4 w-4 text-red-600" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          )}
          <AlertDescription>
            {statusMessage}
          </AlertDescription>
        </Alert>
      )}

      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important Notes:</strong><br/>
          • Your credentials are only used for cookie extraction and are not stored<br/>
          • If 2FA is enabled, the system will wait for you to complete it<br/>
          • Extracted cookies are automatically injected and ready for searches<br/>
          • This process may take 30-60 seconds to complete
        </AlertDescription>
      </Alert>
    </div>
  );
}