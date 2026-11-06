import { NextResponse } from "next/server";
import { decodeJwt } from "@/app/lib/auth";
import { getVoicebox, updateVoicebox } from "@/app/lib/voiceboxStore";

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

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const req = _req;
  const token = (await req.headers.get("authorization"))?.replace(/^Bearer\s+/i, "") || null;
  const roles = getRolesFromToken(token);
  const isAdminOrDirector = roles.some((r) => /(ADMIN|GENERAL_DIRECTOR|DIRECTOR|SUPERUSER)/.test(r));
  const isDeptHead = roles.some((r) => /(DEPARTMENT_HEAD|DEPT_HEAD)/.test(r));

  if (!isAdminOrDirector && !isDeptHead) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = getVoicebox(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const patch = await req.json();
  const allowed: any = {};
  if (typeof patch.status === "string") allowed.status = patch.status;
  if (typeof patch.assignedTo === "string") allowed.assignedTo = patch.assignedTo;
  if (typeof patch.department === "string") allowed.department = patch.department;
  if (typeof patch.priority === "string") allowed.priority = patch.priority;

  const updated = updateVoicebox(id, allowed);
  return NextResponse.json({ item: updated });
}
