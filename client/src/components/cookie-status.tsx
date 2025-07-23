import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Cookie, RefreshCw } from 'lucide-react';

export function CookieStatus() {
  const [cookieStatus, setCookieStatus] = useState<'unknown' | 'available' | 'missing' | 'expired'>('unknown');
  const [isChecking, setIsChecking] = useState(false);
  const [cookieCount, setCookieCount] = useState(0);

  const checkCookieStatus = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/cookie-status');
      const result = await response.json();
      
      if (result.hasSessionCookies) {
        setCookieCount(result.cookieCount);
        if (result.isValid === true) {
          setCookieStatus('available');
        } else if (result.isValid === false) {
          setCookieStatus('expired');
        } else {
          setCookieStatus('unknown'); // Validation in progress
          // Check again in 3 seconds if validation is in progress
          setTimeout(checkCookieStatus, 3000);
        }
      } else {
        setCookieStatus('missing');
        setCookieCount(0);
      }
    } catch (error) {
      setCookieStatus('missing');
      setCookieCount(0);
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
      cookieStatus === 'expired' ? 'border-red-200 bg-red-50' :
      cookieStatus === 'missing' ? 'border-amber-200 bg-amber-50' :
      'border-blue-200 bg-blue-50'
    }`}>
      {cookieStatus === 'available' ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : cookieStatus === 'expired' ? (
        <AlertCircle className="h-4 w-4 text-red-600" />
      ) : cookieStatus === 'missing' ? (
        <AlertCircle className="h-4 w-4 text-amber-600" />
      ) : (
        <Cookie className="h-4 w-4 text-blue-600" />
      )}
      <AlertDescription className="flex items-center justify-between">
        <div>
          {cookieStatus === 'available' && (
            <span><strong>Session Active & Verified</strong><br/>Ready for medication searches ({cookieCount} cookies)</span>
          )}
          {cookieStatus === 'expired' && (
            <span><strong>Session Expired</strong><br/>Please re-authenticate - {cookieCount} invalid cookies cleared</span>
          )}
          {cookieStatus === 'missing' && (
            <span><strong>No Session Cookies</strong><br/>Extract cookies to enable searches</span>
          )}
          {cookieStatus === 'unknown' && (
            <span><strong>Validating Session...</strong><br/>Testing {cookieCount} cookies against Kinray portal</span>
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