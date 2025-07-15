import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Clock, Upload, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SearchFormData, SearchResponse } from "@/lib/types";
import { Vendor } from "@shared/schema";
import ResultsTable from "./results-table";
import SearchSuccessIndicator from "./search-success-indicator";

const searchSchema = z.object({
  vendorId: z.number().default(1), // Always Kinray
  searchTerm: z.string().min(1, "Search term is required"),
  searchType: z.enum(['name', 'ndc', 'generic'], {
    required_error: "Please select a search type",
  }),
});

export default function SearchInterface() {
  const [currentSearchId, setCurrentSearchId] = useState<number | null>(null);
  const [showSuccessIndicator, setShowSuccessIndicator] = useState(false);
  const { toast } = useToast();

  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      vendorId: 1, // Default to Kinray (only vendor available)
      searchTerm: "",
      searchType: "name",
    },
  });

  const searchMutation = useMutation({
    mutationFn: async (data: SearchFormData) => {
      try {
        const response = await apiRequest("POST", "/api/search", data);
        const result = await response.json();
        console.log('Search API response:', result);
        return result as SearchResponse;
      } catch (error) {
        console.error('API request failed:', error);
        
        // Handle different error types more gracefully
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error('Network connection error. Please check your internet connection.');
        }
        
        // If it's already a meaningful error message, use it
        if (error instanceof Error && error.message) {
          throw error;
        }
        
        // Fallback error
        throw new Error('Failed to start search. Please try again.');
      }
    },
    onSuccess: (data) => {
      setCurrentSearchId(data.searchId);
      setShowSuccessIndicator(true);
      toast({
        title: "Search Started Successfully",
        description: `Kinray portal search initiated - Search ID: ${data.searchId}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      // Hide success indicator after 5 seconds
      setTimeout(() => {
        setShowSuccessIndicator(false);
      }, 5000);
    },
    onError: (error: Error) => {
      console.error('Search mutation error:', error);
      
      // Only show error toast for actual errors, not successful responses
      if (error.message.includes('500')) {
        toast({
          title: "Server Error", 
          description: "There was an issue with the search service. Please try again.",
          variant: "destructive",
        });
      } else if (error.message.includes('400')) {
        toast({
          title: "Invalid Search", 
          description: "Please check your search parameters and try again.",
          variant: "destructive",
        });
      } else if (error.message.includes('Network connection')) {
        toast({
          title: "Connection Error", 
          description: "Please check your internet connection and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Search Error", 
          description: error.message || "Failed to start medication search",
          variant: "destructive",
        });
      }
    },
  });

  const onSearch = async (data: SearchFormData) => {
    searchMutation.mutate(data);
  };

  const onClear = () => {
    form.reset();
    setCurrentSearchId(null);
    setShowSuccessIndicator(false);
  };

  const onBatchUpload = () => {
    toast({
      title: "Coming Soon",
      description: "Batch upload functionality will be available soon",
    });
  };

  const onDemoSearch = () => {
    form.setValue("searchTerm", "Ibuprofen 200mg");
    form.setValue("searchType", "name");
    toast({
      title: "Quick Search",
      description: "Filled in sample medication. Click Search to test Kinray portal!",
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Search className="h-5 w-5 text-primary mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Medication Search</h2>
              <p className="text-sm text-slate-600">Searching Kinray (Cardinal Health) portal</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <Clock className="h-4 w-4" />
            <span>Vendor: Kinray</span>
          </div>
        </div>

        {/* Search Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSearch)} className="mb-6">
            <div className="flex space-x-4 mb-4">
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="searchType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Search Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select search type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="name">Medication Name</SelectItem>
                          <SelectItem value="ndc">NDC Number</SelectItem>
                          <SelectItem value="generic">Generic Name</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="searchTerm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Search Term</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter medication name or NDC"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Vendor is hardcoded to Kinray - no dropdown */}
            <input type="hidden" {...form.register("vendorId")} value={1} />

            <div className="flex justify-between items-center">
              <div className="flex space-x-3">
                <Button
                  type="submit"
                  disabled={searchMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {searchMutation.isPending ? "Searching..." : "Search"}
                </Button>
                <Button
                  type="button"
                  onClick={onClear}
                  variant="outline"
                  className="text-slate-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <Button
                  type="button"
                  onClick={onDemoSearch}
                  variant="outline"
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  Demo Search
                </Button>
              </div>
              <Button
                type="button"
                onClick={onBatchUpload}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Batch Upload
              </Button>
            </div>
            
            {/* Success Indicator */}
            {showSuccessIndicator && currentSearchId && (
              <div className="mt-4">
                <SearchSuccessIndicator 
                  searchId={currentSearchId} 
                  isLoading={searchMutation.isPending}
                />
              </div>
            )}
          </form>
        </Form>

        {/* Results Table */}
        {currentSearchId && <ResultsTable searchId={currentSearchId} />}
      </CardContent>
    </Card>
  );
}
