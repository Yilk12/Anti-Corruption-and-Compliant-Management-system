"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useSecretCodeCheck } from "@/app/hooks/use-secret-code-check";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MessageSquare, Lightbulb, ThumbsUp, ArrowRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";

export default function FeedbackPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  useSecretCodeCheck('/ethics/feedback');

  const categories = [
    {
      id: "complaint",
      title: "Complaint",
      description: "Report issues, concerns, or grievances",
      icon: MessageSquare,
      color: "bg-red-500",
      hoverColor: "hover:bg-red-600",
      route: "/ethics/feedback/complaints/new"
    },
    {
      id: "suggestion",
      title: "Suggestion",
      description: "Share ideas for improvement",
      icon: Lightbulb,
      color: "bg-yellow-500",
      hoverColor: "hover:bg-yellow-600",
      route: "/ethics/suggestions/new"
    },
    {
      id: "positive-feedback",
      title: "Positive Feedback",
      description: "Appreciate good work and achievements",
      icon: ThumbsUp,
      color: "bg-green-500",
      hoverColor: "hover:bg-green-600",
      route: "/ethics/positive-feedback/new"
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
      </DashboardLayout>
    </AuthGuard>
  );
}
