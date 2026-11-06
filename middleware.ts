import { NextResponse, NextRequest } from 'next/server'

// Paths that do not require authentication
const PUBLIC_PATHS = [
  '/login',
  '/forgot-password',
  '/auth/sso/callback',
  '/track-complaint',
  '/guest-feedback',
  '/guest-anticorruption',
  '/track-feedback',
  '/guest-complaint',
]

// Prefixes to ignore in middleware
const PUBLIC_PREFIXES = [
  '/_next', // Next.js internals
  '/static',
  '/favicon.ico',
  '/images',
  '/public',
  '/guest-feedback',
  '/guest-anticorruption',
  '/track-complaint',
  '/track-feedback',
  '/guest-complaint',
]

// API routes that must be public (auth endpoints)
const PUBLIC_API_PREFIXES = [
  '/api/auth/login',
  '/api/auth/forgot-password',
  '/api/auth/sso',
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public assets, Next internals
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next()

  // Allow auth-related API endpoints
  if (pathname.startsWith('/api/auth')) {
    if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next()
    // Other auth APIs allowed as well (e.g., /api/auth/sso/callback)
    return NextResponse.next()
  }

  // Allow other API routes to pass through; API authentication is enforced in route handlers
  if (pathname.startsWith('/api/')) return NextResponse.next()

  // Allow public pages
  if (PUBLIC_PATHS.includes(pathname)) {
    const response = NextResponse.next()
    response.headers.set('x-public-page', 'true')
    return response
  }

  // Check HttpOnly auth cookie set by backend
  const token = req.cookies.get('access_token')?.value
  if (!token) {
    const loginUrl = new URL('/login', req.url)
    // Preserve original destination
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Run middleware on all pages except static and API (handled above in code)
    '/((?!_next|static|favicon.ico|images|public).*)',
  ],
}

