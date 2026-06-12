import { enqueue, scheduleProcess } from "./sync";
import { API_URL } from "@/utils/config";

const BASE = API_URL;

async function request<T>(token: string, method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
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
    } catch {
      if (lsKey) {
        const cached = localStorage.getItem(lsKey);
        if (cached) {
          try { return JSON.parse(cached); } catch { /* ignore parse error */ }
        }
      }
      return null;
    }
  };

  const mutate = async <T = any>(method: "POST" | "PUT" | "DELETE", path: string, body?: unknown) => {
    try {
      const data = await request<T>(token, method, path, body);
      return { ok: true as const, data };
    } catch {
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
