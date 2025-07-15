import { AlertCircle, Shield } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function TwoFactorNotice() {
  return (
    <Alert className="bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800">
      <Shield className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      <AlertTitle className="text-orange-800 dark:text-orange-200">
        Two-Factor Authentication Required
      </AlertTitle>
      <AlertDescription className="text-orange-700 dark:text-orange-300 mt-2">
        <div className="space-y-2">
          <p>
            The Kinray portal requires two-factor authentication (2FA) verification 
            which cannot be automated. To resolve this issue:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Contact your Kinray account administrator</li>
            <li>Request to disable 2FA for automated access</li>
            <li>Or use a dedicated service account without 2FA</li>
          </ul>
          <p className="text-sm font-medium mt-3">
            Once 2FA is disabled, the automated searches will work normally.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}