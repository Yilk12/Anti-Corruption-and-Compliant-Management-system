'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/app/components/dashboard-layout'
import { AuthGuard } from '@/app/components/auth-guard'
import { useSecretCodeCheck } from "@/app/hooks/use-secret-code-check";

interface Complaint {
  id: string
  referenceNumber: string
  category: string
  description: string
  priority: string
  status: string
  screeningNotes?: string
  safetyRisk?: string
  retaliationRisk?: string
  confidentialityLevel?: string
  createdAt: string
}

export default function ComplaintAssessmentPage() {
  const router = useRouter()
  
  // Check secret code status
  useSecretCodeCheck('/ethics/anticorruption/assess')
  
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [loading, setLoading] = useState(true)
  const [assessing, setAssessing] = useState(false)

  const [assessmentData, setAssessmentData] = useState({
    assessmentNotes: '',
    jurisdictionCheck: false,
    credibilityCheck: 'Low',
    urgencyCheck: 'Low',
    conflictCheck: false,
    recommendedRoute: 'Investigation',
    recommendedReferral: '',
  })

  useEffect(() => {
    fetchRegisteredComplaints()
  }, [])

  const fetchRegisteredComplaints = async () => {
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || ""
      const response = await fetch('http://localhost:4000/api/ethics/anticorruption/reports?status=Registered', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setComplaints(data)
      }
    } catch (error) {
      console.error('Error fetching complaints:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint)
  }

  const handleAssessComplaint = async () => {
    if (!selectedComplaint) return

    setAssessing(true)
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || ""
      const response = await fetch(`http://localhost:4000/api/ethics/anticorruption/reports/${selectedComplaint.id}/assess`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assessmentData),
      })

      if (response.ok) {
        alert('Complaint assessed successfully')
        fetchRegisteredComplaints()
        setSelectedComplaint(null)
      } else {
        alert('Failed to assess complaint')
      }
    } catch (error) {
      console.error('Error assessing complaint:', error)
      alert('Failed to assess complaint')
    } finally {
      setAssessing(false)
    }
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Complaint Assessment</h1>
              <p className="text-gray-600 mt-1">Assess jurisdiction, credibility, and recommend investigation route</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Complaints List */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">Registered Complaints</h2>
              </div>
              <div className="p-4 space-y-3 max-h-150 overflow-y-auto">
                {loading ? (
                  <div className="text-center text-gray-500">Loading...</div>
                ) : complaints.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">No registered complaints to assess</div>
                ) : (
                  complaints.map((complaint) => (
                    <div
                      key={complaint.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedComplaint?.id === complaint.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleSelectComplaint(complaint)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{complaint.referenceNumber}</div>
                          <div className="text-sm text-gray-600 mt-1">{complaint.category}</div>
                          <div className="text-sm text-gray-500 mt-1 line-clamp-2">{complaint.description}</div>
                        </div>
                        <div className="ml-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              complaint.priority === 'Urgent'
                                ? 'bg-red-100 text-red-800'
                                : complaint.priority === 'High'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {complaint.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Assessment Form */}
            {selectedComplaint && (
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold text-gray-800">Assessment Form</h2>
                  <p className="text-sm text-gray-500">{selectedComplaint.referenceNumber}</p>
                </div>
                <div className="p-4 space-y-4">
                  {/* Screening Information */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h3 className="font-medium text-gray-700 mb-2">Screening Information</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Safety Risk:</strong> {selectedComplaint.safetyRisk}</p>
                      <p><strong>Retaliation Risk:</strong> {selectedComplaint.retaliationRisk}</p>
                      <p><strong>Confidentiality:</strong> {selectedComplaint.confidentialityLevel}</p>
                      {selectedComplaint.screeningNotes && (
                        <p><strong>Screening Notes:</strong> {selectedComplaint.screeningNotes}</p>
                      )}
                    </div>
                  </div>

                  {/* Assessment Fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assessment Notes
                    </label>
                    <textarea
                      value={assessmentData.assessmentNotes}
                      onChange={(e) => setAssessmentData({ ...assessmentData, assessmentNotes: e.target.value })}
                      className="w-full border rounded-lg p-2 text-sm"
                      rows={3}
                      placeholder="Enter your assessment notes..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Jurisdiction Check
                      </label>
                      <select
                        value={assessmentData.jurisdictionCheck.toString()}
                        onChange={(e) => setAssessmentData({ ...assessmentData, jurisdictionCheck: e.target.value === 'true' })}
                        className="w-full border rounded-lg p-2 text-sm"
                      >
                        <option value="false">Outside Mandate</option>
                        <option value="true">Within FCSC Mandate</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Credibility Check
                      </label>
                      <select
                        value={assessmentData.credibilityCheck}
                        onChange={(e) => setAssessmentData({ ...assessmentData, credibilityCheck: e.target.value })}
                        className="w-full border rounded-lg p-2 text-sm"
                      >
                        <option value="Low">Low</option>
                        <option value="High">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Urgency Check
                      </label>
                      <select
                        value={assessmentData.urgencyCheck}
                        onChange={(e) => setAssessmentData({ ...assessmentData, urgencyCheck: e.target.value })}
                        className="w-full border rounded-lg p-2 text-sm"
                      >
                        <option value="Low">Low</option>
                        <option value="High">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Conflict of Interest
                      </label>
                      <select
                        value={assessmentData.conflictCheck.toString()}
                        onChange={(e) => setAssessmentData({ ...assessmentData, conflictCheck: e.target.value === 'true' })}
                        className="w-full border rounded-lg p-2 text-sm"
                      >
                        <option value="false">No Conflict</option>
                        <option value="true">Conflict Detected</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recommended Route
                    </label>
                    <select
                      value={assessmentData.recommendedRoute}
                      onChange={(e) => setAssessmentData({ ...assessmentData, recommendedRoute: e.target.value })}
                      className="w-full border rounded-lg p-2 text-sm"
                    >
                      <option value="Investigation">Investigation</option>
                      <option value="Referral">Referral to Another Body</option>
                      <option value="Further Information">Request More Information</option>
                      <option value="Duplicate Closure">Duplicate Closure</option>
                    </select>
                  </div>

                  {assessmentData.recommendedRoute === 'Referral' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Referral Institution
                      </label>
                      <input
                        type="text"
                        value={assessmentData.recommendedReferral}
                        onChange={(e) => setAssessmentData({ ...assessmentData, recommendedReferral: e.target.value })}
                        className="w-full border rounded-lg p-2 text-sm"
                        placeholder="Enter referral institution..."
                      />
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={handleAssessComplaint}
                      disabled={assessing}
                      className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {assessing ? 'Assessing...' : 'Submit Assessment'}
                    </button>
                    <button
                      onClick={() => setSelectedComplaint(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
