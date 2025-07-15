import { CheckCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SearchSuccessIndicatorProps {
  searchId: number;
  isLoading: boolean;
}

export default function SearchSuccessIndicator({ searchId, isLoading }: SearchSuccessIndicatorProps) {
  if (isLoading) {
    return (
      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-700 dark:text-blue-300">
          Search initiated successfully. Connecting to Kinray portal...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
      <AlertDescription className="text-green-700 dark:text-green-300">
        Search started successfully! Search ID: {searchId}. Logging into Kinray portal and bypassing 2FA verification.
      </AlertDescription>
    </Alert>
  );
}