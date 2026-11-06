"use client"
import { useEffect, useState } from "react"
import { apiGet, apiPatch } from "@/app/lib/api"

type BasicUser = {
  id: number
  email: string
  firstName: string
  lastName: string
  accountStatus: "ENABLED" | "DISABLED"
  role: string
}

export default function AccountsSettingsPage() {
  const [users, setUsers] = useState<BasicUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<BasicUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [bulkAction, setBulkAction] = useState<"ENABLED" | "DISABLED">("ENABLED")
  const [updating, setUpdating] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await apiGet<BasicUser[]>("/users/basic")
        if (mounted) {
          setUsers(data)
          setFilteredUsers(data)
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load users")
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users)
      setCurrentPage(1)
      return
    }

    const lowercasedSearch = searchTerm.toLowerCase()
    const filtered = users.filter(user =>
      user.firstName.toLowerCase().includes(lowercasedSearch) ||
      user.lastName.toLowerCase().includes(lowercasedSearch) ||
      user.email.toLowerCase().includes(lowercasedSearch) ||
      user.role.toLowerCase().includes(lowercasedSearch) ||
      user.accountStatus.toLowerCase().includes(lowercasedSearch)
    )
    setFilteredUsers(filtered)
    setCurrentPage(1)
  }, [searchTerm, users])

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentUsers = filteredUsers.slice(startIndex, endIndex)

  // Reset password to default (password123) for a single user
  const resetPassword = async (userId: number) => {
    setUpdating(true)
    setError(null)
    setSuccess(null)

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken") ||
            localStorage.getItem("jwt") ||
            localStorage.getItem("token")
          : null
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}/reset-password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      setSuccess("Password reset to default (password123)")
      setTimeout(() => setSuccess(null), 3000)
    } catch (e: any) {
      setError(e?.message || "Failed to reset password")
    } finally {
      setUpdating(false)
    }
  }

  // Handle individual checkbox selection
  const handleUserSelection = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  // Handle select all checkbox for current page
  const handleSelectAll = () => {
    const currentPageUserIds = currentUsers.map(user => user.id)
    
    if (selectedUsers.length === currentPageUserIds.length && 
        currentPageUserIds.every(id => selectedUsers.includes(id))) {
      // Deselect all users from current page
      setSelectedUsers(prev => prev.filter(id => !currentPageUserIds.includes(id)))
    } else {
      // Select all users from current page
      setSelectedUsers(prev => {
        const newSelection = [...prev]
        currentPageUserIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id)
          }
        })
        return newSelection
      })
    }
  }

  // Change account status for selected users
  const changeAccountStatus = async () => {
    if (selectedUsers.length === 0) {
      setError("Please select at least one user")
      return
    }

    setUpdating(true)
    setError(null)
    setSuccess(null)

    try {
      // Update each selected user
      const updatePromises = selectedUsers.map(userId =>
        apiPatch(`/users/${userId}/account-status`, {
          accountStatus: bulkAction
        })
      )

      await Promise.all(updatePromises)

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          selectedUsers.includes(user.id)
            ? { ...user, accountStatus: bulkAction }
            : user
        )
      )

      setSuccess(`Successfully ${bulkAction === "ENABLED" ? "enabled" : "disabled"} ${selectedUsers.length} account(s)`)
      setSelectedUsers([])
      setTimeout(() => setSuccess(null), 3000)
    } catch (e: any) {
      setError(e?.message || "Failed to update account status")
    } finally {
      setUpdating(false)
    }
  }

  // Change status for a single user
  const changeSingleUserStatus = async (userId: number, newStatus: "ENABLED" | "DISABLED") => {
    setUpdating(true)
    setError(null)
    setSuccess(null)

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken") ||
            localStorage.getItem("jwt") ||
            localStorage.getItem("token")
          : null
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}/account-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
           ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          accountStatus: newStatus
        })
      })

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId
            ? { ...user, accountStatus: newStatus }
            : user
        )
      )

      setSuccess(`Successfully ${newStatus === "ENABLED" ? "enabled" : "disabled"} account`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (e: any) {
      setError(e?.message || "Failed to update account status")
    } finally {
      setUpdating(false)
    }
  }

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Accounts</h2>
        <p className="text-sm text-gray-600 mt-1">Manage user accounts and statuses</p>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Search Input */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search users by name, email, role, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Items per page selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="itemsPerPage" className="text-sm text-gray-600">
            Show:
          </label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {filteredUsers.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={currentUsers.length > 0 && currentUsers.every(user => selectedUsers.includes(user.id))}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Select page ({selectedUsers.length} selected)
                </label>
              </div>
              
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value as "ENABLED" | "DISABLED")}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="ENABLED">Enable</option>
                <option value="DISABLED">Disable</option>
              </select>
              
              <button
                onClick={changeAccountStatus}
                disabled={selectedUsers.length === 0 || updating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  "Change Account Status"
                )}
              </button>
            </div>
            
            <div className="text-sm text-gray-500">
              {selectedUsers.length} of {filteredUsers.length} users selected
            </div>
          </div>
        </div>
      )}

      {/* Error and Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={currentUsers.length > 0 && currentUsers.every(user => selectedUsers.includes(user.id))}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                First name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleUserSelection(user.id)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{user.firstName}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{user.lastName}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{user.email}</td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    user.accountStatus === "ENABLED"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                    {user.accountStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <button
                    onClick={() => changeSingleUserStatus(
                      user.id, 
                      user.accountStatus === "ENABLED" ? "DISABLED" : "ENABLED"
                    )}
                    disabled={updating}
                    className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${
                      user.accountStatus === "ENABLED"
                        ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                        : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {user.accountStatus === "ENABLED" ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => resetPassword(user.id)}
                    disabled={updating}
                    className="ml-2 inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reset
                  </button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                  {searchTerm ? "No users found matching your search" : "No users found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {filteredUsers.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
            {searchTerm && " (filtered)"}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    currentPage === page
                      ? "bg-blue-600 text-white"
                      : "border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      {users.length > 0 && (
        <div className="text-sm text-gray-500">
          Total: {users.length} users • 
          Enabled: {users.filter(u => u.accountStatus === "ENABLED").length} • 
          Disabled: {users.filter(u => u.accountStatus === "DISABLED").length}
          {searchTerm && ` • Filtered: ${filteredUsers.length} users`}
        </div>
      )}
    </div>
  )
}