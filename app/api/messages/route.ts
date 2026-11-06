import { NextRequest, NextResponse } from "next/server";
import { PLATFORM_STORE, nextId, BLOCKS } from "../platform/_store";
import { broadcast } from "./_events";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Helper function to decode JWT and extract user ID
function getUserIdFromToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(payload, 'base64').toString('utf8');
    const decoded = JSON.parse(json);
    return decoded.id || decoded.userId || decoded.sub || null;
  } catch {
    return null;
  }
}

// GET /api/messages?from=U-002&to=U-003&page=1&pageSize=20
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const q = (searchParams.get('q') || '').toLowerCase();
  const groupId = searchParams.get('groupId');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
  
  // Get current user from authorization header
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  let currentUser = '';
  
  // Decode JWT to get user ID
  if (token) {
    currentUser = getUserIdFromToken(token) || '';
  }
  
  let items = PLATFORM_STORE.messages;
  
  // Security: Only show messages where current user is sender or recipient
  if (currentUser) {
    items = items.filter((m: any) => 
      String(m.from) === currentUser || String(m.to) === currentUser
    );
  }
  
  // Additional filters
  if (groupId) items = items.filter((m: any) => String(m.groupId || '') === String(groupId));
  if (from) items = items.filter((m: any) => String(m.from) === from);
  if (to) items = items.filter((m: any) => String(m.to) === to);
  if (q) items = items.filter((m: any) => String(m.text || '').toLowerCase().includes(q));
  
  // newest first
  items = [...items].sort((a: any, b: any) => String(b.id).localeCompare(String(a.id)));
  const total = items.length;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);
  return NextResponse.json({ ok: true, items: paged, page, pageSize, total });
}

// POST /api/messages  { from, to, text }
export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';
  // Multipart with attachments
  if (/multipart\/form-data/i.test(contentType)) {
    const form = await req.formData();
    const from = String(form.get('from') || '')
    const to = String(form.get('to') || '')
    const groupId = String(form.get('groupId') || '') || undefined as any;
    const text = String(form.get('text') || '')
    if (!from || !to) return NextResponse.json({ ok: false, error: 'from/to required' }, { status: 400 });
    if (!text.trim() && (form.getAll('files') || []).length === 0) return NextResponse.json({ ok: false, error: 'text or file required' }, { status: 400 });
    // Block rules: only for direct messages (no groupId)
    if (!groupId) {
      const blocked = BLOCKS.some((b: any) => (b.blocker === from && b.blocked === to) || (b.blocker === to && b.blocked === from));
      if (blocked) return NextResponse.json({ ok: false, error: 'blocked' }, { status: 403 });
    }
    const id = nextId('messages');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true }).catch(() => {});
    const saved: any[] = [];
    const files = form.getAll('files');
    for (const f of files) {
      if (typeof File !== 'undefined' && f instanceof File) {
        const file = f as unknown as File;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2,8)}-${(file.name || 'file').replace(/[^a-z0-9_.-]/gi, '_')}`;
        const filePath = path.join(uploadDir, safeName);
        await writeFile(filePath, buffer);
        saved.push({ name: file.name || safeName, type: file.type || 'application/octet-stream', url: `/uploads/${safeName}`, size: file.size || buffer.length });
      }
    }
    const item = { id, from, to, groupId, text: String(text).trim(), createdAt: new Date().toISOString(), attachments: saved, readBy: [] as string[] };
    PLATFORM_STORE.messages.push(item as any);
    try { broadcast('message', item); } catch {}
    return NextResponse.json({ ok: true, item });
  }

  // JSON fallback
  const body = await req.json().catch(() => ({} as any));
  const { from, to, groupId, text } = body as { from: string; to?: string; groupId?: string; text: string };
  if (!from || (!to && !groupId)) return NextResponse.json({ ok: false, error: 'from/to or groupId required' }, { status: 400 });
  // Block rules for direct messages
  if (to && !groupId) {
    const blocked = BLOCKS.some((b: any) => (b.blocker === from && b.blocked === to) || (b.blocker === to && b.blocked === from));
    if (blocked) return NextResponse.json({ ok: false, error: 'blocked' }, { status: 403 });
  }
  if (!text || !String(text).trim()) return NextResponse.json({ ok: false, error: 'text required' }, { status: 400 });
  const id = nextId('messages');
  const item = { id, from, to: to || '', groupId, text: String(text).trim(), createdAt: new Date().toISOString(), attachments: [], readBy: [] as string[] };
  PLATFORM_STORE.messages.push(item as any);
  try { broadcast('message', item); } catch {}
  return NextResponse.json({ ok: true, item });
}
