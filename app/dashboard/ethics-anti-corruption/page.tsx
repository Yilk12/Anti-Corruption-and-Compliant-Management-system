"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUserPrimaryRole } from "@/app/lib/auth";
import { Shield, FileText, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";

export default function EthicsAntiCorruptionDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    totalReports: 0,
    pendingInvestigations: 0,
    resolvedCases: 0,
    underInvestigation: 0,
  });

  useEffect(() => {
    const role = getCurrentUserPrimaryRole();
    if (role !== "ethics_anti_corruption" && role !== "admin") {
      router.replace("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    loadCounts();
  }, []);

  const loadCounts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch all reports
      const reportsRes = await fetch("http://localhost:4000/api/ethics/anticorruption/reports", { headers });
      console.log('Reports response status:', reportsRes.status);
      
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        console.log('Reports data:', reportsData);
        
        const reports = Array.isArray(reportsData) ? reportsData : (reportsData.reports || []);
        console.log('Reports array:', reports);
        console.log('Reports length:', reports.length);
        
        const pending = reports.filter((r: any) => r.status === 'Submitted').length;
        const underInvestigation = reports.filter((r: any) => r.status === 'Under Investigation').length;
        const resolved = reports.filter((r: any) => r.status === 'Resolved').length;
        
        console.log('Pending:', pending, 'Under Investigation:', underInvestigation, 'Resolved:', resolved);
        
        setCounts({
          totalReports: reports.length,
          pendingInvestigations: pending,
          underInvestigation: underInvestigation,
          resolvedCases: resolved,
        });
      } else {
        console.error('Failed to fetch reports:', reportsRes.status);
      }
    } catch (error) {
      console.error('Error loading counts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">
              Ethics &amp; Anti-Corruption Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              View and manage complaints, suggestions, and compliments submitted
              through the system.
            </p>
          </div>

          {/* Count Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/ethics/anticorruption")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Reports</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {loading ? "..." : counts.totalReports}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/ethics/anticorruption")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {loading ? "..." : counts.pendingInvestigations}
                    </p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/ethics/anticorruption")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Under Investigation</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {loading ? "..." : counts.underInvestigation}
                    </p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/ethics/anticorruption")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Resolved</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {loading ? "..." : counts.resolvedCases}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
