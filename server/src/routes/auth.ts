import { Router, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { AuthRequest } from "../middleware/auth.js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const authRouter = Router();

authRouter.post("/register", async (req: AuthRequest, res: Response) => {
  const { email, password, nombre } = req.body;
  if (!email || !password || !nombre) {
    res.status(400).json({ error: "email, password y nombre requeridos" });
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  // Crear cliente con sesión del usuario registrado
  const authed = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${data.session!.access_token}` } },
    auth: { persistSession: false },
  });

  const { error: dbError } = await authed.from("User").insert({
    id: data.user!.id,
    email,
    nombre,
  });

  if (dbError) {
    res.status(500).json({ error: "Error al crear perfil: " + dbError.message });
    return;
  }

  res.status(201).json({
    message: "Usuario registrado",
    token: data.session!.access_token,
    user: data.user,
  });
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
