"use client"

import { useEffect, useState } from "react"
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
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar"
import { Plus, Search, Filter, Edit, Trash2, Eye } from "lucide-react"
import { DepartmentForm } from "./department-form"
import { departmentsApi, type DepartmentSummary, type UpdateDepartmentDto } from "@/app/lib/departments-api"
import { useToast } from "@/app/components/toast-provider"

export function DepartmentManagement() {
  const [language] = useState<"en" | "am">("en")
  const [departments, setDepartments] = useState<DepartmentSummary[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editing, setEditing] = useState<DepartmentSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null)
  const { show: toast } = useToast()

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await departmentsApi.list({ limit: 100 })
      setDepartments(res.departments)
    } catch (e: any) {
      setError(e?.message || "Failed to load departments")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = departments.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.nameAm || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || (statusFilter === "Active" ? d.isActive : !d.isActive)
    return matchesSearch && matchesStatus
  })

  const addDepartment = async (data: { name: string; nameAm?: string; description?: string; isActive?: boolean }) => {
    try {
      const created = await departmentsApi.create(data)
      setDepartments((prev) => [created, ...prev])
      toast({ variant: "success", title: language === "en" ? "Department created" : "ክፍል ተፈጥሯል" })
    } catch (e: any) {
      toast({ variant: "destructive", title: language === "en" ? "Failed to create" : "መፍጠር አልተሳካም", description: e?.message })
      throw e
    }
  }

  const startEdit = (dept: DepartmentSummary) => {
    setEditing(dept)
    setShowEditDialog(true)
  }

  const updateDepartment = async (id: string, data: UpdateDepartmentDto) => {
    try {
      const updated = await departmentsApi.update(id, data)
      setDepartments((prev) => prev.map((d) => (d.id === id ? updated : d)))
      toast({ variant: "success", title: language === "en" ? "Department updated" : "ክፍል ታድሷል" })
    } catch (e: any) {
      toast({ variant: "destructive", title: language === "en" ? "Update failed" : "ማዘመን አልተሳካም", description: e?.message })
      throw e
    }
  }

  const deactivateDepartment = async (id: string) => {
    try {
      setDeactivatingId(id)
      await departmentsApi.deactivate(id)
      setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, isActive: false } : d)))
      toast({ variant: "success", title: language === "en" ? "Department deactivated" : "ክፍል ተሰናክሏል" })
    } catch (e: any) {
      toast({ variant: "destructive", title: language === "en" ? "Deactivate failed" : "ማሰናከል አልተሳካም", description: e?.message })
    } finally {
      setDeactivatingId(null)
    }
  }

  return (
    <div className="space-y-6 pt-8 md:pt-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary font-[family-name:var(--font-playfair)]">
            {language === "en" ? "Department Management" : "የክፍል አስተዳደር"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "en"
              ? "Create and manage organizational departments"
              : "የድርጅት ክፍሎችን ይፍጠሩ እና ያስተዳድሩ"}
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {language === "en" ? "Add Department" : "ክፍል ጨምር"}
            </Button>
          </DialogTrigger>
          <DialogContent className="w-screen h-screen max-w-none overflow-y-auto p-6">
            <DialogHeader>
              <DialogTitle>{language === "en" ? "Add New Department" : "አዲስ ክፍል ጨምር"}</DialogTitle>
              <DialogDescription>
                {language === "en" ? "Register a new department with details" : "አዲስ ክፍልን በዝርዝር ይመዝግቡ"}
              </DialogDescription>
            </DialogHeader>
            <DepartmentForm
              onClose={() => setShowCreateDialog(false)}
              onSubmit={async (data) => {
                await addDepartment(data)
                await load()
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Department Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{language === "en" ? "Edit Department" : "ክፍል አርትዕ"}</DialogTitle>
            </DialogHeader>
            {editing && (
              <DepartmentForm
                department={editing}
                onClose={() => setShowEditDialog(false)}
                onSubmit={async (data) => {
                  await updateDepartment(editing.id, data)
                  setShowEditDialog(false)
                  await load()
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {language === "en" ? "Filters" : "ማጣሪያዎች"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={language === "en" ? "Search departments..." : "ክፍሎችን ይፈልጉ..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder={language === "en" ? "Filter by Status" : "በሁኔታ ማጣሪያ"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "en" ? "All Status" : "ሁሉም ሁኔታዎች"}</SelectItem>
                <SelectItem value="Active">{language === "en" ? "Active" : "ንቁ"}</SelectItem>
                <SelectItem value="Inactive">{language === "en" ? "Inactive" : "ንቁ ያልሆነ"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="text-sm text-muted-foreground">{language === "en" ? "Loading departments..." : "ክፍሎች በመጫን ላይ..."}</div>
      )}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {/* Departments Table */}
      <Card>
        <CardHeader>
          <CardTitle>{language === "en" ? "Departments List" : "የክፍሎች ዝርዝር"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === "en" ? "Department" : "ክፍል"}</TableHead>
                <TableHead>{language === "en" ? "Status" : "ሁኔታ"}</TableHead>
                <TableHead>{language === "en" ? "Created" : "ተፈጠረ"}</TableHead>
                <TableHead className="text-right">{language === "en" ? "Actions" : "እርምጃዎች"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>{dept.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{dept.name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={dept.isActive ? "default" : "secondary"}>{dept.isActive ? (language === "en" ? "Active" : "ንቁ") : (language === "en" ? "Inactive" : "ንቁ ያልሆነ")}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(dept.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(dept)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => startEdit(dept)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          const ok = window.confirm(
                            language === "en"
                              ? "Deactivate this department?"
                              : "ይህን ክፍል ማሰናከል ይፈልጋሉ?"
                          )
                          if (ok) deactivateDepartment(dept.id)
                        }}
                        disabled={deactivatingId === dept.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
