"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Edit, FileText, Calendar, User, AlertTriangle, CheckCircle, Clock, Plus, Upload, X, FolderOpen, Search, FileCheck, Users, Microscope, Shield, Scale, ClipboardList, MessageSquare, Send } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { readToken, getCurrentUserRoles, getCurrentUserName } from "@/app/lib/auth";
import { useSecretCodeCheck } from "@/app/hooks/use-secret-code-check";

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
  outcome?: string;
  reviewerName?: string;
  reviewDate?: string;
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
}

const statusColors: Record<string, string> = {
  "Assigned": "bg-blue-100 text-blue-800",
  "Under Investigation": "bg-orange-100 text-orange-800",
  "Report Submitted": "bg-yellow-100 text-yellow-800",
  "Under Review": "bg-indigo-100 text-indigo-800",
  "Returned for Further Investigation": "bg-red-100 text-red-800",
  "Pending Decision": "bg-purple-100 text-purple-800",
  "Referred": "bg-teal-100 text-teal-800",
  "Closed": "bg-gray-100 text-gray-800",
  "Reopened": "bg-pink-100 text-pink-800",
};

const priorityColors: Record<string, string> = {
  "Low": "bg-green-100 text-green-800",
  "High": "bg-orange-100 text-orange-800",
  "Urgent": "bg-red-100 text-red-800",
};

