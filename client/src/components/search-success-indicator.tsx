import { CheckCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { SearchWithResults } from "@shared/schema";

interface SearchSuccessIndicatorProps {
  searchId: number;
  onComplete?: () => void;
}

export default function SearchSuccessIndicator({ searchId, onComplete }: SearchSuccessIndicatorProps) {
  // Poll for search completion
  const { data: searchResults, isLoading } = useQuery<SearchWithResults>({
    queryKey: [`/api/search/${searchId}`],
    refetchInterval: (data) => {
      // Stop polling when search is completed or failed
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
  });

  // Call onComplete when search finishes
  useEffect(() => {
    if (searchResults && (searchResults.status === 'completed' || searchResults.status === 'failed')) {
      console.log(`Search ${searchId} completed with status: ${searchResults.status}`);
      if (onComplete) {
        onComplete();
      }
    }
  }, [searchResults, searchId, onComplete]);

  if (isLoading || !searchResults || searchResults.status === 'pending' || searchResults.status === 'in_progress') {
    return (
      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-700 dark:text-blue-300">
          Search initiated successfully. Connecting to Kinray portal...
        </AlertDescription>
      </Alert>
    );
  }

  if (searchResults.status === 'completed') {
    return (
      <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertDescription className="text-green-700 dark:text-green-300">
          Search completed successfully! Found {searchResults.results?.length || 0} results from Kinray.
        </AlertDescription>
      </Alert>
    );
  }

  if (searchResults.status === 'failed') {
    return (
      <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
        <CheckCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <AlertDescription className="text-red-700 dark:text-red-300">
          Search failed. Please check your credentials and try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
      <AlertDescription className="text-green-700 dark:text-green-300">
        Search started successfully! Search ID: {searchId}. Processing...
      </AlertDescription>
    </Alert>
  );
}