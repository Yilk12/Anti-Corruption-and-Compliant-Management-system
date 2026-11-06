export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.localStorage.getItem("accessToken") ||
    window.localStorage.getItem("jwt") ||
    window.localStorage.getItem("token") ||
    null
  );
}

export type ApiFetchOptions = {
  adminOverride?: boolean;
};

export async function apiFetch(input: string, init: RequestInit = {}, opts: ApiFetchOptions = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (opts.adminOverride) headers.set('x-admin', '1');
  const doFetch = () => fetch(input, { ...init, headers, credentials: init.credentials ?? "include", cache: init.cache ?? "no-store" });
  let res = await doFetch();
  if (res.status === 401) {
    // Try refresh (cookie-based). If succeeds, retry once.
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      await fetch(`${base}/api/v1/auth/refresh`, { method: 'POST', credentials: 'include' });
      res = await doFetch();
    } catch {
      // fallthrough; return original 401
    }
  }
  return res;
}

// Backward-compatible helper name
export function apiFetchLocal(input: string, init: RequestInit = {}): Promise<Response> {
  return apiFetch(input, init);
}

// Base URL from env for direct backend calls in the browser and server components
const PUBLIC_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export function apiFetchBackend(path: string, init: RequestInit = {}, opts: ApiFetchOptions = {}): Promise<Response> {
  const url = `${PUBLIC_BASE}${path}`;
  return apiFetch(url, { ...init, credentials: init.credentials ?? 'include' }, opts);
}
