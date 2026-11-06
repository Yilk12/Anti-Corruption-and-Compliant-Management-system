import { NextRequest, NextResponse } from "next/server";
import { BLOCKS } from "../platform/_store";

// GET /api/blocks?user=U-002 -> list blocks where user is blocker
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user = searchParams.get('user');
  let items = BLOCKS;
  if (user) items = items.filter(b => b.blocker === user);
  return NextResponse.json({ ok: true, items });
}

// POST /api/blocks { blocker, blocked }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));
  const { blocker, blocked } = body as { blocker: string; blocked: string };
  if (!blocker || !blocked) return NextResponse.json({ ok: false, error: 'blocker/blocked required' }, { status: 400 });
  const exists = BLOCKS.some(b => b.blocker === blocker && b.blocked === blocked);
  if (!exists) BLOCKS.push({ id: `BLK-${String(BLOCKS.length+1).padStart(3,'0')}`, blocker, blocked, createdAt: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}

// DELETE /api/blocks?blocker=U-002&blocked=U-003
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const blocker = searchParams.get('blocker');
  const blocked = searchParams.get('blocked');
  if (!blocker || !blocked) return NextResponse.json({ ok: false, error: 'blocker/blocked required' }, { status: 400 });
  const idx = (BLOCKS as any[]).findIndex(b => b.blocker === blocker && b.blocked === blocked);
  if (idx !== -1) (BLOCKS as any[]).splice(idx,1);
  return NextResponse.json({ ok: true });
}
