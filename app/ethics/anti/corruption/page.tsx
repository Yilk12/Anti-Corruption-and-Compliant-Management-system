"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useSecretCodeCheck } from "@/app/hooks/use-secret-code-check";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Shield, ArrowRight, FileText } from "lucide-react";
import { Button } from "@/app/components/ui/button";

export default function AntiCorruptionPage() {
  const router = useRouter();
  useSecretCodeCheck('/ethics/anti/corruption');

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Ethics and Anti-Corruption</h1>
            <p className="text-gray-600">Report unethical behavior, corruption, and misconduct</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              onClick={() => router.push("/guest-anticorruption")}
              className="cursor-pointer bg-linear-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg p-8 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-white bg-opacity-20 rounded-full p-4">
                  <Shield size={64} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Submit New Report</h2>
                <p className="text-white text-opacity-90">
                  Report corruption, bribery, fraud, or other unethical behavior
                </p>
                <div className="flex items-center text-white font-semibold mt-2">
                  <span>Get Started</span>
                  <ArrowRight size={20} className="ml-2" />
                </div>
              </div>
            </div>

            <div
              onClick={() => router.push("/ethics/anticorruption")}
              className="cursor-pointer bg-linear-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg p-8 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-white bg-opacity-20 rounded-full p-4">
                  <FileText size={64} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">View Reports</h2>
                <p className="text-white text-opacity-90">
                  View and track existing Ethics and Anti-Corruption reports
                </p>
                <div className="flex items-center text-white font-semibold mt-2">
                  <span>View All</span>
                  <ArrowRight size={20} className="ml-2" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
