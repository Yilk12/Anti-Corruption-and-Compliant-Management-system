"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { getCurrentUserId, getCurrentUserPrimaryRole, getCurrentUserRoles } from "@/app/lib/auth";
import { listAdvertisements } from "@/app/lib/advertisements-api";
import { Bell, FileText, MessageSquare, Inbox, Clock, CheckCircle, Plus, Shield } from "lucide-react";

export default function EndUserDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState({
    unreadNotifications: 0,
  });
  const [recentNotifications, setRecentNotifications] = useState<
    Array<{ id: string; title: string; message: string; createdAt: string; referenceUrl?: string }>
  >([]);
  const [isEthicsOfficer, setIsEthicsOfficer] = useState(false);
  const [complaints, setComplaints] = useState<any[]>([]);

  // Check if user is ethics officer
  useEffect(() => {
    const roles = getCurrentUserRoles();
    const lowerRoles = roles.map((r) => String(r).toLowerCase());
    setIsEthicsOfficer(
      lowerRoles.includes("ethics_officer") || lowerRoles.includes("ethics_anti_corruption")
    );
  }, []);

  // Load basic system reports available to end-users
  const loadCounts = useCallback(async () => {
    setError(null);
    try {
      const userId = getCurrentUserId();
      
      // Unread notifications
      let unreadNotifications = 0;
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token');
        const res = await fetch('http://localhost:4000/api/notifications/unread-count', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          unreadNotifications = data.count || 0;
        }
      } catch (e) {
        console.error('Error loading unread notifications:', e);
        unreadNotifications = 0;
      }

      // Recent notifications
      let recentNotifs: any[] = [];
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token');
        const res = await fetch('http://localhost:4000/api/notifications?page=1&limit=3', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          recentNotifs = data.notifications || [];
        }
      } catch (e) {
        console.error('Error loading recent notifications:', e);
        recentNotifs = [];
      }

      // Load user's complaints
      let userComplaints: any[] = [];
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token');
        if (!token) {
          console.log('No token available for complaints fetch');
        } else {
          const res = await fetch(`http://localhost:4000/api/ethics/anticorruption/reports?userId=${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            userComplaints = data.complaints || data || [];
          }
        }
      } catch (e) {
        console.error('Error loading complaints:', e);
        userComplaints = [];
      }

      const newCounts = { unreadNotifications };
      console.log('Dashboard counts updated:', newCounts);
      setCounts(newCounts);
      setRecentNotifications(recentNotifs);
      setComplaints(userComplaints);
    } catch (e: any) {
      setError(e?.message || "Failed to load dashboard report");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  // Auto-refresh every 30 seconds to update counts when items are created
  useEffect(() => {
    const intervalId = setInterval(() => {
      loadCounts();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(intervalId);
  }, [loadCounts]);

  // Refresh when window regains focus (user comes back to tab)
  useEffect(() => {
    const handleFocus = () => {
      loadCounts();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadCounts]);

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {error && (
            <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700">{error}</div>
          )}

          {/* Quick Actions Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActionCard
              title="Submit Complaints"
              description=""
              icon={MessageSquare}
              color="blue"
              href="/guest-feedback"
            />
            <ActionCard
              title="Report Ethics Issue"
              description="Report ethics or anti-corruption concerns"
              icon={Shield}
              color="purple"
              href="/my-complaints"
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
  };

  return (
    <Link href={href} className="group block">
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
    </Link>
  );
}

function ReportCard({
  title,
  value,
  loading,
  href,
  subtitle,
}: {
  title: string;
  value: number;
  loading: boolean;
  href: string;
  subtitle?: string;
}) {
  return (
    <Link href={href} className="group block rounded-lg border p-4 hover:border-blue-300 hover:shadow">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-1 flex items-end justify-between">
        <div className="text-3xl font-bold">{loading ? "…" : value}</div>
        <div className="text-xs text-gray-400">{subtitle}</div>
      </div>
    </Link>
  );
}

function SectionCard({ 
  title, 
  children, 
  onRefresh,
  loading 
}: { 
  title: string; 
  children: React.ReactNode;
  onRefresh?: () => void;
  loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="font-semibold text-gray-900">{title}</div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            title="Refresh"
          >
            <svg 
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? '' : 'Refresh'}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function ActionCard({
  title,
  description,
  icon: Icon,
  color,
  href,
}: {
  title: string;
  description: string;
  icon: any;
  color: string;
  href: string;
}) {
  const colorClasses = {
    blue: "bg-blue-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    indigo: "bg-indigo-500",
  };

  return (
    <Link href={href} className="group block">
      <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 hover:border-blue-300">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-sm text-gray-600 mb-1">{title}</div>
            <div className="text-sm text-gray-500 mt-2">{description}</div>
          </div>
          <div className={`w-12 h-12 ${colorClasses[color as keyof typeof colorClasses]} rounded-lg flex items-center justify-center`}>
            <Icon className="text-white" size={24} />
          </div>
        </div>
      </div>
    </Link>
  );
}
