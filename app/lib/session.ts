// session.ts - simple client-side auth session storage helpers
import { decodeJwt, getCurrentUserRoles } from "./auth";

export type StoredUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  userType?: string;
  departmentId?: string | null;
  departmentName?: string | null;
  [key: string]: any; // allow extra fields returned by backend
};

const KEY_TOKEN_PRIMARY = "accessToken";
const KEY_TOKEN_ALT_1 = "jwt";
const KEY_TOKEN_ALT_2 = "token";
const KEY_USER = "auth:user";
const KEY_PAYLOAD = "auth:payload";
const KEY_TS = "auth:ts";

export function saveAuthSession(token: string, user?: StoredUser | null) {
  if (typeof window === "undefined") return;
  try {
    // Keep existing app's token keys for compatibility
    window.localStorage.setItem(KEY_TOKEN_PRIMARY, token);
    window.localStorage.setItem(KEY_TOKEN_ALT_1, token);
    window.localStorage.setItem(KEY_TOKEN_ALT_2, token);

    // Persist backend user object if provided
    if (user) {
      window.localStorage.setItem(KEY_USER, JSON.stringify(user));
    }

    // Persist decoded payload for quick access
    const payload = decodeJwt(token);
    if (payload) {
      window.localStorage.setItem(KEY_PAYLOAD, JSON.stringify(payload));
    }

    window.localStorage.setItem(KEY_TS, String(Date.now()));
  } catch (e) {
    // non-fatal
    // eslint-disable-next-line no-console
    console.warn("saveAuthSession failed:", e);
  }
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY_USER);
    window.localStorage.removeItem(KEY_PAYLOAD);
    window.localStorage.removeItem(KEY_TS);
    // Don't remove tokens here in case the app controls sign-out elsewhere.
  } catch {}
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.localStorage.getItem(KEY_TOKEN_PRIMARY) ||
    window.localStorage.getItem(KEY_TOKEN_ALT_1) ||
    window.localStorage.getItem(KEY_TOKEN_ALT_2)
  );
}

export function getAuthUser<T extends StoredUser = StoredUser>(): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY_USER);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function getAuthPayload<T extends Record<string, any> = Record<string, any>>(): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY_PAYLOAD);
    if (raw) return JSON.parse(raw) as T;
    // Fallback: decode from token if payload missing
    const token = getAuthToken();
    return token ? (decodeJwt(token) as T | null) : null;
  } catch {
    return null;
  }
}

export function getDepartmentInfo(): { id: string | null; name: string | null } {
  const user = getAuthUser();
  const payload = getAuthPayload();
  const id = (user?.departmentId ?? payload?.departmentId ?? null) as string | null;
  const name = (user?.departmentName ?? payload?.departmentName ?? null) as string | null;
  return { id, name };
}

export function getNormalizedRoles(): string[] {
  return getCurrentUserRoles();
}

// Optional: a tiny subscription to cross-tab changes
export function subscribeAuthChanges(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = (ev: StorageEvent) => {
    if (!ev.key || [KEY_USER, KEY_PAYLOAD, KEY_TOKEN_PRIMARY, KEY_TOKEN_ALT_1, KEY_TOKEN_ALT_2, KEY_TS].includes(ev.key)) {
      callback();
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
