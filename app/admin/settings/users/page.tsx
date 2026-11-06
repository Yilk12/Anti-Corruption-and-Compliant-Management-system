"use client"
import { useEffect, useState } from "react"
import { apiGet, apiPatch } from "@/app/lib/api"

type PasswordPolicy = {
  id: number
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireDigit: boolean
  requireSpecialcharSymbol: boolean
  expirationDays: number
  createdAt: string
  updatedAt: string
}

export default function UsersRolesSettingsPage() {
  const [policy, setPolicy] = useState<PasswordPolicy | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadPolicy()
  }, [])

  const loadPolicy = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiGet<PasswordPolicy>("/password-policy")
      setPolicy(data)
    } catch (e: any) {
      console.error("Failed to load password policy:", e)
      setError(e?.message || "Failed to load password policy settings")
      // Set default values as fallback
      setPolicy({
        id: 0,
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireDigit: true,
        requireSpecialcharSymbol: true,
        expirationDays: 90,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (key: keyof PasswordPolicy, value: string | boolean) => {
    if (!policy) return
    let v: any = value
    if (key === "minLength" || key === "expirationDays") v = Number(value)
    setPolicy({ ...policy, [key]: v })
  }

  const save = async () => {
    if (!policy) return
    
    setSaving(true)
    setError(null)
    setSuccess(false)
    
    try {
      // Remove fields that shouldn't be sent to the API
      const { id, createdAt, updatedAt, ...updateData } = policy
      
      await apiPatch("/password-policy", updateData)
      setSuccess(true)
      
      // Reload the policy to get the updated data from server
      setTimeout(() => {
        loadPolicy()
        setSuccess(false)
      }, 2000)
    } catch (e: any) {
      console.error("Failed to save password policy:", e)
      setError(e?.response?.data?.message || e?.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading password policy...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
          <p className="text-gray-600 mt-2">Manage password policies and security requirements</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">Password policy updated successfully!</p>
            </div>
          </div>
        )}

        {/* Password Policy Card */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Password Policy</h2>
                <p className="text-gray-600 text-sm mt-1">Configure requirements for user passwords</p>
              </div>
              <button
                onClick={loadPolicy}
                disabled={loading}
                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <svg className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Minimum Length */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Password Length
                </label>
                <p className="text-sm text-gray-500">Set the minimum number of characters required</p>
              </div>
              <div className="w-24">
                <input
                  type="number"
                  min={6}
                  max={64}
                  value={policy?.minLength || 12}
                  onChange={(e) => handleChange("minLength", e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Toggle Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ToggleSetting
                label="Require Uppercase Letters"
                description="At least one capital letter (A-Z)"
                value={policy?.requireUppercase ?? true}
                onChange={(value) => handleChange("requireUppercase", value)}
              />
              <ToggleSetting
                label="Require Lowercase Letters"
                description="At least one lowercase letter (a-z)"
                value={policy?.requireLowercase ?? true}
                onChange={(value) => handleChange("requireLowercase", value)}
              />
              <ToggleSetting
                label="Require Numbers"
                description="At least one digit (0-9)"
                value={policy?.requireDigit ?? true}
                onChange={(value) => handleChange("requireDigit", value)}
              />
              <ToggleSetting
                label="Require Special Characters"
                description="At least one special character (@, #, $, etc.)"
                value={policy?.requireSpecialcharSymbol ?? true}
                onChange={(value) => handleChange("requireSpecialcharSymbol", value)}
              />
            </div>

            {/* Expiration */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password Expiration
                </label>
                <p className="text-sm text-gray-500">Number of days before passwords expire (0 for never)</p>
              </div>
              <div className="w-24">
                <input
                  type="number"
                  min={0}
                  max={365}
                  value={policy?.expirationDays || 90}
                  onChange={(e) => handleChange("expirationDays", e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Last Updated */}
            {policy?.updatedAt && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Last updated: {new Date(policy.updatedAt).toLocaleDateString()} at {new Date(policy.updatedAt).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={loadPolicy}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || !policy}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Toggle Component
function ToggleSetting({ 
  label, 
  description, 
  value, 
  onChange 
}: {
  label: string
  description: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-900">{label}</h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <button
        type="button"
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          value ? 'bg-blue-600' : 'bg-gray-200'
        }`}
        onClick={() => onChange(!value)}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}