import { NextRequest, NextResponse } from 'next/server'
import { PLATFORM_STORE, type ModuleKey, nextId } from '@/app/api/platform/_store'
import { isAdminRequest } from '@/app/api/_auth'

function isModuleKey(v: string): v is ModuleKey {
  return ['tickets','knowledge_base','complaints','users','reports','feedback','analytics'].includes(v as any)
}

export async function GET(req: NextRequest, { params }: { params: { module: string } }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const key = params.module?.toLowerCase().replace(/\s+/g,'_')
  if (!key || !isModuleKey(key)) return NextResponse.json({ error: 'Invalid module' }, { status: 400 })
  return NextResponse.json({ items: PLATFORM_STORE[key] })
}

export async function POST(req: NextRequest, { params }: { params: { module: string } }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const key = params.module?.toLowerCase().replace(/\s+/g,'_')
  if (!key || !isModuleKey(key)) return NextResponse.json({ error: 'Invalid module' }, { status: 400 })
  const body = await req.json().catch(()=>({}))
  const id = nextId(key)
  const item = { id, ...body }
  PLATFORM_STORE[key].unshift(item)
  return NextResponse.json({ ok: true, item })
}
