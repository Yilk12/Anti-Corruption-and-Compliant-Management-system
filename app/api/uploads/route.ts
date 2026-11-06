import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const files: File[] = []

    for (const [_, value] of form.entries()) {
      if (value instanceof File) files.push(value)
    }

    if (files.length === 0) {
      return NextResponse.json({ ok: false, message: 'No files uploaded' }, { status: 400 })
    }

    // Validation rules
    const MAX_SIZE = 5 * 1024 * 1024 // 5MB
    const isAllowedType = (mime: string) => mime?.startsWith('image/') || mime === 'application/pdf'

    const invalidType: string[] = []
    const tooLarge: string[] = []
    for (const f of files) {
      if (!isAllowedType(f.type)) invalidType.push(f.name)
      if (f.size > MAX_SIZE) tooLarge.push(f.name)
    }

    if (invalidType.length || tooLarge.length) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Validation failed',
          invalidType,
          tooLarge,
          rule: 'Only images and PDFs are allowed. Max size 5MB per file.'
        },
        { status: 400 }
      )
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await fs.mkdir(uploadDir, { recursive: true })

    const saved: Array<{ name: string; url: string; size: number; type: string }> = []

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`
      const filePath = path.join(uploadDir, unique)
      await fs.writeFile(filePath, buffer)
      const url = `/uploads/${unique}`
      saved.push({ name: file.name, url, size: file.size, type: file.type })
    }

    return NextResponse.json({ ok: true, items: saved })
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message || 'Upload failed' }, { status: 500 })
  }
}
