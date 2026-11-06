"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { decodeJwt, getCurrentUserPrimaryRole } from "@/app/lib/auth";
import { saveAuthSession, getDepartmentInfo } from "@/app/lib/session";

function LoginPageInner() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [showVerifyMessage, setShowVerifyMessage] = useState(false);
  const [showGuestOptions, setShowGuestOptions] = useState(false);

  // Complaint form state
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      setShowVerifyMessage(params.get("verify") === "1");
    } catch {}
  }, []);

  const doLogin = async (emailArg: string, passwordArg: string) => {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: emailArg, password: passwordArg }),
      });

      const raw = await res.text();
      let data: any = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch { data = { message: raw || undefined }; }

      if (!res.ok) {
        const errMsg = data?.message || data?.error || data?.detail || raw || "Invalid credentials";
        throw new Error(String(errMsg));
      }

      const token = data?.access_token || data?.accessToken || data?.token || data?.jwt || data?.data?.token || data?.data?.access_token || data?.data?.jwt;
      if (typeof window !== "undefined" && token) {
        const val = String(token)
        localStorage.setItem("token", val)
        localStorage.setItem("accessToken", val)
        localStorage.setItem("jwt", val)
        // Clear secret code verification flag on login
        sessionStorage.removeItem('secretCodeVerified');
        // Persist session (token + backend user and decoded payload)
        try {
          saveAuthSession(val, data?.user ?? null)
        } catch {}
        // Safe client-side logging of user data
        try {
         
          const decoded = decodeJwt(val)
  
        } catch {}
      }
      setMsg("Login successful. Redirecting...");
      // Determine role-based dashboard
      const primary = getCurrentUserPrimaryRole();
      const { name: deptName } = getDepartmentInfo();

      let target = "/dashboard/end-user";
      if (primary === "admin") {
        target = "/dashboard/admin";
      } else if (primary === "commissioner") {
        target = "/dashboard/Commissioner";
      } else if (primary === "feedback_complaint_manager") {
        target = "/dashboard/feedback-complaint-manager";
      } else if (primary === "feedback_complaint_officer") {
        target = "/dashboard/feedback-complaint-officer";
      } else if (primary === "ethics_anti_corruption") {
        target = "/dashboard/Ethics_Anti_Corruption";
      } else if (primary === "ethics_officer") {
        target = "/dashboard/ethics-officer";
      } else if (primary === "administrative_complaints_team") {
        target = "/dashboard/administrative-complaints-team";
      } else if (primary === "women_social_inclusion") {
        target = "/dashboard/department-head/women-social-inclusion";
      } else if (primary === "department_head") {
        if (deptName === "Executive Director, Women and Social Inclusion Program") {
          target = "/dashboard/department-head/women-social-inclusion";
        } else {
          target = "/dashboard/department-head";
        }
      } else if (primary === "asset_manager") {
        target = "/dashboard/asset-manager";
      } else if (primary === "asset_officer") {
        target = "/dashboard/asset-officer";
      } else if (primary === "asset_control_registration_officer") {
        target = "/dashboard/asset-control-and-registration-officer";
      } else if (primary === "it_officer") {
        target = "/dashboard/it-officer";
      } else if (primary === "maintenance_team") {
        target = "/maintenance-team/";
      }

      // Store the intended dashboard URL for redirect after secret code
      sessionStorage.setItem("secretCodeRedirectUrl", target);

      // Check secret code status before redirecting to dashboard
      try {
        const statusRes = await fetch("http://localhost:4000/api/secret-code/status", {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          const status = statusData.status;

          if (status === "NOT_CREATED" || status === "RESET_REQUIRED") {
            router.push("/secret-code/create-secret-code");
            return;
          } else if (status === "VERIFICATION_REQUIRED") {
            router.push("/secret-code/verify");
            return;
          }
        }
      } catch (err) {
        console.error("Error checking secret code status:", err);
      }

      // Default falls back to end-user dashboard
      router.push(target);
    } catch (err: any) {
      const safeMsg = (err && typeof err.message === 'string' && err.message) || 'Login failed'
      setMsg(safeMsg)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await doLogin(email, password)
  };

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
    setComplaintMsg("Tracking ID copied to clipboard!");
  };

  const handleTrackComplaint = () => {
    // Store tracking info in sessionStorage for secure access
    sessionStorage.setItem('trackingId', trackingInfo.trackingId);
    router.push("/track-complaint");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        minHeight: "100vh",
        width: "100vw",
        overflow: "hidden",
        display: "flex",
        background: "#F6F9FD",
      }}
    >
      {/* Left Section - Hero */}
      <div
        style={{
          width: "50%",
          height: "100vh",
          position: "relative",
          overflow: "hidden",
          background: "#0B2F65",
        }}
      >
        {/* Background Image */}
        <img
          src="/gallery/log.png"
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            zIndex: 0,
          }}
        />
        {/* Overlay for text readability */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(11, 57, 120, 0.4), rgba(11, 57, 120, 0.3))",
            zIndex: 1,
          }}
        />
        {/* Hero Content */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "40px",
          }}
        >
          {/* Organization Title */}
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#FFFFFF",
              marginBottom: 8,
              lineHeight: 1.3,
            }}
          >
            Federal Civil Service Commission
          </div>

          {/* System Title */}
          <div
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: "rgba(255, 255, 255, 0.9)",
              marginBottom: 24,
              lineHeight: 1.5,
            }}
          >
            Anti Corruption and Complaint Management System
          </div>

          {/* Sub Heading */}
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: "#FFFFFF",
              marginBottom: 24,
              lineHeight: 1.4,
            }}
          >
            for A Brighter Future
          </div>

          {/* Amharic Text */}
          <div
            style={{
              fontSize: 20,
              fontWeight: 500,
              color: "#FFFFFF",
              lineHeight: 1.5,
            }}
          >
            እንሰማለን። ምላሽ እንሰጣለን። እንፈታለን። እናሻሽላለን።
          </div>
        </div>
      </div>

      {/* Right Section - Login */}
      <div
        style={{
          width: "50%",
          height: "100vh",
          background: "#F6F9FD",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Login Card */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "100%",
              background: "#FFFFFF",
              borderRadius: 20,
              boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08)",
              padding: 40,
            }}
          >
            {/* Welcome Logo */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#0B2F65",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
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

            {/* Welcome Text */}
            <div
              style={{
                textAlign: "center",
                marginBottom: 32,
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#1E293B",
                  marginBottom: 8,
                }}
              >
                Welcome to FCSC
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "#64748B",
                }}
              >
                Federal Civil Service Commission
              </div>
            </div>

            {showVerifyMessage && (
              <div style={{
                marginBottom: 16,
                padding: "12px 16px",
                borderRadius: 8,
                background: "#ECFDF5",
                color: "#065F46",
                border: "1px solid #A7F3D0",
                fontSize: 13,
              }}>
                Your account was created. Please check your email to verify your address, then sign in.
              </div>
            )}

            <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label htmlFor="email" style={{ display: "block", fontSize: 13, color: "#475569", marginBottom: 8, fontWeight: 500 }}>
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  style={{
                    width: "100%",
                    height: 48,
                    padding: "0 16px",
                    borderRadius: 8,
                    border: "1px solid #DCE6F4",
                    background: "#FFFFFF",
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  placeholder="Enter your email"
                  onFocus={(e) => e.currentTarget.style.borderColor = "#1264D8"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#DCE6F4"}
                />
              </div>

              <div>
                <label htmlFor="password" style={{ display: "block", fontSize: 13, color: "#475569", marginBottom: 8, fontWeight: 500 }}>
                  Password
                </label>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{
                    width: "100%",
                    height: 48,
                    padding: "0 16px",
                    borderRadius: 8,
                    border: "1px solid #DCE6F4",
                    background: "#FFFFFF",
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  placeholder="Enter your password"
                  onFocus={(e) => e.currentTarget.style.borderColor = "#1264D8"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#DCE6F4"}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: "pointer" }}
                  />
                  Show password
                </label>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 8,
                    border: "none",
                    background: loading ? "#94A3B8" : "#1264D8",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseOver={(e) => !loading && (e.currentTarget.style.background = "#0E4FA8")}
                  onMouseOut={(e) => !loading && (e.currentTarget.style.background = "#1264D8")}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </div>
            </form>

            <div style={{ display: "flex", gap: 12, alignItems: "center", position: "relative" }}>
              <button
                type="button"
                onClick={() => setShowGuestOptions(true)}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 8,
                  border: "1px solid #C9D9EF",
                  background: "#FFFFFF",
                  color: "#0B3978",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  pointerEvents: "auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#F8FAFC";
                  e.currentTarget.style.borderColor = "#1264D8";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#FFFFFF";
                  e.currentTarget.style.borderColor = "#C9D9EF";
                }}
              >
                Submit as Guest
                <span
                  style={{
                    fontSize: 24,
                    animation: "bounce 1s infinite",
                    display: "inline-block",
                  }}
                >
                  👈
                </span>
              </button>
              <button
                type="button"
                onClick={() => router.push("/track-feedback")}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 8,
                  border: "1px solid #C9D9EF",
                  background: "#FFFFFF",
                  color: "#0B3978",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  pointerEvents: "auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#F8FAFC";
                  e.currentTarget.style.borderColor = "#1264D8";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#FFFFFF";
                  e.currentTarget.style.borderColor = "#C9D9EF";
                }}
              >
                ቅሬታዎን ይከታተሉ
                <span
                  style={{
                    fontSize: 24,
                    animation: "bounce 1s infinite",
                    display: "inline-block",
                  }}
                >
                  🔍
                </span>
              </button>
            </div>

            <style dangerouslySetInnerHTML={{
              __html: `
                @keyframes bounce {
                  0%, 100% {
                    transform: translateY(0);
                  }
                  50% {
                    transform: translateY(-10px);
                  }
                }
              `
            }} />

            {showGuestOptions && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(0, 0, 0, 0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1000,
                }}
                onClick={() => setShowGuestOptions(false)}
              >
                <div
                  style={{
                    background: "#F5F0E6",
                    borderRadius: 12,
                    padding: 32,
                    maxWidth: 500,
                    width: "90%",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0B3978", marginBottom: 8 }}>
                    Choose Submission Type
                  </h2>
                  <p style={{ fontSize: 14, color: "#64748B", marginBottom: 24 }}>
                    Select the type of submission you want to make as a guest
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => router.push("/guest-feedback")}
                      style={{
                        width: "100%",
                        height: 56,
                        borderRadius: 8,
                        border: "2px solid #1264D8",
                        background: "#FFFFFF",
                        color: "#1264D8",
                        fontWeight: 600,
                        fontSize: 15,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "#1264D8";
                        e.currentTarget.style.color = "#FFFFFF";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "#FFFFFF";
                        e.currentTarget.style.color = "#1264D8";
                      }}
                    >
                      <span>Submit Complaint as Guest</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push("/guest-anticorruption")}
                      style={{
                        width: "100%",
                        height: 56,
                        borderRadius: 8,
                        border: "2px solid #DC2626",
                        background: "#FFFFFF",
                        color: "#DC2626",
                        fontWeight: 600,
                        fontSize: 15,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "#DC2626";
                        e.currentTarget.style.color = "#FFFFFF";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "#FFFFFF";
                        e.currentTarget.style.color = "#DC2626";
                      }}
                    >
                      <span>Submit Ethics and Anti-Corruption as Guest</span>
                    </button>

                    <button
                      onClick={() => setShowGuestOptions(false)}
                      style={{
                        width: "100%",
                        height: 48,
                        borderRadius: 8,
                        border: "none",
                        background: "#F1F5F9",
                        color: "#64748B",
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "#E2E8F0";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "#F1F5F9";
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {msg && (
              <p style={{ marginTop: 16, fontSize: 13, textAlign: "center", color: msg.includes("successful") ? "#16A34A" : "#DC2626" }}>
                {msg}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <LoginPageInner />;
}