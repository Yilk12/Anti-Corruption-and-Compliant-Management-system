"use client";

import React, { useEffect, useState, Suspense } from "react";
import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { MessageSquare, Bell } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCurrentUserPrimaryRole, getCurrentUserId } from "@/app/lib/auth";
import { getDepartmentInfo } from "@/app/lib/session";
import { apiGet } from "@/app/lib/api";

export const dynamic = 'force-dynamic';

function DepartmentHeadDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedDepartmentId = searchParams.get('departmentId');

  const [ideasBoxCount, setIdeasBoxCount] = useState<number | null>(null);
  const [feedbackComplaintsCount, setFeedbackComplaintsCount] = useState<number | null>(null);
  const [commissionerDecisionCount, setCommissionerDecisionCount] = useState<number | null>(null);
  const [additionalCounts, setAdditionalCounts] = useState({});
  const deptInfo = getDepartmentInfo();

  // Simple helper reused from other pages
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

  async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit) {
    const token = getToken();
    const headers = new Headers(init?.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    return fetch(input, { ...init, headers });
  }

  useEffect(() => {
    async function loadCounts() {
      try {
        const token = getToken();


        // --- Feedback submissions for my department (ideas & complaints box) ---
        try {
          const ideasTypes = new Set(["COMPLAINT", "SUGGESTION", "COMPLIMENT", "FEEDBACK"]);

          // 1) Submissions sent directly to me
          const receivedRes = await fetch(`${API_BASE}/api/submissions/mine/received`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });

          let countReceived = 0;
          if (receivedRes.ok) {
            const subsJson = await receivedRes.json().catch(() => ({}));
            const subsItems: any[] = Array.isArray(subsJson?.items)
              ? subsJson.items
              : Array.isArray(subsJson)
              ? subsJson
              : [];

            const relevantReceived = subsItems.filter((s: any) => {
              const rawType = (s as any).type;
              const type = typeof rawType === "string" ? rawType.toUpperCase() : "";
              return ideasTypes.has(type);
            });

            countReceived = relevantReceived.length;
          }

          // 2) Submissions for my department with no explicit recipient
          const deptRes = await fetch(`${API_BASE}/api/submissions/mine/department-unassigned`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });

          let countDept = 0;
          if (deptRes.ok) {
            const deptJson = await deptRes.json().catch(() => ({}));
            const deptItems: any[] = Array.isArray(deptJson?.items)
              ? deptJson.items
              : Array.isArray(deptJson)
              ? deptJson
              : [];

            const relevantDept = deptItems.filter((s: any) => {
              const rawType = (s as any).type;
              const type = typeof rawType === "string" ? rawType.toUpperCase() : "";
              return ideasTypes.has(type);
            });

            countDept = relevantDept.length;
          }

          setIdeasBoxCount(countReceived + countDept);
        } catch {
          setIdeasBoxCount(0);
        }

        // --- Feedback complaints assigned to my department ---
        try {
          const feedbackRes = await fetch(`${API_BASE}/api/feedback/complaints`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });

          if (feedbackRes.ok) {
            const feedbackJson = await feedbackRes.json().catch(() => ({}));
            const feedbackItems: any[] = Array.isArray(feedbackJson) ? feedbackJson : [];
            
            // Filter complaints assigned to this department
            const assignedComplaints = feedbackItems.filter((c: any) => {
              // If a specific department is selected from guest feedback page, filter by that
              if (selectedDepartmentId) {
                return c.departmentId === selectedDepartmentId && 
                       (c.status === 'Assigned to Department' || c.status === 'Under Department Review');
              }
              // Otherwise show complaints for the user's actual department
              const userDepartmentId = deptInfo?.id;
              return userDepartmentId && c.departmentId === userDepartmentId &&
                     (c.status === 'Assigned to Department' || c.status === 'Under Department Review');
            });

            setFeedbackComplaintsCount(assignedComplaints.length);
          } else {
            setFeedbackComplaintsCount(0);
          }
        } catch (error) {
          console.error('Error fetching feedback complaints:', error);
          setFeedbackComplaintsCount(0);
        }

        // --- Commissioner Decision Notifications ---
        try {
          const notificationsRes = await fetch(`${API_BASE}/api/user-notifications`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });

          if (notificationsRes.ok) {
            const notificationsJson = await notificationsRes.json().catch(() => ({}));
            const notificationsItems: any[] = Array.isArray(notificationsJson) ? notificationsJson : [];

            // Filter for commissioner decision notifications
            const commissionerDecisions = notificationsItems.filter((n: any) => {
              return n.type === 'COMMISSIONER_DECISION' && !n.isRead;
            });

            setCommissionerDecisionCount(commissionerDecisions.length);
          } else {
            setCommissionerDecisionCount(0);
          }
        } catch (error) {
          console.error('Error fetching commissioner decision notifications:', error);
          setCommissionerDecisionCount(0);
        }

        // --- No additional counts needed ---
      } catch {
        setIdeasBoxCount(0);
        setAdditionalCounts({});
      }
    }

    // Only load counts for department heads; others will be redirected below
    loadCounts();
  }, []);

  // If user is not a department head, send them to the main dashboard router
  useEffect(() => {
    const role = getCurrentUserPrimaryRole();
    if (role !== "department_head" && role !== "women_social_inclusion") {
      router.replace("/dashboard");
    }
  }, [router]);

  const formatCount = (value: number | null) => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return "0";
    }
    return String(value);
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-1 text-center">
            {deptInfo?.name && (
              <h2 className="text-2xl font-bold text-gray-900">
                {deptInfo.name}
              </h2>
            )}
          </div>

          {/* Stat Cards */}
          <div className="flex justify-center gap-6">
            {/* Feedback Complaints */}
            <button
              type="button"
              onClick={() => {
                const url = selectedDepartmentId
                  ? `/feedback/complaints/list?departmentId=${selectedDepartmentId}`
                  : `/feedback/complaints/list`;
                router.push(url);
              }}
              className="w-full max-w-md bg-white rounded-xl shadow-lg flex items-center justify-center gap-4 px-6 py-4 relative overflow-hidden text-left hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
              <div className="relative flex items-center gap-4">
                <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600">
                  <MessageSquare className="w-6 h-6" />
                </div>

                <div className="relative flex flex-col">
                  <span className="text-sm font-bold text-gray-900 mb-1">
                    የአገልግሎት አሰጣጥ ላይ የቀረቡ ቅሬታዎች
                  </span>
                  <span className="text-3xl font-extrabold text-gray-900 leading-tight">
                    {formatCount(feedbackComplaintsCount)}
                  </span>
                </div>
              </div>
            </button>

            {/* Commissioner Decision Notifications */}
            <button
              type="button"
              onClick={() => router.push('/notifications')}
              className="w-full max-w-md bg-white rounded-xl shadow-lg flex items-center justify-center gap-4 px-6 py-4 relative overflow-hidden text-left hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
            >
              <div className="relative flex items-center gap-4">
                <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100 text-orange-600">
                  <Bell className="w-6 h-6" />
                </div>

                <div className="relative flex flex-col">
                  <span className="text-sm font-bold text-gray-900 mb-1">
                    የኮሚሽነር ዉሳኔ ማስታወሻ
                  </span>
                  <span className="text-3xl font-extrabold text-gray-900 leading-tight">
                    {formatCount(commissionerDecisionCount)}
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Additional Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

export default function DepartmentHeadDashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DepartmentHeadDashboardContent />
    </Suspense>
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
