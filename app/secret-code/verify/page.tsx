"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VerifySecretCodePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Clear redirect flag on mount to allow re-verification if needed
  useEffect(() => {
    sessionStorage.removeItem('secretCodeVerificationRedirected');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token");
      
      const res = await fetch("http://localhost:4000/api/secret-code/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "ያስገቡት ሴክሬት ኮድ ትክክል አይደለም ደግመዉ ይሞክሩ");
      }

      console.log('Secret code verification successful, setting session flag');
      // Mark user as verified in this session
      sessionStorage.setItem('secretCodeVerified', 'true');
      console.log('Session flag set:', sessionStorage.getItem('secretCodeVerified'));

      // Clear redirect flags to allow future checks if needed
      sessionStorage.removeItem('secretCodeRedirected_NOT_CREATED');
      sessionStorage.removeItem('secretCodeRedirected_RESET_REQUIRED');
      sessionStorage.removeItem('secretCodeRedirected_VERIFICATION_REQUIRED');

      // Prevent multiple redirects using sessionStorage (persists across re-renders)
      if (sessionStorage.getItem('secretCodeVerificationRedirected') === 'true') {
        console.log('Already redirected, skipping');
        return;
      }
      sessionStorage.setItem('secretCodeVerificationRedirected', 'true');

      // After successful verification, redirect back to the intended page
      const redirectUrl = sessionStorage.getItem("secretCodeRedirectUrl");
      console.log('Redirecting to:', redirectUrl);
      sessionStorage.removeItem("secretCodeRedirectUrl");
      
      // Redirect immediately without setTimeout to prevent navigation throttling
      router.push(redirectUrl || "/ethics/anticorruption");
    } catch (err: any) {
      setError(err.message || "ያስገቡት ሴክሬት ኮድ ትክክል አይደለም ደግመዉ ይሞክሩ");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          maxWidth: 500,
          width: "100%",
          padding: 40,
        }}
      >
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
            <span style={{ fontSize: 36 }}>🔑</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
            Verify Secret Code
          </div>
          <div style={{ fontSize: 14, color: "#64748b" }}>
            Enter your secret code to access confidential information
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label
              style={{ display: "block", fontSize: 13, color: "#475569", marginBottom: 6, fontWeight: 600 }}
            >
              Secret Code
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showCode ? "text" : "password"}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                placeholder="Enter your secret code"
                autoComplete="new-password"
                style={{
                  width: "100%",
                  padding: "12px 40px 12px 16px",
                  borderRadius: 8,
                  border: "2px solid #e5e7eb",
                  background: "#f8fafc",
                  fontSize: 14,
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
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "#64748b",
                }}
              >
                {showCode ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: "12px",
                borderRadius: 8,
                background: "#fee2e2",
                color: "#dc2626",
                fontSize: 13,
                border: "1px solid #fecaca",
              }}
            >
              {error}
            </div>
          )}

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
              transition: "all 0.2s",
            }}
          >
            {loading ? "Verifying..." : "Verify"}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 8,
              border: "2px solid #e5e7eb",
              background: "#fff",
              color: "#64748b",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "#f8fafc"}
            onMouseOut={(e) => e.currentTarget.style.background = "#fff"}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
