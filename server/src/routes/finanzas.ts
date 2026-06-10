import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

export const finanzasRouter = Router();
const asStr = (v: unknown): string => v as string;

finanzasRouter.use(requireAuth);

finanzasRouter.get("/", async (req: AuthRequest, res: Response) => {
  const { data, error } = await req.supabase!
    .from("Finanza")
    .select("*")
    .eq("userId", req.userId)
    .order("fecha", { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  const parsed = data.map((r: any) => {
    try { return { ...r, descripcion: r.descripcion ? JSON.parse(r.descripcion) : {} }; } catch { return r; }
  });
  res.json(parsed);
});

finanzasRouter.post("/", async (req: AuthRequest, res: Response) => {
  const body = { ...req.body };
  if (body.descripcion && typeof body.descripcion === "object") {
    body.descripcion = JSON.stringify(body.descripcion);
  }
  const { data, error } = await req.supabase!
    .from("Finanza")
    .insert({ ...body, userId: req.userId })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

finanzasRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  const id = asStr(req.params.id);
  const body = { ...req.body };
  if (body.descripcion && typeof body.descripcion === "object") {
    body.descripcion = JSON.stringify(body.descripcion);
  }
  delete body.id;
  delete body.userId;

  const { data, error } = await req.supabase!
    .from("Finanza")
    .update(body)
    .eq("id", id)
    .eq("userId", req.userId)
    .select()
    .single();

  if (error) { res.status(404).json({ error: "Registro no encontrado" }); return; }
  res.json(data);
});

finanzasRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  const id = asStr(req.params.id);

  const { error } = await req.supabase!
    .from("Finanza")
    .delete()
    .eq("id", id)
    .eq("userId", req.userId);

  if (error) { res.status(404).json({ error: "Registro no encontrado" }); return; }
  res.json({ message: "Registro eliminado" });
});
