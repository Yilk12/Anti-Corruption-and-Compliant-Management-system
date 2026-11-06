"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Switch } from "@/app/components/ui/switch"
import { Checkbox } from "@/app/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Separator } from "@/app/components/ui/separator"
import { Shield, User, Building, ChevronDown, Eye, EyeOff, Copy, RefreshCcw, Badge, Mail, Phone, UserCheck, ArrowLeft } from "lucide-react"
 
import { useToast } from "@/app/components/toast-provider"
import { departmentsApi, type DepartmentSummary } from "@/app/lib/departments-api"
import { getCurrentUserRoles } from "@/app/lib/auth"
import { PERMISSION_MODULES } from "@/app/lib/permissions"
import { validatePassword, defaultPolicy } from "@/backend/lib/password-policy"

interface UserFormProps {
  onClose: () => void
  user?: any // For editing existing users
}

export function UserForm({ onClose, user }: UserFormProps) {
  const [language] = useState<"en" | "am">("en")
  const { show: toast } = useToast()
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    middleName: user?.middleName || "",
    lastName: user?.lastName || "",
    firstNameAm: user?.firstNameAm || "",
    middleNameAm: user?.middleNameAm || "",
    lastNameAm: user?.lastNameAm || "",
    email: user?.email || "",
    phone: user?.phone || "",
    employeeId: user?.employeeId || "",
    position: user?.position || "",
    gender: user?.gender || "",
    isDisabled: user?.isDisabled ?? true,
    disabilityType: user?.disabilityType || "",
    roles: user?.roles ? (Array.isArray(user.roles) ? user.roles : [user.roles]) : [],
    department: user?.departmentId || user?.department || "",
    isActive: user?.isActive !== undefined ? user.isActive : true,
  })

  const [defaultPassword, setDefaultPassword] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const [departments, setDepartments] = useState<Array<any>>([])
  const [loadingDepts, setLoadingDepts] = useState(false)

  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement | null>(null)



  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingDepts(true)
        const token =
          localStorage.getItem("accessToken") ||
          localStorage.getItem("jwt") ||
          localStorage.getItem("token")
  
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/departments?limit=100`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }
        )
  
        if (!res.ok) throw new Error("Failed to fetch departments")
  
        const data = await res.json()
        console.log("fetched departments:", data)
        // Handle both array response and object with departments property
        const depts = Array.isArray(data) ? data : (data.departments || [])
        setDepartments(depts)
      } catch (err) {
        console.error("Error fetching departments:", err)
        setDepartments([])
      } finally {
        setLoadingDepts(false)
      }
    }
  
    fetchDepartments()
  }, [])
  
  // Dynamic permissions by module/activity (checkboxes)
  const [selectedPerms, setSelectedPerms] = useState<Record<string, Record<string, boolean>>>({})
  const isPermChecked = (moduleKey: string, activityKey: string) => Boolean(selectedPerms?.[moduleKey]?.[activityKey])
  const setPermChecked = (moduleKey: string, activityKey: string, value: boolean) => {
    setSelectedPerms(prev => ({
      ...prev,
      [moduleKey]: { ...(prev[moduleKey] || {}), [activityKey]: value },
    }))
  }
  const setModuleAllPerms = (moduleKey: string, value: boolean) => {
    const mod = PERMISSION_MODULES.find(m => m.key === moduleKey)
    if (!mod) return
    setSelectedPerms(prev => ({
      ...prev,
      [moduleKey]: Object.fromEntries(mod.activities.map(a => [a.key, value])),
    }))
  }

  const allModulePermsChecked = (moduleKey: string) => {
    const mod = PERMISSION_MODULES.find(m => m.key === moduleKey)
    if (!mod) return false
    const current = selectedPerms[moduleKey] || {}
    return mod.activities.every(a => current[a.key])
  }
  const anyModulePermsChecked = (moduleKey: string) => {
    const mod = PERMISSION_MODULES.find(m => m.key === moduleKey)
    if (!mod) return false
    const current = selectedPerms[moduleKey] || {}
    return mod.activities.some(a => current[a.key])
  }

  // Build default permissions for a given role across modules
  const buildPermsForRole = (role: string): Record<string, Record<string, boolean>> => {
    const map: Record<string, Record<string, boolean>> = {}
    const set = (moduleKey: string, activities: string[]) => {
      const mod = PERMISSION_MODULES.find(m => m.key === moduleKey)
      if (!mod) return
      map[moduleKey] = map[moduleKey] || {}
      for (const a of mod.activities) map[moduleKey][a.key] = false
      for (const k of activities) if (mod.activities.some(a=>a.key===k)) map[moduleKey][k] = true
    }

    // Commissioner: everything
    if (role === 'Commissioner') {
      for (const mod of PERMISSION_MODULES) {
        map[mod.key] = Object.fromEntries(mod.activities.map(a => [a.key, true])) as Record<string, boolean>
      }
      return map
    }

    // Admin: broad control
    if (role === 'ADMIN') {
      for (const mod of PERMISSION_MODULES) {
        // default view everywhere
        const hasView = mod.activities.some(a=>a.key==='view')
        if (hasView) set(mod.key, ['view'])
      }
      set('users', ['view','invite','update','disable','delete'])
      set('analytics', ['view','export'])
      return map
    }

    if (role === 'END_USER') {
      set('analytics', [])
      return map
    }

    if (role === 'Department_Head') {
      return map
    }

    if (role === 'Ethics_Anti_Corruption') {
      // Ethics & Anti-Corruption (Investigation Supervisor / Decision-Maker): full access to ethics module
      set('ethics', ['view_dashboard', 'view_complaints', 'create_complaints', 'screen_complaints', 'assess_complaints', 'approve_investigation_route', 'assign_investigator', 'view_investigations', 'create_investigations', 'submit_investigation_report', 'review_investigation_report', 'approve_decision', 'close_case', 'view_policies', 'create_policies', 'manage_policies', 'view_declarations', 'create_declarations', 'review_declarations', 'view_reports', 'send_messages'])
      set('analytics', ['view'])
      return map
    }

    if (role === 'Ethics_Officer') {
      // Ethics Officer (Complaint Registration Officer): can register, screen, and assess complaints
      set('ethics', ['view_dashboard', 'view_complaints', 'screen_complaints', 'assess_complaints', 'view_investigations', 'view_policies', 'view_declarations', 'view_reports', 'send_messages'])
      set('analytics', ['view'])
      return map
    }

    if (role === 'Feedback_Complaint_Manager') {
      // Feedback and Complaint Manager: full access to feedback/complaint module
      set('ethics', ['view_dashboard', 'view_complaints', 'create_complaints', 'screen_complaints', 'assess_complaints', 'approve_investigation_route', 'assign_investigator', 'view_investigations', 'create_investigations', 'submit_investigation_report', 'review_investigation_report', 'approve_decision', 'close_case', 'view_policies', 'create_policies', 'manage_policies', 'view_declarations', 'create_declarations', 'review_declarations', 'view_reports', 'send_messages'])
      set('analytics', ['view'])
      return map
    }

    if (role === 'Feedback_Complaint_Officer') {
      // Feedback and Complaint Officer: can register, screen, and assess complaints
      set('ethics', ['view_dashboard', 'view_complaints', 'screen_complaints', 'assess_complaints', 'view_investigations', 'view_policies', 'view_declarations', 'view_reports', 'send_messages'])
      set('analytics', ['view'])
      return map
    }

    return map
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 1) Always show local preview immediately
    const url = URL.createObjectURL(file)
    setPhotoPreview((prev) => {
      if (prev && prev.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(prev)
        } catch {}
      }
      return url
    })

    // 2) If this is an existing user, auto-upload photo to backend
    if (user?.id) {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
      const base = backendUrl.replace(/\/$/, "")

      const getToken = () =>
        typeof window !== "undefined"
          ? window.localStorage.getItem("accessToken") ||
            window.localStorage.getItem("jwt") ||
            window.localStorage.getItem("token")
          : null

      const token = getToken()
      const formData = new FormData()
      formData.append("photo", file)

      fetch(`${base}/api/users/${user.id}/photo`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      })
        .then(async (res) => {
          if (!res.ok) {
            const txt = await res.text().catch(() => "")
            console.error("Failed to upload profile photo", res.status, txt)
            toast({
              variant: "destructive",
              title: language === "en" ? "Photo upload failed" : "ፎቶ መስቀል አልተሳካም",
            })
            return
          }
          toast({
            variant: "success",
            title: language === "en" ? "Photo updated" : "ፎቶ ተዘምኗል",
          })
        })
        .catch((err) => {
          console.error("Error uploading profile photo", err)
          toast({
            variant: "destructive",
            title: language === "en" ? "Photo upload failed" : "ፎቶ መስቀል አልተሳካም",
          })
        })
    }
  }

  // Apply defaults on role change
  useEffect(() => {
    if (formData.roles.length > 0) {
      const perms = buildPermsForRole(formData.roles[0])
      if (Object.keys(perms).length) setSelectedPerms(perms)
    }
  }, [formData.roles])

  // Dropdown open state per module - initialize all as expanded
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const m of PERMISSION_MODULES) initial[m.key] = true
    return initial
  })
  const toggleModuleOpen = (key: string) => setExpandedModules((p) => ({ ...p, [key]: !p[key] }))
  const permSectionRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handler = () => {
      const next: Record<string, boolean> = {}
      for (const m of PERMISSION_MODULES) next[m.key] = true
      setExpandedModules(next)
      try {
        permSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } catch {}
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('open-permissions', handler)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('open-permissions', handler)
      }
    }
  }, [])

  const baseRoles = [
    { value: "Commissioner", label: language === "en" ? "Commissioner" : "ኮሚሽነር" },
    { value: "ADMIN", label: language === "en" ? "Admin" : "አስተዳዳሪ" },
    { value: "Department_Head", label: language === "en" ? "Department Head" : "የክፍል ኃላፊ" },
    { value: "END_USER", label: language === "en" ? "End User" : "የመጨረሻ ተጠቃሚ" },
    { value: "Feedback_Complaint_Manager", label: language === "en" ? "Feedback and Complaint Manager" : "የግብር እና ቅሬታ አስተዳዳሪ" },
    { value: "Feedback_Complaint_Officer", label: language === "en" ? "Feedback and Complaint Officer" : "የግብር እና ቅሬታ ኃላፊ" },
    { value: "Ethics_Anti_Corruption", label: language === "en" ? "Ethics Anti-Corruption" : "ስርዓተ ስርዓት እና ሙስና መከላከያ" },
    { value: "Ethics_Officer", label: language === "en" ? "Ethics Officer" : "የስርዓት ኃላፊ" },
    { value: "Vehicle_Inspector", label: language === "en" ? "Vehicle Inspector" : "የመኪና ፈተና" },
    { value: "Administrative_Complaints_Team", label: language === "en" ? "Administrative Complaints Team" : "የአስተዳደራዊ ቅሬታ ቡድን" },

  ]

  const roles = baseRoles

  // Convert selected permissions to backend format
  const convertPermissionsToBackendFormat = () => {
    const modulePermissions: Array<{ moduleName: string; permissions: string[] }> = []

    for (const [moduleKey, permissions] of Object.entries(selectedPerms)) {
      const enabledPermissions = Object.entries(permissions)
        .filter(([_, isEnabled]) => isEnabled)
        .map(([permissionKey]) => permissionKey)

      if (enabledPermissions.length > 0) {
        modulePermissions.push({
          moduleName: moduleKey,
          permissions: enabledPermissions,
        })
      }
    }

    return modulePermissions
  }

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validate employee ID format: 2 uppercase letters followed by numbers
  const employeeIdRegex = /^[A-Z]{2}\d+$/;
  if (!employeeIdRegex.test(formData.employeeId)) {
    toast({
      variant: "destructive",
      title: language === "en" ? "Invalid Employee ID" : "የሰራተኛ መለያ ውስብስብ ነው",
      description: language === "en"
        ? "Employee ID must start with 2 uppercase letters followed by numbers (e.g., AB12345)"
        : "የሰራተኛ መለያ መጀመርያ ከ2 ካፒታል ደቂቃዎች እና ከኋላ ቁጥሮች መሆን አለበት (ለምሳሌ፡ AB12345)",
    });
    return;
  }

  try {
    // Convert permissions to backend format
    const modulePermissions = convertPermissionsToBackendFormat();

    // Build payload
    const payload = {
      firstName: formData.firstName,
      middleName: formData.middleName || undefined,
      lastName: formData.lastName,
      firstNameAm: formData.firstNameAm || undefined,
      middleNameAm: formData.middleNameAm || undefined,
      lastNameAm: formData.lastNameAm || undefined,
      email: formData.email,
      phone: formData.phone || undefined,
      employeeId: formData.employeeId || undefined,
      position: formData.position || undefined,
      gender: formData.gender || undefined,
      isDisabled: formData.isDisabled,
      disabilityType: formData.disabilityType || undefined,
      roles: formData.roles,
      departmentId: formData.department || undefined,
      userType: "INTERNAL",
      isActive: formData.isActive,
      modulePermissions: modulePermissions.length ? modulePermissions : undefined,
    };

    console.log("Data being sent to backend:", payload);

    // Helper: get token from localStorage
    const getToken = () =>
      typeof window !== "undefined"
        ? window.localStorage.getItem("accessToken") ||
          window.localStorage.getItem("jwt") ||
          window.localStorage.getItem("token")
        : null;

    const token = getToken();
    const headers = new Headers({ "Content-Type": "application/json" });
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const isEdit = Boolean(user?.id);
    const url = isEdit ? `${backendUrl}/api/users/${user.id}` : `${backendUrl}/api/users`;
    const method = isEdit ? "PATCH" : "POST";

    console.log("Calling backend at:", url);

    // Make API request
    const resp = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(payload),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      throw new Error(data?.message || `Failed to ${isEdit ? "update" : "create"} user`);
    }

    // Show toast notification
    if (!user && data.password) {
      try {
        await navigator.clipboard.writeText(data.password);
      } catch {}

      toast({
        variant: "success",
        title: language === "en" ? "User created successfully" : "ተጠቃሚ ተፈጥሯል",
        description:
          language === "en"
            ? `Default password: ${data.password} (copied to clipboard)`
            : `ነባሪ የይለፍ ቃል፡ ${data.password} (ወደ ቅንፍ ተቀድመዋል)`,
      });
    } else {
      toast({
        variant: "success",
        title: isEdit
          ? language === "en"
            ? "User updated successfully"
            : "ተጠቃሚ ተዘምኗል"
          : language === "en"
          ? "User created successfully"
          : "ተጠቃሚ ተፈጥሯል",
        description: isEdit
          ? language === "en"
            ? "Changes have been saved"
            : "ለውጦቹ ተቀምጠዋል"
          : language === "en"
          ? "User has been created with the specified permissions"
          : "ተጠቃሚ በተጠቀሱት ፈቃዶች ተፈጥሯል",
      });
    }

    onClose();
  } catch (err: any) {
    console.error("Error submitting user form:", err);
    toast({
      variant: "destructive",
      title: language === "en" ? "Failed to submit" : "ማስገባት አልተሳካም",
      description: err?.message || "Connection error - make sure backend is running on port 4000",
    });
  }
};


  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="mb-4 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === "en" ? "Back to Users" : "ወደ ተጠቃሚዎች ተመለስ"}
          </Button>
          
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 dark:border-gray-700/50 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-linear-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {user ? (language === "en" ? "Edit User" : "ተጠቃሚ አርትዕ") : language === "en" ? "Create New User" : "አዲስ ተጠቃሚ ይፍጠሩ"}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg max-w-2xl">
                    {language === "en" 
                      ? "Fill in the user details and assign appropriate permissions to get started" 
                      : "የተጠቃሚውን ዝርዝሮች ያስገቡ እና ተገቢውን ፈቃዶች ይመድቡ"
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className={`px-4 py-3 rounded-xl border transition-all ${
                  formData.isActive 
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${formData.isActive ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}></div>
                    <span className={`font-semibold ${formData.isActive ? "text-green-700 dark:text-green-400" : "text-gray-700 dark:text-gray-400"}`}>
                      {formData.isActive 
                        ? (language === "en" ? "Active User" : "ንቁ ተጠቃሚ") 
                        : (language === "en" ? "Inactive User" : "ንቁ ያልሆነ ተጠቃሚ")
                      }
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {formData.isActive 
                      ? (language === "en" ? "Can access all assigned features" : "ሁሉንም የተመደቡ ባህሪያት ሊደርስ ይችላል") 
                      : (language === "en" ? "Access to system is disabled" : "ወደ ስርዓቱ መዳረሻ ተገድቧል")
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information Card */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="pb-4 bg-linear-to-r from-blue-500/5 to-purple-500/5 border-b border-blue-100 dark:border-blue-800/30">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-2xl shadow-lg">
                  <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                {language === "en" ? "Basic Information" : "መሰረታዊ መረጃ"}
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {language === "en" 
                  ? "Enter the user's personal details and contact information" 
                  : "የተጠቃሚውን የግሌ ዝርዝሮች እና የመገኛ መረጃ ያስገቡ"
                }
              </p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <Label htmlFor="firstName" className="text-base font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <User className="w-4 h-4 text-blue-500" />
                    {language === "en" ? "First Name" : "ስም"} *
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                    placeholder={language === "en" ? "Enter first name" : "ስም ያስገቡ"}
                    required
                    className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 rounded-xl transition-all bg-white dark:bg-gray-800 shadow-sm"
                  />
                </div>

                <div className="space-y-4">
                  <Label htmlFor="middleName" className="text-base font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <User className="w-4 h-4 text-blue-500" />
                    {language === "en" ? "Middle Name" : "የአባት ስም"}
                  </Label>
                  <Input
                    id="middleName"
                    value={formData.middleName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, middleName: e.target.value }))}
                    placeholder={language === "en" ? "Enter middle name" : "የአባት ስም ያስገቡ"}
                    className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 rounded-xl transition-all bg-white dark:bg-gray-800 shadow-sm"
                  />
                </div>

                <div className="space-y-4">
                  <Label htmlFor="lastName" className="text-base font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <User className="w-4 h-4 text-blue-500" />
                    {language === "en" ? "Last Name" : "የአያት ስም"} *
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                    placeholder={language === "en" ? "Enter last name" : "የአያት ስም ያስገቡ"}
                    required
                    className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 rounded-xl transition-all bg-white dark:bg-gray-800 shadow-sm"
                  />
                </div>

                <div className="space-y-4">
                  <Label htmlFor="firstNameAm" className="text-base font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <User className="w-4 h-4 text-blue-500" />
                    {language === "en" ? "First Name (Amharic)" : "ስም (አማርኛ)"}
                  </Label>
                  <Input
                    id="firstNameAm"
                    value={formData.firstNameAm}
                    onChange={(e) => setFormData((prev) => ({ ...prev, firstNameAm: e.target.value }))}
                    placeholder={language === "en" ? "Enter first name in Amharic" : "ስም በአማርኛ ያስገቡ"}
                    className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 rounded-xl transition-all bg-white dark:bg-gray-800 shadow-sm"
                  />
                </div>

                <div className="space-y-4">
                  <Label htmlFor="middleNameAm" className="text-base font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <User className="w-4 h-4 text-blue-500" />
                    {language === "en" ? "Middle Name (Amharic)" : "የአባት ስም (አማርኛ)"}
                  </Label>
                  <Input
                    id="middleNameAm"
                    value={formData.middleNameAm}
                    onChange={(e) => setFormData((prev) => ({ ...prev, middleNameAm: e.target.value }))}
                    placeholder={language === "en" ? "Enter middle name in Amharic" : "የአባት ስም በአማርኛ ያስገቡ"}
                    className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 rounded-xl transition-all bg-white dark:bg-gray-800 shadow-sm"
                  />
                </div>

                <div className="space-y-4">
                  <Label htmlFor="lastNameAm" className="text-base font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <User className="w-4 h-4 text-blue-500" />
                    {language === "en" ? "Last Name (Amharic)" : "የአያት ስም (አማርኛ)"}
                  </Label>
                  <Input
                    id="lastNameAm"
                    value={formData.lastNameAm}
                    onChange={(e) => setFormData((prev) => ({ ...prev, lastNameAm: e.target.value }))}
                    placeholder={language === "en" ? "Enter last name in Amharic" : "የአያት ስም በአማርኛ ያስገቡ"}
                    className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 rounded-xl transition-all bg-white dark:bg-gray-800 shadow-sm"
                  />
                </div>

                <div className="space-y-4">
                  <Label htmlFor="email" className="text-base font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Mail className="w-4 h-4 text-blue-500" />
                    {language === "en" ? "Email Address" : "የኢሜይል አድራሻ"} *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder={language === "en" ? "Enter email address" : "የኢሜይል አድራሻ ያስገቡ"}
                    required
                    className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 rounded-xl transition-all bg-white dark:bg-gray-800 shadow-sm"
                  />
                </div>

                <div className="space-y-4">
                  <Label htmlFor="phone" className="text-base font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Phone className="w-4 h-4 text-blue-500" />
                    {language === "en" ? "Phone Number" : "የስልክ ቁጥር"}
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder={language === "en" ? "Enter phone number" : "የስልክ ቁጥር ያስገቡ"}
                    className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 rounded-xl transition-all bg-white dark:bg-gray-800 shadow-sm"
                  />
                </div>

                <div className="space-y-4">
                  <Label htmlFor="employeeId" className="text-base font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <UserCheck className="w-4 h-4 text-blue-500" />
                    {language === "en" ? "Employee ID" : "የሰራተኛ መለያ"} *
                  </Label>
                  <Input
                    id="employeeId"
                    value={formData.employeeId}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase()
                      setFormData((prev) => ({ ...prev, employeeId: value }))
                    }}
                    placeholder={language === "en" ? "AB12345" : "AB12345"}
                    required
                    className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 rounded-xl transition-all bg-white dark:bg-gray-800 shadow-sm"
                  />
                  <p className="text-xs text-gray-500">
                    {language === "en" ? "Format: 2 uppercase letters followed by numbers (e.g., AB12345)" : "ቅጽል: 2 ካፒታል ደቂቃዎች ከኋላ ቁጥሮች (ለምሳሌ፡ AB12345)"}
                  </p>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="position" className="text-base font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <UserCheck className="w-4 h-4 text-blue-500" />
                    {language === "en" ? "Employee Position" : "የሰራተኛ ስራ"}
                  </Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
                    placeholder={language === "en" ? "Enter position" : "ስራ ያስገቡ"}
                    className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 rounded-xl transition-all bg-white dark:bg-gray-800 shadow-sm"
                  />
                </div>

                <div className="space-y-4">
                  <Label htmlFor="gender" className="text-base font-semibold text-gray-700 dark:text-gray-300">
                    {language === "en" ? "Gender" : "ፆታ"}
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 rounded-xl transition-all bg-white dark:bg-gray-800 shadow-sm">
                      <SelectValue placeholder={language === "en" ? "Select gender" : "ፆታ ይምረጡ"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      <SelectItem value="MALE" className="py-3 text-base">
                        {language === "en" ? "Male" : "ወንድ"}
                      </SelectItem>
                      <SelectItem value="FEMALE" className="py-3 text-base">
                        {language === "en" ? "Female" : "ሴት"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold text-gray-700 dark:text-gray-300">
                    {language === "en" ? "Disability" : "እንሽቶ"}
                  </Label>
                  <div className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800">
                    <Checkbox
                      id="isDisabled"
                      checked={formData.isDisabled}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          isDisabled: Boolean(checked),
                          disabilityType: checked ? prev.disabilityType : "",
                        }))
                      }
                    />
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="text-base font-semibold">
                        {language === "en" ? "Has disability" : "እንሽቶ አለው/አላት"}
                      </span>
                      <span className="text-sm text-gray-500">
                        {language === "en"
                          ? "If checked, select the disability type"
                          : "ከተመረጠ በኋላ የእንሽቶ አይነት ይምረጡ"}
                      </span>
                      <Select
                        value={formData.disabilityType}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, disabilityType: value }))
                        }
                        disabled={!formData.isDisabled}
                      >
                        <SelectTrigger className="mt-2 h-10 text-sm border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
                          <SelectValue
                            placeholder={
                              language === "en"
                                ? "Select disability type"
                                : "የእንሽቶ አይነት ይምረጡ"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-2 max-h-80 text-sm">
                          <SelectItem value="BLIND" className="py-2">
                            {language === "en" ? "Blind" : "ዕውር"}
                          </SelectItem>
                          <SelectItem value="DEAF" className="py-2">
                            {language === "en" ? "Deaf" : "ደንቆሮ"}
                          </SelectItem>
                          <SelectItem value="PHYSICAL_OR_MOVEMENT_DISORDER" className="py-2">
                            {language === "en"
                              ? "Physical or movement disorder"
                              : "የሰውነት ወይም የእንቅስቃሴ ችግኝ"}
                          </SelectItem>
                          <SelectItem value="MENTAL_RETARDATION" className="py-2">
                            {language === "en" ? "Mental retardation" : "የአእምሮ ችግኝ"}
                          </SelectItem>
                          <SelectItem value="OVERLAPPING_FACES" className="py-2">
                            {language === "en" ? "Overlapping faces" : "የፊት ችግኝ"}
                          </SelectItem>
                          <SelectItem value="PSYCHOLOGICAL_AND_SOCIAL_DISORDER" className="py-2">
                            {language === "en"
                              ? "Psychological and social disorder"
                              : "የስነ-ልቦና እና ማህበራዊ ችግኝ"}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="department" className="text-base font-semibold text-gray-700 dark:text-gray-300">
                    <Building className="w-4 h-4 text-blue-500 inline mr-2" />
                    {language === "en" ? "Department" : "ክፍል"}
                  </Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                  >
                    <SelectTrigger className="h-12 text-base border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 rounded-xl transition-all bg-white dark:bg-gray-800 shadow-sm">
                      <SelectValue
                        placeholder={
                          loadingDepts
                            ? language === "en" ? "Loading departments..." : "ክፍሎች በመጫን ላይ..."
                            : language === "en" ? "Select department" : "ክፍል ይምረጡ"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      {departments.length > 0 ? (
                        departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.id} className="flex items-center gap-3 py-3 text-base">
                            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                            {language === "en" ? dept.name : dept.nameAm || dept.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no_departments" disabled className="py-3 text-base">
                          {language === "en" ? "No departments found" : "ክፍሎች አልተገኙም"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="status" className="text-base font-semibold text-gray-700 dark:text-gray-300">
                    {language === "en" ? "Account Status" : "የመለያ ሁኔታ"}
                  </Label>
                  <div className="flex items-center gap-4 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 transition-all hover:shadow-md">
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
                      className="data-[state=checked]:bg-green-600 scale-110"
                    />
                    <div className="flex flex-col">
                      <span className="text-base font-semibold">
                        {formData.isActive 
                          ? (language === "en" ? "Active Account" : "ንቁ መለያ") 
                          : (language === "en" ? "Inactive Account" : "ንቁ ያልሆነ መለያ")
                        }
                      </span>
                      <span className="text-sm text-gray-500">
                        {formData.isActive 
                          ? (language === "en" ? "User can access the system" : "ተጠቃሚ ስርዓቱን ሊጠቀም ይችላል") 
                          : (language === "en" ? "User access is disabled" : "የተጠቃሚ መግቢያ ተገድቧል")
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Card */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="pb-4 bg-linear-to-r from-green-500/5 to-emerald-500/5 border-b border-green-100 dark:border-green-800/30">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-2xl shadow-lg">
                  <Badge className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                {language === "en" ? "Role" : "ሚና"}
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {language === "en"
                  ? "Assign the user's role in the system"
                  : "የተጠቃሚውን ሚና በስርዓቱ ውስጥ ይመድቡ"
                }
              </p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-4">
                <Label htmlFor="role" className="text-base font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Badge className="w-4 h-4 text-green-500" />
                  {language === "en" ? "Roles" : "ሚናዎች"} *
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {roles.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => {
                        if (formData.roles.includes(role.value)) {
                          setFormData((prev) => ({ ...prev, roles: prev.roles.filter((r: string) => r !== role.value) }))
                        } else {
                          setFormData((prev) => ({ ...prev, roles: [...prev.roles, role.value] }))
                        }
                      }}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        formData.roles.includes(role.value)
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full ${
                          role.value === 'Commissioner' ? 'bg-purple-500' :
                          role.value === 'ADMIN' ? 'bg-red-500' :
                          role.value === 'Asset_Manager' ? 'bg-green-500' :
                          role.value === 'Department_Head' ? 'bg-blue-500' :
                          role.value === 'END_USER' ? 'bg-gray-500' :
                          role.value === 'Announcement_Creator' ? 'bg-orange-500' :
                          role.value === 'Women_Social_Inclusion' ? 'bg-pink-500' :
                          role.value === 'Ethics_Anti_Corruption' ? 'bg-yellow-500' :
                          role.value === 'Vehicle_Inspector' ? 'bg-indigo-500' :
                          role.value === 'Asset_Officer' ? 'bg-teal-500' :
                          role.value === 'Asset_Control_Registration_Officer' ? 'bg-cyan-500' :
                          role.value === 'IT_Officer' ? 'bg-violet-500' : 'bg-blue-500'
                        }`}></div>
                        <span className="text-sm font-medium">{role.label}</span>
                      </div>
                      {formData.roles.includes(role.value) && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                {formData.roles.length === 0 && (
                  <p className="text-sm text-red-500">
                    {language === "en" ? "Please select at least one role" : "እባክዎ ቢያንድ ሚና ይምረጡ"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Permissions Card */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="pb-4 bg-linear-to-r from-purple-500/5 to-pink-500/5 border-b border-purple-100 dark:border-purple-800/30">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-2xl shadow-lg">
                    <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                      {language === "en" ? "Permissions" : "ፈቃዶች"}
                    </CardTitle>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      {language === "en" 
                        ? "Select the modules and actions this user can access"
                        : "ይህ ተጠቃሚ ሊደርስበት የሚችለውን ሞጁሎች እና ተግባራት ይምረጡ"
                      }
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const next: Record<string, boolean> = {}
                      for (const m of PERMISSION_MODULES) next[m.key] = true
                      setExpandedModules(next)
                    }}
                    className="rounded-lg border-2"
                  >
                    {language === "en" ? "Expand All" : "ሁሉንም ክፈት"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const next: Record<string, boolean> = {}
                      for (const m of PERMISSION_MODULES) next[m.key] = false
                      setExpandedModules(next)
                    }}
                    className="rounded-lg border-2"
                  >
                    {language === "en" ? "Collapse All" : "ሁሉንም ዝጋ"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div ref={permSectionRef} className="space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                  {PERMISSION_MODULES.map((module) => (
                    <div key={module.key} className="border-2 border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-700 bg-white dark:bg-gray-800">
                      <div className="flex items-center justify-between p-4 bg-linear-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 hover:from-purple-50 dark:hover:from-purple-900/20 transition-colors">
                        <button
                          type="button"
                          onClick={() => toggleModuleOpen(module.key)}
                          className="flex items-center gap-3 font-semibold text-left flex-1 group"
                        >
                          <ChevronDown
                            className={`h-5 w-5 transition-transform shrink-0 text-purple-600 dark:text-purple-400 ${
                              expandedModules[module.key] ? "rotate-180" : "rotate-0"
                            }`}
                          />
                          <span className="text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {module.label}
                          </span>
                        </button>
                        <label
                          className="flex items-center gap-2 text-sm shrink-0 ml-2"
                          onClick={(e)=>e.stopPropagation()}
                        >
                          <Checkbox
                            checked={allModulePermsChecked(module.key)}
                            onCheckedChange={(v)=>setModuleAllPerms(module.key, Boolean(v))}
                            aria-checked={allModulePermsChecked(module.key)}
                            className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 h-5 w-5 rounded-lg border-2"
                          />
                          <span className="hidden sm:inline font-medium">{language === "en" ? "All" : "ሁሉም"}</span>
                        </label>
                      </div>
                      {expandedModules[module.key] && (
                        <>
                          <div className="grid grid-cols-1 gap-3 p-4 bg-white dark:bg-gray-800">
                            {module.activities.map((a) => (
                              <label 
                                key={`${module.key}.${a.key}`} 
                                className="flex items-center gap-3 text-base p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all cursor-pointer group"
                              >
                                <Checkbox
                                  checked={isPermChecked(module.key, a.key)}
                                  onCheckedChange={(v)=>setPermChecked(module.key, a.key, Boolean(v))}
                                  aria-checked={isPermChecked(module.key, a.key)}
                                  className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 h-5 w-5 rounded-lg border-2"
                                />
                                <span className="flex-1 text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                                  {a.label}
                                </span>
                              </label>
                            ))}
                          </div>
                          {anyModulePermsChecked(module.key) && !allModulePermsChecked(module.key) && (
                            <div className="px-4 py-3 text-sm bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800">
                              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
                                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                {language === "en" ? "Partially selected" : "በከፊል ተመርጧል"}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex flex-col lg:flex-row justify-end gap-4 pt-8 border-t border-gray-200 dark:border-gray-700">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="h-12 px-8 text-base rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              {language === "en" ? "Cancel" : "ይቅር"}
            </Button>
            <Button 
              type="submit"
              className="h-12 px-8 text-base rounded-xl bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              {user ? (language === "en" ? "Update User" : "ተጠቃሚ ያዘምኑ") : language === "en" ? "Create User" : "ተጠቃሚ ይፍጠሩ"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}