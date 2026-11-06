"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, MessageSquare, Clock, CheckCircle, AlertCircle, Filter } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { useSecretCodeCheck } from "@/app/hooks/use-secret-code-check";

interface Complaint {
  id: string;
  referenceNumber: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  complainantName?: string;
  complainantEmail?: string;
  messages: any[];
}

export default function DepartmentInboxPage() {
  const router = useRouter();
  
  // Check secret code status
  useSecretCodeCheck('/ethics/complaints/inbox');
  
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchInbox();
  }, [statusFilter]);

  const fetchInbox = async () => {
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      const url = statusFilter === "all" 
        ? 'http://localhost:4000/api/ethics/department/complaints/inbox'
        : `http://localhost:4000/api/ethics/department/complaints/inbox?status=${statusFilter}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setComplaints(data);
      }
    } catch (error) {
      console.error('Error fetching inbox:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Submitted': 'bg-blue-500',
      'Registered': 'bg-purple-500',
      'Under Assessment': 'bg-yellow-500',
      'Awaiting Approval': 'bg-orange-500',
      'Assigned': 'bg-indigo-500',
      'Under Investigation': 'bg-cyan-500',
      'Report Submitted': 'bg-teal-500',
      'Under Review': 'bg-pink-500',
      'Returned for Further Investigation': 'bg-red-500',
      'Pending Decision': 'bg-amber-500',
      'Referred': 'bg-lime-500',
      'Closed': 'bg-green-500',
      'Reopened': 'bg-violet-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'Low': 'bg-green-500',
      'High': 'bg-orange-500',
      'Urgent': 'bg-red-500',
    };
    return colors[priority] || 'bg-gray-500';
  };

  const hasUnreadMessages = (complaint: Complaint) => {
    return complaint.messages && complaint.messages.length > 0 && complaint.messages[0].readAt === null;
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Department Inbox</h1>
                <p className="text-gray-600">Feedback and Complaint Management Department</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Registered">Registered</SelectItem>
                  <SelectItem value="Under Assessment">Under Assessment</SelectItem>
                  <SelectItem value="Awaiting Approval">Awaiting Approval</SelectItem>
                  <SelectItem value="Assigned">Assigned</SelectItem>
                  <SelectItem value="Under Investigation">Under Investigation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading inbox...</p>
            </div>
          ) : complaints.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No complaints found</h3>
                <p className="text-gray-600">There are no complaints in the inbox.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <Card
                  key={complaint.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/ethics/anticorruption/${complaint.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-mono text-gray-600">{complaint.referenceNumber}</span>
                          <Badge className={getStatusColor(complaint.status)}>{complaint.status}</Badge>
                          <Badge className={getPriorityColor(complaint.priority)}>{complaint.priority}</Badge>
                        </div>
                        <CardTitle className="text-lg">{complaint.subject}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {complaint.complainantName
                            ? complaint.complainantName
                            : complaint.creator && typeof complaint.creator === 'object'
                            ? `${complaint.creator.firstName || ''} ${complaint.creator.lastName || ''}`.trim() || (complaint.creator.email || '')
                            : 'Anonymous'}
                        </p>
                      </div>
                      {hasUnreadMessages(complaint) && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <MessageSquare className="h-4 w-4" />
                          <span className="text-sm font-medium">New message</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 line-clamp-2 mb-3">{complaint.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{complaint.messages?.length || 0} messages</span>
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
