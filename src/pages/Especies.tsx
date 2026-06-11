import { useState, useEffect, useCallback } from "react";
import { ESPECIES_DEFAULT } from "@/core";
import type { Species, SpeciesParams } from "@/core";
import { useTranslation } from "@/store/language";
import { useAuth } from "@/store/auth";
import { enqueue, scheduleProcess } from "@/services/sync";

const CUSTOM_KEY = "aquacalc_custom_species";

const defaultParams: SpeciesParams = {
  densidad: 20, densidadUnit: "peces/m³", supervivencia: 85, fcr: 1.5,
  tasaAlim: 3.0, comidasDia: 3, gpd: 3.0, precioAlimento: 800,
  precioVenta: 2500, pesoInicial: 5, pesoCosecha: 500, volumenUnit: "m³",
};

type FormState = { nombre: string; sci: string; emoji: string } & SpeciesParams;

const emptyForm = (): FormState => ({ nombre: "", sci: "", emoji: "🐟", ...defaultParams });

const speciesToForm = (s: Species): FormState => ({ nombre: s.nombre, sci: s.sci, emoji: s.emoji, ...s.params });

function dbToSpecies(e: any): Species {
  const p = typeof e.parametros === "object" && e.parametros ? e.parametros : {};
  return {
    id: e.id, nombre: e.nombre, sci: e.nombreCientifico || "",
    emoji: p.emoji || "🐟", custom: true,
    params: { ...defaultParams, ...p },
  };
}


