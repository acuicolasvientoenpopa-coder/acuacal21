import { Router, Request, Response } from "express";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { checkAndMarkEventIdempotent, markProcessedEventDone } from "../services/idempotency.js";
import { createEventLog, markEventSuccess, markEventFailed, verifyRecordExists } from "../services/eventLog.js";

export const pagosRouter = Router();

const ONVO_API = "https://api.onvopay.com/v1";
const ONVO_SECRET_KEY = process.env.ONVO_SECRET_KEY ?? "";
const ONVO_WEBHOOK_SECRET = process.env.ONVO_WEBHOOK_SECRET;
const FRONTEND_URL = process.env.CORS_ORIGIN ?? "https://app.acuical.com";

const PRICE_IDS: Record<string, string> = {
  pro_monthly: process.env.ONVO_PRICE_PRO_MONTHLY ?? "",
  enterprise_monthly: process.env.ONVO_PRICE_ENTERPRISE_MONTHLY ?? "",
};

const ROLES_BY_PLAN: Record<string, string[]> = {
  free: ["gestor"],
  pro: ["gestor", "tecnico"],
  enterprise: ["admin", "gestor", "tecnico"],
};

function getAdminClient() {
  return createClient(
    process.env.SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function onvoPost(path: string, body: unknown) {
  const res = await fetch(`${ONVO_API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ONVO_SECRET_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ONVO API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function onvoGet(path: string) {
  const res = await fetch(`${ONVO_API}${path}`, {
    headers: { Authorization: `Bearer ${ONVO_SECRET_KEY}` },
  });
  if (!res.ok) return null;
  return res.json();
}

const checkoutSchema = z.object({
  priceId: z.enum(["pro_monthly", "enterprise_monthly"]),
});

pagosRouter.post("/checkout", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
      return;
    }

    const onvoPriceId = PRICE_IDS[parsed.data.priceId];
    if (!onvoPriceId) {
      res.status(500).json({ error: "Precio no configurado. Contactá al administrador." });
      return;
    }

    const session: any = await onvoPost("/checkout/sessions/one-time-link", {
      mode: "payment",
      successUrl: `${FRONTEND_URL}/?checkout=success`,
      cancelUrl: `${FRONTEND_URL}/planes`,
      metadata: {
        userId: req.userId,
        plan: parsed.data.priceId === "pro_monthly" ? "pro" : "enterprise",
      },
      lineItems: [{ priceId: onvoPriceId, quantity: 1 }],
    });

    res.json({ url: session.url, id: session.id });
  } catch (err: any) {
    console.error("[CHECKOUT] Error creando checkout:", err);
    res.status(500).json({ error: err.message || "Error al crear sesión de pago" });
  }
});

async function updateUserPlan(userId: string, plan: string, subData?: any) {
  const admin = getAdminClient();

  const payload: any = {
    userId,
    plan,
    status: "active",
    onvoSubscriptionId: subData?.id ?? "",
    onvoCustomerId: subData?.customer ?? "",
    currentPeriodStart: subData?.current_period_start
      ? new Date(subData.current_period_start * 1000).toISOString()
      : new Date().toISOString(),
    currentPeriodEnd: subData?.current_period_end
      ? new Date(subData.current_period_end * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const { error: upsertErr } = await admin.from("Subscription").upsert(payload, {
    onConflict: "userId",
    ignoreDuplicates: false,
  });

  if (upsertErr) {
    console.error(`[PAGOS] Error upserting Subscription for user ${userId}:`, upsertErr);
    throw new Error(`Subscription upsert failed: ${upsertErr.message}`);
  }

  const verified = await verifyRecordExists("Subscription", payload.onvoSubscriptionId || "", userId);
  if (!verified) {
    const { data: fallbackCheck } = await admin.from("Subscription")
      .select("id, plan").eq("userId", userId).eq("plan", plan).maybeSingle();
    if (!fallbackCheck) {
      console.error(`[PAGOS] Post-write verification FAILED for user ${userId}, plan ${plan}`);
      throw new Error("Subscription verification failed after write");
    }
  }

  const { data: existing } = await admin.auth.admin.getUserById(userId);
  const currentMeta = existing?.user?.user_metadata || {};
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: { ...currentMeta, plan },
  });

  console.log(`[PAGOS] Subscription activada: user=${userId} plan=${plan}`);
}

pagosRouter.post("/webhook", async (req: Request, res: Response) => {
  const secret = req.headers["x-webhook-secret"] as string;
  if (!secret || !ONVO_WEBHOOK_SECRET || secret !== ONVO_WEBHOOK_SECRET) {
    console.error("[WEBHOOK] Unauthorized webhook attempt");
    res.status(401).json({ error: "No autorizado" });
    return;
  }

  const event: any = req.body;
  const eventId: string = event.id || "";
  console.log(`[WEBHOOK] Evento recibido: ${eventId} type=${event.type}`);

  if (!eventId) {
    console.error("[WEBHOOK] Event sin id, rechazado");
    res.status(400).json({ error: "Event missing id" });
    return;
  }

  const { alreadyProcessed, error: idempError } = await checkAndMarkEventIdempotent(eventId, "onvo");
  if (idempError) {
    console.error(`[WEBHOOK] Error de idempotencia para ${eventId}:`, idempError);
    res.status(500).json({ error: "Error de idempotencia" });
    return;
  }
  if (alreadyProcessed) {
    console.log(`[WEBHOOK] Evento duplicado ignorado: ${eventId}`);
    res.json({ received: true, duplicate: true });
    return;
  }

  try {
    if (event.type === "checkout-session.succeeded") {
      const obj = event.data?.object ?? event.data;
      const metadata = obj?.metadata ?? {};
      if (metadata?.userId && metadata?.plan) {
        const session = await onvoGet(`/checkout/sessions/${obj.id}`);
        if (!session || session.payment_status !== "paid") {
          console.error(`[WEBHOOK] Sesión inválida: ${obj.id}`);
          await markProcessedEventDone(eventId, "failed", "Invalid session");
          res.status(400).json({ error: "Invalid session" });
          return;
        }
        await updateUserPlan(metadata.userId, metadata.plan, obj);
        console.log(`[WEBHOOK] Plan activado: ${metadata.plan} user=${metadata.userId} event=${eventId}`);
      }
    }

    if (event.type === "subscription.renewal.succeeded") {
      const obj = event.data?.object ?? event.data;
      const metadata = obj?.metadata ?? {};
      if (metadata?.userId && metadata?.plan) {
        await updateUserPlan(metadata.userId, metadata.plan, obj);
        console.log(`[WEBHOOK] Suscripción renovada: ${metadata.plan} user=${metadata.userId} event=${eventId}`);
      }
    }

    if (event.type === "subscription.renewal.failed") {
      const obj = event.data?.object ?? event.data;
      const metadata = obj?.metadata ?? {};
      if (metadata?.userId) {
        console.log(`[WEBHOOK] Renovación fallida user=${metadata.userId} event=${eventId}`);
        await updateUserPlan(metadata.userId, "free", obj);
      }
    }

    await markProcessedEventDone(eventId, "success");
    res.json({ received: true });
  } catch (err: any) {
    console.error(`[WEBHOOK] Error procesando evento ${eventId}:`, err);
    await markProcessedEventDone(eventId, "failed", err.message || "Unknown error");
    res.status(500).json({ error: "Error procesando webhook" });
  }
});

const rolSchema = z.object({
  rol: z.enum(["gestor", "tecnico", "admin"]),
});

pagosRouter.post("/rol", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = rolSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
      return;
    }

    const uid = req.userId!;
    const admin = getAdminClient();
    const { data: userData } = await admin.auth.admin.getUserById(uid);
    const meta = userData?.user?.user_metadata || {};
    const currentPlan = (meta.plan as string) || "free";
    const allowed = ROLES_BY_PLAN[currentPlan] || ["gestor"];

    if (!allowed.includes(parsed.data.rol)) {
      res.status(403).json({ error: `Rol no disponible en el plan ${currentPlan}. Roles válidos: ${allowed.join(", ")}` });
      return;
    }

    await admin.auth.admin.updateUserById(uid, {
      user_metadata: { ...meta, rol: parsed.data.rol },
    });

    res.json({ rol: parsed.data.rol });
  } catch (err: any) {
    console.error("[PAGOS] Error al actualizar rol:", err);
    res.status(500).json({ error: err.message || "Error al actualizar rol" });
  }
});

pagosRouter.get("/subscription", requireAuth, async (req: AuthRequest, res: Response) => {
  const { data } = await req.supabase!
    .from("Subscription")
    .select("*")
    .eq("userId", req.userId)
    .order("createdAt", { ascending: false })
    .limit(1);

  res.json({ subscription: data?.[0] ?? null });
});
