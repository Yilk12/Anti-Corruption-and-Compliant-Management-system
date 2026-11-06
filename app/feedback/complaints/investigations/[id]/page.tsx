"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Edit, FileText, Calendar, User, AlertTriangle, CheckCircle, Clock, Plus, Upload, X, FolderOpen, Search, FileCheck, Users, Shield, Scale, ClipboardList, MessageSquare, Send } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { readToken, getCurrentUserRoles, getCurrentUserName } from "@/app/lib/auth";
import { useSecretCodeCheck } from "@/app/hooks/use-secret-code-check";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";

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
  findings?: string;
  recommendation?: string;
  decision?: string;
  decisionDate?: string;
  closureReason?: string;
  outcome?: string;
  reviewerName?: string;
  reviewDate?: string;
  reviewNotes?: string;
  reportSubmittedAt?: string;
  scope?: string;
  objectives?: string;
  investigationPlan?: string;
  activities?: any[];
  evidence?: any[];
  complaint?: {
    complainantName?: string;
    complainantEmail?: string;
    description?: string;
    subject?: string;
    category?: string;
    incidentDate?: string;
    incidentLocation?: string;
  };
  complaintDetails?: string;
  whatHappened?: string;
  whenHappened?: string;
  whereHappened?: string;
  whoInvolved?: string;
  evidenceDetails?: string;
  evidenceDocuments?: string;
  evidenceRecords?: string;
  evidencePhotographs?: string;
  evidenceMessages?: string;
  evidenceOther?: string;
  rootCause?: string;
  responsibility?: string;
  responsibilityOffice?: string;
  responsibilityProcess?: string;
  responsibilityPerson?: string;
  impact?: string;
  correctiveAction?: string;
  correctiveActionTaken?: string;
  correctiveActionResponsiblePerson?: string;
  correctiveActionDeadline?: string;
}

const statusColors: Record<string, string> = {
  "Assigned": "bg-blue-100 text-blue-800",
  "Under Investigation": "bg-orange-100 text-orange-800",
  "Report Submitted": "bg-yellow-100 text-yellow-800",
  "Under Review": "bg-indigo-100 text-indigo-800",
  "Returned for Further Investigation": "bg-red-100 text-red-800",
  "Pending Decision": "bg-purple-100 text-purple-800",
  "Referred": "bg-teal-100 text-teal-800",
  "Approved": "bg-green-100 text-green-800",
  "Closed": "bg-gray-100 text-gray-800",
  "Reopened": "bg-pink-100 text-pink-800",
};

const priorityColors: Record<string, string> = {
  "Low": "bg-green-100 text-green-800",
  "High": "bg-orange-100 text-orange-800",
  "Urgent": "bg-red-100 text-red-800",
};

