"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { ArrowLeft, FileText, Clock, User, Calendar, Check, X, Gavel } from "lucide-react";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";

export default function CommissionerAdministrativeComplaintsPage() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [pendingComplaints, setPendingComplaints] = useState<any[]>([]);
  const [historyComplaints, setHistoryComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [commissionerDecision, setCommissionerDecision] = useState({
    decision: 'approve' as 'approve' | 'reject' | 'return',
    comments: '',
  });
  const [submittingDecision, setSubmittingDecision] = useState(false);

  function getToken() {
    try {
      return (
        localStorage.getItem("accessToken") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("token")
      );
    } catch (error) {
      return null;
    }
  }

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");

  useEffect(() => {
    fetchComplaints();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Investigation_Completed':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleOpenDecisionModal = (complaint: any) => {
    setSelectedComplaint(complaint);
    setShowDecisionModal(true);
  };

  const handleSubmitDecision = async () => {
    if (!selectedComplaint || !commissionerDecision.decision || !commissionerDecision.comments) {
      alert("Please provide decision and comments");
      return;
    }

    setSubmittingDecision(true);
    try {
      const token = getToken();
      const headers: HeadersInit = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(`${API_BASE}/api/feedback/complaints/${selectedComplaint.id}/commissioner-review-administrative`, {
        method: 'POST',
        headers,
        body: JSON.stringify(commissionerDecision),
      });

      if (!response.ok) {
        throw new Error('Failed to submit decision');
      }

      alert('Decision submitted successfully');
      setShowDecisionModal(false);
      setCommissionerDecision({
        decision: 'approve',
        comments: '',
      });
      setSelectedComplaint(null);
      
      // Refresh the complaints list
      fetchComplaints();
    } catch (error) {
      console.error('Error submitting decision:', error);
      alert('Failed to submit decision');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      const token = getToken();
      if (!token) {
        console.error('No token available');
        setLoading(false);
        return;
      }
      
      const headers: HeadersInit = {
        Authorization: `Bearer ${token}`
      };

      const response = await fetch(`${API_BASE}/api/feedback/complaints`, { headers });
      if (response.ok) {
        const data = await response.json();
        const complaintsArray = Array.isArray(data) ? data : (data?.items || []);

        // Filter all administrative complaints
        const allAdminComplaints = complaintsArray.filter((c: any) =>
          c.category === 'Administrative Complaints' ||
          c.category === 'አስተዳደራዊ ጥቆማ' ||
          c.category === 'አስተዳደራዊ ቅሬታ'
        );

        // Split into pending and history
        const pending = allAdminComplaints.filter((c: any) => c.status === 'Investigation_Completed');
        const history = allAdminComplaints.filter((c: any) => 
          c.status !== 'Investigation_Completed' && 
          (c.status === 'Decision_Approved' || c.status === 'Decision_Rejected' || c.status === 'Closed')
        );

        setPendingComplaints(pending);
        setHistoryComplaints(history);
        setComplaints(allAdminComplaints);
      } else {
        setError('Failed to fetch complaints');
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setError('Error fetching complaints');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <h1 className="text-2xl font-bold mb-6">Administrative Complaints - Pending Review</h1>

          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : pendingComplaints.length === 0 && historyComplaints.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-600">No administrative complaints found.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Pending Section */}
              {pendingComplaints.length > 0 && (
                <>
                  <h2 className="text-xl font-semibold mb-4 text-blue-700">Pending Review ({pendingComplaints.length})</h2>
                  <div className="space-y-4 mb-8">
                    {pendingComplaints.map((complaint) => (
                      <Card
                        key={complaint.id}
                        className="hover:shadow-lg transition-shadow"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={getStatusColor(complaint.status)}>
                                  {complaint.status.replace(/_/g, ' ')}
                                </Badge>
                                <Badge variant="outline">
                                  {complaint.category}
                                </Badge>
                              </div>
                              <CardTitle className="text-lg">{complaint.subject || 'No Subject'}</CardTitle>
                            </div>
                            <FileText className="h-5 w-5 text-gray-400" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{complaint.complainantName || 'Anonymous'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>Tracking ID: {complaint.trackingId}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <p className="mt-3 text-gray-700 line-clamp-2">
                            {complaint.description || 'No description provided'}
                          </p>
                          <div className="mt-4 flex gap-2">
                            <Button
                              onClick={() => router.push(`/feedback/complaints/${complaint.id}`)}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              View Details
                            </Button>
                            {complaint.status === 'Investigation_Completed' && (
                              <Button
                                onClick={() => handleOpenDecisionModal(complaint)}
                                size="sm"
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                <Gavel className="mr-2 h-4 w-4" />
                                Make Decision
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              {/* History Section */}
              {historyComplaints.length > 0 && (
                <>
                  <h2 className="text-xl font-semibold mb-4 text-green-700">Decision History ({historyComplaints.length})</h2>
                  <div className="space-y-4">
                    {historyComplaints.map((complaint) => (
                      <Card
                        key={complaint.id}
                        className="hover:shadow-lg transition-shadow"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={getStatusColor(complaint.status)}>
                                  {complaint.status.replace(/_/g, ' ')}
                                </Badge>
                                <Badge variant="outline">
                                  {complaint.category}
                                </Badge>
                              </div>
                              <CardTitle className="text-lg">{complaint.subject || 'No Subject'}</CardTitle>
                            </div>
                            <FileText className="h-5 w-5 text-gray-400" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{complaint.complainantName || 'Anonymous'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>Tracking ID: {complaint.trackingId}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <p className="mt-3 text-gray-700 line-clamp-2">
                            {complaint.description || 'No description provided'}
                          </p>
                          <div className="mt-4">
                            <Button
                              onClick={() => router.push(`/feedback/complaints/${complaint.id}`)}
                              variant="outline"
                              size="sm"
                              className="w-full"
                            >
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Commissioner Decision Modal */}
        {showDecisionModal && selectedComplaint && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gavel className="w-5 h-5" />
                    <span>Commissioner Decision</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowDecisionModal(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Subject:</strong> {selectedComplaint.subject}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Tracking ID:</strong> {selectedComplaint.trackingId}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Category:</strong> {selectedComplaint.category}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Decision *</label>
                  <Select
                    value={commissionerDecision.decision}
                    onValueChange={(value: 'approve' | 'reject' | 'return') => setCommissionerDecision({...commissionerDecision, decision: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approve">Approve</SelectItem>
                      <SelectItem value="reject">Reject</SelectItem>
                      <SelectItem value="return">Return for Further Investigation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Comments *</label>
                  <Textarea
                    placeholder="Provide your comments and rationale for the decision..."
                    value={commissionerDecision.comments}
                    onChange={(e) => setCommissionerDecision({...commissionerDecision, comments: e.target.value})}
                    rows={5}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSubmitDecision}
                    disabled={submittingDecision || !commissionerDecision.decision || !commissionerDecision.comments}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {submittingDecision ? "Submitting..." : "Submit Decision"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDecisionModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
