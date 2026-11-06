"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { ArrowLeft, Send, User, Calendar, Shield, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useSecretCodeCheck } from "@/app/hooks/use-secret-code-check";

interface Message {
  id: string;
  message: string;
  senderId: string;
  senderRole: string;
  senderType: string;
  createdAt: string;
}

interface Report {
  id: string;
  trackingId: string;
  category: string;
  subject?: string;
  description: string;
  status: string;
  priority: string;
  isAnonymous: boolean;
  complainantName?: string;
  complainantEmail?: string;
  complainantPhone?: string;
  complainantDepartment?: string;
  complainantPosition?: string;
  incidentDate?: string;
  incidentLocation?: string;
  createdAt: string;
  department?: string;
  person?: string;
  messages?: Message[];
  investigation?: {
    id: string;
    caseNumber: string;
    status: string;
    outcome?: string;
    decision?: string;
    decisionDate?: string;
    closureReason?: string;
    correctiveAction?: string;
    assignedInvestigator?: {
      firstName: string;
      lastName: string;
    };
  };
}

export default function AntiCorruptionReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<Report | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  useSecretCodeCheck('/ethics/anticorruption');

  useEffect(() => {
    fetchReportDetails();
  }, [reportId]);

  const fetchReportDetails = async () => {
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      const response = await fetch(`http://localhost:4000/api/ethics/anticorruption/reports/${reportId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch report details');
      }

      const data = await response.json();
      setReport(data);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching report details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !report) return;

    setSendingMessage(true);
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      const res = await fetch(`http://localhost:4000/api/ethics/anticorruption/reports/${report.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: newMessage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages([...messages, data]);
        setNewMessage("");
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingMessage(false);
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

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="p-6">
            <div className="text-center py-12">Loading...</div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (!report) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="p-6">
            <Button onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="text-center py-12 text-red-600">Report not found</div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6">
          <Button onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reports
          </Button>

          <div className="space-y-6">
            {/* Report Information */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{report.subject || report.category}</CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(report.status)}>
                        {report.status.replace(/_/g, ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(report.priority)}>
                        {report.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.department && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">ጥቆማ የሚሰጥበት የስራ ክፍል</div>
                    <div className="font-medium">{report.department}</div>
                  </div>
                )}

                {report.person && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">ጥቆማ የተደረገበት አካል</div>
                    <div className="font-medium">{report.person}</div>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Calendar className="h-4 w-4" />
                    ጥጥቆማ የተሰጠበት ቀን
                  </div>
                  <div>{new Date(report.createdAt).toLocaleString()}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">የጥቆማዉ አይነት</div>
                  <div className="font-medium">{report.category}</div>
                </div>

                {report.incidentDate && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">ጉዳዩ የተፈፀመበት ቀን</div>
                    <div>{new Date(report.incidentDate).toLocaleDateString()}</div>
                  </div>
                )}

                {report.incidentLocation && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">ጉዳዩ የተፈፀመበት ቦታ</div>
                    <div>{report.incidentLocation}</div>
                  </div>
                )}

                <div>
                  <div className="text-sm text-gray-500 mb-1">የጉዳዩ ዝርዝር</div>
                  <div className="bg-gray-50 p-4 rounded-lg">{report.description}</div>
                </div>
              </CardContent>
            </Card>

            {/* Investigation Information - shown when under investigation */}
            {report.status === 'Under Investigation' && report.investigation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    የምርመራ መረጃ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {report.investigation.caseNumber && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Case Number</div>
                      <div className="font-medium">{report.investigation.caseNumber}</div>
                    </div>
                  )}
                  {report.investigation.assignedInvestigator && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">ለምርመራ የተመደበዉ ባለሙያ</div>
                      <div className="font-medium">
                        {report.investigation.assignedInvestigator.firstName} {report.investigation.assignedInvestigator.lastName}
                      </div>
                    </div>
                  )}
                  {report.investigation.status && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">የምርመራ ሁኔታ</div>
                      <div className="font-medium">{report.investigation.status}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Reporter Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  የጠቋሚዉ መረጃ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.isAnonymous ? (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Shield className="h-5 w-5" />
                    <span>ስሙ ሳይጠቀስ የተላከ</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {report.person && (
                      <div>
                        <div className="text-sm text-gray-500 mb-1">ጥቆማ የተደረገበት አካል</div>
                        <div className="font-medium">{report.person}</div>
                      </div>
                    )}
                    {report.complainantName && (
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Name</div>
                        <div className="font-medium">{report.complainantName}</div>
                      </div>
                    )}
                    {report.complainantEmail && (
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Email</div>
                        <div>{report.complainantEmail}</div>
                      </div>
                    )}
                    {report.complainantPhone && (
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Phone</div>
                        <div>{report.complainantPhone}</div>
                      </div>
                    )}
                    {report.complainantDepartment && (
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Department</div>
                        <div>{report.complainantDepartment}</div>
                      </div>
                    )}
                    {report.complainantPosition && (
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Position</div>
                        <div>{report.complainantPosition}</div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Messages Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No messages yet
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-lg ${
                          msg.senderType === 'COMPLAINANT'
                            ? 'bg-blue-50 ml-8'
                            : 'bg-gray-100 mr-8'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium text-sm">
                            {msg.senderType === 'COMPLAINANT' ? 'Reporter' : msg.senderRole}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{msg.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={3}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={sendingMessage || !newMessage.trim()} className="self-end">
                    {sendingMessage ? "Sending..." : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
