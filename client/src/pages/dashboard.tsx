import { useQuery } from "@tanstack/react-query";
import { Shield, Settings, PillBottle, Key } from "lucide-react";
import { Link } from "wouter";
import CredentialForm from "@/components/credential-form";
import SearchInterface from "@/components/search-interface";
import ActivityLog from "@/components/activity-log";
import { EnhancedCookieInterface } from "@/components/enhanced-cookie-interface";
import { SeamlessAuthNotice } from "@/components/seamless-auth-notice";
import { SmartAuthStatus } from "@/components/smart-auth-status";
import LoadingModal from "@/components/loading-modal";
import { DashboardStats } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container-wrapper">
        {/* Header */}
        <header className="pharma-header">
          <div className="flex items-center justify-center">
            <PillBottle className="h-12 w-12 text-white mr-4" />
            <div>
              <h1 className="text-4xl font-bold">PharmaCost Pro</h1>
              <p className="text-xl opacity-90">Automated Medication Price Comparison System</p>
            </div>
          </div>
      </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Credentials */}
          <div className="lg:col-span-1">
            <div className="pharma-card">
              <CredentialForm />
            </div>
            
            {/* Smart Authentication Status */}
            <div className="mt-6">
              <SmartAuthStatus />
            </div>
            
            {/* Quick Actions */}
            <div className="pharma-card mt-6">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-slate-700"
                  >
                    <i className="fas fa-history mr-3" />
                    View Search History
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-slate-700"
                  >
                    <i className="fas fa-download mr-3" />
                    Export All Data
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-slate-700"
                  >
                    <i className="fas fa-upload mr-3" />
                    Import Medication List
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Search Interface */}
          <div className="lg:col-span-2">
            <div className="pharma-card">
              <SearchInterface />
            </div>

            {/* Dashboard Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">
                    {statsLoading ? "..." : stats?.totalSearchesToday || 0}
                  </div>
                  <div className="text-lg opacity-90">Searches Today</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">
                    ${statsLoading ? "..." : stats?.totalCostAnalysis || "0.00"}
                  </div>
                  <div className="text-lg opacity-90">Total Cost Analysis</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">
                    {statsLoading ? "..." : stats?.csvExportsGenerated || 0}
                  </div>
                  <div className="text-lg opacity-90">CSV Exports Generated</div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Activity Log */}
        <div className="pharma-card mt-8">
          <ActivityLog />
        </div>
      </div>

      <LoadingModal />
    </div>
  );
}
