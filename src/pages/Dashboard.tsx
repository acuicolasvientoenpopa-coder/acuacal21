import { useState } from "react";
import { useTranslation } from "@/store/language";
import { useCurrency } from "@/store/currency";
import { Link } from "react-router-dom";
import { NAV_LINKS } from "@/data/navLinks";
import { exportAllExcel } from "@/utils/pdf";

function calcInvValorTotal(): number {
  try {
    const prods = JSON.parse(localStorage.getItem("aquacalc_inventario_productos") || "[]");
    if (!Array.isArray(prods)) return 0;
    return prods.reduce((s: number, p: any) => s + (p.stockActual || 0) * (p.precioUnitario || 0), 0);
  } catch { return 0; }
}

function calcInvAlertas(): string {
  try {
    const prods = JSON.parse(localStorage.getItem("aquacalc_inventario_productos") || "[]");
    if (!Array.isArray(prods)) return "—";
    const n = prods.filter((p: any) => p.stockMinimo > 0 && (p.stockActual || 0) <= p.stockMinimo).length;
    return n > 0 ? `⚠️ ${n}` : "✅ 0";
  } catch { return "—"; }
}

const LS_KEYS: Record<string, string> = {
  aquacalc_bitacora: "📋",
  aquacalc_fincas: "🏠",
  aquacalc_cultivos: "🧫",
  aquacalc_medicacion: "💊",
  aquacalc_finanzas: "💰",
  aquacalc_custom_species: "🐠",
  aquacalc_vet_reports: "🏥",
  aquacalc_inventario_productos: "📦",
};

export default function Dashboard() {
  const { t } = useTranslation();
  const { fmt } = useCurrency();

  const counts: Record<string, string> = {};
  for (const [k, emoji] of Object.entries(LS_KEYS)) {
    try {
      const data = JSON.parse(localStorage.getItem(k) || "[]");
      counts[k] = `${emoji} ${Array.isArray(data) ? data.length : "✓"}`;
    } catch { counts[k] = ""; }
  }

  const finRaw = localStorage.getItem("aquacalc_finanzas");
  let totalGastos = 0;
  let totalBiomasa = 0;
  if (finRaw) {
    try {
      const fin = JSON.parse(finRaw);
      if (Array.isArray(fin)) {
        for (const r of fin) {
          totalGastos += (r.semilla || 0) + (r.alimento || 0) + (r.medicacion || 0) + (r.electricidad || 0) + (r.combustible || 0) + (r.manoObra || 0) + (r.mantenimiento || 0) + (r.transporte || 0) + (r.otros || 0);
          totalBiomasa += r.biomasaCosechada || 0;
        }
      }
    } catch {}
  }

  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => { exportAllExcel(); setExporting(false); }, 100);
  };

  return (
    <div>
      {exporting && <div className="loading-overlay"><div className="loading-spinner" /></div>}
      <div className="page-header">
        <div>
          <h2 className="page-title">🏠 {t("calc")}</h2>
          <p className="page-subtitle">{t("calc")}</p>
        </div>
        <button className="btn-primary btn-sm" onClick={handleExport} disabled={exporting}>⬇️ {t("exportExcel")}</button>
      </div>

      {totalGastos > 0 && (
        <div className="card" style={{ borderColor: "var(--accent)", marginBottom: 16 }}>
          <div className="card-title">💰 {t("finanzasResumen")}</div>
          <div className="results-grid">
            <div className="result-card highlight">
              <div className="result-value">{fmt(totalGastos)}</div>
              <div className="result-label">{t("finanzasTotal")}</div>
            </div>
            <div className="result-card highlight">
              <div className="result-value">{totalBiomasa.toLocaleString()} kg</div>
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
              <div className="result-value">{fmt(calcInvValorTotal())}</div>
              <div className="result-label">{t("invValorTotal")}</div>
            </div>
            <div className="result-card">
              <div className="result-value">{calcInvAlertas()}</div>
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
            <div className="dash-card-count">{counts[LS_KEYS[`aquacalc_${l.key === "params" ? "params_overrides" : l.key === "micro" ? "cultivos" : l.key}` as keyof typeof LS_KEYS] as string] || ""}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}