"use client"
import React from "react"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { signOut, decodeJwt } from "@/app/lib/auth"
import ToastHost from "@/app/components/toast"
import { useLocalization } from "@/app/hooks/use-localization"
import { useIsMobile } from "@/app/hooks/use-mobile"
import Link from "next/link"
import { Inbox } from "lucide-react"

// Paths that should not show header/sidebar
const EXCLUDED_PATHS = ['/guest-complaint', '/guest-feedback', '/guest-anticorruption', '/track-complaint', '/track-feedback', '/login', '/register', '/forgot-password']

type NotificationSource =
  | "tickets"
  | "user"
  | "hr"
  | "field"
  | "overtime"
  | "hrOT"
  | "userOT"
  | string

type NotificationItem = {
  id: string
  message?: string
  title?: string
  createdAt?: string
  isOpen?: boolean
  source?: NotificationSource
  // Allow any additional fields coming from the backend
  [key: string]: any
}

export default function AppHeader() {
  // Call ALL hooks first (Rules of Hooks)
  const pathname = usePathname()
  const router = useRouter()
  const { currentLanguage, setLanguage, t } = useLocalization()
  const isMobile = useIsMobile()
  
  // Mounted state to prevent hydration errors
  const [mounted, setMounted] = React.useState(false)
  
  // State hooks
  const [userName, setUserName] = React.useState<string>("User")
  const [userPhotoUrl, setUserPhotoUrl] = React.useState<string | null>(null)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [fcscMenuOpen, setFcscMenuOpen] = React.useState(false)
  const [notifOpen, setNotifOpen] = React.useState(false)
  const [notifLoading, setNotifLoading] = React.useState(false)
  const [notifError, setNotifError] = React.useState<string | null>(null)
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [isAdmin, setIsAdmin] = React.useState(false)
  const [isDeptHead, setIsDeptHead] = React.useState(false)
  const [isTeamLead, setIsTeamLead] = React.useState(false)
  const [isEmployee, setIsEmployee] = React.useState(false)
  const [langOpen, setLangOpen] = React.useState(false)
  const [roleLabel, setRoleLabel] = React.useState<string>("User")
  const [notifPeriod, setNotifPeriod] = React.useState<"all" | "day" | "week" | "month" | "year">("all")
  const [messageUnreadCount, setMessageUnreadCount] = React.useState(0)
  const [commissionerDecisionModal, setCommissionerDecisionModal] = React.useState(false)
  const [commissionerDecisionData, setCommissionerDecisionData] = React.useState<any>(null)

  // Set mounted state on client
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Notification reporting / filtering state - MUST be before conditional returns
  const notifStats = React.useMemo(() => {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfDay)
    startOfWeek.setDate(startOfWeek.getDate() - 6) // last 7 days including today
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    let day = 0, week = 0, month = 0, year = 0

    for (const n of notifications) {
      if (!n.createdAt) continue
      const d = new Date(n.createdAt)
      if (isNaN(d.getTime())) continue

      if (d >= startOfDay) day += 1
      if (d >= startOfWeek) week += 1
      if (d >= startOfMonth) month += 1
      if (d >= startOfYear) year += 1
    }

    return { day, week, month, year }
  }, [notifications])

  const filteredNotifications = React.useMemo(() => {
    if (notifPeriod === "all") return notifications

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfDay)
    startOfWeek.setDate(startOfWeek.getDate() - 6)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    return notifications.filter((n) => {
      if (!n.createdAt) return false
      const d = new Date(n.createdAt)
      if (isNaN(d.getTime())) return false

      switch (notifPeriod) {
        case "day":
          return d >= startOfDay
        case "week":
          return d >= startOfWeek
        case "month":
          return d >= startOfMonth
        case "year":
          return d >= startOfYear
        default:
          return true
      }
    })
  }, [notifications, notifPeriod])

  const exportNotifications = React.useCallback(
    (format: "word" | "excel" | "pdf") => {
      if (!filteredNotifications.length || typeof window === "undefined") return

      const headers = ["Message", "Source", "Created at", "Read"]
      const rows = filteredNotifications.map((n) => [
        (n.message || n.title || "").replace(/\s+/g, " "),
        n.source ?? "",
        n.createdAt ? new Date(n.createdAt).toLocaleString() : "",
        n.isOpen ? "Read" : "Unread",
      ])

      const tableHtml = `<!DOCTYPE html><html><head><meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; width: 100%; font-size: 12px; }
          th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
          th { background: #f3f4f6; }
        </style>
      </head><body>
        <table>
          <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
          <tbody>
            ${rows
              .map(
                (r) =>
                  `<tr>${r
                    .map((cell) => `<td>${String(cell ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>`)
                    .join("")}</tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </body></html>`

      const now = new Date()
      const ts = now.toISOString().slice(0, 19).replace(/[:T]/g, "-")

      if (format === "pdf") {
        const win = window.open("", "_blank")
        if (!win) return
        win.document.open()
        win.document.write(tableHtml)
        win.document.close()
        win.focus()
        win.print()
        return
      }

      const mime =
        format === "word"
          ? "application/msword"
          : "application/vnd.ms-excel"
      const extension = format === "word" ? "doc" : "xls"
      const blob = new Blob([tableHtml], { type: `${mime};charset=utf-8;` })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `notifications-${notifPeriod}-${ts}.${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
    [filteredNotifications, notifPeriod],
  )

  // Load notifications on component mount and when notifOpen changes
  const loadNotifications = React.useCallback(async (): Promise<void> => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken") ||
          localStorage.getItem("jwt") ||
          localStorage.getItem("token")
        : null

    // Don't load notifications if no token (user not authenticated)
    if (!token) {
      setNotifications([])
      setUnreadCount(0)
      setNotifLoading(false)
      return
    }

    setNotifLoading(true)
    setNotifError(null)

    // Load persisted "mark all read" timestamp (if any)
    let markAllUntilTs = 0
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem('notifications_mark_all_until')
      if (raw) {
        const parsed = Number(raw)
        if (!Number.isNaN(parsed) && parsed > 0) {
          markAllUntilTs = parsed
        }
      }
    }

    try {
      // Fetch workflow notifications (includes commissioner decision notifications with type and relatedId)
      const workflowRes = await fetch('http://localhost:4000/api/workflow/user-notifications', {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      let merged: NotificationItem[] = []
      let unread = 0

      if (workflowRes.ok) {
        const workflowJson = await workflowRes.json()
        const workflowList: NotificationItem[] = Array.isArray(workflowJson.data)
          ? workflowJson.data
          : []
        const workflowListWithSource = workflowList.map((n) => ({
          ...n,
          source: 'general' as const,
          isOpen: n.isRead,
          message: n.message,
          type: n.type,
          relatedId: n.relatedId,
        }))
        merged = [...merged, ...workflowListWithSource]
      }

      // Sort newest first
      merged = merged.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return tb - ta
      })

      // If user has previously clicked "mark all read", treat all
      // notifications created at or before that timestamp as read
      if (markAllUntilTs > 0) {
        merged = merged.map((n) => {
          const createdTs = n.createdAt ? new Date(n.createdAt).getTime() : 0
          if (createdTs > 0 && createdTs <= markAllUntilTs) {
            return { ...n, isOpen: true }
          }
          return n
        })
      }

      unread = merged.filter((n) => !n.isOpen).length

      setUnreadCount(unread)
      setNotifications(merged)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load notifications'
      setNotifError(message)
    } finally {
      setNotifLoading(false)
    }
  }, [])

  // Load notifications when component mounts
  React.useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // Also load notifications when panel is opened (for refresh)
  React.useEffect(() => {
    if (notifOpen) {
      loadNotifications()
    }
  }, [notifOpen, loadNotifications])

  // Fetch message unread count
  React.useEffect(() => {
    const fetchMessageUnreadCount = async () => {
      try {
        const token = typeof window !== "undefined" ? (localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token")) : null
        if (!token) return
        
        const response = await fetch('http://localhost:4000/api/messages/unread-count', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setMessageUnreadCount(data.count || 0)
        }
      } catch (error) {
        console.error('Error fetching message unread count:', error)
      }
    }

    fetchMessageUnreadCount()
    // Poll every 30 seconds
    const interval = setInterval(fetchMessageUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  React.useEffect(() => {
    try {
      const token = typeof window !== "undefined" ? (localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token")) : null
      if (token) {
        const payload = decodeJwt(token)
        const name = (payload as any)?.name || (payload as any)?.preferred_username || (payload as any)?.given_name || (payload as any)?.email || "User"
        setUserName(String(name))
        // derive roles and admin flag
        const roles: string[] = []
        const p: any = payload || {}
        if (typeof p.role === 'string') roles.push(p.role)
        if (Array.isArray(p.role)) roles.push(...p.role)
        if (Array.isArray(p.roles)) roles.push(...p.roles)
        if (p.realm_access?.roles) roles.push(...p.realm_access.roles)
        if (p.resource_access) {
          for (const v of Object.values(p.resource_access)) {
            const rr = (v as any)?.roles
            if (Array.isArray(rr)) roles.push(...rr)
          }
        }
        const upperRoles = roles.map(String).map(r => r.toUpperCase())

        const isAdm = upperRoles.some(r => /(ADMIN|SYSTEM[_-]?ADMIN|SUPERUSER)/.test(r))
        setIsAdmin(isAdm)
        const deptHead = upperRoles.includes('DEPARTMENT_HEAD') || upperRoles.includes('DEPT_HEAD')
        const teamLead = upperRoles.includes('TEAM_LEAD') || upperRoles.includes('SUPERVISOR')
        const employee = upperRoles.includes('EMPLOYEE') || upperRoles.includes('STAFF')

        setIsDeptHead(deptHead)
        setIsTeamLead(teamLead)
        setIsEmployee(employee)

        // Derive a human-readable role label for header display.
        // Priority: System Admin > Asset Control & Registration Officer > Asset Manager > Asset Officer > Dept Head > Team Lead > Employee > User.
        const assetControlOfficer = upperRoles.includes('ASSET_CONTROL_REGISTRATION_OFFICER') || upperRoles.includes('ASSET CONTROL REGISTRATION OFFICER') || upperRoles.includes('ASSET-CONTROL-REGISTRATION-OFFICER')
        const assetManager = upperRoles.includes('ASSET_MANAGER') || upperRoles.includes('ASSET MANAGER') || upperRoles.includes('ASSET-MANAGER')
        const assetOfficer = upperRoles.includes('ASSET_OFFICER') || upperRoles.includes('ASSET OFFICER') || upperRoles.includes('ASSET-OFFICER')
        const endUser = upperRoles.includes('END_USER') || upperRoles.includes('END USER') || upperRoles.includes('END-USER')
        const feedbackComplaintManager = upperRoles.includes('FEEDBACK_COMPLAINT_MANAGER') || upperRoles.includes('FEEDBACK COMPLAINT MANAGER') || upperRoles.includes('FEEDBACK-COMPLAINT-MANAGER')
        const feedbackComplaintOfficer = upperRoles.includes('FEEDBACK_COMPLAINT_OFFICER') || upperRoles.includes('FEEDBACK COMPLAINT OFFICER') || upperRoles.includes('FEEDBACK-COMPLAINT-OFFICER')

        let label = 'User'
        if (isAdm) label = 'System Admin'
        else if (feedbackComplaintManager) label = 'Feedback & Complaint Manager'
        else if (feedbackComplaintOfficer) label = 'Feedback & Complaint Officer'
        else if (assetControlOfficer) label = 'Asset Control & Registration Officer'
        else if (assetManager) label = 'Asset Manager'
        else if (assetOfficer) label = 'Asset Officer'
        else if (deptHead) label = 'Department Head'
        else if (teamLead) label = 'Team Lead'
        else if (employee || endUser) label = 'End User'

        setRoleLabel(label)

        const userId = (payload as any)?.id || (payload as any)?.userId || (payload as any)?.sub
        if (userId) {
          const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
          const base = apiBase.replace(/\/$/, "")
          fetch(`${base}/api/users/${userId}`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (!data?.photoUrl) return
              const raw = String(data.photoUrl)
              const fullUrl = raw.startsWith("http://") || raw.startsWith("https://")
                ? raw
                : `${base}${raw.startsWith("/") ? "" : "/"}${raw}`
              setUserPhotoUrl(fullUrl)
            })
            .catch(() => {})
        }
      }
    } catch {
      // ignore
    }
  }, [])

  // Conditional checks AFTER all hooks
  const isLogin = pathname === "/login" || pathname?.startsWith("/login/")
  const isForgot = pathname === "/forgot-password" || pathname?.startsWith("/forgot-password/")
  const isAbout = pathname === "/about" || pathname?.startsWith("/about/")
  const isGuestPage =
    pathname?.startsWith("/guest-feedback") ||
    pathname?.startsWith("/guest-anticorruption") ||
    pathname?.startsWith("/track-complaint") ||
    pathname?.startsWith("/track-feedback") ||
    pathname?.startsWith("/guest-complaint")
  
  if (isLogin || isForgot || isAbout || isGuestPage) {
    return null
  }

  // Dismiss a notification (route to appropriate delete/read logic)
  const dismissNotification = async (n: NotificationItem | null | undefined) => {
    if (!n) return
    try {
      console.debug('[Header] Dismiss click for', n)
    } catch {}
    // For asset notifications, mark as read via asset API
    if (n.source === 'asset') {
      await markAssetNotificationAsRead(n.id)
      return
    }
    // For user and HR notifications, call unified workflow delete
    if (n.source === 'user' || n.source === 'hr') {
      await deleteNotification(n.id)
      return
    }
    // For field notifications, now call backend delete so it disappears
    if (n.source === 'field') {
      await deleteNotification(n.id)
      return
    }
    // For overtime notifications, no backend delete yet -> mark locally
    if (n.source === 'overtime' || n.source === 'hrOT' || n.source === 'userOT') {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isOpen: true } : x)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
      return
    }
    // Tickets: use existing tickets endpoint delete
    await deleteNotification(n.id)
  }

  // Mark asset notification as read
  const markAssetNotificationAsRead = async (notificationId: string) => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken") ||
          localStorage.getItem("jwt") ||
          localStorage.getItem("token")
        : null

    try {
      const res = await fetch(`/api/notifications/asset/${notificationId}/read`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((x) => (x.id === notificationId ? { ...x, isOpen: true } : x)),
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark asset notification as read:', error)
    }
  }

  // Delete a single notification. Supports ids with prefixes: user_, hr_, field_, or plain tickets ids.
  const deleteNotification = async (notificationId: string) => {
    console.log("ur messageis deleted")
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken") ||
          localStorage.getItem("jwt") ||
          localStorage.getItem("token")
        : null

    try {
      let res: Response | null = null
      if (notificationId.startsWith('user_') || notificationId.startsWith('hr_')) {
        // Unified workflow delete for user/hr notifications
        const rawId = notificationId.replace(/^(user_|hr_)/, '')
        res = await fetch(`http://localhost:4000/api/workflow/notifications/${rawId}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
      } else if (notificationId.startsWith('field_')) {
        // Not deletable via backend per current workflow; mark locally as read
        setNotifications((prev) =>
          prev.map((x) => (x.id === notificationId ? { ...x, isOpen: true } : x)),
        )
        setUnreadCount((u: number) => Math.max(0, u - 1))
        
        return
      } else {
        // Default to general notifications delete
        res = await fetch(`http://localhost:4000/api/notifications/${notificationId}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
      }

      if (res && (res.ok || res.status === 404)) {
        setNotifications((prev: NotificationItem[]) => {
          const removed = prev.find((n) => n.id === notificationId)
          const next = prev.filter((n) => n.id !== notificationId)
          // adjust unread counter if the removed one was unread by our UI flag
          if (removed && !removed.isOpen) {
            setUnreadCount((u: number) => Math.max(0, u - 1))
          }
          return next
        })
        // Refresh from server to avoid stale state
        try { await loadNotifications() } catch {}
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  if (!mounted) return null

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken") ||
          localStorage.getItem("jwt") ||
          localStorage.getItem("token")
        : null

    try {
      const res = await fetch(`http://localhost:4000/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (res.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isOpen: true } : n)),
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleNotificationClick = async (n: NotificationItem) => {
    const msg: string = String(n?.message || '').toUpperCase()

    console.log('Notification clicked:', n)
    console.log('Notification type:', n?.type)
    console.log('Notification relatedId:', n?.relatedId)

    // Handle commissioner decision notifications - navigate to notifications page
    if (n?.type === 'COMMISSIONER_DECISION') {
      console.log('Handling commissioner decision notification')
      setNotifOpen(false)
      router.push('/notifications')
      return
    }

    // Handle complaint response accepted notifications - navigate to complaint details
    if (n?.type === 'COMPLAINT_RESPONSE_ACCEPTED' && n?.relatedId) {
      console.log('Handling complaint response accepted notification')
      setNotifOpen(false)
      router.push(`/feedback/complaints/${n.relatedId}`)
      return
    }

    // Asset notifications: navigate based on notification type
    if (n?.source === 'asset') {
      // Mark as read
      if (n?.id) {
        try { markAssetNotificationAsRead(n.id) } catch {}
      }

      // Route based on notification type
      if (n?.type === 'ASSET_REQUEST' || n?.event?.includes('ASSET_REQUEST')) {
        // Asset Request - go to asset issues page
        if (n?.assetRequestId) {
          setNotifOpen(false)
          router.push(`/assets/issue-requests?id=${n.assetRequestId}`)
          return
        }
        if (n?.referenceUrl) {
          setNotifOpen(false)
          router.push(n.referenceUrl)
          return
        }
        setNotifOpen(false)
        router.push('/assets/issue-requests')
        return
      }

      if (n?.type === 'ASSET_RETURN' || n?.event?.includes('ASSET_RETURN')) {
        // Asset Return - go to asset returns page
        if (n?.assetReturnId) {
          setNotifOpen(false)
          router.push(`/assets/returns?id=${n.assetReturnId}`)
          return
        }
        if (n?.referenceUrl) {
          setNotifOpen(false)
          router.push(n.referenceUrl)
          return
        }
        setNotifOpen(false)
        router.push('/assets/returns')
        return
      }

      if (n?.type === 'ASSET_TRANSFER' || n?.event?.includes('ASSET_TRANSFER')) {
        // Asset Transfer - go to transfer page
        if (n?.assetTransferId) {
          setNotifOpen(false)
          router.push(`/assets/transfer?id=${n.assetTransferId}`)
          return
        }
        if (n?.referenceUrl) {
          setNotifOpen(false)
          router.push(n.referenceUrl)
          return
        }
        setNotifOpen(false)
        router.push('/assets/transfer')
        return
      }

      // Fallback for other asset notifications
      if (n?.referenceUrl) {
        setNotifOpen(false)
        router.push(n.referenceUrl)
        return
      }
      setNotifOpen(false)
      router.push('/notifications')
      return
    }

    // Global notifications from AllNotification table
    if (msg.includes('ANNOUNCEMENT_CREATED') || msg.includes('ANNOUNCEMENT HAS POSTED')) {
      setNotifOpen(false)
      router.push('/advertisement')
      return
    }

    if (msg.includes('COMPLAINT')) {
      setNotifOpen(false)
      router.push('/ethics/anticorruption')
      return
    }

    if (msg.includes('SUGGESTION')) {
      setNotifOpen(false)
      router.push('/voicebox/suggestions')
      return
    }

    // Ticket notifications: go to Tickets page (Other Tickets tab)
    if (n?.source === 'tickets' || (msg.includes('TICKET') && msg.includes('ASSIGNED YOU'))) {
      if (n?.id) {
        // Best-effort mark as read; ignore errors
        try { markAsRead(n.id) } catch {}
      }

      const isAssignedTicket = msg.includes('ASSIGNED YOU')
      const targetUrl = isAssignedTicket ? '/tickets?tab=other&view=assigned' : '/tickets?tab=other'

      setNotifOpen(false)
      router.push(targetUrl)
      return
    }

    // Field / Overtime notifications: navigate to Asset Officer approvals page
    // Many notification shapes exist; handle common ids (fieldRequestId, overtimeId)
    const fieldId =
      n?.fieldRequestId || n?.field_request_id || n?.requestId || n?.request_id
    const overtimeId =
      n?.overtimeId || n?.overtime_id || n?.otId || n?.ot_id
    if (n?.source === 'field' || n?.source === 'overtime' || fieldId || overtimeId) {
      // mark locally as opened/read
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isOpen: true } : x)),
      )
      setUnreadCount((u) => Math.max(0, u - (n?.isOpen ? 0 : 1)))
      setNotifOpen(false)

      const params = new URLSearchParams()
      params.set('from', 'notification')
      if (fieldId) params.set('fieldId', String(fieldId))
      if (overtimeId) params.set('overtimeId', String(overtimeId))
      // Previously redirected Asset Officer to a dedicated field-overtime dashboard.
      // That area no longer exists, so we just stop special routing here.
      return
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken") ||
          localStorage.getItem("jwt") ||
          localStorage.getItem("token")
        : null

    try {
      // Mark all notifications as read using general endpoint
      const res = await fetch(`http://localhost:4000/api/notifications/read-all`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!res.ok) {
        // If backend fails, still proceed to mark locally to keep UI consistent
        console.warn('Failed to mark notifications as read on server; marking locally')
      }

      // Update local state for all notifications
      setNotifications((prev) => {
        if (typeof window !== 'undefined' && prev.length > 0) {
          // Find the most recent createdAt among current notifications
          const latestTs = prev.reduce((max, n) => {
            const ts = n.createdAt ? new Date(n.createdAt).getTime() : 0
            return ts > max ? ts : max
          }, 0)
          if (latestTs > 0) {
            try {
              window.localStorage.setItem('notifications_mark_all_until', String(latestTs))
            } catch {}
          }
        }
        return prev.map((n) => ({ ...n, isOpen: true }))
      })
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  return (
    <header style={{ width: "100vw", background: "#0E3561", borderBottom: "1px solid rgba(255,255,255,0.08)", margin: 0, padding: 0, height: 78 }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: 'space-between',
        padding: "12px 16px",
        gap: 16,
        flexWrap: 'wrap',
        rowGap: 0,
        height: 78,
      }}>
        {/* Left: Logo + FCSC + System Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 280 }}>
          {/* Circular Gold Emblem with Logo */}
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(255, 215, 0, 0.4)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            overflow: 'hidden'
          }}>
            <img
              src="/gallery/ecsc.jpg"
              alt="FCSC Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>

          {/* System Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ 
              color: 'white', 
              fontWeight: 800, 
              fontSize: '1.1rem',
              letterSpacing: '0.5px'
            }}>
              FCSC
            </span>
            <span style={{ 
              color: 'rgba(255, 255, 255, 0.7)', 
              fontSize: '0.75rem',
              fontWeight: 500,
              maxWidth: 280,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              Feedback and Complaint Management System
            </span>
          </div>
        </div>

        {/* Right: Messages + Notifications + User Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {/* Messages Icon */}
          <Link href="/messages">
            <button
              title="Messages"
              className="relative p-2 bg-linear-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-2xl transition-all duration-300 transform hover:scale-110 hover:shadow-2xl shadow-lg border-2 border-white/20 backdrop-blur-sm"
            >
              <Inbox className="w-6 h-6 text-white" />
              {messageUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold border-2 border-white">
                  {messageUnreadCount > 99 ? '99+' : messageUnreadCount}
                </span>
              )}
            </button>
          </Link>
          <div className="relative">
            <button
              title="Notifications"
              aria-haspopup="menu"
              aria-expanded={notifOpen}
              onClick={() => setNotifOpen(v => !v)}
              className="relative p-2 bg-linear-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-2xl transition-all duration-300 transform hover:scale-110 hover:shadow-2xl shadow-lg border-2 border-white/20 backdrop-blur-sm"
            >
              {/* Animated Bell Icon */}
              <div className="relative">
                <svg 
                  className={`w-6 h-6 text-white transform transition-all duration-500 ${notifOpen ? 'rotate-12 scale-110' : 'hover:rotate-6'}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 17h5l-5 5v-5zM10.24 8.56a5.97 5.97 0 01-4.66-7.4 1 1 0 00-1.2-1.2 7.97 7.97 0 006.86 10.6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                
                {/* Floating Notification Badge */}
                {unreadCount > 0 && (
                  <div className="absolute -top-2 -right-2">
                    <div className="relative">
                      {/* Outer Pulse Effect */}
                      <div className="absolute inset-0 animate-ping bg-red-500 rounded-full opacity-75"></div>
                      {/* Main Badge */}
                      <div className="relative bg-linear-to-r from-red-500 to-pink-600 text-white rounded-full min-w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white transform hover:scale-110 transition-transform duration-200">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </button>

            {/* Notification Dropdown */}
            {notifOpen && (
              <div className="absolute right-0 top-full mt-3 w-96 max-h-150 overflow-hidden z-50">
                {/* Floating Card with Glass Effect */}
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden animate-slide-down">
                  {/* Header */}
                  <div className="bg-linear-to-r from-blue-600 to-purple-700 p-6 text-white relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-2 right-2 w-20 h-20 bg-white rounded-full"></div>
                      <div className="absolute bottom-2 left-2 w-16 h-16 bg-white rounded-full"></div>
                    </div>
                    
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.24 8.56a5.97 5.97 0 01-4.66-7.4 1 1 0 00-1.2-1.2 7.97 7.97 0 006.86 10.6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Notifications</h3>
                          {unreadCount > 0 && (
                            <p className="text-blue-100 text-sm font-medium">
                              {unreadCount} new message{unreadCount > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 border border-white/30"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Report filters */}
                  {notifications.length > 0 && (
                    <div className="px-4 pt-3 pb-2 bg-white/90 border-b border-gray-100 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex-1">
                          <label className="block mb-1 text-[11px] text-gray-600">Report period</label>
                          <select
                            value={notifPeriod}
                            onChange={(e) => setNotifPeriod(e.target.value as any)}
                            className="w-full border border-gray-300 rounded-full px-3 py-1.5 text-xs bg-white"
                          >
                            <option value="all">All</option>
                            <option value="day">Today</option>
                            <option value="week">Last 7 days</option>
                            <option value="month">This month</option>
                            <option value="year">This year</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-gray-600 mr-1 hidden sm:inline">Export:</span>
                          <button
                            type="button"
                            onClick={() => exportNotifications("word")}
                            className="px-2 py-1 rounded-full bg-blue-600 text-white text-[11px] font-semibold shadow-sm hover:bg-blue-700 disabled:bg-gray-300"
                            disabled={!filteredNotifications.length}
                          >
                            Word
                          </button>
                          <button
                            type="button"
                            onClick={() => exportNotifications("excel")}
                            className="px-2 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-semibold shadow-sm hover:bg-emerald-700 disabled:bg-gray-300"
                            disabled={!filteredNotifications.length}
                          >
                            Excel
                          </button>
                          <button
                            type="button"
                            onClick={() => exportNotifications("pdf")}
                            className="px-2 py-1 rounded-full bg-red-600 text-white text-[11px] font-semibold shadow-sm hover:bg-red-700 disabled:bg-gray-300"
                            disabled={!filteredNotifications.length}
                          >
                            PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notification List */}
                  <div className="max-h-100 overflow-y-auto custom-scrollbar">
                    {notifLoading ? (
                      <div className="p-8 text-center">
                        <div className="inline-flex items-center gap-3 text-gray-500">
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading notifications...</span>
                        </div>
                      </div>
                    ) : notifError ? (
                      <div className="p-6 text-center text-red-500 bg-red-50 m-4 rounded-2xl">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {notifError}
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-r from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.24 8.56a5.97 5.97 0 01-4.66-7.4 1 1 0 00-1.2-1.2 7.97 7.97 0 006.86 10.6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="font-semibold">No notifications</p>
                        <p className="text-sm mt-1">We'll notify you when something arrives</p>
                      </div>
                    ) : (
                      <div className="p-2">
                        {filteredNotifications.map((n: NotificationItem, idx: number) => (
                          <div
                            key={n.id || n.createdAt || idx}
                            onClick={() => handleNotificationClick(n)}
                            className={`group relative p-4 m-2 rounded-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                              !n.isOpen 
                                ? 'bg-linear-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400 shadow-lg' 
                                : 'bg-gray-50 hover:bg-white border-l-4 border-transparent'
                            }`}
                          >
                            {/* Unread Indicator */}
                            {!n.isOpen && (
                              <div className="absolute top-4 left-3">
                                <div className="relative">
                                  <div className="w-3 h-3 bg-linear-to-r from-amber-400 to-orange-500 rounded-full animate-pulse"></div>
                                  <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-60"></div>
                                </div>
                              </div>
                            )}

                            <div className="flex items-start gap-4 pl-2">
                              {/* Avatar/Icon */}
                              <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                                !n.isOpen 
                                  ? 'bg-linear-to-br from-amber-400 to-orange-500 text-white' 
                                  : 'bg-linear-to-br from-blue-500 to-purple-600 text-white'
                              }`}>
                                {n.source === 'field' ? (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <p className={`font-semibold text-sm leading-relaxed ${
                                  !n.isOpen ? 'text-gray-900' : 'text-gray-700'
                                }`}>
                                  {n.message || n.title || 'New notification'}
                                </p>
                                <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Just now'}
                                </p>
                              </div>

                              {/* Action Button (show for all unread, including field). Stop click from navigating. */}
                              {!n.isOpen && (
                                <button
                                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                    e.stopPropagation()
                                    dismissNotification(n)
                                  }}
                                  title="Mark as read"
                                  className="opacity-0 group-hover:opacity-100 shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-xl transition-all duration-200 transform hover:scale-110"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="p-4 bg-linear-to-r from-gray-50 to-gray-100 border-t border-gray-200">
                      <div className="text-center text-sm text-gray-500">
                        {notifications.length} notification{notifications.length > 1 ? 's' : ''} total
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Commissioner Decision Modal */}
          {commissionerDecisionModal && commissionerDecisionData && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Notification to Concerned Department</h2>
                    <button
                      onClick={() => setCommissionerDecisionModal(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
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
          <button
            onClick={() => setMenuOpen((v: boolean) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title={`Welcome ${userName}`}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ffffff', padding: 0 }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              {/* Circular Avatar with Initials */}
              <span style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(255,255,255,0.3)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}>
                <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>
                  {userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                </span>
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
                <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 13 }}>{roleLabel}</span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{userName}</span>
              </span>
            </span>
          </button>
          {menuOpen ? (
            <div
              role="menu"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 8,
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                minWidth: 220,
                padding: 8,
                zIndex: 40,
              }}
            >
              <button
                onClick={() => { setMenuOpen(false); router.push('/profile') }}
                style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '10px 12px', cursor: 'pointer', color: '#0e3a56', fontWeight: 600, borderRadius: 8, fontSize: 14 }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => ((e.target as HTMLButtonElement).style.background = '#f3f4f6')}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => ((e.target as HTMLButtonElement).style.background = 'transparent')}
              >
                Profile
              </button>
              <button
                onClick={() => { setMenuOpen(false); router.push('/admin/settings/security') }}
                style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '10px 12px', cursor: 'pointer', color: '#0e3a56', fontWeight: 600, borderRadius: 8, fontSize: 14 }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => ((e.target as HTMLButtonElement).style.background = '#f3f4f6')}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => ((e.target as HTMLButtonElement).style.background = 'transparent')}
              >
                Account Settings
              </button>
              <button
                onClick={() => { setMenuOpen(false); setLangOpen(v => !v) }}
                style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '10px 12px', cursor: 'pointer', color: '#0e3a56', fontWeight: 600, borderRadius: 8, fontSize: 14 }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => ((e.target as HTMLButtonElement).style.background = '#f3f4f6')}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => ((e.target as HTMLButtonElement).style.background = 'transparent')}
              >
                Language: {currentLanguage === 'en' ? 'English' : 'አማርኛ'}
              </button>
              <div style={{ height: 1, background: '#e5e7eb', margin: '4px 0' }} />
              <button
                onClick={() => { setMenuOpen(false); signOut('/login') }}
                style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '10px 12px', cursor: 'pointer', color: '#b91c1c', fontWeight: 700, borderRadius: 8, fontSize: 14 }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => ((e.target as HTMLButtonElement).style.background = '#fef2f2')}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => ((e.target as HTMLButtonElement).style.background = 'transparent')}
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <ToastHost />
    </header>
  )
}