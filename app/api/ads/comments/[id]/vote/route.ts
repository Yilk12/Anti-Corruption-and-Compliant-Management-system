import { NextRequest, NextResponse } from "next/server"
import { voteComment } from "../../../_store"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const dir = body?.dir === 'down' ? 'down' : 'up'
    const c = voteComment(params.id, dir)
    if (!c) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    return NextResponse.json(c)
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 400 })
  }
}
