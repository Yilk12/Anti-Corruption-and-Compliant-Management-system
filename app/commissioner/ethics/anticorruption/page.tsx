"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUserPrimaryRole } from "@/app/lib/auth";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { ArrowLeft, CheckCircle } from "lucide-react";

export default function CommissionerEthicsPage() {
  const router = useRouter();
  const [closedReports, setClosedReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  function getToken() {
    try {
      return (
        localStorage.getItem("accessToken") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("token")
      );
    } catch (error) {
      return null;
    }
  }

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");

  useEffect(() => {
    const role = getCurrentUserPrimaryRole();
    // Allow access to commissioner role
    if (role !== "commissioner" && role !== "admin") {
      router.replace("/dashboard/Commissioner");
    }
  }, [router]);

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchClosedReports() {
      try {
        const token = getToken();
        if (!token) {
          console.error('No token available');
          setLoading(false);
          return;
        }
        
        const headers: HeadersInit = {
          Authorization: `Bearer ${token}`
        };

        // Fetch ethics reports
        const reportsRes = await fetch(`${API_BASE}/api/ethics/anticorruption/reports`, { 
          headers,
          signal: abortController.signal
        });
        if (reportsRes.status === 401) {
          console.error('Unauthorized: Token may be expired');
          setLoading(false);
          return;
        }
        const reportsData = reportsRes.ok ? await reportsRes.json() : [];
        const reportsArray = Array.isArray(reportsData) ? reportsData : (reportsData.reports || []);
        
        console.log('=== ETHICS REPORTS DEBUG ===');
        console.log('Raw reports response:', reportsData);
        console.log('Reports array length:', reportsArray.length);
        console.log('All reports:', reportsArray.map((r: any) => ({ 
          id: r.id,
          reportNumber: r.reportNumber, 
          status: r.status 
        })));
        
        // Filter for closed/resolved reports
        const closedData = reportsArray.filter((r: any) => 
          r.status === 'Resolved' || r.status === 'Closed'
        );
        
        console.log('Closed/Resolved reports:', closedData.map((r: any) => ({ 
          reportNumber: r.reportNumber, 
          status: r.status 
        })));
        console.log('Closed/Resolved count:', closedData.length);
        console.log('=== END ETHICS DEBUG ===');
        
        setClosedReports(closedData);
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Failed to fetch closed reports:', error);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchClosedReports();

    return () => {
      abortController.abort();
    };
  }, []);

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6">
          <Button variant="ghost" onClick={() => router.push("/dashboard/Commissioner")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {/* Closed Reports Grid */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-4 text-gray-600">Loading approved reports...</p>
              </div>
            ) : closedReports.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No approved reports found</h3>
                <p className="text-gray-600">No ethics reports have been approved yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {closedReports.map((report) => (
                  <Card
                    key={report.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => router.push(`/ethics/complaints/${report.id}`)}
                  >
                    <CardContent className="p-6 text-center">
                      <p className="text-lg font-semibold text-green-600">
                        {report.reportNumber || report.id}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
