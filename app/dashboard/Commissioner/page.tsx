"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useRouter } from "next/navigation";
import { Shield, MessageSquare, CheckCircle, FileText } from "lucide-react";
import { useOptimizedFetch } from "@/app/hooks/use-optimized-fetch";

export default function CommissionerDashboardPage() {
  const router = useRouter();

  // Prefetch routes on hover for faster navigation
  const prefetchRoute = (path: string) => {
    router.prefetch(path);
  };

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

  // Fetch approved complaints count
  const { data: approvedComplaintsCount = 0, isDelayedLoading: loadingComplaints } = useOptimizedFetch(
    ["approvedComplaintsCount"],
    async () => {
      const token = getToken();
      if (!token) return 0;
      
      const headers: HeadersInit = { Authorization: `Bearer ${token}` };
      const complaintsRes = await fetch(`${API_BASE}/api/feedback/complaints`, { headers });
      if (!complaintsRes.ok) return 0;
      
      const complaintsData = await complaintsRes.json();
      const complaintsArray = Array.isArray(complaintsData) ? complaintsData : (complaintsData?.items || []);
      const approvedComplaints = complaintsArray.filter((c: any) => 
        c.status === 'Closed' || c.status === 'Accepted'
      );
      
      // Fetch petitions to filter out complaints with petitions
      const petitionsRes = await fetch(`${API_BASE}/api/feedback/petitions/all`, { headers });
      if (!petitionsRes.ok) return approvedComplaints.length;
      
      const petitionsData = await petitionsRes.json();
      const petitionsArray = Array.isArray(petitionsData) ? petitionsData : [];
      
      const complaintIdsWithPetitions = new Set(
        petitionsArray
          .filter((p: any) => p.complaintId)
          .map((p: any) => p.complaintId)
      );
      
      const complaintsWithoutPetitions = approvedComplaints.filter((c: any) => 
        !complaintIdsWithPetitions.has(c.id)
      );
      
      return complaintsWithoutPetitions.length;
    },
    { minLoadingTime: 2000 }
  );

  // Fetch petitions count
  const { data: approvedPetitionsCount = 0, isDelayedLoading: loadingPetitions } = useOptimizedFetch(
    ["approvedPetitionsCount"],
    async () => {
      const token = getToken();
      if (!token) return 0;
      
      const headers: HeadersInit = { Authorization: `Bearer ${token}` };
      const petitionsRes = await fetch(`${API_BASE}/api/feedback/petitions/all`, { headers });
      if (!petitionsRes.ok) return 0;
      
      const petitionsData = await petitionsRes.json();
      const petitionsArray = Array.isArray(petitionsData) ? petitionsData : [];
      
      const pendingReviewPetitions = petitionsArray.filter((p: any) => 
        p.status === 'Under Final Decision Review'
      );
      
      return pendingReviewPetitions.length;
    },
    { minLoadingTime: 2000 }
  );

  // Fetch closed reports count
  const { data: closedReportsCount = 0, isDelayedLoading: loadingReports } = useOptimizedFetch(
    ["closedReportsCount"],
    async () => {
      const token = getToken();
      if (!token) return 0;
      
      const headers: HeadersInit = { Authorization: `Bearer ${token}` };
      const reportsRes = await fetch(`${API_BASE}/api/ethics/anticorruption/reports`, { headers });
      if (!reportsRes.ok) return 0;
      
      const reportsData = await reportsRes.json();
      const reportsArray = Array.isArray(reportsData) ? reportsData : (reportsData.reports || []);
      
      const closedReports = reportsArray.filter((r: any) => 
        r.status === 'Resolved' || r.status === 'Closed'
      );
      
      return closedReports.length;
    },
    { minLoadingTime: 2000 }
  );

  // Fetch administrative complaints count
  const { data: administrativeComplaintsCount = 0, isDelayedLoading: loadingAdmin } = useOptimizedFetch(
    ["administrativeComplaintsCount"],
    async () => {
      const token = getToken();
      if (!token) return 0;
      
      const headers: HeadersInit = { Authorization: `Bearer ${token}` };
      const adminComplaintsRes = await fetch(`${API_BASE}/api/feedback/complaints`, { headers });
      if (!adminComplaintsRes.ok) return 0;
      
      const adminComplaintsData = await adminComplaintsRes.json();
      const adminComplaintsArray = Array.isArray(adminComplaintsData) ? adminComplaintsData : (adminComplaintsData?.items || []);
      
      const pendingAdminComplaints = adminComplaintsArray.filter((c: any) => 
        (c.category === 'Administrative Complaints' || 
         c.category === 'አስተዳደራዊ ጥቆማ' || 
         c.category === 'አስተዳደራዊ ቅሬታ') &&
        (c.status === 'Investigation_Completed' || c.status === 'Decision_Approved')
      );
      
      return pendingAdminComplaints.length;
    },
    { minLoadingTime: 2000 }
  );

  const loading = loadingComplaints || loadingPetitions || loadingReports || loadingAdmin;
  const totalApprovedItems = approvedComplaintsCount + approvedPetitionsCount;

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Commissioner Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Administrative Complaints - First */}
            <div
              onClick={() => router.push("/commissioner/feedback/administrative-complaints")}
              onMouseEnter={() => prefetchRoute("/commissioner/feedback/administrative-complaints")}
              className="bg-gradient-to-br from-amber-700 to-amber-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-all cursor-pointer transform hover:scale-102"
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-white/20 p-3 rounded-full mb-2">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-sm font-semibold text-white mb-1">
                  Administrative Complaints
                </h2>
                <p className="text-2xl font-bold text-white">
                  {loading ? "..." : administrativeComplaintsCount}
                </p>
                <p className="text-amber-200 text-xs mt-1">Pending Review</p>
              </div>
            </div>

            {/* Petitions - Second */}
            <div
              onClick={() => router.push("/commissioner/feedback/petition")}
              onMouseEnter={() => prefetchRoute("/commissioner/feedback/petition")}
              className="bg-gradient-to-br from-stone-600 to-stone-700 rounded-lg shadow-md p-4 hover:shadow-lg transition-all cursor-pointer transform hover:scale-102"
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-white/20 p-3 rounded-full mb-2">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-sm font-semibold text-white mb-1">
                  Petitions
                </h2>
                <p className="text-2xl font-bold text-white">
                  {loading ? "..." : approvedPetitionsCount}
                </p>
                <p className="text-stone-200 text-xs mt-1">Pending Review</p>
              </div>
            </div>

            {/* Feedback Complaints - Third */}
            <div
              onClick={() => router.push("/commissioner/feedback/complaints/approved")}
              onMouseEnter={() => prefetchRoute("/commissioner/feedback/complaints/approved")}
              className="bg-gradient-to-br from-yellow-700 to-yellow-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-all cursor-pointer transform hover:scale-102"
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-white/20 p-3 rounded-full mb-2">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-sm font-semibold text-white mb-1">
                  Complaints
                </h2>
                <p className="text-2xl font-bold text-white">
                  {loading ? "..." : approvedComplaintsCount}
                </p>
                <p className="text-yellow-200 text-xs mt-1">Approved/Closed</p>
              </div>
            </div>

            {/* Ethics and Anti Corruption - Fourth */}
            <div
              onClick={() => router.push("/commissioner/ethics/anticorruption")}
              onMouseEnter={() => prefetchRoute("/commissioner/ethics/anticorruption")}
              className="bg-gradient-to-br from-orange-800 to-orange-900 rounded-lg shadow-md p-4 hover:shadow-lg transition-all cursor-pointer transform hover:scale-102"
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-white/20 p-3 rounded-full mb-2">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-sm font-semibold text-white mb-1">
                  Ethics & Anti Corruption
                </h2>
                <p className="text-2xl font-bold text-white">
                  {loading ? "..." : closedReportsCount}
                </p>
                <p className="text-orange-200 text-xs mt-1">Closed Reports</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
