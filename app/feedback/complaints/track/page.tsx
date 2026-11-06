"use client";

import { useState } from "react";
import { Search, FileText, Calendar, CheckCircle, AlertTriangle, Clock, User, Shield } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";

interface Complaint {
  id: string;
  trackingId: string;
  referenceNumber: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  complainantName?: string;
  isAnonymous: boolean;
  isInternal: boolean;
  investigation?: {
    id: string;
    caseNumber: string;
    status: string;
    outcome?: string;
    decision?: string;
    decisionDate?: string;
    closureReason?: string;
    correctiveAction?: string;
    assignedInvestigator?: {
      firstName: string;
      lastName: string;
    };
  };
}

export default function TrackComplaintPage() {
  const [trackingId, setTrackingId] = useState("");
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const response = await fetch(`${API_BASE}/api/feedback/complaints/tracking/${trackingId.trim()}`);
      
      if (!response.ok) {
        throw new Error('Complaint not found or invalid tracking ID');
      }

      const data = await response.json();
      setComplaint(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to track complaint');
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Closed':
        return 'bg-green-100 text-green-800';
      case 'Report Submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'Under Investigation':
        return 'bg-orange-100 text-orange-800';
      case 'Returned for Further Investigation':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const outcomeColors: Record<string, string> = {
    "Substantiated": "bg-red-100 text-red-800",
    "Partially Substantiated": "bg-yellow-100 text-yellow-800",
    "Not Substantiated": "bg-green-100 text-green-800",
    "Inconclusive": "bg-gray-100 text-gray-800",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Track Your Complaint</h1>
          <p className="text-gray-600">Enter your tracking ID to view the status and approval details</p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleTrack} className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Enter your tracking ID..."
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="pl-10 text-lg"
                />
              </div>
              <Button type="submit" disabled={loading} className="px-8">
                {loading ? 'Searching...' : 'Track'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {searched && !loading && !error && complaint && (
          <div className="space-y-6">
            {/* Complaint Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Complaint Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Subject</div>
                  <p className="font-medium">{complaint.subject}</p>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Category</div>
                  <p className="text-sm">{complaint.category}</p>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Description</div>
                  <p className="text-sm">{complaint.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Status</div>
                    <Badge className={getStatusColor(complaint.status)}>
                      {complaint.status === 'Under Investigation' ? 'በምርመራ ላይ ነዉ' : complaint.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Submitted Date</div>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Investigation Details */}
            {complaint.investigation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Investigation Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Case Number</div>
                    <p className="font-medium">{complaint.investigation.caseNumber}</p>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Investigation Status</div>
                    <Badge className={getStatusColor(complaint.investigation.status)}>
                      {complaint.investigation.status}
                    </Badge>
                  </div>

                  {/* Show approval details if approved */}
                  {complaint.investigation.status === 'Closed' && complaint.investigation.decision === 'Approved' && (
                    <div className="mt-6 pt-6 border-t">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-4">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                          <h4 className="font-medium text-green-800">Investigation Approved</h4>
                        </div>
                        
                        <div className="space-y-3">
                          {complaint.investigation.outcome && (
                            <div>
                              <div className="text-xs text-green-600 mb-1">Conclusion</div>
                              <Badge className={outcomeColors[complaint.investigation.outcome] || "bg-gray-100 text-gray-800"}>
                                {complaint.investigation.outcome}
                              </Badge>
                            </div>
                          )}
                          
                          {complaint.investigation.correctiveAction && (
                            <div>
                              <div className="text-xs text-green-600 mb-1">Corrective Action</div>
                              <p className="text-sm text-green-700">{complaint.investigation.correctiveAction}</p>
                            </div>
                          )}
                          
                          {complaint.investigation.decisionDate && (
                            <div>
                              <div className="text-xs text-green-600 mb-1">Decision Date</div>
                              <div className="flex items-center gap-1 text-sm text-green-700">
                                <Calendar className="w-3 h-3" />
                                {new Date(complaint.investigation.decisionDate).toLocaleDateString()}
                              </div>
                            </div>
                          )}
                          
                          {complaint.investigation.closureReason && (
                            <div>
                              <div className="text-xs text-green-600 mb-1">Approval Remarks</div>
                              <p className="text-sm text-green-700">{complaint.investigation.closureReason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show revision notes if returned */}
                  {complaint.investigation.status === 'Returned for Further Investigation' && (
                    <div className="mt-6 pt-6 border-t">
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-orange-800 mb-2">Revision Required</h4>
                            <p className="text-sm text-orange-700">
                              This investigation has been returned for further investigation. Please contact the feedback office for more information.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show pending status */}
                  {complaint.investigation.status !== 'Closed' && complaint.investigation.status !== 'Returned for Further Investigation' && (
                    <div className="mt-6 pt-6 border-t">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-blue-800 mb-2">Investigation in Progress</h4>
                            <p className="text-sm text-blue-700">
                              Your complaint is currently being investigated. Please check back later for updates.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* No investigation yet */}
            {!complaint.investigation && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800 mb-2">Complaint Registered</h4>
                      <p className="text-sm text-blue-700">
                        Your complaint has been registered and is awaiting investigation assignment. Please check back later for updates.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>For assistance, please contact the Ethics and Anti-Corruption Unit</p>
        </div>
      </div>
    </div>
  );
}
