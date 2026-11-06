"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { decodeJwt } from "@/app/lib/auth"

const MODULES = [
  { key: 'tickets', title: 'Tickets', color: 'bg-blue-50', path: '/admin/tickets' },
  { key: 'knowledge_base', title: 'Knowledge Base', color: 'bg-green-50', path: '/admin/knowledge_base' },
  { key: 'complaints', title: 'Complaints & Suggestions', color: 'bg-yellow-50', path: '/admin/complaints' },
  { key: 'reports', title: 'Reporting System', color: 'bg-slate-50', path: '/admin/reports' },
  { key: 'feedback', title: 'Feedback', color: 'bg-orange-50', path: '/admin/feedback' },
  { key: 'analytics', title: 'Analytics & Reports', color: 'bg-indigo-50', path: '/admin/analytics' },
] as const

export default function AdminDashboardPage() {
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [stats, setStats] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')) : null
      if (!token) { setAllowed(false); return }
      const p: any = decodeJwt(token)
      const roles: string[] = []
      if (typeof p?.role === 'string') roles.push(p.role)
      if (Array.isArray(p?.role)) roles.push(...p.role)
      if (Array.isArray(p?.roles)) roles.push(...p.roles)
      if (p?.realm_access?.roles) roles.push(...p.realm_access.roles)
      if (p?.resource_access) { for (const v of Object.values(p.resource_access)) { const rr = (v as any)?.roles; if (Array.isArray(rr)) roles.push(...rr) } }
      const isAdm = roles.map(String).map(r=>r.toLowerCase()).some(r => /(admin|system[_-]?admin|superuser)/.test(r))
      setAllowed(isAdm)
      if (!isAdm) router.replace('/')
    } catch { setAllowed(false); router.replace('/') }
  }, [router])

  const load = async () => {
    setLoading(true)
    try {
      const entries = await Promise.all(MODULES.map(async m => {
        const r = await fetch(`/api/admin/${m.key}`, { headers: { 'x-admin': '1' } })
        const d = await r.json()
        const n = Array.isArray(d?.items) ? d.items.length : 0
        return [m.key, n] as const
      }))
      setStats(Object.fromEntries(entries))
    } catch {
      setStats({})
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6">
      {allowed === null ? (
        <div className="p-4 text-sm text-gray-600">Loading...</div>
      ) : allowed === false ? null : (
        <>
          <h1 className="text-2xl font-bold"><span style={{ color: '#000000' }}>Digital _CSC-fcsc</span> – Admin</h1>
          <div className="text-sm text-gray-600">Manage all modules in one place.</div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULES.map(m => (
              <Link key={m.key} href={m.path} className={`block border rounded p-4 ${m.color}`}>
                <div className="text-lg font-semibold">{m.title}</div>
                <div className="text-sm text-gray-600">Items: {loading ? '...' : (stats[m.key] ?? 0)}</div>
                <div className="text-xs text-gray-500 mt-2">Open</div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
