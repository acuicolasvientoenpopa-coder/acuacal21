import { Request, Response, NextFunction } from "express";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export interface AuthRequest extends Request {
  userId?: string;
  supabase?: SupabaseClient;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ error: "Token requerido" });
    return;
  }

  // Create a client autenticado con el token del usuario
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });

  const { data, error } = await client.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: "Token inválido o expirado" });
    return;
  }

  req.userId = data.user.id;
  req.supabase = client;
  next();
}
