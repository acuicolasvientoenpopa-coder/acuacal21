import { Router, Response } from "express";
import { z } from "zod";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

export const inventarioRouter = Router();

inventarioRouter.use(requireAuth);

const productoSchema = z.object({
  nombre: z.string().min(1, "nombre requerido").max(200),
  categoria: z.string().max(100).optional(),
  cantidad: z.number().min(0).optional(),
  minimo: z.number().min(0).optional(),
  precio: z.number().min(0).optional(),
  fincaId: z.string().optional(),
});

const movimientoSchema = z.object({
  productoId: z.string().min(1, "productoId requerido"),
  tipo: z.enum(["entrada", "salida"]),
  cantidad: z.number().positive("cantidad debe ser positiva"),
  motivo: z.string().max(1000).optional(),
  fecha: z.string().optional(),
});

inventarioRouter.get("/productos", async (req: AuthRequest, res: Response) => {
  const { data, error } = await req.supabase!
    .from("Inventario")
    .select("*")
    .eq("userId", req.userId)
    .order("nombre");

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

inventarioRouter.post("/productos", async (req: AuthRequest, res: Response) => {
  const parsed = productoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
    return;
  }

  const { data, error } = await req.supabase!
    .from("Inventario")
    .insert({ ...parsed.data, categoria: parsed.data.categoria ?? "otro", cantidad: parsed.data.cantidad ?? 0, minimo: parsed.data.minimo ?? 0, userId: req.userId })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

inventarioRouter.put("/productos/:id", async (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  const parsed = productoSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
    return;
  }

  const { data, error } = await req.supabase!
    .from("Inventario")
    .update(parsed.data)
    .eq("id", id)
    .eq("userId", req.userId)
    .select()
    .single();

  if (error) { res.status(404).json({ error: "Producto no encontrado" }); return; }
  res.json(data);
});

inventarioRouter.delete("/productos/:id", async (req: AuthRequest, res: Response) => {
  const id = req.params.id;

  const { error } = await req.supabase!
    .from("Inventario")
    .delete()
    .eq("id", id)
    .eq("userId", req.userId);

  if (error) { res.status(404).json({ error: "Producto no encontrado" }); return; }
  res.json({ message: "Producto eliminado" });
});

inventarioRouter.get("/movimientos", async (req: AuthRequest, res: Response) => {
  const { data, error } = await req.supabase!
    .from("MovimientoInventario")
    .select("*, Inventario(*)")
    .order("fecha", { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

inventarioRouter.post("/movimientos", async (req: AuthRequest, res: Response) => {
  const parsed = movimientoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
    return;
  }

  const { data, error } = await req.supabase!
    .from("MovimientoInventario")
    .insert({ ...parsed.data, fecha: parsed.data.fecha ?? new Date().toISOString() })
    .select("*, Inventario(*)")
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});
