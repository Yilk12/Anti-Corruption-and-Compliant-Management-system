"use client"

import React from "react"
import { useRouter, usePathname } from "next/navigation"
import { getCurrentUserId } from "@/app/lib/auth"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = React.useState(true)

  React.useEffect(() => {
    // Delay check to next tick to avoid hydration warnings
    const id = getCurrentUserId()
    if (!id) {
      // Preserve intended destination if needed
      const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : ""
      router.replace(`/login${next}`)
    } else {
      setChecking(false)
    }
  }, [router, pathname])

  if (checking) {
    return (
      <div style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#1565c0", fontWeight: 600 }}>Loading…</div>
      </div>
    )
  }

  return <>{children}</>
}
