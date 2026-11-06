"use client"

import React, { createContext, useCallback, useContext, useMemo, useState } from "react"

export type Toast = {
  id: string
  title?: string
  description?: string
  variant?: "default" | "success" | "destructive" | "warning"
  duration?: number // ms
}

type ToastContextType = {
  toasts: Toast[]
  show: (t: Omit<Toast, "id">) => string
  dismiss: (id: string) => void
  clear: () => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((t: Omit<Toast, "id">) => {
    const id = crypto.randomUUID()
    const toast: Toast = { id, duration: 3500, variant: "default", ...t }
    setToasts((prev) => [...prev, toast])
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => dismiss(id), toast.duration)
    }
    return id
  }, [dismiss])

  const clear = useCallback(() => setToasts([]), [])

  const value = useMemo(() => ({ toasts, show, dismiss, clear }), [toasts, show, dismiss, clear])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}
