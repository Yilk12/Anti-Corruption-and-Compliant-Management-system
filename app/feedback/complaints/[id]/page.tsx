"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useSecretCodeCheck } from "@/app/hooks/use-secret-code-check";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, Clock, User, AlertTriangle, FileText, MessageSquare, Send, UserPlus, Eye, X, Check, Paperclip, Download } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Textarea } from "@/app/components/ui/textarea";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { getCurrentUserRoles } from "@/app/lib/auth";

interface Complaint {
  id: string;
  referenceNumber: string;
  trackingId: string;
  subject: string;
  description: string;
  complaintText?: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  complainantName?: string;
  complainantEmail?: string;
  complainantPhone?: string;
  department?: string;
  departmentName?: string;
  isAnonymous: boolean;
  isInternal: boolean;
  messages?: any[];
  investigation?: any;
  petitions?: Array<{
    id: string;
    petitionNumber: string;
    status: string;
  }>;
  departmentalResponse?: {
    summary?: string;
    investigationConducted?: string;
    findings?: string;
    actionsTaken?: string;
    proposedActions?: string;
    officialResponse?: string;
    recommendations?: string;
  };
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    size?: number;
  }>;
}

export default function ComplaintDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isFeedbackStaff, setIsFeedbackStaff] = useState(false);
  const [isFeedbackManager, setIsFeedbackManager] = useState(false);
  const [isFeedbackOfficer, setIsFeedbackOfficer] = useState(false);
  const [isAdministrativeComplaintsTeam, setIsAdministrativeComplaintsTeam] = useState(false);
  const [isCommissioner, setIsCommissioner] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [investigators, setInvestigators] = useState<any[]>([]);
  const [selectedInvestigator, setSelectedInvestigator] = useState("");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [returning, setReturning] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showAssignDepartmentModal, setShowAssignDepartmentModal] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [departmentInstructions, setDepartmentInstructions] = useState("");
  const [assigningDepartment, setAssigningDepartment] = useState(false);
  const [administrativeTeamMembers, setAdministrativeTeamMembers] = useState<any[]>([]);
  const [selectedTeamMember, setSelectedTeamMember] = useState("");
  const [showDepartmentResponseModal, setShowDepartmentResponseModal] = useState(false);
  const [departmentResponse, setDepartmentResponse] = useState({
    summary: '',
    investigationConducted: '',
    findings: '',
    actionsTaken: '',
    proposedActions: '',
    officialResponse: '',
    recommendations: '',
  });
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [isDepartmentHead, setIsDepartmentHead] = useState(false);
  const [showPetitionModal, setShowPetitionModal] = useState(false);
  const [petitionData, setPetitionData] = useState({
    reasonForDissatisfaction: '',
    explanation: '',
    additionalInfo: '',
    requestedAction: '',
  });
  const [submittingPetition, setSubmittingPetition] = useState(false);
  const [showAssignPetitionModal, setShowAssignPetitionModal] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState("");
  const [assigningPetition, setAssigningPetition] = useState(false);
  const [investigationInstructions, setInvestigationInstructions] = useState("");
  const [investigationDeadline, setInvestigationDeadline] = useState("");
  const [showInvestigationReportModal, setShowInvestigationReportModal] = useState(false);
  const [investigationReport, setInvestigationReport] = useState({
    background: '',
    objectives: '',
    activitiesPerformed: '',
    evidenceCollected: '',
    findings: '',
    conclusions: '',
    recommendations: '',
    personsInterviewed: '',
    observations: '',
  });
  const [submittingReport, setSubmittingReport] = useState(false);
  const [showAdminInvestigationModal, setShowAdminInvestigationModal] = useState(false);
  const [adminInvestigationReport, setAdminInvestigationReport] = useState({
    background: '',
    objectives: '',
    activitiesPerformed: '',
    evidenceCollected: '',
    findings: '',
    conclusions: '',
    recommendations: '',
    personsInterviewed: '',
    observations: '',
  });
  const [submittingAdminReport, setSubmittingAdminReport] = useState(false);
  const [showCommissionerDecisionModal, setShowCommissionerDecisionModal] = useState(false);
  const [commissionerDecision, setCommissionerDecision] = useState({
    decision: 'approve' as 'approve' | 'reject' | 'return',
    comments: '',
  });
  const [submittingCommissionerDecision, setSubmittingCommissionerDecision] = useState(false);
  const [showFinalResponseModal, setShowFinalResponseModal] = useState(false);
  const [finalResponse, setFinalResponse] = useState({
    officialResponse: '',
  });
  const [submittingFinalResponse, setSubmittingFinalResponse] = useState(false);
  const [showAcceptResponseModal, setShowAcceptResponseModal] = useState(false);
  const [acceptanceDecision, setAcceptanceDecision] = useState<'accept' | 'reject' | null>(null);
  const [acceptanceReason, setAcceptanceReason] = useState("");
  const [showFinalDecisionModal, setShowFinalDecisionModal] = useState(false);
  const [finalDecision, setFinalDecision] = useState({
    decision: '',
    rationale: '',
    actionsToBeTaken: '',
    timeline: '',
  });
  const [submittingFinalDecision, setSubmittingFinalDecision] = useState(false);
  useSecretCodeCheck('/feedback/complaints/[id]');

  useEffect(() => {
    const roles = getCurrentUserRoles()?.map((r) => String(r).toLowerCase()) || [];
    setIsFeedbackStaff(
      roles.includes("feedback_complaint_manager") || 
      roles.includes("feedback_complaint_officer")
    );
    setIsFeedbackManager(roles.includes("feedback_complaint_manager"));
    setIsFeedbackOfficer(roles.includes("feedback_complaint_officer"));
    setIsAdministrativeComplaintsTeam(roles.some((r: string) => r.toLowerCase().includes("administrative")));
    setIsCommissioner(roles.includes("commissioner"));
    setIsDepartmentHead(roles.includes("department_head"));
    fetchComplaint();
  }, [params.id]);

  // Fetch investigators when modal opens
  useEffect(() => {
    if (showAssignModal && isFeedbackStaff) {
      fetchInvestigators();
    }
  }, [showAssignModal]);

  // Fetch investigators when petition assignment modal opens
  useEffect(() => {
    if (showAssignPetitionModal && isFeedbackManager) {
      fetchInvestigators();
    }
  }, [showAssignPetitionModal]);

  // Fetch departments when modal opens
  useEffect(() => {
    if (showAssignDepartmentModal) {
      fetchDepartments();
      // Also fetch administrative team members if it's an administrative complaint
      if (complaint?.category === 'Administrative Complaints' || 
          complaint?.category === 'አስተዳደራዊ ጥቆማ' || 
          complaint?.category === 'አስተዳደራዊ ቅሬታ') {
        fetchAdministrativeTeamMembers();
      }
    }
  }, [showAssignDepartmentModal]);

  const fetchInvestigators = async () => {
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      
      // Use the new feedback officers endpoint
      const response = await fetch('http://localhost:4000/api/feedback/officers', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch investigators');
      }

      const data = await response.json();
      const officers = data || [];
      
      setInvestigators(officers);
    } catch (error) {
      console.error('Error fetching investigators:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      
      // Request without pagination to get all departments
      const response = await fetch('http://localhost:4000/api/departments?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }

      const data = await response.json();
      console.log('Departments API response:', data);
      console.log('Departments API response keys:', Object.keys(data));
      
      // The API returns { departments: [...], pagination: {...} }
      let departmentsArray = [];
      if (data?.departments && Array.isArray(data.departments)) {
        departmentsArray = data.departments;
      } else if (Array.isArray(data)) {
        departmentsArray = data;
      }
      
      console.log('Departments array:', departmentsArray);
      console.log('Departments count:', departmentsArray.length);
      setDepartments(departmentsArray);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const fetchAdministrativeTeamMembers = async () => {
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      
      const response = await fetch('http://localhost:4000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      const users = Array.isArray(data) ? data : (data?.users || []);
      
      // Filter users with Administrative_Complaints_Team role
      const adminTeam = users.filter((user: any) => 
        user.roles && user.roles.includes('Administrative_Complaints_Team')
      );
      
      setAdministrativeTeamMembers(adminTeam);
    } catch (error) {
      console.error('Error fetching administrative team members:', error);
    }
  };

  const fetchComplaint = async () => {
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      const response = await fetch(`http://localhost:4000/api/feedback/complaints/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch complaint');
      }

      const data = await response.json();
      setComplaint(data);
    } catch (error) {
      console.error('Error fetching complaint:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      const response = await fetch(`http://localhost:4000/api/feedback/complaints/${params.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage,
          messageType: 'REPLY',
          visibility: 'COMPLAINANT_VISIBLE',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setNewMessage("");
      fetchComplaint(); // Refresh to show new message
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAssignInvestigation = async () => {
    if (!selectedInvestigator) {
      alert("Please select an investigator");
      return;
    }

    setAssigning(true);
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      const response = await fetch(`http://localhost:4000/api/feedback/complaints/${params.id}/investigation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignedInvestigatorId: selectedInvestigator,
          startDate: startDate || null,
          targetCompletionDate: targetDate || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign investigation');
      }

      setShowAssignModal(false);
      setSelectedInvestigator("");
      setStartDate("");
      setTargetDate("");
      fetchComplaint(); // Refresh to show investigation
    } catch (error) {
      console.error('Error assigning investigation:', error);
      alert('Failed to assign investigation');
    } finally {
      setAssigning(false);
    }
  };

  const handleReturnToComplainant = async () => {
    if (!returnReason.trim()) {
      alert("Please provide a reason for returning the complaint");
      return;
    }

    setReturning(true);
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      const response = await fetch(`http://localhost:4000/api/feedback/complaints/${params.id}/return`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnReason: returnReason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to return complaint');
      }

      setShowReturnModal(false);
      setReturnReason("");
      fetchComplaint(); // Refresh to show updated status
      alert('Complaint returned to complainant successfully');
    } catch (error) {
      console.error('Error returning complaint:', error);
      alert('Failed to return complaint');
    } finally {
      setReturning(false);
    }
  };

  const handleAssignToDepartment = async () => {
    const isAdminComplaint = complaint?.category === 'Administrative Complaints' || 
                             complaint?.category === 'አስተዳደራዊ ጥቆማ' || 
                             complaint?.category === 'አስተዳደራዊ ቅሬታ';
    
    if (!isAdminComplaint && !selectedDepartment) {
      alert("Please select a department");
      return;
    }
    
    if (isAdminComplaint && !selectedTeamMember) {
      alert("Please select a team member");
      return;
    }

    setAssigningDepartment(true);
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      
      // Use different endpoint for administrative complaints
      const endpoint = isAdminComplaint 
        ? `http://localhost:4000/api/feedback/complaints/${params.id}/assign-administrative-team`
        : `http://localhost:4000/api/feedback/complaints/${params.id}/assign-department`;
      
      const body = isAdminComplaint
        ? JSON.stringify({ assignedUserId: selectedTeamMember, instructions: departmentInstructions })
        : JSON.stringify({ departmentId: selectedDepartment, instructions: departmentInstructions });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body,
      });

      if (!response.ok) {
        throw new Error(isAdminComplaint ? 'Failed to assign to administrative team' : 'Failed to assign to department');
      }

      setShowAssignDepartmentModal(false);
      setSelectedDepartment("");
      setSelectedTeamMember("");
      setDepartmentInstructions("");
      fetchComplaint(); // Refresh to show updated status
      alert(isAdminComplaint ? 'Complaint assigned to Administrative Complaints Team successfully' : 'Complaint assigned to department successfully');
    } catch (error) {
      console.error('Error assigning:', error);
      alert('Failed to assign');
    } finally {
      setAssigningDepartment(false);
    }
  };

  const handleSubmitDepartmentalResponse = async () => {
    if (!departmentResponse.summary || !departmentResponse.officialResponse) {
      alert("Please provide at least a summary and official response");
      return;
    }

    setSubmittingResponse(true);
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      const response = await fetch(`http://localhost:4000/api/feedback/complaints/${params.id}/departmental-response`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(departmentResponse),
      });

      if (!response.ok) {
        throw new Error('Failed to submit response');
      }

      setShowDepartmentResponseModal(false);
      setDepartmentResponse({
        summary: '',
        investigationConducted: '',
        findings: '',
        actionsTaken: '',
        proposedActions: '',
        officialResponse: '',
        recommendations: '',
      });
      fetchComplaint(); // Refresh to show updated status
      alert('መልሱ በትክክል ተልኳል');
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit response');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleSendToComplainant = async () => {
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      const response = await fetch(`http://localhost:4000/api/feedback/complaints/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'ለቅሬታ አቅራቢወ የተላከ',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send response to complainant');
      }

      fetchComplaint(); // Refresh to show updated status
      alert('የቅሬታ መልስ ለአመልካች በትክክል ተልኳል');
    } catch (error) {
      console.error('Error sending to complainant:', error);
      alert('Failed to send response to complainant');
    }
  };

  const handleSubmitPetition = async () => {
    if (!petitionData.reasonForDissatisfaction || !petitionData.explanation) {
      alert("Please provide reason for dissatisfaction and explanation");
      return;
    }

    setSubmittingPetition(true);
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      const response = await fetch(`http://localhost:4000/api/feedback/complaints/${params.id}/petition`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(petitionData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit petition');
      }

      setShowPetitionModal(false);
      setPetitionData({
        reasonForDissatisfaction: '',
        explanation: '',
        additionalInfo: '',
        requestedAction: '',
      });
      fetchComplaint(); // Refresh to show updated status
      alert('Petition submitted successfully');
    } catch (error) {
      console.error('Error submitting petition:', error);
      alert('Failed to submit petition');
    } finally {
      setSubmittingPetition(false);
    }
  };

  const handleAssignPetition = async () => {
    if (!selectedOfficer) {
      alert("Please select an officer");
      return;
    }

    setAssigningPetition(true);
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      const response = await fetch(`http://localhost:4000/api/feedback/petitions/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          complaintId: params.id,
          officerId: selectedOfficer,
          investigationInstructions,
          investigationDeadline,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign petition');
      }

      setShowAssignPetitionModal(false);
      setSelectedOfficer("");
      setInvestigationInstructions("");
      setInvestigationDeadline("");
      fetchComplaint(); // Refresh to show updated status
      alert('አቤቱታዉ በትከክል ለሰራተኛዉ ተመድቧል');
    } catch (error) {
      console.error('Error assigning petition:', error);
      alert('Failed to assign petition');
    } finally {
      setAssigningPetition(false);
    }
  };

  const handleSubmitInvestigationReport = async () => {
    if (!investigationReport.background || !investigationReport.findings || !investigationReport.conclusions) {
      alert("Please provide background, findings, and conclusions");
      return;
    }

    if (!complaint?.petitions?.[0]?.id) {
      alert("No petition found for this complaint");
      return;
    }

    setSubmittingReport(true);
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      const response = await fetch(`http://localhost:4000/api/feedback/petitions/${complaint.petitions[0].id}/investigation-report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(investigationReport),
      });

      if (!response.ok) {
        throw new Error('Failed to submit investigation report');
      }

      setShowInvestigationReportModal(false);
      setInvestigationReport({
        background: '',
        objectives: '',
        activitiesPerformed: '',
        evidenceCollected: '',
        findings: '',
        conclusions: '',
        recommendations: '',
        personsInterviewed: '',
        observations: '',
      });
      fetchComplaint(); // Refresh to show updated status
      alert('Investigation report submitted successfully');
    } catch (error) {
      console.error('Error submitting investigation report:', error);
      alert('Failed to submit investigation report');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Administrative Complaints Workflow Handlers

  const handleSubmitAdminInvestigationReport = async () => {
    if (!adminInvestigationReport.background || !adminInvestigationReport.findings || !adminInvestigationReport.conclusions) {
      alert("Please provide background, findings, and conclusions");
      return;
    }

    setSubmittingAdminReport(true);
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      const response = await fetch(`http://localhost:4000/api/feedback/complaints/${params.id}/administrative-investigation-report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminInvestigationReport),
      });

      if (!response.ok) {
        throw new Error('Failed to submit investigation report');
      }

      setShowAdminInvestigationModal(false);
      setAdminInvestigationReport({
        background: '',
        objectives: '',
        activitiesPerformed: '',
        evidenceCollected: '',
        findings: '',
        conclusions: '',
        recommendations: '',
        personsInterviewed: '',
        observations: '',
      });
      fetchComplaint();
      alert('Investigation report submitted successfully');
    } catch (error) {
      console.error('Error submitting investigation report:', error);
      alert('Failed to submit investigation report');
    } finally {
      setSubmittingAdminReport(false);
    }
  };

  const handleCommissionerDecision = async () => {
    if (!commissionerDecision.decision || !commissionerDecision.comments) {
      alert("Please provide decision and comments");
      return;
    }

    setSubmittingCommissionerDecision(true);
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      const response = await fetch(`http://localhost:4000/api/feedback/complaints/${params.id}/commissioner-review-administrative`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commissionerDecision),
      });

      if (!response.ok) {
        throw new Error('Failed to submit decision');
      }

      setShowCommissionerDecisionModal(false);
      setCommissionerDecision({
        decision: 'approve',
        comments: '',
      });
      fetchComplaint();
      alert('Decision submitted successfully');
    } catch (error) {
      console.error('Error submitting decision:', error);
      alert('Failed to submit decision');
    } finally {
      setSubmittingCommissionerDecision(false);
    }
  };

  const handleSendFinalResponse = async () => {
    if (!finalResponse.officialResponse) {
      alert("Please provide official response");
      return;
    }

    setSubmittingFinalResponse(true);
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      const response = await fetch(`http://localhost:4000/api/feedback/complaints/${params.id}/send-administrative-response`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalResponse),
      });

      if (!response.ok) {
        throw new Error('Failed to send response');
      }

      setShowFinalResponseModal(false);
      setFinalResponse({
        officialResponse: '',
      });
      fetchComplaint();
      alert('Response sent successfully');
    } catch (error) {
      console.error('Error sending response:', error);
      alert('Failed to send response');
    } finally {
      setSubmittingFinalResponse(false);
    }
  };

  const handleCloseAdministrativeComplaint = async () => {
    if (!confirm("Are you sure you want to close this complaint?")) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      const response = await fetch(`http://localhost:4000/api/feedback/complaints/${params.id}/close-administrative`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to close complaint');
      }

      fetchComplaint();
      alert('Complaint closed successfully');
    } catch (error) {
      console.error('Error closing complaint:', error);
      alert('Failed to close complaint');
    }
  };

  const handleAcceptResponse = async () => {
    if (!acceptanceDecision) {
      alert("Please select accept or reject");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      const response = await fetch(`http://localhost:4000/api/feedback/complaints/${params.id}/accept-response`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision: acceptanceDecision,
          reason: acceptanceReason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit response');
      }

      setShowAcceptResponseModal(false);
      setAcceptanceDecision(null);
      setAcceptanceReason("");
      fetchComplaint(); // Refresh to show updated status
      alert('Response submitted successfully');
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit response');
    }
  };

  const handleSubmitFinalDecision = async () => {
    if (!finalDecision.decision || !finalDecision.rationale) {
      alert("Please provide decision and rationale");
      return;
    }

    setSubmittingFinalDecision(true);
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      const response = await fetch(`http://localhost:4000/api/feedback/complaints/${params.id}/final-decision`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalDecision),
      });

      if (!response.ok) {
        throw new Error('Failed to submit final decision');
      }

      setShowFinalDecisionModal(false);
      setFinalDecision({
        decision: '',
        rationale: '',
        actionsToBeTaken: '',
        timeline: '',
      });
      fetchComplaint(); // Refresh to show updated status
      alert('Final decision submitted successfully');
    } catch (error) {
      console.error('Error submitting final decision:', error);
      alert('Failed to submit final decision');
    } finally {
      setSubmittingFinalDecision(false);
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
      case 'Assigned to Department':
        return 'bg-red-100 text-red-800';
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

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="p-6">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Loading complaint...</p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (!complaint) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="p-6">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Complaint not found</h3>
                <p className="text-gray-600">The complaint you're looking for doesn't exist or you don't have access to it.</p>
              </CardContent>
            </Card>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="space-y-6">
            {/* Complaint Details */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(complaint.status)}>
                        {complaint.status === 'Under Investigation' ? 'በምርመራ ላይ ነዉ' : 
                         complaint.status === 'Assigned to Department' ? 'ለስራ ክፍሉ የተላከ ቅሬታ' : 
                         complaint.status}
                      </Badge>
                      <Badge className={getPriorityColor(complaint.priority)}>
                        {complaint.priority}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isFeedbackStaff && (
                      <>
                        {(complaint.category === 'Administrative Complaints' || complaint.category === 'አስተዳደራዊ ጥቆማ' || complaint.category === 'አስተዳደራዊ ቅሬታ') ? (
                          <Button onClick={() => setShowAssignDepartmentModal(true)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Assign to Administrative Complaints Team
                          </Button>
                        ) : (
                          <Button onClick={() => setShowAssignDepartmentModal(true)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Assign to Department
                          </Button>
                        )}
                        {complaint.investigation ? (
                          <>
                            <Button variant="outline" onClick={() => router.push(`/feedback/complaints/investigations/${complaint.investigation.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Investigation
                            </Button>
                            <Button variant="destructive" onClick={() => setShowReturnModal(true)}>
                              <ArrowLeft className="mr-2 h-4 w-4" />
                              Return to Complainant
                            </Button>
                          </>
                        ) : (
                          !(complaint.category === 'Administrative Complaints' || complaint.category === 'አስተዳደራዊ ጥቆማ' || complaint.category === 'አስተዳደራዊ ቅሬታ') && (
                            <Button onClick={() => setShowAssignModal(true)}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Assign Investigator
                            </Button>
                          )
                        )}
                      </>
                    )}
                    {isDepartmentHead && (complaint.status === 'Assigned to Department' || complaint.status === 'Under Department Review') && (
                      <Button onClick={() => setShowDepartmentResponseModal(true)}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Submit Departmental Response
                      </Button>
                    )}
                    {!isFeedbackStaff && !isDepartmentHead && complaint.status === 'ለቅሬታ አቅራቢወ የተላከ' && (
                      <>
                        <Button onClick={() => { setShowAcceptResponseModal(true); setAcceptanceDecision('accept'); }} className="bg-green-600 hover:bg-green-700">
                          <Check className="mr-2 h-4 w-4" />
                          Accept Response
                        </Button>
                        <Button onClick={() => { setShowAcceptResponseModal(true); setAcceptanceDecision('reject'); }} variant="destructive">
                          <X className="mr-2 h-4 w-4" />
                          Reject Response
                        </Button>
                        <Button onClick={() => setShowPetitionModal(true)} variant="destructive">
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Submit Petition
                        </Button>
                      </>
                    )}
                    {isFeedbackManager && complaint.status === 'Petition Submitted' && (
                      <Button onClick={() => setShowAssignPetitionModal(true)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Assign Petition to Officer
                      </Button>
                    )}
                    {isFeedbackOfficer && complaint.status === 'Assigned for Investigation' && (
                      <Button onClick={() => setShowInvestigationReportModal(true)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Submit Investigation Report
                      </Button>
                    )}
                    {isFeedbackManager && complaint.status === 'Investigation Report Submitted' && (
                      <Button onClick={() => setShowFinalDecisionModal(true)}>
                        <Check className="mr-2 h-4 w-4" />
                        Issue Final Decision
                      </Button>
                    )}
                    {/* Administrative Complaints Workflow Buttons */}
                    {isFeedbackManager && (complaint.category === 'Administrative Complaints' || complaint.category === 'አስተዳደራዊ ጥቆማ' || complaint.category === 'አስተዳደራዊ ቅሬታ') && complaint.status === 'Under_Manager_Review' && (
                      <Button onClick={() => {
                        const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
                        fetch(`http://localhost:4000/api/feedback/complaints/${params.id}/forward-investigation-team`, {
                          method: 'POST',
                          headers: { 'Authorization': `Bearer ${token}` },
                        }).then(() => fetchComplaint());
                      }}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Forward to Investigation Team
                      </Button>
                    )}
                    {isAdministrativeComplaintsTeam && (complaint.category === 'Administrative Complaints' || complaint.category === 'አስተዳደራዊ ጥቆማ' || complaint.category === 'አስተዳደራዊ ቅሬታ') && complaint.status === 'Assigned_To_Investigation_Team' && (
                      <Button onClick={() => setShowAdminInvestigationModal(true)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Submit Investigation Report
                      </Button>
                    )}
                    {isCommissioner && (complaint.category === 'Administrative Complaints' || complaint.category === 'አስተዳደራዊ ጥቆማ' || complaint.category === 'አስተዳደራዊ ቅሬታ') && complaint.status === 'Investigation_Completed' && (
                      <Button onClick={() => setShowCommissionerDecisionModal(true)}>
                        <Check className="mr-2 h-4 w-4" />
                        Review and Decision
                      </Button>
                    )}
                    {isFeedbackManager && (complaint.category === 'Administrative Complaints' || complaint.category === 'አስተዳደራዊ ጥቆማ' || complaint.category === 'አስተዳደራዊ ቅሬታ') && complaint.status === 'Decision_Approved' && (
                      <Button onClick={() => setShowFinalResponseModal(true)}>
                        <Send className="mr-2 h-4 w-4" />
                        Send Final Response
                      </Button>
                    )}
                    {isFeedbackManager && (complaint.category === 'Administrative Complaints' || complaint.category === 'አስተዳደራዊ ጥቆማ' || complaint.category === 'አስተዳደራዊ ቅሬታ') && complaint.status === 'Response_Sent' && (
                      <Button onClick={handleCloseAdministrativeComplaint} variant="outline">
                        <Check className="mr-2 h-4 w-4" />
                        Close Complaint
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Complainant Information */}
                <div>
                  <h3 className="font-semibold mb-3 text-lg">Complainant information</h3>
                  <div className="text-gray-700 space-y-2 bg-gray-50 p-4 rounded-lg">
                    {!complaint.isAnonymous && (
                      <>
                        <p><strong>Name:</strong> {complaint.complainantName || "Unknown"}</p>
                        {complaint.complainantEmail && <p><strong>Email:</strong> {complaint.complainantEmail}</p>}
                        {complaint.complainantPhone && <p><strong>Phone:</strong> {complaint.complainantPhone}</p>}
                      </>
                    )}
                    {complaint.isAnonymous && (
                      <p className="flex items-center gap-1 text-gray-600">
                        <AlertTriangle className="h-4 w-4" />
                        Anonymous
                      </p>
                    )}
                    {complaint.departmentName && (
                      <p><strong>ቅሬታ የቀረበበት የስራ ክፍል:</strong> <span className="text-blue-600 font-medium">{complaint.departmentName}</span></p>
                    )}
                  </div>
                </div>

                {/* ቅሬታ የቀረበበት የስራ ክፍልና አካል - Not shown for administrative complaints */}
                {!(complaint.category === 'Administrative Complaints' || complaint.category === 'አስተዳደራዊ ጥቆማ' || complaint.category === 'አስተዳደራዊ ቅሬታ') && (
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">ቅሬታ የቀረበበት የስራ ክፍልና አካል</h3>
                    <div className="text-gray-700 space-y-2 bg-gray-50 p-4 rounded-lg">
                      <p><strong>Name:</strong> {complaint.subject || "N/A"}</p>
                      {complaint.departmentName && (
                        <p><strong>Department:</strong> {complaint.departmentName}</p>
                      )}
                      {complaint.department && !complaint.departmentName && (
                        <p><strong>Department:</strong> {complaint.department}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Reference and Category - Not shown for administrative complaints */}
                {!(complaint.category === 'Administrative Complaints' || complaint.category === 'አስተዳደራዊ ጥቆማ' || complaint.category === 'አስተዳደራዊ ቅሬታ') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Reference</h3>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{complaint.referenceNumber}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Category</h3>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{complaint.category}</p>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <h3 className="font-semibold mb-3 text-lg">Description</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{complaint.description}</p>
                </div>

                {/* Complaint Text - for administrative complaints */}
                {complaint.complaintText && (
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">ቅሬታ</h3>
                    <p className="text-gray-700 bg-orange-50 p-4 rounded-lg">{complaint.complaintText}</p>
                  </div>
                )}

                {/* Attachments */}
                {complaint.attachments && complaint.attachments.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">Attachments</h3>
                    <div className="space-y-2">
                      {complaint.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Paperclip className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <span className="text-sm text-gray-700 truncate">{attachment.filename}</span>
                            {attachment.size && (
                              <span className="text-xs text-gray-500 flex-shrink-0">
                                {(attachment.size / 1024).toFixed(1)} KB
                              </span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(attachment.url, '_blank')}
                            className="flex-shrink-0"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submitted Date */}
                <div>
                  <h3 className="font-semibold mb-2">የተላከበት ቀን</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {new Date(complaint.createdAt).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Departmental Response */}
            {complaint.departmentalResponse && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      {(complaint.category === 'Administrative Complaints' || complaint.category === 'አስተዳደራዊ ጥቆማ' || complaint.category === 'አስተዳደራዊ ቅሬታ') ? 'ከቅሬታ አጣሪ ኮሚቲዎች የተላከ ሪፖርት' : 'Departmental Response'}
                    </CardTitle>
                    {isFeedbackStaff && complaint.status === 'Response Submitted' && (
                      <Button onClick={handleSendToComplainant} className="bg-green-600 hover:bg-green-700">
                        <Send className="mr-2 h-4 w-4" />
                        Send to Complainant
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {complaint.departmentalResponse.summary && (
                    <div>
                      <h4 className="font-semibold mb-2">Summary</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {complaint.departmentalResponse.summary.includes('=== COMMISSIONER FINAL DECISION ===') 
                          ? 'ቅሬታዉ ዉሳኔ አግኚቷል' 
                          : complaint.departmentalResponse.summary}
                      </p>
                    </div>
                  )}
                  {complaint.departmentalResponse.investigationConducted && (
                    <div>
                      <h4 className="font-semibold mb-2">Investigation Conducted</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {complaint.departmentalResponse.investigationConducted.includes('=== COMMISSIONER FINAL DECISION ===') 
                          ? 'ቅሬታዉ ዉሳኔ አግኚቷል' 
                          : complaint.departmentalResponse.investigationConducted}
                      </p>
                    </div>
                  )}
                  {complaint.departmentalResponse.findings && (
                    <div>
                      <h4 className="font-semibold mb-2">Findings</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {complaint.departmentalResponse.findings.includes('=== COMMISSIONER FINAL DECISION ===') 
                          ? 'ቅሬታዉ ዉሳኔ አግኚቷል' 
                          : complaint.departmentalResponse.findings}
                      </p>
                    </div>
                  )}
                  {complaint.departmentalResponse.actionsTaken && (
                    <div>
                      <h4 className="font-semibold mb-2">Actions Taken</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {complaint.departmentalResponse.actionsTaken.includes('=== COMMISSIONER FINAL DECISION ===') 
                          ? 'ቅሬታዉ ዉሳኔ አግኚቷል' 
                          : complaint.departmentalResponse.actionsTaken}
                      </p>
                    </div>
                  )}
                  {complaint.departmentalResponse.proposedActions && (
                    <div>
                      <h4 className="font-semibold mb-2">Proposed Actions</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {complaint.departmentalResponse.proposedActions.includes('=== COMMISSIONER FINAL DECISION ===') 
                          ? 'ቅሬታዉ ዉሳኔ አግኚቷል' 
                          : complaint.departmentalResponse.proposedActions}
                      </p>
                    </div>
                  )}
                  {complaint.departmentalResponse.officialResponse && (
                    <div>
                      <h4 className="font-semibold mb-2">Official Response</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {complaint.departmentalResponse.officialResponse.includes('=== COMMISSIONER FINAL DECISION ===') 
                          ? 'ቅሬታዉ ዉሳኔ አግኚቷል' 
                          : complaint.departmentalResponse.officialResponse}
                      </p>
                    </div>
                  )}
                  {complaint.departmentalResponse.recommendations && (
                    <div>
                      <h4 className="font-semibold mb-2">Recommendations</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {complaint.departmentalResponse.recommendations.includes('=== COMMISSIONER FINAL DECISION ===') 
                          ? 'ቅሬታዉ ዉሳኔ አግኚቷል' 
                          : complaint.departmentalResponse.recommendations}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Messages
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {complaint.messages && complaint.messages.length > 0 ? (
                  complaint.messages.map((message: any) => {
                    // Check if message contains commissioner decision details
                    const isCommissionerDecision = message.message && message.message.includes('=== COMMISSIONER FINAL DECISION ===');
                    const displayMessage = isCommissionerDecision ? 'ቅሬታዉ ዉሳኔ አግኚቷል' : message.message;
                    
                    // Determine sender label based on role
                    const getSenderLabel = () => {
                      if (message.senderType === 'COMPLAINANT') {
                        return 'Complainant';
                      }
                      
                      const role = message.senderRole || '';
                      const roleLower = role.toLowerCase();
                      
                      if (roleLower.includes('commissioner')) {
                        return 'Authorized Comment - Commissioner';
                      } else if (roleLower.includes('manager')) {
                        return 'Authorized Comment - Manager';
                      } else if (roleLower.includes('officer')) {
                        return 'Authorized Comment - Officer';
                      } else if (roleLower.includes('department_head')) {
                        return 'Authorized Comment - Department Head';
                      } else if (role) {
                        return `Authorized Comment - ${role}`;
                      }
                      
                      return 'Authorized Comment';
                    };
                    
                    return (
                      <div
                        key={message.id}
                        className={`p-4 rounded-lg ${
                          message.senderType === 'COMPLAINANT'
                            ? 'bg-blue-50 ml-8'
                            : 'bg-gray-50 mr-8'
                        }`}
                      >
                        <div className="text-sm text-gray-600 mb-1">
                          {getSenderLabel()}
                        </div>
                        <p className="text-gray-800">{displayMessage}</p>
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(message.sentAt).toLocaleString()}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-center py-4">No messages yet</p>
                )}

                {/* Send Message */}
                {isFeedbackStaff && (
                  <div className="border-t pt-4 mt-4">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={3}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={sendingMessage || !newMessage.trim()}
                      className="mt-2"
                    >
                      {sendingMessage ? (
                        "Sending..."
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Final Decision Modal */}
          {showFinalDecisionModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
              <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Issue Final Decision</span>
                    <Button variant="ghost" size="sm" onClick={() => setShowFinalDecisionModal(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Decision *</label>
                    <Textarea
                      placeholder="Enter your final decision..."
                      value={finalDecision.decision}
                      onChange={(e) => setFinalDecision({...finalDecision, decision: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Rationale *</label>
                    <Textarea
                      placeholder="Explain the rationale for this decision..."
                      value={finalDecision.rationale}
                      onChange={(e) => setFinalDecision({...finalDecision, rationale: e.target.value})}
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Actions to be Taken</label>
                    <Textarea
                      placeholder="Specify actions to be taken based on this decision..."
                      value={finalDecision.actionsToBeTaken}
                      onChange={(e) => setFinalDecision({...finalDecision, actionsToBeTaken: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Timeline</label>
                    <Textarea
                      placeholder="Timeline for implementation..."
                      value={finalDecision.timeline}
                      onChange={(e) => setFinalDecision({...finalDecision, timeline: e.target.value})}
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleSubmitFinalDecision}
                      disabled={submittingFinalDecision || !finalDecision.decision || !finalDecision.rationale}
                      className="flex-1"
                    >
                      {submittingFinalDecision ? "Submitting..." : "Issue Decision"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowFinalDecisionModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Accept Response Modal */}
          {showAcceptResponseModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{acceptanceDecision === 'accept' ? 'Accept Response' : 'Reject Response'}</span>
                    <Button variant="ghost" size="sm" onClick={() => setShowAcceptResponseModal(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {acceptanceDecision === 'reject' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Reason for Rejection *</label>
                      <Textarea
                        placeholder="Please explain why you are rejecting this response..."
                        value={acceptanceReason}
                        onChange={(e) => setAcceptanceReason(e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}
                  {acceptanceDecision === 'accept' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Comments (Optional)</label>
                      <Textarea
                        placeholder="Any additional comments..."
                        value={acceptanceReason}
                        onChange={(e) => setAcceptanceReason(e.target.value)}
                        rows={2}
                      />
                    </div>
                  )}
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleAcceptResponse}
                      disabled={acceptanceDecision === 'reject' && !acceptanceReason}
                      className="flex-1"
                    >
                      {acceptanceDecision === 'accept' ? 'Accept' : 'Reject'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowAcceptResponseModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Assign Petition Modal */}
          {showAssignPetitionModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Assign Petition to Officer</span>
                    <Button variant="ghost" size="sm" onClick={() => setShowAssignPetitionModal(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Officer</label>
                    <Select value={selectedOfficer} onValueChange={setSelectedOfficer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select officer" />
                      </SelectTrigger>
                      <SelectContent>
                        {investigators.map((officer) => (
                          <SelectItem key={officer.id} value={officer.id}>
                            {officer.firstName} {officer.lastName} {officer.position ? `(${officer.position})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Investigation Instructions</label>
                    <Textarea
                      placeholder="Provide investigation instructions and objectives..."
                      value={investigationInstructions}
                      onChange={(e) => setInvestigationInstructions(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Investigation Deadline</label>
                    <Input
                      type="date"
                      value={investigationDeadline}
                      onChange={(e) => setInvestigationDeadline(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleAssignPetition}
                      disabled={assigningPetition || !selectedOfficer}
                      className="flex-1"
                    >
                      {assigningPetition ? "Assigning..." : "Assign"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowAssignPetitionModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Investigation Report Modal */}
          {showInvestigationReportModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
              <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Submit Investigation Report</span>
                    <Button variant="ghost" size="sm" onClick={() => setShowInvestigationReportModal(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Background *</label>
                    <Textarea
                      placeholder="Background of the petition..."
                      value={investigationReport.background}
                      onChange={(e) => setInvestigationReport({...investigationReport, background: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Objectives</label>
                    <Textarea
                      placeholder="Objectives of the investigation..."
                      value={investigationReport.objectives}
                      onChange={(e) => setInvestigationReport({...investigationReport, objectives: e.target.value})}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Activities Performed</label>
                    <Textarea
                      placeholder="Activities performed during investigation..."
                      value={investigationReport.activitiesPerformed}
                      onChange={(e) => setInvestigationReport({...investigationReport, activitiesPerformed: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Evidence Collected</label>
                    <Textarea
                      placeholder="Evidence collected..."
                      value={investigationReport.evidenceCollected}
                      onChange={(e) => setInvestigationReport({...investigationReport, evidenceCollected: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Persons Interviewed</label>
                    <Textarea
                      placeholder="Persons interviewed..."
                      value={investigationReport.personsInterviewed}
                      onChange={(e) => setInvestigationReport({...investigationReport, personsInterviewed: e.target.value})}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Findings *</label>
                    <Textarea
                      placeholder="Your findings..."
                      value={investigationReport.findings}
                      onChange={(e) => setInvestigationReport({...investigationReport, findings: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Observations</label>
                    <Textarea
                      placeholder="Observations during investigation..."
                      value={investigationReport.observations}
                      onChange={(e) => setInvestigationReport({...investigationReport, observations: e.target.value})}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Conclusions *</label>
                    <Textarea
                      placeholder="Conclusions from the investigation..."
                      value={investigationReport.conclusions}
                      onChange={(e) => setInvestigationReport({...investigationReport, conclusions: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Recommendations</label>
                    <Textarea
                      placeholder="Recommendations..."
                      value={investigationReport.recommendations}
                      onChange={(e) => setInvestigationReport({...investigationReport, recommendations: e.target.value})}
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleSubmitInvestigationReport}
                      disabled={submittingReport || !investigationReport.background || !investigationReport.findings || !investigationReport.conclusions}
                      className="flex-1"
                    >
                      {submittingReport ? "Submitting..." : "Submit Report"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowInvestigationReportModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Petition Modal */}
          {showPetitionModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Submit Petition</span>
                    <Button variant="ghost" size="sm" onClick={() => setShowPetitionModal(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Reason for Dissatisfaction *</label>
                    <Textarea
                      placeholder="Explain why you are dissatisfied with the response..."
                      value={petitionData.reasonForDissatisfaction}
                      onChange={(e) => setPetitionData({...petitionData, reasonForDissatisfaction: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Explanation *</label>
                    <Textarea
                      placeholder="Provide detailed explanation of your concerns..."
                      value={petitionData.explanation}
                      onChange={(e) => setPetitionData({...petitionData, explanation: e.target.value})}
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Additional Information</label>
                    <Textarea
                      placeholder="Any additional information or context..."
                      value={petitionData.additionalInfo}
                      onChange={(e) => setPetitionData({...petitionData, additionalInfo: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Requested Action</label>
                    <Textarea
                      placeholder="What action would you like to be taken?"
                      value={petitionData.requestedAction}
                      onChange={(e) => setPetitionData({...petitionData, requestedAction: e.target.value})}
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleSubmitPetition}
                      disabled={submittingPetition || !petitionData.reasonForDissatisfaction || !petitionData.explanation}
                      className="flex-1"
                    >
                      {submittingPetition ? "Submitting..." : "Submit Petition"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowPetitionModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Departmental Response Modal */}
          {showDepartmentResponseModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
              <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Submit Departmental Response</span>
                    <Button variant="ghost" size="sm" onClick={() => setShowDepartmentResponseModal(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Summary *</label>
                    <Textarea
                      placeholder="Brief summary of the complaint..."
                      value={departmentResponse.summary}
                      onChange={(e) => setDepartmentResponse({...departmentResponse, summary: e.target.value})}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Investigation Conducted</label>
                    <Textarea
                      placeholder="Describe the investigation or review conducted by the department..."
                      value={departmentResponse.investigationConducted}
                      onChange={(e) => setDepartmentResponse({...departmentResponse, investigationConducted: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Findings</label>
                    <Textarea
                      placeholder="Document your findings..."
                      value={departmentResponse.findings}
                      onChange={(e) => setDepartmentResponse({...departmentResponse, findings: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Actions Taken</label>
                    <Textarea
                      placeholder="Describe actions taken or proposed..."
                      value={departmentResponse.actionsTaken}
                      onChange={(e) => setDepartmentResponse({...departmentResponse, actionsTaken: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Proposed Actions</label>
                    <Textarea
                      placeholder="Any proposed future actions..."
                      value={departmentResponse.proposedActions}
                      onChange={(e) => setDepartmentResponse({...departmentResponse, proposedActions: e.target.value})}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Official Response to Complainant *</label>
                    <Textarea
                      placeholder="Official response to be sent to the complainant..."
                      value={departmentResponse.officialResponse}
                      onChange={(e) => setDepartmentResponse({...departmentResponse, officialResponse: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Recommendations</label>
                    <Textarea
                      placeholder="Any recommendations..."
                      value={departmentResponse.recommendations}
                      onChange={(e) => setDepartmentResponse({...departmentResponse, recommendations: e.target.value})}
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleSubmitDepartmentalResponse}
                      disabled={submittingResponse || !departmentResponse.summary || !departmentResponse.officialResponse}
                      className="flex-1"
                    >
                      {submittingResponse ? "Submitting..." : "Submit Response"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowDepartmentResponseModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Assign Department Modal */}
          {showAssignDepartmentModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{(complaint.category === 'Administrative Complaints' || complaint.category === 'አስተዳደራዊ ጥቆማ' || complaint.category === 'አስተዳደራዊ ቅሬታ') ? 'Assign to Administrative Complaints Team' : 'Assign to Department'}</span>
                    <Button variant="ghost" size="sm" onClick={() => setShowAssignDepartmentModal(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(complaint?.category === 'Administrative Complaints' || complaint?.category === 'አስተዳደራዊ ጥቆማ' || complaint?.category === 'አስተዳደራዊ ቅሬታ') ? (
                    <div>
                      <label className="block text-sm font-medium mb-2">Administrative Complaints Team Member</label>
                      <Select value={selectedTeamMember} onValueChange={setSelectedTeamMember}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team member" />
                        </SelectTrigger>
                        <SelectContent>
                          {administrativeTeamMembers.length === 0 ? (
                            <div className="p-2 text-sm text-gray-500">No team members available</div>
                          ) : (
                            administrativeTeamMembers.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.firstName} {member.lastName} ({member.email})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium mb-2">Department</label>
                      <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.length === 0 ? (
                            <div className="p-2 text-sm text-gray-500">No departments available</div>
                          ) : (
                            departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-2">Instructions (Optional)</label>
                    <Textarea
                      placeholder="Add any instructions..."
                      value={departmentInstructions}
                      onChange={(e) => setDepartmentInstructions(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleAssignToDepartment}
                      disabled={assigningDepartment || (!(complaint.category === 'Administrative Complaints' || complaint.category === 'አስተዳደራዊ ጥቆማ' || complaint.category === 'አስተዳደራዊ ቅሬታ') && !selectedDepartment)}
                      className="flex-1"
                    >
                      {assigningDepartment ? "Assigning..." : "Assign"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowAssignDepartmentModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Return to Complainant Modal */}
          {showReturnModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Return to Complainant</span>
                    <Button variant="ghost" size="sm" onClick={() => setShowReturnModal(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Reason for Return</label>
                    <Textarea
                      placeholder="Please provide a reason for returning this complaint to the complainant..."
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleReturnToComplainant}
                      disabled={returning || !returnReason.trim()}
                      className="flex-1"
                    >
                      {returning ? "Returning..." : "Return"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowReturnModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Assign Investigation Modal */}
          {showAssignModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Assign Investigator</span>
                    <Button variant="ghost" size="sm" onClick={() => setShowAssignModal(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Investigator</label>
                    <Select value={selectedInvestigator} onValueChange={setSelectedInvestigator}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select investigator" />
                      </SelectTrigger>
                      <SelectContent>
                        {investigators.map((user) => {
                          const roles = user.roles || [];
                          const roleNames = roles.map((r: any) => typeof r === 'string' ? r : (r.name || '')).join(', ');
                          const displayLabel = roleNames ? `Authorized Comment - ${roleNames}` : 'Authorized Comment';
                          return (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName} - {displayLabel}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Target Completion Date</label>
                    <Input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleAssignInvestigation}
                      disabled={assigning || !selectedInvestigator}
                      className="flex-1"
                    >
                      {assigning ? "Assigning..." : "Assign"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowAssignModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {/* Administrative Investigation Report Modal */}
          {showAdminInvestigationModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
              <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Submit Administrative Investigation Report</span>
                    <Button variant="ghost" size="sm" onClick={() => setShowAdminInvestigationModal(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Background *</label>
                    <Textarea
                      placeholder="Provide background information about the complaint..."
                      value={adminInvestigationReport.background}
                      onChange={(e) => setAdminInvestigationReport({...adminInvestigationReport, background: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Objectives *</label>
                    <Textarea
                      placeholder="State the objectives of the investigation..."
                      value={adminInvestigationReport.objectives}
                      onChange={(e) => setAdminInvestigationReport({...adminInvestigationReport, objectives: e.target.value})}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Activities Performed *</label>
                    <Textarea
                      placeholder="Describe the investigation activities performed..."
                      value={adminInvestigationReport.activitiesPerformed}
                      onChange={(e) => setAdminInvestigationReport({...adminInvestigationReport, activitiesPerformed: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Evidence Collected *</label>
                    <Textarea
                      placeholder="List evidence collected during investigation..."
                      value={adminInvestigationReport.evidenceCollected}
                      onChange={(e) => setAdminInvestigationReport({...adminInvestigationReport, evidenceCollected: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Persons Interviewed</label>
                    <Textarea
                      placeholder="List persons interviewed..."
                      value={adminInvestigationReport.personsInterviewed}
                      onChange={(e) => setAdminInvestigationReport({...adminInvestigationReport, personsInterviewed: e.target.value})}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Findings *</label>
                    <Textarea
                      placeholder="Present your findings..."
                      value={adminInvestigationReport.findings}
                      onChange={(e) => setAdminInvestigationReport({...adminInvestigationReport, findings: e.target.value})}
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Observations</label>
                    <Textarea
                      placeholder="Additional observations..."
                      value={adminInvestigationReport.observations}
                      onChange={(e) => setAdminInvestigationReport({...adminInvestigationReport, observations: e.target.value})}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Conclusions *</label>
                    <Textarea
                      placeholder="State your conclusions..."
                      value={adminInvestigationReport.conclusions}
                      onChange={(e) => setAdminInvestigationReport({...adminInvestigationReport, conclusions: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Recommendations *</label>
                    <Textarea
                      placeholder="Provide recommendations..."
                      value={adminInvestigationReport.recommendations}
                      onChange={(e) => setAdminInvestigationReport({...adminInvestigationReport, recommendations: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleSubmitAdminInvestigationReport}
                      disabled={submittingAdminReport || !adminInvestigationReport.background || !adminInvestigationReport.findings || !adminInvestigationReport.conclusions}
                      className="flex-1"
                    >
                      {submittingAdminReport ? "Submitting..." : "Submit Report"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowAdminInvestigationModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {/* Commissioner Decision Modal */}
          {showCommissionerDecisionModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Commissioner Review and Decision</span>
                    <Button variant="ghost" size="sm" onClick={() => setShowCommissionerDecisionModal(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                        <SelectItem value="approve">Approve Investigation Report</SelectItem>
                        <SelectItem value="return">Return for Further Investigation</SelectItem>
                        <SelectItem value="reject">Reject and Close Complaint</SelectItem>
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
                      onClick={handleCommissionerDecision}
                      disabled={submittingCommissionerDecision || !commissionerDecision.decision || !commissionerDecision.comments}
                      className="flex-1"
                    >
                      {submittingCommissionerDecision ? "Submitting..." : "Submit Decision"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowCommissionerDecisionModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {/* Final Response Modal */}
          {showFinalResponseModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Send Final Response to Complainant</span>
                    <Button variant="ghost" size="sm" onClick={() => setShowFinalResponseModal(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Official Response *</label>
                    <Textarea
                      placeholder="Provide the official response to the complainant based on the Commissioner's decision..."
                      value={finalResponse.officialResponse}
                      onChange={(e) => setFinalResponse({...finalResponse, officialResponse: e.target.value})}
                      rows={6}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleSendFinalResponse}
                      disabled={submittingFinalResponse || !finalResponse.officialResponse}
                      className="flex-1"
                    >
                      {submittingFinalResponse ? "Sending..." : "Send Response"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowFinalResponseModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
