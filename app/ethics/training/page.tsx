"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { BookOpen, Users, Clock, Play, Plus, Search, Filter, CheckCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { useSecretCodeCheck } from "@/app/hooks/use-secret-code-check";
import { readToken } from "@/app/lib/auth";

interface Training {
  id: string;
  title: string;
  category: string;
  duration: string;
  enrolled: number;
  completed: number;
  status: string;
  description: string;
  lastUpdated: string;
}

export default function TrainingPage() {
  const router = useRouter();
  
  // Check secret code status
  useSecretCodeCheck('/ethics/training');
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        const token = readToken();
        // TODO: Create backend endpoint for training
        // const response = await fetch('http://localhost:4000/api/ethics/training', {
        //   headers: {
        //     'Authorization': `Bearer ${token}`,
        //   },
        // });
        // if (!response.ok) {
        //   throw new Error('Failed to fetch trainings');
        // }
        // const data = await response.json();
        // setTrainings(data);
        setTrainings([]);
      } catch (error) {
        console.error('Error fetching trainings:', error);
        setTrainings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainings();
  }, []);

  const filteredTrainings = trainings.filter((training) => {
    const matchesSearch = training.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         training.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || training.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statuses = ["all", ...new Set(trainings.map((t) => t.status))];

  const getCompletionRate = (enrolled: number, completed: number) => {
    return Math.round((completed / enrolled) * 100);
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Training and Awareness</h1>
              <p className="text-gray-600 mt-1">Manage ethics training programs and track completion</p>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Training
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{loading ? '-' : trainings.length}</div>
                  <div className="text-sm text-gray-600">Total Trainings</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {loading ? '-' : trainings.reduce((sum, t) => sum + t.enrolled, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Enrolled</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {loading ? '-' : trainings.reduce((sum, t) => sum + t.completed, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {loading ? '-' : trainings.reduce((sum, t) => sum + parseFloat(t.duration), 0)}h
                  </div>
                  <div className="text-sm text-gray-600">Total Duration</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search trainings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
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

          {/* Training Grid */}
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading trainings...</div>
          ) : filteredTrainings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No trainings found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrainings.map((training) => (
                <div key={training.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {training.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{training.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{training.description}</p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{training.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{training.enrolled} enrolled</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Completion Rate</span>
                      <span className="font-medium text-gray-900">
                        {getCompletionRate(training.enrolled, training.completed)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${getCompletionRate(training.enrolled, training.completed)}%` }}
                      />
                    </div>
                  </div>
                  <Button className="w-full mt-4 gap-2">
                    <Play className="w-4 h-4" />
                    Start Training
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
