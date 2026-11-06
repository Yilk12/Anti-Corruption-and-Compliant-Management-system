"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useSecretCodeCheck } from "@/app/hooks/use-secret-code-check";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, Filter, Eye, ArrowLeft, FileText, AlertTriangle, CheckCircle, Clock, Globe } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";

interface Complaint {
  id: string;
  referenceNumber: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  complainantName?: string;
  departmentName?: string;
  department?: {
    id: string;
    name: string;
    nameAm?: string;
  };
  isAnonymous: boolean;
  isInternal: boolean;
}

export default function ExternalComplaintsPage() {
  const router = useRouter();
  useSecretCodeCheck('/feedback/complaints/external');

  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

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
      const allComplaints = data.data || data || [];
      // Filter for external complaints only (guest complaints)
      const externalComplaints = allComplaints.filter((c: any) => c.isInternal === false);
      setComplaints(externalComplaints);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Submitted':
        return 'bg-blue-100 text-blue-800';
      case 'Registered':
        return 'bg-green-100 text-green-800';
      case 'Under Assessment':
        return 'bg-yellow-100 text-yellow-800';
      case 'Awaiting Approval':
        return 'bg-purple-100 text-purple-800';
      case 'Assigned':
        return 'bg-indigo-100 text-indigo-800';
      case 'Under Investigation':
        return 'bg-orange-100 text-orange-800';
      case 'Report Submitted':
        return 'bg-teal-100 text-teal-800';
      case 'Under Review':
        return 'bg-cyan-100 text-cyan-800';
      case 'Returned for Further Investigation':
        return 'bg-red-100 text-red-800';
      case 'Pending Decision':
        return 'bg-pink-100 text-pink-800';
      case 'Referred':
        return 'bg-amber-100 text-amber-800';
      case 'Closed':
        return 'bg-slate-100 text-slate-800';
      case 'Reopened':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  const filteredComplaints = complaints.filter(complaint => {
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
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">የዉጭ ቅሬታዎች</h1>
            <p className="text-gray-600">Guest complaints from external visitors</p>
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
                    <SelectItem value="Medium">Medium</SelectItem>
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
                <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No external complaints found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                    ? "No complaints match your search criteria."
                    : "No guest complaints have been submitted yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredComplaints.map((complaint) => (
                <Card
                  key={complaint.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/feedback/complaints/${complaint.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(complaint.status)}>
                            {complaint.status}
                          </Badge>
                          <Badge className={getPriorityColor(complaint.priority)}>
                            {complaint.priority}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg mb-1">{complaint.subject || "No Subject"}</CardTitle>
                        <p className="text-sm text-gray-600">{complaint.referenceNumber}</p>
                        <p className="text-sm text-gray-500">{complaint.category}</p>
                      </div>
                      <Eye className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {complaint.description}
                    </p>
                    <div className="space-y-2 mb-3">
                      {complaint.department && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Department:</span> {complaint.department.nameAm || complaint.department.name}
                        </div>
                      )}
                      {complaint.complainantName && !complaint.isAnonymous && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Employee:</span> {complaint.complainantName}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div>
                        {complaint.isAnonymous ? (
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" />
                            Anonymous
                          </span>
                        ) : (
                          <span>{complaint.complainantName || "Guest"}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </div>
                    </div>
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
