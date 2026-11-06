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

export default function NewComplaintPage() {
  const router = useRouter();
  
  // Check secret code status
  useSecretCodeCheck('/ethics/complaints/new');
  
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
    subject: "",
    perpetratorPosition: "",
    incidentDate: "",
    incidentLocation: "",
    description: "",
    priority: "Low",
    consentDeclaration: false,
    consentAccuracy: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [perpetratorType, setPerpetratorType] = useState<"person" | "department" | "">("");

  // Auto-populate user information from JWT token
  useEffect(() => {
    const userName = getCurrentUserName();
    const userPhone = getCurrentUserPhone();
    const userEmail = getCurrentUserEmail();
    const userPosition = getCurrentUserPosition();

    if (userName) {
      setFormData((prev) => ({ ...prev, complainantName: userName }));
    }
    if (userPhone) {
      setFormData((prev) => ({ ...prev, complainantPhone: userPhone }));
    }
    if (userEmail) {
      setFormData((prev) => ({ ...prev, complainantEmail: userEmail }));
    }
    if (userPosition) {
      setFormData((prev) => ({ ...prev, complainantPosition: userPosition }));
    }

    // Fetch user's department from JWT token or backend API
    const fetchUserDepartment = async () => {
      try {
        const token = readToken();
        console.log('Fetching user department with token:', token ? 'present' : 'missing');
        
        // First try to get department from JWT token (fastest)
        if (token) {
          try {
            const parts = token.split(".");
            if (parts.length >= 2) {
              const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
              const json = atob(payload);
              const decoded = JSON.parse(json);
            console.log('Decoded JWT token:', decoded);
              
              // Check for department name in token
              if (decoded.department) {
                console.log('Department found in JWT token:', decoded.department);
                setFormData((prev) => ({ ...prev, complainantDepartment: decoded.department }));
                return;
              }
            }
          } catch (error) {
            console.error('Error decoding JWT token:', error);
          }
        }

        // Fallback: fetch from backend using users API
        const userId = getCurrentUserId();
        if (userId) {
          console.log('Fetching user data from backend for user ID:', userId);
          const response = await fetch(`http://localhost:4000/api/users/${userId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          console.log('User data response status:', response.status);
          if (response.ok) {
            const userData = await response.json();
            console.log('User data from API:', userData);
            if (userData.department) {
              console.log('Setting complainant department to:', userData.department);
              setFormData((prev) => ({ ...prev, complainantDepartment: userData.department }));
              return;
            } else {
              console.log('No department field in user data from API');
            }
          } else {
            console.error('Failed to fetch user data, status:', response.status);
          }
        }
      } catch (error) {
        console.error('Error fetching user department:', error);
      }
    };
    fetchUserDepartment();
  }, []);

  // Fetch departments from API
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = readToken();
        const response = await fetch('http://localhost:4000/api/departments', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Departments API response:', data);
          // Handle different response formats
          const departmentsArray = Array.isArray(data) ? data : (data?.departments || data?.data || []);
          console.log('Departments array:', departmentsArray);
          setDepartments(departmentsArray);
        } else {
          console.error('Departments API response not OK:', response.status);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        setDepartments([]);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = readToken();
        const response = await fetch('http://localhost:4000/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          // Handle different response formats
          const usersArray = Array.isArray(data) ? data : (data?.users || data?.data || []);
          setUsers(usersArray);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      }
    };
    fetchUsers();
  }, []);

  // Auto-populate complainant name with current user's name
  useEffect(() => {
    const token = readToken();
    if (!token) return;

    try {
      // Decode JWT to get firstName and lastName from token
      const parts = token.split(".");
      if (parts.length >= 2) {
        const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const json = atob(payload);
        const decoded = JSON.parse(json);
        
        const firstName = decoded.firstName || decoded.given_name || '';
        const lastName = decoded.lastName || decoded.family_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        if (fullName && !formData.complainantName) {
          setFormData(prev => ({ ...prev, complainantName: fullName }));
        }
      }
    } catch (error) {
      console.error('Error decoding token for name:', error);
      // Fallback to getCurrentUserName
      const userName = getCurrentUserName();
      if (userName && !formData.complainantName) {
        setFormData(prev => ({ ...prev, complainantName: userName }));
      }
    }
  }, []);

  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEvidenceFiles(Array.from(e.target.files));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    if (!formData.description || formData.description.length < 50) {
      newErrors.description = "Description must be at least 50 characters";
    }
    if (!formData.incidentDate) {
      newErrors.incidentDate = "Incident date is required";
    }
    if (!formData.priority) {
      newErrors.priority = "Priority is required";
    }
    if (!formData.isAnonymous && !formData.complainantName) {
      newErrors.complainantName = "Complainant name is required for non-anonymous reports";
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
      // Submit to backend API
      const token = readToken();
      console.log('Submitting complaint with data:', formData);
      const response = await fetch('http://localhost:4000/api/ethics/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          isInternal: true, // Internal complaint from logged-in employee
          reportingChannel: "employee",
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to submit complaint: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("Complaint submitted successfully:", result);

      // Redirect to complaints list
      router.push("/ethics/anticorruption");
    } catch (error) {
      console.error("Error submitting complaint:", error);
      setErrors({ submit: "Failed to submit complaint. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      // TODO: Save draft to backend
      console.log("Saving draft:", formData);
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.push("/ethics/anticorruption");
    } catch (error) {
      console.error("Error saving draft:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="w-full h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">አዲስ ጥቆማ</h1>
              <p className="text-gray-600 mt-1">Submit a new misconduct report</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-6 flex-1 overflow-y-auto">
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <p className="text-sm text-red-800">{errors.submit}</p>
              </div>
            )}

            {/* Reporting Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">የጥቆማ መረጃ</h2>

              <div className="space-y-2">
                <Label htmlFor="priority">ቅድሚያ</Label>
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isAnonymous"
                  checked={formData.isAnonymous}
                  onCheckedChange={(checked) => handleChange("isAnonymous", checked)}
                />
                <Label htmlFor="isAnonymous" className="cursor-pointer">
                  ስሜ እንዲጠቀስ አልፈልግም (identity will be protected)
                </Label>
              </div>

              {!formData.isAnonymous && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      onClick={async () => {
                        const token = readToken();
                        if (!token) return;
                        
                        // Try to fetch user data from backend
                        try {
                          const response = await fetch('http://localhost:4000/api/auth/me', {
                            headers: {
                              'Authorization': `Bearer ${token}`,
                            },
                          });
                          if (response.ok) {
                            const userData = await response.json();
                            const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
                            if (fullName) {
                              setFormData(prev => ({ ...prev, complainantName: fullName }));
                              return;
                            }
                          }
                        } catch (error) {
                          console.error('Error fetching user from backend:', error);
                        }

                        // Fallback: try to decode JWT token
                        try {
                          const parts = token.split(".");
                          if (parts.length >= 2) {
                            const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
                            const json = atob(payload);
                            const decoded = JSON.parse(json);
                            console.log('Decoded token:', decoded);
                            const firstName = decoded.firstName || decoded.given_name || '';
                            const lastName = decoded.lastName || decoded.family_name || '';
                            const fullName = `${firstName} ${lastName}`.trim();
                            if (fullName) {
                              setFormData(prev => ({ ...prev, complainantName: fullName }));
                            } else {
                              // Last resort: use email
                              const email = decoded.email || '';
                              if (email) {
                                setFormData(prev => ({ ...prev, complainantName: email }));
                              }
                            }
                          }
                        } catch (error) {
                          console.error('Error decoding token for name:', error);
                        }
                      }}
                    >
                      የእኔ ስም
                    </Button>
                    {formData.complainantName && (
                      <p className="text-sm text-gray-700 mt-2">{formData.complainantName}</p>
                    )}
                    {errors.complainantName && (
                      <p className="text-sm text-red-600">{errors.complainantName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complainantPhone">Phone</Label>
                    <Input
                      id="complainantPhone"
                      type="tel"
                      value={formData.complainantPhone}
                      onChange={(e) => handleChange("complainantPhone", e.target.value)}
                      placeholder="+251..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complainantPosition">የስራ መደብ (Position)</Label>
                    <Input
                      id="complainantPosition"
                      type="text"
                      value={formData.complainantPosition}
                      readOnly
                      className="bg-gray-50"
                      placeholder="Position will be auto-filled"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="complainantDepartment">የጠቋሚ የስራ ክፍል</Label>
                    <Input
                      id="complainantDepartment"
                      type="text"
                      value={formData.complainantDepartment}
                      readOnly
                      className="bg-gray-50"
                      placeholder="Department will be auto-filled"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Complaint Details */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">የጥቆማ ዝርዝር መረጃ</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">
                    የጥቆማ ምድብ <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleChange("category", value)}
                  >
                    <SelectTrigger id="category" className={errors.category ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ሙስና">ሙስና</SelectItem>
                      <SelectItem value="ጉቦ">ጉቦ</SelectItem>
                      <SelectItem value="ጉቦ መጠየቅ">ጉቦ መጠየቅ</SelectItem>
                      <SelectItem value="ሕገወጥ ክፍያ መቀበል">ሕገወጥ ክፍያ መቀበል</SelectItem>
                      <SelectItem value="በማስፈራራት ገንዘብ ወይም ጥቅም መጠየቅ">በማስፈራራት ገንዘብ ወይም ጥቅም መጠየቅ</SelectItem>
                      <SelectItem value="ሕገወጥ የኮሚሽን ክፍያ መቀበል">ሕገወጥ የኮሚሽን ክፍያ መቀበል</SelectItem>
                      <SelectItem value="ተገቢ ያልሆኑ ስጦታዎችና ጥቅሞች">ተገቢ ያልሆኑ ስጦታዎችና ጥቅሞች</SelectItem>
                      <SelectItem value="የሕዝብ ሥልጣንን ለግል ጥቅም መጠቀም">የሕዝብ ሥልጣንን ለግል ጥቅም መጠቀም</SelectItem>
                      <SelectItem value="የሙስና ድርጊትን መደበቅ">የሙስና ድርጊትን መደበቅ</SelectItem>
                      <SelectItem value="አገልግሎትን ለማፋጠን ተብሎ ሕገወጥ ክፍያ መጠየቅ">አገልግሎትን ለማፋጠን ተብሎ ሕገወጥ ክፍያ መጠየቅ</SelectItem>
                      <SelectItem value="የሕዝብ ገንዘብን ማጭበርበር">የሕዝብ ገንዘብን ማጭበርበር</SelectItem>
                      <SelectItem value="የገንዘብ ማጭበርበር">የገንዘብ ማጭበርበር</SelectItem>
                      <SelectItem value="በጀትን ለተፈቀደለት ዓላማ ውጪ መጠቀም">በጀትን ለተፈቀደለት ዓላማ ውጪ መጠቀም</SelectItem>
                      <SelectItem value="የደመወዝ ማጭበርበር">የደመወዝ ማጭበርበር</SelectItem>
                      <SelectItem value="በስም ብቻ የተመዘገቡ ሠራተኞችን በመጠቀም ማጭበርበር">በስም ብቻ የተመዘገቡ ሠራተኞችን በመጠቀም ማጭበርበር</SelectItem>
                      <SelectItem value="ያልተፈቀደ ወጪ ማድረግ">ያልተፈቀደ ወጪ ማድረግ</SelectItem>
                      <SelectItem value="የፋይናንስ መዝገቦችን ማጭበርበር">የፋይናንስ መዝገቦችን ማጭበርበር</SelectItem>
                      <SelectItem value="የትንሽ ወጪ ገንዘብን አላግባብ መጠቀም">የትንሽ ወጪ ገንዘብን አላግባብ መጠቀም</SelectItem>
                      <SelectItem value="ያልተፈቀዱ የባንክ ግብይቶች">ያልተፈቀዱ የባንክ ግብይቶች</SelectItem>
                      <SelectItem value="የግብር ማጭበርበር">የግብር ማጭበርበር</SelectItem>
                      <SelectItem value="ሥልጣንን አላግባብ መጠቀም">ሥልጣንን አላግባብ መጠቀም</SelectItem>
                      <SelectItem value="የሥልጣን አላግባብ አጠቃቀም">የሥልጣን አላግባብ አጠቃቀም</SelectItem>
                      <SelectItem value="ያለ ተገቢ መሠረት ውሳኔ መስጠት">ያለ ተገቢ መሠረት ውሳኔ መስጠት</SelectItem>
                      <SelectItem value="በባለሥልጣናት ማስፈራራት">በባለሥልጣናት ማስፈራራት</SelectItem>
                      <SelectItem value="በግድ ወይም በጫና ድርጊት ማስፈጸም">በግድ ወይም በጫና ድርጊት ማስፈጸም</SelectItem>
                      <SelectItem value="ሕገወጥ ትዕዛዝ መስጠት">ሕገወጥ ትዕዛዝ መስጠት</SelectItem>
                      <SelectItem value="የፍሳሽ ሥልጣንን አላግባብ መጠቀም">የፍሳሽ ሥልጣንን አላግባብ መጠቀም</SelectItem>
                      <SelectItem value="ቅሬታ አቅራቢዎችን በበቀል መጉዳት">ቅሬታ አቅራቢዎችን በበቀል መጉዳት</SelectItem>
                      <SelectItem value="ጥቆማ አቅራቢዎችን በበቀል መጉዳት">ጥቆማ አቅራቢዎችን በበቀል መጉዳት</SelectItem>
                      <SelectItem value="ይፋዊ የሥራ ቦታን አላግባብ መጠቀም">ይፋዊ የሥራ ቦታን አላግባብ መጠቀም</SelectItem>
                      <SelectItem value="የጥቅም ግጭት">የጥቅም ግጭት</SelectItem>
                      <SelectItem value="ለዘመዶች ያልተገባ ጥቅም መስጠት">ለዘመዶች ያልተገባ ጥቅም መስጠት</SelectItem>
                      <SelectItem value="አድልዎ">አድልዎ</SelectItem>
                      <SelectItem value="ለጓደኞችና ለቅርብ ወዳጆች ያልተገባ ጥቅም መስጠት">ለጓደኞችና ለቅርብ ወዳጆች ያልተገባ ጥቅም መስጠት</SelectItem>
                      <SelectItem value="ያልተገለጹ የገንዘብ ጥቅሞች">ያልተገለጹ የገንዘብ ጥቅሞች</SelectItem>
                      <SelectItem value="ንብረትን አለማሳወቅ">ንብረትን አለማሳወቅ</SelectItem>
                      <SelectItem value="ያልተገለጸ የውጭ ሥራ">ያልተገለጸ የውጭ ሥራ</SelectItem>
                      <SelectItem value="በይፋዊ ውሳኔዎች ውስጥ የግል ጥቅም ማስገባት">በይፋዊ ውሳኔዎች ውስጥ የግል ጥቅም ማስገባት</SelectItem>
                      <SelectItem value="ተገቢ ያልሆነ ተጽዕኖ ማሳደር">ተገቢ ያልሆነ ተጽዕኖ ማሳደር</SelectItem>
                      <SelectItem value="ለቅርብ ተባባሪዎች ያልተገባ ጥቅም መስጠት">ለቅርብ ተባባሪዎች ያልተገባ ጥቅም መስጠት</SelectItem>
                      <SelectItem value="የግዥ ሥርዓት ጥሰት">የግዥ ሥርዓት ጥሰት</SelectItem>
                      <SelectItem value="የጨረታ ሂደትን ማጭበርበር">የጨረታ ሂደትን ማጭበርበር</SelectItem>
                      <SelectItem value="በጨረታ ላይ ሕገወጥ ስምምነት ማድረግ">በጨረታ ላይ ሕገወጥ ስምምነት ማድረግ</SelectItem>
                      <SelectItem value="የውል ማጭበርበር">የውል ማጭበርበር</SelectItem>
                      <SelectItem value="ለአንዳንድ አቅራቢዎች አድልዎ ማድረግ">ለአንዳንድ አቅራቢዎች አድልዎ ማድረግ</SelectItem>
                      <SelectItem value="ያለ ፈቃድ የውል ማሻሻያ ማድረግ">ያለ ፈቃድ የውል ማሻሻያ ማድረግ</SelectItem>
                      <SelectItem value="የውል ዋጋን ከመጠን በላይ ማሳደግ">የውል ዋጋን ከመጠን በላይ ማሳደግ</SelectItem>
                      <SelectItem value="የአቅራቢ የተሳሳተ መረጃ መስጠት">የአቅራቢ የተሳሳተ መረጃ መስጠት</SelectItem>
                      <SelectItem value="ከተቋራጮች ጋር ሕገወጥ ስምምነት ማድረግ">ከተቋራጮች ጋር ሕገወጥ ስምምነት ማድረግ</SelectItem>
                      <SelectItem value="መስፈርቱን የማሟሉ ዕቃዎችን መቀበል">መስፈርቱን የማሟሉ ዕቃዎችን መቀበል</SelectItem>
                      <SelectItem value="የቅጥር ሥርዓት ጥሰት">የቅጥር ሥርዓት ጥሰት</SelectItem>
                      <SelectItem value="የዕድገት ሥርዓት ጥሰት">የዕድገት ሥርዓት ጥሰት</SelectItem>
                      <SelectItem value="ፍትሃዊ ያልሆነ የሥራ አፈጻጸም ግምገማ">ፍትሃዊ ያልሆነ የሥራ አፈጻጸም ግምገማ</SelectItem>
                      <SelectItem value="ከሥራ በሕገወጥ መንገድ ማሰናበት">ከሥራ በሕገወጥ መንገድ ማሰናበት</SelectItem>
                      <SelectItem value="በቅጥርና በሥራ ላይ መድልዎ">በቅጥርና በሥራ ላይ መድልዎ</SelectItem>
                      <SelectItem value="በሥራ ቦታ ትንኮሳ">በሥራ ቦታ ትንኮሳ</SelectItem>
                      <SelectItem value="ወሲባዊ ትንኮሳ">ወሲባዊ ትንኮሳ</SelectItem>
                      <SelectItem value="በሥራ ቦታ ማንገላታት">በሥራ ቦታ ማንገላታት</SelectItem>
                      <SelectItem value="ያለ ፈቃድ ከሥራ መቅረት">ያለ ፈቃድ ከሥራ መቅረት</SelectItem>
                      <SelectItem value="የሥራ መገኘትና የሰዓት መዝገብ ማጭበርበር">የሥራ መገኘትና የሰዓት መዝገብ ማጭበርበር</SelectItem>
                      <SelectItem value="የመንግሥት ንብረት ስርቆት">የመንግሥት ንብረት ስርቆት</SelectItem>
                      <SelectItem value="የመንግሥት ተሽከርካሪዎችን አላግባብ መጠቀም">የመንግሥት ተሽከርካሪዎችን አላግባብ መጠቀም</SelectItem>
                      <SelectItem value="የነዳጅ ኩፖን አላግባብ መጠቀም">የነዳጅ ኩፖን አላግባብ መጠቀም</SelectItem>
                      <SelectItem value="የቢሮ ዕቃዎችን አላግባብ መጠቀም">የቢሮ ዕቃዎችን አላግባብ መጠቀም</SelectItem>
                      <SelectItem value="ያለ ፈቃድ ንብረትን ማስወገድ">ያለ ፈቃድ ንብረትን ማስወገድ</SelectItem>
                      <SelectItem value="በቸልተኝነት የሕዝብ ንብረትን ማጣት ወይም ማበላሸት">በቸልተኝነት የሕዝብ ንብረትን ማጣት ወይም ማበላሸት</SelectItem>
                      <SelectItem value="የሕዝብ ሀብትን ማባከን">የሕዝብ ሀብትን ማባከን</SelectItem>
                      <SelectItem value="የመንግሥት ተቋማትን ያለ ፈቃድ መጠቀም">የመንግሥት ተቋማትን ያለ ፈቃድ መጠቀም</SelectItem>
                      <SelectItem value="የመንግሥት ገንዘብን ለግል ዓላማ መጠቀም">የመንግሥት ገንዘብን ለግል ዓላማ መጠቀም</SelectItem>
                      <SelectItem value="የሕዝብ ሀብትን ያለ ፈቃድ ለፖለቲካዊ ተግባራት መጠቀም">የሕዝብ ሀብትን ያለ ፈቃድ ለፖለቲካዊ ተግባራት መጠቀም</SelectItem>
                      <SelectItem value="ይፋዊ ሰነዶችን ማጭበርበር">ይፋዊ ሰነዶችን ማጭበርበር</SelectItem>
                      <SelectItem value="መዝገቦችን ማጭበርበር">መዝገቦችን ማጭበርበር</SelectItem>
                      <SelectItem value="ያለ ፈቃድ መረጃ ማሳወቅ">ያለ ፈቃድ መረጃ ማሳወቅ</SelectItem>
                      <SelectItem value="የምስጢር ጥበቃ ግዴታን መጣስ">የምስጢር ጥበቃ ግዴታን መጣስ</SelectItem>
                      <SelectItem value="ያለ ፈቃድ ይፋዊ መዝገቦችን ማግኘት">ያለ ፈቃድ ይፋዊ መዝገቦችን ማግኘት</SelectItem>
                      <SelectItem value="ይፋዊ መዝገቦችን ማጥፋት">ይፋዊ መዝገቦችን ማጥፋት</SelectItem>
                      <SelectItem value="ማስረጃን መደበቅ">ማስረጃን መደበቅ</SelectItem>
                      <SelectItem value="ማስረጃን መቀየር ወይም ማበላሸት">ማስረጃን መቀየር ወይም ማበላሸት</SelectItem>
                      <SelectItem value="የተጭበረበሩ ማረጋገጫዎች ወይም ምስክር ወረቀቶች">የተጭበረበሩ ማረጋገጫዎች ወይም ምስክር ወረቀቶች</SelectItem>
                      <SelectItem value="የግል መረጃን አላግባብ መጠቀም">የግል መረጃን አላግባብ መጠቀም</SelectItem>
                      <SelectItem value="የሕዝብ አገልግሎትን ያለ ተገቢ ምክንያት ማዘግየት">የሕዝብ አገልግሎትን ያለ ተገቢ ምክንያት ማዘግየት</SelectItem>
                      <SelectItem value="የሕዝብ አገልግሎትን ያለ ተገቢ ምክንያት መከልከል">የሕዝብ አገልግሎትን ያለ ተገቢ ምክንያት መከልከል</SelectItem>
                      <SelectItem value="ያልተፈቀደ የአገልግሎት ክፍያ መጠየቅ">ያልተፈቀደ የአገልግሎት ክፍያ መጠየቅ</SelectItem>
                      <SelectItem value="ሙያዊ ሥነ-ምግባርን የሚጥስ ባህሪ">ሙያዊ ሥነ-ምግባርን የሚጥስ ባህሪ</SelectItem>
                      <SelectItem value="የሥራ ግዴታን በቸልተኝነት አለመወጣት">የሥራ ግዴታን በቸልተኝነት አለመወጣት</SelectItem>
                      <SelectItem value="የተቀመጡ ሥነ-ሥርዓቶችን አለመከተል">የተቀመጡ ሥነ-ሥርዓቶችን አለመከተል</SelectItem>
                      <SelectItem value="ፍትሃዊ ያልሆነ አስተዳደራዊ ውሳኔ">ፍትሃዊ ያልሆነ አስተዳደራዊ ውሳኔ</SelectItem>
                      <SelectItem value="የቅሬታ አያያዝ ሂደትን አላግባብ መጠቀም">የቅሬታ አያያዝ ሂደትን አላግባብ መጠቀም</SelectItem>
                      <SelectItem value="ለይፋዊ ጥያቄዎች ምላሽ አለመስጠት">ለይፋዊ ጥያቄዎች ምላሽ አለመስጠት</SelectItem>
                      <SelectItem value="ያለ ተገቢ ምክንያት ለአንዳንድ ሰዎች ተመራጭ አገልግሎት መስጠት">ያለ ተገቢ ምክንያት ለአንዳንድ ሰዎች ተመራጭ አገልግሎት መስጠት</SelectItem>
                      <SelectItem value="የሥነ-ምግባር ደንብን መጣስ">የሥነ-ምግባር ደንብን መጣስ</SelectItem>
                      <SelectItem value="የጥቅም ግጭትን አለማሳወቅ">የጥቅም ግጭትን አለማሳወቅ</SelectItem>
                      <SelectItem value="የተሳሳተ መግለጫ መስጠት">የተሳሳተ መግለጫ መስጠት</SelectItem>
                      <SelectItem value="የዲሲፕሊን ሂደትን አላግባብ መጠቀም">የዲሲፕሊን ሂደትን አላግባብ መጠቀም</SelectItem>
                      <SelectItem value="ምርመራን ማደናቀፍ">ምርመራን ማደናቀፍ</SelectItem>
                      <SelectItem value="በመርማሪዎች ሥራ ላይ ጣልቃ መግባት">በመርማሪዎች ሥራ ላይ ጣልቃ መግባት</SelectItem>
                      <SelectItem value="በምርመራ ወቅት የተሳሳተ መረጃ መስጠት">በምርመራ ወቅት የተሳሳተ መረጃ መስጠት</SelectItem>
                      <SelectItem value="ከምርመራ ጋር መተባበር አለመቻል">ከምርመራ ጋር መተባበር አለመቻል</SelectItem>
                      <SelectItem value="ሥነ-ምግባርን የሚጥስ ፖለቲካዊ ወይም የግል ተጽዕኖ">ሥነ-ምግባርን የሚጥስ ፖለቲካዊ ወይም የግል ተጽዕኖ</SelectItem>
                      <SelectItem value="ሌሎች የሥነ-ምግባርና የፀረ-ሙስና ቅሬታዎች">ሌሎች የሥነ-ምግባርና የፀረ-ሙስና ቅሬታዎች</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-red-600">{errors.category}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => handleChange("department", value)}
                  >
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(departments) && departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name || dept.departmentName}>
                          {dept.name || dept.departmentName}
                        </SelectItem>
                      ))}
                      {(!Array.isArray(departments) || departments.length === 0) && (
                        <div className="px-2 py-1 text-sm text-gray-500">
                          No departments available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="perpetratorType">ድርጊቱን የፈፀመዉ</Label>
                <Select
                  value={perpetratorType}
                  onValueChange={(value: "person" | "department") => {
                    setPerpetratorType(value);
                    setFormData((prev) => ({ ...prev, subject: "" }));
                  }}
                >
                  <SelectTrigger id="perpetratorType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="person">Person</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {perpetratorType === "person" && (
                <div className="space-y-2">
                  <Label htmlFor="subject">Select Person</Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) => {
                      handleChange("subject", value);
                      // Auto-populate perpetrator position when a person is selected
                      const selectedUser = users.find(u => `${u.firstName} ${u.lastName}` === value);
                      if (selectedUser && selectedUser.position) {
                        handleChange("perpetratorPosition", selectedUser.position);
                      }
                    }}
                  >
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="Select a person" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(users) && users.map((user) => (
                        <SelectItem key={user.id} value={`${user.firstName} ${user.lastName}`}>
                          {user.firstName} {user.lastName} - {user.position || 'No position'}
                        </SelectItem>
                      ))}
                      {(!Array.isArray(users) || users.length === 0) && (
                        <div className="px-2 py-1 text-sm text-gray-500">
                          No users available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {perpetratorType === "person" && formData.subject && (
                <div className="space-y-2">
                  <Label htmlFor="perpetratorPosition">የስራ መደብ (Position)</Label>
                  <Input
                    id="perpetratorPosition"
                    type="text"
                    value={formData.perpetratorPosition}
                    readOnly
                    className="bg-gray-50"
                    placeholder="Position will be auto-filled"
                  />
                </div>
              )}

              {perpetratorType === "department" && (
                <div className="space-y-2">
                  <Label htmlFor="subject">Select Department</Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) => handleChange("subject", value)}
                  >
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(departments) && departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name || dept.departmentName}>
                          {dept.name || dept.departmentName}
                        </SelectItem>
                      ))}
                      {(!Array.isArray(departments) || departments.length === 0) && (
                        <div className="px-2 py-1 text-sm text-gray-500">
                          No departments available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="incidentDate">
                    ጉዳዩ የተፈጠረበት ቀን <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="incidentDate"
                    type="date"
                    value={formData.incidentDate}
                    onChange={(e) => handleChange("incidentDate", e.target.value)}
                    className={errors.incidentDate ? "border-red-500" : ""}
                  />
                  {errors.incidentDate && (
                    <p className="text-sm text-red-600">{errors.incidentDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="incidentLocation">ጉዳዩ የተፈጠረበት ቦታ</Label>
                  <Input
                    id="incidentLocation"
                    value={formData.incidentLocation}
                    onChange={(e) => handleChange("incidentLocation", e.target.value)}
                    placeholder="Location of the incident"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  ዝርዝር መረጃ <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Provide a detailed account of the allegation (minimum 50 characters)"
                  rows={6}
                  className={errors.description ? "border-red-500" : ""}
                />
                <p className="text-sm text-gray-500">
                  {formData.description.length} /
                </p>
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description}</p>
                )}
              </div>
            </div>

            {/* Evidence Upload */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">ደጋፊ ማስረጃዎች</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop files here, or click to select
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB per file)
                </p>
                <Input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button type="button" variant="outline" className="cursor-pointer">
                    Choose Files
                  </Button>
                </label>
                {evidenceFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {evidenceFiles.map((file, idx) => (
                      <div key={idx} className="text-sm text-gray-700 bg-gray-50 rounded px-3 py-2">
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Consent and Declaration */}
            <div className="space-y-4 border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900">Consent and Declaration</h2>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="consentDeclaration"
                    checked={formData.consentDeclaration}
                    onCheckedChange={(checked) => handleChange("consentDeclaration", checked)}
                    className="mt-1"
                  />
                  <label htmlFor="consentDeclaration" className="text-sm text-gray-700 cursor-pointer">
                    I understand that this complaint will be processed according to FCSC procedures. I consent to the processing of my personal information for this purpose.
                    <span className="text-red-500">*</span>
                  </label>
                </div>
                {errors.consentDeclaration && (
                  <p className="text-sm text-red-600 ml-6">{errors.consentDeclaration}</p>
                )}

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="consentAccuracy"
                    checked={formData.consentAccuracy}
                    onCheckedChange={(checked) => handleChange("consentAccuracy", checked)}
                    className="mt-1"
                  />
                  <label htmlFor="consentAccuracy" className="text-sm text-gray-700 cursor-pointer">
                    I declare that the information provided in this complaint is accurate and truthful to the best of my knowledge. I understand that providing false information may have legal consequences.
                    <span className="text-red-500">*</span>
                  </label>
                </div>
                {errors.consentAccuracy && (
                  <p className="text-sm text-red-600 ml-6">{errors.consentAccuracy}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={loading}
              >
                Save Draft
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Complaint"}
              </Button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
