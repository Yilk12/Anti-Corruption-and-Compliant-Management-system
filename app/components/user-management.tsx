"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { getCurrentUserRoles, getCurrentUserId } from "@/app/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Input } from "@/app/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import { Plus, Search, Filter, Eye, Edit, Trash2, Shield, Users, UserCheck, Building, Key, Mail, MoreVertical, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/app/components/toast-provider"
import { UserForm } from "./user-form"
import { DepartmentForm } from "@/app/components/department-form"
import { UserDetails } from "./user-details"
import { usersApi } from "@/app/lib/users-api"
import type { UserSummary, UserRole } from "@/app/lib/users-api"

type UserRow = UserSummary & { modulePermissions?: Record<string, string[]> }

const mockUsers: UserRow[] = []

export function UserManagement() {
  const [language] = useState<"en" | "am">("en")
  const [users, setUsers] = useState<UserRow[]>(mockUsers)
  const [usersLoading, setUsersLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all")
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [deptDialogOpen, setDeptDialogOpen] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editUser, setEditUser] = useState<UserRow | null>(null)
  const { show: toast } = useToast()
  const roles = getCurrentUserRoles().map(r=>r.toLowerCase())
  const isAdmin = roles.includes("admin") || roles.includes("bsc admin")
  const [adminViewAll, setAdminViewAll] = useState<boolean>(true)
  const [usersMenuOpen, setUsersMenuOpen] = useState(false)
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false)
  const [mobileView, setMobileView] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(5);

  // Check screen size for responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      setMobileView(window.innerWidth < 768)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const currentUserId = useMemo(() => getCurrentUserId(), [])
  const filteredUsers = useMemo(() => {
    const scope = (isAdmin && adminViewAll)
      ? users
      : users.filter(u => u.id === currentUserId)

    const filtered = scope.filter(user => {
      const matchesSearch = 
        searchTerm === '' ||
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesRole = roleFilter === 'all' || user.roles?.some(r => r.toLowerCase() === roleFilter.toLowerCase())
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive)
      const matchesUserType = userTypeFilter === 'all' || user.userType?.toLowerCase() === userTypeFilter.toLowerCase()

      return matchesSearch && matchesRole && matchesStatus && matchesUserType
    })

    return filtered
  }, [users, isAdmin, adminViewAll, currentUserId, searchTerm, roleFilter, statusFilter, userTypeFilter])

  // Pagination logic
  const getCurrentUsers = () => {
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    return filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  };

  // Reset to page 1 when filters change (not when just switching pages)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, userTypeFilter, adminViewAll, users.length]);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "default" : "secondary"
  }

  const displayRoles = (roles: string[]) => {
    if (!roles || roles.length === 0) return "-"
    return roles.join(", ")
  }

  const displayRole = (role: UserRole) => {
    const roleMap: Partial<Record<UserRole, string>> = {
      ADMIN: language === "en" ? "Admin" : "አስተዳዳሪ",
      Department_Head: language === "en" ? "Department Head" : "የክፍል ኃላፊ",
      Commissioner: language === "en" ? "Commissioner" : "ኮሚሽነር",
      END_USER: language === "en" ? "End User" : "የመጨረሻ ተጠቃሚ",
      Driver: language === "en" ? "Driver" : "ሹፌር",
      Maintenace_Team: language === "en" ? "Maintenance Team" : "የጥገና ቡድን",
      Announcement_Creator: language === "en" ? "Announcement Creator" : "የመረጃ ማስታወቂያ ፈጣሪ",
      Women_Social_Inclusion: language === "en" ? "Women Social Inclusion" : "የሴቶች ማህበራዊ አካባቢ",
      Ethics_Anti_Corruption: language === "en" ? "Ethics Anti-Corruption" : "ስርዓተ ስርዓት እና ሙስና መከላከያ",
      IT_Officer: language === "en" ? "IT Officer" : "የአይቲ ኃላፊ",
      Finance_Department: language === "en" ? "Finance Department" : "የፋይናንስ ክፍል",
      Vehicle_Inspector: language === "en" ? "Vehicle Inspector" : "የመኪና ፈተና",
      Administrative_Complaints_Team: language === "en" ? "Administrative Complaints Team" : "የአስተዳደራዊ ቅሬታ ቡድን",
    }
    return roleMap[role] || role
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
      default:
        return "secondary"
    }
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

  const getUserStats = () => {
    const total = users.length
    const active = users.filter((u) => u.isActive).length
    const internal = users.filter((u) => u.userType === "INTERNAL").length

    return { total, active, internal }
  }

  const stats = getUserStats()

  // Helpers for exporting the current filtered users list
  const buildUsersTableRows = () =>
    filteredUsers.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      firstNameAm: u.firstNameAm || "",
      lastNameAm: u.lastNameAm || "",
      email: u.email,
      phone: u.phone || "",
      employeeId: u.employeeId || "",
      position: u.position || "",
      role: u.roles.join(", "),
      userType: u.userType,
      department: u.department || "",
      status: u.isActive ? "Active" : "Inactive",
      createdAt: u.createdAt,
    }))

  // Export users (current filtered list) to CSV that can be opened in Excel
  const handleExportUsersCsv = (fileNameBase?: string) => {
    if (!filteredUsers.length) {
      toast({
        variant: "destructive",
        title: language === "en" ? "No users to export" : "ለማውጣት ተጠቃሚ የለም",
      })
      return
    }

    const headers = [
      "ID",
      "First Name",
      "Last Name",
      "First Name (Am)",
      "Last Name (Am)",
      "Email",
      "Phone",
      "Employee ID",
      "Position",
      "Role",
      "User Type",
      "Department",
      "Status",
      "Created At",
    ]

    const rows = buildUsersTableRows().map((u) => [
      u.id,
      u.firstName,
      u.lastName,
      u.firstNameAm,
      u.lastNameAm,
      u.email,
      u.phone,
      u.employeeId,
      u.position,
      u.role,
      u.userType,
      u.department,
      u.status,
      u.createdAt,
    ])

    const escapeCsv = (value: unknown) => {
      const str = String(value ?? "")
      if (/[",\n]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"'
      }
      return str
    }

    const csvContent = [
      headers.map(escapeCsv).join(","),
      ...rows.map((r) => r.map(escapeCsv).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    const base =
      fileNameBase || (language === "en" ? "users-list" : "የተጠቃሚዎች_ዝርዝር")
    link.setAttribute("download", `${base}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      variant: "success",
      title: language === "en" ? "Export started" : "መርገጫ ተጀምሯል",
    })
  }

  // Export to Word (simple HTML table, saved as .doc that Word can open)
  const handleExportUsersDoc = () => {
    if (!filteredUsers.length) {
      toast({
        variant: "destructive",
        title: language === "en" ? "No users to export" : "ለማውጣት ተጠቃሚ የለም",
      })
      return
    }

    const rows = buildUsersTableRows()
    const htmlRows = rows
      .map(
        (u) =>
          `<tr>
            <td>${u.firstNameAm && u.lastNameAm ? `${u.firstNameAm} ${u.lastNameAm}` : `${u.firstName} ${u.lastName}`}</td>
            <td>${u.email}</td>
            <td>${u.phone}</td>
            <td>${u.employeeId}</td>
            <td>${u.position}</td>
            <td>${u.role}</td>
            <td>${u.userType}</td>
            <td>${u.department}</td>
            <td>${u.status}</td>
            <td>${u.createdAt}</td>
          </tr>`
      )
      .join("")

    const html = `<!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>Users List</title></head>
      <body>
        <h2>Users List</h2>
        <table border="1" cellspacing="0" cellpadding="4">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Employee ID</th>
              <th>Position</th>
              <th>Role</th>
              <th>User Type</th>
              <th>Department</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            ${htmlRows}
          </tbody>
        </table>
      </body></html>`

    const blob = new Blob([html], { type: "application/msword" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const fileName = language === "en" ? "users-list.doc" : "የተጠቃሚዎች_ዝርዝር.doc"
    link.href = url
    link.setAttribute("download", fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      variant: "success",
      title: language === "en" ? "Word export started" : "ወደ Word መርገጫ ተጀምሯል",
    })
  }

  // Open a print-friendly window so the user can "Save as PDF" from the browser
  const handleExportUsersPrintPdf = () => {
    if (!filteredUsers.length) {
      toast({
        variant: "destructive",
        title: language === "en" ? "No users to export" : "ለማውጣት ተጠቃሚ የለም",
      })
      return
    }

    const rows = buildUsersTableRows()
    const htmlRows = rows
      .map(
        (u) =>
          `<tr>
            <td>${u.firstNameAm && u.lastNameAm ? `${u.firstNameAm} ${u.lastNameAm}` : `${u.firstName} ${u.lastName}`}</td>
            <td>${u.email}</td>
            <td>${u.phone}</td>
            <td>${u.employeeId}</td>
            <td>${u.position}</td>
            <td>${u.role}</td>
            <td>${u.userType}</td>
            <td>${u.department}</td>
            <td>${u.status}</td>
            <td>${u.createdAt}</td>
          </tr>`
      )
      .join("")

    const html = `<!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>Users List</title>
      <style>
        body { font-family: sans-serif; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ccc; padding: 4px; font-size: 12px; }
        th { background: #f5f5f5; }
      </style>
      </head>
      <body>
        <h2>Users List</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Employee ID</th>
              <th>Position</th>
              <th>Role</th>
              <th>User Type</th>
              <th>Department</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            ${htmlRows}
          </tbody>
        </table>
      </body></html>`

    const printWindow = window.open("", "_blank")
    if (!printWindow) return
    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  // Load users from API
  useEffect(() => {
    let cancelled = false
    let isMounted = true

    const load = async () => {
      setUsersLoading(true)
      try {
        const res = await usersApi.list({ limit: 100 })
        if (cancelled || !isMounted) return
        const usersData = res.users || []
        setUsers(usersData)
      } catch (error) {
        console.error("Failed to load users:", error)
        if (isMounted) {
          toast({
            variant: 'destructive',
            title: language === 'en' ? 'Failed to load users' : 'ተጠቃሚዎችን መጫን አልተሳካም',
          })
        }
      } finally {
        if (isMounted) {
          setUsersLoading(false)
        }
      }
    }
    load()
    return () => {
      cancelled = true
      isMounted = false
    }
  }, [])

  // Delete user function
const handleDeleteUser = async (userId: string) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/users/${userId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.message || `Failed to delete user: ${response.status}`);
    }

    toast({
      variant: 'success',
      title: language === 'en' ? 'User deleted successfully' : 'ተጠቃሚ በትክክል ተሰርዟል',
    });

    // Refresh the user list
    const res = await usersApi.list({ limit: 100 });
    setUsers(res.users || []);
  } catch (error: any) {
    console.error("Failed to delete user:", error);
    toast({
      variant: 'destructive',
      title: language === 'en' ? 'Failed to delete user' : 'ተጠቃሚን ማስወገድ አልተሳካም',
      description: error?.message,
    });
  }
};


  // Reset password function
  const handleResetPassword = async (userEmail: string) => {
    try {
      const resp = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) throw new Error(data?.message || 'Failed')
      toast({ 
        variant: 'success', 
        title: language === 'en' ? 'Reset email sent' : 'የይለፍ ቃል ኢሜይል ተልኳል' 
      })
    } catch (e: any) {
      toast({ 
        variant: 'destructive', 
        title: language === 'en' ? 'Failed to reset' : 'ማደስ አልተሳካም', 
        description: e?.message 
      })
    }
  }

  // Display module permissions
  const renderModulePermissions = (modulePermissions: Record<string, string[]> | undefined) => {
    if (!modulePermissions || Object.keys(modulePermissions).length === 0) {
      return (
        <span className="text-sm text-muted-foreground">
          {language === "en" ? "No permissions" : "ፈቃዶች የሉም"}
        </span>
      )
    }

    return (
      <div className="space-y-1">
        {Object.entries(modulePermissions).map(([module, permissions]) => (
          <div key={module} className="text-xs">
            <span className="font-medium capitalize">{module}:</span>
            <span className="text-muted-foreground ml-1">
              {permissions.join(', ')}
            </span>
          </div>
        ))}
      </div>
    )
  }

  // Mobile user card view
  const UserCard = ({ user }: { user: UserRow }) => (
    <Card
      className={`mb-4 cursor-pointer transition-all hover:shadow-md ${
        selectedUser?.id === user.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      }`}
      onClick={() => setSelectedUser(user)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg">
              {user.firstNameAm && user.lastNameAm ? `${user.firstNameAm} ${user.lastNameAm}` : `${user.firstName} ${user.lastName}`}
            </h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Badge variant={getStatusColor(user.isActive)}>
            {user.isActive 
              ? (language === "en" ? "Active" : "ንቁ")
              : (language === "en" ? "Inactive" : "ንቁ ያልሆነ")
            }
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div>
            <span className="font-medium">{language === "en" ? "Role:" : "ሚና:"}</span>
            <Badge variant="outline" className="ml-2">
              {displayRoles(user.roles)}
            </Badge>
          </div>
          <div>
            <span className="font-medium">{language === "en" ? "Type:" : "አይነት:"}</span>
            <Badge variant={user.userType === "INTERNAL" ? "default" : "secondary"} className="ml-2">
              {user.userType === "INTERNAL"
                ? (language === "en" ? "Internal" : "ውስጣዊ")
                : (language === "en" ? "External" : "ውጫዊ")
              }
            </Badge>
          </div>
          <div>
            <span className="font-medium">{language === "en" ? "Position:" : "ስራ:"}</span>
            <span className="ml-2">{user.position || "-"}</span>
          </div>
          <div className="col-span-2">
            <span className="font-medium">{language === "en" ? "Department:" : "ክፍል:"}</span>
            <span className="ml-2">{user.department}</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            {formatDate(user.createdAt)}
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedUser(user)
                setShowDetailsDialog(true)
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
            {isAdmin && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditUser(user)
                    setShowEditDialog(true)
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedUserId(user.id);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6 pt-8 md:pt-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-primary font-(family-name:--font-playfair)">
            {language === "en" ? "User Management" : "የተጠቃሚ አስተዳደር"}
          </h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            {language === "en"
              ? "Manage user accounts, roles, and permissions across the system"
              : "በሲስተሙ ውስጥ የተጠቃሚ መለያዎችን፣ ሚናዎችን እና ፈቃዶችን ያስተዳድሩ"}
          </p>
          {isAdmin && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <input 
                id="adminViewAll" 
                type="checkbox" 
                className="accent-blue-600" 
                checked={adminViewAll} 
                onChange={(e)=>setAdminViewAll(e.target.checked)} 
              />
              <label htmlFor="adminViewAll" className="cursor-pointer">
                {language === "en" ? "Admin: View all user statuses (bypass filters)" : "አስተዳዳሪ፡ ሁሉንም የተጠቃሚ ሁኔታዎች አሳይ"}
              </label>
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="relative self-start md:self-auto">
            <Button className="gap-2 w-full md:w-auto" onClick={()=>setActionsOpen(v=>!v)}>
              <Plus className="w-4 h-4" />
              {language === "en" ? "Register" : "መመዝገብ"}
            </Button>
            {actionsOpen && (
              <div className="absolute right-0 md:right-auto mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-50 p-2">
                <Link href="/users/create">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    {language === 'en' ? 'Add New User' : 'አዲስ ተጠቃሚ ጨምር'}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={()=>{ setDeptDialogOpen(true); setActionsOpen(false) }}
                >
                  {language === 'en' ? 'Register Department' : 'ክፍል መመዝገብ'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <Card className="bg-linear-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === "en" ? "Total Users" : "ጠቅላላ ተጠቃሚዎች"}
            </CardTitle>
            <Users className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-green-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === "en" ? "Active Users" : "ንቁ ተጠቃሚዎች"}
            </CardTitle>
            <UserCheck className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm md:text-base">
            <Filter className="h-4 w-4" />
            {language === "en" ? "Filters" : "ማጣሪያዎች"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={language === "en" ? "Search users..." : "ተጠቃሚዎችን ይፈልጉ..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:flex md:gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full text-sm md:w-32">
                  <SelectValue placeholder={language === "en" ? "Role" : "ሚና"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "en" ? "All Roles" : "ሁሉም"}</SelectItem>
                  <SelectItem value="Commissioner">{language === "en" ? "Commissioner" : "ኮሚሽነር"}</SelectItem>
                  <SelectItem value="ADMIN">{language === "en" ? "Admin" : "አስተዳዳሪ"}</SelectItem>
                  <SelectItem value="END_USER">{language === "en" ? "User" : "ተጠቃሚ"}</SelectItem>
                  <SelectItem value="Department_Head">{language === "en" ? "Dept Head" : "ክፍል"}</SelectItem>
                  <SelectItem value="Feedback_Complaint_Manager">{language === "en" ? "Feedback & Complaint Manager" : "የግብር እና ቅሬታ አስተዳዳሪ"}</SelectItem>
                  <SelectItem value="Feedback_Complaint_Officer">{language === "en" ? "Feedback & Complaint Officer" : "የግብር እና ቅሬታ ኃላፊ"}</SelectItem>
                  <SelectItem value="Ethics_Anti_Corruption">{language === "en" ? "Ethics Anti-Corruption" : "ስርዓተ ስርዓት እና ሙስና መከላከያ"}</SelectItem>
                  <SelectItem value="Ethics_Officer">{language === "en" ? "Ethics Officer" : "የስርዓት ኃላፊ"}</SelectItem>
                  <SelectItem value="Asset_Manager">{language === "en" ? "Asset Manager" : "የንብረት አስተዳዳሪ"}</SelectItem>
                  <SelectItem value="Asset_Officer">{language === "en" ? "Asset Officer" : "የንብረት ኃላፊ"}</SelectItem>
                  <SelectItem value="Asset_Control_Registration_Officer">{language === "en" ? "Asset Control & Registration Officer" : "የንብረት ቁጠባ እና ምዝግብ ኃላፊ"}</SelectItem>
                  <SelectItem value="IT_Officer">{language === "en" ? "IT Officer" : "የአይቲ ኃላፊ"}</SelectItem>
                  <SelectItem value="Administrative_Complaints_Team">{language === "en" ? "Administrative Complaints Team" : "የአስተዳደራዊ ቅሬታ ቡድን"}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full text-sm md:w-28">
                  <SelectValue placeholder={language === "en" ? "Status" : "ሁኔታ"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "en" ? "All" : "ሁሉም"}</SelectItem>
                  <SelectItem value="Active">{language === "en" ? "Active" : "ንቁ"}</SelectItem>
                  <SelectItem value="Inactive">{language === "en" ? "Inactive" : "እንቅስቃሴ"}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                <SelectTrigger className="w-full text-sm md:w-28">
                  <SelectValue placeholder={language === "en" ? "Type" : "አይነት"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "en" ? "All" : "ሁሉም"}</SelectItem>
                  <SelectItem value="INTERNAL">{language === "en" ? "Internal" : "ውስጣዊ"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table/Cards */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-linear-to-r from-gray-50 to-white pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative">
              <Button
                className="px-4 bg-linear-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md"
                onClick={()=>{ setUsersMenuOpen(v=>!v); setActionsMenuOpen(false) }}
              >
                <Download className="w-4 h-4 mr-2" />
                {language === "en" ? "Users List" : "የተጠቃሚዎች ዝርዝር"}
              </Button>
              {usersMenuOpen && (
                <div className="absolute mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-xl z-10 py-1">
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                    onClick={() => {
                      handleExportUsersPrintPdf()
                      setUsersMenuOpen(false)
                    }}
                  >
                    Export PDF
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                    onClick={() => {
                      handleExportUsersCsv("users-list")
                      setUsersMenuOpen(false)
                    }}
                  >
                    Export XLS
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                    onClick={() => {
                      handleExportUsersCsv("users-list")
                      setUsersMenuOpen(false)
                    }}
                  >
                    Export XLSX
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                    onClick={() => {
                      handleExportUsersDoc()
                      setUsersMenuOpen(false)
                    }}
                  >
                    Export DOCX
                  </button>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm" onClick={()=>{ /* TODO: implement RTF export */ setUsersMenuOpen(false) }}>Export RTF</button>
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                    onClick={() => {
                      handleExportUsersCsv("users-list")
                      setUsersMenuOpen(false)
                    }}
                  >
                    Export CSV
                  </button>
                </div>
              )}
            </div>
            {isAdmin && (
              <div className="relative">
                <Button
                  className="px-4 bg-linear-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-md"
                  onClick={()=>{ setActionsMenuOpen(v=>!v); setUsersMenuOpen(false) }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {language === 'en' ? 'Register' : 'መመዝገብ'}
                </Button>
                {actionsMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-10 py-1">
                    <button
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                      onClick={() => {
                        if (!selectedUser?.email) return toast({ variant: 'destructive', title: language==='en'?'Select a user first':'አንድ ተጠቃሚ ይምረጡ' })
                        handleResetPassword(selectedUser.email)
                        setActionsMenuOpen(false)
                      }}
                    >
                      <Key className="w-4 h-4" />
                      {language === 'en' ? 'Reset Password' : 'የይለፍ ቃል ዳግም አስተካክል'}
                    </button>
                    <Link href="/admin/secret-code-management">
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                        onClick={() => {
                          setActionsMenuOpen(false)
                        }}
                      >
                        <Shield className="w-4 h-4" />
                        {language === 'en' ? 'Secret Code Management' : 'የሚስጥር ኮድ አስተዳደር'}
                      </button>
                    </Link>
                    <button
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                      onClick={() => {
                        if (!selectedUser) return toast({ variant: 'destructive', title: language==='en'?'Select a user first':'አንድ ተጠቃሚ ይምረጡ' })
                        setEditUser(selectedUser)
                        setShowEditDialog(true)
                        setActionsMenuOpen(false)
                      }}
                    >
                      <Edit className="w-4 h-4" />
                      {language === 'en' ? 'Edit User' : 'ተጠቃሚ አርትዕ'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {mobileView ? (
            // Mobile Card View
            <div className="p-4 space-y-4">
              {usersLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  {language === "en" ? "Loading users..." : "ተጠቃሚዎችን በመጫን ላይ..."}
                </div>
              ) : getCurrentUsers().length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {language === "en" ? "No users found" : "ምንም ተጠቃሚ አልተገኘም"}
                </div>
              ) : (
                getCurrentUsers().map((user) => (
                  <UserCard key={user.id} user={user} />
                ))
              )}
            </div>
          ) : (
            // Desktop Table View
            <div className="overflow-x-auto">
              {usersLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  {language === "en" ? "Loading users..." : "ተጠቃሚዎችን በመጫን ላይ..."}
                </div>
              ) : (
                <Table>
                 <TableHeader className="bg-gray-50/80">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-700">{language === "en" ? "User" : "ተጠቃሚ"}</TableHead>
                    <TableHead className="font-semibold text-gray-700">{language === "en" ? "Phone" : "ስልክ"}</TableHead>
                    <TableHead className="font-semibold text-gray-700">{language === "en" ? "Employee ID" : "የሰራተኛ መለያ"}</TableHead>
                    <TableHead className="font-semibold text-gray-700">{language === "en" ? "Position" : "ስራ"}</TableHead>
                    <TableHead className="font-semibold text-gray-700">{language === "en" ? "Role" : "ሚና"}</TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      <Link href="/departments">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 px-3 flex items-center gap-2 border-green-600 text-green-700 hover:bg-green-50 hover:text-green-800 hover:border-green-700"
                        >
                          <Building className="w-4 h-4" />
                          <span>{language === "en" ? "Department" : "ክፍል"}</span>
                        </Button>
                      </Link>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">{language === "en" ? "Status" : "ሁኔታ"}</TableHead>
                    <TableHead className="font-semibold text-gray-700">{language === "en" ? "Created" : "የተፈጠረ"}</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700">{language === "en" ? "Actions" : "እርምጃዎች"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getCurrentUsers().length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {language === "en" ? "No users found" : "ምንም ተጠቃሚ አልተገኘም"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    getCurrentUsers().map((user) => (
                      <TableRow
                        key={user.id}
                        className={`transition-colors hover:bg-gray-50/70 ${
                          selectedUser?.id === user.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.firstNameAm && user.lastNameAm ? `${user.firstNameAm} ${user.lastNameAm}` : `${user.firstName} ${user.lastName}`}
                            </div>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.phone && (
                            <span className="text-sm text-gray-900">{user.phone}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.employeeId && (
                            <span className="text-sm text-gray-900 font-medium">{user.employeeId}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.position && (
                            <span className="text-sm text-gray-900">{user.position}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {displayRoles(user.roles)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{user.department}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(user.isActive)} className="font-medium">
                            {user.isActive 
                              ? (language === "en" ? "Active" : "ንቁ")
                              : (language === "en" ? "Inactive" : "ንቁ ያልሆነ")
                            }
                          </Badge>
                        </TableCell>
                       
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-blue-100"
                              onClick={() => {
                                setSelectedUser(user)
                                setShowDetailsDialog(true)
                              }}
                              title={language === 'en' ? 'View details' : 'ዝርዝሮችን ይመልከቱ'}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {isAdmin && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-green-100"
                                  onClick={() => { 
                                    setEditUser(user); 
                                    setShowEditDialog(true) 
                                  }}
                                  title={language === 'en' ? 'Edit user' : 'ተጠቃሚ አርትዕ'}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedUserId(user.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>

                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              )}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredUsers.length > usersPerPage && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 gap-3">
              <div className="text-sm text-muted-foreground">
                {language === "en" 
                  ? `Showing ${Math.min((currentPage - 1) * usersPerPage + 1, filteredUsers.length)} to ${Math.min(currentPage * usersPerPage, filteredUsers.length)} of ${filteredUsers.length} users`
                  : `ከ ${Math.min((currentPage - 1) * usersPerPage + 1, filteredUsers.length)} እስከ ${Math.min(currentPage * usersPerPage, filteredUsers.length)} ከ ${filteredUsers.length} ተጠቃሚዎች`
                }
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first 2 pages, last 2 pages, and pages around current page
                    return page === 1 || 
                           page === totalPages ||
                           Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, index, array) => {
                    // Add ellipsis for gaps in page numbers
                    const showEllipsis = index > 0 && page - array[index - 1] > 1;
                    return (
                      <div key={page} className="flex items-center">
                        {showEllipsis && (
                          <span className="px-1 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="h-8 w-8 p-0 text-xs"
                        >
                          {page}
                        </Button>
                      </div>
                    );
                  })}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{language === 'en' ? 'User Details' : 'የተጠቃሚ ዝርዝሮች'}</DialogTitle>
          </DialogHeader>
          {selectedUser && <UserDetails user={selectedUser} onClose={() => setShowDetailsDialog(false)} />}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog - WIDE VERSION */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-[95vw]! md:max-w-200! lg:max-w-240! xl:max-w-5xl! max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>{language === 'en' ? 'Edit User' : 'ተጠቃሚ ያርትዑ'}</DialogTitle>
          </DialogHeader>
          <div className="bg-white dark:bg-gray-900 rounded-3xl">
            {editUser && (
              <UserForm
                user={editUser}
                onClose={() => { 
                  setShowEditDialog(false); 
                  setEditUser(null)
                  // Refresh users after editing
                  usersApi.list({ limit: 100 }).then(res => setUsers(res.users || []))
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Register Department Dialog */}
      <Dialog open={deptDialogOpen} onOpenChange={setDeptDialogOpen}>
        <DialogContent className="w-full max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Register Department' : 'ክፍል መመዝገብ'}
            </DialogTitle>
          </DialogHeader>
          <DepartmentForm onClose={() => setDeptDialogOpen(false)} onSubmit={() => setDeptDialogOpen(false)} />
        </DialogContent>
      </Dialog>


      {deleteDialogOpen && (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
          <h2 className="text-lg font-semibold mb-4">
            {language === 'en'
              ? 'Are you sure you want to delete this user?'
              : 'ይህን ተጠቃሚ ለማስወገድ እርግጠኛ ነዎት?'}
          </h2>
          <p className="mb-6 text-sm text-gray-600">
            {language === 'en'
              ? 'This action cannot be undone.'
              : 'ይህ እርምጃ መቀጠል አይችልም።'}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {language === 'en' ? 'Cancel' : 'ይቅር'}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedUserId) handleDeleteUser(selectedUserId);
                setDeleteDialogOpen(false);
              }}
            >
              {language === 'en' ? 'Delete' : 'ሰርዝ'}
            </Button>
          </div>
        </div>
      </div>
      )}

    </div>
  )
}