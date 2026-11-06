"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useSecretCodeCheck } from "@/app/hooks/use-secret-code-check";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, Filter, Eye, ArrowLeft, FileText, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";

export const dynamic = 'force-dynamic';

interface Complaint {
  id: string;
  referenceNumber: string;
  trackingId?: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  complainantName?: string;
  isAnonymous: boolean;
  departmentId?: string;
  departmentName?: string;
  department?: {
    id: string;
    name: string;
    nameAm?: string;
  };
  isInternal: boolean;
  departmentalResponse?: any;
}

export default function FeedbackComplaintsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedDepartmentId = searchParams.get('departmentId');
  const filterType = searchParams.get('filter'); // 'internal' or 'external'
  useSecretCodeCheck('/feedback/complaints/list');

  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      const response = await fetch('http://localhost:4000/api/feedback/complaints', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch complaints');
      }

      const data = await response.json();
      setComplaints(data.data || data || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsViewed = async (complaintId: string) => {
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      await fetch(`http://localhost:4000/api/feedback/complaints/${complaintId}/mark-viewed`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error marking complaint as viewed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    return 'bg-red-100 text-red-800';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low':
        return 'bg-green-100 text-green-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCardBackgroundColor = (complaint: Complaint) => {
    // If assigned to a department, use yellow background
    if (complaint.departmentId || complaint.status === 'Assigned') {
      return 'bg-yellow-100 border-yellow-300';
    }
    // Otherwise, use red background for new/unassigned complaints
    return 'bg-red-100 border-red-300';
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    // Filter by internal/external type (from dropdown or URL)
    const effectiveTypeFilter = filterType || typeFilter;
    if (effectiveTypeFilter === 'internal' && !complaint.isInternal) {
      return false;
    }
    if (effectiveTypeFilter === 'external' && complaint.isInternal) {
      return false;
    }
    
    // Filter by department response
    if (effectiveTypeFilter === 'department-response') {
      if (!complaint.departmentalResponse) {
        return false;
      }
    }

    // Filter by administrative complaints
    if (effectiveTypeFilter === 'administrative') {
      if (complaint.category !== 'Administrative Complaints' &&
          complaint.category !== 'አስተዳደራዊ ጥቆማ' &&
          complaint.category !== 'አስተዳደራዊ ቅሬታ') {
        return false;
      }
    }

    // If a specific department is selected, filter by that department
    if (selectedDepartmentId) {
      if (complaint.departmentId !== selectedDepartmentId) {
        return false;
      }
    }
    
    const matchesSearch = searchTerm === "" || 
      complaint.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || complaint.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-8">
            <Button variant="ghost" onClick={() => router.push("/dashboard/feedback-complaint-manager")} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search complaints..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-45">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="internal">የውስጥ ቅሬታዎች</SelectItem>
                    <SelectItem value="external">የዉጭ ቅሬታዎች</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-45">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Submitted">Submitted</SelectItem>
                    <SelectItem value="Registered">Registered</SelectItem>
                    <SelectItem value="Under Assessment">Under Assessment</SelectItem>
                    <SelectItem value="Awaiting Approval">Awaiting Approval</SelectItem>
                    <SelectItem value="Assigned">Assigned</SelectItem>
                    <SelectItem value="Under Investigation">Under Investigation</SelectItem>
                    <SelectItem value="Report Submitted">Report Submitted</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-45">
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Complaints List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Loading complaints...</p>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No complaints found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                    ? "No complaints match your search criteria."
                    : "No feedback complaints have been submitted yet."}
                </p>
                <Button onClick={() => router.push("/feedback/complaints/new")}>
                  Submit New Complaint
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredComplaints.map((complaint) => (
                <Card
                  key={complaint.id}
                  className={`cursor-pointer hover:shadow-lg transition-shadow ${getCardBackgroundColor(complaint)}`}
                  onClick={async () => {
                    await markAsViewed(complaint.id);
                    router.push(`/feedback/complaints/${complaint.id}`);
                  }}
                >
                  <CardContent className="p-6 text-center">
                    <p className="text-lg font-semibold text-gray-900">
                      {complaint.trackingId || complaint.referenceNumber || complaint.id}
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      Submitted: {formatDate(complaint.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
