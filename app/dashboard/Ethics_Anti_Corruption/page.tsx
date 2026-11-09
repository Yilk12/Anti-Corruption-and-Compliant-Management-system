"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getCurrentUserPrimaryRole } from "@/app/lib/auth";
import { ClipboardList, Ticket, FileText, Truck, AlertTriangle, Shield, BookOpen, TrendingUp, Users, CheckCircle, Clock, UserCheck, Inbox } from "lucide-react";
import { apiGet } from "@/app/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// Helper function to check secret code before navigation
const checkSecretCodeAndNavigate = async (targetUrl: string, router: any) => {
  console.log('checkSecretCodeAndNavigate called for:', targetUrl);
  
  // Check if user has verified secret code in this session
  const sessionVerified = sessionStorage.getItem('secretCodeVerified');
  console.log('Session verified flag:', sessionVerified);
  
  if (sessionVerified === 'true') {
    // Already verified, proceed to target
    console.log('Already verified, proceeding to:', targetUrl);
    router.push(targetUrl);
    return;
  }

  // Not verified, check status and redirect to verify
  console.log('Not verified, checking secret code status...');
  try {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
    const response = await fetch('http://localhost:4000/api/secret-code/status', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const status = data.status;
      console.log('Secret code status:', status);

      if (status === 'NOT_CREATED' || status === 'RESET_REQUIRED') {
        sessionStorage.setItem('secretCodeRedirectUrl', targetUrl);
        console.log('Redirecting to create secret code');
        router.push('/secret-code/create-secret-code');
        return;
      } else if (status === 'VERIFICATION_REQUIRED') {
        sessionStorage.setItem('secretCodeRedirectUrl', targetUrl);
        console.log('Redirecting to verify secret code');
        router.push('/secret-code/verify');
        return;
      }
    }
  } catch (error) {
    console.error('Error checking secret code status:', error);
  }

  // Proceed if status check fails
  console.log('Status check failed, proceeding to:', targetUrl);
  router.push(targetUrl);
};

export default function EthicsAntiCorruptionDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  
  const [totalSubmissions, setTotalSubmissions] = useState<number | null>(null);
  const [complaintsCount, setComplaintsCount] = useState<number>(0);
  const [suggestionsCount, setSuggestionsCount] = useState<number | null>(null);
  const [complimentsCount, setComplimentsCount] = useState<number | null>(null);

  // Feedback stats from /feedback endpoint
  const [totalFeedback, setTotalFeedback] = useState<number | null>(null);
  const [feedbackComplaintsCount, setFeedbackComplaintsCount] = useState<number | null>(null);
  const [feedbackSuggestionsCount, setFeedbackSuggestionsCount] = useState<number | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const pageSize = 10;
  const [selectedFeedback, setSelectedFeedback] = useState<any | null>(null);
  const [additionalCounts, setAdditionalCounts] = useState({
    openTickets: 0,
    totalArticles: 0
  });

  // Ethics-specific statistics
  const [totalReports, setTotalReports] = useState<number>(0);
  const [pendingInvestigations, setPendingInvestigations] = useState<number>(0);
  const [underInvestigation, setUnderInvestigation] = useState<number>(0);
  const [resolvedCases, setResolvedCases] = useState<number>(0);
  const [receivedInvestigations, setReceivedInvestigations] = useState<number>(0);
  const [overdueCount, setOverdueCount] = useState<number>(0);
  const [loadingCounts, setLoadingCounts] = useState<boolean>(true);

  // Chart data
  const [complaintsByCategory, setComplaintsByCategory] = useState<any[]>([]);
  const [casesByStatus, setCasesByStatus] = useState<any[]>([]);
  const [complianceScore, setComplianceScore] = useState<number>(0);

  // Colors for pie chart
  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

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
    if (role !== "ethics_anti_corruption" && role !== "admin" && role !== "commissioner") {
      router.replace("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    async function loadCounts() {
      try {
        const token = getToken();
        const headers: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const res = await fetch(`${API_BASE}/api/submissions`, { headers });
        const data = await res.json().catch(() => []);
        const items: any[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any).items)
          ? (data as any).items
          : [];

        const normalized = items.map((s: any) =>
          typeof s?.type === "string" ? s.type.toUpperCase() : ""
        );

        const total = items.length;
        const complaints = normalized.filter((t) => t === "COMPLAINT").length;
        const suggestions = normalized.filter((t) => t === "SUGGESTION").length;
        const compliments = normalized.filter((t) => t === "COMPLIMENT").length;

        setTotalSubmissions(total);
        setComplaintsCount(complaints);
        setSuggestionsCount(suggestions);
        setComplimentsCount(compliments);
      } catch {
        setTotalSubmissions(0);
        setComplaintsCount(0);
        setSuggestionsCount(0);
        setComplimentsCount(0);
      }
    }

    loadCounts();
  }, []);

  // Load feedback-like stats from submissions (complaints/suggestions)
  useEffect(() => {
    async function loadFeedbackStats() {
      try {
        const token = getToken();
        const headers: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const res = await fetch(`${API_BASE}/api/submissions`, { headers });
        if (!res.ok) return;

        const data = await res.json().catch(() => []);
        const items: any[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any).items)
          ? (data as any).items
          : [];

        const normalized = items.map((s: any) =>
          typeof s?.type === "string" ? s.type.toUpperCase() : ""
        );

        const total = items.length;
        const complaints = normalized.filter((t) => t === "COMPLAINT").length;
        const suggestions = normalized.filter((t) => t === "SUGGESTION").length;

        setTotalFeedback(total);
        setFeedbackComplaintsCount(complaints);
        setFeedbackSuggestionsCount(suggestions);
        setFeedbackItems(items);
      } catch {
        // Ignore errors; dashboard still works without feedback stats
      }
    }

    loadFeedbackStats();
  }, []);

  // Fetch additional counts
  useEffect(() => {
    async function fetchAdditionalCounts() {
      setLoadingCounts(true);
      try {
        const token = getToken();
        const headers: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        // Fetch all reports
        const reportsRes = await fetch(`${API_BASE}/api/ethics/anticorruption/reports`, { headers });
        
        if (reportsRes.ok) {
          const reportsData = await reportsRes.json();
          const reports = Array.isArray(reportsData) ? reportsData : (reportsData.reports || []);
          
          // Filter out Closed and Approved status from total reports
          const activeReports = reports.filter((r: any) => 
            r.status !== 'Closed' && r.status !== 'Approved'
          );
          
          const pending = reports.filter((r: any) => r.status === 'Submitted').length;
          const underInvestigation = reports.filter((r: any) => r.status === 'Under Investigation').length;
          const resolved = reports.filter((r: any) => r.status === 'Resolved').length;
          
          // Calculate overdue count (reports submitted more than 7 days ago and still pending)
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const overdue = reports.filter((r: any) => {
            const createdAt = new Date(r.createdAt);
            return (r.status === 'Submitted' || r.status === 'Under Investigation') && createdAt < sevenDaysAgo;
          }).length;
          
          setTotalReports(activeReports.length);
          setPendingInvestigations(pending);
          setUnderInvestigation(underInvestigation);
          setResolvedCases(resolved);
          setReceivedInvestigations(underInvestigation); // Use under investigation count for received
          setOverdueCount(overdue);
        }

        // Fetch investigations for accurate closed cases count
        const invRes = await fetch(`${API_BASE}/api/ethics/investigations?bypassUserFilter=true`, { headers });
        if (invRes.ok) {
          const invData = await invRes.json();
          const investigations = Array.isArray(invData) ? invData : [];
          
          // Count closed cases (Closed, Approved, Under Review)
          const closedCasesCount = investigations.filter((inv: any) => 
            ['Closed', 'Approved', 'Under Review'].includes(inv.status)
          ).length;
          
          // Count under investigation
          const underInvCount = investigations.filter((inv: any) => 
            inv.status === 'Under Investigation'
          ).length;
          
          // Update counts to match investigations endpoint
          setResolvedCases(closedCasesCount);
          setUnderInvestigation(underInvCount);
        }

        // Fetch approved complaints count from feedback/complaints
        const complaintsRes = await fetch(`${API_BASE}/api/feedback/complaints?status=Closed`, { headers });
        let closedComplaintsCount = 0;
        if (complaintsRes.ok) {
          const complaintsData = await complaintsRes.json();
          const closedComplaints = Array.isArray(complaintsData) ? complaintsData : (complaintsData?.items || []);
          closedComplaintsCount = closedComplaints.length;
        }

        // Set total complaints count
        setComplaintsCount(closedComplaintsCount);
      } catch {
        setTotalReports(0);
        setPendingInvestigations(0);
        setUnderInvestigation(0);
        setResolvedCases(0);
        setReceivedInvestigations(0);
        setOverdueCount(0);
        setComplaintsCount(0);
      } finally {
        setLoadingCounts(false);
      }
    }

    fetchAdditionalCounts();
  }, []);

  const formatCount = (value: number | null) => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return "0";
    }
    return String(value);
  };

  // Export helpers (use all feedback items, not just current page)
  const sanitizeCell = (value: unknown) => {
    if (value == null) return "";
    return String(value).replace(/\s+/g, " ").trim();
  };

  const buildExportRows = () => {
    return feedbackItems.map((f, idx) => {
      const no = idx + 1;
      const date = f.createdAt ? new Date(f.createdAt).toLocaleString() : "-";
      const type = typeof f.type === "string" ? f.type : "";
      const message = String(f.message || "");
      return { no, date, type, message };
    });
  };

  const downloadFile = (content: string | Blob, filename: string, type: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (!feedbackItems.length) return;
    const rows = buildExportRows();
    const header = ["No", "Date", "Type", "Message"];
    const csvLines = [header.join(",")];
    for (const r of rows) {
      const line = [r.no, sanitizeCell(r.date), sanitizeCell(r.type), '"' + sanitizeCell(r.message).replace(/"/g, '""') + '"'];
      csvLines.push(line.join(","));
    }
    const csv = csvLines.join("\n");
    downloadFile(csv, "ethics-feedback.csv", "text/csv;charset=utf-8;");
  };

  const handleExportWord = () => {
    if (!feedbackItems.length) return;
    const rows = buildExportRows();
    const rowsHtml = rows
      .map(
        (r) =>
          `<tr><td>${r.no}</td><td>${sanitizeCell(r.date)}</td><td>${sanitizeCell(
            r.type,
          )}</td><td>${sanitizeCell(r.message)}</td></tr>`,
      )
      .join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ethics Feedback</title></head><body><h2>All Feedback</h2><table border="1" cellpadding="4" cellspacing="0"><thead><tr><th>No</th><th>Date</th><th>Type</th><th>Message</th></tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`;
    downloadFile(html, "ethics-feedback.doc", "application/msword");
  };

  const handleExportPdf = () => {
    if (typeof window === "undefined" || !feedbackItems.length) return;

    const rows = buildExportRows();
    const rowsHtml = rows
      .map(
        (r) =>
          `<tr><td>${r.no}</td><td>${sanitizeCell(r.date)}</td><td>${sanitizeCell(
            r.type,
          )}</td><td>${sanitizeCell(r.message)}</td></tr>`,
      )
      .join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ethics Feedback</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; padding: 16px; }
        h2 { margin-bottom: 12px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
        th { background: #f3f4f6; }
      </style>
    </head><body><h2>All Feedback</h2><table><thead><tr><th>No</th><th>Date</th><th>Type</th><th>Message</th></tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
  };

  // Paginated slice of feedback items
  const paginatedFeedbackItems = useMemo(() => {
    if (!Array.isArray(feedbackItems) || feedbackItems.length === 0) return [];
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return feedbackItems.slice(start, end);
  }, [feedbackItems, currentPage]);

  const totalPages = useMemo(() => {
    if (!Array.isArray(feedbackItems) || feedbackItems.length === 0) return 1;
    return Math.max(1, Math.ceil(feedbackItems.length / pageSize));
  }, [feedbackItems]);

  // Ensure currentPage stays in range when data changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // When a card is clicked, treat its items as "seen" for this session
  const clearAllCountsAndGo = () => {
    setTotalSubmissions(0);
    setComplaintsCount(0);
    setSuggestionsCount(0);
    setComplimentsCount(0);
    router.push("/voicebox");
  };

  const clearComplaintsAndGo = () => {
    setTotalSubmissions((prev) => {
      const p = typeof prev === "number" && !Number.isNaN(prev) ? prev : 0;
      const c = typeof complaintsCount === "number" && !Number.isNaN(complaintsCount) ? complaintsCount : 0;
      return Math.max(0, p - c);
    });
    setComplaintsCount(0);
    router.push("/voicebox?type=complaint");
  };

  const clearSuggestionsAndGo = () => {
    setTotalSubmissions((prev) => {
      const p = typeof prev === "number" && !Number.isNaN(prev) ? prev : 0;
      const c = typeof suggestionsCount === "number" && !Number.isNaN(suggestionsCount) ? suggestionsCount : 0;
      return Math.max(0, p - c);
    });
    setSuggestionsCount(0);
    router.push("/voicebox?type=suggestion");
  };

  const clearComplimentsAndGo = () => {
    setTotalSubmissions((prev) => {
      const p = typeof prev === "number" && !Number.isNaN(prev) ? prev : 0;
      const c = typeof complimentsCount === "number" && !Number.isNaN(complimentsCount) ? complimentsCount : 0;
      return Math.max(0, p - c);
    });
    setComplimentsCount(0);
    router.push("/voicebox?type=compliment");
  };

  const handlePrintSelectedFeedback = () => {
    if (typeof window === "undefined" || !selectedFeedback) return;

    const dateStr = selectedFeedback.createdAt
      ? new Date(selectedFeedback.createdAt).toLocaleString()
      : "-";
    const typeStr =
      typeof selectedFeedback.type === "string"
        ? selectedFeedback.type.toLowerCase()
        : "-";
    const messageStr = String(selectedFeedback.message || "");

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Feedback Details</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 14px; padding: 24px; }
        h2 { margin-bottom: 16px; }
        .label { font-weight: 600; }
        .value { margin-bottom: 8px; }
        .message { white-space: pre-wrap; margin-top: 8px; }
      </style>
    </head><body>
      <h2>Feedback Details</h2>
      <div class="value"><span class="label">Date: </span><span>${escapeHtml(dateStr)}</span></div>
      <div class="value"><span class="label">Type: </span><span>${escapeHtml(typeStr)}</span></div>
      <div class="value"><span class="label">Message:</span>
        <div class="message">${escapeHtml(messageStr)}</div>
      </div>
      <script>
        window.onload = function() { window.print(); };
      <\/script>
    </body></html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">
              Ethics &amp; Anti-Corruption
            </h1>
          </div>

          {/* Count Cards - 2x2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="/ethics/complaints" className="group block">
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 hover:border-blue-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">ጠቅላላ ጥቆማዎች</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {loadingCounts ? "..." : totalReports}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </a>

            <a href="/ethics/investigations" className="group block">
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 hover:border-blue-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">በምርመራ ላይ ያሉ ጥቆማዎች</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {loadingCounts ? "..." : underInvestigation}
                    </p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </a>

            <a href="/ethics/investigations?filter=closed" className="group block">
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 hover:border-blue-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">የታዩ ጥቆማዎች</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {loadingCounts ? "..." : resolvedCases}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
            </a>

            <a href="/ethics/anticorruption?filter=overdue" className="group block">
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 hover:border-blue-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">ሳይታይ ግዜዉ ያለፈ</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {loadingCounts ? "..." : overdueCount}
                    </p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>
            </a>
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
  isPercentage = false,
}: {
  title: string;
  value: number;
  loading: boolean;
  icon: any;
  color: string;
  href: string;
  description: string;
  isPercentage?: boolean;
}) {
  const router = useRouter();
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

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('DashboardCard clicked, href:', href);
    // Check if this is an ethics-related link
    if (href.includes('/ethics/')) {
      console.log('Ethics link detected, checking secret code');
      checkSecretCodeAndNavigate(href, router);
    } else {
      console.log('Non-ethics link, proceeding directly');
      router.push(href);
    }
  };

  return (
    <a href={href} onClick={handleClick} className="group block">
      <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 hover:border-blue-300">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-sm text-gray-600 mb-1">{title}</div>
            <div className="text-3xl font-bold text-gray-900">
              {loading ? "…" : isPercentage ? `${value}%` : value}
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
