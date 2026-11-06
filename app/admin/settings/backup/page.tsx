"use client"
import React from "react"
import { useEffect, useState, useMemo, useCallback } from "react"
import { settingsApi, performanceMonitor } from "@/app/lib/api"

// Cache for settings to avoid repeated API calls
const settingsCache = new Map<string, { data: Record<string, string>; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

type Setting = { settingKey: string; settingValue: string }

// Memoized setting field component
const SettingField = React.memo(({ 
  label, 
  value, 
  onChange, 
  type = "text" 
}: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void; 
  type?: "text" | "number" | "select";
  options?: string[];
}) => {
  if (type === "select") {
    return (
      <label>
        <div>{label}</div>
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="manual">Manual</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </label>
    )
  }

  return (
    <label>
      <div>{label}</div>
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
      />
    </label>
  )
})

SettingField.displayName = "SettingField"

export default function BackupDataSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialLoad, setInitialLoad] = useState(true)

  // Optimized data loading with caching
  useEffect(() => {
    const loadSettings = async () => {
      const cacheKey = "backup-settings"
      const cached = settingsCache.get(cacheKey)
      
      // Return cached data if still valid
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setSettings(cached.data)
        setLoading(false)
        setInitialLoad(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Request timeout")), 3000)
        )
        
        const dataPromise = settingsApi.get() as Promise<Setting[]>
        const list = await Promise.race([dataPromise, timeoutPromise]) as Setting[]
        
        // Optimized data transformation
        const map = list.reduce((acc, s) => {
          acc[s.settingKey] = s.settingValue
          return acc
        }, {} as Record<string, string>)
        
        // Cache the result
        settingsCache.set(cacheKey, { data: map, timestamp: Date.now() })
        
        setSettings(map)
      } catch (e: any) {
        console.error("Settings load error:", e)
        setError(e?.message || "Failed to load settings")
        
        // Set default values on error to ensure UI renders
        setSettings({
          backup_schedule: "manual",
          export_formats: "CSV,JSON,Excel",
          data_retention_days: "365"
        })
      } finally {
        setLoading(false)
        setInitialLoad(false)
      }
    }
    
    loadSettings()
  }, [])

  // Memoized change handler to prevent unnecessary re-renders
  const handleChange = useCallback((key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    
    // Invalidate cache when settings change
    settingsCache.delete("backup-settings")
  }, [])

  // Optimized save with better error handling and user feedback
  const save = async () => {
    setSaving(true)
    setError(null)
    
    try {
      // Add timeout for save operation
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Save timeout")), 5000)
      )
      
      const savePromise = settingsApi.update(settings)
      await Promise.race([savePromise, timeoutPromise])
      
      // Update cache with new settings
      settingsCache.set("backup-settings", { data: settings, timestamp: Date.now() })
      
      // Use a better notification than alert
      const notification = document.createElement("div")
      notification.textContent = "Settings saved successfully!"
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        z-index: 1000;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      `
      document.body.appendChild(notification)
      
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 3000)
      
    } catch (e: any) {
      console.error("Save error:", e)
      setError(e?.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  // Memoized form fields to prevent unnecessary re-renders
  const formFields = useMemo(() => [
    {
      key: "backup_schedule",
      label: "Backup Schedule",
      type: "select" as const,
      defaultValue: "manual"
    },
    {
      key: "export_formats",
      label: "Export Formats",
      type: "text" as const,
      defaultValue: "CSV,JSON,Excel"
    },
    {
      key: "data_retention_days",
      label: "Data Retention (days)",
      type: "number" as const,
      defaultValue: "365"
    }
  ], [])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2>Backup & Data</h2>
      
      {/* Skeleton loader for initial load */}
      {initialLoad && loading && (
        <div style={{ display: "grid", gap: 12, maxWidth: 640 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: 8,
              padding: "12px",
              backgroundColor: "#f3f4f6",
              borderRadius: "6px",
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
            }}>
              <div style={{ 
                height: "16px", 
                backgroundColor: "#e5e7eb", 
                borderRadius: "4px",
                width: "120px"
              }} />
              <div style={{ 
                height: "32px", 
                backgroundColor: "#e5e7eb", 
                borderRadius: "4px"
              }} />
            </div>
          ))}
        </div>
      )}
      
      {/* Error display */}
      {error && (
        <div style={{ 
          color: "#dc2626", 
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "6px",
          padding: "12px"
        }}>
          {error}
        </div>
      )}

      {/* Main form - only render after initial data is available */}
      {!initialLoad && (
        <>
          <div style={{ display: "grid", gap: 12, maxWidth: 640 }}>
            {formFields.map((field) => (
              <SettingField
                key={field.key}
                label={field.label}
                value={settings[field.key] || field.defaultValue}
                onChange={(value) => handleChange(field.key, value)}
                type={field.type}
              />
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button 
              onClick={save} 
              disabled={saving}
              style={{
                padding: "8px 16px",
                backgroundColor: saving ? "#9ca3af" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: saving ? "not-allowed" : "pointer",
                fontSize: "14px"
              }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </>
      )}
      
      {/* Add CSS for skeleton animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .5;
          }
        }
      `}</style>
    </div>
  )
}


