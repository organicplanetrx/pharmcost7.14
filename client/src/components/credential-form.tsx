import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { insertCredentialSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const credentialFormSchema = insertCredentialSchema.extend({
  rememberCredentials: z.boolean().default(false),
});

type CredentialFormData = z.infer<typeof credentialFormSchema>;

export default function CredentialForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CredentialFormData>({
    resolver: zodResolver(credentialFormSchema),
    defaultValues: {
      vendorId: 1, // Hardcoded to Kinray (Cardinal Health)
      username: "",
      password: "",
      rememberCredentials: false,
    },
  });

  const saveCredentialMutation = useMutation({
    mutationFn: (data: CredentialFormData) => 
      apiRequest('/api/credentials', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: "Credentials Saved",
        description: "Kinray portal credentials saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/credentials'] });
      if (!form.getValues().rememberCredentials) {
        form.reset();
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save credentials.",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: (data: CredentialFormData) => 
      apiRequest('/api/test-connection', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (response: any) => {
      if (response.success) {
        toast({
          title: "Connection Successful",
          description: "Successfully connected to Kinray portal.",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: response.message || "Unable to connect to Kinray portal.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Connection Error",
        description: "Failed to test connection to Kinray portal.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CredentialFormData) => {
    saveCredentialMutation.mutate(data);
  };

  const onTestConnection = () => {
    const formData = form.getValues();
    if (!formData.username || !formData.password) {
      toast({
        title: "Missing Credentials",
        description: "Please enter username and password before testing.",
        variant: "destructive",
      });
      return;
    }
    testConnectionMutation.mutate(formData);
  };

  return (
    <Card className="bg-white shadow-sm border-slate-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
        <CardTitle className="flex items-center text-slate-800">
          <Shield className="mr-2 h-5 w-5 text-blue-600" />
          Kinray Portal Credentials
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Kinray (Cardinal Health) Portal</p>
              <p className="text-blue-700">Enter your kinrayweblink.cardinalhealth.com credentials</p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Username</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="Your Kinray username"
                      className="border-slate-300 focus:border-blue-500"
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
                  <FormLabel className="text-slate-700">Password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Your Kinray password"
                      className="border-slate-300 focus:border-blue-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rememberCredentials"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm text-slate-700">
                      Remember credentials for this session
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onTestConnection}
                disabled={testConnectionMutation.isPending}
                className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                {testConnectionMutation.isPending ? "Testing..." : "Test Connection"}
              </Button>
              
              <Button
                type="submit"
                disabled={saveCredentialMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {saveCredentialMutation.isPending ? "Saving..." : "Save Credentials"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}