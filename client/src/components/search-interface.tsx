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

const searchFormSchema = insertSearchSchema.extend({
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
    mutationFn: (data: SearchFormData) => 
      apiRequest('/api/search', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
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
    if (!credentials || credentials.length === 0) {
      toast({
        title: "No Credentials",
        description: "Please save your Kinray credentials before searching.",
        variant: "destructive",
      });
      return;
    }
    searchMutation.mutate(data);
  };

  const handleSearchComplete = () => {
    setShowResults(true);
  };

  return (
    <>
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-slate-200">
          <CardTitle className="flex items-center text-slate-800">
            <Search className="mr-2 h-5 w-5 text-green-600" />
            Search Kinray (Cardinal Health) Portal
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <p className="font-medium">Live Kinray Portal Search</p>
                <p className="text-green-700">Search for medications with real-time pricing from Kinray</p>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                disabled={searchMutation.isPending || !credentials || credentials.length === 0}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {searchMutation.isPending ? "Searching Kinray Portal..." : "Search Medications"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

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