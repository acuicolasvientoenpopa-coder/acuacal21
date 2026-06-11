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
const DB_VERSION = 1;
const STORE = "queue";
const MAX_RETRIES = 5;

let dbPromise: Promise<IDBPDatabase> | null = null;
let listeners: Array<() => void> = [];

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
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
  const db = await getDb();
  const all = await db.getAll(STORE);
  all.sort((a, b) => a.timestamp - b.timestamp);

  for (const op of all) {
    try {
      const res = await fetch(`${apiUrl}${op.path}`, {
        method: op.method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: op.body ? JSON.stringify(op.body) : undefined,
      });
      if (res.ok || res.status === 404) {
        await db.delete(STORE, op.id);
        notify();
      } else {
        op.retries++;
        op.lastError = `HTTP ${res.status}`;
        if (op.retries >= MAX_RETRIES) {
          await db.delete(STORE, op.id);
        } else {
          await db.put(STORE, op);
        }
      }
    } catch (err: any) {
      op.retries++;
      op.lastError = err.message;
      if (op.retries >= MAX_RETRIES) {
        await db.delete(STORE, op.id);
      } else {
        await db.put(STORE, op);
      }
    }
  }

  processing = false;
  notify();
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
  const item: SyncOp = {
    ...op,
    id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
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
