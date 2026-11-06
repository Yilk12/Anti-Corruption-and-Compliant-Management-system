"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUserPrimaryRole } from "@/app/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { FileText, Clock, User, Calendar, AlertTriangle, CheckCircle, Gavel, Download, Printer, Send, Loader2 } from "lucide-react";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

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
    category?: string;
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

export default function ManagerPetitionsPage() {
  const router = useRouter();
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPetition, setSelectedPetition] = useState<Petition | null>(null);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionData, setDecisionData] = useState({
    decision: "",
    decisionReason: "",
  });
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationDetails, setNotificationDetails] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [showCommissionerModal, setShowCommissionerModal] = useState(false);
  const [commissionerData, setCommissionerData] = useState({
    commissionerId: '',
    managerConclusion: '',
  });
  const [commissioners, setCommissioners] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

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
    if (role !== "feedback_complaint_manager" && role !== "admin" && role !== "commissioner") {
      router.replace("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    fetchPetitions();
    fetchCommissioners();
  }, []);

  useEffect(() => {
    if (selectedPetition) {
      fetchMessages(selectedPetition.complaint.id);
    }
  }, [selectedPetition]);

  const fetchPetitions = async () => {
    try {
      const token = getToken();
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const response = await fetch(`${API_BASE}/api/feedback/petitions/all`, { headers });
      const data = response.ok ? await response.json() : [];
      setPetitions(data);
    } catch (error) {
      console.error("Error fetching petitions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissioners = async () => {
    try {
      const token = getToken();
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const response = await fetch(`${API_BASE}/api/users?page=1&limit=100`, { headers });
      const json = await response.json();
      const data = json.users || json.items || [];
      // Filter for commissioners on client side
      const commissioners = data.filter((user: any) =>
        user.roles && (user.roles.includes('commissioner') || user.roles.includes('Commissioner'))
      );
      setCommissioners(commissioners);
    } catch (error) {
      console.error("Error fetching commissioners:", error);
    }
  };

  const fetchMessages = async (complaintId: string) => {
    try {
      const token = getToken();
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const response = await fetch(`${API_BASE}/api/feedback/complaints/${complaintId}/messages`, { headers });
      const data = response.ok ? await response.json() : [];
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedPetition || !newMessage.trim()) return;

    try {
      setSendingMessage(true);
      const token = getToken();
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" };

      const response = await fetch(
        `${API_BASE}/api/feedback/complaints/${selectedPetition.complaint.id}/messages`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: newMessage,
            messageType: 'REPLY',
            visibility: 'INTERNAL_ONLY',
          }),
        }
      );

      if (response.ok) {
        setNewMessage('');
        fetchMessages(selectedPetition.complaint.id);
      } else {
        alert('Failed to send message');
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert('Error sending message');
    } finally {
      setSendingMessage(false);
    }
  };

  const downloadFinalDecision = async (petition: Petition) => {
    if (!petition.investigationReport?.finalDecision) return;

    const parsedDecisionData = JSON.parse(petition.investigationReport.finalDecision);

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Title
          new Paragraph({
            text: "FINAL DECISION REPORT",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            shading: { fill: "1f2937" },
            children: [new TextRun({ text: "FINAL DECISION REPORT", color: "ffffff", bold: true, size: 32 })]
          }),

          // Petition Information
          new Paragraph({
            text: "Petition Information",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 200 },
            shading: { fill: "e5e7eb" },
            children: [new TextRun({ text: "Petition Information", bold: true, size: 28 })]
          }),
          new Paragraph({ text: `Petition Number: ${petition.petitionNumber}`, spacing: { after: 100 } }),
          new Paragraph({ text: `Complaint Tracking ID: ${petition.complaint.trackingId}`, spacing: { after: 100 } }),
          new Paragraph({ text: `የጥቆማ አይነት: ${getComplaintCategory(petition.complaint.subject, petition.complaint.category)}`, spacing: { after: 100 } }),
          new Paragraph({ text: `ቅሬታ የተደረገበት አካል: ${petition.complaint.subject}`, spacing: { after: 100 } }),

          // Complainant Information - Gray section
          new Paragraph({
            text: "COMPLAINANT INFORMATION",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
            shading: { fill: "f3f4f6" },
            children: [new TextRun({ text: "COMPLAINANT INFORMATION", bold: true, size: 28, color: "1f2937" })]
          }),
          new Paragraph({ text: `የጥቆማ አይነት: ${getComplaintCategory(petition.complaint.subject, petition.complaint.category)}`, spacing: { after: 100 } }),
          ...(petition.complaint.complainantName ? [new Paragraph({ text: `Name: ${petition.complaint.complainantName}`, spacing: { after: 100 } })] : []),
          ...(petition.complaint.complainantEmail ? [new Paragraph({ text: `Email: ${petition.complaint.complainantEmail}`, spacing: { after: 100 } })] : []),
          ...(petition.complaint.complainantPhone ? [new Paragraph({ text: `Phone: ${petition.complaint.complainantPhone}`, spacing: { after: 100 } })] : []),
          ...(petition.complaint.complainantDepartment ? [new Paragraph({ text: `Department: ${petition.complaint.complainantDepartment}`, spacing: { after: 100 } })] : []),
          ...(petition.complaint.complainantPosition ? [new Paragraph({ text: `Position: ${petition.complaint.complainantPosition}`, spacing: { after: 100 } })] : []),

          // Complaint Details - Blue section
          new Paragraph({
            text: "COMPLAINT DETAILS",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
            shading: { fill: "dbeafe" },
            children: [new TextRun({ text: "COMPLAINT DETAILS", bold: true, size: 28, color: "1e40af" })]
          }),
          new Paragraph({ text: `ቅሬታ የተደረገበት አካል: ${petition.complaint.subject}`, spacing: { after: 100 }, children: [new TextRun({ color: "1e40af" })] }),
          ...(petition.complaint.institution ? [new Paragraph({ text: `Institution: ${petition.complaint.institution}`, spacing: { after: 100 }, children: [new TextRun({ color: "1e40af" })] })] : []),
          ...(petition.complaint.departmentName ? [new Paragraph({ text: `Department: ${petition.complaint.departmentName}`, spacing: { after: 100 }, children: [new TextRun({ color: "1e40af" })] })] : []),
          new Paragraph({ text: `Date Submitted: ${new Date(petition.complaint.createdAt).toLocaleString()}`, spacing: { after: 100 }, children: [new TextRun({ color: "1e40af" })] }),

          // Description
          new Paragraph({
            text: "DESCRIPTION",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
            shading: { fill: "dbeafe" },
            children: [new TextRun({ text: "DESCRIPTION", bold: true, size: 28, color: "1e40af" })]
          }),
          new Paragraph({ text: petition.complaint.description, spacing: { after: 100 }, children: [new TextRun({ color: "1e40af" })] }),

          // Department Response - Purple section
          new Paragraph({
            text: "DEPARTMENT RESPONSE",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
            shading: { fill: "f3e8ff" },
            children: [new TextRun({ text: "DEPARTMENT RESPONSE", bold: true, size: 28, color: "6b21a8" })]
          }),
          ...(petition.complaint.departmentalResponse?.summary ? [new Paragraph({ text: `Summary: ${petition.complaint.departmentalResponse.summary}`, spacing: { after: 100 }, children: [new TextRun({ color: "6b21a8" })] })] : []),
          ...(petition.complaint.departmentalResponse?.investigationConducted ? [new Paragraph({ text: `Investigation Conducted: ${petition.complaint.departmentalResponse.investigationConducted}`, spacing: { after: 100 }, children: [new TextRun({ color: "6b21a8" })] })] : []),
          ...(petition.complaint.departmentalResponse?.findings ? [new Paragraph({ text: `Findings: ${petition.complaint.departmentalResponse.findings}`, spacing: { after: 100 }, children: [new TextRun({ color: "6b21a8" })] })] : []),
          ...(petition.complaint.departmentalResponse?.actionsTaken ? [new Paragraph({ text: `Actions Taken: ${petition.complaint.departmentalResponse.actionsTaken}`, spacing: { after: 100 }, children: [new TextRun({ color: "6b21a8" })] })] : []),
          ...(petition.complaint.departmentalResponse?.officialResponse ? [new Paragraph({ text: `Official Response: ${petition.complaint.departmentalResponse.officialResponse}`, spacing: { after: 100 }, children: [new TextRun({ color: "6b21a8" })] })] : []),
          ...(petition.complaint.departmentalResponse?.recommendations ? [new Paragraph({ text: `Recommendations: ${petition.complaint.departmentalResponse.recommendations}`, spacing: { after: 100 }, children: [new TextRun({ color: "6b21a8" })] })] : []),

          // Complainant's Petition - Orange section
          new Paragraph({
            text: "COMPLAINANT'S PETITION",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
            shading: { fill: "ffedd5" },
            children: [new TextRun({ text: "COMPLAINANT'S PETITION", bold: true, size: 28, color: "9a3412" })]
          }),
          new Paragraph({ text: `Reason for Dissatisfaction: ${petition.reasonForDissatisfaction || ''}`, spacing: { after: 100 }, children: [new TextRun({ color: "9a3412" })] }),
          ...(petition.explanation ? [new Paragraph({ text: `Explanation: ${petition.explanation}`, spacing: { after: 100 }, children: [new TextRun({ color: "9a3412" })] })] : []),
          ...(petition.additionalInfo ? [new Paragraph({ text: `Additional Information: ${petition.additionalInfo}`, spacing: { after: 100 }, children: [new TextRun({ color: "9a3412" })] })] : []),
          ...(petition.requestedAction ? [new Paragraph({ text: `Requested Corrective Action: ${petition.requestedAction}`, spacing: { after: 100 }, children: [new TextRun({ color: "9a3412" })] })] : []),

          // Investigation Instructions - Blue section
          ...(petition.investigationInstructions ? [
            new Paragraph({
              text: "INVESTIGATION INSTRUCTIONS",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
              shading: { fill: "dbeafe" },
              children: [new TextRun({ text: "INVESTIGATION INSTRUCTIONS", bold: true, size: 28, color: "1e40af" })]
            }),
            new Paragraph({ text: petition.investigationInstructions, spacing: { after: 100 }, children: [new TextRun({ color: "1e40af" })] })
          ] : []),

          // Investigation Report - Green section
          new Paragraph({
            text: "INVESTIGATION REPORT",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
            shading: { fill: "dcfce7" },
            children: [new TextRun({ text: "INVESTIGATION REPORT", bold: true, size: 28, color: "166534" })]
          }),
          ...(petition.investigationReport?.background ? [new Paragraph({ text: `Background: ${petition.investigationReport.background}`, spacing: { after: 100 }, children: [new TextRun({ color: "166534" })] })] : []),
          ...(petition.investigationReport?.objectives ? [new Paragraph({ text: `Objectives: ${petition.investigationReport.objectives}`, spacing: { after: 100 }, children: [new TextRun({ color: "166534" })] })] : []),
          ...(petition.investigationReport?.activitiesPerformed ? [new Paragraph({ text: `Activities Performed: ${petition.investigationReport.activitiesPerformed}`, spacing: { after: 100 }, children: [new TextRun({ color: "166534" })] })] : []),
          ...(petition.investigationReport?.evidenceCollected ? [new Paragraph({ text: `Evidence Collected: ${petition.investigationReport.evidenceCollected}`, spacing: { after: 100 }, children: [new TextRun({ color: "166534" })] })] : []),
          ...(petition.investigationReport?.personsInterviewed ? [new Paragraph({ text: `Persons Interviewed: ${petition.investigationReport.personsInterviewed}`, spacing: { after: 100 }, children: [new TextRun({ color: "166534" })] })] : []),
          ...(petition.investigationReport?.findings ? [new Paragraph({ text: `Findings: ${petition.investigationReport.findings}`, spacing: { after: 100 }, children: [new TextRun({ color: "166534" })] })] : []),
          ...(petition.investigationReport?.observations ? [new Paragraph({ text: `Observations: ${petition.investigationReport.observations}`, spacing: { after: 100 }, children: [new TextRun({ color: "166534" })] })] : []),
          ...(petition.investigationReport?.conclusions ? [new Paragraph({ text: `Conclusions: ${petition.investigationReport.conclusions}`, spacing: { after: 100 }, children: [new TextRun({ color: "166534" })] })] : []),
          ...(petition.investigationReport?.recommendations ? [new Paragraph({ text: `Recommendations: ${petition.investigationReport.recommendations}`, spacing: { after: 100 }, children: [new TextRun({ color: "166534" })] })] : []),
          new Paragraph({ text: `Report Submitted: ${petition.investigationReport.submittedAt ? new Date(petition.investigationReport.submittedAt).toLocaleString() : 'N/A'}`, spacing: { after: 100 }, children: [new TextRun({ color: "166534" })] }),

          // Final Decision - Dark section
          new Paragraph({
            text: "FINAL DECISION",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
            shading: { fill: "1f2937" },
            children: [new TextRun({ text: "FINAL DECISION", bold: true, size: 28, color: "ffffff" })]
          }),
          new Paragraph({ text: `Decision: ${parsedDecisionData.decision}`, spacing: { after: 100 }, children: [new TextRun({ color: "ffffff" })] }),
          ...(parsedDecisionData.rationale ? [new Paragraph({ text: `Rationale: ${parsedDecisionData.rationale}`, spacing: { after: 100 }, children: [new TextRun({ color: "ffffff" })] })] : []),
          ...(parsedDecisionData.actionsToBeTaken ? [new Paragraph({ text: `Actions to be Taken: ${parsedDecisionData.actionsToBeTaken}`, spacing: { after: 100 }, children: [new TextRun({ color: "ffffff" })] })] : []),
          ...(parsedDecisionData.timeline ? [new Paragraph({ text: `Timeline: ${parsedDecisionData.timeline}`, spacing: { after: 100 }, children: [new TextRun({ color: "ffffff" })] })] : []),
          new Paragraph({ text: `Decision Date: ${petition.investigationReport.finalDecisionAt ? new Date(petition.investigationReport.finalDecisionAt).toLocaleString() : 'N/A'}`, spacing: { after: 100 }, children: [new TextRun({ color: "ffffff" })] }),
          new Paragraph({ text: `Decision By: ${petition.investigationReport.finalDecisionBy ? `${petition.investigationReport.finalDecisionBy.firstName} ${petition.investigationReport.finalDecisionBy.lastName}${petition.investigationReport.finalDecisionBy.position ? ` (${petition.investigationReport.finalDecisionBy.position})` : ''}` : 'N/A'}`, children: [new TextRun({ color: "ffffff" })] }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FinalDecision_${petition.petitionNumber}_${new Date().toISOString().split('T')[0]}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmitDecision = async () => {
    if (!selectedPetition) return;

    try {
      setSubmittingDecision(true);
      const token = getToken();
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" };

      const response = await fetch(
        `${API_BASE}/api/feedback/complaints/${selectedPetition.complaint.id}/final-decision`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            decision: decisionData.decision,
            decisionReason: decisionData.decisionReason,
          }),
        }
      );

      if (response.ok) {
        setShowDecisionModal(false);
        setSelectedPetition(null);
        setDecisionData({ decision: "", decisionReason: "" });
        fetchPetitions();
      }
    } catch (error) {
      console.error("Error submitting decision:", error);
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleSendToAll = async (petition: Petition) => {
    setSelectedPetition(petition);

    // Get commissioner decision data
    let commissionerDecision = null;
    if (petition.investigationReport?.observations) {
      try {
        const observations = JSON.parse(petition.investigationReport.observations);
        commissionerDecision = observations.commissionerDecision;
      } catch {
        // Not JSON
      }
    }

    // If commissioner decision exists, show notification modal
    if (commissionerDecision) {
      const details = {
        commissionerDecision,
        complainantEmail: petition.complaint.complainantEmail,
        complainantName: petition.complaint.complainantName,
        concernedDepartment: commissionerDecision?.responsibleDepartment || petition.complaint.institution || petition.complaint.departmentName,
        petitionNumber: petition.petitionNumber,
      };

      setNotificationDetails(details);
      setShowNotificationModal(true);
    } else {
      // Otherwise show commissioner selection modal
      setShowCommissionerModal(true);
    }
  };

  const handleSendToCommissioner = async () => {
    if (!selectedPetition || !commissionerData.commissionerId) {
      alert("Please select a commissioner");
      return;
    }

    try {
      setSendingNotification(true);
      const token = getToken();
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" };

      const response = await fetch(
        `${API_BASE}/api/feedback/petitions/${selectedPetition.id}/send-to-commissioner`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            commissionerId: commissionerData.commissionerId,
            managerConclusion: commissionerData.managerConclusion,
          }),
        }
      );

      if (response.ok) {
        setShowCommissionerModal(false);
        setCommissionerData({ commissionerId: '', managerConclusion: '' });
        alert('የአቤቱታ ሪፖርት በትክክል ተልኳል');
        fetchPetitions();
      } else {
        const data = await response.json();
        alert(`Failed to send to commissioner: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error sending to commissioner:", error);
      alert(`Error sending to commissioner: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSendingNotification(false);
    }
  };

  const downloadCommissionerDecisionNotification = (details: any) => {
    const decision = details.commissionerDecision;

    const content = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
<head>
<meta charset="utf-8">
<title>Commissioner Decision Notification</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5; }
  h1 { font-size: 18pt; font-weight: bold; color: #1e3a8a; page-break-after: avoid; }
  h2 { font-size: 14pt; font-weight: bold; color: #1e40af; margin-top: 20px; }
  h3 { font-size: 12pt; font-weight: bold; color: #3b82f6; margin-top: 15px; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0; }
  td { border: 1px solid #d1d5db; padding: 8px; vertical-align: top; }
  .label { font-weight: bold; background-color: #f3f4f6; width: 30%; }
  .value { background-color: #ffffff; }
  .section { margin: 20px 0; padding: 15px; border: 1px solid #e5e7eb; border-radius: 5px; }
  .header { background-color: #1e3a8a; color: white; padding: 15px; text-align: center; }
  .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #1e3a8a; font-size: 10pt; color: #6b7280; }
</style>
</head>
<body>
  <div class="header">
    <h1>ETHIOPIAN CIVIL SERVICE COMMISSION</h1>
    <h2>COMMISSIONER FINAL DECISION NOTIFICATION</h2>
  </div>

  <div class="section">
    <h3>NOTIFICATION TO CONCERNED DEPARTMENT</h3>
    <table>
      <tr><td class="label">To:</td><td class="value">${details.concernedDepartment || 'N/A'}</td></tr>
      <tr><td class="label">Petition Number:</td><td class="value">${details.petitionNumber || 'N/A'}</td></tr>
    </table>
    <div style="margin-top: 15px; padding: 15px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 5px;">
      <p style="font-weight: bold; color: #c2410c; margin-bottom: 10px;">=== COMMISSIONER FINAL DECISION - ACTION REQUIRED ===</p>
      <p>The Commissioner has issued a final decision on petition ${details.petitionNumber} that requires your department's attention.</p>
    </div>
  </div>

  <div class="section">
    <h3>PETITION INFORMATION</h3>
    <table>
      <tr><td class="label">Petition Subject:</td><td class="value">${decision.petitionSubject || 'N/A'}</td></tr>
      <tr><td class="label">Petitioner Name:</td><td class="value">${decision.petitionerName || 'N/A'}</td></tr>
      <tr><td class="label">Concerned Department:</td><td class="value">${decision.concernedDepartment || 'N/A'}</td></tr>
      <tr><td class="label">Date Received:</td><td class="value">${decision.dateReceived || 'N/A'}</td></tr>
    </table>
  </div>

  <div class="section">
    <h3>INVESTIGATION SUMMARY</h3>
    <table>
      <tr><td class="label">Summary of Findings:</td><td class="value">${decision.summaryOfFindings || 'N/A'}</td></tr>
      <tr><td class="label">Evidence Reviewed:</td><td class="value">${decision.evidenceReviewed || 'N/A'}</td></tr>
      <tr><td class="label">Investigator Recommendation:</td><td class="value">${decision.investigatorRecommendation || 'N/A'}</td></tr>
    </table>
  </div>

  <div class="section">
    <h3>COMMISSIONER'S DECISION</h3>
    <table>
      <tr><td class="label">Commissioner's Observations:</td><td class="value">${decision.commissionerObservations || 'N/A'}</td></tr>
      <tr><td class="label">Legal/Policy Basis:</td><td class="value">${decision.legalPolicyBasis || 'N/A'}</td></tr>
    </table>
  </div>

  <div class="section">
    <h3>DECISION DETAILS</h3>
    <table>
      <tr><td class="label">Decision Type:</td><td class="value">${decision.decisionType || 'N/A'}</td></tr>
      <tr><td class="label">Disciplinary Action:</td><td class="value">${decision.disciplinaryAction || 'N/A'}</td></tr>
      <tr><td class="label">Responsible Department:</td><td class="value">${decision.responsibleDepartment || details.concernedDepartment || 'N/A'}</td></tr>
      <tr><td class="label">Implementation Deadline:</td><td class="value">${decision.implementationDeadline || 'N/A'}</td></tr>
    </table>
  </div>

  <div class="section">
    <h3>FINAL DECISION SUMMARY</h3>
    <p>${decision.finalDecisionSummary || 'N/A'}</p>
  </div>

  <div class="section">
    <h3>DECISION AUTHORIZATION</h3>
    <table>
      <tr><td class="label">Commissioner Name:</td><td class="value">${decision.commissionerName || 'N/A'}</td></tr>
      <tr><td class="label">Decision Date:</td><td class="value">${decision.decisionDate || 'N/A'}</td></tr>
      <tr><td class="label">Final Petition Status:</td><td class="value">${decision.finalPetitionStatus || 'N/A'}</td></tr>
      <tr><td class="label">Closure Remarks:</td><td class="value">${decision.closureRemarks || 'N/A'}</td></tr>
    </table>
  </div>

  <div class="section" style="background: #fef2f2; border: 2px solid #ef4444;">
    <h3 style="color: #dc2626;">ACTION REQUIRED</h3>
    <p style="color: #dc2626; font-weight: bold;">Please implement the disciplinary action(s) as specified above by the implementation deadline.</p>
    <p style="color: #dc2626;">Report back on the implementation status within the specified timeframe.</p>
  </div>

  <div class="footer">
    <p><strong>Ethics and Anti-Corruption Commission</strong></p>
    <p>This decision has been communicated to the concerned department for implementation.</p>
    <p>Sincerely, Ethics and Anti-Corruption Commission</p>
    <p>Generated on: ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
    `.trim();

    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Commissioner_Decision_Notification_${details.petitionNumber || 'Petition'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadDepartmentNotification = (details: any) => {
    const decision = details.commissionerDecision;

    const content = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
<head>
<meta charset="utf-8">
<title>Department Decision Notification</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5; }
  h1 { font-size: 18pt; font-weight: bold; color: #1e3a8a; page-break-after: avoid; }
  h2 { font-size: 14pt; font-weight: bold; color: #1e40af; margin-top: 20px; }
  h3 { font-size: 12pt; font-weight: bold; color: #3b82f6; margin-top: 15px; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0; }
  td { border: 1px solid #d1d5db; padding: 8px; vertical-align: top; }
  .label { font-weight: bold; background-color: #f3f4f6; width: 30%; }
  .value { background-color: #ffffff; }
  .section { margin: 20px 0; padding: 15px; border: 1px solid #e5e7eb; border-radius: 5px; }
  .header { background-color: #1e3a8a; color: white; padding: 15px; text-align: center; }
  .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #1e3a8a; font-size: 10pt; color: #6b7280; }
</style>
</head>
<body>
  <div class="header">
    <h1>የመጨረሻ የአቤቱታ ዉሳኔ ዝርዝር</h1>
    <h2>የኮሚሽነር የመጨረሻ ዉሳኔ</h2>
  </div>

  <div class="section">
    <h3>NOTIFICATION DETAILS</h3>
    <table>
      <tr><td class="label">To:</td><td class="value">${details.concernedDepartment || 'N/A'}</td></tr>
      <tr><td class="label">Petition Subject:</td><td class="value">${decision.petitionSubject || 'N/A'}</td></tr>
      <tr><td class="label">Petitioner Name:</td><td class="value">${decision.petitionerName || 'N/A'}</td></tr>
    </table>
  </div>

  <div class="section">
    <h3>የኮሚሽነር ዉሳኔ</h3>
    <table>
      <tr><td class="label">የኮሚሽነር ምልከታ:</td><td class="value">${decision.commissionerObservations || 'N/A'}</td></tr>
      <tr><td class="label">Legal/Policy Basis:</td><td class="value">${decision.legalPolicyBasis || 'N/A'}</td></tr>
    </table>
  </div>

  <div class="section">
    <h3>DECISION DETAILS</h3>
    <table>
      <tr><td class="label">Decision Type:</td><td class="value">${decision.decisionType || 'N/A'}</td></tr>
      <tr><td class="label">Disciplinary Action:</td><td class="value">${decision.disciplinaryAction || 'N/A'}</td></tr>
      <tr><td class="label">Responsible Department:</td><td class="value">${decision.responsibleDepartment || details.concernedDepartment || 'N/A'}</td></tr>
      <tr><td class="label">Implementation Deadline:</td><td class="value">${decision.implementationDeadline || 'N/A'}</td></tr>
    </table>
  </div>

  <div class="section">
    <h3>FINAL DECISION SUMMARY</h3>
    <p>${decision.finalDecisionSummary || 'N/A'}</p>
  </div>

  <div class="section">
    <h3>DECISION AUTHORIZATION</h3>
    <table>
      <tr><td class="label">Decision Date:</td><td class="value">${decision.decisionDate || 'N/A'}</td></tr>
      <tr><td class="label">Final Petition Status:</td><td class="value">${decision.finalPetitionStatus || 'N/A'}</td></tr>
      <tr><td class="label">Closure Remarks:</td><td class="value">${decision.closureRemarks || 'N/A'}</td></tr>
    </table>
  </div>

  <div class="footer">
    <p><strong>Ethics and Anti-Corruption Commission</strong></p>
    <p>Generated on: ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
    `.trim();

    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Department_Notification_${details.petitionNumber || 'Petition'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printDepartmentNotification = (details: any) => {
    const decision = details.commissionerDecision;

    const printContent = `
      <html>
      <head>
        <title>Department Decision Notification - Print</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5; margin: 0; padding: 20px; }
          h1 { font-size: 18pt; font-weight: bold; color: #1e3a8a; text-align: center; margin-bottom: 5px; }
          h2 { font-size: 14pt; font-weight: bold; color: #1e40af; text-align: center; margin-top: 0; margin-bottom: 20px; }
          h3 { font-size: 12pt; font-weight: bold; color: #3b82f6; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; }
          table { border-collapse: collapse; width: 100%; margin: 10px 0; }
          td { border: 1px solid #d1d5db; padding: 8px; vertical-align: top; }
          .label { font-weight: bold; background-color: #f3f4f6; width: 30%; }
          .value { background-color: #ffffff; }
          .section { margin: 20px 0; padding: 15px; border: 1px solid #e5e7eb; page-break-inside: avoid; }
          .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #1e3a8a; font-size: 10pt; color: #6b7280; text-align: center; }
          @media print {
            body { margin: 0; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>የመጨረሻ የአቤቱታ ዉሳኔ ዝርዝር</h1>
        <h2>የኮሚሽነር የመጨረሻ ዉሳኔ</h2>

        <div class="section">
          <h3>NOTIFICATION DETAILS</h3>
          <table>
            <tr><td class="label">To:</td><td class="value">${details.concernedDepartment || 'N/A'}</td></tr>
            <tr><td class="label">Petition Subject:</td><td class="value">${decision.petitionSubject || 'N/A'}</td></tr>
            <tr><td class="label">Petitioner Name:</td><td class="value">${decision.petitionerName || 'N/A'}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>የኮሚሽነር ዉሳኔ</h3>
          <table>
            <tr><td class="label">የኮሚሽነር ምልከታ:</td><td class="value">${decision.commissionerObservations || 'N/A'}</td></tr>
            <tr><td class="label">Legal/Policy Basis:</td><td class="value">${decision.legalPolicyBasis || 'N/A'}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>DECISION DETAILS</h3>
          <table>
            <tr><td class="label">Decision Type:</td><td class="value">${decision.decisionType || 'N/A'}</td></tr>
            <tr><td class="label">Disciplinary Action:</td><td class="value">${decision.disciplinaryAction || 'N/A'}</td></tr>
            <tr><td class="label">Responsible Department:</td><td class="value">${decision.responsibleDepartment || details.concernedDepartment || 'N/A'}</td></tr>
            <tr><td class="label">Implementation Deadline:</td><td class="value">${decision.implementationDeadline || 'N/A'}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>FINAL DECISION SUMMARY</h3>
          <p>${decision.finalDecisionSummary || 'N/A'}</p>
        </div>

        <div class="section">
          <h3>DECISION AUTHORIZATION</h3>
          <table>
            <tr><td class="label">Decision Date:</td><td class="value">${decision.decisionDate || 'N/A'}</td></tr>
            <tr><td class="label">Final Petition Status:</td><td class="value">${decision.finalPetitionStatus || 'N/A'}</td></tr>
            <tr><td class="label">Closure Remarks:</td><td class="value">${decision.closureRemarks || 'N/A'}</td></tr>
          </table>
        </div>

        <div class="footer">
          <p><strong>Ethics and Anti-Corruption Commission</strong></p>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const printCommissionerDecisionNotification = (details: any) => {
    const decision = details.commissionerDecision;

    const printContent = `
      <html>
      <head>
        <title>Commissioner Decision Notification - Print</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5; margin: 0; padding: 20px; }
          h1 { font-size: 18pt; font-weight: bold; color: #1e3a8a; text-align: center; margin-bottom: 5px; }
          h2 { font-size: 14pt; font-weight: bold; color: #1e40af; text-align: center; margin-top: 0; margin-bottom: 20px; }
          h3 { font-size: 12pt; font-weight: bold; color: #3b82f6; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; }
          table { border-collapse: collapse; width: 100%; margin: 10px 0; }
          td { border: 1px solid #d1d5db; padding: 8px; vertical-align: top; }
          .label { font-weight: bold; background-color: #f3f4f6; width: 30%; }
          .value { background-color: #ffffff; }
          .section { margin: 20px 0; padding: 15px; border: 1px solid #e5e7eb; page-break-inside: avoid; }
          .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #1e3a8a; font-size: 10pt; color: #6b7280; text-align: center; }
          @media print {
            body { margin: 0; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>ETHIOPIAN CIVIL SERVICE COMMISSION</h1>
        <h2>COMMISSIONER FINAL DECISION NOTIFICATION</h2>

        <div class="section">
          <h3>NOTIFICATION TO CONCERNED DEPARTMENT</h3>
          <table>
            <tr><td class="label">To:</td><td class="value">${details.concernedDepartment || 'N/A'}</td></tr>
            <tr><td class="label">Petition Number:</td><td class="value">${details.petitionNumber || 'N/A'}</td></tr>
          </table>
          <div style="margin-top: 15px; padding: 15px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 5px;">
            <p style="font-weight: bold; color: #c2410c; margin-bottom: 10px;">=== COMMISSIONER FINAL DECISION - ACTION REQUIRED ===</p>
            <p>The Commissioner has issued a final decision on petition ${details.petitionNumber} that requires your department's attention.</p>
          </div>
        </div>

        <div class="section">
          <h3>PETITION INFORMATION</h3>
          <table>
            <tr><td class="label">Petition Subject:</td><td class="value">${decision.petitionSubject || 'N/A'}</td></tr>
            <tr><td class="label">Petitioner Name:</td><td class="value">${decision.petitionerName || 'N/A'}</td></tr>
            <tr><td class="label">Concerned Department:</td><td class="value">${decision.concernedDepartment || 'N/A'}</td></tr>
            <tr><td class="label">Date Received:</td><td class="value">${decision.dateReceived || 'N/A'}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>INVESTIGATION SUMMARY</h3>
          <table>
            <tr><td class="label">Summary of Findings:</td><td class="value">${decision.summaryOfFindings || 'N/A'}</td></tr>
            <tr><td class="label">Evidence Reviewed:</td><td class="value">${decision.evidenceReviewed || 'N/A'}</td></tr>
            <tr><td class="label">Investigator Recommendation:</td><td class="value">${decision.investigatorRecommendation || 'N/A'}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>COMMISSIONER'S DECISION</h3>
          <table>
            <tr><td class="label">Commissioner's Observations:</td><td class="value">${decision.commissionerObservations || 'N/A'}</td></tr>
            <tr><td class="label">Legal/Policy Basis:</td><td class="value">${decision.legalPolicyBasis || 'N/A'}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>DECISION DETAILS</h3>
          <table>
            <tr><td class="label">Decision Type:</td><td class="value">${decision.decisionType || 'N/A'}</td></tr>
            <tr><td class="label">Disciplinary Action:</td><td class="value">${decision.disciplinaryAction || 'N/A'}</td></tr>
            <tr><td class="label">Responsible Department:</td><td class="value">${decision.responsibleDepartment || details.concernedDepartment || 'N/A'}</td></tr>
            <tr><td class="label">Implementation Deadline:</td><td class="value">${decision.implementationDeadline || 'N/A'}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>FINAL DECISION SUMMARY</h3>
          <p>${decision.finalDecisionSummary || 'N/A'}</p>
        </div>

        <div class="section">
          <h3>DECISION AUTHORIZATION</h3>
          <table>
            <tr><td class="label">Commissioner Name:</td><td class="value">${decision.commissionerName || 'N/A'}</td></tr>
            <tr><td class="label">Decision Date:</td><td class="value">${decision.decisionDate || 'N/A'}</td></tr>
            <tr><td class="label">Final Petition Status:</td><td class="value">${decision.finalPetitionStatus || 'N/A'}</td></tr>
            <tr><td class="label">Closure Remarks:</td><td class="value">${decision.closureRemarks || 'N/A'}</td></tr>
          </table>
        </div>

        <div class="section" style="background: #fef2f2; border: 2px solid #ef4444;">
          <h3 style="color: #dc2626;">ACTION REQUIRED</h3>
          <p style="color: #dc2626; font-weight: bold;">Please implement the disciplinary action(s) as specified above by the implementation deadline.</p>
          <p style="color: #dc2626;">Report back on the implementation status within the specified timeframe.</p>
        </div>

        <div class="footer">
          <p><strong>Ethics and Anti-Corruption Commission</strong></p>
          <p>This decision has been communicated to the concerned department for implementation.</p>
          <p>Sincerely, Ethics and Anti-Corruption Commission</p>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const confirmSendNotification = async () => {
    if (!selectedPetition || !notificationDetails) return;

    try {
      setSendingNotification(true);
      const token = getToken();
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" };

      const response = await fetch(
        `${API_BASE}/api/feedback/petitions/${selectedPetition.id}/send-notification`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(notificationDetails),
        }
      );

      if (response.ok) {
        setShowNotificationModal(false);
        setNotificationDetails(null);
        alert('Notification sent successfully to concerned department and complainant');
      } else {
        const data = await response.json();
        alert(`Failed to send notification: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      alert(`Error sending notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSendingNotification(false);
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
      case "Under Final Decision Review":
        return "bg-purple-100 text-purple-800";
      case "Final Decision Issued":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Petition Submitted":
        return "Petition Submitted";
      case "Assigned for Investigation":
        return "Assigned for Investigation";
      case "Investigation Report Submitted":
        return "Investigation Report Submitted";
      case "Under Final Decision Review":
        return "ለኮሚሽነር የተላከ";
      case "Final Decision Issued":
        return "Final Decision Issued";
      default:
        return status;
    }
  };

  const getComplaintCategory = (subject: string, category?: string) => {
    // Use category field if available, otherwise use subject
    const valueToCheck = category || subject;
    
    // Map complaint category/subject to standardized category names
    if (valueToCheck === "የአገልግሎት ቅሬታ") {
      return "የአገልግሎት ቅሬታ";
    }
    if (valueToCheck === "አስተዳደራዊ ጥቆማ" || valueToCheck === "አስተዳደራዊ ቅሬታ") {
      return "Administrative Complaints";
    }
    // If the value is a person's name (like "ሙሉጌታ አይተነዉ"), it's likely a service complaint
    // where the person field was entered as the subject
    if (valueToCheck && valueToCheck !== "የአገልግሎት ቅሬታ" && valueToCheck !== "አስተዳደራዊ ጥቆማ" && valueToCheck !== "አስተዳደራዊ ቅሬታ") {
      // Default to service complaint for person names or other values
      return "የአገልግሎት ቅሬታ";
    }
    // Return the original value if it doesn't match known categories
    return valueToCheck;
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePetitionClick = (petition: Petition) => {
    setSelectedPetition(petition);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    router.push("/dashboard/feedback-complaint-manager");
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">አቤቱታ (Petitions)</h1>
            <Button onClick={handlePrint} variant="outline" className="no-print">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>

          <style dangerouslySetInnerHTML={{
            __html: `
              @media print {
                .no-print {
                  display: none !important;
                }
                body {
                  background: white !important;
                  color: black !important;
                }
                .print-break {
                  page-break-before: always;
                  page-break-inside: avoid;
                }
                @page {
                  margin: 0.5cm;
                  size: A4;
                }
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .hover\\:shadow-lg {
                  box-shadow: none !important;
                }
                .transition-shadow {
                  transition: none !important;
                }
                .space-y-4 > * + * {
                  margin-top: 1rem !important;
                }
                .space-y-6 > * + * {
                  margin-top: 1.5rem !important;
                }
                .bg-gray-50 {
                  background-color: #f9fafb !important;
                  -webkit-print-color-adjust: exact !important;
                }
                .bg-indigo-50 {
                  background-color: #eef2ff !important;
                  -webkit-print-color-adjust: exact !important;
                }
                .bg-blue-50 {
                  background-color: #eff6ff !important;
                  -webkit-print-color-adjust: exact !important;
                }
                .bg-green-50 {
                  background-color: #f0fdf4 !important;
                  -webkit-print-color-adjust: exact !important;
                }
                .bg-yellow-50 {
                  background-color: #fefce8 !important;
                  -webkit-print-color-adjust: exact !important;
                }
                .border-gray-200,
                .border-indigo-200,
                .border-blue-200,
                .border-green-200 {
                  border-color: #e5e7eb !important;
                  -webkit-print-color-adjust: exact !important;
                }
                .text-gray-900,
                .text-indigo-900,
                .text-blue-900,
                .text-green-900 {
                  color: #111827 !important;
                }
                .text-gray-700,
                .text-indigo-700,
                .text-blue-700,
                .text-green-700 {
                  color: #374151 !important;
                }
                .text-gray-800,
                .text-indigo-800,
                .text-blue-800,
                .text-green-800 {
                  color: #1f2937 !important;
                }
                .text-gray-600,
                .text-indigo-600,
                .text-blue-600,
                .text-green-600 {
                  color: #4b5563 !important;
                }
                .text-gray-500 {
                  color: #6b7280 !important;
                }
                .bg-yellow-100 {
                  background-color: #fef9c3 !important;
                  -webkit-print-color-adjust: exact !important;
                }
                .text-yellow-800 {
                  color: #854d0e !important;
                }
                .bg-orange-100 {
                  background-color: #ffedd5 !important;
                  -webkit-print-color-adjust: exact !important;
                }
                .text-orange-800 {
                  color: #9a3412 !important;
                }
                .bg-blue-100 {
                  background-color: #dbeafe !important;
                  -webkit-print-color-adjust: exact !important;
                }
                .text-blue-800 {
                  color: #1e40af !important;
                }
                .bg-green-100 {
                  background-color: #dcfce7 !important;
                  -webkit-print-color-adjust: exact !important;
                }
                .text-green-800 {
                  color: #166534 !important;
                }
                .bg-gray-100 {
                  background-color: #f3f4f6 !important;
                  -webkit-print-color-adjust: exact !important;
                }
                .text-gray-800 {
                  color: #1f2937 !important;
                }
                .Card {
                  break-inside: avoid;
                  page-break-inside: avoid;
                }
                .CardContent {
                  break-inside: avoid;
                  page-break-inside: avoid;
                }
              }
            `
          }} />

          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">Loading petitions...</div>
            </div>
          ) : petitions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Petitions</h3>
                <p className="text-gray-500">There are no petitions at this time.</p>
              </CardContent>
            </Card>
          ) : viewMode === 'list' ? (
            <Card>
              <CardHeader>
                <CardTitle>Petitions List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {petitions.map((petition) => (
                    <div
                      key={petition.id}
                      onClick={() => handlePetitionClick(petition)}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <div>
                          <div className="font-medium text-gray-900">{petition.petitionNumber}</div>
                          <div className="text-sm text-gray-500">{getComplaintCategory(petition.complaint.subject, petition.complaint.category)}</div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(petition.status)}>
                        {getStatusLabel(petition.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : selectedPetition ? (
            <div className="space-y-4">
              <Button onClick={handleBackToList} variant="outline" className="mb-4">
                ← Back to Dashboard
              </Button>
              <Card key={selectedPetition.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">{selectedPetition.petitionNumber}</CardTitle>
                          <Badge className={getStatusColor(selectedPetition.status)}>
                            {getStatusLabel(selectedPetition.status)}
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
                      {!selectedPetition.assignedOfficer && (
                        <Button
                          size="sm"
                          onClick={() => router.push(`/feedback/complaints/${selectedPetition.complaint.id}`)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <User className="mr-2 h-4 w-4" />
                          Assign to Officer
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Complainant Information */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Complainant Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <div className="font-medium text-gray-800 mb-1">የጥቆማ አይነት</div>
                          <p className="text-gray-700">{getComplaintCategory(selectedPetition.complaint.subject, selectedPetition.complaint.category)}</p>
                        </div>
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
                        {selectedPetition.complaint.subject && (
                          <div>
                            <div className="font-medium text-blue-800 mb-1">ቅሬታ የተደረገበት አካል</div>
                            <p className="text-blue-700">{selectedPetition.complaint.subject}</p>
                          </div>
                        )}
                        {selectedPetition.complaint.institution && (
                          <div>
                            <div className="font-medium text-blue-800 mb-1">ጥቆማ የተሰጠበት አካል (Institution)</div>
                            <p className="text-blue-700">{selectedPetition.complaint.institution}</p>
                          </div>
                        )}
                        {selectedPetition.complaint.departmentName && (
                          <div>
                            <div className="font-medium text-blue-800 mb-1">የስራ ክፍል</div>
                            <p className="text-blue-700">{selectedPetition.complaint.departmentName}</p>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-blue-800 mb-1">የቅሬታ ዝርዝር</div>
                          <p className="text-blue-700">{selectedPetition.complaint.description}</p>
                        </div>
                        <div>
                          <div className="font-medium text-blue-800 mb-1">የተላከበት ቀን (Date Submitted)</div>
                          <p className="text-blue-700">{new Date(selectedPetition.complaint.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* 2. Department Response */}
                    {selectedPetition.complaint.departmentalResponse && (
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <h4 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          የስራ ክፍሉ መልስ
                        </h4>
                        <div className="space-y-3 text-sm">
                          {selectedPetition.complaint.departmentalResponse.summary && (
                            <div>
                              <div className="font-medium text-purple-800 mb-1">ማጠቃለያ</div>
                              <p className="text-purple-700">{selectedPetition.complaint.departmentalResponse.summary}</p>
                            </div>
                          )}
                          {selectedPetition.complaint.departmentalResponse.investigationConducted && (
                            <div>
                              <div className="font-medium text-purple-800 mb-1">የተደረገ ምርመራ</div>
                              <p className="text-purple-700">{selectedPetition.complaint.departmentalResponse.investigationConducted}</p>
                            </div>
                          )}
                          {selectedPetition.complaint.departmentalResponse.findings && (
                            <div>
                              <div className="font-medium text-purple-800 mb-1">የታየ ክፍተት</div>
                              <p className="text-purple-700">{selectedPetition.complaint.departmentalResponse.findings}</p>
                            </div>
                          )}
                          {selectedPetition.complaint.departmentalResponse.actionsTaken && (
                            <div>
                              <div className="font-medium text-purple-800 mb-1">የተወሰደ እርመጃ</div>
                              <p className="text-purple-700">{selectedPetition.complaint.departmentalResponse.actionsTaken}</p>
                            </div>
                          )}
                          {selectedPetition.complaint.departmentalResponse.proposedActions && (
                            <div>
                              <div className="font-medium text-purple-800 mb-1"></div>
                              <p className="text-purple-700">{selectedPetition.complaint.departmentalResponse.proposedActions}</p>
                            </div>
                          )}
                          {selectedPetition.complaint.departmentalResponse.officialResponse && (
                            <div>
                              <div className="font-medium text-purple-800 mb-1">ይፋዊ መልስ</div>
                              <p className="text-purple-700">{selectedPetition.complaint.departmentalResponse.officialResponse}</p>
                            </div>
                          )}
                          {selectedPetition.complaint.departmentalResponse.recommendations && (
                            <div>
                              <div className="font-medium text-purple-800 mb-1">ምክረ ሃሳብ</div>
                              <p className="text-purple-700">{selectedPetition.complaint.departmentalResponse.recommendations}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 3. Complainant's Petition */}
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h4 className="font-medium text-orange-900 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        አቤቱታ
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <div className="font-medium text-orange-800 mb-1">በመልሱ ያልረኩበት ምክንያት</div>
                          <p className="text-orange-700">{selectedPetition.reasonForDissatisfaction}</p>
                        </div>
                        {selectedPetition.explanation && (
                          <div>
                            <div className="font-medium text-orange-800 mb-1">ዝርዝር ገለፃ</div>
                            <p className="text-orange-700">{selectedPetition.explanation}</p>
                          </div>
                        )}
                        {selectedPetition.additionalInfo && (
                          <div>
                            <div className="font-medium text-orange-800 mb-1">ተጨማሪ መረጃ</div>
                            <p className="text-orange-700">{selectedPetition.additionalInfo}</p>
                          </div>
                        )}
                        {selectedPetition.requestedAction && (
                          <div>
                            <div className="font-medium text-orange-800 mb-1">መወሰድ ያለበት እርምጃ</div>
                            <p className="text-orange-700">{selectedPetition.requestedAction}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 4. Investigation Instructions */}
                    {selectedPetition.investigationInstructions && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          የምርመራ ትዛዝ
                        </h4>
                        <p className="text-blue-800">{selectedPetition.investigationInstructions}</p>
                      </div>
                    )}

                    {/* 5. Investigation Report */}
                    {selectedPetition.investigationReport && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          ሪፖርት
                        </h4>
                        <div className="space-y-3 text-sm">
                          {selectedPetition.investigationReport.background && (
                            <div>
                              <div className="font-medium text-green-800 mb-1">Background</div>
                              <p className="text-green-700">{selectedPetition.investigationReport.background}</p>
                            </div>
                          )}
                          {selectedPetition.investigationReport.objectives && (
                            <div>
                              <div className="font-medium text-green-800 mb-1">Objectives</div>
                              <p className="text-green-700">{selectedPetition.investigationReport.objectives}</p>
                            </div>
                          )}
                          {selectedPetition.investigationReport.activitiesPerformed && (
                            <div>
                              <div className="font-medium text-green-800 mb-1">Activities Performed</div>
                              <p className="text-green-700">{selectedPetition.investigationReport.activitiesPerformed}</p>
                            </div>
                          )}
                          {selectedPetition.investigationReport.evidenceCollected && (
                            <div>
                              <div className="font-medium text-green-800 mb-1">Evidence Collected</div>
                              <p className="text-green-700">{selectedPetition.investigationReport.evidenceCollected}</p>
                            </div>
                          )}
                          {selectedPetition.investigationReport.personsInterviewed && (
                            <div>
                              <div className="font-medium text-green-800 mb-1">Persons Interviewed</div>
                              <p className="text-green-700">{selectedPetition.investigationReport.personsInterviewed}</p>
                            </div>
                          )}
                          {selectedPetition.investigationReport.findings && (
                            <div>
                              <div className="font-medium text-green-800 mb-1">Findings</div>
                              <p className="text-green-700">{selectedPetition.investigationReport.findings}</p>
                            </div>
                          )}
                          {selectedPetition.investigationReport.observations && (
                            <div>
                              <div className="font-medium text-green-800 mb-1">Observations</div>
                              <p className="text-green-700">{selectedPetition.investigationReport.observations}</p>
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
                          {selectedPetition.investigationReport.submittedAt && (
                            <div className="text-xs text-green-600 pt-2 border-t border-green-200">
                              Submitted: {new Date(selectedPetition.investigationReport.submittedAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Commissioner Final Decision */}
                    {(() => {
                      if (selectedPetition.investigationReport?.observations) {
                        try {
                          const observations = JSON.parse(selectedPetition.investigationReport.observations);
                          
                          if (observations.commissionerDecision) {
                            return (
                              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-medium text-green-900 flex items-center gap-2">
                                    <Gavel className="w-4 h-4" />
                                    Commissioner Final Decision
                                  </h4>
                                  <Badge className="bg-green-600 text-white">
                                    {observations.commissionerDecision.finalPetitionStatus || 'Closed'}
                                  </Badge>
                                </div>
                                <div className="space-y-4 text-sm">
                                  {/* Commissioner's Decision */}
                                  <div className="p-3 bg-white rounded border border-green-200">
                                    <div className="font-medium text-green-800 mb-2">Commissioner's Decision</div>
                                    <div className="space-y-1">
                                      <div>
                                        <span className="text-gray-600">Decision Type:</span>
                                        <p className="text-green-700 font-semibold">{observations.commissionerDecision.decisionType}</p>
                                      </div>
                                      {observations.commissionerDecision.commissionerObservations && (
                                        <div>
                                          <span className="text-gray-600 block mb-1">Commissioner's Observations:</span>
                                          <p className="text-green-700 whitespace-pre-wrap">{observations.commissionerDecision.commissionerObservations}</p>
                                        </div>
                                      )}
                                      {observations.commissionerDecision.legalPolicyBasis && (
                                        <div>
                                          <span className="text-gray-600 block mb-1">Legal/Policy Basis:</span>
                                          <p className="text-green-700 whitespace-pre-wrap">{observations.commissionerDecision.legalPolicyBasis}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Disciplinary Action */}
                                  <div className="p-3 bg-white rounded border border-green-200">
                                    <div className="font-medium text-green-800 mb-2">Disciplinary Action</div>
                                    <div className="space-y-1">
                                      {observations.commissionerDecision.disciplinaryAction && (
                                        <div>
                                          <span className="text-gray-600">Action:</span>
                                          <p className="text-green-700">{observations.commissionerDecision.disciplinaryAction}</p>
                                        </div>
                                      )}
                                      {observations.commissionerDecision.responsibleDepartment && (
                                        <div>
                                          <span className="text-gray-600">Responsible Department:</span>
                                          <p className="text-green-700">{observations.commissionerDecision.responsibleDepartment}</p>
                                        </div>
                                      )}
                                      {observations.commissionerDecision.implementationDeadline && (
                                        <div>
                                          <span className="text-gray-600">Implementation Deadline:</span>
                                          <p className="text-green-700">{observations.commissionerDecision.implementationDeadline}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Final Decision */}
                                  <div className="p-3 bg-white rounded border border-green-200">
                                    <div className="font-medium text-green-800 mb-2">Final Decision</div>
                                    <div className="space-y-1">
                                      {observations.commissionerDecision.finalDecisionSummary && (
                                        <div>
                                          <span className="text-gray-600 block mb-1">Summary:</span>
                                          <p className="text-green-700 whitespace-pre-wrap">{observations.commissionerDecision.finalDecisionSummary}</p>
                                        </div>
                                      )}
                                      {observations.commissionerDecision.commissionerName && (
                                        <div>
                                          <span className="text-gray-600">Commissioner:</span>
                                          <p className="text-green-700">{observations.commissionerDecision.commissionerName}</p>
                                        </div>
                                      )}
                                      {observations.commissionerDecision.decisionDate && (
                                        <div>
                                          <span className="text-gray-600">Decision Date:</span>
                                          <p className="text-green-700">{observations.commissionerDecision.decisionDate}</p>
                                        </div>
                                      )}
                                      {observations.commissionerDecision.decisionNotificationStatus && (
                                        <div>
                                          <span className="text-gray-600">Notification Status:</span>
                                          <p className="text-green-700">{observations.commissionerDecision.decisionNotificationStatus}</p>
                                        </div>
                                      )}
                                      {observations.commissionerDecision.implementationStatus && (
                                        <div>
                                          <span className="text-gray-600">Implementation Status:</span>
                                          <p className="text-green-700">{observations.commissionerDecision.implementationStatus}</p>
                                        </div>
                                      )}
                                      {observations.commissionerDecision.closureRemarks && (
                                        <div>
                                          <span className="text-gray-600 block mb-1">Closure Remarks:</span>
                                          <p className="text-green-700 whitespace-pre-wrap">{observations.commissionerDecision.closureRemarks}</p>
                                        </div>
                                      )}
                                      {observations.commissionerDecision.submittedAt && (
                                        <div>
                                          <span className="text-gray-600">Submitted At:</span>
                                          <p className="text-green-700">{new Date(observations.commissionerDecision.submittedAt).toLocaleString()}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        } catch {
                          // Observations is not JSON or doesn't contain commissioner decision
                          // This is expected for old investigation reports
                        }
                      }
                      return null;
                    })()}

                    {/* Send to Commissioner Button - Only show when investigation report exists but no commissioner decision and not already sent to commissioner */}
                    {selectedPetition.investigationReport &&
                     selectedPetition.status !== 'Under Final Decision Review' &&
                     !(() => {
                      if (selectedPetition.investigationReport?.observations) {
                        try {
                          const observations = JSON.parse(selectedPetition.investigationReport.observations);
                          return observations.commissionerDecision;
                        } catch {
                          // Not JSON or no commissioner decision
                        }
                      }
                      return false;
                    })() && (
                      <div className="pt-4 border-t">
                        <Button
                          onClick={() => handleSendToAll(selectedPetition)}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          disabled={sendingNotification}
                        >
                          {sendingNotification ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Send to Commissioner
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Send to All Button - Only show when commissioner decision exists */}
                    {(() => {
                      if (selectedPetition.investigationReport?.observations) {
                        try {
                          const observations = JSON.parse(selectedPetition.investigationReport.observations);
                          if (observations.commissionerDecision) {
                            return (
                              <div className="pt-4 border-t space-y-4">
                                {/* Notification Preview */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                    <Send className="w-4 h-4" />
                                    Notification Preview
                                  </h4>
                                  <div className="space-y-3 text-sm">
                                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                      <div className="font-medium text-blue-900 mb-2">Notification to Complainant</div>
                                      <div className="text-blue-700">
                                        <p className="mb-2">To: {selectedPetition.complaint.complainantName || 'N/A'} ({selectedPetition.complaint.complainantEmail || 'N/A'})</p>
                                        <p className="font-semibold mb-2">=== COMMISSIONER FINAL DECISION NOTIFICATION ===</p>
                                        <p className="mb-2">Dear {selectedPetition.complaint.complainantName || 'N/A'},</p>
                                        <p className="mb-2">The Commissioner has issued a final decision on your petition ({selectedPetition.petitionNumber}).</p>
                                        
                                        {observations.commissionerDecision.petitionSubject && (
                                          <p className="mb-2"><strong>Petition Subject:</strong> {observations.commissionerDecision.petitionSubject}</p>
                                        )}
                                        {observations.commissionerDecision.petitionerName && (
                                          <p className="mb-2"><strong>Petitioner Name:</strong> {observations.commissionerDecision.petitionerName}</p>
                                        )}
                                        
                                        <p className="mb-2 font-semibold">Investigation Summary:</p>
                                        {observations.commissionerDecision.summaryOfFindings && (
                                          <p className="mb-2">- Summary of Findings: {observations.commissionerDecision.summaryOfFindings}</p>
                                        )}
                                        {observations.commissionerDecision.evidenceReviewed && (
                                          <p className="mb-2">- Evidence Reviewed: {observations.commissionerDecision.evidenceReviewed}</p>
                                        )}
                                        {observations.commissionerDecision.investigatorRecommendation && (
                                          <p className="mb-2">- Investigator Recommendation: {observations.commissionerDecision.investigatorRecommendation}</p>
                                        )}
                                        
                                        <p className="mb-2 font-semibold">Commissioner's Decision:</p>
                                        {observations.commissionerDecision.commissionerObservations && (
                                          <p className="mb-2">- Commissioner's Observations: {observations.commissionerDecision.commissionerObservations}</p>
                                        )}
                                        {observations.commissionerDecision.legalPolicyBasis && (
                                          <p className="mb-2">- Legal/Policy Basis: {observations.commissionerDecision.legalPolicyBasis}</p>
                                        )}
                                        
                                        <p className="mb-2 font-semibold">Decision Details:</p>
                                        <ul className="list-disc list-inside space-y-1 mb-2">
                                          <li>Decision Type: {observations.commissionerDecision.decisionType || 'N/A'}</li>
                                          <li>Disciplinary Action: {observations.commissionerDecision.disciplinaryAction || 'N/A'}</li>
                                          <li>Responsible Department: {observations.commissionerDecision.responsibleDepartment || 'N/A'}</li>
                                          <li>Implementation Deadline: {observations.commissionerDecision.implementationDeadline || 'N/A'}</li>
                                        </ul>
                                        
                                        {observations.commissionerDecision.finalDecisionSummary && (
                                          <p className="mb-2"><strong>Final Decision Summary:</strong> {observations.commissionerDecision.finalDecisionSummary}</p>
                                        )}
                                        
                                        {observations.commissionerDecision.commissionerName && (
                                          <p className="mb-2"><strong>Commissioner:</strong> {observations.commissionerDecision.commissionerName}</p>
                                        )}
                                        {observations.commissionerDecision.decisionDate && (
                                          <p className="mb-2"><strong>Decision Date:</strong> {observations.commissionerDecision.decisionDate}</p>
                                        )}
                                        
                                        <p className="mb-2"><strong>Final Petition Status:</strong> {observations.commissionerDecision.finalPetitionStatus || 'Closed'}</p>
                                        
                                        {observations.commissionerDecision.closureRemarks && (
                                          <p className="mb-2"><strong>Closure Remarks:</strong> {observations.commissionerDecision.closureRemarks}</p>
                                        )}
                                        
                                        <p>This decision has been communicated to the concerned department for implementation.</p>
                                        <p>Sincerely, Ethics and Anti-Corruption Commission</p>
                                      </div>
                                    </div>
                                    <div className="bg-orange-50 p-3 rounded border border-orange-200">
                                      <div className="font-medium text-orange-900 mb-2">Notification to Concerned Department</div>
                                      <div className="text-orange-700">
                                        <p className="mb-2">To: {selectedPetition.complaint.institution || 'N/A'}</p>
                                        <p className="font-semibold mb-2">=== COMMISSIONER FINAL DECISION - ACTION REQUIRED ===</p>
                                        <p className="mb-2">The Commissioner has issued a final decision on petition {selectedPetition.petitionNumber} that requires your department's attention.</p>
                                        
                                        {observations.commissionerDecision.petitionSubject && (
                                          <p className="mb-2"><strong>Petition Subject:</strong> {observations.commissionerDecision.petitionSubject}</p>
                                        )}
                                        {observations.commissionerDecision.petitionerName && (
                                          <p className="mb-2"><strong>Petitioner Name:</strong> {observations.commissionerDecision.petitionerName}</p>
                                        )}
                                        
                                        <p className="mb-2 font-semibold">Investigation Summary:</p>
                                        {observations.commissionerDecision.summaryOfFindings && (
                                          <p className="mb-2">- Summary of Findings: {observations.commissionerDecision.summaryOfFindings}</p>
                                        )}
                                        {observations.commissionerDecision.evidenceReviewed && (
                                          <p className="mb-2">- Evidence Reviewed: {observations.commissionerDecision.evidenceReviewed}</p>
                                        )}
                                        {observations.commissionerDecision.investigatorRecommendation && (
                                          <p className="mb-2">- Investigator Recommendation: {observations.commissionerDecision.investigatorRecommendation}</p>
                                        )}
                                        
                                        <p className="mb-2 font-semibold">Commissioner's Decision:</p>
                                        {observations.commissionerDecision.commissionerObservations && (
                                          <p className="mb-2">- Commissioner's Observations: {observations.commissionerDecision.commissionerObservations}</p>
                                        )}
                                        {observations.commissionerDecision.legalPolicyBasis && (
                                          <p className="mb-2">- Legal/Policy Basis: {observations.commissionerDecision.legalPolicyBasis}</p>
                                        )}
                                        
                                        <p className="mb-2 font-semibold">Decision Details:</p>
                                        <ul className="list-disc list-inside space-y-1 mb-2">
                                          <li>Decision Type: {observations.commissionerDecision.decisionType || 'N/A'}</li>
                                          <li>Disciplinary Action: {observations.commissionerDecision.disciplinaryAction || 'N/A'}</li>
                                          <li>Responsible Department: {observations.commissionerDecision.responsibleDepartment || 'N/A'}</li>
                                          <li>Implementation Deadline: {observations.commissionerDecision.implementationDeadline || 'N/A'}</li>
                                        </ul>
                                        
                                        {observations.commissionerDecision.finalDecisionSummary && (
                                          <p className="mb-2"><strong>Final Decision Summary:</strong> {observations.commissionerDecision.finalDecisionSummary}</p>
                                        )}
                                        
                                        {observations.commissionerDecision.commissionerName && (
                                          <p className="mb-2"><strong>Commissioner:</strong> {observations.commissionerDecision.commissionerName}</p>
                                        )}
                                        {observations.commissionerDecision.decisionDate && (
                                          <p className="mb-2"><strong>Decision Date:</strong> {observations.commissionerDecision.decisionDate}</p>
                                        )}
                                        
                                        <p className="mb-2"><strong>Final Petition Status:</strong> {observations.commissionerDecision.finalPetitionStatus || 'Closed'}</p>
                                        
                                        {observations.commissionerDecision.closureRemarks && (
                                          <p className="mb-2"><strong>Closure Remarks:</strong> {observations.commissionerDecision.closureRemarks}</p>
                                        )}
                                        
                                        <p className="font-bold text-red-700 mb-2">ACTION REQUIRED:</p>
                                        <p className="mb-2">Please implement the disciplinary action(s) as specified above by the implementation deadline.</p>
                                        <p>Report back on the implementation status within the specified timeframe.</p>
                                        <p>Sincerely, Ethics and Anti-Corruption Commission</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  onClick={() => handleSendToAll(selectedPetition)}
                                  className="w-full bg-green-600 hover:bg-green-700"
                                  disabled={sendingNotification}
                                >
                                  {sendingNotification ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Sending...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="mr-2 h-4 w-4" />
                                      Send to All (Concerned Department & Complainants)
                                    </>
                                  )}
                                </Button>
                              </div>
                            );
                          }
                        } catch {
                          // Not JSON or no commissioner decision
                        }
                      }
                      return null;
                    })()}

                    {/* Assignment Information */}
                    {selectedPetition.assignedOfficer && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>
                          Assigned to: {selectedPetition.assignedOfficer.firstName} {selectedPetition.assignedOfficer.lastName}
                          {selectedPetition.assignedOfficer.position && ` (${selectedPetition.assignedOfficer.position})`}
                        </span>
                      </div>
                    )}

                    {selectedPetition.assignedBy && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>
                          Assigned by: {selectedPetition.assignedBy.firstName} {selectedPetition.assignedBy.lastName}
                        </span>
                      </div>
                    )}

                    {selectedPetition.investigationDeadline && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>Deadline: {new Date(selectedPetition.investigationDeadline).toLocaleDateString()}</span>
                      </div>
                    )}

                    {/* Messages Section - Communication between Manager and Commissioner */}
                    {selectedPetition.status === 'Under Final Decision Review' && (
                      <div className="pt-4 border-t">
                        <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <Send className="w-4 h-4" />
                          Communication with Commissioner
                        </h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                          {messages.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No messages yet</p>
                          ) : (
                            messages.map((msg: any) => (
                              <div
                                key={msg.id}
                                className={`p-3 rounded-lg ${
                                  msg.senderType === 'DEPARTMENT'
                                    ? 'bg-blue-50 border border-blue-200 ml-8'
                                    : 'bg-purple-50 border border-purple-200 mr-8'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-sm">
                                    {msg.senderType === 'DEPARTMENT' ? 'Manager' : 'Commissioner'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(msg.sentAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="flex gap-2">
                          <textarea
                            className="flex-1 border rounded-lg p-3 text-sm"
                            rows={3}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message to the commissioner..."
                          />
                          <Button
                            onClick={handleSendMessage}
                            disabled={sendingMessage || !newMessage.trim()}
                            className="self-end"
                          >
                            {sendingMessage ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Final Decision Button */}
                    {selectedPetition.investigationReport &&
                     (selectedPetition.status === "Investigation Report Submitted" ||
                      selectedPetition.status === "Investigation Returned for Correction") && (
                      <div className="pt-4 border-t">
                        <Button
                          onClick={() => {
                            setShowDecisionModal(true);
                          }}
                          className="w-full"
                        >
                          <Gavel className="mr-2 h-4 w-4" />
                          Issue Final Decision
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
            </div>
          ) : null}
        </div>

        {/* Final Decision Modal */}
        {showDecisionModal && selectedPetition && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Issue Final Decision - {selectedPetition.petitionNumber}</span>
                  <Button variant="ghost" size="sm" onClick={() => setShowDecisionModal(false)}>
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Decision</label>
                  <select
                    className="w-full border rounded-lg p-3"
                    value={decisionData.decision}
                    onChange={(e) => setDecisionData({ ...decisionData, decision: e.target.value })}
                  >
                    <option value="">Select decision...</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Partially Approved">Partially Approved</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Decision Reason</label>
                  <textarea
                    className="w-full border rounded-lg p-3"
                    rows={4}
                    value={decisionData.decisionReason}
                    onChange={(e) => setDecisionData({ ...decisionData, decisionReason: e.target.value })}
                    placeholder="Provide reason for the decision..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSubmitDecision}
                    disabled={submittingDecision || !decisionData.decision}
                    className="flex-1"
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

        {/* Notification Confirmation Modal */}
        {showNotificationModal && notificationDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Confirm Notification - {notificationDetails.petitionNumber}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadCommissionerDecisionNotification(notificationDetails)}
                      className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => printCommissionerDecisionNotification(notificationDetails)}
                      className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowNotificationModal(false)}>
                      ✕
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Complainant Notification */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Notification to Complainant
                  </h3>
                  <div className="text-sm space-y-2 text-blue-800">
                    <div><span className="font-medium">To:</span> {notificationDetails.complainantName} ({notificationDetails.complainantEmail})</div>
                    <div className="bg-white p-3 rounded border border-blue-200 whitespace-pre-wrap">
                      <div className="font-bold mb-2">=== COMMISSIONER FINAL DECISION NOTIFICATION ===</div>
                      <div>Dear {notificationDetails.complainantName},</div>
                      <div className="mt-2">The Commissioner has issued a final decision on your petition ({notificationDetails.petitionNumber}).</div>
                      <div className="mt-3 font-semibold">Decision Details:</div>
                      <div>- Decision Type: {notificationDetails.commissionerDecision?.decisionType || 'N/A'}</div>
                      <div>- Disciplinary Action: {notificationDetails.commissionerDecision?.disciplinaryAction || 'N/A'}</div>
                      <div>- Responsible Department: {notificationDetails.commissionerDecision?.responsibleDepartment || 'N/A'}</div>
                      <div>- Implementation Deadline: {notificationDetails.commissionerDecision?.implementationDeadline || 'N/A'}</div>
                      <div className="mt-3 font-semibold">Commissioner's Observations:</div>
                      <div>{notificationDetails.commissionerDecision?.commissionerObservations || 'N/A'}</div>
                      <div className="mt-3 font-semibold">Legal/Policy Basis:</div>
                      <div>{notificationDetails.commissionerDecision?.legalPolicyBasis || 'N/A'}</div>
                      <div className="mt-3 font-semibold">Final Decision Summary:</div>
                      <div>{notificationDetails.commissionerDecision?.finalDecisionSummary || 'N/A'}</div>
                      <div className="mt-3 font-semibold">Commissioner: {notificationDetails.commissionerDecision?.commissionerName || 'N/A'}</div>
                      <div>Decision Date: {notificationDetails.commissionerDecision?.decisionDate || 'N/A'}</div>
                      <div className="mt-3 font-semibold">Final Petition Status: {notificationDetails.commissionerDecision?.finalPetitionStatus || 'Closed'}</div>
                      <div className="mt-3 font-semibold">Closure Remarks:</div>
                      <div>{notificationDetails.commissionerDecision?.closureRemarks || 'N/A'}</div>
                      <div className="mt-3">This decision has been communicated to the concerned department for implementation.</div>
                      <div className="mt-3">Sincerely, Ethics and Anti-Corruption Commission</div>
                    </div>
                  </div>
                </div>

                {/* Department Notification */}
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-orange-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Notification to Concerned Department
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadDepartmentNotification(notificationDetails)}
                        className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => printDepartmentNotification(notificationDetails)}
                        className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm space-y-2 text-orange-800">
                    <div><span className="font-medium">To:</span> {notificationDetails.concernedDepartment}</div>
                    <div className="bg-white p-3 rounded border border-orange-200 whitespace-pre-wrap">
                      <div className="font-bold mb-2">የመጨረሻ የአቤቱታ ዉሳኔ ዝርዝር</div>
                      <div>Download</div>
                      <div className="mt-2 font-bold">የኮሚሽነር የመጨረሻ ዉሳኔ</div>
                      <div className="mt-2">To: {notificationDetails.concernedDepartment}</div>
                      <div className="mt-2">Petition Subject: {notificationDetails.commissionerDecision?.petitionSubject || 'N/A'}</div>
                      <div className="mt-2">አቤቱታ ያቀረበዉ አካል: {notificationDetails.commissionerDecision?.petitionerName || 'N/A'}</div>
                      <div className="mt-3 font-semibold">የኮሚሽነር ዉሳኔ :</div>
                      <div>- የኮሚሽነር ምልከታ: {notificationDetails.commissionerDecision?.commissionerObservations || 'N/A'}</div>
                      <div>- Legal/Policy Basis: {notificationDetails.commissionerDecision?.legalPolicyBasis || 'N/A'}</div>
                      <div className="mt-3 font-semibold">Decision Details:</div>
                      <div>Decision Type: {notificationDetails.commissionerDecision?.decisionType || 'N/A'}</div>
                      <div>Disciplinary Action: {notificationDetails.commissionerDecision?.disciplinaryAction || 'N/A'}</div>
                      <div>Responsible Department: {notificationDetails.commissionerDecision?.responsibleDepartment || notificationDetails.concernedDepartment}</div>
                      <div>Implementation Deadline: {notificationDetails.commissionerDecision?.implementationDeadline || 'N/A'}</div>
                      <div>Final Decision Summary: {notificationDetails.commissionerDecision?.finalDecisionSummary || 'N/A'}</div>
                      <div className="mt-3">Decision Date: {notificationDetails.commissionerDecision?.decisionDate || 'N/A'}</div>
                      <div className="mt-3">Final Petition Status: {notificationDetails.commissionerDecision?.finalPetitionStatus || 'Closed'}</div>
                      <div className="mt-3">Closure Remarks: {notificationDetails.commissionerDecision?.closureRemarks || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={confirmSendNotification}
                    disabled={sendingNotification}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {sendingNotification ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Notifications
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNotificationModal(false)}
                    className="flex-1"
                    disabled={sendingNotification}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Commissioner Selection Modal */}
        {showCommissionerModal && selectedPetition && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Send to Commissioner - {selectedPetition.petitionNumber}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setShowCommissionerModal(false)}>
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Commissioner</label>
                  <select
                    className="w-full border rounded-lg p-3"
                    value={commissionerData.commissionerId}
                    onChange={(e) => setCommissionerData({ ...commissionerData, commissionerId: e.target.value })}
                  >
                    <option value="">Select a commissioner...</option>
                    {commissioners.map((commissioner) => (
                      <option key={commissioner.id} value={commissioner.id}>
                        {commissioner.firstName} {commissioner.lastName}
                        {commissioner.position && ` (${commissioner.position})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Manager Conclusion</label>
                  <textarea
                    className="w-full border rounded-lg p-3"
                    rows={4}
                    value={commissionerData.managerConclusion}
                    onChange={(e) => setCommissionerData({ ...commissionerData, managerConclusion: e.target.value })}
                    placeholder="Provide your conclusion and recommendations for the commissioner..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSendToCommissioner}
                    disabled={sendingNotification || !commissionerData.commissionerId}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {sendingNotification ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send to Commissioner
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCommissionerModal(false)}
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
