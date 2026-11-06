"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUserRoles } from "@/app/lib/auth";
import { FileText } from "lucide-react";

export default function AdministrativeComplaintsTeamDashboardPage() {
  const router = useRouter();
  const [assignedCount, setAssignedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  function getToken() {
    try {
      return (
        localStorage.getItem("accessToken") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("token") ||
        ""
      );
    } catch {
      return "";
    }
  }

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");

  useEffect(() => {
    const roles = getCurrentUserRoles();
    const isAdmin = roles.includes("admin");
    const isAdminComplaintsTeam = roles.some((r: string) => r.toLowerCase().includes("administrative"));
    
    if (!isAdmin && !isAdminComplaintsTeam) {
      router.replace("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    async function fetchComplaints() {
      try {
        setLoading(true);
        const token = getToken();
        const headers: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        // Fetch administrative complaints (category = "Administrative Complaints" or "አስተዳደራዊ ጥቆማ")
        const res = await fetch(`${API_BASE}/api/feedback/complaints`, { headers });
        const data = res.ok ? await res.json() : [];
        const complaintsArray = Array.isArray(data) ? data : [];

        // Filter for administrative complaints assigned to team
        const assignedAdminComplaints = complaintsArray.filter((c: any) =>
          (c.category === "Administrative Complaints" ||
           c.category === "አስተዳደራዊ ጥቆማ" ||
           c.category === "አስተዳደራዊ ቅሬታ") &&
          c.status === "Assigned_To_Investigation_Team"
        );

        setAssignedCount(assignedAdminComplaints.length);
      } catch (error) {
        console.error("Failed to fetch complaints:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchComplaints();
  }, []);

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Administrative Complaints Investigation Team</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6">
            {/* Administrative Complaints Button */}
            <div
              onClick={() => router.push("/feedback/complaints/list?filter=administrative")}
              className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 hover:border-orange-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="bg-orange-100 p-6 rounded-full">
                    <FileText className="h-12 w-12 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Administrative Complaints
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Complaints assigned by manager for investigation
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-orange-600">
                    {loading ? "..." : assignedCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
