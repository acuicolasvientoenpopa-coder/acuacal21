import { useState, useCallback } from "react";
import {
  calcular,
  calcRacion,
  ESPECIES_DEFAULT,
  MONEDAS,
} from "@/core";
import type {
  CalculationInputs,
  CalculationResults,
  RacionResults,
  Species,
} from "@/core";
import { useTranslation } from "@/store/language";

const MONEDA_KEYS = Object.keys(MONEDAS);

export default function Calculator() {
  const { t } = useTranslation();
  const [selectedSpecies, setSelectedSpecies] = useState<Species>(ESPECIES_DEFAULT[0]);
  const [volumen, setVolumen] = useState("");
  const [densidad, setDensidad] = useState("");
  const [pesoInicial, setPesoInicial] = useState("");
  const [pesoCosecha, setPesoCosecha] = useState("");
  const [supervivencia, setSupervivencia] = useState("");
  const [fcr, setFcr] = useState("");
  const [precioAlimento, setPrecioAlimento] = useState("");
  const [precioVenta, setPrecioVenta] = useState("");
  const [biomasaActual, setBiomasaActual] = useState("");
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [racion, setRacion] = useState<RacionResults | null>(null);
  const [currency, setCurrency] = useState("CRC");
  const [tooltip, setTooltip] = useState("");

  const handleSpeciesChange = useCallback((id: string) => {
    const sp = ESPECIES_DEFAULT.find((s) => s.id === id) ?? ESPECIES_DEFAULT[0];
    setSelectedSpecies(sp);
    setDensidad(String(sp.params.densidad));
    setSupervivencia(String(sp.params.supervivencia));
    setFcr(String(sp.params.fcr));
    setPrecioAlimento(String(sp.params.precioAlimento));
    setPrecioVenta(String(sp.params.precioVenta));
    setPesoInicial(String(sp.params.pesoInicial));
    setPesoCosecha(String(sp.params.pesoCosecha));
  }, []);

  const handleCalcular = useCallback(() => {
    const inputs: CalculationInputs = {
      volumen: parseFloat(volumen) || 0,
      densidad: parseFloat(densidad) || 0,
      pesoInicial: parseFloat(pesoInicial) || 0,
      pesoCosecha: parseFloat(pesoCosecha) || 0,
      supervivencia: parseFloat(supervivencia) || 0,
      fcr: parseFloat(fcr) || 0,
      precioAlimento: parseFloat(precioAlimento) || 0,
      precioVenta: parseFloat(precioVenta) || 0,
      gpd: selectedSpecies.params.gpd,
    };
    setResults(calcular(inputs));
  }, [volumen, densidad, pesoInicial, pesoCosecha, supervivencia, fcr, precioAlimento, precioVenta, selectedSpecies]);

  const handleCalcRacion = useCallback(() => {
    const ba = parseFloat(biomasaActual);
    if (!ba || ba <= 0) return;
    setRacion(
      calcRacion({
        biomasaActual: ba,
        tasaAlimentacion: selectedSpecies.params.tasaAlim,
        comidasPorDia: selectedSpecies.params.comidasDia,
      })
    );
  }, [biomasaActual, selectedSpecies]);

  return (
    <div className="calculator">
      <header className="calc-header">
        <h1>AquaCalc</h1>
        <p>{t("calculadoraSub")}</p>
      </header>

      <section className="calc-section">
        <h2>{t("especie")}</h2>
        <select
          value={selectedSpecies.id}
          onChange={(e) => handleSpeciesChange(e.target.value)}
        >
          {ESPECIES_DEFAULT.map((s) => (
            <option key={s.id} value={s.id}>
              {s.emoji} {t(`sp_${s.id}` as any)} — {s.sci}
            </option>
          ))}
        </select>
      </section>

      <section className="calc-section">
        <h2>{t("datosEstanque")}</h2>
        <div className="calc-grid">
          <label>
            {t("volumenArea")} ({selectedSpecies.params.volumenUnit})
            <input type="number" value={volumen} onChange={(e) => setVolumen(e.target.value)} placeholder="0" />
          </label>
          <label>
            {t("densidadSiembra")} ({selectedSpecies.params.densidadUnit})
            <input type="number" value={densidad} onChange={(e) => setDensidad(e.target.value)} placeholder="0" />
          </label>
          <label>
            {t("pesoInicial")}
            <input type="number" value={pesoInicial} onChange={(e) => setPesoInicial(e.target.value)} placeholder="0" />
          </label>
          <label>
            {t("pesoCosecha")}
            <input type="number" value={pesoCosecha} onChange={(e) => setPesoCosecha(e.target.value)} placeholder="0" />
          </label>
          <label>
            {t("supervivencia")}
            <input type="number" value={supervivencia} onChange={(e) => setSupervivencia(e.target.value)} placeholder="0" />
            <span className="info-btn" onClick={() => setTooltip(tooltip === "sup" ? "" : "sup")}>ℹ</span>
            {tooltip === "sup" && <div className="tooltip-card show">% de animales sembrados que llegan vivos a cosecha.</div>}
          </label>
          <label>
            {t("fcr")}
            <input type="number" step="0.1" value={fcr} onChange={(e) => setFcr(e.target.value)} placeholder="0.0" />
            <span className="info-btn" onClick={() => setTooltip(tooltip === "fcr" ? "" : "fcr")}>ℹ</span>
            {tooltip === "fcr" && <div className="tooltip-card show">FCR = Alimento consumido ÷ Ganancia de peso. Menor es mejor.</div>}
          </label>
          <label>
            {t("moneda")}
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {MONEDA_KEYS.map((k) => (
                <option key={k} value={k}>{k} — {MONEDAS[k].simbolo}</option>
              ))}
            </select>
          </label>
          <label>
            {t("precioAlim")} ({MONEDAS[currency].simbolo}/kg)
            <input type="number" value={precioAlimento} onChange={(e) => setPrecioAlimento(e.target.value)} placeholder="0" />
          </label>
          <label>
            {t("precioVenta")} ({MONEDAS[currency].simbolo}/kg)
            <input type="number" value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} placeholder="0" />
          </label>
        </div>
      </section>

      <button className="calc-btn" onClick={handleCalcular}>
        {t("calc")}
      </button>

      {results && (
        <section className="calc-section">
          <h2>{t("resultados")}</h2>
          <div className="results-grid">
            <ResultCard label={t("totalAnimales")} value={results.totalAnimales} />
            <ResultCard label={t("biomasaInicial")} value={`${results.biomasaInicial.toFixed(1)} kg`} highlight />
            <ResultCard label={t("supervivientes")} value={results.supervivientes} />
            <ResultCard label={t("biomasaCosecha")} value={`${results.biomasaCosecha.toFixed(1)} kg`} highlight />
            <ResultCard label={t("gananciaPeso")} value={`${results.gananciaPeso.toFixed(1)} kg`} />
            <ResultCard label={t("alimentoTotal")} value={`${results.alimentoTotal.toFixed(1)} kg`} />
            <ResultCard label={t("costoAlimento")} value={`${MONEDAS[currency].simbolo}${results.costoAlimento.toLocaleString()}`} />
            <ResultCard label={t("ingresoBruto")} value={`${MONEDAS[currency].simbolo}${results.ingreso.toLocaleString()}`} highlight />
            <ResultCard label={t("utilidad")} value={`${MONEDAS[currency].simbolo}${results.utilidad.toLocaleString()}`} highlight />
            <ResultCard label={t("diasEstimados")} value={results.dias > 0 ? `${results.dias.toFixed(0)} d` : "—"} />
            <ResultCard label={t("costoAlimKg")} value={`${MONEDAS[currency].simbolo}${results.costoKg.toLocaleString()}`} />
          </div>
        </section>
      )}

      {results && (
        <section className="calc-section">
          <h2>{t("racionDiaria")}</h2>
          <label>
            {t("biomasaActual")}
            <input type="number" value={biomasaActual} onChange={(e) => setBiomasaActual(e.target.value)} placeholder="0" />
          </label>
          <button className="calc-btn calc-btn-sm" onClick={handleCalcRacion}>
            {t("calcularRacion")}
          </button>
          {racion && (
            <div className="results-grid">
              <ResultCard label={t("racionDia")} value={`${racion.racionDiaria.toFixed(2)} kg`} highlight />
              <ResultCard label={t("porComida")} value={`${racion.racionComida.toFixed(2)} kg`} />
              <ResultCard label={t("tasaAlim")} value={`${selectedSpecies.params.tasaAlim}%`} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function ResultCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`result-card${highlight ? " highlight" : ""}`}>
      <div className="result-value">{typeof value === "number" ? value.toLocaleString() : value}</div>
      <div className="result-label">{label}</div>
    </div>
  );
}
