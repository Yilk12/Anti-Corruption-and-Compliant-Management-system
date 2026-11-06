"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { decodeJwt } from "@/app/lib/auth";
import { useLocalization } from "@/app/hooks/use-localization";

interface Item {
  id: string;
  type: string;
  subject: string;
  message: string;
  status?: string;
  createdAt: string;
  fullName?: string;
  department?: string;
  priority?: string;
  anonymous?: boolean;
}

export default function VoiceboxDashboardPage() {
  const router = useRouter();
  const { t } = useLocalization();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [reportRange, setReportRange] = useState<"weekly" | "monthly" | "yearly" | "all">("weekly");
  const [exportFormat, setExportFormat] = useState<"word" | "excel" | "pdf">("excel");
  const [roles, setRoles] = useState<string[]>([]);
  const [respondingTo, setRespondingTo] = useState<Item | null>(null);
  const [responseText, setResponseText] = useState("");
  const [sendingResponse, setSendingResponse] = useState(false);

  // Load roles from JWT on client only to avoid SSR/client mismatch
  useEffect(() => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken") ||
            localStorage.getItem("jwt") ||
            localStorage.getItem("token")
          : null;
      if (!token) {
        setRoles([]);
        return;
      }

      const p: any = decodeJwt(token);
      const rr: string[] = [];
      if (typeof p?.role === "string") rr.push(p.role);
      if (Array.isArray(p?.role)) rr.push(...p.role);
      if (Array.isArray(p?.roles)) rr.push(...p.roles);
      if (p?.realm_access?.roles) rr.push(...p.realm_access.roles);
      if (p?.resource_access) {
        for (const v of Object.values(p.resource_access)) {
          const rrs = (v as any)?.roles;
          if (Array.isArray(rrs)) rr.push(...rrs);
        }
      }

      setRoles(rr.map(String).map((r) => r.toUpperCase()));
    } catch {
      setRoles([]);
    }
  }, []);

  // Initialize filters from URL query parameters (e.g. ?tab=sent&type=complaint&respondToId=...)
  const [initialRespondToId, setInitialRespondToId] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "received" || tab === "sent") {
        setActiveTab(tab);
      }

      const typeParam = params.get("type");
      if (typeParam && ["all", "feedback", "complaint", "suggestion", "compliment"].includes(typeParam)) {
        setSelectedType(typeParam);
      }

      const respondToId = params.get("respondToId");
      if (respondToId) {
        setInitialRespondToId(respondToId);
      }
    } catch {}
  }, []);

  const isAdminOrDirector = roles.some((r) => /(ADMIN|GENERAL_DIRECTOR|DIRECTOR|SUPERUSER)/.test(r));
  const isDeptHead = roles.some((r) => /(DEPARTMENT_HEAD|DEPT_HEAD)/.test(r));
  const isEthicsAntiCorruption = roles.includes("ETHICS_ANTI_CORRUPTION");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token'))
        : null;
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      if (token) headers['authorization'] = `Bearer ${token}`;

      const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');

      // Oversight roles (admins, directors, department heads, commissioners)
      // should be able to view all submissions, not just their own.
      const isCommissioner = roles.some((r) => /(COMMISSIONER)/.test(r));
      const isOversightRole = isAdminOrDirector || isDeptHead || isCommissioner;

      // For regular feedback senders: "sent" tab shows their own submissions,
      // "received" tab shows responses they have received, derived from
      // notifications whose messages start with "Response to your feedback".
      if (!isOversightRole && activeTab === 'received') {
        const notifRes = await fetch(`${apiBase}/api/notifications`, {
          headers,
          credentials: 'include',
        });
        const notifJson = await notifRes.json().catch(() => ([]));
        if (!notifRes.ok) {
          // If notifications cannot be loaded, show an empty list rather than
          // hard-failing the entire Voicebox page.
          setItems([]);
          return;
        }

        const list: any[] = Array.isArray(notifJson)
          ? notifJson
          : Array.isArray((notifJson as any).notifications)
          ? (notifJson as any).notifications
          : [];

        const responses = list.filter((n: any) => {
          const msg = typeof n?.message === 'string' ? n.message : '';
          return msg.toLowerCase().startsWith('response to your feedback');
        });

        const mappedResponses: Item[] = responses.map((n: any) => {
          const rawMsg: string = String(n.message || '');
          const lines = rawMsg.split('\n');
          const firstLine = lines[0] || '';
          const subject = firstLine.replace(/^Response to your feedback:\s*/i, '') || '(no subject)';
          const body = lines.slice(1).join('\n').trim();

          return {
            id: String(n.id ?? `${n.createdAt || ''}-${subject}`),
            type: 'RESPONSE',
            subject,
            message: body || rawMsg,
            status: '-',
            createdAt: n.createdAt || new Date().toISOString(),
            fullName: 'Feedback and Complaint Management',
            department: undefined,
            priority: 'normal',
            anonymous: false,
          };
        });

        setItems(mappedResponses);
        return;
      }

      const url = isOversightRole
        ? `${apiBase}/api/submissions`
        : activeTab === 'received'
        ? `${apiBase}/api/submissions/mine/received`
        : `${apiBase}/api/submissions/mine/created`;

      const r = await fetch(url, { headers });
      const raw = await r.json().catch(()=>([]));
      if (!r.ok) throw new Error(raw?.message || raw?.error || 'Failed');

      const arr: any[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.items) ? raw.items : []);
      const mapped: Item[] = arr.map((s: any) => {
        const msg: string = String(s.message || '');
        const firstLine = msg.split('\n')[0];
        const subject = firstLine.length > 80 ? firstLine.slice(0, 77) + '...' : firstLine;

        // Prefer explicit submitter full name from the API,
        // then fall back to linked user names, then email.
        const explicitFullName = (s.fullName as string | undefined) && String(s.fullName).trim()
          ? String(s.fullName).trim()
          : undefined;

        const userNameFromRelation = s.user
          ? (() => {
              const name = `${s.user.firstName || ''} ${s.user.lastName || ''}`.trim();
              if (name) return name;
              if (s.user.email) return String(s.user.email).trim();
              return undefined;
            })()
          : undefined;

        // Resolve sender's department from multiple possible API shapes
        const departmentFromSubmission = s.department
          ? (s.department.nameAm || s.department.name)
          : undefined;

        const departmentFromUser = s.user && s.user.department
          ? (s.user.department.nameAm || s.user.department.name)
          : undefined;

        const flatDeptName =
          (s.departmentNameAm as string | undefined) ||
          (s.departmentName as string | undefined) ||
          undefined;

        const department =
          (departmentFromSubmission && String(departmentFromSubmission).trim()) ||
          (departmentFromUser && String(departmentFromUser).trim()) ||
          (flatDeptName && String(flatDeptName).trim()) ||
          undefined;

        const submitterFullName = explicitFullName || userNameFromRelation || department || undefined;

        // Treat records with no linked user as effectively anonymous so we don't show "Unknown User"
        const isAnonymous = Boolean(s.anonymous) || !s.user;

        return {
          id: s.id,
          type: String(s.type || '').toUpperCase(),
          subject: subject || '(no subject)',
          message: msg,
          status: '-',
          createdAt: s.createdAt,
          fullName: isAnonymous ? 'Anonymous' : submitterFullName,
          department,
          priority: 'normal',
          anonymous: isAnonymous,
        };
      });
      setItems(mapped);
    } catch (e:any) {
      setError(e?.message || 'Failed to load');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [activeTab]);

  // After items load, if a respondToId was provided, open the respond modal for that item
  useEffect(() => {
    if (!initialRespondToId || !items.length) return;
    const target = items.find((it) => String(it.id) === String(initialRespondToId));
    if (target) {
      openRespond(target);
      setInitialRespondToId(null);
    }
  }, [initialRespondToId, items]);

  const filteredItems = useMemo(() => {
    let filtered = items;
    
    if (selectedType !== "all") {
      filtered = filtered.filter(item => item.type.toLowerCase() === selectedType.toLowerCase());
    }
    
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [items, selectedType, searchQuery]);

  const onDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')) : null;
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      if (token) headers['authorization'] = `Bearer ${token}`;
      const apiBase = process.env.NEXT_PUBLIC_API_URL;
      const r = await fetch(`${apiBase}/api/submissions/${id}`, { method: 'DELETE', headers });
      if (!r.ok) {
        const d = await r.json().catch(()=>({}));
        throw new Error(d?.message || 'Delete failed');
      }
      setItems(prev => prev.filter(x => x.id !== id));
    } catch (e:any) {
      alert(e?.message || 'Delete failed');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'feedback': return 'bg-green-100 text-green-800 border-green-200';
      case 'complaint': return 'bg-red-100 text-red-800 border-red-200';
      case 'suggestion': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'compliment': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'feedback': return '💬';
      case 'complaint': return '⚠️';
      case 'suggestion': return '💡';
      case 'compliment': return '⭐';
      default: return '📝';
    }
  };

  const stats = useMemo(() => {
    const received = items.filter(item => activeTab === 'received');
    return {
      total: received.length,
      feedback: received.filter(item => item.type.toLowerCase() === 'feedback').length,
      complaints: received.filter(item => item.type.toLowerCase() === 'complaint').length,
      suggestions: received.filter(item => item.type.toLowerCase() === 'suggestion').length,
    };
  }, [items, activeTab]);

  // ----- Reporting & export helpers -----
  const getRangeStart = (range: "weekly" | "monthly" | "yearly" | "all") => {
    if (range === "all") {
      return new Date(0);
    }
    const now = new Date();
    const start = new Date(now);
    if (range === "weekly") {
      start.setDate(now.getDate() - 7);
    } else if (range === "monthly") {
      start.setMonth(now.getMonth() - 1);
    } else if (range === "yearly") {
      start.setFullYear(now.getFullYear() - 1);
    }
    return start;
  };

  const handleExport = () => {
    if (typeof window === "undefined") return;

    const now = new Date();
    const start = getRangeStart(reportRange);

    // Use the same set of items the user currently sees (search + type filters)
    const itemsInRange = filteredItems.filter((item) => {
      const d = new Date(item.createdAt);
      return d >= start && d <= now;
    });

    if (!itemsInRange.length) {
      return;
    }

    const headers = [
      "#",
      "Type",
      "Date",
      "Sender",
      "Department",
      "Subject",
      "Message",
    ];

    const rows = itemsInRange.map((item, idx) => [
      String(idx + 1),
      item.type || "",
      new Date(item.createdAt).toLocaleString(),
      item.anonymous ? "Anonymous" : (item.fullName || ""),
      item.department || "",
      item.subject || "",
      item.message || "",
    ]);

    const escapeHtml = (v: string) =>
      v
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const tableHtml = `<!DOCTYPE html><html><head><meta charset="utf-8" />
      <style>
        table { border-collapse: collapse; width: 100%; font-size: 12px; }
        th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
        th { background: #f3f4f6; }
      </style>
    </head><body>
      <h2>Voicebox Feedback Report (${reportRange})</h2>
      <table>
        <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows
            .map(
              (r) =>
                `<tr>${r
                  .map((cell) => `<td>${escapeHtml(String(cell ?? ""))}</td>`)
                  .join("")}</tr>`
            )
            .join("")}
        </tbody>
      </table>
    </body></html>`;

    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

    if (exportFormat === "pdf") {
      const win = window.open("", "_blank");
      if (!win) return;
      win.document.open();
      win.document.write(tableHtml);
      win.document.close();
      win.focus();
      win.print();
      return;
    }

    const mime =
      exportFormat === "word"
        ? "application/msword"
        : "application/vnd.ms-excel";
    const ext = exportFormat === "word" ? "doc" : "xls";
    const blob = new Blob([tableHtml], { type: `${mime};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voicebox-feedback-${reportRange}-${ts}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openRespond = (item: Item) => {
    setRespondingTo(item);
    setResponseText("");
  };

  const closeRespond = () => {
    if (sendingResponse) return;
    setRespondingTo(null);
    setResponseText("");
  };

  const handleSendResponse = async () => {
    if (!respondingTo) return;
    const body = responseText.trim();
    if (!body) return;
    try {
      setSendingResponse(true);
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token'))
        : null;
      const apiBase = process.env.NEXT_PUBLIC_API_URL;
      const url = `${apiBase}/api/submissions/${encodeURIComponent(respondingTo.id)}/respond`;
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      if (token) headers['authorization'] = `Bearer ${token}`;

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: body }),
      });
      const text = await res.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {}
      if (!res.ok) {
        const msg = (json && (json.message || json.error)) || 'Failed to send response';
        throw new Error(msg);
      }

      alert('Response sent successfully.');
      closeRespond();
    } catch (e: any) {
      alert(e?.message || 'Failed to send response');
    } finally {
      setSendingResponse(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-center mb-8">
          <button 
            className="px-6 py-3 rounded-xl bg-linear-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
            onClick={() => router.push('/feedback/new')}
          >
            <span>+</span>
            አስተያየትና ጥቆማ ለመስጠት ይህንን ይጫኑ
          </button>
        </div>

        {/* Stats Cards - Only show for received tab */}
        {activeTab === 'received' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">{t("voicebox.stats.total")}</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500 bg-opacity-10">
                  <span className="text-2xl">📥</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">{t("voicebox.stats.feedback")}</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.feedback}</p>
                </div>
                <div className="p-3 rounded-xl bg-green-500 bg-opacity-10">
                  <span className="text-2xl">💬</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">{t("voicebox.stats.complaints")}</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.complaints}</p>
                </div>
                <div className="p-3 rounded-xl bg-red-500 bg-opacity-10">
                  <span className="text-2xl">⚠️</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">{t("voicebox.stats.suggestions")}</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.suggestions}</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500 bg-opacity-10">
                  <span className="text-2xl">💡</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Tab Switcher */}
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                className={`px-6 py-2 rounded-md font-medium transition-all duration-300 ${
                  activeTab === 'received' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                onClick={() => setActiveTab('received')}
              >
                📥 {t("voicebox.tab.received")}
              </button>
              <button
                className={`px-6 py-2 rounded-md font-medium transition-all duration-300 ${
                  activeTab === 'sent' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                onClick={() => setActiveTab('sent')}
              >
                📤 {t("voicebox.tab.sent")}
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 flex-1 w-full lg:w-auto lg:justify-end">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                  🔍
                </div>
                <input
                  type="text"
                  placeholder={t("voicebox.search_ph")}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Type Filter */}
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">{t("voicebox.filter.all")}</option>
                <option value="feedback">{t("voicebox.filter.feedback")}</option>
                <option value="complaint">{t("voicebox.filter.complaint")}</option>
                <option value="suggestion">{t("voicebox.filter.suggestion")}</option>
                <option value="compliment">{t("voicebox.filter.compliment")}</option>
              </select>

              {/* Report range + export controls */}
              <div className="flex flex-col sm:flex-row gap-2 md:ml-4">
                <select
                  value={reportRange}
                  onChange={(e) => setReportRange(e.target.value as "weekly" | "monthly" | "yearly" | "all")}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="all">All</option>
                </select>

                <div className="flex items-center gap-2">
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as "word" | "excel" | "pdf")}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                  >
                    <option value="word">Word</option>
                    <option value="excel">Excel</option>
                    <option value="pdf">PDF</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleExport}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                    disabled={!filteredItems.length}
                  >
                    Export
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <span>❌</span>
            {t("voicebox.error.loading")}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{t("voicebox.empty.title")}</h3>
            <p className="text-slate-600 mb-6">{t("voicebox.empty.desc")}</p>
            <button 
              className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              onClick={() => router.push('/feedback/new')}
            >
              {t("voicebox.create_cta")}
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredItems.map((item) => (
              <div 
                key={item.id} 
                className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getTypeColor(item.type)}`}>
                        <span className="mr-2">{getTypeIcon(item.type)}</span>
                        {item.type.toLowerCase()}
                      </div>
                      <span className="text-sm text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                      title={t("voicebox.actions.delete_title")}
                      onClick={() => onDelete(item.id)}
                    >
                      🗑️
                    </button>
                  </div>

                  <h3 className="font-semibold text-lg text-slate-900 mb-3">{item.subject}</h3>
                  
                  <p className="text-slate-700 mb-4 line-clamp-3 leading-relaxed">{item.message}</p>

                  {(activeTab === 'received' || (activeTab === 'sent' && isEthicsAntiCorruption)) && (
                    <button 
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-4"
                      onClick={() => openRespond(item)}
                    >
                      {t("voicebox.actions.respond")}
                    </button>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        {item.anonymous ? (
                          <span>{t("voicebox.common.anonymous")}</span>
                        ) : (
                          <span>{item.fullName || t("voicebox.common.unknown_user")}</span>
                        )}
                      </div>
                      {item.department && (
                        <div className="flex items-center gap-2">
                          <span>🏢</span>
                          <span>{item.department}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                        onClick={() => {/* Add view details action */}}
                      >
                        {t("voicebox.actions.view_details")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Role-based info */}
        {(isAdminOrDirector || isDeptHead) && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
            <div className="flex items-center gap-2 mb-1">
              <span>ℹ️</span>
              <span className="font-medium">Role Information:</span>
            </div>
            <p>
              {isAdminOrDirector && "Admins/Directors can see all submissions. "}
              {isDeptHead && "Department Heads can see submissions for their department. "}
              Employees can only see their own submissions.
            </p>
          </div>
        )}
      </div>
      {respondingTo && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Respond to Complaint</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(respondingTo.createdAt).toLocaleString()}  by {respondingTo.anonymous ? "Anonymous" : (respondingTo.fullName || "")}
                </p>
              </div>
              <button
                type="button"
                onClick={closeRespond}
                className="text-slate-500 hover:text-slate-700 text-lg"
                disabled={sendingResponse}
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2 text-amber-800 text-sm font-semibold">
                  <span>📝</span>
                  <span>Complaint</span>
                </div>
                <h4 className="font-medium text-slate-900 mb-1">{respondingTo.subject}</h4>
                <p className="text-sm text-slate-700 whitespace-pre-line">
                  {respondingTo.message}
                </p>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Write a response</h4>
                <textarea
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-25"
                  placeholder="Type your response..."
                  maxLength={1000}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                />
                <div className="mt-1 text-xs text-slate-400 text-right">
                  {responseText.length}/1000
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex items-center justify-end gap-3 bg-slate-50">
              <button
                type="button"
                onClick={closeRespond}
                className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                disabled={sendingResponse}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendResponse}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                disabled={sendingResponse || !responseText.trim()}
              >
                {sendingResponse ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}