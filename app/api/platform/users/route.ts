import { NextResponse } from 'next/server'
import { PLATFORM_STORE } from '@/app/api/platform/_store'

export async function GET() {
  try {
    const users = PLATFORM_STORE.users || []
    return NextResponse.json({ ok: true, items: users })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Error' }, { status: 500 })
  }
}
