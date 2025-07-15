import { useQuery } from "@tanstack/react-query";
import { Shield, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CredentialForm from "@/components/credential-form";
import { Credential } from "@shared/schema";

export default function CredentialsPage() {
  const { data: credentials, isLoading } = useQuery<Credential[]>({
    queryKey: ['/api/credentials'],
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-6"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Kinray Portal Credentials
        </h1>
        <p className="text-slate-600">
          Manage your Kinray (Cardinal Health) portal login credentials for automated medication searches.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Credential Form */}
        <div>
          <CredentialForm />
        </div>

        {/* Saved Credentials */}
        <div>
          <Card className="bg-white shadow-sm border-slate-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-slate-200">
              <CardTitle className="flex items-center text-slate-800">
                <Shield className="mr-2 h-5 w-5 text-purple-600" />
                Saved Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!credentials || credentials.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <h3 className="text-lg font-medium text-slate-700 mb-2">
                    No Credentials Saved
                  </h3>
                  <p className="text-slate-500">
                    Save your Kinray portal credentials to start searching for medications.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {credentials.map((credential) => (
                    <div
                      key={credential.id}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-slate-50"
                    >
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-slate-800">
                            Kinray (Cardinal Health)
                          </p>
                          <p className="text-sm text-slate-600">
                            Username: {credential.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-green-700 bg-green-100">
                          Active
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Information */}
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-2">
                    Security & Privacy
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Credentials are encrypted and stored securely</li>
                    <li>• Used only for automated Kinray portal access</li>
                    <li>• Never shared with third parties</li>
                    <li>• Can be deleted at any time</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}