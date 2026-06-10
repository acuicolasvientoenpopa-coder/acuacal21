import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "@/store/language";
import {
  ALIMENTACION_RULES,
  COMPORTAMIENTO_RULES,
  SINTOMAS_RULES,
  AGUA_RULES,
  generateResumen,
} from "./symptomRules";
import { calcularRiesgo } from "./riskCalculator";
import type { RiskResult } from "./riskCalculator";
import { exportVetPDF } from "@/utils/pdf";

type FormData = {
  estanque: string;
  alimentacion: string[];
  comportamiento: string[];
  sintomas: string[];
  agua: string[];
  imagenes: string[];
};

type ArrKeys = "alimentacion" | "comportamiento" | "sintomas" | "agua" | "imagenes";
type RiesgoLevel = "rojo" | "amarillo" | "verde";

interface SavedReport {
  id: string;
  fecha: string;
  pondName: string;
  riesgo: RiesgoLevel;
  puntaje: number;
  diagnosticos: { diagnosis: string; weight: number }[];
  resumen: string;
  acciones: string[];
  imagenes: string[];
  lang: string;
}

const EMPTY_FORM: FormData = {
  estanque: "",
  alimentacion: [],
  comportamiento: [],
  sintomas: [],
  agua: [],
  imagenes: [],
};

const STEPS = [
  { key: "estanque" as const, titleKey: "vetEstanque" as const, icon: "🏞️" },
  { key: "alimentacion" as const, titleKey: "vetAlimentacion" as const, icon: "🍽️" },
  { key: "comportamiento" as const, titleKey: "vetComportamiento" as const, icon: "🐟" },
  { key: "sintomas" as const, titleKey: "vetSintomas" as const, icon: "🔍" },
  { key: "agua" as const, titleKey: "vetAgua" as const, icon: "💧" },
  { key: "resumen" as const, titleKey: "vetResumen" as const, icon: "📋" },
];

const STEP_EMOJIS: Record<string, string> = {
  estanque: "🏞️", alimentacion: "🍽️", comportamiento: "🐟", sintomas: "🔍", agua: "💧", resumen: "📋",
};

const STORAGE_KEY = "aquacalc_vet_reports";

function loadReports(): SavedReport[] {
  try {
    const d = localStorage.getItem(STORAGE_KEY);
    return d ? JSON.parse(d) : [];
  } catch { return []; }
}

function saveReports(reports: SavedReport[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(reports)); } catch { /* ignore */ }
}

function getPondos(): { id: string; label: string }[] {
  try {
    const saved = localStorage.getItem("aquacalc_fincas");
    if (saved) {
      const fincas = JSON.parse(saved);
      if (Array.isArray(fincas) && fincas.length > 0) {
        return [
          ...fincas.map((f: { id: string; nombre: string }) => ({ id: f.id, label: f.nombre })),
          { id: "general", label: "General / toda la finca" },
        ];
      }
    }
  } catch { /* ignore */ }
  return [{ id: "general", label: "General / toda la finca" }];
}

