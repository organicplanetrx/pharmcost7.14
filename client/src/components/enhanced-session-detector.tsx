import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, ExternalLink, RefreshCw, Info } from 'lucide-react';

export function EnhancedSessionDetector() {
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'not-authenticated' | 'error'>('checking');
  const [cookieCount, setCookieCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkAuthStatus = async () => {
    setIsRefreshing(true);
    
    try {
      const response = await fetch('/api/check-auth-status');
      const result = await response.json();
      
      console.log('🔍 Auth check result:', result);
      
      if (result.authenticated) {
        setAuthStatus('authenticated');
        setCookieCount(result.cookieCount || 0);
      } else {
        setAuthStatus('not-authenticated');
        setCookieCount(0);
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
      setAuthStatus('error');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const openKinrayAndCheck = () => {
    // Open Kinray in new tab
    window.open('https://kinrayweblink.cardinalhealth.com/login', '_blank');
    
    // Auto-check again after user has time to log in
    setTimeout(() => {
      checkAuthStatus();
    }, 8000);
  };

  if (authStatus === 'checking') {
    return (
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/50">
        <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <div className="flex items-center justify-between">
            <span>Checking for Kinray session...</span>
            {isRefreshing && <span className="text-xs">Refreshing...</span>}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (authStatus === 'authenticated') {
    return (
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950/50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Ready to Search Medications</p>
              <p className="text-sm">Kinray session active ({cookieCount} cookies)</p>
            </div>
            <Button
              onClick={checkAuthStatus}
              variant="outline"
              size="sm"
              className="text-green-700 border-green-300 hover:bg-green-100"
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (authStatus === 'not-authenticated') {
    return (
      <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/50">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          <div className="space-y-3">
            <div>
              <p className="font-semibold">Kinray Login Required</p>
              <p className="text-sm">
                Log into your Kinray account to start searching medications
              </p>
            </div>
            
            <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded text-sm">
              <strong>Quick Steps:</strong>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Click "Open Kinray Login" below</li>
                <li>Log in with your credentials (complete 2FA)</li>
                <li>Use the cookie extraction tool below to get your session</li>
                <li>Once cookies are extracted, you can search medications</li>
              </ol>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={openKinrayAndCheck}
                variant="default"
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Kinray Login
              </Button>
              
              <Button
                onClick={checkAuthStatus}
                variant="outline"
                size="sm"
                className="text-amber-700 border-amber-300 hover:bg-amber-100"
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Check Session
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-red-200 bg-red-50 dark:bg-red-950/50">
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800 dark:text-red-200">
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
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}