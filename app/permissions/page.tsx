"use client"

import { useEffect, useMemo, useState } from "react"
import { PERMISSION_MODULES } from "@/app/lib/permissions"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Checkbox } from "@/app/components/ui/checkbox"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { useLocalization } from "@/app/hooks/use-localization"

// A simple local storage key composer so we can persist per-user selections
const storageKey = (userId: string) => `permissions:${userId || "__anonymous__"}`

export default function PermissionsPage() {
  const { language } = useLocalization()
  const [userId, setUserId] = useState("")
  const [selected, setSelected] = useState<Record<string, Record<string, boolean>>>({})
  const flat = useMemo(() => PERMISSION_MODULES.flatMap(m => m.activities.map(a => `${m.key}.${a.key}`)), [])

  // Load stored selections for the provided userId
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(userId))
      if (raw) setSelected(JSON.parse(raw))
      else setSelected({})
    } catch {
      setSelected({})
    }
  }, [userId])

  const isChecked = (moduleKey: string, activityKey: string) => Boolean(selected?.[moduleKey]?.[activityKey])

  const setChecked = (moduleKey: string, activityKey: string, value: boolean) => {
    setSelected(prev => ({
      ...prev,
      [moduleKey]: {
        ...(prev[moduleKey] || {}),
        [activityKey]: value,
      },
    }))
  }

  const setModuleAll = (moduleKey: string, value: boolean) => {
    const mod = PERMISSION_MODULES.find(m => m.key === moduleKey)
    if (!mod) return
    setSelected(prev => ({
      ...prev,
      [moduleKey]: Object.fromEntries(mod.activities.map(a => [a.key, value])),
    }))
  }

  const allModuleChecked = (moduleKey: string) => {
    const mod = PERMISSION_MODULES.find(m => m.key === moduleKey)
    if (!mod) return false
    const current = selected[moduleKey] || {}
    return mod.activities.every(a => current[a.key])
  }

  const anyModuleChecked = (moduleKey: string) => {
    const mod = PERMISSION_MODULES.find(m => m.key === moduleKey)
    if (!mod) return false
    const current = selected[moduleKey] || {}
    return mod.activities.some(a => current[a.key])
  }

  const save = async () => {
    // Persist locally per-user for now
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(selected))
      alert("Permissions saved locally.")
    } catch {
      alert("Failed to save locally.")
    }

    // Optionally, call a backend API when available
    // await fetch("/api/permissions", { method: "POST", body: JSON.stringify({ userId, selected }) })
  }

  const reset = () => {
    setSelected({})
    try { localStorage.removeItem(storageKey(userId)) } catch {}
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <Label htmlFor="userId">{language === "en" ? "User ID or Email" : "የተጠቃሚ መለያ ወይም ኢሜል"}</Label>
          <Input id="userId" value={userId} onChange={(e)=>setUserId(e.target.value)} placeholder="e.g. USR-001 or user@example.com" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset}>{language === "en" ? "Reset" : "እንደነበረ መመለስ"}</Button>
          <Button onClick={save}>{language === "en" ? "Save" : "አስቀምጥ"}</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{language === "en" ? "Permissions by Module & Activity" : "በሞዱል እና በእንቅስቃሴ ፈቃዶች"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {PERMISSION_MODULES.map(module => (
            <div key={module.key} className="border rounded-lg">
              <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                <div className="font-semibold">{module.label}</div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`mod-${module.key}`}
                    checked={allModuleChecked(module.key)}
                    onCheckedChange={(v)=>setModuleAll(module.key, Boolean(v))}
                    aria-checked={allModuleChecked(module.key)}
                  />
                  <Label htmlFor={`mod-${module.key}`}>{language === "en" ? "Select all" : "ሁሉንም ምረጥ"}</Label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                {module.activities.map(activity => (
                  <label key={`${module.key}.${activity.key}`} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={isChecked(module.key, activity.key)}
                      onCheckedChange={(v)=>setChecked(module.key, activity.key, Boolean(v))}
                      aria-checked={isChecked(module.key, activity.key)}
                    />
                    <span>{activity.label}</span>
                  </label>
                ))}
              </div>
              {/* Partial selection hint */}
              {anyModuleChecked(module.key) && !allModuleChecked(module.key) && (
                <div className="px-4 pb-4 text-xs text-muted-foreground">{language === "en" ? "Partially selected" : "በከፊል ተመርጧል"}</div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
