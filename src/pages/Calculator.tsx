import { useState, useCallback } from "react";
import {
  calcular,
  calcRacion,
  ESPECIES_DEFAULT,
  MONEDAS,
  ENERGY_DEFAULTS,
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

  // Energía
  const [energiaOn, setEnergiaOn] = useState(false);
  const [energyTab, setEnergyTab] = useState<"elect" | "comb" | "recibo">("elect");
  const [bombaHP, setBombaHP] = useState("");
  const [bombaCount, setBombaCount] = useState("");
  const [bombaHours, setBombaHours] = useState("");
  const [aireadorHP, setAireadorHP] = useState("");
  const [aireadorCount, setAireadorCount] = useState("");
  const [aireadorHours, setAireadorHours] = useState("");
  const [precioKWh, setPrecioKWh] = useState("");
  const [motorBombaConsumo, setMotorBombaConsumo] = useState("");
  const [motorBombaHours, setMotorBombaHours] = useState("");
  const [motorAireadorConsumo, setMotorAireadorConsumo] = useState("");
  const [motorAireadorHours, setMotorAireadorHours] = useState("");
  const [precioCombustible, setPrecioCombustible] = useState("");
  const [diasCiclo, setDiasCiclo] = useState("");
  const [gastoPeriodoElect, setGastoPeriodoElect] = useState("");
  const [diasPeriodoElect, setDiasPeriodoElect] = useState("30");
  const [gastoPeriodoComb, setGastoPeriodoComb] = useState("");
  const [diasPeriodoComb, setDiasPeriodoComb] = useState("30");

  const fillEnergyDefaults = useCallback((id: string) => {
    const ed = ENERGY_DEFAULTS[id];
    if (!ed) return;
    setBombaHP(String(ed.bombaHP));
    setBombaCount(String(ed.bombaCount));
    setBombaHours(String(ed.bombaHoursDay));
    setAireadorHP(String(ed.aireadorHP));
    setAireadorCount(String(ed.aireadorCount));
    setAireadorHours(String(ed.aireadorHoursDay));
    setPrecioKWh(String(ed.precioKWh));
    setMotorBombaConsumo(String(ed.motorBombaConsumo));
    setMotorBombaHours(String(ed.motorBombaHoursDay));
    setMotorAireadorConsumo(String(ed.motorAireadorConsumo));
    setMotorAireadorHours(String(ed.motorAireadorHoursDay));
    setPrecioCombustible(String(ed.precioCombustible));
    setDiasCiclo(String(ed.diasCiclo));
  }, []);

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
    fillEnergyDefaults(id);
  }, [fillEnergyDefaults]);

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
    if (energiaOn) {
      inputs.bombaHP = parseFloat(bombaHP) || 0;
      inputs.bombaCount = parseFloat(bombaCount) || 0;
      inputs.bombaHoursDay = parseFloat(bombaHours) || 0;
      inputs.aireadorHP = parseFloat(aireadorHP) || 0;
      inputs.aireadorCount = parseFloat(aireadorCount) || 0;
      inputs.aireadorHoursDay = parseFloat(aireadorHours) || 0;
      inputs.precioKWh = parseFloat(precioKWh) || 0;
      inputs.motorBombaConsumo = parseFloat(motorBombaConsumo) || 0;
      inputs.motorBombaHoursDay = parseFloat(motorBombaHours) || 0;
      inputs.motorAireadorConsumo = parseFloat(motorAireadorConsumo) || 0;
      inputs.motorAireadorHoursDay = parseFloat(motorAireadorHours) || 0;
      inputs.precioCombustible = parseFloat(precioCombustible) || 0;
      inputs.gastoPeriodoElect = parseFloat(gastoPeriodoElect) || 0;
      inputs.diasPeriodoElect = parseFloat(diasPeriodoElect) || 0;
      inputs.gastoPeriodoComb = parseFloat(gastoPeriodoComb) || 0;
      inputs.diasPeriodoComb = parseFloat(diasPeriodoComb) || 0;
      inputs.diasCiclo = parseFloat(diasCiclo) || 0;
    }
    setResults(calcular(inputs));
  }, [volumen, densidad, pesoInicial, pesoCosecha, supervivencia, fcr, precioAlimento, precioVenta, selectedSpecies, energiaOn, bombaHP, bombaCount, bombaHours, aireadorHP, aireadorCount, aireadorHours, precioKWh, motorBombaConsumo, motorBombaHours, motorAireadorConsumo, motorAireadorHours, precioCombustible, gastoPeriodoElect, diasPeriodoElect, gastoPeriodoComb, diasPeriodoComb, diasCiclo]);

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

      {/* Energía */}
      <section className="calc-section">
        <label className="toggle-row">
          <input type="checkbox" checked={energiaOn} onChange={(e) => setEnergiaOn(e.target.checked)} />
          <span>{t("incluirEnergia")}</span>
        </label>
        {energiaOn && (
          <div className="energy-panel">
            <div className="mini-tabs">
              <button
                className={`mini-tab${energyTab === "elect" ? " active" : ""}`}
                onClick={() => setEnergyTab("elect")}
              >⚡ {t("electBombeo")}</button>
              <button
                className={`mini-tab${energyTab === "comb" ? " active" : ""}`}
                onClick={() => setEnergyTab("comb")}
              >⛽ {t("combBombeo")}</button>
              <button
                className={`mini-tab${energyTab === "recibo" ? " active" : ""}`}
                onClick={() => setEnergyTab("recibo")}
              >{t("reciboTab")}</button>
            </div>

            {energyTab === "elect" ? (
              <div className="calc-grid">
                <h3 className="energia-sec-title">⚡ {t("electBombeo")}</h3>
                <label>
                  {t("electBombaHP")}
                  <input type="number" value={bombaHP} onChange={(e) => setBombaHP(e.target.value)} placeholder="0" step="0.1" />
                </label>
                <label>
                  {t("electBombaCount")}
                  <input type="number" value={bombaCount} onChange={(e) => setBombaCount(e.target.value)} placeholder="0" />
                </label>
                <label>
                  {t("electBombaHours")}
                  <input type="number" value={bombaHours} onChange={(e) => setBombaHours(e.target.value)} placeholder="0" />
                </label>
                <h3 className="energia-sec-title">⚡ {t("electAireacion")}</h3>
                <label>
                  {t("electAireadorHP")}
                  <input type="number" value={aireadorHP} onChange={(e) => setAireadorHP(e.target.value)} placeholder="0" step="0.1" />
                </label>
                <label>
                  {t("electAireadorCount")}
                  <input type="number" value={aireadorCount} onChange={(e) => setAireadorCount(e.target.value)} placeholder="0" />
                </label>
                <label>
                  {t("electAireadorHours")}
                  <input type="number" value={aireadorHours} onChange={(e) => setAireadorHours(e.target.value)} placeholder="0" />
                </label>
                <label>
                  {t("precioKWh")}
                  <input type="number" value={precioKWh} onChange={(e) => setPrecioKWh(e.target.value)} placeholder="0.15" step="0.01" />
                </label>
              </div>
            ) : energyTab === "comb" ? (
              <div className="calc-grid">
                <h3 className="energia-sec-title">⛽ {t("combBombeo")}</h3>
                <label>
                  {t("combBombaConsumo")}
                  <input type="number" value={motorBombaConsumo} onChange={(e) => setMotorBombaConsumo(e.target.value)} placeholder="0" step="0.1" />
                </label>
                <label>
                  {t("combBombaHours")}
                  <input type="number" value={motorBombaHours} onChange={(e) => setMotorBombaHours(e.target.value)} placeholder="0" />
                </label>
                <h3 className="energia-sec-title">⛽ {t("combAireacion")}</h3>
                <label>
                  {t("combAireadorConsumo")}
                  <input type="number" value={motorAireadorConsumo} onChange={(e) => setMotorAireadorConsumo(e.target.value)} placeholder="0" step="0.1" />
                </label>
                <label>
                  {t("combAireadorHours")}
                  <input type="number" value={motorAireadorHours} onChange={(e) => setMotorAireadorHours(e.target.value)} placeholder="0" />
                </label>
                <label>
                  {t("precioCombustible")}
                  <input type="number" value={precioCombustible} onChange={(e) => setPrecioCombustible(e.target.value)} placeholder="0.00" step="0.01" />
                </label>
              </div>
            ) : (
              <div className="calc-grid">
                <p className="energia-sub" style={{ gridColumn: "1 / -1" }}>{t("reciboSub")}</p>
                <label>
                  ⚡ {t("reciboElectLabel")}
                  <input type="number" value={gastoPeriodoElect} onChange={(e) => setGastoPeriodoElect(e.target.value)} placeholder="0" />
                </label>
                <label>
                  {t("reciboElectDias")}
                  <input type="number" value={diasPeriodoElect} onChange={(e) => setDiasPeriodoElect(e.target.value)} placeholder="30" />
                </label>
                <label>
                  ⛽ {t("reciboCombLabel")}
                  <input type="number" value={gastoPeriodoComb} onChange={(e) => setGastoPeriodoComb(e.target.value)} placeholder="0" />
                </label>
                <label>
                  {t("reciboCombDias")}
                  <input type="number" value={diasPeriodoComb} onChange={(e) => setDiasPeriodoComb(e.target.value)} placeholder="30" />
                </label>
              </div>
            )}
            {energyTab !== "recibo" && (
              <label style={{ marginTop: 12, display: "block" }}>
                {t("diasCiclo")}
                <input type="number" value={diasCiclo} onChange={(e) => setDiasCiclo(e.target.value)} placeholder="0" />
              </label>
            )}
          </div>
        )}
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
            {results.costoEnergiaTotal !== undefined && (
              <>
                <div className="result-card-divider" style={{ gridColumn: "1 / -1" }} />
                {results.costoBombeoElect !== undefined && (
                  <ResultCard label={t("costoBombeoElect")} value={`${MONEDAS[currency].simbolo}${results.costoBombeoElect.toLocaleString()}`} />
                )}
                {results.costoAireacionElect !== undefined && (
                  <ResultCard label={t("costoAireacionElect")} value={`${MONEDAS[currency].simbolo}${results.costoAireacionElect.toLocaleString()}`} />
                )}
                {results.costoElectTotal !== undefined && (
                  <ResultCard label={t("costoElectTotal")} value={`${MONEDAS[currency].simbolo}${results.costoElectTotal.toLocaleString()}`} />
                )}
                {results.costoBombeoComb !== undefined && (
                  <ResultCard label={t("costoBombeoComb")} value={`${MONEDAS[currency].simbolo}${results.costoBombeoComb.toLocaleString()}`} />
                )}
                {results.costoAireacionComb !== undefined && (
                  <ResultCard label={t("costoAireacionComb")} value={`${MONEDAS[currency].simbolo}${results.costoAireacionComb.toLocaleString()}`} />
                )}
                {results.costoCombTotal !== undefined && (
                  <ResultCard label={t("costoCombTotal")} value={`${MONEDAS[currency].simbolo}${results.costoCombTotal.toLocaleString()}`} />
                )}
                <ResultCard label={t("costoEnergiaTotal")} value={`${MONEDAS[currency].simbolo}${results.costoEnergiaTotal.toLocaleString()}`} highlight />
                <ResultCard label={t("costoEnergiaPorKg")} value={`${MONEDAS[currency].simbolo}${results.costoEnergiaPorKg?.toLocaleString()}`} />
                <ResultCard label={t("costoTotalFinal")} value={`${MONEDAS[currency].simbolo}${results.costoTotalFinal?.toLocaleString()}`} highlight />
              </>
            )}
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