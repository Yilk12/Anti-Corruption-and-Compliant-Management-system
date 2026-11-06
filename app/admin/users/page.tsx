"use client"
import React, { Suspense } from "react"
import { DashboardLayout } from "@/app/components/dashboard-layout"
import { UserManagement } from "@/app/components/user-management"
import { getCurrentUserRoles } from "@/app/lib/auth"

export default function AdminUsersPage() {
  const roles = getCurrentUserRoles().map(r => r.toLowerCase())
  const isAdmin = roles.includes("admin")

  return (
    <DashboardLayout showHeading={false}>
      <Suspense fallback={<div className="p-4 text-sm text-gray-600">Loading admin users...</div>}>
      {!isAdmin ? (
        <div className="w-full max-w-3xl mx-auto py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">403 — Forbidden</h1>
          <p className="text-muted-foreground">Only administrators can access the Admin Users page.</p>
        </div>
      ) : (
        <div className="w-full flex justify-center">
          <div className="w-full max-w-6xl">
            <UserManagement />
          </div>
        </div>
      )}
      </Suspense>
    </DashboardLayout>
  )
}
