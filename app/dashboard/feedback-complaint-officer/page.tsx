"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUserPrimaryRole } from "@/app/lib/auth";
import { ClipboardList, AlertTriangle, Shield, Clock, FileText } from "lucide-react";

export default function FeedbackComplaintOfficerDashboardPage() {
  const router = useRouter();
  const [investigationsCount, setInvestigationsCount] = useState<number>(0);
  const [overdueCases, setOverdueCases] = useState<number>(0);
  const [petitionCount, setPetitionCount] = useState<number>(0);

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
    if (role !== "feedback_complaint_officer" && role !== "admin" && role !== "commissioner") {
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

        // Fetch feedback investigations assigned to this officer
        const investigationsRes = await fetch(`${API_BASE}/api/feedback/investigations`, { headers });
        const investigationsData = investigationsRes.ok ? await investigationsRes.json() : [];
        const investigationsCount = Array.isArray(investigationsData) ? investigationsData.length : 0;

        // Calculate overdue cases (investigations past deadline)
        const overdueCount = investigationsData.filter((inv: any) => {
          if (!inv.targetCompletionDate) return false;
          const dueDate = new Date(inv.targetCompletionDate);
          return dueDate < new Date();
        }).length;

        // Fetch petition count
        const petitionRes = await fetch(`${API_BASE}/api/feedback/petitions/count`, { headers });
        const petitionData = petitionRes.ok ? await petitionRes.json() : 0;

        setInvestigationsCount(investigationsCount);
        setOverdueCases(overdueCount);
        setPetitionCount(petitionData);
      } catch {
        setInvestigationsCount(0);
        setOverdueCases(0);
        setPetitionCount(0);
      }
    }

    fetchCounts();
  }, []);

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            {/* Assigned Investigations */}
            <DashboardCard
              title="Assigned Investigations"
              value={investigationsCount}
              loading={false}
              icon={AlertTriangle}
              color="orange"
              href="/feedback/complaints/investigations"
              description="Cases currently under investigation"
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
              icon={FileText}
              color="orange"
              href="/feedback/petitions"
              description="Assigned petitions"
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
