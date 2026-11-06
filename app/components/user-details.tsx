"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { Progress } from "@/app/components/ui/progress"
import { Mail, Building, Shield, Calendar, Clock, Ticket, CheckCircle, Edit, Lock, Unlock, Phone, User, X } from "lucide-react"
import { useToast } from "@/app/components/toast-provider"
import type { UserSummary, UserRole } from "@/app/lib/users-api"

interface UserDetailsProps {
  user: UserSummary & {
    lastLogin?: string
    ticketsAssigned?: number
    ticketsResolved?: number
  }
  onClose: () => void
}

export function UserDetails({ user, onClose }: UserDetailsProps) {
  const [language] = useState<"en" | "am">("en")
  const { show: toast } = useToast()
  const [resetting, setResetting] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "default"
      case "Inactive":
        return "secondary"
      case "Suspended":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return "secondary"
      case "Department_Head":
        return "default"
      case "Commissioner":
        return "destructive"
      case "END_USER":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const displayRole = (role: UserRole) => {
    const map: Partial<Record<UserRole, string>> = {
      ADMIN: "Admin",
      Department_Head: "Department Head",
      Commissioner: "Commissioner",
      END_USER: "End User",
      Driver: "Driver",
      Maintenace_Team: "Maintenance Team",
      Announcement_Creator: "Announcement Creator",
      Women_Social_Inclusion: "Women Social Inclusion",
      Ethics_Anti_Corruption: "Ethics Anti-Corruption",
      IT_Officer: "IT Officer",
      Finance_Department: "Finance Department",
      Vehicle_Inspector: "Vehicle Inspector",
    }
    return map[role] || role
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getSuccessRate = () => {
    if (!user.ticketsAssigned || !user.ticketsResolved) return 0
    return Math.round((user.ticketsResolved / user.ticketsAssigned) * 100)
  }

  const onResetPassword = async () => {
    if (!user?.email) return
    try {
      setResetting(true)
      const resp = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) throw new Error(data?.message || "Request failed")
      toast({
        variant: "success",
        title: language === "en" ? "Reset email sent" : "የይለፍ ቃል ዳግም መቀየር ኢሜይል ተልኳል",
        description: language === "en" ? "The user will receive a reset link via email." : "ተጠቃሚው በኢሜይል የማስታወሻ አገናኝ ይቀበላል።",
      })
    } catch (e: any) {
      toast({ variant: "destructive", title: language === "en" ? "Failed to reset" : "ማደስ አልተሳካም", description: e?.message })
    } finally {
      setResetting(false)
    }
  }

  const name = `${user.firstName} ${user.lastName}`.trim()
  const statusLabel = user.isActive ? "Active" : "Inactive"
  const userTypeLabel = user.userType === "INTERNAL" ? (language === "en" ? "Internal" : "ውስጣዊ") : (language === "en" ? "External" : "ውጫዊ")

  const permissions = [
    { key: "canCreateTickets", label: language === "en" ? "Create Tickets" : "ቲኬቶች መፍጠር", granted: true },
    {
      key: "canAssignTickets",
      label: language === "en" ? "Assign Tickets" : "ቲኬቶች መመደብ",
      granted: !user.roles.includes("END_USER"),
    },
    {
      key: "canManageUsers",
      label: language === "en" ? "Manage Users" : "ተጠቃሚዎችን አስተዳደር",
      granted: user.roles.some(r => ["GENERAL_DIRECTOR", "ADMIN"].includes(r)),
    },
    {
      key: "canAccessReports",
      label: language === "en" ? "Access Reports" : "ሪፖርቶች መድረስ",
      granted: !user.roles.includes("END_USER"),
    },
    {
      key: "canManageKnowledgeBase",
      label: language === "en" ? "Manage Knowledge Base" : "የእውቀት ቤዝ አስተዳደር",
      granted: user.roles.some(r => ["GENERAL_DIRECTOR", "STAFF_MANAGER", "ADMIN"].includes(r)),
    },
    {
      key: "canViewAllTickets",
      label: language === "en" ? "View All Tickets" : "ሁሉንም ቲኬቶች መመልከት",
      granted: !user.roles.includes("END_USER"),
    },
  ]

  return (
    <div className="space-y-6 max-h-[85vh] overflow-y-auto">
      {/* Header with Close Button */}
      <div className="flex items-start justify-between sticky top-0 bg-background pb-4 pt-1">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Avatar className="w-14 h-14 shrink-0">
            <AvatarImage src={`/ceholder-svg-key-mo6mb.jpg?key=mo6mb&height=64&width=64`} />
            <AvatarFallback className="text-base font-medium">
              {name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold font-(family-name:--font-playfair) truncate">{name}</h2>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {user.roles && user.roles.length > 0 ? (
                user.roles.map((role) => (
                  <Badge key={role} variant="outline" className="text-xs">
                    {displayRole(role as UserRole)}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline" className="text-xs">-</Badge>
              )}
              <Badge variant={getStatusColor(statusLabel)} className="text-xs">
                {statusLabel}
              </Badge>
              <Badge variant={user.userType === "INTERNAL" ? "default" : "secondary"} className="text-xs">
                {userTypeLabel}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex gap-2 shrink-0 ml-2">
          <Button 
            variant="outline" 
            size="sm"
            className="h-9 px-3"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left Column - User Information */}
        <div className="xl:col-span-2 space-y-4">
          {/* Basic Information Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                {language === "en" ? "Basic Information" : "መሰረታዊ መረጃ"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {language === "en" ? "Email Address" : "ኢሜይል አድራሻ"}
                  </label>
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                </div>

                {user.phone && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      {language === "en" ? "Phone Number" : "ስልክ ቁጥር"}
                    </label>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{user.phone}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {language === "en" ? "Department" : "ክፍል"}
                  </label>
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{user.department}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {language === "en" ? "Account Created" : "መለያ የተፈጠረበት"}
                  </label>
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(user.createdAt)}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {language === "en" ? "Last Login" : "የመጨረሻ መግቢያ"}
                  </label>
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{user.lastLogin ? formatDate(user.lastLogin) : "Never"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics (for Support Agents) */}
          {user.ticketsAssigned !== undefined && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Ticket className="w-4 h-4" />
                  {language === "en" ? "Performance Metrics" : "የአፈጻጸም መለኪያዎች"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-700">{user.ticketsAssigned}</div>
                    <p className="text-xs text-blue-600 font-medium">
                      {language === "en" ? "Assigned" : "የተመደቡ"}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-700">{user.ticketsResolved}</div>
                    <p className="text-xs text-green-600 font-medium">
                      {language === "en" ? "Resolved" : "የተፈቱ"}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-xl font-bold text-purple-700">{getSuccessRate()}%</div>
                    <p className="text-xs text-purple-600 font-medium">
                      {language === "en" ? "Success Rate" : "የስኬት መጠን"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{language === "en" ? "Resolution Rate" : "የመፍትሄ መጠን"}</span>
                    <span className="font-semibold">{getSuccessRate()}%</span>
                  </div>
                  <Progress value={getSuccessRate()} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Permissions & Actions */}
        <div className="space-y-4">
          {/* Permissions Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {language === "en" ? "Permissions" : "ፈቃዶች"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {permissions.map((permission) => (
                <div key={permission.key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-sm flex-1">{permission.label}</span>
                  {permission.granted ? (
                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0 ml-2" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0 ml-2" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}