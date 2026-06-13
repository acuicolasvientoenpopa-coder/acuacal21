import { Router, Response } from "express";
import { z } from "zod";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

export const especiesRouter = Router();

especiesRouter.use(requireAuth);

const especieSchema = z.object({
  nombre: z.string().min(1, "nombre requerido").max(100),
  nombreCientifico: z.string().max(200).optional(),
  parametros: z.any().optional(),
});

especiesRouter.get("/", async (req: AuthRequest, res: Response) => {
  const { data, error } = await req.supabase!
    .from("Especie")
    .select("*")
    .or(`userId.eq.${req.userId},esPersonal.eq.false`);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

especiesRouter.post("/", async (req: AuthRequest, res: Response) => {
  const parsed = especieSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
    return;
  }

  const { data, error } = await req.supabase!
    .from("Especie")
    .insert({ ...parsed.data, userId: req.userId })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

especiesRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  const parsed = especieSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
    return;
  }

  const { data, error } = await req.supabase!
    .from("Especie")
    .update(parsed.data)
    .eq("id", id)
    .eq("userId", req.userId)
    .select()
    .single();

  if (error) { res.status(404).json({ error: "Especie no encontrada" }); return; }
  res.json(data);
});

especiesRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  const id = req.params.id;

  const { error } = await req.supabase!
    .from("Especie")
    .delete()
    .eq("id", id)
    .eq("userId", req.userId);

  if (error) { res.status(404).json({ error: "Especie no encontrada" }); return; }
  res.json({ message: "Especie eliminada" });
});
