"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Edit, AlertCircle, Calendar, User, Building, MapPin, FileText, Shield, Send, MessageSquare, X, Download, Printer } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Textarea } from "@/app/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { getCurrentUserRoles, getCurrentUserId, getCurrentUserName } from "@/app/lib/auth";
import { useSecretCodeCheck } from "@/app/hooks/use-secret-code-check";

interface Complaint {
  id: string;
  referenceNumber: string;
  category: string;
  status: string;
  priority: string;
  complainantName?: string;
  complainantEmail?: string;
  complainantPhone?: string;
  complainantDepartment?: string;
  complainantPosition?: string;
  institution?: string;
  department?: string;
  subject?: string;
  perpetratorPosition?: string;
  incidentDate?: string;
  incidentLocation?: string;
  description: string;
  reportingChannel: string;
  isAnonymous: boolean;
  createdAt: string;
  createdBy?: string;
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  investigation?: {
    id?: string;
    startDate?: string;
    targetCompletionDate?: string;
    actualCompletionDate?: string;
    scope?: string;
    objectives?: string;
    findings?: string;
    recommendation?: string;
    decision?: string;
    outcome?: string;
    reviewerName?: string;
    reviewDate?: string;
    status?: string;
    applicableLaw?: string;
  };
}

interface Message {
  id: string;
  message: string;
  senderType: string;
  senderRole?: string;
  sender?: {
    firstName: string;
    lastName: string;
  };
  sentAt: string;
  readAt?: string;
  visibility: string;
}

const statusColors: Record<string, string> = {
  "Submitted": "bg-blue-100 text-blue-800",
  "Registered": "bg-green-100 text-green-800",
  "Triage": "bg-yellow-100 text-yellow-800",
  "Assigned": "bg-purple-100 text-purple-800",
  "Under Assessment": "bg-orange-100 text-orange-800",
  "Under Investigation": "bg-red-100 text-red-800",
  "Closed": "bg-gray-100 text-gray-800",
};

const priorityColors: Record<string, string> = {
  "Low": "bg-green-100 text-green-800",
  "High": "bg-orange-100 text-orange-800",
  "Urgent": "bg-red-100 text-red-800",
};

