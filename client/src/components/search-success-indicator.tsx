import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
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
    queryKey: ['/api/search', searchId],
    queryFn: () => fetch(`/api/search/${searchId}`).then(res => res.json()),
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
    if (searchResults && searchResults.status === 'completed') {
      if (onComplete) {
        onComplete();
      }
    }
  }, [searchResults, searchId, onComplete]);

  // Cleaned up debug logging

  if (isLoading || !searchResults || searchResults.status === 'pending' || searchResults.status === 'in_progress') {
    return (
      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-700 dark:text-blue-300">
          Search initiated successfully. Connecting to Kinray portal... (Status: {searchResults?.status || 'loading'})
        </AlertDescription>
      </Alert>
    );
  }

  if (searchResults.status === 'completed') {
    const resultCount = searchResults.results?.length || 0;
    
    if (resultCount === 0) {
      return (
        <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            Search completed but no results found. Try a different medication name or check if it's available in the Kinray catalog.
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertDescription className="text-green-700 dark:text-green-300">
          Search completed successfully! Found {resultCount} results from Kinray portal.
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