import { Router, Request, Response } from "express";
import { z } from "zod";

export const feedbackRouter = Router();

const feedbackSchema = z.object({
  name: z.string().max(100).optional(),
  email: z.string().email().max(200).optional(),
  message: z.string().min(1, "Mensaje requerido").max(2000),
  rating: z.number().min(1).max(5).optional(),
  page: z.string().max(200).optional(),
});

feedbackRouter.post("/", async (req: Request, res: Response) => {
  const parsed = feedbackSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join(", ") });
    return;
  }

  const { name, email, message, rating, page } = parsed.data;
  const ts = new Date().toISOString();

  console.log(`[FEEDBACK] ${ts} | ${name || "Anónimo"} <${email || "sin email"}> | ${rating ? rating + "★ " : ""}${page ? "(" + page + ") " : ""}${message.slice(0, 100)}`);

  try {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient(supabaseUrl, supabaseAnonKey);
    await client.from("Feedback").insert({
      name: name || null,
      email: email || null,
      message,
      rating: rating || null,
      page: page || null,
    });
  } catch (e: any) {
    console.error("[FEEDBACK] Error guardando feedback:", e?.message || e);
  }

  res.json({ ok: true });
});
