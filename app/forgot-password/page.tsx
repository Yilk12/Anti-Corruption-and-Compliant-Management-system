"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to send reset email");
      }
      setMsg("If an account exists for this email, a reset link has been sent.");
    } catch (err: any) {
      setMsg(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        marginLeft: "calc(50% - 50vw)",
        backgroundColor: "#135a98",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        flexDirection: "column",
        padding: "8px 12px 24px",
      }}
    >
      <div style={{ color: "#b8860b", fontWeight: 900, fontSize: 28, marginBottom: 12, textAlign: "center" }}>
        Digital _CSC-fcsc
      </div>
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#ffffff",
          boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
          padding: 24,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Forgot password</h1>
        <p style={{ fontSize: 13, color: "#475569", marginBottom: 16 }}>
          Enter your email address and we will send you a link to reset your password.
        </p>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <div>
            <label htmlFor="email" style={{ display: "block", fontSize: 12, color: "#475569", marginBottom: 6 }}>Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb" }}
              placeholder="user@domain.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "none",
              background: loading ? "#a3a3a3" : "#2563eb",
              color: "#fff",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
        {msg && (
          <p style={{ marginTop: 12, fontSize: 13, color: msg.includes("link") ? "#16a34a" : "#b91c1c" }}>{msg}</p>
        )}
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <Link href="/login" style={{ fontSize: 13, fontWeight: 700, color: "#2563eb", textDecoration: "none" }}>
            Back to Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
