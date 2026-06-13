import { openDB, type IDBPDatabase } from "idb";

export interface SyncOp {
  id: string;
  method: "POST" | "PUT" | "DELETE";
  path: string;
  body?: unknown;
  timestamp: number;
  retries: number;
  lastError?: string;
}

const DB_NAME = "acuacal_sync";
const DB_VERSION = 2;
const STORE = "queue";
const FAILED_STORE = "failed";
const MAX_RETRIES = 5;
const FETCH_TIMEOUT = 15000;

let dbPromise: Promise<IDBPDatabase> | null = null;
let listeners: Array<() => void> = [];

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(FAILED_STORE)) {
          db.createObjectStore(FAILED_STORE, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export function onQueueChange(fn: () => void) {
  listeners.push(fn);
  return () => { listeners = listeners.filter((l) => l !== fn); };
}

function notify() {
  listeners.forEach((fn) => fn());
}

let processing = false;

async function doProcess(apiUrl: string, token: string) {
  if (processing) return;
  processing = true;
  try {
    const db = await getDb();
    const all = await db.getAll(STORE);
    all.sort((a, b) => a.timestamp - b.timestamp);

    for (const op of all) {
      try {
        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT);
        const res = await fetch(`${apiUrl}${op.path}`, {
          method: op.method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "X-Request-ID": op.id,
          },
          body: op.body ? JSON.stringify(op.body) : undefined,
          signal: ac.signal,
        });
        clearTimeout(timer);

        if (res.ok) {
          await db.delete(STORE, op.id);
          notify();
        } else if (res.status === 404) {
          await db.delete(STORE, op.id);
          notify();
        } else if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          console.error(`[Sync] Error permanente ${res.status} en ${op.method} ${op.path}: no se reintentará`);
          await db.delete(STORE, op.id);
          await db.put(FAILED_STORE, { ...op, lastError: `HTTP ${res.status} (permanente)` });
          notify();
        } else {
          op.retries++;
          op.lastError = `HTTP ${res.status}`;
          if (op.retries >= MAX_RETRIES) {
            console.error(`[Sync] Operación ${op.id} falló tras ${MAX_RETRIES} reintentos: HTTP ${res.status}`);
            await db.delete(STORE, op.id);
            await db.put(FAILED_STORE, op);
          } else {
            await db.put(STORE, op);
          }
          notify();
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          console.error(`[Sync] Timeout en ${op.method} ${op.path} (${FETCH_TIMEOUT}ms)`);
        } else {
          console.error(`[Sync] Error en ${op.method} ${op.path}:`, err?.message || err);
        }
        op.retries++;
        op.lastError = err?.message || String(err);
        if (op.retries >= MAX_RETRIES) {
          console.error(`[Sync] Operación ${op.id} falló tras ${MAX_RETRIES} reintentos:`, op.lastError);
          await db.delete(STORE, op.id);
          await db.put(FAILED_STORE, op);
        } else {
          await db.put(STORE, op);
        }
        notify();
      }
    }
  } finally {
    processing = false;
    notify();
  }
}

let scheduled = false;

export function scheduleProcess(apiUrl: string, token: string) {
  if (scheduled) return;
  scheduled = true;
  setTimeout(() => {
    scheduled = false;
    doProcess(apiUrl, token);
  }, 1000);
}

export async function enqueue(op: Omit<SyncOp, "id" | "timestamp" | "retries">) {
  const db = await getDb();
  const all = await db.getAll(STORE);
  const dup = all.find(
    (e) => e.path === op.path && e.method === op.method &&
          JSON.stringify(e.body) === JSON.stringify(op.body)
  );
  if (dup) {
    console.log(`[Sync] Operación duplicada ignorada: ${op.method} ${op.path}`);
    return dup;
  }
  const id = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `sync_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const item: SyncOp = {
    ...op,
    id,
    timestamp: Date.now(),
    retries: 0,
  };
  await db.put(STORE, item);
  notify();
  return item;
}

export async function getQueueLength(): Promise<number> {
  const db = await getDb();
  const all = await db.getAll(STORE);
  return all.length;
}

export async function getQueue(): Promise<SyncOp[]> {
  const db = await getDb();
  const all = await db.getAll(STORE);
  return all.sort((a, b) => a.timestamp - b.timestamp);
}

export async function removeFromQueue(id: string) {
  const db = await getDb();
  await db.delete(STORE, id);
  notify();
}

export async function clearQueue() {
  const db = await getDb();
  await db.clear(STORE);
  notify();
}

export async function getFailedOps(): Promise<SyncOp[]> {
  const db = await getDb();
  const all = await db.getAll(FAILED_STORE);
  return all.sort((a, b) => a.timestamp - b.timestamp);
}

export async function retryFailedOp(id: string) {
  const db = await getDb();
  const op = await db.get(FAILED_STORE, id);
  if (op) {
    op.retries = 0;
    op.lastError = "";
    await db.delete(FAILED_STORE, id);
    await db.put(STORE, op);
    notify();
  }
}

export async function retryAllFailed() {
  const db = await getDb();
  const failed = await db.getAll(FAILED_STORE);
  for (const op of failed) {
    op.retries = 0;
    op.lastError = "";
    await db.delete(FAILED_STORE, op.id);
    await db.put(STORE, op);
  }
  notify();
}

export async function clearFailedOps() {
  const db = await getDb();
  await db.clear(FAILED_STORE);
  notify();
}

export async function getFailedCount(): Promise<number> {
  const db = await getDb();
  const all = await db.getAll(FAILED_STORE);
  return all.length;
}
