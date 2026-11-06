import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const origin = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
    if (origin) {
      try {
        const res = await fetch(`${origin.replace(/\/$/, "")}/api/auth/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          return NextResponse.json({ message: j?.message || `Backend error ${res.status}` }, { status: 502 });
        }
        return NextResponse.json(await res.json().catch(() => ({ ok: true })));
      } catch (e: any) {
        return NextResponse.json({ message: e?.message || "Backend unavailable" }, { status: 502 });
      }
    }

    // Fallback stub when BACKEND_URL not configured
    return NextResponse.json({ ok: true, message: "If an account exists, a reset link has been sent." });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Unexpected error" }, { status: 500 });
  }
}
