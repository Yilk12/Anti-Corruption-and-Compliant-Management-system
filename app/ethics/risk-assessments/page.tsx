"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AlertTriangle, Shield, Plus, Search, Filter } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { useSecretCodeCheck } from "@/app/hooks/use-secret-code-check";
import { readToken } from "@/app/lib/auth";

interface RiskAssessment {
  id: string;
  title: string;
  category: string;
  riskLevel: string;
  likelihood: string;
  impact: string;
  status: string;
  lastReviewed: string;
  description: string;
}

export default function RiskAssessmentsPage() {
  const router = useRouter();
  
  // Check secret code status
  useSecretCodeCheck('/ethics/risk-assessments');
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRiskAssessments = async () => {
      try {
        const token = readToken();
        // TODO: Create backend endpoint for risk assessments
        // const response = await fetch('http://localhost:4000/api/ethics/risk-assessments', {
        //   headers: {
        //     'Authorization': `Bearer ${token}`,
        //   },
        // });
        // if (!response.ok) {
        //   throw new Error('Failed to fetch risk assessments');
        // }
        // const data = await response.json();
        // setRiskAssessments(data);
        setRiskAssessments([]);
      } catch (error) {
        console.error('Error fetching risk assessments:', error);
        setRiskAssessments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRiskAssessments();
  }, []);

  const filteredRisks = riskAssessments.filter((risk) => {
    const matchesSearch = risk.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         risk.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === "all" || risk.riskLevel === filterLevel;
    const matchesStatus = filterStatus === "all" || risk.status === filterStatus;
    return matchesSearch && matchesLevel && matchesStatus;
  });

  const levels = ["all", ...new Set(riskAssessments.map((r) => r.riskLevel))];
  const statuses = ["all", ...new Set(riskAssessments.map((r) => r.status))];

  const getRiskColor = (level: string) => {
    switch (level) {
      case "High":
        return "bg-red-100 text-red-800 border-red-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Mitigation In Progress":
        return "bg-blue-100 text-blue-800";
      case "Review Required":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Risk Assessments</h1>
              <p className="text-gray-600 mt-1">Identify, assess, and mitigate ethics-related risks</p>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Risk Assessment
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{loading ? '-' : riskAssessments.length}</div>
                  <div className="text-sm text-gray-600">Total Risks</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {loading ? '-' : riskAssessments.filter((r) => r.riskLevel === "High").length}
                  </div>
                  <div className="text-sm text-gray-600">High Risk</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {loading ? '-' : riskAssessments.filter((r) => r.riskLevel === "Medium").length}
                  </div>
                  <div className="text-sm text-gray-600">Medium Risk</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {loading ? '-' : riskAssessments.filter((r) => r.riskLevel === "Low").length}
                  </div>
                  <div className="text-sm text-gray-600">Low Risk</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search risk assessments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white"
            >
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level === "all" ? "All Risk Levels" : level}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status === "all" ? "All Status" : status}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Assessments Table */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading risk assessments...</div>
            ) : filteredRisks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No risk assessments found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Risk Assessment</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Risk Level</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Likelihood</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Impact</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredRisks.map((risk) => (
                    <tr key={risk.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{risk.title}</div>
                          <div className="text-sm text-gray-500 mt-1">{risk.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{risk.category}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskColor(risk.riskLevel)}`}>
                          {risk.riskLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{risk.likelihood}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{risk.impact}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(risk.status)}`}>
                          {risk.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
