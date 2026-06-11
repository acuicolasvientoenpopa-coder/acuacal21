import { Router, Response } from "express";
import { z } from "zod";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

export const fincasRouter = Router();

fincasRouter.use(requireAuth);

const fincaSchema = z.object({
  nombre: z.string().min(1, "nombre requerido").max(100),
  ubicacion: z.string().max(200).optional(),
});

const estanqueSchema = z.object({
  nombre: z.string().min(1, "nombre requerido").max(100),
});

fincasRouter.get("/", async (req: AuthRequest, res: Response) => {
  const { data, error } = await req.supabase!
    .from("Finca")
    .select("*, Estanque(*)")
    .eq("userId", req.userId);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

fincasRouter.post("/", async (req: AuthRequest, res: Response) => {
  const parsed = fincaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
    return;
  }
  const { nombre, ubicacion } = parsed.data;

  const { data, error } = await req.supabase!
    .from("Finca")
    .insert({ nombre, ubicacion: ubicacion ?? "", userId: req.userId })
    .select("*, Estanque(*)")
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

fincasRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  const parsed = fincaSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
    return;
  }

  const { data, error } = await req.supabase!
    .from("Finca")
    .update(parsed.data)
    .eq("id", id)
    .eq("userId", req.userId)
    .select("*, Estanque(*)")
    .single();

  if (error) { res.status(404).json({ error: "Finca no encontrada" }); return; }
  res.json(data);
});

fincasRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  const id = req.params.id;

  const { error } = await req.supabase!
    .from("Finca")
    .delete()
    .eq("id", id)
    .eq("userId", req.userId);

  if (error) { res.status(404).json({ error: "Finca no encontrada" }); return; }
  res.json({ message: "Finca eliminada" });
});

// Estanques
fincasRouter.post("/:id/estanques", async (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  const parsed = estanqueSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
    return;
  }

  const { data, error } = await req.supabase!
    .from("Estanque")
    .insert({ nombre: parsed.data.nombre, fincaId: id })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

fincasRouter.put("/:fincaId/estanques/:estanqueId", async (req: AuthRequest, res: Response) => {
  const estanqueId = req.params.estanqueId;
  const parsed = estanqueSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
    return;
  }

  const { data, error } = await req.supabase!
    .from("Estanque")
    .update({ nombre: parsed.data.nombre })
    .eq("id", estanqueId)
    .select()
    .single();

  if (error) { res.status(404).json({ error: "Estanque no encontrado" }); return; }
  res.json(data);
});

fincasRouter.delete("/:fincaId/estanques/:estanqueId", async (req: AuthRequest, res: Response) => {
  const estanqueId = req.params.estanqueId;

  const { error } = await req.supabase!
    .from("Estanque")
    .delete()
    .eq("id", estanqueId);

  if (error) { res.status(404).json({ error: "Estanque no encontrado" }); return; }
  res.json({ message: "Estanque eliminado" });
});
