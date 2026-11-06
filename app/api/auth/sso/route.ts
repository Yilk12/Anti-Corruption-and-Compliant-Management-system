import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/app/lib/api'

export async function GET(req: NextRequest) {
  // Start SSO flow at backend, tell it to come back to our callback
  const origin = req.nextUrl.origin
  const returnUrl = encodeURIComponent(`${origin}/auth/sso/callback`)
  const url = `${API_BASE_URL}/auth/sso?return_url=${returnUrl}`
  return NextResponse.redirect(url)
}
