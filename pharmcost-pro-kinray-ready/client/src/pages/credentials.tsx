import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Settings, Eye, EyeOff, Check, X, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Credential, Vendor } from "@shared/schema";

const credentialSchema = z.object({
  vendorId: z.number(),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type CredentialFormData = z.infer<typeof credentialSchema>;

export default function CredentialsPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [testingCredentials, setTestingCredentials] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: credentials } = useQuery<Credential[]>({
    queryKey: ["/api/credentials"],
  });

  const form = useForm<CredentialFormData>({
    resolver: zodResolver(credentialSchema),
    defaultValues: {
      vendorId: 1, // Default to Kinray
      username: "",
      password: "",
    },
  });

  const saveCredentialMutation = useMutation({
    mutationFn: async (data: CredentialFormData) => {
      const response = await apiRequest("POST", "/api/credentials", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Kinray credentials saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/credentials"] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save credentials",
        variant: "destructive",
      });
    },
  });

  const testCredentialMutation = useMutation({
    mutationFn: async (credentialId: number) => {
      const response = await apiRequest("POST", `/api/credentials/${credentialId}/test`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "Success" : "Error",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/credentials"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Test Failed",
        description: error.message || "Failed to test credentials",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setTestingCredentials(null);
    },
  });

  const onSubmit = (data: CredentialFormData) => {
    saveCredentialMutation.mutate(data);
  };

  const onTestCredentials = (credentialId: number) => {
    setTestingCredentials(credentialId);
    testCredentialMutation.mutate(credentialId);
  };

  const getStatusBadge = (isActive: boolean, lastValidated: string | null) => {
    if (!lastValidated) {
      return <Badge variant="outline">Not Tested</Badge>;
    }
    
    if (isActive) {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    } else {
      return <Badge variant="destructive">Failed</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Vendor Credentials</h1>
      </div>

      {/* Add New Credential */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Add Kinray Credentials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kinray Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your Kinray username"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kinray Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your Kinray password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="submit"
                disabled={saveCredentialMutation.isPending}
                className="w-full md:w-auto"
              >
                {saveCredentialMutation.isPending ? "Saving..." : "Save Credentials"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Existing Credentials */}
      <Card>
        <CardHeader>
          <CardTitle>Stored Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          {credentials && credentials.length > 0 ? (
            <div className="space-y-4">
              {credentials.map((credential) => {
                const vendor = vendors?.find(v => v.id === credential.vendorId);
                return (
                  <div key={credential.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium">{vendor?.name || "Unknown Vendor"}</h3>
                        <p className="text-sm text-slate-600">{credential.username}</p>
                      </div>
                      {getStatusBadge(credential.isActive, credential.lastValidated)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onTestCredentials(credential.id)}
                        disabled={testingCredentials === credential.id}
                      >
                        {testingCredentials === credential.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-slate-600" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        {testingCredentials === credential.id ? "Testing..." : "Test"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600">No credentials stored yet</p>
              <p className="text-sm text-slate-500">Add your Kinray credentials above to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}