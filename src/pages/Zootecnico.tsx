import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/store/auth";
import { useTranslation } from "@/store/language";
import { exportZootecnicoPDF, exportZootecnicoExcel } from "@/utils/pdf";

const RECORDS_KEY = "aquacalc_bitacora";

function loadLocal(): any[] {
  try { return JSON.parse(localStorage.getItem(RECORDS_KEY) || "[]"); } catch { return []; }
}

function dbToRecord(r: any): any {
  let extra: any = {};
  try { if (r.observaciones) extra = JSON.parse(r.observaciones); } catch {}
  return {
    id: r.id, fecha: r.fecha?.slice(0, 10) || "",
    estanque: extra.estanque || r.estanqueId || "",
    especie: extra.especie || r.especieId || "",
    alimento: extra.alimento || "", mortalidades: extra.mortalidades || "",
    pesoMuestreo: r.peso != null ? String(r.peso) : "",
    oxigeno: r.oxigeno != null ? String(r.oxigeno) : "",
    temperatura: r.temperatura != null ? String(r.temperatura) : "",
    ph: r.ph != null ? String(r.ph) : "",
    amonio: r.amonio != null ? String(r.amonio) : "",
    nitrito: extra.nitrito || "",
    salinidad: r.salinidad != null ? String(r.salinidad) : "",
    biomasa: extra.biomasa || "",
    sgr: extra.sgr || "",
    fcrAcum: extra.fcrAcum || "",
    observaciones: extra.observaciones || "",
    createdAt: r.createdAt || "",
  };
}

function toStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

export default function Zootecnico() {
  const { t } = useTranslation();
  const { token, apiUrl } = useAuth();
  const [records, setRecords] = useState<any[]>(loadLocal);
  const [filtro, setFiltro] = useState("");
  const [param, setParam] = useState("oxigeno");

  const api = useCallback(async (path: string) => {
    const res = await fetch(apiUrl + path, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }, [apiUrl, token]);

  useEffect(() => {
    api("/bitacora").then((data: any[]) => {
      const mapped = data.map(dbToRecord);
      setRecords(mapped);
      localStorage.setItem(RECORDS_KEY, JSON.stringify(mapped));
    }).catch(() => setRecords(loadLocal()));
  }, [api]);

  useEffect(() => {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    const h = (e: StorageEvent) => {
      if (e.key === RECORDS_KEY) {
        try { setRecords(JSON.parse(e.newValue || "[]")); } catch {}
      }
    };
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, []);

  const filtered = records
    .filter((r) => !filtro || r.estanque?.toLowerCase().includes(filtro.toLowerCase()))
    .reverse();

  const paramLabel = (p: string) =>
    ({ oxigeno: t("oxigeno"), temperatura: t("temperatura"), ph: t("ph"), amonio: t("amonio"), nitrito: t("nitrito"), salinidad: t("salinidad"), biomasa: t("biomasaEstanque"), sgr: t("sgrLabel"), fcrAcum: t("fcrAcum") }[p] || p);

  const chartValues = filtered.map((r) => ({
    fecha: r.fecha,
    val: parseFloat(r[param]) || 0,
  }));

  const maxVal = Math.max(...chartValues.map((c) => c.val), 1);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">{t("zootecnicoTitle")}</h2>
          <p className="page-subtitle">{t("zootecnicoSub")}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-title">🔍 {t("filtrar")}</div>
        <div className="form-grid">
          <label>{t("estanque")}<input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Todos" /></label>
          <label>{t("parametroGraficar")}
            <select value={param} onChange={(e) => setParam(e.target.value)}>
              <option value="oxigeno">{t("oxigeno")}</option>
              <option value="temperatura">{t("temperatura")}</option>
              <option value="ph">{t("ph")}</option>
              <option value="amonio">{t("amonio")}</option>
              <option value="nitrito">{t("nitrito")}</option>
              <option value="salinidad">{t("salinidad")}</option>
              <option value="biomasa">{t("biomasaEstanque")}</option>
              <option value="sgr">{t("sgrLabel")}</option>
              <option value="fcrAcum">{t("fcrAcum")}</option>
            </select>
          </label>
        </div>
      </div>

      {records.length > 0 && (
        <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
          <button className="btn-secondary btn-sm" onClick={() => {
            const rows = filtered.map((r) => ({
              fecha: toStr(r.fecha),
              estanque: toStr(r.estanque),
              oxigeno: toStr(r.oxigeno),
              temperatura: toStr(r.temperatura),
              ph: toStr(r.ph),
              amonio: toStr(r.amonio),
              nitrito: toStr(r.nitrito),
              salinidad: toStr(r.salinidad),
            }));
            exportZootecnicoPDF(rows, filtro, paramLabel(param));
          }}>{t("exportPDF")}</button>
          <button className="btn-secondary btn-sm" onClick={() => {
            const rows = filtered.map((r) => ({
              fecha: toStr(r.fecha),
              estanque: toStr(r.estanque),
              oxigeno: toStr(r.oxigeno),
              temperatura: toStr(r.temperatura),
              ph: toStr(r.ph),
              amonio: toStr(r.amonio),
              nitrito: toStr(r.nitrito),
              salinidad: toStr(r.salinidad),
            }));
            exportZootecnicoExcel(rows).catch(() => {});
          }}>📊 Excel</button>
        </div>
      )}

      {chartValues.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <p>{t("sinDatos")}</p>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="card-title">📊 {paramLabel(param)}</div>
            <div className="chart-container">
              {chartValues.slice(-15).map((c, i) => (
                <div key={i} className="chart-bar-row">
                  <span className="chart-label">{c.fecha}</span>
                  <div className="chart-bar-wrap">
                    <div className="chart-bar" style={{ width: `${(c.val / maxVal) * 100}%`, background: "var(--accent)" }}>
                      {c.val.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">{t("tablaTitle")}</div>
            <div style={{ overflowX: "auto" }}>
              <table className="zoo-table">
                <thead>
                  <tr>
                    <th>{t("fecha")}</th>
                    <th>{t("estanque")}</th>
                    <th>{t("oxigeno")}</th>
                    <th>{t("temperatura")}</th>
                    <th>{t("ph")}</th>
                    <th>{t("amonio")}</th>
                    <th>{t("nitrito")}</th>
                    <th>{t("salinidad")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(-30).map((r) => (
                    <tr key={r.id}>
                      <td>{r.fecha}</td>
                      <td>{r.estanque}</td>
                      <td>{r.oxigeno || "—"}</td>
                      <td>{r.temperatura || "—"}</td>
                      <td>{r.ph || "—"}</td>
                      <td>{r.amonio || "—"}</td>
                      <td>{r.nitrito || "—"}</td>
                      <td>{r.salinidad || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
