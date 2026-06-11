import { Router, Response } from "express";
import { z } from "zod";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

export const fincasRouter = Router();

fincasRouter.use(requireAuth);

const fincaSchema = z.object({
  nombre: z.string().min(1, "nombre requerido").max(100),
  ubicacion: z.string().max(200).optional(),
});

const estanqueSchema = z.object({
  nombre: z.string().min(1, "nombre requerido").max(100),
});

async function getUserFincaIds(req: AuthRequest): Promise<string[]> {
  const { data } = await req.supabase!
    .from("FincaUser")
    .select("fincaId")
    .eq("userId", req.userId);
  return (data || []).map((f: any) => f.fincaId);
}

async function isFincaAdmin(req: AuthRequest, fincaId: string): Promise<boolean> {
  const { data } = await req.supabase!
    .from("FincaUser")
    .select("id")
    .eq("fincaId", fincaId)
    .eq("userId", req.userId)
    .eq("rol", "admin")
    .maybeSingle();
  return !!data;
}

fincasRouter.get("/", async (req: AuthRequest, res: Response) => {
  const invitedIds = await getUserFincaIds(req);
  let query = req.supabase!.from("Finca").select("*, Estanque(*)");
  if (invitedIds.length > 0) {
    query = query.or(`userId.eq.${req.userId},id.in.(${invitedIds.join(",")})`);
  } else {
    query = query.eq("userId", req.userId);
  }
  const { data, error } = await query;
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

fincasRouter.post("/", async (req: AuthRequest, res: Response) => {
  const parsed = fincaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
    return;
  }
  const { nombre, ubicacion } = parsed.data;

  const { data, error } = await req.supabase!
    .from("Finca")
    .insert({ nombre, ubicacion: ubicacion ?? "", userId: req.userId })
    .select("*, Estanque(*)")
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }

  await req.supabase!
    .from("FincaUser")
    .insert({ fincaId: (data as any).id, userId: req.userId, rol: "admin" })
    .select()
    .maybeSingle();

  res.status(201).json(data);
});

fincasRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const parsed = fincaSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
    return;
  }
  if (!(await isFincaAdmin(req, id))) {
    res.status(403).json({ error: "Solo admins pueden editar la finca" });
    return;
  }

  const { data, error } = await req.supabase!
    .from("Finca")
    .update(parsed.data)
    .eq("id", id)
    .select("*, Estanque(*)")
    .single();

  if (error) { res.status(404).json({ error: "Finca no encontrada" }); return; }
  res.json(data);
});

fincasRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  if (!(await isFincaAdmin(req, id))) {
    res.status(403).json({ error: "Solo admins pueden eliminar la finca" });
    return;
  }

  const { error } = await req.supabase!
    .from("Finca")
    .delete()
    .eq("id", id);

  if (error) { res.status(404).json({ error: "Finca no encontrada" }); return; }
  res.json({ message: "Finca eliminada" });
});

fincasRouter.post("/:id/estanques", async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  if (!(await isFincaAdmin(req, id))) {
    res.status(403).json({ error: "Solo admins pueden gestionar estanques" });
    return;
  }
  const parsed = estanqueSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
    return;
  }

  const { data, error } = await req.supabase!
    .from("Estanque")
    .insert({ nombre: parsed.data.nombre, fincaId: id })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

fincasRouter.put("/:fincaId/estanques/:estanqueId", async (req: AuthRequest, res: Response) => {
  const fincaId = req.params.fincaId as string;
  const estanqueId = req.params.estanqueId as string;
  if (!(await isFincaAdmin(req, fincaId))) {
    res.status(403).json({ error: "Solo admins pueden gestionar estanques" });
    return;
  }
  const parsed = estanqueSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
    return;
  }

  const { data, error } = await req.supabase!
    .from("Estanque")
    .update({ nombre: parsed.data.nombre })
    .eq("id", estanqueId)
    .select()
    .single();

  if (error) { res.status(404).json({ error: "Estanque no encontrado" }); return; }
  res.json(data);
});

fincasRouter.delete("/:fincaId/estanques/:estanqueId", async (req: AuthRequest, res: Response) => {
  const fincaId = req.params.fincaId as string;
  const estanqueId = req.params.estanqueId as string;
  if (!(await isFincaAdmin(req, fincaId))) {
    res.status(403).json({ error: "Solo admins pueden gestionar estanques" });
    return;
  }

  const { error } = await req.supabase!
    .from("Estanque")
    .delete()
    .eq("id", estanqueId);

  if (error) { res.status(404).json({ error: "Estanque no encontrado" }); return; }
  res.json({ message: "Estanque eliminado" });
});

fincasRouter.get("/:id/users", async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { data, error } = await req.supabase!
    .from("FincaUser")
    .select("id, userId, rol, createdAt")
    .eq("fincaId", id);

  if (error) { res.status(500).json({ error: error.message }); return; }

  const enriched = await Promise.all((data || []).map(async (fu: any) => {
    const { data: user } = await req.supabase!
      .from("User")
      .select("email, nombre")
      .eq("id", fu.userId)
      .single();
    return { ...fu, email: (user as any)?.email || "", nombre: (user as any)?.nombre || "" };
  }));

  res.json(enriched);
});

fincasRouter.post("/:id/users", async (req: AuthRequest, res: Response) => {
  const fincaId = req.params.id as string;
  if (!(await isFincaAdmin(req, fincaId))) {
    res.status(403).json({ error: "Solo admins pueden invitar usuarios" });
    return;
  }

  const parsed = z.object({ email: z.string().email(), rol: z.enum(["productor", "tecnico"]).default("productor") }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Email válido requerido" });
    return;
  }

  const { data: users, error: userErr } = await req.supabase!
    .from("User")
    .select("id")
    .eq("email", parsed.data.email)
    .limit(1);

  if (userErr || !users || (users as any[]).length === 0) {
    res.status(404).json({ error: "Usuario no encontrado con ese email" });
    return;
  }

  const { data, error } = await req.supabase!
    .from("FincaUser")
    .insert({ fincaId, userId: (users as any[])[0].id, rol: parsed.data.rol })
    .select("id, userId, rol, createdAt")
    .single();

  if (error) {
    if ((error as any).code === "23505") {
      res.status(409).json({ error: "El usuario ya pertenece a esta finca" });
      return;
    }
    res.status(500).json({ error: (error as any).message });
    return;
  }

  res.status(201).json(data);
});

fincasRouter.delete("/:fincaId/users/:userId", async (req: AuthRequest, res: Response) => {
  const fincaId = req.params.fincaId as string;
  const userId = req.params.userId as string;
  if (!(await isFincaAdmin(req, fincaId))) {
    res.status(403).json({ error: "Solo admins pueden eliminar usuarios" });
    return;
  }

  const { count } = await req.supabase!
    .from("FincaUser")
    .select("id", { count: "exact", head: true })
    .eq("fincaId", fincaId)
    .eq("rol", "admin");

  if (count !== null && count <= 1) {
    const { data: target } = await req.supabase!
      .from("FincaUser")
      .select("rol")
      .eq("fincaId", fincaId)
      .eq("userId", userId)
      .single();

    if ((target as any)?.rol === "admin") {
      res.status(400).json({ error: "No puedes eliminar al único admin de la finca" });
      return;
    }
  }

  const { error } = await req.supabase!
    .from("FincaUser")
    .delete()
    .eq("fincaId", fincaId)
    .eq("userId", userId);

  if (error) { res.status(500).json({ error: (error as any).message }); return; }
  res.json({ message: "Usuario eliminado de la finca" });
});
