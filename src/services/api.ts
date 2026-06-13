import { enqueue, scheduleProcess } from "./sync";
import { API_URL } from "@/utils/config";

const BASE = API_URL;
const FETCH_TIMEOUT = 15000;

function getRequestId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function request<T>(token: string, method: string, path: string, body?: unknown): Promise<T> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Request-ID": getRequestId(),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: ac.signal,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

export function createApi(token: string, baseUrl = BASE) {
  const base = baseUrl;

  const get = <T>(path: string) => request<T>(token, "GET", path);

  const post = <T>(path: string, body: unknown) => request<T>(token, "POST", path, body);

  const put = <T>(path: string, body: unknown) => request<T>(token, "PUT", path, body);

  const del = <T>(path: string) => request<T>(token, "DELETE", path);

  const getWithFallback = async <T>(path: string, lsKey?: string): Promise<T | null> => {
    try {
      const data = await get<T>(path);
      if (lsKey && data !== null) localStorage.setItem(lsKey, JSON.stringify(data));
      return data;
    } catch (err: any) {
      console.warn(`[API] getWithFallback falló para ${path}:`, err?.message || err);
      if (lsKey) {
        const cached = localStorage.getItem(lsKey);
        if (cached) {
          try { return JSON.parse(cached); } catch (e: any) { console.warn(`[API] Error parseando cache ${lsKey}:`, e?.message || e); }
        }
      }
      return null;
    }
  };

  const mutate = async <T = any>(method: "POST" | "PUT" | "DELETE", path: string, body?: unknown) => {
    try {
      const data = await request<T>(token, method, path, body);
      return { ok: true as const, data };
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error(`[API] mutate falló (${method} ${path}):`, msg);

      const statusMatch = msg.match(/HTTP (\d+)/);
      const status = statusMatch ? parseInt(statusMatch[1]) : 0;

      if (status >= 400 && status < 500 && status !== 429) {
        console.error(`[API] Error permanente ${status} en ${method} ${path}: no se encola`);
        return { ok: false as const, permanent: true, error: msg };
      }

      enqueue({ method, path, body });
      scheduleProcess(base, token);
      return { ok: false as const };
    }
  };

  return {
    get,
    post,
    put,
    del,
    getWithFallback,
    mutate,
    enqueue: (m: "POST" | "PUT" | "DELETE", p: string, b?: unknown) => enqueue({ method: m, path: p, body: b }),
    scheduleProcess: () => scheduleProcess(base, token),
  };
}
