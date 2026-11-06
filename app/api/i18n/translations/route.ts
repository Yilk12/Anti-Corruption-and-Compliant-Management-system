import { NextRequest, NextResponse } from 'next/server'
import { getFlatTranslations } from '@/app/api/i18n/_store'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lang = (searchParams.get('lang') || 'en') as any
  const data = getFlatTranslations(lang)
  return NextResponse.json({ lang, translations: data })
}
