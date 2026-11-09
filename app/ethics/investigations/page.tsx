"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, Filter, Download, Eye, Plus, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import { readToken, getCurrentUserRoles, getCurrentUserId } from "@/app/lib/auth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";

interface Investigation {
  id: string;
  caseNumber: string;
  complaintId: string;
  complaintReference: string;
  category: string;
  status: string;
  priority: string;
  assignedInvestigator?: string | { id: string; firstName: string; lastName: string; email: string };
  assignedSupervisor?: string;
  startDate: string;
  targetCompletionDate: string;
  actualCompletionDate?: string;
  findings?: string;
  recommendation?: string;
  decision?: string;
  outcome?: string;
}

const statusColors: Record<string, string> = {
  "Under Investigation": "bg-orange-100 text-orange-800",
  "Report Submitted": "bg-yellow-100 text-yellow-800",
  "Under Review": "bg-indigo-100 text-indigo-800",
  "Returned for Further Investigation": "bg-red-100 text-red-800",
  "Pending Decision": "bg-purple-100 text-purple-800",
  "Referred": "bg-teal-100 text-teal-800",
  "Closed": "bg-gray-100 text-gray-800",
  "Reopened": "bg-pink-100 text-pink-800",
};

const priorityColors: Record<string, string> = {
  "Low": "bg-green-100 text-green-800",
  "High": "bg-orange-100 text-orange-800",
  "Urgent": "bg-red-100 text-red-800",
};

