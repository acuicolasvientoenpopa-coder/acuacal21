import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function seed() {
  const { data: existing } = await supabase.from("User").select("id").limit(1);
  if (existing && existing.length > 0) {
    console.log("La base de datos ya tiene datos. Seed omitido.");
    return;
  }

  const { data: user, error: uErr } = await supabase.auth.admin.createUser({
    email: "demo@acuical.com",
    password: "Demo1234!",
    email_confirm: true,
    user_metadata: { nombre: "Demo", plan: "free", rol: "productor" },
  });
  if (uErr) { console.error("Error creando usuario:", uErr); process.exit(1); }
  const userId = user.user.id;

  await supabase.from("User").insert([
    { id: userId, email: "demo@acuical.com", nombre: "Demo", idioma: "es", rol: "productor" },
  ]);

  const { data: finca } = await supabase.from("Finca").insert({
    nombre: "Finca Demo", ubicacion: "Costa Rica", userId,
  }).select().single();

  await supabase.from("Estanque").insert([
    { nombre: "Estanque A", fincaId: finca.id },
    { nombre: "Estanque B", fincaId: finca.id },
  ]);

  console.log("Seed completado: usuario demo + finca + estanques");
}

seed().catch((e) => { console.error(e); process.exit(1); });
