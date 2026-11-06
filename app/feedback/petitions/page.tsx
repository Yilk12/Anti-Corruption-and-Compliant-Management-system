"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUserPrimaryRole } from "@/app/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { FileText, Clock, User, Calendar, AlertTriangle, CheckCircle } from "lucide-react";

interface Petition {
  id: string;
  petitionNumber: string;
  status: string;
  reasonForDissatisfaction?: string;
  explanation?: string;
  additionalInfo?: string;
  requestedAction?: string;
  investigationInstructions?: string;
  investigationDeadline?: string;
  createdAt: string;
  complaint: {
    id: string;
    trackingId: string;
    subject: string;
    description: string;
    status: string;
    departmentalResponse?: {
      summary?: string;
      investigationConducted?: string;
      findings?: string;
      actionsTaken?: string;
      proposedActions?: string;
      officialResponse?: string;
      recommendations?: string;
    };
  };
  assignedOfficer?: {
    id: string;
    firstName: string;
    lastName: string;
    position?: string;
  };
  investigationReport?: {
    id: string;
    activitiesPerformed?: string;
    evidenceCollected?: string;
    personsInterviewed?: string;
    findings?: string;
    observations?: string;
    conclusions?: string;
    recommendations?: string;
    submittedAt?: string;
  };
}

