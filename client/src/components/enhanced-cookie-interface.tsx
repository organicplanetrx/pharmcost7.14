import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Upload, User, Lock, Cookie, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CookieStatus } from '@/components/cookie-status';

export function EnhancedCookieInterface() {
  // Automatic extraction state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [extractionMessage, setExtractionMessage] = useState('');

  // Manual injection state
  const [cookieData, setCookieData] = useState('');
  const [isInjecting, setIsInjecting] = useState(false);
  const [injectionResult, setInjectionResult] = useState<{ success: boolean; message: string } | null>(null);

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
        toast({
          title: "Cookie extraction successful",
          description: `Extracted and injected ${result.cookieCount} session cookies. You can now search for medications.`,
        });
        setPassword(''); // Clear password for security
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

  const handleManualInjection = async () => {
    if (!cookieData.trim()) return;

    setIsInjecting(true);
    setInjectionResult(null);

    try {
      let cookies;
      try {
        cookies = JSON.parse(cookieData);
        if (!Array.isArray(cookies)) {
          throw new Error('Cookies must be an array');
        }
        const validCookies = cookies.filter(cookie => 
          cookie && typeof cookie === 'object' && cookie.name && cookie.value
        );
        if (validCookies.length === 0) {
          throw new Error('No valid cookies found');
        }
        cookies = validCookies;
      } catch (parseError) {
        // Try parsing simple key=value format
        cookies = cookieData.split('\n').map(line => {
          const [name, value] = line.split('=');
          return {
            name: name?.trim(),
            value: value?.trim(),
            domain: '.cardinalhealth.com',
            path: '/'
          };
        }).filter(cookie => cookie.name && cookie.value);

        if (cookies.length === 0) {
          throw new Error('Invalid cookie format. Please use JSON format or key=value pairs.');
        }
      }

      const response = await fetch('/api/inject-cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookies }),
      });

      if (response.ok) {
        const result = await response.json();
        setInjectionResult({ success: true, message: result.message });
        toast({
          title: "Cookies injected successfully",
          description: `${result.cookieCount} cookies are now available for searches`,
        });
        setCookieData('');
      } else {
        const errorText = await response.text();
        throw new Error(`Cookie injection failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Cookie injection error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setInjectionResult({ success: false, message: `Failed to inject cookies: ${errorMessage}` });
    } finally {
      setIsInjecting(false);
    }
  };

  return (
    <Card className="pharma-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cookie className="h-5 w-5" />
          Session Cookie Management
        </CardTitle>
        <CardDescription>
          Extract session cookies automatically or inject them manually for Kinray portal authentication
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Cookie Status Display */}
        <div className="mb-6">
          <CookieStatus />
        </div>
        <Tabs defaultValue="automatic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="automatic" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Automatic Extraction
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Manual Injection
            </TabsTrigger>
          </TabsList>

          <TabsContent value="automatic" className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <Zap className="h-4 w-4" />
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
                    <Zap className="mr-2 h-4 w-4" />
                    Extract Session Cookies Automatically
                  </>
                )}
              </Button>

              {extractionMessage && (
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
                    {extractionMessage}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <Alert>
              <Upload className="h-4 w-4" />
              <AlertDescription>
                <strong>Manual Cookie Injection</strong><br/>
                If automatic extraction doesn't work, manually copy session cookies from your authenticated browser session.
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Go to Kinray portal and ensure you're logged in</li>
                  <li>Press F12 → Application tab → Cookies → kinrayweblink.cardinalhealth.com</li>
                  <li>Copy the cookie data and paste it below</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Cookie Data</Label>
              <Textarea
                placeholder="Paste your browser cookies here (JSON format or key=value pairs)"
                value={cookieData}
                onChange={(e) => setCookieData(e.target.value)}
                rows={8}
                className="font-mono text-xs"
              />
            </div>

            <Button 
              onClick={handleManualInjection}
              disabled={!cookieData.trim() || isInjecting}
              className="w-full"
            >
              {isInjecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Injecting Cookies...
                </>
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
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {injectionResult.message}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

        <Alert className="mt-6 border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important Notes:</strong><br/>
            • Your credentials are only used for cookie extraction and are not stored<br/>
            • If 2FA is enabled, the system will wait for you to complete it<br/>
            • Extracted cookies are automatically injected and ready for searches<br/>
            • This process may take 30-60 seconds to complete
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}