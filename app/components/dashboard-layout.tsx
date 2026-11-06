"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { useEffect, useState, memo } from "react"
import { Menu, User, Users, BarChart3, Settings, Home, FileText, FormInput, MessageSquare, ClipboardList, BookOpen } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { Badge } from "@/app/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { cn } from "@/backend/lib/utils"
import { LanguageSelector } from "./language-selector"
import { getCurrentUserRoles } from "@/app/lib/auth"
import { useLocalization } from "@/app/hooks/use-localization"

interface DashboardLayoutProps {
  children: React.ReactNode
  showHeading?: boolean
}

const SidebarItem = memo(({ icon: Icon, href, label, onClick }: { icon: any; href: string; label: string; onClick?: () => void }) => {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
        isActive ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-sm">{label}</span>
    </Link>
  );
});

SidebarItem.displayName = "SidebarItem";

type SidebarItem = { icon: any; href: string; labelKey?: string; label?: string }

function buildSidebarItems(roles: string[]): SidebarItem[] {
  const base: SidebarItem[] = [
    { icon: FileText, href: "/reporting", labelKey: "nav.reporting" },
    // Removed Letters entry per request
    { icon: FormInput, href: "/feedback", labelKey: "feedback" },
    { icon: BarChart3, href: "/analytics", labelKey: "analytics" },
  ]

  // Add Complaints & Suggestions (visible to all)
  base.splice(2, 0, { icon: MessageSquare, href: "/submissions", labelKey: "nav.submissions" })

  // Add GM Submissions for gm/admin
  const lower = roles.map((r) => r.toLowerCase())
  if (lower.includes("commissioner") || lower.includes("admin")) {
    base.splice(3, 0, { icon: ClipboardList, href: "/gm/submissions", labelKey: "nav.gm_submissions" })
  }

  // Removed main Balanced Scorecard Automation entry ("/bcas") per request

  // Removed Asset Management items per request

  // User Manual (visible to all users)
  base.push({ icon: BookOpen, href: "/user-manual", label: "User Manual" })

  // IT Officer dashboard
  if (lower.includes("it_officer") || roles.includes("IT_Officer")) {
    base.splice(8, 0, { icon: ClipboardList, href: "/dashboard/it-officer", label: "IT Officer Dashboard" })
  }


  // BCAS entries (Performance)
  // Executive dashboard for executives/admin
  if (lower.includes("admin") || lower.includes("general_director") || lower.includes("manager")) {
    base.push({ icon: BarChart3, href: "/bcas/executive", labelKey: "nav.bcas_executive" })
  }
  // Manager drill-down for managers/admin
  if (lower.includes("admin") || lower.includes("manager") || lower.includes("department_head")) {
    base.push({ icon: BarChart3, href: "/bcas/manager", labelKey: "nav.bcas_manager" })
  }
  // Employee objectives for all employees
  
  // Admin KPI management for admin
  if (lower.includes("admin")) {
    base.push({ icon: Settings, href: "/bcas/admin/kpis", labelKey: "nav.bcas_admin" })
  }

  // Balanced Scorecard Automation standalone pages (role-based)
  // Executives & Leadership (mapped to general_director and admin)
  if (lower.includes("admin") || lower.includes("general_director")) {
    base.push({ icon: Home, href: "/bcas/overview", labelKey: "nav.bcas.overview" })
    base.push({ icon: BarChart3, href: "/bcas/strategy-overview", labelKey: "nav.bcas.strategy_overview" })
    base.push({ icon: FileText, href: "/bcas/performance-summary", labelKey: "nav.bcas.performance_summary" })
    base.push({ icon: FileText, href: "/bcas/reports", labelKey: "nav.bcas.reports" })
  }

  // Strategy/Performance Managers and Department Heads / Middle Managers
  if (lower.includes("manager") || lower.includes("department_head") || lower.includes("admin")) {
    base.push({ icon: FileText, href: "/bcas/strategic-objectives", labelKey: "nav.bcas.strategic_objectives" })
    base.push({ icon: BarChart3, href: "/bcas/scorecard-design", labelKey: "nav.bcas.scorecard_design" })
    base.push({ icon: ClipboardList, href: "/bcas/objective-cascading", labelKey: "nav.bcas.objective_cascading" })
    base.push({ icon: BarChart3, href: "/bcas/kpi-management", labelKey: "nav.bcas.kpi_management" })
    base.push({ icon: BarChart3, href: "/bcas/team-performance", labelKey: "nav.bcas.team_performance" })
  }

  // Cross-role analysis (Executives, Managers, Analysts)
  if (
    lower.includes("admin") ||
    lower.includes("general_director") ||
    lower.includes("manager") ||
    lower.includes("department_head") ||
    lower.includes("analyst")
  ) {
    base.push({ icon: BarChart3, href: "/bcas/performance-analysis", labelKey: "nav.bcas.performance_analysis" })
    base.push({ icon: BarChart3, href: "/bcas/kpi-configuration", labelKey: "nav.bcas.kpi_configuration" })
  }

  // Data Analysts / IT Teams
  if (lower.includes("analyst") || lower.includes("admin")) {
    base.push({ icon: BarChart3, href: "/bcas/analyst", labelKey: "nav.bcas.analyst" })
    base.push({ icon: FormInput, href: "/bcas/data-integration", labelKey: "nav.bcas.data_integration" })
    base.push({ icon: BarChart3, href: "/bcas/system-overview", labelKey: "nav.bcas.system_overview" })
  }

  // System Administrators
  if (lower.includes("admin")) {
    // Add User Management only for admins
    base.splice(2, 0, { icon: Users, href: "/users", labelKey: "nav.users" })
    // Permissions management
    base.push({ icon: Settings, href: "/permissions", label: "Permissions" })
    // Add Settings for admins
    base.push({ icon: Settings, href: "/settings", labelKey: "nav.settings" })
    base.push({ icon: Settings, href: "/bcas/system-administrator", labelKey: "nav.bcas.system_administrator" })
    base.push({ icon: Users, href: "/bcas/user-management", labelKey: "nav.bcas.user_management" })
    base.push({ icon: Settings, href: "/bcas/system-settings", labelKey: "nav.bcas.system_settings" })
    base.push({ icon: Users, href: "/bcas/all-user-overview", labelKey: "nav.bcas.all_user_overview" })
  }

  return base
}

