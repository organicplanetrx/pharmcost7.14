import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, ExternalLink, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export function SeamlessAuthNotice() {
  const [isKinrayOpen, setIsKinrayOpen] = useState(false);

  const openKinray = () => {
    window.open('https://kinrayweblink.cardinalhealth.com/login', '_blank');
    setIsKinrayOpen(true);
  };

  return (
    <div className="space-y-4">
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <div className="space-y-3">
            <p className="font-semibold">Easy Authentication - No Manual Steps Required</p>
            <p>
              Simply log into Kinray in another browser tab, then come back here to search. 
              The app will automatically use your authenticated session.
            </p>
            
            <div className="flex items-center gap-3">
              <Button 
                onClick={openKinray}
                variant="outline" 
                size="sm"
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Kinray Login
              </Button>
              
              {isKinrayOpen && (
                <div className="flex items-center text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Opened in new tab
                </div>
              )}
            </div>
            
            <div className="text-sm text-blue-700 bg-blue-100 dark:bg-blue-900/30 p-3 rounded">
              <strong>Steps:</strong>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Click "Open Kinray Login" above</li>
                <li>Log in with your credentials (complete 2FA if needed)</li>
                <li>Return to this tab and start searching</li>
              </ol>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}