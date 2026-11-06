"use client"

import { DashboardLayout } from "@/app/components/dashboard-layout"
import { UserManagement } from "@/app/components/user-management"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUserRoles } from "@/app/lib/auth"

export default function UsersPage() {
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    const userRoles = getCurrentUserRoles().map(r=>r.toLowerCase())
    const hasAccess = userRoles.includes("admin") || userRoles.includes("hr") || userRoles.includes("it_officer")
    
    if (hasAccess) {
      setAllowed(true)
    } else {
      router.replace("/dashboard")
    }
  }, [router])

  if (allowed === null) return (<div className="p-4 text-sm text-gray-600">Loading...</div>)
  if (allowed === false) return null

  return (
    <DashboardLayout showHeading={false}>
      <div className="w-full flex justify-center">
        <div className="w-full max-w-6xl">
          <UserManagement />
        </div>
      </div>
    </DashboardLayout>
  )
}

