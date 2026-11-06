import { NextRequest, NextResponse } from 'next/server'
import { PLATFORM_STORE, type ModuleKey } from '@/app/api/platform/_store'
import { isAdminRequest } from '@/app/api/_auth'

function isModuleKey(v: string): v is ModuleKey {
  return ['tickets','knowledge_base','complaints','users','reports','feedback','analytics'].includes(v as any)
}

export async function GET(req: NextRequest, { params }: { params: { module: string, id: string } }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const key = params.module?.toLowerCase().replace(/\s+/g,'_')
  const id = params.id
  if (!key || !isModuleKey(key)) return NextResponse.json({ error: 'Invalid module' }, { status: 400 })
  const item = PLATFORM_STORE[key].find(i => i.id === id)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ item })
}

export async function PATCH(req: NextRequest, { params }: { params: { module: string, id: string } }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const key = params.module?.toLowerCase().replace(/\s+/g,'_')
  const id = params.id
  if (!key || !isModuleKey(key)) return NextResponse.json({ error: 'Invalid module' }, { status: 400 })
  const patch = await req.json().catch(()=>({}))
  const idx = PLATFORM_STORE[key].findIndex(i => i.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  PLATFORM_STORE[key][idx] = { ...PLATFORM_STORE[key][idx], ...patch, id }
  return NextResponse.json({ ok: true, item: PLATFORM_STORE[key][idx] })
}

export async function DELETE(req: NextRequest, { params }: { params: { module: string, id: string } }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const key = params.module?.toLowerCase().replace(/\s+/g,'_')
  const id = params.id
  if (!key || !isModuleKey(key)) return NextResponse.json({ error: 'Invalid module' }, { status: 400 })
  const idx = PLATFORM_STORE[key].findIndex(i => i.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const [removed] = PLATFORM_STORE[key].splice(idx, 1)
  return NextResponse.json({ ok: true, item: removed })
}
