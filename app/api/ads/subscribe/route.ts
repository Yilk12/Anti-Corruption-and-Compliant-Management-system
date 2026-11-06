import { NextRequest, NextResponse } from "next/server"
import { addSubscription } from "../_store"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = String(body?.email || '').trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }
    const s = addSubscription(email)
    if (!s) return NextResponse.json({ message: 'Already subscribed' }, { status: 200 })
    return NextResponse.json(s, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 400 })
  }
}
