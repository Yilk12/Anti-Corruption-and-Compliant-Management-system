"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";

export default function MyComplaintsPage() {
  const router = useRouter();
  const [trackingId, setTrackingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [showList, setShowList] = useState(false);

  const handleTrackById = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) {
      setError("Please enter a tracking ID");
      return;
    }

    setLoading(true);
    setError("");
    setComplaints([]);

    try {
      const res = await fetch("http://localhost:4000/api/ethics/anticorruption/reports/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingId: trackingId.trim(),
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to track complaint");
      }

      const data = await res.json();
      setComplaints([data]);
      setShowList(true);
    } catch (err: any) {
      setError(err.message || "Failed to track complaint");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Submitted':
        return 'text-blue-600';
      case 'Under Investigation':
        return 'text-yellow-600';
      case 'Resolved':
        return 'text-green-600';
      case 'Closed':
        return 'text-gray-600';
      case 'Rejected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Ethics and Anti Corruption Report</h1>
            <p className="text-gray-600">View and track your ethics and anti-corruption reports</p>
          </div>

          {!showList ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Enter Tracking ID</h2>
                <form onSubmit={handleTrackById} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tracking ID
                    </label>
                    <input
                      type="text"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value)}
                      placeholder="e.g., FCSC-2026-A8K7M2Q9"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    <Search size={16} />
                    {loading ? "Searching..." : "Track Complaint"}
                  </button>
                </form>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {complaints.length === 1 ? "Complaint Details" : "All Complaints"}
                </h2>
                <button
                  onClick={() => {
                    setShowList(false);
                    setTrackingId("");
                    setComplaints([]);
                    setError("");
                  }}
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  Search Again
                </button>
              </div>

              {complaints.length > 0 ? (
                <div className="space-y-4">
                  {complaints.map((complaint) => (
                    <div
                      key={complaint.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => router.push(`/track-complaint?trackingId=${complaint.trackingId}`)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{complaint.referenceNumber}</div>
                          <div className="text-sm text-gray-600 mt-1">{complaint.subject}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            Tracking ID: <span className="font-mono font-medium text-blue-600">{complaint.trackingId}</span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Status: <span className={`font-medium ${getStatusColor(complaint.status)}`}>
                              {complaint.status === 'Under Investigation' ? 'በምርመራ ላይ ነዉ' : complaint.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">No complaints found</div>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
