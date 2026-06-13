import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get("/stats", async (req: AuthRequest, res: Response) => {
  const uid = req.userId;

  const [fincas, bitacora, finanzas, especies, micro, vet, inventario] = await Promise.all([
    req.supabase!.from("Finca").select("id", { count: "exact", head: true })
      .or(`userId.eq.${uid},id.in.(select fincaId from \"FincaUser\" where \"userId\" = '${uid}')`),
    req.supabase!.from("Bitacora").select("id", { count: "exact", head: true }).eq("userId", uid),
    req.supabase!.from("Finanza").select("monto, tipo").eq("userId", uid),
    req.supabase!.from("Especie").select("id", { count: "exact", head: true }).eq("userId", uid),
    req.supabase!.from("Microbiologia").select("id", { count: "exact", head: true }).eq("userId", uid),
    req.supabase!.from("Veterinaria").select("id", { count: "exact", head: true }).eq("userId", uid),
    req.supabase!.from("Inventario").select("cantidad, minimo, precio").eq("userId", uid),
  ]);

  let totalGastos = 0;
  let totalBiomasa = 0;
  if (finanzas.data) {
    for (const r of finanzas.data as any[]) {
      totalGastos += r.monto || 0;
      if (r.tipo === "cosecha" || r.tipo === "biomasa") totalBiomasa += r.monto || 0;
    }
  }

  let invValor = 0;
  let invAlertas = 0;
  if (inventario.data) {
    for (const p of inventario.data as any[]) {
      invValor += (p.cantidad || 0) * (p.precio || 0);
      if (p.minimo > 0 && (p.cantidad || 0) <= p.minimo) invAlertas++;
    }
  }

  res.json({
    fincas: fincas.count || 0,
    bitacora: bitacora.count || 0,
    finanzas: finanzas.data?.length || 0,
    especies: especies.count || 0,
    micro: micro.count || 0,
    vet: vet.count || 0,
    inventario: inventario.data?.length || 0,
    totalGastos,
    totalBiomasa,
    invValor,
    invAlertas,
  });
});
