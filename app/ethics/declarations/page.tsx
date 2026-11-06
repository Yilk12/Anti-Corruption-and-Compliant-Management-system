"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useState, useEffect } from "react";
import { FileText, Plus, Search, Filter, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { useSecretCodeCheck } from "@/app/hooks/use-secret-code-check";
import { readToken, getCurrentUserRoles } from "@/app/lib/auth";
import { useRouter } from "next/navigation";

interface Declaration {
  id: string;
  declarationNumber: string;
  declarationType: string;
  relationshipDescription: string;
  declarant: {
    firstName: string;
    lastName: string;
  };
  department: string;
  dateDisclosed: string;
  status: string;
}

export default function DeclarationsPage() {
  const router = useRouter();
  
  // Check secret code status
  useSecretCodeCheck('/ethics/declarations');
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    const fetchDeclarations = async () => {
      try {
        const token = readToken();
        const response = await fetch('http://localhost:4000/api/ethics/declarations', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch declarations');
        }
        const data = await response.json();
        setDeclarations(data);
      } catch (error) {
        console.error('Error fetching declarations:', error);
        setDeclarations([]);
      } finally {
        setLoading(false);
      }
    };

    // Get user roles
    const roles = getCurrentUserRoles();
    setUserRoles(roles);

    fetchDeclarations();
  }, []);

  const isEthicsUser = () => {
    return userRoles.some(role => role === 'ethics_anti_corruption');
  };

  const filteredDeclarations = declarations.filter((decl) => {
    const submitterName = `${decl.declarant.firstName} ${decl.declarant.lastName}`;
    const matchesSearch = decl.declarationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         decl.relationshipDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submitterName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || decl.declarationType === filterType;
    const matchesStatus = filterStatus === "all" || decl.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const types = ["all", ...new Set(declarations.map((d) => d.declarationType))];
  const statuses = ["all", ...new Set(declarations.map((d) => d.status))];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "Pending Review":
      case "Under Review":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Pending Review":
      case "Under Review":
        return "bg-yellow-100 text-yellow-800";
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
              <h1 className="text-3xl font-bold text-gray-900">Declarations</h1>
              <p className="text-gray-600 mt-1">Manage conflict of interest and gift declarations</p>
            </div>
            {isEthicsUser() && (
              <Button onClick={() => router.push("/ethics/declarations/new")} className="gap-2">
                <Plus className="w-4 h-4" />
                New Declaration
              </Button>
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search declarations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white"
            >
              {types.map((type) => (
                <option key={type} value={type}>
                  {type === "all" ? "All Types" : type}
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

          {/* Declarations Table */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading declarations...</div>
            ) : filteredDeclarations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No declarations found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Declaration</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Submitter</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Submitted Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredDeclarations.map((decl) => (
                    <tr key={decl.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <div className="font-medium text-gray-900">{decl.declarationNumber}</div>
                            <div className="text-sm text-gray-500 mt-1">{decl.relationshipDescription}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{decl.declarationType}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{decl.declarant.firstName} {decl.declarant.lastName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{decl.department || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(decl.dateDisclosed).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(decl.status)}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(decl.status)}`}>
                            {decl.status}
                          </span>
                        </div>
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
