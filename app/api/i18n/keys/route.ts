import { NextRequest, NextResponse } from 'next/server'
import { listKeys } from '@/app/api/i18n/_store'

export async function GET(_req: NextRequest) {
  return NextResponse.json({ items: listKeys() })
}
