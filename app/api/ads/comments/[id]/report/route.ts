import { NextRequest, NextResponse } from "next/server"
import { reportComment } from "../../../_store"

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const c = reportComment(params.id)
  if (!c) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  return NextResponse.json(c)
}
