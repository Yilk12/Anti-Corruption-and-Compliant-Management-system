import { NextResponse } from "next/server";
import { decodeJwt } from "@/app/lib/auth";
import { addComplaint, listComplaints } from "@/app/lib/complaintsStore";
import type { Complaint, ComplaintCategory } from "@/backend/types/complaints";

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

function generateRef(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CSC-${y}${m}-${rand}`;
}

export async function GET(req: Request) {
  const token = (await req.headers.get("authorization"))?.replace(/^Bearer\s+/i, "") || null;
  const roles = getRolesFromToken(token);
  const items = listComplaints();

  const isDirector = roles.some((r) => /(GENERAL_DIRECTOR|DIRECTOR|ADMIN|SUPERUSER)/.test(r));
  const isDeptHead = roles.some((r) => /(DEPARTMENT_HEAD|DEPT_HEAD)/.test(r));
  const isEmployee = roles.some((r) => /(EMPLOYEE|STAFF)/.test(r));

  let payload: any = null;
  try { payload = token ? decodeJwt(token) : null; } catch { payload = null; }
  const submitterId = payload?.sub as (string | undefined);
  const dept = (payload?.department as string | undefined) || "";

  let filtered = [] as Complaint[];
  if (isDirector) {
    filtered = items;
  } else if (isDeptHead) {
    filtered = dept ? items.filter(i => (i.department || "").toLowerCase() === String(dept).toLowerCase()) : items;
  } else if (isEmployee) {
    filtered = submitterId ? items.filter(i => i.createdBySub === submitterId) : [];
  } else {
    filtered = [];
  }

  // Basic filters by query params
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const category = url.searchParams.get('category') as ComplaintCategory | null;
  if (status) filtered = filtered.filter(i => i.status === status);
  if (category) filtered = filtered.filter(i => i.category === category);

  return NextResponse.json({ items: filtered });
}

export async function POST(req: Request) {
  try {
    const token = (await req.headers.get("authorization"))?.replace(/^Bearer\s+/i, "") || null;
    const roles = getRolesFromToken(token);
    const body = await req.json();

    const now = new Date().toISOString();
    const entry: Complaint = {
      id: (globalThis as any).crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      ref: generateRef(),
      fullName: body.fullName,
      employeeId: body.employeeId,
      position: body.position,
      officeOrDepartment: body.officeOrDepartment,
      roleDeclared: body.roleDeclared,
      category: body.category,
      categoryOtherText: body.categoryOtherText,
      subject: body.subject,
      incidentAt: body.incidentAt,
      location: body.location,
      personsInvolved: body.personsInvolved,
      description: body.description,
      impact: body.impact,
      desiredAction: body.desiredAction,
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      confidential: !!body.confidential,
      anonymous: !!body.anonymous,
      declaration: !!body.declaration,
      consent: !!body.consent,
      status: "new",
      department: body.department,
      assignedTo: undefined,
      createdBySub: body.createdBySub,
      createdByRoles: roles,
      createdAt: now,
      updatedAt: now,
    };

    addComplaint(entry);
    return NextResponse.json({ item: entry }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Invalid request" }, { status: 400 });
  }
}
