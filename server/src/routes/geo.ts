import { Router, Response } from "express";
import { z } from "zod";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

export const geoRouter = Router();

geoRouter.use(requireAuth);

const puntoSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

const syncSchema = z.object({
  nombre: z.string().min(1).max(100),
  fincaId: z.string().optional(),
  coordenadas: z.array(puntoSchema).min(3),
  profundidad: z.number().positive().optional(),
  areaM2: z.number().positive().optional(),
  volumenM3: z.number().positive().optional(),
  fechaCaptura: z.string().optional(),
});

geoRouter.post("/estanques", async (req: AuthRequest, res: Response) => {
  const parsed = syncSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
    return;
  }

  const { data: estanque, error } = await req.supabase!
    .from("Estanque")
    .insert({
      nombre: parsed.data.nombre,
      fincaId: parsed.data.fincaId ?? null,
      coordenadas: JSON.stringify(parsed.data.coordenadas),
      profundidad: parsed.data.profundidad ?? null,
      areaM2: parsed.data.areaM2 ?? null,
      volumenM3: parsed.data.volumenM3 ?? null,
      userId: req.userId,
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json(estanque);
});
