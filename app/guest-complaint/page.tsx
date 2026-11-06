"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

function GuestComplaintPageInner() {
  const router = useRouter();
  const [complaintData, setComplaintData] = useState({
    complainantName: "",
    complainantEmail: "",
    complainantPhone: "",
    category: "",
    subject: "",
    description: "",
    incidentDate: "",
  });
  const [complaintLoading, setComplaintLoading] = useState(false);
  const [complaintMsg, setComplaintMsg] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState({
    trackingId: "",
    verificationSecret: "",
  });

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setComplaintLoading(true);
    setComplaintMsg("");
    try {
      const res = await fetch("http://localhost:4000/api/ethics/anticorruption/reports/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...complaintData,
          isAnonymous: true,
          isInternal: false,
          reportingChannel: 'PUBLIC_PORTAL',
          priority: "Low",
          consentDeclaration: true,
          consentAccuracy: true,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to submit complaint");
      }

      const result = await res.json();
      setTrackingInfo({
        trackingId: result.trackingId || "",
        verificationSecret: result.verificationSecret || "",
      });
      setShowConfirmation(true);
      setComplaintMsg("Complaint submitted successfully!");
      setComplaintData({
        complainantName: "",
        complainantEmail: "",
        complainantPhone: "",
        category: "",
        subject: "",
        description: "",
        incidentDate: "",
      });
    } catch (err: any) {
      setComplaintMsg(err.message || "Failed to submit complaint");
    } finally {
      setComplaintLoading(false);
    }
  };

  const handleCopyTrackingId = () => {
    navigator.clipboard.writeText(trackingInfo.trackingId);
    setComplaintMsg("ID copied to clipboard!");
  };

  const handleTrackComplaint = () => {
    sessionStorage.setItem('trackingId', trackingInfo.trackingId);
    router.push("/track-complaint");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F6F9FD",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 500,
          background: "#FFFFFF",
          borderRadius: 20,
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08)",
          padding: 40,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#0B2F65",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <img
              src="/gallery/c.png"
              alt="Government Icon"
              style={{
                width: 36,
                height: 36,
                objectFit: "contain",
              }}
            />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#1E293B", marginBottom: 8 }}>
            Submit Complaint as Guest
          </div>
          <div style={{ fontSize: 14, color: "#64748B" }}>
            Report violations anonymously
          </div>
        </div>

        {showConfirmation ? (
          // Confirmation Screen
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                margin: "0 auto 12px",
                background: "#16A34A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <span style={{ fontSize: 24 }}>✓</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>
              Complaint Submitted Successfully
            </div>
            <div style={{ fontSize: 14, color: "#64748B", marginBottom: 24 }}>
              Your complaint has been received
            </div>

            <div
              style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                padding: 20,
                marginBottom: 24,
              }}
            >
              <div style={{ fontSize: 12, color: "#64748B", marginBottom: 8, fontWeight: 600 }}>
                COMPLAINT SUBMITTED
              </div>
              <div style={{ fontSize: 14, color: "#64748B" }}>
                Your complaint has been submitted successfully
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
              <button
                onClick={handleTrackComplaint}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 8,
                  border: "none",
                  background: "#1264D8",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Track Complaint
              </button>
            </div>

            <button
              onClick={() => {
                setShowConfirmation(false);
                setComplaintMsg("");
              }}
              style={{
                marginTop: 16,
                padding: 8,
                background: "transparent",
                border: "none",
                color: "#64748B",
                fontSize: 13,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Submit another complaint
            </button>
          </div>
        ) : (
          // Complaint Form
          <form onSubmit={handleComplaintSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "#475569", marginBottom: 6, fontWeight: 500 }}>
                Your Name
              </label>
              <input
                type="text"
                value={complaintData.complainantName}
                onChange={(e) => setComplaintData({ ...complaintData, complainantName: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #DCE6F4",
                  background: "#FFFFFF",
                  fontSize: 14,
                }}
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "#475569", marginBottom: 6, fontWeight: 500 }}>
                Email Address
              </label>
              <input
                type="email"
                value={complaintData.complainantEmail}
                onChange={(e) => setComplaintData({ ...complaintData, complainantEmail: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #DCE6F4",
                  background: "#FFFFFF",
                  fontSize: 14,
                }}
                placeholder="Example@example.com"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "#475569", marginBottom: 6, fontWeight: 500 }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={complaintData.complainantPhone}
                onChange={(e) => setComplaintData({ ...complaintData, complainantPhone: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #DCE6F4",
                  background: "#FFFFFF",
                  fontSize: 14,
                }}
                placeholder="+251 911 234 567"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "#475569", marginBottom: 6, fontWeight: 500 }}>
                Category
              </label>
              <select
                value={complaintData.category}
                onChange={(e) => setComplaintData({ ...complaintData, category: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #DCE6F4",
                  background: "#FFFFFF",
                  fontSize: 14,
                }}
              >
                <option value="">Select category</option>
                <option value="Corruption">Corruption</option>
                <option value="Fraud">Fraud</option>
                <option value="Harassment">Harassment</option>
                <option value="Discrimination">Discrimination</option>
                <option value="Misconduct">Misconduct</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "#475569", marginBottom: 6, fontWeight: 500 }}>
                Subject
              </label>
              <input
                type="text"
                value={complaintData.subject}
                onChange={(e) => setComplaintData({ ...complaintData, subject: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #DCE6F4",
                  background: "#FFFFFF",
                  fontSize: 14,
                }}
                placeholder="Brief subject"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "#475569", marginBottom: 6, fontWeight: 500 }}>
                Incident Date
              </label>
              <input
                type="date"
                value={complaintData.incidentDate}
                onChange={(e) => setComplaintData({ ...complaintData, incidentDate: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #DCE6F4",
                  background: "#FFFFFF",
                  fontSize: 14,
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "#475569", marginBottom: 6, fontWeight: 500 }}>
                Description
              </label>
              <textarea
                value={complaintData.description}
                onChange={(e) => setComplaintData({ ...complaintData, description: e.target.value })}
                required
                rows={4}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #DCE6F4",
                  background: "#FFFFFF",
                  resize: "vertical",
                  fontSize: 14,
                }}
                placeholder="Detailed description..."
              />
            </div>

            <button
              type="submit"
              disabled={complaintLoading}
              style={{
                width: "100%",
                height: 48,
                borderRadius: 8,
                border: "none",
                background: complaintLoading ? "#94A3B8" : "#DC2626",
                color: "#FFFFFF",
                fontWeight: 600,
                fontSize: 15,
                cursor: complaintLoading ? "not-allowed" : "pointer",
              }}
            >
              {complaintLoading ? "Submitting..." : "Submit Complaint"}
            </button>

            {/* Track Complaints Button */}
            <button
              type="button"
              onClick={() => router.push("/track-complaint")}
              style={{
                width: "100%",
                height: 48,
                borderRadius: 8,
                border: "1px solid #1264D8",
                background: "#FFFFFF",
                color: "#1264D8",
                fontWeight: 600,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              Track Complaints
            </button>

            {/* Back to Login */}
            <button
              type="button"
              onClick={() => router.push("/login")}
              style={{
                width: "100%",
                height: 44,
                borderRadius: 8,
                border: "none",
                background: "transparent",
                color: "#64748B",
                fontWeight: 500,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Back to Login
            </button>
          </form>
        )}

        {complaintMsg && (
          <p style={{ marginTop: 16, fontSize: 13, textAlign: "center", color: complaintMsg.includes("success") ? "#16A34A" : "#DC2626" }}>
            {complaintMsg}
          </p>
        )}
      </div>
    </div>
  );
}

export default function GuestComplaintPage() {
  return <GuestComplaintPageInner />;
}
