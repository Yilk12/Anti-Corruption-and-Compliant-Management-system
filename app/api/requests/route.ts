import { NextResponse } from "next/server"
import { addRequest, getRequests } from "@/backend/lib/requests-store"

export async function GET() {
  const list = await getRequests()
  return NextResponse.json(list)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { role, type, subject } = body || {}

    if (!subject || typeof subject !== "string") {
      return NextResponse.json({ error: "subject is required" }, { status: 400 })
    }

    const allowedTypes = ["report", "fuel", "maintenance"]
    if (!allowedTypes.includes(type)) {
      return NextResponse.json({ error: "invalid type" }, { status: 400 })
    }

    const partial = {
      role: String(role || "other"),
      type,
      subject: String(subject),
      description: body.description ? String(body.description) : undefined,
      vehicleId: body.vehicleId ? String(body.vehicleId) : undefined,
      amount: body.amount !== undefined ? Number(body.amount) : undefined,
      preferredDate: body.preferredDate ? String(body.preferredDate) : undefined,
    }

    const saved = await addRequest(partial)
    return NextResponse.json(saved, { status: 201 })
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 })
  }
}
