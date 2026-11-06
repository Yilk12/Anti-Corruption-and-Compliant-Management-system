"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, Eye, FileText, Calendar, User, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { useSecretCodeCheck } from "@/app/hooks/use-secret-code-check";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";

interface Investigation {
  id: string;
  caseNumber: string;
  complaintReference: string;
  category: string;
  status: string;
  assignedInvestigator?: { id: string; firstName: string; lastName: string };
  reportSubmittedAt?: string;
  reportSubmittedById?: string;
  complaint?: {
    complainantFirstName?: string;
    complainantLastName?: string;
  };
}

export default function ReceivedReportsPage() {
  const router = useRouter();
  
  // Check secret code status
  useSecretCodeCheck('/ethics/reports/received');
  
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchInvestigations = async () => {
      try {
        const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await fetch('http://localhost:4000/api/ethics/investigations?status=Report Submitted&bypassUserFilter=true', { headers });
        if (!response.ok) {
          throw new Error('Failed to fetch investigations');
        }
        const data = await response.json();
        setInvestigations(data);
      } catch (error) {
        console.error('Error fetching investigations:', error);
        setInvestigations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInvestigations();
  }, []);

  const filteredInvestigations = investigations.filter((investigation) => {
    const investigatorName = investigation.assignedInvestigator
      ? `${investigation.assignedInvestigator.firstName} ${investigation.assignedInvestigator.lastName}`
      : '';

    const matchesSearch =
      investigation.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investigation.complaintReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investigatorName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleViewReport = (investigationId: string) => {
    router.push(`/ethics/investigations/${investigationId}?view=report`);
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="rounded-full hover:bg-gray-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Received Investigation Reports</h1>
                <p className="text-gray-600 mt-1">Review investigation reports submitted by ethics officers</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by case number, reference, or investigator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Reports List */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading reports...</div>
          ) : filteredInvestigations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No received reports found</p>
              <p className="text-sm mt-2">Reports submitted by ethics officers will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInvestigations.map((investigation) => (
                <Card key={investigation.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {investigation.caseNumber}
                      </CardTitle>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {investigation.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Ref: {investigation.complaintReference}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {investigation.assignedInvestigator
                            ? `${investigation.assignedInvestigator.firstName} ${investigation.assignedInvestigator.lastName}`
                            : 'Not assigned'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {investigation.reportSubmittedAt
                            ? new Date(investigation.reportSubmittedAt).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="pt-3">
                        <Button
                          onClick={() => handleViewReport(investigation.id)}
                          className="w-full"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Report
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
