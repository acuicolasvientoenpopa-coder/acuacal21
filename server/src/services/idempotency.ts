import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const REQUEST_CACHE = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

function cleanCache() {
  const now = Date.now();
  for (const [key, val] of REQUEST_CACHE) {
    if (now - val.timestamp > CACHE_TTL) REQUEST_CACHE.delete(key);
  }
}

setInterval(cleanCache, 60 * 60 * 1000);

export async function checkAndMarkEventIdempotent(
  eventId: string,
  source: string
): Promise<{ alreadyProcessed: boolean; error?: string }> {
  try {
    const admin = getAdminClient();
    const { data: existing, error } = await admin
      .from("ProcessedEvent")
      .select("eventId, status, error")
      .eq("eventId", eventId)
      .maybeSingle();

    if (error) {
      console.error(`[IDEMPOTENCY] Error checking ${eventId}:`, error.message);
      return { alreadyProcessed: false, error: error.message };
    }

    if (existing) {
      console.log(`[IDEMPOTENCY] Event ${eventId} already processed (${existing.status})`);
      return { alreadyProcessed: true };
    }

    const { error: insertErr } = await admin.from("ProcessedEvent").insert({
      eventId,
      source,
      type: source === "onvo" ? "webhook" : "internal",
      status: "processing",
      processedAt: new Date().toISOString(),
    });

    if (insertErr) {
      if (insertErr.code === "23505") {
        console.log(`[IDEMPOTENCY] Event ${eventId} processed concurrently, ignoring`);
        return { alreadyProcessed: true };
      }
      console.error(`[IDEMPOTENCY] Error marking ${eventId}:`, insertErr.message);
      return { alreadyProcessed: false, error: insertErr.message };
    }

    return { alreadyProcessed: false };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[IDEMPOTENCY] Exception checking ${eventId}:`, msg);
    return { alreadyProcessed: false, error: msg };
  }
}

export async function markProcessedEventDone(eventId: string, status: string, error?: string): Promise<void> {
  try {
    const admin = getAdminClient();
    await admin.from("ProcessedEvent").update({ status, error }).eq("eventId", eventId);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[IDEMPOTENCY] Error updating ${eventId}:`, msg);
  }
}

export function generateRequestId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function checkRequestIdempotent(
  requestId: string,
  userId: string,
  table: string,
  windowMs = 5000
): Promise<{ isDuplicate: boolean }> {
  const cached = REQUEST_CACHE.get(requestId);
  if (cached) {
    return { isDuplicate: true };
  }

  REQUEST_CACHE.set(requestId, { data: null, timestamp: Date.now() });
  setTimeout(() => REQUEST_CACHE.delete(requestId), windowMs);

  return { isDuplicate: false };
}

export async function markEventFailed(eventId: string, error: string): Promise<void> {
  return markProcessedEventDone(eventId, "failed", error);
}

export async function markEventSuccess(eventId: string): Promise<void> {
  return markProcessedEventDone(eventId, "success");
}
