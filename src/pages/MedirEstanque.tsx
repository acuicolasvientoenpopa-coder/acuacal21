import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/store/language";
import { calcVolumen } from "@/core/formulas";
import type { FormaEstanque } from "@/core";

const FORMAS: { value: FormaEstanque; label: string }[] = [
  { value: "rectangular", label: "Rectangular" },
  { value: "circular", label: "Circular" },
  { value: "trapezoidal", label: "Trapezoidal (talud)" },
  { value: "tanque", label: "Tanque cilíndrico" },
  { value: "triangular", label: "Triangular" },
];

export default function MedirEstanque() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [forma, setForma] = useState<FormaEstanque>("rectangular");
  const [largo, setLargo] = useState("");
  const [ancho, setAncho] = useState("");
  const [profundidad, setProfundidad] = useState("");
  const [diametro, setDiametro] = useState("");
  const [altura, setAltura] = useState("");
  const [largoSup, setLargoSup] = useState("");
  const [anchoSup, setAnchoSup] = useState("");
  const [largoInf, setLargoInf] = useState("");
  const [anchoInf, setAnchoInf] = useState("");
  const [base, setBase] = useState("");
  const [alturaTri, setAlturaTri] = useState("");

  const vol = useMemo(() => {
    const res = calcVolumen({
      forma,
      largo: parseFloat(largo) || 0,
      ancho: parseFloat(ancho) || 0,
      profundidad: parseFloat(profundidad) || 0,
      diametro: parseFloat(diametro) || 0,
      altura: parseFloat(altura) || 0,
      largoSup: parseFloat(largoSup) || 0,
      anchoSup: parseFloat(anchoSup) || 0,
      largoInf: parseFloat(largoInf) || 0,
      anchoInf: parseFloat(anchoInf) || 0,
      base: parseFloat(base) || 0,
      alturaTri: parseFloat(alturaTri) || 0,
    });
    return res.volumenM3 > 0 ? res : null;
  }, [forma, largo, ancho, profundidad, diametro, altura, largoSup, anchoSup, largoInf, anchoInf, base, alturaTri]);

  const usarEnCalc = () => {
    if (!vol) return;
    localStorage.setItem("acuical_geo_dimensions", JSON.stringify({ forma, volumenM3: vol.volumenM3, litros: vol.litros }));
    navigate("/calc");
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">{t("medirEstanque")}</h2>
          <p className="page-subtitle">{t("medirEstanqueDesc")}</p>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <label>{t("formaEstanque")}
          <select value={forma} onChange={(e) => setForma(e.target.value as FormaEstanque)}>
            {FORMAS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </label>

        <div className="form-grid" style={{ marginTop: 16 }}>
          {(forma === "rectangular" || forma === "trapezoidal") && (
            <>
              <label>{t("largo")}<input type="number" value={largo} onChange={(e) => setLargo(e.target.value)} placeholder="0" /></label>
              <label>{t("ancho")}<input type="number" value={ancho} onChange={(e) => setAncho(e.target.value)} placeholder="0" /></label>
            </>
          )}

          {forma === "circular" && (
            <label>{t("diametro")}<input type="number" value={diametro} onChange={(e) => setDiametro(e.target.value)} placeholder="0" /></label>
          )}

          {forma === "tanque" && (
            <>
              <label>{t("diametro")}<input type="number" value={diametro} onChange={(e) => setDiametro(e.target.value)} placeholder="0" /></label>
              <label>{t("altura")}<input type="number" value={altura} onChange={(e) => setAltura(e.target.value)} placeholder="0" /></label>
            </>
          )}

          {forma === "triangular" && (
            <>
              <label>{t("base")}<input type="number" value={base} onChange={(e) => setBase(e.target.value)} placeholder="0" /></label>
              <label>{t("altura")}<input type="number" value={alturaTri} onChange={(e) => setAlturaTri(e.target.value)} placeholder="0" /></label>
            </>
          )}

          {forma === "trapezoidal" && (
            <>
              <label>{t("largoSup")}<input type="number" value={largoSup} onChange={(e) => setLargoSup(e.target.value)} placeholder="0" /></label>
              <label>{t("anchoSup")}<input type="number" value={anchoSup} onChange={(e) => setAnchoSup(e.target.value)} placeholder="0" /></label>
              <label>{t("largoInf")}<input type="number" value={largoInf} onChange={(e) => setLargoInf(e.target.value)} placeholder="0" /></label>
              <label>{t("anchoInf")}<input type="number" value={anchoInf} onChange={(e) => setAnchoInf(e.target.value)} placeholder="0" /></label>
            </>
          )}

          {forma !== "tanque" && (
            <label>{t("profundidad")}<input type="number" value={profundidad} onChange={(e) => setProfundidad(e.target.value)} placeholder="0" /></label>
          )}
        </div>

        {vol && (
          <div className="card" style={{ marginTop: 16, padding: 16, background: "var(--bg2)" }}>
            <div style={{ fontSize: 14, color: "var(--text2)" }}>{t("volumenCalculado")}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--accent)" }}>{vol.volumenM3.toFixed(1)} m³</div>
            <div style={{ fontSize: 14, color: "var(--text2)" }}>≈ {vol.litros.toLocaleString()} {t("litros")}</div>
            <button className="btn-primary" style={{ marginTop: 12 }} onClick={usarEnCalc}>
              {t("geoUsarCalc")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
