"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useSecretCodeCheck } from "@/app/hooks/use-secret-code-check";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ClipboardList, Plus, Search, Filter, Download, Eye, UserCheck, X, Edit, Users } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import { readToken, getCurrentUserRoles } from "@/app/lib/auth";

interface Complaint {
  id: string;
  referenceNumber: string;
  category: string;
  status: string;
  priority: string;
  complainantName?: string;
  complainantPhone?: string;
  complainantDepartment?: string;
  complainantPosition?: string;
  subject?: string;
  institution?: string;
  department?: string;
  incidentDate?: string;
  createdAt: string;
  description: string;
  screeningNotes?: string;
  isDuplicate?: boolean;
  safetyRisk?: string;
  retaliationRisk?: string;
  confidentialityLevel?: string;
  documentsVerified?: boolean;
  isInternal?: boolean;
  creator?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    position?: string;
  };
}

const statusColors: Record<string, string> = {
  "Submitted": "bg-blue-100 text-blue-800",
  "Registered": "bg-green-100 text-green-800",
  "Triage": "bg-yellow-100 text-yellow-800",
  "Assigned": "bg-purple-100 text-purple-800",
  "Under Investigation": "bg-red-100 text-red-800",
  "Closed": "bg-gray-100 text-gray-800",
};

const priorityColors: Record<string, string> = {
  "Low": "bg-green-100 text-green-800",
  "High": "bg-orange-100 text-orange-800",
  "Urgent": "bg-red-100 text-red-800",
};

interface EthicsOfficer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position?: string;
}