export default function InvestigationsPage() {
  const router = useRouter();
  
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    // Check URL parameters for filter
    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get('filter');
    
    if (filterParam === 'closed') {
      setStatusFilter('Closed');
      setActiveTab('closed');
    }

    const checkSecretCodeStatus = async () => {
      try {
        // Check if user has verified secret code in this session
        const sessionVerified = sessionStorage.getItem('secretCodeVerified');
        if (sessionVerified === 'true') {
          console.log('[Investigations] Secret code already verified in this session, skipping check');
          return true;
        }

        const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
        const response = await fetch('http://localhost:4000/api/secret-code/status', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          const status = data.status;
          
          if (status === 'NOT_CREATED' || status === 'RESET_REQUIRED') {
            // Store the current URL for redirect after secret code creation
            sessionStorage.setItem('secretCodeRedirectUrl', '/ethics/investigations');
            router.push('/secret-code/create-secret-code');
            return false;
          } else if (status === 'VERIFICATION_REQUIRED') {
            // Store the current URL for redirect after verification
            sessionStorage.setItem('secretCodeRedirectUrl', '/ethics/investigations');
            router.push('/secret-code/verify');
            return false;
          }
          // If status is 'VERIFIED', proceed to fetch investigations
          return true;
        }
      } catch (error) {
        console.error('Error checking secret code status:', error);
      }
      return true; // Proceed if status check fails
    };

    const fetchInvestigations = async () => {
      try {
        const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await fetch('http://localhost:4000/api/ethics/investigations?bypassUserFilter=true', { headers });
        if (!response.ok) {
          throw new Error('Failed to fetch investigations');
        }
        const data = await response.json();
        console.log('[Fetched Investigations]', data);
        console.log('[Investigation Statuses]', data.map((inv: any) => ({ caseNumber: inv.caseNumber, status: inv.status })));
        setInvestigations(data);
      } catch (error) {
        console.error('Error fetching investigations:', error);
        setInvestigations([]);
      } finally {
        setLoading(false);
      }
    };

    // Check secret code status first
    checkSecretCodeStatus().then((canProceed) => {
      // Only fetch investigations if secret code check passed
      if (canProceed) {
        fetchInvestigations();
      }
    });
  }, [router]);

  const filteredInvestigations = investigations.filter((investigation) => {
    const investigatorName = typeof investigation.assignedInvestigator === 'string'
      ? investigation.assignedInvestigator
      : investigation.assignedInvestigator
        ? `${investigation.assignedInvestigator.firstName} ${investigation.assignedInvestigator.lastName}`
        : '';

    const matchesSearch =
      investigation.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investigation.complaintReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investigatorName.toLowerCase().includes(searchTerm.toLowerCase());

    // When closed tab is active, allow Closed, Approved, and Under Review statuses
    const matchesStatus = activeTab === "closed" 
      ? ["Closed", "Approved", "Under Review"].includes(investigation.status)
      : (statusFilter === "all" || investigation.status === statusFilter);
    
    const matchesCategory = categoryFilter === "all" || investigation.category === categoryFilter;
    const matchesPriority = priorityFilter === "all" || investigation.priority === priorityFilter;

    // Exclude Closed, Under Review, and Approved investigations from the main list
    // They should only appear if explicitly filtered via tab or status filter
    const excludeStatuses = ["Closed", "Under Review", "Approved"];
    const isExcluded = excludeStatuses.includes(investigation.status) && 
                      statusFilter === "all" && 
                      activeTab !== "closed";

    // Tab filtering
    let matchesTab = true;
    if (activeTab === "active") {
      matchesTab = ["Under Investigation", "Report Submitted", "Returned for Further Investigation", "Pending Decision"].includes(investigation.status);
    } else if (activeTab === "overdue") {
      const targetDate = new Date(investigation.targetCompletionDate);
      matchesTab = targetDate < new Date() && !investigation.actualCompletionDate;
    } else if (activeTab === "closed") {
      matchesTab = ["Closed", "Approved", "Under Review"].includes(investigation.status);
    }

    const result = matchesSearch && matchesStatus && matchesCategory && matchesPriority && matchesTab && !isExcluded;
    
    // Console log for debugging
    if (activeTab === "closed") {
      console.log('[Filtered Investigation]', {
        caseNumber: investigation.caseNumber,
        status: investigation.status,
        matchesSearch,
        matchesStatus,
        matchesCategory,
        matchesPriority,
        matchesTab,
        isExcluded,
        result
      });
    }

    return result;
  });

  // Console log for debugging filtered results
  console.log('[Filter Debug]', {
    activeTab,
    statusFilter,
    totalInvestigations: investigations.length,
    filteredCount: filteredInvestigations.length,
    closedCount: investigations.filter((i) => i.status === 'Closed').length,
    approvedCount: investigations.filter((i) => i.status === 'Approved').length
  });

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Exporting investigations...");
  };

  const isOverdue = (investigation: Investigation) => {
    if (investigation.actualCompletionDate) return false;
    const targetDate = new Date(investigation.targetCompletionDate);
    return targetDate < new Date();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {statusFilter === 'Closed' ? 'Closed Cases' : 'Cases & Investigations'}
              </h1>
              <p className="text-gray-600 mt-1">
                {statusFilter === 'Closed' ? 'View all closed investigation cases' : 'Manage investigation lifecycle from assessment to closure'}
              </p>
            </div>
            {statusFilter !== 'Closed' && (
              <Button
                onClick={() => router.push("/ethics/investigations/new")}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                New Case
              </Button>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Cases</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="overdue">
                Overdue
                {investigations.filter((i) => isOverdue(i)).length > 0 && (
                  <Badge className="ml-2 bg-red-500">
                    {investigations.filter((i) => isOverdue(i)).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="closed">የታዩ ጥቆማዎች / Closed</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by case number, reference, or investigator..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Under Investigation">Under Investigation</SelectItem>
                  <SelectItem value="Report Submitted">Report Submitted</SelectItem>
                  <SelectItem value="Under Review">Under Review</SelectItem>
                  <SelectItem value="Returned for Further Investigation">Returned for Further Investigation</SelectItem>
                  <SelectItem value="Pending Decision">Pending Decision</SelectItem>
                  <SelectItem value="Referred">Referred</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Bribery">Bribery</SelectItem>
                  <SelectItem value="Fraud">Fraud</SelectItem>
                  <SelectItem value="Favoritism">Favoritism</SelectItem>
                  <SelectItem value="Abuse of Authority">Abuse of Authority</SelectItem>
                  <SelectItem value="Conflict of Interest">Conflict of Interest</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleExport} className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Investigations Table */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading investigations...</div>
            ) : filteredInvestigations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No investigations found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Case Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Complaint Ref
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Investigator
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Start Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Target Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredInvestigations.map((investigation) => (
                      <tr key={investigation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {investigation.caseNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {investigation.complaintReference}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {investigation.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Badge className={statusColors[investigation.status] || "bg-gray-100 text-gray-800"}>
                              {investigation.status}
                            </Badge>
                            {isOverdue(investigation) && (
                              <Clock className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={priorityColors[investigation.priority] || "bg-gray-100 text-gray-800"}>
                            {investigation.priority}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {typeof investigation.assignedInvestigator === 'string'
                            ? investigation.assignedInvestigator || "-"
                            : investigation.assignedInvestigator
                              ? `${investigation.assignedInvestigator.firstName} ${investigation.assignedInvestigator.lastName}`
                              : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatDate(investigation.startDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatDate(investigation.targetCompletionDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/ethics/investigations/${investigation.id}`)}
                            className="gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
