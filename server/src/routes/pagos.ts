import { Router, Request, Response } from "express";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

export const pagosRouter = Router();

const ONVO_API = "https://api.onvopay.com/v1";
const ONVO_SECRET_KEY = process.env.ONVO_SECRET_KEY ?? "";
const ONVO_WEBHOOK_SECRET = process.env.ONVO_WEBHOOK_SECRET ?? "";
const FRONTEND_URL = process.env.CORS_ORIGIN ?? "https://acuacal21.pages.dev";

const PRICE_IDS: Record<string, string> = {
  pro_monthly: process.env.ONVO_PRICE_PRO_MONTHLY ?? "",
  enterprise_monthly: process.env.ONVO_PRICE_ENTERPRISE_MONTHLY ?? "",
};

const ROLES_BY_PLAN: Record<string, string[]> = {
  free: ["productor"],
  pro: ["productor", "tecnico"],
  enterprise: ["admin", "productor", "tecnico"],
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
    console.error("Error creando checkout:", err);
    res.status(500).json({ error: err.message || "Error al crear sesión de pago" });
  }
});

pagosRouter.post("/webhook", async (req: Request, res: Response) => {
  const secret = req.headers["x-webhook-secret"] as string;
  if (!secret || secret !== ONVO_WEBHOOK_SECRET) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }

  const event: any = req.body;
  console.log("Webhook recibido:", event.type);

  async function updateUserPlan(userId: string, plan: string) {
    const admin = getAdminClient();
    const { data: existing } = await admin.auth.admin.getUserById(userId);
    const currentMeta = existing?.user?.user_metadata || {};
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: { ...currentMeta, plan },
    });
  }

  try {
    if (event.type === "checkout-session.succeeded") {
      const { metadata } = event.data;
      if (metadata?.userId && metadata?.plan) {
        await updateUserPlan(metadata.userId, metadata.plan);
        console.log(`Plan actualizado a ${metadata.plan} para usuario ${metadata.userId}`);
      }
    }

    if (event.type === "subscription.renewal.succeeded") {
      const { metadata } = event.data;
      if (metadata?.userId && metadata?.plan) {
        await updateUserPlan(metadata.userId, metadata.plan);
        console.log(`Suscripción renovada: ${metadata.plan} para usuario ${metadata.userId}`);
      }
    }

    if (event.type === "subscription.renewal.failed") {
      const { metadata } = event.data;
      if (metadata?.userId) {
        console.log(`Renovación fallida para usuario ${metadata.userId}`);
        await updateUserPlan(metadata.userId, "free");
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error("Error procesando webhook:", err);
    res.status(500).json({ error: "Error procesando webhook" });
  }
});

const rolSchema = z.object({
  rol: z.enum(["productor", "tecnico", "admin"]),
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
    const allowed = ROLES_BY_PLAN[currentPlan] || ["productor"];

    if (!allowed.includes(parsed.data.rol)) {
      res.status(403).json({ error: `Rol no disponible en el plan ${currentPlan}. Roles válidos: ${allowed.join(", ")}` });
      return;
    }

    await admin.auth.admin.updateUserById(uid, {
      user_metadata: { ...meta, rol: parsed.data.rol },
    });

    res.json({ rol: parsed.data.rol });
  } catch (err: any) {
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
