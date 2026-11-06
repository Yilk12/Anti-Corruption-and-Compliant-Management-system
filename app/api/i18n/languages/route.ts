import { NextRequest, NextResponse } from 'next/server'
import { getLanguageList } from '@/app/api/i18n/_store'

export async function GET(_req: NextRequest) {
  return NextResponse.json({ items: getLanguageList() })
}
