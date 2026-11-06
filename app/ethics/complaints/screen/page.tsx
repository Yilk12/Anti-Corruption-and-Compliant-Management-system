"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { readToken } from "@/app/lib/auth";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { AlertTriangle, Shield, Send, CheckCircle, XCircle } from "lucide-react";
import { useSecretCodeCheck } from "@/app/hooks/use-secret-code-check";

interface Complaint {
  id: string;
  referenceNumber: string;
  category: string;
  description: string;
  status: string;
  isAnonymous: boolean;
  complainantName?: string;
  complainantEmail?: string;
  priority: string;
  screeningNotes?: string;
  isDuplicate?: boolean;
  safetyRisk?: string;
  retaliationRisk?: string;
  confidentialityLevel?: string;
  documentsVerified?: boolean;
}

export default function ComplaintScreeningPage() {
  const router = useRouter();
  
  // Check secret code status
  useSecretCodeCheck('/ethics/anticorruption/screen');
  
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [screening, setScreening] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<'Submitted' | 'Registered' | 'Under Assessment' | 'Awaiting Approval'>('Submitted');

  // Screening form state
  const [screeningData, setScreeningData] = useState({
    screeningNotes: "",
    isDuplicate: false,
    duplicateReference: "",
    safetyRisk: "None",
    retaliationRisk: "None",
    confidentialityLevel: "Standard",
    documentsVerified: false,
    documentsRequired: "",
    recommendation: "Register",
  });

  useEffect(() => {
    fetchSubmittedComplaints();
  }, [filterStatus]);

  const fetchSubmittedComplaints = async () => {
    try {
      const token = readToken();
      const response = await fetch(`http://localhost:4000/api/ethics/anticorruption/reports?status=${filterStatus}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setComplaints(data);
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
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
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSelectComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    fetchMessages(complaint.id);
    setScreeningData({
      screeningNotes: complaint.screeningNotes || "",
      isDuplicate: complaint.isDuplicate || false,
      duplicateReference: "",
      safetyRisk: complaint.safetyRisk || "None",
      retaliationRisk: complaint.retaliationRisk || "None",
      confidentialityLevel: complaint.confidentialityLevel || "Standard",
      documentsVerified: complaint.documentsVerified || false,
      documentsRequired: "",
      recommendation: "Register",
    });
  };

  const handleScreenComplaint = async () => {
    if (!selectedComplaint) return;

    setScreening(true);
    try {
      const token = readToken();
      const response = await fetch(`http://localhost:4000/api/ethics/anticorruption/reports/${selectedComplaint.id}/screen`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(screeningData),
      });

      if (response.ok) {
        alert('Complaint registered successfully');
        
        // If recommendation is "Investigate", redirect to complaints page where assign modal will auto-open
        if (screeningData.recommendation === 'Investigate') {
          router.push('/ethics/anticorruption');
        } else {
          fetchSubmittedComplaints();
          setSelectedComplaint(null);
        }
      } else {
        alert('Failed to register complaint');
      }
    } catch (error) {
      console.error('Error registering complaint:', error);
      alert('Failed to register complaint');
    } finally {
      setScreening(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedComplaint || !message.trim()) return;

    try {
      const token = readToken();
      const response = await fetch(`http://localhost:4000/api/ethics/complaints/${selectedComplaint.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        setMessage("");
        fetchMessages(selectedComplaint.id);
      } else {
        alert('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Register Case</h1>
              <p className="text-gray-600 mt-1">Review and register submitted complaints</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Complaints List */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">Complaints</h2>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setFilterStatus('Submitted')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      filterStatus === 'Submitted'
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Submitted
                  </button>
                  <button
                    onClick={() => setFilterStatus('Registered')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      filterStatus === 'Registered'
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Registered
                  </button>
                  <button
                    onClick={() => setFilterStatus('Under Assessment')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      filterStatus === 'Under Assessment'
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Under Assessment
                  </button>
                  <button
                    onClick={() => setFilterStatus('Awaiting Approval')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      filterStatus === 'Awaiting Approval'
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Awaiting Approval
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-3 max-h-150 overflow-y-auto">
                {loading ? (
                  <div className="text-center text-gray-500">Loading...</div>
                ) : complaints.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">No submitted complaints</div>
                ) : (
                  complaints.map((complaint) => (
                    <div
                      key={complaint.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedComplaint?.id === complaint.id
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => handleSelectComplaint(complaint)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{complaint.referenceNumber}</div>
                          <div className="text-sm text-gray-600 mt-1">{complaint.category}</div>
                          <div className="text-sm text-gray-500 mt-1 line-clamp-2">{complaint.description}</div>
                        </div>
                        <div className="ml-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            complaint.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                            complaint.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {complaint.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Screening Form */}
            {selectedComplaint && (
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold text-gray-800">Screen Complaint: {selectedComplaint.referenceNumber}</h2>
                </div>
                <div className="p-4 space-y-4 max-h-150 overflow-y-auto">
                  {/* Complainant Info */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">
                      {selectedComplaint.isAnonymous ? 'Anonymous Complaint' : selectedComplaint.complainantName}
                    </div>
                    {!selectedComplaint.isAnonymous && selectedComplaint.complainantEmail && (
                      <div className="text-sm text-gray-600">{selectedComplaint.complainantEmail}</div>
                    )}
                  </div>

                  {/* Risk Assessment */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Risk Assessment
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Safety Risk</label>
                      <select
                        value={screeningData.safetyRisk}
                        onChange={(e) => setScreeningData({ ...screeningData, safetyRisk: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="None">None</option>
                        <option value="Low">Low</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Retaliation Risk</label>
                      <select
                        value={screeningData.retaliationRisk}
                        onChange={(e) => setScreeningData({ ...screeningData, retaliationRisk: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="None">None</option>
                        <option value="Low">Low</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  {/* Confidentiality */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confidentiality Level</label>
                    <select
                      value={screeningData.confidentialityLevel}
                      onChange={(e) => setScreeningData({ ...screeningData, confidentialityLevel: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="Standard">Standard</option>
                      <option value="High">High</option>
                      <option value="Confidential">Confidential</option>
                    </select>
                  </div>

                  {/* Duplicate Check */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isDuplicate"
                      checked={screeningData.isDuplicate}
                      onChange={(e) => setScreeningData({ ...screeningData, isDuplicate: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="isDuplicate" className="text-sm font-medium text-gray-700">Mark as Duplicate</label>
                  </div>
                  {screeningData.isDuplicate && (
                    <Input
                      placeholder="Duplicate Reference Number"
                      value={screeningData.duplicateReference}
                      onChange={(e) => setScreeningData({ ...screeningData, duplicateReference: e.target.value })}
                    />
                  )}

                  {/* Documents */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="documentsVerified"
                      checked={screeningData.documentsVerified}
                      onChange={(e) => setScreeningData({ ...screeningData, documentsVerified: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="documentsVerified" className="text-sm font-medium text-gray-700">Documents Verified</label>
                  </div>
                  <Textarea
                    placeholder="Required documents (if any)"
                    value={screeningData.documentsRequired}
                    onChange={(e) => setScreeningData({ ...screeningData, documentsRequired: e.target.value })}
                    rows={2}
                  />

                  {/* Screening Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Screening Notes</label>
                    <Textarea
                      placeholder="Add screening notes..."
                      value={screeningData.screeningNotes}
                      onChange={(e) => setScreeningData({ ...screeningData, screeningNotes: e.target.value })}
                      rows={3}
                    />
                  </div>

                  {/* Recommendation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recommendation</label>
                    <select
                      value={screeningData.recommendation}
                      onChange={(e) => setScreeningData({ ...screeningData, recommendation: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="Register">Register Case</option>
                      <option value="Investigate">Investigate</option>
                      <option value="Reject">Reject</option>
                      <option value="Request More Info">Request More Info</option>
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleScreenComplaint}
                      disabled={screening}
                      className="flex-1 gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      {screening ? 'Screening...' : 'Register Complaint'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedComplaint(null)}
                    >
                      Cancel
                    </Button>
                  </div>

                  {/* Messaging Section */}
                  {!selectedComplaint.isAnonymous && (
                    <div className="border-t pt-4 mt-4">
                      <h3 className="font-medium text-gray-800 flex items-center gap-2 mb-3">
                        <Send className="w-4 h-4" />
                        Communicate with Complainant
                      </h3>
                      
                      {/* Messages List */}
                      <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto mb-3">
                        {messages.length === 0 ? (
                          <div className="text-sm text-gray-500 text-center">No messages yet</div>
                        ) : (
                          messages.map((msg) => (
                            <div key={msg.id} className="mb-2 last:mb-0">
                              <div className="text-xs text-gray-600">
                                {msg.sender?.firstName} {msg.sender?.lastName} - {new Date(msg.sentAt).toLocaleString()}
                              </div>
                              <div className="text-sm text-gray-800">{msg.message}</div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Send Message */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type your message..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <Button onClick={handleSendMessage} size="sm">
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
