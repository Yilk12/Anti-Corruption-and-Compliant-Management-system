"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, Filter, Download, Eye, Plus, AlertTriangle, Clock, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent } from "@/app/components/ui/card";
import { readToken, getCurrentUserRoles, getCurrentUserId } from "@/app/lib/auth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";

interface Petition {
  id: string;
  petitionNumber: string;
  complaintId: string;
  status: string;
  reasonForDissatisfaction?: string;
  explanation?: string;
  assignedOfficer?: {
    id: string;
    firstName: string;
    lastName: string;
    position?: string;
  };
  assignedAt?: string;
  investigationDeadline?: string;
  investigationInstructions?: string;
  complaint?: {
    id: string;
    subject?: string;
    category?: string;
    trackingId?: string;
    referenceNumber?: string;
  };
}

interface Complaint {
  id: string;
  trackingId?: string;
  referenceNumber?: string;
  subject?: string;
  category?: string;
  status: string;
  priority?: string;
  createdAt?: string;
  assignedAt?: string;
  targetCompletionDate?: string;
}

const statusColors: Record<string, string> = {
  "Under Investigation": "bg-orange-100 text-orange-800",
  "Report Submitted": "bg-yellow-100 text-yellow-800",
  "Under Review": "bg-indigo-100 text-indigo-800",
  "Returned for Further Investigation": "bg-red-100 text-red-800",
  "Pending Decision": "bg-purple-100 text-purple-800",
  "Referred": "bg-teal-100 text-teal-800",
  "Closed": "bg-gray-100 text-gray-800",
  "Reopened": "bg-pink-100 text-pink-800",
};

const priorityColors: Record<string, string> = {
  "Low": "bg-green-100 text-green-800",
  "High": "bg-orange-100 text-orange-800",
  "Urgent": "bg-red-100 text-red-800",
};

