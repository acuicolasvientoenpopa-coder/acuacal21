import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "@/store/language";
import { useCurrency } from "@/store/currency";
import { useAuth } from "@/store/auth";
import { Link } from "react-router-dom";
import { NAV_LINKS } from "@/data/navLinks";
import { createApi } from "@/services/api";

let dashboardCache: { data: Stats; timestamp: number } | null = null;
const CACHE_TTL = 30000;

type Stats = {
  fincas: number;
  bitacora: number;
  finanzas: number;
  inventario: number;
  especies: number;
  micro: number;
  vet: number;
  totalGastos: number;
  totalBiomasa: number;
  invValor: number;
  invAlertas: number;
};

export default function Dashboard() {
  const { t } = useTranslation();
  const { fmt } = useCurrency();
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const mountedRef = useRef(true);

  const client = useMemo(() => token ? createApi(token) : null, [token]);

  useEffect(() => {
    mountedRef.current = true;
    if (!client) { setLoading(false); return; }

    const now = Date.now();
    if (dashboardCache && now - dashboardCache.timestamp < CACHE_TTL) {
      setStats(dashboardCache.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    client.get<Stats>("/dashboard/stats")
      .then((data) => { if (mountedRef.current) { setStats(data); dashboardCache = { data, timestamp: Date.now() }; } })
      .catch(() => {
        if (!mountedRef.current) return;
        const fin = JSON.parse(localStorage.getItem("acuical_finanzas") || "[]");
        let totalGastos = 0, totalBiomasa = 0;
        if (Array.isArray(fin)) {
          for (const r of fin) {
            totalGastos += (r.semilla || 0) + (r.alimento || 0) + (r.medicacion || 0) + (r.electricidad || 0) + (r.combustible || 0) + (r.manoObra || 0) + (r.mantenimiento || 0) + (r.transporte || 0) + (r.otros || 0);
            totalBiomasa += r.biomasaCosechada || 0;
          }
        }
        const prods = JSON.parse(localStorage.getItem("acuical_inventario_productos") || "[]");
        const invValor = Array.isArray(prods) ? prods.reduce((s: number, p: any) => s + (p.stockActual || 0) * (p.precioUnitario || 0), 0) : 0;
        const invAlertas = Array.isArray(prods) ? prods.filter((p: any) => p.stockMinimo > 0 && (p.stockActual || 0) <= p.stockMinimo).length : 0;
        setStats({
          fincas: JSON.parse(localStorage.getItem("acuical_fincas") || "[]").length,
          bitacora: JSON.parse(localStorage.getItem("acuical_bitacora") || "[]").length,
          finanzas: fin.length,
          inventario: Array.isArray(prods) ? prods.length : 0,
          especies: JSON.parse(localStorage.getItem("acuical_custom_species") || "[]").length,
          micro: JSON.parse(localStorage.getItem("acuical_cultivos") || "[]").length,
          vet: JSON.parse(localStorage.getItem("acuical_vet_reports") || "[]").length,
          totalGastos, totalBiomasa, invValor, invAlertas,
        });
      })
      .finally(() => { if (mountedRef.current) setLoading(false); });
    return () => { mountedRef.current = false; };
  }, [client]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { exportAllExcel } = await import("@/utils/excel");
      await exportAllExcel();
    } catch (e: any) { console.error("[Dashboard] Error:", e?.message || e); }
    setExporting(false);
  };

  if (!stats) return <div className="page-header"><h2 className="page-title">🏠 {t("dashboardTitle")}</h2>{loading && <div className="loading-spinner" />}</div>;

  const moduleCounts: Record<string, number> = {
    fincas: stats.fincas, bitacora: stats.bitacora, finanzas: stats.finanzas,
    inventario: stats.inventario, especies: stats.especies, micro: stats.micro, vet: stats.vet,
  };

  return (
    <div>
      {exporting && <div className="loading-overlay"><div className="loading-spinner" /></div>}
      <div className="page-header">
        <div>
          <h2 className="page-title">🏠 {t("dashboardTitle")}</h2>
          <p className="page-subtitle">{t("dashboardSub")}</p>
        </div>
        <button className="btn-primary btn-sm" onClick={handleExport} disabled={exporting}>⬇️ {t("exportExcel")}</button>
      </div>

      {loading && <div className="loading-overlay"><div className="loading-spinner" /></div>}

      <div className="dashboard-grid">
        {NAV_LINKS.filter((l) => l.to !== "/").map((l) => (
          <Link key={l.to} to={l.to} className="dash-card">
            <div className="dash-card-icon">{l.emoji}</div>
            <div className="dash-card-title">{t(l.key as any)}</div>
            <div className="dash-card-desc">{t(l.key as any)}</div>
            <div className="dash-card-count">{moduleCounts[l.key as keyof typeof moduleCounts] ?? ""}</div>
          </Link>
        ))}
      </div>

      {stats.totalGastos > 0 && (
        <div className="card glow-accent" style={{ marginTop: 16 }}>
          <div className="card-title">💰 {t("finanzasResumen")}</div>
          <div className="results-grid">
            <div className="result-card highlight">
              <div className="result-value">{fmt(stats.totalGastos)}</div>
              <div className="result-label">{t("finanzasTotal")}</div>
            </div>
            <div className="result-card highlight">
              <div className="result-value">{stats.totalBiomasa.toLocaleString()} kg</div>
              <div className="result-label">{t("finanzasBiomasaCosechada")}</div>
            </div>
          </div>
        </div>
      )}

      <div className="card glow-blue">
        <Link to="/inventario" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card-title">📦 {t("inventarioTitle")}</div>
          <div className="results-grid">
            <div className="result-card">
              <div className="result-value">{fmt(stats.invValor)}</div>
              <div className="result-label">{t("invValorTotal")}</div>
            </div>
            <div className="result-card">
              <div className="result-value">{stats.invAlertas > 0 ? `⚠️ ${stats.invAlertas}` : "✅ 0"}</div>
              <div className="result-label">{t("invAlertas")}</div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
