"use client"

import { DashboardLayout } from "@/app/components/dashboard-layout"
import { UserForm } from "@/app/components/user-form"
import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUserRoles } from "@/app/lib/auth"

export default function CreateUserPage() {
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  // Check permissions once on mount
  useEffect(() => {
    const userRoles = getCurrentUserRoles().map(r=>r.toLowerCase())
    const hasAccess = userRoles.includes("admin") || userRoles.includes("commissioner")
    
    if (hasAccess) {
      setAllowed(true)
    } else {
      setAllowed(false)
      router.replace("/users")
    }
  }, [router])

  if (allowed === null) return (<div className="p-4 text-sm text-gray-600">Loading...</div>)
  if (allowed === false) return null

  return (
    <DashboardLayout showHeading={false}>
      <div className="w-full">
        <div className="px-4 md:px-8 py-6">
          <UserForm onClose={() => router.push("/users")} />
        </div>
      </div>
    </DashboardLayout>
  )
}
