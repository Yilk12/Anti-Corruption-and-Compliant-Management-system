import { NextRequest, NextResponse } from "next/server";
import { GROUPS, GroupMember } from "../platform/_store";

// GET /api/groups -> list all groups
export async function GET() {
  return NextResponse.json({ ok: true, items: GROUPS });
}

// POST /api/groups { name, members: string[] }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));
  const { name, owner, members } = body as { name: string; owner: string; members?: Array<{ userId: string; role?: GroupMember['role'] }> };
  if (!name || !String(name).trim()) return NextResponse.json({ ok: false, error: 'name required' }, { status: 400 });
  if (!owner) return NextResponse.json({ ok: false, error: 'owner required' }, { status: 400 });
  const id = `GRP-${String(GROUPS.length + 1).padStart(3,'0')}`;
  const initialMembers: GroupMember[] = [ { userId: owner, role: 'owner' } ];
  if (Array.isArray(members)) {
    for (const m of members) {
      if (!m || !m.userId) continue;
      if (m.userId === owner) continue;
      initialMembers.push({ userId: m.userId, role: m.role || 'member' });
    }
  }
  const item = { id, name: String(name).trim(), members: initialMembers, createdAt: new Date().toISOString() };
  GROUPS.push(item);
  return NextResponse.json({ ok: true, item });
}

// PATCH /api/groups  { id, action: 'add_member'|'remove_member'|'set_role', by: string, userId?: string, role?: GroupMember['role'] }
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));
  const { id, action, by, userId, role } = body as { id: string; action: 'add_member'|'remove_member'|'set_role'; by: string; userId?: string; role?: GroupMember['role'] };
  if (!id || !action || !by) return NextResponse.json({ ok: false, error: 'id/action/by required' }, { status: 400 });
  const idx = GROUPS.findIndex(g => g.id === id);
  if (idx === -1) return NextResponse.json({ ok: false, error: 'group not found' }, { status: 404 });
  const g = GROUPS[idx];
  const me = g.members.find(m => m.userId === by);
  if (!me) return NextResponse.json({ ok: false, error: 'not a member' }, { status: 403 });
  // Only owner/admin can manage members
  if (!(me.role === 'owner' || me.role === 'admin')) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  if (action === 'add_member') {
    if (!userId) return NextResponse.json({ ok: false, error: 'userId required' }, { status: 400 });
    if (g.members.some(m => m.userId === userId)) return NextResponse.json({ ok: true, item: g });
    g.members.push({ userId, role: role || 'member' });
  } else if (action === 'remove_member') {
    if (!userId) return NextResponse.json({ ok: false, error: 'userId required' }, { status: 400 });
    const target = g.members.find(m => m.userId === userId);
    if (!target) return NextResponse.json({ ok: false, error: 'not in group' }, { status: 400 });
    if (target.role === 'owner') return NextResponse.json({ ok: false, error: 'cannot remove owner' }, { status: 400 });
    g.members = g.members.filter(m => m.userId !== userId);
  } else if (action === 'set_role') {
    if (!userId || !role) return NextResponse.json({ ok: false, error: 'userId/role required' }, { status: 400 });
    const target = g.members.find(m => m.userId === userId);
    if (!target) return NextResponse.json({ ok: false, error: 'not in group' }, { status: 400 });
    if (target.role === 'owner') return NextResponse.json({ ok: false, error: 'cannot modify owner role' }, { status: 400 });
    target.role = role;
  }
  GROUPS[idx] = { ...g, members: [...g.members] };
  return NextResponse.json({ ok: true, item: GROUPS[idx] });
}
