"use client"

import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Label } from "@/app/components/ui/label"
import { Input } from "@/app/components/ui/input"

export type RoleOption = string
export type SimpleUser = {
  id: string
  name: string
  email?: string
  role: RoleOption
}

export type UserSelectProps = {
  users: SimpleUser[]
  roles?: RoleOption[]
  label?: string
  placeholderRole?: string
  placeholderUser?: string
  onChange?: (userId: string | null) => void
  className?: string
}

export default function UserSelect({ users, roles, label = "Select User", placeholderRole = "Filter by role", placeholderUser = "Select a user", onChange, className }: UserSelectProps) {
  const uniqueRoles = React.useMemo(() => (roles && roles.length ? roles : Array.from(new Set(users.map(u => u.role))).sort()), [roles, users])
  const [role, setRole] = React.useState<string>("all")
  const [userId, setUserId] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState("")

  const filtered = React.useMemo(() => {
    const byRole = role === "all" ? users : users.filter(u => String(u.role) === role)
    if (!search.trim()) return byRole
    const q = search.toLowerCase()
    return byRole.filter(u => u.name.toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q))
  }, [role, users, search])

  // Notify parent only when value actually changes and is non-null (avoid initial null churn)
  React.useEffect(() => {
    if (userId != null) onChange?.(userId)
  }, [userId])

  return (
    <div className={className}>
      {label && <Label className="mb-2 block">{label}</Label>}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="flex-1 md:max-w-xs">
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={placeholderRole} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {uniqueRoles.map(r => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input className="flex-1" placeholder="Search by name/email" value={search} onChange={e=>setSearch(e.target.value)} />
        <div className="flex-1">
          <Select value={userId ?? undefined} onValueChange={(v)=>{
            setUserId(prev => (prev === v ? prev : v))
          }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={placeholderUser} />
            </SelectTrigger>
            <SelectContent>
              {filtered.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.name} {u.email ? `(${u.email})` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
