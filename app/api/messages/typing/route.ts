import { NextRequest, NextResponse } from "next/server";
import { broadcast } from "../_events";

// POST /api/messages/typing  { from: string, to?: string, groupId?: string, isTyping: boolean }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=> ({} as any));
  const { from, to, groupId, isTyping } = body || {};
  if (!from) return NextResponse.json({ ok:false, error:'from required' }, { status: 400 });
  // broadcast to all; client filters
  try { broadcast('typing', { from, to: to||'', groupId: groupId||'', isTyping: !!isTyping, at: Date.now() }); } catch {}
  return NextResponse.json({ ok: true });
}