export default function InvestigationDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const investigationId = searchParams.get('id') || '';
  
  // Check secret code status
  useSecretCodeCheck('/ethics/investigations/' + investigationId);
  
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("case-details");
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showAllegationModal, setShowAllegationModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showExaminationModal, setShowExaminationModal] = useState(false);
  const [showCustodyModal, setShowCustodyModal] = useState(false);
  const [showFindingsModal, setShowFindingsModal] = useState(false);
  const [viewMode, setViewMode] = useState<'add' | 'view'>('add');
  const [allegations, setAllegations] = useState<any[]>([]);
  const [evidenceRecords, setEvidenceRecords] = useState<any[]>([]);
  const [examinationRecords, setExaminationRecords] = useState<any[]>([]);
  const [chainOfCustodyRecords, setChainOfCustodyRecords] = useState<any[]>([]);
  const [findingsRecords, setFindingsRecords] = useState<any[]>([]);
  const [allegationData, setAllegationData] = useState({
    description: "",
    personConcerned: "",
    allegedConduct: "",
    incidentDate: "",
    incidentLocation: "",
    applicableLaw: "",
    estimatedLoss: "",
    investigationQuestions: "",
    scope: "",
    proposedFinding: "",
    findingExplanation: ""
  });
  const [evidenceData, setEvidenceData] = useState({
    title: "",
    type: "",
    description: "",
    source: "",
    dateObtained: "",
    collectedBy: "",
    collectionMethod: "",
    collectionAuthorization: "",
    originalOrCopy: "",
    documentNumber: "",
    condition: "",
    sealReference: "",
    digitalFileName: "",
    digitalFileHash: "",
    storageLocation: "",
    confidentiality: "",
    relevance: ""
  });
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [examinationData, setExaminationData] = useState({
    evidenceId: "",
    examiner: "",
    examinationDate: "",
    examinationType: "",
    objective: "",
    method: "",
    documentsExamined: "",
    observations: "",
    findings: "",
    discrepancies: "",
    comparisonResults: "",
    authenticity: "",
    limitations: "",
    conclusion: "",
    furtherExamination: ""
  });
  const [custodyData, setCustodyData] = useState({
    evidenceId: "",
    eventType: "",
    fromCustodian: "",
    toCustodian: "",
    eventDateTime: "",
    purpose: "",
    previousLocation: "",
    newLocation: "",
    evidenceCondition: "",
    sealNumber: "",
    authorizationReference: "",
    custodyException: ""
  });
  const [findingsFormData, setFindingsFormData] = useState({
    allegationId: "",
    assessmentStandard: "",
    factsEstablished: "",
    supportingEvidence: "",
    contradictoryEvidence: "",
    witnessInformation: "",
    applicableRule: "",
    evidenceReliability: "",
    evidenceGaps: "",
    alternativeExplanations: "",
    proposedFinding: "",
    reasoning: "",
    investigatorRecommendation: ""
  });
  const [planData, setPlanData] = useState({
    scope: "",
    objectives: "",
    investigationPlan: ""
  });
  const [caseDetailsData, setCaseDetailsData] = useState({
    startDate: "",
    targetCompletionDate: ""
  });
  const [isEditingCaseDetails, setIsEditingCaseDetails] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({
    reviewerName: "",
    findings: "",
    recommendation: "",
    decision: "",
    outcome: ""
  });
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeData, setCloseData] = useState({
    responseMessage: "",
    followUpActions: ""
  });
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const fetchInvestigation = async () => {
    try {
      const pathSegments = window.location.pathname.split('/');
      const investigationId = pathSegments[pathSegments.length - 1];

      const token = readToken();
      const response = await fetch(`http://localhost:4000/api/ethics/investigations/${investigationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch investigation');
      }

      const data = await response.json();
      setInvestigation(data);
      setPlanData({
        scope: data.scope || "",
        objectives: data.objectives || "",
        investigationPlan: data.investigationPlan || ""
      });
      setReviewData({
        reviewerName: data.reviewerName || "",
        findings: data.findings || "",
        recommendation: data.recommendation || "",
        decision: data.decision || "",
        outcome: data.outcome || ""
      });

      // Populate evidence from backend data
      if (data.evidence && Array.isArray(data.evidence)) {
        // Map evidence fields to match frontend structure
        const mappedEvidence = data.evidence.map((ev: any) => ({
          title: ev.fileName || 'N/A',
          type: ev.fileType || 'Document',
          description: ev.description || 'N/A',
          source: ev.uploader ? `${ev.uploader.firstName} ${ev.uploader.lastName}` : 'N/A',
          dateObtained: ev.uploadedAt ? new Date(ev.uploadedAt).toISOString().split('T')[0] : 'N/A',
          collectedBy: ev.uploader ? `${ev.uploader.firstName} ${ev.uploader.lastName}` : 'N/A',
          collectionMethod: 'Upload',
          originalOrCopy: 'Original',
          documentNumber: 'N/A',
          condition: 'Good',
          sealReference: 'N/A',
          digitalFileName: ev.fileName || 'N/A',
          digitalFileHash: ev.fileHash || 'N/A',
          storageLocation: ev.filePath || 'N/A',
          confidentiality: 'Standard',
          relevance: 'High'
        }));
        setEvidenceRecords(mappedEvidence);
      }

      // Load allegations from investigationPlan field
      if (data.investigationPlan) {
        try {
          const parsedAllegations = typeof data.investigationPlan === 'string' ? JSON.parse(data.investigationPlan) : data.investigationPlan;
          if (Array.isArray(parsedAllegations)) {
            setAllegations(parsedAllegations);
          }
        } catch (e) {
          console.error('Error parsing allegations:', e);
        }
      }

      // Load evidence records from evidenceDetails field
      if (data.evidenceDetails) {
        try {
          const parsedEvidence = typeof data.evidenceDetails === 'string' ? JSON.parse(data.evidenceDetails) : data.evidenceDetails;
          if (Array.isArray(parsedEvidence)) {
            setEvidenceRecords(parsedEvidence);
          }
        } catch (e) {
          console.error('Error parsing evidence records:', e);
        }
      }

      // Load findings from investigation findings field
      if (data.findings) {
        try {
          // If findings is a string, parse it as JSON
          const parsedFindings = typeof data.findings === 'string' ? JSON.parse(data.findings) : data.findings;
          if (Array.isArray(parsedFindings)) {
            setFindingsRecords(parsedFindings);
          }
        } catch (e) {
          console.error('Error parsing findings:', e);
        }
      }

      // Fetch messages for the complaint
      if (data.complaintId) {
        await fetchMessages(data.complaintId);
      }
    } catch (err) {
      console.error('Error fetching investigation:', err);
      setError('Failed to load investigation details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get user roles
    const roles = getCurrentUserRoles();
    setUserRoles(roles);

    fetchInvestigation();
  }, []);

  // Check for view=report parameter to auto-open report modal
  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'report' && investigation && investigation.status === 'Report Submitted') {
      setShowReportModal(true);
    }
  }, [searchParams, investigation]);

  const isInvestigator = () => {
    return userRoles.some(role => role === 'ethics_officer' || role === 'ethics_anti_corruption');
  };

  const isEthicsDepartment = () => {
    return userRoles.some(role => role === 'ethics_anti_corruption');
  };

  const isEthicsOfficer = () => {
    return userRoles.some(role => role === 'ethics_officer');
  };

  const handlePlanSubmit = async () => {
    if (!investigation) return;

    try {
      const token = readToken();
      
      // First, submit the investigation plan
      const response = await fetch(`http://localhost:4000/api/ethics/investigations/${investigation.id}/plan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        throw new Error('Failed to update investigation plan');
      }

      // Then, update the status to "Under Investigation"
      const statusResponse = await fetch(`http://localhost:4000/api/ethics/investigations/${investigation.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: "Under Investigation" }),
      });

      if (!statusResponse.ok) {
        console.error('Failed to update status, but plan was submitted');
      }

      setShowPlanModal(false);
      // Refresh investigation
      const fetchResponse = await fetch(`http://localhost:4000/api/ethics/investigations/${investigation.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (fetchResponse.ok) {
        const data = await fetchResponse.json();
        setInvestigation(data);
      }
    } catch (error) {
      console.error('Error updating investigation plan:', error);
      alert('Failed to update investigation plan');
    }
  };

  const handleAllegationSubmit = () => {
    setAllegations([...allegations, {...allegationData}]);
    setAllegationData({
      description: "",
      personConcerned: "",
      allegedConduct: "",
      incidentDate: "",
      incidentLocation: "",
      applicableLaw: "",
      estimatedLoss: "",
      investigationQuestions: "",
      scope: "",
      proposedFinding: "",
      findingExplanation: ""
    });
    setShowAllegationModal(false);
  };

  const handleEvidenceSubmit = async () => {
    if (!investigation) return;

    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";

      console.log('Saving evidence with data:', evidenceData);
      console.log('Investigation ID:', investigation.id);
      console.log('Files to upload:', evidenceFiles);

      // Upload files if any
      if (evidenceFiles.length > 0) {
        const formData = new FormData();
        evidenceFiles.forEach(file => {
          formData.append('files', file);
        });
        formData.append('evidenceData', JSON.stringify(evidenceData));

        const uploadResponse = await fetch(`http://localhost:4000/api/ethics/investigations/${investigation.id}/evidence/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('Error uploading files:', errorText);
          throw new Error(`Failed to upload files: ${uploadResponse.status} - ${errorText}`);
        }

        const savedEvidence = await uploadResponse.json();
        console.log('Saved evidence with files:', savedEvidence);

        // Add the saved evidence to local state
        setEvidenceRecords([...evidenceRecords, {
          ...evidenceData,
          id: savedEvidence.id,
          files: savedEvidence.files || []
        }]);

        setEvidenceFiles([]);
      } else {
        const response = await fetch(`http://localhost:4000/api/ethics/investigations/${investigation.id}/evidence`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(evidenceData),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Failed to save evidence: ${response.status} - ${errorText}`);
        }

        const savedEvidence = await response.json();
        console.log('Saved evidence:', savedEvidence);

        // Add the saved evidence to local state
        setEvidenceRecords([...evidenceRecords, {
          ...evidenceData,
          id: savedEvidence.id
        }]);
      }

      setEvidenceData({
        title: "",
        type: "",
        description: "",
        source: "",
        dateObtained: "",
        collectedBy: "",
        collectionMethod: "",
        collectionAuthorization: "",
        originalOrCopy: "",
        documentNumber: "",
        condition: "",
        sealReference: "",
        digitalFileName: "",
        digitalFileHash: "",
        storageLocation: "",
        confidentiality: "",
        relevance: ""
      });
      setShowEvidenceModal(false);

      // Refresh investigation data to get updated evidence list
      await fetchInvestigation();
    } catch (error) {
      console.error('Error saving evidence:', error);
      alert(`Failed to save evidence. ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };


  const handleFindingsSubmit = async () => {
    if (!investigation) return;

    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";

      console.log('Saving findings with data:', findingsFormData);
      console.log('Investigation ID:', investigation.id);

      // Update investigation with findings data
      const response = await fetch(`http://localhost:4000/api/ethics/investigations/${investigation.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          findings: findingsFormData.factsEstablished || investigation.findings,
          recommendation: findingsFormData.investigatorRecommendation || investigation.recommendation,
          decision: findingsFormData.reasoning || investigation.decision,
          outcome: findingsFormData.proposedFinding || investigation.outcome,
        }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to save findings: ${response.status} - ${errorText}`);
      }

      const updatedInvestigation = await response.json();
      console.log('Updated investigation:', updatedInvestigation);

      // Add to local findings records
      setFindingsRecords([...findingsRecords, {...findingsFormData}]);
      setInvestigation(updatedInvestigation);

      setFindingsFormData({
        allegationId: "",
        assessmentStandard: "",
        factsEstablished: "",
        supportingEvidence: "",
        contradictoryEvidence: "",
        witnessInformation: "",
        applicableRule: "",
        evidenceReliability: "",
        evidenceGaps: "",
        alternativeExplanations: "",
        proposedFinding: "",
        reasoning: "",
        investigatorRecommendation: ""
      });
      setShowFindingsModal(false);
    } catch (error) {
      console.error('Error saving findings:', error);
      alert(`Failed to save findings. ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  const handleReviewSubmit = async () => {
    if (!investigation) return;

    try {
      const token = readToken();
      const response = await fetch(`http://localhost:4000/api/ethics/investigations/${investigation.id}/review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) {
        throw new Error('Failed to review investigation');
      }

      setShowReviewModal(false);
      // Refresh investigation
      const fetchResponse = await fetch(`http://localhost:4000/api/ethics/investigations/${investigation.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (fetchResponse.ok) {
        const data = await fetchResponse.json();
        setInvestigation(data);
      }
    } catch (error) {
      console.error('Error reviewing investigation:', error);
      alert('Failed to review investigation');
    }
  };

  const handleCaseDetailsEdit = () => {
    if (!investigation) return;
    const startDate = investigation.startDate ? investigation.startDate.split('T')[0] : "";
    let targetCompletionDate = investigation.targetCompletionDate ? investigation.targetCompletionDate.split('T')[0] : "";
    
    // Auto-calculate target completion date if not set or if interval is not 5 days
    if (startDate) {
      const start = new Date(startDate);
      const target = new Date(start);
      target.setDate(target.getDate() + 5);
      targetCompletionDate = target.toISOString().split('T')[0];
    }
    
    setCaseDetailsData({
      startDate,
      targetCompletionDate
    });
    setIsEditingCaseDetails(true);
  };

  const handleCaseDetailsSave = async () => {
    if (!investigation) return;

    console.log('=== Case Details Save Started ===');
    console.log('Investigation ID:', investigation.id);
    console.log('Case details data:', caseDetailsData);

    try {
      const token = readToken();
      console.log('Token exists:', !!token);
      console.log('Token:', token ? token.substring(0, 20) + '...' : 'none');

      // Decode JWT to check user roles
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const decoded = JSON.parse(jsonPayload);
          console.log('Decoded JWT user:', decoded);
          console.log('User roles:', decoded.roles || decoded.user?.roles);
          console.log('User roles array:', JSON.stringify(decoded.roles || decoded.user?.roles));
        } catch (e) {
          console.error('Failed to decode JWT:', e);
        }
      }

      const response = await fetch(`http://localhost:4000/api/ethics/anticorruption/investigations/${investigation.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(caseDetailsData),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('=== Update Failed ===');
        console.error('Error text:', errorText);
        console.error('Error status:', response.status);
        try {
          const errorJson = JSON.parse(errorText);
          console.error('Parsed error JSON:', errorJson);
          throw new Error(errorJson.message || errorText || 'Failed to update case details');
        } catch {
          throw new Error(errorText || 'Failed to update case details');
        }
      }

      console.log('=== Update Success ===');
      setIsEditingCaseDetails(false);
      // Refresh investigation
      const fetchResponse = await fetch(`http://localhost:4000/api/ethics/anticorruption/investigations/${investigation.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (fetchResponse.ok) {
        const data = await fetchResponse.json();
        setInvestigation(data);
        console.log('Investigation refreshed successfully');
      }
    } catch (error) {
      console.error('=== Case Details Save Error ===');
      console.error('Error:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      alert(error instanceof Error ? error.message : 'Failed to update case details');
    }
    console.log('=== Case Details Save Ended ===');
  };

  const handleCaseDetailsCancel = () => {
    setIsEditingCaseDetails(false);
  };

  const handleCloseSubmit = async () => {
    if (!investigation) return;

    try {
      const token = readToken();
      const response = await fetch(`http://localhost:4000/api/ethics/investigations/${investigation.id}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(closeData),
      });

      if (!response.ok) {
        throw new Error('Failed to close investigation');
      }

      setShowCloseModal(false);
      // Refresh investigation
      const fetchResponse = await fetch(`http://localhost:4000/api/ethics/investigations/${investigation.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (fetchResponse.ok) {
        const data = await fetchResponse.json();
        setInvestigation(data);
      }
    } catch (error) {
      console.error('Error closing investigation:', error);
      alert('Failed to close investigation');
    }
  };

  const getInvestigatorName = () => {
    if (!investigation?.assignedInvestigator) return "-";
    if (typeof investigation.assignedInvestigator === 'string') {
      return investigation.assignedInvestigator;
    }
    return `${investigation.assignedInvestigator.firstName} ${investigation.assignedInvestigator.lastName}`;
  };

  const getSupervisorName = () => {
    if (!investigation?.assignedSupervisor) return "-";
    if (typeof investigation.assignedSupervisor === 'string') {
      return investigation.assignedSupervisor;
    }
    const supervisor = investigation.assignedSupervisor as { firstName: string; lastName: string };
    return `${supervisor.firstName} ${supervisor.lastName}`;
  };

  const fetchMessages = async (complaintId: string) => {
    try {
      const token = readToken();
      const response = await fetch(`http://localhost:4000/api/ethics/anticorruption/reports/${complaintId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setMessages(data);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!investigation || !newMessage.trim()) return;

    setSending(true);
    try {
      const token = readToken();
      const response = await fetch(`http://localhost:4000/api/ethics/anticorruption/reports/${investigation.complaintId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: newMessage.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewMessage("");
        setMessages(prev => [...prev, data]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Tab Components
  function CaseDetailsTab({ investigation, isEditing, onEdit, onSave, onCancel, caseDetailsData, setCaseDetailsData }: { 
    investigation: Investigation; 
    isEditing: boolean;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    caseDetailsData: any;
    setCaseDetailsData: any;
  }) {
    console.log('=== CaseDetailsTab Render ===');
    console.log('isEditing:', isEditing);
    console.log('caseDetailsData:', caseDetailsData);

    const isOverdue = () => {
    if (!investigation || !investigation.targetCompletionDate) return false;
    if (investigation.status === 'Closed') return false;
    const targetDate = new Date(investigation.targetCompletionDate);
    const today = new Date();
    return targetDate < today;
  };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">የምርመራ መለያ እና የጉዳይ ዝርዝሮች</h2>
          {isInvestigator() && investigation.status !== 'Closed' && (
            !isEditing ? (
              <Button className="gap-2" onClick={onEdit}>
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button onClick={onSave}>Save</Button>
              </div>
            )
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">Investigation ID</p>
            <p className="font-medium text-gray-900">{investigation.caseNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Complaint Reference No.</p>
            <p className="font-medium text-gray-900">{investigation.complaintReference}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">የጥቆማ አቅራቢ ስም</p>
            <p className="font-medium text-gray-900">
              {investigation.complaint?.complainantName || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">የጥቆማ ምድብ</p>
            <p className="font-medium text-gray-900">{investigation.category}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">የምርመራ ሁኔታ</p>
            <div className="flex items-center gap-2">
              <Badge className={statusColors[investigation.status] || "bg-gray-100 text-gray-800"}>
                {investigation.status === 'Under Investigation' ? 'በምርመራ ላይ ነዉ' : investigation.status}
              </Badge>
              {isOverdue() && (
                <Badge className="bg-red-100 text-red-800 animate-pulse">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Assigned Investigator</p>
            <p className="font-medium text-gray-900">{getInvestigatorName()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">ምርመራዉ የሚጀምርበት ቀን</p>
            {isEditing ? (
              <Input
                type="date"
                value={caseDetailsData.startDate}
                onChange={(e) => {
                  const startDate = e.target.value;
                  setCaseDetailsData({...caseDetailsData, startDate});
                  // Auto-calculate target completion date (5 days after start date)
                  if (startDate) {
                    const start = new Date(startDate);
                    const target = new Date(start);
                    target.setDate(target.getDate() + 5);
                    const targetDate = target.toISOString().split('T')[0];
                    setCaseDetailsData((prev: typeof caseDetailsData) => ({...prev, targetCompletionDate: targetDate}));
                  }
                }}
                className="mt-1"
              />
            ) : (
              <p className="font-medium text-gray-900">{investigation.startDate ? investigation.startDate.split('T')[0] : 'N/A'}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500">ምርመራዉ የሚያልቅበት ቀን</p>
            {isEditing ? (
              <Input
                type="date"
                value={caseDetailsData.targetCompletionDate}
                onChange={(e) => setCaseDetailsData({...caseDetailsData, targetCompletionDate: e.target.value})}
                className="mt-1"
              />
            ) : (
              <p className="font-medium text-gray-900">{investigation.targetCompletionDate ? investigation.targetCompletionDate.split('T')[0] : 'N/A'}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  function InvestigationPlanTab({ investigation }: { investigation: Investigation }) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">የምርመራዉ አላማ</h2>
        {investigation.scope && (
          <div>
            <p className="text-sm text-gray-500 mb-2">የምርመራዉ ዳራ</p>
            <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{investigation.scope}</p>
          </div>
        )}
        {investigation.objectives && (
          <div>
            <p className="text-sm text-gray-500 mb-2">የምርመራዉ አላማ</p>
            <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{investigation.objectives}</p>
          </div>
        )}
        {investigation.investigationPlan && (
          <div>
            <p className="text-sm text-gray-500 mb-2">የምርመራዉ እቅድ</p>
            <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{investigation.investigationPlan}</p>
          </div>
        )}
        {!investigation.scope && !investigation.objectives && !investigation.investigationPlan && (
          <div className="text-center text-gray-500 py-8">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No investigation plan added yet</p>
          </div>
        )}
      </div>
    );
  }

  function FindingsTab({ investigation }: { investigation: Investigation }) {
    const canAdd = isEthicsOfficer();
    const showApprovedFindings = investigation.status === 'Approved' || investigation.status === 'Under Review';
    const hasInvestigationFindings = investigation.findings || investigation.decision || investigation.recommendation || investigation.outcome;

    const handleSaveFindings = async () => {
      if (!investigation) return;
      try {
        const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
        const response = await fetch(`http://localhost:4000/api/ethics/investigations/${investigation.id}/findings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ findingsRecords }),
        });
        if (!response.ok) {
          throw new Error('Failed to save findings');
        }
        alert('ግኝትና ግምገማ በትክክል ተቀምጧል');
      } catch (error) {
        console.error('Error saving findings:', error);
        alert('Failed to save findings');
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">ግኝትና ግምገማ</h2>
          <div className="flex gap-2">
            {canAdd && !showApprovedFindings && (
              <Button className="gap-2" onClick={() => { setViewMode('add'); setShowFindingsModal(true); }}>
                <Plus className="w-4 h-4" />
                Add Finding
              </Button>
            )}
            {findingsRecords.length > 0 && !showApprovedFindings && (
              <Button className="gap-2 bg-green-600 hover:bg-green-700" onClick={handleSaveFindings}>
                <FileCheck className="w-4 h-4" />
                Save
              </Button>
            )}
          </div>
        </div>

        {/* Show investigation-level findings if they exist */}
        {hasInvestigationFindings && (
          <div className="space-y-4">
            {investigation.findings && (
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold text-gray-900 mb-2">ግኝት</h3>
                <p className="text-gray-900 whitespace-pre-wrap">{investigation.findings}</p>
              </div>
            )}
            {investigation.decision && (
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold text-gray-900 mb-2">የምርመራዉ ማጠቃለያ</h3>
                <p className="text-gray-900 whitespace-pre-wrap">{investigation.decision}</p>
              </div>
            )}
            {investigation.recommendation && (
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold text-gray-900 mb-2">አስተያየት</h3>
                <p className="text-gray-900 whitespace-pre-wrap">{investigation.recommendation}</p>
              </div>
            )}
            {investigation.outcome && (
              <div className="border rounded-lg p-4 bg-green-50">
                <h3 className="font-semibold text-gray-900 mb-2">ዉጤት</h3>
                <Badge className="bg-green-100 text-green-800">{investigation.outcome}</Badge>
              </div>
            )}
          </div>
        )}

        {/* Show local findings records for draft status */}
        {!showApprovedFindings && findingsRecords.length > 0 ? (
          <div className="space-y-4">
            {findingsRecords.map((finding, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">ግኝት #{index + 1}</h3>
                    <Badge className="mt-1 bg-red-100 text-red-800">{finding.proposedFinding || 'Not specified'}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Allegation ID</p>
                    <p className="text-gray-900">{finding.allegationId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">የግምገማ ደረጃ</p>
                    <p className="text-gray-900">{finding.assessmentStandard || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-500">በእውነታዎች ተመስርተዋል</p>
                    <p className="text-gray-900">{finding.factsEstablished || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">ደጋፊ ማስረጃ</p>
                    <p className="text-gray-900">{finding.supportingEvidence || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">የሚቃረኑ ማስረጃዎች</p>
                    <p className="text-gray-900">{finding.contradictoryEvidence || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-500">የማስረጃዉ እዉነተኛነት</p>
                    <p className="text-gray-900">{finding.evidenceReliability || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-500">የማስረጃ ጋብ</p>
                    <p className="text-gray-900">{finding.evidenceGaps || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-500">አማራጭ ገለፃ</p>
                    <p className="text-gray-900">{finding.alternativeExplanations || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">የመርማሪዉ አስተያየት</p>
                    <p className="text-gray-900">{finding.investigatorRecommendation || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-500">ምክንያት</p>
                    <p className="text-gray-900">{finding.reasoning || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <Scale className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No findings recorded yet</p>
            <p className="text-sm mt-2">Click "Add Finding" to record investigation findings</p>
          </div>
        )}
      </div>
    );
  }

  function MessagesTab({ investigation }: { investigation: Investigation }) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">ከቅሬታ አቅራቢ ጋር የተደረገ ውይይት</h2>
        <Card>
          <CardContent className="space-y-4 pt-6">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No messages yet. Start the conversation by sending a message below.
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderType === 'COMPLAINANT' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.senderType === 'COMPLAINANT'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="text-xs opacity-75 mb-1">
                        {message.senderType === 'COMPLAINANT'
                          ? 'Complainant'
                          : `${message.sender?.firstName || ''} ${message.sender?.lastName || ''} (${message.senderRole || 'Ethics Officer'})`}
                      </div>
                      <div className="whitespace-pre-wrap">{message.message}</div>
                      <div className="text-xs opacity-75 mt-1">
                        {new Date(message.sentAt).toLocaleString()}
                        {message.readAt && ' • Read'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Message Input */}
            <div className="pt-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                  rows={3}
                />
              </div>
              <div className="flex justify-end mt-2">
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function AllegationsTab({ investigation }: { investigation: Investigation }) {
    const canAdd = isEthicsOfficer();

    const handleSaveAllegations = async () => {
      if (!investigation) return;
      try {
        const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
        const response = await fetch(`http://localhost:4000/api/ethics/investigations/${investigation.id}/allegations`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ allegations }),
        });
        if (!response.ok) {
          throw new Error('Failed to save allegations');
        }
        alert('የክስ ዝርዝር በትክክል ተቀምጧል');
      } catch (error) {
        console.error('Error saving allegations:', error);
        alert('Failed to save allegations');
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">የክስ ዝርዝር</h2>
          <div className="flex gap-2">
            {canAdd && (
              <Button className="gap-2" onClick={() => { setViewMode('add'); setShowAllegationModal(true); }}>
                <Plus className="w-4 h-4" />
                Add Allegation
              </Button>
            )}
            {allegations.length > 0 && (
              <Button className="gap-2 bg-green-600 hover:bg-green-700" onClick={handleSaveAllegations}>
                <FileCheck className="w-4 h-4" />
                Save
              </Button>
            )}
          </div>
        </div>
        {allegations.length > 0 ? (
          <div className="space-y-4">
            {allegations.map((allegation, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">ክስ #{index + 1}</h3>
                    <Badge className="mt-1 bg-blue-100 text-blue-800">{allegation.allegedConduct || 'Not specified'}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">ዝርዝር</p>
                    <p className="text-gray-900">{allegation.description || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Person/Office Concerned</p>
                    <p className="text-gray-900">{allegation.personConcerned || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">ጉዳዩ የተፈጠረበት ቀን</p>
                    <p className="text-gray-900">{allegation.incidentDate || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">የተፈጠረበት ቦታ</p>
                    <p className="text-gray-900">{allegation.incidentLocation || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-500">የምርመራ ጥያቄዎች</p>
                    <p className="text-gray-900">{allegation.investigationQuestions || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-500">ዳራ</p>
                    <p className="text-gray-900">{allegation.scope || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No allegations recorded yet</p>
            <p className="text-sm mt-2">Click "Add Allegation" to create a new allegation record</p>
          </div>
        )}
      </div>
    );
  }

  function EvidenceRegisterTab({ investigation }: { investigation: Investigation }) {
    const canAdd = isEthicsOfficer();

    const handleSaveEvidence = async () => {
      if (!investigation) return;
      try {
        const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
        const response = await fetch(`http://localhost:4000/api/ethics/investigations/${investigation.id}/evidence-batch`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ evidenceRecords }),
        });
        if (!response.ok) {
          throw new Error('Failed to save evidence');
        }
        alert('የማስረጃ ዝርዝር በትክክል ተቀምጧል');
      } catch (error) {
        console.error('Error saving evidence:', error);
        alert('Failed to save evidence');
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">የማስረጃ ዝርዝር</h2>
          <div className="flex gap-2">
            {canAdd && (
              <Button className="gap-2" onClick={() => { setViewMode('add'); setShowEvidenceModal(true); }}>
                <Plus className="w-4 h-4" />
                Add Evidence
              </Button>
            )}
            {evidenceRecords.length > 0 && (
              <Button className="gap-2 bg-green-600 hover:bg-green-700" onClick={handleSaveEvidence}>
                <FileCheck className="w-4 h-4" />
                Save
              </Button>
            )}
          </div>
        </div>
        {evidenceRecords.length > 0 ? (
          <div className="space-y-4">
            {evidenceRecords.map((evidence, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{evidence.title || `Evidence #${index + 1}`}</h3>
                    <Badge className="mt-1 bg-green-100 text-green-800">{evidence.type || 'Not specified'}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">ዝርዝር</p>
                    <p className="text-gray-900">{evidence.description || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">ምንጭ</p>
                    <p className="text-gray-900">{evidence.source || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">የተገኘበት ቀን</p>
                    <p className="text-gray-900">{evidence.dateObtained || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">ያዘጋጀዉ አካል</p>
                    <p className="text-gray-900">{evidence.collectedBy || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">የአዘገጃጀት ዘዴ</p>
                    <p className="text-gray-900">{evidence.collectionMethod || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Original/Copy</p>
                    <p className="text-gray-900">{evidence.originalOrCopy || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500"></p>
                    <p className="text-gray-900">{evidence.storageLocation || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-500"></p>
                    <p className="text-gray-900">{evidence.relevance || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <FileCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No evidence registered yet</p>
            <p className="text-sm mt-2">Click "Add Evidence" to register a new evidence item</p>
          </div>
        )}
      </div>
    );
  }


  function ExaminationTab({ investigation }: { investigation: Investigation }) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Section F: Document Examination and Analysis</h2>
          <Button className="gap-2" onClick={() => setShowExaminationModal(true)}>
            <Plus className="w-4 h-4" />
            Add Examination
          </Button>
        </div>
        {examinationRecords.length > 0 ? (
          <div className="space-y-4">
            {examinationRecords.map((examination, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">Examination #{index + 1}</h3>
                    <Badge className="mt-1 bg-orange-100 text-orange-800">{examination.examinationType || 'Not specified'}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Evidence ID</p>
                    <p className="text-gray-900">{examination.evidenceId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Examiner</p>
                    <p className="text-gray-900">{examination.examiner || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Examination Date</p>
                    <p className="text-gray-900">{examination.examinationDate || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Examination Type</p>
                    <p className="text-gray-900">{examination.examinationType || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-500">Objective</p>
                    <p className="text-gray-900">{examination.objective || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-500">Method</p>
                    <p className="text-gray-900">{examination.method || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-500">Observations</p>
                    <p className="text-gray-900">{examination.observations || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-500">Findings</p>
                    <p className="text-gray-900">{examination.findings || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-500">Conclusion</p>
                    <p className="text-gray-900">{examination.conclusion || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <Microscope className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No examinations recorded yet</p>
            <p className="text-sm mt-2">Click "Add Examination" to create a new examination record</p>
          </div>
        )}
      </div>
    );
  }

  function ChainOfCustodyTab({ investigation }: { investigation: Investigation }) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Section G: Chain-of-Custody Details</h2>
          <Button className="gap-2" onClick={() => setShowCustodyModal(true)}>
            <Plus className="w-4 h-4" />
            Add Custody Event
          </Button>
        </div>
        {chainOfCustodyRecords.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chainOfCustodyRecords.map((record, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500">Event #{index + 1}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Evidence ID:</span> {record.evidenceId}
                  </div>
                  <div>
                    <span className="font-medium">Transfer Date:</span> {record.transferDate}
                  </div>
                  <div>
                    <span className="font-medium">From:</span> {record.fromCustodian}
                  </div>
                  <div>
                    <span className="font-medium">To:</span> {record.toCustodian}
                  </div>
                  <div>
                    <span className="font-medium">Purpose:</span> {record.purpose}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No custody events recorded yet</p>
            <p className="text-sm mt-2">Click "Add Custody Event" to record evidence transfer</p>
          </div>
        )}
      </div>
    );
  }

  function InvestigationReportTab({ investigation }: { investigation: Investigation }) {
    const [showReportModal, setShowReportModal] = useState(false);
    const [conclusionData, setConclusionData] = useState({
      executiveSummary: "",
      overallConclusion: "",
      recommendedMeasures: "",
      furtherAction: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isApproved, setIsApproved] = useState(false);
    const [isClosingComplaint, setIsClosingComplaint] = useState(false);
    const [localReviewData, setLocalReviewData] = useState({
      reviewerName: "",
      findings: "",
      recommendation: "",
      decision: "",
      outcome: ""
    });
    const [activities, setActivities] = useState([
      { id: 1, description: "", officer: "", date: "", result: "" },
      { id: 2, description: "", officer: "", date: "", result: "" },
      { id: 3, description: "", officer: "", date: "", result: "" }
    ]);
    const [reportEvidenceRecords, setReportEvidenceRecords] = useState<any[]>([]);
    const [reportFindingsRecords, setReportFindingsRecords] = useState<any[]>([]);
    const [reportAllegations, setReportAllegations] = useState<any[]>([]);

    // Initialize conclusionData with existing investigation data
    useEffect(() => {
      if (investigation) {
        console.log('InvestigationReportTab: Initializing with investigation data', investigation);

        setConclusionData({
          executiveSummary: investigation.findings || "",
          overallConclusion: investigation.findings || "",
          recommendedMeasures: investigation.recommendation || "",
          furtherAction: investigation.decision || ""
        });
        const currentUserName = getCurrentUserName();
        setLocalReviewData({
          reviewerName: investigation.reviewerName || currentUserName || "",
          findings: investigation.findings || "",
          recommendation: investigation.recommendation || "",
          decision: investigation.decision || "",
          outcome: investigation.outcome || ""
        });

        // Populate activities table based on user role
        if (isEthicsOfficer()) {
          // Ethics Officer: Fill name of ethics officer and summary of investigation
          setActivities([
            { id: 1, description: "የምርመራ ማጠቃለያ", officer: currentUserName || "", date: new Date().toISOString().split('T')[0], result: "ተጠናቅቋል" }
          ]);
        } else if (isEthicsDepartment()) {
          // Ethics Anti-Corruption: Populate assigned, ethics officer, review and approve
          const investigatorName = typeof investigation.assignedInvestigator === 'object' 
            ? `${investigation.assignedInvestigator.firstName} ${investigation.assignedInvestigator.lastName}`
            : investigation.assignedInvestigator || "";
          setActivities([
            { id: 1, description: "መመደብ", officer: currentUserName || "", date: investigation.startDate || "", result: "ተመድቧል" },
            { id: 2, description: "የምርመራ አማካሪ", officer: investigatorName, date: "", result: "በሂደት ላይ" },
            { id: 3, description: "ግምገማ እና ማፅደቅ", officer: investigation.reviewerName || "", date: investigation.reviewDate || "", result: "ግምገማ ያስፈልጋል" }
          ]);
        } else {
          // Complainant: Populate complaints and his name
          const complainantName = investigation.complaint?.complainantName || "";
          setActivities([
            { id: 1, description: "ጥቆማ", officer: complainantName, date: investigation.complaint?.incidentDate || "", result: "ተልኳል" }
          ]);
        }

        // If there are existing activities from backend, use those instead
        if (investigation.activities && investigation.activities.length > 0) {
          const mappedActivities = investigation.activities.map((activity: any, index: number) => ({
            id: activity.id || index + 1,
            description: activity.description || "",
            officer: activity.conductedByUser ? `${activity.conductedByUser.firstName} ${activity.conductedByUser.lastName}` : activity.conductedBy || "",
            date: activity.activityDate ? new Date(activity.activityDate).toISOString().split('T')[0] : "",
            result: activity.outcomes || ""
          }));
          setActivities(mappedActivities);
        }

        // Initialize evidence from backend data
        console.log('Investigation evidence:', investigation.evidence);
        if (investigation.evidence && Array.isArray(investigation.evidence) && investigation.evidence.length > 0) {
          const mappedEvidence = investigation.evidence.map((ev: any) => ({
            title: ev.fileName || 'N/A',
            type: ev.fileType || 'Document',
            description: ev.description || 'N/A',
            source: ev.uploader ? `${ev.uploader.firstName} ${ev.uploader.lastName}` : 'N/A',
            dateObtained: ev.uploadedAt ? new Date(ev.uploadedAt).toISOString().split('T')[0] : 'N/A',
            collectedBy: ev.uploader ? `${ev.uploader.firstName} ${ev.uploader.lastName}` : 'N/A',
            collectionMethod: 'Upload',
            originalOrCopy: 'Original',
            documentNumber: 'N/A',
            condition: 'Good',
            sealReference: 'N/A',
            digitalFileName: ev.fileName || 'N/A',
            digitalFileHash: ev.fileHash || 'N/A',
            storageLocation: ev.filePath || 'N/A',
            confidentiality: 'Standard',
            relevance: 'High'
          }));
          console.log('Setting report evidence records:', mappedEvidence);
          setReportEvidenceRecords(mappedEvidence);
        } else {
          console.log('No evidence found or empty array');
          setReportEvidenceRecords([]);
        }

        // Initialize allegations from investigationPlan field
        if (investigation.investigationPlan) {
          try {
            const parsedAllegations = typeof investigation.investigationPlan === 'string' ? JSON.parse(investigation.investigationPlan) : investigation.investigationPlan;
            if (Array.isArray(parsedAllegations)) {
              setReportAllegations(parsedAllegations);
            }
          } catch (e) {
            console.error('Error parsing allegations in report tab:', e);
          }
        }

        // Initialize findings from investigation findings field
        if (investigation.findings) {
          try {
            const parsedFindings = typeof investigation.findings === 'string' ? JSON.parse(investigation.findings) : investigation.findings;
            if (Array.isArray(parsedFindings)) {
              setReportFindingsRecords(parsedFindings);
            }
          } catch (e) {
            console.error('Error parsing findings in report tab:', e);
          }
        }

        // Initialize findings from investigation data whenever they exist
        if (investigation.findings || investigation.decision || investigation.recommendation || investigation.outcome) {
          setReportFindingsRecords([{
            allegationId: 'N/A',
            assessmentStandard: 'N/A',
            factsEstablished: investigation.findings || 'N/A',
            supportingEvidence: 'N/A',
            contradictoryEvidence: 'N/A',
            witnessInformation: 'N/A',
            applicableRule: 'N/A',
            evidenceReliability: 'N/A',
            evidenceGaps: 'N/A',
            alternativeExplanations: 'N/A',
            proposedFinding: investigation.outcome || 'N/A',
            reasoning: investigation.decision || 'N/A',
            investigatorRecommendation: investigation.recommendation || 'N/A'
          }]);
        }

        setIsApproved(investigation.status === 'Approved');
      }
    }, [investigation]);

    const handleSubmitReport = async () => {
      if (!investigation) return;

      setIsSubmitting(true);
      try {
        const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
        
        const response = await fetch(`http://localhost:4000/api/ethics/investigations/${investigation.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            findings: isEthicsDepartment() ? localReviewData.findings : conclusionData.overallConclusion,
            recommendation: isEthicsDepartment() ? localReviewData.recommendation : conclusionData.recommendedMeasures,
            decision: isEthicsDepartment() ? localReviewData.decision : conclusionData.furtherAction,
            outcome: localReviewData.outcome,
            reviewerName: localReviewData.reviewerName,
            status: isEthicsDepartment() ? 'Approved' : 'Report Submitted',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to submit report');
        }

        // Refresh investigation data
        const updatedInvestigation = await response.json();
        setInvestigation(updatedInvestigation);
        if (isEthicsDepartment()) {
          setIsApproved(true);
        }
        setShowReportModal(false);
        
        // Show success message
        alert(isEthicsDepartment() ? 'Report approved successfully' : 'Report submitted successfully for review');
      } catch (error) {
        console.error('Error submitting report:', error);
        alert('Failed to submit report. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleCloseComplaint = async () => {
      if (!investigation || !investigation.complaintId) return;

      setIsClosingComplaint(true);
      try {
        const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
        
        const response = await fetch(`http://localhost:4000/api/ethics/anticorruption/reports/${investigation.complaintId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'Closed',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to close complaint');
        }

        alert('Complaint closed successfully');
        router.push('/ethics/anticorruption');
      } catch (error) {
        console.error('Error closing complaint:', error);
        alert('Failed to close complaint. Please try again.');
      } finally {
        setIsClosingComplaint(false);
      }
    };

    const canAdd = !isEthicsDepartment();

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Section I: Investigation Report</h2>
        </div>

        {/* Report Content - Letter Format */}
        <div className="border-2 border-gray-800 p-8 space-y-6 bg-white">
          {/* 1. Institution Header */}
          <div className="text-center border-b-2 border-gray-800 pb-4">
            <h1 className="text-xl font-bold">FEDERAL CIVIL SERVICE COMMISSION (FCSC)</h1>
            <h2 className="text-lg font-semibold mt-2">FEEDBACK AND COMPLAINT MANAGEMENT SYSTEM</h2>
            <p className="text-sm mt-2">Addis Ababa, Ethiopia</p>
            <p className="text-sm">Email: ethics@fcsc.gov.et | Phone: +251-11-XXX-XXXX</p>
          </div>

          {/* 2. Letter Information */}
          <div className="grid grid-cols-2 gap-4 text-sm mt-6">
            <div>
              <span className="font-semibold">Letter Number:</span> {investigation.caseNumber || investigation.id || '____________________'}
            </div>
            <div>
              <span className="font-semibold">Date:</span> {new Date().toLocaleDateString()}
            </div>
          </div>

          {/* 3. Recipient Information */}
          <div className="mt-6 text-sm">
            <span className="font-semibold">To:</span>
            <p className="mt-1">
              {investigation.complaint?.complainantName || '____________________'}
            </p>
            <p>{investigation.complaint?.complainantEmail || '____________________'}</p>
          </div>

          {/* 5. Complaint Details */}
          <div className="mt-6 text-sm">
            <h4 className="font-bold mb-3">የቅሬታ ዝርዝሮች / Complaint Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-semibold">Category:</span> {investigation.category || '____________________'}
              </div>
              <div>
                <span className="font-semibold">Submission Date:</span> {investigation.complaint?.incidentDate || '____________________'}
              </div>
              <div className="col-span-2">
                <span className="font-semibold">Subject:</span> {investigation.complaint?.subject || '____________________'}
              </div>
              <div className="col-span-2">
                <span className="font-semibold">Description:</span>
                <p className="mt-1 p-2 border min-h-20 whitespace-pre-wrap">{investigation.complaint?.description || '____________________'}</p>
              </div>
            </div>
          </div>

          {/* Case Details */}
          <div className="mt-6 text-sm">
            <h4 className="font-bold mb-3">የምርመራ መለያ እና የጉዳይ ዝርዝሮች / Case Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-semibold">Status:</span> {investigation.status || '____________________'}
              </div>
              <div>
                <span className="font-semibold">Category:</span> {investigation.category || '____________________'}
              </div>
              <div>
                <span className="font-semibold">Priority:</span> {investigation.priority || '____________________'}
              </div>
              <div>
                <span className="font-semibold">Assigned Investigator:</span> {typeof investigation.assignedInvestigator === 'object' ? `${investigation.assignedInvestigator.firstName} ${investigation.assignedInvestigator.lastName}` : investigation.assignedInvestigator || '____________________'}
              </div>
              <div>
                <span className="font-semibold">Start Date:</span> {investigation.startDate || '____________________'}
              </div>
              <div>
                <span className="font-semibold">Target Completion Date:</span> {investigation.targetCompletionDate || '____________________'}
              </div>
              <div className="col-span-2">
                <span className="font-semibold">Scope:</span>
                <p className="mt-1 p-2 border min-h-15 whitespace-pre-wrap">{investigation.scope || '____________________'}</p>
              </div>
              <div className="col-span-2">
                <span className="font-semibold">Objectives:</span>
                <p className="mt-1 p-2 border min-h-15 whitespace-pre-wrap">{investigation.objectives || '____________________'}</p>
              </div>
            </div>
          </div>

          {/* የክስ ዝርዝር / Allegations */}
          <div className="mt-6 text-sm">
            <h4 className="font-bold mb-3">የክስ ዝርዝር / Allegations</h4>
            {reportAllegations.length > 0 ? (
              <div className="space-y-4">
                {reportAllegations.map((allegation, index) => (
                  <div key={index} className="border p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-semibold">Person/Office Concerned:</span> {allegation.personConcerned || '____________________'}
                      </div>
                      <div className="col-span-2">
                        <span className="font-semibold">Description:</span>
                        <p className="mt-1 p-2 border min-h-10 whitespace-pre-wrap">{allegation.description || ''}</p>
                      </div>
                      <div>
                        <span className="font-semibold">Date:</span> {allegation.incidentDate || '____________________'}
                      </div>
                      <div>
                        <span className="font-semibold">Location:</span> {allegation.incidentLocation || '____________________'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No allegations recorded</p>
            )}
          </div>

          {/* የምርመራ ጥያቄዎች / Investigation Questions */}
          <div className="mt-6 text-sm">
            <h4 className="font-bold mb-3">የምርመራ ጥያቄዎች / Investigation Questions</h4>
            {reportAllegations.length > 0 ? (
              <div className="space-y-4">
                {reportAllegations.map((allegation, index) => (
                  <div key={index} className="border p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <span className="font-semibold">Investigation Questions:</span>
                        <p className="mt-1 p-2 border min-h-15 whitespace-pre-wrap">{allegation.investigationQuestions || '____________________'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No investigation questions recorded</p>
            )}
          </div>

          {/* የማስረጃ ዝርዝር / Evidence Register */}
          <div className="mt-6 text-sm">
            <h4 className="font-bold mb-3">የማስረጃ ዝርዝር / Evidence Register</h4>
            {reportEvidenceRecords.length > 0 ? (
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="border">
                    <th className="border p-2">No.</th>
                    <th className="border p-2">Evidence ID</th>
                    <th className="border p-2">Description</th>
                    <th className="border p-2">Source</th>
                    <th className="border p-2">Date Obtained</th>
                  </tr>
                </thead>
                <tbody>
                  {reportEvidenceRecords.map((evidence, index) => (
                    <tr key={index}>
                      <td className="border p-2">{index + 1}</td>
                      <td className="border p-2">EVD-{index + 1}</td>
                      <td className="border p-2">{evidence.title || evidence.description}</td>
                      <td className="border p-2">{evidence.source}</td>
                      <td className="border p-2">{evidence.dateObtained}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 italic">No evidence registered</p>
            )}
          </div>

          {/* የጥቆማ ግምገማ ውጤት / Findings and Assessment */}
          <div className="mt-6 text-sm">
            <h4 className="font-bold mb-3">የጥቆማ ግምገማ ውጤት / Findings and Assessment</h4>
            {reportFindingsRecords.length > 0 ? (
              <div className="space-y-4">
                {reportFindingsRecords.map((finding, index) => (
                  <div key={index} className="border p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-semibold">Assessment Standard:</span> {finding.assessmentStandard}
                      </div>
                      <div className="col-span-2">
                        <span className="font-semibold">Facts Established:</span>
                        <p className="mt-1 p-2 border min-h-10 whitespace-pre-wrap">{finding.factsEstablished}</p>
                      </div>
                      <div>
                        <span className="font-semibold">Supporting Evidence:</span> {finding.supportingEvidence}
                      </div>
                      <div>
                        <span className="font-semibold">Contradictory Evidence:</span> {finding.contradictoryEvidence}
                      </div>
                      <div>
                        <span className="font-semibold">Evidence Reliability:</span> {finding.evidenceReliability}
                      </div>
                      <div>
                        <span className="font-semibold">Proposed Finding:</span> {finding.proposedFinding}
                      </div>
                      <div className="col-span-2">
                        <span className="font-semibold">Recommendation:</span>
                        <p className="mt-1 p-2 border min-h-10 whitespace-pre-wrap">{finding.investigatorRecommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <span className="font-semibold">Overall Findings:</span>
                <p className="mt-1 p-2 border min-h-25 whitespace-pre-wrap">{investigation.findings || '____________________'}</p>
              </div>
            )}
          </div>

          {/* የግምገማ ማጠቃለያ እና ግኝቶች / Summary of Review and Approved Findings */}
          <div className="mt-6 text-sm">
            <h4 className="font-bold mb-3">5. የግምገማ ማጠቃለያ እና ግኝቶች / Summary of Review and Approved Findings</h4>
            <p className="mt-2 p-2 border min-h-25 whitespace-pre-wrap">
              This complaint was received and reviewed by the Feedback and Complaint Management Department. 
              The investigation was conducted in accordance with established procedures and relevant regulations.
              {investigation.findings && `\n\nFindings: ${investigation.findings}`}
              {investigation.recommendation && `\n\nConclusion: ${investigation.recommendation}`}
            </p>
          </div>

          {/* Final Decision */}
          <div className="mt-6 text-sm">
            <h4 className="font-bold mb-3">የመጨረሻ ውሳኔ / Final Decision</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-semibold">Outcome:</span> {investigation.outcome || '____________________'}
              </div>
              <div>
                <span className="font-semibold">Decision:</span> {investigation.decision || '____________________'}
              </div>
              <div className="col-span-2">
                <span className="font-semibold">Authorized Action:</span>
                <p className="mt-1 p-2 border min-h-20 whitespace-pre-wrap">{investigation.recommendation || '____________________'}</p>
              </div>
            </div>
          </div>

          {/* 9. Closing Statement */}
          <div className="mt-6 text-sm">
            <h4 className="font-bold mb-3">መጨረሻ መልዕክት / Closing Statement</h4>
            <p className="mt-2 p-2 border min-h-20 whitespace-pre-wrap">
              The Federal Civil Service Commission is committed to maintaining the highest standards of ethics and integrity. 
              We appreciate your cooperation in this matter. Should you have any further questions or require additional information, 
              please do not hesitate to contact our office.
            </p>
          </div>

          {/* 10. Authorization */}
          <div className="mt-8 pt-6 border-t-2 border-gray-800 text-sm">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="font-semibold">Authorized Officer:</p>
                <p className="mt-4 p-2 border min-h-10">{localReviewData.reviewerName || '____________________'}</p>
                <p className="mt-2">Title: Feedback and Complaint Management Officer</p>
                <p className="mt-2">Date: {new Date().toLocaleDateString()}</p>
                <p className="mt-4 p-2 border min-h-10">Signature: ____________________</p>
              </div>
              <div>
                <p className="font-semibold">For:</p>
                <p className="mt-1">Federal Civil Service Commission</p>
                <p className="mt-1">Feedback and Complaint Management Department</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !investigation) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="p-8 text-center text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>{error || 'Investigation not found'}</p>
            <Button onClick={() => router.push('/ethics/investigations')} className="mt-4">
              Back to Investigations
            </Button>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/ethics/investigations')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{investigation.caseNumber}</h1>
                <p className="text-gray-600 mt-1">Investigation Details</p>
              </div>
            </div>
            <div className="flex gap-2">
              {isInvestigator() && investigation?.status === "Assigned" && (
                <Button
                  onClick={() => setShowPlanModal(true)}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Add Investigation Plan
                </Button>
              )}
              {isEthicsDepartment() && (investigation?.status === "Under Investigation" || investigation?.status === "Report Submitted") && (
                <Button
                  onClick={() => setShowReviewModal(true)}
                  className="gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Review & Approve
                </Button>
              )}
              {isEthicsDepartment() && investigation?.status === "Under Review" && (
                <Button
                  onClick={() => setShowCloseModal(true)}
                  className="gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Close Case & Send Response
                </Button>
              )}
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge className={statusColors[investigation.status] || "bg-gray-100 text-gray-800"}>
                    {investigation.status === 'Under Investigation' ? 'በምርመራ ላይ ነዉ' : investigation.status}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center gap-3">
                <User className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Investigator</p>
                  <p className="font-medium text-gray-900">{getInvestigatorName()}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center gap-3">
                <User className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-500">Complainant</p>
                  <p className="font-medium text-gray-900">
                    {investigation.complaint?.complainantName || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="border-b">
              <nav className="flex overflow-x-auto">
                <button
                  onClick={() => setActiveTab("case-details")}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                    activeTab === "case-details"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <FolderOpen className="w-4 h-4" />
                  Case Details
                </button>
                <button
                  onClick={() => setActiveTab("allegations")}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                    activeTab === "allegations"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Search className="w-4 h-4" />
                  Allegations
                </button>
                <button
                  onClick={() => setActiveTab("evidence")}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                    activeTab === "evidence"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  Evidence Register
                </button>
                <button
                  onClick={() => setActiveTab("findings")}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                    activeTab === "findings"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Scale className="w-4 h-4" />
                  Findings
                </button>
                <button
                  onClick={() => setActiveTab("report")}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                    activeTab === "report"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Investigation Report
                </button>
                <button
                  onClick={() => setActiveTab("messages")}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                    activeTab === "messages"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Messages
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "case-details" && (
                <CaseDetailsTab 
                  investigation={investigation} 
                  isEditing={isEditingCaseDetails}
                  onEdit={handleCaseDetailsEdit}
                  onSave={handleCaseDetailsSave}
                  onCancel={handleCaseDetailsCancel}
                  caseDetailsData={caseDetailsData}
                  setCaseDetailsData={setCaseDetailsData}
                />
              )}
              {activeTab === "allegations" && (
                <AllegationsTab investigation={investigation} />
              )}
              {activeTab === "evidence" && (
                <EvidenceRegisterTab investigation={investigation} />
              )}
              {activeTab === "findings" && (
                <FindingsTab investigation={investigation} />
              )}
              {activeTab === "report" && (
                <InvestigationReportTab investigation={investigation} />
              )}
              {activeTab === "messages" && (
                <MessagesTab investigation={investigation} />
              )}
            </div>
          </div>

          {/* Investigation Plan Modal */}
          {showPlanModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Investigation Plan</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPlanModal(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Create investigation plan for case:{" "}
                  <span className="font-medium">{investigation?.caseNumber}</span>
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scope
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={3}
                      value={planData.scope}
                      onChange={(e) => setPlanData({...planData, scope: e.target.value})}
                      placeholder="Define the scope of the investigation..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Objectives
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={3}
                      value={planData.objectives}
                      onChange={(e) => setPlanData({...planData, objectives: e.target.value})}
                      placeholder="List the investigation objectives..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Investigation Plan
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={5}
                      value={planData.investigationPlan}
                      onChange={(e) => setPlanData({...planData, investigationPlan: e.target.value})}
                      placeholder="Detail the investigation methodology, steps, and timeline..."
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowPlanModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePlanSubmit}
                    >
                      Submit Plan
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Review & Approve Modal */}
          {showReviewModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Review & Approve Investigation</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReviewModal(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Review investigation for case:{" "}
                  <span className="font-medium">{investigation?.caseNumber}</span>
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Findings
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={4}
                      value={reviewData.findings}
                      onChange={(e) => setReviewData({...reviewData, findings: e.target.value})}
                      placeholder="Enter investigation findings..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recommendation
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={3}
                      value={reviewData.recommendation}
                      onChange={(e) => setReviewData({...reviewData, recommendation: e.target.value})}
                      placeholder="Enter recommendations..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Decision
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={3}
                      value={reviewData.decision}
                      onChange={(e) => setReviewData({...reviewData, decision: e.target.value})}
                      placeholder="Enter decision..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Outcome
                    </label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg"
                      value={reviewData.outcome}
                      onChange={(e) => setReviewData({...reviewData, outcome: e.target.value})}
                    >
                      <option value="">Select outcome...</option>
                      <option value="Substantiated">Substantiated</option>
                      <option value="Unsubstantiated">Unsubstantiated</option>
                      <option value="Partially Substantiated">Partially Substantiated</option>
                      <option value="Inconclusive">Inconclusive</option>
                    </select>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowReviewModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleReviewSubmit}
                    >
                      Submit Review
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Close Case & Send Response Modal */}
          {showCloseModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Close Case & Send Response</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCloseModal(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Close case and send response to complainant:{" "}
                  <span className="font-medium">{investigation?.caseNumber}</span>
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Response Message to Complainant
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={5}
                      value={closeData.responseMessage}
                      onChange={(e) => setCloseData({...closeData, responseMessage: e.target.value})}
                      placeholder="Enter the response message to be sent to the complainant..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Follow-up Actions (if any)
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={3}
                      value={closeData.followUpActions}
                      onChange={(e) => setCloseData({...closeData, followUpActions: e.target.value})}
                      placeholder="List any follow-up actions required..."
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowCloseModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCloseSubmit}
                    >
                      Close Case & Send Response
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Allegation Modal */}
          {showAllegationModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{viewMode === 'view' ? 'View Allegations' : 'Add Allegation'}</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowAllegationModal(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {viewMode === 'view' ? (
                  <div className="space-y-4">
                    {allegations.length > 0 ? (
                      <div className="space-y-4">
                        {allegations.map((allegation, index) => (
                          <div key={index} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-semibold text-gray-900">Allegation #{index + 1}</h4>
                              <Badge className="bg-blue-100 text-blue-800">{allegation.allegedConduct || 'Not specified'}</Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Description</p>
                                <p className="text-gray-900">{allegation.description || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Person/Office Concerned</p>
                                <p className="text-gray-900">{allegation.personConcerned || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Incident Date</p>
                                <p className="text-gray-900">{allegation.incidentDate || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Incident Location</p>
                                <p className="text-gray-900">{allegation.incidentLocation || 'N/A'}</p>
                              </div>
                              <div className="md:col-span-2">
                                <p className="text-gray-500">Applicable Law/Policy</p>
                                <p className="text-gray-900">{allegation.applicableLaw || 'N/A'}</p>
                              </div>
                              <div className="md:col-span-2">
                                <p className="text-gray-500">Investigation Questions</p>
                                <p className="text-gray-900">{allegation.investigationQuestions || 'N/A'}</p>
                              </div>
                              <div className="md:col-span-2">
                                <p className="text-gray-500">Scope</p>
                                <p className="text-gray-900">{allegation.scope || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <p>No allegations recorded yet</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Allegation Description *</label>
                      <textarea className="w-full px-3 py-2 border rounded-lg" rows={3} value={allegationData.description} onChange={(e) => setAllegationData({...allegationData, description: e.target.value})} placeholder="Describe the allegation..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Person or Office Concerned</label>
                        <Input className="w-full" value={allegationData.personConcerned} onChange={(e) => setAllegationData({...allegationData, personConcerned: e.target.value})} placeholder="Name or office" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Alleged Conduct *</label>
                        <select className="w-full px-3 py-2 border rounded-lg" value={allegationData.allegedConduct} onChange={(e) => setAllegationData({...allegationData, allegedConduct: e.target.value})}>
                          <option value="">Select conduct type...</option>
                          <option value="misconduct">Misconduct</option>
                          <option value="corruption">Corruption</option>
                          <option value="fraud">Fraud</option>
                          <option value="conflict_of_interest">Conflict of Interest</option>
                          <option value="negligence">Negligence</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date of Incident</label>
                        <Input type="date" className="w-full" value={allegationData.incidentDate} onChange={(e) => setAllegationData({...allegationData, incidentDate: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Incident Location</label>
                        <Input className="w-full" value={allegationData.incidentLocation} onChange={(e) => setAllegationData({...allegationData, incidentLocation: e.target.value})} placeholder="Location" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Applicable Law, Regulation, or Policy</label>
                      <textarea className="w-full px-3 py-2 border rounded-lg" rows={2} value={allegationData.applicableLaw} onChange={(e) => setAllegationData({...allegationData, applicableLaw: e.target.value})} placeholder="Reference applicable laws..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Investigation Questions *</label>
                      <textarea className="w-full px-3 py-2 border rounded-lg" rows={3} value={allegationData.investigationQuestions} onChange={(e) => setAllegationData({...allegationData, investigationQuestions: e.target.value})} placeholder="Questions to investigate..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Allegation-Specific Scope *</label>
                      <textarea className="w-full px-3 py-2 border rounded-lg" rows={2} value={allegationData.scope} onChange={(e) => setAllegationData({...allegationData, scope: e.target.value})} placeholder="Define scope for this allegation..." />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setShowAllegationModal(false)}>Cancel</Button>
                      <Button onClick={handleAllegationSubmit}>Save Allegation</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Evidence Modal */}
          {showEvidenceModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{viewMode === 'view' ? 'View Evidence' : 'Add Evidence'}</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowEvidenceModal(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {viewMode === 'view' ? (
                  <div className="space-y-4">
                    {evidenceRecords.length > 0 ? (
                      <div className="space-y-4">
                        {evidenceRecords.map((evidence, index) => (
                          <div key={index} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-semibold text-gray-900">{evidence.title || `Evidence #${index + 1}`}</h4>
                              <Badge className="bg-green-100 text-green-800">{evidence.type || 'Not specified'}</Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Description</p>
                                <p className="text-gray-900">{evidence.description || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Source</p>
                                <p className="text-gray-900">{evidence.source || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Date Obtained</p>
                                <p className="text-gray-900">{evidence.dateObtained || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Collected By</p>
                                <p className="text-gray-900">{evidence.collectedBy || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Collection Method</p>
                                <p className="text-gray-900">{evidence.collectionMethod || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Original/Copy</p>
                                <p className="text-gray-900">{evidence.originalOrCopy || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Storage Location</p>
                                <p className="text-gray-900">{evidence.storageLocation || 'N/A'}</p>
                              </div>
                              <div className="md:col-span-2">
                                <p className="text-gray-500">Relevance</p>
                                <p className="text-gray-900">{evidence.relevance || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <p>No evidence recorded yet</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Evidence Title *</label>
                        <Input className="w-full" value={evidenceData.title} onChange={(e) => setEvidenceData({...evidenceData, title: e.target.value})} placeholder="Evidence title" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Evidence Type *</label>
                        <select className="w-full px-3 py-2 border rounded-lg" value={evidenceData.type} onChange={(e) => setEvidenceData({...evidenceData, type: e.target.value})}>
                          <option value="">Select type...</option>
                          <option value="document">Document</option>
                          <option value="digital">Digital File</option>
                          <option value="physical">Physical Evidence</option>
                          <option value="photograph">Photograph</option>
                          <option value="video">Video</option>
                          <option value="audio">Audio Recording</option>
                          <option value="testimony">Testimony</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Evidence Description *</label>
                      <textarea className="w-full px-3 py-2 border rounded-lg" rows={3} value={evidenceData.description} onChange={(e) => setEvidenceData({...evidenceData, description: e.target.value})} placeholder="Describe the evidence..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Attach Files (Audio, Image, PDF, Video)</label>
                      <input
                        type="file"
                        multiple
                        accept="audio/*,image/*,.pdf,video/*"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          const validFiles = files.filter(file => {
                            const validTypes = ['audio/', 'image/', 'application/pdf', 'video/'];
                            return validTypes.some(type => file.type.startsWith(type));
                          });
                          if (validFiles.length !== files.length) {
                            alert('Some files were rejected. Only audio, image, PDF, and video files are allowed.');
                          }
                          setEvidenceFiles([...evidenceFiles, ...validFiles]);
                        }}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      {evidenceFiles.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {evidenceFiles.map((file, index) => (
                            <div key={index} className="text-sm text-gray-600 flex items-center justify-between">
                              <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                              <button
                                type="button"
                                onClick={() => setEvidenceFiles(evidenceFiles.filter((_, i) => i !== index))}
                                className="text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Original or Copy *</label>
                        <select className="w-full px-3 py-2 border rounded-lg" value={evidenceData.originalOrCopy} onChange={(e) => setEvidenceData({...evidenceData, originalOrCopy: e.target.value})}>
                          <option value="">Select...</option>
                          <option value="original">Original</option>
                          <option value="copy">Copy</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Evidence Relevance *</label>
                      <textarea className="w-full px-3 py-2 border rounded-lg" rows={2} value={evidenceData.relevance} onChange={(e) => setEvidenceData({...evidenceData, relevance: e.target.value})} placeholder="Explain relevance to investigation..." />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => { setShowEvidenceModal(false); setEvidenceFiles([]); }}>Cancel</Button>
                      <Button onClick={handleEvidenceSubmit}>Save Evidence</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Examination Modal */}
          {showExaminationModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Add Examination</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowExaminationModal(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Evidence ID *</label>
                      <Input className="w-full" value={examinationData.evidenceId} onChange={(e) => setExaminationData({...examinationData, evidenceId: e.target.value})} placeholder="Link to evidence" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Examiner *</label>
                      <Input className="w-full" value={examinationData.examiner} onChange={(e) => setExaminationData({...examinationData, examiner: e.target.value})} placeholder="Examiner name" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Examination Date *</label>
                      <Input type="date" className="w-full" value={examinationData.examinationDate} onChange={(e) => setExaminationData({...examinationData, examinationDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Examination Type *</label>
                      <select className="w-full px-3 py-2 border rounded-lg" value={examinationData.examinationType} onChange={(e) => setExaminationData({...examinationData, examinationType: e.target.value})}>
                        <option value="">Select type...</option>
                        <option value="document_analysis">Document Analysis</option>
                        <option value="digital_forensics">Digital Forensics</option>
                        <option value="financial_analysis">Financial Analysis</option>
                        <option value="handwriting">Handwriting Analysis</option>
                        <option value="authenticity">Authenticity Check</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Examination Objective *</label>
                    <textarea className="w-full px-3 py-2 border rounded-lg" rows={2} value={examinationData.objective} onChange={(e) => setExaminationData({...examinationData, objective: e.target.value})} placeholder="Objective of examination..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Examination Method *</label>
                    <textarea className="w-full px-3 py-2 border rounded-lg" rows={2} value={examinationData.method} onChange={(e) => setExaminationData({...examinationData, method: e.target.value})} placeholder="Method used..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Observations *</label>
                    <textarea className="w-full px-3 py-2 border rounded-lg" rows={3} value={examinationData.observations} onChange={(e) => setExaminationData({...examinationData, observations: e.target.value})} placeholder="Observations made..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Findings from Examination *</label>
                    <textarea className="w-full px-3 py-2 border rounded-lg" rows={3} value={examinationData.findings} onChange={(e) => setExaminationData({...examinationData, findings: e.target.value})} placeholder="Findings..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Examiner's Conclusion *</label>
                    <textarea className="w-full px-3 py-2 border rounded-lg" rows={2} value={examinationData.conclusion} onChange={(e) => setExaminationData({...examinationData, conclusion: e.target.value})} placeholder="Conclusion..." />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowExaminationModal(false)}>Cancel</Button>
                    <Button onClick={() => {
                      setExaminationRecords([...examinationRecords, {...examinationData}]);
                      setExaminationData({
                        evidenceId: "",
                        examiner: "",
                        examinationDate: "",
                        examinationType: "",
                        objective: "",
                        method: "",
                        documentsExamined: "",
                        observations: "",
                        findings: "",
                        discrepancies: "",
                        comparisonResults: "",
                        authenticity: "",
                        limitations: "",
                        conclusion: "",
                        furtherExamination: ""
                      });
                      setShowExaminationModal(false);
                    }}>Save Examination</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chain of Custody Modal */}
          {showCustodyModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Add Custody Event</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowCustodyModal(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Evidence ID *</label>
                      <Input className="w-full" value={custodyData.evidenceId} onChange={(e) => setCustodyData({...custodyData, evidenceId: e.target.value})} placeholder="Link to evidence" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Event Type *</label>
                      <select className="w-full px-3 py-2 border rounded-lg" value={custodyData.eventType} onChange={(e) => setCustodyData({...custodyData, eventType: e.target.value})}>
                        <option value="">Select type...</option>
                        <option value="collection">Collection</option>
                        <option value="transfer">Transfer</option>
                        <option value="access">Access</option>
                        <option value="return">Return</option>
                        <option value="disposal">Disposal</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">From Custodian</label>
                      <Input className="w-full" value={custodyData.fromCustodian} onChange={(e) => setCustodyData({...custodyData, fromCustodian: e.target.value})} placeholder="Previous custodian" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">To Custodian</label>
                      <Input className="w-full" value={custodyData.toCustodian} onChange={(e) => setCustodyData({...custodyData, toCustodian: e.target.value})} placeholder="New custodian" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Event Date and Time *</label>
                      <Input type="datetime-local" className="w-full" value={custodyData.eventDateTime} onChange={(e) => setCustodyData({...custodyData, eventDateTime: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Purpose *</label>
                      <Input className="w-full" value={custodyData.purpose} onChange={(e) => setCustodyData({...custodyData, purpose: e.target.value})} placeholder="Purpose of transfer/access" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Previous Location</label>
                      <Input className="w-full" value={custodyData.previousLocation} onChange={(e) => setCustodyData({...custodyData, previousLocation: e.target.value})} placeholder="Previous storage location" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Storage Location *</label>
                      <Input className="w-full" value={custodyData.newLocation} onChange={(e) => setCustodyData({...custodyData, newLocation: e.target.value})} placeholder="New storage location" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Evidence Condition *</label>
                      <Input className="w-full" value={custodyData.evidenceCondition} onChange={(e) => setCustodyData({...custodyData, evidenceCondition: e.target.value})} placeholder="Condition of evidence" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Seal Number/Status</label>
                      <Input className="w-full" value={custodyData.sealNumber} onChange={(e) => setCustodyData({...custodyData, sealNumber: e.target.value})} placeholder="Seal reference" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Authorization Reference</label>
                    <Input className="w-full" value={custodyData.authorizationReference} onChange={(e) => setCustodyData({...custodyData, authorizationReference: e.target.value})} placeholder="Authorization reference" />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowCustodyModal(false)}>Cancel</Button>
                    <Button onClick={() => {
                      setChainOfCustodyRecords([...chainOfCustodyRecords, {...custodyData}]);
                      setCustodyData({
                        evidenceId: "",
                        eventType: "",
                        fromCustodian: "",
                        toCustodian: "",
                        eventDateTime: "",
                        purpose: "",
                        previousLocation: "",
                        newLocation: "",
                        evidenceCondition: "",
                        sealNumber: "",
                        authorizationReference: "",
                        custodyException: ""
                      });
                      setShowCustodyModal(false);
                    }}>Save Custody Event</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Findings Modal */}
          {showFindingsModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{viewMode === 'view' ? 'View Findings' : 'Add Finding'}</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowFindingsModal(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {viewMode === 'view' ? (
                  <div className="space-y-4">
                    {findingsRecords.length > 0 ? (
                      <div className="space-y-4">
                        {findingsRecords.map((finding, index) => (
                          <div key={index} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-semibold text-gray-900">Finding #{index + 1}</h4>
                              <Badge className="bg-red-100 text-red-800">{finding.proposedFinding || 'Not specified'}</Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="md:col-span-2">
                                <p className="text-gray-500">Facts Established</p>
                                <p className="text-gray-900">{finding.factsEstablished || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Supporting Evidence</p>
                                <p className="text-gray-900">{finding.supportingEvidence || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Contradictory Evidence</p>
                                <p className="text-gray-900">{finding.contradictoryEvidence || 'N/A'}</p>
                              </div>
                              <div className="md:col-span-2">
                                <p className="text-gray-500">Evidence Reliability</p>
                                <p className="text-gray-900">{finding.evidenceReliability || 'N/A'}</p>
                              </div>
                              <div className="md:col-span-2">
                                <p className="text-gray-500">Evidence Gaps</p>
                                <p className="text-gray-900">{finding.evidenceGaps || 'N/A'}</p>
                              </div>
                              <div className="md:col-span-2">
                                <p className="text-gray-500">Alternative Explanations</p>
                                <p className="text-gray-900">{finding.alternativeExplanations || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Investigator Recommendation</p>
                                <p className="text-gray-900">{finding.investigatorRecommendation || 'N/A'}</p>
                              </div>
                              <div className="md:col-span-2">
                                <p className="text-gray-500">Reasoning</p>
                                <p className="text-gray-900">{finding.reasoning || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <p>No findings recorded yet</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Facts Established *</label>
                      <textarea className="w-full px-3 py-2 border rounded-lg" rows={3} value={findingsFormData.factsEstablished} onChange={(e) => setFindingsFormData({...findingsFormData, factsEstablished: e.target.value})} placeholder="Facts established..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Supporting Evidence IDs</label>
                        <Input className="w-full" value={findingsFormData.supportingEvidence} onChange={(e) => setFindingsFormData({...findingsFormData, supportingEvidence: e.target.value})} placeholder="Evidence IDs" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Contradictory Evidence IDs</label>
                        <Input className="w-full" value={findingsFormData.contradictoryEvidence} onChange={(e) => setFindingsFormData({...findingsFormData, contradictoryEvidence: e.target.value})} placeholder="Evidence IDs" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Evidence Reliability Assessment</label>
                      <textarea className="w-full px-3 py-2 border rounded-lg" rows={2} value={findingsFormData.evidenceReliability} onChange={(e) => setFindingsFormData({...findingsFormData, evidenceReliability: e.target.value})} placeholder="Assess evidence reliability..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Evidence Gaps</label>
                      <textarea className="w-full px-3 py-2 border rounded-lg" rows={2} value={findingsFormData.evidenceGaps} onChange={(e) => setFindingsFormData({...findingsFormData, evidenceGaps: e.target.value})} placeholder="Identify gaps..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Alternative Explanations Considered</label>
                      <textarea className="w-full px-3 py-2 border rounded-lg" rows={2} value={findingsFormData.alternativeExplanations} onChange={(e) => setFindingsFormData({...findingsFormData, alternativeExplanations: e.target.value})} placeholder="Alternative explanations..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Proposed Finding *</label>
                        <select className="w-full px-3 py-2 border rounded-lg" value={findingsFormData.proposedFinding} onChange={(e) => setFindingsFormData({...findingsFormData, proposedFinding: e.target.value})}>
                          <option value="">Select finding...</option>
                          <option value="supported_by_evidence">Supported by evidence</option>
                          <option value="not_supported_by_evidence">Not supported by evidence</option>
                          <option value="inconclusive">Inconclusive</option>
                          <option value="unable_to_assess">Unable to assess</option>
                          <option value="further_investigation_required">Further investigation required</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Investigator Recommendation *</label>
                        <select className="w-full px-3 py-2 border rounded-lg" value={findingsFormData.investigatorRecommendation} onChange={(e) => setFindingsFormData({...findingsFormData, investigatorRecommendation: e.target.value})}>
                          <option value="">Select recommendation...</option>
                          <option value="proceed">Proceed with action</option>
                          <option value="dismiss">Dismiss allegation</option>
                          <option value="further_investigation">Further investigation needed</option>
                          <option value="refer">Refer to authority</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Reasoning *</label>
                      <textarea className="w-full px-3 py-2 border rounded-lg" rows={3} value={findingsFormData.reasoning} onChange={(e) => setFindingsFormData({...findingsFormData, reasoning: e.target.value})} placeholder="Explain reasoning..." />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setShowFindingsModal(false)}>Cancel</Button>
                      <Button onClick={handleFindingsSubmit}>Save Finding</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
