"use client"
import { useEffect, useState } from "react"
import { apiGet, apiPatch, apiPost } from "@/app/lib/api"

type Setting = { settingKey: string; settingValue: string }

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValidUrl = (s: string) => {
    if (!s) return true
    try {
      const u = new URL(s)
      return u.protocol === "http:" || u.protocol === "https:"
    } catch {
      return false
    }
  }

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

  const seedDefaults = async () => {
    setSaving(true)
    setError(null)
    try {
      await apiPost("/settings/seed-defaults")
      const list = await apiGet<Setting[]>("/settings")
      const map: Record<string, string> = {}
      list.forEach((s) => (map[s.settingKey] = s.settingValue))
      setSettings(map)
    } catch (e: any) {
      setError(e?.message || "Failed to seed defaults")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2>General Settings</h2>
      {loading ? <p>Loading...</p> : null}
      {error ? <p style={{ color: "red" }}>{error}</p> : null}

      <div style={{ display: "grid", gap: 12, maxWidth: 640 }}>
        <label>
          <div>System Name / Title</div>
          <input
            value={settings.system_name || ""}
            onChange={(e) => handleChange("system_name", e.target.value)}
            placeholder="Help-Desk System"
          />
        </label>

        <label>
          <div>Logo URL</div>
          <input
            value={settings.logo_url || ""}
            onChange={(e) => handleChange("logo_url", e.target.value)}
            placeholder="https://..."
          />
          <div style={{ fontSize: 12, color: "#666" }}>Public image URL for the system logo. PNG/SVG recommended.</div>
          {!isValidUrl(settings.logo_url || "") && (
            <div style={{ color: "red", fontSize: 12 }}>Enter a valid http(s) URL.</div>
          )}
        </label>

        <label>
          <div>Default Language</div>
          <select
            value={settings.default_language || "EN"}
            onChange={(e) => handleChange("default_language", e.target.value)}
          >
            <option value="EN">English</option>
            <option value="AM">Amharic</option>
            <option value="OR">Oromiffa</option>
            <option value="TI">Tigrinya</option>
            <option value="SO">Somali</option>
            <option value="SI">Sidama</option>
            <option value="WO">Wolaytta</option>
          </select>
        </label>

        <label>
          <div>Timezone</div>
          <input
            value={settings.timezone || "Africa/Addis_Ababa"}
            onChange={(e) => handleChange("timezone", e.target.value)}
          />
        </label>

        <label>
          <div>Date format</div>
          <input
            value={settings.date_format || "YYYY-MM-DD"}
            onChange={(e) => handleChange("date_format", e.target.value)}
          />
        </label>

        <label>
          <div>Time format</div>
          <input
            value={settings.time_format || "HH:mm"}
            onChange={(e) => handleChange("time_format", e.target.value)}
          />
        </label>

        <label>
          <div>Support email</div>
          <input
            type="email"
            value={settings.support_email || ""}
            onChange={(e) => handleChange("support_email", e.target.value)}
          />
        </label>

        <label>
          <div>Support phone</div>
          <input
            value={settings.support_phone || ""}
            onChange={(e) => handleChange("support_phone", e.target.value)}
          />
        </label>
      </div>

      {/* Modules & Integrations (moved here for consolidated controls) */}
      <div style={{ display: "grid", gap: 12, maxWidth: 640 }}>
        <fieldset>
          <legend>Features</legend>
          <label>
            <div>Help Desk</div>
            <select
              value={settings.features_helpdesk_enabled || "true"}
              onChange={(e) => handleChange("features_helpdesk_enabled", e.target.value)}
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </label>
          <label>
            <div>Knowledge Base</div>
            <select
              value={settings.features_knowledge_base_enabled || "true"}
              onChange={(e) => handleChange("features_knowledge_base_enabled", e.target.value)}
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </label>
        </fieldset>

        <fieldset>
          <legend>Integrations</legend>
          <label>
            <div>Slack Webhook</div>
            <input
              value={settings.integrations_slack_webhook || ""}
              onChange={(e) => handleChange("integrations_slack_webhook", e.target.value)}
            />
            <div style={{ fontSize: 12, color: "#666" }}>Paste your Slack Incoming Webhook URL.</div>
            {!isValidUrl(settings.integrations_slack_webhook || "") && (
              <div style={{ color: "red", fontSize: 12 }}>Enter a valid http(s) URL.</div>
            )}
          </label>
          <label>
            <div>Teams Webhook</div>
            <input
              value={settings.integrations_teams_webhook || ""}
              onChange={(e) => handleChange("integrations_teams_webhook", e.target.value)}
            />
            <div style={{ fontSize: 12, color: "#666" }}>Paste your Microsoft Teams Incoming Webhook URL.</div>
            {!isValidUrl(settings.integrations_teams_webhook || "") && (
              <div style={{ color: "red", fontSize: 12 }}>Enter a valid http(s) URL.</div>
            )}
          </label>
          <label>
            <div>Jira Base URL</div>
            <input
              value={settings.integrations_jira_base_url || ""}
              onChange={(e) => handleChange("integrations_jira_base_url", e.target.value)}
            />
            <div style={{ fontSize: 12, color: "#666" }}>Example: https://your-domain.atlassian.net</div>
            {!isValidUrl(settings.integrations_jira_base_url || "") && (
              <div style={{ color: "red", fontSize: 12 }}>Enter a valid http(s) URL.</div>
            )}
          </label>
        </fieldset>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
        <button onClick={seedDefaults} disabled={saving}>
          Seed defaults
        </button>
      </div>
    </div>
  )
}


