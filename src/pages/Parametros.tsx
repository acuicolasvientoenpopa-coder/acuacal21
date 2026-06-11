import { useState, useEffect, useCallback } from "react";
import { ESPECIES_DEFAULT } from "@/core";
import type { SpeciesParams } from "@/core";
import { useTranslation } from "@/store/language";
import { useAuth } from "@/store/auth";

const PARAMS_KEY = "aquacalc_params_overrides";

type Overrides = Record<string, Partial<SpeciesParams>>;

function loadLocal(): Overrides {
  try {
    return JSON.parse(localStorage.getItem(PARAMS_KEY) || "{}");
  } catch {
    return {};
  }
}

export default function Parametros() {
  const { t } = useTranslation();
  const { token, apiUrl } = useAuth();
  const [overrides, setOverrides] = useState<Overrides>(loadLocal);
  const [active, setActive] = useState(ESPECIES_DEFAULT[0].id);
  const [local, setLocal] = useState<Partial<SpeciesParams>>({});

  const save = useCallback((o: Overrides) => {
    localStorage.setItem(PARAMS_KEY, JSON.stringify(o));
  }, []);

  useEffect(() => { save(overrides); }, [overrides, save]);

  useEffect(() => {
    if (!token) return;
    fetch(`${apiUrl}/parametros`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: Overrides) => {
        setOverrides(data);
        localStorage.setItem(PARAMS_KEY, JSON.stringify(data));
      })
      .catch(() => setOverrides(loadLocal()));
  }, [apiUrl, token]);

  useEffect(() => {
    const h = (e: StorageEvent) => {
      if (e.key === PARAMS_KEY) setOverrides(loadLocal());
    };
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, []);

  useEffect(() => {
    setLocal(overrides[active] || {});
  }, [active, overrides]);

  const current = ESPECIES_DEFAULT.find((s) => s.id === active)!;
  const merged: SpeciesParams = { ...current.params, ...overrides[active] };

  const setP = (key: keyof SpeciesParams, val: string) => {
    const num = val === "" ? undefined : parseFloat(val) || 0;
    const next = { ...local, [key]: num ?? "" };
    setLocal(next);
  };

  const setS = (key: keyof SpeciesParams, val: string) => {
    const next = { ...local, [key]: val };
    setLocal(next);
  };

  const apply = () => {
    const clean = Object.fromEntries(
      Object.entries(local).filter(([, v]) => v !== "" && v !== undefined)
    );
    const next = { ...overrides, [active]: clean as Partial<SpeciesParams> };
    setOverrides(next);
    if (token) {
      fetch(`${apiUrl}/parametros`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(next),
      }).catch(() => {});
    }
  };

  const resetOne = () => {
    const { [active]: _, ...rest } = overrides;
    setOverrides(rest);
    setLocal({});
    if (token) {
      fetch(`${apiUrl}/parametros`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(rest),
      }).catch(() => {});
    }
  };

  const resetAll = () => {
    setOverrides({});
    setLocal({});
    if (token) {
      fetch(`${apiUrl}/parametros`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      }).catch(() => {});
    }
  };

  const hasChanges = Object.keys(local).length > 0;

  if (!current) return null;

  const groups: { title: string; icon: string; fields: { key: keyof SpeciesParams; label: string; numeric?: boolean }[] }[] = [
    {
      title: t("siembra"), icon: "🌱",
      fields: [
        { key: "densidad", label: t("densidadSiembra"), numeric: true },
        { key: "densidadUnit", label: "Unidad densidad" },
        { key: "pesoInicial", label: t("pesoInicial"), numeric: true },
        { key: "pesoCosecha", label: t("pesoCosecha"), numeric: true },
      ],
    },
    {
      title: t("alimentacion"), icon: "🍽️",
      fields: [
        { key: "fcr", label: t("fcr"), numeric: true },
        { key: "tasaAlim", label: t("tasaAlim"), numeric: true },
        { key: "comidasDia", label: t("comidasDia"), numeric: true },
      ],
    },
    {
      title: t("economico"), icon: "💰",
      fields: [
        { key: "precioAlimento", label: t("precioAlim"), numeric: true },
        { key: "precioVenta", label: t("precioVenta"), numeric: true },
      ],
    },
    {
      title: t("rendimiento"), icon: "📊",
      fields: [
        { key: "supervivencia", label: t("supervivencia"), numeric: true },
        { key: "gpd", label: t("gpd"), numeric: true },
        { key: "volumenUnit", label: "Unidad volumen" },
      ],
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">{t("paramsTitle")}</h2>
          <p className="page-subtitle">{t("paramsSub")}</p>
        </div>
        <button className="btn-secondary" onClick={resetAll}>{t("restaurar")}</button>
      </div>

      <div className="mini-tabs">
        {ESPECIES_DEFAULT.map((s) => (
          <button
            key={s.id}
            className={`mini-tab${active === s.id ? " active" : ""}`}
            onClick={() => setActive(s.id)}
          >
            {s.emoji} {t(`sp_${s.id}` as any)}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-title">{current.emoji} {t(`sp_${current.id}` as any)} — {t("parametros")}</div>
        {groups.map((g) => (
          <div key={g.title} className="card-section">
            <div className="card-subtitle">{g.icon} {g.title}</div>
            <div className="form-grid">
              {g.fields.map((f) => (
                <label key={f.key}>
                  {f.label}
                  {f.numeric ? (
                    <input
                      type="number"
                      step="any"
                      value={f.key in local ? (local[f.key] ?? "") : merged[f.key]}
                      placeholder={String(merged[f.key] ?? "")}
                      onChange={(e) => setP(f.key, e.target.value)}
                    />
                  ) : (
                    <input
                      value={f.key in local ? (local[f.key] ?? "") : merged[f.key]}
                      placeholder={String(merged[f.key] ?? "")}
                      onChange={(e) => setS(f.key, e.target.value)}
                    />
                  )}
                  {f.key in local && (
                    <span style={{ fontSize: 10, color: "var(--accent3)", marginTop: 2 }}>
                      Modificado
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}
        <div className="card-actions">
          <button className="btn-secondary" onClick={resetOne} disabled={!hasChanges}>
            Restaurar especie
          </button>
          <button className="btn-primary" onClick={apply} disabled={!hasChanges}>
            {t("guardar")}
          </button>
        </div>
      </div>
    </div>
  );
}
