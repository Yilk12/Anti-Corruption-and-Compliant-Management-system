import { NextRequest, NextResponse } from "next/server"
import { addLike, getAdById } from "../../_store"

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const ad = getAdById(params.id)
  if (!ad) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const updated = addLike(params.id)
  return NextResponse.json(updated)
}
