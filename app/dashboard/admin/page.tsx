"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { usersApi } from "@/app/lib/users-api";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState({ users: 0, announcements: 0 });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Users total via pagination
        const u = await usersApi.list({ page: 1, limit: 1 });
        const usersTotal = (u as any)?.pagination?.total ?? (Array.isArray((u as any)?.users) ? (u as any).users.length : 0);

        // Announcements - advertisements module not implemented yet, set to 0
        const adsTotal = 0;

        if (!cancelled) setCounts({ users: usersTotal, announcements: adsTotal });
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load admin report");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Admin Reports</h2>
            <p className="text-gray-600">Overview of key modules: Users, Announcements</p>
          </div>

          {error && (
            <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700">{error}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ReportCard
              title="User Management"
              value={counts.users}
              loading={loading}
              href="/users"
              subtitle="Total users"
            />
            <ReportCard
              title="Announcements"
              value={counts.announcements}
              loading={loading}
              href="/advertisements"
              subtitle="Total announcements"
            />
          </div>

        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

function ReportCard({ title, value, loading, href, subtitle }: { title: string; value: number; loading: boolean; href: string; subtitle?: string }) {
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

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="font-semibold mb-2">{title}</div>
      {children}
    </div>
  );
}

function VerticalBars({ items }: { items: Array<{ label: string; value: number; color: string }> }) {
  const max = Math.max(1, ...items.map(i => i.value || 0));
  const height = 220; // px
  const padding = { top: 20, right: 12, bottom: 40, left: 12 };
  const innerHeight = height - padding.top - padding.bottom;
  const gridLines = 4; // 25% steps like the screenshot
  const formatValue = (n: number) => new Intl.NumberFormat().format(n);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 600 ${height}`} className="w-full h-60">
        {/* Grid */}
        {Array.from({ length: gridLines + 1 }).map((_, i) => {
          const y = padding.top + (innerHeight * i) / gridLines;
          return (
            <line key={i} x1={padding.left} x2={600 - padding.right} y1={y} y2={y} stroke="#E5E7EB" strokeWidth={1} />
          );
        })}

        {/* Bars */}
        {items.map((it, idx) => {
          const barAreaWidth = (600 - padding.left - padding.right) / items.length;
          const barWidth = Math.min(60, barAreaWidth * 0.5);
          const cx = padding.left + barAreaWidth * idx + barAreaWidth / 2;
          const h = max === 0 ? 0 : (it.value / max) * innerHeight;
          const x = cx - barWidth / 2;
          const y = padding.top + innerHeight - h;
          return (
            <g key={it.label}>
              {/* value label above bar */}
              <text x={cx} y={y - 6} textAnchor="middle" fontSize={12} fill="#374151">
                {formatValue(it.value)}
              </text>
              <rect x={x} y={y} width={barWidth} height={h} fill={it.color} rx={2} />
              {/* x label */}
              <text x={cx} y={height - 12} textAnchor="middle" fontSize={12} fill="#374151">
                {it.label}
              </text>
            </g>
          );
        })}

        {/* Axis baseline */}
        <line x1={padding.left} x2={600 - padding.right} y1={padding.top + innerHeight} y2={padding.top + innerHeight} stroke="#9CA3AF" strokeWidth={1} />
      </svg>
    </div>
  );
}

function ComparisonBars({ items }: { items: Array<{ label: string; value: number; color: string }> }) {
  const max = Math.max(1, ...items.map(i => i.value || 0));
  const tickFractions = [0, 0.25, 0.5, 0.75, 1];
  const ticks = tickFractions.map(f => ({ f, v: Math.round(max * f) }));
  return (
    <div className="space-y-4">
      {items.map((it) => (
        <div key={it.label} className="space-y-1">
          <div className="flex items-center justify-between text-sm" style={{ color: "#374151" }}>
            <span>{it.label}</span>
            <span className="text-gray-500">{it.value}</span>
          </div>
          <div className="w-full h-3 rounded bg-gray-100 relative overflow-hidden" style={{ outline: "1px solid #E5E7EB" }}>
            <div
              className="h-3 rounded"
              style={{ width: `${Math.max(0, Math.min(100, (it.value / max) * 100))}%`, backgroundColor: it.color, transition: "width 300ms ease" }}
            />
            <div className="absolute inset-0" aria-hidden>
              <div className="h-full w-full grid grid-cols-10" style={{ opacity: 0.25 }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="border-r" style={{ borderColor: "#E5E7EB" }} />
                ))}
              </div>
            </div>
          </div>
          {/* X-axis with ticks/labels */}
          <div className="relative h-6 mt-2 select-none">
            <div className="absolute left-0 right-0 top-3 h-px" style={{ backgroundColor: "#9CA3AF" }} />
            {ticks.map((t, i) => (
              <div key={i} className="absolute top-0" style={{ left: `${t.f * 100}%`, transform: "translateX(-50%)" }}>
                <div className="h-2 w-px" style={{ backgroundColor: "#9CA3AF" }} />
                <div className="text-[11px] mt-1" style={{ color: "#374151" }}>{t.v}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="text-xs text-gray-500">Axis/Grid styled: labels #374151, axis #9CA3AF, grid #E5E7EB</div>
    </div>
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
  value: number | string;
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
