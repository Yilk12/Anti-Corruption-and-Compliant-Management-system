"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export const dynamic = 'force-dynamic';

function TrackComplaintContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [trackingId, setTrackingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [complaint, setComplaint] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [commissionerDecisionData, setCommissionerDecisionData] = useState<any>(null);

  // Check for pre-filled tracking info from URL or sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlTrackingId = searchParams.get('trackingId');
      const storedTrackingId = sessionStorage.getItem('trackingId');
      
      const trackingIdToUse = urlTrackingId || storedTrackingId;
      
      if (trackingIdToUse) {
        setTrackingId(trackingIdToUse);
        // Automatically track the complaint
        handleAutoTrack(trackingIdToUse);
      }
    }
  }, [searchParams]);

  const handleAutoTrack = async (id: string) => {
    setLoading(true);
    setError("");
    setComplaint(null);
    setMessages([]);

    try {
      const res = await fetch("http://localhost:4000/api/ethics/anticorruption/reports/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingId: id.trim(),
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to track complaint");
      }

      const data = await res.json();
      setComplaint(data);
      // Load messages for this complaint
      loadMessages(data.id);
      // Clear sessionStorage after successful tracking
      sessionStorage.removeItem('trackingId');
    } catch (err: any) {
      setError(err.message || "Failed to track complaint");
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setComplaint(null);
    setMessages([]);

    try {
      const res = await fetch("http://localhost:4000/api/ethics/anticorruption/reports/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingId: trackingId.trim(),
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to track complaint");
      }

      const data = await res.json();
      setComplaint(data);
      // Load messages for this complaint
      loadMessages(data.id);
      // Redirect to detail page
      router.push(`/guest-complaint/${trackingId.trim()}`);
    } catch (err: any) {
      setError(err.message || "Failed to track complaint");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (complaintId: string) => {
    try {
      const res = await fetch("http://localhost:4000/api/ethics/anticorruption/reports/track/messages", {
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

  const loadCommissionerDecision = async (petitionId: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/feedback/petitions/${petitionId}/commissioner-decision`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setCommissionerDecisionData(data);
        setShowDecisionModal(true);
      } else {
        alert('No commissioner decision found for this petition');
      }
    } catch (err) {
      console.error('Error loading commissioner decision:', err);
      alert('Failed to load commissioner decision');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !complaint) return;

    setSendingMessage(true);
    try {
      // Try ethics endpoint first (for anti-corruption reports)
      let res = await fetch("http://localhost:4000/api/ethics/anticorruption/reports/track/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingId: trackingId.trim(),
          message: newMessage,
        }),
      });

      // If ethics endpoint fails, try feedback endpoint (for general feedback complaints)
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Ethics endpoint failed:', errorText);
        
        res = await fetch("http://localhost:4000/api/feedback/complaints/track/messages/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackingId: trackingId.trim(),
            message: newMessage,
          }),
        });
        
        if (!res.ok) {
          const feedbackErrorText = await res.text();
          console.error('Feedback endpoint also failed:', feedbackErrorText);
          throw new Error(feedbackErrorText || 'Failed to send message');
        }
      }

      if (res.ok) {
        const data = await res.json();
        setMessages([...messages, data]);
        setNewMessage("");
        // Reload messages to get the full message with sender details
        loadMessages(complaint.id);
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      alert(err.message || 'Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          maxWidth: 600,
          width: "100%",
          padding: 40,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#64748b",
            fontSize: 14,
            marginBottom: 24,
            padding: 0,
          }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 999,
              margin: "0 auto 16px",
              background: "linear-gradient(135deg,#667eea,#764ba2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 10px 30px rgba(102,126,234,0.35)",
            }}
          >
            <span style={{ fontSize: 36 }}>🔍</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
            Track Your Complaint
          </div>
          <div style={{ fontSize: 14, color: "#64748b" }}>
            Enter your tracking ID to check progress
          </div>
        </div>

        {!complaint ? (
          <form onSubmit={handleTrack} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label
                style={{ display: "block", fontSize: 13, color: "#475569", marginBottom: 6, fontWeight: 600 }}
              >
                Tracking ID
              </label>
              <input
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                required
                placeholder="e.g., FCSC-2026-A8K7M2Q9"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "2px solid #e5e7eb",
                  background: "#f8fafc",
                  fontSize: 14,
                  fontFamily: "monospace",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#667eea";
                  e.currentTarget.style.background = "#fff";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.background = "#f8fafc";
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 8,
                border: "none",
                background: loading ? "#a3a3a3" : "linear-gradient(135deg,#667eea,#764ba2)",
                color: "#fff",
                fontWeight: 800,
                fontSize: 16,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 10px 25px rgba(102,126,234,0.35)",
                transition: "all 0.2s",
              }}
            >
              {loading ? "Tracking..." : "Track Complaint"}
            </button>

            {error && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  fontSize: 13,
                  textAlign: "center",
                }}
              >
                {error}
              </div>
            )}
          </form>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                padding: 20,
                borderRadius: 12,
                background: "#f8fafc",
                border: "2px solid #e5e7eb",
              }}
            >
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>
                TRACKING ID
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#0f172a",
                  fontFamily: "monospace",
                  letterSpacing: 1,
                }}
              >
                {complaint.trackingId}
              </div>
            </div>

            <div
              style={{
                padding: 20,
                borderRadius: 12,
                background: "#f8fafc",
                border: "2px solid #e5e7eb",
              }}
            >
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>
                REFERENCE NUMBER
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#0f172a",
                  fontFamily: "monospace",
                  letterSpacing: 1,
                }}
              >
                {complaint.referenceNumber}
              </div>
            </div>

            <div
              style={{
                padding: 20,
                borderRadius: 12,
                background: "#f8fafc",
                border: "2px solid #e5e7eb",
              }}
            >
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>
                STATUS
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: getStatusColor(complaint.status),
                  padding: "4px 12px",
                  borderRadius: 6,
                  background: getStatusBackground(complaint.status),
                  display: "inline-block",
                }}
              >
                {complaint.status}
              </div>
            </div>

            <div
              style={{
                padding: 20,
                borderRadius: 12,
                background: "#f8fafc",
                border: "2px solid #e5e7eb",
              }}
            >
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8, fontWeight: 600 }}>
                COMPLAINT DETAILS
              </div>
              <div style={{ fontSize: 14, color: "#475569", marginBottom: 4 }}>
                <strong>Category:</strong> {complaint.category}
              </div>
              <div style={{ fontSize: 14, color: "#475569", marginBottom: 4 }}>
                <strong>Subject:</strong> {complaint.subject}
              </div>
              <div style={{ fontSize: 14, color: "#475569", marginBottom: 4 }}>
                <strong>Priority:</strong> {complaint.priority}
              </div>
              {complaint.incidentDate && (
                <div style={{ fontSize: 14, color: "#475569", marginBottom: 4 }}>
                  <strong>Incident Date:</strong> {new Date(complaint.incidentDate).toLocaleDateString()}
                </div>
              )}
              {complaint.incidentLocation && (
                <div style={{ fontSize: 14, color: "#475569", marginBottom: 4 }}>
                  <strong>Incident Location:</strong> {complaint.incidentLocation}
                </div>
              )}
              <div style={{ fontSize: 14, color: "#475569", marginBottom: 4 }}>
                <strong>Submitted:</strong> {new Date(complaint.submittedAt).toLocaleDateString()}
              </div>
            </div>

            <div
              style={{
                padding: 20,
                borderRadius: 12,
                background: "#f8fafc",
                border: "2px solid #e5e7eb",
              }}
            >
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8, fontWeight: 600 }}>
                DESCRIPTION
              </div>
              <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {complaint.description}
              </div>
            </div>

            <div
              style={{
                padding: 20,
                borderRadius: 12,
                background: "#f8fafc",
                border: "2px solid #e5e7eb",
              }}
            >
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8, fontWeight: 600 }}>
                COMPLAINANT INFORMATION
              </div>
              {complaint.complainantName && (
                <div style={{ fontSize: 14, color: "#475569", marginBottom: 4 }}>
                  <strong>Name:</strong> {complaint.complainantName}
                </div>
              )}
              {complaint.complainantEmail && (
                <div style={{ fontSize: 14, color: "#475569", marginBottom: 4 }}>
                  <strong>Email:</strong> {complaint.complainantEmail}
                </div>
              )}
              {complaint.complainantPhone && (
                <div style={{ fontSize: 14, color: "#475569", marginBottom: 4 }}>
                  <strong>Phone:</strong> {complaint.complainantPhone}
                </div>
              )}
            </div>

            <div
              style={{
                padding: 20,
                borderRadius: 12,
                background: "#f8fafc",
                border: "2px solid #e5e7eb",
              }}
            >
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8, fontWeight: 600 }}>
                PROGRESS TIMELINE
              </div>
              <div style={{ fontSize: 14, color: "#475569" }}>
                {complaint.status === "Submitted" && (
                  <div>Your complaint has been received and is pending review.</div>
                )}
                {complaint.status === "Registered" && (
                  <div>Your complaint has been registered and assigned for investigation.</div>
                )}
                {complaint.status === "Under Investigation" && (
                  <div>Your complaint is currently under investigation.</div>
                )}
                {complaint.status === "Closed" && (
                  <div>Your complaint has been closed.</div>
                )}
                {complaint.screenedAt && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                    Screened on: {new Date(complaint.screenedAt).toLocaleDateString()}
                  </div>
                )}
                {complaint.registeredAt && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                    Registered on: {new Date(complaint.registeredAt).toLocaleDateString()}
                  </div>
                )}
                {complaint.closedAt && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                    Closed on: {new Date(complaint.closedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {/* Petition - Final Decision Section */}
            {complaint.petitionId && (
              <div
                style={{
                  padding: 20,
                  borderRadius: 12,
                  background: "#dbeafe",
                  border: "2px solid #3b82f6",
                }}
              >
                <div style={{ fontSize: 12, color: "#1e40af", marginBottom: 12, fontWeight: 600 }}>
                  PETITION - FINAL DECISION
                </div>
                <button
                  onClick={() => loadCommissionerDecision(complaint.petitionId)}
                  style={{
                    width: "100%",
                    padding: "12px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: "linear-gradient(135deg,#3b82f6,#2563eb)",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  View Commissioner Final Decision Details
                </button>
              </div>
            )}

            {/* Messages Section */}
            <div
              style={{
                padding: 20,
                borderRadius: 12,
                background: "#f8fafc",
                border: "2px solid #e5e7eb",
              }}
            >
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12, fontWeight: 600 }}>
                MESSAGES
              </div>
              
              {/* Messages Display */}
              <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: 16 }}>
                {messages.length === 0 ? (
                  <div style={{ fontSize: 14, color: "#94a3b8", textAlign: "center", padding: 20 }}>
                    No messages yet
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        style={{
                          padding: 12,
                          borderRadius: 8,
                          background: msg.senderType === "complainant" ? "#dbeafe" : "#f1f5f9",
                          alignSelf: msg.senderType === "complainant" ? "flex-end" : "flex-start",
                          maxWidth: "80%",
                          marginLeft: msg.senderType === "complainant" ? "auto" : 0,
                        }}
                      >
                        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>
                          {msg.senderType === "complainant" ? "You" : "Ethics Officer"}
                        </div>
                        <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.5 }}>
                          {msg.message}
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                          {new Date(msg.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Send Message Form */}
              <form onSubmit={handleSendMessage} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 8,
                    border: "2px solid #e5e7eb",
                    background: "#fff",
                    fontSize: 14,
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !newMessage.trim()}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: sendingMessage || !newMessage.trim() ? "#a3a3a3" : "linear-gradient(135deg,#667eea,#764ba2)",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: sendingMessage || !newMessage.trim() ? "not-allowed" : "pointer",
                    alignSelf: "flex-end",
                  }}
                >
                  {sendingMessage ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Commissioner Decision Modal */}
        {showDecisionModal && commissionerDecisionData && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 20,
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                maxWidth: 800,
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                padding: 32,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Petition - Final Decision Details
                </h2>
                <button
                  onClick={() => setShowDecisionModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#64748b",
                    fontSize: 24,
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div
                  style={{
                    padding: 20,
                    borderRadius: 12,
                    background: "#eff6ff",
                    border: "2px solid #3b82f6",
                  }}
                >
                  <div style={{ fontSize: 14, color: "#1e40af", marginBottom: 16, fontWeight: 700 }}>
                    COMMISSIONER FINAL DECISION
                  </div>

                  {commissionerDecisionData.commissionerDecision?.petitionSubject && (
                    <div style={{ marginBottom: 8 }}>
                      <strong>Petition Subject:</strong> {commissionerDecisionData.commissionerDecision.petitionSubject}
                    </div>
                  )}
                  {commissionerDecisionData.commissionerDecision?.petitionerName && (
                    <div style={{ marginBottom: 8 }}>
                      <strong>Petitioner Name:</strong> {commissionerDecisionData.commissionerDecision.petitionerName}
                    </div>
                  )}

                  <div style={{ fontSize: 14, color: "#1e40af", marginTop: 16, marginBottom: 8, fontWeight: 600 }}>
                    Investigation Summary:
                  </div>
                  {commissionerDecisionData.commissionerDecision?.summaryOfFindings && (
                    <div style={{ marginBottom: 4 }}>
                      • Summary of Findings: {commissionerDecisionData.commissionerDecision.summaryOfFindings}
                    </div>
                  )}
                  {commissionerDecisionData.commissionerDecision?.evidenceReviewed && (
                    <div style={{ marginBottom: 4 }}>
                      • Evidence Reviewed: {commissionerDecisionData.commissionerDecision.evidenceReviewed}
                    </div>
                  )}
                  {commissionerDecisionData.commissionerDecision?.investigatorRecommendation && (
                    <div style={{ marginBottom: 4 }}>
                      • Investigator Recommendation: {commissionerDecisionData.commissionerDecision.investigatorRecommendation}
                    </div>
                  )}

                  <div style={{ fontSize: 14, color: "#1e40af", marginTop: 16, marginBottom: 8, fontWeight: 600 }}>
                    Commissioner's Decision:
                  </div>
                  {commissionerDecisionData.commissionerDecision?.commissionerObservations && (
                    <div style={{ marginBottom: 4 }}>
                      • Commissioner's Observations: {commissionerDecisionData.commissionerDecision.commissionerObservations}
                    </div>
                  )}
                  {commissionerDecisionData.commissionerDecision?.legalPolicyBasis && (
                    <div style={{ marginBottom: 4 }}>
                      • Legal/Policy Basis: {commissionerDecisionData.commissionerDecision.legalPolicyBasis}
                    </div>
                  )}

                  <div style={{ fontSize: 14, color: "#1e40af", marginTop: 16, marginBottom: 8, fontWeight: 600 }}>
                    Decision Details:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    <li>Decision Type: {commissionerDecisionData.commissionerDecision?.decisionType || 'N/A'}</li>
                    <li>Disciplinary Action: {commissionerDecisionData.commissionerDecision?.disciplinaryAction || 'N/A'}</li>
                    <li>Responsible Department: {commissionerDecisionData.commissionerDecision?.responsibleDepartment || 'N/A'}</li>
                    <li>Implementation Deadline: {commissionerDecisionData.commissionerDecision?.implementationDeadline || 'N/A'}</li>
                  </ul>

                  {commissionerDecisionData.commissionerDecision?.finalDecisionSummary && (
                    <div style={{ marginTop: 16, marginBottom: 8 }}>
                      <strong>Final Decision Summary:</strong> {commissionerDecisionData.commissionerDecision.finalDecisionSummary}
                    </div>
                  )}

                  {commissionerDecisionData.commissionerDecision?.commissionerName && (
                    <div style={{ marginBottom: 8 }}>
                      <strong>Commissioner:</strong> {commissionerDecisionData.commissionerDecision.commissionerName}
                    </div>
                  )}
                  {commissionerDecisionData.commissionerDecision?.decisionDate && (
                    <div style={{ marginBottom: 8 }}>
                      <strong>Decision Date:</strong> {commissionerDecisionData.commissionerDecision.decisionDate}
                    </div>
                  )}

                  <div style={{ marginTop: 16, marginBottom: 8 }}>
                    <strong>Final Petition Status:</strong> {commissionerDecisionData.commissionerDecision?.finalPetitionStatus || 'Closed'}
                  </div>

                  {commissionerDecisionData.commissionerDecision?.closureRemarks && (
                    <div style={{ marginTop: 16 }}>
                      <strong>Closure Remarks:</strong> {commissionerDecisionData.commissionerDecision.closureRemarks}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackComplaintPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TrackComplaintContent />
    </Suspense>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case "Submitted":
      return "#f59e0b";
    case "Registered":
      return "#3b82f6";
    case "Under Investigation":
      return "#8b5cf6";
    case "Closed":
      return "#10b981";
    default:
      return "#64748b";
  }
}

function getStatusBackground(status: string): string {
  switch (status) {
    case "Submitted":
      return "#fef3c7";
    case "Registered":
      return "#dbeafe";
    case "Under Investigation":
      return "#ede9fe";
    case "Closed":
      return "#d1fae5";
    default:
      return "#f1f5f9";
  }
}
