import { useState, useEffect } from "react";
import { useTranslation } from "@/store/language";

const STORAGE_KEY = "aquacalc_tutorial_done";

export function isTutorialDone(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function markTutorialDone() {
  localStorage.setItem(STORAGE_KEY, "true");
}

export function resetTutorial() {
  localStorage.removeItem(STORAGE_KEY);
}

const STEPS_ES = [
  { icon: "👋", title: "Bienvenido a AquaCalc", desc: "Te guiaré por las secciones principales. Podés saltar en cualquier momento.", arrow: "center" },
  { icon: "🧮", title: "Calculadora", desc: "Calculá biomasa, FCR, raciones y rentabilidad. Seleccioná especie, ingresá datos del estanque y obtené resultados al instante.", arrow: "center" },
  { icon: "📋", title: "Biometría", desc: "Registrá mediciones diarias: calidad del agua, alimentación, mortalidades. Los valores fuera de rango se marcan en rojo.", arrow: "center" },
  { icon: "🔬", title: "Zootécnico", desc: "Visualizá gráficos y tablas con el historial de tus registros. Filtrable por estanque y parámetro.", arrow: "center" },
  { icon: "⚙️", title: "Parámetros", desc: "Ajustá los parámetros de cultivo por especie: densidad, FCR, tasas, precios. Los cambios se guardan automáticamente.", arrow: "center" },
  { icon: "🐠", title: "Mis Especies", desc: "Consultá las especies de referencia y creá tus propias especies personalizadas con todos sus parámetros.", arrow: "center" },
  { icon: "📐", title: "Fórmulas", desc: "Referencia rápida de todas las fórmulas usadas en acuicultura, con ejemplos prácticos.", arrow: "center" },
  { icon: "🏠", title: "Mis Fincas", desc: "Gestioná múltiples fincas o unidades productivas. Cada finca puede tener sus propios registros.", arrow: "center" },
  { icon: "🌐", title: "Idioma", desc: "Podés cambiar entre Español, English y Português usando los botones en el encabezado.", arrow: "center" },
  { icon: "✅", title: "¡Listo!", desc: "Todos los datos se guardan automáticamente en tu navegador. Sin conexión a internet necesaria. ¡A producir!", arrow: "center" },
];

const STEPS_EN = [
  { icon: "👋", title: "Welcome to AquaCalc", desc: "I'll guide you through the main sections. You can skip at any time.", arrow: "center" },
  { icon: "🧮", title: "Calculator", desc: "Calculate biomass, FCR, rations, and profitability. Select species, enter pond data, get instant results.", arrow: "center" },
  { icon: "📋", title: "Biometrics", desc: "Log daily measurements: water quality, feeding, mortalities. Out-of-range values are marked in red.", arrow: "center" },
  { icon: "🔬", title: "Zootechnical", desc: "View charts and tables with your record history. Filterable by pond and parameter.", arrow: "center" },
  { icon: "⚙️", title: "Parameters", desc: "Adjust cultivation parameters per species: density, FCR, rates, prices. Changes save automatically.", arrow: "center" },
  { icon: "🐠", title: "My Species", desc: "Browse reference species and create your own custom species with all parameters.", arrow: "center" },
  { icon: "📐", title: "Formulas", desc: "Quick reference for all aquaculture formulas with practical examples.", arrow: "center" },
  { icon: "🏠", title: "My Farms", desc: "Manage multiple farms or production units. Each farm can have its own records.", arrow: "center" },
  { icon: "🌐", title: "Language", desc: "Switch between Español, English, and Português using the buttons in the header.", arrow: "center" },
  { icon: "✅", title: "You're all set!", desc: "All data is saved automatically in your browser. No internet connection required. Let's produce!", arrow: "center" },
];

const STEPS_PT = [
  { icon: "👋", title: "Bem-vindo ao AquaCalc", desc: "Vou guiá-lo pelas principais seções. Você pode pular a qualquer momento.", arrow: "center" },
  { icon: "🧮", title: "Calculadora", desc: "Calcule biomassa, FCR, rações e rentabilidade. Selecione espécie, insira dados do tanque, obtenha resultados instantâneos.", arrow: "center" },
  { icon: "📋", title: "Biometria", desc: "Registre medições diárias: qualidade da água, alimentação, mortalidades. Valores fora da faixa são marcados em vermelho.", arrow: "center" },
  { icon: "🔬", title: "Zootécnico", desc: "Veja gráficos e tabelas com o histórico de seus registros. Filtrável por tanque e parâmetro.", arrow: "center" },
  { icon: "⚙️", title: "Parâmetros", desc: "Ajuste os parâmetros de cultivo por espécie: densidade, FCR, taxas, preços. As alterações são salvas automaticamente.", arrow: "center" },
  { icon: "🐠", title: "Minhas Espécies", desc: "Consulte espécies de referência e crie suas próprias espécies personalizadas com todos os parâmetros.", arrow: "center" },
  { icon: "📐", title: "Fórmulas", desc: "Referência rápida de todas as fórmulas usadas na aquicultura, com exemplos práticos.", arrow: "center" },
  { icon: "🏠", title: "Minhas Fazendas", desc: "Gerencie várias fazendas ou unidades produtivas. Cada fazenda pode ter seus próprios registros.", arrow: "center" },
  { icon: "🌐", title: "Idioma", desc: "Você pode alternar entre Español, English e Português usando os botões no cabeçalho.", arrow: "center" },
  { icon: "✅", title: "Pronto!", desc: "Todos os dados são salvos automaticamente no seu navegador. Sem necessidade de internet. Vamos produzir!", arrow: "center" },
];

const STEPS: Record<string, typeof STEPS_EN> = {
  es: STEPS_ES,
  en: STEPS_EN,
  pt: STEPS_PT,
};

interface Props {
  lang: string;
  onClose?: () => void;
}

export default function Tutorial({ lang, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    if (!isTutorialDone()) {
      setOpen(true);
    }
  }, []);

  const steps = STEPS[lang] || STEPS_EN;
  const current = steps[step];

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      close();
    }
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  const close = () => {
    setOpen(false);
    markTutorialDone();
    onClose?.();
  };

  if (!open) return null;

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-card">
        <button className="tutorial-skip" onClick={close}>✕ {t("skip")}</button>
        <div className="tutorial-icon">{current.icon}</div>
        <h3 className="tutorial-title">{current.title}</h3>
        <p className="tutorial-desc">{current.desc}</p>
        <div className="tutorial-dots">
          {steps.map((_, i) => (
            <span key={i} className={`tutorial-dot${i === step ? " active" : ""}`} />
          ))}
        </div>
        <div className="tutorial-actions">
          {step > 0 && <button className="btn" onClick={prev}>{t("back")}</button>}
          <button className="btn-primary" onClick={next}>
            {step < steps.length - 1 ? t("next") : t("finish")}
          </button>
        </div>
      </div>
    </div>
  );
}
