import { NextRequest, NextResponse } from "next/server"
import { addComment, getComments, getAdById } from "../../_store"
import { requireAuth } from "../../../_auth"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const list = getComments(params.id)
  return NextResponse.json(list)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = requireAuth(req)
    // If authentication failed, requireAuth returns a NextResponse; pass it through.
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user, id } = authResult

    const displayName =
      (user &&
        (user.name || user.fullName || user.full_name || user.username || user.email)) ||
      id ||
      "Anonymous"

    const body = await req.json()
    const content = String(body?.content || "").trim()
    if (!content) return NextResponse.json({ error: "Content is required" }, { status: 400 })
    if (!getAdById(params.id)) return NextResponse.json({ error: "Ad not found" }, { status: 404 })

    // Prefer explicit author from body (sent by the announcements UI),
    // fall back to authenticated displayName, then Anonymous.
    const bodyAuthorRaw = typeof body?.author === "string" ? body.author.trim() : ""
    const author = bodyAuthorRaw || displayName || "Anonymous"

    const c = addComment(params.id, author, content, body?.parentId)
    return NextResponse.json(c, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 400 })
  }
}

