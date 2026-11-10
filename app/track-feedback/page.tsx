"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { MessageSquare, Search, Send, ArrowLeft, Clock, User, FileText, Shield, CheckCircle, AlertTriangle, Calendar, ThumbsUp, FileEdit, Gavel, Download, Printer, ClipboardList, Building2, Bell } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export const dynamic = 'force-dynamic';

interface Message {
  id: string;
  message: string;
  senderId: string;
  senderRole: string;
  senderType: string;
  createdAt: string;
}

interface Feedback {
  id: string;
  trackingId: string;
  category: string;
  subject: string;
  description: string;
  response?: string;
  status: string;
  priority: string;
  createdAt: string;
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
  departmentalResponse?: {
    summary?: string;
    investigationConducted?: string;
    findings?: string;
    actionsTaken?: string;
    proposedActions?: string;
    officialResponse?: string;
    recommendations?: string;
  };
  department?: {
    name: string;
  };
  petitions?: Array<{
    id: string;
    petitionNumber: string;
    status: string;
    reasonForDissatisfaction?: string;
    explanation?: string;
    additionalInfo?: string;
    requestedAction?: string;
    investigationInstructions?: string;
    investigationDeadline?: string;
    investigationReport?: {
      observations?: string;
    };
  }>;
}

function TrackFeedbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTrackingId = searchParams.get("trackingId") || "";

  const [trackingId, setTrackingId] = useState(initialTrackingId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showPetitionForm, setShowPetitionForm] = useState(false);
  const [petitionData, setPetitionData] = useState({
    reasonForDissatisfaction: "",
    explanation: "",
    additionalInfo: "",
    requestedAction: "",
  });
  const [submittingPetition, setSubmittingPetition] = useState(false);
  const [commissionerDecision, setCommissionerDecision] = useState<any>(null);
  const [isAdminComplaint, setIsAdminComplaint] = useState(false);

  useEffect(() => {
    if (initialTrackingId) {
      handleTrack(new Event("submit") as any);
    }
  }, [initialTrackingId]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFeedback(null);
    setMessages([]);
    setCommissionerDecision(null);

    try {
      const res = await fetch("http://localhost:4000/api/feedback/complaints/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingId: trackingId.trim(),
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to track feedback");
      }

      const data = await res.json();
      setFeedback(data);
      
      // Check if this is an administrative complaint
      const isAdmin = data.category === 'Administrative Complaints' ||
                      data.category === 'አስተዳደራዊ ጥቆማ' ||
                      data.category === 'አስተዳደራዊ ቅሬታ';
      setIsAdminComplaint(isAdmin);
      
      loadMessages(data.id);

      // Check if there's a petition with commissioner decision
      if (data.petitions && data.petitions.length > 0) {
        const latestPetition = data.petitions[data.petitions.length - 1];
        console.log('Latest petition:', latestPetition);
        console.log('Petition keys:', Object.keys(latestPetition));

        // Check if commissioner decision is in investigationReport.observations
        if (latestPetition.investigationReport?.observations) {
          try {
            const observations = JSON.parse(latestPetition.investigationReport.observations);
            console.log('Parsed observations:', observations);
            if (observations.commissionerDecision) {
              setCommissionerDecision({
                commissionerDecision: observations.commissionerDecision,
                petition: latestPetition
              });
            }
          } catch (e) {
            console.error('Error parsing observations:', e);
          }
        } else {
          console.log('No investigationReport.observations found in petition');
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to track feedback");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (feedbackId: string) => {
    try {
      const res = await fetch("http://localhost:4000/api/feedback/complaints/track/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingId: trackingId.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || data || []);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !feedback) return;

    setSendingMessage(true);
    try {
      const res = await fetch("http://localhost:4000/api/feedback/complaints/track/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingId: trackingId.trim(),
          message: newMessage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages([...messages, data]);
        setNewMessage("");
        // Reload messages to get the full message with sender details
        loadMessages(feedback.id);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAcceptResponse = async () => {
    if (!feedback) return;

    if (!confirm("Are you satisfied with this response? This will close your complaint.")) {
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/api/feedback/complaints/track/accept-response", {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingId: trackingId.trim() }),
      });

      if (!res.ok) {
        throw new Error('Failed to accept response');
      }

      alert('Response accepted. Your complaint has been closed.');
      fetchComplaint();
    } catch (err) {
      console.error('Error accepting response:', err);
      alert('Failed to accept response');
    }
  };

  const handlePetitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback) return;

    setSubmittingPetition(true);
    try {
      const res = await fetch("http://localhost:4000/api/feedback/complaints/track/petition", {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingId: trackingId.trim(),
          ...petitionData,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit petition');
      }

      alert('አቤቱታዎ በትክክል ተልኳል');
      setShowPetitionForm(false);
      setPetitionData({
        reasonForDissatisfaction: "",
        explanation: "",
        additionalInfo: "",
        requestedAction: "",
      });
      fetchComplaint();
    } catch (err) {
      console.error('Error submitting petition:', err);
      alert('Failed to submit petition');
    } finally {
      setSubmittingPetition(false);
    }
  };

  const fetchComplaint = async () => {
    if (!trackingId) return;
    try {
      const res = await fetch("http://localhost:4000/api/feedback/complaints/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingId: trackingId.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setFeedback(data);
      }
    } catch (err) {
      console.error('Error fetching complaint:', err);
    }
  };

  const downloadCommissionerDecision = () => {
    if (!commissionerDecision) return;

    const decision = commissionerDecision.commissionerDecision;
    const petition = commissionerDecision.petition;

    const content = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
<head>
<meta charset="utf-8">
<title>Commissioner Final Decision</title>
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
    <h2>COMMISSIONER FINAL DECISION DOCUMENT</h2>
  </div>

  <div class="section">
    <h3>PETITION INFORMATION</h3>
    <table>
      <tr><td class="label">Petition Number:</td><td class="value">${petition?.petitionNumber || 'N/A'}</td></tr>
      <tr><td class="label">Petitioner Name:</td><td class="value">${decision?.petitionerName || 'N/A'}</td></tr>
      <tr><td class="label">Concerned Department:</td><td class="value">${decision?.concernedDepartment || 'N/A'}</td></tr>
      <tr><td class="label">Date Received:</td><td class="value">${decision?.dateReceived || 'N/A'}</td></tr>
    </table>
  </div>

  <div class="section">
    <h3>INVESTIGATION SUMMARY</h3>
    <table>
      <tr><td class="label">Summary of Findings:</td><td class="value">${decision?.summaryOfFindings || 'N/A'}</td></tr>
      <tr><td class="label">Evidence Reviewed:</td><td class="value">${decision?.evidenceReviewed || 'N/A'}</td></tr>
      <tr><td class="label">Investigator Recommendation:</td><td class="value">${decision?.investigatorRecommendation || 'N/A'}</td></tr>
    </table>
  </div>

  <div class="section">
    <h3>COMMISSIONER'S DECISION</h3>
    <table>
      <tr><td class="label">Commissioner's Observations:</td><td class="value">${decision?.commissionerObservations || 'N/A'}</td></tr>
      <tr><td class="label">Legal/Policy Basis:</td><td class="value">${decision?.legalPolicyBasis || 'N/A'}</td></tr>
    </table>
  </div>

  <div class="section">
    <h3>DECISION DETAILS</h3>
    <table>
      <tr><td class="label">Decision Type:</td><td class="value">${decision?.decisionType || 'N/A'}</td></tr>
      <tr><td class="label">Disciplinary Action:</td><td class="value">${decision?.disciplinaryAction || 'N/A'}</td></tr>
      <tr><td class="label">Responsible Department:</td><td class="value">${decision?.responsibleDepartment || 'N/A'}</td></tr>
      <tr><td class="label">Implementation Deadline:</td><td class="value">${decision?.implementationDeadline || 'N/A'}</td></tr>
    </table>
  </div>

  <div class="section">
    <h3>FINAL DECISION SUMMARY</h3>
    <p>${decision?.finalDecisionSummary || 'N/A'}</p>
  </div>

  <div class="section">
    <h3>DECISION AUTHORIZATION</h3>
    <table>
      <tr><td class="label">Commissioner Name:</td><td class="value">${decision?.commissionerName || 'N/A'}</td></tr>
      <tr><td class="label">Decision Date:</td><td class="value">${decision?.decisionDate || 'N/A'}</td></tr>
      <tr><td class="label">Final Petition Status:</td><td class="value">${decision?.finalPetitionStatus || 'N/A'}</td></tr>
      <tr><td class="label">Closure Remarks:</td><td class="value">${decision?.closureRemarks || 'N/A'}</td></tr>
    </table>
  </div>

  <div class="footer">
    <p><strong>Ethics and Anti-Corruption Commission</strong></p>
    <p>This document is an official record of the Commissioner's final decision.</p>
    <p>Generated on: ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
    `.trim();

    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Commissioner_Decision_${petition?.petitionNumber || 'Petition'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printCommissionerDecision = () => {
    if (!commissionerDecision) return;

    const decision = commissionerDecision.commissionerDecision;
    const petition = commissionerDecision.petition;

    const printContent = `
      <html>
      <head>
        <title>Commissioner Final Decision - Print</title>
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
        <h2>COMMISSIONER FINAL DECISION DOCUMENT</h2>

        <div class="section">
          <h3>PETITION INFORMATION</h3>
          <table>
            <tr><td class="label">Petition Number:</td><td class="value">${petition?.petitionNumber || 'N/A'}</td></tr>
            <tr><td class="label">Petitioner Name:</td><td class="value">${decision?.petitionerName || 'N/A'}</td></tr>
            <tr><td class="label">Concerned Department:</td><td class="value">${decision?.concernedDepartment || 'N/A'}</td></tr>
            <tr><td class="label">Date Received:</td><td class="value">${decision?.dateReceived || 'N/A'}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>INVESTIGATION SUMMARY</h3>
          <table>
            <tr><td class="label">Summary of Findings:</td><td class="value">${decision?.summaryOfFindings || 'N/A'}</td></tr>
            <tr><td class="label">Evidence Reviewed:</td><td class="value">${decision?.evidenceReviewed || 'N/A'}</td></tr>
            <tr><td class="label">Investigator Recommendation:</td><td class="value">${decision?.investigatorRecommendation || 'N/A'}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>COMMISSIONER'S DECISION</h3>
          <table>
            <tr><td class="label">Commissioner's Observations:</td><td class="value">${decision?.commissionerObservations || 'N/A'}</td></tr>
            <tr><td class="label">Legal/Policy Basis:</td><td class="value">${decision?.legalPolicyBasis || 'N/A'}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>DECISION DETAILS</h3>
          <table>
            <tr><td class="label">Decision Type:</td><td class="value">${decision?.decisionType || 'N/A'}</td></tr>
            <tr><td class="label">Disciplinary Action:</td><td class="value">${decision?.disciplinaryAction || 'N/A'}</td></tr>
            <tr><td class="label">Responsible Department:</td><td class="value">${decision?.responsibleDepartment || 'N/A'}</td></tr>
            <tr><td class="label">Implementation Deadline:</td><td class="value">${decision?.implementationDeadline || 'N/A'}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>FINAL DECISION SUMMARY</h3>
          <p>${decision?.finalDecisionSummary || 'N/A'}</p>
        </div>

        <div class="section">
          <h3>DECISION AUTHORIZATION</h3>
          <table>
            <tr><td class="label">Commissioner Name:</td><td class="value">${decision?.commissionerName || 'N/A'}</td></tr>
            <tr><td class="label">Decision Date:</td><td class="value">${decision?.decisionDate || 'N/A'}</td></tr>
            <tr><td class="label">Final Petition Status:</td><td class="value">${decision?.finalPetitionStatus || 'N/A'}</td></tr>
            <tr><td class="label">Closure Remarks:</td><td class="value">${decision?.closureRemarks || 'N/A'}</td></tr>
          </table>
        </div>

        <div class="footer">
          <p><strong>Ethics and Anti-Corruption Commission</strong></p>
          <p>This document is an official record of the Commissioner's final decision.</p>
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

  const downloadApprovedReport = () => {
    if (!feedback || !feedback.investigation) return;

    const content = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
<head>
<meta charset="utf-8">
<title>Administrative Complaints Approved Report</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5; }
  h1 { font-size: 18pt; font-weight: bold; color: #065f46; page-break-after: avoid; }
  h2 { font-size: 14pt; font-weight: bold; color: #047857; margin-top: 20px; }
  h3 { font-size: 12pt; font-weight: bold; color: #059669; margin-top: 15px; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0; }
  td { border: 1px solid #d1d5db; padding: 8px; vertical-align: top; }
  .label { font-weight: bold; background-color: #f3f4f6; width: 30%; }
  .value { background-color: #ffffff; }
  .section { margin: 20px 0; padding: 15px; border: 1px solid #e5e7eb; border-radius: 5px; }
  .header { background-color: #065f46; color: white; padding: 15px; text-align: center; }
  .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #065f46; font-size: 10pt; color: #6b7280; }
</style>
</head>
<body>
  <div class="header">
    <h1>ETHIOPIAN CIVIL SERVICE COMMISSION</h1>
    <h2>ADMINISTRATIVE COMPLAINTS APPROVED REPORT</h2>
  </div>

  <div class="section">
    <h3>COMPLAINT INFORMATION</h3>
    <table>
      <tr><td class="label">Tracking ID:</td><td class="value">${feedback.trackingId || 'N/A'}</td></tr>
      <tr><td class="label">Case Number:</td><td class="value">${feedback.investigation.caseNumber || 'N/A'}</td></tr>
      <tr><td class="label">Category:</td><td class="value">${feedback.category || 'N/A'}</td></tr>
      <tr><td class="label">Subject:</td><td class="value">${feedback.subject || 'N/A'}</td></tr>
      <tr><td class="label">Date Submitted:</td><td class="value">${new Date(feedback.createdAt).toLocaleDateString()}</td></tr>
    </table>
  </div>

  <div class="section">
    <h3>INVESTIGATION DETAILS</h3>
    <table>
      <tr><td class="label">Investigation Status:</td><td class="value">${feedback.investigation.status}</td></tr>
      <tr><td class="label">Decision:</td><td class="value">${feedback.investigation.decision}</td></tr>
      ${feedback.investigation.outcome ? `<tr><td class="label">Investigation Outcome:</td><td class="value">${feedback.investigation.outcome}</td></tr>` : ''}
      ${feedback.investigation.correctiveAction ? `<tr><td class="label">Corrective Action:</td><td class="value">${feedback.investigation.correctiveAction}</td></tr>` : ''}
      ${feedback.investigation.decisionDate ? `<tr><td class="label">Decision Date:</td><td class="value">${new Date(feedback.investigation.decisionDate).toLocaleDateString()}</td></tr>` : ''}
      ${feedback.investigation.closureReason ? `<tr><td class="label">Approval Remarks:</td><td class="value">${feedback.investigation.closureReason}</td></tr>` : ''}
    </table>
  </div>

  <div class="section">
    <h3>COMPLAINT DESCRIPTION</h3>
    <p>${feedback.description || 'N/A'}</p>
  </div>

  <div class="footer">
    <p><strong>Ethics and Anti-Corruption Commission</strong></p>
    <p>This document is an official record of the approved administrative complaint investigation.</p>
    <p>Generated on: ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
    `.trim();

    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Admin_Complaint_Approved_Report_${feedback.trackingId}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printApprovedReport = () => {
    if (!feedback || !feedback.investigation) return;

    const printContent = `
      <html>
      <head>
        <title>Administrative Complaints Approved Report - Print</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5; margin: 0; padding: 20px; }
          h1 { font-size: 18pt; font-weight: bold; color: #065f46; text-align: center; margin-bottom: 5px; }
          h2 { font-size: 14pt; font-weight: bold; color: #047857; text-align: center; margin-top: 0; margin-bottom: 20px; }
          h3 { font-size: 12pt; font-weight: bold; color: #059669; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #059669; padding-bottom: 5px; }
          table { border-collapse: collapse; width: 100%; margin: 10px 0; }
          td { border: 1px solid #d1d5db; padding: 8px; vertical-align: top; }
          .label { font-weight: bold; background-color: #f3f4f6; width: 30%; }
          .value { background-color: #ffffff; }
          .section { margin: 20px 0; padding: 15px; border: 1px solid #e5e7eb; page-break-inside: avoid; }
          .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #065f46; font-size: 10pt; color: #6b7280; text-align: center; }
          @media print {
            body { margin: 0; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>ETHIOPIAN CIVIL SERVICE COMMISSION</h1>
        <h2>ADMINISTRATIVE COMPLAINTS APPROVED REPORT</h2>

        <div class="section">
          <h3>COMPLAINT INFORMATION</h3>
          <table>
            <tr><td class="label">Tracking ID:</td><td class="value">${feedback.trackingId || 'N/A'}</td></tr>
            <tr><td class="label">Case Number:</td><td class="value">${feedback.investigation.caseNumber || 'N/A'}</td></tr>
            <tr><td class="label">Category:</td><td class="value">${feedback.category || 'N/A'}</td></tr>
            <tr><td class="label">Subject:</td><td class="value">${feedback.subject || 'N/A'}</td></tr>
            <tr><td class="label">Date Submitted:</td><td class="value">${new Date(feedback.createdAt).toLocaleDateString()}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>INVESTIGATION DETAILS</h3>
          <table>
            <tr><td class="label">Investigation Status:</td><td class="value">${feedback.investigation.status}</td></tr>
            <tr><td class="label">Decision:</td><td class="value">${feedback.investigation.decision}</td></tr>
            ${feedback.investigation.outcome ? `<tr><td class="label">Investigation Outcome:</td><td class="value">${feedback.investigation.outcome}</td></tr>` : ''}
            ${feedback.investigation.correctiveAction ? `<tr><td class="label">Corrective Action:</td><td class="value">${feedback.investigation.correctiveAction}</td></tr>` : ''}
            ${feedback.investigation.decisionDate ? `<tr><td class="label">Decision Date:</td><td class="value">${new Date(feedback.investigation.decisionDate).toLocaleDateString()}</td></tr>` : ''}
            ${feedback.investigation.closureReason ? `<tr><td class="label">Approval Remarks:</td><td class="value">${feedback.investigation.closureReason}</td></tr>` : ''}
          </table>
        </div>

        <div class="section">
          <h3>COMPLAINT DESCRIPTION</h3>
          <p>${feedback.description || 'N/A'}</p>
        </div>

        <div class="footer">
          <p><strong>Ethics and Anti-Corruption Commission</strong></p>
          <p>This document is an official record of the approved administrative complaint investigation.</p>
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'Submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'UNDER_INVESTIGATION':
      case 'Under_Manager_Review':
        return 'bg-blue-100 text-blue-800';
      case 'Assigned_To_Investigation_Team':
        return 'bg-indigo-100 text-indigo-800';
      case 'Investigation_Completed':
        return 'bg-teal-100 text-teal-800';
      case 'Pending_Commissioner_Review':
        return 'bg-purple-100 text-purple-800';
      case 'Decision_Approved':
        return 'bg-emerald-100 text-emerald-800';
      case 'Response_Sent':
        return 'bg-cyan-100 text-cyan-800';
      case 'RESOLVED':
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
      case 'Closed':
        return 'bg-gray-100 text-gray-800';
      case 'REJECTED':
      case 'Rejected':
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

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">Track Feedback</CardTitle>
                <p className="text-gray-600">Enter your tracking ID to view feedback status and messages</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTrack} className="mb-6">
              <div className="flex gap-2">
                <Input
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="Enter tracking ID"
                  className="flex-1"
                />
                <Button type="submit" disabled={loading}>
                  {loading ? "Searching..." : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Track
                    </>
                  )}
                </Button>
              </div>
            </form>

            {error && (
              <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            {feedback && (
              <div className="space-y-6">
                {/* Description Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="w-5 h-5" />
                      Description
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(feedback.status)}`}>
                            {feedback.status.replace(/_/g, ' ')}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(feedback.priority)}`}>
                            {feedback.priority}
                          </span>
                          {feedback.investigation && feedback.investigation.decision === 'Approved' && (
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-300">
                              ✓ Decision Approved
                            </span>
                          )}
                          {commissionerDecision && (
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-300">
                              <Gavel className="w-3 h-3 inline mr-1" />
                              Commissioner Decision
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{feedback.subject}</h3>
                        <p className="text-gray-600 mb-2">{feedback.category}</p>
                        <p className="text-gray-700">{feedback.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500 pt-4 border-t">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(feedback.createdAt).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        Tracking ID: {feedback.trackingId}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Investigation Details with Approval Info */}
                {feedback.investigation && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Investigation Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Case Number</div>
                        <p className="font-medium">{feedback.investigation.caseNumber}</p>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Investigation Status</div>
                        <Badge className={getStatusColor(feedback.investigation.status)}>
                          {feedback.investigation.status}
                        </Badge>
                      </div>

                      {/* Show approval details if approved */}
                      {feedback.investigation.status === 'Closed' && feedback.investigation.decision === 'Approved' && (
                        <div className="mt-6 pt-6 border-t">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-start gap-3 mb-4">
                              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                              <h4 className="font-medium text-green-800">Investigation Approved</h4>
                            </div>
                            
                            <div className="space-y-3">
                              {feedback.investigation.outcome && (
                                <div>
                                  <div className="text-xs text-green-600 mb-1">Conclusion</div>
                                  <Badge className="bg-red-100 text-red-800">
                                    {feedback.investigation.outcome}
                                  </Badge>
                                </div>
                              )}
                              
                              {feedback.investigation.correctiveAction && (
                                <div>
                                  <div className="text-xs text-green-600 mb-1">Corrective Action</div>
                                  <p className="text-sm text-green-700">{feedback.investigation.correctiveAction}</p>
                                </div>
                              )}
                              
                              {feedback.investigation.decisionDate && (
                                <div>
                                  <div className="text-xs text-green-600 mb-1">Decision Date</div>
                                  <div className="flex items-center gap-1 text-sm text-green-700">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(feedback.investigation.decisionDate).toLocaleDateString()}
                                  </div>
                                </div>
                              )}
                              
                              {feedback.investigation.closureReason && (
                                <div>
                                  <div className="text-xs text-green-600 mb-1">Approval Remarks</div>
                                  <p className="text-sm text-green-700">{feedback.investigation.closureReason}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Show revision notes if returned */}
                      {feedback.investigation.status === 'Returned for Further Investigation' && (
                        <div className="mt-6 pt-6 border-t">
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                              <div>
                                <h4 className="font-medium text-orange-800 mb-2">Revision Required</h4>
                                <p className="text-sm text-orange-700">
                                  This investigation has been returned for further investigation. Please contact the feedback office for more information.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Show pending status */}
                      {feedback.investigation.status !== 'Closed' && feedback.investigation.status !== 'Returned for Further Investigation' && (
                        <div className="mt-6 pt-6 border-t">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                              <div>
                                <h4 className="font-medium text-blue-800 mb-2">Investigation in Progress</h4>
                                <p className="text-sm text-blue-700">
                                  Your complaint is currently being investigated. Please check back later for updates.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Administrative Complaints Approved Report */}
                {isAdminComplaint && feedback.investigation && feedback.investigation.decision === 'Approved' && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Administrative Complaints Approved Report
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => downloadApprovedReport()}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Report
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => printApprovedReport()}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Printer className="w-4 h-4 mr-2" />
                            Print Report
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                        <div className="space-y-4">
                          <div className="flex items-start gap-3 mb-4">
                            <CheckCircle className="w-6 h-6 text-emerald-600 mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-emerald-800 text-lg">Administrative Complaint Investigation - APPROVED</h4>
                              <p className="text-sm text-emerald-600">This administrative complaint investigation has been reviewed and approved</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            <div className="bg-white rounded-lg p-4 border border-emerald-300">
                              <div className="text-xs text-emerald-600 mb-1 uppercase tracking-wide">Tracking ID</div>
                              <p className="font-semibold text-emerald-900">{feedback.trackingId}</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-emerald-300">
                              <div className="text-xs text-emerald-600 mb-1 uppercase tracking-wide">Case Number</div>
                              <p className="font-semibold text-emerald-900">{feedback.investigation.caseNumber}</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-emerald-300">
                              <div className="text-xs text-emerald-600 mb-1 uppercase tracking-wide">Category</div>
                              <p className="font-semibold text-emerald-900">{feedback.category}</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-emerald-300">
                              <div className="text-xs text-emerald-600 mb-1 uppercase tracking-wide">Decision</div>
                              <Badge className="bg-green-100 text-green-800">{feedback.investigation.decision}</Badge>
                            </div>
                          </div>

                          <div className="mt-6 space-y-4">
                            {feedback.investigation.outcome && (
                              <div className="bg-white rounded-lg p-4 border border-emerald-300">
                                <div className="text-xs text-emerald-600 mb-1 uppercase tracking-wide">Investigation Outcome</div>
                                <p className="text-emerald-900 font-medium">{feedback.investigation.outcome}</p>
                              </div>
                            )}
                            
                            {feedback.investigation.correctiveAction && (
                              <div className="bg-white rounded-lg p-4 border border-emerald-300">
                                <div className="text-xs text-emerald-600 mb-1 uppercase tracking-wide">Corrective Action Required</div>
                                <p className="text-emerald-900">{feedback.investigation.correctiveAction}</p>
                              </div>
                            )}
                            
                            {feedback.investigation.closureReason && (
                              <div className="bg-white rounded-lg p-4 border border-emerald-300">
                                <div className="text-xs text-emerald-600 mb-1 uppercase tracking-wide">Approval Remarks</div>
                                <p className="text-emerald-900">{feedback.investigation.closureReason}</p>
                              </div>
                            )}
                          </div>

                          {feedback.investigation.decisionDate && (
                            <div className="mt-6 pt-4 border-t border-emerald-300">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-emerald-700">
                                  <Calendar className="w-4 h-4" />
                                  <span>Decision Date: {new Date(feedback.investigation.decisionDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-emerald-700">
                                  <Clock className="w-4 h-4" />
                                  <span>Report Generated: {new Date().toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Department Response */}
                {feedback.departmentalResponse && (feedback.status === 'ለቅሬታ አቅራቢወ የተላከ' || feedback.status === 'Response Submitted' || feedback.status === 'Petition Submitted' || feedback.status === 'Under Petition Review' || feedback.petitions && feedback.petitions.length > 0) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        ለቅሬታዎ ከስራ ክፍሉ የተሰጠ መልስ
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {feedback.departmentalResponse.summary && (
                        <div>
                          <div className="text-sm text-gray-500 mb-1">ማጠቃለያ</div>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{feedback.departmentalResponse.summary}</p>
                        </div>
                      )}
                      {feedback.departmentalResponse.investigationConducted && (
                        <div>
                          <div className="text-sm text-gray-500 mb-1">የተደረገ ምርመራ</div>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{feedback.departmentalResponse.investigationConducted}</p>
                        </div>
                      )}
                      {feedback.departmentalResponse.findings && (
                        <div>
                          <div className="text-sm text-gray-500 mb-1">የታየ ክፍተት</div>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{feedback.departmentalResponse.findings}</p>
                        </div>
                      )}
                      {feedback.departmentalResponse.actionsTaken && (
                        <div>
                          <div className="text-sm text-gray-500 mb-1">የተወሰደ እርምጃ</div>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{feedback.departmentalResponse.actionsTaken}</p>
                        </div>
                      )}
                      {feedback.departmentalResponse.officialResponse && (
                        <div>
                          <div className="text-sm text-gray-500 mb-1">ይፋዊ መልስ</div>
                          <p className="text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-200">{feedback.departmentalResponse.officialResponse}</p>
                        </div>
                      )}
                      {feedback.departmentalResponse.recommendations && (
                        <div>
                          <div className="text-sm text-gray-500 mb-1">ምክረ ሀሳብ</div>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{feedback.departmentalResponse.recommendations}</p>
                        </div>
                      )}

                      {/* Accept Response and Petition Buttons */}
                      {feedback.status === 'ለቅሬታ አቅራቢወ የተላከ' && (
                        <div className="flex gap-3 pt-4 border-t">
                          <Button onClick={handleAcceptResponse} className="flex-1 bg-green-600 hover:bg-green-700">
                            <ThumbsUp className="mr-2 h-4 w-4" />
                            መቀበል
                          </Button>
                          <Button onClick={() => setShowPetitionForm(!showPetitionForm)} variant="outline" className="flex-1">
                            <FileEdit className="mr-2 h-4 w-4" />
                            አቤቱታ መፍጠር
                          </Button>
                        </div>
                      )}

                      {/* Petition Form */}
                      {showPetitionForm && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-semibold mb-4">አቤቱታዎን ይላኩ</h4>
                          <form onSubmit={handlePetitionSubmit} className="space-y-4">
                            <div>
                              <Label htmlFor="reasonForDissatisfaction">በመልሱ ያልረኩበት ምክንያት *</Label>
                              <Textarea
                                id="reasonForDissatisfaction"
                                value={petitionData.reasonForDissatisfaction}
                                onChange={(e) => setPetitionData({ ...petitionData, reasonForDissatisfaction: e.target.value })}
                                placeholder="Explain why you are dissatisfied with the response"
                                rows={3}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="explanation">ዝርዝር ገለፃ *</Label>
                              <Textarea
                                id="explanation"
                                value={petitionData.explanation}
                                onChange={(e) => setPetitionData({ ...petitionData, explanation: e.target.value })}
                                placeholder="Provide detailed explanation of why the response is unsatisfactory"
                                rows={3}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="additionalInfo">ተጨማሪ መረጃ</Label>
                              <Textarea
                                id="additionalInfo"
                                value={petitionData.additionalInfo}
                                onChange={(e) => setPetitionData({ ...petitionData, additionalInfo: e.target.value })}
                                placeholder="Any additional information or evidence"
                                rows={2}
                              />
                            </div>
                            <div>
                              <Label htmlFor="requestedAction">መወሰድ ያለበት እርምጃ</Label>
                              <Textarea
                                id="requestedAction"
                                value={petitionData.requestedAction}
                                onChange={(e) => setPetitionData({ ...petitionData, requestedAction: e.target.value })}
                                placeholder="What action would you like to be taken?"
                                rows={2}
                              />
                            </div>
                            <div className="flex gap-3">
                              <Button type="submit" disabled={submittingPetition} className="flex-1">
                                {submittingPetition ? "Submitting..." : "አቤቱታዎን ይላኩ"}
                              </Button>
                              <Button type="button" variant="outline" onClick={() => setShowPetitionForm(false)} className="flex-1">
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Petition Information */}
                {feedback.petitions && feedback.petitions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Complainant's Petition
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {feedback.petitions.map((petition) => (
                        <div key={petition.id} className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-medium text-orange-800">
                              Petition Number: {petition.petitionNumber}
                            </div>
                            <Badge className="bg-orange-100 text-orange-800">
                              {petition.status}
                            </Badge>
                          </div>
                          {petition.reasonForDissatisfaction && (
                            <div className="mb-3">
                              <div className="text-sm text-gray-500 mb-1">Reason for Dissatisfaction</div>
                              <p className="text-gray-700">{petition.reasonForDissatisfaction}</p>
                            </div>
                          )}
                          {petition.explanation && (
                            <div className="mb-3">
                              <div className="text-sm text-gray-500 mb-1">Explanation</div>
                              <p className="text-gray-700">{petition.explanation}</p>
                            </div>
                          )}
                          {petition.additionalInfo && (
                            <div className="mb-3">
                              <div className="text-sm text-gray-500 mb-1">Additional Information</div>
                              <p className="text-gray-700">{petition.additionalInfo}</p>
                            </div>
                          )}
                          {petition.requestedAction && (
                            <div className="mb-3">
                              <div className="text-sm text-gray-500 mb-1">Requested Corrective Action</div>
                              <p className="text-gray-700">{petition.requestedAction}</p>
                            </div>
                          )}
                          {petition.investigationInstructions && (
                            <div className="mb-3">
                              <div className="text-sm text-gray-500 mb-1">Investigation Instructions</div>
                              <p className="text-gray-700 bg-white p-2 rounded">{petition.investigationInstructions}</p>
                            </div>
                          )}
                          {petition.investigationDeadline && (
                            <div>
                              <div className="text-sm text-gray-500 mb-1">Investigation Deadline</div>
                              <p className="text-gray-700">{new Date(petition.investigationDeadline).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Commissioner Final Decision Details */}
                {commissionerDecision && commissionerDecision.commissionerDecision && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Gavel className="w-5 h-5" />
                          Commissioner Final Decision Details
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={downloadCommissionerDecision}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                          <Button
                            size="sm"
                            onClick={printCommissionerDecision}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs text-green-600 mb-1">Decision Type</div>
                            <p className="font-medium text-green-800">{commissionerDecision.commissionerDecision.decisionType || 'N/A'}</p>
                          </div>
                          <div>
                            <div className="text-xs text-green-600 mb-1">Disciplinary Action</div>
                            <p className="text-sm text-green-700">{commissionerDecision.commissionerDecision.disciplinaryAction || 'N/A'}</p>
                          </div>
                          <div>
                            <div className="text-xs text-green-600 mb-1">Final Decision Summary</div>
                            <p className="text-sm text-green-700">{commissionerDecision.commissionerDecision.finalDecisionSummary || 'N/A'}</p>
                          </div>
                          <div>
                            <div className="text-xs text-green-600 mb-1">Commissioner</div>
                            <p className="text-sm text-green-700">{commissionerDecision.commissionerDecision.commissionerName || 'N/A'}</p>
                          </div>
                          <div>
                            <div className="text-xs text-green-600 mb-1">Decision Date</div>
                            <p className="text-sm text-green-700">{commissionerDecision.commissionerDecision.decisionDate || 'N/A'}</p>
                          </div>
                          <div>
                            <div className="text-xs text-green-600 mb-1">Final Petition Status</div>
                            <Badge className="bg-green-100 text-green-800">
                              {commissionerDecision.commissionerDecision.finalPetitionStatus || 'N/A'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Complaints Response */}
                {feedback.response && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Complaints Response
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-gray-700">{feedback.response}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="bg-white border rounded-lg p-6">
                  <h4 className="text-lg font-semibold mb-4">Messages</h4>
                  
                  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                    {/* Status Message as System Message */}
                    {feedback && (
                      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="flex items-start gap-3">
                          <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-sm text-blue-900">System</span>
                              <span className="text-xs text-gray-500">
                                {new Date(feedback.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-blue-900">
                              {feedback.status.includes('Assigned to Department') || feedback.status.includes('Under Department Review') ? 
                                'ቅሬታዎ ለሚመለከተዉ የስራ ክፍል ተልኳል' :
                                feedback.status.includes('Response Submitted') || feedback.status.includes('ለቅሬታ አቅራቢወ የተላከ') || feedback.status.includes('Departmental response submitted for review') ?
                                'የስራ ክፍሉ ለቅሬታዎ መልስ ሰቷል' :
                                feedback.status.includes('Petition Submitted') || feedback.status.includes('Under Petition Review') || feedback.status.includes('Petition submitted by complainant') ?
                                'አቤቱታዎ ለሰራተኛ ተመድቧል' :
                                feedback.status.includes('Sent to Commissioner') || feedback.status.includes('Under Commissioner Review') ?
                                'የታየዉ ቅሬታ ለዉሳኔ ለኮሚኝነሩ ተልኳል' :
                                feedback.status.replace(/_/g, ' ')
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {messages.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No messages yet</p>
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
                              {msg.senderType === 'COMPLAINANT' ? 'You' : msg.senderRole}
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
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Button
            variant="link"
            onClick={() => router.push("/guest-feedback")}
            className="text-blue-600"
          >
            Submit New Feedback
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function TrackFeedbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TrackFeedbackContent />
    </Suspense>
  );
}
