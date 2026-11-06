import { NextRequest, NextResponse } from "next/server"
import { addView, getAdById } from "../../_store"

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const ad = getAdById(params.id)
  if (!ad) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  addView(params.id)
  return NextResponse.json({ ok: true, views: ad.views })
}
