import { useState, useEffect } from "react";
import { useTranslation } from "@/store/language";
import { useCurrency } from "@/store/currency";
import { useAuth } from "@/store/auth";
import { Link } from "react-router-dom";
import { NAV_LINKS } from "@/data/navLinks";
import { exportAllExcel } from "@/utils/pdf";

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

function lsStats(): Stats {
  try {
    const fin = JSON.parse(localStorage.getItem("aquacalc_finanzas") || "[]");
    let totalGastos = 0, totalBiomasa = 0;
    if (Array.isArray(fin)) {
      for (const r of fin) {
        totalGastos += (r.semilla || 0) + (r.alimento || 0) + (r.medicacion || 0) + (r.electricidad || 0) + (r.combustible || 0) + (r.manoObra || 0) + (r.mantenimiento || 0) + (r.transporte || 0) + (r.otros || 0);
        totalBiomasa += r.biomasaCosechada || 0;
      }
    }
    const prods = JSON.parse(localStorage.getItem("aquacalc_inventario_productos") || "[]");
    const invValor = Array.isArray(prods) ? prods.reduce((s: number, p: any) => s + (p.stockActual || 0) * (p.precioUnitario || 0), 0) : 0;
    const invAlertas = Array.isArray(prods) ? prods.filter((p: any) => p.stockMinimo > 0 && (p.stockActual || 0) <= p.stockMinimo).length : 0;
    return {
      fincas: JSON.parse(localStorage.getItem("aquacalc_fincas") || "[]").length,
      bitacora: JSON.parse(localStorage.getItem("aquacalc_bitacora") || "[]").length,
      finanzas: fin.length,
      inventario: Array.isArray(prods) ? prods.length : 0,
      especies: JSON.parse(localStorage.getItem("aquacalc_custom_species") || "[]").length,
      micro: JSON.parse(localStorage.getItem("aquacalc_cultivos") || "[]").length,
      vet: JSON.parse(localStorage.getItem("aquacalc_vet_reports") || "[]").length,
      totalGastos, totalBiomasa, invValor, invAlertas,
    };
  } catch { return { fincas: 0, bitacora: 0, finanzas: 0, inventario: 0, especies: 0, micro: 0, vet: 0, totalGastos: 0, totalBiomasa: 0, invValor: 0, invAlertas: 0 }; }
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { fmt } = useCurrency();
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats>(lsStats);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetch("https://acuacal21-production.up.railway.app/api/fincas", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      fetch("https://acuacal21-production.up.railway.app/api/bitacora", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      fetch("https://acuacal21-production.up.railway.app/api/finanzas", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      fetch("https://acuacal21-production.up.railway.app/api/inventario/productos", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      fetch("https://acuacal21-production.up.railway.app/api/especies", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      fetch("https://acuacal21-production.up.railway.app/api/microbiologia", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      fetch("https://acuacal21-production.up.railway.app/api/veterinaria", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
    ]).then(([fincas, bitacora, finanzas, inventario, especies, micro, vet]) => {
      const arrFin = Array.isArray(finanzas) ? finanzas : [];
      let totalGastos = 0, totalBiomasa = 0;
      for (const r of arrFin) {
        totalGastos += (r.semilla || 0) + (r.alimento || 0) + (r.medicacion || 0) + (r.electricidad || 0) + (r.combustible || 0) + (r.manoObra || 0) + (r.mantenimiento || 0) + (r.transporte || 0) + (r.otros || 0);
        totalBiomasa += r.biomasaCosechada || 0;
      }
      const arrInv = Array.isArray(inventario) ? inventario : [];
      const invValor = arrInv.reduce((s: number, p: any) => s + (p.stockActual || 0) * (p.precioUnitario || 0), 0);
      const invAlertas = arrInv.filter((p: any) => p.stockMinimo > 0 && (p.stockActual || 0) <= p.stockMinimo).length;
      setStats({
        fincas: Array.isArray(fincas) ? fincas.length : 0,
        bitacora: Array.isArray(bitacora) ? bitacora.length : 0,
        finanzas: arrFin.length,
        inventario: arrInv.length,
        especies: Array.isArray(especies) ? especies.length : 0,
        micro: Array.isArray(micro) ? micro.length : 0,
        vet: Array.isArray(vet) ? vet.length : 0,
        totalGastos, totalBiomasa, invValor, invAlertas,
      });
    }).catch(() => setStats(lsStats())).finally(() => setLoading(false));
  }, [token]);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => { exportAllExcel().catch(() => {}).finally(() => setExporting(false)); }, 100);
  };

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

      {stats.totalGastos > 0 && (
        <div className="card" style={{ borderColor: "var(--accent)", marginBottom: 16 }}>
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

      <div className="card" style={{ borderColor: "var(--accent3)", marginBottom: 16 }}>
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
    </div>
  );
}
