import { NextRequest, NextResponse } from "next/server"
import { getBranding, setBranding } from "../_store"
import { decodeJwt } from "../../../lib/auth"

export async function GET() {
  return NextResponse.json(getBranding())
}

export async function PUT(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ')? auth.slice(7) : null
    const payload = token ? decodeJwt(token) as any : null
    const roles: string[] = []
    if (payload) {
      if (typeof payload.role === 'string') roles.push(payload.role)
      if (Array.isArray(payload.role)) roles.push(...payload.role)
      if (Array.isArray(payload.roles)) roles.push(...payload.roles as any)
      if (payload.realm_access?.roles) roles.push(...payload.realm_access.roles)
      if (payload.resource_access) {
        for (const v of Object.values(payload.resource_access)) {
          const rr: any = (v as any)?.roles
          if (Array.isArray(rr)) roles.push(...rr)
        }
      }
    }
    const lower = roles.map(String).map(r=>r.toLowerCase())
    const isAdmin = lower.some(r => /(admin|ads_admin|ads_editor)/.test(r))
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const body = await req.json()
    if (typeof body?.companyName !== 'string') {
      return NextResponse.json({ error: 'companyName is required' }, { status: 400 })
    }
    const updated = setBranding({
      companyName: String(body.companyName),
      logoUrl: body.logoUrl ? String(body.logoUrl) : undefined,
      slogan: body.slogan ? String(body.slogan) : undefined,
    })
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 400 })
  }
}
