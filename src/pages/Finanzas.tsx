import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/store/auth";
import { useTranslation } from "@/store/language";
import { useLookups } from "@/store/lookups";
import { useLotes } from "@/store/lotes";
import { useCurrency } from "@/store/currency";
import { toast } from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";
import { useSaveIndicator } from "@/store/saveIndicator";
import { createApi } from "@/services/api";

const STORAGE_KEY = "acuical_finanzas";

interface FinRecord {
  id: string; fincaId: string; fincaNombre: string;
  semilla: number; alimento: number; medicacion: number; electricidad: number;
  combustible: number; manoObra: number; mantenimiento: number; transporte: number;
  otros: number; biomasaCosechada: number; precioVenta: number; diasCiclo: number;
  loteId: string;
}

const emptyRec = (fincaId = "", fincaNombre = ""): FinRecord => ({
  id: `fin_${Date.now()}`, fincaId, fincaNombre,
  semilla: 0, alimento: 0, medicacion: 0, electricidad: 0, combustible: 0,
  manoObra: 0, mantenimiento: 0, transporte: 0, otros: 0,
  biomasaCosechada: 0, precioVenta: 0, diasCiclo: 150,
  loteId: "",
});

function loadLocal(): FinRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]").map((r: any) => {
      if (r.energia && !r.electricidad && !r.combustible) {
        r.electricidad = Math.round(r.energia * 0.6);
        r.combustible = Math.round(r.energia * 0.4);
      }
      return r;
    });
  } catch { return []; }
}

const CATS = [
  { key: "semilla", color: "#4ecdc4", emoji: "🐣", i18nKey: "finanzasSemilla" },
  { key: "alimento", color: "#f7b731", emoji: "🌾", i18nKey: "finanzasAlimento" },
  { key: "medicacion", color: "#e74c3c", emoji: "💊", i18nKey: "finanzasMedicacion" },
  { key: "electricidad", color: "#f1c40f", emoji: "⚡", i18nKey: "finanzasElectricidad" },
  { key: "combustible", color: "#e67e22", emoji: "⛽", i18nKey: "finanzasCombustible" },
  { key: "manoObra", color: "#3498db", emoji: "👷", i18nKey: "finanzasManoObra" },
  { key: "mantenimiento", color: "#9b59b6", emoji: "🔧", i18nKey: "finanzasMantenimiento" },
  { key: "transporte", color: "#1abc9c", emoji: "🚚", i18nKey: "finanzasTransporte" },
  { key: "otros", color: "#95a5a6", emoji: "📦", i18nKey: "finanzasOtros" },
] as const;

