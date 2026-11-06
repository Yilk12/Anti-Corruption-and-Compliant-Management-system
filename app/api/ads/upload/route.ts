import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 })

    const bytes = Buffer.from(await file.arrayBuffer())
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await fs.mkdir(uploadsDir, { recursive: true })
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const ts = Date.now()
    const filename = `${ts}-${safeName}`
    const full = path.join(uploadsDir, filename)
    await fs.writeFile(full, bytes)
    const url = `/uploads/${filename}`
    return NextResponse.json({ url })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
