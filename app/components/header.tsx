"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { decodeJwt, getCurrentUserPrimaryRole, clearAuthTokens } from "@/app/lib/auth";
import NotificationBell from "./notifications/NotificationBell";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [userOpen, setUserOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");

  // Real role -> path mapping (optional convenience redirect)
  const roleToPath: Record<string, string> = {
    admin: "/users",
    gm: "/gm",
    manager: "/dashboard",
    department_head: "/workflow/department",
    employee: "/dashboard",
  };

  // Initialization: read real JWT and optionally redirect root by role
  useEffect(() => {
    if (pathname === "/login") return;
    if (typeof window === "undefined") return;
    try {
      const token = window.localStorage.getItem("accessToken") || window.localStorage.getItem("jwt") || window.localStorage.getItem("token");
      if (token) {
        const p: any = decodeJwt(token);
        const name = p?.name || p?.preferred_username || p?.email || p?.sub || "";
        if (name) setDisplayName(String(name));
        
        // Get and display user role
        const primaryRole = getCurrentUserPrimaryRole();
        console.log('Header - Primary role:', primaryRole);
        if (primaryRole) {
          const formattedRole = primaryRole.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
          console.log('Header - Formatted role:', formattedRole);
          setUserRole(formattedRole);
        }
      }
      // Redirect from root based on real primary role
      if (pathname === "/") {
        const primary = getCurrentUserPrimaryRole();
        const dest = roleToPath[primary] || "/dashboard";
        router.replace(dest);
      }
    } catch (error) {
      console.error('Header error:', error);
    }
  }, [pathname]);

  if (pathname === "/login") return null;

  return (
    <header
      style={{
        width: "100%",
        background: "#000000",
        color: "#fff",
        padding: "10px 16px",
        boxShadow: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        borderBottom: "none",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img
          src="/gallery/ecsc.jpg"
          alt="FCSC Logo"
          style={{ height: 40, width: 40, objectFit: "cover", borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)' }}
        />
        {/* Home */}
        <a
          href="/"
          style={{
            color: "#fff",
            background: "transparent",
            textDecoration: "none",
            fontWeight: 600,
            padding: "8px 12px",
            borderRadius: 6,
            fontSize: "0.9rem",
            border: "1px solid rgba(255,255,255,0.4)",
            transition: "background 0.2s ease, color 0.2s ease, border-color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.background = "rgba(255,255,255,0.12)";
            (e.target as HTMLElement).style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.background = "transparent";
            (e.target as HTMLElement).style.color = "#fff";
          }}
        >
          Home
        </a>

        <span style={{ color: "rgba(255,255,255,0.7)" }}>|</span>

        {/* Workspace quick links */}
        <a
          href="/about"
          style={{
            color: "#fff",
            background: "transparent",
            textDecoration: "none",
            fontWeight: 600,
            padding: "8px 12px",
            borderRadius: 6,
            fontSize: "0.9rem",
            border: "1px solid rgba(255,255,255,0.4)",
            transition: "background 0.2s ease, color 0.2s ease, border-color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.background = "rgba(255,255,255,0.12)";
            (e.target as HTMLElement).style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.background = "transparent";
            (e.target as HTMLElement).style.color = "#fff";
          }}
        >
          About us
        </a>

        <span style={{ color: "rgba(255,255,255,0.7)" }}>|</span>

        <a
          href="/messages"
          style={{
            color: "#fff",
            background: "transparent",
            textDecoration: "none",
            fontWeight: 600,
            padding: "8px 12px",
            borderRadius: 6,
            fontSize: "0.9rem",
            border: "1px solid rgba(255,255,255,0.4)",
            transition: "background 0.2s ease, color 0.2s ease, border-color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.background = "rgba(255,255,255,0.12)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.background = "transparent";
          }}
        >
          Messages
        </a>

        <span style={{ color: "rgba(255,255,255,0.7)" }}>|</span>

        
      </div>

      {/* Right side: User menu */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <NotificationBell />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div style={{ color: "#fff", fontWeight: 600, fontSize: "0.9rem" }}>{displayName || "Signed In"}</div>
          {userRole && (
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem", fontWeight: 500 }}>
              {userRole}
            </div>
          )}
        </div>
        <button
          onClick={() => {
            clearAuthTokens();
            router.replace("/login");
          }}
          style={{
            background: "#ef4444",
            color: "#fff",
            border: "none",
            padding: "8px 12px",
            borderRadius: 6,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.background = "#dc2626";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.background = "#ef4444";
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}