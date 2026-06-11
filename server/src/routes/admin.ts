import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { createClient } from "@supabase/supabase-js";

export const adminRouter = Router();

adminRouter.use(requireAuth);

const OWNER_EMAIL = "acuicolasvientoenpopa@gmail.com";

function getAdminClient() {
  return createClient(
    process.env.SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

adminRouter.use(async (req: AuthRequest, res: Response, next) => {
  const { data: users } = await req.supabase!
    .from("User")
    .select("email")
    .eq("id", req.userId)
    .single();

  if (!users || (users as any).email !== OWNER_EMAIL) {
    res.status(403).json({ error: "No autorizado" });
    return;
  }
  next();
});

adminRouter.get("/users", async (req: AuthRequest, res: Response) => {
  const { data, error } = await req.supabase!
    .from("User")
    .select("*")
    .order("createdAt", { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

adminRouter.get("/stats", async (req: AuthRequest, res: Response) => {
  const { data: users, error: uErr } = await req.supabase!
    .from("User")
    .select("id");

  if (uErr) { res.status(500).json({ error: uErr.message }); return; }

  const { data: fincas, error: fErr } = await req.supabase!
    .from("Finca")
    .select("id, userId");

  if (fErr) { res.status(500).json({ error: fErr.message }); return; }

  const { data: bitacoras, error: bErr } = await req.supabase!
    .from("Bitacora")
    .select("id");

  if (bErr) { res.status(500).json({ error: bErr.message }); return; }

  const planCounts: Record<string, number> = { free: 0, pro: 0, enterprise: 0 };

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = getAdminClient();
      const { data: authUsers } = await admin.auth.admin.listUsers();
      for (const u of authUsers?.users || []) {
        const p = (u.user_metadata?.plan as string) || "free";
        planCounts[p] = (planCounts[p] || 0) + 1;
      }
    } catch {}
  }

  res.json({
    totalUsers: users?.length || 0,
    totalFincas: fincas?.length || 0,
    totalBitacoras: bitacoras?.length || 0,
    planCounts,
  });
});

adminRouter.get("/subscriptions", async (req: AuthRequest, res: Response) => {
  const { data, error } = await req.supabase!
    .from("Subscription")
    .select("*, User(email, nombre)")
    .order("createdAt", { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data || []);
});
