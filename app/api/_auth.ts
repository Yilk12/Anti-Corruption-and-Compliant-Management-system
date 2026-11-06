import { NextRequest, NextResponse } from 'next/server'
import { PLATFORM_STORE } from './platform/_store'

function decodeJwtServer(token: string): any | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = Buffer.from(payload, 'base64').toString('utf8')
    return JSON.parse(json)
  } catch {
    return null
  }
}
export function getTokenFromRequest(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') || ''
  const m = auth.match(/bearer\s+([^\s]+)/i)
  if (m) return m[1]
  const cookie = req.headers.get('cookie') || ''
  const cm = cookie.match(/(?:^|;\s*)accessToken=([^;]+)/)
  if (cm) return decodeURIComponent(cm[1])
  return null
}

export function getUserContext(req: NextRequest): { id?: string; roles: string[]; user?: any } {
  const t = getTokenFromRequest(req)
  if (!t) return { roles: [] }
  const decoded = decodeJwtServer(t)
  const id = decoded?.email || decoded?.preferred_username || decoded?.sub || decoded?.name
  const roles = collectRoles(decoded)
  // Map to known user in store, if any
  const user = PLATFORM_STORE.users.find(u => [u.id,u.email,u.name].some(v => String(v||'').toLowerCase() === String(id||'').toLowerCase()))
  const mergedRoles = [...new Set([...(roles||[]), String(user?.role||'').toLowerCase()].filter(Boolean))]
  return { id, roles: mergedRoles, user }
}

export function requireAuth(req: NextRequest): { ok: true; id: string; roles: string[]; user?: any } | NextResponse {
  const ctx = getUserContext(req)
  if (!ctx.id) return NextResponse.json({ ok:false, error:'Unauthorized' }, { status: 401 })
  return { ok:true, id: String(ctx.id), roles: ctx.roles, user: ctx.user }
}

export function hasAnyRole(roles: string[], expected: string[]): boolean {
  const norm = roles.map(r => r.toLowerCase())
  return expected.some(e => norm.includes(e.toLowerCase()))
}

export function requireRole(req: NextRequest, expected: string[]): { ok:true; id:string; roles:string[]; user?:any } | NextResponse {
  // Admin override: allow when special header or admin token is present
  try {
    if (isAdminRequest(req)) {
      return { ok: true, id: 'admin-override', roles: ['admin'] }
    }
  } catch {}
  const r = requireAuth(req)
  if ('ok' in r && (r as any).ok) {
    const rr = r as { ok:true; id:string; roles:string[]; user?:any }
    if (hasAnyRole(rr.roles, expected)) return rr
    return NextResponse.json({ ok:false, error:'Forbidden' }, { status: 403 })
  }
  return r
}
function collectRoles(decoded: any): string[] {
  const out: string[] = []
  if (!decoded) return out
  if (typeof decoded.role === 'string') out.push(decoded.role)
  if (Array.isArray(decoded.role)) out.push(...decoded.role)
  if (Array.isArray(decoded.roles)) {
    for (const r of decoded.roles) {
      if (typeof r === 'string') out.push(r)
      else if (r && typeof r.name === 'string') out.push(r.name)
    }
  }
  if (decoded.realm_access?.roles) out.push(...decoded.realm_access.roles)
  if (decoded.resource_access) {
    for (const v of Object.values(decoded.resource_access)) {
      if (Array.isArray((v as any)?.roles)) out.push(...(v as any).roles)
    }
  }
  return out.map(String).map(s=>s.toLowerCase())
}

export function isAdminRequest(req: NextRequest): boolean {
  // Explicit override header
  const x = req.headers.get('x-admin')
  if (x === '1' || x === 'true') return true
  // Authorization: Bearer <jwt>
  const auth = req.headers.get('authorization') || ''
  const m = auth.match(/bearer\s+([^\s]+)/i)
  if (!m) return false
  const decoded = decodeJwtServer(m[1])
  const roles = collectRoles(decoded)
  return roles.some(r => /(admin|system[_-]?admin|superuser)/.test(r))
}
