import { useState, useMemo } from "react";
import { useAuth } from "@/store/auth";
import { useTranslation } from "@/store/language";
import { useLookups } from "@/store/lookups";
import { useLotes } from "@/store/lotes";
import { toast } from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";
import { createApi } from "@/services/api";
import type { Lote } from "@/core";

function emptyLote() {
  return {
    nombre: "",
    fechaSiembra: new Date().toISOString().slice(0, 10),
    cantidadInicial: 0,
    pesoInicial: "",
    especieId: "",
    estanqueId: "",
    fincaId: "",
  };
}

export default function Lotes() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { species: allSpecies, estanques, fincas } = useLookups();
  const { lotes, lotesActivos, lotesCerrados, reload } = useLotes();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyLote());
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<Lote | null>(null);
  const [closeConfirm, setCloseConfirm] = useState<string | null>(null);

  const client = useMemo(() => token ? createApi(token) : null, [token]);

  const setF = (key: string, val: string | number) => setForm({ ...form, [key]: val });

  const fincasUniq = useMemo(() => {
    const m = new Map<string, { id: string; label: string }>();
    fincas.forEach((f) => m.set(f.id, f));
    estanques.forEach((e) => { if (e.raw?.fincaId) m.set(e.raw.fincaId, { id: e.raw.fincaId, label: e.raw.fincaNombre }); });
    return Array.from(m.values());
  }, [fincas, estanques]);

  const estanquesFiltrados = useMemo(() => {
    if (!form.fincaId) return [];
    return estanques.filter((e) => e.raw?.fincaId === form.fincaId);
  }, [estanques, form.fincaId]);

  const canSave = form.nombre && form.fechaSiembra && form.cantidadInicial > 0 && form.especieId && form.estanqueId && form.fincaId;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      if (client) {
        await client.post("/lotes", {
          ...form,
          cantidadInicial: Number(form.cantidadInicial),
          pesoInicial: form.pesoInicial ? Number(form.pesoInicial) : undefined,
        });
        toast("Lote creado", "success");
      } else {
        toast("Sin conexión", "error");
      }
    } catch (e: any) { toast("Error: " + (e?.message || e), "error"); } finally { setSaving(false); }

    setShowForm(false);
    setForm(emptyLote());
    reload();
  };

  const cerrarLote = async (id: string) => {
    try {
      if (client) {
        await client.put(`/lotes/${id}/cerrar`, {});
        toast("Lote cerrado", "success");
      }
    } catch (e: any) { toast("Error: " + (e?.message || e), "error"); }
    setCloseConfirm(null);
    reload();
  };

  const loadDetail = async (lote: Lote) => {
    try {
      if (client) {
        const data = await client.get<any>(`/lotes/${lote.id}`);
        setDetail(data);
      }
    } catch { setDetail(lote); }
  };

  const especieName = (id?: string) => {
    if (!id) return "—";
    const s = allSpecies.find((sp) => sp.id === id);
    return s?.label || id.slice(0, 8);
  };

  const estanqueName = (id?: string) => {
    if (!id) return "—";
    const e = estanques.find((es) => es.id === `||${id}` || es.id === id || es.raw?.estanqueNombre === id);
    return e?.label || id.slice(0, 8);
  };

  const diasTranscurridos = (fechaSiembra: string) => {
    const d = Math.floor((Date.now() - new Date(fechaSiembra).getTime()) / 86400000);
    return d >= 0 ? d : 0;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">{t("lotesTitle")}</h2>
          <p className="page-subtitle">{t("lotesSub")}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? `✕ ${t("cerrar")}` : `＋ ${t("lotesNuevo")}`}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">🌱 {t("lotesNuevo")}</div>
          <div className="form-grid">
            <label>{t("lotesNombre")}<input type="text" value={form.nombre} onChange={(e) => setF("nombre", e.target.value)} placeholder="Ej: Lote 1 - Tilapia Junio" /></label>
            <label>{t("lotesFechaSiembra")}<input type="date" value={form.fechaSiembra} onChange={(e) => setF("fechaSiembra", e.target.value)} /></label>
            <label>Finca
              <select value={form.fincaId} onChange={(e) => setF("fincaId", e.target.value)}>
                <option value="">{t("seleccionar")}</option>
                {fincasUniq.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
            </label>
            <label>{t("estanque")}
              <select value={form.estanqueId} onChange={(e) => setF("estanqueId", e.target.value)} disabled={!form.fincaId}>
                <option value="">{t("seleccionar")}</option>
                {estanquesFiltrados.map((es) => <option key={es.id} value={es.id.split("||")[1] || es.id}>{es.label}</option>)}
              </select>
            </label>
            <label>{t("especie")}
              <select value={form.especieId} onChange={(e) => setF("especieId", e.target.value)}>
                <option value="">{t("seleccionar")}</option>
                {allSpecies.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </label>
            <label>{t("lotesCantInicial")}<input type="number" value={form.cantidadInicial || ""} onChange={(e) => setF("cantidadInicial", Number(e.target.value))} placeholder="1000" /></label>
            <label>{t("lotesPesoInicial")}<input type="number" step="0.1" value={form.pesoInicial} onChange={(e) => setF("pesoInicial", e.target.value)} placeholder="0.0 (g)" /></label>
          </div>
          <div className="card-actions">
            <button className="btn-secondary" onClick={() => setShowForm(false)}>{t("cancelar")}</button>
            <button className="btn-primary" onClick={save} disabled={!canSave || saving}>{saving ? t("saving") : "💾 Guardar"}</button>
          </div>
        </div>
      )}

      {detail && (
        <div className="card" style={{ marginBottom: 16, borderColor: "var(--accent)" }}>
          <div className="card-title" style={{ display: "flex", justifyContent: "space-between" }}>
            <span>🔍 {detail.nombre}</span>
            <button className="btn-sm" onClick={() => setDetail(null)}>✕ {t("cerrar")}</button>
          </div>
          <div className="results-grid" style={{ marginBottom: 12 }}>
            <div className="result-card"><div className="result-value">{especieName(detail.especieId)}</div><div className="result-label">{t("especie")}</div></div>
            <div className="result-card"><div className="result-value">{estanqueName(detail.estanqueId)}</div><div className="result-label">{t("estanque")}</div></div>
            <div className="result-card"><div className="result-value">{detail.cantidadInicial}</div><div className="result-label">{t("lotesCantInicial")}</div></div>
            <div className="result-card"><div className="result-value">{diasTranscurridos(detail.fechaSiembra)}</div><div className="result-label">{t("diasTranscurridos")}</div></div>
          </div>
          {detail.trazabilidad && (
            <div>
              <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 8 }}>{t("lotesEventos")}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <span className="badge badge-blue">{detail.trazabilidad.bitacoras.length} {t("bitacoraTitle")}</span>
                <span className="badge badge-green">{detail.trazabilidad.finanzas.length} {t("finanzasTitle")}</span>
                <span className="badge badge-red">{detail.trazabilidad.veterinarias.length} {t("vetTitle")}</span>
                <span className="badge badge-yellow">{detail.trazabilidad.movimientos.length} Movimientos</span>
              </div>
            </div>
          )}
        </div>
      )}

      {lotesActivos.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">🟢 {t("lotesActivos")} ({lotesActivos.length})</div>
          {lotesActivos.map((l) => (
            <div key={l.id} className="bio-card">
              <div className="bio-card-header">
                <div className="bio-card-meta">
                  <span className="bio-date"><strong>{l.nombre}</strong></span>
                  <span className="bio-pond">{especieName(l.especieId)}</span>
                  <span className="bio-species">{t("estanque")}: {estanqueName(l.estanqueId)}</span>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <span className="badge badge-green">{diasTranscurridos(l.fechaSiembra)}d</span>
                </div>
              </div>
              <div className="bio-card-body">
                <div className="bio-inline">
                  <span className="bio-chip"><span className="bio-chip-label">{t("lotesCantInicial")}</span> {l.cantidadInicial}</span>
                  <span className="bio-chip"><span className="bio-chip-label">{t("lotesFechaSiembra")}</span> {l.fechaSiembra}</span>
                  {l.pesoInicial != null && <span className="bio-chip"><span className="bio-chip-label">{t("lotesPesoInicial")}</span> {l.pesoInicial} g</span>}
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                  <button className="btn-sm" onClick={() => loadDetail(l)}>🔍 {t("ver")}</button>
                  <button className="btn-sm" style={{ color: "var(--danger)" }} onClick={() => setCloseConfirm(l.id)}>🔒 {t("lotesCerrar")}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {lotes.length === 0 && !showForm && (
        <div className="empty-state"><div className="empty-icon">🌱</div><p>{t("lotesSinLotes")}</p></div>
      )}

      {lotesCerrados.length > 0 && (
        <div className="card">
          <div className="card-title">🔴 {t("lotesCerrados")} ({lotesCerrados.length})</div>
          {lotesCerrados.map((l) => (
            <div key={l.id} className="bio-card">
              <div className="bio-card-header">
                <div className="bio-card-meta">
                  <span><strong>{l.nombre}</strong></span>
                  <span className="bio-pond">{especieName(l.especieId)}</span>
                </div>
                <button className="btn-sm" onClick={() => loadDetail(l)}>🔍 {t("ver")}</button>
              </div>
              <div className="bio-card-body">
                <div className="bio-inline">
                  <span className="bio-chip"><span className="bio-chip-label">{t("lotesFechaSiembra")}</span> {l.fechaSiembra}</span>
                  {l.fechaCosecha && <span className="bio-chip"><span className="bio-chip-label">{t("lotesFechaCosecha")}</span> {l.fechaCosecha}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {closeConfirm && (
        <ConfirmModal
          title={t("lotesCerrar") as string}
          message={t("lotesCerrarMsg") as string}
          danger
          onConfirm={() => cerrarLote(closeConfirm)}
          onCancel={() => setCloseConfirm(null)}
        />
      )}
    </div>
  );
}
