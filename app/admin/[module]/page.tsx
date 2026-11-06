"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { decodeJwt } from "@/app/lib/auth"

function normalizeModule(v: string) {
  return v.toLowerCase().replace(/\s+/g, '_')
}

export default function AdminModulePage() {
  const params = useParams() as { module: string }
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const moduleKey = useMemo(() => normalizeModule(params.module || ''), [params.module])

  // Admin guard
  useEffect(() => {
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')) : null
      if (!token) { setAllowed(false); router.replace('/'); return }
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

  if (allowed === false) return null
  if (allowed === null) return (<div className="p-4 text-sm text-gray-600">Loading...</div>)

  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const [showCreate, setShowCreate] = useState(false)
  const [createJson, setCreateJson] = useState<string>("{\n  \"name\": \"Sample\"\n}")

  const [editId, setEditId] = useState<string | null>(null)
  const [editJson, setEditJson] = useState<string>("{}")

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const r = await fetch(`/api/admin/${moduleKey}`, { headers: { 'x-admin': '1' } })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed')
      setItems(Array.isArray(d?.items) ? d.items : [])
    } catch (e: any) {
      setError(e?.message || 'Failed')
      setItems([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { if (moduleKey) load() }, [moduleKey])

  const doCreate = async () => {
    try {
      const body = JSON.parse(createJson)
      const r = await fetch(`/api/admin/${moduleKey}`, { method: 'POST', headers: { 'Content-Type':'application/json', 'x-admin':'1' }, body: JSON.stringify(body) })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Create failed')
      setShowCreate(false)
      setCreateJson("{\n  \"name\": \"Sample\"\n}")
      load()
    } catch (e:any) {
      alert(e?.message || 'Invalid JSON or request failed')
    }
  }

  const startEdit = (it: any) => {
    setEditId(it.id)
    setEditJson(JSON.stringify(it, null, 2))
  }
  const doEdit = async () => {
    if (!editId) return
    try {
      const body = JSON.parse(editJson)
      const r = await fetch(`/api/admin/${moduleKey}/${editId}`, { method: 'PATCH', headers: { 'Content-Type':'application/json', 'x-admin':'1' }, body: JSON.stringify(body) })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Update failed')
      setEditId(null)
      load()
    } catch (e:any) {
      alert(e?.message || 'Invalid JSON or request failed')
    }
  }
  const doDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return
    const r = await fetch(`/api/admin/${moduleKey}/${id}`, { method: 'DELETE', headers: { 'x-admin':'1' } })
    const d = await r.json()
    if (!r.ok) { alert(d?.error || 'Delete failed'); return }
    load()
  }

  const columns = useMemo(() => {
    const keys = new Set<string>()
    for (const it of items) {
      Object.keys(it).forEach(k => keys.add(k))
    }
    return Array.from(keys)
  }, [items])

  const title = useMemo(() => moduleKey.replace(/_/g,' ').replace(/\b\w/g, c=>c.toUpperCase()), [moduleKey])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin – {title}</h1>
          <div className="text-sm text-gray-600">Manage {moduleKey} items</div>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 border rounded" onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</button>
          <button className="px-3 py-2 border rounded" onClick={()=>setShowCreate(true)}>New</button>
        </div>
      </div>

      {error && <div className="text-sm text-red-700">{error}</div>}

      <div className="overflow-auto">
        <table className="w-full text-sm border">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(c => (
                <th key={c} className="text-left p-2 border">{c}</th>
              ))}
              <th className="text-left p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td className="p-2 border" colSpan={columns.length + 1}>No items</td></tr>
            ) : items.map(it => (
              <tr key={it.id}>
                {columns.map(c => (
                  <td key={c} className="p-2 border align-top">
                    {typeof it[c] === 'object' ? <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(it[c], null, 2)}</pre> : String(it[c])}
                  </td>
                ))}
                <td className="p-2 border whitespace-nowrap">
                  <button className="px-2 py-1 border rounded" onClick={()=>startEdit(it)}>Edit</button>
                  <button className="ml-2 px-2 py-1 border rounded text-red-700" onClick={()=>doDelete(it.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded p-4 space-y-3">
            <div className="font-semibold">Create {title} item (JSON)</div>
            <textarea className="border rounded w-full p-2 h-64 font-mono text-xs" value={createJson} onChange={e=>setCreateJson(e.target.value)} />
            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 border rounded" onClick={()=>setShowCreate(false)}>Cancel</button>
              <button className="px-3 py-2 border rounded" onClick={doCreate}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded p-4 space-y-3">
            <div className="font-semibold">Edit {title} item ({editId})</div>
            <textarea className="border rounded w-full p-2 h-64 font-mono text-xs" value={editJson} onChange={e=>setEditJson(e.target.value)} />
            <div className="flex justify-between">
              <button className="px-3 py-2 border rounded" onClick={()=>setEditId(null)}>Close</button>
              <div className="flex gap-2">
                <button className="px-3 py-2 border rounded" onClick={doEdit}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
