"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Checkbox } from "@/app/components/ui/checkbox";
import { useSecretCodeCheck } from "@/app/hooks/use-secret-code-check";
import { getCurrentUserName, getCurrentUserPhone, getCurrentUserEmail, getCurrentUserId, getCurrentUserPosition, readToken } from "@/app/lib/auth";

export default function NewFeedbackComplaintPage() {
  const router = useRouter();
  
  // Check secret code status
  useSecretCodeCheck('/ethics/feedback/complaints/new');
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    isAnonymous: false,
    complainantName: "",
    complainantPhone: "",
    complainantDepartment: "",
    complainantPosition: "",
    category: "",
    description: "",
    priority: "MEDIUM",
    consentDeclaration: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-populate user information from JWT token
  useEffect(() => {
    const userName = getCurrentUserName();
    const userPhone = getCurrentUserPhone();
    const userEmail = getCurrentUserEmail();
    const userPosition = getCurrentUserPosition();

    if (userName) {
      setFormData(prev => ({ ...prev, complainantName: userName }));
    }
    if (userPhone) {
      setFormData(prev => ({ ...prev, complainantPhone: userPhone }));
    }
    if (userEmail) {
      setFormData(prev => ({ ...prev, complainantDepartment: userEmail }));
    }
    if (userPosition) {
      setFormData(prev => ({ ...prev, complainantPosition: userPosition }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.isAnonymous && !formData.complainantName) {
      newErrors.complainantName = "Name is required";
    }
    if (!formData.isAnonymous && !formData.complainantPhone) {
      newErrors.complainantPhone = "Phone is required";
    }
    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    if (!formData.description) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    }
    if (!formData.consentDeclaration) {
      newErrors.consentDeclaration = "You must consent to the declaration";
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
      const token = readToken();
      if (!token) {
        throw new Error("No authentication token");
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const base = apiBase.replace(/\/$/, "");

      const submitData = {
        isAnonymous: formData.isAnonymous,
        complainantName: formData.isAnonymous ? undefined : formData.complainantName,
        complainantPhone: formData.isAnonymous ? undefined : formData.complainantPhone,
        complainantEmail: formData.isAnonymous ? undefined : getCurrentUserEmail(),
        complainantDepartment: formData.isAnonymous ? undefined : formData.complainantDepartment,
        complainantPosition: formData.isAnonymous ? undefined : formData.complainantPosition,
        category: formData.category,
        description: formData.description,
        priority: formData.priority,
        consentDeclaration: formData.consentDeclaration,
        consentAccuracy: true,
        isInternal: true,
        reportingChannel: 'EMPLOYEE' as const,
      };

      console.log("Submitting feedback complaint:", submitData);

      const res = await fetch(`${base}/api/ethics/anticorruption/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response:", errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        throw new Error(errorData.message || errorData.error || "Failed to submit complaint");
      }

      const data = await res.json();
      alert("Feedback submitted successfully!");
      router.push("/ethics/feedback");
    } catch (error: any) {
      console.error("Error submitting feedback:", error);
      alert(error.message || "Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Feedback Complaint</h1>
            <p className="text-gray-600">Share your feedback, suggestions, or general complaints</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Anonymous Complaint Checkbox */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="isAnonymous"
                  checked={formData.isAnonymous}
                  onCheckedChange={(checked) => handleCheckboxChange("isAnonymous", checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="isAnonymous" className="font-semibold">
                    Submit Anonymous Feedback
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Your identity will be kept confidential if you choose this option
                  </p>
                </div>
              </div>
            </div>

            {/* Complainant Information */}
            {!formData.isAnonymous && (
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Your Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="complainantName">Full Name *</Label>
                    <Input
                      id="complainantName"
                      name="complainantName"
                      value={formData.complainantName}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className={errors.complainantName ? "border-red-500" : ""}
                    />
                    {errors.complainantName && (
                      <p className="text-sm text-red-500 mt-1">{errors.complainantName}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="complainantPhone">Phone Number *</Label>
                    <Input
                      id="complainantPhone"
                      name="complainantPhone"
                      value={formData.complainantPhone}
                      onChange={handleChange}
                      placeholder="+251911234567"
                      className={errors.complainantPhone ? "border-red-500" : ""}
                    />
                    {errors.complainantPhone && (
                      <p className="text-sm text-red-500 mt-1">{errors.complainantPhone}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="complainantDepartment">Department</Label>
                    <Input
                      id="complainantDepartment"
                      name="complainantDepartment"
                      value={formData.complainantDepartment}
                      onChange={handleChange}
                      placeholder="Your department"
                    />
                  </div>

                  <div>
                    <Label htmlFor="complainantPosition">Position</Label>
                    <Input
                      id="complainantPosition"
                      name="complainantPosition"
                      value={formData.complainantPosition}
                      onChange={handleChange}
                      placeholder="Your position"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Feedback Details */}
            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Feedback Details</h2>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange("category", value)}
                >
                  <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Service">Service Quality</SelectItem>
                    <SelectItem value="Process">Process Improvement</SelectItem>
                    <SelectItem value="Communication">Communication</SelectItem>
                    <SelectItem value="Workplace">Workplace Environment</SelectItem>
                    <SelectItem value="Policy">Policy Feedback</SelectItem>
                    <SelectItem value="General">General Feedback</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-500 mt-1">{errors.category}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description * (minimum 20 characters)</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Provide detailed description of your feedback"
                  rows={6}
                  className={errors.description ? "border-red-500" : ""}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                )}
                {formData.description && formData.description.length < 20 && (
                  <p className="text-sm text-yellow-600 mt-1">
                    Description must be at least 20 characters (current: {formData.description.length})
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="priority">Priority Level</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleSelectChange("priority", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Consent Section */}
            <div className="bg-yellow-50 p-6 rounded-lg space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Consent</h2>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consentDeclaration"
                  checked={formData.consentDeclaration}
                  onCheckedChange={(checked) => handleCheckboxChange("consentDeclaration", checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="consentDeclaration" className="font-semibold">
                    I declare that the information provided is true and accurate to the best of my knowledge *
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    I understand that providing false information may result in consequences
                  </p>
                  {errors.consentDeclaration && (
                    <p className="text-sm text-red-500 mt-1">{errors.consentDeclaration}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
