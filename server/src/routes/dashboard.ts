import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get("/stats", async (req: AuthRequest, res: Response) => {
  const uid = req.userId;

  const sharedFincas = req.supabase!.from("FincaUser").select("fincaId").eq("userId", uid);
  const bitacoraP = req.supabase!.from("Bitacora").select("id", { count: "exact", head: true }).eq("userId", uid);
  const finanzasP = req.supabase!.from("Finanza").select("monto, tipo").eq("userId", uid);
  const especiesP = req.supabase!.from("Especie").select("id", { count: "exact", head: true }).eq("userId", uid);
  const microP = req.supabase!.from("Microbiologia").select("id", { count: "exact", head: true }).eq("userId", uid);
  const vetP = req.supabase!.from("Veterinaria").select("id", { count: "exact", head: true }).eq("userId", uid);
  const inventarioP = req.supabase!.from("Inventario").select("cantidad, minimo, precio").eq("userId", uid);

  const [fincaUserResult, bitacora, finanzas, especies, micro, vet, inventario] = await Promise.all([
    sharedFincas, bitacoraP, finanzasP, especiesP, microP, vetP, inventarioP,
  ]);

  const sharedIds = (fincaUserResult.data ?? []).map((r: any) => r.fincaId).filter(Boolean);
  let fincaQuery = req.supabase!.from("Finca").select("id", { count: "exact", head: true });
  if (sharedIds.length > 0) {
    fincaQuery = fincaQuery.or(`userId.eq.${uid},id.in.(${sharedIds.join(",")})`);
  } else {
    fincaQuery = fincaQuery.eq("userId", uid);
  }
  const { count: fincaCount } = await fincaQuery;

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
    fincas: fincaCount || 0,
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
