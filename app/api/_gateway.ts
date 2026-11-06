import { NextRequest, NextResponse } from "next/server";

// Forwards a Next.js API Route request to the backend NestJS API.
// Preserves method, headers (excluding hop-by-hop/host), body, and query string.
export async function forwardToBackend(req: NextRequest, targetPath: string, init?: RequestInit) {
  const url = new URL(req.url)
  const qs = url.search ? url.search : ""
  // Resolve backend origin with safe defaults
  const explicitOrigin = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '').trim()
  const requestOrigin = (req.nextUrl?.origin) || `${req.headers.get('x-forwarded-proto') || 'http'}://${req.headers.get('host')}`
  const defaultBackend = 'http://localhost:4000'
  const isFrontendOrigin = typeof requestOrigin === 'string' && /:\\s*3000\b|:3000\b/.test(requestOrigin)
  const baseOrigin = (explicitOrigin.length > 0 ? explicitOrigin : (isFrontendOrigin ? defaultBackend : (requestOrigin || defaultBackend)))
  const targetUrl = new URL(targetPath + qs, baseOrigin.replace(/\/$/, '')).toString()

  const headers = new Headers();
  // Copy headers selectively
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (["host", "connection", "content-length"].includes(lower)) return;
    headers.set(key, value);
  });
  // Ensure JSON content-type for JSON bodies
  if (!headers.has("content-type")) headers.set("content-type", "application/json");

  const method = req.method || "GET";

  let body: BodyInit | undefined = undefined;
  if (method !== "GET" && method !== "HEAD") {
    // Attempt to read the body as text; if empty, pass undefined
    const text = await req.text();
    body = text && text.length > 0 ? text : undefined;
  }

  let backendResp: Response;
  try {
    backendResp = await fetch(targetUrl, {
      method,
      headers,
      body,
      // Important to include cookies for session-based auth
      credentials: "include",
      ...init,
    });
  } catch (e: any) {
    return NextResponse.json(
      { message: "Backend unreachable", detail: e?.message || String(e) },
      { status: 502 },
    );
  }

  // Stream response back, preserving status and headers (minus hop-by-hop)
  const resHeaders = new Headers();
  backendResp.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (["transfer-encoding", "connection"].includes(lower)) return;
    resHeaders.set(key, value);
  });

  // If backend sets cookies, forward them
  const setCookie = backendResp.headers.get("set-cookie");
  if (setCookie) resHeaders.set("set-cookie", setCookie);

  // Try to return JSON when possible, otherwise text
  const contentType = backendResp.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await backendResp.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendResp.status, headers: resHeaders });
  }

  const text = await backendResp.text();
  return new NextResponse(text, { status: backendResp.status, headers: resHeaders });
}
