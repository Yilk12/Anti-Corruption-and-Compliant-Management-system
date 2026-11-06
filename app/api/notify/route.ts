import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/app/api/_notify";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const to = body?.to as string | { email?: string; name?: string };
    const subject = String(body?.subject || "Notification");
    const html = String(body?.html || "");

    if (!to) {
      return NextResponse.json({ error: "Missing 'to'" }, { status: 400 });
    }

    const result = await sendEmail(to as any, subject, html);
    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to send" }, { status: 500 });
  }
}
