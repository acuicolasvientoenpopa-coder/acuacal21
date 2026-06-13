import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/store/auth";
import { useTranslation } from "@/store/language";
import { toast } from "@/components/Toast";
import { useLookups } from "@/store/lookups";
import { createApi } from "@/services/api";

export const ANTIBIOTICOS = [
  "Oxitetraciclina", "Florfenicol", "Enrofloxacina", "Sulfadiazina + Trimetoprima",
  "Amoxicilina", "Ácido oxolínico", "Oxitetraciclina + Neomicina",
];

export const TIPOS_MUESTRA = [
  "Branquias", "Piel / escamas", "Hígado", "Riñón", "Sangre", "Heces", "Agua del estanque", "Sedimento",
];

export const VIAS_ADMIN = [
  "Oral (alimento)", "Baño / inmersión", "Inyección", "Tópico",
];

const CULTIVOS_KEY = "acuical_cultivos";
const MEDICACION_KEY = "acuical_medicacion";

interface AntibiogramaEntry { antibiotico: string; sensibilidad: "S" | "I" | "R"; }

interface Cultivo {
  id: string; fecha: string; estanqueNombre: string; especie: string;
  tipoMuestra: string; organo: string; resultado: "positiva" | "negativa";
  agente: string; carga: string; antibiograma: AntibiogramaEntry[]; observaciones: string;
}

interface Medicacion {
  id: string; cultivoId?: string; estanqueNombre: string; fechaInicio: string;
  fechaFin: string; producto: string; dosis: string; via: string;
  duracion: number; retiroDias: number; responsable: string;
  estado: "en_curso" | "completado" | "suspendido";
}

function cultivoVacio(): Cultivo {
  return {
    id: "", fecha: new Date().toISOString().slice(0, 10), estanqueNombre: "", especie: "",
    tipoMuestra: "", organo: "", resultado: "positiva", agente: "", carga: "",
    antibiograma: ANTIBIOTICOS.map((a) => ({ antibiotico: a, sensibilidad: "S" as const })),
    observaciones: "",
  };
}

function medicacionVacia(): Medicacion {
  return {
    id: "", estanqueNombre: "", fechaInicio: new Date().toISOString().slice(0, 10),
    fechaFin: "", producto: "", dosis: "", via: "", duracion: 0, retiroDias: 0,
    responsable: "", estado: "en_curso",
  };
}

