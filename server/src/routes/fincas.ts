import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

export const fincasRouter = Router();
const asStr = (v: unknown): string => v as string;

fincasRouter.use(requireAuth);

fincasRouter.get("/", async (req: AuthRequest, res: Response) => {
  const { data, error } = await req.supabase!
    .from("Finca")
    .select("*, Estanque(*)");

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

fincasRouter.post("/", async (req: AuthRequest, res: Response) => {
  const { nombre, ubicacion } = req.body;
  if (!nombre) { res.status(400).json({ error: "nombre es requerido" }); return; }

  const { data, error } = await req.supabase!
    .from("Finca")
    .insert({ nombre, ubicacion, userId: req.userId })
    .select("*, Estanque(*)")
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

fincasRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  const id = asStr(req.params.id);
  const { nombre, ubicacion } = req.body;

  const { data, error } = await req.supabase!
    .from("Finca")
    .update({ ...(nombre && { nombre }), ...(ubicacion !== undefined && { ubicacion }) })
    .eq("id", id)
    .eq("userId", req.userId)
    .select("*, Estanque(*)")
    .single();

  if (error) { res.status(404).json({ error: "Finca no encontrada" }); return; }
  res.json(data);
});

fincasRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  const id = asStr(req.params.id);

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
  const id = asStr(req.params.id);
  const { nombre } = req.body;
  if (!nombre) { res.status(400).json({ error: "nombre requerido" }); return; }

  const { data, error } = await req.supabase!
    .from("Estanque")
    .insert({ nombre, fincaId: id })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

fincasRouter.delete("/:fincaId/estanques/:estanqueId", async (req: AuthRequest, res: Response) => {
  const estanqueId = asStr(req.params.estanqueId);

  const { error } = await req.supabase!
    .from("Estanque")
    .delete()
    .eq("id", estanqueId);

  if (error) { res.status(404).json({ error: "Estanque no encontrado" }); return; }
  res.json({ message: "Estanque eliminado" });
});
