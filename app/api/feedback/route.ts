import { NextRequest, NextResponse } from 'next/server'
import { getHelpDeskProvider } from '@/app/lib/helpdesk'
import { getKBProvider } from '@/app/lib/kb'
import { decodeJwt } from '@/app/lib/auth'

// Unified endpoint for Complaints & Suggestions
// POST body: { type: 'complaint' | 'suggestion', subject: string, description: string, requesterId?: string, tags?: string[] }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({})) as any
  const { type, subject, description, requesterId = null, tags = [] } = body || {}
  if (!type || !subject) return NextResponse.json({ ok: false, error: 'type and subject required' }, { status: 400 })
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token || !decodeJwt(token)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const provider = getHelpDeskProvider()
  const ticket = await provider.createTicket({
    subject: `[${String(type).toUpperCase()}] ${subject}`,
    description: description || '',
    requesterId,
    tags: Array.isArray(tags) ? tags : [],
    priority: type === 'complaint' ? 'high' : 'medium',
    status: 'new',
  })

  // Suggest related KB articles based on subject/tags
  const kb = getKBProvider()
  const query = [subject, ...(tags || [])].filter(Boolean).join(' ')
  const related = await kb.search({ q: query || subject || '', limit: 5, tags: Array.isArray(tags) ? tags : [] })

  return NextResponse.json({ ok: true, ticket, related })
}
