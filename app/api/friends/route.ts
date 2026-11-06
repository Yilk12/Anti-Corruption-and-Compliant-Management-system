import { NextRequest, NextResponse } from "next/server";
import { FRIENDS } from "../platform/_store";

// GET /api/friends?user=U-002 -> list user's friends
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user = searchParams.get('user');
  let items = FRIENDS;
  if (user) items = items.filter(f => f.a === user || f.b === user);
  return NextResponse.json({ ok: true, items });
}

// POST /api/friends { a, b }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));
  const { a, b } = body as { a: string; b: string };
  if (!a || !b) return NextResponse.json({ ok: false, error: 'a/b required' }, { status: 400 });
  const exists = FRIENDS.some(f => (f.a === a && f.b === b) || (f.a === b && f.b === a));
  if (!exists) FRIENDS.push({ id: `FR-${String(FRIENDS.length+1).padStart(3,'0')}`, a, b, createdAt: new Date().toISOString() });
  return NextResponse.json({ ok: true, items: FRIENDS.filter(f => f.a === a || f.b === a) });
}

// DELETE /api/friends?a=U-002&b=U-003
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const a = searchParams.get('a');
  const b = searchParams.get('b');
  if (!a || !b) return NextResponse.json({ ok: false, error: 'a/b required' }, { status: 400 });
  const idx = FRIENDS.findIndex(f => (f.a === a && f.b === b) || (f.a === b && f.b === a));
  if (idx !== -1) FRIENDS.splice(idx,1);
  return NextResponse.json({ ok: true });
}
