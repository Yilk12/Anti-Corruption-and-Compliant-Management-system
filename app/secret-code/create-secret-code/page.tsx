"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateSecretCodePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (code.length < 4) {
      setError("Secret code must be at least 4 characters");
      return;
    }

    if (code !== confirmCode) {
      setError("Secret codes do not match");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token");
      
      const res = await fetch("http://localhost:4000/api/secret-code/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to create secret code");
      }

      // After successful creation, redirect to verify page (not auto-verify)
      router.push("/secret-code/verify");
    } catch (err: any) {
      setError(err.message || "Failed to create secret code");
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
            <span style={{ fontSize: 36 }}>🔐</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
            Create Secret Code
          </div>
          <div style={{ fontSize: 14, color: "#64748b" }}>
            Create a personal secret code to access confidential information
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label
              style={{ display: "block", fontSize: 13, color: "#475569", marginBottom: 6, fontWeight: 600 }}
            >
              New Secret Code
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

          <div>
            <label
              style={{ display: "block", fontSize: 13, color: "#475569", marginBottom: 6, fontWeight: 600 }}
            >
              Confirm Secret Code
            </label>
            <input
              type={showCode ? "text" : "password"}
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              required
              placeholder="Confirm your secret code"
              autoComplete="new-password"
              style={{
                width: "100%",
                padding: "12px 16px",
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
            {loading ? "Creating..." : "Create Secret Code"}
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
