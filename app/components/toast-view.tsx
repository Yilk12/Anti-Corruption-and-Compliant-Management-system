"use client"

import React from "react"
import { useToast } from "./toast-provider"

export default function ToastView() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={
            "min-w-65 max-w-90 rounded-md shadow-lg px-4 py-3 text-sm text-white " +
            (t.variant === "destructive"
              ? "bg-red-600"
              : t.variant === "success"
              ? "bg-green-600"
              : t.variant === "warning"
              ? "bg-yellow-600"
              : "bg-gray-800")
          }
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              {t.title && <div className="font-semibold mb-0.5">{t.title}</div>}
              {t.description && <div className="opacity-90">{t.description}</div>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-white/80 hover:text-white ml-2"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
