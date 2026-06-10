import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

export const bitacoraRouter = Router();
const asStr = (v: unknown): string => v as string;

bitacoraRouter.use(requireAuth);

bitacoraRouter.get("/", async (req: AuthRequest, res: Response) => {
  const { data, error } = await req.supabase!
    .from("Bitacora")
    .select("*, Finca(*), Estanque(*), Especie(*)")
    .eq("userId", req.userId)
    .order("fecha", { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

bitacoraRouter.post("/", async (req: AuthRequest, res: Response) => {
  const { data, error } = await req.supabase!
    .from("Bitacora")
    .insert({ ...req.body, userId: req.userId })
    .select("*, Finca(*), Estanque(*), Especie(*)")
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

bitacoraRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  const id = asStr(req.params.id);

  const { error } = await req.supabase!
    .from("Bitacora")
    .delete()
    .eq("id", id)
    .eq("userId", req.userId);

  if (error) { res.status(404).json({ error: "Registro no encontrado" }); return; }
  res.json({ message: "Registro eliminado" });
});
