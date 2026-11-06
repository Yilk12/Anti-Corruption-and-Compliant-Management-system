import { NextRequest, NextResponse } from "next/server"
import { API_BASE_URL, API_ORIGIN } from "@/app/lib/api"
import { decodeJwt } from "@/app/lib/auth"
import { validatePassword, defaultPolicy } from "@/backend/lib/password-policy"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid request body" }, { status: 400 })
    }

    // Admin-only enforcement for ALL user registration
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    const payload = token ? decodeJwt(token) : null
    const roles: string[] = []
    if (payload) {
      if (typeof payload.role === 'string') roles.push(payload.role)
      if (Array.isArray(payload.role)) roles.push(...payload.role)
      if (Array.isArray((payload as any).roles)) {
        for (const r of (payload as any).roles as any[]) {
          if (typeof r === 'string') roles.push(r)
          else if (r && typeof r.name === 'string') roles.push(r.name)
        }
      }
      if ((payload as any).realm_access?.roles) roles.push(...(((payload as any).realm_access.roles) || []))
      if ((payload as any).resource_access) {
        for (const v of Object.values((payload as any).resource_access)) {
          if (Array.isArray((v as any)?.roles)) roles.push(...((v as any).roles))
        }
      }
    }
    const lowered = roles.map(r => String(r).toLowerCase())
    const isAdmin = lowered.some(r => r.includes('admin'))
    if (!isAdmin) {
      return NextResponse.json({ message: 'Only system admin can create users' }, { status: 401 })
    }

    // Server-side password policy enforcement (when password is provided)
    if (typeof (body as any).password === 'string') {
      const { ok, errors } = validatePassword((body as any).password, defaultPolicy)
      if (!ok) {
        return NextResponse.json({ message: 'Weak password', errors }, { status: 400 })
      }
    }

    // Resolve backend origin with safe defaults
    // Order: BACKEND_URL -> NEXT_PUBLIC_API_URL -> request origin -> http://localhost:3001
    const explicitOrigin = (process.env.BACKEND_URL || API_ORIGIN || '').trim()
    const requestOrigin = req.nextUrl?.origin || `${req.headers.get('x-forwarded-proto') || 'http'}://${req.headers.get('host')}`
    // Prevent recursion: if request origin is the Next app (likely :3000), prefer backend default :3001
    const defaultBackend = 'http://localhost:3001'
    const isFrontendOrigin = typeof requestOrigin === 'string' && /:\\s*3000\b|:3000\b/.test(requestOrigin)
    const baseOrigin = explicitOrigin.length > 0
      ? explicitOrigin
      : (isFrontendOrigin ? defaultBackend : (requestOrigin || defaultBackend))
    // Backend global prefix is set to `api` (see backend/src/main.ts)
    const url = new URL('/api/auth/register', baseOrigin.replace(/\/$/, '')).toString()
    try {
      // Add a timeout to prevent hanging requests on unstable networks
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      const backendResp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
        credentials: "include",
        signal: controller.signal,
      })
      clearTimeout(timeout)

      const text = await backendResp.text()
      let data: any = {}
      try { data = text ? JSON.parse(text) : {} } catch { data = { message: text || undefined } }
      return NextResponse.json(data, { status: backendResp.status })
    } catch (e: any) {
      // If backend is unavailable, optionally fallback to mock when enabled
      const allowFallback = process.env.NEXT_PUBLIC_USE_MOCKS === 'true'
      if (allowFallback) {
        const now = new Date().toISOString()
        const id = `USR-${Math.floor(1000 + Math.random()*9000)}`
        return NextResponse.json({
          id,
          name: (body as any).name,
          email: (body as any).email,
          phone: (body as any).phone || '',
          role: (body as any).role,
          department: (body as any).department || '',
          userType: (body as any).userType,
          status: (body as any).status,
          moduleRoles: (body as any).moduleRoles || {},
          helpdeskRole: (body as any).helpdeskRole || '',
          kbRole: (body as any).kbRole || '',
          createdAt: now,
          lastLogin: null,
          message: 'Mock user created (backend offline)'
        }, { status: 201 })
      }
      const reason = e?.name === 'AbortError' ? 'Backend timeout' : (e?.message || 'Backend unavailable for registration')
      return NextResponse.json({ message: reason }, { status: 502 })
    }
  } catch (e) {
    return NextResponse.json({ message: "Unexpected error during registration" }, { status: 500 })
  }
}
