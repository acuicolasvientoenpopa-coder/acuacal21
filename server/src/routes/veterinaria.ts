import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

export const veterinariaRouter = Router();
const asStr = (v: unknown): string => v as string;

veterinariaRouter.use(requireAuth);

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
  const { fecha, diagnostico, riesgo, notas, fincaId } = req.body;
  if (!diagnostico) { res.status(400).json({ error: "diagnostico es requerido" }); return; }

  const body: any = { diagnostico, riesgo: riesgo ?? "verde", userId: req.userId };
  if (fecha) body.fecha = fecha;
  if (notas) body.notas = typeof notas === "object" ? JSON.stringify(notas) : notas;
  if (fincaId) body.fincaId = fincaId;

  const { data, error } = await req.supabase!
    .from("Veterinaria")
    .insert(body)
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

veterinariaRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  const id = asStr(req.params.id);
  const { fecha, diagnostico, riesgo, notas, fincaId } = req.body;

  const update: any = {};
  if (fecha !== undefined) update.fecha = fecha;
  if (diagnostico !== undefined) update.diagnostico = diagnostico;
  if (riesgo !== undefined) update.riesgo = riesgo;
  if (notas !== undefined) update.notas = typeof notas === "object" ? JSON.stringify(notas) : notas;
  if (fincaId !== undefined) update.fincaId = fincaId;

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
  const id = asStr(req.params.id);

  const { error } = await req.supabase!
    .from("Veterinaria")
    .delete()
    .eq("id", id)
    .eq("userId", req.userId);

  if (error) { res.status(404).json({ error: "Registro no encontrado" }); return; }
  res.json({ message: "Registro eliminado" });
});
