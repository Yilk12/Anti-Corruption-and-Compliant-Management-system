"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUserPrimaryRole } from "@/app/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { ArrowLeft, CheckCircle, FileText, Calendar, Save, Download, Printer } from "lucide-react";
import { Textarea } from "@/app/components/ui/textarea";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

export default function CommissionerPetitionPage() {
  const router = useRouter();
  const [approvedComplaints, setApprovedComplaints] = useState<any[]>([]);
  const [approvedPetitions, setApprovedPetitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [showFinalDecisionForm, setShowFinalDecisionForm] = useState(false);
  const [showDecisionDetails, setShowDecisionDetails] = useState(false);
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [finalDecisionData, setFinalDecisionData] = useState({
    // Section 1: Petition Information
    petitionId: '',
    petitionSubject: '',
    petitionerName: '',
    concernedDepartment: '',
    dateReceived: '',
    investigationReportAttachment: '',
    summaryOfFindings: '',
    evidenceReviewed: '',
    investigatorRecommendation: '',
    commissionerObservations: '',
    legalPolicyBasis: '',
    decisionType: '',
    disciplinaryAction: '',
    responsibleDepartment: '',
    implementationDeadline: '',
    finalDecisionSummary: '',
    commissionerName: '',
    decisionDate: '',
    decisionNotificationStatus: '',
    implementationStatus: '',
    closureRemarks: '',
    finalPetitionStatus: ''
  });

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
    const role = getCurrentUserPrimaryRole();
    // Allow access to commissioner role
    if (role !== "commissioner" && role !== "admin") {
      router.replace("/dashboard/Commissioner");
    }
  }, [router]);

  const fetchApprovedItems = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      // Fetch approved/closed complaints
      const complaintsRes = await fetch(`${API_BASE}/api/feedback/complaints`, { 
        headers
      });
      if (complaintsRes.status === 401) {
        console.error('Unauthorized: Token may be expired');
        setLoading(false);
        return;
      }
      const complaintsData = complaintsRes.ok ? await complaintsRes.json() : [];
      const complaintsArray = Array.isArray(complaintsData) ? complaintsData : (complaintsData?.items || []);
      
      // Filter for approved/closed complaints - match dashboard logic
      const approvedComplaintsData = complaintsArray.filter((c: any) => 
        c.status === 'Closed' || c.status === 'Accepted'
      );
      
      console.log('All complaints:', complaintsArray.map((c: any) => ({ 
        trackingId: c.trackingId, 
        status: c.status 
      })));
      
      console.log('Approved complaints:', approvedComplaintsData.map((c: any) => ({ 
        trackingId: c.trackingId, 
        status: c.status 
      })));
      
      setApprovedComplaints(approvedComplaintsData);

      // Fetch approved petitions
      const petitionsRes = await fetch(`${API_BASE}/api/feedback/petitions/all`, { 
        headers
      });
      if (petitionsRes.status === 401) {
        console.error('Unauthorized: Token may be expired');
        setLoading(false);
        return;
      }
      const petitionsData = petitionsRes.ok ? await petitionsRes.json() : [];
      const petitionsArray = Array.isArray(petitionsData) ? petitionsData : [];
      
      console.log('=== PETITION DEBUG ===');
      console.log('Raw petitions response:', petitionsData);
      console.log('Petitions array length:', petitionsArray.length);
      console.log('All petitions with details:', petitionsArray.map((p: any) => ({ 
        id: p.id,
        petitionNumber: p.petitionNumber, 
        status: p.status,
        complaintId: p.complaintId
      })));
      
      // Filter for petitions pending commissioner review (Approved, Under Final Decision Review, or Final Decision Issued)
      const approvedPetitionsData = petitionsArray.filter((p: any) =>
        p.status === 'Approved' || p.status === 'Under Final Decision Review' || p.status === 'Final Decision Issued'
      );
      
      console.log('Petitions pending commissioner review:', approvedPetitionsData.map((p: any) => ({ 
        petitionNumber: p.petitionNumber, 
        status: p.status 
      })));
      console.log('Pending review count:', approvedPetitionsData.length);
      console.log('=== END PETITION DEBUG ===');
      
      // Check for specific petitions
      const targetPetitions = ['PET-2026-2337', 'PET-2026-8584'];
      targetPetitions.forEach(targetNum => {
        const found = petitionsArray.find((p: any) => p.petitionNumber === targetNum);
        console.log(`Petition ${targetNum}:`, found ? 'FOUND' : 'NOT FOUND', found ? found.status : '');
      });
      
      setApprovedPetitions(approvedPetitionsData);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Failed to fetch approved items:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedItems();
  }, []);

  // Create a map of complaint IDs to petitions
  const complaintToPetitionMap = new Map<string, any[]>();
  approvedPetitions.forEach((petition) => {
    if (petition.complaintId) {
      if (!complaintToPetitionMap.has(petition.complaintId)) {
        complaintToPetitionMap.set(petition.complaintId, []);
      }
      complaintToPetitionMap.get(petition.complaintId)?.push(petition);
    }
  });

  // Check if a complaint has a petition
  const hasPetition = (complaintId: string) => {
    return complaintToPetitionMap.has(complaintId);
  };

  // Get petition count for a complaint
  const getPetitionCount = (complaintId: string) => {
    return complaintToPetitionMap.get(complaintId)?.length || 0;
  };

  const handleItemClick = (item: any, type: 'complaint' | 'petition') => {
    setSelectedItem({ ...item, type });
    setViewMode('detail');

    // If it's a petition with a saved commissioner decision, auto-load the form
    if (type === 'petition' && item.investigationReport?.observations) {
      try {
        const observations = JSON.parse(item.investigationReport.observations);
        if (observations.commissionerDecision) {
          const savedDecision = observations.commissionerDecision;
          setFinalDecisionData({
            petitionId: savedDecision.petitionId || item.petitionNumber || '',
            petitionSubject: savedDecision.petitionSubject || item.complaint?.subject || '',
            petitionerName: savedDecision.petitionerName || item.complaint?.complainantName || '',
            concernedDepartment: savedDecision.concernedDepartment || item.complaint?.departmentName || '',
            dateReceived: savedDecision.dateReceived || (item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : ''),
            investigationReportAttachment: savedDecision.investigationReportAttachment || '',
            summaryOfFindings: savedDecision.summaryOfFindings || '',
            evidenceReviewed: savedDecision.evidenceReviewed || '',
            investigatorRecommendation: savedDecision.investigatorRecommendation || '',
            commissionerObservations: savedDecision.commissionerObservations || '',
            legalPolicyBasis: savedDecision.legalPolicyBasis || '',
            decisionType: savedDecision.decisionType || '',
            disciplinaryAction: savedDecision.disciplinaryAction || '',
            responsibleDepartment: savedDecision.responsibleDepartment || item.complaint?.departmentName || '',
            implementationDeadline: savedDecision.implementationDeadline || '',
            finalDecisionSummary: savedDecision.finalDecisionSummary || '',
            commissionerName: savedDecision.commissionerName || '',
            decisionDate: savedDecision.decisionDate || new Date().toISOString().split('T')[0],
            decisionNotificationStatus: savedDecision.decisionNotificationStatus || 'Pending',
            implementationStatus: savedDecision.implementationStatus || 'Pending',
            closureRemarks: savedDecision.closureRemarks || '',
            finalPetitionStatus: savedDecision.finalPetitionStatus || ''
          });
          setShowFinalDecisionForm(true);
        }
      } catch {
        // Not JSON, continue
      }
    }
  };

  const handleBackToList = () => {
    setSelectedItem(null);
    setViewMode('list');
    setShowFinalDecisionForm(false);
  };

  const handleDownloadDecision = (observations: any) => {
    const decision = observations.commissionerDecision;
    const complaint = selectedItem?.complaint || {};
    const investigationReport = selectedItem?.investigationReport || {};

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
    <h3>1. COMPLAINANT INFORMATION</h3>
    <table>
      <tr><td class="label">Complainant Name:</td><td class="value">${complaint.complainantName || 'N/A'}</td></tr>
      <tr><td class="label">Email:</td><td class="value">${complaint.complainantEmail || 'N/A'}</td></tr>
      <tr><td class="label">Phone:</td><td class="value">${complaint.complainantPhone || 'N/A'}</td></tr>
    </table>
  </div>

  <div class="section">
    <h3>2. COMPLAINT DETAILS</h3>
    <table>
      <tr><td class="label">Tracking ID:</td><td class="value">${complaint.trackingId || 'N/A'}</td></tr>
      <tr><td class="label">Reference Number:</td><td class="value">${complaint.referenceNumber || 'N/A'}</td></tr>
      <tr><td class="label">Category:</td><td class="value">${complaint.category || 'N/A'}</td></tr>
      <tr><td class="label">Subject:</td><td class="value">${complaint.subject || 'N/A'}</td></tr>
      <tr><td class="label">Priority:</td><td class="value">${complaint.priority || 'N/A'}</td></tr>
      <tr><td class="label">Status:</td><td class="value">${complaint.status || 'N/A'}</td></tr>
      <tr><td class="label">Department:</td><td class="value">${complaint.departmentName || 'N/A'}</td></tr>
      <tr><td class="label">Submitted Date:</td><td class="value">${complaint.createdAt ? new Date(complaint.createdAt).toLocaleString() : 'N/A'}</td></tr>
    </table>
  </div>

  <div class="section">
    <h3>3. DESCRIPTION</h3>
    <p>${complaint.description || 'N/A'}</p>
  </div>

  <div class="section">
    <h3>4. DEPARTMENT RESPONSE</h3>
    ${typeof complaint.departmentalResponse === 'object' ? `
      <table>
        ${complaint.departmentalResponse.responseNumber ? `<tr><td class="label">Response Number:</td><td class="value">${complaint.departmentalResponse.responseNumber}</td></tr>` : ''}
        ${complaint.departmentalResponse.summary ? `<tr><td class="label">Summary:</td><td class="value">${complaint.departmentalResponse.summary}</td></tr>` : ''}
        ${complaint.departmentalResponse.investigationConducted ? `<tr><td class="label">Investigation Conducted:</td><td class="value">${complaint.departmentalResponse.investigationConducted}</td></tr>` : ''}
        ${complaint.departmentalResponse.findings ? `<tr><td class="label">Findings:</td><td class="value">${complaint.departmentalResponse.findings}</td></tr>` : ''}
        ${complaint.departmentalResponse.actionsTaken ? `<tr><td class="label">Actions Taken:</td><td class="value">${complaint.departmentalResponse.actionsTaken}</td></tr>` : ''}
        ${complaint.departmentalResponse.proposedActions ? `<tr><td class="label">Proposed Actions:</td><td class="value">${complaint.departmentalResponse.proposedActions}</td></tr>` : ''}
        ${complaint.departmentalResponse.officialResponse ? `<tr><td class="label">Official Response:</td><td class="value">${complaint.departmentalResponse.officialResponse}</td></tr>` : ''}
        ${complaint.departmentalResponse.recommendations ? `<tr><td class="label">Recommendations:</td><td class="value">${complaint.departmentalResponse.recommendations}</td></tr>` : ''}
        ${complaint.departmentalResponse.status ? `<tr><td class="label">Status:</td><td class="value">${complaint.departmentalResponse.status}</td></tr>` : ''}
        ${complaint.departmentalResponse.submittedAt ? `<tr><td class="label">Submitted At:</td><td class="value">${new Date(complaint.departmentalResponse.submittedAt).toLocaleString()}</td></tr>` : ''}
      </table>
    ` : `<p>${complaint.departmentalResponse || 'No department response provided'}</p>`}
  </div>

  <div class="section">
    <h3>5. COMPLAINANT'S PETITION</h3>
    <table>
      <tr><td class="label">Petition Number:</td><td class="value">${selectedItem?.petitionNumber || 'N/A'}</td></tr>
      <tr><td class="label">Reason for Dissatisfaction:</td><td class="value">${selectedItem?.reasonForDissatisfaction || 'N/A'}</td></tr>
      <tr><td class="label">Explanation:</td><td class="value">${selectedItem?.explanation || 'N/A'}</td></tr>
      <tr><td class="label">Assigned Officer:</td><td class="value">${typeof selectedItem?.assignedOfficer === 'object' ? `${selectedItem.assignedOfficer.firstName || ''} ${selectedItem.assignedOfficer.lastName || ''}`.trim() : selectedItem?.assignedOfficer || 'N/A'}</td></tr>
      <tr><td class="label">Assigned By:</td><td class="value">${typeof selectedItem?.assignedBy === 'object' ? `${selectedItem.assignedBy.firstName || ''} ${selectedItem.assignedBy.lastName || ''}`.trim() : selectedItem?.assignedBy || 'N/A'}</td></tr>
      <tr><td class="label">Petition Status:</td><td class="value">${selectedItem?.status || 'N/A'}</td></tr>
    </table>
  </div>

  <div class="section">
    <h3>6. INVESTIGATION REPORT</h3>
    <table>
      <tr><td class="label">Report Number:</td><td class="value">${investigationReport.reportNumber || 'N/A'}</td></tr>
      <tr><td class="label">Status:</td><td class="value">${investigationReport.status || 'N/A'}</td></tr>
      <tr><td class="label">Background:</td><td class="value">${investigationReport.background || 'N/A'}</td></tr>
      <tr><td class="label">Objectives:</td><td class="value">${investigationReport.objectives || 'N/A'}</td></tr>
      <tr><td class="label">Activities Performed:</td><td class="value">${investigationReport.activitiesPerformed || 'N/A'}</td></tr>
      <tr><td class="label">Evidence Collected:</td><td class="value">${investigationReport.evidenceCollected || 'N/A'}</td></tr>
      <tr><td class="label">Persons Interviewed:</td><td class="value">${investigationReport.personsInterviewed || 'N/A'}</td></tr>
      <tr><td class="label">Findings:</td><td class="value">${investigationReport.findings || 'N/A'}</td></tr>
      <tr><td class="label">Conclusions:</td><td class="value">${investigationReport.conclusions || 'N/A'}</td></tr>
      <tr><td class="label">Recommendations:</td><td class="value">${investigationReport.recommendations || 'N/A'}</td></tr>
      <tr><td class="label">Submitted At:</td><td class="value">${investigationReport.submittedAt ? new Date(investigationReport.submittedAt).toLocaleString() : 'N/A'}</td></tr>
    </table>
  </div>

  <div class="section">
    <h3>7. COMMISSIONER FINAL DECISION DETAILS</h3>
    <table>
      <tr><td class="label">Petition Number:</td><td class="value">${decision.petitionId || 'N/A'}</td></tr>
      <tr><td class="label">Petition Subject:</td><td class="value">${decision.petitionSubject || 'N/A'}</td></tr>
      <tr><td class="label">Petitioner Name:</td><td class="value">${decision.petitionerName || 'N/A'}</td></tr>
      <tr><td class="label">Concerned Department:</td><td class="value">${decision.concernedDepartment || 'N/A'}</td></tr>
      <tr><td class="label">Date Received:</td><td class="value">${decision.dateReceived || 'N/A'}</td></tr>
      <tr><td class="label">Investigation Report Attachment:</td><td class="value">${decision.investigationReportAttachment || 'N/A'}</td></tr>
      <tr><td class="label">Summary of Findings:</td><td class="value">${decision.summaryOfFindings || 'N/A'}</td></tr>
      <tr><td class="label">Evidence Reviewed:</td><td class="value">${decision.evidenceReviewed || 'N/A'}</td></tr>
      <tr><td class="label">Investigator Recommendation:</td><td class="value">${decision.investigatorRecommendation || 'N/A'}</td></tr>
      <tr><td class="label">Commissioner's Observations:</td><td class="value">${decision.commissionerObservations || 'N/A'}</td></tr>
      <tr><td class="label">Legal/Policy Basis:</td><td class="value">${decision.legalPolicyBasis || 'N/A'}</td></tr>
      <tr><td class="label">Decision Type:</td><td class="value">${decision.decisionType || 'N/A'}</td></tr>
      <tr><td class="label">Disciplinary Action:</td><td class="value">${decision.disciplinaryAction || 'N/A'}</td></tr>
      <tr><td class="label">Responsible Department:</td><td class="value">${decision.responsibleDepartment || 'N/A'}</td></tr>
      <tr><td class="label">Implementation Deadline:</td><td class="value">${decision.implementationDeadline || 'N/A'}</td></tr>
      <tr><td class="label">Decision Notification Status:</td><td class="value">${decision.decisionNotificationStatus || 'N/A'}</td></tr>
      <tr><td class="label">Implementation Status:</td><td class="value">${decision.implementationStatus || 'N/A'}</td></tr>
      <tr><td class="label">Final Decision Summary:</td><td class="value">${decision.finalDecisionSummary || 'N/A'}</td></tr>
      <tr><td class="label">Commissioner Name:</td><td class="value">${decision.commissionerName || 'N/A'}</td></tr>
      <tr><td class="label">Decision Date:</td><td class="value">${decision.decisionDate || 'N/A'}</td></tr>
      <tr><td class="label">Final Petition Status:</td><td class="value">${decision.finalPetitionStatus || 'N/A'}</td></tr>
      <tr><td class="label">Closure Remarks:</td><td class="value">${decision.closureRemarks || 'N/A'}</td></tr>
      <tr><td class="label">Submitted At:</td><td class="value">${decision.submittedAt || 'N/A'}</td></tr>
      <tr><td class="label">Submitted By Commissioner ID:</td><td class="value">${decision.submittedByCommissionerId || 'N/A'}</td></tr>
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
    a.download = `Commissioner_Decision_${decision.petitionId || 'Petition'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintDecision = (observations: any) => {
    const decision = observations.commissionerDecision;
    const complaint = selectedItem?.complaint || {};
    const investigationReport = selectedItem?.investigationReport || {};

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
          <h3>1. COMPLAINANT INFORMATION</h3>
          <table>
            <tr><td class="label">Complainant Name:</td><td class="value">${complaint.complainantName || 'N/A'}</td></tr>
            <tr><td class="label">Email:</td><td class="value">${complaint.complainantEmail || 'N/A'}</td></tr>
            <tr><td class="label">Phone:</td><td class="value">${complaint.complainantPhone || 'N/A'}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>2. COMPLAINT DETAILS</h3>
          <table>
            <tr><td class="label">Tracking ID:</td><td class="value">${complaint.trackingId || 'N/A'}</td></tr>
            <tr><td class="label">Reference Number:</td><td class="value">${complaint.referenceNumber || 'N/A'}</td></tr>
            <tr><td class="label">Category:</td><td class="value">${complaint.category || 'N/A'}</td></tr>
            <tr><td class="label">Subject:</td><td class="value">${complaint.subject || 'N/A'}</td></tr>
            <tr><td class="label">Priority:</td><td class="value">${complaint.priority || 'N/A'}</td></tr>
            <tr><td class="label">Status:</td><td class="value">${complaint.status || 'N/A'}</td></tr>
            <tr><td class="label">Department:</td><td class="value">${complaint.departmentName || 'N/A'}</td></tr>
            <tr><td class="label">Submitted Date:</td><td class="value">${complaint.createdAt ? new Date(complaint.createdAt).toLocaleString() : 'N/A'}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>3. DESCRIPTION</h3>
          <p>${complaint.description || 'N/A'}</p>
        </div>

        <div class="section">
          <h3>4. DEPARTMENT RESPONSE</h3>
          ${typeof complaint.departmentalResponse === 'object' ? `
            <table>
              ${complaint.departmentalResponse.responseNumber ? `<tr><td class="label">Response Number:</td><td class="value">${complaint.departmentalResponse.responseNumber}</td></tr>` : ''}
              ${complaint.departmentalResponse.summary ? `<tr><td class="label">Summary:</td><td class="value">${complaint.departmentalResponse.summary}</td></tr>` : ''}
              ${complaint.departmentalResponse.investigationConducted ? `<tr><td class="label">Investigation Conducted:</td><td class="value">${complaint.departmentalResponse.investigationConducted}</td></tr>` : ''}
              ${complaint.departmentalResponse.findings ? `<tr><td class="label">Findings:</td><td class="value">${complaint.departmentalResponse.findings}</td></tr>` : ''}
              ${complaint.departmentalResponse.actionsTaken ? `<tr><td class="label">Actions Taken:</td><td class="value">${complaint.departmentalResponse.actionsTaken}</td></tr>` : ''}
              ${complaint.departmentalResponse.proposedActions ? `<tr><td class="label">Proposed Actions:</td><td class="value">${complaint.departmentalResponse.proposedActions}</td></tr>` : ''}
              ${complaint.departmentalResponse.officialResponse ? `<tr><td class="label">Official Response:</td><td class="value">${complaint.departmentalResponse.officialResponse}</td></tr>` : ''}
              ${complaint.departmentalResponse.recommendations ? `<tr><td class="label">Recommendations:</td><td class="value">${complaint.departmentalResponse.recommendations}</td></tr>` : ''}
              ${complaint.departmentalResponse.status ? `<tr><td class="label">Status:</td><td class="value">${complaint.departmentalResponse.status}</td></tr>` : ''}
              ${complaint.departmentalResponse.submittedAt ? `<tr><td class="label">Submitted At:</td><td class="value">${new Date(complaint.departmentalResponse.submittedAt).toLocaleString()}</td></tr>` : ''}
            </table>
          ` : `<p>${complaint.departmentalResponse || 'No department response provided'}</p>`}
        </div>

        <div class="section">
          <h3>5. COMPLAINANT'S PETITION</h3>
          <table>
            <tr><td class="label">Petition Number:</td><td class="value">${selectedItem?.petitionNumber || 'N/A'}</td></tr>
            <tr><td class="label">Reason for Dissatisfaction:</td><td class="value">${selectedItem?.reasonForDissatisfaction || 'N/A'}</td></tr>
            <tr><td class="label">Explanation:</td><td class="value">${selectedItem?.explanation || 'N/A'}</td></tr>
            <tr><td class="label">Assigned Officer:</td><td class="value">${typeof selectedItem?.assignedOfficer === 'object' ? `${selectedItem.assignedOfficer.firstName || ''} ${selectedItem.assignedOfficer.lastName || ''}`.trim() : selectedItem?.assignedOfficer || 'N/A'}</td></tr>
            <tr><td class="label">Assigned By:</td><td class="value">${typeof selectedItem?.assignedBy === 'object' ? `${selectedItem.assignedBy.firstName || ''} ${selectedItem.assignedBy.lastName || ''}`.trim() : selectedItem?.assignedBy || 'N/A'}</td></tr>
            <tr><td class="label">Petition Status:</td><td class="value">${selectedItem?.status || 'N/A'}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>6. INVESTIGATION REPORT</h3>
          <table>
            <tr><td class="label">Report Number:</td><td class="value">${investigationReport.reportNumber || 'N/A'}</td></tr>
            <tr><td class="label">Status:</td><td class="value">${investigationReport.status || 'N/A'}</td></tr>
            <tr><td class="label">Background:</td><td class="value">${investigationReport.background || 'N/A'}</td></tr>
            <tr><td class="label">Objectives:</td><td class="value">${investigationReport.objectives || 'N/A'}</td></tr>
            <tr><td class="label">Activities Performed:</td><td class="value">${investigationReport.activitiesPerformed || 'N/A'}</td></tr>
            <tr><td class="label">Evidence Collected:</td><td class="value">${investigationReport.evidenceCollected || 'N/A'}</td></tr>
            <tr><td class="label">Persons Interviewed:</td><td class="value">${investigationReport.personsInterviewed || 'N/A'}</td></tr>
            <tr><td class="label">Findings:</td><td class="value">${investigationReport.findings || 'N/A'}</td></tr>
            <tr><td class="label">Conclusions:</td><td class="value">${investigationReport.conclusions || 'N/A'}</td></tr>
            <tr><td class="label">Recommendations:</td><td class="value">${investigationReport.recommendations || 'N/A'}</td></tr>
            <tr><td class="label">Submitted At:</td><td class="value">${investigationReport.submittedAt ? new Date(investigationReport.submittedAt).toLocaleString() : 'N/A'}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>7. COMMISSIONER FINAL DECISION DETAILS</h3>
          <table>
            <tr><td class="label">Petition Number:</td><td class="value">${decision.petitionId || 'N/A'}</td></tr>
            <tr><td class="label">Petition Subject:</td><td class="value">${decision.petitionSubject || 'N/A'}</td></tr>
            <tr><td class="label">Petitioner Name:</td><td class="value">${decision.petitionerName || 'N/A'}</td></tr>
            <tr><td class="label">Concerned Department:</td><td class="value">${decision.concernedDepartment || 'N/A'}</td></tr>
            <tr><td class="label">Date Received:</td><td class="value">${decision.dateReceived || 'N/A'}</td></tr>
            <tr><td class="label">Investigation Report Attachment:</td><td class="value">${decision.investigationReportAttachment || 'N/A'}</td></tr>
            <tr><td class="label">Summary of Findings:</td><td class="value">${decision.summaryOfFindings || 'N/A'}</td></tr>
            <tr><td class="label">Evidence Reviewed:</td><td class="value">${decision.evidenceReviewed || 'N/A'}</td></tr>
            <tr><td class="label">Investigator Recommendation:</td><td class="value">${decision.investigatorRecommendation || 'N/A'}</td></tr>
            <tr><td class="label">Commissioner's Observations:</td><td class="value">${decision.commissionerObservations || 'N/A'}</td></tr>
            <tr><td class="label">Legal/Policy Basis:</td><td class="value">${decision.legalPolicyBasis || 'N/A'}</td></tr>
            <tr><td class="label">Decision Type:</td><td class="value">${decision.decisionType || 'N/A'}</td></tr>
            <tr><td class="label">Disciplinary Action:</td><td class="value">${decision.disciplinaryAction || 'N/A'}</td></tr>
            <tr><td class="label">Responsible Department:</td><td class="value">${decision.responsibleDepartment || 'N/A'}</td></tr>
            <tr><td class="label">Implementation Deadline:</td><td class="value">${decision.implementationDeadline || 'N/A'}</td></tr>
            <tr><td class="label">Decision Notification Status:</td><td class="value">${decision.decisionNotificationStatus || 'N/A'}</td></tr>
            <tr><td class="label">Implementation Status:</td><td class="value">${decision.implementationStatus || 'N/A'}</td></tr>
            <tr><td class="label">Final Decision Summary:</td><td class="value">${decision.finalDecisionSummary || 'N/A'}</td></tr>
            <tr><td class="label">Commissioner Name:</td><td class="value">${decision.commissionerName || 'N/A'}</td></tr>
            <tr><td class="label">Decision Date:</td><td class="value">${decision.decisionDate || 'N/A'}</td></tr>
            <tr><td class="label">Final Petition Status:</td><td class="value">${decision.finalPetitionStatus || 'N/A'}</td></tr>
            <tr><td class="label">Closure Remarks:</td><td class="value">${decision.closureRemarks || 'N/A'}</td></tr>
            <tr><td class="label">Submitted At:</td><td class="value">${decision.submittedAt || 'N/A'}</td></tr>
            <tr><td class="label">Submitted By Commissioner ID:</td><td class="value">${decision.submittedByCommissionerId || 'N/A'}</td></tr>
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

  const handleOpenFinalDecisionForm = () => {
    // Pre-fill form with petition data or saved commissioner decision
    if (selectedItem) {
      // Check if there's already a saved commissioner decision
      let savedDecision = null;
      if (selectedItem.investigationReport?.observations) {
        try {
          const observations = JSON.parse(selectedItem.investigationReport.observations);
          savedDecision = observations.commissionerDecision;
        } catch {
          // Not JSON, continue
        }
      }

      if (savedDecision) {
        // Pre-fill with saved decision
        setFinalDecisionData({
          petitionId: savedDecision.petitionId || selectedItem.petitionNumber || '',
          petitionSubject: savedDecision.petitionSubject || selectedItem.complaint?.subject || '',
          petitionerName: savedDecision.petitionerName || selectedItem.complaint?.complainantName || '',
          concernedDepartment: savedDecision.concernedDepartment || selectedItem.complaint?.departmentName || '',
          dateReceived: savedDecision.dateReceived || (selectedItem.createdAt ? new Date(selectedItem.createdAt).toISOString().split('T')[0] : ''),
          investigationReportAttachment: savedDecision.investigationReportAttachment || '',
          summaryOfFindings: savedDecision.summaryOfFindings || '',
          evidenceReviewed: savedDecision.evidenceReviewed || '',
          investigatorRecommendation: savedDecision.investigatorRecommendation || '',
          commissionerObservations: savedDecision.commissionerObservations || '',
          legalPolicyBasis: savedDecision.legalPolicyBasis || '',
          decisionType: savedDecision.decisionType || '',
          disciplinaryAction: savedDecision.disciplinaryAction || '',
          responsibleDepartment: savedDecision.responsibleDepartment || selectedItem.complaint?.departmentName || '',
          implementationDeadline: savedDecision.implementationDeadline || '',
          finalDecisionSummary: savedDecision.finalDecisionSummary || '',
          commissionerName: savedDecision.commissionerName || '',
          decisionDate: savedDecision.decisionDate || new Date().toISOString().split('T')[0],
          decisionNotificationStatus: savedDecision.decisionNotificationStatus || 'Pending',
          implementationStatus: savedDecision.implementationStatus || 'Pending',
          closureRemarks: savedDecision.closureRemarks || '',
          finalPetitionStatus: savedDecision.finalPetitionStatus || ''
        });
      } else {
        // Pre-fill with petition data (no saved decision yet)
        setFinalDecisionData({
          petitionId: selectedItem.petitionNumber || '',
          petitionSubject: selectedItem.complaint?.subject || '',
          petitionerName: selectedItem.complaint?.complainantName || '',
          concernedDepartment: selectedItem.complaint?.institution || selectedItem.complaint?.departmentName || '',
          dateReceived: selectedItem.createdAt ? new Date(selectedItem.createdAt).toISOString().split('T')[0] : '',
          investigationReportAttachment: '',
          summaryOfFindings: '',
          evidenceReviewed: '',
          investigatorRecommendation: '',
          commissionerObservations: '',
          legalPolicyBasis: '',
          decisionType: '',
          disciplinaryAction: '',
          responsibleDepartment: selectedItem.complaint?.institution || selectedItem.complaint?.departmentName || '',
          implementationDeadline: '',
          finalDecisionSummary: '',
          commissionerName: '',
          decisionDate: new Date().toISOString().split('T')[0],
          decisionNotificationStatus: 'Pending',
          implementationStatus: 'Pending',
          closureRemarks: '',
          finalPetitionStatus: ''
        });
      }
    }
    setShowFinalDecisionForm(true);
  };

  const handleSubmitFinalDecision = async () => {
    if (!selectedItem) return;

    try {
      setSubmittingDecision(true);
      const token = getToken();
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" };

      const petitionId = selectedItem.id || selectedItem.petitionId;
      console.log('=== SUBMITTING COMMISSIONER DECISION ===');
      console.log('Petition ID:', petitionId);
      console.log('Selected Item:', selectedItem);
      console.log('Decision Data:', finalDecisionData);
      console.log('API URL:', `${API_BASE}/api/feedback/petitions/${petitionId}/commissioner-decision`);

      if (!petitionId) {
        alert('Error: Petition ID is missing');
        setSubmittingDecision(false);
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/feedback/petitions/${petitionId}/commissioner-decision`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(finalDecisionData),
        }
      );

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (response.ok) {
        alert('Final decision submitted successfully - Form saved');
        fetchApprovedItems();
        // Keep form open to show saved data, refresh the selected item
        if (petitionId) {
          const petitionsRes = await fetch(`${API_BASE}/api/feedback/petitions/all`, { headers });
          if (petitionsRes.ok) {
            const petitionsData = await petitionsRes.json();
            const updatedPetition = Array.isArray(petitionsData)
              ? petitionsData.find((p: any) => p.id === petitionId)
              : null;
            if (updatedPetition) {
              setSelectedItem({ ...updatedPetition, type: 'petition' });
            }
          }
        }
      } else {
        alert(`Failed to submit final decision: ${responseData.message || response.statusText}`);
      }
    } catch (error) {
      console.error("Error submitting final decision:", error);
      alert(`Error submitting final decision: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handlePetitionClick = (petition: any) => {
    setSelectedItem({ ...petition, type: 'petition' });
    setViewMode('detail');
  };

  const getComplaintCategory = (subject: string, category?: string) => {
    if (category) {
      return category;
    }
    // Map person names to service complaint
    const personNames = ['ሙሉጌታ አይተነዉ', 'አበበ በቀለ', 'ደስታ ኃይሌ', 'ሰለሞን አለሙ'];
    if (personNames.includes(subject)) {
      return 'የአገልግሎት ቅሬታ';
    }
    return subject;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'Closed': 'bg-green-100 text-green-800',
      'Final Decision Issued': 'bg-green-100 text-green-800',
      'Investigation Report Submitted': 'bg-blue-100 text-blue-800',
      'Under Final Decision Review': 'bg-yellow-100 text-yellow-800',
      'Investigation Returned for Correction': 'bg-red-100 text-red-800',
      'Assigned to Investigator': 'bg-purple-100 text-purple-800',
      'Under Investigation': 'bg-blue-100 text-blue-800',
      'Investigation in Progress': 'bg-blue-100 text-blue-800',
      'Assigned for Investigation': 'bg-purple-100 text-purple-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6">
          <Button variant="ghost" onClick={() => router.push("/dashboard/Commissioner")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {/* Approved Items Grid */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-4 text-gray-600">Loading petitions...</p>
              </div>
            ) : viewMode === 'list' ? (
              approvedPetitions.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Petitions Found</h3>
                  <p className="text-gray-600">No petitions have been processed yet.</p>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Petitions List</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {approvedPetitions.map((petition) => (
                        <div
                          key={petition.id}
                          onClick={() => handlePetitionClick(petition)}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <FileText className="w-5 h-5 text-gray-500" />
                            <div>
                              <div className="font-medium text-gray-900">{petition.petitionNumber}</div>
                              <div className="text-sm text-gray-500">
                                {petition.complaint ? getComplaintCategory(petition.complaint.subject, petition.complaint.category) : 'N/A'}
                              </div>
                            </div>
                          </div>
                          <Badge className={getStatusColor(petition.status)}>
                            {petition.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            ) : selectedItem ? (
              <div className="space-y-4">
                <Button onClick={handleBackToList} variant="outline" className="mb-4">
                  ← Back to List
                </Button>
                <Card key={selectedItem.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">{selectedItem.petitionNumber}</CardTitle>
                          <Badge className={getStatusColor(selectedItem.status)}>
                            {selectedItem.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            Complaint: {selectedItem.complaint?.trackingId || selectedItem.complaintId}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(selectedItem.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* 1. Complainant Information */}
                      {selectedItem.complaint && (
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h3 className="font-semibold text-lg mb-2">Complainant Information</h3>
                          {selectedItem.complaint.complainantName && <p><strong>Name:</strong> {selectedItem.complaint.complainantName}</p>}
                          {selectedItem.complaint.complainantEmail && <p><strong>Email:</strong> {selectedItem.complaint.complainantEmail}</p>}
                          {selectedItem.complaint.complainantPhone && <p><strong>Phone:</strong> {selectedItem.complaint.complainantPhone}</p>}
                          {selectedItem.complaint.createdAt && <p><strong>Complaint Date:</strong> {new Date(selectedItem.complaint.createdAt).toLocaleString()}</p>}
                        </div>
                      )}

                      {/* 2. Complaint Details */}
                      {selectedItem.complaint && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h3 className="font-semibold text-lg mb-2">Complaint Details</h3>
                          <p><strong>Tracking ID:</strong> {selectedItem.complaint.trackingId}</p>
                          <p><strong>Subject:</strong> {getComplaintCategory(selectedItem.complaint.subject, selectedItem.complaint.category)}</p>
                          {selectedItem.complaint.departmentName && <p><strong>Department:</strong> {selectedItem.complaint.departmentName}</p>}
                          <p><strong>Status:</strong> {selectedItem.complaint.status}</p>
                          <p><strong>Petition Number:</strong> {selectedItem.petitionNumber}</p>
                          <p><strong>Petition Status:</strong> {selectedItem.status}</p>
                          <p><strong>Date Created:</strong> {new Date(selectedItem.createdAt).toLocaleString()}</p>
                        </div>
                      )}

                      {/* 3. Description */}
                      {selectedItem.complaint && selectedItem.complaint.description && (
                        <div className="p-4 bg-white rounded-lg border">
                          <h3 className="font-semibold text-lg mb-2">Description</h3>
                          <p className="whitespace-pre-wrap">{selectedItem.complaint.description}</p>
                        </div>
                      )}

                      {/* 4. Department Response */}
                      {selectedItem.complaint && selectedItem.complaint.departmentalResponse && (
                        <div className="p-4 bg-orange-50 rounded-lg">
                          <h3 className="font-semibold text-lg mb-2">Department Response</h3>
                          {typeof selectedItem.complaint.departmentalResponse === 'object' ? (
                            <div className="space-y-2">
                              {selectedItem.complaint.departmentalResponse.responseNumber && <p><strong>Response Number:</strong> {selectedItem.complaint.departmentalResponse.responseNumber}</p>}
                              {selectedItem.complaint.departmentalResponse.summary && <p><strong>Summary:</strong> {selectedItem.complaint.departmentalResponse.summary}</p>}
                              {selectedItem.complaint.departmentalResponse.investigationConducted && <p><strong>Investigation Conducted:</strong> {selectedItem.complaint.departmentalResponse.investigationConducted}</p>}
                              {selectedItem.complaint.departmentalResponse.findings && <p><strong>Findings:</strong> {selectedItem.complaint.departmentalResponse.findings}</p>}
                              {selectedItem.complaint.departmentalResponse.actionsTaken && <p><strong>Actions Taken:</strong> {selectedItem.complaint.departmentalResponse.actionsTaken}</p>}
                              {selectedItem.complaint.departmentalResponse.proposedActions && <p><strong>Proposed Actions:</strong> {selectedItem.complaint.departmentalResponse.proposedActions}</p>}
                              {selectedItem.complaint.departmentalResponse.officialResponse && <p><strong>Official Response:</strong> {selectedItem.complaint.departmentalResponse.officialResponse}</p>}
                              {selectedItem.complaint.departmentalResponse.recommendations && <p><strong>Recommendations:</strong> {selectedItem.complaint.departmentalResponse.recommendations}</p>}
                              {selectedItem.complaint.departmentalResponse.status && <p><strong>Status:</strong> {selectedItem.complaint.departmentalResponse.status}</p>}
                              {selectedItem.complaint.departmentalResponse.submittedAt && <p><strong>Submitted At:</strong> {new Date(selectedItem.complaint.departmentalResponse.submittedAt).toLocaleString()}</p>}
                              {selectedItem.complaint.departmentalResponse.reviewNotes && <p><strong>Review Notes:</strong> {selectedItem.complaint.departmentalResponse.reviewNotes}</p>}
                              {selectedItem.complaint.departmentalResponse.returnReason && <p><strong>Return Reason:</strong> {selectedItem.complaint.departmentalResponse.returnReason}</p>}
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{selectedItem.complaint.departmentalResponse}</p>
                          )}
                        </div>
                      )}

                      {/* 5. Complainant's Petition */}
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <h3 className="font-semibold text-lg mb-2">Complainant's Petition</h3>
                        {selectedItem.reasonForDissatisfaction && <p><strong>Reason for Dissatisfaction:</strong> {selectedItem.reasonForDissatisfaction}</p>}
                        {selectedItem.explanation && <p><strong>Explanation:</strong> {selectedItem.explanation}</p>}
                        {selectedItem.assignedOfficer && (
                          <p><strong>Assigned Officer:</strong> {typeof selectedItem.assignedOfficer === 'object' 
                            ? `${selectedItem.assignedOfficer.firstName || ''} ${selectedItem.assignedOfficer.lastName || ''}`.trim() || selectedItem.assignedOfficer.position || 'N/A'
                            : selectedItem.assignedOfficer}</p>
                        )}
                        {selectedItem.assignedBy && (
                          <p><strong>Assigned By:</strong> {typeof selectedItem.assignedBy === 'object' 
                            ? `${selectedItem.assignedBy.firstName || ''} ${selectedItem.assignedBy.lastName || ''}`.trim() || selectedItem.assignedBy.position || 'N/A'
                            : selectedItem.assignedBy}</p>
                        )}
                      </div>

                      {/* 6. Investigation Report */}
                      {selectedItem.investigationReport && (
                        <div className="p-4 bg-indigo-50 rounded-lg">
                          <h3 className="font-semibold text-lg mb-2">Investigation Report</h3>
                          <p><strong>Report Number:</strong> {selectedItem.investigationReport.reportNumber}</p>
                          <p><strong>Status:</strong> {selectedItem.investigationReport.status}</p>
                          {selectedItem.investigationReport.background && <p><strong>Background:</strong> {selectedItem.investigationReport.background}</p>}
                          {selectedItem.investigationReport.objectives && <p><strong>Objectives:</strong> {selectedItem.investigationReport.objectives}</p>}
                          {selectedItem.investigationReport.activitiesPerformed && <p><strong>Activities Performed:</strong> {selectedItem.investigationReport.activitiesPerformed}</p>}
                          {selectedItem.investigationReport.evidenceCollected && <p><strong>Evidence Collected:</strong> {selectedItem.investigationReport.evidenceCollected}</p>}
                          {selectedItem.investigationReport.personsInterviewed && <p><strong>Persons Interviewed:</strong> {selectedItem.investigationReport.personsInterviewed}</p>}
                          {selectedItem.investigationReport.findings && <p><strong>Findings:</strong> {selectedItem.investigationReport.findings}</p>}
                          {selectedItem.investigationReport.observations && <p><strong>Observations:</strong> {selectedItem.investigationReport.observations}</p>}
                          {selectedItem.investigationReport.conclusions && <p><strong>Conclusions:</strong> {selectedItem.investigationReport.conclusions}</p>}
                          {selectedItem.investigationReport.recommendations && <p><strong>Recommendations:</strong> {selectedItem.investigationReport.recommendations}</p>}
                          {selectedItem.investigationReport.submittedAt && <p><strong>Submitted At:</strong> {new Date(selectedItem.investigationReport.submittedAt).toLocaleString()}</p>}
                        </div>
                      )}

                      {/* 5. Commissioner Final Decision Display (from observations) */}
                      {(() => {
                        if (selectedItem.investigationReport?.observations) {
                          try {
                            const observations = JSON.parse(selectedItem.investigationReport.observations);
                            if (observations.commissionerDecision) {
                              return (
                                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                  <h3 className="font-semibold text-lg mb-4 text-purple-800">Commissioner Final Decision Details</h3>
                                  <div className="space-y-3 text-sm">
                                    {observations.commissionerDecision.petitionSubject && (
                                      <div>
                                        <span className="text-gray-600">Petition Subject:</span>
                                        <p className="text-purple-700">{observations.commissionerDecision.petitionSubject}</p>
                                      </div>
                                    )}
                                    {observations.commissionerDecision.petitionerName && (
                                      <div>
                                        <span className="text-gray-600">Petitioner Name:</span>
                                        <p className="text-purple-700">{observations.commissionerDecision.petitionerName}</p>
                                      </div>
                                    )}
                                    {observations.commissionerDecision.summaryOfFindings && (
                                      <div>
                                        <span className="text-gray-600">Summary of Findings:</span>
                                        <p className="text-purple-700 whitespace-pre-wrap">{observations.commissionerDecision.summaryOfFindings}</p>
                                      </div>
                                    )}
                                    {observations.commissionerDecision.evidenceReviewed && (
                                      <div>
                                        <span className="text-gray-600">Evidence Reviewed:</span>
                                        <p className="text-purple-700 whitespace-pre-wrap">{observations.commissionerDecision.evidenceReviewed}</p>
                                      </div>
                                    )}
                                    {observations.commissionerDecision.investigatorRecommendation && (
                                      <div>
                                        <span className="text-gray-600">Investigator Recommendation:</span>
                                        <p className="text-purple-700 whitespace-pre-wrap">{observations.commissionerDecision.investigatorRecommendation}</p>
                                      </div>
                                    )}
                                    {observations.commissionerDecision.commissionerObservations && (
                                      <div>
                                        <span className="text-gray-600">Commissioner's Observations:</span>
                                        <p className="text-purple-700 whitespace-pre-wrap">{observations.commissionerDecision.commissionerObservations}</p>
                                      </div>
                                    )}
                                    {observations.commissionerDecision.legalPolicyBasis && (
                                      <div>
                                        <span className="text-gray-600">Legal/Policy Basis:</span>
                                        <p className="text-purple-700 whitespace-pre-wrap">{observations.commissionerDecision.legalPolicyBasis}</p>
                                      </div>
                                    )}
                                    {observations.commissionerDecision.decisionType && (
                                      <div>
                                        <span className="text-gray-600">Decision Type:</span>
                                        <p className="text-purple-700">{observations.commissionerDecision.decisionType}</p>
                                      </div>
                                    )}
                                    {observations.commissionerDecision.disciplinaryAction && (
                                      <div>
                                        <span className="text-gray-600">Disciplinary Action:</span>
                                        <p className="text-purple-700 whitespace-pre-wrap">{observations.commissionerDecision.disciplinaryAction}</p>
                                      </div>
                                    )}
                                    {observations.commissionerDecision.responsibleDepartment && (
                                      <div>
                                        <span className="text-gray-600">Responsible Department:</span>
                                        <p className="text-purple-700">{observations.commissionerDecision.responsibleDepartment}</p>
                                      </div>
                                    )}
                                    {observations.commissionerDecision.implementationDeadline && (
                                      <div>
                                        <span className="text-gray-600">Implementation Deadline:</span>
                                        <p className="text-purple-700">{observations.commissionerDecision.implementationDeadline}</p>
                                      </div>
                                    )}
                                    {observations.commissionerDecision.finalDecisionSummary && (
                                      <div>
                                        <span className="text-gray-600">Final Decision Summary:</span>
                                        <p className="text-purple-700 whitespace-pre-wrap">{observations.commissionerDecision.finalDecisionSummary}</p>
                                      </div>
                                    )}
                                    {observations.commissionerDecision.finalPetitionStatus && (
                                      <div>
                                        <span className="text-gray-600">Final Petition Status:</span>
                                        <p className="text-purple-700">{observations.commissionerDecision.finalPetitionStatus}</p>
                                      </div>
                                    )}
                                    {observations.commissionerDecision.decisionDate && (
                                      <div>
                                        <span className="text-gray-600">Decision Date:</span>
                                        <p className="text-purple-700">{observations.commissionerDecision.decisionDate}</p>
                                      </div>
                                    )}
                                    {observations.commissionerDecision.closureRemarks && (
                                      <div>
                                        <span className="text-gray-600">Closure Remarks:</span>
                                        <p className="text-purple-700 whitespace-pre-wrap">{observations.commissionerDecision.closureRemarks}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                          } catch {
                            // Not JSON or no commissioner decision
                          }
                        }
                        return null;
                      })()}

                      {/* Commissioner Final Decision Form Button */}
                      {!showFinalDecisionForm && (() => {
                        if (selectedItem.investigationReport?.observations) {
                          try {
                            const observations = JSON.parse(selectedItem.investigationReport.observations);
                            if (observations.commissionerDecision) {
                              // Show "Petition" button with decision details, download and print buttons
                              return (
                                <div className="mt-4 flex gap-2">
                                  <Button
                                    onClick={() => setShowDecisionDetails(true)}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                  >
                                    <FileText className="mr-2 h-4 w-4" />
                                    Petition - Final Decision
                                  </Button>
                                  <Button
                                    onClick={() => handleDownloadDecision(observations)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    onClick={() => handlePrintDecision(observations)}
                                    className="bg-purple-600 hover:bg-purple-700"
                                  >
                                    <Printer className="h-4 w-4" />
                                  </Button>
                                </div>
                              );
                            }
                          } catch {
                            // Not JSON, continue
                          }
                        }
                        return (
                          <div className="mt-4">
                            <Button
                              onClick={handleOpenFinalDecisionForm}
                              className="w-full bg-green-600 hover:bg-green-700"
                            >
                              <Save className="mr-2 h-4 w-4" />
                              Final Decision
                            </Button>
                          </div>
                        );
                      })()}

                      {/* Commissioner Final Decision Form */}
                      {showFinalDecisionForm && (
                        <div className="mt-4 p-6 bg-white rounded-lg border-2 border-green-200">
                          <h3 className="font-semibold text-xl mb-4 text-green-800">Commissioner Final Decision Form</h3>
                          
                          {/* Section 1: Petition Information */}
                          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold text-lg mb-3 text-blue-800">1. Petition Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Petition ID</Label>
                                <Input 
                                  value={finalDecisionData.petitionId}
                                  onChange={(e) => setFinalDecisionData({...finalDecisionData, petitionId: e.target.value})}
                                  readOnly
                                />
                              </div>
                              <div>
                                <Label>Petition Subject</Label>
                                <Input 
                                  value={finalDecisionData.petitionSubject}
                                  onChange={(e) => setFinalDecisionData({...finalDecisionData, petitionSubject: e.target.value})}
                                  readOnly
                                />
                              </div>
                              <div>
                                <Label>Petitioner Name</Label>
                                <Input 
                                  value={finalDecisionData.petitionerName}
                                  onChange={(e) => setFinalDecisionData({...finalDecisionData, petitionerName: e.target.value})}
                                  readOnly
                                />
                              </div>
                              <div>
                                <Label>Concerned Department</Label>
                                <Input 
                                  value={finalDecisionData.concernedDepartment}
                                  onChange={(e) => setFinalDecisionData({...finalDecisionData, concernedDepartment: e.target.value})}
                                  readOnly
                                />
                              </div>
                              <div>
                                <Label>Date Received</Label>
                                <Input 
                                  value={finalDecisionData.dateReceived}
                                  onChange={(e) => setFinalDecisionData({...finalDecisionData, dateReceived: e.target.value})}
                                  readOnly
                                />
                              </div>
                              <div>
                                <Label>Investigation Report Attachment</Label>
                                <Input 
                                  value={finalDecisionData.investigationReportAttachment}
                                  onChange={(e) => setFinalDecisionData({...finalDecisionData, investigationReportAttachment: e.target.value})}
                                  readOnly
                                />
                              </div>
                            </div>
                          </div>

                          {/* Section 2: Commissioner's Decision */}
                          <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
                            <h4 className="font-semibold text-lg mb-3 text-indigo-800">2. Commissioner's Decision</h4>
                            <div className="space-y-4">
                              <div>
                                <Label>Commissioner's Observations</Label>
                                <Textarea 
                                  value={finalDecisionData.commissionerObservations}
                                  onChange={(e) => setFinalDecisionData({...finalDecisionData, commissionerObservations: e.target.value})}
                                  rows={3}
                                  placeholder="Enter your observations..."
                                />
                              </div>
                              <div>
                                <Label>Legal / Policy Basis</Label>
                                <Textarea 
                                  value={finalDecisionData.legalPolicyBasis}
                                  onChange={(e) => setFinalDecisionData({...finalDecisionData, legalPolicyBasis: e.target.value})}
                                  rows={3}
                                  placeholder="Enter legal or policy basis..."
                                />
                              </div>
                              <div>
                                <Label>Decision Type</Label>
                                <select 
                                  value={finalDecisionData.decisionType}
                                  onChange={(e) => setFinalDecisionData({...finalDecisionData, decisionType: e.target.value})}
                                  className="w-full p-2 border rounded"
                                >
                                  <option value="">Select Decision Type</option>
                                  <option value="Uphold Petition">አቤቱታዉ ተቀባይነት አግኚቷል</option>
                                  <option value="Partially Uphold Petition"></option>
                                  <option value="Reject Petition">ተቀባይነት አላገኘም</option>
                                  <option value="Dismiss Petition">Dismiss Petition</option>
                                  <option value="Refer to Another Institution">ለሌላ ተቋም</option>
                                  <option value="Return for Further Investigation">ለተጨማሪ ምርመራ ይመራ</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Section 4: Disciplinary Action */}
                          <div className="mb-6 p-4 bg-orange-50 rounded-lg">
                            <h4 className="font-semibold text-lg mb-3 text-orange-800">የዲሲፕሊ እርምጃ</h4>
                            <div className="space-y-4">
                              <div>
                                <Label>የዲሲፕሊን እርምጃ</Label>
                                <select 
                                  value={finalDecisionData.disciplinaryAction}
                                  onChange={(e) => setFinalDecisionData({...finalDecisionData, disciplinaryAction: e.target.value})}
                                  className="w-full p-2 border rounded"
                                >
                                  <option value="">የእርምጃ አይነት ይምረጡ</option>
                                  <option value="No Disciplinary Action">እርምጃ አያስፈልግም</option>
                                  <option value="Oral Warning">የቃል ማስጠንቀቂያ</option>
                                  <option value="Written Warning">የፁህፍ ማስጠንቀቂያ</option>
                                  <option value="Salary Fine">የደሞዝ ቅጣት (if legally authorized)</option>
                                  <option value="Demotion">ደረጃ ዝቅ ማድረግ
 (if legally authorized)</option>
                                  <option value="Dismissal">ከሥራ ማሰናበት (if legally authorized)</option>
                                  <option value="Administrative Corrective Action">አስተዳደራዊ የማስተካከያ እርምጃ
</option>
                                  <option value="Other Authorized Action">ሌላ የተፈቀደ እርምጃ</option>
                                </select>
                              </div>
                              <div>
                                <Label>ሃላፊነቱን የሚወስደዉ የስራ ክፍል</Label>
                                <Input 
                                  value={finalDecisionData.responsibleDepartment}
                                  onChange={(e) => setFinalDecisionData({...finalDecisionData, responsibleDepartment: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label>የአፈጻጸም የመጨረሻ ቀን</Label>
                                <Input 
                                  type="date"
                                  value={finalDecisionData.implementationDeadline}
                                  onChange={(e) => setFinalDecisionData({...finalDecisionData, implementationDeadline: e.target.value})}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Section 5: Final Decision */}
                          <div className="mb-6 p-4 bg-green-50 rounded-lg">
                            <h4 className="font-semibold text-lg mb-3 text-green-800">የመጨረሻ ዉሳኔ</h4>
                            <div className="space-y-4">
                              <div>
                                <Label>የዉሳኔ ማጠቃለያ</Label>
                                <Textarea 
                                  value={finalDecisionData.finalDecisionSummary}
                                  onChange={(e) => setFinalDecisionData({...finalDecisionData, finalDecisionSummary: e.target.value})}
                                  rows={4}
                                  placeholder="Enter final decision summary..."
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>የዉሳኔ ቀን</Label>
                                  <Input 
                                    type="date"
                                    value={finalDecisionData.decisionDate}
                                    onChange={(e) => setFinalDecisionData({...finalDecisionData, decisionDate: e.target.value})}
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>Decision Notification Status</Label>
                                  <select 
                                    value={finalDecisionData.decisionNotificationStatus}
                                    onChange={(e) => setFinalDecisionData({...finalDecisionData, decisionNotificationStatus: e.target.value})}
                                    className="w-full p-2 border rounded"
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="Sent">Sent</option>
                                    <option value="Delivered">Delivered</option>
                                  </select>
                                </div>
                                <div>
                                  <Label>Implementation Status</Label>
                                  <select 
                                    value={finalDecisionData.implementationStatus}
                                    onChange={(e) => setFinalDecisionData({...finalDecisionData, implementationStatus: e.target.value})}
                                    className="w-full p-2 border rounded"
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                  </select>
                                </div>
                              </div>
                              <div>
                                <Label>የማጠቃለያ ፅሁፍ</Label>
                                <Textarea 
                                  value={finalDecisionData.closureRemarks}
                                  onChange={(e) => setFinalDecisionData({...finalDecisionData, closureRemarks: e.target.value})}
                                  rows={3}
                                  placeholder="Enter closure remarks..."
                                />
                              </div>
                              <div>
                                <Label>Final Petition Status</Label>
                                <select 
                                  value={finalDecisionData.finalPetitionStatus}
                                  onChange={(e) => setFinalDecisionData({...finalDecisionData, finalPetitionStatus: e.target.value})}
                                  className="w-full p-2 border rounded"
                                >
                                  <option value="">Select Final Status</option>
                                  <option value="Approved">Approved</option>
                                  <option value="Referred">Referred</option>
                                  <option value="Rejected">Rejected</option>
                                  <option value="Closed">Closed</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Form Actions */}
                          <div className="flex gap-4">
                            <Button
                              onClick={handleSubmitFinalDecision}
                              disabled={submittingDecision}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              {submittingDecision ? 'Submitting...' : 'Submit Final Decision'}
                            </Button>
                            <Button 
                              onClick={() => setShowFinalDecisionForm(false)}
                              variant="outline"
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Decision Details Modal */}
                      {showDecisionDetails && selectedItem.investigationReport?.observations && (() => {
                        try {
                          const observations = JSON.parse(selectedItem.investigationReport.observations);
                          if (observations.commissionerDecision) {
                            return (
                              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                                  <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                      <h2 className="text-xl font-bold text-gray-900">የመጨረሻ የአቤቱታ ዉሳኔ ዝርዝር</h2>
                                      <div className="flex gap-2">
                                        <Button
                                          onClick={() => handleDownloadDecision(observations)}
                                          className="bg-blue-600 hover:bg-blue-700"
                                        >
                                          <Download className="mr-2 h-4 w-4" />
                                          Download
                                        </Button>
                                        <button
                                          onClick={() => setShowDecisionDetails(false)}
                                          className="text-gray-500 hover:text-gray-700"
                                        >
                                          <ArrowLeft className="w-6 h-6" />
                                        </button>
                                      </div>
                                    </div>

                                    <div className="space-y-4 text-sm">
                                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <h3 className="font-semibold mb-4 text-blue-800">የኮሚሽነር የመጨረሻ ዉሳኔ</h3>

                                        {observations.commissionerDecision.petitionSubject && (
                                          <p className="mb-2"><strong>Petition Subject:</strong> {observations.commissionerDecision.petitionSubject}</p>
                                        )}
                                        {observations.commissionerDecision.petitionerName && (
                                          <p className="mb-2"><strong>አቤቱታ ያቀረበዉ አካል:</strong> {observations.commissionerDecision.petitionerName}</p>
                                        )}

                                        <p className="mb-2 font-semibold">የኮሚሽነር ዉሳኔ :</p>
                                        {observations.commissionerDecision.commissionerObservations && (
                                          <p className="mb-2">- የኮሚሽነር ምልከታ: {observations.commissionerDecision.commissionerObservations}</p>
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

                                        {observations.commissionerDecision.decisionDate && (
                                          <p className="mb-2"><strong>Decision Date:</strong> {observations.commissionerDecision.decisionDate}</p>
                                        )}

                                        <p className="mb-2"><strong>Final Petition Status:</strong> {observations.commissionerDecision.finalPetitionStatus || 'Closed'}</p>

                                        {observations.commissionerDecision.closureRemarks && (
                                          <p className="mb-2"><strong>Closure Remarks:</strong> {observations.commissionerDecision.closureRemarks}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        } catch {
                          // Not JSON or no commissioner decision
                        }
                        return null;
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
