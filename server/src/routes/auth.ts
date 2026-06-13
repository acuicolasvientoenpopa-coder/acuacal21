import { Router, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { AuthRequest, requireAuth } from "../middleware/auth.js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const authRouter = Router();

const registerSchema = z.object({
  userId: z.string().min(1, "userId requerido"),
  email: z.string().email("email inválido"),
  nombre: z.string().min(1, "nombre requerido").max(100),
});

authRouter.post("/register", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
    return;
  }

  const { userId, email, nombre } = parsed.data;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${req.headers.authorization?.replace("Bearer ", "")}` } },
    auth: { persistSession: false },
  });

  const { error: dbError } = await supabase.from("User").insert({
    id: userId,
    email,
    nombre,
  });

  if (dbError) {
    res.status(500).json({ error: "Error al crear perfil: " + dbError.message });
    return;
  }

  res.status(201).json({ message: "Usuario registrado" });
});

authRouter.post("/login", async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "email y password requeridos" });
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }

  res.json({ token: data.session.access_token, user: data.user });
});

authRouter.post("/logout", async (req: AuthRequest, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (token) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });
    await supabase.auth.signOut();
  }

  res.json({ message: "Sesión cerrada" });
});