export default function FeedbackInvestigationsPage() {
  const router = useRouter();
  
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [overdueComplaints, setOverdueComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    // Check URL parameters for filter
    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get('filter');
    
    if (filterParam === 'overdue') {
      setActiveTab('overdue');
    } else if (filterParam === 'closed') {
      setStatusFilter('Closed');
      setActiveTab('closed');
    }

    const checkSecretCodeStatus = async () => {
      try {
        // Check if user has verified secret code in this session
        const sessionVerified = sessionStorage.getItem('secretCodeVerified');
        if (sessionVerified === 'true') {
          console.log('[Feedback Investigations] Secret code already verified in this session, skipping check');
          return true;
        }

        const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
        const response = await fetch('http://localhost:4000/api/secret-code/status', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          const status = data.status;
          
          if (status === 'NOT_CREATED' || status === 'RESET_REQUIRED') {
            // Store the current URL for redirect after secret code creation
            sessionStorage.setItem('secretCodeRedirectUrl', '/feedback/complaints/investigations');
            router.push('/secret-code/create-secret-code');
            return false;
          } else if (status === 'VERIFICATION_REQUIRED') {
            // Store the current URL for redirect after verification
            sessionStorage.setItem('secretCodeRedirectUrl', '/feedback/complaints/investigations');
            router.push('/secret-code/verify');
            return false;
          }
          // If status is 'VERIFIED', proceed to fetch investigations
          return true;
        }
      } catch (error) {
        console.error('Error checking secret code status:', error);
      }
      return true; // Proceed if status check fails
    };

    const fetchPetitions = async () => {
      try {
        const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        
        // Fetch petitions
        const response = await fetch('http://localhost:4000/api/feedback/petitions/all', { headers });
        if (!response.ok) {
          throw new Error('Failed to fetch petitions');
        }
        const data = await response.json();
        setPetitions(data);

        // Fetch complaints for overdue check
        const complaintsRes = await fetch('http://localhost:4000/api/feedback/complaints', { headers });
        if (!complaintsRes.ok) {
          throw new Error('Failed to fetch complaints');
        }
        const complaintsData = await complaintsRes.json();
        const complaintsArray = Array.isArray(complaintsData) ? complaintsData : [];
        
        // Filter overdue complaints (have targetCompletionDate and it's in the past, and not closed)
        const overdue = complaintsArray.filter((c: any) => {
          if (!c.targetCompletionDate || c.status === 'Closed' || c.status === 'Accepted') return false;
          const deadline = new Date(c.targetCompletionDate);
          return deadline < new Date();
        });
        setOverdueComplaints(overdue);
      } catch (error) {
        console.error('Error fetching petitions:', error);
        setPetitions([]);
        setOverdueComplaints([]);
      } finally {
        setLoading(false);
      }
    };

    // Check secret code status first
    checkSecretCodeStatus().then((canProceed) => {
      // Only fetch petitions if secret code check passed
      if (canProceed) {
        fetchPetitions();
      }
    });
  }, [router]);

  const filteredPetitions = petitions.filter((petition) => {
    const officerName = petition.assignedOfficer
      ? `${petition.assignedOfficer.firstName} ${petition.assignedOfficer.lastName}`
      : '';

    const matchesSearch =
      petition.petitionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (petition.complaint?.trackingId || petition.complaint?.referenceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      officerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || petition.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || petition.complaint?.category === categoryFilter;

    // Exclude closed petitions from main list
    const excludeStatuses = ["Closed"];
    const isExcluded = excludeStatuses.includes(petition.status) && statusFilter === "all";

    // Tab filtering
    let matchesTab = true;
    if (activeTab === "active") {
      matchesTab = ["Assigned for Investigation", "Under Investigation"].includes(petition.status);
    } else if (activeTab === "overdue") {
      if (petition.investigationDeadline) {
        const deadline = new Date(petition.investigationDeadline);
        matchesTab = deadline < new Date() && petition.status !== "Closed";
      } else {
        matchesTab = false;
      }
    } else if (activeTab === "closed") {
      matchesTab = petition.status === "Closed";
    }

    return matchesSearch && matchesStatus && matchesCategory && matchesTab && !isExcluded;
  });

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Exporting investigations...");
  };

  const isOverdue = (petition: Petition) => {
    if (petition.status === "Closed") return false;
    if (!petition.investigationDeadline) return false;
    const deadline = new Date(petition.investigationDeadline);
    return deadline < new Date();
  };

  const isComplaintOverdue = (complaint: Complaint) => {
    if (!complaint.targetCompletionDate) return false;
    if (complaint.status === 'Closed' || complaint.status === 'Accepted') return false;
    const deadline = new Date(complaint.targetCompletionDate);
    return deadline < new Date();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6">
          <Button variant="ghost" onClick={() => router.push("/dashboard/feedback-complaint-manager")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {/* Petitions Grid */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-4 text-gray-600">Loading petitions...</p>
              </div>
            ) : activeTab === 'overdue' && filteredPetitions.length === 0 && overdueComplaints.length === 0 ? (
              <div className="p-12 text-center">
                <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No overdue items found</h3>
                <p className="text-gray-600">No petitions or complaints are overdue.</p>
              </div>
            ) : activeTab === 'overdue' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Overdue Petitions */}
                {petitions.filter((p) => isOverdue(p)).map((petition) => (
                  <Card
                    key={`petition-${petition.id}`}
                    className="cursor-pointer hover:shadow-lg transition-shadow border-red-300"
                    onClick={() => router.push(`/feedback/complaints/${petition.complaintId}`)}
                  >
                    <CardContent className="p-6 text-center">
                      <p className="text-lg font-semibold text-red-600">
                        {petition.petitionNumber}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Petition</p>
                    </CardContent>
                  </Card>
                ))}
                {/* Overdue Complaints */}
                {overdueComplaints.map((complaint) => (
                  <Card
                    key={`complaint-${complaint.id}`}
                    className="cursor-pointer hover:shadow-lg transition-shadow border-red-300"
                    onClick={() => router.push(`/feedback/complaints/${complaint.id}`)}
                  >
                    <CardContent className="p-6 text-center">
                      <p className="text-lg font-semibold text-red-600">
                        {complaint.trackingId || complaint.referenceNumber || complaint.id}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Complaint</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredPetitions.length === 0 ? (
              <div className="p-12 text-center">
                <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No petitions found</h3>
                <p className="text-gray-600">No petitions have been submitted yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredPetitions.map((petition) => (
                  <Card
                    key={petition.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => router.push(`/feedback/complaints/${petition.complaintId}`)}
                  >
                    <CardContent className="p-6 text-center">
                      <p className="text-lg font-semibold text-blue-600">
                        {petition.petitionNumber}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
