import { createClient } from "@supabase/supabase-js";

export type EventType = "INVENTARIO" | "FINANZA" | "BITACORA" | "PAGO" | "ADMIN" | "SYNC";
export type EventStatus = "PENDING" | "SUCCESS" | "FAILED";
export type EventAction = "CREATE" | "UPDATE" | "DELETE" | "UPSERT";

function getAdminClient() {
  return createClient(
    process.env.SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function hashPayload(payload: unknown): string {
  const str = JSON.stringify(payload);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `${hash}`;
}

export async function createEventLog(params: {
  id: string;
  type: EventType;
  action: EventAction;
  userId: string;
  payload?: unknown;
}): Promise<boolean> {
  try {
    const admin = getAdminClient();
    const { error } = await admin.from("EventLog").insert({
      id: params.id,
      type: params.type,
      action: params.action,
      userId: params.userId,
      status: "PENDING",
      payloadHash: params.payload ? hashPayload(params.payload) : null,
    });
    if (error) {
      console.error(`[EVENTLOG] Error creating event ${params.id}:`, error.message);
      return false;
    }
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[EVENTLOG] Exception creating event ${params.id}:`, msg);
    return false;
  }
}

export async function markEventSuccess(id: string): Promise<void> {
  try {
    const admin = getAdminClient();
    await admin.from("EventLog").update({ status: "SUCCESS", updatedAt: new Date().toISOString() }).eq("id", id);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[EVENTLOG] Error marking SUCCESS for ${id}:`, msg);
  }
}

export async function markEventFailed(id: string, error: string): Promise<void> {
  try {
    const admin = getAdminClient();
    await admin.from("EventLog").update({
      status: "FAILED",
      error,
      updatedAt: new Date().toISOString(),
    }).eq("id", id);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[EVENTLOG] Error marking FAILED for ${id}:`, msg);
  }
}

export async function eventExists(id: string): Promise<boolean> {
  try {
    const admin = getAdminClient();
    const { data } = await admin.from("EventLog").select("id").eq("id", id).maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

export async function verifyRecordExists(table: string, id: string, userId: string): Promise<boolean> {
  try {
    const admin = getAdminClient();
    const { data } = await admin.from(table).select("id").eq("id", id).eq("userId", userId).maybeSingle();
    return !!data;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[VERIFY] Error verifying ${table}/${id}:`, msg);
    return false;
  }
}
