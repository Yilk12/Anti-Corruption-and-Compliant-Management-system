"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Check, X, ArrowLeft, Trash2 } from "lucide-react"

interface Notification {
  id: string
  title: string
  message: string
  event: string
  isRead: boolean
  createdAt: string
  referenceUrl?: string
  assetRequest?: {
    requestNumber?: string
    assetType?: string
  }
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchNotifications()
  }, [page])

  async function fetchNotifications() {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')
      console.log('Fetching notifications with token:', token ? 'present' : 'missing')
      const res = await fetch(`http://localhost:4000/api/notifications?page=${page}&limit=20`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      
      console.log('Notifications response status:', res.status)
      
      if (res.ok) {
        const data = await res.json()
        console.log('Notifications data:', data)
        setNotifications(data.notifications || [])
        setTotalPages(data.pagination?.totalPages || 1)
      } else {
        const errorData = await res.json()
        console.error('Failed to fetch notifications:', errorData)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')
      await fetch(`http://localhost:4000/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  async function markAllAsRead() {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')
      await fetch('http://localhost:4000/api/notifications/read-all', {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  function handleNotificationClick(notification: Notification) {
    if (notification.referenceUrl) {
      markAsRead(notification.id)
      router.push(notification.referenceUrl)
    }
  }

  function getEventIcon(event: string) {
    switch (event) {
      case 'DEPARTMENT_HEAD_APPROVED':
        return <Check className="w-5 h-5 text-green-500" />
      case 'ASSET_MANAGER_APPROVED':
        return <Check className="w-5 h-5 text-green-500" />
      case 'ASSET_ISSUED':
        return <Bell className="w-5 h-5 text-blue-500" />
      case 'ASSET_REQUEST_REJECTED':
        return <X className="w-5 h-5 text-red-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  function getEventBadgeColor(event: string) {
    switch (event) {
      case 'DEPARTMENT_HEAD_APPROVED':
        return 'bg-green-100 text-green-800'
      case 'ASSET_MANAGER_APPROVED':
        return 'bg-green-100 text-green-800'
      case 'ASSET_ISSUED':
        return 'bg-blue-100 text-blue-800'
      case 'ASSET_REQUEST_REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return new Date(date).toLocaleDateString()
  }

  function parseCommissionerDecisionMessage(message: string) {
    const parsed: any = {};

    // Extract To (Department Name)
    const toMatch = message.match(/To:\s*([^\n]+)/);
    if (toMatch) parsed.to = toMatch[1].trim();

    // Extract Petition Subject
    const petitionSubjectMatch = message.match(/Petition Subject:\s*([^\n]+)/);
    if (petitionSubjectMatch) parsed.petitionSubject = petitionSubjectMatch[1].trim();

    // Extract Petitioner Name
    const petitionerNameMatch = message.match(/Petitioner Name:\s*([^\n]+)/);
    if (petitionerNameMatch) parsed.petitionerName = petitionerNameMatch[1].trim();

    // Extract Commissioner's Observations
    const observationsMatch = message.match(/Commissioner's Observations:\s*([^\n]+)/);
    if (observationsMatch) parsed.commissionerObservations = observationsMatch[1].trim();

    // Extract Legal/Policy Basis
    const legalBasisMatch = message.match(/Legal\/Policy Basis:\s*([^\n]+)/);
    if (legalBasisMatch) parsed.legalPolicyBasis = legalBasisMatch[1].trim();

    // Extract Decision Type
    const decisionTypeMatch = message.match(/Decision Type\s*:\s*([^\n]+)/);
    if (decisionTypeMatch) parsed.decisionType = decisionTypeMatch[1].trim();

    // Extract Disciplinary Action
    const disciplinaryActionMatch = message.match(/Disciplinary Action\s*:\s*([^\n]+)/);
    if (disciplinaryActionMatch) parsed.disciplinaryAction = disciplinaryActionMatch[1].trim();

    // Extract Responsible Department
    const responsibleDeptMatch = message.match(/Responsible Department:\s*([^\n]+)/);
    if (responsibleDeptMatch) parsed.responsibleDepartment = responsibleDeptMatch[1].trim();

    // Extract Implementation Deadline
    const deadlineMatch = message.match(/Implementation Deadline:\s*([^\n]+)/);
    if (deadlineMatch) parsed.implementationDeadline = deadlineMatch[1].trim();

    // Extract Final Decision Summary
    const finalDecisionMatch = message.match(/Final Decision Summary\s*:\s*([\s\S]*?)(?=Decision Date|Closure Remarks|$)/);
    if (finalDecisionMatch) parsed.finalDecisionSummary = finalDecisionMatch[1].trim();

    // Extract Commissioner
    const commissionerMatch = message.match(/Commissioner\s*:\s*([^\n]+)/);
    if (commissionerMatch) parsed.commissioner = commissionerMatch[1].trim();

    // Extract Decision Date
    const decisionDateMatch = message.match(/Decision Date\s*:\s*([^\n]+)/);
    if (decisionDateMatch) parsed.decisionDate = decisionDateMatch[1].trim();

    // Extract Final Petition Status
    const finalStatusMatch = message.match(/Final Petition Status\s*:\s*([^\n]+)/);
    if (finalStatusMatch) parsed.finalPetitionStatus = finalStatusMatch[1].trim();

    // Extract Closure Remarks
    const closureRemarksMatch = message.match(/Closure Remarks:\s*([\s\S]*?)(?=ACTION REQUIRED|$)/);
    if (closureRemarksMatch) parsed.closureRemarks = closureRemarksMatch[1].trim();

    return parsed;
  }

  function isCommissionerDecisionNotification(notification: Notification) {
    return notification.message.includes('Decision Type') ||
           notification.message.includes('የኮሚሽነር ዉሳኔ') ||
           notification.message.includes('COMMISSIONER FINAL DECISION');
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-1">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
          <p className="text-gray-500">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow ${
                !notification.isRead ? 'border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {getEventIcon(notification.event)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEventBadgeColor(notification.event)}`}>
                        {notification.event?.replace(/_/g, ' ') || 'Notification'}
                      </span>
                    </div>
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                    )}
                  </div>
                  {isCommissionerDecisionNotification(notification) ? (
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      {(() => {
                        const parsed = parseCommissionerDecisionMessage(notification.message);
                        return (
                          <>
                            {parsed.to && (
                              <div className="text-sm font-medium text-gray-900">
                                Dear {parsed.to},
                              </div>
                            )}
                            {parsed.petitionSubject && (
                              <div>
                                <div className="text-xs text-gray-500 font-medium">Petition Subject</div>
                                <div className="text-sm text-gray-900">{parsed.petitionSubject}</div>
                              </div>
                            )}
                            {parsed.petitionerName && (
                              <div>
                                <div className="text-xs text-gray-500 font-medium">Petitioner Name</div>
                                <div className="text-sm text-gray-900">{parsed.petitionerName}</div>
                              </div>
                            )}
                            {parsed.commissionerObservations && (
                              <div>
                                <div className="text-xs text-gray-500 font-medium">Commissioner's Observations</div>
                                <div className="text-sm text-gray-900 whitespace-pre-wrap">{parsed.commissionerObservations}</div>
                              </div>
                            )}
                            {parsed.legalPolicyBasis && (
                              <div>
                                <div className="text-xs text-gray-500 font-medium">Legal/Policy Basis</div>
                                <div className="text-sm text-gray-900 whitespace-pre-wrap">{parsed.legalPolicyBasis}</div>
                              </div>
                            )}
                            {parsed.decisionType && (
                              <div>
                                <div className="text-xs text-gray-500 font-medium">Decision Type</div>
                                <div className="text-sm text-gray-900">{parsed.decisionType}</div>
                              </div>
                            )}
                            {parsed.disciplinaryAction && (
                              <div>
                                <div className="text-xs text-gray-500 font-medium">Disciplinary Action</div>
                                <div className="text-sm text-gray-900">{parsed.disciplinaryAction}</div>
                              </div>
                            )}
                            {parsed.responsibleDepartment && (
                              <div>
                                <div className="text-xs text-gray-500 font-medium">Responsible Department</div>
                                <div className="text-sm text-gray-900">{parsed.responsibleDepartment}</div>
                              </div>
                            )}
                            {parsed.implementationDeadline && (
                              <div>
                                <div className="text-xs text-gray-500 font-medium">Implementation Deadline</div>
                                <div className="text-sm text-gray-900">{parsed.implementationDeadline}</div>
                              </div>
                            )}
                            {parsed.finalDecisionSummary && (
                              <div>
                                <div className="text-xs text-gray-500 font-medium">Final Decision Summary</div>
                                <div className="text-sm text-gray-900 whitespace-pre-wrap">{parsed.finalDecisionSummary}</div>
                              </div>
                            )}
                            {parsed.commissioner && (
                              <div>
                                <div className="text-xs text-gray-500 font-medium">Commissioner</div>
                                <div className="text-sm text-gray-900">{parsed.commissioner}</div>
                              </div>
                            )}
                            {parsed.decisionDate && (
                              <div>
                                <div className="text-xs text-gray-500 font-medium">Decision Date</div>
                                <div className="text-sm text-gray-900">{parsed.decisionDate}</div>
                              </div>
                            )}
                            {parsed.finalPetitionStatus && (
                              <div>
                                <div className="text-xs text-gray-500 font-medium">Final Petition Status</div>
                                <div className="text-sm text-gray-900">{parsed.finalPetitionStatus}</div>
                              </div>
                            )}
                            {parsed.closureRemarks && (
                              <div>
                                <div className="text-xs text-gray-500 font-medium">Closure Remarks</div>
                                <div className="text-sm text-gray-900 whitespace-pre-wrap">{parsed.closureRemarks}</div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <p className="text-gray-600 mb-2">{notification.message}</p>
                  )}
                  {notification.assetRequest?.requestNumber && (
                    <div className="text-sm text-gray-500 mb-2">
                      <span className="font-medium">Request:</span> {notification.assetRequest.requestNumber}
                      {notification.assetRequest.assetType && (
                        <span className="ml-2">• {notification.assetRequest.assetType}</span>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-gray-400">{formatTime(notification.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
      </div>
    </div>
  )
}
