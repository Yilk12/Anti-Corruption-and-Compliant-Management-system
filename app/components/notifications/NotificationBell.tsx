"use client"

import { useEffect, useState, useRef } from "react"
import { Bell, X, Check, RotateCcw, CheckCircle, Download, Printer } from "lucide-react"
import { useRouter } from "next/navigation"

console.log('=== NotificationBell module loaded ===')

interface Notification {
  id: string
  title: string
  message: string
  event: string
  isRead: boolean
  createdAt: string
  referenceUrl?: string
  type?: string
  relatedId?: string
  assetRequest?: {
    requestNumber?: string
    assetType?: string
  }
}

export default function NotificationBell() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [commissionerDecisionModal, setCommissionerDecisionModal] = useState(false)
  const [commissionerDecisionData, setCommissionerDecisionData] = useState<any>(null)

  console.log('[NotificationBell] Component mounted, notifications count:', notifications.length)

  useEffect(() => {
    console.log('[NotificationBell] useEffect running')
    fetchNotifications()
    fetchUnreadCount()

    // Poll for new notifications every 60 seconds (reduced from 30)
    intervalRef.current = setInterval(() => {
      if (!isFetching) {
        fetchUnreadCount()
      }
    }, 60000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function fetchNotifications() {
    if (isFetching) return
    setIsFetching(true)
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')
      console.log('Fetching notifications with token:', token ? 'present' : 'missing')
      const res = await fetch('http://localhost:4000/api/workflow/user-notifications', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      console.log('Notifications response status:', res.status)
      if (res.ok) {
        const data = await res.json()
        console.log('Raw notifications data:', data)
        console.log('Data array:', data.data)

        // Map the workflow notifications to the expected format
        const mappedNotifications = (data.data || []).map((n: any) => {
          console.log('Mapping notification:', n)
          const mapped = {
            id: n.id,
            title: n.message.split(' - ')[0] || 'Notification',
            message: n.message,
            event: n.type || 'GENERAL',
            isRead: n.isRead,
            createdAt: n.createdAt,
            type: n.type,
            relatedId: n.relatedId,
          }
          console.log('Mapped notification:', mapped)
          return mapped
        })
        console.log('Final mapped notifications:', mappedNotifications)
        setNotifications(mappedNotifications)
      } else {
        const errorData = await res.json()
        console.error('Notifications error:', errorData)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setIsFetching(false)
    }
  }

  async function fetchUnreadCount() {
    if (isFetching) return
    setIsFetching(true)
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')
      console.log('Fetching unread count with token:', token ? 'present' : 'missing')
      const res = await fetch('http://localhost:4000/api/notifications/unread-count', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      console.log('Unread count response status:', res.status)
      if (res.ok) {
        const data = await res.json()
        console.log('Unread count data:', data)
        setUnreadCount(data.count || 0)
      } else {
        const errorData = await res.json()
        console.error('Unread count error:', errorData)
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    } finally {
      setIsFetching(false)
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')
      await fetch(`http://localhost:4000/api/workflow/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  async function markAllAsRead() {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')
      // For workflow notifications, we delete them instead of marking as read
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id)
      await Promise.all(
        unreadIds.map(id =>
          fetch(`http://localhost:4000/api/workflow/notifications/${id}`, {
            method: 'DELETE',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })
        )
      )
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const downloadCommissionerDecision = (data: any) => {
    const decision = data.commissionerDecision;
    const petition = data.petition;

    const content = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
<head>
<meta charset="utf-8">
<title>Commissioner Decision Notification</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5; }
  h1 { font-size: 18pt; font-weight: bold; color: #1e3a8a; page-break-after: avoid; }
  h2 { font-size: 14pt; font-weight: bold; color: #1e40af; margin-top: 20px; }
  h3 { font-size: 12pt; font-weight: bold; color: #3b82f6; margin-top: 15px; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0; }
  td { border: 1px solid #d1d5db; padding: 8px; vertical-align: top; }
  .label { font-weight: bold; background-color: #f3f4f6; width: 30%; }
  .value { background-color: #ffffff; }
  .section { margin: 20px 0; padding: 15px; border: 1px solid #e5e7eb; border-radius: 5px; }
  .header { background-color: #1e3a8a; color: white; padding: 15px; text-align: center; }
  .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #1e3a8a; font-size: 10pt; color: #6b7280; }
</style>
</head>
<body>
  <div class="header">
    <h1>ETHIOPIAN CIVIL SERVICE COMMISSION</h1>
    <h2>COMMISSIONER FINAL DECISION NOTIFICATION</h2>
  </div>

  <div class="section">
    <h3>NOTIFICATION TO CONCERNED DEPARTMENT</h3>
    <table>
      <tr><td class="label">To:</td><td class="value">${data.complaint?.institution || 'N/A'}</td></tr>
      <tr><td class="label">Petition Number:</td><td class="value">${petition?.petitionNumber || 'N/A'}</td></tr>
    </table>
    <div style="margin-top: 15px; padding: 15px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 5px;">
      <p style="font-weight: bold; color: #c2410c; margin-bottom: 10px;">=== COMMISSIONER FINAL DECISION - ACTION REQUIRED ===</p>
      <p>The Commissioner has issued a final decision on petition ${petition?.petitionNumber} that requires your department's attention.</p>
    </div>
  </div>

  <div class="section">
    <h3>PETITION INFORMATION</h3>
    <table>
      <tr><td class="label">Petition Subject:</td><td class="value">${decision?.petitionSubject || 'N/A'}</td></tr>
      <tr><td class="label">Petitioner Name:</td><td class="value">${decision?.petitionerName || 'N/A'}</td></tr>
      <tr><td class="label">Concerned Department:</td><td class="value">${decision?.concernedDepartment || 'N/A'}</td></tr>
      <tr><td class="label">Date Received:</td><td class="value">${decision?.dateReceived || 'N/A'}</td></tr>
    </table>
  </div>

  <div class="section">
    <h3>INVESTIGATION SUMMARY</h3>
    <table>
      <tr><td class="label">Summary of Findings:</td><td class="value">${decision?.summaryOfFindings || 'N/A'}</td></tr>
      <tr><td class="label">Evidence Reviewed:</td><td class="value">${decision?.evidenceReviewed || 'N/A'}</td></tr>
      <tr><td class="label">Investigator Recommendation:</td><td class="value">${decision?.investigatorRecommendation || 'N/A'}</td></tr>
    </table>
  </div>

  <div class="section">
    <h3>COMMISSIONER'S DECISION</h3>
    <table>
      <tr><td class="label">Commissioner's Observations:</td><td class="value">${decision?.commissionerObservations || 'N/A'}</td></tr>
      <tr><td class="label">Legal/Policy Basis:</td><td class="value">${decision?.legalPolicyBasis || 'N/A'}</td></tr>
    </table>
  </div>

  <div class="section">
    <h3>DECISION DETAILS</h3>
    <table>
      <tr><td class="label">Decision Type:</td><td class="value">${decision?.decisionType || 'N/A'}</td></tr>
      <tr><td class="label">Disciplinary Action:</td><td class="value">${decision?.disciplinaryAction || 'N/A'}</td></tr>
      <tr><td class="label">Responsible Department:</td><td class="value">${decision?.responsibleDepartment || 'N/A'}</td></tr>
      <tr><td class="label">Implementation Deadline:</td><td class="value">${decision?.implementationDeadline || 'N/A'}</td></tr>
    </table>
  </div>

  <div class="section">
    <h3>FINAL DECISION SUMMARY</h3>
    <p>${decision?.finalDecisionSummary || 'N/A'}</p>
  </div>

  <div class="section">
    <h3>DECISION AUTHORIZATION</h3>
    <table>
      <tr><td class="label">Commissioner Name:</td><td class="value">${decision?.commissionerName || 'N/A'}</td></tr>
      <tr><td class="label">Decision Date:</td><td class="value">${decision?.decisionDate || 'N/A'}</td></tr>
      <tr><td class="label">Final Petition Status:</td><td class="value">${decision?.finalPetitionStatus || 'N/A'}</td></tr>
      <tr><td class="label">Closure Remarks:</td><td class="value">${decision?.closureRemarks || 'N/A'}</td></tr>
    </table>
  </div>

  <div class="section" style="background: #fef2f2; border: 2px solid #ef4444;">
    <h3 style="color: #dc2626;">ACTION REQUIRED</h3>
    <p style="color: #dc2626; font-weight: bold;">Please implement the disciplinary action(s) as specified above by the implementation deadline.</p>
    <p style="color: #dc2626;">Report back on the implementation status within the specified timeframe.</p>
  </div>

  <div class="footer">
    <p><strong>Ethics and Anti-Corruption Commission</strong></p>
    <p>This decision has been communicated to the concerned department for implementation.</p>
    <p>Sincerely, Ethics and Anti-Corruption Commission</p>
    <p>Generated on: ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
    `.trim();

    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Commissioner_Decision_Notification_${petition?.petitionNumber || 'Petition'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printCommissionerDecision = (data: any) => {
    const decision = data.commissionerDecision;
    const petition = data.petition;

    const printContent = `
      <html>
      <head>
        <title>Commissioner Decision Notification - Print</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5; margin: 0; padding: 20px; }
          h1 { font-size: 18pt; font-weight: bold; color: #1e3a8a; text-align: center; margin-bottom: 5px; }
          h2 { font-size: 14pt; font-weight: bold; color: #1e40af; text-align: center; margin-top: 0; margin-bottom: 20px; }
          h3 { font-size: 12pt; font-weight: bold; color: #3b82f6; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; }
          table { border-collapse: collapse; width: 100%; margin: 10px 0; }
          td { border: 1px solid #d1d5db; padding: 8px; vertical-align: top; }
          .label { font-weight: bold; background-color: #f3f4f6; width: 30%; }
          .value { background-color: #ffffff; }
          .section { margin: 20px 0; padding: 15px; border: 1px solid #e5e7eb; page-break-inside: avoid; }
          .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #1e3a8a; font-size: 10pt; color: #6b7280; text-align: center; }
          @media print {
            body { margin: 0; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>ETHIOPIAN CIVIL SERVICE COMMISSION</h1>
        <h2>COMMISSIONER FINAL DECISION NOTIFICATION</h2>

        <div class="section">
          <h3>NOTIFICATION TO CONCERNED DEPARTMENT</h3>
          <table>
            <tr><td class="label">To:</td><td class="value">${data.complaint?.institution || 'N/A'}</td></tr>
            <tr><td class="label">Petition Number:</td><td class="value">${petition?.petitionNumber || 'N/A'}</td></tr>
          </table>
          <div style="margin-top: 15px; padding: 15px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 5px;">
            <p style="font-weight: bold; color: #c2410c; margin-bottom: 10px;">=== COMMISSIONER FINAL DECISION - ACTION REQUIRED ===</p>
            <p>The Commissioner has issued a final decision on petition ${petition?.petitionNumber} that requires your department's attention.</p>
          </div>
        </div>

        <div class="section">
          <h3>PETITION INFORMATION</h3>
          <table>
            <tr><td class="label">Petition Subject:</td><td class="value">${decision?.petitionSubject || 'N/A'}</td></tr>
            <tr><td class="label">Petitioner Name:</td><td class="value">${decision?.petitionerName || 'N/A'}</td></tr>
            <tr><td class="label">Concerned Department:</td><td class="value">${decision?.concernedDepartment || 'N/A'}</td></tr>
            <tr><td class="label">Date Received:</td><td class="value">${decision?.dateReceived || 'N/A'}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>INVESTIGATION SUMMARY</h3>
          <table>
            <tr><td class="label">Summary of Findings:</td><td class="value">${decision?.summaryOfFindings || 'N/A'}</td></tr>
            <tr><td class="label">Evidence Reviewed:</td><td class="value">${decision?.evidenceReviewed || 'N/A'}</td></tr>
            <tr><td class="label">Investigator Recommendation:</td><td class="value">${decision?.investigatorRecommendation || 'N/A'}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>COMMISSIONER'S DECISION</h3>
          <table>
            <tr><td class="label">Commissioner's Observations:</td><td class="value">${decision?.commissionerObservations || 'N/A'}</td></tr>
            <tr><td class="label">Legal/Policy Basis:</td><td class="value">${decision?.legalPolicyBasis || 'N/A'}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>DECISION DETAILS</h3>
          <table>
            <tr><td class="label">Decision Type:</td><td class="value">${decision?.decisionType || 'N/A'}</td></tr>
            <tr><td class="label">Disciplinary Action:</td><td class="value">${decision?.disciplinaryAction || 'N/A'}</td></tr>
            <tr><td class="label">Responsible Department:</td><td class="value">${decision?.responsibleDepartment || 'N/A'}</td></tr>
            <tr><td class="label">Implementation Deadline:</td><td class="value">${decision?.implementationDeadline || 'N/A'}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>FINAL DECISION SUMMARY</h3>
          <p>${decision?.finalDecisionSummary || 'N/A'}</p>
        </div>

        <div class="section">
          <h3>DECISION AUTHORIZATION</h3>
          <table>
            <tr><td class="label">Commissioner Name:</td><td class="value">${decision?.commissionerName || 'N/A'}</td></tr>
            <tr><td class="label">Decision Date:</td><td class="value">${decision?.decisionDate || 'N/A'}</td></tr>
            <tr><td class="label">Final Petition Status:</td><td class="value">${decision?.finalPetitionStatus || 'N/A'}</td></tr>
            <tr><td class="label">Closure Remarks:</td><td class="value">${decision?.closureRemarks || 'N/A'}</td></tr>
          </table>
        </div>

        <div class="section" style="background: #fef2f2; border: 2px solid #ef4444;">
          <h3 style="color: #dc2626;">ACTION REQUIRED</h3>
          <p style="color: #dc2626; font-weight: bold;">Please implement the disciplinary action(s) as specified above by the implementation deadline.</p>
          <p style="color: #dc2626;">Report back on the implementation status within the specified timeframe.</p>
        </div>

        <div class="footer">
          <p><strong>Ethics and Anti-Corruption Commission</strong></p>
          <p>This decision has been communicated to the concerned department for implementation.</p>
          <p>Sincerely, Ethics and Anti-Corruption Commission</p>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  async function handleNotificationClick(notification: Notification) {
    console.log('Notification clicked:', notification)
    console.log('Notification type:', notification.type)
    console.log('Notification relatedId:', notification.relatedId)

    markAsRead(notification.id)

    // Handle commissioner decision notifications - show modal with details
    if (notification.type === 'COMMISSIONER_DECISION' && notification.relatedId) {
      console.log('Handling commissioner decision notification')
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')
        console.log('Fetching commissioner decision for petition:', notification.relatedId)
        const res = await fetch(`http://localhost:4000/api/feedback/petitions/${notification.relatedId}/commissioner-decision`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        console.log('Response status:', res.status)
        if (res.ok) {
          const data = await res.json()
          console.log('Commissioner decision data:', data)
          setCommissionerDecisionData(data)
          setCommissionerDecisionModal(true)
          setIsOpen(false)
          console.log('Modal should now be open')
        } else {
          console.error('Failed to fetch commissioner decision, status:', res.status)
        }
      } catch (error) {
        console.error('Failed to fetch commissioner decision:', error)
      }
    } else if (notification.referenceUrl) {
      console.log('Navigating to reference URL:', notification.referenceUrl)
      router.push(notification.referenceUrl)
      setIsOpen(false)
    } else {
      console.log('No action for this notification')
    }
  }

  function getEventIcon(event: string, type?: string) {
    // Use custom image for commissioner decision notifications
    if (type === 'COMMISSIONER_DECISION') {
      return <img src="/pt.png" alt="Petition" className="w-6 h-6 object-contain" />
    }

    switch (event) {
      case 'DEPARTMENT_HEAD_APPROVED':
        return <Check className="w-4 h-4 text-green-500" />
      case 'ASSET_MANAGER_APPROVED':
        return <Check className="w-4 h-4 text-green-500" />
      case 'ASSET_ISSUED':
        return <Check className="w-4 h-4 text-green-500" />
      case 'ASSET_REQUEST_REJECTED':
        return <X className="w-4 h-4 text-red-500" />
      case 'ASSET_REQUEST_RETURNED':
        return <RotateCcw className="w-4 h-4 text-orange-500" />
      case 'FIELD_REQUEST_APPROVED':
        return <Check className="w-4 h-4 text-green-500" />
      case 'FIELD_REQUEST_REJECTED':
        return <X className="w-4 h-4 text-red-500" />
      case 'FIELD_REQUEST_COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'OVERTIME_REQUEST_APPROVED':
        return <Check className="w-4 h-4 text-green-500" />
      case 'OVERTIME_REQUEST_REJECTED':
        return <X className="w-4 h-4 text-red-500" />
      default:
        return <Bell className="w-4 h-4 text-gray-500" />
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
    return date.toLocaleDateString()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) {
            fetchNotifications()
          }
        }}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
        style={{ background: "transparent", border: "none", cursor: "pointer" }}
      >
        <Bell className="w-5 h-5 text-white" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
            style={{
              minWidth: "20px",
              minHeight: "20px"
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
          style={{
            maxHeight: "400px",
            overflow: "auto"
          }}
        >
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No notifications</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => {
                console.log('Rendering notification:', notification)
                return (
                <div
                  key={notification.id}
                  onClick={(e) => {
                    console.log('Div clicked, event:', e)
                    console.log('Notification object:', notification)
                    e.preventDefault()
                    e.stopPropagation()
                    handleNotificationClick(notification)
                  }}
                  onMouseDown={() => console.log('Mouse down on notification:', notification.id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getEventIcon(notification.event, notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      {notification.assetRequest?.requestNumber && (
                        <p className="text-xs text-gray-500 mt-1">
                          Request: {notification.assetRequest.requestNumber}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          )}

          <div className="p-3 border-t border-gray-200">
            <button
              onClick={() => {
                router.push('/notifications')
                setIsOpen(false)
              }}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2"
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}

      {/* Commissioner Decision Modal */}
      {commissionerDecisionModal && commissionerDecisionData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Notification to Concerned Department</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadCommissionerDecision(commissionerDecisionData)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded flex items-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => printCommissionerDecision(commissionerDecisionData)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded flex items-center gap-2 text-sm"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button
                    onClick={() => setCommissionerDecisionModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <p className="mb-2"><strong>To:</strong> {commissionerDecisionData.complaint?.institution || 'N/A'}</p>
                  <p className="font-semibold mb-2 text-orange-900">=== COMMISSIONER FINAL DECISION - ACTION REQUIRED ===</p>
                  <p className="mb-2">The Commissioner has issued a final decision on petition {commissionerDecisionData.petition?.petitionNumber} that requires your department's attention.</p>

                  {commissionerDecisionData.commissionerDecision?.petitionSubject && (
                    <p className="mb-2"><strong>Petition Subject:</strong> {commissionerDecisionData.commissionerDecision.petitionSubject}</p>
                  )}
                  {commissionerDecisionData.commissionerDecision?.petitionerName && (
                    <p className="mb-2"><strong>Petitioner Name:</strong> {commissionerDecisionData.commissionerDecision.petitionerName}</p>
                  )}

                  <p className="mb-2 font-semibold">Investigation Summary:</p>
                  {commissionerDecisionData.commissionerDecision?.summaryOfFindings && (
                    <p className="mb-2">- Summary of Findings: {commissionerDecisionData.commissionerDecision.summaryOfFindings}</p>
                  )}
                  {commissionerDecisionData.commissionerDecision?.evidenceReviewed && (
                    <p className="mb-2">- Evidence Reviewed: {commissionerDecisionData.commissionerDecision.evidenceReviewed}</p>
                  )}
                  {commissionerDecisionData.commissionerDecision?.investigatorRecommendation && (
                    <p className="mb-2">- Investigator Recommendation: {commissionerDecisionData.commissionerDecision.investigatorRecommendation}</p>
                  )}

                  <p className="mb-2 font-semibold">Commissioner's Decision:</p>
                  {commissionerDecisionData.commissionerDecision?.commissionerObservations && (
                    <p className="mb-2">- Commissioner's Observations: {commissionerDecisionData.commissionerDecision.commissionerObservations}</p>
                  )}
                  {commissionerDecisionData.commissionerDecision?.legalPolicyBasis && (
                    <p className="mb-2">- Legal/Policy Basis: {commissionerDecisionData.commissionerDecision.legalPolicyBasis}</p>
                  )}

                  <p className="mb-2 font-semibold">Decision Details:</p>
                  <ul className="list-disc list-inside space-y-1 mb-2">
                    <li>Decision Type: {commissionerDecisionData.commissionerDecision?.decisionType || 'N/A'}</li>
                    <li>Disciplinary Action: {commissionerDecisionData.commissionerDecision?.disciplinaryAction || 'N/A'}</li>
                    <li>Responsible Department: {commissionerDecisionData.commissionerDecision?.responsibleDepartment || 'N/A'}</li>
                    <li>Implementation Deadline: {commissionerDecisionData.commissionerDecision?.implementationDeadline || 'N/A'}</li>
                  </ul>

                  {commissionerDecisionData.commissionerDecision?.finalDecisionSummary && (
                    <p className="mb-2"><strong>Final Decision Summary:</strong> {commissionerDecisionData.commissionerDecision.finalDecisionSummary}</p>
                  )}

                  {commissionerDecisionData.commissionerDecision?.commissionerName && (
                    <p className="mb-2"><strong>Commissioner:</strong> {commissionerDecisionData.commissionerDecision.commissionerName}</p>
                  )}
                  {commissionerDecisionData.commissionerDecision?.decisionDate && (
                    <p className="mb-2"><strong>Decision Date:</strong> {commissionerDecisionData.commissionerDecision.decisionDate}</p>
                  )}

                  <p className="mb-2"><strong>Final Petition Status:</strong> {commissionerDecisionData.commissionerDecision?.finalPetitionStatus || 'Closed'}</p>

                  {commissionerDecisionData.commissionerDecision?.closureRemarks && (
                    <p className="mb-2"><strong>Closure Remarks:</strong> {commissionerDecisionData.commissionerDecision.closureRemarks}</p>
                  )}

                  <p className="font-bold text-red-700 mb-2 mt-4">ACTION REQUIRED:</p>
                  <p className="mb-2">Please implement the disciplinary action(s) as specified above by the implementation deadline.</p>
                  <p>Report back on the implementation status within the specified timeframe.</p>
                  <p className="mt-2">Sincerely, Ethics and Anti-Corruption Commission</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
