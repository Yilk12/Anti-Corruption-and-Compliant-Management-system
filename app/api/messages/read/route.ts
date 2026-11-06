import { NextRequest, NextResponse } from "next/server";
import { PLATFORM_STORE } from "../../platform/_store";
import { broadcast } from "../_events";

// POST /api/messages/read  { ids?: string[], me: string, from?: string, to?: string, groupId?: string }
// If ids provided, mark those as read by 'me'. Otherwise, mark all messages matching from/to/groupId criteria as read by 'me'.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));
  const { ids, me, from, to, groupId } = body as { ids?: string[]; me: string; from?: string; to?: string; groupId?: string };
  if (!me) return NextResponse.json({ ok: false, error: 'me required' }, { status: 400 });
  let updated = 0;
  if (Array.isArray(ids) && ids.length > 0) {
    for (const id of ids) {
      const idx = PLATFORM_STORE.messages.findIndex((m: any) => m.id === id);
      if (idx !== -1) {
        const msg: any = PLATFORM_STORE.messages[idx];
        const rb: string[] = Array.isArray(msg.readBy) ? msg.readBy : [];
        if (!rb.includes(me)) rb.push(me);
        PLATFORM_STORE.messages[idx] = { ...msg, readBy: rb };
        updated++;
      }
    }
  } else {
    for (let i = 0; i < PLATFORM_STORE.messages.length; i++) {
      const msg: any = PLATFORM_STORE.messages[i];
      if (groupId) {
        if (String(msg.groupId || '') !== String(groupId)) continue;
      } else if (from && to) {
        // two-way match in thread
        const a = (msg.from === from && msg.to === to);
        const b = (msg.from === to && msg.to === from);
        if (!a && !b) continue;
      } else if (to) {
        if (msg.to !== to) continue;
      } else if (from) {
        if (msg.from !== from) continue;
      }
      const rb: string[] = Array.isArray(msg.readBy) ? msg.readBy : [];
      if (!rb.includes(me)) {
        PLATFORM_STORE.messages[i] = { ...msg, readBy: [...rb, me] };
        updated++;
      }
    }
  }
  try { broadcast('read', { me, ids: ids||[], from: from||'', to: to||'', groupId: groupId||'', updated }); } catch {}
  return NextResponse.json({ ok: true, updated });
}
