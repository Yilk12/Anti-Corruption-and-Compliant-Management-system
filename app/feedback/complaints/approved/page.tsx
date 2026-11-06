"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { getCurrentUserPrimaryRole } from "@/app/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { ArrowLeft, FileText, Calendar, CheckCircle, User } from "lucide-react";

interface ApprovedInvestigation {
  id: string;
  caseNumber: string;
  complaintReference: string;
  status: string;
  outcome?: string;
  decision?: string;
  decisionDate?: string;
  closureReason?: string;
  correctiveAction?: string;
  assignedInvestigator?: { firstName: string; lastName: string };
  complaint?: {
    subject: string;
    category: string;
  };
}

interface ClosedComplaint {
  id: string;
  trackingId?: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  isAnonymous: boolean;
  complainantName?: string;
  department?: string;
  description?: string;
}

export default function ApprovedComplaintsPage() {
  const router = useRouter();
  const [approvedComplaints, setApprovedComplaints] = useState<any[]>([]);
  const [approvedPetitions, setApprovedPetitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetchedRef = useRef(false);

  function getToken() {
    try {
      return (
        localStorage.getItem("accessToken") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("token")
      );
    } catch (error) {
      return null;
    }
  }

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");

  useEffect(() => {
    const role = getCurrentUserPrimaryRole();
    // Allow access to ethics roles as well
    if (role !== "feedback_complaint_manager" && role !== "admin" && role !== "commissioner" && role !== "ethics_anti_corruption" && role !== "ethics_officer") {
      router.replace("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchApprovedItems() {
      // Prevent multiple fetch attempts
      if (hasFetchedRef.current) {
        return;
      }
      hasFetchedRef.current = true;

      try {
        const token = getToken();
        if (!token) {
          console.error('No token available');
          setLoading(false);
          return;
        }
        
        const headers: HeadersInit = {
          Authorization: `Bearer ${token}`
        };

        // Fetch approved/closed complaints
        const complaintsRes = await fetch(`${API_BASE}/api/feedback/complaints`, { 
          headers,
          signal: abortController.signal
        });
        if (complaintsRes.status === 401) {
          console.error('Unauthorized: Token may be expired');
          setLoading(false);
          return;
        }
        const complaintsData = complaintsRes.ok ? await complaintsRes.json() : [];
        const complaintsArray = Array.isArray(complaintsData) ? complaintsData : (complaintsData?.items || []);
        
        // Filter for approved/closed complaints
        const approvedComplaintsData = complaintsArray.filter((c: any) => 
          c.status === 'Closed' || c.status === 'Accepted'
        );
        
        setApprovedComplaints(approvedComplaintsData);

        // Fetch approved petitions
        const petitionsRes = await fetch(`${API_BASE}/api/feedback/petitions/all`, { 
          headers,
          signal: abortController.signal
        });
        if (petitionsRes.status === 401) {
          console.error('Unauthorized: Token may be expired');
          setLoading(false);
          return;
        }
        const petitionsData = petitionsRes.ok ? await petitionsRes.json() : [];
        const petitionsArray = Array.isArray(petitionsData) ? petitionsData : [];
        
        // Log all petition statuses for debugging
        console.log('All petitions:', petitionsArray.map((p: any) => ({ 
          petitionNumber: p.petitionNumber, 
          status: p.status 
        })));
        
        // Filter for commissioner-approved petitions (petitions that have received final decision from commissioner)
        const approvedPetitionsData = petitionsArray.filter((p: any) => 
          p.status === 'Approved' || 
          p.status === 'Closed' ||
          p.status === 'Rejected' ||
          p.status === 'Referred'
        );
        
        console.log('Commissioner-approved petitions:', approvedPetitionsData.map((p: any) => ({ 
          petitionNumber: p.petitionNumber, 
          status: p.status 
        })));
        
        setApprovedPetitions(approvedPetitionsData);
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Failed to fetch approved items:', error);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchApprovedItems();

    return () => {
      abortController.abort();
    };
  }, []);

  // Create a map of complaint IDs to petitions
  const complaintToPetitionMap = new Map<string, any[]>();
  approvedPetitions.forEach((petition) => {
    if (petition.complaintId) {
      if (!complaintToPetitionMap.has(petition.complaintId)) {
        complaintToPetitionMap.set(petition.complaintId, []);
      }
      complaintToPetitionMap.get(petition.complaintId)?.push(petition);
    }
  });

  // Check if a complaint has a petition
  const hasPetition = (complaintId: string) => {
    return complaintToPetitionMap.has(complaintId);
  };

  // Get petition count for a complaint
  const getPetitionCount = (complaintId: string) => {
    return complaintToPetitionMap.get(complaintId)?.length || 0;
  };

  const statusColors: Record<string, string> = {
    "Closed": "bg-green-100 text-green-800",
  };

  const outcomeColors: Record<string, string> = {
    "Substantiated": "bg-red-100 text-red-800",
    "Partially Substantiated": "bg-yellow-100 text-yellow-800",
    "Not Substantiated": "bg-green-100 text-green-800",
    "Inconclusive": "bg-gray-100 text-gray-800",
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6">
          <Button variant="ghost" onClick={() => router.push("/dashboard/feedback-complaint-manager")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {/* Approved Items Grid */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-4 text-gray-600">Loading approved items...</p>
              </div>
            ) : approvedComplaints.length === 0 && approvedPetitions.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No approved items found</h3>
                <p className="text-gray-600">No complaints or petitions have been approved yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {approvedComplaints.map((complaint) => (
                  <Card
                    key={`complaint-${complaint.id}`}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => router.push(`/feedback/complaints/${complaint.id}`)}
                  >
                    <CardContent className="p-6 text-center">
                      <p className="text-lg font-semibold text-blue-600 mb-2">
                        {complaint.trackingId || complaint.referenceNumber || complaint.id}
                      </p>
                      {hasPetition(complaint.id) ? (
                        <Badge className="bg-orange-100 text-orange-800">
                          Has Petition
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">
                          No Petition
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {approvedPetitions.map((petition) => (
                  <Card
                    key={`petition-${petition.id}`}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => router.push(`/feedback/complaints/${petition.complaintId}`)}
                  >
                    <CardContent className="p-6 text-center">
                      <p className="text-lg font-semibold text-green-600">
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
