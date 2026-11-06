"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUserRoles } from "@/app/lib/auth";
import { Ticket, FileText } from "lucide-react";
import { apiGet } from "@/app/lib/api";

interface GenderDisabilityStats {
  totalUsers: number;
  maleCount: number;
  femaleCount: number;
  disabledCount: number;
  nonDisabledCount: number;
}

interface DisabledUserDepartment {
  id: string;
  name: string;
  nameAm?: string | null;
}

interface DisabledUser {
  id: string;
  email: string;
  firstName: string;
  middleName: string;
  lastName: string;
  firstNameAm: string;
  middleNameAm: string;
  lastNameAm: string;
  phone: string;
  gender: "MALE" | "FEMALE";
  isDisabled: boolean;
  disabilityType: string | null;
  role: string;
  userType: string;
  department?: string | DisabledUserDepartment | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Report {
  id: string;
  typeOfMisconduct: string;
  dateTime: string;
  location: string;
  detailDescriptionOfIncident: string;
  reportedBefore: boolean;
  medicalHelpNeeded: boolean;
  fileUrl: string | null;
  createdAt: string;
  updatedAt: string;
  victimId: string | null;
  departmentId: string | null;
  userId: string | null;
}

interface DashboardStats {
  totalReports: number;
  disabledUserReports: number;
  maleReports: number;
  femaleReports: number;
  reportsByMonth: { month: string; count: number }[];
  reportsByType: { type: string; count: number }[];
}

export default function WomenSocialInclusionDeptHeadDashboardPage() {
  const router = useRouter();

  const [genderDisabilityStats, setGenderDisabilityStats] = useState<GenderDisabilityStats>({
    totalUsers: 0,
    maleCount: 0,
    femaleCount: 0,
    disabledCount: 0,
    nonDisabledCount: 0
  });
  const [disabledUsers, setDisabledUsers] = useState<DisabledUser[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    disabledUserReports: 0,
    maleReports: 0,
    femaleReports: 0,
    reportsByMonth: [],
    reportsByType: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expandedDisabilityType, setExpandedDisabilityType] = useState<string | null>(null);
  const [additionalCounts, setAdditionalCounts] = useState({
    openTickets: 0,
    totalArticles: 0
  });

  // Restrict access: only Women Social Inclusion role (or admin/department_head) can view this page.
  useEffect(() => {
    const roles = getCurrentUserRoles();
    const lower = roles.map(r => r.toLowerCase());
    const isAllowed =
      lower.includes("women_social_inclusion") ||
      lower.includes("admin") ||
      lower.includes("department_head");

    if (!isAllowed) {
      router.replace("/dashboard");
    }
  }, [router]);

  // Aggregate disability types from disabled users for display on the card
  const disabilityTypeSummary = (() => {
    if (!disabledUsers || disabledUsers.length === 0) return [] as { type: string; count: number }[];

    const counts: Record<string, number> = {};

    disabledUsers.forEach((user) => {
      if (!user || !user.disabilityType) return;
      const key = user.disabilityType;
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.entries(counts).map(([type, count]) => ({ type, count }));
  })();

  useEffect(() => {
    let active = true;

    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("accessToken") ||
              localStorage.getItem("jwt") ||
              localStorage.getItem("token")
            : null;

        const headers = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const [statsResponse, disabledUsersResponse, reportsResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/users/stats/gender-disability`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/users/disabled`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/submissions/women-social-inclusion`, { headers })
        ]);

        if (!statsResponse.ok) {
          throw new Error(`Failed to fetch gender-disability stats: ${statsResponse.status} ${statsResponse.statusText}`);
        }

        if (!disabledUsersResponse.ok) {
          throw new Error(`Failed to fetch disabled users: ${disabledUsersResponse.status} ${disabledUsersResponse.statusText}`);
        }

        if (!reportsResponse.ok) {
          throw new Error(`Failed to fetch reports: ${reportsResponse.status} ${reportsResponse.statusText}`);
        }

        const statsData = await statsResponse.json();
        const disabledUsersData = await disabledUsersResponse.json();
        const reportsData = await reportsResponse.json();

        console.log('Gender-Disability Stats:', statsData);
        console.log('Disabled Users:', disabledUsersData);
        console.log('Reports:', reportsData);

        if (active) {
          // Process gender-disability stats - handle different response formats
          let processedStats: GenderDisabilityStats = {
            totalUsers: 0,
            maleCount: 0,
            femaleCount: 0,
            disabledCount: 0,
            nonDisabledCount: 0
          };

          if (typeof statsData === 'object' && statsData !== null) {
            // Backend returns: { total, gender: { male, female }, disability: { disabled, normal } }

            // Total users
            if (typeof statsData.total === 'number') {
              processedStats.totalUsers = statsData.total;
            }

            // Gender counts
            const gender = (statsData as any).gender || {};
            if (typeof gender.male === 'number') {
              processedStats.maleCount = gender.male;
            }
            if (typeof gender.female === 'number') {
              processedStats.femaleCount = gender.female;
            }

            // Disability counts
            const disability = (statsData as any).disability || {};
            if (typeof disability.disabled === 'number') {
              processedStats.disabledCount = disability.disabled;
            }
            if (typeof disability.normal === 'number') {
              processedStats.nonDisabledCount = disability.normal;
            }
          }

          setGenderDisabilityStats(processedStats);

          // Extract disabled users array with proper validation
          let disabledUsersArray: DisabledUser[] = [];
          if (Array.isArray(disabledUsersData)) {
            disabledUsersArray = disabledUsersData;
          } else if (disabledUsersData && Array.isArray(disabledUsersData.users)) {
            disabledUsersArray = disabledUsersData.users;
          } else if (disabledUsersData && Array.isArray(disabledUsersData.data)) {
            disabledUsersArray = disabledUsersData.data;
          } else if (disabledUsersData && typeof disabledUsersData === 'object') {
            // If it's a single object, wrap it in an array
            disabledUsersArray = [disabledUsersData as DisabledUser];
          }

          // Extract reports array with proper validation
          let reportsArray: Report[] = [];
          if (Array.isArray(reportsData)) {
            reportsArray = reportsData;
          } else if (reportsData && Array.isArray(reportsData.data)) {
            reportsArray = reportsData.data;
          } else if (reportsData && Array.isArray(reportsData.reports)) {
            reportsArray = reportsData.reports;
          } else if (reportsData && Array.isArray(reportsData.submissions)) {
            reportsArray = reportsData.submissions;
          } else if (reportsData && typeof reportsData === 'object') {
            // If it's a single object, wrap it in an array
            reportsArray = [reportsData as Report];
          }

          // Ensure all array items are valid objects
          disabledUsersArray = disabledUsersArray.filter(user => 
            user && typeof user === 'object' && user.id
          );
          reportsArray = reportsArray.filter(report => 
            report && typeof report === 'object' && report.id
          );

          setDisabledUsers(disabledUsersArray);
          setReports(reportsArray);
          calculateReportStats(disabledUsersArray, reportsArray);
        }
        
      } catch (e: any) {
        if (active) {
          console.error('Error fetching data:', e);
          setError(e?.message || 'Failed to fetch data');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchData();

    return () => { 
      active = false; 
    };
  }, [selectedYear]);

  // Fetch additional counts
  useEffect(() => {
    async function fetchAdditionalCounts() {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("accessToken") ||
              localStorage.getItem("jwt") ||
              localStorage.getItem("token")
            : null;

        // Fetch open tickets
        const ticketsRes = await apiGet<any>('/tickets?status=IN_PROGRESS|PENDING')
        const ticketsCount = (ticketsRes as any)?.pagination?.total || ticketsRes?.total || (Array.isArray(ticketsRes?.tickets) ? ticketsRes.tickets.length : 0)
        
        // Fetch total articles
        const articlesRes = await apiGet<any>('/knowledge-base/articles?limit=1')
        const articlesCount = (articlesRes as any)?.pagination?.total || articlesRes?.total || (Array.isArray(articlesRes?.articles) ? articlesRes.articles.length : 0)
        
        setAdditionalCounts({
          openTickets: ticketsCount,
          totalArticles: articlesCount
        })
      } catch {
        setAdditionalCounts({
          openTickets: 0,
          totalArticles: 0
        })
      }
    }

    fetchAdditionalCounts();
  }, []);

  const calculateReportStats = (disabledUsersData: DisabledUser[], reportsData: Report[]) => {
    if (!Array.isArray(reportsData)) {
      console.log('Invalid reports data format');
      setStats({
        totalReports: 0,
        disabledUserReports: 0,
        maleReports: 0,
        femaleReports: 0,
        reportsByMonth: [],
        reportsByType: []
      });
      return;
    }

    // Filter reports for the selected year
    const yearReports = reportsData.filter(report => {
      try {
        return report && report.dateTime && new Date(report.dateTime).getFullYear() === selectedYear;
      } catch {
        return false;
      }
    });

    // Get disabled user IDs
    const disabledUserIds = disabledUsersData.map(user => user.id);

    // Filter reports by disabled users
    const disabledUserReports = yearReports.filter(report => 
      report.userId && disabledUserIds.includes(report.userId)
    );

    // Count reports by gender from disabled users
    let maleReportsCount = 0;
    let femaleReportsCount = 0;

    disabledUserReports.forEach(report => {
      if (report.userId) {
        const user = disabledUsersData.find(u => u.id === report.userId);
        if (user) {
          if (user.gender === "MALE") maleReportsCount++;
          if (user.gender === "FEMALE") femaleReportsCount++;
        }
      }
    });

    // Calculate reports by month
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const reportsByMonth = monthNames.map((month, index) => ({
      month,
      count: yearReports.filter(report => {
        try {
          return new Date(report.dateTime).getMonth() === index;
        } catch {
          return false;
        }
      }).length
    }));

    // Calculate reports by type
    const typeCounts: { [key: string]: number } = {};
    yearReports.forEach(report => {
      const type = report.typeOfMisconduct || 'Unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const reportsByType = Object.entries(typeCounts).map(([type, count]) => ({
      type,
      count
    }));

    setStats({
      totalReports: yearReports.length,
      disabledUserReports: disabledUserReports.length,
      maleReports: maleReportsCount,
      femaleReports: femaleReportsCount,
      reportsByMonth,
      reportsByType
    });
  };

  // Safe data access functions
  const getUserName = (userId: string | null): string => {
    if (!userId) return "Anonymous";
    const user = disabledUsers.find(u => u && u.id === userId);
    return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || "Unknown User" : "Unknown User";
  };

  const getGender = (userId: string | null): string => {
    if (!userId) return "N/A";
    const user = disabledUsers.find(u => u && u.id === userId);
    return user?.gender === 'MALE' ? 'ወንድ' : user?.gender === 'FEMALE' ? 'ሴት' : 'N/A';
  };

  const getDisabilityType = (userId: string | null): string => {
    if (!userId) return "N/A";
    const user = disabledUsers.find(u => u && u.id === userId);
    return user?.disabilityType || "N/A";
  };

  // Safe user data access for disabled users table
  const getSafeUserData = (user: DisabledUser) => {
    let departmentName = 'N/A';
    const dept = user?.department as unknown;

    if (typeof dept === 'string') {
      departmentName = dept || 'N/A';
    } else if (dept && typeof dept === 'object') {
      const d = dept as DisabledUserDepartment;
      departmentName = (d.nameAm || d.name) || 'N/A';
    }

    return {
      firstName: user?.firstName || 'N/A',
      lastName: user?.lastName || 'N/A',
      email: user?.email || 'N/A',
      gender: user?.gender === 'MALE' ? 'ወንድ' : user?.gender === 'FEMALE' ? 'ሴት' : 'N/A',
      disabilityType: user?.disabilityType || 'N/A',
      phone: user?.phone || 'N/A',
      department: departmentName,
    };
  };

  // Get reports from disabled users with safe filtering
  const disabledUserReports = Array.isArray(reports) 
    ? reports.filter(report => {
        if (!report || !report.userId) return false;
        return disabledUsers.some(user => user && user.id === report.userId);
      })
    : [];

  const refreshData = () => {
    setSelectedYear(prev => prev);
  };

  const buildReportSummary = () => {
    const totalDisabled = genderDisabilityStats.disabledCount;
    const totalUsers = genderDisabilityStats.totalUsers;
    const maleDisabled = disabledUsers.filter(u => u.gender === "MALE").length;
    const femaleDisabled = disabledUsers.filter(u => u.gender === "FEMALE").length;

    const lines: string[] = [];
    lines.push(`Women & Social Inclusion Dashboard Report - ${selectedYear}`);
    lines.push("");
    lines.push("Summary Cards");
    lines.push(`Total Reports,${stats.totalReports}`);
    lines.push(`Disabled User Reports,${stats.disabledUserReports}`);
    lines.push(`Male Reports,${stats.maleReports}`);
    lines.push(`Female Reports,${stats.femaleReports}`);
    lines.push("");
    lines.push("Users & Disability");
    lines.push(`Total Users,${totalUsers}`);
    lines.push(`Total Disabled Users,${totalDisabled}`);
    lines.push(`Disabled Males,${maleDisabled}`);
    lines.push(`Disabled Females,${femaleDisabled}`);
    lines.push("");
    lines.push("Reports By Month");
    lines.push("Month,Count");
    stats.reportsByMonth.forEach(m => {
      lines.push(`${m.month},${m.count}`);
    });
    lines.push("");
    lines.push("Reports By Type");
    lines.push("Type,Count");
    stats.reportsByType.forEach(t => {
      lines.push(`${t.type},${t.count}`);
    });
    lines.push("");
    lines.push("Disability Types");
    lines.push("Type,Count,PercentOfDisabled");
    disabilityTypeSummary.forEach((d) => {
      const percent = totalDisabled > 0 ? Math.round((d.count / totalDisabled) * 100) : 0;
      lines.push(`${d.type},${d.count},${percent}%`);
    });

    return { lines, totalDisabled, totalUsers, maleDisabled, femaleDisabled };
  };

  const handleExportExcel = () => {
    if (typeof window === "undefined") return;
    const { lines } = buildReportSummary();
    const csvContent = lines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `women_social_inclusion_report_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportWord = () => {
    if (typeof window === "undefined") return;
    const { totalDisabled, totalUsers, maleDisabled, femaleDisabled } = buildReportSummary();
    const disabledPercent = totalUsers > 0 ? Math.round((totalDisabled / totalUsers) * 100) : 0;

    const reportDate = new Date().toLocaleString();
    const monthlyRows = stats.reportsByMonth
      .map(m => `<tr><td>${m.month}</td><td>${m.count}</td></tr>`)
      .join("");
    const typeRows = stats.reportsByType
      .map(t => `<tr><td>${t.type}</td><td>${t.count}</td></tr>`)
      .join("");
    const disabilityTypeRows = disabilityTypeSummary
      .map(d => {
        const percent = totalDisabled > 0 ? Math.round((d.count / totalDisabled) * 100) : 0;
        return `<tr><td>${d.type}</td><td>${d.count}</td><td>${percent}%</td>`;
      })
      .join("");

    const html = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Women & Social Inclusion Dashboard Report</title>
        <style>
          body { font-family: Arial, sans-serif; }
          h1, h2 { margin-bottom: 4px; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 12px; }
          th, td { border: 1px solid #ccc; padding: 4px 8px; font-size: 12px; }
          th { background: #f3f4f6; }
        </style>
      </head>
      <body>
        <h1>Women & Social Inclusion Dashboard Report</h1>
        <p>Year: ${selectedYear}</p>
        <p>Generated at: ${reportDate}</p>

        <h2>Summary Cards</h2>
        <table>
          <tr><th>Metric</th><th>Value</th></tr>
          <tr><td>Total Reports</td><td>${stats.totalReports}</td></tr>
          <tr><td>Disabled User Reports</td><td>${stats.disabledUserReports}</td></tr>
          <tr><td>Male Reports</td><td>${stats.maleReports}</td></tr>
          <tr><td>Female Reports</td><td>${stats.femaleReports}</td></tr>
        </table>

        <h2>Users & Disability</h2>
        <table>
          <tr><th>Metric</th><th>Value</th></tr>
          <tr><td>Total Users</td><td>${totalUsers}</td></tr>
          <tr><td>Total Disabled Users</td><td>${totalDisabled}</td></tr>
          <tr><td>Disabled Males</td><td>${maleDisabled}</td></tr>
          <tr><td>Disabled Females</td><td>${femaleDisabled}</td></tr>
          <tr><td>Disabled Users (% of total)</td><td>${disabledPercent}%</td></tr>
        </table>

        <h2>Disability Types</h2>
        <table>
          <tr><th>Type</th><th>Count</th><th>% of Disabled</th></tr>
          ${disabilityTypeRows}
        </table>

        <h2>Reports By Month</h2>
        <table>
          <tr><th>Month</th><th>Count</th></tr>
          ${monthlyRows}
        </table>

        <h2>Reports By Type</h2>
        <table>
          <tr><th>Type</th><th>Count</th></tr>
          ${typeRows}
        </table>
      </body>
      </html>`;

    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `women_social_inclusion_report_${selectedYear}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    if (typeof window === "undefined") return;
    const { totalDisabled, totalUsers, maleDisabled, femaleDisabled } = buildReportSummary();
    const disabledPercent = totalUsers > 0 ? Math.round((totalDisabled / totalUsers) * 100) : 0;

    const reportDate = new Date().toLocaleString();
    const monthlyRows = stats.reportsByMonth
      .map(m => `<tr><td>${m.month}</td><td>${m.count}</td></tr>`)
      .join("");
    const typeRows = stats.reportsByType
      .map(t => `<tr><td>${t.type}</td><td>${t.count}</td></tr>`)
      .join("");
    const disabilityTypeRows = disabilityTypeSummary
      .map(d => {
        const percent = totalDisabled > 0 ? Math.round((d.count / totalDisabled) * 100) : 0;
        return `<tr><td>${d.type}</td><td>${d.count}</td><td>${percent}%</td>`;
      })
      .join("");

    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Women & Social Inclusion Dashboard Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; }
          h1, h2 { margin-bottom: 4px; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 12px; }
          th, td { border: 1px solid #ccc; padding: 4px 8px; font-size: 12px; }
          th { background: #f3f4f6; }
        </style>
      </head>
      <body>
        <h1>Women & Social Inclusion Dashboard Report</h1>
        <p>Year: ${selectedYear}</p>
        <p>Generated at: ${reportDate}</p>

        <h2>Summary Cards</h2>
        <table>
          <tr><th>Metric</th><th>Value</th></tr>
          <tr><td>Total Reports</td><td>${stats.totalReports}</td></tr>
          <tr><td>Disabled User Reports</td><td>${stats.disabledUserReports}</td></tr>
          <tr><td>Male Reports</td><td>${stats.maleReports}</td></tr>
          <tr><td>Female Reports</td><td>${stats.femaleReports}</td></tr>
        </table>

        <h2>Users & Disability</h2>
        <table>
          <tr><th>Metric</th><th>Value</th></tr>
          <tr><td>Total Users</td><td>${totalUsers}</td></tr>
          <tr><td>Total Disabled Users</td><td>${totalDisabled}</td></tr>
          <tr><td>Disabled Males</td><td>${maleDisabled}</td></tr>
          <tr><td>Disabled Females</td><td>${femaleDisabled}</td></tr>
          <tr><td>Disabled Users (% of total)</td><td>${disabledPercent}%</td></tr>
        </table>

        <h2>Disability Types</h2>
        <table>
          <tr><th>Type</th><th>Count</th><th>% of Disabled</th></tr>
          ${disabilityTypeRows}
        </table>

        <h2>Reports By Month</h2>
        <table>
          <tr><th>Month</th><th>Count</th></tr>
          ${monthlyRows}
        </table>

        <h2>Reports By Type</h2>
        <table>
          <tr><th>Type</th><th>Count</th></tr>
          ${typeRows}
        </table>
      </body>
      </html>`);

    win.document.close();
    win.focus();
    win.print();
  };

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading dashboard data...</div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">የሴቶች እና ማህበራዊ ጉዳዮች አክትቶ ትግበራ ስራ አስፈፃሚ</h2>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-red-800">መረጃ መጫን አልተሳካም</h3>
                  <p className="text-red-600 mt-2">{error}</p>
                  <p className="text-red-600 text-sm mt-1">
                    እባክዎ የመግቢያ ማረጋገጫዎን ያረጋግጡ እና እንደገና ይሞክሩ።
                  </p>
                </div>
                <button
                  onClick={refreshData}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  እንደገና ሞክሩ
                </button>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">የሴቶች እና ማህበራዊ ጉዳዮች አክትቶ ትግበራ ስራ አስፈፃሚ ገፅ</h2>
            <div className="flex items-center space-x-4">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                {[2023, 2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <button
                onClick={refreshData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
              </button>
              <select
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "word") handleExportWord();
                  if (value === "pdf") handleExportPdf();
                  if (value === "excel") handleExportExcel();
                  e.target.value = "";
                }}
                defaultValue=""
                className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
              >
                <option value="" disabled>
                  የሪፖርት አይነት ይምረጡ
                </option>
                <option value="word">Word</option>
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
              </select>
            </div>
          </div>

          {/* Report Statistics Cards (from user management stats) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total reports */}
            <Link href="/feedback/sexual-assault/identified">
              <div className="bg-white p-6 rounded-lg shadow-md border cursor-pointer">
                <h3 className="text-lg font-semibold text-gray-700">ጠቅላላ ጥቆማዎች</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.totalReports}</p>
                <p className="text-sm text-gray-500">ዓመት {selectedYear}</p>
              </div>
            </Link>

            {/* Total disabled users with hover tooltip for disability types */}
            <div className="bg-white p-6 rounded-lg shadow-md border relative group">
              <h3 className="text-lg font-semibold text-gray-700">ጠቅላላ የአካል ጉዳተኞች</h3>
              <p className="text-3xl font-bold text-green-600">{genderDisabilityStats.disabledCount}</p>
              <p className="text-sm text-gray-500">
                {genderDisabilityStats.totalUsers > 0
                  ? Math.round((genderDisabilityStats.disabledCount / genderDisabilityStats.totalUsers) * 100)
                  : 0}% አካል ጉዳተኞች
              </p>
              {disabilityTypeSummary.length > 0 && (
                <div className="pointer-events-none absolute inset-x-0 top-full mt-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="pointer-events-auto bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs text-gray-700">
                    <div className="font-semibold mb-1">የጉዳት አይነቶች</div>
                    <div className="space-y-2">
                      {disabilityTypeSummary.map((item) => {
                        const isExpanded = expandedDisabilityType === item.type;
                        const usersForType = disabledUsers.filter(
                          (user) => user.disabilityType === item.type
                        );

                        return (
                          <div key={item.type} className="space-y-1">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedDisabilityType(
                                  isExpanded ? null : item.type
                                )
                              }
                              className="w-full flex items-center justify-between gap-4 text-left hover:bg-gray-50 rounded px-2 py-1"
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isExpanded}
                                  readOnly
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>
                                  {item.type === "BLIND"
                                    ? "አይነ ስዉር"
                                    : item.type === "DEAF"
                                    ? "መስማት የተሳነዉ"
                                    : item.type ===
                                      "PHYSICAL_OR_MOVEMENT_DISORDER"
                                    ? "የአካል ወይም የእንቅስቃሴ ስነት"
                                    : item.type === "MENTAL_RETARDATION"
                                    ? "የአእምሮ እድገት ዉስንነት"
                                    : item.type === "OVERLAPPING_FACES"
                                    ? "ተደራራቢ ሰነት"
                                    : item.type ===
                                      "PSYCHOLOGICAL_AND_SOCIAL_DISORDER"
                                    ? "የስነ-ልቦና እና ማህበራዊ ስነት"
                                    : item.type}
                                </span>
                              </div>
                              <span className="font-medium text-gray-800">
                                {item.count}
                              </span>
                            </button>

                            {isExpanded && usersForType.length > 0 && (
                              <div className="ml-6 mt-1 space-y-1 text-xs text-gray-700">
                                {usersForType.map((user) => (
                                  <div
                                    key={user.id}
                                    className="flex justify-between gap-2 border-l border-gray-200 pl-2"
                                  >
                                    <span>
                                      {user.firstName} {user.lastName}
                                    </span>
                                    <span className="text-gray-500">
                                      {user.gender === "MALE" ? "ወንድ" : "ሴት"}
                                    </span>
                                  </div>
                                ))}
                                {usersForType.length === 0 && (
                                  <div className="text-gray-400">
                                    ምንም ተጠቃሚ አልተገኘም።
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Male users */}
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <h3 className="text-lg font-semibold text-gray-700">ወንድ</h3>
              <p className="text-3xl font-bold text-purple-600">{genderDisabilityStats.maleCount}</p>
              <p className="text-sm text-gray-500">
                {genderDisabilityStats.totalUsers > 0
                  ? Math.round((genderDisabilityStats.maleCount / genderDisabilityStats.totalUsers) * 100)
                  : 0}% ወንዶች
              </p>
            </div>

            {/* Female users */}
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <h3 className="text-lg font-semibold text-gray-700">ሴት</h3>
              <p className="text-3xl font-bold text-pink-600">{genderDisabilityStats.femaleCount}</p>
              <p className="text-sm text-gray-500">
                {genderDisabilityStats.totalUsers > 0
                  ? Math.round((genderDisabilityStats.femaleCount / genderDisabilityStats.totalUsers) * 100)
                  : 0}% ሴቶች
              </p>
            </div>
          </div>

          {/* Additional Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <DashboardCard
              title="Open Tickets"
              value={additionalCounts.openTickets}
              loading={false}
              icon={Ticket}
              color="blue"
              href="/tickets"
              description="View open support tickets"
            />
            <DashboardCard
              title="Total Articles"
              value={additionalCounts.totalArticles}
              loading={false}
              icon={FileText}
              color="pink"
              href="/knowledge-base"
              description="View knowledge base articles"
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            {/* Gender Distribution Chart */}
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <h3 className="text-lg font-semibold mb-4">ጠቅላላ የአካል ጉዳተኞች በፆታ ስርጭት</h3>
              <div className="flex items-center justify-center h-64">
                {disabledUsers.length > 0 ? (
                  (() => {
                    const maleCount = disabledUsers.filter((u) => u.gender === "MALE").length;
                    const femaleCount = disabledUsers.filter((u) => u.gender === "FEMALE").length;
                    const total = maleCount + femaleCount || 1;
                    const femaleRatio = femaleCount / total;
                    const maleRatio = maleCount / total;
                    return (
                      <div className="relative w-48 h-48">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{total}</div>
                            <div className="text-sm text-gray-500">ጠቅላላ</div>
                          </div>
                        </div>
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          {/* Female segment */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke="#ec4899"
                            strokeWidth="20"
                            strokeDasharray={`${femaleRatio * 251.2} 251.2`}
                            transform="rotate(-90 50 50)"
                          />
                          {/* Male segment */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke="#8b5cf6"
                            strokeWidth="20"
                            strokeDasharray={`${maleRatio * 251.2} 251.2`}
                            strokeDashoffset={-femaleRatio * 251.2}
                            transform="rotate(-90 50 50)"
                          />
                        </svg>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-gray-500">ምንም የጾታ መረጃ የለም</div>
                )}
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-pink-500 rounded mr-2"></div>
                  <span>ሴት: {disabledUsers.filter((u) => u.gender === "FEMALE").length}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-purple-500 rounded mr-2"></div>
                  <span>ወንድ: {disabledUsers.filter((u) => u.gender === "MALE").length}</span>
                </div>
              </div>
            </div>
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