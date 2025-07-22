import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';

export function SmartAuthStatus() {
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'not-authenticated' | 'error'>('checking');
  const [cookieCount, setCookieCount] = useState(0);

  const checkAuthStatus = async () => {
    setAuthStatus('checking');
    
    try {
      const response = await fetch('/api/check-auth-status');
      const result = await response.json();
      
      if (result.authenticated) {
        setAuthStatus('authenticated');
        setCookieCount(result.cookieCount || 0);
      } else {
        setAuthStatus('not-authenticated');
      }
    } catch (error) {
      setAuthStatus('error');
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const openKinrayLogin = () => {
    window.open('https://kinrayweblink.cardinalhealth.com/login', '_blank');
    // Check again after a delay to allow user to log in
    setTimeout(checkAuthStatus, 5000);
  };

  if (authStatus === 'checking') {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
        <AlertDescription className="text-blue-800">
          Checking for existing Kinray session...
        </AlertDescription>
      </Alert>
    );
  }

  if (authStatus === 'authenticated') {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Ready to Search</p>
              <p className="text-sm">Found authenticated Kinray session ({cookieCount} cookies)</p>
            </div>
            <Button
              onClick={checkAuthStatus}
              variant="outline"
              size="sm"
              className="text-green-700 border-green-300 hover:bg-green-100"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (authStatus === 'not-authenticated') {
    return (
      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <div className="space-y-3">
            <p className="font-semibold">Login Required</p>
            <p className="text-sm">
              Please log into Kinray in another tab, then refresh this status.
            </p>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={openKinrayLogin}
                variant="outline"
                size="sm"
                className="text-amber-700 border-amber-300 hover:bg-amber-100"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Kinray Login
              </Button>
              
              <Button
                onClick={checkAuthStatus}
                variant="outline"
                size="sm"
                className="text-amber-700 border-amber-300 hover:bg-amber-100"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Again
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-red-200 bg-red-50">
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Connection Error</p>
            <p className="text-sm">Unable to check authentication status</p>
          </div>
          <Button
            onClick={checkAuthStatus}
            variant="outline"
            size="sm"
            className="text-red-700 border-red-300 hover:bg-red-100"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}