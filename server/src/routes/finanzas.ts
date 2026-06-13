import { Router, Response } from "express";
import { z } from "zod";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { createEventLog, markEventSuccess, markEventFailed, verifyRecordExists } from "../services/eventLog.js";
import { generateRequestId, checkRequestIdempotent } from "../services/idempotency.js";

export const finanzasRouter = Router();

finanzasRouter.use(requireAuth);

const finanzaSchema = z.object({
  tipo: z.string().min(1).max(50),
  monto: z.number().min(0),
  descripcion: z.any().optional(),
  fecha: z.string().optional(),
  fincaId: z.string().uuid(),
});

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
  const parsed = finanzaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
    return;
  }

  const requestId = generateRequestId();
  const { isDuplicate } = await checkRequestIdempotent(requestId, req.userId!, "Finanza");
  if (isDuplicate) {
    res.status(409).json({ error: "Operación duplicada" });
    return;
  }

  const eventId = requestId;
  await createEventLog({ id: eventId, type: "FINANZA", action: "CREATE", userId: req.userId!, payload: parsed.data });

  const body: any = { ...parsed.data, userId: req.userId };
  if (body.descripcion && typeof body.descripcion === "object") {
    body.descripcion = JSON.stringify(body.descripcion);
  }

  const { data, error } = await req.supabase!
    .from("Finanza")
    .insert(body)
    .select()
    .single();

  if (error) {
    console.error(`[FINANZAS] Error creando registro:`, error.message);
    await markEventFailed(eventId, error.message);
    res.status(500).json({ error: error.message });
    return;
  }

  const verified = await verifyRecordExists("Finanza", data.id, req.userId!);
  if (!verified) {
    console.error(`[FINANZAS] Post-write verification FAILED for ${data.id}`);
    await markEventFailed(eventId, "Post-write verification failed");
    res.status(500).json({ error: "Error de verificación post-escritura" });
    return;
  }

  await markEventSuccess(eventId);
  res.status(201).json(data);
});

finanzasRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  const parsed = finanzaSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
    return;
  }
  const body: any = { ...parsed.data };
  if (body.descripcion && typeof body.descripcion === "object") {
    body.descripcion = JSON.stringify(body.descripcion);
  }

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
  const id = req.params.id;

  const { error } = await req.supabase!
    .from("Finanza")
    .delete()
    .eq("id", id)
    .eq("userId", req.userId);

  if (error) { res.status(404).json({ error: "Registro no encontrado" }); return; }
  res.json({ message: "Registro eliminado" });
});
