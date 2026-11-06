import { NextRequest, NextResponse } from "next/server";

// Sends SMS via Twilio REST API without SDK
// Env vars required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const to: string = String(body?.to || "").trim();
    const text: string = String(body?.body || "");

    if (!to) return NextResponse.json({ error: "Missing 'to'" }, { status: 400 });
    if (!text) return NextResponse.json({ error: "Missing 'body'" }, { status: 400 });

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM; // e.g., "+12025550123"

    if (!sid || !token || !from) {
      // fail soft so dev envs don't break
      console.log("[sms] noop (missing envs)", { to, text });
      return NextResponse.json({ ok: false, reason: "noop" });
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`;
    const params = new URLSearchParams();
    params.append("To", to);
    params.append("From", from);
    params.append("Body", text);

    const auth = Buffer.from(`${sid}:${token}`).toString("base64");

    const r = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: params.toString(),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return NextResponse.json({ error: data || "Failed to send" }, { status: r.status });
    }

    return NextResponse.json({ ok: true, sid: data?.sid || null });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
