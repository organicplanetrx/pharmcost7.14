import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Cookie, RefreshCw } from 'lucide-react';

export function CookieStatus() {
  const [cookieStatus, setCookieStatus] = useState<'unknown' | 'available' | 'missing'>('unknown');
  const [isChecking, setIsChecking] = useState(false);

  const checkCookieStatus = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/cookie-status');
      const result = await response.json();
      setCookieStatus(result.hasSessionCookies ? 'available' : 'missing');
    } catch (error) {
      setCookieStatus('missing');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkCookieStatus();
  }, []);

  return (
    <Alert className={`${
      cookieStatus === 'available' ? 'border-green-200 bg-green-50' :
      cookieStatus === 'missing' ? 'border-amber-200 bg-amber-50' :
      'border-blue-200 bg-blue-50'
    }`}>
      {cookieStatus === 'available' ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : cookieStatus === 'missing' ? (
        <AlertCircle className="h-4 w-4 text-amber-600" />
      ) : (
        <Cookie className="h-4 w-4 text-blue-600" />
      )}
      <AlertDescription className="flex items-center justify-between">
        <div>
          {cookieStatus === 'available' && (
            <span><strong>Session Cookies Available</strong><br/>Ready for medication searches</span>
          )}
          {cookieStatus === 'missing' && (
            <span><strong>No Session Cookies</strong><br/>Extract cookies to enable searches</span>
          )}
          {cookieStatus === 'unknown' && (
            <span><strong>Checking Cookie Status...</strong></span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={checkCookieStatus}
          disabled={isChecking}
        >
          {isChecking ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
}