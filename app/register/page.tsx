"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login?notice=self-registration-disabled");
  }, [router]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [pwdHint, setPwdHint] = useState<string>("");

  function validatePassword(p: string) {
    const rules = [
      { test: p.length >= 8, label: "8+ characters" },
      { test: /[a-z]/.test(p), label: "lowercase" },
      { test: /[A-Z]/.test(p), label: "uppercase" },
      { test: /\d/.test(p), label: "number" },
    ];
    const missing = rules.filter(r => !r.test).map(r => r.label);
    setPwdHint(missing.length ? `Password needs: ${missing.join(", ")}` : "");
    return missing.length === 0;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    if (password !== confirmPassword) {
      setMsg("Passwords do not match");
      return;
    }
    if (!validatePassword(password)) {
      setMsg("Please choose a stronger password");
      return;
    }
    setLoading(true);
    try {
      // Map UI fields to backend RegisterDto
      const parts = name.trim().split(/\s+/)
      const firstName = parts[0] || ""
      const lastName = parts.slice(1).join(" ") || ""

      const payload: any = {
        email,
        firstName,
        lastName,
        password,
        phone: phone || undefined,
        department: department,
        // Prisma enums expected by backend
        role: "END_USER",
        userType: "INTERNAL",
      };

      // If backend supports a Gender enum, send uppercase values MALE/FEMALE
      payload.gender = gender;

      const headers: Record<string, string> = { "Content-Type": "application/json" }
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const raw = await res.text();
      let data: any = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = { message: raw || undefined };
      }

      if (!res.ok) {
        const errMsg = data?.message || data?.error || data?.detail || raw || "Registration failed";
        throw new Error(String(errMsg));
      }

      setMsg("Account created successfully. Redirecting to sign in...");
      // Small delay for UX, then go to login
      setTimeout(() => router.push("/login?verify=1"), 600);
    } catch (err: any) {
      setMsg(err?.message || "Registration failed");
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
        justifyContent: "center",
        padding: "24px 12px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          background: "#ffffff",
          borderRadius: 12,
          boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
          padding: 24,
        }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>
          Create your account
        </h1>
        {process.env.NEXT_PUBLIC_ENABLE_SSO === "true" && (
          <div style={{ marginBottom: 12 }}>
            <a
              href="/api/auth/sso"
              style={{
                display: "inline-block",
                padding: "8px 12px",
                borderRadius: 8,
                background: "#111827",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Continue with SSO
            </a>
          </div>
        )}
        <form
          onSubmit={onSubmit}
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            alignItems: "start",
          }}
        >
          <div>
            <label htmlFor="name" className="required-marker" style={{ display: "block", fontSize: 12, color: "#475569", marginBottom: 6 }}>Full name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Jane Doe"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
          </div>
          <div>
            <label htmlFor="email" className="required-marker" style={{ display: "block", fontSize: 12, color: "#475569", marginBottom: 6 }}>Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="user@domain.com"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
          </div>
          <div>
            <label htmlFor="department" className="required-marker" style={{ display: "block", fontSize: 12, color: "#475569", marginBottom: 6 }}>Department</label>
            <input
              id="department"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="IT, HR, Operations..."
              required
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
          </div>
          <div>
            <label htmlFor="gender" className="required-marker" style={{ display: "block", fontSize: 12, color: "#475569", marginBottom: 6 }}>Gender</label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff" }}
            >
              <option value="">Select gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
          <div>
            <label htmlFor="phone" style={{ display: "block", fontSize: 12, color: "#475569", marginBottom: 6 }}>Phone (optional)</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1234567890"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="required-marker" style={{ display: "block", fontSize: 12, color: "#475569", marginBottom: 6 }}>Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); validatePassword(e.target.value); }}
              required
              placeholder="••••••••"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
            {pwdHint && (
              <div style={{ marginTop: 6, fontSize: 12, color: "#b91c1c" }}>{pwdHint}</div>
            )}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="required-marker" style={{ display: "block", fontSize: 12, color: "#475569", marginBottom: 6 }}>Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              gridColumn: "1 / -1",
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "none",
              background: loading ? "#a3a3a3" : "#16a34a",
              color: "#fff",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div style={{ marginTop: 10, textAlign: "center" }}>
          <span style={{ fontSize: 13, color: "#475569" }}>Already have an account? </span>
          <Link
            href="/login"
            style={{ fontSize: 13, fontWeight: 700, color: "#2563eb", textDecoration: "none" }}
          >
            Sign in
          </Link>
        </div>

        {msg && (
          <p
            style={{
              marginTop: 12,
              fontSize: 13,
              color: msg.toLowerCase().includes("success") ? "#16a34a" : "#b91c1c",
            }}
          >
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}
