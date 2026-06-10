import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

export const microbiologiaRouter = Router();
const asStr = (v: unknown): string => v as string;

microbiologiaRouter.use(requireAuth);

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
  const { fecha, resultado, notas, fincaId } = req.body;
  if (!resultado) { res.status(400).json({ error: "resultado es requerido" }); return; }

  const body: any = { resultado, userId: req.userId };
  if (fecha) body.fecha = fecha;
  if (notas) body.notas = typeof notas === "object" ? JSON.stringify(notas) : notas;
  if (fincaId) body.fincaId = fincaId;

  const { data, error } = await req.supabase!
    .from("Microbiologia")
    .insert(body)
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

microbiologiaRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  const id = asStr(req.params.id);
  const { fecha, resultado, notas, fincaId } = req.body;

  const update: any = {};
  if (fecha !== undefined) update.fecha = fecha;
  if (resultado !== undefined) update.resultado = resultado;
  if (notas !== undefined) update.notas = typeof notas === "object" ? JSON.stringify(notas) : notas;
  if (fincaId !== undefined) update.fincaId = fincaId;

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
  const id = asStr(req.params.id);

  const { error } = await req.supabase!
    .from("Microbiologia")
    .delete()
    .eq("id", id)
    .eq("userId", req.userId);

  if (error) { res.status(404).json({ error: "Registro no encontrado" }); return; }
  res.json({ message: "Registro eliminado" });
});
