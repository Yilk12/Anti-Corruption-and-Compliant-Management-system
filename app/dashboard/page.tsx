"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/app/components/auth-guard";
import { getCurrentUserPrimaryRole, getCurrentUserRoles, readToken, decodeJwt } from "@/app/lib/auth";

export default function DashboardRouterPage() {
  const router = useRouter();
  const hasRedirectedRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || hasRedirectedRef.current) return;

    const primary = getCurrentUserPrimaryRole();
    const roles = getCurrentUserRoles();
    let target = "/dashboard/end-user";

    // Check for IT_Officer role directly from token
    const token = readToken();
    let hasITOfficerRole = false;
    let hasEthicsOfficerRole = false;
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded) {
        const roleString = decoded.role || "";
        if (roleString === "IT_Officer" || roleString === "it_officer") {
          hasITOfficerRole = true;
        }
        if (roleString === "Ethics_Officer" || roleString === "ethics_officer") {
          hasEthicsOfficerRole = true;
        }
        if (Array.isArray(decoded.roles)) {
          if (decoded.roles.includes("IT_Officer")) {
            hasITOfficerRole = true;
          }
          if (decoded.roles.includes("Ethics_Officer")) {
            hasEthicsOfficerRole = true;
          }
        }
      }
    }

    if (hasITOfficerRole || primary === "it_officer") {
      target = "/dashboard/it-officer";
    } else if (hasEthicsOfficerRole || primary === "ethics_officer") {
      target = "/dashboard/ethics-officer";
    } else if (primary === "administrative_complaints_team") {
      target = "/dashboard/administrative-complaints-team";
    } else if (primary === "admin") target = "/dashboard/admin";
    else if (primary === "commissioner") target = "/dashboard/Commissioner";
    else if (primary === "department_head") target = "/dashboard/department-head";
    else if (primary === "maintenance_team") target = "/maintenance-team/";
    else if (primary === "asset_manager") target = "/dashboard/asset-manager";
    else if (primary === "asset_officer") target = "/dashboard/asset-officer";
    else if (primary === "asset_control_registration_officer") target = "/dashboard/asset-control-and-registration-officer";
    else if (primary === "vehicle_inspector") target = "/dashboard/vehicle-inspector";

    hasRedirectedRef.current = true;
    router.replace(target);
  }, [router, mounted]);

  // Render minimal protected shell while redirecting
  return (
    <AuthGuard>
      <div className="p-6 text-gray-600">Redirecting to your dashboard…</div>
    </AuthGuard>
  );
}