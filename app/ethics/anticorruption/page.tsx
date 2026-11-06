"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useSecretCodeCheck } from "@/app/hooks/use-secret-code-check";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Shield, Search, Filter, Plus, Eye, CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";

interface Report {
  id: string;
  category: string;
  subject?: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  complainantName?: string;
  isAnonymous: boolean;
  department?: string;
  person?: string;
}

export default function AntiCorruptionReportsPage() {
  const router = useRouter();
  useSecretCodeCheck('/ethics/anticorruption');

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      const response = await fetch('http://localhost:4000/api/ethics/anticorruption/reports', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data.data || data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'UNDER_INVESTIGATION':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = searchTerm === "" || 
      (report.subject && report.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.department && report.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.person && report.person.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || report.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Ethics and Anti-Corruption Reports</h1>
            <p className="text-gray-600">View and manage ethics and anti-corruption reports</p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search reports..."
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
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="UNDER_INVESTIGATION">Under Investigation</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-45">
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => router.push("/guest-anticorruption")}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Report
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Loading reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No reports found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                    ? "No reports match your search criteria."
                    : "No ethics and anti-corruption reports have been submitted yet."}
                </p>
                <Button onClick={() => router.push("/guest-anticorruption")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Submit New Report
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredReports.map((report) => (
                <Card
                  key={report.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/ethics/anticorruption/${report.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(report.status)}>
                            {report.status.replace(/_/g, ' ')}
                          </Badge>
                          <Badge className={getPriorityColor(report.priority)}>
                            {report.priority}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg mb-1">{report.subject || report.category}</CardTitle>
                        <p className="text-sm text-gray-600">{report.category}</p>
                        {(report.department || report.person) && (
                          <div className="text-sm text-gray-500 mt-1">
                            {report.department && <span>ጥቆማ የሚሰጥበት የስራ ክፍል: {report.department}</span>}
                            {report.department && report.person && <span> | </span>}
                            {report.person && <span>ጥቆማ የተደረገበት አካል: {report.person}</span>}
                          </div>
                        )}
                      </div>
                      <Eye className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {report.description}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div>
                        {report.isAnonymous ? (
                          <span className="flex items-center gap-1">
                            <Shield className="h-4 w-4" />
                            Anonymous
                          </span>
                        ) : (
                          <span>{report.complainantName}</span>
                        )}
                      </div>
                      <div>
                        {new Date(report.createdAt).toLocaleDateString()}
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
