import { enqueue, scheduleProcess } from "./sync";
import { API_URL } from "@/utils/config";

const BASE = API_URL;

async function request(token: string, method: string, path: string, body?: unknown) {
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

export function api(token: string) {
  return {
    get: (path: string) => request(token, "GET", path),
    post: (path: string, body: unknown) => request(token, "POST", path, body),
    put: (path: string, body: unknown) => request(token, "PUT", path, body),
    del: (path: string) => request(token, "DELETE", path),
    enqueue: (method: "POST" | "PUT" | "DELETE", path: string, body?: unknown) =>
      enqueue({ method, path, body }),
    scheduleProcess: () => scheduleProcess(BASE, token),
  };
}
