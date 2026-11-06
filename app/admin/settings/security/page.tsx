"use client"
import { useEffect, useState } from "react"
import { apiGet, apiPost } from "@/app/lib/api"

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

export default function SecuritySettingsPage() {
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicy | null>(null)
  const [loading, setLoading] = useState(false)
  const [policyLoading, setPolicyLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  useEffect(() => {
    const loadPasswordPolicy = async () => {
      setPolicyLoading(true)
      try {
        const policy = await apiGet<PasswordPolicy>("/password-policy")
        setPasswordPolicy(policy)
      } catch (e: any) {
        console.error("Failed to load password policy:", e)
        // Set default policy if API fails
        setPasswordPolicy({
          id: 1,
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
        setPolicyLoading(false)
      }
    }

    loadPasswordPolicy()
  }, [])

  // Validate password against policy
  const validatePassword = (password: string): string | null => {
    if (!passwordPolicy) return "Password policy not loaded"
    
    if (password.length < passwordPolicy.minLength) {
      return `Password must be at least ${passwordPolicy.minLength} characters long`
    }
    
    if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter"
    }
    
    if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter"
    }
    
    if (passwordPolicy.requireDigit && !/\d/.test(password)) {
      return "Password must contain at least one number"
    }
    
    if (passwordPolicy.requireSpecialcharSymbol && !/[@#$%^&*!]/.test(password)) {
      return "Password must contain at least one special character (@, #, $, %, etc.)"
    }
    
    return null
  }

const changePassword = async () => {
  setPasswordError(null)
  setPasswordSuccess(false)

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("accessToken") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("token")
      : null

  // Basic validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    setPasswordError("All fields are required")
    return
  }

  if (newPassword !== confirmPassword) {
    setPasswordError("New passwords do not match")
    return
  }

  // Validate against password policy
  const validationError = validatePassword(newPassword)
  if (validationError) {
    setPasswordError(validationError)
    return
  }

  setChangingPassword(true)
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    })

    // Check if response is ok
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    setPasswordSuccess(true)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setTimeout(() => setPasswordSuccess(false), 3000)
  } catch (e: any) {
    // Handle specific error messages from backend
    const errorMessage = e.message || "Failed to change password"
    setPasswordError(errorMessage)
    console.error("Password change error:", e)
  } finally {
    setChangingPassword(false)
  }
}

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password || !passwordPolicy) return { strength: 0, label: "" }
    
    let strength = 0
    if (password.length >= passwordPolicy.minLength) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[@#$%^&*!]/.test(password)) strength++
    
    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong"]
    return { strength, label: labels[strength] }
  }

  const newPasswordStrength = getPasswordStrength(newPassword)

  if (policyLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading security settings...</p>
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
          <p className="text-gray-600 mt-2">Manage your password and security preferences</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Password Change */}
          <div className="space-y-6">
            {/* Password Change Card */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
                <p className="text-gray-600 text-sm mt-1">Update your account password</p>
              </div>
              
              <div className="p-6 space-y-4">
                {passwordError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                    <svg className="w-4 h-4 text-red-400 mr-2 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-700">{passwordError}</p>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
                    <svg className="w-4 h-4 text-green-400 mr-2 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-green-700">Password changed successfully!</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder="Enter your current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder="Enter your new password"
                  />
                  
                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-gray-600">Password Strength:</span>
                        <span className={
                          newPasswordStrength.strength < 2 ? "text-red-600 font-medium" :
                          newPasswordStrength.strength < 4 ? "text-yellow-600 font-medium" :
                          "text-green-600 font-medium"
                        }>
                          {newPasswordStrength.label}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            newPasswordStrength.strength < 2 ? "bg-red-500" :
                            newPasswordStrength.strength < 4 ? "bg-yellow-500" :
                            "bg-green-500"
                          }`}
                          style={{ width: `${(newPasswordStrength.strength / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder="Confirm your new password"
                  />
                </div>

                <button
                  onClick={changePassword}
                  disabled={changingPassword || !passwordPolicy}
                  className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {changingPassword ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Changing Password...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Password Policy */}
          <div className="space-y-6">
            {/* Current Password Policy Card */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Password Requirements</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Your new password must meet these requirements
                  {passwordPolicy && (
                    <span className="text-blue-600 ml-1">
                      (Updated: {new Date(passwordPolicy.updatedAt).toLocaleDateString()})
                    </span>
                  )}
                </p>
              </div>
              
              <div className="p-6">
                {!passwordPolicy ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading password policy...</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className={`w-2 h-2 rounded-full mt-2 mr-3 shrink-0 ${
                          newPassword.length >= passwordPolicy.minLength ? 'bg-green-500' : 'bg-gray-300'
                        }`}></div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Minimum {passwordPolicy.minLength} characters
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            Current: {newPassword.length} characters
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className={`w-2 h-2 rounded-full mt-2 mr-3 shrink-0 ${
                          !passwordPolicy.requireUppercase || /[A-Z]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'
                        }`}></div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            At least one uppercase letter (A-Z)
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {passwordPolicy.requireUppercase ? "Required" : "Optional"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className={`w-2 h-2 rounded-full mt-2 mr-3 shrink-0 ${
                          !passwordPolicy.requireLowercase || /[a-z]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'
                        }`}></div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            At least one lowercase letter (a-z)
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {passwordPolicy.requireLowercase ? "Required" : "Optional"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className={`w-2 h-2 rounded-full mt-2 mr-3 shrink-0 ${
                          !passwordPolicy.requireDigit || /\d/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'
                        }`}></div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            At least one number (0-9)
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {passwordPolicy.requireDigit ? "Required" : "Optional"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className={`w-2 h-2 rounded-full mt-2 mr-3 shrink-0 ${
                          !passwordPolicy.requireSpecialcharSymbol || /[@#$%^&*!]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'
                        }`}></div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            At least one special character (@, #, $, %, ^, &, *, !)
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {passwordPolicy.requireSpecialcharSymbol ? "Required" : "Optional"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start pt-2 border-t border-gray-100">
                        <div className="w-2 h-2 rounded-full mt-2 mr-3 shrink-0 bg-blue-500"></div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Password expires every {passwordPolicy.expirationDays} days
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            You'll be prompted to change your password after {passwordPolicy.expirationDays} days
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Policy Status Summary */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="text-sm font-medium text-blue-900 mb-2">Password Status</h3>
                      <p className="text-xs text-blue-700">
                        {validatePassword(newPassword) 
                          ? "Your password doesn't meet all requirements yet."
                          : newPassword 
                            ? "Great! Your password meets all requirements."
                            : "Enter a new password to see requirements."
                        }
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Security Tips */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Security Tips</h2>
              </div>
              <div className="p-6">
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Use a unique password that you don't use elsewhere
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Consider using a passphrase with multiple words
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Avoid using personal information in your password
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Change your password regularly for better security
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}