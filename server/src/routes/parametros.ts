import { Router, Response } from "express";
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

parametrosRouter.put("/", async (req: AuthRequest, res: Response) => {
  const uid = req.userId;
  const overrides: Record<string, any> = req.body;

  for (const [especieId, params] of Object.entries(overrides)) {
    const { error } = await req.supabase!
      .from("ParametroOverride")
      .upsert({ userId: uid, especieId, params }, { onConflict: "userId, especieId" });

    if (error) return res.status(500).json({ error: error.message });
  }

  res.json({ ok: true });
});
