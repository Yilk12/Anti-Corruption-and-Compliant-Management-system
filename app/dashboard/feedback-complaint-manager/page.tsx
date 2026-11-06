"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUserPrimaryRole } from "@/app/lib/auth";
import { ClipboardList, AlertTriangle, Shield, Clock, FileText, Users } from "lucide-react";

export default function FeedbackComplaintManagerDashboardPage() {
  const router = useRouter();
  const [complaintsCount, setComplaintsCount] = useState<number>(0);
  const [internalComplaintsCount, setInternalComplaintsCount] = useState<number>(0);
  const [externalComplaintsCount, setExternalComplaintsCount] = useState<number>(0);
  const [investigationsCount, setInvestigationsCount] = useState<number>(0);
  const [approvedCases, setApprovedCases] = useState<number>(0);
  const [overdueCases, setOverdueCases] = useState<number>(0);
  const [departmentalResponseCount, setDepartmentalResponseCount] = useState<number>(0);
  const [petitionCount, setPetitionCount] = useState<number>(0);
  const [administrativeComplaintsCount, setAdministrativeComplaintsCount] = useState<number>(0);

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
    const role = getCurrentUserPrimaryRole();
    if (role !== "feedback_complaint_manager" && role !== "admin" && role !== "commissioner") {
      router.replace("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const token = getToken();
        const headers: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        // Fetch complaints
        const complaintsRes = await fetch(`${API_BASE}/api/feedback/complaints`, { headers });
        const complaintsData = complaintsRes.ok ? await complaintsRes.json() : [];
        const complaintsArray = Array.isArray(complaintsData) ? complaintsData : [];
        
        // Count only unviewed complaints (viewedAt is null)
        const complaintsCount = complaintsArray.filter((c: any) => !c.viewedAt).length;
        const allComplaintsCount = complaintsArray.length;

        // Count internal vs external complaints
        const internalCount = complaintsArray.filter((c: any) => c.isInternal === true).length;
        const externalCount = complaintsArray.filter((c: any) => c.isInternal === false).length;

        // Count complaints with departmental responses
        const departmentalResponseCount = complaintsArray.filter((c: any) => 
          c.departmentalResponse
        ).length;

        // Count approved/final complaints
        const approvedComplaintsCount = complaintsArray.filter((c: any) => {
          return c.status === 'Closed' || c.status === 'Accepted';
        }).length;

        // Fetch investigations (count only under investigation petitions)
        const investigationsRes = await fetch(`${API_BASE}/api/feedback/petitions/all`, { headers });
        const investigationsData = investigationsRes.ok ? await investigationsRes.json() : [];
        const investigationsCount = Array.isArray(investigationsData) 
          ? investigationsData.filter((inv: any) => inv.status === 'Assigned for Investigation' || inv.status === 'Under Investigation').length 
          : 0;

        // Count approved petitions
        const approvedPetitionsCount = Array.isArray(investigationsData)
          ? investigationsData.filter((inv: any) => 
              inv.status === 'Closed' || 
              inv.status === 'Final Decision Issued' ||
              inv.status === 'Investigation Report Submitted' ||
              inv.status === 'Under Final Decision Review' ||
              inv.status === 'Investigation Returned for Correction'
            ).length
          : 0;

        // Total approved cases = approved complaints + approved petitions
        const approvedCount = approvedComplaintsCount + approvedPetitionsCount;

        // Count overdue petitions
        const overduePetitionsCount = Array.isArray(investigationsData)
          ? investigationsData.filter((inv: any) => {
              if (!inv.investigationDeadline) return false;
              if (inv.status === 'Closed') return false;
              const deadline = new Date(inv.investigationDeadline);
              return deadline < new Date();
            }).length
          : 0;

        // Count overdue complaints
        const overdueComplaintsCount = complaintsArray.filter((c: any) => {
          if (!c.targetCompletionDate) return false;
          if (c.status === 'Closed' || c.status === 'Accepted') return false;
          const deadline = new Date(c.targetCompletionDate);
          return deadline < new Date();
        }).length;

        // Total overdue = overdue petitions + overdue complaints
        const overdueCount = overduePetitionsCount + overdueComplaintsCount;

        // Fetch petition count
        const petitionRes = await fetch(`${API_BASE}/api/feedback/petitions/count`, { headers });
        const petitionData = petitionRes.ok ? await petitionRes.json() : 0;

        // Count administrative complaints pending assignment (status: Submitted or Under_Manager_Review)
        const pendingAdminComplaints = complaintsArray.filter((c: any) => 
          (c.category === 'Administrative Complaints' || 
           c.category === 'አስተዳደራዊ ጥቆማ' || 
           c.category === 'አስተዳደራዊ ቅሬታ') &&
          (c.status === 'Submitted' || c.status === 'Under_Manager_Review')
        );

        setComplaintsCount(complaintsCount);
        setInternalComplaintsCount(internalCount);
        setExternalComplaintsCount(externalCount);
        setInvestigationsCount(investigationsCount);
        setApprovedCases(approvedCount);
        setOverdueCases(overdueCount);
        setDepartmentalResponseCount(departmentalResponseCount);
        setPetitionCount(petitionData);
        setAdministrativeComplaintsCount(pendingAdminComplaints.length);
      } catch {
        setComplaintsCount(0);
        setInternalComplaintsCount(0);
        setExternalComplaintsCount(0);
        setInvestigationsCount(0);
        setApprovedCases(0);
        setOverdueCases(0);
        setDepartmentalResponseCount(0);
        setPetitionCount(0);
        setAdministrativeComplaintsCount(0);
      }
    }

    fetchCounts();
  }, []);

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {/* General Complaints */}
            <DashboardCard
              title="ጠቅላላ ቅሬታዎች"
              value={complaintsCount}
              loading={false}
              icon={FileText}
              color="blue"
              href="/feedback/complaints/list"
              description="All feedback complaints"
            />

            {/* Department Response */}
            <DashboardCard
              title="Department Response"
              value={departmentalResponseCount}
              loading={false}
              icon={Users}
              color="green"
              href="/feedback/complaints/list?filter=department-response"
              description="Complaints with departmental responses"
            />

            {/* Approved Cases */}
            <DashboardCard
              title="Approved Cases"
              value={approvedCases}
              loading={false}
              icon={ClipboardList}
              color="green"
              href="/feedback/complaints/approved"
              description="Approved investigations"
            />

            {/* Overdue Cases */}
            <DashboardCard
              title="Overdue Cases"
              value={overdueCases}
              loading={false}
              icon={Clock}
              color="red"
              href="/feedback/complaints/investigations?filter=overdue"
              description="Cases past deadline"
            />

            {/* Petitions */}
            <DashboardCard
              title="አቤቱታ"
              value={petitionCount}
              loading={false}
              icon={AlertTriangle}
              color="orange"
              href="/feedback/manager-petitions"
              description="Pending petitions"
            />

            {/* Administrative Complaints */}
            <DashboardCard
              title="Administrative Complaints"
              value={administrativeComplaintsCount}
              loading={false}
              icon={Shield}
              color="teal"
              href="/feedback/complaints/list?filter=administrative"
              description="Pending assignment to team"
            />
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

function DashboardCard({
  title,
  value,
  loading,
  icon: Icon,
  color,
  href,
  description,
}: {
  title: string;
  value: number;
  loading: boolean;
  icon: any;
  color: string;
  href: string;
  description: string;
}) {
  const colorClasses = {
    blue: "bg-blue-500",
    pink: "bg-pink-500",
    indigo: "bg-indigo-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
    orange: "bg-orange-500",
    purple: "bg-purple-500",
    teal: "bg-teal-500",
  };

  return (
    <a href={href} className="group block">
      <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 hover:border-blue-300">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-sm text-gray-600 mb-1">{title}</div>
            <div className="text-3xl font-bold text-gray-900">
              {loading ? "…" : value}
            </div>
            <div className="text-sm text-gray-500 mt-2">{description}</div>
          </div>
          <div className={`w-12 h-12 ${colorClasses[color as keyof typeof colorClasses]} rounded-lg flex items-center justify-center`}>
            <Icon className="text-white" size={24} />
          </div>
        </div>
      </div>
    </a>
  );
}