function exportCultivoPDF(c: Cultivo) {
  const lines = ["AcuiCal - Reporte de Cultivo", "", "Fecha: " + c.fecha, "Estanque: " + c.estanqueNombre,
    "Especie: " + c.especie, "Muestra: " + c.tipoMuestra + (c.organo ? " - " + c.organo : ""),
    "Resultado: " + c.resultado.toUpperCase(), "Agente: " + (c.agente || "—"), "Carga: " + (c.carga || ""), "",
    "--- Antibiograma ---"];
  c.antibiograma.forEach((a) => {
    const label = a.sensibilidad === "S" ? "Sensible" : a.sensibilidad === "I" ? "Intermedio" : "Resistente";
    lines.push(a.antibiotico + ": " + label);
  });
  if (c.observaciones) lines.push("", "Observaciones:", c.observaciones);
  const blob = new Blob([lines.join("\r\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "cultivo_" + c.id + ".txt"; a.click();
  URL.revokeObjectURL(url);
}

export default function Microbiologia() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { species: allSpecies, estanques } = useLookups();
  const [tab, setTab] = useState<"cultivos" | "medicacion">("cultivos");
  const [cultivos, setCultivos] = useState<Cultivo[]>([]);
  const [showCultivo, setShowCultivo] = useState(false);
  const [editCultivo, setEditCultivo] = useState<Cultivo | null>(null);
  const [cf, setCf] = useState<Cultivo>(cultivoVacio);
  const [medicacion, setMedicacion] = useState<Medicacion[]>([]);
  const [showMed, setShowMed] = useState(false);
  const [editMed, setEditMed] = useState<Medicacion | null>(null);
  const [mf, setMf] = useState<Medicacion>(medicacionVacia);
  const [filtroEst, setFiltroEst] = useState("");
  const [saving, setSaving] = useState(false);

  const client = useMemo(() => token ? createApi(token) : null, [token]);

  useEffect(() => {
    if (!client) return;
    client.get<any[]>("/microbiologia").then((data: any[]) => {
      const cults: Cultivo[] = []; const meds: Medicacion[] = [];
      for (const r of data) {
        try {
          const payload = JSON.parse(r.notas || "{}");
          if (r.resultado === "medicacion") { meds.push({ ...payload, id: r.id }); }
          else { cults.push({ ...payload, id: r.id, resultado: r.resultado }); }
        } catch {}
      }
      setCultivos(cults.length > 0 ? cults : (() => { try { return JSON.parse(localStorage.getItem(CULTIVOS_KEY) || "[]"); } catch { return []; } })());
      setMedicacion(meds.length > 0 ? meds : (() => { try { return JSON.parse(localStorage.getItem(MEDICACION_KEY) || "[]"); } catch { return []; } })());
      if (cults.length > 0) localStorage.setItem(CULTIVOS_KEY, JSON.stringify(cults));
      if (meds.length > 0) localStorage.setItem(MEDICACION_KEY, JSON.stringify(meds));
    }).catch(() => {
      try { setCultivos(JSON.parse(localStorage.getItem(CULTIVOS_KEY) || "[]")); } catch {}
      try { setMedicacion(JSON.parse(localStorage.getItem(MEDICACION_KEY) || "[]")); } catch {}
    });
  }, [client]);

  useEffect(() => {
    localStorage.setItem(CULTIVOS_KEY, JSON.stringify(cultivos));
  }, [cultivos]);
  useEffect(() => {
    localStorage.setItem(MEDICACION_KEY, JSON.stringify(medicacion));
  }, [medicacion]);

  useEffect(() => {
    const h = (e: StorageEvent) => {
      if (e.key === CULTIVOS_KEY) { try { setCultivos(JSON.parse(e.newValue || "[]")); } catch {} }
      if (e.key === MEDICACION_KEY) { try { setMedicacion(JSON.parse(e.newValue || "[]")); } catch {} }
    };
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, []);

  const openCultivo = (c?: Cultivo) => {
    if (c) { setEditCultivo(c); setCf({ ...c, antibiograma: [...c.antibiograma] }); }
    else { setEditCultivo(null); setCf(cultivoVacio()); }
    setShowCultivo(true);
  };

  const saveCultivo = async () => {
    if (!cf.fecha || !cf.estanqueNombre || !cf.especie) { toast("Completá fecha, estanque y especie", "error"); return; }
    const payload = { ...cf, id: editCultivo ? cf.id : "cult_" + Date.now() };
    setSaving(true);
    try {
      if (editCultivo) {
        const result = await client?.mutate("PUT", `/microbiologia/${payload.id}`, { resultado: cf.resultado, notas: JSON.stringify(payload), fecha: cf.fecha });
        if (result?.ok) payload.id = editCultivo.id;
      } else {
        const result = await client?.mutate("POST", "/microbiologia", { resultado: cf.resultado, notas: JSON.stringify(payload), fecha: cf.fecha });
        if (result?.ok && result.data?.id) payload.id = result.data.id;
      }
    } catch (e: any) { console.error("[Microbiologia] Error:", e?.message || e); toast("Error al guardar en servidor", "error"); } finally { setSaving(false); }
    const updated = editCultivo ? cultivos.map((c) => c.id === editCultivo.id ? payload : c) : [...cultivos, payload];
    setCultivos(updated);
    setShowCultivo(false);
    toast(editCultivo ? "Cultivo actualizado" : "Cultivo creado", "success");
  };

  const deleteCultivo = async (id: string) => {
    try { await client?.del(`/microbiologia/${id}`); } catch (e: any) { console.error("[Microbiologia] Error:", e?.message || e); }
    setCultivos(cultivos.filter((c) => c.id !== id));
    toast("Cultivo eliminado", "info");
  };

  const openMed = (m?: Medicacion) => {
    if (m) { setEditMed(m); setMf({ ...m }); }
    else { setEditMed(null); setMf(medicacionVacia()); }
    setShowMed(true);
  };

  const saveMed = async () => {
    if (!mf.fechaInicio || !mf.estanqueNombre || !mf.producto) { toast("Completá fecha, estanque y producto", "error"); return; }
    const payload = { ...mf, id: editMed ? mf.id : "med_" + Date.now() };
    setSaving(true);
    try {
      if (editMed) {
        const result = await client?.mutate("PUT", `/microbiologia/${payload.id}`, { resultado: "medicacion", notas: JSON.stringify(payload), fecha: mf.fechaInicio });
        if (result?.ok) payload.id = editMed.id;
      } else {
        const result = await client?.mutate("POST", "/microbiologia", { resultado: "medicacion", notas: JSON.stringify(payload), fecha: mf.fechaInicio });
        if (result?.ok && result.data?.id) payload.id = result.data.id;
      }
    } catch (e: any) { console.error("[Microbiologia] Error:", e?.message || e); toast("Error al guardar en servidor", "error"); } finally { setSaving(false); }
    const updated = editMed ? medicacion.map((m) => (m.id === editMed.id ? payload : m)) : [...medicacion, payload];
    setMedicacion(updated);
    setShowMed(false);
    toast(editMed ? "Medicación actualizada" : "Medicación creada", "success");
  };

  const deleteMed = async (id: string) => {
    try { await client?.del(`/microbiologia/${id}`); } catch (e: any) { console.error("[Microbiologia] Error:", e?.message || e); }
    setMedicacion(medicacion.filter((m) => m.id !== id));
    toast("Medicación eliminada", "info");
  };

  const filtradosC = useMemo(() => cultivos.filter((c) => !filtroEst || c.estanqueNombre.toLowerCase().includes(filtroEst.toLowerCase())), [cultivos, filtroEst]);
  const filtradosM = useMemo(() => medicacion.filter((c) => !filtroEst || c.estanqueNombre.toLowerCase().includes(filtroEst.toLowerCase())), [medicacion, filtroEst]);

  const estadoColor = (e: string) => e === "en_curso" ? "var(--accent3)" : e === "completado" ? "var(--accent)" : "var(--danger)";
  const estadoLabel = (e: string) => e === "en_curso" ? t("microEnCurso") : e === "completado" ? t("microCompletado") : t("microSuspendido");

  const diasRetiro = (m: Medicacion) => {
    if (!m.fechaFin || m.retiroDias <= 0) return null;
    const fin = new Date(m.fechaFin + "T00:00:00");
    const retiro = new Date(fin.getTime() + m.retiroDias * 86400000);
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const restantes = Math.ceil((retiro.getTime() - hoy.getTime()) / 86400000);
    return restantes > 0 ? restantes : 0;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">{t("microTitle")}</h2>
          <p className="page-subtitle">{t("microSub")}</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-grid">
          <label>{t("microEstanque")}<input value={filtroEst} onChange={(e) => setFiltroEst(e.target.value)} placeholder="Filtrar" /></label>
        </div>
      </div>

      <div className="tab-bar" style={{ marginBottom: 16 }}>
        <button className={`tab${tab === "cultivos" ? " active" : ""}`} onClick={() => setTab("cultivos")}>🧫 {t("microCultivos")}</button>
        <button className={`tab${tab === "medicacion" ? " active" : ""}`} onClick={() => setTab("medicacion")}>💊 {t("microMedicacion")}</button>
      </div>

      {tab === "cultivos" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button className="btn-primary btn-sm" onClick={() => openCultivo()}>＋ {t("microNuevoCultivo")}</button>
          </div>
          {filtradosC.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🧫</div><p>{t("microSinCultivos")}</p></div>
          ) : (
            <div className="species-list">
              {filtradosC.map((c) => (
                <div key={c.id} className="card">
                  <div className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>🧫 {c.fecha} — {c.estanqueNombre}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn-sm" onClick={() => openCultivo(c)}>✏️</button>
                      <button className="btn-sm" style={{ color: "var(--danger)" }} onClick={() => deleteCultivo(c.id)}>🗑️</button>
                    </div>
                  </div>
                  <div className="log-field"><div className="log-field-label">{t("especie")}</div><div className="log-field-value">{c.especie}</div></div>
                  <div className="log-field"><div className="log-field-label">Muestra</div><div className="log-field-value">{c.tipoMuestra}{c.organo ? ` (${c.organo})` : ""}</div></div>
                  <div className="log-field"><div className="log-field-label">{t("microResultado")}</div><div className="log-field-value"><span className={`badge ${c.resultado === "positiva" ? "badge-red" : "badge-green"}`}>{c.resultado}</span></div></div>
                  {c.resultado === "positiva" && <div className="log-field"><div className="log-field-label">Agente</div><div className="log-field-value">{c.agente || "—"} {c.carga ? `(${c.carga})` : ""}</div></div>}
                  {c.antibiograma.length > 0 && <div className="log-field"><div className="log-field-label">Antibiograma</div><div className="log-field-value" style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{c.antibiograma.filter((a) => a.sensibilidad !== "S").map((a) => <span key={a.antibiotico} className={`badge ${a.sensibilidad === "R" ? "badge-red" : "badge-yellow"}`}>{a.antibiotico} ({a.sensibilidad})</span>)}</div></div>}
                  <div className="card-actions" style={{ marginTop: 8 }}>
                    <button className="btn-sm" onClick={() => exportCultivoPDF(c)}>📄 PDF</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "medicacion" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button className="btn-primary btn-sm" onClick={() => openMed()}>＋ {t("microNuevaMedicacion")}</button>
          </div>
          {filtradosM.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">💊</div><p>{t("microSinMedicacion")}</p></div>
          ) : (
            <div className="species-list">
              {filtradosM.map((m) => (
                <div key={m.id} className="card">
                  <div className="card-title" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>💊 {m.producto} — {m.estanqueNombre}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn-sm" onClick={() => openMed(m)}>✏️</button>
                      <button className="btn-sm" style={{ color: "var(--danger)" }} onClick={() => deleteMed(m.id)}>🗑️</button>
                    </div>
                  </div>
                  <div className="log-field"><div className="log-field-label">Período</div><div className="log-field-value">{m.fechaInicio} → {m.fechaFin || "—"}</div></div>
                  <div className="log-field"><div className="log-field-label">{t("microDosis")}</div><div className="log-field-value">{m.dosis} — {m.via}</div></div>
                  <div className="log-field"><div className="log-field-label">{t("microEstado")}</div><div className="log-field-value"><span className="badge" style={{ background: estadoColor(m.estado), color: "#fff" }}>{estadoLabel(m.estado)}</span></div></div>
                  {m.retiroDias > 0 && diasRetiro(m) !== null && (
                    <div className="log-field"><div className="log-field-label">{t("microRetiro")}</div><div className="log-field-value">{diasRetiro(m)} días restantes</div></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showCultivo && (
        <div className="modal-overlay" onClick={() => setShowCultivo(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">🧫 {editCultivo ? "Editar" : "Nuevo"} Cultivo</div>
            <div className="form-grid">
              <label>Fecha<input type="date" value={cf.fecha} onChange={(e) => setCf({ ...cf, fecha: e.target.value })} /></label>
              <label>Estanque<select value={cf.estanqueNombre} onChange={(e) => setCf({ ...cf, estanqueNombre: e.target.value })}><option value="">Seleccionar</option>{estanques.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}</select></label>
              <label>Especie<select value={cf.especie} onChange={(e) => setCf({ ...cf, especie: e.target.value })}><option value="">Seleccionar</option>{allSpecies.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
              <label>Tipo muestra<select value={cf.tipoMuestra} onChange={(e) => setCf({ ...cf, tipoMuestra: e.target.value })}><option value="">Seleccionar</option>{TIPOS_MUESTRA.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
              <label>Órgano<input value={cf.organo} onChange={(e) => setCf({ ...cf, organo: e.target.value })} placeholder="Ej: branquias" /></label>
              <label>Resultado<select value={cf.resultado} onChange={(e) => setCf({ ...cf, resultado: e.target.value as any })}><option value="positiva">Positiva</option><option value="negativa">Negativa</option></select></label>
              {cf.resultado === "positiva" && <label>Agente<input value={cf.agente} onChange={(e) => setCf({ ...cf, agente: e.target.value })} placeholder="Ej: Aeromonas hydrophila" /></label>}
              {cf.resultado === "positiva" && <label>Carga<input value={cf.carga} onChange={(e) => setCf({ ...cf, carga: e.target.value })} placeholder="Ej: 10^5 UFC/mL" /></label>}
            </div>
            <div className="card-subtitle" style={{ margin: "16px 0 8px" }}>Antibiograma</div>
            <div className="form-grid">
              {cf.antibiograma.map((a, i) => (
                <label key={a.antibiotico} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, flex: 1 }}>{a.antibiotico}</span>
                  <select value={a.sensibilidad} onChange={(e) => {
                    const next = [...cf.antibiograma];
                    next[i] = { ...next[i], sensibilidad: e.target.value as any };
                    setCf({ ...cf, antibiograma: next });
                  }} style={{ width: 60, fontSize: 11 }}>
                    <option value="S">S</option><option value="I">I</option><option value="R">R</option>
                  </select>
                </label>
              ))}
            </div>
            <label style={{ marginTop: 12 }}>Observaciones<textarea value={cf.observaciones} onChange={(e) => setCf({ ...cf, observaciones: e.target.value })} rows={3} /></label>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCultivo(false)}>Cancelar</button>
              <button className="btn-primary" onClick={saveCultivo} disabled={saving}>{saving ? "Guardando..." : "💾 Guardar"}</button>
            </div>
          </div>
        </div>
      )}

      {showMed && (
        <div className="modal-overlay" onClick={() => setShowMed(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">💊 {editMed ? "Editar" : "Nueva"} Medicación</div>
            <div className="form-grid">
              <label>Estanque<select value={mf.estanqueNombre} onChange={(e) => setMf({ ...mf, estanqueNombre: e.target.value })}><option value="">Seleccionar</option>{estanques.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}</select></label>
              <label>Producto<input value={mf.producto} onChange={(e) => setMf({ ...mf, producto: e.target.value })} placeholder="Ej: Oxitetraciclina" /></label>
              <label>Fecha inicio<input type="date" value={mf.fechaInicio} onChange={(e) => setMf({ ...mf, fechaInicio: e.target.value })} /></label>
              <label>Fecha fin<input type="date" value={mf.fechaFin} onChange={(e) => setMf({ ...mf, fechaFin: e.target.value })} /></label>
              <label>Dosis<input value={mf.dosis} onChange={(e) => setMf({ ...mf, dosis: e.target.value })} placeholder="Ej: 5 g/100 kg" /></label>
              <label>Vía<select value={mf.via} onChange={(e) => setMf({ ...mf, via: e.target.value })}><option value="">Seleccionar</option>{VIAS_ADMIN.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
              <label>Duración (días)<input type="number" value={mf.duracion || ""} onChange={(e) => setMf({ ...mf, duracion: Number(e.target.value) })} /></label>
              <label>Retiro (días)<input type="number" value={mf.retiroDias || ""} onChange={(e) => setMf({ ...mf, retiroDias: Number(e.target.value) })} /></label>
              <label>Responsable<input value={mf.responsable} onChange={(e) => setMf({ ...mf, responsable: e.target.value })} /></label>
              <label>Estado<select value={mf.estado} onChange={(e) => setMf({ ...mf, estado: e.target.value as any })}><option value="en_curso">En curso</option><option value="completado">Completado</option><option value="suspendido">Suspendido</option></select></label>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowMed(false)}>Cancelar</button>
              <button className="btn-primary" onClick={saveMed} disabled={saving}>{saving ? "Guardando..." : "💾 Guardar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
