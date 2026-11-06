"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Textarea } from "@/app/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Building2, Info } from "lucide-react"
import { useToast } from "@/app/components/toast-provider"


interface DepartmentFormProps {
  onClose: () => void
  department?: any
  onSubmit?: (data: any) => Promise<void> | void
}

export function DepartmentForm({ onClose, department, onSubmit }: DepartmentFormProps) {
  const [language] = useState<"en" | "am">("en")
  const [loading, setLoading] = useState(false)
    const { show: toast } = useToast()
  const [formData, setFormData] = useState({
    name: department?.name || "",
    nameAm: department?.nameAm || "",
    description: department?.description || "",
    isActive: department?.isActive ?? true,
  })

  const statuses = [
    { value: "true", label: language === "en" ? "Active" : "ንቁ" },
    { value: "false", label: language === "en" ? "Inactive" : "ንቁ ያልሆነ" },
  ]


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        name: formData.name.trim(),
        nameAm: formData.nameAm?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        isActive: Boolean(formData.isActive),
      }

      if (onSubmit) {
        await onSubmit(payload)
      }

      onClose()
    } catch (err) {
      console.error("Failed to submit department:", err)
      toast({
        title: language === "en" ? "Error" : "ስህተት",
        description:
          language === "en"
            ? "Failed to save department"
            : "ክፍል መዝግብ አልተሳካም",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {language === "en" ? "Department Information" : "የክፍል መረጃ"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{language === "en" ? "Department Name" : "የክፍል ስም"} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={language === "en" ? "Enter department name" : "የክፍል ስም ያስገቡ"}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameAm">{language === "en" ? "Department Name (Amharic)" : "የክፍል ስም (አማርኛ)"}</Label>
              <Input
                id="nameAm"
                value={formData.nameAm}
                onChange={(e) => setFormData((prev) => ({ ...prev, nameAm: e.target.value }))}
                placeholder={language === "en" ? "Optional" : "አማራጭ"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{language === "en" ? "Description" : "መግለጫ"}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={language === "en" ? "Short description of the department" : "የክፍሉ አጭር መግለጫ"}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            {language === "en" ? "Status" : "ሁኔታ"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">{language === "en" ? "Department Status" : "የክፍል ሁኔታ"}</Label>
            <Select
              value={String(formData.isActive)}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, isActive: value === "true" }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={language === "en" ? "Select status" : "ሁኔታ ይምረጡ"} />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          {language === "en" ? "Cancel" : "ይቅር"}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading
            ? language === "en"
              ? "Saving..."
              : "በመቀመጥ ላይ..."
            : department
            ? language === "en"
              ? "Update Department"
              : "ክፍል ያዘምኑ"
            : language === "en"
            ? "Create Department"
            : "ክፍል ይፍጠሩ"}
        </Button>
      </div>
    </form>
  )
}
