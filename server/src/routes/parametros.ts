import { Router, Response } from "express";
import { z } from "zod";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

export const parametrosRouter = Router();

parametrosRouter.use(requireAuth);

parametrosRouter.get("/", async (req: AuthRequest, res: Response) => {
  const uid = req.userId;
  const { data, error } = await req.supabase!
    .from("ParametroOverride")
    .select("especieId, params")
    .eq("userId", uid);

  if (error) return res.status(500).json({ error: error.message });
  const overrides: Record<string, any> = {};
  for (const row of data || []) {
    overrides[row.especieId] = row.params;
  }
  res.json(overrides);
});

const parametrosSchema = z.record(z.string(), z.any());

parametrosRouter.put("/", async (req: AuthRequest, res: Response) => {
  const uid = req.userId;
  const parsed = parametrosSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Formato inválido: se espera un objeto { especieId: params }" });
    return;
  }

  const overrides = parsed.data;
  for (const [especieId, params] of Object.entries(overrides)) {
    if (!especieId || typeof especieId !== "string") continue;
    const { error } = await req.supabase!
      .from("ParametroOverride")
      .upsert({ userId: uid, especieId, params }, { onConflict: "userId, especieId" });

    if (error) {
      console.error(`[PARAMETROS] Error guardando override ${especieId}:`, error.message);
      res.status(500).json({ error: error.message });
      return;
    }
  }

  res.json({ ok: true });
});
