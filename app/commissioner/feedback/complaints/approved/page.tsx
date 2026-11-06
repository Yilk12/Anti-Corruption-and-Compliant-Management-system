"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUserPrimaryRole } from "@/app/lib/auth";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { ArrowLeft, CheckCircle } from "lucide-react";

export default function CommissionerApprovedComplaintsPage() {
  const router = useRouter();
  const [approvedComplaints, setApprovedComplaints] = useState<any[]>([]);
  const [approvedPetitions, setApprovedPetitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

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
    // Allow access to commissioner role
    if (role !== "commissioner" && role !== "admin") {
      router.replace("/dashboard/Commissioner");
    }
  }, [router]);

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchApprovedItems() {
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
        
        // Filter for approved/closed complaints - match dashboard logic
        const approvedComplaintsData = complaintsArray.filter((c: any) => 
          c.status === 'Closed' || c.status === 'Accepted'
        );
        
        console.log('All complaints:', complaintsArray.map((c: any) => ({ 
          trackingId: c.trackingId, 
          status: c.status 
        })));
        
        console.log('Approved complaints before petition filter:', approvedComplaintsData.map((c: any) => ({ 
          trackingId: c.trackingId, 
          status: c.status 
        })));
        
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
        
        // Filter for approved/closed petitions - match dashboard logic
        const approvedPetitionsData = petitionsArray.filter((p: any) => 
          p.status === 'Closed' || 
          p.status === 'Final Decision Issued' ||
          p.status === 'Investigation Report Submitted' ||
          p.status === 'Under Final Decision Review' ||
          p.status === 'Investigation Returned for Correction'
        );
        
        console.log('All petitions:', petitionsArray.map((p: any) => ({ 
          petitionNumber: p.petitionNumber, 
          status: p.status 
        })));
        
        console.log('Approved petitions:', approvedPetitionsData.map((p: any) => ({ 
          petitionNumber: p.petitionNumber, 
          status: p.status 
        })));
        
        // Check for specific petitions
        const targetPetitions = ['PET-2026-2337', 'PET-2026-8584'];
        targetPetitions.forEach(targetNum => {
          const found = petitionsArray.find((p: any) => p.petitionNumber === targetNum);
          console.log(`Petition ${targetNum}:`, found ? 'FOUND' : 'NOT FOUND', found ? found.status : '');
        });
        
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

  // Filter complaints to show only those WITHOUT petitions
  const complaintsWithoutPetitions = approvedComplaints.filter((complaint) => {
    return !complaintToPetitionMap.has(complaint.id);
  });

  console.log('Complaints without petitions:', complaintsWithoutPetitions.map((c: any) => ({ 
    trackingId: c.trackingId, 
    status: c.status 
  })));
  console.log('Complaints without petitions count:', complaintsWithoutPetitions.length);

  const handleItemClick = (item: any, type: 'complaint' | 'petition') => {
    setSelectedItem({ ...item, type });
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setSelectedItem(null);
    setViewMode('list');
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6">
          <Button variant="ghost" onClick={() => router.push("/dashboard/Commissioner")} className="mb-4">
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
            ) : viewMode === 'list' ? (
              complaintsWithoutPetitions.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No complaints without petitions found</h3>
                  <p className="text-gray-600">All approved complaints have associated petitions.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {complaintsWithoutPetitions.map((complaint) => (
                    <Card
                      key={`complaint-${complaint.id}`}
                      className="hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="p-6 text-center">
                        <p className="text-lg font-semibold text-blue-600 mb-2">
                          {complaint.trackingId || complaint.referenceNumber || complaint.id}
                        </p>
                        <Badge className="bg-green-100 text-green-800 mb-2">
                          No Petition
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handleItemClick(complaint, 'complaint')}
                          className="w-full mt-2"
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/feedback/complaints/${complaint.id}`)}
                          className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
                        >
                          Send to Feedback and Complaints Department
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <Button onClick={handleBackToList} variant="outline">
                    ← Back to List
                  </Button>
                  <Button 
                    onClick={() => {
                      if (selectedItem.type === 'complaint') {
                        router.push(`/feedback/complaints/${selectedItem.id}`);
                      } else {
                        router.push(`/feedback/manager-petitions`);
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Send to Feedback and Complaints Department
                  </Button>
                </div>
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4">
                      {selectedItem.type === 'complaint' 
                        ? (selectedItem.trackingId || selectedItem.referenceNumber || selectedItem.id)
                        : selectedItem.petitionNumber}
                    </h2>
                    <div className="space-y-4">
                      {selectedItem.type === 'complaint' ? (
                        <>
                          <div>
                            <h3 className="font-semibold text-lg mb-2">Complaint Details</h3>
                            <p><strong>Status:</strong> {selectedItem.status}</p>
                            <p><strong>Subject:</strong> {selectedItem.subject}</p>
                            <p><strong>Description:</strong> {selectedItem.description}</p>
                            <p><strong>Date Submitted:</strong> {new Date(selectedItem.createdAt).toLocaleString()}</p>
                            {selectedItem.complainantName && <p><strong>Complainant:</strong> {selectedItem.complainantName}</p>}
                            {selectedItem.departmentName && <p><strong>Department:</strong> {selectedItem.departmentName}</p>}
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <h3 className="font-semibold text-lg mb-2">Petition Details</h3>
                            <p><strong>Status:</strong> {selectedItem.status}</p>
                            <p><strong>Complaint ID:</strong> {selectedItem.complaintId}</p>
                            <p><strong>Date Created:</strong> {new Date(selectedItem.createdAt).toLocaleString()}</p>
                            {selectedItem.reasonForDissatisfaction && (
                              <p><strong>Reason for Dissatisfaction:</strong> {selectedItem.reasonForDissatisfaction}</p>
                            )}
                            {selectedItem.explanation && <p><strong>Explanation:</strong> {selectedItem.explanation}</p>}
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
