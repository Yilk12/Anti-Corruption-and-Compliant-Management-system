import { NextRequest, NextResponse } from "next/server"
import { getAds, addAd } from "@/backend/lib/ads-store"

export async function GET() {
  const list = await getAds()
  return NextResponse.json(list)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, content, creator } = body || {}

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "content is required" }, { status: 400 })
    }

    const saved = await addAd({ title, content, creator })
    return NextResponse.json(saved, { status: 201 })
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 })
  }
}
