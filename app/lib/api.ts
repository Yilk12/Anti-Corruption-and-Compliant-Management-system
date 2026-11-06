export const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
export const API_BASE_URL = `/api`
const API_BASE = `${API_ORIGIN}${API_BASE_URL}`

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {}
  const token =
    window.localStorage.getItem("accessToken") ||
    window.localStorage.getItem("jwt") ||
    window.localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Request deduplication cache
const pendingRequests = new Map<string, Promise<any>>()

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set("Content-Type", "application/json")
  const auth = getAuthHeader()
  for (const [k, v] of Object.entries(auth)) headers.set(k, v)

  // Deduplicate identical in-flight requests
  const requestKey = `GET:${path}:${JSON.stringify(init || {})}`
  
  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey) as Promise<T>
  }

  const requestPromise = (async () => {
    try {
      const startTime = performance.now()
      
      const res = await fetch(`${API_BASE}${path}`, {
        ...init,
        credentials: "include",
        headers,
        // Use default cache for GET requests to allow browser caching
        cache: "default",
      })
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Log slow requests for monitoring
      if (duration > 1000) {
        console.warn(`Slow API request: GET ${path} took ${duration.toFixed(2)}ms`)
      }
      
      if (!res.ok) {
        throw new Error(`GET ${path} failed: ${res.status}`)
      }
      
      return res.json()
    } finally {
      // Clean up pending request cache
      pendingRequests.delete(requestKey)
    }
  })()
  
  pendingRequests.set(requestKey, requestPromise)
  return requestPromise as Promise<T>
}

export async function apiPost<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set("Content-Type", "application/json")
  const auth = getAuthHeader()
  for (const [k, v] of Object.entries(auth)) headers.set(k, v)

  const startTime = performance.now()
  
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    ...init,
    credentials: "include",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  
  const endTime = performance.now()
  const duration = endTime - startTime
  
  // Log slow requests for monitoring
  if (duration > 2000) {
    console.warn(`Slow API request: POST ${path} took ${duration.toFixed(2)}ms`)
  }
  
  if (!res.ok) {
    // Try to surface backend error message if available
    let message = `POST ${path} failed: ${res.status}`
    try {
      const text = await res.text()
      if (text) {
        try {
          const data: any = JSON.parse(text)
          if (typeof data?.message === "string") message = data.message
          else if (Array.isArray(data?.message) && data.message.length > 0) message = String(data.message[0])
          else if (typeof data?.error === "string") message = data.error
          else message = text
        } catch {
          message = text
        }
      }
    } catch {}
    throw new Error(message)
  }
  return res.json()
}

export async function apiPatch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set("Content-Type", "application/json")
  const auth = getAuthHeader()
  for (const [k, v] of Object.entries(auth)) headers.set(k, v)

  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    ...init,
    credentials: "include",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    throw new Error(`PATCH ${path} failed: ${res.status}`)
  }
  return res.json()
}

export async function apiPut<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set("Content-Type", "application/json")
  const auth = getAuthHeader()
  for (const [k, v] of Object.entries(auth)) headers.set(k, v)

  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    ...init,
    credentials: "include",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    throw new Error(`PUT ${path} failed: ${res.status}`)
  }
  return res.json()
}

export async function apiDelete<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set("Content-Type", "application/json")
  const auth = getAuthHeader()
  for (const [k, v] of Object.entries(auth)) headers.set(k, v)

  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    ...init,
    credentials: "include",
    headers,
  })
  if (!res.ok) {
    throw new Error(`DELETE ${path} failed: ${res.status}`)
  }
  return res.json()
}

// Performance monitoring utilities
export const performanceMonitor = {
  // Measure API response times
  measureApiCall: async <T>(name: string, apiCall: () => Promise<T>): Promise<T> => {
    const start = performance.now()
    try {
      const result = await apiCall()
      const end = performance.now()
      const duration = end - start
      
      if (duration > 1000) {
        console.warn(`Performance warning: ${name} took ${duration.toFixed(2)}ms`)
      }
      
      return result
    } catch (error) {
      const end = performance.now()
      const duration = end - start
      console.error(`Performance error: ${name} failed after ${duration.toFixed(2)}ms`, error)
      throw error
    }
  },
  
  // Clear request cache if needed
  clearRequestCache: () => {
    pendingRequests.clear()
  }
}

// Utility for optimized settings API calls
export const settingsApi = {
  get: () => performanceMonitor.measureApiCall('settings:list', () => apiGet('/settings')),
  update: (settings: Record<string, string>) => 
    performanceMonitor.measureApiCall('settings:update', () => apiPost('/settings/bulk', settings))
}

