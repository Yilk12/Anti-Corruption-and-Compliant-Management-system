"use client"
import { useEffect, useState } from "react"
import { apiGet, apiPost } from "@/app/lib/api"

type Setting = { settingKey: string; settingValue: string }

export default function ModulesSettingsPage() {
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
      <h2>Modules & Integrations</h2>
      {loading ? <p>Loading...</p> : null}
      {error ? <p style={{ color: "red" }}>{error}</p> : null}

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
          </label>
          <label>
            <div>Teams Webhook</div>
            <input
              value={settings.integrations_teams_webhook || ""}
              onChange={(e) => handleChange("integrations_teams_webhook", e.target.value)}
            />
          </label>
          <label>
            <div>Jira Base URL</div>
            <input
              value={settings.integrations_jira_base_url || ""}
              onChange={(e) => handleChange("integrations_jira_base_url", e.target.value)}
            />
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