export default function ComplaintsPage() {
  const router = useRouter();
  const pathname = usePathname();
  
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [ethicsOfficers, setEthicsOfficers] = useState<EthicsOfficer[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState<string>("");
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [complaintTypeFilter, setComplaintTypeFilter] = useState<"all" | "internal" | "external">("all");

  // Handle URL parameter for complaint type filter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');
    if (typeParam === 'internal') {
      setComplaintTypeFilter('internal');
    } else if (typeParam === 'external') {
      setComplaintTypeFilter('external');
    }
  }, []);

  useEffect(() => {
    const checkSecretCodeStatus = async () => {
      try {
        // Check if user has verified secret code in this session
        const sessionVerified = sessionStorage.getItem('secretCodeVerified');
        if (sessionVerified === 'true') {
          console.log('[Complaints] Secret code already verified in this session, skipping check');
          return true;
        }

        const token = readToken();
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
            sessionStorage.setItem('secretCodeRedirectUrl', '/ethics/anticorruption');
            router.push('/secret-code/create-secret-code');
            return false;
          } else if (status === 'VERIFICATION_REQUIRED') {
            // Store the current URL for redirect after verification
            sessionStorage.setItem('secretCodeRedirectUrl', '/ethics/anticorruption');
            router.push('/secret-code/verify');
            return false;
          }
          // If status is 'VERIFIED', proceed to fetch complaints
          return true;
        }
      } catch (error) {
        console.error('Error checking secret code status:', error);
      }
      return true; // Proceed if status check fails
    };

    const fetchComplaints = async () => {
      setLoading(true);
      try {
        const token = readToken();
        const response = await fetch('http://localhost:4000/api/ethics/anticorruption/reports', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch complaints');
        }
        const text = await response.text();
        console.log('[fetchComplaints] Response text:', text);
        const data = text ? JSON.parse(text) : [];
        setComplaints(data);
      } catch (error) {
        console.error('Error fetching complaints:', error);
        setComplaints([]);
      } finally {
        setLoading(false);
      }
    };

    // Get user roles from auth library
    const roles = getCurrentUserRoles();
    setUserRoles(roles);
    console.log('[ComplaintsPage] User roles from auth:', roles);

    // Check secret code status first
    checkSecretCodeStatus().then((canProceed) => {
      // Only fetch complaints if secret code check passed
      if (canProceed) {
        fetchComplaints();
      }
    });
  }, [router]);

  const fetchEthicsOfficers = async () => {
    try {
      const token = readToken();
      const response = await fetch('http://localhost:4000/api/users?role=Ethics_Officer', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch ethics officers');
      }
      const data = await response.json();
      console.log('[fetchEthicsOfficers] Response data:', data);
      // Handle paginated response with { users: [...], pagination: {...} }
      const officers = Array.isArray(data) ? data : (data?.users || []);
      setEthicsOfficers(officers);
    } catch (error) {
      console.error('Error fetching ethics officers:', error);
      setEthicsOfficers([]);
    }
  };

  const handleAssignClick = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setSelectedOfficer("");
    setShowAssignModal(true);
    fetchEthicsOfficers();
  };

  const handleAssign = async () => {
    if (!selectedComplaint || !selectedOfficer) return;

    try {
      const token = readToken();
      const response = await fetch(`http://localhost:4000/api/ethics/anticorruption/reports/${selectedComplaint.id}/assign-investigator`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assigneeId: selectedOfficer }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign investigator');
      }

      setShowAssignModal(false);
      // Refresh complaints list
      const complaintsResponse = await fetch('http://localhost:4000/api/ethics/anticorruption/reports', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (complaintsResponse.ok) {
        const data = await complaintsResponse.json();
        setComplaints(data);
      }
    } catch (error) {
      console.error('Error assigning investigator:', error);
    }
  };

  const filteredComplaints = complaints.filter((complaint) => {
    // Exclude complaints that are under investigation (they should appear on investigations page)
    if (complaint.status === "Under Investigation") {
      return false;
    }
    
    // Exclude closed complaints (they should appear on investigations page under closed tab)
    if (complaint.status === "Closed") {
      return false;
    }
    
    // Exclude approved complaints (they should appear on investigations page under closed tab)
    if (complaint.status === "Approved") {
      return false;
    }
    
    // Filter by complaint type (internal vs external)
    if (complaintTypeFilter !== "all") {
      if (complaintTypeFilter === "internal" && !complaint.isInternal) {
        return false;
      }
      if (complaintTypeFilter === "external" && complaint.isInternal) {
        return false;
      }
    }
    
    const matchesSearch =
      complaint.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (complaint.complainantName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || complaint.category === categoryFilter;
    const matchesPriority = priorityFilter === "all" || complaint.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Exporting complaints...");
  };

  const isEthicsAntiCorruption = () => {
    const result = userRoles.some(role =>
      role === 'ethics_anti_corruption'
    );
    console.log('[isEthicsAntiCorruption] userRoles:', userRoles, 'result:', result);
    return result;
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="w-full h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">የጥቆማ አስተዳደር</h1>
              <p className="text-gray-600 mt-1">Register, track, and manage misconduct reports</p>
            </div>
            <Button
              onClick={() => router.push("/ethics/anticorruption/new")}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              አዲስ ጥቆማ
            </Button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by reference, description, or complainant..."
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
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Registered">Registered</SelectItem>
                  <SelectItem value="Triage">Triage</SelectItem>
                  <SelectItem value="Assigned">Assigned</SelectItem>
                  <SelectItem value="Under Assessment">Under Assessment</SelectItem>
                  <SelectItem value="Under Investigation">Under Investigation</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Bribery">ጉቦ</SelectItem>
                  <SelectItem value="Fraud">ማጭበርበር</SelectItem>
                  <SelectItem value="Favoritism">ወገንተኝነት</SelectItem>
                  <SelectItem value="Abuse of Authority">ስልጣንን ያላግባብ መጠቀም</SelectItem>
                  <SelectItem value="Conflict of Interest">የጥቅም ግጭት</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
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

          {/* Complaints Table */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex-1">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading complaints...</div>
            ) : filteredComplaints.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No complaints found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ምድብ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ሁኔታ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        የጥቆማዉ ምንጭ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ጠቋሚ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ድርጊቱን የፈፀመዉ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        የስራ ክፍል
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ጉዳዩ የተፈፀመበት ቀን
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        እርምጃ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredComplaints.map((complaint) => (
                      <tr key={complaint.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {complaint.referenceNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {complaint.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={statusColors[complaint.status] || "bg-gray-100 text-gray-800"}>
                            {complaint.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={complaint.isInternal ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}>
                            {complaint.isInternal ? "የውስጥ ጥቆማዎች" : "የዉጭ ጥቆማዎች"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {complaint.complainantName || (complaint.creator && typeof complaint.creator === 'object' ? `${complaint.creator.firstName || ''} ${complaint.creator.lastName || ''}`.trim() || (complaint.creator.email || '') : "Anonymous")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {complaint.subject || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {complaint.department || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {complaint.incidentDate || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/ethics/anticorruption/${complaint.id}`)}
                              className="gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                            {isEthicsAntiCorruption() && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAssignClick(complaint)}
                                className="gap-1"
                              >
                                <UserCheck className="w-4 h-4" />
                                Assign
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Assign Investigator Modal */}
          {showAssignModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Assign Investigator</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAssignModal(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  ቅሬታን እንዲመረምር የስነ-ምግባር እና ፀረ-ሙስና ኦፊሰር መድቡ።{" "}
                  <span className="font-medium">{selectedComplaint?.referenceNumber}</span>
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      መርማሪ ምረጥ
                    </label>
                    <Select value={selectedOfficer} onValueChange={setSelectedOfficer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an ethics officer">
                          {selectedOfficer && (() => {
                            const officer = ethicsOfficers.find(o => o.id === selectedOfficer);
                            return officer ? `${officer.firstName} ${officer.lastName} - Ethics Officer` : '';
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {ethicsOfficers.map((officer) => (
                          <SelectItem key={officer.id} value={officer.id}>
                            {officer.firstName} {officer.lastName} - Ethics Officer
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowAssignModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAssign}
                      disabled={!selectedOfficer}
                    >
                      Assign
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