export default function PetitionsPage() {
  const router = useRouter();
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPetition, setSelectedPetition] = useState<Petition | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState({
    activitiesPerformed: "",
    evidenceCollected: "",
    personsInterviewed: "",
    findings: "",
    observations: "",
    conclusions: "",
    recommendations: "",
  });
  const [submittingReport, setSubmittingReport] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  const handleViewPetition = (petition: Petition) => {
    setSelectedPetition(petition);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setSelectedPetition(null);
    setViewMode('list');
  };

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
    if (role !== "feedback_complaint_officer" && role !== "admin" && role !== "commissioner") {
      router.replace("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    fetchPetitions();
  }, []);

  const fetchPetitions = async () => {
    try {
      const token = getToken();
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const response = await fetch(`${API_BASE}/api/feedback/petitions/assigned`, { headers });
      const data = response.ok ? await response.json() : [];
      setPetitions(data);
    } catch (error) {
      console.error("Error fetching petitions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!selectedPetition) return;

    try {
      setSubmittingReport(true);
      const token = getToken();
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" };

      const response = await fetch(
        `${API_BASE}/api/feedback/petitions/${selectedPetition.id}/investigation-report`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(reportData),
        }
      );

      if (response.ok) {
        setShowReportModal(false);
        setSelectedPetition(null);
        setReportData({
          activitiesPerformed: "",
          evidenceCollected: "",
          personsInterviewed: "",
          findings: "",
          observations: "",
          conclusions: "",
          recommendations: "",
        });
        fetchPetitions();
        alert("ሪፖርቱ በትክክል ተልኳል");
      } else {
        console.error("Failed to submit report:", response.status);
        alert("Failed to submit report");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Error submitting report");
    } finally {
      setSubmittingReport(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Assigned for Investigation":
        return "bg-orange-100 text-orange-800";
      case "Investigation Report Submitted":
        return "bg-blue-100 text-blue-800";
      case "Final Decision Issued":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">አቤቱታ (Petitions)</h1>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">Loading petitions...</div>
            </div>
          ) : petitions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Petitions Assigned</h3>
                <p className="text-gray-500">You have no petitions assigned to you at this time.</p>
              </CardContent>
            </Card>
          ) : viewMode === 'list' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {petitions.map((petition) => (
                <Button
                  key={petition.id}
                  onClick={() => handleViewPetition(petition)}
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-center justify-center gap-3 hover:bg-blue-50 hover:border-blue-300 transition-all"
                >
                  <div className="bg-blue-100 text-blue-900 px-4 py-2 rounded-lg font-mono font-bold text-xl">
                    {petition.petitionNumber}
                  </div>
                  <Badge className={getStatusColor(petition.status)}>
                    {petition.status}
                  </Badge>
                  <div className="text-xs text-gray-500">
                    {new Date(petition.createdAt).toLocaleDateString()}
                  </div>
                </Button>
              ))}
            </div>
          ) : selectedPetition ? (
            <div className="space-y-4">
              <Button onClick={handleBackToList} variant="outline" className="mb-4">
                ← Back to List
              </Button>
              <Card key={selectedPetition.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">{selectedPetition.petitionNumber}</CardTitle>
                          <Badge className={getStatusColor(selectedPetition.status)}>
                            {selectedPetition.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            Complaint: {selectedPetition.complaint.trackingId}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(selectedPetition.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Complaint Tracking ID</h4>
                      <p className="text-gray-700 font-mono">{selectedPetition.complaint.trackingId}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Complaint Subject</h4>
                      <p className="text-gray-700">{selectedPetition.complaint.subject}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">Complaint Description</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedPetition.complaint.description}</p>
                      </div>

                      {selectedPetition.complaint.departmentalResponse && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <h4 className="font-medium text-gray-900 mb-2">Departmental Response</h4>
                          <div className="space-y-3 text-sm">
                            {selectedPetition.complaint.departmentalResponse.summary && (
                              <div>
                                <div className="font-medium text-gray-800 mb-1">Summary</div>
                                <p className="text-gray-700">{selectedPetition.complaint.departmentalResponse.summary}</p>
                              </div>
                            )}
                            {selectedPetition.complaint.departmentalResponse.investigationConducted && (
                              <div>
                                <div className="font-medium text-gray-800 mb-1">Investigation Conducted</div>
                                <p className="text-gray-700">{selectedPetition.complaint.departmentalResponse.investigationConducted}</p>
                              </div>
                            )}
                            {selectedPetition.complaint.departmentalResponse.findings && (
                              <div>
                                <div className="font-medium text-gray-800 mb-1">Findings</div>
                                <p className="text-gray-700">{selectedPetition.complaint.departmentalResponse.findings}</p>
                              </div>
                            )}
                            {selectedPetition.complaint.departmentalResponse.actionsTaken && (
                              <div>
                                <div className="font-medium text-gray-800 mb-1">Actions Taken</div>
                                <p className="text-gray-700">{selectedPetition.complaint.departmentalResponse.actionsTaken}</p>
                              </div>
                            )}
                            {selectedPetition.complaint.departmentalResponse.proposedActions && (
                              <div>
                                <div className="font-medium text-gray-800 mb-1">Proposed Actions</div>
                                <p className="text-gray-700">{selectedPetition.complaint.departmentalResponse.proposedActions}</p>
                              </div>
                            )}
                            {selectedPetition.complaint.departmentalResponse.officialResponse && (
                              <div>
                                <div className="font-medium text-gray-800 mb-1">Official Response</div>
                                <p className="text-gray-700">{selectedPetition.complaint.departmentalResponse.officialResponse}</p>
                              </div>
                            )}
                            {selectedPetition.complaint.departmentalResponse.recommendations && (
                              <div>
                                <div className="font-medium text-gray-800 mb-1">Recommendations</div>
                                <p className="text-gray-700">{selectedPetition.complaint.departmentalResponse.recommendations}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedPetition.investigationInstructions && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Investigation Instructions
                        </h4>
                        <p className="text-blue-800">{selectedPetition.investigationInstructions}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">Complaint Petition</h4>
                        <div className="space-y-3 text-sm">
                          <div>
                            <div className="font-medium text-gray-800 mb-1">Reason for Dissatisfaction</div>
                            <p className="text-gray-700">{selectedPetition.reasonForDissatisfaction}</p>
                          </div>
                          {selectedPetition.explanation && (
                            <div>
                              <div className="font-medium text-gray-800 mb-1">Explanation</div>
                              <p className="text-gray-700">{selectedPetition.explanation}</p>
                            </div>
                          )}
                          {selectedPetition.requestedAction && (
                            <div>
                              <div className="font-medium text-gray-800 mb-1">Requested Corrective Action</div>
                              <p className="text-gray-700">{selectedPetition.requestedAction}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {selectedPetition.investigationReport && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Investigation Report
                          </h4>
                          <div className="space-y-3 text-sm">
                            {selectedPetition.investigationReport.activitiesPerformed && (
                              <div>
                                <div className="font-medium text-gray-800 mb-1">የተከናወኑ ተግባራት</div>
                                <p className="text-gray-700">{selectedPetition.investigationReport.activitiesPerformed}</p>
                              </div>
                            )}
                            {selectedPetition.investigationReport.evidenceCollected && (
                              <div>
                                <div className="font-medium text-gray-800 mb-1">የተሰበሰቡ ማስረጃዎች</div>
                                <p className="text-gray-700">{selectedPetition.investigationReport.evidenceCollected}</p>
                              </div>
                            )}
                            {selectedPetition.investigationReport.personsInterviewed && (
                              <div>
                                <div className="font-medium text-gray-800 mb-1">ስለጉዳዩ የተጠየቁ ሰዎች</div>
                                <p className="text-gray-700">{selectedPetition.investigationReport.personsInterviewed}</p>
                              </div>
                            )}
                            {selectedPetition.investigationReport.findings && (
                              <div>
                                <div className="font-medium text-gray-800 mb-1">የተገኘ ዉጤት</div>
                                <p className="text-gray-700">{selectedPetition.investigationReport.findings}</p>
                              </div>
                            )}
                            {selectedPetition.investigationReport.observations && (
                              <div>
                                <div className="font-medium text-gray-800 mb-1">ምልከታ</div>
                                <p className="text-gray-700">{selectedPetition.investigationReport.observations}</p>
                              </div>
                            )}
                            {selectedPetition.investigationReport.conclusions && (
                              <div>
                                <div className="font-medium text-gray-800 mb-1">ማጠቃለያ</div>
                                <p className="text-gray-700">{selectedPetition.investigationReport.conclusions}</p>
                              </div>
                            )}
                            {selectedPetition.investigationReport.recommendations && (
                              <div>
                                <div className="font-medium text-gray-800 mb-1">ምክረ ሃሳብ</div>
                                <p className="text-gray-700">{selectedPetition.investigationReport.recommendations}</p>
                              </div>
                            )}
                            {selectedPetition.investigationReport.submittedAt && (
                              <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
                                Submitted: {new Date(selectedPetition.investigationReport.submittedAt).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedPetition.investigationDeadline && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>Deadline: {new Date(selectedPetition.investigationDeadline).toLocaleDateString()}</span>
                      </div>
                    )}

                    {selectedPetition.assignedOfficer && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>
                          Assigned to: {selectedPetition.assignedOfficer.firstName} {selectedPetition.assignedOfficer.lastName}
                          {selectedPetition.assignedOfficer.position && ` (${selectedPetition.assignedOfficer.position})`}
                        </span>
                      </div>
                    )}

                    {selectedPetition.status === "Assigned for Investigation" && (
                      <div className="pt-4 border-t">
                        <Button
                          onClick={() => {
                            setShowReportModal(true);
                          }}
                          className="w-full"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Submit Investigation Report
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
            </div>
          ) : null}
        </div>

        {/* Investigation Report Modal */}
        {showReportModal && selectedPetition && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Submit Investigation Report - {selectedPetition.petitionNumber}</span>
                  <Button variant="ghost" size="sm" onClick={() => setShowReportModal(false)}>
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Activities Performed</label>
                  <textarea
                    className="w-full border rounded-lg p-3"
                    rows={3}
                    value={reportData.activitiesPerformed}
                    onChange={(e) => setReportData({ ...reportData, activitiesPerformed: e.target.value })}
                    placeholder="Describe activities performed..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Evidence Collected</label>
                  <textarea
                    className="w-full border rounded-lg p-3"
                    rows={3}
                    value={reportData.evidenceCollected}
                    onChange={(e) => setReportData({ ...reportData, evidenceCollected: e.target.value })}
                    placeholder="List evidence collected..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Persons Interviewed</label>
                  <textarea
                    className="w-full border rounded-lg p-3"
                    rows={2}
                    value={reportData.personsInterviewed}
                    onChange={(e) => setReportData({ ...reportData, personsInterviewed: e.target.value })}
                    placeholder="List persons interviewed..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Findings</label>
                  <textarea
                    className="w-full border rounded-lg p-3"
                    rows={3}
                    value={reportData.findings}
                    onChange={(e) => setReportData({ ...reportData, findings: e.target.value })}
                    placeholder="Investigation findings..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Observations</label>
                  <textarea
                    className="w-full border rounded-lg p-3"
                    rows={2}
                    value={reportData.observations}
                    onChange={(e) => setReportData({ ...reportData, observations: e.target.value })}
                    placeholder="Key observations..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Conclusions</label>
                  <textarea
                    className="w-full border rounded-lg p-3"
                    rows={2}
                    value={reportData.conclusions}
                    onChange={(e) => setReportData({ ...reportData, conclusions: e.target.value })}
                    placeholder="Conclusions drawn..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Recommendations</label>
                  <textarea
                    className="w-full border rounded-lg p-3"
                    rows={2}
                    value={reportData.recommendations}
                    onChange={(e) => setReportData({ ...reportData, recommendations: e.target.value })}
                    placeholder="Recommendations..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSubmitReport}
                    disabled={submittingReport}
                    className="flex-1"
                  >
                    {submittingReport ? "Submitting..." : "Submit Report"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowReportModal(false)}
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
