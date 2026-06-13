import { Router, Response } from "express";
import { z } from "zod";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { createEventLog, markEventSuccess, markEventFailed, verifyRecordExists } from "../services/eventLog.js";
import { generateRequestId, checkRequestIdempotent } from "../services/idempotency.js";

export const bitacoraRouter = Router();

bitacoraRouter.use(requireAuth);

const bitacoraSchema = z.object({
  fecha: z.string().optional(),
  fincaId: z.string().min(1, "fincaId requerido"),
  oxigeno: z.number().min(0).max(50).optional(),
  temperatura: z.number().min(-10).max(60).optional(),
  ph: z.number().min(0).max(14).optional(),
  amonio: z.number().min(0).optional(),
  salinidad: z.number().min(0).max(100).optional(),
  peso: z.number().min(0).optional(),
  cantidad: z.number().int().min(0).optional(),
  estanqueId: z.string().optional(),
  especieId: z.string().optional(),
  observaciones: z.string().max(5000).optional(),
});

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
  const parsed = bitacoraSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
    return;
  }

  const requestId = generateRequestId();
  const { isDuplicate } = await checkRequestIdempotent(requestId, req.userId!, "Bitacora");
  if (isDuplicate) {
    res.status(409).json({ error: "Operación duplicada" });
    return;
  }

  const eventId = requestId;
  await createEventLog({ id: eventId, type: "BITACORA", action: "CREATE", userId: req.userId!, payload: parsed.data });

  const { data, error } = await req.supabase!
    .from("Bitacora")
    .insert({ ...parsed.data, userId: req.userId })
    .select("*, Finca(*), Estanque(*), Especie(*)")
    .single();

  if (error) {
    console.error(`[BITACORA] Error creando registro:`, error.message);
    await markEventFailed(eventId, error.message);
    res.status(500).json({ error: error.message });
    return;
  }

  const verified = await verifyRecordExists("Bitacora", data.id, req.userId!);
  if (!verified) {
    console.error(`[BITACORA] Post-write verification FAILED for ${data.id}`);
    await markEventFailed(eventId, "Post-write verification failed");
    res.status(500).json({ error: "Error de verificación post-escritura" });
    return;
  }

  await markEventSuccess(eventId);
  res.status(201).json(data);
});

bitacoraRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  const parsed = bitacoraSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
    return;
  }

  const { data, error } = await req.supabase!
    .from("Bitacora")
    .update(parsed.data)
    .eq("id", id)
    .eq("userId", req.userId)
    .select("*, Finca(*), Estanque(*), Especie(*)")
    .single();

  if (error) { res.status(404).json({ error: "Registro no encontrado" }); return; }
  res.json(data);
});

bitacoraRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  const id = req.params.id;

  const { error } = await req.supabase!
    .from("Bitacora")
    .delete()
    .eq("id", id)
    .eq("userId", req.userId);

  if (error) { res.status(404).json({ error: "Registro no encontrado" }); return; }
  res.json({ message: "Registro eliminado" });
});
