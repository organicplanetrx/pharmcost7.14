import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RailwayManualNoticeProps {
  onProceedToManual: () => void;
}

export function RailwayManualNotice({ onProceedToManual }: RailwayManualNoticeProps) {
  return (
    <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="space-y-3">
        <div>
          <strong>Railway Deployment Notice:</strong> Browser automation is not available on Railway. 
          Manual cookie extraction is required for authentication.
        </div>
        
        <div className="text-sm space-y-2">
          <p><strong>Quick Start:</strong></p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Log into <a href="https://kinrayweblink.cardinalhealth.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">
              kinrayweblink.cardinalhealth.com <ExternalLink className="h-3 w-3 ml-1" />
            </a></li>
            <li>Open Developer Tools (F12)</li>
            <li>Go to Application → Cookies</li>
            <li>Copy all cookies and use manual injection below</li>
          </ol>
        </div>
        
        <Button onClick={onProceedToManual} variant="outline" size="sm">
          Proceed to Manual Cookie Extraction
        </Button>
      </AlertDescription>
    </Alert>
  );
}