export default function VeterinaryReportWizard() {
  const { t, lang } = useTranslation();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [result, setResult] = useState<{ diagnosticos: { diagnosis: string; weight: number }[]; riesgo: RiskResult } | null>(null);
  const [pondos, setPondos] = useState(getPondos);
  const [addingPond, setAddingPond] = useState(false);
  const [newPondName, setNewPondName] = useState("");
  const [mode, setMode] = useState<"wizard" | "history">("wizard");
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [viewingReport, setViewingReport] = useState<SavedReport | null>(null);

  useEffect(() => { setReports(loadReports()); }, []);

  const createPond = () => {
    const name = newPondName.trim();
    if (!name) return;
    const newFinca = { id: "f_" + Date.now(), nombre: name, ubicacion: "", descripcion: "" };
    try {
      const saved = localStorage.getItem("aquacalc_fincas");
      const fincas = saved ? JSON.parse(saved) : [];
      fincas.push(newFinca);
      localStorage.setItem("aquacalc_fincas", JSON.stringify(fincas));
    } catch { /* ignore */ }
    setPondos(getPondos());
    setForm((prev) => ({ ...prev, estanque: newFinca.id }));
    setNewPondName("");
    setAddingPond(false);
  };

  const toggle = useCallback((key: ArrKeys, id: string) => {
    setForm((prev) => {
      const arr = prev[key];
      const next = arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
      return { ...prev, [key]: next };
    });
  }, []);

  const canAdvance = useCallback(() => {
    if (step === 0) return form.estanque !== "";
    if (step <= 4) {
      const arr = form[STEPS[step].key as ArrKeys];
      return arr.length > 0;
    }
    return true;
  }, [step, form]);

  const next = useCallback(() => {
    if (step === 4) {
      const allDiagnosticos = [
        ...ALIMENTACION_RULES.filter((r) => form.alimentacion.includes(r.id)).map((r) => ({ diagnosis: r.diagnosis, weight: r.weight })),
        ...COMPORTAMIENTO_RULES.filter((r) => form.comportamiento.includes(r.id)).map((r) => ({ diagnosis: r.diagnosis, weight: r.weight })),
        ...SINTOMAS_RULES.filter((r) => form.sintomas.includes(r.id)).map((r) => ({ diagnosis: r.diagnosis, weight: r.weight })),
        ...AGUA_RULES.filter((r) => form.agua.includes(r.id)).map((r) => ({ diagnosis: r.diagnosis, weight: r.weight })),
      ];
      setResult({ diagnosticos: allDiagnosticos, riesgo: calcularRiesgo(allDiagnosticos) });
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, [step, form]);

  const prev = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  const reset = useCallback(() => {
    if (result) {
      const pondName = pondos.find((p) => p.id === form.estanque)?.label || form.estanque;
      const acciones: string[] = [];
      const r = result.riesgo.riesgo;
      if (r === "rojo") acciones.push(t("vetAccion1"), t("vetAccion2"), t("vetAccion3"));
      else if (r === "amarillo") acciones.push(t("vetAccion4"), t("vetAccion5"));
      else acciones.push(t("vetAccion6"));
      const report: SavedReport = {
        id: "vr_" + Date.now(),
        fecha: new Date().toLocaleDateString(),
        pondName,
        riesgo: r,
        puntaje: result.riesgo.puntaje,
        diagnosticos: result.diagnosticos,
        resumen: generateResumen(result.diagnosticos.map((d) => d.diagnosis), r, lang),
        acciones,
        imagenes: form.imagenes,
        lang,
      };
      const updated = [report, ...loadReports()];
      saveReports(updated);
      setReports(updated);
    }
    setForm(EMPTY_FORM);
    setStep(0);
    setResult(null);
  }, [result, form, pondos, t, lang]);

  const isSummaryStep = step === 5;
  const pct = ((step + 1) / STEPS.length) * 100;

  const diagnosticos = result?.diagnosticos ?? [];
  const riesgo = result?.riesgo;

  const handleExportPDF = (rep?: SavedReport) => {
    const d = rep || result;
    if (!d) return;
    const pondName = rep ? rep.pondName : pondos.find((p) => p.id === form.estanque)?.label || form.estanque;
    const acciones = rep ? rep.acciones : [];
    const imagenes = rep ? rep.imagenes : form.imagenes;
    const diag = rep ? rep.diagnosticos : (result?.diagnosticos ?? []);
    const puntaje = rep ? rep.puntaje : (result?.riesgo.puntaje ?? 0);
    const riesgoLabel = rep ? rep.riesgo : (result?.riesgo.riesgo ?? "verde");
    const resumen = rep ? rep.resumen : (result ? generateResumen(result.diagnosticos.map((d) => d.diagnosis), result.riesgo.riesgo, lang) : "");
    exportVetPDF({
      pondName,
      fecha: rep?.fecha || new Date().toLocaleDateString(),
      symptons: { alimentacion: [], comportamiento: [], sintomas: [], agua: [] },
      diagnosticos: diag,
      riesgo: { puntaje, riesgo: riesgoLabel },
      resumen,
      acciones,
      imagenes,
      lang: rep?.lang || lang,
    }, t as (k: string) => string);
  };

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setForm((prev) => ({ ...prev, imagenes: [...prev.imagenes, dataUrl] }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({ ...prev, imagenes: prev.imagenes.filter((_, i) => i !== index) }));
  };

  const deleteReport = (id: string) => {
    const updated = reports.filter((r) => r.id !== id);
    saveReports(updated);
    setReports(updated);
    if (viewingReport?.id === id) setViewingReport(null);
  };

  const imagenes = form.imagenes;

  const RS = ({ r }: { r: SavedReport }) => (
    <div className="vet-history-card">
      <div className="vet-history-head">
        <span className={`vet-risk-dot riesgo-${r.riesgo}`} />
        <span className="vet-history-date">{r.fecha}</span>
        <span className="vet-history-pond">{r.pondName}</span>
        <span className="vet-history-score">{t("vetScore")}: {r.puntaje}</span>
      </div>
      <div className="vet-history-actions">
        <button className="btn btn-sm" onClick={() => setViewingReport(r)}>{t("ver")}</button>
        <button className="btn btn-sm btn-primary" onClick={() => handleExportPDF(r)}>📄 PDF</button>
        <button className="btn btn-sm btn-danger" onClick={() => deleteReport(r.id)}>{t("eliminar")}</button>
      </div>
    </div>
  );

  if (mode === "history" && !viewingReport) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h2 className="page-title">{t("vetTitle")}</h2>
            <p className="page-subtitle">{t("vetSub")}</p>
          </div>
          <button className="btn btn-primary" onClick={() => setMode("wizard")}>+ {t("vetNuevo")}</button>
        </div>
        {reports.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <p>{t("vetSinReportes")}</p>
          </div>
        ) : (
          <div className="vet-history-list">
            {reports.map((r) => <RS key={r.id} r={r} />)}
          </div>
        )}
      </div>
    );
  }

  if (viewingReport) {
    const r = viewingReport;
    return (
      <div>
        <div className="page-header">
          <div>
            <h2 className="page-title">{t("vetTitle")}</h2>
            <p className="page-subtitle">{r.fecha} — {r.pondName}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setViewingReport(null)}>← {t("back")}</button>
          </div>
        </div>
        <div className="wizard-card-inner">
          <div className={`vet-banner riesgo-${r.riesgo}`}>
            <span className="vet-banner-icon">{r.riesgo === "rojo" ? "🔴" : r.riesgo === "amarillo" ? "🟡" : "🟢"}</span>
            <div className="vet-banner-body">
              <span className="vet-banner-level">{r.riesgo === "rojo" ? t("vetAlto") : r.riesgo === "amarillo" ? t("vetModerado") : t("vetBajo")}</span>
              <span className="vet-banner-score">{t("vetScore")}: {r.puntaje}</span>
            </div>
          </div>
          {r.diagnosticos.length > 0 && (
            <div className="vet-summary-section">
              <div className="vet-summary-label">{t("vetDiagnosticos")}</div>
              <div className="vet-diagnosticos-grid">
                {r.diagnosticos.map((d, i) => (
                  <div key={i} className={`vet-diagnostico-card severity-${d.weight >= 4 ? "alta" : d.weight >= 2 ? "media" : "baja"}`}>
                    <span className="vet-diagnostico-name">{d.diagnosis}</span>
                    <span className="vet-diagnostico-weight">+{d.weight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="vet-summary-section">
            <div className="vet-summary-label">{t("vetResumen")}</div>
            <p className="vet-summary-text">{r.resumen}</p>
          </div>
          {r.acciones.length > 0 && (
            <div className="vet-summary-section">
              <div className="vet-summary-label">{t("vetAcciones")}</div>
              <ul className="vet-actions-list">
                {r.acciones.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
          {r.imagenes.length > 0 && (
            <div className="vet-summary-section">
              <div className="vet-summary-label">{t("vetFotos")}</div>
              <div className="vet-fotos-grid">
                {r.imagenes.map((img, i) => (
                  <div key={i} className="vet-foto-item">
                    <img src={img} alt="" className="vet-foto-thumb" />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="vet-pdf-section">
            <button className="btn btn-primary" onClick={() => handleExportPDF(r)}>📄 {t("vetExportPDF")}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">{t("vetTitle")}</h2>
          <p className="page-subtitle">{t("vetSub")}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setMode("history")}>
          📋 {t("vetHistorial")} ({reports.length})
        </button>
      </div>

      <div className="wizard-progress-wrap">
        <div className="wizard-progress-bar">
          <div className="wizard-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="wizard-step-indicators">
          {STEPS.map((s, i) => (
            <div key={s.key} className={`wizard-step-dot${i <= step ? " done" : ""}${i === step ? " active" : ""}`}>
              <span className="wizard-step-dot-icon">{i <= step ? STEP_EMOJIS[s.key] : "○"}</span>
              <span className="wizard-step-dot-label">{t(s.titleKey)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="wizard-card animate-in" key={step}>
        {step === 0 && (
          <div className="wizard-card-inner">
            <div className="wizard-card-icon">🏞️</div>
            <h3 className="wizard-card-title">{t("vetEstanque")}</h3>
            <p className="wizard-card-desc">{t("vetEstanqueDesc")}</p>
            <div className="wizard-option-grid">
              {pondos.map((p) => (
                <button key={p.id} className={`wizard-option-card${form.estanque === p.id ? " selected" : ""}`} onClick={() => setForm({ ...form, estanque: p.id })}>
                  <span className="wizard-option-mark">{form.estanque === p.id ? "✓" : ""}</span>
                  <span className="wizard-option-label">{p.label}</span>
                </button>
              ))}
              {pondos.length <= 1 && !addingPond && (
                <button className="wizard-option-card wizard-add-pond" onClick={() => setAddingPond(true)}>
                  <span className="wizard-option-mark">+</span>
                  <span className="wizard-option-label">{t("vetCrearEstanque")}</span>
                </button>
              )}
              {addingPond && (
                <div className="wizard-new-pond-form">
                  <input type="text" value={newPondName} onChange={(e) => setNewPondName(e.target.value)} placeholder={t("vetNombreEstanque")} className="wizard-new-pond-input" autoFocus />
                  <div className="wizard-new-pond-actions">
                    <button className="btn btn-sm" onClick={() => { setAddingPond(false); setNewPondName(""); }}>{t("cancelar")}</button>
                    <button className="btn btn-sm btn-primary" onClick={createPond} disabled={!newPondName.trim()}>{t("save")}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="wizard-card-inner">
            <div className="wizard-card-icon">🍽️</div>
            <h3 className="wizard-card-title">{t("vetAlimentacion")}</h3>
            <p className="wizard-card-desc">{t("vetAlimentacionDesc")}</p>
            <div className="wizard-option-grid">
              {ALIMENTACION_RULES.map((r) => (
                <button key={r.id} className={`wizard-option-card${form.alimentacion.includes(r.id) ? " selected" : ""}`} onClick={() => toggle("alimentacion", r.id)}>
                  <span className="wizard-option-mark">{form.alimentacion.includes(r.id) ? "✓" : ""}</span>
                  <span className="wizard-option-label">{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="wizard-card-inner">
            <div className="wizard-card-icon">🐟</div>
            <h3 className="wizard-card-title">{t("vetComportamiento")}</h3>
            <p className="wizard-card-desc">{t("vetComportamientoDesc")}</p>
            <div className="wizard-option-grid">
              {COMPORTAMIENTO_RULES.map((r) => (
                <button key={r.id} className={`wizard-option-card${form.comportamiento.includes(r.id) ? " selected" : ""}`} onClick={() => toggle("comportamiento", r.id)}>
                  <span className="wizard-option-mark">{form.comportamiento.includes(r.id) ? "✓" : ""}</span>
                  <span className="wizard-option-label">{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="wizard-card-inner">
            <div className="wizard-card-icon">🔍</div>
            <h3 className="wizard-card-title">{t("vetSintomas")}</h3>
            <p className="wizard-card-desc">{t("vetSintomasDesc")}</p>
            <div className="wizard-option-grid">
              {SINTOMAS_RULES.map((r) => (
                <button key={r.id} className={`wizard-option-card${form.sintomas.includes(r.id) ? " selected" : ""}`} onClick={() => toggle("sintomas", r.id)}>
                  <span className="wizard-option-mark">{form.sintomas.includes(r.id) ? "✓" : ""}</span>
                  <span className="wizard-option-label">{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="wizard-card-inner">
            <div className="wizard-card-icon">💧</div>
            <h3 className="wizard-card-title">{t("vetAgua")}</h3>
            <p className="wizard-card-desc">{t("vetAguaDesc")}</p>
            <div className="wizard-option-grid">
              {AGUA_RULES.map((r) => (
                <button key={r.id} className={`wizard-option-card${form.agua.includes(r.id) ? " selected" : ""}`} onClick={() => toggle("agua", r.id)}>
                  <span className="wizard-option-mark">{form.agua.includes(r.id) ? "✓" : ""}</span>
                  <span className="wizard-option-label">{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {isSummaryStep && result && (
          <div className="wizard-card-inner">
            <div className="wizard-card-icon">📋</div>
            <h3 className="wizard-card-title">{t("vetResumen")}</h3>

            <div className={`vet-banner riesgo-${riesgo?.riesgo || "verde"}`}>
              <span className="vet-banner-icon">
                {riesgo?.riesgo === "rojo" ? "🔴" : riesgo?.riesgo === "amarillo" ? "🟡" : "🟢"}
              </span>
              <div className="vet-banner-body">
                <span className="vet-banner-level">
                  {riesgo?.riesgo === "rojo" ? t("vetAlto") : riesgo?.riesgo === "amarillo" ? t("vetModerado") : t("vetBajo")}
                </span>
                <span className="vet-banner-score">{t("vetScore")}: {riesgo?.puntaje}</span>
              </div>
            </div>

            <div className="vet-summary-section">
              <div className="vet-summary-label">{t("vetEstanque")}</div>
              <div className="vet-summary-value">
                <span className="vet-tag">{pondos.find((p) => p.id === form.estanque)?.label || form.estanque}</span>
              </div>
            </div>

            {diagnosticos.length > 0 && (
              <div className="vet-summary-section">
                <div className="vet-summary-label">{t("vetDiagnosticos")}</div>
                <div className="vet-diagnosticos-grid">
                  {diagnosticos.map((d, i) => (
                    <div key={i} className={`vet-diagnostico-card severity-${d.weight >= 4 ? "alta" : d.weight >= 2 ? "media" : "baja"}`}>
                      <span className="vet-diagnostico-name">{d.diagnosis}</span>
                      <span className="vet-diagnostico-weight">+{d.weight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="vet-summary-section">
              <div className="vet-summary-label">{t("vetResumen")}</div>
              <p className="vet-summary-text">
                {generateResumen(diagnosticos.map((d) => d.diagnosis), riesgo?.riesgo || "verde", lang)}
              </p>
            </div>

            <div className="vet-summary-section">
              <div className="vet-summary-label">{t("vetAcciones")}</div>
              <ul className="vet-actions-list">
                {riesgo?.riesgo === "rojo" && (
                  <><li><span className="vet-action-icon">⚠️</span>{t("vetAccion1")}</li><li><span className="vet-action-icon">⏸️</span>{t("vetAccion2")}</li><li><span className="vet-action-icon">🧪</span>{t("vetAccion3")}</li></>
                )}
                {riesgo?.riesgo === "amarillo" && (
                  <><li><span className="vet-action-icon">📊</span>{t("vetAccion4")}</li><li><span className="vet-action-icon">📝</span>{t("vetAccion5")}</li></>
                )}
                {riesgo?.riesgo === "verde" && (
                  <li><span className="vet-action-icon">✅</span>{t("vetAccion6")}</li>
                )}
              </ul>
            </div>

            <div className="vet-summary-section">
              <div className="vet-summary-label">{t("vetFotos")}</div>
              <div className="vet-fotos-grid">
                {imagenes.map((img, i) => (
                  <div key={i} className="vet-foto-item">
                    <img src={img} alt={`Foto ${i + 1}`} className="vet-foto-thumb" />
                    <button className="vet-foto-remove" onClick={() => removeImage(i)}>✕</button>
                  </div>
                ))}
                <label className="vet-foto-add">
                  <input type="file" accept="image/*" capture="environment" onChange={handleAddImages} hidden />
                  <span className="vet-foto-add-icon">+</span>
                  <span className="vet-foto-add-text">{t("vetAgregarFoto")}</span>
                </label>
              </div>
            </div>

            <div className="vet-pdf-section">
              <button className="btn btn-primary" onClick={() => handleExportPDF()}>
                📄 {t("vetExportPDF")}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="wizard-nav">
        {step > 0 && !isSummaryStep && (
          <button className="btn btn-secondary" onClick={prev}>
            ← {t("back")}
          </button>
        )}
        {step > 0 && isSummaryStep && (
          <button className="btn btn-secondary" onClick={reset}>
            🔄 {t("vetNuevo")}
          </button>
        )}
        <button className="btn-primary" onClick={isSummaryStep && result ? reset : next} disabled={!canAdvance() && !isSummaryStep} style={{ marginLeft: "auto" }}>
          {isSummaryStep ? `🔄 ${t("vetNuevo")}` : step === 4 ? `📋 ${t("vetGenerar")}` : `→ ${t("next")}`}
        </button>
      </div>
    </div>
  );
}
