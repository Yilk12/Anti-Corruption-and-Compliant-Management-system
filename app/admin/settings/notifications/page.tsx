"use client"
import { useEffect, useState } from "react"
import { apiGet, apiPost } from "@/app/lib/api"

type Setting = { settingKey: string; settingValue: string }

export default function NotificationsSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const list = await apiGet<Setting[]>("/settings")
        const map: Record<string, string> = {}
        list.forEach((s) => (map[s.settingKey] = s.settingValue))
        setSettings(map)
      } catch (e: any) {
        setError(e?.message || "Failed to load settings")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await apiPost("/settings/bulk", settings)
      alert("Saved")
    } catch (e: any) {
      setError(e?.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2>Notifications</h2>
      {loading ? <p>Loading...</p> : null}
      {error ? <p style={{ color: "red" }}>{error}</p> : null}

      <div style={{ display: "grid", gap: 12, maxWidth: 640 }}>
        <fieldset>
          <legend>Email Notifications</legend>
          <label>
            <div>Enabled</div>
            <select
              value={settings.email_notifications_enabled || "true"}
              onChange={(e) => handleChange("email_notifications_enabled", e.target.value)}
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </label>
          <label>
            <div>SMTP Host</div>
            <input value={settings.smtp_host || ""} onChange={(e) => handleChange("smtp_host", e.target.value)} />
          </label>
          <label>
            <div>SMTP Port</div>
            <input type="number" value={settings.smtp_port || "587"} onChange={(e) => handleChange("smtp_port", e.target.value)} />
          </label>
          <label>
            <div>SMTP User</div>
            <input value={settings.smtp_user || ""} onChange={(e) => handleChange("smtp_user", e.target.value)} />
          </label>
          <label>
            <div>SMTP Pass</div>
            <input type="password" value={settings.smtp_pass || ""} onChange={(e) => handleChange("smtp_pass", e.target.value)} />
          </label>
        </fieldset>

        <fieldset>
          <legend>SMS Notifications</legend>
          <label>
            <div>Enabled</div>
            <select
              value={settings.sms_notifications_enabled || "false"}
              onChange={(e) => handleChange("sms_notifications_enabled", e.target.value)}
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </label>
          <label>
            <div>Provider</div>
            <input value={settings.sms_provider || ""} onChange={(e) => handleChange("sms_provider", e.target.value)} />
          </label>
          <label>
            <div>API Key</div>
            <input value={settings.sms_api_key || ""} onChange={(e) => handleChange("sms_api_key", e.target.value)} />
          </label>
        </fieldset>

        <fieldset>
          <legend>Push Notifications</legend>
          <label>
            <div>Enabled</div>
            <select
              value={settings.push_notifications_enabled || "false"}
              onChange={(e) => handleChange("push_notifications_enabled", e.target.value)}
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </label>
        </fieldset>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  )
}


