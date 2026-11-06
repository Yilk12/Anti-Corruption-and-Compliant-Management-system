import { NextResponse } from "next/server";
import { decodeJwt } from "@/app/lib/auth";
import { addVoicebox, listVoicebox } from "@/app/lib/voiceboxStore";
import type { VoiceboxEntry } from "@/backend/types/voicebox";

function getRolesFromToken(token: string | null): string[] {
  if (!token) return [];
  try {
    const p: any = decodeJwt(token);
    const roles: string[] = [];
    if (typeof p?.role === "string") roles.push(p.role);
    if (Array.isArray(p?.role)) roles.push(...p.role);
    if (Array.isArray(p?.roles)) roles.push(...p.roles);
    if (p?.realm_access?.roles) roles.push(...p.realm_access.roles);
    if (p?.resource_access) {
      for (const v of Object.values(p.resource_access)) {
        const rr = (v as any)?.roles;
        if (Array.isArray(rr)) roles.push(...rr);
      }
    }
    return roles.map(String).map((r) => r.toUpperCase());
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const token = (await req.headers.get("authorization"))?.replace(/^Bearer\s+/i, "") || null;
  const roles = getRolesFromToken(token);

  const items = listVoicebox();
  const isAdminOrDirector = roles.some((r) => /(ADMIN|GENERAL_DIRECTOR|DIRECTOR|SUPERUSER)/.test(r));
  const isDeptHead = roles.some((r) => /(DEPARTMENT_HEAD|DEPT_HEAD)/.test(r));
  const isEmployee = roles.some((r) => /(EMPLOYEE|STAFF)/.test(r));

  let payload: any = null;
  try { payload = token ? decodeJwt(token) : null; } catch { payload = null; }
  const submitterId = payload?.sub as (string | undefined);
  const dept = (payload?.department as string | undefined) || "";

  let filtered = items;
  if (isAdminOrDirector) {
    filtered = items;
  } else if (isDeptHead) {
    filtered = dept ? items.filter((i) => (i.department || "").toLowerCase() === String(dept).toLowerCase()) : items;
  } else if (isEmployee) {
    filtered = submitterId ? items.filter((i) => i.submitterId === submitterId) : [];
  } else {
    filtered = [];
  }

  return NextResponse.json({ items: filtered });
}

export async function POST(req: Request) {
  try {
    const token = (await req.headers.get("authorization"))?.replace(/^Bearer\s+/i, "") || null;
    const roles = getRolesFromToken(token);
    const body = await req.json();

    const now = new Date().toISOString();

    const entry: VoiceboxEntry = {
      id: (globalThis as any).crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      feedbackType: body.feedbackType,
      identityType: body.identityType,
      anonymous: !!body.anonymous,
      subject: body.subject,
      description: body.description,
      incidentAt: body.incidentAt,
      location: body.location,
      staffInvolved: body.staffInvolved,
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      desiredAction: body.desiredAction,
      receiver: body.receiver,
      submitterId: body.submitterId,
      fullName: body.fullName,
      contact: body.contact,
      officeOrUnit: body.officeOrUnit,
      address: body.address,
      status: "submitted",
      department: body.department,
      assignedTo: undefined,
      priority: body.priority === "high" ? "high" : "normal",
      createdByRole: roles[0] || "EMPLOYEE",
      createdAt: now,
      updatedAt: now,
    };

    addVoicebox(entry);
    return NextResponse.json({ item: entry }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Invalid request" }, { status: 400 });
  }
}
