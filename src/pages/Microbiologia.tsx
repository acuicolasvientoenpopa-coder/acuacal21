import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/store/auth";
import { useTranslation } from "@/store/language";
import { toast } from "@/components/Toast";
import { useLookups } from "@/store/lookups";

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

const CULTIVOS_KEY = "aquacalc_cultivos";
const MEDICACION_KEY = "aquacalc_medicacion";

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
  const lines = ["AquaCalc - Reporte de Cultivo", "", "Fecha: " + c.fecha, "Estanque: " + c.estanqueNombre,
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
  const { token, apiUrl } = useAuth();
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

  const api = useCallback(async (path: string, opts?: RequestInit) => {
    const res = await fetch(apiUrl + path, {
      ...opts,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...opts?.headers },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }, [apiUrl, token]);

  useEffect(() => {
    api("/microbiologia").then((data: any[]) => {
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
  }, [api]);

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
        await api(`/microbiologia/${payload.id}`, { method: "PUT", body: JSON.stringify({ resultado: cf.resultado, notas: JSON.stringify(payload), fecha: cf.fecha }) });
      } else {
        const created = await api("/microbiologia", { method: "POST", body: JSON.stringify({ resultado: cf.resultado, notas: JSON.stringify(payload), fecha: cf.fecha }) });
        if (created?.id) payload.id = created.id;
      }
    } catch {} finally { setSaving(false); }
    const updated = editCultivo ? cultivos.map((c) => c.id === editCultivo.id ? payload : c) : [...cultivos, payload];
    setCultivos(updated);
    setShowCultivo(false);
    toast(editCultivo ? "Cultivo actualizado" : "Cultivo creado", "success");
  };

  const deleteCultivo = async (id: string) => {
    try { await api(`/microbiologia/${id}`, { method: "DELETE" }); } catch {}
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
        await api(`/microbiologia/${payload.id}`, { method: "PUT", body: JSON.stringify({ resultado: "medicacion", notas: JSON.stringify(payload), fecha: mf.fechaInicio }) });
      } else {
        const created = await api("/microbiologia", { method: "POST", body: JSON.stringify({ resultado: "medicacion", notas: JSON.stringify(payload), fecha: mf.fechaInicio }) });
        if (created?.id) payload.id = created.id;
      }
    } catch {} finally { setSaving(false); }
    const updated = editMed ? medicacion.map((m) => (m.id === editMed.id ? payload : m)) : [...medicacion, payload];
    setMedicacion(updated);
    setShowMed(false);
    toast(editMed ? "Medicación actualizada" : "Medicación creada", "success");
  };

  const deleteMed = async (id: string) => {
    try { await api(`/microbiologia/${id}`, { method: "DELETE" }); } catch {}
    setMedicacion(medicacion.filter((m) => m.id !== id));
    toast("Medicación eliminada", "info");
  };

  const filtradosC = cultivos.filter((c) => !filtroEst || c.estanqueNombre.toLowerCase().includes(filtroEst.toLowerCase()));
  const filtradosM = medicacion.filter((c) => !filtroEst || c.estanqueNombre.toLowerCase().includes(filtroEst.toLowerCase()));

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

      <div className="mini-tabs" style={{ marginBottom: 16 }}>
        <button className={"mini-tab" + (tab === "cultivos" ? " active" : "")} onClick={() => setTab("cultivos")}>🧫 {t("microCultivos")} ({cultivos.length})</button>
        <button className={"mini-tab" + (tab === "medicacion" ? " active" : "")} onClick={() => setTab("medicacion")}>💊 {t("microMedicacion")} ({medicacion.length})</button>
      </div>

      {medicacion.length > 0 && (
        <div className="card" style={{ marginBottom: 16, borderColor: "var(--accent3)" }}>
          <div className="card-title">📋 {t("microUltimoTratamiento")}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {medicacion.filter((m) => { const r = diasRetiro(m); return r !== null && r > 0; }).slice(0, 5).map((m) => (
              <div key={m.id} className="vet-tag" style={{ background: "var(--surface2)", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)" }}>
                <strong style={{ fontSize: 13 }}>{m.estanqueNombre}</strong>
                <span style={{ fontSize: 11, color: "var(--text2)", display: "block" }}>{m.producto}</span>
                <span style={{ fontSize: 11, color: "var(--accent3)" }}>{t("microRetiroActivo")}: {diasRetiro(m)} {t("microDiasRestantes")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "cultivos" && (
        <div>
          <button className="btn-primary btn-sm" style={{ marginBottom: 12 }} onClick={() => openCultivo()}>＋ {t("microNuevoCultivo")}</button>
          {filtradosC.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🧫</div><p>{t("microSinCultivos")}</p></div>
          ) : (
            <div className="card">
              {filtradosC.map((c) => (
                <div key={c.id} style={{ borderBottom: "1px solid var(--border)", padding: "12px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <strong>{c.estanqueNombre}</strong>
                      <span style={{ fontSize: 12, color: "var(--text2)", marginLeft: 8 }}>{c.fecha}</span>
                      <span className={"vet-tag " + (c.resultado === "positiva" ? "riesgo-rojo" : "riesgo-verde")} style={{ marginLeft: 8, fontSize: 11 }}>{c.resultado === "positiva" ? t("microPositiva") : t("microNegativa")}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn-sm" onClick={() => openCultivo(c)}>✏️</button>
                      <button className="btn-sm" onClick={() => deleteCultivo(c.id)}>🗑️</button>
                      <button className="btn-sm" onClick={() => { exportCultivoPDF(c); toast("PDF descargado", "info"); }}>📄</button>
                    </div>
                  </div>
                  {c.agente && <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>{c.agente} — {c.carga}</div>}
                  {c.antibiograma.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                      {c.antibiograma.filter((a) => a.sensibilidad === "R").slice(0, 3).map((a) => (
                        <span key={a.antibiotico} className="vet-tag" style={{ fontSize: 10, background: "rgba(220,60,50,0.15)", color: "var(--danger)" }}>{a.antibiotico}: R</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "medicacion" && (
        <div>
          <button className="btn-primary btn-sm" style={{ marginBottom: 12 }} onClick={() => openMed()}>＋ {t("microNuevaMedicacion")}</button>
          {filtradosM.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">💊</div><p>{t("microSinMedicacion")}</p></div>
          ) : (
            <div className="card">
              {filtradosM.map((m) => {
                const rest = diasRetiro(m);
                return (
                  <div key={m.id} style={{ borderBottom: "1px solid var(--border)", padding: "12px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <strong>{m.estanqueNombre}</strong>
                        <span style={{ fontSize: 12, color: "var(--text2)", marginLeft: 8 }}>{m.producto}</span>
                        <span className="vet-tag" style={{ fontSize: 11, background: estadoColor(m.estado) + "22", color: estadoColor(m.estado), border: "1px solid " + estadoColor(m.estado), marginLeft: 8 }}>{estadoLabel(m.estado)}</span>
                        {rest !== null && rest > 0 && <span className="vet-tag" style={{ fontSize: 11, background: "rgba(220,60,50,0.12)", color: "var(--danger)", marginLeft: 6 }}>⏳ {rest} {t("microDiasRestantes")}</span>}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn-sm" onClick={() => openMed(m)}>✏️</button>
                        <button className="btn-sm" onClick={() => deleteMed(m.id)}>🗑️</button>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 4 }}>{m.fechaInicio} → {m.fechaFin || "—"} | {m.via} | {m.dosis} | {t("microResponsable")}: {m.responsable || "—"}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showCultivo && (
        <div className="modal-overlay" onClick={() => setShowCultivo(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>{editCultivo ? t("microEditarCultivo") : t("microNuevoCultivo")}</h3><button className="modal-close" onClick={() => setShowCultivo(false)}>✕</button></div>
            <div className="form-grid">
              <label>{t("microFecha")}<input type="date" value={cf.fecha} onChange={(e) => setCf({ ...cf, fecha: e.target.value })} /></label>
              <label>{t("microEstanque")}<select value={cf.estanqueNombre} onChange={(e) => setCf({ ...cf, estanqueNombre: e.target.value })}><option value="">{t("seleccionar")}</option>{estanques.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}</select></label>
              <label>{t("microEspecie")}<select value={cf.especie} onChange={(e) => setCf({ ...cf, especie: e.target.value })}><option value="">{t("seleccionar")}</option>{allSpecies.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
              <label>{t("microTipoMuestra")}<select value={cf.tipoMuestra} onChange={(e) => setCf({ ...cf, tipoMuestra: e.target.value })}><option value="">—</option>{TIPOS_MUESTRA.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
              <label>{t("microOrgano")}<input value={cf.organo} onChange={(e) => setCf({ ...cf, organo: e.target.value })} placeholder="Ej: Branquias" /></label>
              <label>{t("microResultado")}<select value={cf.resultado} onChange={(e) => setCf({ ...cf, resultado: e.target.value as "positiva" | "negativa" })}><option value="positiva">{t("microPositiva")}</option><option value="negativa">{t("microNegativa")}</option></select></label>
              <label>{t("microAgente")}<input value={cf.agente} onChange={(e) => setCf({ ...cf, agente: e.target.value })} placeholder="Ej: Aeromonas hydrophila" /></label>
              <label>{t("microCarga")}<input value={cf.carga} onChange={(e) => setCf({ ...cf, carga: e.target.value })} placeholder="Ej: +++ / UFC" /></label>
            </div>
            <div style={{ marginTop: 16 }}>
              <div className="card-title">{t("microAntibiograma")}</div>
              <div style={{ overflowX: "auto" }}>
                <table className="zoo-table" style={{ fontSize: 12 }}>
                  <thead><tr><th>{t("microAntibiotico")}</th><th>{t("microSensible")}</th><th>{t("microIntermedio")}</th><th>{t("microResistente")}</th></tr></thead>
                  <tbody>
                    {cf.antibiograma.map((a, i) => (
                      <tr key={a.antibiotico}>
                        <td>{a.antibiotico}</td>
                        {(["S", "I", "R"] as const).map((val) => (
                          <td key={val} style={{ textAlign: "center" }}>
                            <input type="radio" name={"ab_" + i} checked={cf.antibiograma[i].sensibilidad === val}
                              onChange={() => { const ab = [...cf.antibiograma]; ab[i] = { ...ab[i], sensibilidad: val }; setCf({ ...cf, antibiograma: ab }); }} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <label style={{ marginTop: 12, display: "block" }}>{t("microObservaciones")}<textarea value={cf.observaciones} onChange={(e) => setCf({ ...cf, observaciones: e.target.value })} rows={2} /></label>
            <div className="modal-actions"><button className="btn-primary" onClick={saveCultivo} disabled={saving}>{saving ? t("saving") : t("save")}</button><button className="btn-secondary" onClick={() => setShowCultivo(false)}>{t("cancel")}</button></div>
          </div>
        </div>
      )}

      {showMed && (
        <div className="modal-overlay" onClick={() => setShowMed(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>{editMed ? "Editar" : t("microNuevaMedicacion")}</h3><button className="modal-close" onClick={() => setShowMed(false)}>✕</button></div>
            <div className="form-grid">
              <label>{t("microEstanque")}<select value={mf.estanqueNombre} onChange={(e) => setMf({ ...mf, estanqueNombre: e.target.value })}><option value="">{t("seleccionar")}</option>{estanques.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}</select></label>
              <label>{t("microProducto")}<input value={mf.producto} onChange={(e) => setMf({ ...mf, producto: e.target.value })} placeholder="Ej: Oxitetraciclina" /></label>
              <label>{t("microFechaInicio")}<input type="date" value={mf.fechaInicio} onChange={(e) => setMf({ ...mf, fechaInicio: e.target.value })} /></label>
              <label>{t("microFechaFin")}<input type="date" value={mf.fechaFin} onChange={(e) => setMf({ ...mf, fechaFin: e.target.value })} /></label>
              <label>{t("microDosis")}<input value={mf.dosis} onChange={(e) => setMf({ ...mf, dosis: e.target.value })} placeholder="Ej: 50 mg/kg" /></label>
              <label>{t("microVia")}<select value={mf.via} onChange={(e) => setMf({ ...mf, via: e.target.value })}><option value="">—</option>{VIAS_ADMIN.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
              <label>{t("microDuracion")}<input type="number" value={mf.duracion || ""} onChange={(e) => setMf({ ...mf, duracion: Number(e.target.value) })} placeholder="0" /></label>
              <label>{t("microRetiro")}<input type="number" value={mf.retiroDias || ""} onChange={(e) => setMf({ ...mf, retiroDias: Number(e.target.value) })} placeholder="0" /></label>
              <label>{t("microResponsable")}<input value={mf.responsable} onChange={(e) => setMf({ ...mf, responsable: e.target.value })} placeholder="Nombre" /></label>
              <label>{t("microEstado")}<select value={mf.estado} onChange={(e) => setMf({ ...mf, estado: e.target.value as "en_curso" | "completado" | "suspendido" })}><option value="en_curso">{t("microEnCurso")}</option><option value="completado">{t("microCompletado")}</option><option value="suspendido">{t("microSuspendido")}</option></select></label>
            </div>
            <div className="modal-actions"><button className="btn-primary" onClick={saveMed} disabled={saving}>{saving ? t("saving") : t("save")}</button><button className="btn-secondary" onClick={() => setShowMed(false)}>{t("cancel")}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
