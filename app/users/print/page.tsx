"use client"

import { useEffect, useState } from "react"
import { usersApi } from "@/app/lib/users-api"
import type { UserSummary } from "@/app/lib/users-api"

export default function UsersPrintPage() {
  const [users, setUsers] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await usersApi.list({ limit: 1000 })
        setUsers(res.users || [])
      } catch (error) {
        console.error("Failed to load users:", error)
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
  }, [])

  useEffect(() => {
    // Auto-print when page loads
    if (!loading) {
      window.print()
    }
  }, [loading])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-gray-300 pb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Users List</h1>
          <p className="text-gray-600">
            Total Users: {users.length} | Printed on: {formatDate(new Date().toISOString())}
          </p>
        </div>

        {/* Table */}
        <div className="overflow-hidden border border-gray-300">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="px-4 py-3 text-left font-semibold text-sm text-gray-900 border-r border-gray-300">
                  #
                </th>
                <th className="px-4 py-3 text-left font-semibold text-sm text-gray-900 border-r border-gray-300">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-semibold text-sm text-gray-900 border-r border-gray-300">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-semibold text-sm text-gray-900 border-r border-gray-300">
                  Phone
                </th>
                <th className="px-4 py-3 text-left font-semibold text-sm text-gray-900 border-r border-gray-300">
                  Employee ID
                </th>
                <th className="px-4 py-3 text-left font-semibold text-sm text-gray-900 border-r border-gray-300">
                  Position
                </th>
                <th className="px-4 py-3 text-left font-semibold text-sm text-gray-900 border-r border-gray-300">
                  Roles
                </th>
                <th className="px-4 py-3 text-left font-semibold text-sm text-gray-900 border-r border-gray-300">
                  User Type
                </th>
                <th className="px-4 py-3 text-left font-semibold text-sm text-gray-900 border-r border-gray-300">
                  Department
                </th>
                <th className="px-4 py-3 text-left font-semibold text-sm text-gray-900 border-r border-gray-300">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-semibold text-sm text-gray-900">
                  Created At
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id} className="border-b border-gray-300 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">
                    <div className="font-medium">
                      {user.firstNameAm && user.lastNameAm
                        ? `${user.firstNameAm} ${user.lastNameAm}`
                        : `${user.firstName} ${user.lastName}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.firstNameAm && user.lastNameAm
                        ? `${user.firstName} ${user.lastName}`
                        : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">
                    {user.phone || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">
                    {user.employeeId || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">
                    {user.position || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">
                    {user.roles && user.roles.length > 0 ? user.roles.join(", ") : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">
                    {user.userType}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">
                    {user.department || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        user.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatDate(user.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-center text-sm text-gray-600">
          <p>End of Users List</p>
          <p className="mt-2">Generated by Ethiopian Helpdesk System</p>
        </div>
      </div>

      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: landscape;
            margin: 0.5cm;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
        }
      `}</style>
    </div>
  )
}