export function DashboardLayout({ children, showHeading = true }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { language, setLanguage, t, languageConfig } = useLocalization()
  const pathname = usePathname()
  const [roles, setRoles] = useState<string[]>([])
  const sidebarItems = buildSidebarItems(roles)
  const [forceShowMenu, setForceShowMenu] = useState(false)

  useEffect(() => {
    setRoles(getCurrentUserRoles())
  }, [])

  const toggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed)
    window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { collapsed: !sidebarCollapsed } }))
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const sp = new URLSearchParams(window.location.search)
      setForceShowMenu(sp.get('menu') === '1')
    } catch {}
  }, [])

  useEffect(() => {
    const handleSidebarToggle = (e: CustomEvent) => {
      setSidebarCollapsed(e.detail.collapsed)
    }
    window.addEventListener('sidebar-toggle', handleSidebarToggle as EventListener)
    return () => {
      window.removeEventListener('sidebar-toggle', handleSidebarToggle as EventListener)
    };
  }, [])

  const hideOnThisPage = !forceShowMenu && sidebarItems.some((i) => pathname === i.href || pathname.startsWith(i.href + '/'))
  // Always hide the outer sidebar to avoid covering internal page navigation
  const hideOuterSidebar = true

  return (
    <div className="min-h-screen bg-background relative overflow-hidden" dir={languageConfig.direction}>
      {/* Watermark */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(-30deg)',
        fontSize: '4rem',
        fontWeight: 'bold',
        color: 'rgba(0, 0, 0, 0.05)',  /* Very light gray */
        pointerEvents: 'none',  /* Allows clicks to pass through */
        whiteSpace: 'nowrap',
        zIndex: 0,
        userSelect: 'none',
        width: '100%',
        textAlign: 'center',
        lineHeight: '1.2'
      }}>
      </div>
      {/* Sidebar disabled to prevent overlapping the internal navigation */}
      {!hideOnThisPage && !hideOuterSidebar && (
        <>
          {sidebarCollapsed ? (
            <aside
              className="fixed left-0 z-40 transition-all duration-300"
              style={{ background: "#135a98", top: 78, height: "calc(100vh - 78px)", width: 40 }}
            >
              <div className="flex h-full flex-col items-center py-2">
                <button
                  onClick={toggleCollapse}
                  className="p-2 text-white hover:bg-white/10 rounded transition"
                  title="Expand Sidebar"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </button>
              </div>
            </aside>
          ) : (
            <aside
              className={cn(
                "fixed left-0 z-40 transition-all duration-300",
                sidebarOpen ? "w-62.5" : "w-12",
                languageConfig.direction === "rtl" && "right-0 left-auto",
              )}
              style={{ background: "#135a98", top: 78, height: "calc(100vh - 78px)" }}
            >
              <div className="flex h-full flex-col">
                {/* Collapse button at top */}
                <div className="p-2 border-b border-white/10">
                  <button
                    onClick={toggleCollapse}
                    className="w-full flex items-center justify-center px-2 py-1 text-white hover:bg-white/10 rounded transition"
                    title="Collapse Sidebar"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="12" cy="5" r="1" />
                      <circle cx="12" cy="19" r="1" />
                    </svg>
                  </button>
                </div>
                {/* Navigation only (header removed as requested) */}
                <nav className="flex-1 p-0 space-y-0">
                  {sidebarItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <div key={item.href}>
                        <Link href={item.href}>
                          <Button
                            variant={isActive ? "default" : "ghost"}
                            size="lg"
                            className={cn(
                              "w-full justify-start gap-4 h-12 text-base rounded-none",
                              !sidebarOpen && "px-0",
                              // Base button color for sidebar items
                              "bg-[#135a98] text-white hover:bg-[#0f4e84] border-0",
                              // Active state subtle emphasis
                              isActive && "brightness-110",
                              languageConfig.direction === "rtl" && "flex-row-reverse",
                            )}
                          >
                            <item.icon className="w-6 h-6 shrink-0" />
                            {sidebarOpen && (
                              <span className="text-base">{item.labelKey ? t(item.labelKey) : item.label}</span>
                            )}
                          </Button>
                        </Link>
                      </div>
                    )
                  })}
                </nav>
              </div>
            </aside>
          )}
        </>
      )}

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300",
          (hideOnThisPage || hideOuterSidebar || sidebarCollapsed) ? "ml-0" : sidebarOpen ? "ml-62.5" : "ml-12",
          languageConfig.direction === "rtl" && ((hideOnThisPage || hideOuterSidebar || sidebarCollapsed) ? "mr-0 ml-0" : sidebarOpen ? "mr-62.5 ml-0" : "mr-12 ml-0"),
        )}
      >
        {/* Page Content */}
        <main className="px-7 pb-6 pt-0 relative">
          {/* Removed 'Back to menu' button per request */}
          {showHeading && (
            <div className="w-full">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0d47a1] mt-0 mb-2 text-left">

              </h1>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
