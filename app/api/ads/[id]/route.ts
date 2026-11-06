import { NextRequest, NextResponse } from "next/server"
import { getAdById, upsertAd, ADS } from "../_store"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const ad = getAdById(params.id)
  if (!ad) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(ad)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const ad = upsertAd({ ...body, id: params.id })
    return NextResponse.json(ad)
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const idx = ADS.findIndex(a=>a.id===params.id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  ADS.splice(idx, 1)
  return NextResponse.json({ ok: true })
}
