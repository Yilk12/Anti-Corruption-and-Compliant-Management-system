"use client"

import React from "react"

export default function SettingsPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="settings-panel">
      {children}
    </div>
  )
}
