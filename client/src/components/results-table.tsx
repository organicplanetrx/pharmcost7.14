import { useQuery } from "@tanstack/react-query";
import { Download, Eye, ArrowUpDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchWithResults } from "@shared/schema";
import SearchStatus from "./search-status";

interface ResultsTableProps {
  searchId: number;
}

export default function ResultsTable({ searchId }: ResultsTableProps) {
  const { data: searchResults, isLoading, error } = useQuery<SearchWithResults>({
    queryKey: [`/api/search/${searchId}`],
    refetchInterval: (data) => {
      console.log(`ResultsTable polling for search ${searchId}, status: ${data?.status}, results: ${data?.results?.length || 0}`);
      return data?.status === 'pending' || data?.status === 'in_progress' ? 2000 : false;
    },
  });

  console.log(`ResultsTable render - searchId: ${searchId}, isLoading: ${isLoading}, data:`, searchResults);

  // Results table for search ID: ${searchId}

  const handleExport = () => {
    window.open(`/api/search/${searchId}/export`, '_blank');
  };

  const getStatusBadge = (availability: string) => {
    switch (availability.toLowerCase()) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800">Available</Badge>;
      case 'limited':
        return <Badge className="bg-yellow-100 text-yellow-800">Limited</Badge>;
      case 'out_of_stock':
      case 'out of stock':
        return <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800">Search Results</h3>
            <span className="text-sm text-slate-600">Loading...</span>
          </div>
        </div>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-slate-600">Searching for medications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('ResultsTable error:', error);
    return (
      <div className="border border-red-200 rounded-lg overflow-hidden">
        <div className="bg-red-50 px-6 py-4 border-b border-red-200">
          <h3 className="text-lg font-semibold text-red-800">Error Loading Results</h3>
        </div>
        <div className="p-6">
          <p className="text-red-600">Failed to load search results. Please try again.</p>
        </div>
      </div>
    );
  }

  if (!searchResults) {
    return (
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Search Results</h3>
        </div>
        <div className="p-6">
          <p className="text-slate-600">No search data available.</p>
        </div>
      </div>
    );
  }

  if (searchResults.status === 'failed') {
    return (
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Search Results</h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-red-600">Search failed. Please try again or check your credentials.</p>
        </div>
      </div>
    );
  }

  if (searchResults.status === 'pending' || searchResults.status === 'in_progress') {
    return (
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800">Search Results</h3>
            <span className="text-sm text-slate-600">Search in progress...</span>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <SearchStatus status={searchResults.status} />
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-slate-600">
              {searchResults.status === 'pending' ? 
                'Connecting to Kinray portal and authenticating...' : 
                'Bypassing 2FA and searching for medications...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">Search Results</h3>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-slate-600">
              {searchResults.results.length} results found
            </span>
            {searchResults.results.length > 0 && (
              <Button
                onClick={handleExport}
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </div>
      </div>

      {searchResults.results.length === 0 ? (
        <div className="p-6 space-y-4">
          <div className="text-center">
            <p className="text-slate-600">No medications found for your search.</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-medium text-orange-800">Two-Factor Authentication Required</h4>
                <p className="text-sm text-orange-700 mt-1">
                  The Kinray portal requires two-factor authentication (2FA) which cannot be automated.
                </p>
                <div className="mt-2 text-sm text-orange-700">
                  <p className="font-medium">To resolve this:</p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>Contact your Kinray account administrator</li>
                    <li>Request to disable 2FA for automated access</li>
                    <li>Or use a dedicated service account without 2FA</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-slate-700">
                  <div className="flex items-center">
                    Medication Name
                    <ArrowUpDown className="h-4 w-4 ml-2 text-slate-400" />
                  </div>
                </th>
                <th className="text-left py-3 px-6 font-medium text-slate-700">
                  <div className="flex items-center">
                    NDC
                    <ArrowUpDown className="h-4 w-4 ml-2 text-slate-400" />
                  </div>
                </th>
                <th className="text-left py-3 px-6 font-medium text-slate-700">
                  <div className="flex items-center">
                    Package Size
                    <ArrowUpDown className="h-4 w-4 ml-2 text-slate-400" />
                  </div>
                </th>
                <th className="text-left py-3 px-6 font-medium text-slate-700">
                  <div className="flex items-center">
                    Cost
                    <ArrowUpDown className="h-4 w-4 ml-2 text-slate-400" />
                  </div>
                </th>
                <th className="text-left py-3 px-6 font-medium text-slate-700">Status</th>
                <th className="text-left py-3 px-6 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {searchResults.results.map((result) => (
                <tr key={result.id} className="hover:bg-slate-50">
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-slate-900">
                        {result.medication.name}
                      </div>
                      {result.medication.genericName && (
                        <div className="text-sm text-slate-500">
                          Generic for {result.medication.genericName}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-700">
                    {result.medication.ndc || 'N/A'}
                  </td>
                  <td className="py-4 px-6 text-slate-700">
                    {result.medication.packageSize || 'N/A'}
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-semibold text-slate-900">
                      {result.cost.startsWith('$') ? result.cost : `$${result.cost}`}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    {getStatusBadge(result.availability || 'unknown')}
                  </td>
                  <td className="py-4 px-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary/80"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
