import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

export const especiesRouter = Router();
const asStr = (v: unknown): string => v as string;

especiesRouter.use(requireAuth);

especiesRouter.get("/", async (req: AuthRequest, res: Response) => {
  const { data, error } = await req.supabase!
    .from("Especie")
    .select("*")
    .or(`userId.eq.${req.userId},esPersonal.eq.false`);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

especiesRouter.post("/", async (req: AuthRequest, res: Response) => {
  const { nombre, nombreCientifico, parametros } = req.body;
  if (!nombre) { res.status(400).json({ error: "nombre es requerido" }); return; }

  const { data, error } = await req.supabase!
    .from("Especie")
    .insert({ nombre, nombreCientifico, parametros, userId: req.userId })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

especiesRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  const id = asStr(req.params.id);
  const { nombre, nombreCientifico, parametros } = req.body;

  const { data, error } = await req.supabase!
    .from("Especie")
    .update({ ...(nombre && { nombre }), ...(nombreCientifico !== undefined && { nombreCientifico }), ...(parametros && { parametros }) })
    .eq("id", id)
    .eq("userId", req.userId)
    .select()
    .single();

  if (error) { res.status(404).json({ error: "Especie no encontrada" }); return; }
  res.json(data);
});

especiesRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  const id = asStr(req.params.id);

  const { error } = await req.supabase!
    .from("Especie")
    .delete()
    .eq("id", id)
    .eq("userId", req.userId);

  if (error) { res.status(404).json({ error: "Especie no encontrada" }); return; }
  res.json({ message: "Especie eliminada" });
});
