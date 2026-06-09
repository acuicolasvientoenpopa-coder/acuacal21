import { useState, useEffect } from "react";
import { useTranslation } from "@/store/language";
import { ESPECIES_DEFAULT, OBSERVACIONES, validateWaterQuality, validateBitacoraForm } from "@/core";
import { toast } from "@/components/Toast";
import { exportBitacoraPDF } from "@/utils/pdf";

const RECORDS_KEY = "aquacalc_bitacora";

type RecordData = {
  id: string;
  fecha: string;
  estanque: string;
  especie: string;
  alimento: string;
  mortalidades: string;
  pesoMuestreo: string;
  oxigeno: string;
  temperatura: string;
  ph: string;
  amonio: string;
  nitrito: string;
  salinidad: string;
  biomasa: string;
  sgr: string;
  fcrAcum: string;
  observaciones: string;
  createdAt: string;
};

const emptyRecord = (): RecordData => ({
  id: "", fecha: "", estanque: "", especie: "", alimento: "", mortalidades: "",
  pesoMuestreo: "", oxigeno: "", temperatura: "", ph: "", amonio: "",
  nitrito: "", salinidad: "", biomasa: "", sgr: "", fcrAcum: "", observaciones: "", createdAt: "",
});

function loadRecords(): RecordData[] {
  try { return JSON.parse(localStorage.getItem(RECORDS_KEY) || "[]"); }
  catch { return []; }
}