export default function ComplaintDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  // Check secret code status
  useSecretCodeCheck('/ethics/anticorruption/' + params.id);
  
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedComplaint, setEditedComplaint] = useState<Complaint | null>(null);
  const [saving, setSaving] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentUserName, setCurrentUserName] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchComplaint(), fetchMessages()]);
      if (mounted) {
        setLoading(false);
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, [params.id]);

  useEffect(() => {
    const userName = getCurrentUserName();
    if (userName) {
      setCurrentUserName(userName);
    }
  }, []);

  const fetchComplaint = async () => {
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      const response = await fetch(`http://localhost:4000/api/ethics/anticorruption/reports/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch complaint');
      }
      const data = await response.json();
      if (data) {
        setComplaint(data);
      }
    } catch (error) {
      console.error('Error fetching complaint:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      const response = await fetch(`http://localhost:4000/api/ethics/anticorruption/reports/${params.id}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setMessages(data);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch messages:', errorData.message || response.statusText);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      const response = await fetch(`http://localhost:4000/api/ethics/anticorruption/reports/${params.id}/messages`, {
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

  const handleEdit = () => {
    if (!complaint) return;
    setIsEditing(true);
    setEditedComplaint({
      ...complaint,
      investigation: complaint.investigation ? { ...complaint.investigation } : undefined,
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedComplaint(null);
  };

  const handleSaveChanges = async () => {
    if (!editedComplaint) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      
      // Save complaint fields
      const complaintData = {
        complainantName: editedComplaint.complainantName,
        complainantEmail: editedComplaint.complainantEmail,
        complainantPhone: editedComplaint.complainantPhone,
        complainantDepartment: editedComplaint.complainantDepartment,
        complainantPosition: editedComplaint.complainantPosition,
        institution: editedComplaint.institution,
        department: editedComplaint.department,
        subject: editedComplaint.subject,
        perpetratorPosition: editedComplaint.perpetratorPosition,
        incidentDate: editedComplaint.incidentDate,
        incidentLocation: editedComplaint.incidentLocation,
        description: editedComplaint.description,
      };

      const complaintResponse = await fetch(`http://localhost:4000/api/ethics/anticorruption/reports/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(complaintData),
      });

      if (!complaintResponse.ok) {
        const errorData = await complaintResponse.json().catch(() => ({}));
        console.error('Save error:', errorData);
        alert('Failed to save complaint: ' + (errorData.message || 'Unknown error'));
        return;
      }

      // Save investigation fields if Ethics Anti-Corruption and investigation exists
      if (isEthicsAntiCorruption() && editedComplaint.investigation && complaint?.investigation?.id) {
        const investigationData = {
          startDate: editedComplaint.investigation.startDate || null,
          targetCompletionDate: editedComplaint.investigation.targetCompletionDate || null,
          scope: editedComplaint.investigation.scope || null,
          objectives: editedComplaint.investigation.objectives || null,
          applicableLaw: editedComplaint.investigation.applicableLaw || null,
        };

        console.log('Saving investigation data:', investigationData);

        const investigationResponse = await fetch(`http://localhost:4000/api/ethics/investigations/${complaint.investigation.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(investigationData),
        });

        if (!investigationResponse.ok) {
          const errorData = await investigationResponse.json().catch(() => ({}));
          console.error('Investigation save error:', errorData);
          alert('Failed to save investigation details: ' + (errorData.message || 'Unknown error'));
          return;
        }

        console.log('Investigation saved successfully');
      }

      // Refresh complaint data
      const data = await complaintResponse.json();
      setComplaint(data);
      setIsEditing(false);
      setEditedComplaint(null);
      alert('Complaint updated successfully');
    } catch (error) {
      console.error('Error saving complaint:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const isEthicsAntiCorruption = () => {
    const roles = getCurrentUserRoles();
    return roles.includes("ethics_anti_corruption");
  };

  const isEthicsOfficer = () => {
    const roles = getCurrentUserRoles();
    return roles.includes("ethics_officer");
  };

  const isAssignedInvestigator = () => {
    const currentUserId = getCurrentUserId();
    return complaint?.assignee?.id === currentUserId;
  };

  const isComplainant = () => {
    const currentUserId = getCurrentUserId();
    return complaint?.createdBy === currentUserId;
  };

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading complaint details...</div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (!complaint) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Complaint not found</div>
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
              <h1 className="text-3xl font-bold text-gray-900">Complaint Details</h1>
              <p className="text-gray-600 mt-1">{complaint.referenceNumber}</p>
            </div>
            {isEthicsAntiCorruption() && (
              <>
                {!isEditing ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleEdit}
                      className="gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                    {complaint.investigation ? (
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/ethics/investigations?id=${complaint.investigation?.id}`)}
                        className="gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        View Investigation
                      </Button>
                    ) : (
                      <Button
                        onClick={() => router.push(`/ethics/investigations/new?complaintId=${complaint.id}`)}
                        className="gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <User className="w-4 h-4" />
                        Assign Investigator
                      </Button>
                    )}
                    {complaint.status === 'Closed' && complaint.investigation?.status === 'Approved' && (
                      <Button
                        onClick={() => setShowReportModal(true)}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <FileText className="w-4 h-4" />
                        Generate Report
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveChanges}
                      disabled={saving}
                      className="gap-2"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Show View Report button for complainants when complaint is closed and investigation is approved */}
            {!isEthicsAntiCorruption() && !isEthicsOfficer() && complaint.status === 'Closed' && complaint.investigation?.status === 'Approved' && (
              <Button
                onClick={() => setShowReportModal(true)}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="w-4 h-4" />
                View Report
              </Button>
            )}
          </div>

          {/* Status and Priority */}
          <div className="flex gap-3 flex-wrap">
            <Badge className={statusColors[complaint.status] || "bg-gray-100 text-gray-800"}>
              {complaint.status === 'Under Investigation' ? 'በምርመራ ላይ ነዉ' : complaint.status}
            </Badge>
            {complaint.status === 'Under Investigation' && complaint.assignee && (
              <Badge className="bg-purple-100 text-purple-800">
                Investigator: {complaint.assignee.firstName} {complaint.assignee.lastName}
              </Badge>
            )}
            <Badge className={priorityColors[complaint.priority] || "bg-gray-100 text-gray-800"}>
              Priority: {complaint.priority}
            </Badge>
            <Badge className="bg-blue-100 text-blue-800">
              {complaint.category}
            </Badge>
          </div>

          {/* Complaint Details */}
          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
            {/* Complainant Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5" />
                Complainant Information
              </h2>
              {!complaint.isAnonymous ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    {isEditing && editedComplaint ? (
                      <Input
                        value={editedComplaint.complainantName || ''}
                        onChange={(e) => setEditedComplaint({...editedComplaint, complainantName: e.target.value})}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-gray-900 mt-1">{complaint.complainantName || "N/A"}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    {isEditing && editedComplaint ? (
                      <Input
                        value={editedComplaint.complainantEmail || ''}
                        onChange={(e) => setEditedComplaint({...editedComplaint, complainantEmail: e.target.value})}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-gray-900 mt-1">{complaint.complainantEmail || "N/A"}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    {isEditing && editedComplaint ? (
                      <Input
                        value={editedComplaint.complainantPhone || ''}
                        onChange={(e) => setEditedComplaint({...editedComplaint, complainantPhone: e.target.value})}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-gray-900 mt-1">{complaint.complainantPhone || "N/A"}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">የጠቋሚ የስራ ክፍል (Complainant Department)</label>
                    {isEditing && editedComplaint ? (
                      <Input
                        value={editedComplaint.complainantDepartment || ''}
                        onChange={(e) => setEditedComplaint({...editedComplaint, complainantDepartment: e.target.value})}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-gray-900 mt-1">{complaint.complainantDepartment || "N/A"}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">የስራ መደብ (Position)</label>
                    {isEditing && editedComplaint ? (
                      <Input
                        value={editedComplaint.complainantPosition || ''}
                        onChange={(e) => setEditedComplaint({...editedComplaint, complainantPosition: e.target.value})}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-gray-900 mt-1">{complaint.complainantPosition || "N/A"}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-600">
                  <Shield className="w-4 h-4" />
                  <span>Submitted anonymously</span>
                </div>
              )}
            </div>

            {/* Incident Details */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                ድርጊቱን የፈፀመዉ አካል መረጃ
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">ድርጊቱን የፈፀመዉ (Perpetrator)</label>
                  {isEditing && editedComplaint ? (
                    <Input
                      value={editedComplaint.subject || ''}
                      onChange={(e) => setEditedComplaint({...editedComplaint, subject: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-gray-900 mt-1">{complaint.subject || "N/A"}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">የስራ መደብ (Perpetrator Position)</label>
                  {isEditing && editedComplaint ? (
                    <Input
                      value={editedComplaint.perpetratorPosition || ''}
                      onChange={(e) => setEditedComplaint({...editedComplaint, perpetratorPosition: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-gray-900 mt-1">{complaint.perpetratorPosition || "N/A"}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">ድርጊቱን የፈፀመዉ የስራ ክፍል</label>
                  {isEditing && editedComplaint ? (
                    <Input
                      value={editedComplaint.department || ''}
                      onChange={(e) => setEditedComplaint({...editedComplaint, department: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-gray-900 mt-1">{complaint.department || "N/A"}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                  የተፈፀመበት ቀን
                  </label>
                  {isEditing && editedComplaint ? (
                    <Input
                      type="date"
                      value={editedComplaint.incidentDate || ''}
                      onChange={(e) => setEditedComplaint({...editedComplaint, incidentDate: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-gray-900 mt-1">{complaint.incidentDate || "N/A"}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    ድርጊቱ የተፈፀመበት ቦታ
                  </label>
                  {isEditing && editedComplaint ? (
                    <Input
                      value={editedComplaint.incidentLocation || ''}
                      onChange={(e) => setEditedComplaint({...editedComplaint, incidentLocation: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-gray-900 mt-1">{complaint.incidentLocation || "N/A"}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">የድርጊቱ ዝርዝር</label>
                {isEditing && editedComplaint ? (
                  <Textarea
                    value={editedComplaint.description || ''}
                    onChange={(e) => setEditedComplaint({...editedComplaint, description: e.target.value})}
                    className="mt-1"
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{complaint.description}</p>
                )}
              </div>
            </div>

            {/* Investigation Details - Hidden for complainants, read-only for Ethics Officers and Assigned Investigator, editable for Ethics Anti-Corruption */}
            {(isEthicsAntiCorruption() || isEthicsOfficer() || isAssignedInvestigator()) && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  የምርመራ ዝርዝር
                </h2>
                {/* Assigned Investigator - Only show when status is Under Investigation */}
                {complaint.status === 'Under Investigation' && complaint.assignee && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <User className="w-4 h-4" />
                      መርማሪ መድብ
                    </label>
                    <p className="text-gray-900 mt-1 font-semibold">{complaint.assignee.firstName} {complaint.assignee.lastName}</p>
                    <p className="text-gray-600 text-sm">{complaint.assignee.email}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      ምረመራዉ የሚጀምርበት ቀን
                    </label>
                    {isEthicsAntiCorruption() && isEditing && editedComplaint?.investigation ? (
                      <Input
                        type="date"
                        value={editedComplaint.investigation.startDate ? editedComplaint.investigation.startDate.split('T')[0] : ''}
                        onChange={(e) => setEditedComplaint({...editedComplaint, investigation: {...editedComplaint.investigation, startDate: e.target.value}})}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-gray-900 mt-1">
                        {complaint.investigation?.startDate 
                          ? (typeof complaint.investigation.startDate === 'string' 
                              ? complaint.investigation.startDate.split('T')[0] 
                              : new Date(complaint.investigation.startDate).toISOString().split('T')[0])
                          : "N/A"}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      ምርመራዉ የሚያልቅበት ቀን
                    </label>
                    {isEthicsAntiCorruption() && isEditing && editedComplaint?.investigation ? (
                      <Input
                        type="date"
                        value={editedComplaint.investigation.targetCompletionDate ? editedComplaint.investigation.targetCompletionDate.split('T')[0] : ''}
                        onChange={(e) => setEditedComplaint({...editedComplaint, investigation: {...editedComplaint.investigation, targetCompletionDate: e.target.value}})}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-gray-900 mt-1">
                        {complaint.investigation?.targetCompletionDate 
                          ? (typeof complaint.investigation.targetCompletionDate === 'string' 
                              ? complaint.investigation.targetCompletionDate.split('T')[0] 
                              : new Date(complaint.investigation.targetCompletionDate).toISOString().split('T')[0])
                          : "N/A"}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">የምርመራዉ ዳራ</label>
                  {isEthicsAntiCorruption() && isEditing && editedComplaint?.investigation ? (
                    <Textarea
                      value={editedComplaint.investigation.scope || ''}
                      onChange={(e) => setEditedComplaint({...editedComplaint, investigation: {...editedComplaint.investigation, scope: e.target.value}})}
                      className="mt-1"
                      rows={3}
                    />
                  ) : (
                    <p className="text-gray-900 mt-1 whitespace-pre-wrap">{complaint.investigation?.scope || "N/A"}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">የምርመራዉ አላማ</label>
                  {isEthicsAntiCorruption() && isEditing && editedComplaint?.investigation ? (
                    <Textarea
                      value={editedComplaint.investigation.objectives || ''}
                      onChange={(e) => setEditedComplaint({...editedComplaint, investigation: {...editedComplaint.investigation, objectives: e.target.value}})}
                      className="mt-1"
                      rows={3}
                    />
                  ) : (
                    <p className="text-gray-900 mt-1 whitespace-pre-wrap">{complaint.investigation?.objectives || "N/A"}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Applicable Law/Policy</label>
                  {isEthicsAntiCorruption() && isEditing && editedComplaint ? (
                    <Textarea
                      value={editedComplaint.investigation?.applicableLaw || 'Applicable Law/Policy: Federal Civil Servants Proclamation\n\nArticle/Section: To be identified by the investigating officer\n\nAlleged Violation: Possible breach of civil service duties or ethical standards\n\nRemarks: The applicable provision must be verified against the facts and the law in force.'}
                      onChange={(e) => {
                        const updatedInvestigation = editedComplaint.investigation || {};
                        setEditedComplaint({
                          ...editedComplaint,
                          investigation: {
                            ...updatedInvestigation,
                            applicableLaw: e.target.value
                          }
                        });
                      }}
                      className="mt-1"
                      rows={6}
                      placeholder="Applicable Law/Policy: Federal Civil Servants Proclamation\n\nArticle/Section: To be identified by the investigating officer\n\nAlleged Violation: Possible breach of civil service duties or ethical standards\n\nRemarks: The applicable provision must be verified against the facts and the law in force."
                    />
                  ) : (
                    <p className="text-gray-900 mt-1 whitespace-pre-wrap">{complaint.investigation?.applicableLaw || "N/A"}</p>
                  )}
                </div>
              </div>
            )}

            {/* Investigation Findings and Review - Visible when investigation is approved */}
            {complaint.investigation && (complaint.investigation.status === 'Approved' || complaint.investigation.outcome) && (
              <div className="space-y-6 pt-4 border-t">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  የምርመራዉ ግኝትና ግምገማ
                </h2>
                
                {/* Findings */}
                {complaint.investigation.findings && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">የተገኘ ግምገማ</label>
                    <p className="text-gray-900 mt-1 whitespace-pre-wrap p-3 bg-gray-50 rounded border">{complaint.investigation.findings}</p>
                  </div>
                )}

                {/* Overall Conclusion */}
                {complaint.investigation.decision && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">አጠቃላይ የግምገማ ማጠቃለያ</label>
                    <p className="text-gray-900 mt-1 whitespace-pre-wrap p-3 bg-gray-50 rounded border">{complaint.investigation.decision}</p>
                  </div>
                )}

                {/* Supervisory Review and Approval */}
                {complaint.investigation && complaint.investigation.status === 'Approved' && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-base font-semibold text-gray-900">የአረጋገጠዉ አካል</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-900 mt-1 font-semibold">{currentUserName || complaint.investigation.reviewerName || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">የታየበት ቀን</label>
                        <p className="text-gray-900 mt-1">{complaint.investigation.reviewDate ? new Date(complaint.investigation.reviewDate).toLocaleDateString() : "N/A"}</p>
                      </div>
                    </div>
                    {complaint.investigation.outcome && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">ዉሳኔ</label>
                        <Badge className="bg-green-100 text-green-800">{complaint.investigation.outcome}</Badge>
                      </div>
                    )}
                    {complaint.investigation.recommendation && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">የተመለከተዉ አስተያየት</label>
                        <p className="text-gray-900 mt-1 whitespace-pre-wrap p-3 bg-gray-50 rounded border">{complaint.investigation.recommendation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Metadata */}
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500">
                Submitted on: {new Date(complaint.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Conversation Thread - Visible for Ethics Officers, Ethics Anti-Corruption, and Complainants */}
          {(isEthicsOfficer() || isEthicsAntiCorruption() || isComplainant()) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Conversation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
          )}

          {/* Complaint Report Modal */}
          {showReportModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Complaint Investigation Report</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowReportModal(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Report Header */}
                  <div className="text-center border-b pb-4">
                    <h1 className="text-2xl font-bold text-gray-900">የጥቆማ ሪፖርት</h1>
                    <p className="text-gray-600 mt-2">Reference: {complaint.referenceNumber}</p>
                    <p className="text-gray-600">Generated on: {new Date().toLocaleDateString()}</p>
                  </div>

                  {/* Complainant Information */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3">የጠቋሚ መረጃ</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-semibold">ስም:</span>
                        <p className="mt-1">{complaint.isAnonymous ? 'Anonymous' : (complaint.complainantName || 'N/A')}</p>
                      </div>
                      <div>
                        <span className="font-semibold">ኢሜይል:</span>
                        <p className="mt-1">{complaint.isAnonymous ? 'Not provided' : (complaint.complainantEmail || 'N/A')}</p>
                      </div>
                      <div>
                        <span className="font-semibold">ስልክ:</span>
                        <p className="mt-1">{complaint.isAnonymous ? 'Not provided' : (complaint.complainantPhone || 'N/A')}</p>
                      </div>
                      <div>
                        <span className="font-semibold">የስራ መደብ (Position):</span>
                        <p className="mt-1">{complaint.isAnonymous ? 'Not provided' : (complaint.complainantPosition || 'N/A')}</p>
                      </div>
                      <div>
                        <span className="font-semibold">የጠቋሚ የስራ ክፍል (Department):</span>
                        <p className="mt-1">{complaint.isAnonymous ? 'Not provided' : (complaint.complainantDepartment || 'N/A')}</p>
                      </div>
                      <div>
                        <span className="font-semibold">ተቋም:</span>
                        <p className="mt-1">{complaint.institution || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Complaint Details */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3">የጥቆማ ዝርዝር</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-semibold">ድርጊቱን የፈፀመዉ (Perpetrator):</span>
                        <p className="mt-1">{complaint.subject || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-semibold">የስራ መደብ (Perpetrator Position):</span>
                        <p className="mt-1">{complaint.perpetratorPosition || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-semibold">የስራ ክፍል:</span>
                        <p className="mt-1">{complaint.department || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-semibold">Category:</span>
                        <p className="mt-1">{complaint.category || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-semibold">ድርጊቱ የተፈፀመበት ቀን:</span>
                        <p className="mt-1">{complaint.incidentDate || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-semibold">ድርጊቱ የተፈፀመበት ቦታ:</span>
                        <p className="mt-1">{complaint.incidentLocation || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-semibold">ዝርዝር:</span>
                        <p className="mt-1 whitespace-pre-wrap">{complaint.description || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Investigation Details */}
                  {complaint.investigation && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-bold text-lg mb-3">የግምገማ ዝርዝር</h3>
                      <div className="space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-semibold">ምርምራዉ የሚጀምርበት ቀን:</span>
                            <p className="mt-1">{complaint.investigation.startDate ? new Date(complaint.investigation.startDate).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          <div>
                            <span className="font-semibold">ምርመራዉ ሊያልቅበት የሚችልበት ቀን:</span>
                            <p className="mt-1">{complaint.investigation.targetCompletionDate ? new Date(complaint.investigation.targetCompletionDate).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>
                        <div>
                          <span className="font-semibold">ዳራ:</span>
                          <p className="mt-1 whitespace-pre-wrap">{complaint.investigation.scope || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="font-semibold">አላማ:</span>
                          <p className="mt-1 whitespace-pre-wrap">{complaint.investigation.objectives || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Applicable Law/Policy:</span>
                          <p className="mt-1 whitespace-pre-wrap p-3 bg-gray-50 rounded border">{complaint.investigation.applicableLaw || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Findings and Assessment */}
                  {complaint.investigation && (complaint.investigation.status === 'Approved' || complaint.investigation.outcome) && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-bold text-lg mb-3">ግኝትና ግምገማ</h3>
                      <div className="space-y-3 text-sm">
                        {complaint.investigation.findings && (
                          <div>
                            <span className="font-semibold">ግምገማ:</span>
                            <p className="mt-1 whitespace-pre-wrap p-3 bg-gray-50 rounded border">{complaint.investigation.findings}</p>
                          </div>
                        )}
                        {complaint.investigation.decision && (
                          <div>
                            <span className="font-semibold">አጠቃላይ የግምገማ ማጠቃለያ:</span>
                            <p className="mt-1 whitespace-pre-wrap p-3 bg-gray-50 rounded border">{complaint.investigation.decision}</p>
                          </div>
                        )}
                        {complaint.investigation.recommendation && (
                          <div>
                            <span className="font-semibold">አስተያየት:</span>
                            <p className="mt-1 whitespace-pre-wrap p-3 bg-gray-50 rounded border">{complaint.investigation.recommendation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Supervisory Review and Approval */}
                  {complaint.investigation && complaint.investigation.status === 'Approved' && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-bold text-lg mb-3">አረጋጋጭ</h3>
                      <div className="space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="mt-1 font-semibold">{currentUserName || complaint.investigation.reviewerName || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="font-semibold">የታየበት ቀን:</span>
                            <p className="mt-1">{complaint.investigation.reviewDate ? new Date(complaint.investigation.reviewDate).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>
                        {complaint.investigation.outcome && (
                          <div>
                            <span className="font-semibold">ዉሳኔ:</span>
                            <Badge className="bg-green-100 text-green-800 mt-1">{complaint.investigation.outcome}</Badge>
                          </div>
                        )}
                        {complaint.investigation.recommendation && (
                          <div>
                            <span className="font-semibold">ምርመራዉን ያየዉ አሰተያየት:</span>
                            <p className="mt-1 whitespace-pre-wrap p-3 bg-gray-50 rounded border">{complaint.investigation.recommendation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Final Status */}
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <h3 className="font-bold text-lg mb-3">የመጨረሻ ሁኔታ</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-semibold">የጥቆማዉ ሁኔታ:</span>
                        <Badge className={`${statusColors[complaint.status] || "bg-gray-100 text-gray-800"} mt-1`}>{complaint.status}</Badge>
                      </div>
                      <div>
                        <span className="font-semibold">የምርመራዉ ሁኔታ:</span>
                        <Badge className="bg-green-100 text-green-800 mt-1">{complaint.investigation?.status || 'N/A'}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => window.print()}
                      className="gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Print Report
                    </Button>
                    <Button
                      onClick={() => setShowReportModal(false)}
                      className="gap-2"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
