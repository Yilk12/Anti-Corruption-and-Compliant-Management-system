"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUserPrimaryRole } from "@/app/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { FileText, Clock, User, Calendar, AlertTriangle, CheckCircle, Gavel } from "lucide-react";

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
    departmentName?: string;
    institution?: string;
    complainantName?: string;
    complainantEmail?: string;
    complainantPhone?: string;
    complainantDepartment?: string;
    complainantPosition?: string;
    createdAt: string;
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
  assignedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  investigationReport?: {
    id: string;
    background?: string;
    objectives?: string;
    activitiesPerformed?: string;
    evidenceCollected?: string;
    personsInterviewed?: string;
    findings?: string;
    observations?: string;
    conclusions?: string;
    recommendations?: string;
    submittedAt?: string;
    finalDecision?: string;
    finalDecisionById?: string;
    finalDecisionBy?: {
      id: string;
      firstName: string;
      lastName: string;
      position?: string;
    };
    finalDecisionAt?: string;
  };
}

export default function CommissionerReportsPage() {
  const router = useRouter();
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPetition, setSelectedPetition] = useState<Petition | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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
    if (role !== "commissioner" && role !== "admin") {
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

      const response = await fetch(`${API_BASE}/api/feedback/petitions/all`, { headers });
      const data = response.ok ? await response.json() : [];
      // Filter only petitions with final decisions
      const petitionsWithDecisions = data.filter((p: Petition) => 
        p.investigationReport?.finalDecision && p.status === "Final Decision Issued"
      );
      setPetitions(petitionsWithDecisions);
    } catch (error) {
      console.error("Error fetching petitions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Petition Submitted":
        return "bg-yellow-100 text-yellow-800";
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
            <h1 className="text-2xl font-bold">Final Decision Reports</h1>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">Loading reports...</div>
            </div>
          ) : petitions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports</h3>
                <p className="text-gray-500">There are no final decision reports at this time.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {petitions.map((petition) => (
                <Card key={petition.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">{petition.petitionNumber}</CardTitle>
                          <Badge className={getStatusColor(petition.status)}>
                            {petition.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            Complaint: {petition.complaint.trackingId}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(petition.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Final Decision Summary */}
                    {petition.investigationReport?.finalDecision && (
                      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                        <h4 className="font-medium text-indigo-900 mb-3 flex items-center gap-2">
                          <Gavel className="w-4 h-4" />
                          Final Decision Summary
                        </h4>
                        <div className="space-y-3 text-sm">
                          {(() => {
                            const decisionData = JSON.parse(petition.investigationReport.finalDecision);
                            return (
                              <>
                                <div>
                                  <div className="font-medium text-indigo-800 mb-1">Decision</div>
                                  <p className="text-indigo-700 font-semibold">{decisionData.decision}</p>
                                </div>
                                {decisionData.rationale && (
                                  <div>
                                    <div className="font-medium text-indigo-800 mb-1">Rationale</div>
                                    <p className="text-indigo-700">{decisionData.rationale}</p>
                                  </div>
                                )}
                                {petition.investigationReport.finalDecisionAt && (
                                  <div className="text-xs text-indigo-600 pt-2 border-t border-indigo-200">
                                    Decision Date: {new Date(petition.investigationReport.finalDecisionAt).toLocaleString()}
                                  </div>
                                )}
                                {petition.investigationReport.finalDecisionBy && (
                                  <div className="text-xs text-indigo-600">
                                    Decision By: {petition.investigationReport.finalDecisionBy.firstName} {petition.investigationReport.finalDecisionBy.lastName}
                                    {petition.investigationReport.finalDecisionBy.position && ` (${petition.investigationReport.finalDecisionBy.position})`}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Complaint Subject */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">ጥቆማ የተደረገበት አካል (Complaint Subject)</h4>
                      <p className="text-gray-700">{petition.complaint.subject}</p>
                    </div>

                    {/* Complainant Information */}
                    {petition.complaint.complainantName && (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Complainant Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <div className="font-medium text-gray-800 mb-1">Name</div>
                            <p className="text-gray-700">{petition.complaint.complainantName}</p>
                          </div>
                          {petition.complaint.complainantDepartment && (
                            <div>
                              <div className="font-medium text-gray-800 mb-1">Department</div>
                              <p className="text-gray-700">{petition.complaint.complainantDepartment}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* View Full Details Button */}
                    <div className="pt-4 border-t">
                      <Button
                        onClick={() => {
                          setSelectedPetition(petition);
                          setShowDetailModal(true);
                        }}
                        className="w-full"
                        variant="outline"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        View Full Report Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Full Detail Modal */}
        {showDetailModal && selectedPetition && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Full Report - {selectedPetition.petitionNumber}</span>
                  <Button variant="ghost" size="sm" onClick={() => setShowDetailModal(false)}>
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Complainant Information */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Complainant Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedPetition.complaint.complainantName && (
                      <div>
                        <div className="font-medium text-gray-800 mb-1">Name</div>
                        <p className="text-gray-700">{selectedPetition.complaint.complainantName}</p>
                      </div>
                    )}
                    {selectedPetition.complaint.complainantEmail && (
                      <div>
                        <div className="font-medium text-gray-800 mb-1">Email</div>
                        <p className="text-gray-700">{selectedPetition.complaint.complainantEmail}</p>
                      </div>
                    )}
                    {selectedPetition.complaint.complainantPhone && (
                      <div>
                        <div className="font-medium text-gray-800 mb-1">Phone</div>
                        <p className="text-gray-700">{selectedPetition.complaint.complainantPhone}</p>
                      </div>
                    )}
                    {selectedPetition.complaint.complainantDepartment && (
                      <div>
                        <div className="font-medium text-gray-800 mb-1">Department</div>
                        <p className="text-gray-700">{selectedPetition.complaint.complainantDepartment}</p>
                      </div>
                    )}
                    {selectedPetition.complaint.complainantPosition && (
                      <div>
                        <div className="font-medium text-gray-800 mb-1">Position</div>
                        <p className="text-gray-700">{selectedPetition.complaint.complainantPosition}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Complaint Details */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Complaint Details
                  </h4>
                  <div className="space-y-3 text-sm">
                    {selectedPetition.complaint.institution && (
                      <div>
                        <div className="font-medium text-blue-800 mb-1">ጥቆማ የተሰጠበት አካል (Institution)</div>
                        <p className="text-blue-700">{selectedPetition.complaint.institution}</p>
                      </div>
                    )}
                    {selectedPetition.complaint.departmentName && (
                      <div>
                        <div className="font-medium text-blue-800 mb-1">Department</div>
                        <p className="text-blue-700">{selectedPetition.complaint.departmentName}</p>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-blue-800 mb-1">Description</div>
                      <p className="text-blue-700">{selectedPetition.complaint.description}</p>
                    </div>
                    <div>
                      <div className="font-medium text-blue-800 mb-1">የተላከበት ቀን (Date Submitted)</div>
                      <p className="text-blue-700">{new Date(selectedPetition.complaint.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Complainant's Petition */}
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-medium text-orange-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Complainant's Petition
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="font-medium text-orange-800 mb-1">Reason for Dissatisfaction</div>
                      <p className="text-orange-700">{selectedPetition.reasonForDissatisfaction}</p>
                    </div>
                    {selectedPetition.explanation && (
                      <div>
                        <div className="font-medium text-orange-800 mb-1">Explanation</div>
                        <p className="text-orange-700">{selectedPetition.explanation}</p>
                      </div>
                    )}
                    {selectedPetition.additionalInfo && (
                      <div>
                        <div className="font-medium text-orange-800 mb-1">Additional Information</div>
                        <p className="text-orange-700">{selectedPetition.additionalInfo}</p>
                      </div>
                    )}
                    {selectedPetition.requestedAction && (
                      <div>
                        <div className="font-medium text-orange-800 mb-1">Requested Corrective Action</div>
                        <p className="text-orange-700">{selectedPetition.requestedAction}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Department Response */}
                {selectedPetition.complaint.departmentalResponse && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Department Response
                    </h4>
                    <div className="space-y-3 text-sm">
                      {selectedPetition.complaint.departmentalResponse.summary && (
                        <div>
                          <div className="font-medium text-purple-800 mb-1">Summary</div>
                          <p className="text-purple-700">{selectedPetition.complaint.departmentalResponse.summary}</p>
                        </div>
                      )}
                      {selectedPetition.complaint.departmentalResponse.officialResponse && (
                        <div>
                          <div className="font-medium text-purple-800 mb-1">Official Response</div>
                          <p className="text-purple-700">{selectedPetition.complaint.departmentalResponse.officialResponse}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Investigation Report */}
                {selectedPetition.investigationReport && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Investigation Report
                    </h4>
                    <div className="space-y-3 text-sm">
                      {selectedPetition.investigationReport.findings && (
                        <div>
                          <div className="font-medium text-green-800 mb-1">Findings</div>
                          <p className="text-green-700">{selectedPetition.investigationReport.findings}</p>
                        </div>
                      )}
                      {selectedPetition.investigationReport.conclusions && (
                        <div>
                          <div className="font-medium text-green-800 mb-1">Conclusions</div>
                          <p className="text-green-700">{selectedPetition.investigationReport.conclusions}</p>
                        </div>
                      )}
                      {selectedPetition.investigationReport.recommendations && (
                        <div>
                          <div className="font-medium text-green-800 mb-1">Recommendations</div>
                          <p className="text-green-700">{selectedPetition.investigationReport.recommendations}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Final Decision */}
                {selectedPetition.investigationReport?.finalDecision && (
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <h4 className="font-medium text-indigo-900 mb-3 flex items-center gap-2">
                      <Gavel className="w-4 h-4" />
                      Final Decision
                    </h4>
                    <div className="space-y-3 text-sm">
                      {(() => {
                        const decisionData = JSON.parse(selectedPetition.investigationReport.finalDecision);
                        return (
                          <>
                            <div>
                              <div className="font-medium text-indigo-800 mb-1">Decision</div>
                              <p className="text-indigo-700 font-semibold">{decisionData.decision}</p>
                            </div>
                            {decisionData.rationale && (
                              <div>
                                <div className="font-medium text-indigo-800 mb-1">Rationale</div>
                                <p className="text-indigo-700">{decisionData.rationale}</p>
                              </div>
                            )}
                            {decisionData.actionsToBeTaken && (
                              <div>
                                <div className="font-medium text-indigo-800 mb-1">Actions to be Taken</div>
                                <p className="text-indigo-700">{decisionData.actionsToBeTaken}</p>
                              </div>
                            )}
                            {decisionData.timeline && (
                              <div>
                                <div className="font-medium text-indigo-800 mb-1">Timeline</div>
                                <p className="text-indigo-700">{decisionData.timeline}</p>
                              </div>
                            )}
                            {selectedPetition.investigationReport.finalDecisionAt && (
                              <div className="text-xs text-indigo-600 pt-2 border-t border-indigo-200">
                                Decision Date: {new Date(selectedPetition.investigationReport.finalDecisionAt).toLocaleString()}
                              </div>
                            )}
                            {selectedPetition.investigationReport.finalDecisionBy && (
                              <div className="text-xs text-indigo-600">
                                Decision By: {selectedPetition.investigationReport.finalDecisionBy.firstName} {selectedPetition.investigationReport.finalDecisionBy.lastName}
                                {selectedPetition.investigationReport.finalDecisionBy.position && ` (${selectedPetition.investigationReport.finalDecisionBy.position})`}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailModal(false)}
                    className="flex-1"
                  >
                    Close
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
