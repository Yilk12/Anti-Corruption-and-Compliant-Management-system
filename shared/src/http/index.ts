import { logger } from "../logging/logger";

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

export async function apiFetch<T>(
  url: string,
  init?: RequestInit & { parseJson?: boolean },
): Promise<T> {
  const res = await fetch(url, init);
  const text = await res.text();
  const parse = init?.parseJson !== false;

  let data: any = undefined;
  if (parse) {
    try {
      data = text ? JSON.parse(text) : undefined;
    } catch (e) {
      logger.warn("Failed to parse JSON response", { url, e });
    }
  } else {
    data = text;
  }

  if (!res.ok) {
    const err: ApiError = {
      status: res.status,
      message: (data && (data.message || data.error)) || res.statusText || "Request failed",
      details: data,
    };
    throw err;
  }
  return data as T;
}

export function buildUrl(base: string, path: string) {
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}