export default function Bitacora() {
  const { t } = useTranslation();
  const [records, setRecords] = useState<RecordData[]>(loadRecords);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RecordData>(emptyRecord);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    const h = (e: StorageEvent) => {
      if (e.key === RECORDS_KEY) setRecords(loadRecords());
    };
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, []);

  const openForm = () => {
    setForm({ ...emptyRecord(), fecha: new Date().toISOString().slice(0, 10), id: `r_${Date.now()}` });
    setShowForm(true);
  };

  const setF = (key: keyof RecordData, val: string) => {
    setForm({ ...form, [key]: val });
    if (["oxigeno","temperatura","ph","amonio","nitrito","salinidad"].includes(key)) {
      const next = { ...form, [key]: val };
      const wq = validateWaterQuality({
        oxigeno: Number(next.oxigeno) || null,
        temperatura: Number(next.temperatura) || null,
        ph: Number(next.ph) || null,
        amonio: Number(next.amonio) || null,
        nitrito: Number(next.nitrito) || null,
      });
      setErrors((prev) => {
        const e = { ...prev };
        Object.entries(wq.errors).forEach(([fld, msg]) => { e[fld] = msg; });
        Object.entries(wq.warnings).forEach(([fld, msg]) => { e[fld] = msg; });
        return e;
      });
    }
  };

  const canSave = form.fecha && form.estanque.trim() && form.especie;

  const save = () => {
    if (!canSave) return;
    const rec = { ...form, createdAt: new Date().toISOString() };
    const bf = validateBitacoraForm({
      fecha: rec.fecha,
      estanque: rec.estanque,
      alimento: Number(rec.alimento) || null,
      mortalidad: Number(rec.mortalidades) || null,
      ph: Number(rec.ph) || null,
    });
    if (!bf.valid) { Object.values(bf.errors).forEach((msg) => toast(msg, "error")); return; }
    setRecords([rec, ...records]);
    setShowForm(false);
  };

  const remove = (id: string) => {
    setRecords(records.filter((r) => r.id !== id));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">{t("bitacoraTitle")}</h2>
          <p className="page-subtitle">{t("bitacoraSub")}</p>
        </div>
        <button className="btn-primary" onClick={showForm ? () => setShowForm(false) : openForm}>
          {showForm ? `✕ ${t("cerrar")}` : `＋ ${t("nuevoRegistro")}`}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <div className="card-title">📝 {t("nuevoRegistroTitle")}</div>
          <div className="form-grid">
            <label>{t("fecha")}<input type="date" value={form.fecha} onChange={(e) => setF("fecha", e.target.value)} /></label>
            <label>{t("estanque")}<input type="text" value={form.estanque} onChange={(e) => setF("estanque", e.target.value)} placeholder={`Ej: ${t("estanque")} 1`} /></label>
            <label>{t("especie")}
              <select value={form.especie} onChange={(e) => setF("especie", e.target.value)}>
                <option value="">{t("seleccionar")}</option>
                {ESPECIES_DEFAULT.map((s) => (
                  <option key={s.id} value={s.id}>{t(`sp_${s.id}` as any)}</option>
                ))}
              </select>
            </label>
            <label>{t("alimento")}<input type="number" step="0.1" value={form.alimento} onChange={(e) => setF("alimento", e.target.value)} placeholder="0.0" /></label>
            <label>{t("mortalidades")}<input type="number" value={form.mortalidades} onChange={(e) => setF("mortalidades", e.target.value)} placeholder="0" /></label>
            <label>{t("pesoMuestreo")}<input type="number" step="0.1" value={form.pesoMuestreo} onChange={(e) => setF("pesoMuestreo", e.target.value)} placeholder="0.0" /></label>
          </div>

          <div className="card-section">
            <div className="card-subtitle">💧 {t("calidadAgua")}</div>
            <div className="form-grid">
              <label>{t("oxigeno")}<input type="number" step="0.1" value={form.oxigeno} onChange={(e) => setF("oxigeno", e.target.value)} placeholder="0.0" />{errors.oxigeno && <span className="field-error">{errors.oxigeno}</span>}</label>
              <label>{t("temperatura")}<input type="number" step="0.1" value={form.temperatura} onChange={(e) => setF("temperatura", e.target.value)} placeholder="0.0" />{errors.temperatura && <span className="field-error">{errors.temperatura}</span>}</label>
              <label>{t("ph")}<input type="number" step="0.1" value={form.ph} onChange={(e) => setF("ph", e.target.value)} placeholder="0.0" />{errors.ph && <span className="field-error">{errors.ph}</span>}</label>
              <label>{t("amonio")}<input type="number" step="0.01" value={form.amonio} onChange={(e) => setF("amonio", e.target.value)} placeholder="0.00" />{errors.amonio && <span className="field-error">{errors.amonio}</span>}</label>
              <label>{t("nitrito")}<input type="number" step="0.01" value={form.nitrito} onChange={(e) => setF("nitrito", e.target.value)} placeholder="0.00" />{errors.nitrito && <span className="field-error">{errors.nitrito}</span>}</label>
              <label>{t("salinidad")}<input type="number" step="0.1" value={form.salinidad} onChange={(e) => setF("salinidad", e.target.value)} placeholder="0.0" />{errors.salinidad && <span className="field-error">{errors.salinidad}</span>}</label>
            </div>
          </div>

          <div className="card-section" style={{ background: "rgba(0,200,150,0.04)", border: "1px solid rgba(0,200,150,0.15)", borderRadius: 10, padding: 14 }}>
            <div className="card-subtitle" style={{ color: "var(--accent)" }}>👀 {t("observaciones")}</div>
            <div className="obs-checks">
              {OBSERVACIONES.map((obs) => {
                const checked = form.observaciones?.split(",").includes(obs);
                return (
                  <label
                    key={obs}
                    className={`obs-check${checked ? " selected" : ""}`}
                    onClick={() => {
                      const arr = form.observaciones ? form.observaciones.split(",").filter(Boolean) : [];
                      const next = checked ? arr.filter((o) => o !== obs) : [...arr, obs];
                      setF("observaciones", next.join(","));
                    }}
                  >
                    <span className="obs-check-label">{obs.replace(/_/g, " ")}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="card-section">
            <div className="card-subtitle">🔬 {t("datosZoo")}</div>
            <div className="form-grid">
              <label>{t("biomasaEstanque")}<input type="number" step="0.1" value={form.biomasa} onChange={(e) => setF("biomasa", e.target.value)} placeholder="0.0" /></label>
              <label>{t("sgrLabel")}<input type="number" step="0.01" value={form.sgr} onChange={(e) => setF("sgr", e.target.value)} placeholder="0.00" /></label>
              <label>{t("fcrAcum")}<input type="number" step="0.01" value={form.fcrAcum} onChange={(e) => setF("fcrAcum", e.target.value)} placeholder="0.00" /></label>
            </div>
          </div>

          <div className="card-actions">
            <button className="btn-secondary" onClick={() => setShowForm(false)}>{t("cancelar")}</button>
            <button className="btn-primary" onClick={save} disabled={!canSave}>💾 {t("guardarRegistro")}</button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{t("historial")}</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {records.length > 0 && <button className="btn-secondary btn-sm" onClick={() => exportBitacoraPDF(records, (k: string) => t(k as any))}>{t("exportPDF")}</button>}
            <span className="badge badge-green">{records.length} {t("entradas")}</span>
          </div>
        </div>
        {records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>{t("sinRegistros")}</p>
          </div>
        ) : (
          <div>
            {records.map((r) => {
              const wqOk = (v: string, min: number, max: number) => {
                const n = Number(v);
                return isNaN(n) || n === 0 ? "" : n >= min && n <= max ? "wq-ok" : "wq-alert";
              };
              const obsList = r.observaciones ? r.observaciones.split(",").filter(Boolean) : [];
              return (
                <div key={r.id} className="bio-card">
                  <div className="bio-card-header">
                    <div className="bio-card-meta">
                      <span className="bio-date">{r.fecha}</span>
                      <span className="bio-pond">{t("estanque")}: <strong>{r.estanque}</strong></span>
                      <span className="bio-species">{t(`sp_${r.especie}` as any)}</span>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(r.id)}>{t("eliminar")}</button>
                  </div>
                  <div className="bio-card-body">
                    <div className="bio-group">
                      <div className="bio-group-title">{t("alimento")} & {t("mortalidades")}</div>
                      <div className="bio-inline">
                        <span className="bio-chip"><span className="bio-chip-label">{t("alimento")}</span> {r.alimento || "—"}</span>
                        <span className="bio-chip"><span className="bio-chip-label">{t("mortalidades")}</span> {r.mortalidades || "—"}</span>
                        <span className="bio-chip"><span className="bio-chip-label">{t("pesoMuestreo")}</span> {r.pesoMuestreo || "—"} g</span>
                      </div>
                    </div>
                    <div className="bio-group">
                      <div className="bio-group-title">💧 {t("calidadAgua")}</div>
                      <div className="bio-inline">
                        <span className={`bio-wq ${wqOk(r.oxigeno, 2, 20)}`}><span className="bio-chip-label">{t("oxigeno")}</span> {r.oxigeno || "—"}</span>
                        <span className={`bio-wq ${wqOk(r.temperatura, 5, 35)}`}><span className="bio-chip-label">{t("temperatura")}</span> {r.temperatura || "—"}°C</span>
                        <span className={`bio-wq ${wqOk(r.ph, 6, 9)}`}><span className="bio-chip-label">{t("ph")}</span> {r.ph || "—"}</span>
                        <span className={`bio-wq ${wqOk(r.amonio, 0, 0.5)}`}><span className="bio-chip-label">{t("amonio")}</span> {r.amonio || "—"}</span>
                        <span className={`bio-wq ${wqOk(r.nitrito, 0, 0.3)}`}><span className="bio-chip-label">{t("nitrito")}</span> {r.nitrito || "—"}</span>
                        <span className={`bio-wq ${wqOk(r.salinidad, 0, 35)}`}><span className="bio-chip-label">{t("salinidad")}</span> {r.salinidad || "—"}</span>
                      </div>
                    </div>
                    <div className="bio-group">
                      <div className="bio-group-title">🔬 {t("datosZoo")}</div>
                      <div className="bio-inline">
                        <span className="bio-chip"><span className="bio-chip-label">{t("biomasaEstanque")}</span> {r.biomasa || "—"} kg</span>
                        <span className="bio-chip"><span className="bio-chip-label">{t("sgrLabel")}</span> {r.sgr || "—"}</span>
                        <span className="bio-chip"><span className="bio-chip-label">{t("fcrAcum")}</span> {r.fcrAcum || "—"}</span>
                      </div>
                    </div>
                    {obsList.length > 0 && (
                      <div className="bio-obs">
                        {obsList.map((o) => <span key={o} className="bio-obs-tag">{o.replace(/_/g, " ")}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
