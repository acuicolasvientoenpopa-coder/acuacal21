import { Router, Response } from "express";
import { z } from "zod";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

export const veterinariaRouter = Router();

veterinariaRouter.use(requireAuth);

const veterinariaSchema = z.object({
  fecha: z.string().optional(),
  diagnostico: z.string().min(1, "diagnostico requerido").max(5000),
  riesgo: z.enum(["verde", "amarillo", "rojo"]).optional(),
  notas: z.any().optional(),
  fincaId: z.string().optional(),
});

veterinariaRouter.get("/", async (req: AuthRequest, res: Response) => {
  const { data, error } = await req.supabase!
    .from("Veterinaria")
    .select("*")
    .eq("userId", req.userId)
    .order("fecha", { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

veterinariaRouter.post("/", async (req: AuthRequest, res: Response) => {
  const parsed = veterinariaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
    return;
  }

  const body: any = { diagnostico: parsed.data.diagnostico, riesgo: parsed.data.riesgo ?? "verde", userId: req.userId };
  if (parsed.data.fecha) body.fecha = parsed.data.fecha;
  if (parsed.data.notas) body.notas = typeof parsed.data.notas === "object" ? JSON.stringify(parsed.data.notas) : parsed.data.notas;
  if (parsed.data.fincaId) body.fincaId = parsed.data.fincaId;

  const { data, error } = await req.supabase!
    .from("Veterinaria")
    .insert(body)
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

veterinariaRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  const parsed = veterinariaSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
    return;
  }

  const update: any = {};
  if (parsed.data.fecha !== undefined) update.fecha = parsed.data.fecha;
  if (parsed.data.diagnostico !== undefined) update.diagnostico = parsed.data.diagnostico;
  if (parsed.data.riesgo !== undefined) update.riesgo = parsed.data.riesgo;
  if (parsed.data.notas !== undefined) update.notas = typeof parsed.data.notas === "object" ? JSON.stringify(parsed.data.notas) : parsed.data.notas;
  if (parsed.data.fincaId !== undefined) update.fincaId = parsed.data.fincaId;

  const { data, error } = await req.supabase!
    .from("Veterinaria")
    .update(update)
    .eq("id", id)
    .eq("userId", req.userId)
    .select()
    .single();

  if (error) { res.status(404).json({ error: "Registro no encontrado" }); return; }
  res.json(data);
});

veterinariaRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  const id = req.params.id;

  const { error } = await req.supabase!
    .from("Veterinaria")
    .delete()
    .eq("id", id)
    .eq("userId", req.userId);

  if (error) { res.status(404).json({ error: "Registro no encontrado" }); return; }
  res.json({ message: "Registro eliminado" });
});
