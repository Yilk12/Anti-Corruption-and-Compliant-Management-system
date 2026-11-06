"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { useSecretCodeCheck } from "@/app/hooks/use-secret-code-check";

export default function NewInvestigationPage() {
  const router = useRouter();
  
  // Check secret code status
  useSecretCodeCheck('/ethics/investigations/new');
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    complaintId: "",
    caseNumber: "",
    title: "",
    description: "",
    priority: "Low",
    assigneeId: "",
    supervisorId: "",
    startDate: "",
    targetEndDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.complaintId) {
      newErrors.complaintId = "Complaint ID is required";
    }
    if (!formData.title) {
      newErrors.title = "Case title is required";
    }
    if (!formData.description || formData.description.length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    }
    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }
    if (!formData.targetEndDate) {
      newErrors.targetEndDate = "Target end date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // TODO: Submit to backend API
      console.log("Creating investigation:", formData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to investigations list
      router.push("/ethics/investigations");
    } catch (error) {
      console.error("Error creating investigation:", error);
      setErrors({ submit: "Failed to create investigation. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6 max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">New Investigation Case</h1>
              <p className="text-gray-600 mt-1">Create a new investigation case</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <p className="text-sm text-red-800">{errors.submit}</p>
              </div>
            )}

            {/* Case Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Case Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="complaintId">
                    Complaint ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="complaintId"
                    value={formData.complaintId}
                    onChange={(e) => handleChange("complaintId", e.target.value)}
                    className={errors.complaintId ? "border-red-500" : ""}
                    placeholder="e.g., FCSC-2024-0001"
                  />
                  {errors.complaintId && (
                    <p className="text-sm text-red-600">{errors.complaintId}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => handleChange("priority", value)}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">
                  Case Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className={errors.title ? "border-red-500" : ""}
                  placeholder="Brief title for the investigation"
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Detailed description of the investigation scope and objectives"
                  rows={4}
                  className={errors.description ? "border-red-500" : ""}
                />
                <p className="text-sm text-gray-500">
                  {formData.description.length} / 20 characters minimum
                </p>
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description}</p>
                )}
              </div>
            </div>

            {/* Assignment */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Assignment</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assigneeId">Investigator</Label>
                  <Select
                    value={formData.assigneeId}
                    onValueChange={(value) => handleChange("assigneeId", value)}
                  >
                    <SelectTrigger id="assigneeId">
                      <SelectValue placeholder="Select investigator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">John Doe</SelectItem>
                      <SelectItem value="2">Jane Smith</SelectItem>
                      <SelectItem value="3">Michael Johnson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supervisorId">Supervisor</Label>
                  <Select
                    value={formData.supervisorId}
                    onValueChange={(value) => handleChange("supervisorId", value)}
                  >
                    <SelectTrigger id="supervisorId">
                      <SelectValue placeholder="Select supervisor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Sarah Williams</SelectItem>
                      <SelectItem value="2">David Brown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Timeline</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">
                    Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleChange("startDate", e.target.value)}
                    className={errors.startDate ? "border-red-500" : ""}
                  />
                  {errors.startDate && (
                    <p className="text-sm text-red-600">{errors.startDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetEndDate">
                    Target End Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="targetEndDate"
                    type="date"
                    value={formData.targetEndDate}
                    onChange={(e) => handleChange("targetEndDate", e.target.value)}
                    className={errors.targetEndDate ? "border-red-500" : ""}
                  />
                  {errors.targetEndDate && (
                    <p className="text-sm text-red-600">{errors.targetEndDate}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Case"}
              </Button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
