"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useState, useEffect } from "react";
import { FileText, Download, Eye, Plus, Search, Filter } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { useSecretCodeCheck } from "@/app/hooks/use-secret-code-check";
import { readToken, getCurrentUserRoles } from "@/app/lib/auth";
import { useRouter } from "next/navigation";

interface Policy {
  id: string;
  documentNumber: string;
  title: string;
  policyType: string;
  version: string;
  effectiveDate: string;
  status: string;
  description: string;
  filePath?: string;
}

export default function PoliciesPage() {
  const router = useRouter();
  
  // Check secret code status
  useSecretCodeCheck('/ethics/policies');
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const token = readToken();
        const response = await fetch('http://localhost:4000/api/ethics/policies', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch policies');
        }
        const data = await response.json();
        setPolicies(data);
      } catch (error) {
        console.error('Error fetching policies:', error);
        setPolicies([]);
      } finally {
        setLoading(false);
      }
    };

    // Get user roles
    const roles = getCurrentUserRoles();
    setUserRoles(roles);

    fetchPolicies();
  }, []);

  const isEthicsUser = () => {
    return userRoles.some(role => role === 'ethics_anti_corruption');
  };

  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch = policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCategory === "all" || policy.policyType === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const categories = ["all", ...new Set(policies.map((p) => p.policyType))];

  const handleDownload = async (policy: Policy) => {
    if (!policy.filePath) {
      alert('No file attached to this policy');
      return;
    }

    try {
      const token = readToken();
      const response = await fetch(`http://localhost:4000/api/ethics/policies/${policy.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = policy.filePath.split('/').pop() || 'policy.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  const handleView = async (policy: Policy) => {
    if (!policy.filePath) {
      alert('No file attached to this policy');
      return;
    }

    try {
      const token = readToken();
      const response = await fetch(`http://localhost:4000/api/ethics/policies/${policy.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to view file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing file:', error);
      alert('Failed to view file');
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ethics and Policies</h1>
              <p className="text-gray-600 mt-1">View and manage ethics-related policies and documents</p>
            </div>
            {isEthicsUser() && (
              <Button onClick={() => router.push("/ethics/policies/new")} className="gap-2">
                <Plus className="w-4 h-4" />
                Add New Policy
              </Button>
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search policies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Policies Table */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading policies...</div>
            ) : filteredPolicies.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No policies found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Policy Title</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Version</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Effective Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredPolicies.map((policy) => (
                    <tr key={policy.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{policy.title}</div>
                          <div className="text-sm text-gray-500 mt-1">{policy.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{policy.policyType}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{policy.version}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{policy.effectiveDate}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {policy.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => handleView(policy)}>
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => handleDownload(policy)}>
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        </div>
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
