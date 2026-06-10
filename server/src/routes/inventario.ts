import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

export const inventarioRouter = Router();
const asStr = (v: unknown): string => v as string;

inventarioRouter.use(requireAuth);

// --- Productos ---
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
  const { nombre, categoria, cantidad, minimo, precio, fincaId } = req.body;
  if (!nombre) { res.status(400).json({ error: "nombre es requerido" }); return; }

  const { data, error } = await req.supabase!
    .from("Inventario")
    .insert({ nombre, categoria: categoria ?? "otro", cantidad: cantidad ?? 0, minimo: minimo ?? 0, precio, fincaId, userId: req.userId })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

inventarioRouter.put("/productos/:id", async (req: AuthRequest, res: Response) => {
  const id = asStr(req.params.id);
  const { nombre, categoria, cantidad, minimo, precio, fincaId } = req.body;

  const update: any = {};
  if (nombre !== undefined) update.nombre = nombre;
  if (categoria !== undefined) update.categoria = categoria;
  if (cantidad !== undefined) update.cantidad = cantidad;
  if (minimo !== undefined) update.minimo = minimo;
  if (precio !== undefined) update.precio = precio;
  if (fincaId !== undefined) update.fincaId = fincaId;

  const { data, error } = await req.supabase!
    .from("Inventario")
    .update(update)
    .eq("id", id)
    .eq("userId", req.userId)
    .select()
    .single();

  if (error) { res.status(404).json({ error: "Producto no encontrado" }); return; }
  res.json(data);
});

inventarioRouter.delete("/productos/:id", async (req: AuthRequest, res: Response) => {
  const id = asStr(req.params.id);

  const { error } = await req.supabase!
    .from("Inventario")
    .delete()
    .eq("id", id)
    .eq("userId", req.userId);

  if (error) { res.status(404).json({ error: "Producto no encontrado" }); return; }
  res.json({ message: "Producto eliminado" });
});

// --- Movimientos ---
inventarioRouter.get("/movimientos", async (req: AuthRequest, res: Response) => {
  const { data, error } = await req.supabase!
    .from("MovimientoInventario")
    .select("*, Inventario(*)")
    .order("fecha", { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

inventarioRouter.post("/movimientos", async (req: AuthRequest, res: Response) => {
  const { tipo, cantidad, motivo, productoId, fecha } = req.body;
  if (!tipo || !cantidad || !productoId) { res.status(400).json({ error: "tipo, cantidad y productoId requeridos" }); return; }

  const { data, error } = await req.supabase!
    .from("MovimientoInventario")
    .insert({ tipo, cantidad, motivo, productoId, fecha: fecha ?? new Date().toISOString() })
    .select("*, Inventario(*)")
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});
