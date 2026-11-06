"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, AlertCircle, Upload } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Checkbox } from "@/app/components/ui/checkbox";
import { useSecretCodeCheck } from "@/app/hooks/use-secret-code-check";
import { getCurrentUserName, getCurrentUserPhone, getCurrentUserEmail, getCurrentUserId, getCurrentUserPosition, readToken } from "@/app/lib/auth";

export default function NewAntiCorruptionPage() {
  const router = useRouter();
  
  // Check secret code status
  useSecretCodeCheck('/ethics/anti/corruption/new');
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    isAnonymous: false,
    complainantName: "",
    complainantPhone: "",
    complainantDepartment: "",
    complainantPosition: "",
    category: "",
    institution: "",
    department: "",
    perpetratorPosition: "",
    incidentDate: "",
    incidentLocation: "",
    description: "",
    priority: "MEDIUM",
    consentDeclaration: false,
    consentAccuracy: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [perpetratorType, setPerpetratorType] = useState<"person" | "department" | "">("");
  const [trackingInfo, setTrackingInfo] = useState({
    trackingId: "",
    verificationSecret: "",
  });

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

  // Fetch departments
  useEffect(() => {
    const token = readToken();
    if (!token) return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const base = apiBase.replace(/\/$/, "");

    fetch(`${base}/api/departments`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setDepartments(data);
        }
      })
      .catch(() => setDepartments([]));
  }, []);

  // Fetch users for perpetrator selection
  useEffect(() => {
    const token = readToken();
    if (!token) return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const base = apiBase.replace(/\/$/, "");

    fetch(`${base}/api/users`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data?.data)) {
          setUsers(data.data);
        }
      })
      .catch(() => setUsers([]));
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
    } else if (formData.description.length < 50) {
      newErrors.description = "Description must be at least 50 characters";
    }
    if (!formData.consentDeclaration) {
      newErrors.consentDeclaration = "You must consent to the declaration";
    }
    if (!formData.consentAccuracy) {
      newErrors.consentAccuracy = "You must confirm the accuracy of information";
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

      const submitData: any = {
        category: formData.category,
        description: formData.description,
        priority: formData.priority.charAt(0) + formData.priority.slice(1).toLowerCase(),
        consentDeclaration: formData.consentDeclaration,
        consentAccuracy: formData.consentAccuracy,
        isInternal: true,
        reportingChannel: 'employee',
        isAnonymous: formData.isAnonymous,
      };

      // Only include optional fields if they have values
      if (!formData.isAnonymous) {
        if (formData.complainantName) submitData.complainantName = formData.complainantName;
        if (formData.complainantPhone) submitData.complainantPhone = formData.complainantPhone;
        const userEmail = getCurrentUserEmail();
        if (userEmail) submitData.complainantEmail = userEmail;
        if (formData.complainantDepartment) submitData.complainantDepartment = formData.complainantDepartment;
        if (formData.complainantPosition) submitData.complainantPosition = formData.complainantPosition;
      }

      // Add optional fields
      if (formData.incidentDate) submitData.incidentDate = formData.incidentDate;
      if (formData.incidentLocation) submitData.incidentLocation = formData.incidentLocation;
      if (formData.institution) submitData.institution = formData.institution;
      if (formData.department) submitData.department = formData.department;
      if (formData.perpetratorPosition) submitData.perpetratorPosition = formData.perpetratorPosition;

      console.log("Submitting data:", submitData);

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
        throw new Error(errorData.message || errorData.error || "Failed to submit Ethics and Anti-Corruption report");
      }

      const data = await res.json();
      setTrackingInfo({
        trackingId: data.trackingId || data.id,
        verificationSecret: data.verificationSecret || "N/A",
      });
      alert("Ethics and Anti-Corruption report submitted successfully!");
    } catch (error: any) {
      console.error("Error submitting Ethics and Anti-Corruption report:", error);
      alert(error.message || "Failed to submit Ethics and Anti-Corruption report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrackReport = () => {
    if (trackingInfo.trackingId) {
      router.push(`/track-complaint?trackingId=${trackingInfo.trackingId}`);
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Ethics and Anti-Corruption Report</h1>
            <p className="text-gray-600">Report unethical behavior or corruption incidents</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Anonymous Report Checkbox */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="isAnonymous"
                  checked={formData.isAnonymous}
                  onCheckedChange={(checked) => handleCheckboxChange("isAnonymous", checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="isAnonymous" className="font-semibold">
                    Submit Anonymous Ethics and Anti-Corruption Report
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
                <h2 className="text-lg font-semibold text-gray-900">Complainant Information</h2>
                
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

            {/* Report Details */}
            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Ethics and Anti-Corruption Report Details</h2>

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
                    <SelectItem value="Bribery">Bribery</SelectItem>
                    <SelectItem value="Fraud">Fraud</SelectItem>
                    <SelectItem value="Nepotism">Nepotism</SelectItem>
                    <SelectItem value="Embezzlement">Embezzlement</SelectItem>
                    <SelectItem value="Abuse of Authority">Abuse of Authority</SelectItem>
                    <SelectItem value="Conflict of Interest">Conflict of Interest</SelectItem>
                    <SelectItem value="Favoritism">Favoritism</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-500 mt-1">{errors.category}</p>
                )}
              </div>

              <div>
                <Label htmlFor="institution">Institution/Department Involved</Label>
                <Input
                  id="institution"
                  name="institution"
                  value={formData.institution}
                  onChange={handleChange}
                  placeholder="Name of the institution or department"
                />
              </div>

              <div>
                <Label htmlFor="incidentDate">Incident Date *</Label>
                <Input
                  id="incidentDate"
                  name="incidentDate"
                  type="date"
                  value={formData.incidentDate}
                  onChange={handleChange}
                  className={errors.incidentDate ? "border-red-500" : ""}
                />
                {errors.incidentDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.incidentDate}</p>
                )}
              </div>

              <div>
                <Label htmlFor="incidentLocation">Incident Location</Label>
                <Input
                  id="incidentLocation"
                  name="incidentLocation"
                  value={formData.incidentLocation}
                  onChange={handleChange}
                  placeholder="Where did the incident occur?"
                />
              </div>

              <div>
                <Label htmlFor="description">Description * (minimum 50 characters)</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Provide detailed description of the incident (minimum 50 characters required)"
                  rows={6}
                  className={errors.description ? "border-red-500" : ""}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                )}
                {formData.description && formData.description.length < 50 && (
                  <p className="text-sm text-yellow-600 mt-1">
                    Description must be at least 50 characters (current: {formData.description.length})
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
              <h2 className="text-lg font-semibold text-gray-900">Consent and Declaration</h2>

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
                    I understand that providing false information may result in legal consequences
                  </p>
                  {errors.consentDeclaration && (
                    <p className="text-sm text-red-500 mt-1">{errors.consentDeclaration}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consentAccuracy"
                  checked={formData.consentAccuracy}
                  onCheckedChange={(checked) => handleCheckboxChange("consentAccuracy", checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="consentAccuracy" className="font-semibold">
                    I consent to the processing of this Ethics and Anti-Corruption report in accordance with the organization's policies *
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Your information will be handled confidentially and used only for investigation purposes
                  </p>
                  {errors.consentAccuracy && (
                    <p className="text-sm text-red-500 mt-1">{errors.consentAccuracy}</p>
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
                {loading ? "Submitting..." : "Submit Ethics and Anti-Corruption Report"}
              </Button>
            </div>
          </form>

          {/* Success Message with Tracking ID */}
          {trackingInfo.trackingId && (
            <div className="mt-6 bg-green-50 p-6 rounded-lg space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Ethics and Anti-Corruption Report Submitted Successfully!</h3>
                  <p className="text-green-700">Your report has been recorded and will be investigated.</p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-none space-y-4">
                <div>
                  <Label className="font-semibold">Tracking ID</Label>
                  <div className="mt-1 p-3 bg-white rounded-none border font-mono text-lg">
                    {trackingInfo.trackingId}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Save this ID to track your report status</p>
                </div>

                {trackingInfo.verificationSecret && trackingInfo.verificationSecret !== "N/A" && (
                  <div>
                    <Label className="font-semibold">Verification Secret</Label>
                    <div className="mt-1 p-3 bg-white rounded-none border font-mono text-lg">
                      {trackingInfo.verificationSecret}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Keep this secret for verification purposes</p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 justify-center">
                <Button onClick={handleTrackReport}>
                  Track This Report
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTrackingInfo({ trackingId: "", verificationSecret: "" });
                    router.push("/ethics/anticorruptions");
                  }}
                >
                  Submit Another Report
                </Button>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
