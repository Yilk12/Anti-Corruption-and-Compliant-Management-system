"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useSecretCodeCheck } from "@/app/hooks/use-secret-code-check";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { MessageSquare, ArrowRight, Search, ClipboardList, FileCheck, AlertTriangle, Inbox } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { getCurrentUserRoles } from "@/app/lib/auth";

export default function FeedbackComplaintsPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isFeedbackManager, setIsFeedbackManager] = useState(false);
  const [isFeedbackOfficer, setIsFeedbackOfficer] = useState(false);
  const [mounted, setMounted] = useState(false);
  useSecretCodeCheck('/feedback/complaints');

  useEffect(() => {
    setMounted(true);
    try {
      const roles = getCurrentUserRoles()?.map((r) => String(r).toLowerCase()) || [];
      setIsFeedbackManager(roles.includes("feedback_complaint_manager"));
      setIsFeedbackOfficer(roles.includes("feedback_complaint_officer"));
    } catch (error) {
      console.error("Error loading user roles:", error);
    }
  }, []);

  const categories = [
    {
      id: "complaint",
      title: "Complaint",
      description: "Report issues, concerns, or grievances",
      icon: MessageSquare,
      color: "bg-red-500",
      hoverColor: "hover:bg-red-600",
      route: "/feedback/complaints/new"
    }
  ];

  const handleCategoryClick = (category: typeof categories[0]) => {
    setSelectedCategory(category.id);
    setTimeout(() => {
      router.push(category.route);
    }, 200);
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Feedback and Complaints</h1>
            <p className="text-gray-600">Choose a category to submit your feedback</p>
          </div>

          {/* Submission Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Submit Feedback</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <div
                    key={category.id}
                    onClick={() => handleCategoryClick(category)}
                    className={`cursor-pointer rounded-lg p-6 ${category.color} ${category.hoverColor} transition-all duration-200 transform hover:scale-105 shadow-lg`}
                  >
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="bg-white bg-opacity-20 rounded-full p-4">
                        <Icon size={48} className="text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-white">{category.title}</h2>
                      <p className="text-white text-opacity-90">{category.description}</p>
                      <div className="flex items-center text-white font-semibold mt-2">
                        <span>Get Started</span>
                        <ArrowRight size={20} className="ml-2" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Management Section - Only for Feedback Managers and Officers */}
          {(isFeedbackManager || isFeedbackOfficer) && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Manage Feedback</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                  onClick={() => router.push("/feedback/complaints/list")}
                  className="cursor-pointer bg-linear-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg p-6 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="bg-white bg-opacity-20 rounded-full p-4">
                      <ClipboardList size={48} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">All Feedback</h2>
                    <p className="text-white text-opacity-90">View and manage all feedback submissions</p>
                    <div className="flex items-center text-white font-semibold mt-2">
                      <span>View All</span>
                      <ArrowRight size={20} className="ml-2" />
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => router.push("/feedback/complaints/inbox")}
                  className="cursor-pointer bg-linear-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-lg p-6 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="bg-white bg-opacity-20 rounded-full p-4">
                      <Inbox size={48} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Inbox</h2>
                    <p className="text-white text-opacity-90">View incoming feedback messages</p>
                    <div className="flex items-center text-white font-semibold mt-2">
                      <span>Check Inbox</span>
                      <ArrowRight size={20} className="ml-2" />
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => router.push("/feedback/complaints/pending")}
                  className="cursor-pointer bg-linear-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 rounded-lg p-6 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="bg-white bg-opacity-20 rounded-full p-4">
                      <AlertTriangle size={48} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Pending Review</h2>
                    <p className="text-white text-opacity-90">Feedback awaiting review</p>
                    <div className="flex items-center text-white font-semibold mt-2">
                      <span>Review</span>
                      <ArrowRight size={20} className="ml-2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