export default function FeedbackInvestigationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const investigationId = params.id as string;
  
  // Check secret code status
  useSecretCodeCheck('/feedback/complaints/investigations/' + investigationId);
  
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("case-details");
  const [isEditing, setIsEditing] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnComment, setReturnComment] = useState("");
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState({
    approvalRemarks: "",
    conclusion: "",
    correctiveAction: "",
  });
  
  const [formData, setFormData] = useState({
    complaintDetails: "",
    whatHappened: "",
    whenHappened: "",
    whereHappened: "",
    whoInvolved: "",
    evidenceDetails: "",
    evidenceDocuments: "",
    evidenceRecords: "",
    evidencePhotographs: "",
    evidenceMessages: "",
    evidenceOther: "",
    findings: "",
    rootCause: "",
    responsibility: "",
    responsibilityOffice: "",
    responsibilityProcess: "",
    responsibilityPerson: "",
    impact: "",
    outcome: "",
    recommendation: "",
    correctiveAction: "",
    correctiveActionTaken: "",
    correctiveActionResponsiblePerson: "",
    correctiveActionDeadline: "",
  });

  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  useEffect(() => {
    const roles = getCurrentUserRoles() || [];
    setUserRoles(roles);
    fetchInvestigation();
  }, [investigationId]);

  const fetchInvestigation = async () => {
    try {
      const token = readToken();
      const response = await fetch(`http://localhost:4000/api/feedback/investigations/${investigationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch investigation');
      }

      const data = await response.json();
      setInvestigation(data);
      
      // Populate form with existing data
      setFormData({
        complaintDetails: data.complaintDetails || "",
        whatHappened: data.whatHappened || "",
        whenHappened: data.whenHappened || "",
        whereHappened: data.whereHappened || "",
        whoInvolved: data.whoInvolved || "",
        evidenceDetails: data.evidenceDetails || "",
        evidenceDocuments: data.evidenceDocuments || "",
        evidenceRecords: data.evidenceRecords || "",
        evidencePhotographs: data.evidencePhotographs || "",
        evidenceMessages: data.evidenceMessages || "",
        evidenceOther: data.evidenceOther || "",
        findings: data.findings || "",
        rootCause: data.rootCause || "",
        responsibility: data.responsibility || "",
        responsibilityOffice: data.responsibilityOffice || "",
        responsibilityProcess: data.responsibilityProcess || "",
        responsibilityPerson: data.responsibilityPerson || "",
        impact: data.impact || "",
        outcome: data.outcome || "",
        recommendation: data.recommendation || "",
        correctiveAction: data.correctiveAction || "",
        correctiveActionTaken: data.correctiveActionTaken || "",
        correctiveActionResponsiblePerson: data.correctiveActionResponsiblePerson || "",
        correctiveActionDeadline: data.correctiveActionDeadline || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load investigation');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = readToken();
      
      // Upload evidence files first
      if (evidenceFiles.length > 0) {
        const formData = new FormData();
        evidenceFiles.forEach(file => formData.append('files', file));
        
        await fetch(`http://localhost:4000/api/feedback/investigations/${investigationId}/evidence`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
        
        setEvidenceFiles([]);
      }

      const response = await fetch(`http://localhost:4000/api/feedback/investigations/${investigationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save investigation');
      }

      await fetchInvestigation();
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'audio/mpeg',
      'audio/wav',
      'audio/mp4'
    ];
    
    const rejectedFiles: string[] = [];
    const validFiles = files.filter(file => {
      const isValid = validTypes.includes(file.type);
      const isSmallEnough = file.size <= 50 * 1024 * 1024; // 50MB limit
      
      if (!isValid) {
        rejectedFiles.push(`${file.name} (invalid file type)`);
      } else if (!isSmallEnough) {
        rejectedFiles.push(`${file.name} (file too large - ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      }
      
      return isValid && isSmallEnough;
    });

    if (rejectedFiles.length > 0) {
      alert(`The following files were not added:\n\n${rejectedFiles.join('\n')}\n\nAllowed types: Images (JPEG, PNG, GIF), PDF, Videos (MP4, WebM, MOV), Audio files\nMaximum size: 50MB`);
    }

    setEvidenceFiles(prev => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendReport = async () => {
    try {
      const token = readToken();
      
      // Upload evidence files first
      if (evidenceFiles.length > 0) {
        const formData = new FormData();
        evidenceFiles.forEach(file => formData.append('files', file));
        
        await fetch(`http://localhost:4000/api/feedback/investigations/${investigationId}/evidence`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
        
        setEvidenceFiles([]);
      }

      const response = await fetch(`http://localhost:4000/api/feedback/investigations/${investigationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          status: 'Report Submitted',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send report');
      }

      await fetchInvestigation();
      setIsEditing(false);
      alert('መረጃዉ በትክክል ተልኳል');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send report');
    }
  };

  const handleApproveReport = async () => {
    setShowApprovalModal(true);
  };

  const handleConfirmApproval = async () => {
    try {
      const token = readToken();
      const response = await fetch(`http://localhost:4000/api/feedback/investigations/${investigationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Approved',
          closureReason: approvalData.approvalRemarks,
          conclusion: approvalData.conclusion,
          correctiveAction: approvalData.correctiveAction,
          decision: 'Approved',
          decisionDate: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve report');
      }

      setShowApprovalModal(false);
      setApprovalData({
        approvalRemarks: "",
        conclusion: "",
        correctiveAction: "",
      });
      await fetchInvestigation();
      alert('Investigation report approved and sent to complainant');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve report');
    }
  };

  const handleReturnReport = async () => {
    setShowReturnModal(true);
  };

  const handleConfirmReturn = async () => {
    try {
      const token = readToken();
      const response = await fetch(`http://localhost:4000/api/feedback/investigations/${investigationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Returned for Further Investigation',
          reviewNotes: returnComment,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to return report');
      }

      setShowReturnModal(false);
      setReturnComment("");
      await fetchInvestigation();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to return report');
    }
  };

  const isFeedbackOfficer = () => {
    return userRoles.some(role => role === 'Feedback_Complaint_Officer' || role === 'feedback_complaint_officer');
  };

  const isFeedbackManager = () => {
    return userRoles.some(role => role === 'Feedback_Complaint_Manager' || role === 'feedback_complaint_manager');
  };

  const isInvestigator = () => {
    if (!investigation) return false;
    const currentUserId = localStorage.getItem('userId');
    const investigatorId = typeof investigation.assignedInvestigator === 'object' 
      ? investigation.assignedInvestigator?.id 
      : investigation.assignedInvestigator;
    return investigatorId === currentUserId;
  };

  const isComplainant = () => {
    if (!investigation) return false;
    const currentUserId = localStorage.getItem('userId');
    return investigation.complaintId === currentUserId;
  };

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading investigation...</div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (error || !investigation) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">{error || 'Investigation not found'}</div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <>
      <AuthGuard>
        <DashboardLayout>
          <div className="space-y-6" style={{ backgroundColor: "#FFFFFF", color: "#000000" }}>
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{investigation.caseNumber}</h1>
              <p className="text-gray-600">{investigation.complaintReference}</p>
            </div>
            {isFeedbackOfficer() && investigation.status !== 'Closed' && (
              <Button
                onClick={() => setIsEditing(!isEditing)}
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            )}
            {isFeedbackManager() && investigation.status === 'Report Submitted' && (
              <div className="flex gap-2">
                <Button
                  onClick={handleApproveReport}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Report
                </Button>
                <Button
                  onClick={handleReturnReport}
                  variant="outline"
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Return for Revision
                </Button>
              </div>
            )}
            {(isInvestigator() || isComplainant()) && investigation.status === 'Report Submitted' && (
              <Button
                onClick={() => alert('Report is pending manager approval')}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="w-4 h-4" />
                View Investigation Report
              </Button>
            )}
          </div>

          {/* Status Badges */}
          <div className="flex gap-2">
            <Badge className={statusColors[investigation.status] || "bg-gray-100"}>
              {investigation.status === 'Under Investigation' ? 'በምርመራ ላይ ነዉ' : investigation.status}
            </Badge>
            <Badge className={priorityColors[investigation.priority] || "bg-gray-100"}>
              {investigation.priority}
            </Badge>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex gap-4">
              {[
                { id: "case-details", label: "Case Details", icon: FileText },
                { id: "investigation", label: "Investigation", icon: Search },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Case Details Tab */}
          {activeTab === "case-details" && (
            <div className="space-y-6">
              <Card style={{ backgroundColor: "#FFFFFF" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5" />
                    Case Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4" style={{ color: "#000000" }}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Case Number</p>
                      <p className="font-medium">{investigation.caseNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <Badge className={statusColors[investigation.status]}>{investigation.status === 'Under Investigation' ? 'በምርመራ ላይ ነዉ' : investigation.status}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Priority</p>
                      <Badge className={priorityColors[investigation.priority]}>{investigation.priority}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Category</p>
                      <p className="font-medium">{investigation.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Start Date</p>
                      <p className="font-medium">{new Date(investigation.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Target Completion Date</p>
                      <p className="font-medium">
                        {investigation.targetCompletionDate 
                          ? new Date(investigation.targetCompletionDate).toLocaleDateString()
                          : 'Not set'}
                      </p>
                    </div>
                  </div>
                  
                  {investigation.scope && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Scope</p>
                      <p className="text-sm">{investigation.scope}</p>
                    </div>
                  )}
                  
                  {investigation.objectives && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Objectives</p>
                      <p className="text-sm">{investigation.objectives}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {investigation.complaint && (
                <Card style={{ backgroundColor: "#FFFFFF" }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Complaint Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4" style={{ color: "#000000" }}>
                    <div>
                      <p className="text-sm text-gray-500">Subject</p>
                      <p className="font-medium">{investigation.complaint.subject}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Description</p>
                      <p className="text-sm">{investigation.complaint.description}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">What happened</p>
                      <p className="text-sm p-3 bg-gray-50 rounded">
                        {formData.whatHappened || investigation.complaint?.description || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">When</p>
                      <p className="text-sm p-3 bg-gray-50 rounded">
                        {formData.whenHappened || (investigation.complaint?.incidentDate ? new Date(investigation.complaint.incidentDate).toLocaleDateString() : 'Not provided')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Where</p>
                      <p className="text-sm p-3 bg-gray-50 rounded">
                        {formData.whereHappened || investigation.complaint?.incidentLocation || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Who was involved</p>
                      <p className="text-sm p-3 bg-gray-50 rounded">
                        {formData.whoInvolved || 'Not provided'}
                      </p>
                    </div>
                    {investigation.complaint.complainantName && (
                      <div>
                        <p className="text-sm text-gray-500">Complainant</p>
                        <p className="font-medium">{investigation.complaint.complainantName}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Investigation Tab */}
          {activeTab === "investigation" && (
            <div className="space-y-6">
              <Card style={{ backgroundColor: "#FFFFFF" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Investigation Report
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6" style={{ color: "#000000" }}>
                  {/* Show review notes if returned for revision */}
                  {investigation.status === 'Returned for Further Investigation' && investigation.reviewNotes && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-orange-800 mb-2">Revision Required</h4>
                          <p className="text-sm text-orange-700">{investigation.reviewNotes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show approval details if approved */}
                  {investigation.status === 'Closed' && investigation.decision === 'Approved' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div className="flex-1 space-y-3">
                          <h4 className="font-medium text-green-800">Approved Investigation</h4>
                          
                          {investigation.outcome && (
                            <div>
                              <div className="text-xs text-green-600 mb-1">Conclusion</div>
                              <p className="text-sm text-green-700">{investigation.outcome}</p>
                            </div>
                          )}
                          
                          {investigation.correctiveAction && (
                            <div>
                              <div className="text-xs text-green-600 mb-1">Corrective Action</div>
                              <p className="text-sm text-green-700">{investigation.correctiveAction}</p>
                            </div>
                          )}
                          
                          {investigation.decisionDate && (
                            <div>
                              <div className="text-xs text-green-600 mb-1">Decision Date</div>
                              <p className="text-sm text-green-700">{new Date(investigation.decisionDate).toLocaleDateString()}</p>
                            </div>
                          )}
                          
                          {investigation.closureReason && (
                            <div>
                              <div className="text-xs text-green-600 mb-1">Approval Remarks</div>
                              <p className="text-sm text-green-700">{investigation.closureReason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show report details if officer or if report is submitted */}
                  {isFeedbackOfficer() || investigation.status === 'Report Submitted' || investigation.status === 'Closed' || investigation.status === 'Returned for Further Investigation' ? (
                    <>
                      {/* Evidence */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Evidence
                        </label>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-600">
                              Attach Evidence Files
                            </label>
                            {isEditing ? (
                              <div className="space-y-3">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                                  <input
                                    type="file"
                                    id="evidence-files"
                                    multiple
                                    accept="image/*,.pdf,video/*,audio/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                  />
                                  <label
                                    htmlFor="evidence-files"
                                    className="cursor-pointer"
                                  >
                                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-600">
                                      Click to upload or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Images (JPEG, PNG, GIF), PDF, Videos (MP4, WebM, MOV), Audio files
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Maximum file size: 50MB
                                    </p>
                                  </label>
                                </div>
                                {evidenceFiles.length > 0 && (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">
                                      Uploaded Files ({evidenceFiles.length})
                                    </p>
                                    {evidenceFiles.map((file, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                      >
                                        <div className="flex items-center gap-2">
                                          <FileText className="w-4 h-4 text-gray-500" />
                                          <span className="text-sm text-gray-700">
                                            {file.name}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                          </span>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRemoveFile(index)}
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {investigation.evidence && investigation.evidence.length > 0 ? (
                                  <>
                                    <p className="text-sm font-medium text-gray-700">
                                      Uploaded Files ({investigation.evidence.length})
                                    </p>
                                    {investigation.evidence.map((evidence: any, index: number) => (
                                      <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                      >
                                        <div className="flex items-center gap-2">
                                          <FileText className="w-4 h-4 text-gray-500" />
                                          <a
                                            href={`http://localhost:4000${evidence.filePath}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:text-blue-700 underline"
                                          >
                                            {evidence.fileName}
                                          </a>
                                          <span className="text-xs text-gray-500">
                                            ({(evidence.fileSize / 1024 / 1024).toFixed(2)} MB)
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </>
                                ) : (
                                  <p className="text-sm p-3 bg-gray-50 rounded">
                                    No files attached
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-600">
                              Documents
                            </label>
                            {isEditing ? (
                              <Textarea
                                value={formData.evidenceDocuments}
                                onChange={(e) => setFormData({ ...formData, evidenceDocuments: e.target.value })}
                                rows={2}
                                placeholder="List any documents as evidence"
                              />
                            ) : (
                              <p className="text-sm p-3 bg-gray-50 rounded">
                                {formData.evidenceDocuments || 'Not provided'}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-600">
                              Messages
                            </label>
                            {isEditing ? (
                              <Textarea
                                value={formData.evidenceMessages}
                                onChange={(e) => setFormData({ ...formData, evidenceMessages: e.target.value })}
                                rows={2}
                                placeholder="List any messages as evidence"
                              />
                            ) : (
                              <p className="text-sm p-3 bg-gray-50 rounded">
                                {formData.evidenceMessages || 'Not provided'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Findings */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Findings: Facts established after examining the evidence
                        </label>
                        {isEditing ? (
                          <Textarea
                            value={formData.findings}
                            onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                            rows={4}
                            placeholder="State the facts established after examining the evidence"
                          />
                        ) : (
                          <p className="text-sm p-3 bg-gray-50 rounded">
                            {formData.findings || 'Not provided'}
                          </p>
                        )}
                      </div>

                      {/* Root Cause */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Root Cause: Why the problem happened
                        </label>
                        {isEditing ? (
                          <Textarea
                            value={formData.rootCause}
                            onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
                            rows={3}
                            placeholder="Explain why the problem happened"
                          />
                        ) : (
                          <p className="text-sm p-3 bg-gray-50 rounded">
                            {formData.rootCause || 'Not provided'}
                          </p>
                        )}
                      </div>

                      {/* Responsibility */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Responsibility
                        </label>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-600">
                              Office
                            </label>
                            {isEditing ? (
                              <Textarea
                                value={formData.responsibilityOffice}
                                onChange={(e) => setFormData({ ...formData, responsibilityOffice: e.target.value })}
                                rows={2}
                                placeholder="Which office had responsibility"
                              />
                            ) : (
                              <p className="text-sm p-3 bg-gray-50 rounded">
                                {formData.responsibilityOffice || 'Not provided'}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-600">
                              Person
                            </label>
                            {isEditing ? (
                              <Textarea
                                value={formData.responsibilityPerson}
                                onChange={(e) => setFormData({ ...formData, responsibilityPerson: e.target.value })}
                                rows={2}
                                placeholder="Which person had responsibility"
                              />
                            ) : (
                              <p className="text-sm p-3 bg-gray-50 rounded">
                                {formData.responsibilityPerson || 'Not provided'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Impact */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Impact: How the incident affected the complainant or organization
                        </label>
                        {isEditing ? (
                          <Textarea
                            value={formData.impact}
                            onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                            rows={3}
                            placeholder="Describe how the incident affected the complainant or organization"
                          />
                        ) : (
                          <p className="text-sm p-3 bg-gray-50 rounded">
                            {formData.impact || 'Not provided'}
                          </p>
                        )}
                      </div>

                      {/* Investigation Outcome */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Investigation Outcome: The conclusion supported by the evidence
                        </label>
                        {isEditing ? (
                          <Select value={formData.outcome} onValueChange={(value) => setFormData({ ...formData, outcome: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select outcome" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Substantiated">Substantiated</SelectItem>
                              <SelectItem value="Partially Substantiated">Partially Substantiated</SelectItem>
                              <SelectItem value="Not Substantiated">Not Substantiated</SelectItem>
                              <SelectItem value="Inconclusive">Inconclusive</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm p-3 bg-gray-50 rounded">
                            {formData.outcome || 'Not provided'}
                          </p>
                        )}
                      </div>

                      {/* Recommendation */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Recommendation: What should be done to resolve or prevent the issue
                        </label>
                        {isEditing ? (
                          <Textarea
                            value={formData.recommendation}
                            onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                            rows={3}
                            placeholder="State what should be done to resolve or prevent the issue"
                          />
                        ) : (
                          <p className="text-sm p-3 bg-gray-50 rounded">
                            {formData.recommendation || 'Not provided'}
                          </p>
                        )}
                      </div>


                      {/* Save Button */}
                      {isEditing && (
                        <div className="flex gap-2 pt-4 border-t">
                          <Button onClick={handleSave} className="gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Save Changes
                          </Button>
                          <Button variant="outline" onClick={() => setIsEditing(false)}>
                            Cancel
                          </Button>
                        </div>
                      )}

                      {/* Send Report Button - Only for Feedback Officers */}
                      {isFeedbackOfficer() && !isEditing && (
                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            onClick={handleSendReport}
                            className="gap-2 bg-green-600 hover:bg-green-700"
                          >
                            <Send className="w-4 h-4" />
                            Send Report
                          </Button>
                        </div>
                      )}

                      {/* Manager Actions - Only for Feedback Managers */}
                      {isFeedbackManager() && !isEditing && (
                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            onClick={handleApproveReport}
                            className="gap-2 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve Report
                          </Button>
                          <Button
                            onClick={handleReturnReport}
                            variant="outline"
                            className="gap-2"
                          >
                            <X className="w-4 h-4" />
                            Return for Revision
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Investigation report has not been submitted yet.</p>
                      <p className="text-sm text-gray-400 mt-2">Please wait for the assigned investigator to submit their report.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>

    {/* Return for Revision Modal */}
    {showReturnModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Return for Revision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Please provide comments for revision
              </label>
              <Textarea
                value={returnComment}
                onChange={(e) => setReturnComment(e.target.value)}
                rows={4}
                placeholder="Describe what needs to be revised in the investigation report..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReturnModal(false);
                  setReturnComment("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmReturn}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Return for Revision
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )}

    {/* Approval Modal */}
    {showApprovalModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Approve Investigation Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Case Reference Number */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Case Reference Number
              </label>
              <p className="text-sm p-3 bg-gray-50 rounded">{investigation.caseNumber}</p>
            </div>

            {/* Investigation Report Date */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Investigation Report Date
              </label>
              <p className="text-sm p-3 bg-gray-50 rounded">
                {investigation.reportSubmittedAt ? new Date(investigation.reportSubmittedAt).toLocaleDateString() : 'Not available'}
              </p>
            </div>

            {/* Investigation Conclusion */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Investigation Conclusion
              </label>
              <Select value={approvalData.conclusion} onValueChange={(value) => setApprovalData({ ...approvalData, conclusion: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select conclusion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Substantiated">Substantiated</SelectItem>
                  <SelectItem value="Partially Substantiated">Partially Substantiated</SelectItem>
                  <SelectItem value="Not Substantiated">Not Substantiated</SelectItem>
                  <SelectItem value="Inconclusive">Inconclusive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Implement Corrective Action */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Implement Corrective Action
              </label>
              <Select value={approvalData.correctiveAction} onValueChange={(value) => setApprovalData({ ...approvalData, correctiveAction: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select corrective action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Refer to Ethics and Anti-Corruption Unit">Refer to Ethics and Anti-Corruption Unit</SelectItem>
                  <SelectItem value="Submit for Final Decision">Submit for Final Decision</SelectItem>
                  <SelectItem value="Close Case After Verification">Close Case After Verification</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Approval Remarks */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Approval Remarks / Reason for Decision
              </label>
              <Textarea
                value={approvalData.approvalRemarks}
                onChange={(e) => setApprovalData({ ...approvalData, approvalRemarks: e.target.value })}
                rows={4}
                placeholder="Provide remarks or reason for your approval decision..."
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowApprovalModal(false);
                  setApprovalData({
                    approvalRemarks: "",
                    conclusion: "",
                    correctiveAction: "",
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmApproval}
                className="bg-green-600 hover:bg-green-700"
              >
                Approve Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )}
    </>
  );
}