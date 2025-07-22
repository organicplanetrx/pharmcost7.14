import { useQuery } from "@tanstack/react-query";
import { Shield, Settings, PillBottle, Key } from "lucide-react";
import { Link } from "wouter";
import CredentialForm from "@/components/credential-form";
import SearchInterface from "@/components/search-interface";
import ActivityLog from "@/components/activity-log";
import { EnhancedCookieInterface } from "@/components/enhanced-cookie-interface";
import { SeamlessAuthNotice } from "@/components/seamless-auth-notice";
import { SmartAuthStatus } from "@/components/smart-auth-status";
import { EnhancedSessionDetector } from "@/components/enhanced-session-detector";
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

        <main className="space-y-8">
          {/* Top Row - Authentication Status */}
          <div className="pharma-card">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Authentication Status</h3>
              <EnhancedSessionDetector />
            </div>
          </div>

          {/* Main Content - Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Search Interface */}
            <div className="pharma-card">
              <SearchInterface />
            </div>

            {/* Right Column - Stats */}
            <div className="space-y-6">
              {!statsLoading && stats && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="pharma-stat-card">
                    <div className="p-4 text-center">
                      <Shield className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-slate-900">{stats.totalVendors}</p>
                      <p className="text-sm text-slate-600">Vendors</p>
                    </div>
                  </div>
                  
                  <div className="pharma-stat-card">
                    <div className="p-4 text-center">
                      <Settings className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-slate-900">{stats.totalSearches}</p>
                      <p className="text-sm text-slate-600">Searches</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Log */}
              <div className="pharma-card">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h3>
                  <ActivityLog />
                </div>
              </div>
            </div>
          </div>

          {/* Collapsible Management Tools */}
          <details className="pharma-card">
            <summary className="p-6 cursor-pointer border-b">
              <h3 className="text-lg font-semibold text-slate-800 inline">Advanced Tools</h3>
              <p className="text-sm text-slate-600 mt-1">Session management and credential tools</p>
            </summary>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              <div>
                <h4 className="font-medium text-slate-700 mb-3">Session Management</h4>
                <EnhancedCookieInterface />
              </div>
              <div>
                <h4 className="font-medium text-slate-700 mb-3">Vendor Credentials</h4>
                <CredentialForm />
              </div>
            </div>
          </details>
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