export default function Especies() {
  const { t } = useTranslation();
  const { token, apiUrl } = useAuth();
  const [custom, setCustom] = useState<Species[]>([]);
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState<Species | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const api = useCallback(async (path: string, opts?: RequestInit) => {
    const res = await fetch(apiUrl + path, {
      ...opts,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...opts?.headers },
    });
    if (!res.ok) {
      if (opts?.method && ["POST", "PUT", "DELETE"].includes(opts.method)) {
        let body: unknown;
        try { body = JSON.parse(opts.body as string); } catch {}
        enqueue({ method: opts.method as "POST" | "PUT" | "DELETE", path, body });
      }
      throw new Error(await res.text());
    }
    return res.json();
  }, [apiUrl, token]);

  const loadLocal = useCallback(() => {
    try { return JSON.parse(localStorage.getItem(CUSTOM_KEY) || "[]"); } catch { return []; }
  }, []);

  useEffect(() => {
    if (token) scheduleProcess(apiUrl, token);
    api("/especies").then((data: any[]) => {
      const mapped = data.filter((e: any) => e.esPersonal !== false).map(dbToSpecies);
      setCustom(mapped);
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(mapped));
    }).catch(() => setCustom(loadLocal()));
  }, [api, loadLocal]);

  useEffect(() => {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom));
  }, [custom]);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === CUSTOM_KEY) {
        try { setCustom(JSON.parse(e.newValue || "[]")); } catch {}
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const openNew = () => { setEdit(null); setForm(emptyForm()); setShow(true); };
  const openEdit = (s: Species) => { setEdit(s); setForm(speciesToForm(s)); setShow(true); };

  const save = async () => {
    if (!form.nombre.trim() || !form.sci.trim()) return;
    if (!edit && custom.length >= 3) { alert(t("maxEspecies")); return; }
    const { nombre, sci, emoji, ...params } = form;
    const payload = { nombre: nombre.trim(), nombreCientifico: sci.trim(), parametros: { ...params, emoji } };
    setSaving(true);
    try {
      if (edit) {
        const updated = await api(`/especies/${edit.id}`, { method: "PUT", body: JSON.stringify(payload) });
        setCustom(custom.map((c) => c.id === edit.id ? dbToSpecies(updated) : c));
      } else {
        const created = await api("/especies", { method: "POST", body: JSON.stringify(payload) });
        const s = dbToSpecies(created);
        if (s.id) setCustom([...custom, s]);
      }
    } catch {
      if (edit) {
        const s: Species = { ...edit, nombre: nombre.trim(), sci: sci.trim(), emoji, params };
        setCustom(custom.map((c) => c.id === edit.id ? s : c));
      } else {
        const s: Species = { id: `custom_${Date.now()}`, nombre: nombre.trim(), sci: sci.trim(), emoji, custom: true, params };
        setCustom([...custom, s]);
      }
    } finally { setSaving(false); }
    setShow(false);
  };

  const remove = async (id: string) => {
    try { await api(`/especies/${id}`, { method: "DELETE" }); } catch { }
    setCustom(custom.filter((c) => c.id !== id));
  };

  const setP = (key: keyof SpeciesParams, val: string) => {
    setForm({ ...form, [key]: val === "" ? "" : parseFloat(val) || 0 });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">{t("especiesTitle")}</h2>
          <p className="page-subtitle">{t("especiesSub")}</p>
        </div>
        <button className="btn-primary" onClick={openNew}>＋ {t("nuevaEspecie")}</button>
      </div>

      <h3 className="card-subtitle" style={{ marginBottom: 12 }}>{t("especiesRefTitle")}</h3>
      <div className="species-list" style={{ marginBottom: 28 }}>
        {ESPECIES_DEFAULT.map((s) => (
          <div key={s.id} className="species-card-full">
            <div className="species-card-head">
              <span className="species-emoji">{s.emoji}</span>
              <div>
                <div className="species-name">{t(`sp_${s.id}` as any)}</div>
                <div className="species-sci">{s.sci}</div>
              </div>
            </div>
            <div className="species-params">
              <Param label={t("densidadSiembra")} value={`${s.params.densidad} ${s.params.densidadUnit}`} />
              <Param label={t("supervivencia")} value={`${s.params.supervivencia}%`} />
              <Param label={t("fcr")} value={String(s.params.fcr)} />
              <Param label={t("tasaAlim")} value={`${s.params.tasaAlim}%`} />
              <Param label={t("comidasDia")} value={String(s.params.comidasDia)} />
              <Param label={t("gpd")} value={`${s.params.gpd} g/día`} />
              <Param label={t("pesoInicial")} value={`${s.params.pesoInicial} g`} />
              <Param label={t("pesoCosecha")} value={`${s.params.pesoCosecha} g`} />
              <Param label={t("precioAlim")} value={`₡${s.params.precioAlimento}/kg`} />
              <Param label={t("precioVenta")} value={`₡${s.params.precioVenta}/kg`} />
            </div>
          </div>
        ))}
      </div>

      <h3 className="card-subtitle" style={{ marginBottom: 12 }}>⭐ {t("especiesTitle")}</h3>
      {custom.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🐠</div>
          <p>{t("sinEspecies")}</p>
        </div>
      ) : (
        <div className="species-list">
          {custom.map((s) => (
            <div key={s.id} className="species-card-full" style={{ borderColor: "var(--accent3)" }}>
              <div className="species-card-head">
                <span className="species-emoji">{s.emoji}</span>
                <div>
                  <div className="species-name">{s.nombre}</div>
                  <div className="species-sci">{s.sci}</div>
                </div>
              </div>
              <div className="species-params">
                <Param label={t("densidadSiembra")} value={`${s.params.densidad} ${s.params.densidadUnit}`} />
                <Param label={t("supervivencia")} value={`${s.params.supervivencia}%`} />
                <Param label={t("fcr")} value={String(s.params.fcr)} />
                <Param label={t("tasaAlim")} value={`${s.params.tasaAlim}%`} />
                <Param label={t("comidasDia")} value={String(s.params.comidasDia)} />
                <Param label={t("gpd")} value={`${s.params.gpd} g/día`} />
                <Param label={t("pesoInicial")} value={`${s.params.pesoInicial} g`} />
                <Param label={t("pesoCosecha")} value={`${s.params.pesoCosecha} g`} />
                <Param label={t("precioAlim")} value={`₡${s.params.precioAlimento}/kg`} />
                <Param label={t("precioVenta")} value={`₡${s.params.precioVenta}/kg`} />
              </div>
              <div className="card-actions" style={{ marginTop: 12 }}>
                <button className="btn-secondary" onClick={() => openEdit(s)}>{t("editar")}</button>
                <button className="btn-secondary" style={{ color: "var(--danger)", borderColor: "var(--danger)" }} onClick={() => remove(s.id)}>{t("eliminar")}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {show && (
        <div className="modal-overlay" onClick={() => setShow(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">📝 {edit ? t("editar") : t("nuevaEspecie")}</div>
            <div className="form-grid">
              <label>{t("especie")}<input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Tilapia Roja" /></label>
              <label>Científico<input value={form.sci} onChange={(e) => setForm({ ...form, sci: e.target.value })} placeholder="Ej: O. niloticus" /></label>
              <label>Emoji<input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} placeholder="🐟" /></label>
            </div>
            <div className="divider" style={{ margin: "16px 0" }} />
            <div className="card-subtitle" style={{ marginBottom: 12 }}>{t("parametros")}</div>
            <div className="form-grid">
              <label>{t("densidadSiembra")}<input type="number" value={form.densidad} onChange={(e) => setP("densidad", e.target.value)} /></label>
              <label>Densidad unit<input value={form.densidadUnit} onChange={(e) => setForm({ ...form, densidadUnit: e.target.value })} placeholder="peces/m³" /></label>
              <label>{t("supervivencia")}<input type="number" value={form.supervivencia} onChange={(e) => setP("supervivencia", e.target.value)} /></label>
              <label>{t("fcr")}<input type="number" step="0.1" value={form.fcr} onChange={(e) => setP("fcr", e.target.value)} /></label>
              <label>{t("tasaAlim")}<input type="number" step="0.1" value={form.tasaAlim} onChange={(e) => setP("tasaAlim", e.target.value)} /></label>
              <label>{t("comidasDia")}<input type="number" value={form.comidasDia} onChange={(e) => setP("comidasDia", e.target.value)} /></label>
              <label>{t("gpd")}<input type="number" step="0.1" value={form.gpd} onChange={(e) => setP("gpd", e.target.value)} /></label>
              <label>{t("precioAlim")}<input type="number" value={form.precioAlimento} onChange={(e) => setP("precioAlimento", e.target.value)} /></label>
              <label>{t("precioVenta")}<input type="number" value={form.precioVenta} onChange={(e) => setP("precioVenta", e.target.value)} /></label>
              <label>{t("pesoInicial")}<input type="number" step="0.1" value={form.pesoInicial} onChange={(e) => setP("pesoInicial", e.target.value)} /></label>
              <label>{t("pesoCosecha")}<input type="number" value={form.pesoCosecha} onChange={(e) => setP("pesoCosecha", e.target.value)} /></label>
              <label>Volumen unit<input value={form.volumenUnit} onChange={(e) => setForm({ ...form, volumenUnit: e.target.value })} placeholder="m³" /></label>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShow(false)}>{t("cancelar")}</button>
              <button className="btn-primary" onClick={save} disabled={saving}>{saving ? t("saving") : t("guardar")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Param({ label, value }: { label: string; value: string }) {
  return (
    <div className="species-param">
      <span className="species-param-label">{label}</span>
      <span className="species-param-value">{value}</span>
    </div>
  );
}
