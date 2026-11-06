import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

function buildTargetUrl(pathSegments: string[], searchParams: URLSearchParams): string {
  const base = `${BACKEND_URL}/api/${pathSegments.join("/")}`
  const qs = searchParams.toString()
  return qs ? `${base}?${qs}` : base
}

function buildForwardHeaders(req: NextRequest): HeadersInit {
  const headers = new Headers()
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (["host", "connection", "content-length"].includes(lower)) return
    headers.set(key, value)
  })
  // Ensure content-type is preserved when sending a body
  const contentType = req.headers.get("content-type")
  if (contentType) headers.set("content-type", contentType)
  return headers
}

async function proxy(request: NextRequest, context: { params: { path?: string[] } }) {
  const method = request.method.toUpperCase()
  const pathSegments = context.params.path ?? []
  const targetUrl = buildTargetUrl(pathSegments, request.nextUrl.searchParams)

  const hasBody = !["GET", "HEAD"].includes(method)
  const body = hasBody ? await request.arrayBuffer() : undefined

  const resp = await fetch(targetUrl, {
    method,
    headers: buildForwardHeaders(request),
    body: body ? Buffer.from(body) : undefined,
    // Include cookies when proxying to same-origin backend if needed
    credentials: "include",
  })

  const respHeaders = new Headers()
  resp.headers.forEach((value, key) => {
    // Filter out hop-by-hop headers
    if (["connection", "transfer-encoding"].includes(key.toLowerCase())) return
    respHeaders.set(key, value)
  })

  const respArrayBuffer = await resp.arrayBuffer()
  return new NextResponse(respArrayBuffer, {
    status: resp.status,
    statusText: resp.statusText,
    headers: respHeaders,
  })
}

export const GET = proxy
export const POST = proxy
export const PATCH = proxy
export const PUT = proxy
export const DELETE = proxy
export const OPTIONS = proxy


