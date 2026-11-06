import { NextRequest, NextResponse } from "next/server"

type Dept = {
  id: string
  name: string
  nameAm?: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

function getStore(): Dept[] {
  const g = globalThis as any
  if (!g.__departments) {
    g.__departments = [] as Dept[]
  }
  return g.__departments as Dept[]
}

function findIndexById(id: string) {
  return getStore().findIndex((d) => d.id === id)
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const idx = findIndexById(params.id)
  if (idx === -1) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 })
  return NextResponse.json(getStore()[idx])
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const idx = findIndexById(params.id)
    if (idx === -1) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 })
    const now = new Date().toISOString()
    const current = getStore()[idx]
    const updated: Dept = {
      ...current,
      name: body?.name !== undefined ? String(body.name) : current.name,
      nameAm: body?.nameAm !== undefined ? String(body.nameAm) : current.nameAm,
      description: body?.description !== undefined ? String(body.description) : current.description,
      isActive: body?.isActive !== undefined ? Boolean(body.isActive) : current.isActive,
      updatedAt: now,
    }
    getStore()[idx] = updated
    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }
}

// Support soft-delete via POST with _method=DELETE as well as DELETE
export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const { searchParams } = new URL(req.url)
  const methodOverride = (searchParams.get("_method") || "").toUpperCase()
  if (methodOverride === "DELETE") {
    return DELETE(req, ctx)
  }
  return NextResponse.json({ ok: false, error: "Unsupported" }, { status: 400 })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const idx = findIndexById(params.id)
  if (idx === -1) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 })
  const now = new Date().toISOString()
  getStore()[idx] = { ...getStore()[idx], isActive: false, updatedAt: now }
  return NextResponse.json(getStore()[idx])
}