export default function Finanzas() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { estanques, reload: reloadLookups } = useLookups();
  const { lotesActivos } = useLotes();
  const { fmt, currency, code } = useCurrency();
  const [records, setRecords] = useState<FinRecord[]>(loadLocal);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [finFilter, setFinFilter] = useState("");
  const saveState = useSaveIndicator([records]);
  const [saving, setSaving] = useState(false);

  const client = useMemo(() => token ? createApi(token) : null, [token]);

  useEffect(() => {
    if (!client) return;
    client.get<any[]>("/finanzas").then((data: any[]) => {
      const parsed = data
        .filter((r: any) => r.tipo === "fin_record")
        .map((r: any) => {
          try { return JSON.parse(r.descripcion || "{}"); } catch { return null; }
        })
        .filter(Boolean);
      setRecords(parsed.length > 0 ? parsed : loadLocal());
      if (parsed.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }).catch(() => setRecords(loadLocal()));
  }, [client]);

  useEffect(() => {
    const h = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setRecords(loadLocal());
        reloadLookups();
      }
    };
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, [reloadLookups]);

  const bulkSave = async (data: FinRecord[]) => {
    setSaving(true);
    setRecords(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (!client) { setSaving(false); return; }
    for (const rec of data) {
      try {
        await client.post("/finanzas", {
          tipo: "fin_record",
          descripcion: JSON.stringify(rec),
          monto: 0,
          fecha: new Date().toISOString(),
          fincaId: rec.fincaId || "unknown",
        });
      } catch (e: any) { console.error("[Finanzas] Error:", e?.message || e); break; }
    }
    setSaving(false);
  };

  const { agg, totalGastos, ingresoTotal, costoKg, margen, maxCat } = useMemo(() => {
    const a: FinRecord = { id: "", fincaId: "", fincaNombre: "", semilla: 0, alimento: 0, medicacion: 0, electricidad: 0, combustible: 0, manoObra: 0, mantenimiento: 0, transporte: 0, otros: 0, biomasaCosechada: 0, precioVenta: 0, diasCiclo: 0, loteId: "" };
    for (const r of records) {
      for (const c of CATS) (a[c.key] as number) += (r[c.key] as number) || 0;
      a.biomasaCosechada += r.biomasaCosechada || 0;
      a.precioVenta = r.precioVenta || 0;
    }
    const gastos = CATS.reduce((s, c) => s + ((a[c.key] as number) || 0), 0);
    const ingreso = a.biomasaCosechada * a.precioVenta;
    const ckg = a.biomasaCosechada > 0 ? gastos / a.biomasaCosechada : 0;
    const mg = ingreso > 0 ? ((ingreso - gastos) / ingreso * 100) : 0;
    const mx = Math.max(...CATS.map((c) => (a[c.key] as number) || 0), 1);
    return { agg: a, totalGastos: gastos, ingresoTotal: ingreso, costoKg: ckg, margen: mg, maxCat: mx };
  }, [records]);

  const current = editId ? records.find((r) => r.id === editId) : null;
  const [form, setForm] = useState<FinRecord>(current ?? emptyRec());

  useEffect(() => { setForm(current ?? emptyRec()); }, [editId]);

  const saveRecord = () => {
    const idx = records.findIndex((r) => r.id === form.id);
    let next: FinRecord[];
    if (idx >= 0) {
      next = records.map((r) => r.id === form.id ? form : r);
    } else {
      next = [...records, { ...form, id: `fin_${Date.now()}` }];
    }
    bulkSave(next);
    setEditId(null);
    toast(idx >= 0 ? t("finanzasCargado") : t("finanzasGuardar"), "success");
  };

  const doDelete = () => {
    if (!deleteConfirm) return;
    bulkSave(records.filter((r) => r.id !== deleteConfirm));
    setDeleteConfirm(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">{t("finanzasTitle")}</h2>
          <p className="page-subtitle">{t("finanzasSub")}</p>
        </div>
        {records.length > 0 && (
          <button className="btn-primary btn-sm" onClick={() => import("@/utils/excel").then(m => m.exportFinanzasExcel(records, currency.simbolo, code)).catch(() => {})}>⬇️ {t("exportExcel")}</button>
        )}
      </div>

      {records.length === 0 && (
        <div className="empty-state"><div className="empty-icon">💰</div><p>{t("finanzasSub")}</p><p style={{ marginTop: 8 }}>{t("seleccionar")}</p></div>
      )}

      {totalGastos > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">📊 {t("finanzasDistribucion")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {CATS.filter((c) => (agg[c.key] as number) > 0).map((c) => (
              <div key={c.key} className="chart-bar-row" style={{ gap: 8 }}>
                <span style={{ width: 100, fontSize: 12, flexShrink: 0 }}>{c.emoji} {t(c.i18nKey)}</span>
                <div className="chart-bar-wrap">
                  <div className="chart-bar" style={{ width: `${((agg[c.key] as number) / maxCat) * 100}%`, background: c.color }}>
                    {fmt((agg[c.key] as number))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {records.length > 0 && (
        <div className="card" style={{ borderColor: "var(--accent)", marginBottom: 16 }}>
          <div className="card-title">📋 {t("finanzasResumen")}</div>
          <div className="results-grid">
            <ResultCard label={t("finanzasTotal")} value={fmt(totalGastos)} highlight />
            <ResultCard label={t("finanzasIngresoTotal")} value={fmt(ingresoTotal)} highlight />
            <ResultCard label={t("finanzasCostoKg")} value={fmt(costoKg)} />
            <ResultCard label={t("finanzasMargen")} value={margen.toFixed(1) + "%"} highlight={margen > 0} />
          </div>
        </div>
      )}

      {records.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">🗂️ {t("fincas")}</div>
          <input type="text" placeholder="🔍 Filtrar por estanque..." value={finFilter} onChange={(e) => setFinFilter(e.target.value)} style={{ marginBottom: 10 }} />
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("estanque")}</th>
                  {CATS.map((c) => <th key={c.key}>{c.emoji}</th>)}
                  <th>{currency.simbolo} Total</th><th>💰/kg</th><th></th>
                </tr>
              </thead>
              <tbody>
                {records.filter((r) => !finFilter || r.fincaNombre.toLowerCase().includes(finFilter.toLowerCase())).map((r) => {
                  const rowTotal = CATS.reduce((s, c) => s + ((r[c.key] as number) || 0), 0);
                  const rowCostoKg = r.biomasaCosechada > 0 ? rowTotal / r.biomasaCosechada : 0;
                  return (
                    <tr key={r.id}>
                      <td><strong>{r.fincaNombre}</strong></td>
                      {CATS.map((c) => <td key={c.key}>{fmt((r[c.key] as number) || 0)}</td>)}
                      <td><strong>{fmt(rowTotal)}</strong></td>
                      <td>{fmt(rowCostoKg)}</td>
                      <td>
                        <button className="btn-sm" onClick={() => setEditId(r.id)}>✏️</button>
                        <button className="btn-sm" style={{ color: "var(--danger)" }} onClick={() => setDeleteConfirm(r.id)}>🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">{editId ? "✏️ Editar" : "➕ Agregar"} registro</div>
        <div className="form-grid">
          <label>{t("estanque")}
            <select value={form.fincaId} onChange={(e) => {
              const f = estanques.find((es) => es.id === e.target.value);
              setForm({ ...form, fincaId: f?.raw?.fincaId ?? e.target.value, fincaNombre: f?.label ?? e.target.value });
            }}>
              <option value="">{t("seleccionar")}</option>
              {estanques.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
            </select>
          </label>
          <label>{t("lote")}
            <select value={form.loteId} onChange={(e) => setForm({ ...form, loteId: e.target.value })}>
              <option value="">{t("seleccionar")}</option>
              {lotesActivos.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
            </select>
          </label>
          {CATS.map((c) => (
            <label key={c.key}>{c.emoji} {t(c.i18nKey)}<input type="number" value={(form[c.key] as number) || ""} onChange={(e) => setForm({ ...form, [c.key]: Number(e.target.value) })} placeholder="0" /></label>
          ))}
          <label>🐟 {t("finanzasBiomasaCosechada")}<input type="number" value={form.biomasaCosechada || ""} onChange={(e) => setForm({ ...form, biomasaCosechada: Number(e.target.value) })} placeholder="0" /></label>
          <label>💰 {t("finanzasPrecioVenta")}<input type="number" value={form.precioVenta || ""} onChange={(e) => setForm({ ...form, precioVenta: Number(e.target.value) })} placeholder="0" step="0.01" /></label>
          <label>📅 {t("finanzasCiclo")}<input type="number" value={form.diasCiclo || ""} onChange={(e) => setForm({ ...form, diasCiclo: Number(e.target.value) })} placeholder="150" /></label>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="calc-btn" style={{ marginTop: 12, flex: 1 }} onClick={saveRecord} disabled={saving}>
            {saving ? t("saving") : `💾 ${editId ? t("finanzasCargado") : t("finanzasGuardar")}`}
          </button>
          {saveState && <span className={`save-indicator ${saveState}`}>{saveState === "saving" ? "⏳" : "✅"}</span>}
        </div>
        {editId && (
          <button className="calc-btn" style={{ marginTop: 8, background: "var(--bg2)" }} onClick={() => setEditId(null)}>✖ Cancelar</button>
        )}
      </div>

      {deleteConfirm && (
        <ConfirmModal title="Eliminar registro" message="¿Estás seguro de eliminar este registro financiero?" danger onConfirm={doDelete} onCancel={() => setDeleteConfirm(null)} />
      )}
    </div>
  );
}

function ResultCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`result-card${highlight ? " highlight" : ""}`}>
      <div className="result-value">{value}</div>
      <div className="result-label">{label}</div>
    </div>
  );
}
