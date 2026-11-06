"use client";
import React, { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getCurrentUserRoles } from "@/app/lib/auth"
import {
  Megaphone,
  MessageSquare,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Package,
  Users,
  FileText,
  FileCheck,
  Settings,
  LogOut,
  Trash2,
  Building2,
  Clock,
  CheckCircle,
  AlertTriangle,
  BookOpen, 
  MapPin, 
  Plus,
  Shield,
  ClipboardList,
  Inbox,
  Home,
  FormInput,
  BarChart3
} from "lucide-react";
import { useLocalization } from "@/app/hooks/use-localization";

export default function VerticalNavigation() {
  const router = useRouter();
  const { t } = useLocalization();

  // Collapse states
  const [subOpen, setSubOpen] = useState(false);
  const [wfOpen, setWfOpen] = useState(false);

  // User role flags with loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDeptHead, setIsDeptHead] = useState(false);
  const [isTeamLead, setIsTeamLead] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);
  const [isHr, setIsHr] = useState(false);
  const [isCommissioner, setIsCommissioner] = useState(false);
  const [isEthicsOfficer, setIsEthicsOfficer] = useState(false);
  const [isEthicsAntiCorruption, setIsEthicsAntiCorruption] = useState(false);
  const [isFeedbackComplaintManager, setIsFeedbackComplaintManager] = useState(false);
  const [isFeedbackComplaintOfficer, setIsFeedbackComplaintOfficer] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ethics counts
  const [complaintsCount, setComplaintsCount] = useState(0);
  const [investigationsCount, setInvestigationsCount] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      // Get roles from JWT and normalize to lowercase for consistent checks
      const roles = getCurrentUserRoles()?.map((r) => String(r).toLowerCase()) || [];

      setIsAdmin(roles.includes("admin"));
      setIsDeptHead(roles.includes("department_head"));
      // Team lead is represented by leadership in normalized roles
      setIsTeamLead(roles.includes("team_lead") || roles.includes("manager"));
      // Treat driver and maintenance_team as employees for menu visibility
      setIsEmployee(
        roles.includes("employee") ||
        roles.includes("driver") ||
        roles.includes("maintenance_team")
      );
      setIsHr(roles.includes("hr"));
      setIsCommissioner(
        roles.includes("commissioner") ||
        roles.includes("commissionor")
      );
      setIsEthicsOfficer(roles.includes("ethics_officer"));
      setIsEthicsAntiCorruption(roles.includes("ethics_anti_corruption"));
      setIsFeedbackComplaintManager(roles.includes("feedback_complaint_manager"));
      setIsFeedbackComplaintOfficer(roles.includes("feedback_complaint_officer"));
    } catch (error) {
      console.error("Error loading user roles:", error);
    } finally {
      setIsLoading(false);
    }
  }, [mounted]);

  // Fetch ethics counts
  useEffect(() => {
    if (!mounted || !isEthicsOfficer && !isEthicsAntiCorruption && !isFeedbackComplaintManager && !isFeedbackComplaintOfficer) return;

    const fetchEthicsCounts = async () => {
      try {
        const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

        // Fetch complaints count
        const complaintsRes = await fetch("http://localhost:4000/api/ethics/anticorruption/reports", { headers });
        if (complaintsRes.ok) {
          const complaintsData = await complaintsRes.json();
          const reports = Array.isArray(complaintsData) ? complaintsData : (complaintsData.reports || []);
          setComplaintsCount(reports.length);
        }

        // Fetch investigations count
        const investigationsRes = await fetch("http://localhost:4000/api/ethics/investigations", { headers });
        if (investigationsRes.ok) {
          const investigationsData = await investigationsRes.json();
          setInvestigationsCount(Array.isArray(investigationsData) ? investigationsData.length : 0);
        }
      } catch (error) {
        console.error("Error fetching ethics counts:", error);
      }
    };

    fetchEthicsCounts();
  }, [mounted, isEthicsOfficer, isEthicsAntiCorruption]);


  useEffect(() => { console.log('is commissioner (state)', isCommissioner); }, [isCommissioner]);

  // Return null while loading to prevent flash of unauthorized content
  if (isLoading || !mounted) {
    return null;
  }

  return (
    <nav
      style={{
        width: "100%",
        height: "100%",
        background: "#0E3561",
        boxSizing: "border-box",
        padding: "8px",
      }}
    >
        {/* Dashboard Button */}
        <div
          onClick={() => {
            if (isCommissioner) {
              router.push("/dashboard/Commissioner");
            } else if (isFeedbackComplaintManager) {
              router.push("/dashboard/feedback-complaint-manager");
            } else if (isFeedbackComplaintOfficer) {
              router.push("/dashboard/feedback-complaint-officer");
            } else if (isEthicsOfficer || isEthicsAntiCorruption) {
              router.push("/dashboard/ethics-anti-corruption");
            } else {
              router.push("/feedback/complaints/approved");
            }
          }}
          style={{
            width: "100%",
            color: "white",
            padding: "12px 16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Home size={18} />
          <span style={{ flex: 1, fontSize: 15 }}>Dashboard</span>
        </div>

        {/* Feedback and Complaint Management Items */}
        <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
          <div
            onClick={() => router.push("/guest-anticorruption")}
            style={{
              width: "100%",
              color: "white",
              padding: "12px 16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Shield size={18} />
            <span style={{ flex: 1, fontSize: 15 }}>Ethics and Anti Corruption</span>
          </div>

          <div
            onClick={() => router.push("/guest-feedback")}
            style={{
              width: "100%",
              color: "white",
              padding: "12px 16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <MessageSquare size={18} />
            <span style={{ flex: 1, fontSize: 15 }}>Feedback and Complaints</span>
          </div>

          <div
            onClick={() => router.push("/ethics/policies")}
            style={{
              width: "100%",
              color: "white",
              padding: "12px 16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <BookOpen size={18} />
            <span style={{ flex: 1, fontSize: 15 }}>Ethics and Policies</span>
          </div>
        </div>

        {/* Admin Sections */}
        {(isAdmin || isHr) && (
          <div
            onClick={() => router.push("/users")}
            style={{
              width: "100%",
              color: "white",
              padding: "12px 16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8
            }}
          >
            <span>{t("nav.users")}</span>
          </div>
        )}
    </nav>
  );
}
