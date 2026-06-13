import { Router, Response } from "express";
import { z } from "zod";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

export const microbiologiaRouter = Router();

microbiologiaRouter.use(requireAuth);

const microbiologiaSchema = z.object({
  fecha: z.string().optional(),
  resultado: z.string().min(1, "resultado requerido").max(5000),
  notas: z.any().optional(),
  fincaId: z.string().optional(),
});

microbiologiaRouter.get("/", async (req: AuthRequest, res: Response) => {
  const { data, error } = await req.supabase!
    .from("Microbiologia")
    .select("*")
    .eq("userId", req.userId)
    .order("fecha", { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

microbiologiaRouter.post("/", async (req: AuthRequest, res: Response) => {
  const parsed = microbiologiaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
    return;
  }

  const body: any = { resultado: parsed.data.resultado, userId: req.userId };
  if (parsed.data.fecha) body.fecha = parsed.data.fecha;
  if (parsed.data.notas) body.notas = typeof parsed.data.notas === "object" ? JSON.stringify(parsed.data.notas) : parsed.data.notas;
  if (parsed.data.fincaId) body.fincaId = parsed.data.fincaId;

  const { data, error } = await req.supabase!
    .from("Microbiologia")
    .insert(body)
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

microbiologiaRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  const parsed = microbiologiaSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
    return;
  }

  const update: any = {};
  if (parsed.data.fecha !== undefined) update.fecha = parsed.data.fecha;
  if (parsed.data.resultado !== undefined) update.resultado = parsed.data.resultado;
  if (parsed.data.notas !== undefined) update.notas = typeof parsed.data.notas === "object" ? JSON.stringify(parsed.data.notas) : parsed.data.notas;
  if (parsed.data.fincaId !== undefined) update.fincaId = parsed.data.fincaId;

  const { data, error } = await req.supabase!
    .from("Microbiologia")
    .update(update)
    .eq("id", id)
    .eq("userId", req.userId)
    .select()
    .single();

  if (error) { res.status(404).json({ error: "Registro no encontrado" }); return; }
  res.json(data);
});

microbiologiaRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  const id = req.params.id;

  const { error } = await req.supabase!
    .from("Microbiologia")
    .delete()
    .eq("id", id)
    .eq("userId", req.userId);

  if (error) { res.status(404).json({ error: "Registro no encontrado" }); return; }
  res.json({ message: "Registro eliminado" });
});
