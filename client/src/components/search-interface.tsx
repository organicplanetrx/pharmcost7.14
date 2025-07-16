import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { insertSearchSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import SearchSuccessIndicator from "./search-success-indicator";
import ResultsTable from "./results-table";

const searchFormSchema = z.object({
  vendorId: z.number(),
  searchTerm: z.string().min(1, "Search term is required"),
  searchType: z.enum(['name', 'ndc', 'generic']),
});

type SearchFormData = z.infer<typeof searchFormSchema>;

export default function SearchInterface() {
  const [searchId, setSearchId] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: credentials } = useQuery({
    queryKey: ['/api/credentials'],
  });

  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      vendorId: 1, // Hardcoded to Kinray (Cardinal Health)
      searchTerm: "",
      searchType: "name",
    },
  });

  const searchMutation = useMutation({
    mutationFn: async (data: SearchFormData) => {
      const response = await apiRequest('POST', '/api/search', data);
      return await response.json();
    },
    onSuccess: (response: any) => {
      console.log("Search API Response:", response);
      if (response && response.searchId) {
        console.log(`Search started successfully with ID: ${response.searchId}`);
        setSearchId(response.searchId);
        setShowResults(false);
        queryClient.invalidateQueries({ queryKey: ['/api/searches'] });
        queryClient.invalidateQueries({ queryKey: ['/api/activity'] });
      } else {
        console.error("Invalid search response:", response);
        toast({
          title: "Search Error",
          description: response?.message || "Invalid response from search API.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("Search API Error:", error);
      toast({
        title: "Search Error", 
        description: error?.message || "Failed to start search. Please check your credentials.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SearchFormData) => {
    console.log("Form submitted - Starting search with data:", data);
    console.log("Credentials available:", credentials);
    
    // Add explicit debugging
    toast({
      title: "Search Starting",
      description: `Searching for ${data.searchTerm} (${data.searchType})`,
    });
    
    searchMutation.mutate(data);
  };

  const handleSearchComplete = () => {
    setShowResults(true);
  };

  return (
    <>
      <div className="w-full">
        <div className="mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
            <Search className="h-5 w-5" />
            Search Kinray (Cardinal Health) Portal
          </h2>
          <p className="text-gray-600 text-sm">Search for medications with real-time pricing from Kinray</p>
        </div>
        <div>

          <Form {...form}>
            <form 
              onSubmit={(e) => {
                console.log("📝 Form onSubmit triggered");
                e.preventDefault();
                form.handleSubmit(onSubmit)(e);
              }} 
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="searchType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Search Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-slate-300 focus:border-green-500">
                          <SelectValue placeholder="Select search type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="name">Medication Name</SelectItem>
                        <SelectItem value="ndc">NDC Code</SelectItem>
                        <SelectItem value="generic">Generic Name</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="searchTerm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Search Term</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="Enter medication name, NDC, or generic name"
                        className="border-slate-300 focus:border-green-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={searchMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={(e) => {
                  console.log("🔍 Search button clicked!");
                  console.log("Form state:", form.formState);
                  console.log("Form errors:", form.formState.errors);
                  console.log("Form values:", form.getValues());
                  
                  // Force form validation and submission
                  const formData = form.getValues();
                  console.log("Manual form data:", formData);
                  
                  // Manual submission if form doesn't trigger
                  if (formData.searchTerm && formData.searchTerm.trim()) {
                    console.log("Manually triggering search...");
                    onSubmit(formData);
                  } else {
                    console.log("❌ No search term provided");
                    toast({
                      title: "Search Term Required",
                      description: "Please enter a medication name to search for.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                {searchMutation.isPending ? "Searching Kinray Portal..." : "Search Medications"}
              </Button>
            </form>
          </Form>
        </div>
      </div>

      {searchId && !showResults && (
        <SearchSuccessIndicator 
          searchId={searchId} 
          onComplete={handleSearchComplete}
        />
      )}

      {showResults && searchId && (
        <ResultsTable searchId={searchId} />
      )}
    </>
  );
}