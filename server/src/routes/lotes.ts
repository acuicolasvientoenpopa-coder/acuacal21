import { Router, Response } from "express";
import { z } from "zod";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

export const lotesRouter = Router();

lotesRouter.use(requireAuth);

const loteSchema = z.object({
  nombre: z.string().min(1, "nombre requerido").max(200),
  fechaSiembra: z.string(),
  cantidadInicial: z.number().int().min(1, "cantidadInicial debe ser >= 1"),
  pesoInicial: z.number().min(0).optional(),
  especieId: z.string().min(1, "especieId requerido"),
  estanqueId: z.string().min(1, "estanqueId requerido"),
  fincaId: z.string().min(1, "fincaId requerido"),
});

lotesRouter.get("/", async (req: AuthRequest, res: Response) => {
  const { data, error } = await req.supabase!
    .from("Lote")
    .select("*, Especie(*)")
    .eq("userId", req.userId)
    .order("fechaSiembra", { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

lotesRouter.get("/:id", async (req: AuthRequest, res: Response) => {
  const { data: lote, error } = await req.supabase!
    .from("Lote")
    .select("*, Especie(*)")
    .eq("id", req.params.id)
    .eq("userId", req.userId)
    .single();

  if (error || !lote) { res.status(404).json({ error: "Lote no encontrado" }); return; }

  const [bitacoras, finanzas, veterinarias, movimientos] = await Promise.all([
    req.supabase!.from("Bitacora").select("*").eq("loteId", req.params.id),
    req.supabase!.from("Finanza").select("*").eq("loteId", req.params.id),
    req.supabase!.from("Veterinaria").select("*").eq("loteId", req.params.id),
    req.supabase!.from("MovimientoInventario").select("*, Inventario(*)").eq("loteId", req.params.id),
  ]);

  res.json({
    ...lote,
    trazabilidad: {
      bitacoras: bitacoras.data || [],
      finanzas: finanzas.data || [],
      veterinarias: veterinarias.data || [],
      movimientos: movimientos.data || [],
    },
  });
});

lotesRouter.post("/", async (req: AuthRequest, res: Response) => {
  const parsed = loteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
    return;
  }

  const { data, error } = await req.supabase!
    .from("Lote")
    .insert({ ...parsed.data, userId: req.userId })
    .select("*, Especie(*)")
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

lotesRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  const parsed = loteSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
    return;
  }

  const { data, error } = await req.supabase!
    .from("Lote")
    .update(parsed.data)
    .eq("id", id)
    .eq("userId", req.userId)
    .select("*, Especie(*)")
    .single();

  if (error) { res.status(404).json({ error: "Lote no encontrado" }); return; }
  res.json(data);
});

lotesRouter.put("/:id/cerrar", async (req: AuthRequest, res: Response) => {
  const { fecha } = z.object({ fecha: z.string().optional() }).parse(req.body);

  const { data, error } = await req.supabase!
    .from("Lote")
    .update({ activo: false, fechaCosecha: fecha || new Date().toISOString().slice(0, 10) })
    .eq("id", req.params.id)
    .eq("userId", req.userId)
    .select("*, Especie(*)")
    .single();

  if (error) { res.status(404).json({ error: "Lote no encontrado" }); return; }
  res.json(data);
});

lotesRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  const { error } = await req.supabase!
    .from("Lote")
    .delete()
    .eq("id", req.params.id)
    .eq("userId", req.userId);

  if (error) { res.status(404).json({ error: "Lote no encontrado" }); return; }
  res.json({ message: "Lote eliminado" });
});
