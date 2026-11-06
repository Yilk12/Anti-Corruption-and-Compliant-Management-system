"use client";

import { useEffect, useMemo, useState } from "react";

// Utility to decode JWT payload
function decodeJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

interface Item {
  id: string;
  type: string;
  message: string;
  status?: string;
  createdAt: string;
  fullName?: string;
  department?: string;
  priority?: string;
  anonymous?: boolean;
  user?: { id: string; firstName?: string | null; lastName?: string | null; email?: string | null } | null;
  departmentObj?: { id: string; name?: string | null; nameAm?: string | null } | null;
}

export default function SuggestionsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<'mine' | 'dept'>('mine');

  // ✅ Grab JWT token
  const token = useMemo(() => {
    try {
      return typeof window !== "undefined"
        ? localStorage.getItem("accessToken") ||
            localStorage.getItem("jwt") ||
            localStorage.getItem("token") ||
            ""
        : "";
    } catch {
      return "";
    }
  }, []);

  // ✅ Backend API base
  const API_BASE =
    (process.env.NEXT_PUBLIC_API_BASE as string) || "http://localhost:4000";

  // ✅ Roles from JWT -> determine department head capability
  const roles: string[] = useMemo(() => {
    try {
      if (!token) return [];
      const p: any = decodeJwt(token);
      const rr: string[] = [];
      if (!p) return rr;
      if (typeof p?.role === 'string') rr.push(p.role);
      if (Array.isArray(p?.role)) rr.push(...p.role);
      if (Array.isArray(p?.roles)) rr.push(...p.roles);
      if (p?.realm_access?.roles) rr.push(...p.realm_access.roles);
      if (p?.resource_access) {
        for (const v of Object.values(p.resource_access)) {
          const rs = (v as any)?.roles;
          if (Array.isArray(rs)) rr.push(...rs);
        }
      }
      return rr.map(String).map(r=>r.toUpperCase());
    } catch { return []; }
  }, [token]);

  const isDeptHead = useMemo(() => roles.some(r => /(DEPARTMENT_HEAD|DEPT_HEAD)/.test(r)), [roles]);

  // ✅ Load suggestions
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === 'dept' && !isDeptHead) {
        setItems([]);
        setLoading(false);
        return;
      }
      const headers: Record<string, string> = {};
      if (token) headers["authorization"] = `Bearer ${token}`;
      // Endpoint based on active tab
      const url = tab === 'mine'
        ? `${API_BASE}/api/submissions/mine/received?type=SUGGESTION`
        : `${API_BASE}/api/submissions/mine/department-unassigned?type=SUGGESTION`;
      const res = await fetch(url, {
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load");
      const all: any[] = Array.isArray(data) ? data : data.items || [];
      // Normalize to our Item shape
      const normalized: Item[] = all.map((s: any) => ({
        id: s.id,
        type: s.type,
        message: s.message || s.description || "",
        status: s.status,
        createdAt: s.createdAt,
        anonymous: !!s.anonymous,
        user: s.user || null,
        departmentObj: s.department || null,
        fullName: s.user ? `${s.user.firstName || ""} ${s.user.lastName || ""}`.trim() || s.user.email : undefined,
        department: s.department ? (s.department.nameAm || s.department.name) : undefined,
      }));
      setItems(normalized);
    } catch (e: any) {
      setError(e?.message || "Failed to load suggestions");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'dept' && !isDeptHead) {
      setTab('mine');
      return;
    }
    load();
  }, [tab, isDeptHead]);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Suggestions</h1>
          <p className="text-sm text-gray-600">View suggestions for you or your department</p>
        </div>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded border ${tab==='mine' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300'}`}
            onClick={()=>setTab('mine')}
          >
            My feedbacks
          </button>
          {isDeptHead && (
            <button
              className={`px-3 py-1 rounded border ${tab==='dept' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300'}`}
              onClick={()=>setTab('dept')}
            >
              Department feedbacks
            </button>
          )}
        </div>
      </div>

      {error && <div className="text-sm text-red-700">{error}</div>}

      {/* Cards list */}
      {loading ? (
        <div className="p-4 text-sm text-gray-600">Loading...</div>
      ) : items.length === 0 ? (
        <div className="p-4 text-sm text-gray-600">No suggestions found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => (
            <div key={it.id} className="border rounded-lg bg-white shadow-sm p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100">{it.type}</span>
                <span className="text-[11px] uppercase text-gray-500">{new Date(it.createdAt).toLocaleString()}</span>
              </div>
              <div className="text-sm text-gray-900 whitespace-pre-wrap">
                {it.message}
              </div>
              <div className="text-xs text-gray-600 flex flex-wrap gap-2">
                <span>
                  From: {it.anonymous ? "Anonymous" : (it.fullName || "N/A")}
                </span>
                {it.department && (
                  <span className="ml-auto">Dept: {it.department}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
