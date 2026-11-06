"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useSecretCodeCheck } from "@/app/hooks/use-secret-code-check";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Shield, Search, Filter, Plus, Eye, CheckCircle, Clock, XCircle, AlertTriangle, ArrowLeft, UserPlus, Upload } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Checkbox } from "@/app/components/ui/checkbox";
import { getCurrentUserName, getCurrentUserPhone, getCurrentUserEmail, getCurrentUserPosition, readToken } from "@/app/lib/auth";

interface Report {
  id: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  complainantName?: string;
  isAnonymous: boolean;
}

export default function AntiCorruptionsPage() {
  const router = useRouter();
  useSecretCodeCheck('/ethics/anticorruptions');

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [investigators, setInvestigators] = useState<any[]>([]);
  const [selectedInvestigator, setSelectedInvestigator] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

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
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);

  useEffect(() => {
    fetchReports();
    fetchDepartments();
    fetchInvestigators();
    fetchUsers();
    
    // Auto-populate user information from JWT token
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

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      const response = await fetch('http://localhost:4000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const usersArray = Array.isArray(data) ? data : (data?.users || data?.data || []);
        setUsers(usersArray);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

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

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      const response = await fetch('http://localhost:4000/api/ethics/anticorruption/reports', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data.data || data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = () => {
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
  };

  const fetchInvestigators = async () => {
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      const response = await fetch('http://localhost:4000/api/users/investigators', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch investigators');
      }

      const data = await response.json();
      setInvestigators(data.data || data || []);
    } catch (error) {
      console.error('Error fetching investigators:', error);
      setInvestigators([]);
    }
  };

  const handleAssignInvestigator = async () => {
    if (!selectedReportId || !selectedInvestigator) {
      return;
    }

    setAssigning(true);
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      const response = await fetch('http://localhost:4000/api/ethics/anticorruption/reports/assign-investigator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          reportId: selectedReportId,
          investigatorId: selectedInvestigator,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign investigator');
      }

      setShowAssignModal(false);
      setSelectedReportId(null);
      setSelectedInvestigator("");
      fetchReports();
    } catch (error) {
      console.error('Error assigning investigator:', error);
      alert('Failed to assign investigator. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
      const response = await fetch('http://localhost:4000/api/ethics/anticorruption/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          isInternal: true,
          reportingChannel: 'employee',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      setShowForm(false);
      setFormData({
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
      fetchReports();
    } catch (error) {
      console.error('Error submitting report:', error);
      setErrors({ submit: "Failed to submit report. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'UNDER_INVESTIGATION':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = searchTerm === "" || 
      report.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || report.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Ethics and Anti-Corruption Reports</h1>
            <p className="text-gray-600">View and manage ethics and anti-corruption reports</p>
          </div>

          {showForm ? (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Submit New Ethics and Anti-Corruption Report</CardTitle>
                  <Button variant="ghost" onClick={() => setShowForm(false)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to List
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Anonymous Option */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isAnonymous"
                      checked={formData.isAnonymous}
                      onCheckedChange={(checked) => setFormData({ ...formData, isAnonymous: checked as boolean })}
                    />
                    <Label htmlFor="isAnonymous">Submit anonymously</Label>
                  </div>

                  {!formData.isAnonymous && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="complainantName">Name *</Label>
                        <Input
                          id="complainantName"
                          value={formData.complainantName}
                          onChange={(e) => setFormData({ ...formData, complainantName: e.target.value })}
                          className={errors.complainantName ? "border-red-500" : ""}
                        />
                        {errors.complainantName && <p className="text-red-500 text-sm mt-1">{errors.complainantName}</p>}
                      </div>
                      <div>
                        <Label htmlFor="complainantPhone">Phone</Label>
                        <Input
                          id="complainantPhone"
                          value={formData.complainantPhone}
                          onChange={(e) => setFormData({ ...formData, complainantPhone: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="complainantDepartment">Department</Label>
                        <Input
                          id="complainantDepartment"
                          value={formData.complainantDepartment}
                          onChange={(e) => setFormData({ ...formData, complainantDepartment: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="complainantPosition">Position</Label>
                        <Input
                          id="complainantPosition"
                          value={formData.complainantPosition}
                          onChange={(e) => setFormData({ ...formData, complainantPosition: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
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
                          <SelectItem value="ያለ ተገቢ መሠረት ፍርድ መስጠት">ያለ ተገቢ መሠረት ፍርድ መስጠት</SelectItem>
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
                          <SelectItem value="ፍትሃዊ ያልሆነ አስተዳደራዊ ፍርድ">ፍትሃዊ ያልሆነ አስተዳደራዊ ፍርድ</SelectItem>
                          <SelectItem value="የቅሬቅ አያያዝ ሂደትን አላግባብ መጠቀም">የቅሬቅ አያያዝ ሂደትን አላግባብ መጠቀም</SelectItem>
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
                          <SelectItem value="ሥነ-ምግባርን የሚጥስ ፖለሲካዊ ወይም የግል ተጽዕኖ">ሥነ-ምግባርን የሚጥስ ፖለቲካዊ ወይም የግል ተጽዕኖ</SelectItem>
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

                  {errors.submit && <p className="text-red-500 text-sm">{errors.submit}</p>}

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Submitting..." : "Submit Complaint"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Filters */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search reports..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-45">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="UNDER_INVESTIGATION">Under Investigation</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="w-45">
                        <SelectValue placeholder="Filter by priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={() => setShowForm(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Report
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Reports List */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <p className="mt-4 text-gray-600">Loading reports...</p>
                </div>
              ) : filteredReports.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No reports found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                        ? "No reports match your search criteria."
                        : "No ethics and anti-corruption reports have been submitted yet."}
                    </p>
                    <Button onClick={() => setShowForm(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Submit New Report
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredReports.map((report) => (
                    <Card
                      key={report.id}
                      className="hover:shadow-lg transition-shadow"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 cursor-pointer" onClick={() => router.push(`/ethics/anticorruption/${report.id}`)}>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getStatusColor(report.status)}>
                                {report.status.replace(/_/g, ' ')}
                              </Badge>
                              <Badge className={getPriorityColor(report.priority)}>
                                {report.priority}
                              </Badge>
                            </div>
                            <CardTitle className="text-lg mb-1">{report.subject}</CardTitle>
                            <p className="text-sm text-gray-600">{report.category}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedReportId(report.id);
                                setShowAssignModal(true);
                              }}
                            >
                              <UserPlus className="mr-2 h-4 w-4" />
                              Assign
                            </Button>
                            <Eye
                              className="h-5 w-5 text-gray-400 cursor-pointer"
                              onClick={() => router.push(`/ethics/anticorruption/${report.id}`)}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {report.description}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div>
                            {report.isAnonymous ? (
                              <span className="flex items-center gap-1">
                                <Shield className="h-4 w-4" />
                                Anonymous
                              </span>
                            ) : (
                              <span>{report.complainantName}</span>
                            )}
                          </div>
                          <div>
                            {new Date(report.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Assign Investigator Modal */}
          {showAssignModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md mx-4">
                <CardHeader>
                  <CardTitle>Assign Officer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="investigator">Select Officer</Label>
                      <Select value={selectedInvestigator} onValueChange={setSelectedInvestigator}>
                        <SelectTrigger id="investigator">
                          <SelectValue placeholder="Choose an officer" />
                        </SelectTrigger>
                        <SelectContent>
                          {investigators.map((investigator) => (
                            <SelectItem key={investigator.id} value={investigator.id}>
                              {investigator.firstName} {investigator.lastName} - {investigator.roles?.join(', ') || 'Ethics Officer'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAssignModal(false);
                          setSelectedReportId(null);
                          setSelectedInvestigator("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAssignInvestigator}
                        disabled={!selectedInvestigator || assigning}
                      >
                        {assigning ? "Assigning..." : "Assign"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
