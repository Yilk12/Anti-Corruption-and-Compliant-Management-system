"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { RotateCcw, ShieldCheck, FileText, Wrench } from "lucide-react"
import { getCurrentUserRoles } from "@/app/lib/auth"
import { DashboardLayout } from "@/app/components/dashboard-layout"

export default function ITOfficerDashboard() {
  const router = useRouter()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [returnedAssetsCount, setReturnedAssetsCount] = useState<number | null>(null)
  const [maintenanceRequestsCount, setMaintenanceRequestsCount] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const userRoles = getCurrentUserRoles()
    const access = userRoles.includes('it_officer') || userRoles.includes('admin')
    setHasAccess(access)

    // Get current user ID
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUserId(payload.sub || payload.userId || '')
      }
    } catch (error) {
      console.error('Error fetching user ID:', error)
    }
    
    if (access) {
      fetchReturnedAssetsCount()
      fetchMaintenanceRequests()
    }
  }, [])

  async function fetchReturnedAssetsCount() {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')
      const res = await fetch('/api/assets/returns', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        console.log('Fetched returns data:', data)
        // Count only pending inspection requests (not yet inspected by IT Officer)
        let pendingCount = 0
        if (Array.isArray(data)) {
          pendingCount = data.filter((item: any) => {
            const status = item.status || item.verificationStatus || ''
            const isPending = status === 'REQUESTED' || status === 'PENDING_INSPECTION' || status === 'UNDER_INSPECTION' || (item.verificationStatus !== undefined && !item.itOfficerId)
            return isPending
          }).length
        }
        console.log('Pending inspection count:', pendingCount)
        setReturnedAssetsCount(pendingCount)
      }
    } catch (error) {
      console.error('Failed to fetch returned assets count:', error)
    }
  }

  async function fetchMaintenanceRequests() {
    if (!userId) return
    
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')
      const res = await fetch('/api/assets/maintenance', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      
      if (res.ok) {
        const data = await res.json()
        // Count maintenance requests assigned to this IT Officer
        const assignedCount = Array.isArray(data) 
          ? data.filter((req: any) => req.assignedTechnician === userId).length
          : 0
        setMaintenanceRequestsCount(assignedCount)
      }
    } catch (error) {
      console.error('Failed to fetch maintenance requests:', error)
    }
  }

  if (hasAccess === null) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-gray-600">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600">You do not have permission to access this page.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">IT Officer Dashboard</h1>
          <p className="text-gray-600 mt-1">የአይቲ ኃላፊ ዳሽቦርድ - Manage IT equipment inspections</p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <ActionCard
            title="የተመለሰ ንብረት"
            count={returnedAssetsCount ?? 0}
            icon={<RotateCcw />}
            color="purple"
            onClick={() => router.push('/assets/return/inspection')}
          />
          <ActionCard
            title="የሚጠገን ንብረት"
            count={maintenanceRequestsCount ?? 0}
            icon={<Wrench />}
            color="orange"
            onClick={() => router.push('/assets/maintenance')}
          />
          <ActionCard
            title="IT Inspection Reports"
            count={null}
            icon={<FileText />}
            color="blue"
            onClick={() => router.push('/assets/return/inspection')}
          />
          <ActionCard
            title="Security & Data Checks"
            count={null}
            icon={<ShieldCheck />}
            color="green"
            onClick={() => router.push('/assets/return/inspection')}
          />
        </div>

        {/* Information Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">IT Officer Responsibilities</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">•</span>
              <span>Inspect returned IT equipment for hardware and software condition</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">•</span>
              <span>Verify data security and ensure proper data wiping</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">•</span>
              <span>Check accessories and components completeness</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">•</span>
              <span>Provide technical assessment and recommendations</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">•</span>
              <span>Approve assets for return to store, maintenance, or disposal</span>
            </li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}

function ActionCard({ title, count, icon, color, onClick }: { title: string; count: number | null; icon: React.ReactNode; color: string; onClick?: () => void }) {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
    indigo: "bg-indigo-500",
    teal: "bg-teal-500",
  }

  return (
    <div 
      className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow hover:bg-gray-50"
      onClick={onClick}
    >
      <div className="flex flex-col items-center justify-between h-full">
        <div className={`w-16 h-16 ${colorClasses[color as keyof typeof colorClasses]} rounded-lg flex items-center justify-center text-white mb-4`}>
          {icon}
        </div>
        <div className="text-center flex-1 flex flex-col justify-center">
          <p className="text-gray-700 text-sm font-semibold">{title}</p>
          {count !== null && (
            <p className="text-3xl font-bold text-gray-900 mt-2">{count}</p>
          )}
        </div>
      </div>
    </div>
  )
}
